import threading
from datetime import timedelta

import pytest
from django.db import connection
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.services import AuthService
from apps.partner.models import PartnerRequest
from tests.conftest import body, data, future

pytestmark = pytest.mark.django_db


def group(c, **extra):
    r = c.post("/api/v1/groups/", {"name": "Pune Trekkers", "category": "Trekking", "description": "Weekend treks around Pune.", "visibility": "PUBLIC", **extra}, format="json")
    assert r.status_code == 201, r.content
    return data(r)


def test_group_create_shape_owner_and_validation(alice, client_for):
    c = client_for(alice)
    g = group(c, rules="Be kind")
    for key in ("id", "name", "category", "description", "visibility", "rules", "owner", "owner_name", "members_count", "my_role"):
        assert key in g
    assert g["owner"] == alice.id and g["my_role"] == "OWNER" and g["members_count"] == 1
    assert c.post("/api/v1/groups/", {"name": "ab", "category": "x", "description": "d"}, format="json").status_code == 400
    assert c.post("/api/v1/groups/", {"name": "Valid", "category": "x", "description": "d", "visibility": "SECRET"}, format="json").status_code == 400
    forged = c.post("/api/v1/groups/", {"name": "Forged", "category": "x", "description": "d", "owner": 999}, format="json")
    assert data(forged)["owner"] == alice.id


def test_public_group_join_leave_and_members(alice, bob, client_for):
    gid = group(client_for(alice))["id"]
    cb = client_for(bob)
    r = cb.post(f"/api/v1/groups/{gid}/join/")
    assert r.status_code == 201 and data(r)["status"] == "JOINED"
    assert cb.post(f"/api/v1/groups/{gid}/join/").status_code == 400
    assert data(cb.get(f"/api/v1/groups/{gid}/"))["members_count"] == 2
    roles = {m["user_id"]: m["role"] for m in data(cb.get(f"/api/v1/groups/{gid}/members/"))}
    assert roles == {alice.id: "OWNER", bob.id: "MEMBER"}
    assert cb.delete(f"/api/v1/groups/{gid}/join/").status_code == 204
    assert client_for(alice).delete(f"/api/v1/groups/{gid}/join/").status_code == 400  # owner can't leave


def test_private_group_request_review_flow(alice, bob, carol, client_for):
    gid = group(client_for(alice), visibility="PRIVATE", name="Secret Club")["id"]
    # discoverable, but content is gated
    seen = data(client_for(bob).get(f"/api/v1/groups/{gid}/"))
    assert seen["my_role"] is None and seen["visibility"] == "PRIVATE"
    assert client_for(bob).get(f"/api/v1/groups/{gid}/feed/").status_code == 403
    assert client_for(bob).get(f"/api/v1/groups/{gid}/members/").status_code == 403
    r = client_for(bob).post(f"/api/v1/groups/{gid}/join/", {"message": "please"}, format="json")
    assert r.status_code == 202 and data(r)["status"] == "REQUESTED"
    assert client_for(bob).post(f"/api/v1/groups/{gid}/join/").status_code == 400  # one pending request only
    assert data(client_for(bob).get(f"/api/v1/groups/{gid}/"))["my_request_status"] == "PENDING"
    # only moderators can see/review requests
    assert client_for(carol).get(f"/api/v1/groups/{gid}/join-requests/").status_code == 403
    pending = data(client_for(alice).get(f"/api/v1/groups/{gid}/join-requests/"))
    assert [p["user_id"] for p in pending] == [bob.id] and pending[0]["message"] == "please"
    rid = pending[0]["id"]
    assert client_for(carol).post(f"/api/v1/groups/{gid}/join-requests/{rid}/review/", {"decision": "ACCEPTED"}, format="json").status_code == 403
    assert client_for(alice).post(f"/api/v1/groups/{gid}/join-requests/{rid}/review/", {"decision": "ACCEPTED"}, format="json").status_code == 200
    assert data(client_for(bob).get(f"/api/v1/groups/{gid}/"))["my_role"] == "MEMBER"
    assert client_for(bob).get(f"/api/v1/groups/{gid}/members/").status_code == 200
    # the owner was notified of the request, the requester of the decision
    assert any(n["notification_type"] == "GROUP_REQUEST" for n in data(client_for(alice).get("/api/v1/notifications/")))
    assert any(n["notification_type"] == "GROUP_JOIN" for n in data(client_for(bob).get("/api/v1/notifications/")))


def test_roles_moderators_and_member_removal(make_user, alice, bob, carol, client_for):
    gid = group(client_for(alice))["id"]
    for u in (bob, carol):
        client_for(u).post(f"/api/v1/groups/{gid}/join/")
    ca = client_for(alice)
    assert client_for(bob).patch(f"/api/v1/groups/{gid}/members/{carol.id}/role/", {"role": "MODERATOR"}, format="json").status_code == 403
    assert ca.patch(f"/api/v1/groups/{gid}/members/{bob.id}/role/", {"role": "MODERATOR"}, format="json").status_code == 200
    assert ca.patch(f"/api/v1/groups/{gid}/members/{alice.id}/role/", {"role": "MEMBER"}, format="json").status_code == 400  # owner role fixed
    # moderator may remove a plain member but not the owner
    assert client_for(bob).delete(f"/api/v1/groups/{gid}/members/{alice.id}/").status_code == 403
    assert client_for(bob).delete(f"/api/v1/groups/{gid}/members/{carol.id}/").status_code == 204
    assert ca.delete(f"/api/v1/groups/{gid}/members/{bob.id}/role/").status_code == 204  # demote
    # a plain member can't remove anyone
    client_for(carol).post(f"/api/v1/groups/{gid}/join/")
    assert client_for(bob).delete(f"/api/v1/groups/{gid}/members/{carol.id}/").status_code == 403


def test_group_edit_delete_owner_only(alice, bob, client_for):
    gid = group(client_for(alice))["id"]
    client_for(bob).post(f"/api/v1/groups/{gid}/join/")
    assert client_for(bob).patch(f"/api/v1/groups/{gid}/", {"name": "Hijacked"}, format="json").status_code == 403
    assert data(client_for(alice).patch(f"/api/v1/groups/{gid}/", {"rules": "New rules"}, format="json"))["rules"] == "New rules"
    assert client_for(bob).delete(f"/api/v1/groups/{gid}/").status_code == 403
    assert client_for(alice).delete(f"/api/v1/groups/{gid}/").status_code == 204
    assert client_for(alice).get(f"/api/v1/groups/{gid}/").status_code == 404


def test_group_feed_members_post_and_moderate(alice, bob, carol, client_for):
    gid = group(client_for(alice))["id"]
    client_for(bob).post(f"/api/v1/groups/{gid}/join/")
    # non-members can read a PUBLIC group's feed but not post
    assert client_for(carol).get(f"/api/v1/groups/{gid}/feed/").status_code == 200
    assert client_for(carol).post(f"/api/v1/groups/{gid}/feed/", {"caption": "spam"}, format="json").status_code == 403
    r = client_for(bob).post(f"/api/v1/groups/{gid}/feed/", {"caption": "Meet at 6am", "location": "Parking"}, format="json")
    assert r.status_code == 201
    post = data(r)
    assert post["group"] == gid and post["content"] == "Meet at 6am" and post["location"] == "Parking" and post["author_name"]
    # group posts reach members' main feed but not strangers'
    assert post["id"] in [p["id"] for p in data(client_for(alice).get("/api/v1/posts/"))]
    assert post["id"] not in [p["id"] for p in data(client_for(carol).get("/api/v1/posts/"))]
    assert client_for(carol).get(f"/api/v1/posts/{post['id']}/").status_code == 404
    # group owner may delete a member's post
    assert client_for(alice).delete(f"/api/v1/posts/{post['id']}/").status_code == 204
    assert data(client_for(alice).get(f"/api/v1/groups/{gid}/feed/")) == []
    assert any(n["notification_type"] == "GROUP_POST" for n in data(client_for(alice).get("/api/v1/notifications/")))


def test_group_chat_conversation_follows_membership(alice, bob, client_for):
    gid = group(client_for(alice))["id"]
    assert client_for(bob).get(f"/api/v1/groups/{gid}/chat/").status_code == 403
    client_for(bob).post(f"/api/v1/groups/{gid}/join/")
    cid = data(client_for(bob).get(f"/api/v1/groups/{gid}/chat/"))["conversation_id"]
    assert client_for(bob).post(f"/api/v1/chats/conversations/{cid}/messages/", {"content": "hi all"}, format="json").status_code == 201
    client_for(bob).delete(f"/api/v1/groups/{gid}/join/")
    assert client_for(bob).get(f"/api/v1/chats/conversations/{cid}/messages/").status_code == 404  # left -> no access


def test_group_list_filters_and_blocked_owner(alice, bob, client_for):
    group(client_for(alice), name="Cycling Pune", category="Cycling")
    group(client_for(alice), name="Camping Club", category="Camping")
    c = client_for(bob)
    assert [g["name"] for g in data(c.get("/api/v1/groups/?search=camp"))] == ["Camping Club"]
    assert [g["name"] for g in data(c.get("/api/v1/groups/?category=cycling"))] == ["Cycling Pune"]
    assert data(c.get("/api/v1/groups/?mine=true")) == []
    client_for(alice).post(f"/api/v1/users/{bob.id}/block/")
    assert data(c.get("/api/v1/groups/")) == []


def test_group_list_query_count_flat(alice, bob, client_for, django_assert_max_num_queries):
    for i in range(10):
        group(client_for(alice), name=f"Group number {i}")
    with django_assert_max_num_queries(6):
        r = client_for(bob).get("/api/v1/groups/?limit=10")
    assert len(data(r)) == 10


# ---------------- partner requests ----------------
def partner(c, **extra):
    r = c.post("/api/v1/partner-requests/", {"activity": "HIKE", "destination": "Rajmachi", "preferred_datetime": future(4), "spots_total": 2, "experience_level": "BEGINNER", "description": "Looking for partners.", **extra}, format="json")
    assert r.status_code == 201, r.content
    return data(r)


def test_partner_create_validation_and_shape(alice, client_for):
    c = client_for(alice)
    p = partner(c)
    for key in ("id", "owner_id", "owner_name", "activity", "destination", "preferred_datetime", "spots_total", "spots_filled", "experience_level", "description", "visibility", "status"):
        assert key in p
    assert p["owner_id"] == alice.id and p["status"] == "OPEN" and p["spots_filled"] == 0
    past = (timezone.now() - timedelta(days=1)).isoformat()
    for bad in ({"spots_total": 0}, {"preferred_datetime": past}, {"activity": "SKYDIVE"}, {"destination": " "}):
        payload = {"activity": "HIKE", "destination": "X", "preferred_datetime": future(2), "spots_total": 1, "description": "d", **bad}
        assert c.post("/api/v1/partner-requests/", payload, format="json").status_code == 400, bad
    forged = c.post("/api/v1/partner-requests/", {"activity": "HIKE", "destination": "Yercaud", "preferred_datetime": future(2), "spots_total": 1, "description": "d", "spots_filled": 1, "status": "CLOSED"}, format="json")
    assert data(forged)["spots_filled"] == 0 and data(forged)["status"] == "OPEN"


def test_partner_join_lifecycle(alice, bob, carol, client_for):
    pid = partner(client_for(alice), spots_total=1)["id"]
    cb = client_for(bob)
    j = cb.post(f"/api/v1/partner-requests/{pid}/join/", {"message": "I'm in"}, format="json")
    assert j.status_code == 201 and data(j)["status"] == "PENDING" and data(j)["request"] == pid
    assert cb.post(f"/api/v1/partner-requests/{pid}/join/", {}, format="json").status_code == 400  # duplicate
    assert client_for(alice).post(f"/api/v1/partner-requests/{pid}/join/", {}, format="json").status_code == 400  # own request
    assert data(cb.get(f"/api/v1/partner-requests/{pid}/"))["my_join_status"] == "PENDING"
    # privacy: only the owner sees the join list
    assert client_for(carol).get(f"/api/v1/partner-requests/{pid}/join-requests/").status_code == 403
    jid = data(client_for(alice).get(f"/api/v1/partner-requests/{pid}/join-requests/"))[0]["id"]
    assert client_for(carol).post(f"/api/v1/partner-requests/{pid}/join-requests/{jid}/review/", {"decision": "ACCEPTED"}, format="json").status_code == 404  # not the owner: existence hidden
    r = client_for(alice).post(f"/api/v1/partner-requests/{pid}/join-requests/{jid}/review/", {"decision": "ACCEPTED"}, format="json")
    assert r.status_code == 200 and data(r)["status"] == "ACCEPTED"
    after = data(client_for(alice).get(f"/api/v1/partner-requests/{pid}/"))
    assert after["spots_filled"] == 1 and after["status"] == "CLOSED"  # filled -> auto closed
    assert client_for(carol).post(f"/api/v1/partner-requests/{pid}/join/", {}, format="json").status_code == 400  # closed
    assert client_for(alice).post(f"/api/v1/partner-requests/{pid}/join-requests/{jid}/review/", {"decision": "REJECTED"}, format="json").status_code == 400  # already decided
    # cancelling an accepted spot reopens the request
    assert cb.delete(f"/api/v1/partner-requests/{pid}/join/").status_code == 204
    reopened = data(client_for(alice).get(f"/api/v1/partner-requests/{pid}/"))
    assert reopened["spots_filled"] == 0 and reopened["status"] == "OPEN"
    assert any(n["notification_type"] == "PARTNER_JOIN" for n in data(client_for(alice).get("/api/v1/notifications/")))


def test_partner_reject_close_edit_delete_permissions(alice, bob, client_for):
    pid = partner(client_for(alice))["id"]
    client_for(bob).post(f"/api/v1/partner-requests/{pid}/join/", {}, format="json")
    jid = data(client_for(alice).get(f"/api/v1/partner-requests/{pid}/join-requests/"))[0]["id"]
    rej = client_for(alice).post(f"/api/v1/partner-requests/{pid}/join-requests/{jid}/review/", {"decision": "REJECTED"}, format="json")
    assert data(rej)["status"] == "REJECTED" and data(client_for(alice).get(f"/api/v1/partner-requests/{pid}/"))["spots_filled"] == 0
    assert client_for(bob).patch(f"/api/v1/partner-requests/{pid}/", {"destination": "Hijack"}, format="json").status_code == 404
    assert data(client_for(alice).patch(f"/api/v1/partner-requests/{pid}/", {"destination": "Harishchandragad"}, format="json"))["destination"] == "Harishchandragad"
    assert client_for(bob).post(f"/api/v1/partner-requests/{pid}/close/").status_code == 403
    assert data(client_for(alice).post(f"/api/v1/partner-requests/{pid}/close/"))["status"] == "CLOSED"
    assert client_for(bob).delete(f"/api/v1/partner-requests/{pid}/").status_code == 403
    assert client_for(alice).delete(f"/api/v1/partner-requests/{pid}/").status_code == 204


def test_partner_private_visibility_and_filters(alice, bob, client_for):
    partner(client_for(alice), activity="CYCLING", destination="Mulshi lake", visibility="PRIVATE")
    partner(client_for(alice), activity="HIKE", destination="Sinhagad")
    c = client_for(bob)
    assert [p["destination"] for p in data(c.get("/api/v1/partner-requests/"))] == ["Sinhagad"]
    c.post(f"/api/v1/users/{alice.id}/follow/")
    assert len(data(c.get("/api/v1/partner-requests/"))) == 2
    assert [p["destination"] for p in data(c.get("/api/v1/partner-requests/?activity=CYCLING"))] == ["Mulshi lake"]
    assert [p["destination"] for p in data(c.get("/api/v1/partner-requests/?search=sinha"))] == ["Sinhagad"]


@pytest.mark.django_db(transaction=True)
def test_concurrent_acceptances_never_overfill_spots(make_user):
    owner = make_user("powner")
    req = PartnerRequest.objects.create(owner=owner, activity="HIKE", destination="Race", preferred_datetime=timezone.now() + timedelta(days=2), spots_total=2, description="d")
    from apps.partner.models import PartnerRequestJoin

    joins = [PartnerRequestJoin.objects.create(request=req, user=make_user()) for _ in range(6)]
    token = AuthService.issue_tokens(owner)["access"]
    barrier, results = threading.Barrier(len(joins)), []

    def accept(join_id):
        try:
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION="Bearer " + token)
            barrier.wait(timeout=10)
            results.append(client.post(f"/api/v1/partner-requests/{req.id}/join-requests/{join_id}/review/", {"decision": "ACCEPTED"}, format="json").status_code)
        finally:
            connection.close()

    threads = [threading.Thread(target=accept, args=(j.id,)) for j in joins]
    [t.start() for t in threads]
    [t.join(timeout=60) for t in threads]
    req.refresh_from_db()
    assert sorted(results) == [200, 200, 409, 409, 409, 409]
    assert req.spots_filled == 2 and req.status == "CLOSED"

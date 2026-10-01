import threading
from datetime import timedelta

import pytest
from django.db import connection
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.services import AuthService
from apps.events.models import Event, EventParticipant
from tests.conftest import PASSWORD, body, data, future

pytestmark = pytest.mark.django_db


# ---------------- activities ----------------
def activity(c, **extra):
    r = c.post("/api/v1/activities/", {"title": "Sunday hike", "activity_type": "HIKE", "location": "Pune", "start_at": future(1), **extra}, format="json")
    assert r.status_code == 201, r.content
    return data(r)


def test_activity_crud_and_ownership(alice, bob, client_for):
    ca, cb = client_for(alice), client_for(bob)
    a = activity(ca, distance="8.5", duration="02:30:00", difficulty="EASY")
    assert a["created_by_id"] == alice.id and a["participants_count"] == 1 and a["is_joined"] is True
    aid = a["id"]
    assert cb.patch(f"/api/v1/activities/{aid}/", {"title": "hijack!"}, format="json").status_code == 403
    assert data(ca.patch(f"/api/v1/activities/{aid}/", {"title": "Renamed hike"}, format="json"))["title"] == "Renamed hike"
    assert cb.delete(f"/api/v1/activities/{aid}/").status_code == 403
    assert ca.delete(f"/api/v1/activities/{aid}/").status_code == 204
    assert ca.get(f"/api/v1/activities/{aid}/").status_code == 404


def test_activity_validation(alice, client_for):
    c = client_for(alice)
    assert c.post("/api/v1/activities/", {"title": "ab"}, format="json").status_code == 400
    assert c.post("/api/v1/activities/", {"title": "Valid", "start_at": future(2), "end_at": future(1)}, format="json").status_code == 400
    assert c.post("/api/v1/activities/", {"title": "Valid", "activity_type": "SKYDIVE"}, format="json").status_code == 400
    assert c.post("/api/v1/activities/", {"title": "Valid", "distance": "-4"}, format="json").status_code == 400


def test_activity_privacy(alice, bob, carol, client_for):
    ca = client_for(alice)
    private = activity(ca, privacy="PRIVATE")["id"]
    followers = activity(ca, privacy="FOLLOWERS", title="Followers only")["id"]
    public = activity(ca, title="Public one")["id"]
    ids = lambda u: sorted(a["id"] for a in data(client_for(u).get("/api/v1/activities/")))
    assert ids(bob) == [public]
    client_for(bob).post(f"/api/v1/users/{alice.id}/follow/")
    assert ids(bob) == sorted([public, followers])
    assert client_for(bob).get(f"/api/v1/activities/{private}/").status_code == 404
    assert client_for(bob).post(f"/api/v1/activities/{private}/join/").status_code == 404


def test_activity_join_leave_participants(alice, bob, client_for):
    aid = activity(client_for(alice))["id"]
    cb = client_for(bob)
    r = cb.post(f"/api/v1/activities/{aid}/join/")
    assert r.status_code == 201 and data(r)["user_id"] == bob.id and data(r)["activity_id"] == aid
    assert cb.post(f"/api/v1/activities/{aid}/join/").status_code == 200  # idempotent
    assert data(cb.get(f"/api/v1/activities/{aid}/"))["participants_count"] == 2
    assert sorted(p["user_id"] for p in data(cb.get(f"/api/v1/activities/{aid}/participants/"))) == sorted([alice.id, bob.id])
    assert cb.delete(f"/api/v1/activities/{aid}/join/").status_code == 204
    assert data(cb.get(f"/api/v1/activities/{aid}/"))["participants_count"] == 1
    assert client_for(alice).delete(f"/api/v1/activities/{aid}/join/").status_code == 400  # creator can't leave


def test_completed_activity_history_and_profile_privacy(alice, bob, client_for):
    ca = client_for(alice)
    done = activity(ca, status="COMPLETED", distance="10", title="Done hike")["id"]
    activity(ca, title="Planned hike")
    assert [a["id"] for a in data(ca.get("/api/v1/activities/history/"))] == [done]
    assert [a["id"] for a in data(client_for(bob).get(f"/api/v1/users/{alice.id}/activities/"))] == [done]
    ca.patch("/api/v1/users/me/", {"privacy_settings": {"showActivityHistory": False}}, format="json")
    assert client_for(bob).get(f"/api/v1/users/{alice.id}/activities/").status_code == 403
    assert ca.get(f"/api/v1/users/{alice.id}/activities/").status_code == 200


def test_cannot_join_completed_activity(alice, bob, client_for):
    aid = activity(client_for(alice), status="COMPLETED")["id"]
    assert client_for(bob).post(f"/api/v1/activities/{aid}/join/").status_code == 400


# ---------------- events ----------------
def event(c, **extra):
    payload = {"title": "Rajmachi night trek", "category": "HIKE", "location": "Lonavala", "start_at": future(3), "capacity": 3, **extra}
    r = c.post("/api/v1/events/", payload, format="json")
    assert r.status_code == 201, r.content
    return data(r)


def test_event_create_validation(alice, client_for):
    c = client_for(alice)
    bad = [
        {"capacity": 0}, {"start_at": (timezone.now() - timedelta(days=1)).isoformat()},
        {"end_at": future(1)}, {"category": "NOPE"}, {"title": "x"},
    ]
    for override in bad:
        payload = {"title": "Valid title", "category": "HIKE", "location": "X", "start_at": future(3), "capacity": 5, **override}
        assert c.post("/api/v1/events/", payload, format="json").status_code == 400, override


def test_event_organizer_is_server_assigned_and_approval_forced(alice, bob, client_for):
    r = client_for(alice).post("/api/v1/events/", {"title": "Forge", "category": "HIKE", "location": "X", "start_at": future(2), "capacity": 5, "organizer_id": bob.id, "approval_status": "PENDING"}, format="json")
    d = data(r)
    assert d["organizer_id"] == alice.id and d["approval_status"] == "APPROVED"


def test_moderation_gate_when_enabled(alice, moderator, client_for, settings):
    settings.EVENTS_REQUIRE_MODERATION = True
    e = event(client_for(alice))
    assert e["approval_status"] == "PENDING"
    other = APIClient()
    # pending events are invisible to strangers, joinable only after approval
    stranger = client_for(moderator)  # staff can see it
    assert stranger.get(f"/api/v1/events/{e['id']}/").status_code == 200
    r = client_for(moderator).patch(f"/api/v1/events/{e['id']}/moderate/", {"approval_status": "APPROVED"}, format="json")
    assert r.status_code == 200 and data(r)["approval_status"] == "APPROVED"
    assert client_for(alice).patch(f"/api/v1/events/{e['id']}/moderate/", {"approval_status": "APPROVED"}, format="json").status_code == 403


def test_join_leave_and_participant_visibility(alice, bob, carol, client_for):
    e = event(client_for(alice), capacity=2)
    eid = e["id"]
    r = client_for(bob).post(f"/api/v1/events/{eid}/join/")
    assert r.status_code == 201 and data(r)["status"] == "APPROVED" and data(r)["event_id"] == eid
    assert client_for(bob).post(f"/api/v1/events/{eid}/join/").status_code == 400  # already joined
    d = data(client_for(carol).get(f"/api/v1/events/{eid}/"))
    assert d["approved_count"] == 1 and d["spots_left"] == 1 and d["is_full"] is False
    assert [p["user_id"] for p in data(client_for(carol).get(f"/api/v1/events/{eid}/participants/"))] == [bob.id]
    assert client_for(bob).delete(f"/api/v1/events/{eid}/join/").status_code == 204
    assert client_for(bob).delete(f"/api/v1/events/{eid}/join/").status_code == 400


def test_capacity_is_enforced_sequentially(make_user, client_for, alice):
    eid = event(client_for(alice), capacity=2)["id"]
    users = [make_user() for _ in range(4)]
    codes = [client_for(u).post(f"/api/v1/events/{eid}/join/").status_code for u in users]
    assert codes == [201, 201, 409, 409]
    assert EventParticipant.objects.filter(event_id=eid, status="APPROVED").count() == 2


def test_approval_flow_with_capacity(make_user, client_for, alice):
    eid = event(client_for(alice), capacity=1, requires_approval=True)["id"]
    u1, u2 = make_user(), make_user()
    assert data(client_for(u1).post(f"/api/v1/events/{eid}/join/"))["status"] == "PENDING"
    assert data(client_for(u2).post(f"/api/v1/events/{eid}/join/"))["status"] == "PENDING"
    # only the organizer sees pending requests / decides
    assert [p["user_id"] for p in data(client_for(alice).get(f"/api/v1/events/{eid}/participants/?status=PENDING"))] == [u1.id, u2.id]
    assert client_for(u1).patch(f"/api/v1/events/{eid}/participants/{u2.id}/", {"status": "APPROVED"}, format="json").status_code == 403
    assert client_for(alice).patch(f"/api/v1/events/{eid}/participants/{u1.id}/", {"status": "APPROVED"}, format="json").status_code == 200
    full = client_for(alice).patch(f"/api/v1/events/{eid}/participants/{u2.id}/", {"status": "APPROVED"}, format="json")
    assert full.status_code == 409  # capacity 1 already used
    assert client_for(alice).patch(f"/api/v1/events/{eid}/participants/{u2.id}/", {"status": "REJECTED"}, format="json").status_code == 200
    assert client_for(u2).post(f"/api/v1/events/{eid}/join/").status_code == 403  # rejected stays rejected


def test_invite_only_events_and_invites(make_user, client_for, alice):
    eid = event(client_for(alice), visibility="INVITED")["id"]
    outsider, invited = make_user(), make_user()
    assert client_for(outsider).get(f"/api/v1/events/{eid}/").status_code == 404
    assert client_for(outsider).post(f"/api/v1/events/{eid}/join/").status_code == 404
    assert client_for(outsider).post(f"/api/v1/events/{eid}/invite/", {"user_id": invited.id}, format="json").status_code == 403
    r = client_for(alice).post(f"/api/v1/events/{eid}/invite/", {"user_ids": [invited.id]}, format="json")
    assert r.status_code == 201 and data(r)[0]["status"] == "INVITED"
    assert client_for(invited).get(f"/api/v1/events/{eid}/").status_code == 200
    assert data(client_for(invited).post(f"/api/v1/events/{eid}/join/"))["status"] == "APPROVED"
    kinds = [n["notification_type"] for n in data(client_for(invited).get("/api/v1/notifications/"))]
    assert "EVENT_JOIN" in kinds


def test_followers_only_event(alice, bob, client_for):
    eid = event(client_for(alice), visibility="FOLLOWERS")["id"]
    assert client_for(bob).get(f"/api/v1/events/{eid}/").status_code == 404
    client_for(bob).post(f"/api/v1/users/{alice.id}/follow/")
    assert client_for(bob).post(f"/api/v1/events/{eid}/join/").status_code == 201


def test_organizer_only_edit_and_capacity_floor(make_user, alice, bob, client_for):
    eid = event(client_for(alice), capacity=3)["id"]
    for u in (bob, make_user()):
        client_for(u).post(f"/api/v1/events/{eid}/join/")
    assert client_for(bob).patch(f"/api/v1/events/{eid}/", {"title": "hijacked"}, format="json").status_code == 403
    low = client_for(alice).patch(f"/api/v1/events/{eid}/", {"capacity": 1}, format="json")
    assert low.status_code == 400 and "capacity" in body(low)["errors"]
    assert client_for(alice).patch(f"/api/v1/events/{eid}/", {"capacity": 5}, format="json").status_code == 200


def test_cancel_event_notifies_and_blocks_joins(alice, bob, carol, client_for):
    eid = event(client_for(alice))["id"]
    client_for(bob).post(f"/api/v1/events/{eid}/join/")
    assert client_for(bob).delete(f"/api/v1/events/{eid}/").status_code == 403
    assert client_for(alice).delete(f"/api/v1/events/{eid}/").status_code == 204
    assert client_for(carol).post(f"/api/v1/events/{eid}/join/").status_code in (400, 404)
    assert any("cancelled" in n["title"] for n in data(client_for(bob).get("/api/v1/notifications/")))


def test_event_filters_and_blocked_organizer(alice, bob, client_for):
    event(client_for(alice), title="Cycling jam", category="CYCLING")
    event(client_for(alice), title="Camp night", category="CAMPING")
    c = client_for(bob)
    assert [e["title"] for e in data(c.get("/api/v1/events/?category=CAMPING"))] == ["Camp night"]
    assert [e["title"] for e in data(c.get("/api/v1/events/?search=jam"))] == ["Cycling jam"]
    client_for(alice).post(f"/api/v1/users/{bob.id}/block/")
    assert data(c.get("/api/v1/events/")) == []


def test_event_list_query_count_flat(alice, bob, client_for, django_assert_max_num_queries):
    for i in range(10):
        event(client_for(alice), title=f"Event number {i}")
    with django_assert_max_num_queries(6):
        r = client_for(bob).get("/api/v1/events/?limit=10")
    assert len(data(r)) == 10


@pytest.mark.django_db(transaction=True)
def test_concurrent_joins_never_exceed_capacity(make_user):
    """8 people race for the last 3 seats - exactly 3 may win (row lock + count in one transaction)."""
    organizer = make_user("org")
    event_obj = Event.objects.create(
        organizer=organizer, title="Race event", category="HIKE", location="X",
        start_at=timezone.now() + timedelta(days=2), capacity=3,
    )
    users = [make_user() for _ in range(8)]
    tokens = [AuthService.issue_tokens(u)["access"] for u in users]
    results, barrier = [], threading.Barrier(len(users))

    def attempt(token):
        try:
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION="Bearer " + token)
            barrier.wait(timeout=10)
            results.append(client.post(f"/api/v1/events/{event_obj.id}/join/").status_code)
        finally:
            connection.close()

    threads = [threading.Thread(target=attempt, args=(t,)) for t in tokens]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=60)
    assert sorted(results) == [201, 201, 201, 409, 409, 409, 409, 409]
    assert EventParticipant.objects.filter(event=event_obj, status="APPROVED").count() == 3

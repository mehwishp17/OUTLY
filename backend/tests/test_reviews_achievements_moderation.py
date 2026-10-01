from datetime import timedelta

import pytest
from django.utils import timezone

from apps.activities.models import Activity, ActivityParticipant
from apps.events.models import Event, EventParticipant
from apps.places.models import Place
from tests.conftest import body, data, future

pytestmark = pytest.mark.django_db


@pytest.fixture
def place(db):
    return Place.objects.create(name="Sinhagad", location="Pune", latitude=18.3, longitude=73.7)


# ---------------- reviews ----------------
def test_review_lifecycle_and_rating_aggregation(alice, bob, client_for, place):
    ca, cb = client_for(alice), client_for(bob)
    r = ca.post("/api/v1/reviews/", {"target_type": "place", "target_id": place.id, "rating": 5, "text": "Great"}, format="json")
    assert r.status_code == 201 and data(r)["target_type"] == "place" and data(r)["user_id"] == alice.id
    cb.post(f"/api/v1/places/{place.id}/reviews/", {"rating": 3}, format="json")
    place.refresh_from_db()
    assert float(place.rating) == 4.0 and place.reviews_count == 2
    rid = data(r)["id"]
    assert ca.post("/api/v1/reviews/", {"target_type": "place", "target_id": place.id, "rating": 4}, format="json").status_code == 400  # duplicate
    assert cb.patch(f"/api/v1/reviews/{rid}/", {"rating": 1}, format="json").status_code == 403
    ca.patch(f"/api/v1/reviews/{rid}/", {"rating": 1}, format="json")
    place.refresh_from_db()
    assert float(place.rating) == 2.0
    assert cb.delete(f"/api/v1/reviews/{rid}/").status_code == 403
    assert ca.delete(f"/api/v1/reviews/{rid}/").status_code == 204
    place.refresh_from_db()
    assert float(place.rating) == 3.0 and place.reviews_count == 1
    assert len(data(ca.get(f"/api/v1/places/{place.id}/reviews/"))) == 1


def test_review_validation(alice, client_for, place):
    c = client_for(alice)
    for bad in ({"rating": 0}, {"rating": 6}, {"rating": "x"}):
        assert c.post("/api/v1/reviews/", {"target_type": "place", "target_id": place.id, **bad}, format="json").status_code == 400
    assert c.post("/api/v1/reviews/", {"target_type": "place", "target_id": 999, "rating": 3}, format="json").status_code == 404
    assert c.get("/api/v1/reviews/").status_code == 400


def test_event_review_requires_attendance_after_end(alice, bob, carol, client_for):
    ev = Event.objects.create(organizer=alice, title="Past trek", category="HIKE", location="X", start_at=timezone.now() - timedelta(days=2), end_at=timezone.now() - timedelta(days=1), capacity=5)
    EventParticipant.objects.create(event=ev, user=bob, status="APPROVED")
    body_ = {"target_type": "event", "target_id": ev.id, "rating": 4}
    assert client_for(carol).post("/api/v1/reviews/", body_, format="json").status_code == 403
    assert client_for(alice).post("/api/v1/reviews/", body_, format="json").status_code == 403
    assert client_for(bob).post("/api/v1/reviews/", body_, format="json").status_code == 201
    future_ev = Event.objects.create(organizer=alice, title="Future", category="HIKE", location="X", start_at=timezone.now() + timedelta(days=2), capacity=5)
    EventParticipant.objects.create(event=future_ev, user=bob, status="APPROVED")
    assert client_for(bob).post("/api/v1/reviews/", {**body_, "target_id": future_ev.id}, format="json").status_code == 400


# ---------------- achievements ----------------
def complete(user, **kw):
    a = Activity.objects.create(created_by=user, title="Done", status="COMPLETED", completed_at=timezone.now(), **kw)
    ActivityParticipant.objects.create(activity=a, user=user)
    return a


def test_badges_listed_with_progress_and_awarded(alice, client_for, django_capture_on_commit_callbacks):
    c = client_for(alice)
    rows = data(c.get("/api/v1/badges/"))
    first = next(r for r in rows if r["code"] == "first-trek")
    assert first["earned"] is False and first["current"] == 0 and first["threshold"] == 1
    r = None
    with django_capture_on_commit_callbacks(execute=True):
        r = c.post("/api/v1/activities/", {"title": "Hike one", "activity_type": "HIKE", "status": "COMPLETED", "distance": "12"}, format="json")
    assert r.status_code == 201
    ach = data(c.get("/api/v1/achievements/"))
    codes = [b["code"] for b in ach["earned"]]
    assert "first-trek" in codes and ach["points"] >= 10 and ach["metrics"]["DISTANCE_KM"] == 12
    assert any(n["notification_type"] == "BADGE" for n in data(c.get("/api/v1/notifications/")))
    # idempotent: evaluating again awards nothing twice
    from apps.achievements.models import UserBadge
    from apps.achievements.services import AchievementService

    before = UserBadge.objects.filter(user=alice).count()
    AchievementService.evaluate(alice)
    assert UserBadge.objects.filter(user=alice).count() == before


def test_streak_and_metrics(alice):
    from datetime import date

    from apps.achievements.services import longest_streak

    assert longest_streak([date(2026, 1, 1), date(2026, 1, 2), date(2026, 1, 3), date(2026, 1, 9)]) == 3
    assert longest_streak([]) == 0


def test_leaderboard_ranks_and_hides_blocked(alice, bob, carol, client_for):
    complete(alice, distance=5)
    complete(bob, distance=20)
    complete(bob, distance=1)
    r = client_for(carol).get("/api/v1/leaderboard/?metric=distance")
    rows = data(r)
    assert [x["user_id"] for x in rows] == [bob.id, alice.id] and rows[0]["rank"] == 1 and rows[0]["score"] == 21.0
    from django.core.cache import cache

    cache.clear()
    client_for(carol).post(f"/api/v1/users/{bob.id}/block/")
    assert [x["user_id"] for x in data(client_for(carol).get("/api/v1/leaderboard/?metric=distance"))] == [alice.id]
    assert body(client_for(alice).get("/api/v1/leaderboard/?metric=activities"))["meta"]["me"]["user_id"] == alice.id


def test_private_profiles_excluded_from_leaderboard(alice, bob, client_for):
    complete(alice, distance=5)
    client_for(alice).patch("/api/v1/users/me/", {"privacy_settings": {"profileVisibility": "private"}}, format="json")
    from django.core.cache import cache

    cache.clear()
    assert data(client_for(bob).get("/api/v1/leaderboard/?metric=distance")) == []


# ---------------- reports & moderation ----------------
def test_report_creation_rules(alice, bob, client_for, make_post):
    pid = make_post(bob)["id"]
    c = client_for(alice)
    r = c.post("/api/v1/reports/", {"target_type": "POST", "target_id": pid, "reason": "SPAM"}, format="json")
    assert r.status_code == 201 and data(r)["status"] == "OPEN"
    assert c.post("/api/v1/reports/", {"target_type": "POST", "target_id": pid, "reason": "SPAM"}, format="json").status_code == 400  # duplicate
    assert client_for(bob).post("/api/v1/reports/", {"target_type": "POST", "target_id": pid, "reason": "SPAM"}, format="json").status_code == 400  # own content
    assert c.post("/api/v1/reports/", {"target_type": "POST", "target_id": 99999, "reason": "SPAM"}, format="json").status_code == 404
    assert c.post("/api/v1/reports/", {"target_type": "POST", "target_id": pid, "reason": "BORING"}, format="json").status_code == 400
    assert [x["id"] for x in data(c.get("/api/v1/reports/mine/"))] == [data(r)["id"]]


def test_report_queue_is_staff_only(alice, bob, moderator, admin, client_for, make_post):
    pid = make_post(bob)["id"]
    client_for(alice).post("/api/v1/reports/", {"target_type": "POST", "target_id": pid, "reason": "SPAM"}, format="json")
    assert client_for(alice).get("/api/v1/admin/reports/").status_code == 403
    assert client_for(moderator).get("/api/v1/admin/reports/").status_code == 200
    from rest_framework.test import APIClient

    assert APIClient().get("/api/v1/admin/reports/").status_code == 401


def test_moderator_hides_post_and_everything_is_audited(alice, bob, carol, moderator, admin, client_for, make_post):
    pid = make_post(bob, "bad content")["id"]
    for u in (alice, carol):
        client_for(u).post("/api/v1/reports/", {"target_type": "POST", "target_id": pid, "reason": "HARASSMENT"}, format="json")
    cm = client_for(moderator)
    queue = data(cm.get("/api/v1/admin/reports/?status=OPEN&priority=HIGH"))
    assert len(queue) == 2
    detail = data(cm.get(f"/api/v1/admin/reports/{queue[0]['id']}/"))
    assert detail["target"]["text"] == "bad content" and detail["other_reports_on_target"] == 1
    r = cm.post(f"/api/v1/admin/reports/{queue[0]['id']}/action/", {"action": "HIDE", "notes": "violates rules"}, format="json")
    assert r.status_code == 200 and data(r)["status"] == "RESOLVED"
    # both reports on the same target resolved, post gone from feeds, author told
    assert {x["status"] for x in data(cm.get("/api/v1/admin/reports/"))} == {"RESOLVED"}
    assert client_for(carol).get(f"/api/v1/posts/{pid}/").status_code == 404
    assert any(n["notification_type"] == "MODERATION" for n in data(client_for(bob).get("/api/v1/notifications/")))
    assert cm.post(f"/api/v1/admin/reports/{queue[0]['id']}/action/", {"action": "HIDE"}, format="json").status_code == 400  # already handled
    logs = data(client_for(admin).get("/api/v1/admin/audit-logs/?action=moderation"))
    assert logs[0]["action"] == "moderation.hide" and logs[0]["actor_label"] == moderator.email
    assert client_for(moderator).get("/api/v1/admin/audit-logs/").status_code == 403


def test_no_action_dismisses_and_user_suspension(alice, bob, moderator, client_for):
    cm = client_for(moderator)
    client_for(alice).post("/api/v1/reports/", {"target_type": "USER", "target_id": bob.id, "reason": "OTHER"}, format="json")
    rid = data(cm.get("/api/v1/admin/reports/"))[0]["id"]
    assert cm.post(f"/api/v1/admin/reports/{rid}/action/", {"action": "HIDE"}, format="json").status_code == 400  # not valid for accounts
    assert data(cm.post(f"/api/v1/admin/reports/{rid}/action/", {"action": "NO_ACTION"}, format="json"))["status"] == "DISMISSED"
    client_for(alice).post("/api/v1/reports/", {"target_type": "USER", "target_id": bob.id, "reason": "VIOLENCE"}, format="json")
    rid = data(cm.get("/api/v1/admin/reports/?status=OPEN"))[0]["id"]
    bob_client = client_for(bob)
    assert cm.post(f"/api/v1/admin/reports/{rid}/action/", {"action": "SUSPEND"}, format="json").status_code == 200
    bob.refresh_from_db()
    assert bob.status == "SUSPENDED"
    assert bob_client.get("/api/v1/users/me/").status_code == 401  # locked out immediately


def test_moderator_cannot_act_on_staff_or_self(alice, moderator, admin, client_for):
    client_for(alice).post("/api/v1/reports/", {"target_type": "USER", "target_id": admin.id, "reason": "OTHER"}, format="json")
    rid = data(client_for(moderator).get("/api/v1/admin/reports/"))[0]["id"]
    assert client_for(moderator).post(f"/api/v1/admin/reports/{rid}/action/", {"action": "SUSPEND"}, format="json").status_code == 403


def test_comment_report_hide_decrements_count(alice, bob, carol, moderator, client_for, make_post):
    pid = make_post(alice)["id"]
    cid = data(client_for(bob).post(f"/api/v1/posts/{pid}/comments/", {"content": "rude"}, format="json"))["id"]
    client_for(carol).post("/api/v1/reports/", {"target_type": "COMMENT", "target_id": cid, "reason": "HARASSMENT"}, format="json")
    rid = data(client_for(moderator).get("/api/v1/admin/reports/"))[0]["id"]
    client_for(moderator).post(f"/api/v1/admin/reports/{rid}/action/", {"action": "HIDE"}, format="json")
    assert data(client_for(alice).get(f"/api/v1/posts/{pid}/"))["comments_count"] == 0
    assert data(client_for(alice).get(f"/api/v1/posts/{pid}/comments/")) == []


# ---------------- admin ----------------
def test_admin_user_management_rules(alice, bob, admin, client_for):
    ca = client_for(admin)
    assert client_for(alice).get("/api/v1/admin/users/").status_code == 403
    users = data(ca.get("/api/v1/admin/users/?search=bob"))
    assert [u["user_id"] for u in users] == [bob.id]
    assert data(ca.patch(f"/api/v1/admin/users/{bob.id}/", {"role": "CONTENT_MODERATOR"}, format="json"))["role"] == "CONTENT_MODERATOR"
    assert ca.patch(f"/api/v1/admin/users/{admin.id}/", {"role": "USER"}, format="json").status_code == 403  # not yourself
    assert ca.patch(f"/api/v1/admin/users/{bob.id}/", {"role": "SUPERUSER"}, format="json").status_code == 400
    assert ca.patch(f"/api/v1/admin/users/{bob.id}/", {"email": "evil@x.com"}, format="json").status_code == 200
    bob.refresh_from_db()
    assert bob.email == "bob@example.com"  # email is read-only
    assert any(l["action"] == "admin.user.update" for l in data(ca.get("/api/v1/admin/audit-logs/")))


def test_admin_posts_and_place_verification(alice, admin, moderator, client_for, make_post, place):
    pid = make_post(alice)["id"]
    assert data(client_for(moderator).patch(f"/api/v1/admin/posts/{pid}/", {"status": "HIDDEN"}, format="json"))["status"] == "HIDDEN"
    assert client_for(alice).patch(f"/api/v1/admin/posts/{pid}/", {"status": "ACTIVE"}, format="json").status_code == 403
    assert client_for(moderator).patch(f"/api/v1/admin/places/{place.id}/", {"is_verified": True}, format="json").status_code == 403
    assert client_for(admin).patch(f"/api/v1/admin/places/{place.id}/", {"is_verified": True}, format="json").status_code == 200
    place.refresh_from_db()
    assert place.is_verified is True
    assert client_for(admin).patch(f"/api/v1/admin/places/{place.id}/", {"is_verified": "yes"}, format="json").status_code == 400


def test_organizer_application_flow(alice, bob, admin, client_for):
    ca = client_for(alice)
    r = ca.post("/api/v1/organizers/apply/", {"organization_name": "Trek Co", "bio": "We trek", "website": "https://trek.example.com"}, format="json")
    assert r.status_code == 201 and data(r)["status"] == "PENDING"
    assert ca.post("/api/v1/organizers/apply/", {"organization_name": "Again"}, format="json").status_code == 400
    assert client_for(alice).get("/api/v1/organizers/me/analytics/").status_code == 403  # not approved yet
    assert client_for(bob).get(f"/api/v1/organizers/{alice.id}/").status_code == 404
    oid = data(r)["id"]
    assert client_for(bob).post(f"/api/v1/admin/organizers/{oid}/review/", {"decision": "APPROVED"}, format="json").status_code == 403
    assert client_for(admin).post(f"/api/v1/admin/organizers/{oid}/review/", {"decision": "APPROVED"}, format="json").status_code == 200
    alice.refresh_from_db()
    assert alice.role == "ORGANIZER"
    pub = data(client_for(bob).get(f"/api/v1/organizers/{alice.id}/"))
    assert pub["organization_name"] == "Trek Co" and "contact_email" not in pub
    # organizer analytics + announcements
    ev = data(ca.post("/api/v1/events/", {"title": "Organized trek", "category": "HIKE", "location": "X", "start_at": future(3), "capacity": 5}, format="json"))
    client_for(bob).post(f"/api/v1/events/{ev['id']}/join/")
    stats = data(ca.get("/api/v1/organizers/me/analytics/"))
    assert stats["events_total"] == 1 and stats["participants_total"] == 1
    assert client_for(bob).post(f"/api/v1/events/{ev['id']}/announce/", {"message": "hi"}, format="json").status_code == 404
    assert data(ca.post(f"/api/v1/events/{ev['id']}/announce/", {"message": "Bring water"}, format="json"))["notified"] == 1
    assert any(n["notification_type"] == "EVENT_REMINDER" for n in data(client_for(bob).get("/api/v1/notifications/")))


def test_analytics_admin_only_and_shape(alice, admin, client_for, make_post):
    make_post(alice)
    assert client_for(alice).get("/api/v1/admin/analytics/overview/").status_code == 403
    d = data(client_for(admin).get("/api/v1/admin/analytics/overview/"))
    assert d["users"]["total"] >= 2 and d["posts"]["total"] == 1
    for key in ("engagement_7d", "activities", "events", "groups", "partner_requests", "moderation"):
        assert key in d


def test_analytics_is_cached(admin, client_for, django_assert_num_queries):
    c = client_for(admin)
    c.get("/api/v1/admin/analytics/overview/")
    with django_assert_num_queries(1):  # only the auth user lookup
        c.get("/api/v1/admin/analytics/overview/")

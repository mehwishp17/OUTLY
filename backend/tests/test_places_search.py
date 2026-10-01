import pytest

from apps.places.models import Place, Trail
from tests.conftest import data, body

pytestmark = pytest.mark.django_db


@pytest.fixture
def seeded(db):
    # Pune-ish cluster + one far away
    Place.objects.create(name="Sinhagad Fort", location="Pune", latitude=18.366, longitude=73.756, category="trail", difficulty="MODERATE", distance_km=5, rating=4.5, is_verified=True)
    Place.objects.create(name="Lonavala Viewpoint", location="Lonavala", latitude=18.75, longitude=73.41, category="viewpoint", difficulty="EASY", distance_km=1, rating=4.0)
    Place.objects.create(name="Himalayan Camp", location="Manali", latitude=32.24, longitude=77.19, category="campsite", difficulty="HARD", distance_km=12, rating=3.0)
    Place.objects.create(name="Hidden", location="Nowhere", latitude=0, longitude=0, is_active=False)
    trail = Trail.objects.create(name="Rajmachi Trek", location="Lonavala", difficulty="MODERATE", distance_km=15, start_latitude=18.8, start_longitude=73.4)
    return trail


def names(r):
    return [p["name"] for p in data(r)]


def test_place_list_detail_shape(alice, client_for, seeded):
    c = client_for(alice)
    r = c.get("/api/v1/places/")
    assert r.status_code == 200 and "Hidden" not in names(r)
    assert body(r)["meta"]["count"] == 3
    p = data(r)[0]
    for key in ("id", "name", "coordinates", "category", "difficulty", "distance", "rating", "is_verified", "images", "facilities"):
        assert key in p
    assert set(p["coordinates"]) == {"latitude", "longitude"}
    detail = c.get(f"/api/v1/places/{p['id']}/")
    assert detail.status_code == 200 and data(detail)["id"] == p["id"]
    assert c.get("/api/v1/places/99999/").status_code == 404


def test_place_filters(alice, client_for, seeded):
    c = client_for(alice)
    assert names(c.get("/api/v1/places/?search=fort")) == ["Sinhagad Fort"]
    assert names(c.get("/api/v1/places/?search=lonavala")) == ["Lonavala Viewpoint"]  # matches location
    assert names(c.get("/api/v1/places/?category=campsite")) == ["Himalayan Camp"]
    assert names(c.get("/api/v1/places/?difficulty=EASY,HARD")) == ["Himalayan Camp", "Lonavala Viewpoint"]
    assert names(c.get("/api/v1/places/?min_rating=4")) == ["Lonavala Viewpoint", "Sinhagad Fort"]
    assert names(c.get("/api/v1/places/?max_distance=5")) == ["Lonavala Viewpoint", "Sinhagad Fort"]
    assert names(c.get("/api/v1/places/?verified=true")) == ["Sinhagad Fort"]
    assert names(c.get("/api/v1/places/?ordering=-rating"))[0] == "Sinhagad Fort"
    assert c.get("/api/v1/places/?min_rating=abc").status_code == 400


def test_nearby_search_uses_real_distance(alice, client_for, seeded):
    c = client_for(alice)
    r = c.get("/api/v1/places/?near=18.52,73.85&radius_km=100&ordering=nearest")  # Pune centre
    assert names(r) == ["Sinhagad Fort", "Lonavala Viewpoint"]  # Manali excluded, nearest first
    first = data(r)[0]
    assert 15 < first["distance_from_km"] < 30
    assert c.get("/api/v1/places/?near=bad").status_code == 400
    assert c.get("/api/v1/places/?near=95,10").status_code == 400


def test_trails_and_points(alice, client_for, seeded):
    c = client_for(alice)
    tid = seeded.id
    listing = data(c.get("/api/v1/trails/"))
    assert listing[0]["name"] == "Rajmachi Trek" and "points" not in listing[0]  # list stays light
    pts = [{"latitude": 18.8 + i / 1000, "longitude": 73.4, "sequence": i} for i in range(4)]
    assert c.post(f"/api/v1/trails/{tid}/points/", {"points": pts}, format="json").status_code == 403  # not the creator
    seeded.created_by = alice
    seeded.save()
    r = c.post(f"/api/v1/trails/{tid}/points/", {"points": pts}, format="json")
    assert r.status_code == 201 and len(data(r)) == 4
    detail = data(c.get(f"/api/v1/trails/{tid}/"))
    assert len(detail["points"]) == 4 and detail["points_count"] == 4
    assert [p["sequence"] for p in data(c.get(f"/api/v1/trails/{tid}/points/"))] == [0, 1, 2, 3]
    dup = c.post(f"/api/v1/trails/{tid}/points/", {"points": [{"latitude": 1, "longitude": 1, "sequence": 7}, {"latitude": 2, "longitude": 2, "sequence": 7}]}, format="json")
    assert dup.status_code == 400


def test_user_created_place_is_unverified_and_ownership_protected(alice, bob, client_for):
    ca = client_for(alice)
    r = ca.post("/api/v1/places/", {"name": "My Spot", "latitude": 10, "longitude": 20, "category": "viewpoint", "is_verified": True, "images": ["https://example.com/a.jpg"]}, format="json")
    assert r.status_code == 201 and data(r)["is_verified"] is False
    pid = data(r)["id"]
    assert client_for(bob).patch(f"/api/v1/places/{pid}/", {"name": "hijack"}, format="json").status_code == 403
    assert ca.patch(f"/api/v1/places/{pid}/", {"name": "Better"}, format="json").status_code == 200
    assert ca.post("/api/v1/places/", {"name": "Bad", "latitude": 200, "longitude": 0}, format="json").status_code == 400
    assert ca.post("/api/v1/places/", {"name": "Bad", "latitude": 1, "longitude": 1, "category": "nonsense"}, format="json").status_code == 400
    assert ca.post("/api/v1/places/", {"name": "Bad", "latitude": 1, "longitude": 1, "images": ["javascript:alert(1)"]}, format="json").status_code == 400
    assert ca.delete(f"/api/v1/places/{pid}/").status_code == 204
    assert ca.get(f"/api/v1/places/{pid}/").status_code == 404


def test_save_place_and_saved_list(alice, client_for, seeded):
    c = client_for(alice)
    pid = data(c.get("/api/v1/places/?search=fort"))[0]["id"]
    assert c.post(f"/api/v1/places/{pid}/save/").status_code == 201
    assert c.post(f"/api/v1/places/{pid}/save/").status_code == 201
    saved = data(c.get("/api/v1/users/me/saved-places/"))
    assert [p["id"] for p in saved] == [pid] and saved[0]["is_saved"] is True
    assert c.delete(f"/api/v1/places/{pid}/save/").status_code == 204
    assert data(c.get("/api/v1/users/me/saved-places/")) == []


def test_map_markers_bbox(alice, client_for, seeded):
    r = client_for(alice).get("/api/v1/map/?bbox=18,73,19,74")
    assert sorted(m["name"] for m in data(r)) == ["Lonavala Viewpoint", "Sinhagad Fort"]
    assert client_for(alice).get("/api/v1/map/?bbox=nope").status_code == 400


def test_unified_search_respects_visibility(alice, bob, client_for, seeded, make_post):
    make_post(bob, "Sunrise at the fort", visibility="FOLLOWERS")
    make_post(bob, "fort selfie public")
    c = client_for(alice)
    r = data(c.get("/api/v1/search/?q=fort"))
    assert [p["title"] for p in r["places"]] == ["Sinhagad Fort"]
    assert [p["title"] for p in r["posts"]] == ["fort selfie public"]  # follower-only post not leaked
    only = data(c.get("/api/v1/search/?q=bob&type=users"))
    assert list(only) == ["users"] and only["users"][0]["subtitle"] == f"@{bob.profile.username}"
    assert c.get("/api/v1/search/?q=a").status_code == 400
    c.post(f"/api/v1/users/{bob.id}/block/")
    assert data(c.get("/api/v1/search/?q=bob&type=users"))["users"] == []


def test_place_search_uses_index_friendly_query_count(alice, client_for, seeded, django_assert_max_num_queries):
    with django_assert_max_num_queries(6):
        client_for(alice).get("/api/v1/places/?search=fort&near=18.5,73.8&radius_km=200")

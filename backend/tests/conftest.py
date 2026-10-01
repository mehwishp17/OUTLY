import itertools
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.services import AuthService

PASSWORD = "Str0ng!Pass"
_counter = itertools.count(1)


@pytest.fixture
def make_user(db):
    def _make(name=None, role="USER", status="ACTIVE", **profile):
        n = next(_counter)
        name = name or f"user{n}"
        user = AuthService.register(full_name=name.title(), email=f"{name}@example.com", password=PASSWORD)
        changed = []
        if role != "USER":
            user.role = role
            changed.append("role")
        if status != "ACTIVE":
            user.status = status
            changed.append("status")
        if changed:
            user.save(update_fields=changed)
        if profile:
            for key, value in profile.items():
                setattr(user.profile, key, value)
            user.profile.save()
        return user

    return _make


@pytest.fixture
def client_for():
    """APIClient authenticated with a real access JWT (the production auth path)."""

    def _client(user=None):
        client = APIClient()
        if user is not None:
            client.credentials(HTTP_AUTHORIZATION="Bearer " + AuthService.issue_tokens(user)["access"])
        return client

    return _client


@pytest.fixture
def alice(make_user):
    return make_user("alice")


@pytest.fixture
def bob(make_user):
    return make_user("bob")


@pytest.fixture
def carol(make_user):
    return make_user("carol")


@pytest.fixture
def admin(make_user):
    return make_user("admin", role="ADMINISTRATOR")


@pytest.fixture
def moderator(make_user):
    return make_user("mod", role="CONTENT_MODERATOR")


def body(response):
    return response.json()


def data(response):
    return response.json()["data"]


def future(days=3, hours=0):
    return (timezone.now() + timedelta(days=days, hours=hours)).isoformat()


@pytest.fixture
def make_post(client_for):
    def _post(user, caption="Hello trail", **extra):
        r = client_for(user).post("/api/v1/posts/", {"caption": caption, **extra}, format="json")
        assert r.status_code == 201, r.content
        return data(r)

    return _post

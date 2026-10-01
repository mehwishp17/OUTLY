"""Runs with the REAL production hashers (the suite default is a fast MD5 hasher)."""
import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import PBKDF2PasswordHasher, identify_hasher
from django.test import override_settings
from rest_framework.test import APIClient

from apps.accounts import services
from apps.accounts.services import AuthService
from config import hashers as hashers_module
from tests.conftest import PASSWORD, data

pytestmark = pytest.mark.django_db
User = get_user_model()

PRODUCTION_HASHERS = [
    "config.hashers.OutlyArgon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
]
prod = override_settings(PASSWORD_HASHERS=PRODUCTION_HASHERS)


def algo(user):
    user.refresh_from_db()
    return identify_hasher(user.password).algorithm


@prod
def test_new_accounts_are_hashed_with_argon2id():
    user = AuthService.register(full_name="New Person", email="new@example.com", password=PASSWORD)
    assert user.password.startswith("argon2$argon2id$")
    assert user.check_password(PASSWORD) and not user.check_password("wrong")


def test_parameters_meet_the_owasp_floor():
    h = hashers_module.OutlyArgon2PasswordHasher
    # OWASP-listed equivalent Argon2id options: (19 MiB, t=2, p=1) or (46 MiB, t=1, p=1)
    assert (h.memory_cost >= 19456 and h.time_cost >= 2) or (h.memory_cost >= 47104 and h.time_cost >= 1)
    assert h.parallelism >= 1


@prod
def test_legacy_pbkdf2_user_logs_in_and_is_upgraded_transparently():
    user = User.objects.create_user(email="legacy@example.com", password=None)
    legacy = PBKDF2PasswordHasher()
    legacy.iterations = 1_200_000 // 100  # fast legacy hash for the test; algorithm is what matters
    user.password = legacy.encode(PASSWORD, "legacysalt0123456")
    user.save()
    from apps.profiles.services import ProfileService

    ProfileService.create_for_user(user, full_name="Legacy User")
    assert algo(user) == "pbkdf2_sha256"

    c = APIClient()
    wrong = c.post("/api/v1/auth/login/", {"email": user.email, "password": "nope"}, format="json")
    assert wrong.status_code == 400 and algo(user) == "pbkdf2_sha256"  # a failed login never rewrites the hash
    ok = c.post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json")
    assert ok.status_code == 200 and data(ok)["access"]
    assert algo(user) == "argon2"  # upgraded in place
    again = c.post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json")
    assert again.status_code == 200  # and the new hash verifies


@prod
def test_unknown_email_pays_the_same_algorithm_as_a_real_login():
    services._dummy_hash.cache_clear()
    assert services._dummy_hash().startswith("argon2$argon2id$")  # same cost -> no timing oracle


@prod
def test_hash_concurrency_is_bounded():
    # a bounded semaphore protects small instances from a memory spike (46 MiB per hash)
    assert services._HASH_SLOTS._initial_value >= 1
    assert services._HASH_SLOTS._initial_value <= 8


@prod
def test_login_endpoint_end_to_end_with_production_hashers():
    c = APIClient()
    reg = c.post("/api/v1/auth/register/", {"full_name": "Prod Hash", "email": "ph@example.com", "password": PASSWORD,
                                            "confirm_password": PASSWORD, "terms_accepted": True}, format="json")
    assert reg.status_code == 201
    assert c.post("/api/v1/auth/login/", {"email": "ph@example.com", "password": PASSWORD}, format="json").status_code == 200
    assert c.post("/api/v1/auth/login/", {"email": "ph@example.com", "password": "bad"}, format="json").status_code == 400

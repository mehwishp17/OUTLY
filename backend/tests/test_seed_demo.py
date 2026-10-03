"""The demo-community seeder runs through the real API, is idempotent and DEBUG-only."""
import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings

from apps.events.models import Event
from apps.groups.models import Group
from apps.posts.models import Post

pytestmark = pytest.mark.django_db


def test_seed_demo_builds_community_and_is_idempotent():
    with override_settings(DEBUG=True):
        call_command("seed_explore", verbosity=0)
        call_command("seed_demo", verbosity=0)
        assert Group.objects.count() == 4
        assert Group.objects.filter(image__isnull=False).exclude(image="").count() == 4
        assert Event.objects.count() == 4
        assert Post.objects.filter(media__isnull=False).distinct().count() == 6
        before = (Group.objects.count(), Event.objects.count(), Post.objects.count())
        call_command("seed_demo", verbosity=0)  # second run changes nothing
        assert before == (Group.objects.count(), Event.objects.count(), Post.objects.count())


def test_seed_demo_refuses_outside_debug():
    with override_settings(DEBUG=False), pytest.raises(CommandError):
        call_command("seed_demo", verbosity=0)

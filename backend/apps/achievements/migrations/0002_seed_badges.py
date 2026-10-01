from django.db import migrations

BADGES = [
    # code, name, description, icon, metric, threshold, points
    ("first-trek", "First Trek", "Complete your first outdoor activity.", "trail", "ACTIVITIES_COMPLETED", 1, 10),
    ("trail-regular", "Trail Regular", "Complete 10 outdoor activities.", "trail", "ACTIVITIES_COMPLETED", 10, 30),
    ("10-mountains", "10 Mountains", "Complete 10 hikes.", "mountain", "HIKES_COMPLETED", 10, 50),
    ("100-km-cycling", "100 KM Cycling", "Ride 100 km in completed cycling activities.", "bike", "CYCLING_KM", 100, 50),
    ("century-explorer", "Century Explorer", "Cover 100 km across all activities.", "compass", "DISTANCE_KM", 100, 40),
    ("10-camping-trips", "10 Camping Trips", "Complete 10 camping trips.", "tent", "CAMPING_TRIPS", 10, 50),
    ("30-day-streak", "30-Day Outdoor Streak", "Be active outdoors 30 days in a row.", "flame", "STREAK_DAYS", 30, 100),
    ("first-post", "First Story", "Share your first post.", "message-circle", "POSTS", 1, 5),
    ("storyteller", "Storyteller", "Share 10 posts.", "message-circle", "POSTS", 10, 20),
    ("joiner", "Joiner", "Join 5 events.", "calendar", "EVENTS_JOINED", 5, 25),
    ("social-butterfly", "Social Butterfly", "Gain 10 followers.", "heart-filled", "FOLLOWERS", 10, 25),
    ("community-builder", "Community Builder", "Join 3 groups.", "tent", "GROUPS_JOINED", 3, 20),
    ("trail-critic", "Trail Critic", "Write 5 reviews.", "star-filled", "REVIEWS", 5, 20),
]


def seed(apps, schema_editor):
    Badge = apps.get_model("achievements", "Badge")
    for order, (code, name, desc, icon, metric, threshold, points) in enumerate(BADGES):
        Badge.objects.update_or_create(
            code=code,
            defaults=dict(name=name, description=desc, icon=icon, metric=metric, threshold=threshold,
                          points=points, sort_order=order, is_active=True),
        )


class Migration(migrations.Migration):
    dependencies = [("achievements", "0001_initial")]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]

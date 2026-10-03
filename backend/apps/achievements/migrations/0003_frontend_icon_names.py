from django.db import migrations

# Badge icons are identifiers from the web app's icon set; two seeded ones didn't exist there.
RENAMES = {"mountain": "trail", "flame": "calendar"}


def rename(apps, schema_editor):
    Badge = apps.get_model("achievements", "Badge")
    for old, new in RENAMES.items():
        Badge.objects.filter(icon=old).update(icon=new)


class Migration(migrations.Migration):
    dependencies = [("achievements", "0002_seed_badges")]
    operations = [migrations.RunPython(rename, migrations.RunPython.noop)]

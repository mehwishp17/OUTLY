from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):
    """Enables pg_trgm so name/title search uses GIN trigram indexes."""

    initial = True
    dependencies: list = []
    operations = [TrigramExtension()]

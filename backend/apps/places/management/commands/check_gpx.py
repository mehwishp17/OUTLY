"""Checks a GPX file and reports what it contains. Read-only: nothing is saved.

    python manage.py check_gpx path/to/track.gpx

Importing a track into a trail is a separate step that is not available yet. A file that passes
here is well-formed; that does not make it accurate, recorded or verified.
"""
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.places.gpx import MAX_BYTES, GpxError, parse_gpx


class Command(BaseCommand):
    help = "Validate a GPX track file and print a summary (does not save anything)."

    def add_arguments(self, parser):
        parser.add_argument("path", help="Path to a .gpx file")

    def handle(self, *args, **options):
        path = Path(options["path"])
        if not path.is_file():
            raise CommandError("That file does not exist.")
        with path.open("rb") as handle:
            data = handle.read(MAX_BYTES + 1)
        try:
            track = parse_gpx(data)
        except GpxError as error:
            self.stdout.write(self.style.ERROR("Rejected:"))
            for message in error.errors:
                self.stdout.write(f"  - {message}")
            raise CommandError("The file cannot be imported.") from None
        south, west, north, east = track.bounds
        self.stdout.write(self.style.SUCCESS("Valid GPX track (nothing was saved)."))
        self.stdout.write(f"  name:        {track.name or '(none)'}")
        self.stdout.write(f"  points:      {len(track.points)} (duplicates removed: {track.duplicates_removed})")
        self.stdout.write(f"  segments:    {track.segments}")
        self.stdout.write(f"  length:      {track.length_km:.2f} km (sum of straight lines between points)")
        self.stdout.write(f"  bounds:      {south:.5f},{west:.5f} to {north:.5f},{east:.5f}")
        self.stdout.write(f"  elevation:   {'on every point' if track.has_elevation else 'incomplete or missing'}")
        self.stdout.write(f"  timestamps:  {'on every point' if track.has_timestamps else 'incomplete or missing'}")
        for warning in track.warnings:
            self.stdout.write(self.style.WARNING(f"  warning: {warning}"))

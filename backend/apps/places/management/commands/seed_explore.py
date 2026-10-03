"""Loads the curated Explore content (places, trails, route geometry).

    python manage.py seed_explore

Idempotent: re-running updates the same rows (matched by name). The photos are
the frontend's own `/images/...` assets, stored as relative paths in `images`,
so the approved Explore visuals are served from the database like any other
place. No ratings or review counts are invented: they start at zero and are
computed from real reviews.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand

from apps.places.models import Place, Trail, TrailPoint

H = timedelta(hours=1)

# (kind, name, description, category, difficulty, km, duration, location, lat, lng,
#  facilities, safety, photo, verified, route[(x%, y%)] for trails)
CURATED = [
    ("trail", "Kedarkantha Ridge Trail",
     "A crisp early-morning climb through pine forest ending at a ridgeline with 360° views over the valley. Best attempted in winter for the snow-capped summit views.",
     "trail", "HARD", 20, 48 * H, "Kedarkantha, Uttarakhand", 31.0267, 78.1865,
     ["Campsite", "Drinking water", "Guide available"],
     "Snow conditions in winter — crampons recommended above 3,200m.", "/images/places/kedarkantha-trail.jpg", True,
     [(10, 85), (30, 60), (55, 50), (70, 20), (88, 8)]),
    ("place", "Nandi Point",
     "One of the region's most loved sunrise and sunset viewpoints, with sweeping views over the Nandi Hills range.",
     "viewpoint", "EASY", 2, 1 * H, "Nandi Hills, Karnataka", 13.3702, 77.6835,
     ["Parking", "Restrooms", "Food stalls"], "", "/images/landing/golden-hour-nandi.jpg", True, None),
    ("trail", "Whispering Pines Trail",
     "A shaded, easy-grade trail through pine forest, ideal for first-time hikers. The last stretch can get muddy after rain — good shoes recommended.",
     "trail", "EASY", 6, timedelta(minutes=150), "Munnar, Kerala", 10.0889, 77.0595,
     ["Drinking water", "Rest points"], "Muddy and slippery in the final stretch after rainfall.",
     "/images/landing/whispering-pines.jpg", True, [(15, 20), (35, 35), (50, 55), (68, 78)]),
    ("place", "Pawna Lake Campsite",
     "A popular lakeside campsite for evenings of camping, stories, and stargazing by the water. Best visited outside peak monsoon.",
     "campsite", "EASY", 3, 12 * H, "Pawna Lake, Maharashtra", 18.6786, 73.4797,
     ["Tents for rent", "Bonfire area", "Washrooms", "Parking"], "", "/images/places/pawna-lake-campsite.jpg", True, None),
    ("trail", "Dehradun Foothills Cycling Route",
     "A scenic ride from Dehradun towards the Himalayan foothills, popular with weekend cycling groups. Rolling elevation with a few steady climbs.",
     "cycling-route", "MODERATE", 45, timedelta(minutes=210), "Dehradun, Uttarakhand", 30.3165, 78.0322,
     ["Bike repair stop", "Water refill points"], "", "/images/places/dehradun-cycling.jpg", False,
     [(20, 90), (40, 70), (60, 55), (75, 30), (82, 12)]),
    ("place", "Bandipur Wildlife Trail",
     "Guided forest trail through Bandipur's dry deciduous forest, known for spotting deer, elephants, and occasionally big cats.",
     "wildlife", "MODERATE", 8, 3 * H, "Bandipur, Karnataka", 11.6670, 76.6370,
     ["Guide required", "Safari permits", "Parking"],
     "Guided access only — do not enter without a forest department permit.", "/images/places/bandipur-wildlife.jpg", True, None),
    ("place", "Sinhagad Fort Viewpoint",
     "Easy-pace 6km climb to a historic hilltop fort near Pune, popular for group weekend hikes and local snacks at the summit.",
     "viewpoint", "EASY", 6, 2 * H, "Sinhagad, Pune", 18.3663, 73.7556,
     ["Food stalls", "Parking", "Rest points"], "", "/images/places/sinhagad-viewpoint.jpg", True, None),
    ("trail", "Munnar Tea Gardens Loop",
     "A gentle loop trail winding through rolling tea plantations with panoramic valley views — a favorite for photography.",
     "trail", "EASY", 9, 3 * H, "Munnar, Kerala", 10.0870, 77.0600,
     ["Rest points", "Tea stalls"], "", "/images/places/munnar-tea-gardens.jpg", True,
     [(12, 30), (35, 45), (58, 40), (80, 60), (55, 75), (20, 65)]),
]


class Command(BaseCommand):
    help = "Load the curated Explore places and trails (idempotent)."

    def handle(self, *args, **options):
        made = 0
        for (kind, name, description, category, difficulty, km, duration, location, lat, lng,
             facilities, safety, photo, verified, route) in CURATED:
            common = dict(
                description=description, difficulty=difficulty, distance_km=km, estimated_duration=duration,
                location=location, facilities=facilities, safety_notes=safety, images=[photo],
                is_verified=verified, is_active=True,
            )
            if kind == "place":
                Place.objects.update_or_create(
                    name=name, defaults={**common, "category": category, "latitude": lat, "longitude": lng}
                )
            else:
                trail, _ = Trail.objects.update_or_create(
                    name=name,
                    defaults={**common, "category": category, "start_latitude": lat, "start_longitude": lng},
                )
                if route:
                    trail.points.all().delete()
                    TrailPoint.objects.bulk_create(
                        [
                            TrailPoint(
                                trail=trail, sequence=i,
                                latitude=round(lat + (50 - y) * 0.002, 6), longitude=round(lng + (x - 50) * 0.002, 6),
                            )
                            for i, (x, y) in enumerate(route)
                        ]
                    )
            made += 1
        self.stdout.write(self.style.SUCCESS(f"Explore content ready ({made} places/trails)."))

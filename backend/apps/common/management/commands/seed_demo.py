"""Loads a small, realistic OUTLY demo community (local development only).

Everything goes through the real REST API (in-process), so counters, chats,
notifications and badges are produced by the same code paths as real use.

    python manage.py seed_explore   # places and trails (needed first)
    python manage.py seed_demo

It is additive and idempotent: it never deletes or resets anything, and it does
nothing if the demo community already exists. Point it at a fresh database
(e.g. DATABASE_URL=.../outly_demo) for a clean demo; it will not clean an
existing database for you.

All demo accounts share one local-only password, printed when seeding.
"""
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

from apps.groups.models import Group
from apps.places.models import Place, Trail

PASSWORD = "OutlyDemo!2026"
IMAGES = Path(settings.BASE_DIR).parent / "public" / "images"
MARKER_EMAIL = "maya.deshpande@outly.demo"

# name, email-local, username, location, level, interests, bio
PEOPLE = [
    ("Maya Deshpande", "maya.deshpande", "maya_d", "Pune, Maharashtra", "intermediate",
     ["Hiking", "Photography", "Stargazing"], "Weekend ridge walker. Sunrise at Sinhagad is my church."),
    ("Arjun Rao", "arjun.rao", "arjun_runs", "Bengaluru, Karnataka", "advanced",
     ["Trail running", "Hiking", "Wildlife"], "Trail runner. Nandi Hills before the traffic wakes up."),
    ("Kavya Nair", "kavya.nair", "kavya_in_the_hills", "Munnar, Kerala", "intermediate",
     ["Photography", "Nature walks", "Wildlife"], "Tea gardens, mist and a camera."),
    ("Rohan Bhatt", "rohan.bhatt", "rohan_on_wheels", "Dehradun, Uttarakhand", "advanced",
     ["Cycling", "Hiking", "Weekend road trips"], "Foothill rides and long Himalayan detours."),
    ("Isha Kulkarni", "isha.kulkarni", "isha_camps", "Mumbai, Maharashtra", "beginner",
     ["Camping", "Stargazing", "Kayaking"], "New to camping, loving every minute of it."),
    ("Vikram Singh", "vikram.singh", "vikram_guides", "Sankri, Uttarakhand", "advanced",
     ["Hiking", "Camping", "Photography"], "Trek leader for winter batches in Kedarkantha."),
    ("Sneha Patil", "sneha.patil", "sneha_trails", "Pune, Maharashtra", "beginner",
     ["Hiking", "Nature walks"], "Learning the trails near Pune one weekend at a time."),
    ("Aditya Menon", "aditya.menon", "adi_outdoors", "Bengaluru, Karnataka", "intermediate",
     ["Cycling", "Camping", "Weekend road trips"], "Bike, tent, repeat."),
]
ADMIN = ("Neha Admin", "neha.admin", "neha_admin", "Pune, Maharashtra")

# author-local, caption, location, photo, comments[(commenter-local, text)]
POSTS = [
    ("maya.deshpande", "Sinhagad at first light. The fog was sitting in the valley like a lake. Worth the 5 a.m. alarm.",
     "Sinhagad Fort, Pune", "places/sinhagad-viewpoint.jpg",
     [("sneha.patil", "This is beautiful! Is the climb okay for a beginner?"),
      ("maya.deshpande", "Totally, take the Kalyan Darwaja route and start early.")]),
    ("vikram.singh", "Kedarkantha ridge at sunrise, day 3 of the winter batch. Everyone made the summit.",
     "Kedarkantha, Uttarakhand", "places/kedarkantha-trail.jpg",
     [("rohan.bhatt", "Legend. Putting my name down for the next batch.")]),
    ("kavya.nair", "Early walk through the tea gardens before the tourists arrive.",
     "Munnar, Kerala", "places/munnar-tea-gardens.jpg",
     [("isha.kulkarni", "Adding Munnar to my list!")]),
    ("isha.kulkarni", "My first night camping at Pawna Lake. The stars were unreal.",
     "Pawna Lake, Maharashtra", "places/pawna-lake-campsite.jpg",
     [("aditya.menon", "Welcome to the club. Next time bring a hammock."),
      ("maya.deshpande", "Great spot. Did you try the lakeside trail at dawn?")]),
    ("rohan.bhatt", "Foothill loop done: 45 km, rolling climbs and not a single traffic jam.",
     "Dehradun, Uttarakhand", "places/dehradun-cycling.jpg",
     [("aditya.menon", "That route is on my list for November.")]),
    ("arjun.rao", "Quiet morning run to the viewpoint at Nandi Hills.",
     "Nandi Hills, Bengaluru", "landing/golden-hour-nandi.jpg", []),
]

# name, slug-local owner, category, visibility, description, rules, image, members
GROUPS = [
    ("Bengaluru Trail Runners", "arjun.rao", "Trail running", "PUBLIC",
     "Early-morning trail runs around Bengaluru. All paces welcome; we wait at the top.",
     "Be on time. Carry water. Nobody gets left behind.", "groups/trail-runners.jpg",
     ["aditya.menon", "maya.deshpande"]),
    ("Weekend Wanderers Pune", "maya.deshpande", "Hiking", "PUBLIC",
     "Relaxed weekend hikes around Pune and the Sahyadris, from forts to waterfalls.",
     "Respect the trail. Take your litter home.", "groups/weekend-wanderers.jpg",
     ["sneha.patil", "isha.kulkarni", "kavya.nair"]),
    ("Campfire Collective", "isha.kulkarni", "Camping", "PRIVATE",
     "A members-only circle for campsite tips, gear swaps and group trips.",
     "Keep conversations friendly. Share gear honestly.", "groups/campfire-collective.jpg",
     ["aditya.menon"]),
    ("Dehradun Foothill Cyclists", "rohan.bhatt", "Cycling", "PUBLIC",
     "Weekend road and gravel rides through the Doon valley and Shivalik foothills.",
     "Helmets on. Ride predictably.", "groups/foothill-cyclists.jpg",
     ["aditya.menon", "vikram.singh"]),
]

# title, organizer, category, place/trail name, location, meeting point, days ahead, hours, capacity, difficulty, approval, description
EVENTS = [
    ("Sinhagad Sunrise Group Hike", "maya.deshpande", "HIKE", ("place", "Sinhagad Fort Viewpoint"),
     "Sinhagad Fort, Pune", "Parking area near the base, 5:15 a.m.", 9, 4, 25, "MODERATE", False,
     "A steady group climb to catch sunrise from the fort. Bring water, a torch and a light jacket."),
    ("Kedarkantha Winter Trek: February Batch", "vikram.singh", "HIKE", ("trail", "Kedarkantha Ridge Trail"),
     "Sankri, Uttarakhand", "Sankri base camp", 40, 120, 12, "HARD", True,
     "A guided six-day winter trek. Spots are approved by the trek leader based on fitness and experience."),
    ("Pawna Lake Campfire Night", "isha.kulkarni", "CAMPING", ("place", "Pawna Lake Campsite"),
     "Pawna Lake, Maharashtra", "Main gate, Pawna Lake", 16, 18, 30, "EASY", False,
     "Tents, a campfire and a clear sky. Beginners welcome."),
    ("Munnar Tea-Garden Trail Cleanup", "kavya.nair", "CLEANUP_DRIVE", ("trail", "Munnar Tea Gardens Loop"),
     "Munnar, Kerala", "Tea Museum entrance", 23, 3, 20, "EASY", False,
     "Gloves and bags provided. We clear the loop trail and sort what we collect."),
]

# title, creator, type, place/trail, location, days offset (negative = past), hours, km, difficulty, status, description
ACTIVITIES = [
    ("Sinhagad Weekend Hike", "maya.deshpande", "HIKE", ("place", "Sinhagad Fort Viewpoint"),
     "Sinhagad Fort, Pune", -12, 3, 6, "MODERATE", "COMPLETED", "Out and back via Kalyan Darwaja."),
    ("Dehradun Foothills Ride", "rohan.bhatt", "CYCLING", ("trail", "Dehradun Foothills Cycling Route"),
     "Dehradun, Uttarakhand", -6, 3.5, 45, "MODERATE", "COMPLETED", "Rolling climbs, hardly any traffic."),
    ("Nandi Hills Sunrise Run", "arjun.rao", "TRAIL_RUN", ("place", "Nandi Point"),
     "Nandi Hills, Bengaluru", -3, 1.5, 10, "EASY", "COMPLETED", "Easy pace, long stop at the viewpoint."),
    ("Kedarkantha Summit Day", "vikram.singh", "HIKE", ("trail", "Kedarkantha Ridge Trail"),
     "Sankri, Uttarakhand", -20, 8, 12, "HARD", "COMPLETED", "Summit push in clear weather."),
    ("Munnar Tea Gardens Photo Walk", "kavya.nair", "HIKE", ("trail", "Munnar Tea Gardens Loop"),
     "Munnar, Kerala", 6, 3, 5, "EASY", "PLANNED", "Slow morning walk with cameras. Join if you like."),
    ("Pawna Lake Weekend Camp", "aditya.menon", "CAMPING", ("place", "Pawna Lake Campsite"),
     "Pawna Lake, Maharashtra", 13, 20, None, "EASY", "PLANNED", "Two nights by the lake."),
]

# owner, activity, destination, days ahead, spots, level, description, joiners[(local, message)]
PARTNERS = [
    ("sneha.patil", "HIKE", "Rajmachi Fort, Lonavala", 11, 3, "BEGINNER",
     "Looking for 2-3 friendly people for a relaxed Rajmachi hike. First time doing it.",
     [("isha.kulkarni", "I'd love to join. I can drive from Mumbai.")]),
    ("arjun.rao", "TRAIL_RUN", "Nandi Hills, Bengaluru", 5, 4, "INTERMEDIATE",
     "Sunrise trail run, about 10 km at a conversational pace.", []),
    ("aditya.menon", "CYCLING", "Bengaluru to Nandi Hills", 8, 2, "INTERMEDIATE",
     "Weekend ride, about 60 km round trip. Bring a spare tube.",
     [("rohan.bhatt", "Count me in.")]),
]

# place/trail name, [(reviewer, rating, text)]
REVIEWS = [
    (("place", "Sinhagad Fort Viewpoint"), [
        ("maya.deshpande", 5, "Best sunrise near Pune. Go early to beat the crowd."),
        ("sneha.patil", 4, "Steep in places but very doable. Lots of food stalls at the top."),
    ]),
    (("trail", "Kedarkantha Ridge Trail"), [
        ("vikram.singh", 5, "A classic winter trek. Snow, pine forest and a great summit view."),
        ("isha.kulkarni", 4, "Tough but worth it. Good guides make a big difference."),
    ]),
    (("place", "Pawna Lake Campsite"), [
        ("isha.kulkarni", 5, "Perfect first camping trip: easy access and a clear night sky."),
        ("aditya.menon", 4, "Busy on weekends, but the lakeside spots are lovely."),
    ]),
    (("trail", "Munnar Tea Gardens Loop"), [
        ("kavya.nair", 5, "Quiet and misty in the morning, a photographer's dream."),
    ]),
    (("trail", "Dehradun Foothills Cycling Route"), [
        ("rohan.bhatt", 4, "Smooth tarmac, steady climbs, great views of the Shivaliks."),
    ]),
]

# (sender, recipient, [(speaker, text)])
CHATS = [
    ("sneha.patil", "maya.deshpande", [
        ("sneha.patil", "Hi Maya! Saw your Sinhagad post. Is the sunrise hike okay for a beginner?"),
        ("maya.deshpande", "Hi Sneha! Yes, we go at an easy pace. Join the group hike next week."),
        ("sneha.patil", "That sounds great, signing up now."),
    ]),
    ("isha.kulkarni", "aditya.menon", [
        ("isha.kulkarni", "Are you still planning the Pawna weekend?"),
        ("aditya.menon", "Yes! Two nights, leaving Friday evening. Want to come?"),
    ]),
]

BADGE_FOLLOWS = [  # who follows whom
    ("sneha.patil", "maya.deshpande"), ("isha.kulkarni", "maya.deshpande"), ("kavya.nair", "maya.deshpande"),
    ("maya.deshpande", "vikram.singh"), ("arjun.rao", "maya.deshpande"), ("rohan.bhatt", "vikram.singh"),
    ("aditya.menon", "rohan.bhatt"), ("aditya.menon", "arjun.rao"), ("isha.kulkarni", "kavya.nair"),
    ("vikram.singh", "rohan.bhatt"), ("maya.deshpande", "kavya.nair"), ("sneha.patil", "isha.kulkarni"),
]


class Command(BaseCommand):
    help = "Load a small realistic demo community through the real API (idempotent, additive, DEBUG only)."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_demo is for local development only (DJANGO_DEBUG=true).")
        User = get_user_model()
        if User.objects.filter(email=MARKER_EMAIL).exists():
            self.stdout.write("Demo community already present; nothing to do.")
            return
        if not Place.objects.exists():
            raise CommandError("Run `python manage.py seed_explore` first (places and trails).")

        # Seeding is a burst of writes by many accounts from one process: lift the per-scope throttles.
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"  # no console spam while seeding
        SimpleRateThrottle.THROTTLE_RATES = {k: "100000/min" for k in SimpleRateThrottle.THROTTLE_RATES}

        self.clients, self.ids = {}, {}
        self._people()
        self._follows()
        self._posts()
        self._groups()
        self._events()
        self._activities()
        self._partners()
        self._reviews()
        self._chats()
        self._saves()
        self.stdout.write(self.style.SUCCESS(
            f"Demo community ready: {len(PEOPLE)} people + 1 admin. Log in as <email> / {PASSWORD} "
            f"(e.g. {MARKER_EMAIL}; admin: neha.admin@outly.demo)."
        ))

    # -- helpers
    def api(self, who, method, path, data=None, fmt="json", ok=(200, 201, 202, 204)):
        response = getattr(self.clients[who], method)(f"/api/v1/{path}", data, format=fmt)
        if response.status_code not in ok:
            raise CommandError(f"{method.upper()} {path} as {who} -> {response.status_code}: {getattr(response, 'data', '')}")
        data = getattr(response, "data", None)
        return data["results"] if isinstance(data, dict) and "results" in data else data

    def target(self, ref):
        kind, name = ref
        model = Place if kind == "place" else Trail
        return {f"{kind}_id": model.objects.get(name=name).pk}

    def future(self, days, hours=0):
        return (timezone.now() + timedelta(days=days)).replace(minute=0, second=0, microsecond=0) + timedelta(hours=hours)

    # -- sections
    def _people(self):
        User = get_user_model()
        for name, local, username, location, level, interests, bio in PEOPLE:
            self._account(name, local, username, location, level, interests, bio)
        admin_name, admin_local, admin_username, admin_location = ADMIN
        user = self._account(admin_name, admin_local, admin_username, admin_location, "advanced", ["Hiking"], "OUTLY platform admin.")
        User.objects.filter(pk=user["user_id"]).update(role="ADMINISTRATOR")

    def _account(self, name, local, username, location, level, interests, bio):
        email = f"{local}@outly.demo"
        client = APIClient(HTTP_HOST=next((h for h in settings.ALLOWED_HOSTS if h not in ("", "*") and not h.startswith(".")), "localhost"))
        response = client.post("/api/v1/auth/register/", {
            "full_name": name, "email": email, "password": PASSWORD, "confirm_password": PASSWORD, "terms_accepted": True,
        }, format="json")
        if response.status_code != 201:
            raise CommandError(f"register {email} -> {response.status_code}: {response.data}")
        user = get_user_model().objects.get(email=email)
        get_user_model().objects.filter(pk=user.pk).update(email_verified=True)
        client.force_authenticate(user)
        self.clients[local] = client
        self.ids[local] = user.pk
        self.api(local, "patch", "users/me/", {
            "display_name": name, "username": username, "location": location, "skill_level": level,
            "interests": interests, "bio": bio, "onboarding_completed": True,
        })
        return {"user_id": user.pk}

    def _follows(self):
        for follower, target in BADGE_FOLLOWS:
            self.api(follower, "post", f"users/{self.ids[target]}/follow/")

    def _upload(self, who, relative):
        path = IMAGES / relative
        with open(path, "rb") as handle:
            upload = SimpleUploadedFile(path.name, handle.read(), content_type="image/jpeg")
        return self.api(who, "post", "media/", {"file": upload}, fmt="multipart")["id"]

    def _posts(self):
        for author, caption, location, photo, comments in POSTS:
            media_id = self._upload(author, photo)
            post = self.api(author, "post", "posts/", {"caption": caption, "location": location, "media_ids": [media_id]})
            for commenter, text in comments:
                self.api(commenter, "post", f"posts/{post['id']}/comments/", {"content": text})
            for liker in ("maya.deshpande", "arjun.rao", "kavya.nair", "rohan.bhatt", "isha.kulkarni"):
                if liker != author and hash((liker, post["id"])) % 3:
                    self.api(liker, "post", f"posts/{post['id']}/like/")

    def _groups(self):
        for name, owner, category, visibility, description, rules, image, members in GROUPS:
            group = self.api(owner, "post", "groups/", {
                "name": name, "category": category, "description": description, "visibility": visibility, "rules": rules,
            })
            record = Group.objects.get(pk=group["id"])
            with open(IMAGES / image, "rb") as handle:
                record.image.save(Path(image).name, File(handle), save=True)
            for member in members:
                self.api(member, "post", f"groups/{group['id']}/join/", {})
            if visibility == "PRIVATE":
                requests = self.api(owner, "get", f"groups/{group['id']}/join-requests/")
                for item in requests:
                    if item["status"] == "PENDING":
                        self.api(owner, "post", f"groups/{group['id']}/join-requests/{item['id']}/review/", {"decision": "ACCEPTED"})
            self.api(owner, "post", f"posts/", {"caption": f"Welcome to {name}! Introduce yourself and say what you love doing outdoors.", "group_id": group["id"]})

    def _events(self):
        self.event_ids = {}
        for title, organizer, category, ref, location, meeting, days, hours, capacity, difficulty, approval, description in EVENTS:
            start = self.future(days, hours)
            event = self.api(organizer, "post", "events/", {
                "title": title, "description": description, "category": category, "location": location,
                "meeting_point": meeting, "start_at": start.isoformat(), "capacity": capacity, "difficulty": difficulty,
                "requires_approval": approval, "visibility": "PUBLIC", **self.target(ref),
            })
            self.event_ids[title] = event["id"]
        joins = {
            "Sinhagad Sunrise Group Hike": ["sneha.patil", "isha.kulkarni", "kavya.nair", "aditya.menon"],
            "Pawna Lake Campfire Night": ["maya.deshpande", "aditya.menon", "sneha.patil"],
            "Kedarkantha Winter Trek: February Batch": ["rohan.bhatt", "maya.deshpande"],
            "Munnar Tea-Garden Trail Cleanup": ["maya.deshpande"],
        }
        for title, people in joins.items():
            for person in people:
                self.api(person, "post", f"events/{self.event_ids[title]}/join/", {})
        organizer = "vikram.singh"
        for item in self.api(organizer, "get", f"events/{self.event_ids['Kedarkantha Winter Trek: February Batch']}/participants/"):
            if item["status"] == "PENDING" and item["username"] == "rohan_on_wheels":
                self.api(organizer, "patch", f"events/{self.event_ids['Kedarkantha Winter Trek: February Batch']}/participants/{item['user_id']}/", {"status": "APPROVED"})

    def _activities(self):
        from apps.activities.models import Activity
        for title, creator, kind, ref, location, offset, hours, km, difficulty, status, notes in ACTIVITIES:
            start = self.future(offset, 6)
            body = {
                "title": title, "activity_type": kind, "location": location, "start_at": start.isoformat(),
                "difficulty": difficulty, "notes": notes, "privacy": "PUBLIC", "status": "PLANNED", **self.target(ref),
            }
            if km:
                body["distance"] = km
            body["duration"] = f"{int(hours)}:{int(round((hours % 1) * 60)):02d}:00"
            activity = self.api(creator, "post", "activities/", body)
            if title == "Sinhagad Weekend Hike":
                for person in ("sneha.patil", "isha.kulkarni"):
                    self.api(person, "post", f"activities/{activity['id']}/join/", {})
            if title == "Munnar Tea Gardens Photo Walk":
                self.api("maya.deshpande", "post", f"activities/{activity['id']}/join/", {})
            if status == "COMPLETED":
                # A completed outing is recorded as it happened: planned for its (past) date, then completed.
                Activity.objects.filter(pk=activity["id"]).update(start_at=start)
                self.api(creator, "patch", f"activities/{activity['id']}/", {"status": "COMPLETED"})

    def _partners(self):
        for owner, kind, destination, days, spots, level, description, joiners in PARTNERS:
            request = self.api(owner, "post", "partner-requests/", {
                "activity": kind, "destination": destination, "preferred_datetime": self.future(days, 6).isoformat(),
                "spots_total": spots, "experience_level": level, "description": description, "visibility": "PUBLIC",
            })
            for who, message in joiners:
                self.api(who, "post", f"partner-requests/{request['id']}/join/", {"message": message})
                for item in self.api(owner, "get", f"partner-requests/{request['id']}/join-requests/"):
                    if item["status"] == "PENDING":
                        self.api(owner, "post", f"partner-requests/{request['id']}/join-requests/{item['id']}/review/", {"decision": "ACCEPTED"})

    def _reviews(self):
        for (kind, name), items in REVIEWS:
            model = Place if kind == "place" else Trail
            target_id = model.objects.get(name=name).pk
            for who, rating, text in items:
                self.api(who, "post", f"{kind}s/{target_id}/reviews/", {"rating": rating, "text": text})

    def _chats(self):
        for sender, recipient, lines in CHATS:
            conversation = self.api(sender, "post", "chats/direct/", {"user_id": self.ids[recipient]})
            for speaker, text in lines:
                self.api(speaker, "post", f"chats/conversations/{conversation['id']}/messages/", {"content": text})
            self.api(sender, "post", f"chats/conversations/{conversation['id']}/read/", {})

    def _saves(self):
        saves = [("maya.deshpande", "trail", "Kedarkantha Ridge Trail"), ("sneha.patil", "place", "Sinhagad Fort Viewpoint"),
                 ("isha.kulkarni", "trail", "Munnar Tea Gardens Loop"), ("aditya.menon", "trail", "Dehradun Foothills Cycling Route")]
        for who, kind, name in saves:
            model = Place if kind == "place" else Trail
            self.api(who, "post", f"{kind}s/{model.objects.get(name=name).pk}/save/", {})

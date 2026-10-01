from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.common.models import Difficulty, TimeStamped

CATEGORIES = ["trail", "viewpoint", "campsite", "cycling-route", "wildlife", "water", "other"]


class Place(TimeStamped):
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    latitude = models.FloatField(validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.FloatField(validators=[MinValueValidator(-180), MaxValueValidator(180)])
    category = models.CharField(max_length=30, default="trail", db_index=True)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, blank=True)
    distance_km = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    estimated_duration = models.DurationField(null=True, blank=True)
    facilities = models.JSONField(default=list, blank=True)
    safety_notes = models.TextField(blank=True)
    images = models.JSONField(default=list, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    reviews_count = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")

    class Meta:
        ordering = ["name", "id"]
        indexes = [
            models.Index(fields=["latitude", "longitude"]),
            models.Index(fields=["is_active", "-rating"]),
            GinIndex(fields=["name"], name="place_name_trgm", opclasses=["gin_trgm_ops"]),
        ]

    def __str__(self):
        return self.name


class Trail(TimeStamped):
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200)
    place = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="trails")
    start_latitude = models.FloatField(null=True, blank=True, validators=[MinValueValidator(-90), MaxValueValidator(90)])
    start_longitude = models.FloatField(null=True, blank=True, validators=[MinValueValidator(-180), MaxValueValidator(180)])
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, blank=True)
    distance_km = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    elevation_gain_m = models.PositiveIntegerField(null=True, blank=True)
    estimated_duration = models.DurationField(null=True, blank=True)
    facilities = models.JSONField(default=list, blank=True)
    safety_notes = models.TextField(blank=True)
    images = models.JSONField(default=list, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    reviews_count = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")

    class Meta:
        ordering = ["name", "id"]
        indexes = [
            models.Index(fields=["start_latitude", "start_longitude"]),
            models.Index(fields=["is_active", "-rating"]),
            GinIndex(fields=["name"], name="trail_name_trgm", opclasses=["gin_trgm_ops"]),
        ]

    def __str__(self):
        return self.name


class TrailPoint(models.Model):
    trail = models.ForeignKey(Trail, on_delete=models.CASCADE, related_name="points")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    elevation_m = models.FloatField(null=True, blank=True)
    sequence = models.PositiveIntegerField()

    class Meta:
        ordering = ["sequence"]
        constraints = [models.UniqueConstraint(fields=["trail", "sequence"], name="trailpoint_sequence_unique")]


class SavedPlace(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_places")
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name="saves")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "place"], name="savedplace_unique")]
        indexes = [models.Index(fields=["user", "-created_at"])]

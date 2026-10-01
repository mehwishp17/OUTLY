"""Shared filtering/search for places and trails (one implementation, used by
Explore, the unified search endpoint and the map)."""
import math

from django.db.models import FloatField, Q
from django.db.models.functions import ACos, Cos, Greatest, Least, Radians, Sin
from rest_framework.exceptions import ValidationError

ORDERINGS = {
    "name": "name",
    "-name": "-name",
    "rating": "rating",
    "-rating": "-rating",
    "newest": "-created_at",
    "distance": "distance_km",
    "-distance": "-distance_km",
}


def _float(params, key):
    raw = params.get(key)
    if raw in (None, ""):
        return None
    try:
        return float(raw)
    except ValueError:
        raise ValidationError({key: ["Must be a number."]}) from None


def parse_near(params):
    raw = params.get("near")
    if not raw:
        return None
    try:
        lat, lng = (float(part) for part in raw.split(","))
    except ValueError:
        raise ValidationError({"near": ["Use near=<latitude>,<longitude>."]}) from None
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise ValidationError({"near": ["Coordinates out of range."]})
    radius = _float(params, "radius_km") or 50.0
    return lat, lng, min(max(radius, 0.1), 2000.0)


def filter_explorable(queryset, params, *, lat_field, lng_field, text_fields):
    term = params.get("search", "").strip()
    if term:
        condition = Q()
        for field in text_fields:
            condition |= Q(**{f"{field}__icontains": term})
        queryset = queryset.filter(condition)
    if params.get("category") and hasattr(queryset.model, "category"):
        queryset = queryset.filter(category__in=[c.strip() for c in params["category"].split(",")])
    if params.get("difficulty"):
        queryset = queryset.filter(difficulty__in=[d.strip().upper() for d in params["difficulty"].split(",")])
    min_rating = _float(params, "min_rating")
    if min_rating is not None:
        queryset = queryset.filter(rating__gte=min_rating)
    max_distance = _float(params, "max_distance")
    if max_distance is not None:
        queryset = queryset.filter(distance_km__lte=max_distance)
    if params.get("verified") in ("true", "1"):
        queryset = queryset.filter(is_verified=True)

    near = parse_near(params)
    if near:
        lat, lng, radius = near
        # bounding box first (uses the lat/lng index), exact haversine second
        dlat = radius / 111.0
        dlng = radius / (111.0 * max(math.cos(math.radians(lat)), 0.01))
        queryset = queryset.filter(
            **{f"{lat_field}__range": (lat - dlat, lat + dlat), f"{lng_field}__range": (lng - dlng, lng + dlng)}
        )
        cos_angle = Cos(Radians(lat)) * Cos(Radians(lat_field_expr(lat_field))) * Cos(
            Radians(lng_field_expr(lng_field)) - Radians(lng)
        ) + Sin(Radians(lat)) * Sin(Radians(lat_field_expr(lat_field)))
        queryset = queryset.annotate(
            distance_from_km=6371.0 * ACos(Least(1.0, Greatest(-1.0, cos_angle)), output_field=FloatField())
        ).filter(distance_from_km__lte=radius)

    ordering = params.get("ordering")
    if ordering == "nearest" and near:
        queryset = queryset.order_by("distance_from_km", "id")
    elif ordering in ORDERINGS:
        queryset = queryset.order_by(ORDERINGS[ordering], "id")
    return queryset


def lat_field_expr(name):
    from django.db.models import F

    return F(name)


def lng_field_expr(name):
    from django.db.models import F

    return F(name)

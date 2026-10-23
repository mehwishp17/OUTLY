"""Validation and parsing of admin-supplied GPX track files.

This module only checks and measures a file. It never touches the database, so a track that
passes here is *well-formed*, nothing more: parsing says nothing about whether the geometry is
accurate, who recorded it, or whether OUTLY has verified it. Those are separate questions and are
not decided here.

Safety:
  * Only UTF-8 is accepted, and any DOCTYPE or ENTITY declaration is rejected before the XML
    parser sees the file. Without a DTD there are no entities to expand and nothing external to
    fetch, which rules out XXE and "billion laughs" attacks with the standard library parser.
  * File size and point count are capped before and after parsing.
  * Error messages describe the problem, never filenames, paths or exception internals.
"""
import math
import re
from dataclasses import dataclass, field
from xml.etree import ElementTree as ET

MAX_BYTES = 5 * 1024 * 1024
MAX_POINTS = 5000  # the same cap TrailPointsView applies to submitted points
MIN_POINTS = 2
MIN_LENGTH_KM = 0.05
EARTH_RADIUS_KM = 6371.0088
LARGE_JUMP_KM = 5.0  # reported as a warning, not an error: GPS tracks can legitimately jump
MIN_ELEVATION_M = -500.0
MAX_ELEVATION_M = 9000.0

_DTD_MARKERS = re.compile(r"<!\s*(doctype|entity)", re.IGNORECASE)
_XML_ENCODING = re.compile(r"^\s*<\?xml[^>]*encoding\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE)


class GpxError(ValueError):
    """The file cannot be used. `errors` holds one actionable message per problem."""

    def __init__(self, errors):
        self.errors = list(errors) if not isinstance(errors, str) else [errors]
        super().__init__("; ".join(self.errors))


@dataclass(frozen=True)
class GpxPoint:
    latitude: float
    longitude: float
    elevation_m: float | None = None


@dataclass
class GpxTrack:
    """A validated track. `points` are in file order with consecutive duplicates removed."""

    points: list[GpxPoint]
    length_km: float
    segments: int
    name: str = ""
    has_elevation: bool = False
    has_timestamps: bool = False
    duplicates_removed: int = 0
    warnings: list[str] = field(default_factory=list)

    @property
    def bounds(self):
        lats = [p.latitude for p in self.points]
        lngs = [p.longitude for p in self.points]
        return min(lats), min(lngs), max(lats), max(lngs)


def haversine_km(lat1, lng1, lat2, lng2):
    """Great-circle distance in km (not a driving or walking distance)."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    d_lat, d_lng = p2 - p1, math.radians(lng2 - lng1)
    h = math.sin(d_lat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(d_lng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(h)))


def _local(tag):
    """Tag name without its XML namespace, so GPX 1.0 and 1.1 are read the same way."""
    return tag.rsplit("}", 1)[-1] if isinstance(tag, str) else ""


def _children(element, name):
    return [child for child in element if _local(child.tag) == name]


def _decode(data):
    if not data or not data.strip():
        raise GpxError("The file is empty.")
    if len(data) > MAX_BYTES:
        raise GpxError(f"The file is too large (max {MAX_BYTES // (1024 * 1024)} MB).")
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise GpxError("The file must be UTF-8 encoded GPX (XML) text.") from None
    declared = _XML_ENCODING.match(text)
    if declared and declared.group(1).strip().lower().replace("_", "-") not in ("utf-8", "utf8"):
        raise GpxError("The file must be UTF-8 encoded GPX (XML) text.")
    if _DTD_MARKERS.search(text):
        raise GpxError("The file contains a DOCTYPE or ENTITY declaration, which is not allowed in a GPX file.")
    return text


def _number(raw):
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    return value if math.isfinite(value) else None


def parse_gpx(data: bytes) -> GpxTrack:
    """Validate GPX bytes and return the track, or raise `GpxError` with every problem found."""
    text = _decode(data)
    try:
        root = ET.fromstring(text)
    except (ET.ParseError, RecursionError):
        raise GpxError("The file is not well-formed XML.") from None
    if _local(root.tag) != "gpx":
        raise GpxError("This is not a GPX file (the root element must be <gpx>).")

    tracks = _children(root, "trk")
    if not tracks:
        extras = "waypoints" if _children(root, "wpt") else "routes" if _children(root, "rte") else ""
        hint = f" It only contains {extras}, which are not recorded tracks." if extras else ""
        raise GpxError(f"The file has no track (<trk>) to import.{hint}")
    if len(tracks) > 1:
        raise GpxError(f"The file has {len(tracks)} tracks. Upload a file with exactly one track.")
    track = tracks[0]
    segments = _children(track, "trkseg")
    if not segments:
        raise GpxError("The track has no segments (<trkseg>).")

    errors: list[str] = []
    points: list[GpxPoint] = []
    length_km = 0.0
    large_jumps = 0
    duplicates = 0
    with_elevation = 0
    with_time = 0
    raw_count = 0
    used_segments = 0

    for segment in segments:
        previous: GpxPoint | None = None
        segment_points = 0
        for element in _children(segment, "trkpt"):
            raw_count += 1
            if raw_count > MAX_POINTS * 2:  # stop early on absurd files instead of validating them all
                raise GpxError(f"The track has too many points (max {MAX_POINTS}).")
            number = raw_count
            lat, lng = _number(element.get("lat")), _number(element.get("lon"))
            if lat is None or lng is None:
                errors.append(f"Point {number}: latitude and longitude must be numbers.")
                continue
            if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                errors.append(f"Point {number}: coordinates are out of range (latitude -90 to 90, longitude -180 to 180).")
                continue
            elevation = None
            ele_text = next((c.text for c in _children(element, "ele")), None)
            if ele_text is not None and ele_text.strip():
                elevation = _number(ele_text)
                if elevation is None or not (MIN_ELEVATION_M <= elevation <= MAX_ELEVATION_M):
                    errors.append(f"Point {number}: elevation is not a valid number of metres.")
                    continue
            if any((c.text or "").strip() for c in _children(element, "time")):
                with_time += 1
            point = GpxPoint(round(lat, 6), round(lng, 6), None if elevation is None else round(elevation, 1))
            if previous is not None and (point.latitude, point.longitude) == (previous.latitude, previous.longitude):
                duplicates += 1
                continue
            if previous is not None:
                step = haversine_km(previous.latitude, previous.longitude, point.latitude, point.longitude)
                length_km += step
                large_jumps += step > LARGE_JUMP_KM
            if elevation is not None:
                with_elevation += 1
            points.append(point)
            segment_points += 1
            previous = point
        used_segments += 1 if segment_points else 0

    if errors:
        shown = errors[:10]
        if len(errors) > 10:
            shown.append(f"...and {len(errors) - 10} more problems.")
        raise GpxError(shown)
    if len(points) > MAX_POINTS:
        raise GpxError(f"The track has too many points ({len(points)}; max {MAX_POINTS}). Simplify it and try again.")
    if len(points) < MIN_POINTS:
        raise GpxError(f"The track needs at least {MIN_POINTS} different points; this one has {len(points)}.")
    if length_km < MIN_LENGTH_KM:
        raise GpxError("The track is shorter than 50 metres, which is too short to be a trail route.")

    name = ""
    for child in _children(track, "name"):
        name = (child.text or "").strip()[:160]
        break
    has_timestamps = with_time == len(points) + duplicates
    warnings = []
    if not has_timestamps:
        warnings.append("Not every point has a timestamp, so nothing in the file shows it was recorded rather than drawn.")
    if with_elevation != len(points):
        warnings.append("Elevation is missing for some or all points.")
    if large_jumps:
        warnings.append(f"{large_jumps} step(s) between consecutive points are longer than {LARGE_JUMP_KM:g} km. Check the track for GPS errors.")
    if used_segments > 1:
        warnings.append("The track has several segments; gaps between them are not counted in its length.")

    return GpxTrack(
        points=points,
        length_km=round(length_km, 3),
        segments=used_segments,
        name=name,
        has_elevation=with_elevation == len(points),
        has_timestamps=has_timestamps,
        duplicates_removed=duplicates,
        warnings=warnings,
    )

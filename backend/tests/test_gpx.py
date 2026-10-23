"""GPX validation: what is accepted, what is rejected, and that unsafe XML never reaches the parser.

These tests build small GPX documents in memory. No file is downloaded, no database is used and
nothing is saved: the module only validates and measures.
"""
import math
from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from apps.places.gpx import MAX_BYTES, MAX_POINTS, GpxError, haversine_km, parse_gpx

NS = 'xmlns="http://www.topografix.com/GPX/1/1"'


def trkpt(lat, lon, ele=None, time=None):
    inner = (f"<ele>{ele}</ele>" if ele is not None else "") + (f"<time>{time}</time>" if time else "")
    return f'<trkpt lat="{lat}" lon="{lon}">{inner}</trkpt>'


def gpx(*segments, name="Test ridge", ns=NS, extra=""):
    body = "".join(f"<trkseg>{''.join(points)}</trkseg>" for points in segments)
    title = f"<name>{name}</name>" if name else ""
    return f'<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="t" {ns}><trk>{title}{body}</trk>{extra}</gpx>'.encode()


def line(count, start=(30.0, 78.0), step=0.001, ele=True, time=True):
    return [
        trkpt(round(start[0] + i * step, 6), start[1], 1000 + i if ele else None, "2026-01-01T00:00:00Z" if time else None)
        for i in range(count)
    ]


def rejected(data):
    with pytest.raises(GpxError) as caught:
        parse_gpx(data)
    return caught.value.errors


# ---------------------------------------------------------------- accepted files


def test_valid_track_is_parsed_with_measured_length():
    track = parse_gpx(gpx(line(11)))  # 10 steps of 0.001 degrees of latitude
    assert len(track.points) == 11 and track.segments == 1 and track.name == "Test ridge"
    expected = 10 * 0.001 * (math.pi / 180) * 6371.0088
    assert track.length_km == pytest.approx(expected, rel=1e-3)
    assert track.has_elevation and track.has_timestamps and track.warnings == []
    assert track.bounds[0] == 30.0 and track.bounds[2] == pytest.approx(30.01)


def test_gpx_1_0_namespace_and_no_namespace_are_read_the_same_way():
    old = parse_gpx(gpx(line(5), ns='xmlns="http://www.topografix.com/GPX/1/0"'))
    plain = parse_gpx(gpx(line(5), ns=""))
    assert len(old.points) == len(plain.points) == 5


def test_haversine_matches_a_known_distance():
    # One degree of latitude is about 111.195 km on a 6371.0088 km sphere.
    assert haversine_km(0, 0, 1, 0) == pytest.approx(111.195, abs=0.01)
    assert haversine_km(10, 20, 10, 20) == 0


def test_gaps_between_segments_are_not_counted_in_the_length():
    first, second = line(6, start=(30.0, 78.0)), line(6, start=(40.0, 78.0))  # 1,100+ km apart
    track = parse_gpx(gpx(first, second))
    assert track.segments == 2
    assert track.length_km == pytest.approx(2 * 5 * 0.001 * (math.pi / 180) * 6371.0088, rel=1e-3)
    assert any("several segments" in w for w in track.warnings)


def test_consecutive_duplicate_points_are_removed_and_counted():
    points = [trkpt(30, 78), trkpt(30, 78), trkpt(30.001, 78), trkpt(30.001, 78), trkpt(30.002, 78)]
    track = parse_gpx(gpx(points))
    assert len(track.points) == 3 and track.duplicates_removed == 2


def test_coordinates_are_rounded_to_six_places():
    track = parse_gpx(gpx([trkpt(30.123456789, 78.987654321), trkpt(30.2, 78.9)]))
    assert (track.points[0].latitude, track.points[0].longitude) == (30.123457, 78.987654)


def test_a_track_without_timestamps_or_elevation_is_accepted_but_not_called_recorded():
    track = parse_gpx(gpx(line(5, ele=False, time=False)))
    assert not track.has_timestamps and not track.has_elevation
    assert any("recorded rather than drawn" in w for w in track.warnings)
    assert any("Elevation is missing" in w for w in track.warnings)


def test_long_jumps_are_a_warning_not_an_error():
    track = parse_gpx(gpx([trkpt(30, 78), trkpt(30.001, 78), trkpt(30.2, 78)]))
    assert any("longer than 5 km" in w for w in track.warnings)


def test_a_utf8_byte_order_mark_is_accepted():
    assert len(parse_gpx(b"\xef\xbb\xbf" + gpx(line(4))).points) == 4


# ---------------------------------------------------------------- rejected files


@pytest.mark.parametrize("data", [b"", b"   \n  "])
def test_empty_file_is_rejected(data):
    assert rejected(data) == ["The file is empty."]


def test_oversized_file_is_rejected_before_parsing():
    assert "too large" in rejected(b"<gpx>" + b" " * MAX_BYTES + b"</gpx>")[0]


def test_non_xml_and_broken_xml_are_rejected_without_leaking_parser_details():
    for data in (b"hello world", b"<gpx><trk>", b"\x00\x01\x02\x03"):
        message = rejected(data)[0]
        assert "XML" in message or "UTF-8" in message
        assert "line" not in message.lower() and "column" not in message.lower()


def test_non_gpx_xml_is_rejected():
    assert "root element must be <gpx>" in rejected(b"<kml><Document/></kml>")[0]


def test_utf16_files_are_rejected():
    assert "UTF-8" in rejected(gpx(line(4)).decode().encode("utf-16"))[0]
    declared = gpx(line(4)).replace(b"UTF-8", b"ISO-8859-1")
    assert "UTF-8" in rejected(declared)[0]


def test_waypoint_only_and_route_only_files_are_not_tracks():
    waypoints = f'<gpx {NS} version="1.1"><wpt lat="30" lon="78"/></gpx>'.encode()
    routes = f'<gpx {NS} version="1.1"><rte><rtept lat="30" lon="78"/><rtept lat="30.1" lon="78"/></rte></gpx>'.encode()
    assert "only contains waypoints" in rejected(waypoints)[0]
    assert "only contains routes" in rejected(routes)[0]
    assert "no track" in rejected(f'<gpx {NS} version="1.1"/>'.encode())[0]


def test_several_tracks_or_a_track_without_segments_are_rejected():
    two = f'<gpx {NS} version="1.1"><trk><trkseg>{"".join(line(3))}</trkseg></trk><trk><trkseg>{"".join(line(3))}</trkseg></trk></gpx>'
    assert "exactly one track" in rejected(two.encode())[0]
    assert "no segments" in rejected(f'<gpx {NS} version="1.1"><trk/></gpx>'.encode())[0]


@pytest.mark.parametrize(
    "point",
    [trkpt(91, 78), trkpt(-91, 78), trkpt(30, 181), trkpt(30, -181)],
)
def test_out_of_range_coordinates_are_rejected_with_the_point_number(point):
    errors = rejected(gpx([trkpt(30, 78), point, trkpt(30.1, 78)]))
    assert errors == ["Point 2: coordinates are out of range (latitude -90 to 90, longitude -180 to 180)."]


@pytest.mark.parametrize("lat,lon", [("abc", "78"), ("30", ""), ("nan", "78"), ("inf", "78"), ("30", "-inf")])
def test_non_numeric_or_non_finite_coordinates_are_rejected(lat, lon):
    errors = rejected(gpx([f'<trkpt lat="{lat}" lon="{lon}"/>', trkpt(30.1, 78)]))
    assert "must be numbers" in errors[0]


def test_missing_coordinate_attributes_are_rejected():
    assert "must be numbers" in rejected(gpx(['<trkpt lat="30"/>', trkpt(30.1, 78)]))[0]


def test_invalid_elevation_is_rejected():
    for ele in ("abc", "nan", "99999", "-9999"):
        assert "elevation" in rejected(gpx([trkpt(30, 78, ele), trkpt(30.1, 78)]))[0]


def test_every_problem_is_reported_but_only_ten_are_listed():
    errors = rejected(gpx([trkpt(95, 78)] * 14 + [trkpt(30, 78), trkpt(30.1, 78)]))
    assert len(errors) == 11 and errors[-1] == "...and 4 more problems."


def test_too_few_distinct_points_are_rejected():
    assert "at least 2 different points" in rejected(gpx([trkpt(30, 78)]))[0]
    assert "at least 2 different points" in rejected(gpx([trkpt(30, 78)] * 5))[0]


def test_a_track_shorter_than_fifty_metres_is_rejected():
    assert "shorter than 50 metres" in rejected(gpx([trkpt(30, 78), trkpt(30.00001, 78)]))[0]


def test_too_many_points_are_rejected():
    assert f"max {MAX_POINTS}" in rejected(gpx(line(MAX_POINTS + 1, step=0.0001)))[0]
    assert len(parse_gpx(gpx(line(MAX_POINTS, step=0.0001))).points) == MAX_POINTS


# ---------------------------------------------------------------- unsafe XML


BILLION_LAUGHS = b"""<?xml version="1.0"?>
<!DOCTYPE gpx [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]>
<gpx version="1.1"><trk><name>&b;</name><trkseg><trkpt lat="30" lon="78"/><trkpt lat="30.1" lon="78"/></trkseg></trk></gpx>"""

XXE = b"""<?xml version="1.0"?>
<!DOCTYPE gpx [<!ENTITY secret SYSTEM "file:///etc/passwd">]>
<gpx version="1.1"><trk><name>&secret;</name><trkseg><trkpt lat="30" lon="78"/><trkpt lat="30.1" lon="78"/></trkseg></trk></gpx>"""


@pytest.mark.parametrize("data", [BILLION_LAUGHS, XXE, b'<!doctype gpx><gpx version="1.1"/>', b"<!ENTITY x 'y'><gpx/>"])
def test_dtd_and_entity_declarations_are_rejected_before_parsing(data):
    errors = rejected(data)
    assert "DOCTYPE or ENTITY" in errors[0]
    assert "passwd" not in errors[0]


def test_deeply_nested_xml_fails_cleanly():
    nested = b"<a>" * 200_000 + b"</a>" * 200_000
    assert rejected(nested)  # either a clean GpxError for bad XML/root, never an unhandled crash


# ---------------------------------------------------------------- validation-only command


def test_check_gpx_command_reports_a_valid_file_and_saves_nothing(tmp_path):
    path = tmp_path / "ridge.gpx"
    path.write_bytes(gpx(line(8)))
    out = StringIO()
    call_command("check_gpx", str(path), stdout=out)
    text = out.getvalue()
    assert "Valid GPX track (nothing was saved)." in text and "points:      8" in text


def test_check_gpx_command_lists_every_problem_and_fails(tmp_path):
    path = tmp_path / "bad.gpx"
    path.write_bytes(gpx([trkpt(95, 78), trkpt(30, 78), trkpt(30.1, 78)]))
    out = StringIO()
    with pytest.raises(CommandError):
        call_command("check_gpx", str(path), stdout=out)
    assert "Point 1: coordinates are out of range" in out.getvalue()


def test_check_gpx_command_handles_a_missing_file_without_a_path_in_the_message(tmp_path):
    with pytest.raises(CommandError) as caught:
        call_command("check_gpx", str(tmp_path / "nope.gpx"))
    assert str(tmp_path) not in str(caught.value)

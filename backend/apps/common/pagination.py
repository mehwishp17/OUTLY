from urllib.parse import parse_qs, urlparse

from rest_framework.pagination import CursorPagination, LimitOffsetPagination
from rest_framework.response import Response


def _cursor_of(link):
    if not link:
        return None
    values = parse_qs(urlparse(link).query).get("cursor")
    return values[0] if values else None


class CursorPage(CursorPagination):
    """Cursor pagination. The page items are the envelope `data`; the cursors
    go in `meta`. Views choose their order with `cursor_ordering`."""

    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100

    def get_ordering(self, request, queryset, view):
        return tuple(getattr(view, "cursor_ordering", ("-created_at", "-id")))

    def get_paginated_response(self, data):
        response = Response(data)
        response.meta = {
            "next_cursor": _cursor_of(self.get_next_link()),
            "previous_cursor": _cursor_of(self.get_previous_link()),
            "limit": self.page_size,
        }
        return response

    def get_paginated_response_schema(self, schema):
        return schema


class OffsetPage(LimitOffsetPagination):
    """Offset pagination for ranked/computed orderings (search, distance)."""

    default_limit = 20
    max_limit = 100

    def get_paginated_response(self, data):
        response = Response(data)
        response.meta = {"count": self.count, "limit": self.limit, "offset": self.offset}
        return response

    def get_paginated_response_schema(self, schema):
        return schema

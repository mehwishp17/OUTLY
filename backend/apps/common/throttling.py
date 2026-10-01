from rest_framework.throttling import ScopedRateThrottle


class WriteScopedThrottle(ScopedRateThrottle):
    """Applies the view's `write_throttle_scope` only to non-GET requests."""

    def allow_request(self, request, view):
        scope = getattr(view, "write_throttle_scope", None)
        if not scope or request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        self.scope = scope
        self.rate = self.get_rate()
        self.num_requests, self.duration = self.parse_rate(self.rate)
        return super(ScopedRateThrottle, self).allow_request(request, view)

    def get_cache_key(self, request, view):
        ident = request.user.pk if request.user and request.user.is_authenticated else self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class WriteThrottleMixin:
    """Add to a view and set `write_throttle_scope = "<scope>"` (see
    REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])."""

    write_throttle_scope: str | None = None

    def get_throttles(self):
        throttles = super().get_throttles()
        if self.write_throttle_scope:
            throttles.append(WriteScopedThrottle())
        return throttles

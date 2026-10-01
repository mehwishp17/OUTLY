from rest_framework.renderers import JSONRenderer


class EnvelopeRenderer(JSONRenderer):
    """Wraps every response in {success, message, data, errors, meta}.

    The exception handler already builds a full envelope for errors and marks
    the response with `enveloped = True`. Paginators attach `response.meta`.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = (renderer_context or {}).get("response")
        if response is None or response.status_code == 204 or getattr(response, "enveloped", False):
            return super().render(data, accepted_media_type, renderer_context)
        ok = response.status_code < 400
        envelope = {
            "success": ok,
            "message": getattr(response, "message", "") or "",
            "data": data,
            "errors": None if ok else data,
            "meta": getattr(response, "meta", None) or {},
        }
        return super().render(envelope, accepted_media_type, renderer_context)

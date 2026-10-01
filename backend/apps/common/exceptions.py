import logging

from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("outly.api")


def _flatten(detail):
    """Normalises DRF error detail to {field: [messages]}."""
    if isinstance(detail, dict):
        out = {}
        for key, value in detail.items():
            if isinstance(value, (list, tuple)):
                out[key] = [str(v) if not isinstance(v, dict) else _first_text(v) for v in value]
            elif isinstance(value, dict):
                out[key] = [_first_text(value)]
            else:
                out[key] = [str(value)]
        return out
    if isinstance(detail, (list, tuple)):
        return {"non_field_errors": [str(v) for v in detail]}
    return {"detail": [str(detail)]}


def _first_text(value):
    flat = _flatten(value)
    for messages in flat.values():
        if messages:
            return messages[0]
    return "Invalid value."


def _envelope(response, message, errors):
    response.data = {"success": False, "message": message, "data": None, "errors": errors, "meta": {}}
    response.enveloped = True
    return response


def api_exception_handler(exc, context):
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()

    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled API error", exc_info=exc)
        response = Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return _envelope(response, "Something went wrong on our side.", None)

    if isinstance(exc, exceptions.ValidationError):
        errors = _flatten(exc.detail)
        first = next((m[0] for m in errors.values() if m), "Validation failed.")
        message = first if list(errors) in (["non_field_errors"], ["detail"], ["credentials"]) else "Validation failed."
        return _envelope(response, message, errors)
    if isinstance(exc, (exceptions.AuthenticationFailed, exceptions.NotAuthenticated)):
        return _envelope(response, str(exc.detail), {"detail": [str(exc.detail)]})
    if isinstance(exc, exceptions.Throttled):
        return _envelope(response, "Too many requests. Please slow down.", {"detail": [str(exc.detail)]})
    message = str(getattr(exc, "detail", "Request failed."))
    return _envelope(response, message, {"detail": [message]})

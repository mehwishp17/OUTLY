"""OpenAPI post-processing: documents the {success,message,data,errors,meta}
envelope that EnvelopeRenderer really produces."""


def _wrap(inner):
    return {
        "type": "object",
        "properties": {
            "success": {"type": "boolean"},
            "message": {"type": "string"},
            "data": inner,
            "errors": {"type": "object", "nullable": True, "additionalProperties": True},
            "meta": {"type": "object", "additionalProperties": True},
        },
        "required": ["success", "message", "data", "errors", "meta"],
    }


def envelope_hook(result, generator, request, public):
    for path, operations in result.get("paths", {}).items():
        for method, operation in operations.items():
            if not isinstance(operation, dict) or "responses" not in operation:
                continue
            for code, response in operation["responses"].items():
                if not str(code).startswith("2") or str(code) == "204":
                    continue
                for media in response.get("content", {}).values():
                    inner = media.get("schema")
                    if inner and not (inner.get("properties") or {}).get("success"):
                        media["schema"] = _wrap(inner)
    return result

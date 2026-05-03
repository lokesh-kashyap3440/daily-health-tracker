from typing import Any, Optional


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        detail: str,
        error_code: Optional[str] = None,
        status_code: int = 500,
        extra: Optional[dict[str, Any]] = None,
    ):
        self.detail = detail
        self.error_code = error_code or "INTERNAL_ERROR"
        self.status_code = status_code
        self.extra = extra or {}

    def to_dict(self) -> dict:
        result = {"detail": self.detail, "code": self.error_code}
        if self.extra:
            result.update(self.extra)
        return result


class NotFoundException(AppException):
    def __init__(self, entity: str, entity_id: Any = ""):
        detail = f"{entity} not found"
        if entity_id:
            detail += f": {entity_id}"
        super().__init__(
            detail=detail,
            error_code="NOT_FOUND",
            status_code=404,
        )


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(detail=detail, error_code="UNAUTHORIZED", status_code=401)


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Not authorized"):
        super().__init__(detail=detail, error_code="FORBIDDEN", status_code=403)


class ConflictException(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, error_code="CONFLICT", status_code=409)


class ValidationException(AppException):
    def __init__(self, detail: str = "Validation failed", field: Optional[str] = None):
        extra = {}
        if field:
            extra["field"] = field
        super().__init__(
            detail=detail,
            error_code="VALIDATION_ERROR",
            status_code=422,
            extra=extra,
        )


class RateLimitException(AppException):
    def __init__(self, detail: str = "Too many requests"):
        super().__init__(detail=detail, error_code="RATE_LIMITED", status_code=429)


class ExternalAPIException(AppException):
    def __init__(self, detail: str = "External API error", status_code: int = 502):
        super().__init__(
            detail=detail,
            error_code="EXTERNAL_API_ERROR",
            status_code=status_code,
        )

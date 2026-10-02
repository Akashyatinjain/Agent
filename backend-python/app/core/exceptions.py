from typing import Optional, Any, Dict
from fastapi import HTTPException, status

class AppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Any] = None,
        headers: Optional[Dict[str, str]] = None
    ):
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.code = code
        self.message = message
        self.details = details

class BadRequestException(AppException):
    def __init__(self, code: str = "BAD_REQUEST", message: str = "Invalid request", details: Optional[Any] = None):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, code=code, message=message, details=details)

class UnauthorizedException(AppException):
    def __init__(self, code: str = "UNAUTHORIZED", message: str = "Authentication required", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=code,
            message=message,
            details=details,
            headers={"WWW-Authenticate": "Bearer"}
        )

class ForbiddenException(AppException):
    def __init__(self, code: str = "FORBIDDEN", message: str = "Access denied", details: Optional[Any] = None):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, code=code, message=message, details=details)

class NotFoundException(AppException):
    def __init__(self, code: str = "NOT_FOUND", message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, code=code, message=message, details=details)

class RateLimitException(AppException):
    def __init__(self, code: str = "RATE_LIMIT_EXCEEDED", message: str = "Too many requests. Please slow down.", details: Optional[Any] = None):
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, code=code, message=message, details=details)

class InternalServerErrorException(AppException):
    def __init__(self, code: str = "INTERNAL_ERROR", message: str = "An unexpected error occurred", details: Optional[Any] = None):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, code=code, message=message, details=details)

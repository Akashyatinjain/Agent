import logging
import re
import json
from typing import Any

# Patterns to mask in logs
SENSITIVE_PATTERNS = [
    (re.compile(r'(password["\':\s=]+)(["\']?)([^"\'\s&,]+)(["\']?)', re.IGNORECASE), r'\1\2***REDACTED***\4'),
    (re.compile(r'(token["\':\s=]+)(["\']?)([^"\'\s&,]+)(["\']?)', re.IGNORECASE), r'\1\2***REDACTED***\4'),
    (re.compile(r'(key["\':\s=]+)(["\']?)([^"\'\s&,]+)(["\']?)', re.IGNORECASE), r'\1\2***REDACTED***\4'),
    (re.compile(r'(sk-[a-zA-Z0-9_-]{20,})', re.IGNORECASE), r'***REDACTED_API_KEY***'),
    (re.compile(r'(AQ\.[a-zA-Z0-9_-]{20,})', re.IGNORECASE), r'***REDACTED_API_KEY***'),
    (re.compile(r'(Bearer\s+[a-zA-Z0-9._-]+)', re.IGNORECASE), r'Bearer ***REDACTED_TOKEN***'),
]

class SensitiveDataFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern, repl in SENSITIVE_PATTERNS:
                record.msg = pattern.sub(repl, record.msg)
        if record.args:
            if isinstance(record.args, dict):
                clean_args = {}
                for k, v in record.args.items():
                    if any(secret in k.lower() for secret in ["password", "token", "secret", "key"]):
                        clean_args[k] = "***REDACTED***"
                    else:
                        clean_args[k] = v
                record.args = clean_args
        return True

def setup_logger(name: str = "AkashAgent") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler = logging.StreamHandler()
        handler.setFormatter(formatter)
        handler.addFilter(SensitiveDataFilter())
        logger.addHandler(handler)
    return logger

logger = setup_logger()

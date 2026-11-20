import re

from fastapi import Header

_USER_ID = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


def user_id(x_user_id: str | None = Header(default=None)) -> str | None:
    """Anonymous browser id (PRD 10). Anything that doesn't look like an id is ignored."""
    return x_user_id if x_user_id and _USER_ID.match(x_user_id) else None

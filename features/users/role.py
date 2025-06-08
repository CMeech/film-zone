from enum import Enum

class Role(Enum):
    ADMIN = "admin"
    COACH = "coach"
    PLAYER = "player"

    def __str__(self):
        return self.value

def parse_role(role: str) -> Role:
    try:
        return Role(role)
    except ValueError:
        raise Exception(f"Invalid role: {role}")
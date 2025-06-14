from features.users.role import parse_role

class User:
    def __init__(self, id: int, username: str, role: str):
        self.id = id
        self.username = username
        self.role = parse_role(role)

    def __repr__(self):
        return f"User(id={self.id}, username='{self.username}', role='{self.role}')"
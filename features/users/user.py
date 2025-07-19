from features.users.role import parse_role

class User:
    def __init__(self, id: int, username: str, display_name: str, role: str):
        self.id = id
        self.username = username
        self.display_name = display_name
        self.role = parse_role(role)

    def __repr__(self):
        return f"User(id={self.id}, username='{self.username}', displayName='{self.display_name}', role='{self.role}')"
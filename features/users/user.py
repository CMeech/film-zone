class User:
    def __init__(self, id, username, role):
        self.id = id
        self.username = username
        self.role = role

    def __repr__(self):
        return f"User(id={self.id}, username='{self.username}', role='{self.role}')"
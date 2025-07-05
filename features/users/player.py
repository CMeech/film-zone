class Player:
    def __init__(self, id: int):
        self.id = id

    def __repr__(self):
        return f"Player(id={self.id})"
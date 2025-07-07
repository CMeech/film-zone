class Team:
    def __init__(self, id: int, year: int, name: str, logo_path: str):
        self.id = id
        self.year = year
        self.name = name
        self.logo_path = logo_path

    def __repr__(self):
        return f"Team(id={self.id}, year={self.year}, name='{self.name}', logo_path='{self.logo_path}')"

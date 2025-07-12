from typing import List

from features.users.user import User

class Profile:
    def __init__(self, user: User, team_ids: List[int], token: str, active_team_name: str | None, active_team_logo: str | None):
        self.user = user
        self.team_ids = team_ids
        self.token = token
        self.active_team_name = active_team_name
        self.active_team_logo = active_team_logo
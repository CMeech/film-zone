from dataclasses import dataclass
from datetime import date

@dataclass
class Announcement:
    id: int
    author: str
    author_display_name: str
    message: str
    date: date
    team_id: int
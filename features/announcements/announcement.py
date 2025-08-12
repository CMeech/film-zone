from dataclasses import dataclass
from datetime import date, datetime


@dataclass
class Announcement:
    id: int
    author: str
    author_display_name: str
    message: str
    date: date
    team_id: int
    title: str

    @classmethod
    def from_dict(cls, data: dict) -> 'Announcement':
        # If date is a string, parse it to a date object
        if isinstance(data['date'], str):
            data['date'] = datetime.strptime(data['date'], '%Y-%m-%d').date()
        return cls(**data)

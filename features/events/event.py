from dataclasses import dataclass
from datetime import date

@dataclass
class Event:
    id: int
    name: str
    details: str
    date: date
    location: str
    duration: int
    team_id: int

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            id=data['id'],
            name=data['name'],
            details=data['details'],
            date=data['date'],
            location=data['location'],
            duration=data['duration'],
            team_id=data['team_id']
        )
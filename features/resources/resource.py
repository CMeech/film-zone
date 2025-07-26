
from dataclasses import dataclass

@dataclass
class Resource:
    id: int
    filename: str
    file_path: str
    team_id: int
class Game:
    def __init__(self, id, game_data, opponent_name, final_score,
                 event_id, team_id, is_home, video_url, event_date=None):
        self.id = id
        self.game_data = game_data
        self.opponent_name = opponent_name
        self.final_score = final_score
        self.event_id = event_id
        self.team_id = team_id
        self.is_home = bool(is_home)
        self.video_url = video_url
        # New: surfaced when joining Events
        self.event_date = event_date

    def to_dict(self):
        return {
            "id": self.id,
            "game_data": self.game_data,
            "opponent_name": self.opponent_name,
            "final_score": self.final_score,
            "event_id": self.event_id,
            "team_id": self.team_id,
            "is_home": self.is_home,
            "video_url": self.video_url,
            # safely convert datetime/timestamp if needed
            "event_date": self.event_date
            #"event_date": self.event_date.isoformat() if hasattr(self.event_date, "isoformat") else self.event_date,
        }

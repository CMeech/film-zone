from flask import g

from libs.auth.profile import Profile

def set_user_profile(profile):
    g.user_profile = profile

def get_user_profile() -> Profile:
    return g.get('user_profile', None)

def set_active_team_id(team_id):
    g.active_team_id = team_id

def get_active_team_id() -> int:
    return g.get('active_team_id', None)
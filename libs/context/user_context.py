from flask import g

from libs.auth.profile import Profile

def set_user_profile(profile):
    g.user_profile = profile

def get_user_profile() -> Profile:
    return g.get('user_profile', None)
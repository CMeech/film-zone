from flask import g

def set_user_profile(profile):
    g.user_profile = profile

def get_user_profile():
    return g.get('user_profile', None)
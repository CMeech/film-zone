# This will manage the cache for user access tokens
# This will be used to authenticate users
from typing import List

from features.teams.team import Team
from features.users.role import Role
from features.users.user import User
from libs.auth.profile import Profile
from libs.cache.cache import add_to_cache, get_value
from libs.context.user_context import get_user_profile
from libs.auth.tokens import generate_access_token
from features.users.user_repository import verify_coach_login, verify_player_login
from libs.logging.logging import logger
from features.teams.team_repository import get_teams_by_user_id

ACCESS_TOKEN = "access_token"

# returns an access token if valid
def authenticate_player_login(access_code: str) -> Profile:
    user = verify_player_login(access_code)
    if user is None:
        return None
    user.username = ACCESS_TOKEN
    token = generate_access_token()
    teams = get_teams_for_user(user.id)
    active_team_name = teams[0].name if len(teams) > 0 else None
    active_team_logo = teams[0].logo_path if len(teams) > 0 else None
    profile = Profile(user, get_team_ids_for_user(teams), token, active_team_name, active_team_logo)
    add_to_cache(token, profile, 7200)
    return profile

def authenticate_coach_login(username: str, password: str) -> Profile | None:
    user = verify_coach_login(username, password)
    if user is None:
        return None
    token = generate_access_token()
    teams = get_teams_for_user(user.id)
    active_team_name = teams[0].name if len(teams) > 0 else None
    active_team_logo = teams[0].logo_path if len(teams) > 0 else None
    profile = Profile(user, get_team_ids_for_user(teams), token, active_team_name, active_team_logo)
    add_to_cache(token, profile, 7200)
    return profile

def get_user_from_token(token: str) -> Profile:
    user: Profile = get_value(token)
    if user is None:
        logger.debug(f"Token {token} is invalid")
    elif user.user.username == ACCESS_TOKEN:
        logger.debug(f"Player access token is valid")
    else:
        logger.debug(f"User {user.user.username} was detected")
    return user

def is_authorized(roles: list[Role]) -> bool:
    user_profile = get_user_profile()
    if user_profile is not None:
        logger.debug(f"Checking authorization for user {user_profile.user.username}. Roles {[role.name for role in roles]}")
    else:
        logger.debug("User is not authenticated")
    return user_profile is not None and user_profile.user.role in roles

def get_teams_for_user(user_id: int) -> List[Team]:
    teams = get_teams_by_user_id(user_id)
    if teams is not None and len(teams) > 0:
        return teams
    else:
        return []

def get_team_ids_for_user(teams: List[Team]) -> List[int]:
    return [ team.id for team in teams ]

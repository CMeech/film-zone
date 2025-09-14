from flask import Blueprint, render_template, request, flash, redirect, make_response

from features.teams import team_repository, team
from features.users.role import Role
from libs.auth.pre_authorize import pre_authorize
from libs.auth.require_auth import require_auth
from libs.auth.set_team import set_team_header
from libs.cache.cache import add_to_cache
from libs.context.user_context import get_user_profile, set_user_profile
from libs.logging.logging import logger
from libs.security.rate_limit import limiter

team_bp = Blueprint('team', __name__)
limiter.limit("120/minute")(team_bp)

@team_bp.route('/list', methods=['GET'])
@require_auth
@pre_authorize([Role.ADMIN])
def get_team_list():
    teams = team_repository.get_all_teams()
    return render_template("team/list-teams.html", teams=teams)

@team_bp.route('/create', methods=['GET', 'POST'])
@require_auth
@pre_authorize([Role.ADMIN])
def create_team():
    if request.method == 'POST':
        try:
            year = request.form['year']
            name = request.form['name']
            logo_path = request.form['logoPath']
            team = team_repository.create_team(year, name, logo_path)
            flash(f"Team {team.name} {team.year} registered successfully.")
        except Exception as e:
            logger.error(f"Failed to register team: {e}")
            error_message = "Failed to register team."
            flash(error_message)
    return render_template("team/register-team.html")

@team_bp.route('/link/user', methods=['GET', 'POST'])
@require_auth
@pre_authorize([Role.ADMIN])
def link_user():
    if request.method == 'POST':
        try:
            team_id = request.form['teamId']
            user_id = request.form['userId']
            team_repository.link_team_to_user(team_id, user_id)
            flash(f"User with id {user_id} linked to team with id {team_id} successfully.")
        except Exception as e:
            logger.error(f"Failed to link user with id {user_id} to team with id {team_id}: {e}")
            error_message = "Failed to link user to team. Please check the input and try again."
            flash(error_message)
    return render_template("team/link-user.html")

@team_bp.route('/list/user', methods=['GET'])
@require_auth
def view_user_teams():
    user_profile = get_user_profile()
    user_teams = team_repository.get_teams_by_user_id(user_profile.user.id)
    return render_template("team/list-user-teams.html", teams=user_teams)

@team_bp.route('/select/<int:team_id>', methods=['GET'])
@require_auth
def select_user_team(team_id):
    user_profile = get_user_profile()
    allowed_teams = user_profile.team_ids
    if team_id in allowed_teams:
        response = make_response(redirect("/dashboard"))
        set_team_header(team_id, response)
        user_teams = team_repository.get_teams_by_user_id(user_profile.user.id)
        new_team = next((matching for matching in user_teams if matching.id == team_id), None)
        # Update the cached profile
        user_profile.active_team_logo = new_team.logo_path
        user_profile.active_team_name = new_team.name
        set_user_profile(user_profile)
        add_to_cache(user_profile.token, user_profile, 7200)
        return response
    error_message = "Access Denied."
    flash(error_message)
    return render_template('error/error.html')
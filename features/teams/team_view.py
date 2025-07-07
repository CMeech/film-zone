from flask import Blueprint, render_template, request, flash

from features.teams import team_repository
from features.users.role import Role
from libs.auth.pre_authorize import pre_authorize
from libs.auth.require_auth import require_auth
from libs.logging.logging import logger
from libs.security.rate_limit import limiter

team_bp = Blueprint('team', __name__)
limiter.limit("100/minute")(team_bp)

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
            flash("User registered successfully.")
        except Exception as e:
            logger.error(f"Failed to register team: {e}")
            error_message = "Failed to register team."
            flash(error_message)
    return render_template("team/register-team.html")
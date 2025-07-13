from flask import Blueprint, render_template, request, flash
from features.users.role import Role
from libs.auth.pre_authorize import pre_authorize
from libs.auth.require_auth import require_auth
from libs.auth.team_required import team_required
from libs.context.user_context import get_active_team_id
from libs.logging.logging import logger
from libs.security.rate_limit import limiter
from features.rosters.roster_repository import get_players_by_roster_id, add_player_to_roster
from features.players.player_repository import create_player

roster_bp = Blueprint('roster', __name__)
limiter.limit("100/minute")(roster_bp)

@roster_bp.route('/list', methods=['GET'])
@require_auth
@team_required
def view_roster():
    team_id = get_active_team_id()
    players = get_players_by_roster_id(team_id)
    return render_template("roster/view-roster.html", players=players)

@roster_bp.route('/createPlayer', methods=['GET', 'POST'])
@require_auth
@pre_authorize([Role.COACH, Role.ADMIN])
@team_required
def register_player():
    if request.method == 'POST':
        try:
            name = request.form['name']
            number = request.form['number']
            birth_year = request.form['year']
            position = request.form['position']
            team_id = get_active_team_id()
            player = create_player(name, position, number, birth_year)
            add_player_to_roster(player.id, team_id)
            flash(f"Player {player.name} with number {player.number} registered successfully.")
        except Exception as e:
            logger.error(f"Failed to register player: {e}")
            error_message = "Failed to register player."
            flash(error_message)
    return render_template("roster/register-player.html")
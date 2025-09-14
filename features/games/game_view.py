import json
import os
from flask import Blueprint, render_template, request, jsonify, flash
from features.games import game_repository
from features.rosters.roster_repository import get_players_by_roster_id
from features.users.role import Role
from libs.auth.require_auth import require_auth
from libs.auth.pre_authorize import pre_authorize
from libs.auth.team_required import team_required
from libs.context.user_context import get_active_team_id
from libs.logging.logging import logger
from jsonschema import validate, ValidationError

from libs.security.rate_limit import limiter

# Resolve schema path relative to project root
SCHEMA_PATH = os.path.join(
    os.path.dirname(__file__),  # features/games
    "..", "..",                 # go up to project root
    "schemas",
    "game_schema.json"
)

with open(SCHEMA_PATH, "r") as f:
    GAME_SCHEMA = json.load(f)

game_bp = Blueprint('game', __name__)
limiter.limit("200/minute")(game_bp)

# ----------- HTML views -----------

@game_bp.route('/list', methods=['GET'])
@require_auth
@team_required
def list_games_page():
    """Returns the template to view the list of games (without the games themselves)."""
    return render_template("games/list-games.html")

@game_bp.route('/view/<int:game_id>', methods=['GET'])
@require_auth
@team_required
def view_game_page(game_id):
    """Return the template to view a single game."""
    return render_template("games/view-game.html", game_id=game_id)

# ----------- JSON endpoints -----------

@game_bp.route('/list/json', methods=['GET'])
@require_auth
@team_required
def list_games_json():
    """Return JSON list of games, excluding game_data. Ordered by event_date desc (then id)."""
    games = game_repository.get_all_games_without_data(get_active_team_id())
    return jsonify([vars(game) for game in games])

def _empty_player_stats(players):
    """
    Build player_stats mapping based on roster players.
    Each player number -> empty stats dict.
    """
    stats_template = {
        "kills": [],
        "sets": [],
        "blocks": 0,
        "digs": 0,
        "aces": 0,
        "missed_serves": 0,
        "errors": 0
    }
    # must be string since it's used as a key
    return { str(p.number): dict(stats_template) for p in players }


def _make_empty_set(players):
    """
    Build an empty set structure following the JSON schema.
    """
    return {
        "score": {"team": 0, "opponent": 0},
        "team": {
            "starting_rotation": [None, None, None, None, None, None],
            "player_stats": _empty_player_stats(players)
        },
        "opponent": {
            "starting_rotation": [None, None, None, None, None, None],
            "player_stats": {}
        }
    }


def _make_default_game_data(players):
    """
    Build default game_data with 5 sets pre-populated.
    One extra set for total
    """
    return {
        "sets": [_make_empty_set(players) for _ in range(6)]
    }


@game_bp.route('/<int:game_id>', methods=['GET'])
@require_auth
@team_required
def get_game(game_id):
    """Return a single game including game_data, with default if missing."""
    try:
        game = get_game_internal(game_id)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 401
    if not game:
        return jsonify({"error": "Game not found"}), 404

    # If no game_data, populate with default
    if not game.game_data:
        players = get_players_by_roster_id(game.team_id)
        game.game_data = _make_default_game_data(players)

    return jsonify(vars(game))


def get_game_internal(game_id):
    """Return a single game including game_data."""
    game = game_repository.get_game_by_id(game_id)
    if game is not None and game.team_id != get_active_team_id():
        raise RuntimeError("Unauthorized")
    else:
        return game

@game_bp.route('/create', methods=['POST'])
@require_auth
@pre_authorize([Role.ADMIN, Role.COACH])
@team_required
def create_game():
    """Create a game from JSON payload."""
    try:
        data = request.get_json()
        game_data = data.get("game_data")  # optional
        opponent_name = data["opponent_name"]
        final_score = data.get("final_score")
        event_id = data.get("event_id")
        team_id = get_active_team_id()
        is_home = data.get("is_home", False)
        video_url = data.get("video_url")

        game = game_repository.create_game(game_data, opponent_name, final_score,
                                           event_id, team_id, is_home, video_url)
        return jsonify(vars(game)), 201
    except Exception as e:
        logger.error(f"Failed to create game: {e}")
        return jsonify({"error": "Failed to create game"}), 400

@game_bp.route('/update/<int:game_id>', methods=['POST'])
@require_auth
@pre_authorize([Role.ADMIN, Role.COACH])
@team_required
def update_game(game_id):
    """Update limited game details (event_id, video_url, final_score)."""
    try:
        game = get_game_internal(game_id)
    except RuntimeError as e:
        return jsonify({"error": e}), 401
    if not game:
        return jsonify({"error": "Game not found"}), 404
    try:
        data = request.get_json()
        event_id = data.get("event_id")
        video_url = data.get("video_url")
        final_score = data.get("final_score")

        game_repository.update_game_details(game_id, event_id, video_url, final_score)
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Failed to update game {game_id}: {e}")
        return jsonify({"error": "Failed to update game"}), 400

@game_bp.route('/update/game_data/<int:game_id>', methods=['POST'])
@require_auth
@pre_authorize([Role.ADMIN, Role.COACH])
@team_required
def update_game_data(game_id):
    """Update game_data with JSON schema validation."""
    try:
        game = get_game_internal(game_id)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 401
    if not game:
        return jsonify({"error": "Game not found"}), 404

    try:
        data = request.get_json(force=True)
        game_data = data.get("game_data")

        # Validate game_data against schema
        validate(instance=game_data, schema=GAME_SCHEMA)

        # Convert dict -> JSON string for MySQL
        game_data_str = json.dumps(game_data)

        game_repository.update_game_data(game_id, game_data_str)
        return jsonify({"success": True})
    except ValidationError as ve:
        return jsonify({"error": f"Invalid game data: {ve.message}"}), 400
    except Exception as e:
        logger.error(f"Failed to update game_data for game {game_id}: {e}")
        return jsonify({"error": "Failed to update game_data"}), 400

@game_bp.route('/delete/<int:game_id>', methods=['DELETE', 'POST'])
@require_auth
@pre_authorize([Role.ADMIN, Role.COACH])
@team_required
def delete_game(game_id):
    """Delete a game by id."""
    try:
        game = get_game_internal(game_id)
    except RuntimeError as e:
        return jsonify({"error": e}), 401
    if not game:
        return jsonify({"error": "Game not found"}), 404
    try:
        game_repository.delete_game(game_id)
        return jsonify({"success": True}), 200
    except Exception as e:
        logger.error(f"Failed to delete game {game_id}: {e}")
        return jsonify({"error": "Failed to delete game"}), 400

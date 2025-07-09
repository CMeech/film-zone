from config.config import getConfig
from features.teams import team_repository
from features.users import user_repository
from features.users.role import Role
from flask import Blueprint, flash, render_template, redirect, request
from libs.auth.pre_authorize import pre_authorize
from libs.auth.require_auth import require_auth
from libs.hash.generate_token import generate_token
from libs.security.rate_limit import limiter
from libs.logging.logging import logger

user_bp = Blueprint('user', __name__)
limiter.limit("100/minute")(user_bp)

@user_bp.route('/list', methods=['GET'])
@require_auth
@pre_authorize([Role.ADMIN])
def get_user_list():
    users = user_repository.get_all_users()
    return render_template('user/list-users.html', users=users)

@user_bp.route('/initialize', methods=['GET'])
def initialize_admin():
    try:
        initialized = user_repository.admin_exists()
        if initialized:
            logger.debug("Admin already initialized")
        else:
            logger.info(f"Initializing admin with role {Role.ADMIN}")
            password = getConfig().ADMIN_PASSWORD
            user_repository.create_user(
                getConfig().ADMIN_USERNAME,
                generate_token(password),
                Role.ADMIN
            )
        return redirect("/dashboard")
    except Exception as e:
        logger.error(f"Failed to initialize admin: {e}")
        error_message = "Failed to initialize admin."
        flash(error_message)
        return render_template('error/error.html', error_message=error_message)

@user_bp.route('/register', methods=['GET', 'POST'])
@require_auth
@pre_authorize([Role.ADMIN])
def register_user():
    if request.method == 'POST':
        username = None
        try: 
            username = request.form['username']
            password = request.form['password']
            password_hash = generate_token(password)
            user_repository.create_user(username, password_hash, Role.COACH)
            flash(f"User {username} registered successfully.")
        except Exception as e:
            logger.error(f"Failed to register user with username {username}: {e}")
            error_message = "Failed to register user."
            flash(error_message)
    return render_template('user/register-user.html')

@user_bp.route('/register/player', methods=['GET', 'POST'])
@require_auth
@pre_authorize([Role.ADMIN])
def register_player():
    if request.method == 'POST':
        team_id = None
        try:
            password = request.form['password']
            team_id = request.form['teamId']
            password_hash = generate_token(password)
            player = user_repository.create_access_code(password_hash, Role.PLAYER)
            team_repository.link_team_to_user(team_id, player.id)
            flash(f"Player access code registered successfully for team with id {team_id}")
        except Exception as e:
            logger.error(f"Failed to register player for team with id {team_id}: {e}")
            error_message = "Failed to register player."
            flash(error_message)
    return render_template('user/register-player.html')

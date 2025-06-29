from config.config import getConfig
from features.users import user_repository
from features.users.role import Role
from flask import Blueprint, flash, render_template, redirect, request
from libs.auth.pre_authorize import pre_authorize
from libs.auth.require_auth import require_auth
from libs.context.user_context import get_user_profile
from libs.hash.generate_token import generate_token
from libs.security.rate_limit import limiter
from libs.logging.logging import logger

user_bp = Blueprint('user', __name__)
limiter.limit("100/minute")(user_bp)

@user_bp.route('/list', methods=['GET'])
@require_auth
@pre_authorize([Role.COACH, Role.ADMIN])
def get_user_list():
    current_user = get_user_profile()
    if (current_user.role == Role.ADMIN):
        users = user_repository.get_all_users()
    else:
        users = user_repository.get_all_players()
    return render_template('user/list-users.html', users=users)

# use jsonify for JSON APIs

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
        try: 
            username = request.form['username']
            password = request.form['password']
            password_hash = generate_token(password)
            user_repository.create_user(username, password_hash, Role.COACH)
            flash("User registered successfully.")
        except Exception as e:
            logger.error(f"Failed to register user: {e}")
            error_message = "Failed to register user."
            flash(error_message)
            # Probably just send back to the form with error instead of error.html
            return render_template('error/error.html', error_message=error_message)
    # Add team context
    return render_template('user/register-user.html')

@user_bp.route('/register/player', methods=['GET', 'POST'])
@require_auth
@pre_authorize([Role.COACH, Role.ADMIN])
def register_player():
    if request.method == 'POST':
        try:
            password = request.form['password']
            team_id = request.form['team_id']
            password_hash = generate_token(password)
            user_repository.create_access_code(password_hash, Role.PLAYER)
            # Link to team here!
            # Create separate endpoint as well for linking player to team
            return redirect('/dashboard')
        except Exception as e:
            logger.error(f"Failed to register player: {e}")
            error_message = "Failed to register player."
            flash(error_message)
            # Probably just send back to the form with error instead of error.html
            return render_template('error/error.html', error_message=error_message)
    # needs team contexts...
    return render_template('user/register-player.html')

from flask import Blueprint, flash, render_template, request, redirect, session, make_response

from libs.auth.set_team import set_team_header
from libs.hash.generate_token import generate_token
from libs.security.rate_limit import limiter
from features.auth.auth_service import authenticate_player_login, authenticate_coach_login

auth_bp = Blueprint('auth', __name__)
limiter.limit("100/minute")(auth_bp)

@auth_bp.route('/login/access', methods=['GET', 'POST'])
def access_login():
    if request.method == 'POST':
        access_code = request.form['password']
        code_hash = generate_token(access_code)
        user_profile = authenticate_player_login(code_hash)
        if user_profile is not None:
            latest_team_id = user_profile.team_ids[0] if len(user_profile.team_ids) > 0 else None
            session['auth_token'] = user_profile.token
            session.permanent = True
            response = make_response(redirect('/dashboard'))
            if latest_team_id is not None:
                response.set_cookie('activeTeamId', str(latest_team_id))
            return response
        else:
            error_message = 'Access code is not valid'
            flash(error_message)
            return render_template('auth/login-access.html', error_message=error_message)
    return render_template('auth/login-access.html')

@auth_bp.route('/login/user', methods=['GET', 'POST'])
def user_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        password_hash = generate_token(password)
        user_profile = authenticate_coach_login(username, password_hash)
        if user_profile is not None:
            latest_team_id = user_profile.team_ids[0] if len(user_profile.team_ids) > 0 else None
            session['auth_token'] = user_profile.token
            session.permanent = True
            response = make_response(redirect('/dashboard'))
            if latest_team_id is not None:
                set_team_header(latest_team_id, response)
            return response
        else:
            error_message = 'User crendentials are not valid'
            flash(error_message)
            return render_template('auth/login-user.html', error_message=error_message)
    return render_template('auth/login-user.html')

@auth_bp.route('/logout', methods=['GET'])
def logout():
    session.pop('auth_token', None)
    return redirect('/')
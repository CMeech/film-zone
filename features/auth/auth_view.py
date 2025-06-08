from flask import Blueprint, flash, render_template, request, redirect, session
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
        token = authenticate_player_login(code_hash)
        if token is not None:
            session['auth_token'] = token
            session.permanent = True
            return redirect('/dashboard')
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
        token = authenticate_coach_login(username, password_hash)
        if token is not None:
            session['auth_token'] = token
            session.permanent = True
            return redirect('/dashboard')
        else:
            error_message = 'User crendentials are not valid'
            flash(error_message)
            return render_template('auth/login-user.html', error_message=error_message)
    return render_template('auth/login-user.html')
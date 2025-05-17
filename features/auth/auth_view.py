from config.config import getConfig
from flask import Blueprint, render_template, request, redirect, session
from libs.hash.generate_token import generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        pwd = request.form['password']
        if pwd == getConfig().ACCESS_PASSWORD:
            session['auth_token'] = generate_token(pwd)
            session.permanent = True
            return redirect('/dashboard')
        else:
            return "Invalid password", 401
    return render_template('auth/login.html')
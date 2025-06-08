from config.config import getConfig
from flask import Blueprint, render_template, request, redirect, session
from libs.hash.generate_token import generate_token
from libs.security.rate_limit import limiter

user_bp = Blueprint('user', __name__)
limiter.limit("100/minute")(user_bp)

# @auth_bp.route('/login', methods=['GET', 'POST'])
# def get_current_user():
#     if request.method == 'POST':
#         pwd = request.form['password']
#         if pwd == getConfig().ACCESS_PASSWORD:
#             session['auth_token'] = generate_token(pwd)
#             session.permanent = True
#             return redirect('/dashboard')
#         else:
#             return "Invalid password", 401
#     return render_template('auth/login.html')

# Unused - left for reference for ModelView development
# class UserView(MethodView):
#     def get(self):
#         pass

#     def post(self):
#         pass


# @app.route('/add', methods=['POST'])
# @require_auth
# def add_stat():
#     player = request.form['player']
#     kills = int(request.form['kills'])
#     blocks = int(request.form['blocks'])
#     aces = int(request.form['aces'])

#     conn = sqlite3.connect(DB_FILE)
#     c = conn.cursor()
#     c.execute('INSERT INTO stats (player, kills, blocks, aces) VALUES (?, ?, ?, ?)',
#               (player, kills, blocks, aces))
#     conn.commit()
#     conn.close()
#     return redirect('/')

# @app.route('/api/stats', methods=['POST'])
# def api_add_stat():
#     token = request.headers.get('X-Access-Token')
#     if token != generate_token(ACCESS_PASSWORD):
#         return {"error": "Unauthorized"}, 401

#     data = request.json
#     conn = sqlite3.connect(DB_FILE)
#     c = conn.cursor()
#     c.execute('INSERT INTO stats (player, kills, blocks, aces) VALUES (?, ?, ?, ?)',
#               (data['player'], data['kills'], data['blocks'], data['aces']))
#     conn.commit()
#     conn.close()
#     return {"message": "Stat added"}, 200
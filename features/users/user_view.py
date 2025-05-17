from flask.views import MethodView
from flask import render_template

class UserView(MethodView):
    def get(self):
        return render_template("dashboard/index.html")

    def post(self):
        # handle form submission
        pass


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
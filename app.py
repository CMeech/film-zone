
from flask import Flask, render_template, request, redirect, session, jsonify
import sqlite3
import hashlib
from functools import wraps

app = Flask(__name__)
app.secret_key = "super_secret_session_key"  # Use env variable
DB_FILE = 'stats-data/stats.db'
ACCESS_PASSWORD = "letmein123"  # Use DB for this later

def generate_token(password):
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player TEXT NOT NULL,
            kills INTEGER DEFAULT 0,
            blocks INTEGER DEFAULT 0,
            aces INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = session.get('auth_token')
        if token != generate_token(ACCESS_PASSWORD):
            return redirect('/login')
        return f(*args, **kwargs)
    return wrapper

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        pwd = request.form['password']
        if pwd == ACCESS_PASSWORD:
            session['auth_token'] = generate_token(pwd)
            return redirect('/')
        else:
            return "Invalid password", 401
    return render_template('login.html')

@app.route('/')
@require_auth
def index():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT * FROM stats')
    stats = c.fetchall()
    conn.close()
    video_id = "dQw4w9WgXcQ"  # Replace with your desired YouTube video ID
    return render_template('index.html', stats=stats, video_id=video_id)

@app.route('/add', methods=['POST'])
@require_auth
def add_stat():
    player = request.form['player']
    kills = int(request.form['kills'])
    blocks = int(request.form['blocks'])
    aces = int(request.form['aces'])

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('INSERT INTO stats (player, kills, blocks, aces) VALUES (?, ?, ?, ?)',
              (player, kills, blocks, aces))
    conn.commit()
    conn.close()
    return redirect('/')

@app.route('/api/stats', methods=['POST'])
def api_add_stat():
    token = request.headers.get('X-Access-Token')
    if token != generate_token(ACCESS_PASSWORD):
        return {"error": "Unauthorized"}, 401

    data = request.json
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('INSERT INTO stats (player, kills, blocks, aces) VALUES (?, ?, ?, ?)',
              (data['player'], data['kills'], data['blocks'], data['aces']))
    conn.commit()
    conn.close()
    return {"message": "Stat added"}, 200

@app.route('/health')
def health():
    return "OK", 200

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)

from features.db.db import get_connection
from flask import Blueprint, render_template
import sqlite3

from libs.auth.require_auth import require_auth

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/', methods=['GET'])
@require_auth
def index():
    # conn = get_connection()
    # c = conn.cursor()
    # c.execute('SELECT * FROM stats')
    # stats = c.fetchall()
    # conn.close()
    return render_template('dashboard/dashboard.html')
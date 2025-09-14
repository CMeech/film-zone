from flask import Blueprint, render_template

from libs.auth.require_auth import require_auth
from libs.security.rate_limit import limiter

dashboard_bp = Blueprint('dashboard', __name__)
limiter.limit("120/minute")(dashboard_bp)

@dashboard_bp.route('/', methods=['GET'])
@require_auth
def index():
    return render_template('dashboard/dashboard.html')
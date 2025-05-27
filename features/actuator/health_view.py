
from flask import Blueprint
from libs.security.rate_limit import limiter

health_bp = Blueprint('health', __name__)
limiter.limit("10/minute")(health_bp)

@health_bp.route('/health', methods=['GET'])
def health():
    return "OK", 200
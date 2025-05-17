
from flask import Blueprint, render_template

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health():
    return "OK", 200
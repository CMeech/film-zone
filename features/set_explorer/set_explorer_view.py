from flask import Blueprint, render_template

from libs.auth.require_auth import require_auth
from libs.security.rate_limit import limiter


set_explorer_bp = Blueprint("set_explorer", __name__)
limiter.limit("120/minute")(set_explorer_bp)


@set_explorer_bp.route("/", methods=["GET"])
@require_auth
def index():
    return render_template("set-explorer/set-explorer.html")

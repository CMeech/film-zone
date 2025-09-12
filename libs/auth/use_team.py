from flask import flash, render_template, request
from functools import wraps

from libs.context.user_context import set_active_team_id, get_user_profile



def use_team(f):
    """
    Decorator to acquire an active team context
    Team ID comes from the cookie header activeTeamId
    But does not throw error if not present
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        active_team_id = request.cookies.get('activeTeamId')

        try:
            active_team_id = int(active_team_id)
        except ValueError:
            flash('Invalid team ID format.')
            return render_template('error/error.html')

        user_profile = get_user_profile()
        if (active_team_id not in user_profile.team_ids):
            flash('You are not authorized to access this team.')
            return render_template('error/error.html')
        set_active_team_id(active_team_id)
        return f(*args, **kwargs)
    return wrapper
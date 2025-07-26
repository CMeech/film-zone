from features.actuator.health_view import health_bp
from features.announcements.announcements_view import announcement_bp
from features.dashboard.dashboard_view import dashboard_bp
from features.auth.auth_view import auth_bp
from features.resources.resource_view import resource_bp
from features.rosters.rosters_view import roster_bp
from features.teams.team_view import team_bp
from features.users.user_view import user_bp
from libs.logging.logging import logger
from flask import Flask, redirect, url_for


def register_views(app: Flask):
    try:
        # Dashboard
        app.register_blueprint(dashboard_bp, url_prefix='/dashboard')

        # E.g: Parameterized rule for ModelView
        # user_view = UserView.as_view('user_view')
        # app.add_url_rule('/user/<int:user_id>', view_func=user_view, methods=['GET']) 

        # User
        app.register_blueprint(user_bp, url_prefix='/user')

        # Actuator
        app.register_blueprint(health_bp, url_prefix='/actuator')

        # Auth
        app.register_blueprint(auth_bp, url_prefix='/auth')

        # Team
        app.register_blueprint(team_bp, url_prefix='/team')

        # Roster
        app.register_blueprint(roster_bp, url_prefix='/roster')

        # Announcements
        app.register_blueprint(announcement_bp, url_prefix='/announcements')

        # Resources
        app.register_blueprint(resource_bp, url_prefix='/resources')

        # Catch-all route for unregistered URLs
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def catch_all(path):
            return redirect(url_for('dashboard.index'))

        logger.info("Views registered successfully")
    except Exception as e:
        logger.fatal(f"Failed to register views: {e}")
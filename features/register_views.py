from features.actuator.health_view import health_bp
from features.dashboard.dashboard_view import dashboard_bp
from features.auth.auth_view import auth_bp
from libs.logging.logging import logger

def register_views(app):
    try: 
        # Dashboard
        app.register_blueprint(dashboard_bp, url_prefix='/dashboard')

        # Users

        # user_view = UserView.as_view('user_view')
        # app.add_url_rule('/user', view_func=user_view, methods=['POST'])
        # E.g: Parameterized rule for ModelView
        # app.add_url_rule('/user/<int:user_id>', view_func=user_view, methods=['GET'])   

        # Actuator
        app.register_blueprint(health_bp, url_prefix='/actuator')

        # Auth
        app.register_blueprint(auth_bp, url_prefix='/auth')

        logger.info("Views registered successfully")
    except Exception as e:
        logger.fatal(f"Failed to register views: {e}")
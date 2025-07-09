from flask import Flask
from libs.init.init_app import setup_app

def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    setup_app(app)
    return app


app = create_app()

# this will not run if using gunicorn and that's okay
# gunicorn will handle this for us
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

from flask import Flask
from libs.init.init_app import setup_app

def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    setup_app(app)
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)

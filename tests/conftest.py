
import pytest
from flask import Flask
from libs.init.init_app import setup_app

# Fixtures in this file are auto-detected for all test files
# There is no need to import this file in them

def create_test_app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    setup_app(app)
    return app

@pytest.fixture()
def app():
    app = create_test_app()
    app.config.update({
        "TESTING": True,
    })

    # other setup can go here

    yield app

    # clean up / reset resources here


@pytest.fixture()
def client(app):
    with app.test_client() as client:
        yield client


@pytest.fixture()
def runner(app):
    with app.test_cli_runner() as runner:
        yield runner
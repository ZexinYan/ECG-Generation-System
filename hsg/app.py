import argparse
import json
from context import Context
from flask import Flask, render_template, request, url_for, redirect, Response, send_file, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, current_user, logout_user
from flask_restful import Api
from flask_jwt_extended import JWTManager, create_access_token
from hsg.utils.logger import get_root_logger
from version import __version__
from hsg.database.user import UserTable
from hsg.blueprints.user import User
from hsg.blueprints.csv import CSV

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'HSG-SECRETE-KEY'
jwt = JWTManager(app)
api = Api(app)

logger = None

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.session_protection = 'strong'

user_table = UserTable()


@app.route('/login', methods=['POST'])
def login():
    email = request.json.get('email')
    password = request.json.get('password')
    user_list = user_table.find({"email": email})
    if len(user_list) != 1:
        return jsonify({'message': "Invalid username or password"}), 401
    elif user_list[0]['password'] == password:
        access_token = create_access_token(identity=email)
        return jsonify(access_token=access_token), 200


api.add_resource(User, '/user', '/user/<ID>')
api.add_resource(CSV, '/csv', '/csv/<ID>')

parser = argparse.ArgumentParser()
parser.add_argument('--config')
args = parser.parse_args()

if __name__ == '__main__':
    with open(args.config, 'r') as r:
        config = json.load(r)
    Context.HOST = config['host']
    Context.PORT = config['port']
    logger = get_root_logger(name='werkzeug', log_file='./outputs/{}.log'.format(__version__))
    app.run(host=Context.HOST, port=Context.PORT)

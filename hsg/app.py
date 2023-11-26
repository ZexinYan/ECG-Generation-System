import os
import argparse
import json
import redis
from context import Context
from bson import ObjectId
from flask import Flask, render_template, request, url_for, redirect, Response, send_file, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, current_user, logout_user
from flask_restful import Api
from hsg.utils.logger import get_root_logger
from version import __version__
from hsg.database.user import UserTable
from hsg.blueprints.prompt import prompt_bp, CSV
from hsg.blueprints.generated import GeneratedSequence

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'HSG-SECRETE-KEY'
api = Api(app)
app.secret_key = os.urandom(24)  # 设置表单交互密钥

logger = None

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.session_protection = 'strong'

user_table = UserTable()


class User(UserMixin):
    def __init__(self, user):
        self.username = user.get('username')
        self.email = user.get('email')
        self.password = user.get('password')
        self.id = user.get('_id')

    def verify_password(self, password):
        return password == self.password

    def get_id(self):
        return self.id

    @staticmethod
    def get(user_id):
        results = user_table.find({'_id': ObjectId(user_id)})
        if len(results) == 1:
            return User(results[0])
        return None


@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id=user_id)


@app.context_processor
def user_config():
    try:
        print(f'current_user: {current_user.email}')
        return dict(
            id=current_user.id,
            username=current_user.username,
            email=current_user.email
        )
    except Exception as err:
        print(err)
        return dict()


@app.route('/login', methods=['GET', 'POST'])
@app.route('/login.htm')
def login():
    email = request.form.get('email', None)
    password = request.form.get('password', None)
    msg = ''
    if email is not None and password is not None:
        user_info = user_table.find({'email': email})[0]
        user = User(user_info)
        if user.verify_password(password):
            login_user(user)
            return redirect(request.args.get('next') or url_for('index'))
        else:
            msg = 'Invalid Information.'
    return render_template('login.html', msg=msg)


@app.route('/logout', methods=['GET'])
@login_required
def logout():
    logout_user()
    return redirect('login')


@app.route('/register', methods=['GET', 'POST'])
@app.route('/register.html')
def register():
    email = request.form.get('email', None)
    username = request.form.get('username', None)
    password = request.form.get('password', None)
    msg = ''
    if email is not None and password is not None and username is not None:
        try:
            user_table.insert_one({
                'email': email,
                'username': username,
                'password': password
            })
            return redirect(url_for('login'))
        except Exception as err:
            print(f'err: {err}')
            msg = 'Invalid Information.'
    return render_template('register.html', msg=msg)


@app.route('/index')
@app.route('/')
@login_required
def index():
    return redirect(url_for('prompt.index'))


api.add_resource(CSV, '/prompt/csv/', '/prompt/csv/<ID>')
api.add_resource(GeneratedSequence, '/generated_sequence/', '/generated_sequence/<ID>')
app.register_blueprint(prompt_bp, url_prefix='/prompt', static_folder='static')

parser = argparse.ArgumentParser()
parser.add_argument('--config')
args = parser.parse_args()


if __name__ == '__main__':
    with open(args.config, 'r') as r:
        config = json.load(r)
    Context.HOST = config['HOST']
    Context.PORT = config['PORT']
    Context.REDIS_HOST = config.get('REDIS_HOST', 'localhost')
    Context.REDIS_PORT = config.get('REDIS_PORT', 10088)
    logger = get_root_logger(name='werkzeug', log_file='./outputs/{}.log'.format(__version__))
    app.run(host=Context.HOST, port=Context.PORT, threaded=True)

import argparse
import json
from context import Context
from flask import Flask, render_template, request, url_for, redirect, Response, send_file
from flask_login import LoginManager, UserMixin, login_user, login_required, current_user, logout_user
from hsg.utils.logger import get_root_logger
from version import __version__
from hsg.database.user import UserTable

app = Flask(__name__)
logger = None

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.session_protection = 'strong'

user_table = UserTable()


class User(UserMixin):
    def __init__(self, user):
        self._id = user.get('_id')
        self.username = user.get('username')
        self.phone = user.get('phone')

    def get_id(self):
        return self._id

    @staticmethod
    def get(_id):
        if _id is None:
            return None
        user_list = user_table.find({"_id": _id})
        if len(user_list) == 1:
            user_cfg = user_list[0]
            return User(user_cfg)
        return None


@login_manager.user_loader  # 定义获取登录用户的方法
def load_user(user_id):
    return User.get(user_id)


@app.route('/login')
@app.route('/login.html')
def login():
    next = request.args.get('next', '/index')
    next = next.replace('?', ';')
    return redirect(f'https://fortress.smoa.cloud/login?'
                    f'appId={Context.APP_ID}&serviceUrl=http://{Context.HOST}:{Context.PORT}/api/login?next={next}')


@app.route('/api/logout', methods=['GET'])
@login_required
def logout():
    logout_user()
    return redirect('/index')


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

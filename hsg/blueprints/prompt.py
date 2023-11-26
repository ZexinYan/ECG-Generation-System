import time
from bson import ObjectId
from flask_restful import Resource
from hsg.database.user import UserTable
from hsg.utils.response import response
from hsg.database.csv import CSVTable
from flask import render_template, request, Blueprint
from flask_login import login_required, current_user
from hsg.utils.utils import time_zone_conversion

csv_table = CSVTable()
user_table = UserTable()
SAVE_PATH = './csv'

prompt_bp = Blueprint('prompt', __name__)


@prompt_bp.route('/index')
@login_required
def index():
    return render_template('prompt/index.html')


@prompt_bp.route('/detail/<ID>')
@login_required
def detail(ID):
    info = csv_table.find({'_id': ObjectId(ID)})[0]
    sequence = []
    with open(f'./csv/{ID}.csv', 'r') as r:
        for line in r.readlines():
            if len(line.strip()[:-1]) > 0:
                sequence.append(float(line.strip()[:-1]))
    labels = list(range(len(sequence)))
    return render_template('prompt/detail.html',
                           info=info,
                           prompt_sequence=sequence,
                           labels=labels)


class CSV(Resource):

    @login_required
    def get(self, ID=None):
        if ID is None:
            user_id = current_user.id
            csv_list = csv_table.find({'owner': user_id})
            return response(status=200, message={
                'csv_list': csv_list
            })
        else:
            csv_list = csv_table.find({'_id': ObjectId(ID)})
            user_id = current_user.id
            if csv_list[0]['owner'] == user_id:
                return response(status=200, message={
                    'csv_list': csv_list
                })
            else:
                return response(status=404, message="CSV not found.")

    @login_required
    def post(self, **kwargs):
        comment = request.form.get('comment')
        file = request.files.get('file')
        if file and file.filename.endswith('.csv'):
            try:
                id = csv_table.insert_one({
                    'comment': comment,
                    'upload_time': time_zone_conversion(time.time()),
                    'owner': current_user.id
                })
                file.save(f'{SAVE_PATH}/{id}.csv')
                return response(status=200)
            except Exception as _:
                return response(status=401, message='Upload Failed.')
        else:
            return response(status=401, message='Invalid file. Only CSV files are allowed.')

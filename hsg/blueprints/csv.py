import time
from bson import ObjectId
from flask_restful import Resource, reqparse
from hsg.database.user import UserTable
from hsg.utils.response import response
from hsg.database.csv import CSVTable
from hsg.utils.utils import time_zone_conversion
from werkzeug.datastructures import FileStorage
from flask_jwt_extended import get_jwt_identity, jwt_required

csv_table = CSVTable.table()
user_table = UserTable.table()
SAVE_PATH = './csv'


class CSV(Resource):
    @jwt_required()
    def get(self):
        current_user = get_jwt_identity()
        user_info = user_table.find({'email': current_user})[0]
        csv_list = csv_table.find({'owner': user_info['_id']})
        return response(status=200, message={
            'csv_list': csv_list
        })

    @jwt_required()
    def get(self, ID):
        current_user = get_jwt_identity()
        user_info = user_table.find({'email': current_user})[0]
        csv_list = csv_table.find({'_id': ObjectId(ID)})
        if csv_list[0]['owner'] == user_info['_id']:
            return response(status=200, message={
                'csv_list': csv_list
            })
        else:
            return response(status=404, message="CSV not found.")

    @jwt_required()
    def post(self, **kwargs):
        current_user = get_jwt_identity()
        parser = reqparse.RequestParser()
        parser.add_argument('filename', type=str, required=True)
        parser.add_argument('owner', type=str, required=True)
        parser.add_argument('file', type=FileStorage, location='files')
        args = parser.parse_args()
        file = args.file
        if file and file.filename.endswith('.csv'):
            try:
                user_info = user_table.find({'email': current_user})[0]
                id = csv_table.insert_one({
                    'filename': args.filename,
                    'upload_time': time_zone_conversion(time.time()),
                    'owner': user_info['_id']
                })
                file.save(f'{SAVE_PATH}/{id}.csv')
                return response(status=200)
            except Exception as _:
                return response(status=401, message='Upload Failed.')
        else:
            return response(status=401, message='Invalid file. Only CSV files are allowed.')

    @jwt_required()
    def delete(self, ID):
        current_user = get_jwt_identity()
        user_info = user_table.find({'email': current_user})[0]
        csv_list = csv_table.find({'_id': ObjectId(ID)})
        if csv_list[0]['owner'] == user_info['_id']:
            csv_table.delete_one({'_id': ObjectId(ID)})
            return response(status=200, message='Delete succeed.')
        else:
            return response(status=404, message='Delete failed.')

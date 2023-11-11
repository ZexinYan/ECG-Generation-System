from flask_restful import Resource, reqparse
from flask_jwt_extended import get_jwt_identity, jwt_required
from hsg.database.user import UserTable
from hsg.utils.response import response

user_table = UserTable()


class User(Resource):
    @jwt_required()  # 要求用户在请求中提供有效的 JWT
    def get(self, ID):
        current_user = get_jwt_identity()
        try:
            user_list = user_table.find(condition={'email': current_user})
            if len(user_list) != 1 or user_list[0]['_id'] != ID:
                return response(status=401, message="Invalid user.")
            else:
                user_info = user_list[0]
                del user_info['password']
                return response(status=200, message={'user_info': user_info})
        except Exception as _:
            return response(status=401, message="Invalid user.")

    def post(self, **kwargs):
        parser = reqparse.RequestParser()
        parser.add_argument('username', type=str, required=True)
        parser.add_argument('password', type=str, required=True)
        parser.add_argument('email', type=str, required=True)
        parser.add_argument('phone', type=str, required=True)
        args = parser.parse_args()
        try:
            user_table.insert_one({
                'username': args.username,
                'password': args.password,
                'phone': args.phone,
                'email': args.email
            })
            return response(status=200)
        except Exception as _:
            return response(status=401, message='Invalid user information.')

    def delete(self, ID):
        try:
            user_table.delete_one(ID)
            return response(status=200)
        except Exception as _:
            return response(status=401, message='Invalid request.')

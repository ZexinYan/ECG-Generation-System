import json
import redis
from flask_restful import Resource, reqparse
from hsg.utils.response import response
from hsg.context import Context
from hsg.database.generated import GeneratedTable

generated_table = GeneratedTable()


class GeneratedSequence(Resource):
    def get(self, ID=None):
        result_list = generated_table.find({'prompt_id': ID})
        return response(status=200, message={
            'sequences': result_list
        })

    def post(self, **kwargs):
        redis_client = redis.Redis(host=Context.REDIS_HOST, port=int(Context.REDIS_PORT), db=0)
        parser = reqparse.RequestParser()
        parser.add_argument('prompt_id', type=str, required=True)
        args = parser.parse_args()
        redis_client.lpush('generated_queue', json.dumps({
            'prompt_id': args.prompt_id
        }))
        return response(status=200)

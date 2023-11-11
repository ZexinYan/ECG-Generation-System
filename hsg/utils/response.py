import json
from flask import Response


def response(message='', status=200):
    return Response(status=status, response=json.dumps({
        'message': message
    }), mimetype='application/json')


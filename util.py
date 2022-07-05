from functools import wraps
from flask import jsonify, session


def login_required(func):
    @wraps(func)
    def wrap(*args, **kwargs):
        if 'username' in session:
            return func(*args, **kwargs)
        else:
            return jsonify({"message": "You need to login first"}), 403

    return wrap

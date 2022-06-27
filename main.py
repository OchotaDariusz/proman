from flask import Flask, render_template, url_for, redirect, session, request, jsonify
from flask_socketio import SocketIO, send
from flask_cors import CORS
from dotenv import load_dotenv

import auth
from util import json_response
import mimetypes
import queries

mimetypes.add_type('application/javascript', '.js')
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app)
app.secret_key = '9232b3e6634925ae2e068c9810e53f4c10faef6e4ff17fb4'
load_dotenv()


@app.route("/")
def index():
    """
    This is a one-pager which shows all the boards and cards
    """
    all_statuses = queries.get_statuses()
    return render_template('index.html', user=queries.get_user_by_username(session.get('username')),
                           all_statuses=all_statuses)


@app.route("/api/users/<int:user_id>/boards")
@json_response
def get_boards(user_id: int):
    """
    All the boards
    """
    return queries.get_boards(user_id)


@app.route("/api/users/<int:user_id>/boards/<int:board_id>")
@json_response
def get_board(user_id: int, board_id: int):
    return queries.get_board(user_id, board_id)


@app.route("/api/users/<int:user_id>/boards/<int:board_id>", methods=['PATCH'])
@json_response
def patch_rename_board(user_id: int, board_id: int):
    board_title = request.get_json()
    return queries.rename_board(board_id, board_title['boardTitle'], user_id)


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards/")
@json_response
def get_cards_for_board(user_id: int, board_id: int):
    """
    All cards that belongs to a board
    :param user_id: id of the current user
    :param board_id: id of the parent board
    """
    return queries.get_cards_for_board(user_id, board_id)


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards", methods=['POST'])
@json_response
def post_create_card_for_board(user_id: int, board_id: int):
    card_details = request.get_json()
    return queries.create_new_card(board_id, card_details, user_id)


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards/<int:card_id>", methods=['DELETE'])
@json_response
def delete_card_from_board(user_id: int, board_id: int, card_id: int):
    return queries.remove_card(board_id, card_id, user_id)


@app.route('/register', methods=['POST'])
def post_register_page():
    user_data = request.get_json()
    username = user_data['username']
    password_1 = user_data['password']
    password_2 = user_data['password2']
    if not queries.get_user_by_username(username):
        if password_1 == password_2:
            new_user = {'username': username,
                        'password': auth.hash_password(password_1)}
            queries.add_new_user(new_user)
            session['username'] = username
            user = queries.get_user_by_username(username)
            return jsonify({'user_id': user['id']}), 200
        return jsonify({'message': "Passwords do not match!"}), 403
    return jsonify({'message': "User already exists!"}), 409


@app.route('/login', methods=['POST'])
def post_login_page():
    user_data = request.get_json()
    username = user_data['username']
    password = user_data['password']
    user = queries.get_user_by_username(username)
    if user and auth.verify_password(password, user['password']):
        session['username'] = username
        return jsonify({'user_id': user['id']}), 200
    return jsonify({'message': 'Wrong credentials!'}), 401


@app.route('/logout', methods=['POST'])
def post_logout():
    session.pop('username', None)
    return jsonify({'message': 'Logged out successfully.'}), 200


@app.route('/api/statuses')
@json_response
def get_statuses():
    return queries.get_statuses()


@app.route('/api/statuses/<int:status_id>')
@json_response
def get_status(status_id):
    return queries.get_card_status(status_id)


@app.route("/api/users/<int:user_id>/boards", methods=["POST"])
@json_response
def post_new_board(user_id):
    data = request.get_json()
    queries.add_new_board(data['boardTitle'], data['public_private'], user_id)


@app.route("/api/users/<int:user_id>/boards/<int:board_id>", methods=["DELETE"])
@json_response
def delete_board(user_id: int, board_id: int):
    return queries.delete_board(board_id, user_id)


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards/<int:card_id>", methods=['PATCH'])
@json_response
def patch_rename_card(user_id: int, board_id: int, card_id: int):
    new_card_title = request.get_json()
    return queries.rename_card(board_id, card_id, new_card_title['cardTitle'], user_id)


@socketio.on('message')
def handle_msg(msg):
    socketio.send('Syncing...')


def main():
    # app.run(debug=True)
    socketio.run(app)

    # Serving the favicon
    with app.app_context():
        app.add_url_rule('/favicon.ico', redirect_to=url_for('static', filename='favicon/favicon.ico'))


if __name__ == '__main__':
    main()

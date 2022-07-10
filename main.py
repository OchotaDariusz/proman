from dotenv import load_dotenv
from os import environ

from flask import Flask, render_template, url_for, session, request, jsonify, make_response, send_from_directory
from flask_socketio import SocketIO
from flask_cors import CORS
import mimetypes

import auth
import queries

load_dotenv()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/html', '.html')
mimetypes.add_type('application/json', '.json')
app = Flask(__name__)
app.secret_key = environ.get('SECRET_KEY')
CORS(app)
socketio = SocketIO(app)


@app.route("/")
def index():
    """
    This is a one-pager which shows all the boards and cards
    :returns: html_page, status_code
    """
    return render_template('index.html',
                           user=queries.get_user_by_username(session.get('username')),
                           socket_host=environ.get('SOCKET_HOST')), 200


@app.route('/register', methods=['POST'])
def post_register():
    """
    Register user in database
    :returns: json_object, status_code
    """
    user_details = request.get_json()
    username = user_details.get('username')
    password_1 = user_details.get('password')
    password_2 = user_details.get('password2')
    if not queries.get_user_by_username(username):
        if password_1 == password_2:
            queries.add_new_user({'username': username, 'password': auth.hash_password(password_1)})
            session['username'] = username
            return jsonify({'user_id': queries.get_user_by_username(session.get('username')).get('id'),
                            'message': 'Successfully registered. You are now logged in.'}), 201
        return jsonify({'message': "Passwords do not match!"}), 403
    return jsonify({'message': "User already exists!"}), 409


@app.route('/login', methods=['POST'])
def post_login():
    """
    Login user
    :returns: json_object, status_code
    """
    user_details = request.get_json()
    username = user_details.get('username')
    password = user_details.get('password')
    user = queries.get_user_by_username(username)
    if user:
        if auth.verify_password(password, user.get('password')):
            session['username'] = username
            return jsonify({'user_id': user.get('id'), 'message': 'Successfully logged in.'}), 202
        return jsonify({'message': 'Wrong password!'}), 401
    return jsonify({'message': 'User not found!'}), 404


@app.route('/logout', methods=['POST'])
@auth.login_required
def post_logout():
    """
    Logout user
    :returns: json_object, status_code
    """
    session.clear()
    return jsonify({'message': 'Logged out successfully.'}), 200


@app.route("/api/users/<int:user_id>/boards")
def get_boards(user_id: int):
    """
    All the boards
    :param user_id: id of the current user
    :returns: json_object, status_code
    """
    return jsonify(queries.get_boards(user_id)), 200


@app.route("/api/users/<int:user_id>/boards", methods=["POST"])
@auth.login_required
def post_create_board(user_id: int):
    """
    Create new board
    :param user_id: id of the current user
    :returns: json_object, status_code
    """
    data = request.get_json()
    queries.add_new_board(data.get('boardTitle'), (data.get('public_private') == 'public'), user_id)
    return jsonify({'message': 'Successfully created.'}), 201


@app.route("/api/users/<int:user_id>/boards/<int:board_id>", methods=['PATCH'])
@auth.login_required
def patch_rename_board(user_id: int, board_id: int):
    """
    Rename the board
    :param user_id: id of the current user
    :param board_id: id of the board
    :returns: json_object, status_code
    """
    queries.rename_board(board_id, request.get_json().get('boardTitle'), user_id)
    return jsonify({'message': 'Successfully renamed.'}), 200


@app.route("/api/users/<int:user_id>/boards/<int:board_id>", methods=["DELETE"])
@auth.login_required
def delete_board(user_id: int, board_id: int):
    """
    Remove a board
    :param user_id: id of the current user
    :param board_id: id of the board
    :returns: json_object, status_code
    """
    queries.delete_board(board_id, user_id)
    return jsonify({'message': 'Successfully removed.'}), 200


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards/")
@auth.login_required
def get_cards(user_id: int, board_id: int):
    """
    All cards that belongs to a board
    :param user_id: id of the current user
    :param board_id: id of the board
    :returns: json_object, status_code
    """
    cards = queries.get_cards_for_board(user_id, board_id)
    if cards:
        return jsonify(cards), 200
    return jsonify({'message': 'There\'s no cards. Add new one.'}), 404


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards/archived")
@auth.login_required
def get_archived_cards(user_id: int, board_id: int):
    """
    Get all archived card that belongs to a board
    :param user_id: id of the current user
    :param board_id: id of the board
    :returns: json_object, status_code
    """
    archived_cards = queries.get_archived_cards_for_board(user_id, board_id)
    if archived_cards:
        return jsonify(archived_cards), 200
    return jsonify({'message': 'Cards not found.'}), 404


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards", methods=['POST'])
@auth.login_required
def post_create_card(user_id: int, board_id: int):
    """
    Create new card for board
    :param user_id: id of the current user
    :param board_id: id of the board
    :returns: json_object, status_code
    """
    queries.create_new_card(board_id, request.get_json(), user_id)
    return jsonify({'message': 'Successfully created.'}), 201


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards/<int:card_id>", methods=['PATCH'])
@auth.login_required
def patch_rename_card(user_id: int, board_id: int, card_id: int):
    """
    Rename a card
    :param user_id: id of the current user
    :param board_id: id of the board
    :param card_id: id of the card
    :returns: json_object, status_code
    """
    queries.rename_card(board_id, card_id, request.get_json()['cardTitle'], user_id)
    return jsonify({'message': 'Successfully renamed.'}), 200


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards/<int:card_id>/archive", methods=['PATCH'])
@auth.login_required
def patch_archive_and_unarchive_card(user_id: int, board_id: int, card_id: int):
    """
    Archive/unarchive a card
    :param user_id: id of the current user
    :param board_id: id of the board
    :param card_id: id of the card
    :returns: json_object, status_code
    """
    queries.archive_and_unarchive_card(board_id, card_id, user_id)
    return jsonify({'message': 'Operation done.'}), 200


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards", methods=['PATCH'])
@auth.login_required
def patch_update_cards(user_id: int, board_id: int):
    """
    Updates all cards that belongs to a board
    :param user_id: id of the current user
    :param board_id: id of the board
    :returns: json_object, status_code
    """
    return jsonify(queries.update_cards(board_id, user_id, request.get_json())), 200


@app.route("/api/users/<int:user_id>/boards/<int:board_id>/cards/<int:card_id>", methods=['DELETE'])
@auth.login_required
def delete_card(user_id: int, board_id: int, card_id: int):
    """
    Remove card from board
    :param user_id: id of the current user
    :param board_id: id of the board
    :param card_id: id of the card
    :returns: json_object, status_code
    """
    queries.remove_card(board_id, card_id, user_id)
    return jsonify({'message': 'Successfully removed.'}), 200


@app.route('/api/users/<int:user_id>/statuses/<int:board_id>')
@auth.login_required
def get_columns(user_id: int, board_id: int):
    """
    Get all statuses(columns) that belongs to a board
    :param user_id: id of the current user
    :param board_id: id of the board
    :returns: json_object, status_code
    """
    return jsonify(queries.get_columns(user_id, board_id)), 200


@app.route('/api/users/<int:user_id>/statuses/<int:board_id>', methods=['POST'])
@auth.login_required
def post_create_column(user_id: int, board_id: int):
    """
    Create new status(column) and add it into a board
    :param user_id: id of the current user
    :param board_id: id of the board
    :returns: json_object, status_code
    """
    board = queries.get_board(user_id, board_id)
    if board['user_id'] == user_id:
        queries.create_new_column(user_id, board_id, request.get_json().get('columnTitle'))
        return jsonify({'message': 'Successfully created.'}), 201
    return jsonify({'message': 'You can\'t add new columns into the other users boards.'}), 401


@app.route('/api/users/<int:user_id>/statuses/<int:board_id>', methods=['PATCH'])
@auth.login_required
def patch_rename_column(user_id: int, board_id: int):
    """
    Rename status(column) that belongs to a board
    :param user_id: id of the current user
    :param board_id: id of the board
    :returns: json_object, status_code
    """
    board = queries.get_board(user_id, board_id)
    if board['user_id'] == user_id:
        data = request.get_json()
        queries.rename_column(user_id, board_id, data['columnId'], data['columnTitle'])
        return jsonify({'message': 'Successfully renamed.'}), 200
    return jsonify({'message': 'You can\'t rename columns from the other users boards.'}), 401


@app.route('/api/users/<int:user_id>/statuses/<int:board_id>', methods=['DELETE'])
@auth.login_required
def delete_column(user_id: int, board_id: int):
    """
    Delete status(column) from a board
    :param user_id: id of the current user
    :param board_id: id of the board
    :returns: json_object, status_code
    """
    board = queries.get_board(user_id, board_id)
    if board['user_id'] == user_id:
        queries.remove_column(user_id, board_id, request.get_json().get('columnId'))
        return jsonify({'message': 'Successfully removed.'}), 200
    return jsonify({'message': 'You can\'t remove columns from the other users boards.'}), 401


@socketio.on('message')
def handle_sync(content: any):
    """
    Listen on any messages, then sends message to front-end which will trigger the syncing function
    """
    if content:
        print('Syncing...')
        socketio.send(content)


@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json')


@app.route('/sw.js')
def service_worker():
    response = make_response(send_from_directory('static', 'sw.js'))
    response.headers['Cache-Control'] = 'no-cache'
    return response


def main():
    """
    Run app
    """
    socketio.run(app, debug=True)

    # Serving the favicon
    with app.app_context():
        app.add_url_rule('/favicon.ico', redirect_to=url_for('static', filename='favicon/favicon.ico'))


if __name__ == '__main__':
    main()

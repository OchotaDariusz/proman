import data_manager


def get_card_status(status_id: int):
    """
    Find the first status matching the given id
    :param status_id:
    :return: str
    """
    status = data_manager.execute_select(
        """
        SELECT * FROM statuses s
        WHERE s.id = %(status_id)s
        ;
        """, {"status_id": status_id})

    return status


def get_boards(user_id: int):
    """
    Gather all boards
    :param user_id: id of current user
    :return: list of all boards that are public and user's private
    """
    return data_manager.execute_select(
        """
        SELECT * FROM boards
        WHERE public = TRUE OR public = FALSE AND user_id = %(user_id)s
        ORDER BY id
        """, variables={'user_id': user_id})


def get_board(user_id: int, board_id: int):
    """
    Get board
    :param user_id: id of current user
    :param board_id: id of board
    :return: any public board or user's private
    """
    return data_manager.execute_select(
        """
        SELECT * FROM boards
        WHERE id = %(board_id)s AND public = TRUE OR id = %(board_id)s AND public = FALSE AND user_id = %(user_id)s;
        """, variables={'user_id': user_id, 'board_id': board_id}, fetchall=False)


def rename_board(board_id, board_title, user_id):
    """
    Rename board
    :param board_id: id of board
    :param board_title: new title for board
    :param user_id: id of current user
    """
    data_manager.execute_statement(
        """UPDATE boards
        SET title = %(board_title)s
        WHERE id = %(board_id)s AND user_id = %(user_id)s
        """, variables={'board_id': board_id, 'board_title': board_title, 'user_id': user_id})


def get_cards_for_board(user_id, board_id):
    """
    Get cards for board
    :param user_id: id of current user
    :param board_id: id of board
    :return: cards from any public board or user's private
    """
    return data_manager.execute_select(
        """
        SELECT cards.id, cards.board_id, cards.status_id, cards.title, cards.card_order, cards.user_id
        FROM cards
        JOIN boards on boards.id = cards.board_id
        WHERE cards.board_id = %(board_id)s AND boards.public = TRUE AND cards.archived = FALSE
            OR cards.board_id = %(board_id)s AND boards.public = FALSE AND boards.user_id = %(user_id)s
             AND cards.archived = FALSE
        ORDER BY cards.card_order
        """, {"user_id": user_id, "board_id": board_id})


def get_archived_cards_for_board(user_id, board_id):
    """
    Get archived cards for board
    :param user_id: id of current user
    :param board_id: id of board
    :return: cards from any public board or user's private
    """
    return data_manager.execute_select(
        """
        SELECT cards.id, cards.board_id, cards.status_id, cards.title, cards.card_order, cards.user_id
        FROM cards
        JOIN boards on boards.id = cards.board_id
        WHERE cards.board_id = %(board_id)s AND boards.public = TRUE AND cards.archived = TRUE
            OR cards.board_id = %(board_id)s AND boards.public = FALSE AND boards.user_id = %(user_id)s
             AND cards.archived = TRUE
        ORDER BY cards.card_order
        """, {"user_id": user_id, "board_id": board_id})


def get_card(card_id, user_id):
    """
    Get card for board
    :param card_id: id of card
    :param user_id: id of current user
    :return: card from any public board or user's private
    """
    return data_manager.execute_select(
        """SELECT *
        FROM cards
        WHERE id = %(card_id)s AND user_id = %(user_id)s
        """, variables={'card_id': card_id, 'user_id': user_id}, fetchall=False)


def archive_and_unarchive_card(board_id, card_id, user_id):
    """
    Archive/unarchive card
    :param board_id: id of board
    :param card_id: id of card
    :param user_id: id of current user
    """
    card = get_card(card_id, user_id)
    n = get_order_of_last_card(board_id, card['status_id'], not card['archived'])
    archive = not card['archived']
    data_manager.execute_statement(
        """UPDATE cards
        SET archived = %(archive)s, card_order = %(last_order)s
        WHERE id = %(card_id)s AND board_id = %(board_id)s AND user_id = %(user_id)s""",
        variables={'card_id': card_id, 'board_id': board_id,
                   'user_id': user_id, 'last_order': n + 1, 'archive': archive})


def get_user_by_username(username):
    """
    Get user details
    :param username: email of user
    :return: user details
    """
    return data_manager.execute_select(
        """
        SELECT * FROM users
        WHERE username = %(username)s
        """, {'username': username}, fetchall=False)


def get_user_by_user_id(user_id: int):
    """
    Get user details
    :param user_id: id of user
    :return: user details
    """
    return data_manager.execute_select(
        """
        SELECT * FROM users
        WHERE id = %(user_id)s
        """, {'user_id': user_id}, fetchall=False)


def add_new_user(new_user: dict):
    """
    Create new user
    :param new_user: new user details
    """
    data_manager.execute_statement(
        """
        INSERT INTO users(username, password)
        VALUES(%(username)s, %(password)s)
        """, {'username': new_user['username'], 'password': new_user['password']})


def add_new_board(board_title, public, user_id):
    """
    Create new board
    :param board_title: new board title
    :param public: is board public(if false then private)
    :param user_id: user id(owner)
    """
    new_board_id = data_manager.execute_select(
        """
        INSERT INTO boards (title, public, user_id)
        VALUES (%(title)s, %(public_private)s, %(user_id)s);
        SELECT currval('boards_id_seq') AS id""", variables={'title': board_title,
                                                             'user_id': user_id,
                                                             'public_private': public}, fetchall=False)
    new_board_id = int(new_board_id['id'])
    data_manager.execute_statement(
        """INSERT INTO statuses (title, board_id, status_order)
        VALUES ('new', %(id)s, 1), ('in progress', %(id)s, 2), ('testing', %(id)s, 3), ('done', %(id)s, 4)
        """, variables={'id': new_board_id})


def get_order_of_last_card(board_id, status_id, archived=False):
    """
    Get order of last card in column
    :param board_id: id of the board
    :param status_id: id of the status(column)
    :param archived: is card archived?
    :return: Order of last card in column
    """
    last_order_number = data_manager.execute_select(
        """SELECT card_order
        FROM cards
        WHERE board_id = %(board_id)s AND status_id = %(status_id)s AND archived = %(archived)s
        ORDER BY card_order DESC
        """, variables={'board_id': board_id, 'status_id': status_id, 'archived': archived}, fetchall=False)
    if last_order_number is None:
        last_order_number = 0
    else:
        last_order_number = int(last_order_number['card_order'])
    return last_order_number


def create_new_card(board_id, card_details, user_id):
    """
    Create new card
    :param board_id: id of the board
    :param card_details: new card details
    :param user_id: id of the user(owner)
    """
    last_order_number = get_order_of_last_card(board_id, card_details['statusId'])
    data_manager.execute_statement(
        """
        INSERT INTO cards(board_id, status_id, title, card_order, user_id, archived)
        VALUES(%(board_id)s, %(status_id)s, %(title)s, %(card_order)s, %(user_id)s, FALSE)
        """, variables={'board_id': board_id, 'status_id': card_details['statusId'],
                        'title': card_details['cardTitle'], 'user_id': user_id,
                        'card_order': last_order_number + 1})


def remove_card(board_id, card_id, user_id):
    """
    Remove specific card
    :param board_id: id of the board
    :param card_id: id of the card
    :param user_id: id of the user(owner)
    """
    data_manager.execute_statement(
        """
        DELETE
        FROM cards
        WHERE board_id = %(board_id)s AND id = %(card_id)s AND user_id = %(user_id)s
        """, variables={'board_id': board_id, 'card_id': card_id, 'user_id': user_id})


def get_columns(user_id, board_id=0):
    """
    Get all columns for specific board
    :param user_id: id of the user
    :param board_id: id of the board
    :return: List of columns for the current board
    """
    return data_manager.execute_select(
        """
        SELECT * FROM statuses
        WHERE board_id = %(board_id)s AND %(user_id)s > 0
        ORDER BY status_order
        """, variables={'board_id': board_id, 'user_id': user_id})


def remove_column(user_id, board_id, column_id):
    """
    Get order of last card in column
    :param user_id: id of the user(board owner)
    :param board_id: id of the board
    :param column_id: id of the status(column)
    :return: Order of last card in column
    """
    data_manager.execute_statement(
        """DELETE FROM statuses CASCADE
        WHERE id IN
        (SELECT statuses.id FROM statuses
        JOIN boards on boards.id = statuses.board_id
        WHERE boards.id = %(board_id)s AND boards.user_id = %(user_id)s AND statuses.id = %(column_id)s)
        """, variables={'board_id': board_id, 'user_id': user_id, 'column_id': column_id})


def get_last_status_order(board_id):
    """
    Get order of last status(column) in board
    :param board_id: id of the board
    :return: Order of last status(column)
    """
    last_status_order = data_manager.execute_select(
        """SELECT status_order
        FROM statuses
        WHERE board_id = %(board_id)s 
        ORDER BY status_order DESC
        """, variables={'board_id': board_id}, fetchall=False)
    if last_status_order is None:
        last_status_order = 0
    else:
        last_status_order = int(last_status_order['status_order'])
    return last_status_order


def create_new_column(user_id, board_id, column_title):
    """
    Create new status(column)
    :param user_id: id of the user(board owner)
    :param board_id: id of the board
    :param column_title: status(column) title
    """
    if user_id != 0:
        last_status_order = get_last_status_order(board_id)
        data_manager.execute_statement(
            """INSERT INTO statuses(title, board_id, status_order)
            VALUES (%(title)s, %(board_id)s, %(status_order)s)
            """, variables={'title': column_title, 'board_id': board_id, 'status_order': last_status_order + 1})


def rename_column(user_id, board_id, column_id, column_title):
    """
    Rename status(column) in specific board
    :param user_id: id of the user(board owner)
    :param board_id: id of the board
    :param column_id: id of the status(column)
    :param column_title: new status(column) title
    """
    data_manager.execute_statement(
        """UPDATE statuses
        SET title = %(column_title)s
        WHERE board_id = %(board_id)s AND id = %(column_id)s AND %(user_id)s > 0
        """, variables={'board_id': board_id, 'column_id': column_id,
                        'column_title': column_title, 'user_id': int(user_id)})


def delete_board(board_id, user_id):
    """
    Remove specific board(and its columns)
    :param board_id: id of the board
    :param user_id: id of the user(board owner)
    """
    data_manager.execute_statement(
        """DELETE FROM statuses
        WHERE board_id = %(board_id)s
        """, variables={'board_id': board_id})
    data_manager.execute_statement(
        """
        DELETE FROM boards
        WHERE id=(%(board_id)s) AND user_id = %(user_id)s;
        """, variables={'board_id': board_id, 'user_id': user_id})


def rename_card(board_id, card_id, new_card_title, user_id):
    """
    Rename specific card
    :param board_id: id of the board
    :param card_id: id of the card
    :param new_card_title: new card title
    :param user_id: id of the user(card owner)
    """
    data_manager.execute_statement(
        """UPDATE cards
        SET title = %(new_card_title)s
        WHERE id = %(card_id)s AND board_id = %(board_id)s AND user_id = %(user_id)s
        """, variables={'card_id': card_id, 'board_id': board_id, 'new_card_title': new_card_title,
                        'user_id': user_id})


def update_cards(board_id, user_id, cards_details):
    """
    Update order of cards
    :param board_id: id of the board
    :param user_id: id of the user(card owner)
    :param cards_details: card details
    """
    for card in cards_details['cards']:
        data_manager.execute_statement(
            """UPDATE cards
            SET status_id = %(status)s, card_order = %(order)s
            WHERE id = %(id)s AND board_id = %(board_id)s AND user_id = %(user_id)s 
            """, variables={'id': int(card['id']), 'status': int(card['status_id']),
                            'order': int(card['card_order']), 'board_id': board_id, 'user_id': user_id})

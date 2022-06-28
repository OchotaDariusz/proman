import data_manager


def get_card_status(status_id):
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
        """
        , {"status_id": status_id})

    return status


def get_boards(user_id):
    """
    Gather all boards
    :return:
    """

    return data_manager.execute_select(
        """
        SELECT * FROM boards
        WHERE public = TRUE OR public = FALSE AND user_id = %(user_id)s;
        """, variables={'user_id': user_id})


def get_board(user_id, board_id):
    return data_manager.execute_select(
        """
        SELECT * FROM boards
        WHERE id = %(board_id)s AND public = TRUE OR id = %(board_id)s AND public = FALSE AND user_id = %(user_id)s;
        """, variables={'user_id': user_id, 'board_id': board_id}, fetchall=False)


def rename_board(board_id, board_title, user_id):
    return data_manager.execute_statement(
        """UPDATE boards
        SET title = %(board_title)s
        WHERE id = %(board_id)s AND user_id = %(user_id)s
        """, variables={'board_id': board_id, 'board_title': board_title, 'user_id': user_id})


def get_cards_for_board(user_id, board_id):
    matching_cards = data_manager.execute_select(
        """
        SELECT cards.id, cards.board_id, cards.status_id, cards.title, cards.card_order, cards.user_id
        FROM cards
        JOIN boards on boards.id = cards.board_id
        WHERE cards.board_id = %(board_id)s AND boards.public = TRUE AND cards.archived = FALSE
            OR cards.board_id = %(board_id)s AND boards.public = FALSE AND boards.user_id = %(user_id)s
             AND cards.archived = FALSE
        ORDER BY cards.card_order
        """, {"user_id": user_id, "board_id": board_id})

    return matching_cards


def get_archived_cards_for_board(user_id, board_id):
    matching_cards = data_manager.execute_select(
        """
        SELECT cards.id, cards.board_id, cards.status_id, cards.title, cards.card_order, cards.user_id
        FROM cards
        JOIN boards on boards.id = cards.board_id
        WHERE cards.board_id = %(board_id)s AND boards.public = TRUE AND cards.archived = TRUE
            OR cards.board_id = %(board_id)s AND boards.public = FALSE AND boards.user_id = %(user_id)s
             AND cards.archived = TRUE
        ORDER BY cards.card_order
        """, {"user_id": user_id, "board_id": board_id})

    return matching_cards


def get_card(card_id, user_id):
    return data_manager.execute_select(
        """SELECT *
        FROM cards
        WHERE id = %(card_id)s AND user_id = %(user_id)s
        """, variables={'card_id': card_id, 'user_id': user_id}, fetchall=False)


def archive_card(board_id, card_id, user_id):
    card = get_card(card_id, user_id)
    print(card)
    archive = "TRUE" if card['archived'] is False else "FALSE"
    data_manager.execute_statement(
        """UPDATE cards
        SET archived = """ + archive + " WHERE id = %(card_id)s AND board_id = %(board_id)s AND user_id = %(user_id)s",
        variables={'card_id': card_id, 'board_id': board_id, 'user_id': user_id})


def get_user_by_username(username):
    user = data_manager.execute_select(
        """
        SELECT * FROM users
        WHERE username = %(username)s
        """
        , {'username': username}, fetchall=False)

    return user


def get_user_by_user_id(user_id):
    user = data_manager.execute_select(
        """
        SELECT * FROM users
        WHERE id = %(user_id)s
        """
        , {'user_id': user_id}, fetchall=False)

    return user


def add_new_user(new_user):
    data_manager.execute_statement(
        """
        INSERT INTO users(username, password)
        VALUES(%(username)s, %(password)s)
        """
        , {'username': new_user['username'], 'password': new_user['password']})


def add_new_board(board_title, public, user_id):
    public = 'TRUE' if public == 'public' else 'FALSE'
    data_manager.execute_statement(
        """
        INSERT INTO boards (title, public, user_id)
        VALUES(%(title)s, """ + public + ", %(user_id)s)"
        , variables={'title': board_title, 'user_id': user_id})


def create_new_card(board_id, card_details, user_id):
    data_manager.execute_statement(
        """
        INSERT INTO cards(board_id, status_id, title, card_order, user_id, archived)
        VALUES(%(board_id)s, %(status_id)s, %(title)s, 1, %(user_id)s, FALSE)
        """
        , variables={'board_id': board_id, 'status_id': card_details['statusId'],
                     'title': card_details['cardTitle'], 'user_id': user_id})


def remove_card(board_id, card_id, user_id):
    data_manager.execute_statement(
        """
        DELETE
        FROM cards
        WHERE board_id = %(board_id)s AND id = %(card_id)s AND user_id = %(user_id)s
        """, variables={'board_id': board_id, 'card_id': card_id, 'user_id': user_id})


def get_statuses():
    return data_manager.execute_select(
        """
        SELECT * FROM statuses
        ;
        """
    )


def delete_board(board_id, user_id):
    data_manager.execute_statement(
        """
        DELETE FROM boards
        WHERE id=(%(board_id)s) AND user_id = %(user_id)s;
        """
        , variables={'board_id': board_id, 'user_id': user_id})


def rename_card(board_id, card_id, new_card_title, user_id):
    data_manager.execute_statement(
        """UPDATE cards
        SET title = %(new_card_title)s
        WHERE id = %(card_id)s AND board_id = %(board_id)s AND user_id = %(user_id)s
        """, variables={'card_id': card_id, 'board_id': board_id, 'new_card_title': new_card_title,
                        'user_id': user_id})


def update_cards(board_id, user_id, cards_details):
    for card in cards_details:
        data_manager.execute_statement(
            """UPDATE cards
            SET status_id = %(status)s, card_order = %(order)s
            WHERE id = %(id)s AND board_id = %(board_id)s AND user_id = %(user_id)s 
            """, variables={'id': card['id'], 'status': card['stutus_id'],
                            'order': card['card_order'], 'board_id': board_id, 'user_id': user_id}
        )

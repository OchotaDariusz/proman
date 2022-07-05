--
-- PostgreSQL database Proman
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET default_tablespace = '';

SET default_with_oids = false;

---
--- drop tables
---

DROP TABLE IF EXISTS statuses CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

---
--- create tables
---

CREATE TABLE statuses
(
    id           SERIAL PRIMARY KEY NOT NULL,
    title        VARCHAR(20)        NOT NULL,
    board_id     INTEGER            NOT NULL,
    status_order INTEGER            NOT NULL
);

CREATE TABLE boards
(
    id      SERIAL PRIMARY KEY NOT NULL,
    title   VARCHAR(20)        NOT NULL,
    public  BOOLEAN            NOT NULL,
    user_id INTEGER            NOT NULL
);

CREATE TABLE cards
(
    id         SERIAL PRIMARY KEY NOT NULL,
    board_id   INTEGER            NOT NULL,
    status_id  INTEGER            NOT NULL,
    title      VARCHAR(20)        NOT NULL,
    card_order INTEGER            NOT NULL,
    user_id    INTEGER            NOT NULL,
    archived   BOOLEAN            NOT NULL
);

CREATE TABLE users
(
    id       SERIAL PRIMARY KEY NOT NULL,
    username VARCHAR(200)       NOT NULL,
    password VARCHAR(200)       NOT NULL
);

---
--- insert data
---

INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'New', 1, 1);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'In progress', 1, 2);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Testing', 1, 3);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Done', 1, 4);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Tasks', 2, 1);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Todo', 2, 2);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Bugs', 2, 3);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Fixed', 2, 4);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Broken', 2, 5);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Bugs', 3, 1);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Fixed', 3, 2);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Reported Bugs', 4, 1);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Critical Bugs', 4, 2);
INSERT INTO statuses
VALUES (nextval('statuses_id_seq'), 'Fixed Bugs', 4, 3);

INSERT INTO boards
VALUES (nextval('boards_id_seq'), 'Standard Board', TRUE, 1);
INSERT INTO boards
VALUES (nextval('boards_id_seq'), 'Public Board', TRUE, 1);
INSERT INTO boards
VALUES (nextval('boards_id_seq'), 'Private Board 1', FALSE, 1);
INSERT INTO boards
VALUES (nextval('boards_id_seq'), 'Test Public Board', TRUE, 2);

INSERT INTO cards
VALUES (nextval('cards_id_seq'), 1, 1, 'Update', 1, 1, TRUE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 1, 1, 'Verify LoadedContent', 1, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 1, 1, 'Live Synchronisation', 2, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 1, 2, 'Upgrading', 1, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 1, 3, 'All', 1, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 1, 4, 'Add/Remove Boards', 1, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 1, 4, 'Add/Remove Cards', 2, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 1, 4, 'Add/Remove Columns', 3, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 2, 5, 'Refactor', 1, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 2, 5, 'Offline mode', 2, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 2, 6, 'PWA', 2, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 2, 7, 'Reloading', 1, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 2, 8, 'WebSockets', 1, 1, FALSE);
INSERT INTO cards
VALUES (nextval('cards_id_seq'), 2, 8, 'Board Privacy', 2, 1, FALSE);

INSERT INTO users
VALUES (nextval('users_id_seq'), 'ask@mate.com', '$2b$12$/43VzFMeu2NBxkCSWb/G/edG.p3HnfYpnAE02DxZMym1AOutUH4aO');
INSERT INTO users
VALUES (nextval('users_id_seq'), 'test@test.com', '$2b$12$lDUSZB8DlTWMxXtV0fh.weie7ZzQcwCL7XNAi7V3rYerNWAWGlGhm');

---
--- add constraints
---

ALTER TABLE ONLY cards
    ADD CONSTRAINT fk_cards_board_id FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE;

ALTER TABLE ONLY cards
    ADD CONSTRAINT fk_cards_status_id FOREIGN KEY (status_id) REFERENCES statuses (id) ON DELETE CASCADE;

ALTER TABLE ONLY boards
    ADD CONSTRAINT fk_boards_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE ONLY cards
    ADD CONSTRAINT fk_cards_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE ONLY statuses
    ADD CONSTRAINT fk_statuses_board_id FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE;

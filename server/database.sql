CREATE DATABASE AuthDb;

--set extention uuid_generate_v4
CREATE extension if not exists "uuid-ossp";

CREATE TABLE users(
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    user_role_player BIT DEFAULT '1',
    user_role_official BIT DEFAULT '0',
    user_role_admin BIT DEFAULT '0'
);

--insert fake users

INSERT INTO users(user_name,user_email,user_password) VALUES ('admin','admin@gmail.com','password');
UPDATE users SET user_role_admin='1' WHERE user_name='admin'

CREATE TABLE tournament_games(
    game_id uuid DEFAULT NULL,
    running BIT,
    scheduled BIT,
    endgame BIT,
    finished BIT,
    wait_match1 uuid DEFAULT NULL, --IS NULL if phase is 1
    wait_match2 uuid DEFAULT NULL, --IS NULL if phase is 1
    player1 uuid DEFAULT NULL, --is NULL for phase >=2 except *sometimes* for phase_id=1 and phase=2
    player2 uuid DEFAULT NULL, --is NULL for phase >=2
    phases int, 
    phase int,
    phase_id int,
    tournament_id uuid,
    tournament_game_id uuid PRIMARY KEY 
);

CREATE TABLE tournaments(
    tournament_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_name VARCHAR(255) NOT NULL,
    finished BIT DEFAULT '0',
    total_players int
);

CREATE TABLE tournament_winners(
    tournament_id uuid NOT NULL,
    winner_id uuid NOT NULL,
    PRIMARY KEY(tournament_id,winner_id)
);

INSERT INTO tournaments(tournament_name,total_players) VALUES ('awesome tournament name',15);


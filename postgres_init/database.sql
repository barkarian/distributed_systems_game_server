CREATE DATABASE AuthDb;
\c AuthDb

--set extention uuid_generate_v4
CREATE extension if not exists "uuid-ossp";

CREATE TABLE users(
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    user_role_player BIT DEFAULT '1',
    user_role_official BIT DEFAULT '0',
    user_role_admin BIT DEFAULT '0',
    chess_w_count INTEGER DEFAULT 0 NOT NULL,
    chess_t_count INTEGER DEFAULT 0 NOT NULL,
    chess_l_count INTEGER DEFAULT 0 NOT NULL,
    ttt_w_count INTEGER DEFAULT 0 NOT NULL,
    ttt_t_count INTEGER DEFAULT 0 NOT NULL,
    ttt_l_count INTEGER DEFAULT 0 NOT NULL

);

--insert fake users

--INSERT INTO users(user_name,user_email,user_password) VALUES ('admin','admin@gmail.com','password');
--UPDATE users SET user_role_admin='1' WHERE user_name='admin'

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
    total_players int,
    tournament_creator uuid NOT NULL,
    game_type VARCHAR(255) NOT NULL
);

CREATE TABLE tournament_winners(
    tournament_id uuid NOT NULL,
    winner_id uuid NOT NULL,
    PRIMARY KEY(tournament_id,winner_id)
);
CREATE TABLE games(
    match_id VARCHAR(255) NOT NULL,--relative to mongodb
    player1 uuid NOT NULL,
    player2 uuid NOT NULL,
    game_type VARCHAR(255) NOT NULL,
    finished BIT DEFAULT '0',
    in_tournament BIT DEFAULT '1',
    winner_id uuid DEFAULT NULL, --only this default value
    game_id uuid PRIMARY KEY NOT NULL
);

CREATE TABLE waiting_for_matches(
    player uuid NOT NULL,
    game_type VARCHAR(255) NOT NULL,
    PRIMARY KEY(player,game_type)
);
-- INSERT INTO waiting_for_matches(player,game_type) VALUES ('abd15ab3-ff91-40e6-a64d-2b9ca58eb2ec','chess');
-- INSERT INTO games(match_id,player1,player2,game_type,in_tournament,game_id) 
--             VALUES ('a string id','324d9a15-4d93-4456-837d-e5e227cc413f','f99fb395-0c07-4db2-8e9e-f42f00b30afc','chess','0','fc5d8faa-33a8-41bd-b262-06b97c621458');

--INSERT INTO tournaments(match_id,total_players) VALUES ('awesome tournament name',15);
-- UPDATE users SET user_role_official='0' ,user_role_admin='0' WHERE user_email!='admin@gmail.com';


-- --TESTING PURPOSES
-- delete from tournaments;delete from tournament_games;delete from tournament_winners;delete from games;delete from waiting_for_matches;
-- select * from tournaments;select * from tournament_games;select * from tournament_winners;select * from games;select * from waiting_for_matches;
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

INSERT INTO users(user_name,user_email,user_password) VALUES ('Teo','teo@gmail.com','teopass');
UPDATE users SET user_role_admin='1' WHERE user_name='admin'
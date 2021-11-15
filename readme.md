# Game Server

## _A simple implementation of an online distributed game system build with microservice architecture._

This project has been build with node for backend,mongo and postgres as databases and svelte for frontend.
Authentication has been implemented with jwt and it follows the microservice architecture.

- nodejs
- postgres
- mongo
- svelte
- docker
- docker compose
- jwt
- ✨Magic ✨

## How to run

- to clean start run:
  > `bash _bashScripts/cleanStart.sh`
  > advisable for the docker compose build step
  > **This will erase all your custom data**:
- to just start run:
  > `docker compose up`
- Now you can connect to the app from http://localhost:3000/

## Initial Data

- During initialization 11 users have been created:
  > - 1 admin:`{email:"thodorisbarkas@gmail.com",password:"123456789"}`
  > - 10 test-users:`{email:"test-user<i>@gmail.com",password:"password"}`
- You can change admin credentials from /server/.env

## Interact with the application

- Admin and User Roles
  > - Connect as admin after that from **Profile page** you can give admin or official access to other users as well.
  - To be able to create a tournament a user must be an official.
- Official and Tournaments
  > - An official can choose the players he wants to participate in the tournament the type of the game ,and the name and create it from **Profile page**.
  > - After that a graph of the tournament games flow is created.
  > - The tournament must have at least 5 users and they play until only 4 of them remains.
- Games and **My Matches page**, **New game page**
  > - At the moment the user can play game or participate in tournaments of either Chess or Tic-Tac-Toe.
  > - A user can see his running games in **My Matches page** (tournament and simple matches).
  > - A user can select the game type he wants to play from **New Game page** and wait for an opponent in **My Matches page**.
- Search Matches page
  > - User can see Matches of tournaments that he has been participated or participating at the moment.
  > - And his own game results from **Search Matches page**
- Score Board page
  > - User can see his score and other players score in the **Score Board page**

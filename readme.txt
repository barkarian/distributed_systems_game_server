#RUN ALL COMMANDS FROM ROOT DIRECTORY
#How to run me
    to clean start run(advisable for the docker compose build step):
    bash _bashScripts/cleanStart.sh
    caution:This will erase all your custom data
    to just start just run:
    docker compose up
#Interact with the application
    Now you can connect to the app from http://localhost:3000/profile
    During initialization 11 users have been created:
        1 admin:credentials={email:"thodorisbarkas@gmail.com",password:"123456789"}
        10 test-users:credentials={email:"test-user<i>@gmail.com",password:"password"}
    #Admin and user roles
    Connect as admin after that from "Profile page" you can give admin or official access to other users as well.
    To be able to create a tournament a user must be an official.
    #Official and Tournaments
    An official can choose the players he wants to participate in the tournament the type of the game ,and the name and create it from "Profile page".
    After that a graph of the tournament games flow is created.
    The tournament must have at least 5 users and they play until only 4 of them remains.
    #Games and "My Matches page", "New game page"
    At the moment the user can play game or participate in tournaments of either Chess or Tic-Tac-Toe.
    A user can see his running games in "My Matches page" (tournament and simple matches).
    A user can select the game type he wants to play from "New Game page" and wait for an opponent in "My Matches page".
    #Search Matches page
    User can see Matches of tournaments that he has been participated or participating at the moment.
    And his own game resultsfrom "Search Matches page"
    #Score Board page
    User can see his score and other players score in the "Score Board page"
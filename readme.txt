#RUN ALL COMMANDS FROM ROOT DIRECTORY
#for every environment you want to use using only docker-compose:
#comment-out the docker-compose suggested lines (default) and run:
    docker compose up -d
#for development mode and front-end vite support run:
    docker compose up -d && cd front-end && npm run dev
    
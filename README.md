# Shoppingify Challenge - Backend

## Endpoints

### Auth

- /api/register -> register a user
- /api/login -> login a user

### Lists [Need Authorization token] {"Authorization": "Bearer " + token}

- /api/lists [GET] -> Fetch the user's list
- /api/lists [POST] -> create a list

### Api Documentation is accessible on localhost:3000/swagger

1. Run npm install
2. Add .env variables ( Check in the discord )
3. Run "npm run build" or "npm run dev-remote" to use the remote db if you don't want to setup a db locally

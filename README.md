# Shoppingify Challenge - Backend

## Demo here : https://shoppingify.netlify.app/ ( The backend is deployed on Heroku so it could take some time to wake up )

- You can use "demo@test.fr" / "password" to test it out.

## Frontend repo : https://github.com/Shoppingify/frontend ( React + Typescript )

### Desktop

![shoppingify desktop](https://res.cloudinary.com/trucmachin/image/upload/v1602586571/shoppingify_desktop_wtn5qm.gif)

### Mobile

![shoppingify mobile](https://res.cloudinary.com/trucmachin/image/upload/v1602586564/shoppingify_mobile_xkcymk.gif)

If you're interested taking the challenge, it's over there: https://devchallenges.io/challenges/mGd5VpbO4JnzU6I9l96x

![shoppingify challenge](https://firebasestorage.googleapis.com/v0/b/devchallenges-1234.appspot.com/o/challengesDesigns%2FShoppingifyThumbnail.png?alt=media&token=e577059f-3b93-4f50-92d6-cedeed68403e)

## Instruction

- Clone the repository
- run "yarn" or "npm install"
- create a .env.development with the same key as the .env.example :

For example:

```
NODE_ENV="development"
PORT=3000
JWT_SECRET="dev-secret"
DB_HOST="localhost"
DB_NAME="shoppingify"
DB_USER="postgres"
DB_PASSWORD="root"
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
FRONTEND_URL='http://localhost:8080'
DEBUG=knex:query
```

- run the migration

```sh
knex migrate:latest
```

- Start the server
  With yarn:

```sh
yarn dev
```

With npm:

```sh
npm run dev
```

Visit http://localhost:3000/swagger to see the doc and check which operations you can do.
I don't remember if the documentation is complete. So check the controllers to see what
you can do ;).

Have fun!

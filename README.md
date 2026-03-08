# Zenu

Zenu is a Node.js/Python Discord bot project I’ve been building since early 2021. It has gone through many rewrites. The current version uses a Node.js runtime, an API endpoint, and a MySQL database.

## Requirements

- MySQL database (the bot will not run without one)
- A `.env` file
    - TOKEN= Your discord bot token
    - DB_HOST= Usually `localhost`
    - DB_USER= Your username
    - DB_PASS= Your DB password
    - API_KEY= optional; used for my private API

## Start up
### Install
```bash
# Clone the repo
git clone https://github.com/Nelson728/ZenuPy.git
cd ZenuPy
# Install dependencies
npm install
```
### `.env` and DB
You will need to create the `.env` file with the info listed above.

Next is initializing the DB.
```bash
# Create the MySQL database and import your schema file
# TODO: show the structure the bot expects for DB
```
### Run
```bash
node index.cjs
```
or use nodemon if you prefer.
/*-----------------------------
Globals
*///----------------------------
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Events } = require("discord.js");
require('dotenv').config();

/*-----------------------------
MySQL
*///----------------------------
console.log("Starting SQL");
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "zenu",
    waitForConnections: true,
    connectionLimit: 10,
});


/*------------------------------
Express server for API and such
*///----------------------------
console.log("Starting webserver");
const http = require('http');
const express = require("express");

const app = express()
app.set('port', 1727);

const server = http.createServer(app);
app.use(express.json());

server.listen(1727);
server.on('error', onError);
server.on('listening',() => {console.log("API listening on port 1727")});

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// CORS

app.use(async (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

// API endpoints

app.use('/endpoint', async (req, res) => {
    let output;
    let content = JSON.stringify(req.body.content);
    let type = req.body.type;

    console.log(type);
    console.log(req.body)

    switch (type) {
        case "ai":
            output = await handleAI(req);
            return res.json({ success: true, output });
        default:
            return res.status(400).json({ error: "Unknown type" });

    }


});

/*------------------------------
API handlers
*///----------------------------

async function handleAI(content) {
    return null // Placeholder
}

/*------------------------------
Discord bot
*///----------------------------

console.log("Starting discord bot");

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
    },
];
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);



// Client

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, async readyClient => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
    let [rows] = await pool.query("select value from base where name = 'status'")
    let status = rows[0].value;
    console.log(`Zenu Online\nStatus:${status}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});
client.login(process.env.TOKEN);
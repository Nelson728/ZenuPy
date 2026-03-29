/*-----------------------------
Globals
*///----------------------------

const { Client, GatewayIntentBits, REST, Routes, ActivityType, Events, MessageFlags } = require("discord.js");
require('dotenv').config();
const { writeFile, readFile } = require("fs").promises
const api = require("./Utils/api.cjs");
const {PrivateFunctionality} = require("./Utils/priv_private.js");
const {CommandLog, MessageLog, Log} = require("./Utils/logger.js")

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
Discord bot
*///----------------------------

console.log("Starting discord bot");

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
        contexts: [0, 1, 2],
    },
    {
        name: 'prompt',
        description: "Prompt the AI.",
        contexts: [0, 1, 2],
        options: [
            {
                name: "prompt",
                description: "Your message.",
                type: 3,
                required: true
            }
        ]
    },
];
const guild_commands = [

]
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);



// Client

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildPresences] });

client.on(Events.ClientReady, async readyClient => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        await rest.put(Routes.applicationGuildCommands(client.user.id, "1087175062425178163"), { body: guild_commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
    let [rows] = await pool.query("select value from base where name = 'status'")
    let status = rows[0].value;
    client.user.setActivity(status, { type: ActivityType.playing });
    client.user.setPresence({ status: "idle" })
    console.log(`Zenu Online\nStatus:${status}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.deferReply()
            .catch(console.error);
        let start = Number(Date.now());
        let response = await fetch("https://zenu.nellium.us/api/v1/heartbeat");
        let time = Date.now() - start
        let status = `Pong!\nAPI took: ${time}ms`;
        if (!response.ok) {
            status = `API failed to connect.`;
        }
        await interaction.followUp(status);
        await CommandLog({ cmd: "ping", user: interaction.user.id, guild: interaction.guildId, response: status });
    }
    if (interaction.commandName === 'prompt') {
        let prompt = interaction.options.getString("prompt");
        let output
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })
            .catch(console.error);

        let url = "https://zenu.nellium.us/endpoint"
        let payload = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "ai",
                content: { "prompt": prompt },
                key: process.env.API_KEY,
            })

        }
        try {
            let response = await fetch(url, payload);
            let data = await response.json();
            output = data.output;
        } catch (err) {
            console.log(err);
            output = "Error contacting API.";
        }
        await interaction.deleteReply();
        await interaction.followUp(output);
        await CommandLog({ cmd: "prompt", user: interaction.user.id, guild: interaction.guildId, args: [prompt], response: output })
    }
});

client.on(Events.MessageCreate, async message => {
    PrivateFunctionality(message);
    if (!message.content.startsWith("`")) return;
    let args = message.content.slice(1).split(/ +/);
    let command = args.shift().toLowerCase();
})
client.login(process.env.TOKEN);
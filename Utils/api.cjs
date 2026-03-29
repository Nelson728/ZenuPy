/*------------------------------
Globals
*///----------------------------

const { writeFile, readFile } = require("fs").promises

/*------------------------------
Express server for API and such
*///----------------------------

console.log("Starting webserver");
const http = require('http');
const express = require("express");

const app = express()
const port = 1727
app.set('port', port);

const server = http.createServer(app);
app.use(express.json());

server.listen(port);
server.on('error', onError);
server.on('listening', () => { console.log("API listening on port " + port) });

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

app.get('/v1/logs', async (req, res) => {
    let { success, output } = { success: false, output: "Default response" };
    const limit = Number(req.query.limit ?? 10);

    const userId = req.query.userId ?? null;
    const guildId = req.query.guildId ?? null;
    const event = req.query.event ?? null;

    // Commented out because I dont want to enforce types right now (This will be handled seperately)
    // if (!req.query.type) {
    //     return res.status(400).json({ success: false, error: "Unknown type" });
    // }
    const logId = Number(req.query.logId) || null

    const type = req.query.type; // Will eventually add type functionality (this is for structured output i.e: the type ai would return just the ai response)

    // Guild ID and or UserId
    ({ success, output } = await Log({ limit: limit, userId: userId, guildId: guildId, logId: logId, event: event}));
    return res.status(200).json({ success, output });
});

/*------------------------------
API handlers
*///----------------------------

async function fetchLog() {
    let raw = await readFile("./Logs/v1Log.json", "utf8");
    let log = JSON.parse(raw);
    let output = [];
    for (let e of log) {
        output.unshift(e);
    }

    return { success: true, output: output }
}
async function Log({ userId, guildId, logId, limit = 10, event }) {
    const filter = {
        global: async () => {
            let globalArr = (await fetchLog()).output;
            if (logId) {
                for (e of globalArr) {
                    if (e.timestamp === logId) return globalArr = [e];
                }
            }
            else return globalArr;
        },
        event: async () => {
            let globalArr = await filter.global();
            let eventArr = [];

            if (!event) return globalArr;

            for (e of globalArr) {
                if (e.event == event) eventArr.push(e)
            }
            return eventArr;
        },
        guild: async () => {
            let eventArr = await filter.event();
            let guildArr = [];

            if (!guildId) return guildArr = eventArr;

            for (e of eventArr) {
                if (e.content.guild == guildId) guildArr.push(e)
            }
            return guildArr;
        },
        user: async () => {
            guildArr = await filter.guild();
            userArr = []
            if (!userId) return guildArr;
            for (e of guildArr) {
                if (e.content.user == userId) userArr.push(e);
            }
            return userArr;
        },
        final: async () => {
            userArr = await filter.user();
            finalArr = []
            for (e of userArr) {
                if (finalArr.length == limit) break;
                finalArr.push(e);
            }
            return {success: true, output: finalArr};
        }

    }
    return await filter.final();
}
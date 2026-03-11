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

app.get('/v1/logs/:type/:id', async (req, res) => {
    //let content = JSON.stringify(req.body.content);
    let { success, output } = {success: false, output: "Default response"}
    let type = req.params.type;

    switch (type) {
        case "ai":
            ({ success, output } = await handleAI(req));
            return res.json({ success: success, output });
        case "command":
            ({ success, output } = await handleCommands(req));
            return res.json({ success: success, output });

        default:
            return res.status(400).json({ error: "Unknown type" });
    }
});

/*------------------------------
API handlers
*///----------------------------

async function handleAI(req) {
    let id = req.params.id;
    let raw = await readFile("./Logs/v1Log.json", "utf8");
    let log = JSON.parse(raw);
    let output

    for (let e of log) {
        if (e.timestamp.toString() == id) {
            output = e.content.response
            return { success: true, output: output }
        }
    }
    return { success: false, output: "Could not find log" }
}
async function handleCommands(req) {
    let id = req.params.id;
    let raw = await readFile("./Logs/v1Log.json", "utf8");
    let log = JSON.parse(raw);
    let output
    for (let e of log) {
        if (e.timestamp.toString() == id) {
            output = e
            return { success: true, output: output }
        }
    }
    return { success: false, output: "Could not find log" }
}
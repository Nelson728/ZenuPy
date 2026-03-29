import { writeFile, readFile } from "fs/promises"
export async function CommandLog({ cmd, timestamp = Date.now(), user, guild, args = [], response = "No response" }) {
    await Log("command", cmd, timestamp, user, guild, args, response);
}
export async function MessageLog({ user, guild, args = "" }) {
    await Log({ event: "deleted_message", timestamp: Date.now(), user: user, guild: guild, args: args })
    //"deleted_message", null, Date.now(), user, guild, args, null
}
export async function Log({ event, cmd = null, timestamp, user, guild, args, response = null }) {
    let raw = await readFile("./Logs/v1Log.json", "utf8");
    let oLog = JSON.parse(raw);
    let content = {};
    if (event == "command") {
        content = {
            command: cmd,
            user: user,
            guild: guild,
            args: args,
            response: response
        }
    } else if (event == "deleted_message") {
        content = {
            message: args,
            user: user,
            guild: guild
        }
    }

    let log = {
        timestamp: timestamp,
        event: event,
        content: content
    }
    oLog.push(log);
    console.log(JSON.stringify(log, null, 2));
    await writeFile("./Logs/v1Log.json", JSON.stringify(oLog, null, 2));


}
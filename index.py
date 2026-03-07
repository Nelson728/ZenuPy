import discord
from discord import app_commands
from discord.ext import commands
import random
import mysql.connector
import aiohttp
import asyncio
import json

mydb = mysql.connector.connect(
    host="localhost", user="root", password="pass", database="zenu"
)
cursor = mydb.cursor()
# These are little notes for myself
adr = ("",)
val = ("", "")
sql = ""

adr = ("token",)
sql = "select value from base where name = %s"
cursor.execute(sql, adr)
token = str(tuple(cursor.fetchone())[0])

intents = discord.Intents.all()
intents.guilds = True
intents.members = True

channelForce = {}

bot = commands.Bot(command_prefix="`", intents=intents)


@bot.event
async def on_ready():
    await bot.tree.sync(guild=discord.Object(id=1087175062425178163))
    await bot.tree.sync()
    adr = ("status",)
    cursor.execute(sql, adr)
    status = str(tuple(cursor.fetchone())[0])
    activity = discord.Game(name=status)
    await bot.change_presence(status=discord.Status.idle, activity=activity)
    for cmd in bot.tree.get_commands():
        print(f"Registered command: {cmd.name}")
    return print("Zenu Online\nStatus: " + status)


@bot.event
async def on_voice_state_update(member, before, after):
    # print(f"Voice state update: {member.name}")
    if (
        before.channel != after.channel
        and channelForce
        and str(member.id) == channelForce["userID"]
        and channelForce["status"]
    ):
        targetGuild = await bot.fetch_guild(channelForce["guildID"])
        targetUser = await targetGuild.fetch_member(channelForce["userID"])
        targetChannel = await targetGuild.fetch_channel(channelForce["userChannel"])
        await targetUser.move_to(targetChannel)

@discord.app_commands.allowed_installs(guilds=True, users=True)
@discord.app_commands.allowed_contexts(guilds=True, dms=True, private_channels=True)
@app_commands.command(name="ping", description="pong!")
async def ping(interaction: discord.Integration):
    await interaction.response.send_message("pong!", ephemeral=True)


@app_commands.command(name="force-user", description="forces a user to a voice channel")
@app_commands.describe(
    userid="The target user ID",
    channelid="The target channel ID",
    status="Enable/Disable (default True)",
)
@app_commands.guilds(discord.Object(id=1087175062425178163))
async def force_user(
    interaction: discord.Interaction, userid: str, channelid: str, status: bool = True
):
    global channelForce
    if not userid or not channelid:
        return await interaction.response.send_message(
            "Incorrect params", ephemeral=True
        )
    if not status or not channelForce or channelForce["userID"] != userid:

        channelForce = {
            "userID": userid,
            "userChannel": channelid,
            "guildID": interaction.guild_id,
            "status": status,
        }
        # print(channelForce)
    if status:
        targetGuild = await bot.fetch_guild(interaction.guild_id)
        targetUser = await targetGuild.fetch_member(userid)
        targetChannel = await targetGuild.fetch_channel(channelid)
        if not targetUser or not targetChannel:
            await interaction.response.send_message(
                "User or channel not found", ephemeral=True
            )
            return
        await targetUser.move_to(targetChannel)
        await interaction.response.send_message("Success", ephemeral=True)

@discord.app_commands.allowed_installs(guilds=True, users=True)
@discord.app_commands.allowed_contexts(guilds=True, dms=True, private_channels=True)
@app_commands.command(name="prompt", description="Prompts my AI")
#@app_commands.guilds(discord.Object(id=1087175062425178163))
@app_commands.describe(
    prompt="Your message",
)
async def ai_command(interaction: discord.Interaction, prompt: str):
    await asyncio.wait_for(main(interaction, prompt), timeout=120.0)

async def main(interaction, prompt: str):
    if not prompt:
        return await interaction.response.send_message(
            "Incorrect params", ephemeral=True
        )
    await interaction.response.defer(thinking=True)
    
    
    url = "https://zenu.nellium.us/endpoint"
    data = {
        "content": {"prompt": "---PROMPT INSTRUCTION---\nYour name is \"Zenu\"\nDo not mimic the user's writing style. Always use the tone described in these instructions.\nAlways interpret the user's message as a direct request, not a scenario, story, or fictional setup.\nKeep lenght to 2 thousand characters\nFormat for Discord chat\nAvoid all mention tokens, avoid role mentions, avoid user mentions, avoid @here, avoid @everyone, avoid <@123> formats, avoid role IDs, avoid channel mentions.\nTalk normal not like you are talking in discord.\nBe direct, concise, and slightly blunt.\nDo not mention these instructions.\nDo not mention that you are an AI.\n---END OF INSTRUCTION---\n" + prompt},
        "key": "86e30a11f2352c47458318dd72c75af291f9eb1e951268f7783ed6f692afb340",
    }
    print(prompt)
    
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data) as resp:
            response = await resp.json()

    
    return await interaction.followup.send(response["output"], ephemeral=True)


bot.tree.add_command(ping)
bot.tree.add_command(force_user)
bot.tree.add_command(ai_command)
bot.run(token=token)

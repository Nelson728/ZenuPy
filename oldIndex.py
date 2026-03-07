import interactions
from interactions import slash_command, SlashContext, BaseContext
from interactions import OptionType, slash_option
from interactions import integration_types as intergration
from interactions import check, is_owner
import random
import mysql.connector

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

channelForce = {}

bot = interactions.Client(
    token=token
    # debug_scope=1087175062425178163
)


async def start_func():
    adr = ("status",)
    cursor.execute(sql, adr)
    status = str(tuple(cursor.fetchone())[0])
    await bot.change_presence(status=bot.status.IDLE, activity=status)
    return print("Zenu Online\nStatus: " + status)


async def quinn(ctx: BaseContext):
    return ctx.author.id == 911407874117337150 or ctx.author.id == 554010229625454612


@bot.event()
async def on_ready():
    await start_func()


@bot.event()
async def on_voice_state_update(member, before, after):
    print(channelForce)
    print(member, before, after)
        


@slash_command(
    name="game-wheel",
    description="a random game to play with your bestest buddy",
    scopes=[1087175062425178163],
)
@intergration(user=True)
@check(quinn)
async def random_game_func(ctx):
    cursor.execute("Select count(*) from games")
    gameNum = tuple(cursor.fetchone())[0]
    sql = "select name from games where id = %s"
    adr = (random.randint(0, gameNum - 1),)
    cursor.execute(sql, adr)
    game = str(tuple(cursor.fetchone())[0])
    await ctx.send(game + "!")


@slash_command(
    name="force-user",
    description="Forces a user to a specified vc",
    scopes=[1087175062425178163],
)
@slash_option(
    name="user", description="user Id", required=True, opt_type=OptionType.STRING
)
@slash_option(
    name="channel",
    description="voice channel id",
    required=True,
    opt_type=OptionType.STRING,
)
@slash_option(
    name="status",
    description="if this should be enforced",
    required=True,
    opt_type=OptionType.BOOLEAN,
)
@intergration(guild=True, user=False)
@check(is_owner())
async def forceUser(ctx: SlashContext, user: str, channel: str, status: bool):
    global channelForce
    if not user or not channel:
        return ctx.send("Incorrect params", ephemeral=True)

    if not status or not channelForce or channelForce["userID"] != user:
        
        channelForce = {"userID": user, "userChannel": channel, "guildID": ctx.guild_id, "status": status}
        print(channelForce)
    if status:
        # channelForce.append({"userID": user, "userChannel": channel, "status": status })
        targetUser = bot.get_member(user_id=user, guild_id=ctx.guild_id)
        targetChannel = channel
        if targetUser.voice:
            await targetUser.move(targetChannel)
            print(channelForce)
            await ctx.send("Success", ephemeral=True)


@slash_command(
    name="clear-global",
    description="Clears all global commands",
    scopes=[1087175062425178163],
)
@intergration(guild=False, user=True)
@check(is_owner())
async def global_reset_func(ctx: SlashContext):
    await ctx.send("Attempting to clear tree", ephemeral=True)

    bot.interaction_tree.clear()

    await ctx.send("Successfully cleared tree", ephemeral=True)


@slash_command(name="test", description="desc", scopes=[1087175062425178163])
@intergration(user=True)
async def test_func(ctx: SlashContext):
    await ctx.send("!")


@slash_command(
    name="change-status",
    description="Changes the bot's status",
    scopes=[1087175062425178163],
)
@intergration(user=True)
@slash_option(
    name="status", description="str option", required=True, opt_type=OptionType.STRING
)
@check(is_owner())
async def status_func(ctx: SlashContext, status: str):
    sql = "update base set value = %s where name = 'status'"
    val = (status,)

    cursor.execute(sql, val)
    mydb.commit()
    print(cursor.rowcount, "record(s) affected")

    await bot.change_presence(status=bot.status.IDLE, activity=status)
    await ctx.send("Changed status to: " + status)


bot.start()

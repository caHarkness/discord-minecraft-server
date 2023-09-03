const Discord   = require("discord.js");
const { spawn } = require("child_process");

function onMatch(msg, exp, fn)
{
    let matches = msg.match(exp);

    if (matches)
        fn(matches);
}

bot = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.GuildMembers,
    ],

    partials: [
        Discord.Partials.Message,
        Discord.Partials.Channel,
        Discord.Partials.Reaction
    ]
});

bot.login("DISCRORD TOKEN");


Logger =
{
    log: function(str)
    {
        ServerChannels.console.send(str);
    }
};

Server =
{
    guild: null,
    process: null,
    ready: false
};

ServerChannels  = {};
ServerEvents =
{
    onExit: function()
    {
        Logger.log("Minecraft server closed via process exit");
        process.exit(0);
    },

    onData: function(data)
    {
        var message = data.toString().trim();

        if (message.length < 1)
            return;

        console.log(message);

        if (Server.ready)
            ServerChannels.console.send("```" + message + "```");

        onMatch(message, /: Done \(/,                           (e) => { ServerEvents.onServerLoad(e); });
        onMatch(message, /: (\w+) joined the game$/,            (e) => { ServerEvents.onPlayerJoin(e); });
        onMatch(message, /: (\[Not Secure\] )?<(\w+)> (.+)$/,   (e) => { ServerEvents.onPlayerChat(e); });
        onMatch(message, /: (\w+) left the game$/,              (e) => { ServerEvents.onPlayerLeave(e); });
    },

    onServerLoad: function(m)
    {
        ServerChannels.chat.send("Server opened.");
        Server.ready = true;
    },

    onPlayerJoin: function(m)
    {
        let username = m[1];

        ServerChannels.chat.send("**" + username + "** joined the game.");
    },

    onPlayerChat: function(m)
    {

        let t1  = m[1];
        var i   = 0;

        if (t1 == "[Not Secure] ")
            i += 1;

        var username    = m[1 + i];
        var message     = m[2 + i];

        ServerChannels.chat.send("**" + username + "** writes:\n> " + message);
    },

    onPlayerLeave: function(m)
    {
        let username = m[1];

        ServerChannels.chat.send("**" + username + "** left the game.");
    },
};

bot.on(
    "ready",
    async () => {
        bot.user.setActivity("on pshades.com");

        Server.guild            = bot.guilds.cache.filter(g => g.name === "Pink Shades").first();
        ServerChannels.console  = Server.guild.channels.cache.filter(c => c.name === "mc-console").first();
        ServerChannels.chat     = Server.guild.channels.cache.filter(c => c.name === "mc-chat").first();

        Server.process = spawn(
            "java", ["-Xms6G", "-Xmx6G", "-jar", "minecraft-server.jar", "nogui"], {
                shell: true,
                cwd: process.cwd()
            });

        Server.process.on("exit", ServerEvents.onExit);
        Server.process.stdout.on("data", ServerEvents.onData);
    });

bot.on(
    "messageCreate",
    (msg) => {
        if (msg.author.bot)
            return;

        if (msg.channel.name === "mc-console")
        {
            Server.process.stdin.write(msg.content + "\n");
            return;
        }

        if (msg.channel.name === "mc-chat")
        {
            Server.process.stdin.write("tellraw @a {\"text\": \"<" + msg.author.username + "> " + msg.content + "\"}\n");
            return;
        }
    });

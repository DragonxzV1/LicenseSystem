require('dotenv').config();
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client({
    intents: Object.keys(Discord.Intents.FLAGS),
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER']
});
client.slashCommands = new Discord.Collection();
client.slashData = [];

client.on('ready', async() => {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILDID);
    if (!guild) return console.log(`\x1b[1m\x1b[7m\x1b[31m[ERROR]\x1b[0m \x1b[1mThe bot is not in the guild with the ID ${process.env.GUILD_ID}`);

    
    guild.commands.set(client.slashData).then(() => {
        console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1mSlash commands are loaded`);
    }).catch((err) => {
        console.log(`\x1b[1m\x1b[7m\x1b[31m[ERROR]\x1b[0m \x1b[1m${err}`);
    });
});

const handlers = fs.readdirSync('./src/handlers');
for (const file of handlers) {
    require(`./handlers/${file}`)(client);
    console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1m${file} handler loaded`);
};

client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1mDiscord bot is running`);
}).catch((err) => {
    console.log(`\x1b[1m\x1b[7m\x1b[31m[ERROR]\x1b[0m \x1b[1m${err}`);
});
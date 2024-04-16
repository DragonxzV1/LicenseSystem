const fs = require('fs');

module.exports = (client) => {
    const commandFolders = fs.readdirSync('./src/commands');
    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter((file) => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${folder}/${file}`);
            client.slashCommands.set(command.name, command);
            client.slashData.push(command);
            console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1m${file} command loaded`);
        };
        console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1m${folder} commands loaded`);
    };    
    console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1mCommands are loaded`);
};
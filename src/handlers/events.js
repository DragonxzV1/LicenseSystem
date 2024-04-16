const fs = require('fs');

module.exports = (client) => {
    const eventFolders = fs.readdirSync('./src/events');
    for (const folder of eventFolders) {
        const eventFiles = fs.readdirSync(`./src/events/${folder}`).filter((file) => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`../events/${folder}/${file}`);
            client.on(event.name, (...args) => event.execute(...args, client));
            console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1m${file} event loaded`);
        };
        console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1m${folder} events loaded`);
    };
};
const ms = require('ms');

module.exports = {
    name: 'add-license',
    description: 'Add a license to the database',
    options: [
        {
            name: 'member',
            type: 'USER',
            description: 'The member to add the license to',
            required: true
        },
        {
            name: 'time',
            type: 'STRING',
            description: 'The expiration date of the license',
            required: true
        }
    ],
    async execute(interaction, client) {
        const member = await interaction.options.getUser('member');
        const time = await interaction.options.getString('time');

        await interaction.reply({
            content: 'Adding the license to the database...',
            ephemeral: true,
            fetchReply: true
        });

        const license = 'LICENSE-' + randomString(15);
        const expires = new Date(Date.now() + ms(time));
        const expiresString = expires.toISOString().split('T')[0];
        addLicense(license, 'null', 'null', member.id, expiresString, 0).then(async(license) => {
            return await interaction.editReply({
                content: `The license has been added to the database. License: \`${license}\``,
                ephemeral: true
            });
        }).catch(async(err) => {
            return await interaction.editReply({
                content: 'An error occurred while adding the license',
                ephemeral: true
            });
        });
    },
};

function randomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
const Discord = require('discord.js');

module.exports = {
    name: 'check-license',
    description: 'Check if a license exists in the database',
    options: [
        {
            name: 'license',
            type: 'STRING',
            description: 'The license to check',
            required: true
        }
    ],
    async execute(interaction, client) {
        const license = await interaction.options.getString('license');

        await interaction.reply({
            content: 'Checking if the license exists...',
            ephemeral: true,
            fetchReply: true
        });

        const foundLicense = (await getLicenses()).find((x) => x.license === license)
        if (!foundLicense) return await interaction.editReply({
            content: 'The license does not exist in the database',
            ephemeral: true
        });

        const embed = new Discord.MessageEmbed()
        .setAuthor({
            name: 'Dragonxz - License Information',
            iconURL: interaction.guild.iconURL({ dynamic: true })
        })
        .setColor('ORANGE')
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .addFields(
            {
                name: 'License',
                value: `${foundLicense.license}`,
                inline: true
            },
            {
                name: 'IP Address',
                value: `${foundLicense.ip == 'null' ? 'No Configured IP' : foundLicense.ip}`,
                inline: true
            },
            {
                name: 'Cfx.re License',
                value: `${foundLicense.cfx == 'null' ? 'No Configured Cfx.re License' : foundLicense.cfx}`,
                inline: true
            },
            {
                name: 'Discord Information',
                value: `<@${foundLicense.discord}>\n${foundLicense.discord}`,
                inline: true
            },
            {
                name: 'Expiration Date',
                value: `${foundLicense.expires}`,
                inline: true
            },
            {
                name: 'Is Banned',
                value: `${foundLicense.banned === 0 ? 'No' : 'Yes'}`,
                inline: true
            }
        )
        .setImage(process.env.IMAGE_BANNER)
        .setFooter({
            text: 'Dragonxz - License Information',
            iconURL: client.user.avatarURL()
        }).setTimestamp();

        await interaction.editReply({
            content: null,
            embeds: [embed],
            ephemeral: true
        });
    },
};
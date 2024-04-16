module.exports = {
    name: 'blockip',
    description: 'Block an IP address from the API',
    options: [
        {
            name: 'ip',
            type: 'STRING',
            description: 'The IP address to block',
            required: true
        }
    ],
    async execute(interaction, client) {
        const ip = await interaction.options.getString('ip');
        
        await interaction.reply({
            content: 'Blocking the IP address...',
            ephemeral: true,
            fetchReply: true
        });
        if ((await db.get('blockedIPs') || []).includes(ip)) {
            await interaction.editReply({
                content: `The IP address \`${ip}\` is already blocked from the API, waiting i will unblock it for you...`,
                ephemeral: true
            });
            await db.pull('blockedIPs', ip);
            return await interaction.editReply({
                content: `The IP address \`${ip}\` has been unblocked from the API`,
                ephemeral: true
            });
        };

        await db.push('blockedIPs', ip);
        return await interaction.editReply({
            content: `The IP address \`${ip}\` has been blocked from the API`,
            ephemeral: true
        });
    },
};
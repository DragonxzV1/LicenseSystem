module.exports = {
    name: 'remove-license',
    description: 'Remove a license from the database',
    options: [
        {
            name: 'license',
            type: 'STRING',
            description: 'The license to remove',
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

        removeLicense(license).then(async(found) => {
            return await interaction.editReply({
                content: `The license \`${license}\` has been removed from the database.`,
                ephemeral: true
            });
        }).catch(async(err) => {
            console.log(err);
            return await interaction.editReply({
                content: 'An error occurred while removing the license',
                ephemeral: true
            });
        });
    },
};
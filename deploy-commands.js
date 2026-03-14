require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check if Clutch is online'),
    new SlashCommandBuilder()
        .setName('freegames')
        .setDescription('Get current free games on Epic Games Store'),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all Clutch commands'),
    new SlashCommandBuilder()
        .setName('upcoming')
        .setDescription('Get upcoming game releases'),
    new SlashCommandBuilder()
        .setName('deals')
        .setDescription('Get the hottest game deals right now')
        .addStringOption(option =>
            option.setName('store')
                .setDescription('Filter by store (e.g. steam, epic, gog)')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('game')
        .setDescription('Search any game and get details')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the game')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('walkthrough')
        .setDescription('Get a YouTube walkthrough for any game')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the game')
                .setRequired(true)),
                new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Get a game suggestion based on genre')
        .addStringOption(option =>
            option.setName('genre')
                .setDescription('Type a genre (action, rpg, horror etc) or "random" for any game')
                .setRequired(true)),
]

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationCommands('1480829804118016073'),
            { body: commands }
        );
        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error(error);
    }
})();
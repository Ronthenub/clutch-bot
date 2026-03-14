require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ]
});

const RAWG_API_KEY = process.env.RAWG_API_KEY;

client.once('ready', () => {
    console.log(`✅ Clutch is online! Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply('🎮 Pong! Clutch is online and ready!');
    }

    if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('Clutch Bot Commands')
            .setColor(0x00ff00)
            .setDescription('Here are all available commands:')
            .addFields(
    { name: '/ping', value: 'Check if Clutch is online' },
    { name: '/freegames', value: 'Get current free games on Epic Games Store' },
    { name: '/upcoming', value: 'Get upcoming game releases' },
    { name: '/deals', value: 'Get the hottest game deals right now' },
    { name: '/game', value: 'Search any game and get full details' },
    { name: '/walkthrough', value: 'Get a YouTube walkthrough for any game or mission' },
    { name: '/help', value: 'Show this menu' },
)
            .setFooter({ text: 'Clutch Bot • Built for gamers' });
        await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'freegames') {
        await interaction.deferReply();
        try {
            const res = await fetch('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=IN&allowCountries=IN');
            const data = await res.json();
            const games = data.data.Catalog.searchStore.elements.filter(game =>
                game.promotions &&
                game.promotions.promotionalOffers.length > 0
            );

            if (games.length === 0) {
                await interaction.editReply('No free games right now. Check back later!');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🎮 Free Games on Epic Games Store')
                .setColor(0x00ff00)
                .setFooter({ text: 'Clutch Bot • Updated live' });

            games.forEach(game => {
                embed.addFields({
                    name: game.title,
                    value: `[Claim Free](https://store.epicgames.com/en-US/p/${game.productSlug})`
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            await interaction.editReply('❌ Could not fetch free games. Try again later.');
        }
    }

    if (commandName === 'upcoming') {
        await interaction.deferReply();
        try {
            const today = new Date().toISOString().split('T')[0];
            const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&dates=${today},${future}&ordering=released&page_size=5`);
            const data = await res.json();

            if (!data.results || data.results.length === 0) {
                await interaction.editReply('No upcoming games found right now.');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🎯 Upcoming Game Releases')
                .setColor(0xff6600)
                .setFooter({ text: 'Clutch Bot • Powered by RAWG' });

            data.results.forEach(game => {
                const platforms = game.platforms ? game.platforms.map(p => p.platform.name).join(', ') : 'N/A';
                embed.addFields({
                    name: game.name,
                    value: `📅 Release: ${game.released}\n🎮 Platforms: ${platforms}`
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            await interaction.editReply('❌ Could not fetch upcoming games. Try again later.');
        }
    }
   if (commandName === 'deals') {
        await interaction.deferReply();
        const store = interaction.options.getString('store');
        
        try {
            const storeList = await fetch('https://www.cheapshark.com/api/1.0/stores');
            const stores = await storeList.json();
            
            let storeID = null;
            if (store) {
                const matchedStore = stores.find(s => 
                    s.storeName.toLowerCase().includes(store.toLowerCase())
                );
                if (!matchedStore) {
                    await interaction.editReply(`❌ Could not find store **${store}**. Try "steam", "epic", "gog", "humble" etc.`);
                    return;
                }
                storeID = matchedStore.storeID;
            }

            const url = storeID 
                ? `https://www.cheapshark.com/api/1.0/deals?sortBy=Deal Rating&pageSize=5&storeID=${storeID}`
                : `https://www.cheapshark.com/api/1.0/deals?sortBy=Deal Rating&pageSize=5`;

            const res = await fetch(url);
            const data = await res.json();

            const storeName = store ? store.charAt(0).toUpperCase() + store.slice(1) : 'All Stores';

            const embed = new EmbedBuilder()
                .setTitle(`🔥 Hottest Deals on ${storeName}`)
                .setColor(0xff0000)
                .setFooter({ text: 'Clutch Bot • Powered by CheapShark' });

            data.forEach(deal => {
                embed.addFields({
                    name: deal.title,
                    value: `~~$${deal.normalPrice}~~ **$${deal.salePrice}** | 💰 ${Math.round(deal.savings)}% off\n[Grab Deal](https://www.cheapshark.com/redirect?dealID=${deal.dealID})`
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            await interaction.editReply('❌ Could not fetch deals. Try again later.');
        }
    }
    if (commandName === 'game') {
        await interaction.deferReply();
        const gameName = interaction.options.getString('name');
        try {
            const searchRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(gameName)}&page_size=1`);
            const searchData = await searchRes.json();

            if (!searchData.results || searchData.results.length === 0) {
                await interaction.editReply(`❌ Could not find any game called **${gameName}**. Try a different name.`);
                return;
            }

            const gameId = searchData.results[0].id;
            const gameRes = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${RAWG_API_KEY}`);
            const game = await gameRes.json();

            const platforms = game.platforms ? game.platforms.map(p => p.platform.name).join(', ') : 'N/A';
            const genres = game.genres ? game.genres.map(g => g.name).join(', ') : 'N/A';
            const description = game.description_raw ? game.description_raw.slice(0, 300) + '...' : 'No description available.';

            const embed = new EmbedBuilder()
                .setTitle(game.name)
                .setColor(0x7289da)
                .setImage(game.background_image)
                .setDescription(description)
                .addFields(
                    { name: '📅 Release Date', value: game.released || 'N/A', inline: true },
                    { name: '⭐ Rating', value: `${game.rating}/5`, inline: true },
                    { name: '🎮 Platforms', value: platforms },
                    { name: '🎭 Genres', value: genres },
                )
                .setFooter({ text: 'Clutch Bot • Powered by RAWG' });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            await interaction.editReply('❌ Could not fetch game info. Try again later.');
        }
    }
    if (commandName === 'walkthrough') {
        const gameName = interaction.options.getString('name');
        const searchQuery = encodeURIComponent(`${gameName} full walkthrough`);
        const youtubeLink = `https://www.youtube.com/results?search_query=${searchQuery}`;
        const embed = new EmbedBuilder()
            .setTitle(`🎮 Walkthrough for ${gameName}`)
            .setColor(0xff0000)
            .setDescription(`Click below to find walkthroughs for **${gameName}** on YouTube!`)
            .addFields({
                name: '🔗 YouTube Search',
                value: `[Click here to watch walkthroughs](${youtubeLink})`
            })
            .setFooter({ text: 'Clutch Bot • Powered by YouTube' });
        await interaction.reply({ embeds: [embed] });
    }
    if (commandName === 'suggest') {
        await interaction.deferReply();
        const genre = interaction.options.getString('genre');
        try {
            const isRandom = genre.toLowerCase() === 'random';
            const randomPage = Math.floor(Math.random() * 20) + 1;
            const url = isRandom
                ? `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&ordering=-rating&page=${randomPage}&page_size=10`
                : `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&genres=${encodeURIComponent(genre.toLowerCase())}&ordering=-rating&page_size=10`;

            const res = await fetch(url);
            const data = await res.json();

            if (!data.results || data.results.length === 0) {
                await interaction.editReply(`❌ Could not find any games for genre **${genre}**. Try another genre like action, rpg, horror, shooter, adventure.`);
                return;
            }

            const randomIndex = Math.floor(Math.random() * data.results.length);
            const game = data.results[randomIndex];
            const platforms = game.platforms ? game.platforms.map(p => p.platform.name).join(', ') : 'N/A';
            const genres = game.genres ? game.genres.map(g => g.name).join(', ') : 'N/A';

            const hypeLines = [
                `🔥 This game will ruin your sleep schedule.`,
                `🎮 Once you start, you won't stop.`,
                `💀 Your social life ends here.`,
                `⚡ This is exactly what you need to play right now.`,
                `🏆 One of the best in its genre, no cap.`,
                `😤 You'll rage quit but keep coming back.`,
                `🌙 Perfect for a late night gaming session.`,
            ];
            const hypeLine = hypeLines[Math.floor(Math.random() * hypeLines.length)];

            const embed = new EmbedBuilder()
                .setTitle(`🎯 Clutch Suggests: ${game.name}`)
                .setColor(0x9b59b6)
                .setImage(game.background_image)
                .setDescription(hypeLine)
                .addFields(
                    { name: '⭐ Rating', value: `${game.rating}/5`, inline: true },
                    { name: '📅 Released', value: game.released || 'N/A', inline: true },
                    { name: '🎭 Genres', value: genres },
                    { name: '🎮 Platforms', value: platforms },
                )
                .setFooter({ text: `Clutch Bot • Suggested for: ${genre}` });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            await interaction.editReply('❌ Could not fetch suggestion. Try again later.');
        }
    }
});

client.login(process.env.BOT_TOKEN);
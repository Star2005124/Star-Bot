import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import dotenv from 'dotenv';
dotenv.config();

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════
const config = {
    prefix: process.env.PREFIX || '.',
    ownerNumber: process.env.OWNER_NUMBER || '',
    botName: process.env.BOT_NAME || 'Forka',
    menuImage: 'https://github.com/amanmohdtp/Forka-Bot/blob/1d6fd5149f1c0bc1ff1d1d3201f397e859eb4e55/menu.png',
    aliveImage: 'https://github.com/amanmohdtp/Forka-Bot/blob/cba375eab1c584dcca0891e2eda96d0dddc0cdf2/alive.jpg',
    startTime: Date.now()
};

// ═══════════════════════════════════════════════════════════
// SUDO USERS LOADING
// ═══════════════════════════════════════════════════════════
let sudoUsers = [];
try {
    const sudoPath = path.join(__dirname, 'auth_info', 'sudo.json');
    if (fs.existsSync(sudoPath)) {
        sudoUsers = JSON.parse(fs.readFileSync(sudoPath, 'utf8'));
    }
} catch (err) {
    console.log('No sudo file found or error loading:', err.message);
}
global.sudoUsers = sudoUsers || [];

// ═══════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════
const rateLimit = new Map();
const checkRateLimit = (userId, command, limit = 5, windowMs = 60000) => {
    const key = `${userId}_${command}`;
    const now = Date.now();
    
    if (!rateLimit.has(key)) {
        rateLimit.set(key, [now]);
        return true;
    }
    
    const timestamps = rateLimit.get(key);
    const recent = timestamps.filter(time => now - time < windowMs);
    
    if (recent.length >= limit) {
        return false;
    }
    
    recent.push(now);
    rateLimit.set(key, recent);
    
    // Clean old entries
    if (recent.length > limit * 2) {
        rateLimit.set(key, recent.slice(-limit));
    }
    
    return true;
};

// ═══════════════════════════════════════════════════════════
// SECURITY FUNCTIONS
// ═══════════════════════════════════════════════════════════
const validatePhoneNumber = (num) => {
    const clean = num.replace(/[^0-9]/g, '');
    return clean.length >= 10 && clean.length <= 15;
};

const sanitizeText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.replace(/[<>]/g, '').substring(0, maxLength);
};

const formatNumber = (jid) => {
    const num = jid.split('@')[0];
    return `+${num}`;
};

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════
const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

const isOwner = (sender) => {
    const num = sender.split('@')[0];
    if (!config.ownerNumber) return false;
    return config.ownerNumber.split(',')
        .map(owner => owner.trim().replace('+', ''))
        .some(owner => owner === num);
};

const isSudo = (sender) => {
    const num = sender.split('@')[0];
    return global.sudoUsers?.includes(num) || false;
};

const isAdmin = async (sock, groupId, userId) => {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const participant = metadata.participants.find(p => p.id === userId);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
        return false;
    }
};

const isBotAdmin = async (sock, groupId) => {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const botId = sock.user.id;
        const participant = metadata.participants.find(p => p.id === botId);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
        return false;
    }
};

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ═══════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════
const gameState = {
    tictactoe: new Map(),
    guess: new Map(),
    fasttype: new Map(),
    wordchain: new Map(),
    quiz: new Map()
};

// Game data
const gameData = {
    truths: [
        "What's your biggest fear?",
        "What's the most embarrassing thing you've done?",
        "Who was your first crush?",
        "What's a secret you've never told anyone?",
        "What's your biggest regret?",
        "Have you ever cheated on a test?",
        "What's the worst lie you've told?",
        "What's your guilty pleasure?",
        "Who do you have a crush on right now?",
        "What's your most embarrassing childhood memory?"
    ],
    dares: [
        "Send a voice note singing a song",
        "Change your profile picture to something funny for 1 hour",
        "Text your crush right now",
        "Do 20 push-ups",
        "Speak in an accent for the next 10 messages",
        "Share your most recent photo",
        "Call someone and sing them happy birthday",
        "Post an embarrassing story",
        "Text your parents 'I love you'",
        "Send a selfie making a silly face"
    ],
    jokes: [
        "Why don't scientists trust atoms? Because they make up everything! 😄",
        "What do you call a fake noodle? An impasta! 🍝",
        "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
        "What do you call cheese that isn't yours? Nacho cheese! 🧀",
        "Why can't your nose be 12 inches long? Because then it would be a foot! 👃",
        "What's orange and sounds like a parrot? A carrot! 🥕",
        "Why did the bicycle fall over? It was two tired! 🚲",
        "What do you call a bear with no teeth? A gummy bear! 🐻",
        "Why don't eggs tell jokes? They'd crack up! 🥚",
        "What did one wall say to the other? I'll meet you at the corner! 🧱"
    ],
    facts: [
        "Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible! 🍯",
        "Octopuses have three hearts and blue blood! 🐙",
        "A day on Venus is longer than its year! 🪐",
        "Bananas are berries, but strawberries aren't! 🍌",
        "The shortest war in history lasted 38 minutes (Anglo-Zanzibar War, 1896) ⚔️",
        "A group of flamingos is called a 'flamboyance' 🦩",
        "Sharks existed before trees! 🦈",
        "The human brain uses 20% of the body's energy 🧠",
        "There are more stars in the universe than grains of sand on Earth 🌟",
        "A single cloud can weigh over 1 million pounds ☁️"
    ],
    roasts: [
        "If brains were dynamite, you wouldn't have enough to blow your nose! 🤧",
        "You're not stupid, you just have bad luck thinking! 🤔",
        "I'd agree with you, but then we'd both be wrong! 😅",
        "You bring everyone so much joy... when you leave the room! 🚪",
        "I'm not saying you're dumb, but you have the brainpower of a sleeping sloth! 🦥",
        "You're like a software update. Whenever I see you, I think 'not now' 💻",
        "If ignorance is bliss, you must be the happiest person alive! 😊",
        "You're proof that evolution can go in reverse! 🐵",
        "I'd call you a tool, but that would imply you're useful! 🔧",
        "You're not the sharpest tool in the shed, are you? More like a rubber hammer! 🔨"
    ],
    compliments: [
        "You're absolutely amazing! Keep shining! ✨",
        "Your smile could light up the darkest room! 😊",
        "You're one of a kind and that's your superpower! 🦸",
        "You make the world a better place just by being in it! 🌍",
        "Your positive energy is contagious! Keep spreading those good vibes! 🌟",
        "You're smarter than you think and stronger than you know! 💪",
        "Your kindness is a balm to all who encounter it! 💝",
        "You're like a ray of sunshine on a cloudy day! ☀️",
        "The world needs more people like you! 🌈",
        "You're not just awesome, you're AWE-inspiring! 🎆"
    ],
    quizzes: [
        { q: "What is the capital of France?", a: "paris", opts: ["London", "Paris", "Berlin", "Madrid"] },
        { q: "How many continents are there?", a: "7", opts: ["5", "6", "7", "8"] },
        { q: "What is H2O commonly known as?", a: "water", opts: ["Oxygen", "Hydrogen", "Water", "Salt"] },
        { q: "Who painted the Mona Lisa?", a: "leonardo da vinci", opts: ["Picasso", "Van Gogh", "Leonardo da Vinci", "Michelangelo"] },
        { q: "What is the largest ocean on Earth?", a: "pacific", opts: ["Atlantic", "Indian", "Arctic", "Pacific"] },
        { q: "How many sides does a hexagon have?", a: "6", opts: ["5", "6", "7", "8"] },
        { q: "What is the smallest country in the world?", a: "vatican city", opts: ["Monaco", "Vatican City", "Malta", "San Marino"] },
        { q: "In which year did World War 2 end?", a: "1945", opts: ["1943", "1944", "1945", "1946"] },
        { q: "What is the fastest land animal?", a: "cheetah", opts: ["Lion", "Cheetah", "Leopard", "Tiger"] },
        { q: "How many planets are in our solar system?", a: "8", opts: ["7", "8", "9", "10"] }
    ],
    emojiquiz: [
        { emoji: "🍕🇮🇹", answer: "pizza", hint: "Italian food" },
        { emoji: "🎬🍿", answer: "movie", hint: "Entertainment" },
        { emoji: "⚽🏆", answer: "football", hint: "Sport" },
        { emoji: "📱💬", answer: "whatsapp", hint: "App" },
        { emoji: "☕🌅", answer: "morning", hint: "Time of day" },
        { emoji: "🚗🏁", answer: "racing", hint: "Activity" },
        { emoji: "📚🎓", answer: "school", hint: "Place" },
        { emoji: "🎵🎤", answer: "singing", hint: "Activity" },
        { emoji: "🌙⭐", answer: "night", hint: "Time of day" },
        { emoji: "🏖️🌊", answer: "beach", hint: "Place" }
    ],
    fasttypeWords: [
        "gaming", "whatsapp", "silly", "cooked", "search",
        "technology", "computer", "keyboard", "smartphone", "internet",
        "life", "animals", "happiness", "algorithm", "danget"
    ]
};

// ═══════════════════════════════════════════════════════════
// GAME CLEANUP INTERVAL
// ═══════════════════════════════════════════════════════════
let cleanupInterval;
const startCleanupInterval = () => {
    cleanupInterval = setInterval(() => {
        const now = Date.now();
        const timeout = 5 * 60 * 1000;
        
        for (const [type, games] of Object.entries(gameState)) {
            for (const [key, game] of games.entries()) {
                if (now - game.createdAt > timeout) {
                    games.delete(key);
                }
            }
        }
    }, 60000);
};

// Start cleanup on module load
startCleanupInterval();

// ═══════════════════════════════════════════════════════════
// COMMAND ALIASES
// ═══════════════════════════════════════════════════════════
const commandAliases = {
    'ttt': ['tictactoe', 'tic'],
    'rps': ['rockpaperscissors'],
    'flip': ['coinflip'],
    'wc': ['wordchain'],
    'eq': ['emojiquiz'],
    'type': ['fasttype'],
    'remove': ['kick'],
    'setsubject': ['setname'],
    'setdescription': ['setdesc'],
    'adminlist': ['admins'],
    'gcinfo': ['groupinfo'],
    'uptime': ['runtime']
};

const getCommand = (cmd) => {
    for (const [main, aliases] of Object.entries(commandAliases)) {
        if (aliases.includes(cmd)) {
            return main;
        }
    }
    return cmd;
};

// ═══════════════════════════════════════════════════════════
// MESSAGE HANDLER
// ═══════════════════════════════════════════════════════════
export const handleMessage = async (sock, msg) => {
    try {
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        const body = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     msg.message?.imageMessage?.caption || '';

        // Handle fast type game responses (no prefix)
        if (!body.startsWith(config.prefix)) {
            const gameId = `fasttype_${from}_${sender}`;
            const game = gameState.fasttype.get(gameId);
            
            if (game && body.toLowerCase().trim() === game.word.toLowerCase()) {
                // Check rate limit for fasttype
                if (!checkRateLimit(sender, 'fasttype_win', 10, 30000)) {
                    await sock.sendMessage(from, {
                        text: `⚠️ Too fast! Please wait a moment before playing again.`
                    }, { quoted: msg });
                    return;
                }
                
                const time = ((Date.now() - game.startTime) / 1000).toFixed(2);
                gameState.fasttype.delete(gameId);
                
                let rating = '';
                if (time < 2) rating = '🏆 LIGHTNING FAST!';
                else if (time < 4) rating = '🌟 Excellent!';
                else if (time < 6) rating = '👍 Good!';
                else rating = '👏 Nice try!';
                
                await sock.sendMessage(from, {
                    text: `✅ *CORRECT!*\n\nWord: ${game.word}\nTime: ${time}s\n${rating}`
                }, { quoted: msg });
                return;
            }
        }

        // Ignore messages without prefix
        if (!body.startsWith(config.prefix)) return;

        const args = body.slice(config.prefix.length).trim().split(/ +/);
        let cmd = args.shift().toLowerCase();
        const text = args.join(' ');

        // Handle command aliases
        cmd = getCommand(cmd);

        // Check rate limiting for commands
        if (!checkRateLimit(sender, cmd)) {
            await sock.sendMessage(from, { 
                text: `⚠️ Too many requests! Please wait a moment.` 
            }, { quoted: msg });
            return;
        }

        const reply = async (text) => await sock.sendMessage(from, { text }, { quoted: msg });
        const replyImg = async (text, img) => await sock.sendMessage(from, { 
            image: { url: img }, 
            caption: text 
        }, { quoted: msg });
        const mention = async (text, users) => await sock.sendMessage(from, { text, mentions: users }, { quoted: msg });

        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

        // Send typing indicator for complex commands
        await sock.sendPresenceUpdate('composing', from);
        setTimeout(() => sock.sendPresenceUpdate('paused', from), 1000);

        // ═══════════════════════════════════════════════════════════
        // CORE COMMANDS
        // ═══════════════════════════════════════════════════════════
        if (cmd === 'alive') {
            return await replyImg(
                `✅ *${config.botName} is Online!*\n\n` +
                `⏰ Uptime: ${formatUptime(Date.now() - config.startTime)}\n` +
                `📱 Prefix: ${config.prefix}\n\n` +
                `Type ${config.prefix}menu for commands!`,
                config.aliveImage
            );
        }

        if (cmd === 'menu' || cmd === 'help') {
            const activeGames = [...gameState.tictactoe.keys()].length + 
                               [...gameState.guess.keys()].length + 
                               [...gameState.fasttype.keys()].length +
                               [...gameState.wordchain.keys()].length +
                               [...gameState.quiz.keys()].length;
            
            return await replyImg(
`╔═══════════════════════════╗
║    *${config.botName}* 
╚═══════════════════════════╝

📊 *Bot Info*
├ Version: 2.0.0
├ Prefix: ${config.prefix}
├ Uptime: ${formatUptime(Date.now() - config.startTime)}
└ Active Games: ${activeGames}

━━━━━━━━━━━━━━━━━━━━━━━━

🎯 *CORE COMMANDS*
├ ${config.prefix}alive - Check status
├ ${config.prefix}ping - Check speed
├ ${config.prefix}menu - This menu
├ ${config.prefix}botinfo - Bot details
├ ${config.prefix}owner - Owner info
└ ${config.prefix}runtime - Uptime

🎮 *GAMES* (Fun Games!)
├ ${config.prefix}ttt @user - Tic Tac Toe
├ ${config.prefix}rps <choice> - Rock Paper Scissors
├ ${config.prefix}dice - Roll a dice
├ ${config.prefix}coinflip - Flip a coin
├ ${config.prefix}roll - Random 1-100
├ ${config.prefix}guess - Number guessing
├ ${config.prefix}ship @user1 @user2 - Love %
├ ${config.prefix}truth - Truth question
├ ${config.prefix}dare - Dare challenge
├ ${config.prefix}quiz - Trivia quiz
├ ${config.prefix}math - Math challenge
├ ${config.prefix}fasttype - Speed typing
├ ${config.prefix}wordchain - Word chain game
└ ${config.prefix}emojiquiz - Emoji quiz

🎪 *FUN COMMANDS*
├ ${config.prefix}joke - Random joke
├ ${config.prefix}fact - Random fact
├ ${config.prefix}roast - Light roast
└ ${config.prefix}compliment - Get compliment

👥 *GROUP ADMIN* (Admin Only)
├ ${config.prefix}add <number> - Add member
├ ${config.prefix}kick @user - Kick member
├ ${config.prefix}promote @user - Make admin
├ ${config.prefix}demote @user - Remove admin
├ ${config.prefix}tagall - Tag everyone
├ ${config.prefix}hidetag - Hidden tag
├ ${config.prefix}group <open/close> - Toggle
├ ${config.prefix}setname <n> - Change name
├ ${config.prefix}setdesc <desc> - Change desc
├ ${config.prefix}admins - List admins
└ ${config.prefix}groupinfo - Group details

━━━━━━━━━━━━━━━━━━━━━━━━

✨ *${config.botName}* - Made with ❤️`,
                config.menuImage
            );
        }

        if (cmd === 'ping') {
            const start = Date.now();
            await reply('🏓 Pinging...');
            return await reply(`🏓 *Pong!*\n⚡ Speed: ${Date.now() - start}ms`);
        }

        if (cmd === 'botinfo') {
            return await reply(
`🤖 *Bot Information*

📱 Name: ${config.botName}
🔢 Version: 2.0.0
⚙️ Prefix: ${config.prefix}
⏰ Uptime: ${formatUptime(Date.now() - config.startTime)}
📊 Runtime: ${new Date(config.startTime).toLocaleString()}
`);
        }

        if (cmd === 'owner') {
            return await reply(
`👤 *Bot Owner Information*

📱 Owner Numbers:
${config.ownerNumber ? config.ownerNumber.split(',').map(n => `• +${n.trim()}`).join('\n') : '+91 8304063560'}

💬 Contact:
• For bot issues, contact owner
• For features, suggest to dev
• For bugs, report to owner
`);
        }

        if (cmd === 'runtime') {
            const uptime = Date.now() - config.startTime;
            return await reply(
`⏰ *Runtime Information*

🕐 Started: ${new Date(config.startTime).toLocaleString()}
⏱️ Uptime: ${formatUptime(uptime)}
📊 Status: Online & Stable

💾 Game Sessions:
• Tic Tac Toe: ${gameState.tictactoe.size}
• Guess Number: ${gameState.guess.size}
• Fast Type: ${gameState.fasttype.size}
• Word Chain: ${gameState.wordchain.size}
• Quiz: ${gameState.quiz.size}`);
        }

        // ═══════════════════════════════════════════════════════════
        // GAMES
        // ═══════════════════════════════════════════════════════════
        
        // TIC TAC TOE
        if (cmd === 'ttt') {
            if (!isGroup) return await reply('❌ This game is for groups only!');
            
            // Playing a move
            if (args[0] && !isNaN(args[0])) {
                const gameId = `ttt_${from}`;
                const game = gameState.tictactoe.get(gameId);
                if (!game) return await reply('❌ No active game! Start with: .ttt @user');
                
                const currentPlayer = game.players[game.turn];
                if (sender !== currentPlayer) return await reply('❌ Not your turn!');
                
                const pos = parseInt(args[0]) - 1;
                if (pos < 0 || pos > 8) return await reply('❌ Invalid position! Use 1-9');
                if (game.board[pos] !== ' ') return await reply('❌ Position already taken!');
                
                // Update last activity
                game.lastActivity = Date.now();
                
                const symbol = game.turn === 0 ? '❌' : '⭕';
                game.board[pos] = symbol;
                
                const checkWin = (b, s) => {
                    const wins = [
                        [0,1,2], [3,4,5], [6,7,8],
                        [0,3,6], [1,4,7], [2,5,8],
                        [0,4,8], [2,4,6]
                    ];
                    return wins.some(w => w.every(i => b[i] === s));
                };
                
                const renderBoard = (b) => `
┏━━━┳━━━┳━━━┓
┃ ${b[0]} ┃ ${b[1]} ┃ ${b[2]} ┃
┣━━━╋━━━╋━━━┫
┃ ${b[3]} ┃ ${b[4]} ┃ ${b[5]} ┃
┣━━━╋━━━╋━━━┫
┃ ${b[6]} ┃ ${b[7]} ┃ ${b[8]} ┃
┗━━━┻━━━┻━━━┛`;
                
                if (checkWin(game.board, symbol)) {
                    gameState.tictactoe.delete(gameId);
                    return await mention(
`🎉 *GAME OVER!*

${renderBoard(game.board)}

🏆 Winner: @${sender.split('@')[0]}
${symbol} Congratulations!`,
                        [sender, game.players[1 - game.turn]]
                    );
                }
                
                if (!game.board.includes(' ')) {
                    gameState.tictactoe.delete(gameId);
                    return await mention(`🤝 *DRAW!*\n${renderBoard(game.board)}\n\nNo winner!`, game.players);
                }
                
                game.turn = 1 - game.turn;
                const nextPlayer = game.players[game.turn];
                const nextSymbol = game.turn === 0 ? '❌' : '⭕';
                
                return await mention(
`🎮 *TIC TAC TOE*\n${renderBoard(game.board)}\n\nTurn: ${nextSymbol} @${nextPlayer.split('@')[0]}\nUse: ${config.prefix}ttt <1-9>`,
                    game.players
                );
            }
            
            // Starting new game
            if (mentionedJid.length === 0) return await reply('❌ Mention a player!\nUsage: .ttt @user');
            
            const opponent = mentionedJid[0];
            if (opponent === sender) return await reply('❌ You cannot play with yourself!');
            
            const gameId = `ttt_${from}`;
            if (gameState.tictactoe.has(gameId)) return await reply('❌ A game is already running!');
            
            const board = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
            gameState.tictactoe.set(gameId, {
                board,
                players: [sender, opponent],
                turn: 0,
                createdAt: Date.now(),
                lastActivity: Date.now()
            });
            
            const renderBoard = (b) => `
┏━━━┳━━━┳━━━┓
┃ ${b[0]} ┃ ${b[1]} ┃ ${b[2]} ┃
┣━━━╋━━━╋━━━┫
┃ ${b[3]} ┃ ${b[4]} ┃ ${b[5]} ┃
┣━━━╋━━━╋━━━┫
┃ ${b[6]} ┃ ${b[7]} ┃ ${b[8]} ┃
┗━━━┻━━━┻━━━┛`;
            
            return await mention(
`🎮 *TIC TAC TOE STARTED!*\n${renderBoard(board)}\n\n❌ Player 1: @${sender.split('@')[0]}\n⭕ Player 2: @${opponent.split('@')[0]}\n\nTurn: ❌ @${sender.split('@')[0]}\n\nUse: ${config.prefix}ttt <1-9> to play`,
                [sender, opponent]
            );
        }

        // ROCK PAPER SCISSORS
        if (cmd === 'rps') {
            if (!args[0]) return await reply('Usage: .rps <rock/paper/scissors>');
            
            const choices = ['rock', 'paper', 'scissors'];
            const userChoice = args[0].toLowerCase();
            
            if (!choices.includes(userChoice)) return await reply('❌ Invalid! Use: rock, paper, or scissors');
            
            const botChoice = random(choices);
            const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
            
            let result = '';
            if (userChoice === botChoice) {
                result = '🤝 *DRAW!*';
            } else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) {
                result = '🎉 *YOU WIN!*';
            } else {
                result = '😔 *YOU LOSE!*';
            }
            
            return await reply(`🎮 *ROCK PAPER SCISSORS*\n\nYou: ${emojis[userChoice]} ${userChoice.toUpperCase()}\nBot: ${emojis[botChoice]} ${botChoice.toUpperCase()}\n\n${result}`);
        }

        // DICE
        if (cmd === 'dice') {
            const dice = Math.floor(Math.random() * 6) + 1;
            const diceEmoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][dice - 1];
            return await reply(`🎲 *DICE ROLL*\n\n${diceEmoji}\n\nYou rolled: *${dice}*`);
        }

        // COIN FLIP
        if (cmd === 'coinflip') {
            const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
            const emoji = result === 'HEADS' ? '👑' : '💰';
            return await reply(`🪙 *COIN FLIP*\n\n${emoji}\n\nResult: *${result}*`);
        }

        // ROLL
        if (cmd === 'roll') {
            const number = Math.floor(Math.random() * 100) + 1;
            return await reply(`🎲 *RANDOM ROLL*\n\nYou rolled: *${number}*/100`);
        }

        // GUESS NUMBER
        if (cmd === 'guess') {
            const gameId = `guess_${from}_${sender}`;
            
            if (!args[0]) {
                if (!gameState.guess.has(gameId)) {
                    const number = Math.floor(Math.random() * 100) + 1;
                    gameState.guess.set(gameId, { 
                        number, 
                        attempts: 0, 
                        createdAt: Date.now(),
                        lastActivity: Date.now()
                    });
                    return await reply(`🎯 *NUMBER GUESSING GAME*\n\nI'm thinking of a number between 1-100!\n\nUsage: ${config.prefix}guess <number>`);
                }
                return await reply('Usage: .guess <number>');
            }

            const game = gameState.guess.get(gameId);
            if (!game) {
                const number = Math.floor(Math.random() * 100) + 1;
                gameState.guess.set(gameId, { 
                    number, 
                    attempts: 1, 
                    createdAt: Date.now(),
                    lastActivity: Date.now()
                });
            }

            const userGuess = parseInt(args[0]);
            if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
                return await reply('❌ Please enter a number between 1-100!');
            }

            const activeGame = gameState.guess.get(gameId);
            activeGame.attempts++;
            activeGame.lastActivity = Date.now();

            if (userGuess === activeGame.number) {
                gameState.guess.delete(gameId);
                return await reply(`🎉 *CORRECT!*\n\nNumber: ${activeGame.number}\nAttempts: ${activeGame.attempts}\n${activeGame.attempts <= 5 ? '🌟 Excellent!' : '👏 Well done!'}`);
            }

            const hint = userGuess < activeGame.number ? '📈 Higher!' : '📉 Lower!';
            return await reply(`${hint}\n\nAttempts: ${activeGame.attempts}\nTry: ${config.prefix}guess <number>`);
        }

        // SHIP
        if (cmd === 'ship') {
            if (mentionedJid.length < 2) return await reply('❌ Mention 2 users!\nUsage: .ship @user1 @user2');
            
            const user1 = mentionedJid[0];
            const user2 = mentionedJid[1];
            const percentage = Math.floor(Math.random() * 101);
            
            let emoji = '', message = '';
            if (percentage < 20) { emoji = '💔'; message = 'Not meant to be...'; }
            else if (percentage < 40) { emoji = '😐'; message = 'Maybe friends?'; }
            else if (percentage < 60) { emoji = '😊'; message = 'Could work!'; }
            else if (percentage < 80) { emoji = '😍'; message = 'Great match!'; }
            else { emoji = '💖'; message = 'Perfect couple!'; }
            
            return await mention(`💘 *LOVE CALCULATOR*\n\n@${user1.split('@')[0]} × @${user2.split('@')[0]}\n\n${emoji} *${percentage}%* ${emoji}\n\n${message}`, [user1, user2]);
        }

        // TRUTH
        if (cmd === 'truth') {
            return await reply(`🎭 *TRUTH*\n\n${random(gameData.truths)}`);
        }

        // DARE
        if (cmd === 'dare') {
            return await reply(`🎯 *DARE*\n\n${random(gameData.dares)}`);
        }

        // QUIZ
        if (cmd === 'quiz') {
            const gameId = `quiz_${from}_${sender}`;
            
            if (!gameState.quiz.has(gameId)) {
                const question = random(gameData.quizzes);
                gameState.quiz.set(gameId, { 
                    question, 
                    createdAt: Date.now(),
                    lastActivity: Date.now()
                });
                
                const shuffled = [...question.opts].sort(() => Math.random() - 0.5);
                return await reply(`❓ *QUIZ TIME*\n\n${question.q}\n\nOptions:\n${shuffled.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nReply: ${config.prefix}quiz <answer>`);
            }
            
            if (!text) return await reply('❌ Provide answer!\nUsage: .quiz <answer>');
            
            const game = gameState.quiz.get(gameId);
            const userAnswer = text.toLowerCase().trim();
            
            gameState.quiz.delete(gameId);
            
            if (userAnswer === game.question.a || game.question.opts.some(opt => opt.toLowerCase() === userAnswer && opt.toLowerCase() === game.question.a)) {
                return await reply(`✅ *CORRECT!*\n\nAnswer: ${game.question.a}\n🎉 Well done!`);
            } else {
                return await reply(`❌ *WRONG!*\n\nCorrect answer: ${game.question.a}`);
            }
        }

        // MATH
        if (cmd === 'math') {
            const gameId = `math_${from}_${sender}`;
            
            if (!args[0]) {
                const ops = ['+', '-', '*'];
                const op = random(ops);
                let num1 = Math.floor(Math.random() * 20) + 1;
                let num2 = Math.floor(Math.random() * 20) + 1;
                
                if (op === '*') {
                    num1 = Math.floor(Math.random() * 12) + 1;
                    num2 = Math.floor(Math.random() * 12) + 1;
                }
                
                let answer;
                if (op === '+') answer = num1 + num2;
                else if (op === '-') answer = num1 - num2;
                else answer = num1 * num2;
                
                gameState.quiz.set(gameId, {
                    question: { q: `${num1} ${op} ${num2}`, a: answer.toString() },
                    createdAt: Date.now(),
                    lastActivity: Date.now()
                });
                
                return await reply(`🧮 *MATH CHALLENGE*\n\nSolve: *${num1} ${op} ${num2} = ?*\n\nReply: ${config.prefix}math <answer>`);
            }
            
            const game = gameState.quiz.get(gameId);
            if (!game) return await reply('❌ No active challenge! Start: .math');
            
            const userAnswer = args[0];
            gameState.quiz.delete(gameId);
            
            if (userAnswer === game.question.a) {
                return await reply(`✅ *CORRECT!*\n\n${game.question.q} = ${game.question.a}\n🎉 Great!`);
            } else {
                return await reply(`❌ *WRONG!*\n\nAnswer: ${game.question.a}`);
            }
        }

        // FAST TYPE
        if (cmd === 'fasttype') {
            const gameId = `fasttype_${from}_${sender}`;
            
            if (gameState.fasttype.has(gameId)) return await reply('❌ You have an active game!');
            
            const word = random(gameData.fasttypeWords);
            gameState.fasttype.set(gameId, {
                word,
                startTime: Date.now(),
                createdAt: Date.now(),
                lastActivity: Date.now()
            });
            
            return await reply(`⚡ *FAST TYPE CHALLENGE*\n\nType this word as fast as you can:\n\n*${word}*\n\nJust type the word (no command)!`);
        }

        // WORD CHAIN
        if (cmd === 'wordchain') {
            const gameId = `wordchain_${from}`;
            
            if (!gameState.wordchain.has(gameId)) {
                const startWord = random(['apple', 'elephant', 'tiger', 'rainbow', 'ocean']);
                gameState.wordchain.set(gameId, {
                    lastWord: startWord,
                    words: [startWord],
                    players: new Set([sender]),
                    createdAt: Date.now(),
                    lastActivity: Date.now()
                });
                
                return await reply(`🔗 *WORD CHAIN GAME*\n\nStarting word: *${startWord}*\nNext must start with: *${startWord.slice(-1).toUpperCase()}*\n\nReply: ${config.prefix}wc <word>`);
            }
            
            if (!args[0]) {
                const game = gameState.wordchain.get(gameId);
                return await reply(`Current: *${game.lastWord}*\nNext starts with: *${game.lastWord.slice(-1).toUpperCase()}*`);
            }
            
            const game = gameState.wordchain.get(gameId);
            const newWord = args[0].toLowerCase();
            const lastLetter = game.lastWord.slice(-1);
            
            if (newWord[0] !== lastLetter) return await reply(`❌ Must start with *${lastLetter.toUpperCase()}*!`);
            if (game.words.includes(newWord)) return await reply(`❌ "${newWord}" already used!`);
            if (newWord.length < 3) return await reply(`❌ Minimum 3 letters!`);
            
            game.lastWord = newWord;
            game.words.push(newWord);
            game.players.add(sender);
            game.lastActivity = Date.now();
            
            return await reply(`✅ *${newWord.toUpperCase()}*\n\nChain: ${game.words.length} words\nPlayers: ${game.players.size}\n\nNext starts with: *${newWord.slice(-1).toUpperCase()}*`);
        }

        // EMOJI QUIZ
        if (cmd === 'emojiquiz') {
            const gameId = `emojiquiz_${from}_${sender}`;
            
            if (!gameState.quiz.has(gameId)) {
                const quiz = random(gameData.emojiquiz);
                gameState.quiz.set(gameId, { 
                    question: quiz, 
                    createdAt: Date.now(),
                    lastActivity: Date.now()
                });
                
                return await reply(`🎯 *EMOJI QUIZ*\n\n${quiz.emoji}\n\nHint: ${quiz.hint}\n\nReply: ${config.prefix}eq <answer>`);
            }
            
            if (!text) return await reply('❌ Provide answer!\nUsage: .eq <answer>');
            
            const game = gameState.quiz.get(gameId);
            const userAnswer = text.toLowerCase().trim();
            
            gameState.quiz.delete(gameId);
            
            if (userAnswer === game.question.answer) {
                return await reply(`✅ *CORRECT!*\n\n${game.question.emoji} = ${game.question.answer}\n🎉 Well done!`);
            } else {
                return await reply(`❌ *WRONG!*\n\nAnswer: ${game.question.answer}`);
            }
        }

        // ═══════════════════════════════════════════════════════════
        // FUN COMMANDS
        // ═══════════════════════════════════════════════════════════
        
        if (cmd === 'joke') {
            return await reply(random(gameData.jokes));
        }
        
        if (cmd === 'fact') {
            return await reply(random(gameData.facts));
        }
        
        if (cmd === 'roast') {
            if (mentionedJid.length > 0) {
                return await mention(`@${mentionedJid[0].split('@')[0]}, ${random(gameData.roasts)}`, mentionedJid);
            }
            return await reply(random(gameData.roasts));
        }
        
        if (cmd === 'compliment') {
            if (mentionedJid.length > 0) {
                return await mention(`@${mentionedJid[0].split('@')[0]}, ${random(gameData.compliments)}`, mentionedJid);
            }
            return await reply(random(gameData.compliments));
        }

        // ═══════════════════════════════════════════════════════════
        // SUDO COMMANDS (Owner Only)
        // ═══════════════════════════════════════════════════════════
        
        if (cmd === 'addsudo') {
            if (!isOwner(sender)) return await reply('❌ Owner only command!');
            
            const target = mentionedJid[0] || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
            if (!target) return await reply('Usage: .addsudo @user or .addsudo 919876543210');
            
            const targetNum = target.split('@')[0];
            if (!validatePhoneNumber(targetNum)) {
                return await reply('❌ Invalid phone number!');
            }
            
            if (global.sudoUsers.includes(targetNum)) {
                return await reply(`✅ @${targetNum} is already a sudo user!`);
            }
            
            global.sudoUsers.push(targetNum);
            try {
                fs.writeFileSync(
                    path.join(__dirname, 'auth_info', 'sudo.json'),
                    JSON.stringify(global.sudoUsers, null, 2)
                );
                return await reply(`✅ Added @${targetNum} as sudo user!\n\nSudo users have admin privileges.`);
            } catch (err) {
                console.error('Failed to save sudo users:', err);
                return await reply('✅ User added temporarily (failed to save to file).');
            }
        }
        
        if (cmd === 'delsudo') {
            if (!isOwner(sender)) return await reply('❌ Owner only command!');
            
            const target = mentionedJid[0] || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
            if (!target) return await reply('Usage: .delsudo @user or .delsudo 919876543210');
            
            const targetNum = target.split('@')[0];
            if (!global.sudoUsers.includes(targetNum)) {
                return await reply(`❌ @${targetNum} is not a sudo user!`);
            }
            
            global.sudoUsers = global.sudoUsers.filter(u => u !== targetNum);
            try {
                fs.writeFileSync(
                    path.join(__dirname, 'auth_info', 'sudo.json'),
                    JSON.stringify(global.sudoUsers, null, 2)
                );
                return await reply(`✅ Removed @${targetNum} from sudo users!`);
            } catch (err) {
                console.error('Failed to save sudo users:', err);
                return await reply('✅ User removed temporarily (failed to save to file).');
            }
        }
        
        if (cmd === 'listsudo') {
            if (!isOwner(sender)) return await reply('❌ Owner only command!');
            
            if (global.sudoUsers.length === 0) {
                return await reply('📋 *SUDO USERS*\n\nNo sudo users added yet.');
            }
            
            return await reply(`📋 *SUDO USERS*\n\n${global.sudoUsers.map((u, i) => `${i + 1}. +${u}`).join('\n')}\n\nTotal: ${global.sudoUsers.length}`);
        }

        // ═══════════════════════════════════════════════════════════
        // GROUP ADMIN COMMANDS
        // ═══════════════════════════════════════════════════════════
        
        if (!isGroup) {
            if (['add', 'kick', 'promote', 'demote', 'tagall', 'hidetag', 'group', 'setname', 'setdesc', 'admins', 'groupinfo'].includes(cmd)) {
                return await reply('❌ This command is for groups only!');
            }
        }
        
        const senderIsAdmin = await isAdmin(sock, from, sender) || isSudo(sender) || isOwner(sender);
        const botIsAdmin = await isBotAdmin(sock, from);
        
        // ADD
        if (cmd === 'add') {
            if (!senderIsAdmin) return await reply('❌ Admin only!');
            if (!botIsAdmin) return await reply('❌ Bot must be admin!');
            if (!args[0]) return await reply('Usage: .add 919876543210');
            
            const number = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!validatePhoneNumber(args[0].replace(/[^0-9]/g, ''))) {
                return await reply('❌ Invalid phone number format!');
            }
            
            try {
                await sock.groupParticipantsUpdate(from, [number], 'add');
                return await reply('✅ Member added!');
            } catch (err) {
                console.error('Add error:', err);
                return await reply('❌ Failed to add member! Check if number is valid.');
            }
        }
        
        // KICK
        if (cmd === 'kick') {
            if (!senderIsAdmin) return await reply('❌ Admin only!');
            if (!botIsAdmin) return await reply('❌ Bot must be admin!');
            
            const target = mentionedJid[0] || (quotedMsg && quotedParticipant);
            if (!target) return await reply('❌ Mention or reply to user!');
            
            try {
                await sock.groupParticipantsUpdate(from, [target], 'remove');
                return await reply('✅ Member removed!');
            } catch (err) {
                console.error('Kick error:', err);
                return await reply('❌ Failed to remove!');
            }
        }
        
        // PROMOTE
        if (cmd === 'promote') {
            if (!senderIsAdmin) return await reply('❌ Admin only!');
            if (!botIsAdmin) return await reply('❌ Bot must be admin!');
            
            const target = mentionedJid[0] || (quotedMsg && quotedParticipant);
            if (!target) return await reply('❌ Mention or reply to user!');
            
            try {
                await sock.groupParticipantsUpdate(from, [target], 'promote');
                return await mention(`✅ @${target.split('@')[0]} is now admin!`, [target]);
            } catch (err) {
                console.error('Promote error:', err);
                return await reply('❌ Failed to promote!');
            }
        }
        
        // DEMOTE
        if (cmd === 'demote') {
            if (!senderIsAdmin) return await reply('❌ Admin only!');
            if (!botIsAdmin) return await reply('❌ Bot must be admin!');
            
            const target = mentionedJid[0] || (quotedMsg && quotedParticipant);
            if (!target) return await reply('❌ Mention or reply to user!');
            
            try {
                await sock.groupParticipantsUpdate(from, [target], 'demote');
                return await mention(`✅ @${target.split('@')[0]} removed from admin!`, [target]);
            } catch (err) {
                console.error('Demote error:', err);
                return await reply('❌ Failed to demote!');
            }
        }
        
        // TAGALL
        if (cmd === 'tagall') {
            if (!senderIsAdmin) return await reply('❌ Admin only!');
            
            // Check rate limit for tagall
            if (!checkRateLimit(sender, 'tagall', 1, 300000)) { // 5 minutes cooldown
                return await reply('⚠️ Please wait 5 minutes before using tagall again!');
            }
            
            try {
                const metadata = await sock.groupMetadata(from);
                const participants = metadata.participants.map(p => p.id);
                const message = text || 'Important announcement!';
                
                return await mention(
`📢 *GROUP ANNOUNCEMENT*\n\n${message}\n\n${participants.map(p => `@${p.split('@')[0]}`).join('\n')}`,
                    participants
                );
            } catch (err) {
                console.error('Tagall error:', err);
                return await reply('❌ Failed to fetch group members!');
            }
        }
        
        // HIDETAG
        if (cmd === 'hidetag') {
            if (!senderIsAdmin) return await reply('❌ Admin only!');
            
            // Check rate limit for hidetag
            if (!checkRateLimit(sender, 'hidetag', 2, 120000)) { // 2 minutes cooldown
                return await reply('⚠️ Please wait 2 minutes before using hidetag again!');
            }
            
            try {
                const metadata = await sock.groupMetadata(from);
                const participants = metadata.participants.map(p => p.id);
                const message = text || 'Hidden tag message';
                
                return await mention(message, participants);
            } catch (err) {
                console.error('Hidetag error:', err);
                return await reply('❌ Failed to fetch group members!');
            }
        }
        
        // GROUP SETTINGS
        if (cmd === 'group') {
            if (!senderIsAdmin) return await reply('❌ Admin only!');
            if (!botIsAdmin) return await reply('❌ Bot must be admin!');
            if (!args[0]) return await reply('Usage: .group <open/close>');
            
            const action = args[0].toLowerCase();
            if (action === 'open') {
                await sock.groupSettingUpdate(from, 'not_announcement');
                return await reply('✅ Group opened!');
            } else if (action === 'close') {
                await sock.groupSettingUpdate(from, 'announcement');
                return await reply('✅ Group closed!');
            } else {
                return await reply('❌ Invalid! Use: open or close');
            }
        }
        
        // SETNAME
        if (cmd === 'setname') {
            if (!senderIsAdmin) return await reply('❌ Admin only!');
            if (!botIsAdmin) return await reply('❌ Bot must be admin!');
            if (!text) return await reply('Usage: .setname <new name>');
            
            const sanitizedText = sanitizeText(text, 25);
            try {
                await sock.groupUpdateSubject(from, sanitizedText);
                return await reply(`✅ Group name: ${sanitizedText}`);
            } catch (err) {
                console.error('Setname error:', err);
                return await reply('❌ Failed to change name!');
            }
        }
        
        // SETDESC
        if (cmd === 'setdesc') {
            if (!senderIsAdmin) return await reply('❌ Admin only!');
            if (!botIsAdmin) return await reply('❌ Bot must be admin!');
            if (!text) return await reply('Usage: .setdesc <description>');
            
            const sanitizedText = sanitizeText(text, 500);
            try {
                await sock.groupUpdateDescription(from, sanitizedText);
                return await reply(`✅ Description updated!`);
            } catch (err) {
                console.error('Setdesc error:', err);
                return await reply('❌ Failed to update description!');
            }
        }
        
        // ADMINS
        if (cmd === 'admins') {
            try {
                const metadata = await sock.groupMetadata(from);
                const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
                
                if (admins.length === 0) {
                    return await reply('👥 *GROUP ADMINS*\n\nNo admins found!');
                }
                
                return await mention(
`👥 *GROUP ADMINS*\n\n${admins.map((a, i) => `${i + 1}. @${a.id.split('@')[0]}`).join('\n')}\n\nTotal: ${admins.length}`,
                    admins.map(a => a.id)
                );
            } catch (err) {
                console.error('Admins error:', err);
                return await reply('❌ Failed to fetch group admins!');
            }
        }
        
        // GROUPINFO
        if (cmd === 'groupinfo') {
            try {
                const metadata = await sock.groupMetadata(from);
                const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
                
                return await reply(
`📊 *GROUP INFO*\n\n📱 Name: ${metadata.subject}\n🆔 ID: ${metadata.id}\n👥 Members: ${metadata.participants.length}\n👤 Admins: ${admins.length}\n📝 Desc: ${metadata.desc || 'None'}\n📅 Created: ${new Date(metadata.creation * 1000).toDateString()}`);
            } catch (err) {
                console.error('Groupinfo error:', err);
                return await reply('❌ Failed to fetch group info!');
            }
        }

        // Unknown command
        await reply(`❌ Unknown command: ${cmd}\nType ${config.prefix}menu for available commands.`);

    } catch (err) {
        console.error('Handler error:', err);
        try {
            const from = msg.key.remoteJid;
            await sock.sendMessage(from, { 
                text: '❌ An error occurred while processing your command. Please try again.' 
            });
        } catch (sendErr) {
            console.error('Failed to send error message:', sendErr);
        }
    }
};

// ═══════════════════════════════════════════════════════════
// EXPORT CLEANUP FUNCTION
// ═══════════════════════════════════════════════════════════
export const cleanup = () => {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        console.log('Game cleanup interval stopped');
    }
    
    // Clear all game states
    for (const games of Object.values(gameState)) {
        games.clear();
    }
    
    console.log('All game states cleared');
};

// ═══════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN HANDLER
// ═══════════════════════════════════════════════════════════
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    cleanup();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived termination signal...');
    cleanup();
    process.exit(0);
});

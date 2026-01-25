import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════
const config = {
    prefix: process.env.PREFIX || '.',
    ownerNumber: process.env.OWNER_NUMBER || '',
    botName: process.env.BOT_NAME || 'Forka',
    menuImage: process.env.MENU_IMAGE || 'https://i.imgur.com/6DwHKh9.jpeg',
    aliveImage: process.env.ALIVE_IMAGE || 'https://i.imgur.com/MKtoXKz.jpeg',
    startTime: Date.now()
};

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
        "Do 20 push-ups and send a video",
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
        "javascript", "whatsapp", "gaming", "programming", "developer",
        "technology", "computer", "keyboard", "smartphone", "internet",
        "coding", "software", "hardware", "algorithm", "database"
    ]
};

// Auto cleanup games after 5 minutes
setInterval(() => {
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
    return config.ownerNumber.split(',').some(owner => owner.trim() === num);
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
            const gameId = `${from}_${sender}`;
            const game = gameState.fasttype.get(gameId);
            
            if (game && body.toLowerCase().trim() === game.word.toLowerCase()) {
                const time = ((Date.now() - game.startTime) / 1000).toFixed(2);
                gameState.fasttype.delete(gameId);
                
                let rating = '';
                if (time < 2) rating = '🏆 LIGHTNING FAST!';
                else if (time < 4) rating = '🌟 Excellent!';
                else if (time < 6) rating = '👍 Good!';
                else rating = '👏 Nice try!';
                
                return sock.sendMessage(from, {
                    text: `✅ *CORRECT!*\n\nWord: ${game.word}\nTime: ${time}s\n${rating}`
                }, { quoted: msg });
            }
            return;
        }

        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();
        const text = args.join(' ');

        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const replyImg = (text, img) => sock.sendMessage(from, { 
            image: { url: img }, 
            caption: text 
        }, { quoted: msg });
        const mention = (text, users) => sock.sendMessage(from, { text, mentions: users }, { quoted: msg });

        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

        // ═══════════════════════════════════════════════════════════
        // CORE COMMANDS
        // ═══════════════════════════════════════════════════════════
        if (cmd === 'alive') {
            return replyImg(
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
            
            return replyImg(
`╔═══════════════════════════╗
║  🎮 *${config.botName}* 🎮
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

🎮 *GAMES* (14 Games!)
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

💡 *Tips*
• Games timeout after 5 minutes
• @ mention users to play with
• All games work in groups
• No external APIs needed!

━━━━━━━━━━━━━━━━━━━━━━━━

✨ *${config.botName}* - Made with ❤️`,
                config.menuImage
            );
        }

        if (cmd === 'ping') {
            const start = Date.now();
            await reply('🏓 Pinging...');
            return reply(`🏓 *Pong!*\n⚡ Speed: ${Date.now() - start}ms`);
        }

        if (cmd === 'botinfo') {
            return reply(
`🤖 *Bot Information*

📱 Name: ${config.botName}
🔢 Version: 2.0.0
⚙️ Prefix: ${config.prefix}
⏰ Uptime: ${formatUptime(Date.now() - config.startTime)}
📊 Runtime: ${new Date(config.startTime).toLocaleString()}

🎮 Features:
• 14+ Games (No APIs)
• Group Management
• Fun Commands
• Admin Tools
• Multi-user Games

💻 Tech Stack:
• Node.js
• Baileys
• ES Modules
• In-Memory Storage`);
        }

        if (cmd === 'owner') {
            return reply(
`👤 *Bot Owner Information*

📱 Owner Numbers:
${config.ownerNumber ? config.ownerNumber.split(',').map(n => `• +${n.trim()}`).join('\n') : '• Not configured'}

💬 Contact:
• For bot issues, contact owner
• For features, suggest to dev
• For bugs, report to owner

🔐 Owner Commands:
• Full bot control
• Group management override
• Special permissions`);
        }

        if (cmd === 'runtime' || cmd === 'uptime') {
            const uptime = Date.now() - config.startTime;
            return reply(
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
        if (cmd === 'ttt' || cmd === 'tictactoe') {
            if (!isGroup) return reply('❌ This game is for groups only!');
            
            // Playing a move
            if (args[0] && !isNaN(args[0])) {
                const gameId = from;
                const game = gameState.tictactoe.get(gameId);
                if (!game) return reply('❌ No active game! Start with: .ttt @user');
                
                const currentPlayer = game.players[game.turn];
                if (sender !== currentPlayer) return reply('❌ Not your turn!');
                
                const pos = parseInt(args[0]) - 1;
                if (pos < 0 || pos > 8) return reply('❌ Invalid position! Use 1-9');
                if (game.board[pos] !== ' ') return reply('❌ Position already taken!');
                
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
                    return mention(
`🎉 *GAME OVER!*

${renderBoard(game.board)}

🏆 Winner: @${sender.split('@')[0]}
${symbol} Congratulations!`,
                        [sender, game.players[1 - game.turn]]
                    );
                }
                
                if (!game.board.includes(' ')) {
                    gameState.tictactoe.delete(gameId);
                    return mention(`🤝 *DRAW!*\n${renderBoard(game.board)}\n\nNo winner!`, game.players);
                }
                
                game.turn = 1 - game.turn;
                const nextPlayer = game.players[game.turn];
                const nextSymbol = game.turn === 0 ? '❌' : '⭕';
                
                return mention(
`🎮 *TIC TAC TOE*\n${renderBoard(game.board)}\n\nTurn: ${nextSymbol} @${nextPlayer.split('@')[0]}\nUse: ${config.prefix}ttt <1-9>`,
                    game.players
                );
            }
            
            // Starting new game
            if (mentionedJid.length === 0) return reply('❌ Mention a player!\nUsage: .ttt @user');
            
            const opponent = mentionedJid[0];
            if (opponent === sender) return reply('❌ You cannot play with yourself!');
            
            const gameId = from;
            if (gameState.tictactoe.has(gameId)) return reply('❌ A game is already running!');
            
            const board = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
            gameState.tictactoe.set(gameId, {
                board,
                players: [sender, opponent],
                turn: 0,
                createdAt: Date.now()
            });
            
            const renderBoard = (b) => `
┏━━━┳━━━┳━━━┓
┃ ${b[0]} ┃ ${b[1]} ┃ ${b[2]} ┃
┣━━━╋━━━╋━━━┫
┃ ${b[3]} ┃ ${b[4]} ┃ ${b[5]} ┃
┣━━━╋━━━╋━━━┫
┃ ${b[6]} ┃ ${b[7]} ┃ ${b[8]} ┃
┗━━━┻━━━┻━━━┛`;
            
            return mention(
`🎮 *TIC TAC TOE STARTED!*\n${renderBoard(board)}\n\n❌ Player 1: @${sender.split('@')[0]}\n⭕ Player 2: @${opponent.split('@')[0]}\n\nTurn: ❌ @${sender.split('@')[0]}\n\nUse: ${config.prefix}ttt <1-9> to play`,
                [sender, opponent]
            );
        }

        // ROCK PAPER SCISSORS
        if (cmd === 'rps') {
            if (!args[0]) return reply('Usage: .rps <rock/paper/scissors>');
            
            const choices = ['rock', 'paper', 'scissors'];
            const userChoice = args[0].toLowerCase();
            
            if (!choices.includes(userChoice)) return reply('❌ Invalid! Use: rock, paper, or scissors');
            
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
            
            return reply(`🎮 *ROCK PAPER SCISSORS*\n\nYou: ${emojis[userChoice]} ${userChoice.toUpperCase()}\nBot: ${emojis[botChoice]} ${botChoice.toUpperCase()}\n\n${result}`);
        }

        // DICE
        if (cmd === 'dice') {
            const dice = Math.floor(Math.random() * 6) + 1;
            const diceEmoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][dice - 1];
            return reply(`🎲 *DICE ROLL*\n\n${diceEmoji}\n\nYou rolled: *${dice}*`);
        }

        // COIN FLIP
        if (cmd === 'coinflip' || cmd === 'flip') {
            const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
            const emoji = result === 'HEADS' ? '👑' : '💰';
            return reply(`🪙 *COIN FLIP*\n\n${emoji}\n\nResult: *${result}*`);
        }

        // ROLL
        if (cmd === 'roll') {
            const number = Math.floor(Math.random() * 100) + 1;
            return reply(`🎲 *RANDOM ROLL*\n\nYou rolled: *${number}*/100`);
        }

        // GUESS NUMBER
        if (cmd === 'guess') {
            const gameId = `${from}_${sender}`;
            
            if (!args[0]) {
                if (!gameState.guess.has(gameId)) {
                    const number = Math.floor(Math.random() * 100) + 1;
                    gameState.guess.set(gameId, { number, attempts: 0, createdAt: Date.now() });
                    return reply(`🎯 *NUMBER GUESSING GAME*\n\nI'm thinking of a number between 1-100!\n\nUsage: ${config.prefix}guess <number>`);
                }
                return reply('Usage: .guess <number>');
            }

            const game = gameState.guess.get(gameId);
            if (!game) {
                const number = Math.floor(Math.random() * 100) + 1;
                gameState.guess.set(gameId, { number, attempts: 1, createdAt: Date.now() });
            }

            const userGuess = parseInt(args[0]);
            const activeGame = gameState.guess.get(gameId);
            activeGame.attempts++;

            if (userGuess === activeGame.number) {
                gameState.guess.delete(gameId);
                return reply(`🎉 *CORRECT!*\n\nNumber: ${activeGame.number}\nAttempts: ${activeGame.attempts}\n${activeGame.attempts <= 5 ? '🌟 Excellent!' : '👏 Well done!'}`);
            }

            const hint = userGuess < activeGame.number ? '📈 Higher!' : '📉 Lower!';
            return reply(`${hint}\n\nAttempts: ${activeGame.attempts}\nTry: ${config.prefix}guess <number>`);
        }

        // SHIP
        if (cmd === 'ship') {
            if (mentionedJid.length < 2) return reply('❌ Mention 2 users!\nUsage: .ship @user1 @user2');
            
            const user1 = mentionedJid[0];
            const user2 = mentionedJid[1];
            const percentage = Math.floor(Math.random() * 101);
            
            let emoji = '', message = '';
            if (percentage < 20) { emoji = '💔'; message = 'Not meant to be...'; }
            else if (percentage < 40) { emoji = '😐'; message = 'Maybe friends?'; }
            else if (percentage < 60) { emoji = '😊'; message = 'Could work!'; }
            else if (percentage < 80) { emoji = '😍'; message = 'Great match!'; }
            else { emoji = '💖'; message = 'Perfect couple!'; }
            
            return mention(`💘 *LOVE CALCULATOR*\n\n@${user1.split('@')[0]} × @${user2.split('@')[0]}\n\n${emoji} *${percentage}%* ${emoji}\n\n${message}`, [user1, user2]);
        }

        // TRUTH
        if (cmd === 'truth') {
            return reply(`🎭 *TRUTH*\n\n${random(gameData.truths)}`);
        }

        // DARE
        if (cmd === 'dare') {
            return reply(`🎯 *DARE*\n\n${random(gameData.dares)}`);
        }

        // QUIZ
        if (cmd === 'quiz') {
            const gameId = `${from}_${sender}`;
            
            if (!gameState.quiz.has(gameId)) {
                const question = random(gameData.quizzes);
                gameState.quiz.set(gameId, { question, createdAt: Date.now() });
                
                const shuffled = [...question.opts].sort(() => Math.random() - 0.5);
                return reply(`❓ *QUIZ TIME*\n\n${question.q}\n\nOptions:\n${shuffled.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nReply: ${config.prefix}quiz <answer>`);
            }
            
            if (!text) return reply('❌ Provide answer!\nUsage: .quiz <answer>');
            
            const game = gameState.quiz.get(gameId);
            const userAnswer = text.toLowerCase().trim();
            
            gameState.quiz.delete(gameId);
            
            if (userAnswer === game.question.a || game.question.opts.some(opt => opt.toLowerCase() === userAnswer && opt.toLowerCase() === game.question.a)) {
                return reply(`✅ *CORRECT!*\n\nAnswer: ${game.question.a}\n🎉 Well done!`);
            } else {
                return reply(`❌ *WRONG!*\n\nCorrect answer: ${game.question.a}`);
            }
        }

        // MATH
        if (cmd === 'math') {
            const gameId = `${from}_${sender}`;
            
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
                    createdAt: Date.now()
                });
                
                return reply(`🧮 *MATH CHALLENGE*\n\nSolve: *${num1} ${op} ${num2} = ?*\n\nReply: ${config.prefix}math <answer>`);
            }
            
            const game = gameState.quiz.get(gameId);
            if (!game) return reply('❌ No active challenge! Start: .math');
            
            const userAnswer = args[0];
            gameState.quiz.delete(gameId);
            
            if (userAnswer === game.question.a) {
                return reply(`✅ *CORRECT!*\n\n${game.question.q} = ${game.question.a}\n🎉 Great!`);
            } else {
                return reply(`❌ *WRONG!*\n\nAnswer: ${game.question.a}`);
            }
        }

        // FAST TYPE
        if (cmd === 'fasttype' || cmd === 'type') {
            const gameId = `${from}_${sender}`;
            
            if (gameState.fasttype.has(gameId)) return reply('❌ You have an active game!');
            
            const word = random(gameData.fasttypeWords);
            gameState.fasttype.set(gameId, {
                word,
                startTime: Date.now(),
                createdAt: Date.now()
            });
            
            return reply(`⚡ *FAST TYPE CHALLENGE*\n\nType this word as fast as you can:\n\n*${word}*\n\nJust type the word (no command)!`);
        }

        // WORD CHAIN
        if (cmd === 'wordchain' || cmd === 'wc') {
            const gameId = from;
            
            if (!gameState.wordchain.has(gameId)) {
                const startWord = random(['apple', 'elephant', 'tiger', 'rainbow', 'ocean']);
                gameState.wordchain.set(gameId, {
                    lastWord: startWord,
                    words: [startWord],
                    players: new Set([sender]),
                    createdAt: Date.now()
                });
                
                return reply(`🔗 *WORD CHAIN GAME*\n\nStarting word: *${startWord}*\nNext must start with: *${startWord.slice(-1).toUpperCase()}*\n\nReply: ${config.prefix}wc <word>`);
            }
            
            if (!args[0]) {
                const game = gameState.wordchain.get(gameId);
                return reply(`Current: *${game.lastWord}*\nNext starts with: *${game.lastWord.slice(-1).toUpperCase()}*`);
            }
            
            const game = gameState.wordchain.get(gameId);
            const newWord = args[0].toLowerCase();
            const lastLetter = game.lastWord.slice(-1);
            
            if (newWord[0] !== lastLetter) return reply(`❌ Must start with *${lastLetter.toUpperCase()}*!`);
            if (game.words.includes(newWord)) return reply(`❌ "${newWord}" already used!`);
            if (newWord.length < 3) return reply(`❌ Minimum 3 letters!`);
            
            game.lastWord = newWord;
            game.words.push(newWord);
            game.players.add(sender);
            
            return reply(`✅ *${newWord.toUpperCase()}*\n\nChain: ${game.words.length} words\nPlayers: ${game.players.size}\n\nNext starts with: *${newWord.slice(-1).toUpperCase()}*`);
        }

        // EMOJI QUIZ
        if (cmd === 'emojiquiz' || cmd === 'eq') {
            const gameId = `${from}_${sender}`;
            
            if (!gameState.quiz.has(gameId)) {
                const quiz = random(gameData.emojiquiz);
                gameState.quiz.set(gameId, { question: quiz, createdAt: Date.now() });
                
                return reply(`🎯 *EMOJI QUIZ*\n\n${quiz.emoji}\n\nHint: ${quiz.hint}\n\nReply: ${config.prefix}eq <answer>`);
            }
            
            if (!text) return reply('❌ Provide answer!\nUsage: .eq <answer>');
            
            const game = gameState.quiz.get(gameId);
            const userAnswer = text.toLowerCase().trim();
            
            gameState.quiz.delete(gameId);
            
            if (userAnswer === game.question.answer) {
                return reply(`✅ *CORRECT!*\n\n${game.question.emoji} = ${game.question.answer}\n🎉 Well done!`);
            } else {
                return reply(`❌ *WRONG!*\n\nAnswer: ${game.question.answer}`);
            }
        }

        // ═══════════════════════════════════════════════════════════
        // FUN COMMANDS
        // ═══════════════════════════════════════════════════════════
        
        if (cmd === 'joke') {
            return reply(random(gameData.jokes));
        }
        
        if (cmd === 'fact') {
            return reply(random(gameData.facts));
        }
        
        if (cmd === 'roast') {
            if (mentionedJid.length > 0) {
                return mention(`@${mentionedJid[0].split('@')[0]}, ${random(gameData.roasts)}`, mentionedJid);
            }
            return reply(random(gameData.roasts));
        }
        
        if (cmd === 'compliment') {
            if (mentionedJid.length > 0) {
                return mention(`@${mentionedJid[0].split('@')[0]}, ${random(gameData.compliments)}`, mentionedJid);
            }
            return reply(random(gameData.compliments));
        }

        // ═══════════════════════════════════════════════════════════
        // GROUP ADMIN COMMANDS
        // ═══════════════════════════════════════════════════════════
        
        if (!isGroup) {
            if (['add', 'kick', 'promote', 'demote', 'tagall', 'hidetag', 'group', 'setname', 'setdesc', 'admins', 'groupinfo'].includes(cmd)) {
                return reply('❌ This command is for groups only!');
            }
        }
        
        const senderIsAdmin = await isAdmin(sock, from, sender);
        const botIsAdmin = await isBotAdmin(sock, from);
        
        // ADD
        if (cmd === 'add') {
            if (!senderIsAdmin && !isOwner(sender)) return reply('❌ Admin only!');
            if (!botIsAdmin) return reply('❌ Bot must be admin!');
            if (!args[0]) return reply('Usage: .add 919876543210');
            
            const number = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            try {
                await sock.groupParticipantsUpdate(from, [number], 'add');
                return reply('✅ Member added!');
            } catch {
                return reply('❌ Failed to add member!');
            }
        }
        
        // KICK
        if (cmd === 'kick' || cmd === 'remove') {
            if (!senderIsAdmin && !isOwner(sender)) return reply('❌ Admin only!');
            if (!botIsAdmin) return reply('❌ Bot must be admin!');
            
            const target = mentionedJid[0] || (quotedMsg && quotedParticipant);
            if (!target) return reply('❌ Mention or reply to user!');
            
            try {
                await sock.groupParticipantsUpdate(from, [target], 'remove');
                return reply('✅ Member removed!');
            } catch {
                return reply('❌ Failed to remove!');
            }
        }
        
        // PROMOTE
        if (cmd === 'promote') {
            if (!senderIsAdmin && !isOwner(sender)) return reply('❌ Admin only!');
            if (!botIsAdmin) return reply('❌ Bot must be admin!');
            
            const target = mentionedJid[0] || (quotedMsg && quotedParticipant);
            if (!target) return reply('❌ Mention or reply to user!');
            
            try {
                await sock.groupParticipantsUpdate(from, [target], 'promote');
                return mention(`✅ @${target.split('@')[0]} is now admin!`, [target]);
            } catch {
                return reply('❌ Failed to promote!');
            }
        }
        
        // DEMOTE
        if (cmd === 'demote') {
            if (!senderIsAdmin && !isOwner(sender)) return reply('❌ Admin only!');
            if (!botIsAdmin) return reply('❌ Bot must be admin!');
            
            const target = mentionedJid[0] || (quotedMsg && quotedParticipant);
            if (!target) return reply('❌ Mention or reply to user!');
            
            try {
                await sock.groupParticipantsUpdate(from, [target], 'demote');
                return mention(`✅ @${target.split('@')[0]} removed from admin!`, [target]);
            } catch {
                return reply('❌ Failed to demote!');
            }
        }
        
        // TAGALL
        if (cmd === 'tagall') {
            if (!senderIsAdmin && !isOwner(sender)) return reply('❌ Admin only!');
            
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants.map(p => p.id);
            const message = text || 'Important announcement!';
            
            return mention(
`📢 *GROUP ANNOUNCEMENT*\n\n${message}\n\n${participants.map(p => `@${p.split('@')[0]}`).join('\n')}`,
                participants
            );
        }
        
        // HIDETAG
        if (cmd === 'hidetag') {
            if (!senderIsAdmin && !isOwner(sender)) return reply('❌ Admin only!');
            
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants.map(p => p.id);
            const message = text || 'Hidden tag message';
            
            return mention(message, participants);
        }
        
        // GROUP SETTINGS
        if (cmd === 'group') {
            if (!senderIsAdmin && !isOwner(sender)) return reply('❌ Admin only!');
            if (!botIsAdmin) return reply('❌ Bot must be admin!');
            if (!args[0]) return reply('Usage: .group <open/close>');
            
            const action = args[0].toLowerCase();
            if (action === 'open') {
                await sock.groupSettingUpdate(from, 'not_announcement');
                return reply('✅ Group opened!');
            } else if (action === 'close') {
                await sock.groupSettingUpdate(from, 'announcement');
                return reply('✅ Group closed!');
            } else {
                return reply('❌ Invalid! Use: open or close');
            }
        }
        
        // SETNAME
        if (cmd === 'setname' || cmd === 'setsubject') {
            if (!senderIsAdmin && !isOwner(sender)) return reply('❌ Admin only!');
            if (!botIsAdmin) return reply('❌ Bot must be admin!');
            if (!text) return reply('Usage: .setname <new name>');
            
            try {
                await sock.groupUpdateSubject(from, text);
                return reply(`✅ Group name: ${text}`);
            } catch {
                return reply('❌ Failed to change name!');
            }
        }
        
        // SETDESC
        if (cmd === 'setdesc' || cmd === 'setdescription') {
            if (!senderIsAdmin && !isOwner(sender)) return reply('❌ Admin only!');
            if (!botIsAdmin) return reply('❌ Bot must be admin!');
            if (!text) return reply('Usage: .setdesc <description>');
            
            try {
                await sock.groupUpdateDescription(from, text);
                return reply(`✅ Description updated!`);
            } catch {
                return reply('❌ Failed!');
            }
        }
        
        // ADMINS
        if (cmd === 'admins' || cmd === 'adminlist') {
            const metadata = await sock.groupMetadata(from);
            const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            
            return mention(
`👥 *GROUP ADMINS*\n\n${admins.map((a, i) => `${i + 1}. @${a.id.split('@')[0]}`).join('\n')}\n\nTotal: ${admins.length}`,
                admins.map(a => a.id)
            );
        }
        
        // GROUPINFO
        if (cmd === 'groupinfo' || cmd === 'gcinfo') {
            const metadata = await sock.groupMetadata(from);
            const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            
            return reply(
`📊 *GROUP INFO*\n\n📱 Name: ${metadata.subject}\n🆔 ID: ${metadata.id}\n👥 Members: ${metadata.participants.length}\n👤 Admins: ${admins.length}\n📝 Desc: ${metadata.desc || 'None'}\n📅 Created: ${new Date(metadata.creation * 1000).toDateString()}`);
        }

    } catch (err) {
        console.error('Handler error:', err);
    }
};

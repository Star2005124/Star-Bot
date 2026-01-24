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
const games = {
    tictactoe: new Map(),
    guess: new Map(),
    fasttype: new Map(),
    quiz: new Map()
};

// Auto cleanup games after 5 minutes
setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000;
    
    for (const [type, gameMap] of Object.entries(games)) {
        for (const [key, game] of gameMap.entries()) {
            if (now - game.createdAt > timeout) {
                gameMap.delete(key);
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
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

const isOwner = (sender) => {
    const num = sender.split('@')[0];
    return config.ownerNumber.split(',').some(owner => owner.trim() === num);
};

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ═══════════════════════════════════════════════════════════
// MESSAGE HANDLER
// ═══════════════════════════════════════════════════════════
export const handleMessage = async (sock, msg) => {
    try {
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const body = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     msg.message?.imageMessage?.caption || '';

        if (!body || !body.startsWith(config.prefix)) return;

        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const replyImg = (text, img) => sock.sendMessage(from, { 
            image: { url: img }, 
            caption: text 
        }, { quoted: msg });

        // CORE COMMANDS
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
            return replyImg(
                `╔═══════════════════════════╗\n` +
                `║  🎮 *${config.botName}* 🎮\n` +
                `╚═══════════════════════════╝\n\n` +
                `📊 *Status*\n` +
                `├ Uptime: ${formatUptime(Date.now() - config.startTime)}\n` +
                `└ Prefix: ${config.prefix}\n\n` +
                `🎯 *CORE*\n` +
                `├ ${config.prefix}alive\n` +
                `├ ${config.prefix}ping\n` +
                `└ ${config.prefix}menu\n\n` +
                `🎮 *GAMES*\n` +
                `├ ${config.prefix}ttt @user\n` +
                `├ ${config.prefix}rps <rock/paper/scissors>\n` +
                `├ ${config.prefix}dice\n` +
                `├ ${config.prefix}flip\n` +
                `├ ${config.prefix}guess\n` +
                `└ ${config.prefix}quiz\n\n` +
                `🎪 *FUN*\n` +
                `├ ${config.prefix}joke\n` +
                `└ ${config.prefix}fact\n\n` +
                `✨ *${config.botName}* - Made with ❤️`,
                config.menuImage
            );
        }

        if (cmd === 'ping') {
            const start = Date.now();
            await reply('🏓 Pinging...');
            return reply(`🏓 *Pong!*\n⚡ ${Date.now() - start}ms`);
        }

        // GAMES
        if (cmd === 'dice') {
            const dice = Math.floor(Math.random() * 6) + 1;
            return reply(`🎲 You rolled: *${dice}*`);
        }

        if (cmd === 'flip' || cmd === 'coinflip') {
            const result = Math.random() < 0.5 ? 'HEADS 👑' : 'TAILS 💰';
            return reply(`🪙 Result: *${result}*`);
        }

        if (cmd === 'rps') {
            if (!args[0]) return reply('Usage: .rps <rock/paper/scissors>');
            
            const choices = ['rock', 'paper', 'scissors'];
            const userChoice = args[0].toLowerCase();
            
            if (!choices.includes(userChoice)) {
                return reply('❌ Invalid! Use: rock, paper, or scissors');
            }
            
            const botChoice = random(choices);
            let result = '';
            
            if (userChoice === botChoice) {
                result = '🤝 DRAW!';
            } else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) {
                result = '🎉 YOU WIN!';
            } else {
                result = '😔 YOU LOSE!';
            }
            
            return reply(`You: ${userChoice}\nBot: ${botChoice}\n\n${result}`);
        }

        if (cmd === 'guess') {
            const gameId = `${from}_${sender}`;
            
            if (!args[0]) {
                if (!games.guess.has(gameId)) {
                    const number = Math.floor(Math.random() * 100) + 1;
                    games.guess.set(gameId, { number, attempts: 0, createdAt: Date.now() });
                    return reply('🎯 *NUMBER GUESSING*\n\nGuess 1-100!\nUsage: .guess <number>');
                }
                return reply('Usage: .guess <number>');
            }

            const game = games.guess.get(gameId);
            if (!game) {
                const number = Math.floor(Math.random() * 100) + 1;
                games.guess.set(gameId, { number, attempts: 1, createdAt: Date.now() });
                return reply('🎯 Started! Try: .guess <number>');
            }

            const userGuess = parseInt(args[0]);
            game.attempts++;

            if (userGuess === game.number) {
                games.guess.delete(gameId);
                return reply(`🎉 *CORRECT!*\n\nNumber: ${game.number}\nAttempts: ${game.attempts}`);
            }

            const hint = userGuess < game.number ? '📈 Higher!' : '📉 Lower!';
            return reply(`${hint}\nAttempts: ${game.attempts}`);
        }

        if (cmd === 'quiz') {
            const quizzes = [
                { q: 'Capital of France?', a: 'paris' },
                { q: 'H2O is?', a: 'water' },
                { q: 'Fastest land animal?', a: 'cheetah' }
            ];

            const gameId = `${from}_${sender}`;

            if (!games.quiz.has(gameId)) {
                const quiz = random(quizzes);
                games.quiz.set(gameId, { quiz, createdAt: Date.now() });
                return reply(`❓ *QUIZ*\n\n${quiz.q}\n\nReply: .quiz <answer>`);
            }

            if (!args[0]) return reply('Usage: .quiz <answer>');

            const game = games.quiz.get(gameId);
            const answer = args.join(' ').toLowerCase();
            games.quiz.delete(gameId);

            if (answer === game.quiz.a) {
                return reply('✅ *CORRECT!* 🎉');
            } else {
                return reply(`❌ Wrong! Answer: ${game.quiz.a}`);
            }
        }

        // FUN
        if (cmd === 'joke') {
            const jokes = [
                "Why don't scientists trust atoms? They make up everything! 😄",
                "What do you call a fake noodle? An impasta! 🍝",
                "Why did the scarecrow win? Outstanding in his field! 🌾"
            ];
            return reply(random(jokes));
        }

        if (cmd === 'fact') {
            const facts = [
                "Honey never spoils! 🍯",
                "Octopuses have 3 hearts! 🐙",
                "Bananas are berries! 🍌"
            ];
            return reply(random(facts));
        }

    } catch (err) {
        console.error('Handler error:', err);
    }
};


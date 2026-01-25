import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    delay
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { createServer } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════
const config = {
    botName: process.env.BOT_NAME || 'Forka',
    prefix: process.env.PREFIX || '.',
    ownerNumber: process.env.OWNER_NUMBER || '',
    pairingNumber: process.env.PAIRING_NUMBER || '',
    sessionId: process.env.SESSION_ID || '',
    port: process.env.PORT || 3000,
    // Image for session connection guide
    sessionGuideImage:'https://github.com/amanmohdtp/Forka-Bot/blob/cc5fdb7a814251b44c1a5a06b3609663923d3249/session.jpg'
};

const AUTH_DIR = path.join(__dirname, 'auth_info');

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════
// SESSION ID MANAGEMENT
// ═══════════════════════════════════════════════════════════
const generateSessionId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'Forka-Bot~';
    for (let i = 0; i < 20; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const saveSessionId = (sessionId) => {
    const sessionFile = path.join(AUTH_DIR, 'session_id.txt');
    fs.writeFileSync(sessionFile, sessionId);
    return sessionId;
};

const loadSessionId = () => {
    const sessionFile = path.join(AUTH_DIR, 'session_id.txt');
    if (fs.existsSync(sessionFile)) {
        return fs.readFileSync(sessionFile, 'utf8').trim();
    }
    return null;
};

// ═══════════════════════════════════════════════════════════
// PRINT SETTINGS
// ═══════════════════════════════════════════════════════════
const printSettings = (sock, sessionId) => {
    console.log(chalk.green('\n' + '═'.repeat(60)));
    console.log(chalk.green.bold('  ✅ FORKA BOT DEPLOYED SUCCESSFULLY!'));
    console.log(chalk.green('═'.repeat(60)));
    
    console.log(chalk.cyan('\n📊 BOT SETTINGS:'));
    console.log(chalk.white('├─ Bot Name      : ') + chalk.yellow(config.botName));
    console.log(chalk.white('├─ Prefix        : ') + chalk.yellow(config.prefix));
    console.log(chalk.white('├─ Session ID    : ') + chalk.yellow(sessionId));
    console.log(chalk.white('├─ Bot Number    : ') + chalk.yellow(sock.user.id.split(':')[0]));
    console.log(chalk.white('├─ Bot Name (WA) : ') + chalk.yellow(sock.user.name || 'Not Set'));
    console.log(chalk.white('├─ Owner Number  : ') + chalk.yellow(config.ownerNumber || 'Not Configured'));
    console.log(chalk.white('└─ Status        : ') + chalk.green('ONLINE'));
    
    console.log(chalk.cyan('\n⏰ RUNTIME INFO:'));
    console.log(chalk.white('├─ Started At    : ') + chalk.yellow(new Date().toLocaleString()));
    console.log(chalk.white('├─ Auth Method   : ') + chalk.yellow('Pairing Code'));
    console.log(chalk.white('└─ Auth Location : ') + chalk.yellow(AUTH_DIR));
    
    console.log(chalk.cyan('\n🎮 FEATURES:'));
    console.log(chalk.white('├─ Games         : ') + chalk.yellow('14+ Games Available'));
    console.log(chalk.white('├─ Group Mgmt    : ') + chalk.yellow('Full Admin Tools'));
    console.log(chalk.white('├─ Fun Commands  : ') + chalk.yellow('Jokes, Facts, Roasts'));
    console.log(chalk.white('└─ Auto-Reconnect: ') + chalk.green('Enabled'));
    
    console.log(chalk.cyan('\n📝 QUICK COMMANDS:'));
    console.log(chalk.white(`├─ ${config.prefix}menu       : Show all commands`));
    console.log(chalk.white(`├─ ${config.prefix}alive      : Check bot status`));
    console.log(chalk.white(`├─ ${config.prefix}ping       : Test response`));
    console.log(chalk.white(`└─ ${config.prefix}help       : Get help`));
    
    console.log(chalk.green('\n' + '═'.repeat(60)));
    console.log(chalk.green.bold('  🚀 Bot is ready to receive messages!'));
    console.log(chalk.green('═'.repeat(60) + '\n'));
};

// ═══════════════════════════════════════════════════════════
// SESSION CONNECTION (Using Session ID)
// ═══════════════════════════════════════════════════════════
const connectWithSessionId = async () => {
    if (!config.sessionId) {
        console.log(chalk.red('❌ SESSION_ID not provided in environment variables'));
        console.log(chalk.yellow('   Server will exit. Please provide SESSION_ID to connect.\n'));
        process.exit(1);
    }

    console.log(chalk.cyan('🔄 Connecting with Session ID...'));
    console.log(chalk.yellow(`Session: ${config.sessionId}\n`));

    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.macOS('Safari'),
            getMessage: async () => ({ conversation: 'Forka Bot' }),
            defaultQueryTimeoutMs: undefined,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 30000
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log(chalk.yellow(`⚠️  Connection closed. Code: ${statusCode}`));
                
                if (shouldReconnect) {
                    console.log(chalk.cyan('🔄 Reconnecting...\n'));
                    setTimeout(() => connectWithSessionId(), 3000);
                } else {
                    console.log(chalk.red('❌ Session logged out. Server exiting.\n'));
                    process.exit(1);
                }
            } else if (connection === 'open') {
                console.log(chalk.green('✅ Connected with Session ID!\n'));
                
                // Send guide message with image
                try {
                    const jid = sock.user.id;
                    await delay(2000);
                    
                    await sock.sendMessage(jid, {
                        image: { url: config.sessionGuideImage },
                        caption: `*🎉 Device Successfully Connected!*

*Session ID:* \`${config.sessionId}\`

*📱 Connection Details:*
├ Device: Safari (MacOS)
├ Bot: ${config.botName}
├ Number: ${sock.user.id.split(':')[0]}
└ Status: ✅ Active

*🎮 What's Next?*

*1️⃣ Try These Commands:*
├ ${config.prefix}menu - View all commands
├ ${config.prefix}alive - Check bot status
├ ${config.prefix}ping - Test speed
└ ${config.prefix}help - Get help

*2️⃣ Explore Features:*
├ 🎮 Fun Games (${config.prefix}ttt, ${config.prefix}rps, ${config.prefix}quiz)
├ 👥 Group Management (Admin only)
├ 🎪 Fun Commands (${config.prefix}joke, ${config.prefix}fact)
└ 📊 Bot Info (${config.prefix}botinfo)

*3️⃣ Important Notes:*
├ Keep this session ID safe
├ Don't share with others
├ For support : +91 8304063560
└ Enjoy Forka Bot!

*💡 Quick Start:*
Type *${config.prefix}menu* to see all available commands!

━━━━━━━━━━━━━━━━━━━━
*Forka Bot* - Your WhatsApp Gaming Companion 🎮`
                    });
                    
                    console.log(chalk.green('📤 Sent connection guide to user\n'));
                } catch (err) {
                    console.error(chalk.yellow('⚠️  Could not send guide message:'), err.message);
                }
                
                printSettings(sock, config.sessionId);
                
                // Import and start message handler
                const { handleMessage } = await import('./handler.js');
                
                sock.ev.on('messages.upsert', async ({ messages }) => {
                    const msg = messages[0];
                    if (!msg.message || msg.key.fromMe) return;
                    
                    try {
                        await handleMessage(sock, msg);
                    } catch (err) {
                        console.error(chalk.red('Message handling error:'), err);
                    }
                });
            }
        });

        return sock;
    } catch (err) {
        console.error(chalk.red('Connection error:'), err);
        console.log(chalk.cyan('🔄 Retrying in 5 seconds...\n'));
        setTimeout(() => connectWithSessionId(), 5000);
    }
};

// ═══════════════════════════════════════════════════════════
// PAIRING CODE CONNECTION (Generate Session)
// ═══════════════════════════════════════════════════════════
const connectWithPairingCode = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        getMessage: async () => ({ conversation: 'Forka Bot' }),
        defaultQueryTimeoutMs: undefined,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000
    });

    sock.ev.on('creds.update', saveCreds);

    let pairingCodeSent = false;
    let connectionAttempts = 0;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting' && !state.creds.registered && !pairingCodeSent) {
            console.log(chalk.cyan('🔄 Socket connecting...'));
            
            setTimeout(async () => {
                try {
                    const phoneNumber = config.pairingNumber.replace(/[^0-9]/g, '');
                    console.log(chalk.cyan(`📲 Requesting pairing code for +${phoneNumber}...`));
                    
                    const code = await sock.requestPairingCode(phoneNumber);
                    pairingCodeSent = true;
                    
                    console.log(chalk.green('\n' + '═'.repeat(60)));
                    console.log(chalk.green.bold('  📱 PAIRING CODE: ') + chalk.yellow.bold(code));
                    console.log(chalk.green('═'.repeat(60) + '\n'));
                    
                    console.log(chalk.cyan('📖 Instructions:'));
                    console.log(chalk.white('  1. Open WhatsApp on your phone'));
                    console.log(chalk.white('  2. Go to Settings → Linked Devices'));
                    console.log(chalk.white('  3. Tap "Link a Device"'));
                    console.log(chalk.white('  4. Tap "Link with phone number instead"'));
                    console.log(chalk.white(`  5. Enter code: `) + chalk.yellow.bold(code));
                    console.log(chalk.cyan('\n⏱️  Code expires in 60 seconds!\n'));
                    
                } catch (err) {
                    pairingCodeSent = false;
                    console.error(chalk.red('❌ Pairing code request failed:'), err.message);
                }
            }, 5000);
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(chalk.yellow(`\n⚠️  Connection closed. Code: ${statusCode}`));
            
            if (statusCode === DisconnectReason.loggedOut) {
                console.log(chalk.red('\n❌ Device Logged Out!'));
                console.log(chalk.yellow('   Delete "auth_info" folder and restart.\n'));
                process.exit(0);
            }
            
            if (shouldReconnect) {
                connectionAttempts++;
                const delay = Math.min(connectionAttempts * 2000, 30000);
                console.log(chalk.cyan(`🔄 Reconnecting in ${delay/1000}s...\n`));
                pairingCodeSent = false;
                setTimeout(() => connectWithPairingCode(), delay);
            } else {
                console.log(chalk.red('❌ Cannot reconnect. Exiting.\n'));
                process.exit(1);
            }
        } else if (connection === 'open') {
            connectionAttempts = 0;
            pairingCodeSent = false;
            
            // Generate and save session ID
            let sessionId = loadSessionId();
            if (!sessionId) {
                sessionId = generateSessionId();
                saveSessionId(sessionId);
                console.log(chalk.green(`✅ Generated Session ID: ${sessionId}\n`));
            }
            
            // Send session ID and welcome message
            try {
                const jid = sock.user.id;
                await delay(2000);
                
                // Simple welcome message without image
                await sock.sendMessage(jid, {
                    text: `*✅ Forka Bot Successfully Linked!*

*📱 Connection Info:*
├ Bot Name: ${config.botName}
├ Number: ${sock.user.id.split(':')[0]}
├ Prefix: ${config.prefix}
└ Status: Online

*🔑 Your Session ID:*
\`\`\`${sessionId}\`\`\`

⚠️ *IMPORTANT:* Keep this Session ID safe!
You can use it to reconnect your bot without pairing code.

*🎮 Get Started:*
├ ${config.prefix}menu - View all commands
├ ${config.prefix}alive - Check status
├ ${config.prefix}ping - Test speed
└ ${config.prefix}help - Get help

*📊 Available Features:*
• 14+ Games
• Group Management
• Fun Commands
• Auto Reconnect

Type *${config.prefix}menu* to explore!

━━━━━━━━━━━━━━━━━━━━
*Forka Bot* 🎮`
                });
                
                console.log(chalk.green('📤 Sent Session ID to user\n'));
                
                // Auto shutdown server after sending session
                console.log(chalk.yellow('⚠️  Session ID sent successfully!'));
                console.log(chalk.yellow('   Server will shut down in 10 seconds...'));
                console.log(chalk.cyan('   To connect: Set SESSION_ID in .env and restart\n'));
                
                setTimeout(() => {
                    console.log(chalk.red('🛑 Server shutting down...\n'));
                    process.exit(0);
                }, 10000);
                
            } catch (err) {
                console.error(chalk.red('❌ Failed to send Session ID:'), err.message);
            }
            
            printSettings(sock, sessionId);
        }
    });

    return sock;
};

// ═══════════════════════════════════════════════════════════
// ERROR HANDLERS
// ═══════════════════════════════════════════════════════════
process.on('unhandledRejection', (err) => {
    console.error(chalk.red('⚠️  Unhandled Rejection:'), err.message);
});

process.on('uncaughtException', (err) => {
    console.error(chalk.red('⚠️  Uncaught Exception:'), err.message);
});

// ═══════════════════════════════════════════════════════════
// MAIN START LOGIC
// ═══════════════════════════════════════════════════════════
console.clear();
console.log(chalk.cyan.bold(`
╔════════════════════════════════════╗
║     🎮 FORKA BOT STARTING...       ║
╚════════════════════════════════════╝
`));

const hasSession = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
const hasSessionId = config.sessionId !== '';

console.log(chalk.white('📋 Configuration:'));
console.log(chalk.white(`├─ Bot Name: ${config.botName}`));
console.log(chalk.white(`├─ Prefix: ${config.prefix}`));
console.log(chalk.white(`├─ Has Session: ${hasSession ? 'Yes' : 'No'}`));
console.log(chalk.white(`├─ Session ID: ${hasSessionId ? config.sessionId : 'Not Set'}`));
console.log(chalk.white(`└─ Pairing Number: ${config.pairingNumber || 'Not Set'}\n`));

// Decide connection method
if (hasSessionId) {
    // Connect with Session ID
    console.log(chalk.green('✓ Session ID provided, connecting...\n'));
    connectWithSessionId().catch(err => {
        console.error(chalk.red('Failed to connect:'), err);
        process.exit(1);
    });
} else if (hasSession) {
    // Has session but no Session ID - generate one
    console.log(chalk.yellow('⚠️  Session exists but no SESSION_ID in env'));
    console.log(chalk.yellow('   Generating Session ID...\n'));
    
    const sessionId = generateSessionId();
    saveSessionId(sessionId);
    
    console.log(chalk.green(`✅ Generated Session ID: ${sessionId}`));
    console.log(chalk.cyan('   Add this to your .env file as SESSION_ID\n'));
    
    connectWithSessionId().catch(err => {
        console.error(chalk.red('Failed to connect:'), err);
        process.exit(1);
    });
} else {
    // No session - require pairing
    if (!config.pairingNumber) {
        console.log(chalk.red('❌ ERROR: PAIRING_NUMBER not set!'));
        console.log(chalk.yellow('   Set PAIRING_NUMBER to generate session\n'));
        process.exit(1);
    }
    
    console.log(chalk.yellow('⚠️  No session found, requesting pairing code...\n'));
    connectWithPairingCode().catch(err => {
        console.error(chalk.red('Failed to start:'), err);
        setTimeout(() => connectWithPairingCode(), 15000);
    });
}

// Keep alive server (optional)
if (process.env.KEEP_ALIVE === 'true') {
    createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Forka Bot is running!\n');
    }).listen(config.port, () => {
        console.log(chalk.green(`✅ Keep-alive server on port ${config.port}\n`));
    });
}

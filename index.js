import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    delay
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════
const config = {
    botName: process.env.BOT_NAME || 'Forka',
    prefix: process.env.PREFIX || '.',
    ownerNumber: process.env.OWNER_NUMBER || '',
    pairingNumber: process.env.PAIRING_NUMBER || '',
    sessionId: process.env.SESSION_ID || 'forka_session',
    port: process.env.PORT || 3000
};

const AUTH_DIR = path.join(__dirname, 'auth_info');

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════
// PRINT SETTINGS
// ═══════════════════════════════════════════════════════════
const printSettings = (sock) => {
    console.log(chalk.green('\n' + '═'.repeat(60)));
    console.log(chalk.green.bold('  ✅ FORKA BOT DEPLOYED SUCCESSFULLY!'));
    console.log(chalk.green('═'.repeat(60)));
    
    console.log(chalk.cyan('\n📊 BOT SETTINGS:'));
    console.log(chalk.white('├─ Bot Name      : ') + chalk.yellow(config.botName));
    console.log(chalk.white('├─ Prefix        : ') + chalk.yellow(config.prefix));
    console.log(chalk.white('├─ Session ID    : ') + chalk.yellow(config.sessionId));
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
// CONNECTION FUNCTION
// ═══════════════════════════════════════════════════════════
const connectToWhatsApp = async () => {
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
        browser: ['Forka Bot', 'Chrome', '1.0.0'],
        getMessage: async () => ({ conversation: 'Forka Bot' })
    });

    sock.ev.on('creds.update', saveCreds);

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Request pairing code if not registered
        if (!state.creds.registered && config.pairingNumber && !qr) {
            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(config.pairingNumber);
                    console.log(chalk.green('\n' + '═'.repeat(60)));
                    console.log(chalk.green.bold('  📱 PAIRING CODE:'));
                    console.log(chalk.yellow.bold(`     ${code}`));
                    console.log(chalk.green('═'.repeat(60)));
                    console.log(chalk.cyan('\n📖 Instructions:'));
                    console.log(chalk.white('  1. Open WhatsApp on your phone'));
                    console.log(chalk.white('  2. Go to Settings → Linked Devices'));
                    console.log(chalk.white('  3. Tap "Link a Device"'));
                    console.log(chalk.white('  4. Tap "Link with phone number instead"'));
                    console.log(chalk.white(`  5. Enter code: ${code}`));
                    console.log(chalk.cyan('  6. Wait for connection...\n'));
                } catch (err) {
                    console.error(chalk.red('❌ Failed to request pairing code:'), err.message);
                }
            }, 3000);
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.yellow('⚠️  Connection closed due to'), lastDisconnect?.error);

            if (shouldReconnect) {
                console.log(chalk.cyan('🔄 Reconnecting...'));
                setTimeout(() => connectToWhatsApp(), 3000);
            } else {
                console.log(chalk.red('❌ Logged out. Please delete auth_info and restart.'));
                process.exit(0);
            }
        } else if (connection === 'open') {
            // Print settings after successful connection
            printSettings(sock);
            
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
        } else if (connection === 'connecting') {
            console.log(chalk.cyan('🔄 Connecting to WhatsApp...'));
        }
    });

    return sock;
};

// ═══════════════════════════════════════════════════════════
// ERROR HANDLERS
// ═══════════════════════════════════════════════════════════
process.on('unhandledRejection', (err) => {
    console.error(chalk.red('Unhandled Rejection:'), err);
});

process.on('uncaughtException', (err) => {
    console.error(chalk.red('Uncaught Exception:'), err);
});

// ═══════════════════════════════════════════════════════════
// START BOT
// ═══════════════════════════════════════════════════════════
console.clear();
console.log(chalk.cyan.bold(`
╔════════════════════════════════════╗
║     🎮 FORKA BOT STARTING...       ║
╚════════════════════════════════════╝
`));

console.log(chalk.white('📋 Configuration:'));
console.log(chalk.white(`├─ Bot Name: ${config.botName}`));
console.log(chalk.white(`├─ Prefix: ${config.prefix}`));
console.log(chalk.white(`├─ Pairing Number: ${config.pairingNumber || 'Not Set'}`));
console.log(chalk.white(`└─ Session: ${config.sessionId}\n`));

if (!config.pairingNumber) {
    console.log(chalk.yellow('⚠️  Warning: PAIRING_NUMBER not set in environment variables'));
    console.log(chalk.yellow('   Set PAIRING_NUMBER to enable pairing code method\n'));
}

connectToWhatsApp().catch(err => {
    console.error(chalk.red('Failed to start:'), err);
    process.exit(1);
});

// Keep alive server (for deployments like Render, Railway, etc.)
if (process.env.KEEP_ALIVE === 'true') {
    import('http').then(({ default: http }) => {
        http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Forka Bot is running!\n');
        }).listen(config.port, () => {
            console.log(chalk.green(`✅ Keep-alive server running on port ${config.port}`));
        });
    });
}

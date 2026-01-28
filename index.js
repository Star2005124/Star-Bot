import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  DisconnectReason
} from '@whiskeysockets/baileys';
import pino from 'pino';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer } from 'http';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, 'auth_info');
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

const config = {
  botName: process.env.BOT_NAME || 'Forka',
  prefix: process.env.PREFIX || '.',
  ownerNumber: process.env.OWNER_NUMBER || '',
  pairingNumber: process.env.PAIRING_NUMBER || '',
  port: process.env.PORT || 3000
};

let pairingCodeSent = false;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    getMessage: async () => ({ conversation: 'Forka Bot' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    // Request pairing code when connecting
    if (connection === 'connecting' && !state.creds.registered && !pairingCodeSent) {
      if (!config.pairingNumber) {
        console.log(chalk.red('❌ PAIRING_NUMBER not set in .env file'));
        return;
      }

      setTimeout(async () => {
        try {
          const phoneNumber = config.pairingNumber.replace(/[^0-9]/g, '');
          console.log(chalk.cyan(`📲 Requesting pairing code for +${phoneNumber}...`));
          
          const code = await sock.requestPairingCode(phoneNumber);
          pairingCodeSent = true;
          
          console.log(chalk.green('\n' + '═'.repeat(50)));
          console.log(chalk.green.bold('  📱 PAIRING CODE: ') + chalk.yellow.bold(code));
          console.log(chalk.green('═'.repeat(50)));
          console.log(chalk.cyan('\n📖 How to use:'));
          console.log(chalk.white('  1. Open WhatsApp → Settings → Linked Devices'));
          console.log(chalk.white('  2. Tap "Link a Device"'));
          console.log(chalk.white('  3. Tap "Link with phone number instead"'));
          console.log(chalk.white(`  4. Enter: `) + chalk.yellow.bold(code));
          console.log(chalk.cyan('  5. Wait for connection...\n'));
        } catch (err) {
          pairingCodeSent = false;
          console.error(chalk.red('❌ Pairing failed:'), err.message);
        }
      }, 5000);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log(chalk.red('❌ Logged out. Delete auth_info and re-pair.'));
        process.exit(0);
      } else {
        console.log(chalk.yellow('⚠️ Connection closed. Reconnecting...'));
        pairingCodeSent = false;
        setTimeout(() => startBot(), 3000);
      }
    } else if (connection === 'open') {
      pairingCodeSent = false;
      console.log(chalk.green('\n' + '═'.repeat(50)));
      console.log(chalk.green.bold(`  ✅ ${config.botName} CONNECTED!`));
      console.log(chalk.green('═'.repeat(50)));
      console.log(chalk.white(`  📱 Number: ${sock.user.id.split(':')[0]}`));
      console.log(chalk.white(`  👤 Name: ${sock.user.name || 'Not Set'}`));
      console.log(chalk.white(`  ⏰ Time: ${new Date().toLocaleString()}`));
      console.log(chalk.green('═'.repeat(50) + '\n'));
    }
  });

  // Import handler
  const { handleMessage } = await import('./handler.js');
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    try {
      await handleMessage(sock, msg, config);
    } catch (err) {
      console.error(chalk.red('Message error:'), err);
    }
  });

  return sock;
}

console.clear();
console.log(chalk.cyan.bold(`
╔════════════════════════════════════╗
║     🎮 ${config.botName.toUpperCase()} BOT STARTING...      ║
╚════════════════════════════════════╝
`));

const hasAuth = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
if (hasAuth) {
  console.log(chalk.green('✓ Session found, connecting...\n'));
} else {
  if (!config.pairingNumber) {
    console.log(chalk.red('❌ No session & no PAIRING_NUMBER set!'));
    console.log(chalk.yellow('   Add to .env: PAIRING_NUMBER=1234567890\n'));
    process.exit(1);
  }
  console.log(chalk.yellow('⚠️  No session found, pairing mode enabled\n'));
}

startBot().catch(err => {
  console.error(chalk.red('Startup failed:'), err);
  process.exit(1);
});

if (process.env.KEEP_ALIVE === 'true') {
  createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Forka Bot Running\n');
  }).listen(config.port, () => {
    console.log(chalk.green(`✅ Keep-alive on port ${config.port}`));
  });
}

# Forka Bot

WhatsApp bot with pairing code deployment.
No web interface needed.
🚨 Check Common issues #5

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env  # or use any editor
```

**Required Settings:**
```env
PAIRING_NUMBER=919876543210  # Your WhatsApp number with country code
OWNER_NUMBER=919876543210     # Owner number (optional)
```

### 3. Start Bot
```bash
npm start
```

### 4. Link Device
1. A pairing code will be displayed in the terminal
2. Open WhatsApp → Settings → Linked Devices
3. Tap "Link a Device" → "Link with phone number instead"
4. Enter the pairing code shown
5. Wait for "DEPLOYED SUCCESSFULLY" message

## 📊 After Successful Deployment

Once connected, you'll see:

```
═════════════════════════════════════════════════════════════
  ✅ FORKA BOT DEPLOYED SUCCESSFULLY!
═════════════════════════════════════════════════════════════

📊 BOT SETTINGS:
├─ Bot Name      : Forka
├─ Prefix        : .
├─ Session ID    : forka_session
├─ Bot Number    : 919876543210
├─ Bot Name (WA) : My Bot
├─ Owner Number  : 919876543210
└─ Status        : ONLINE

⏰ RUNTIME INFO:
├─ Started At    : 1/24/2026, 10:00:00 AM
├─ Auth Method   : Pairing Code
└─ Auth Location : /path/to/auth_info

🎮 FEATURES:
├─ Games         : 14+ Games Available
├─ Group Mgmt    : Full Admin Tools
├─ Fun Commands  : Jokes, Facts, Roasts
└─ Auto-Reconnect: Enabled

📝 QUICK COMMANDS:
├─ .menu       : Show all commands
├─ .alive      : Check bot status
├─ .ping       : Test response
└─ .help       : Get help

═════════════════════════════════════════════════════════════
  🚀 Bot is ready to receive messages!
═════════════════════════════════════════════════════════════
```

## 📝 Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `BOT_NAME` | Bot display name | No | Forka |
| `PREFIX` | Command prefix | No | . |
| `PAIRING_NUMBER` | WhatsApp number for pairing | **Yes** | 919876543210 |
| `OWNER_NUMBER` | Owner number(s) | No | 919876543210 |
| `SESSION_ID` | Session identifier | No | forka_session |
| `MENU_IMAGE` | Menu image URL | No | https://i.imgur.com/... |
| `ALIVE_IMAGE` | Alive image URL | No | https://i.imgur.com/... |
| `PORT` | Server port (for keep-alive) | No | 3000 |
| `KEEP_ALIVE` | Enable keep-alive server | No | false |

## 🎮 Available Commands

### Core
- `.alive` - Bot status with image
- `.ping` - Response time test
- `.menu` - Full command list with image
- `.help` - Same as menu

### Games
- `.dice` - Roll a dice
- `.flip` - Flip a coin
- `.rps <choice>` - Rock Paper Scissors
- `.guess` - Number guessing game
- `.quiz` - Trivia quiz

### Fun
- `.joke` - Random joke
- `.fact` - Random fact

## 🔧 Deployment on Servers

### Railway
1. Connect your GitHub repo
2. Add environment variables in Railway dashboard
3. Deploy automatically

### Render
1. Create new Web Service
2. Connect repository
3. Add environment variables
4. Deploy

### VPS (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd Forka-Bot
npm install
cp .env.example .env
nano .env  # Configure

# Run with PM2
npm install -g pm2
pm2 start index.js --name forka-bot
pm2 save
pm2 startup
```

### Docker
```bash
docker build -t forka-bot .
docker run -d \
  -e PAIRING_NUMBER=919876543210 \
  -e OWNER_NUMBER=919876543210 \
  -v $(pwd)/auth_info:/app/auth_info \
  --name forka \
  forka-bot
```

## 🔄 Auto-Reconnect

The bot automatically reconnects if:
- Internet connection drops
- WhatsApp server disconnects
- Temporary network issues

It will NOT reconnect if:
- You manually log out from WhatsApp
- Session is deleted

## 📁 File Structure

```
Forka-Bot/
├── index.js           # Main bot file
├── handler.js         # Message handler
├── package.json       # Dependencies
├── .env              # Your configuration (not in git)
├── .env.example      # Example configuration
├── auth_info/        # Session data (auto-generated)
└── README.md         # This file
```

## 🛡️ Security

- ✅ Keep `.env` file private
- ✅ Don't share `auth_info` folder
- ✅ Add `.env` and `auth_info/` to `.gitignore`
- ✅ Use environment variables on servers
- ❌ Never commit sensitive data to git

## 🐛 Troubleshooting

### Pairing code not showing?
- Ensure `PAIRING_NUMBER` is set correctly
- Wait 3-5 seconds after starting
- Check number format (no + or spaces)

### Bot not responding?
- Check bot is connected (see terminal)
- Verify prefix in `.env`
- Check WhatsApp is linked

### Connection keeps closing?
- Check internet connection
- Verify session isn't logged out
- Delete `auth_info` and re-pair

### Settings not displaying after pairing?
- Check terminal output
- Ensure connection is "open"
- Wait a few seconds after pairing

## 📞 Support

For issues:
1. Check this README
2. Verify `.env` configuration
3. Check terminal logs
4. Delete `auth_info` and retry
5. If phone number in env is not being working, open index and set number there!

---

**Forka Bot** - Server-side WhatsApp bot with automatic settings display! 🚀

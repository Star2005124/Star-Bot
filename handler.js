import chalk from 'chalk';

export const handleMessage = async (sock, msg, config) => {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');

  const body =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    '';

  if (!body.startsWith(config.prefix)) return;

  const args = body.slice(config.prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const reply = async (text) =>
    await sock.sendMessage(from, { text }, { quoted: msg });

  const mention = async (text, users) =>
    await sock.sendMessage(from, { text, mentions: users }, { quoted: msg });

  // --- Helpers ---
  const isAdmin = async (jid) => {
    try {
      const meta = await sock.groupMetadata(from);
      const participant = meta.participants.find((p) => p.id === jid);
      return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
      return false;
    }
  };

  const isBotAdmin = async () => {
    try {
      const meta = await sock.groupMetadata(from);
      const botId = sock.user.id;
      const participant = meta.participants.find((p) => p.id === botId);
      return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
      return false;
    }
  };

  // --- Core Commands ---
  switch (cmd) {
    case 'alive':
      return reply(`✅ ${config.botName} is Online!\nPrefix: ${config.prefix}`);

    case 'menu':
    case 'help':
      return reply(
        `📋 *${config.botName} Commands*\n\n` +
          `Core:\n• ${config.prefix}alive\n• ${config.prefix}ping\n• ${config.prefix}menu\n• ${config.prefix}botinfo\n• ${config.prefix}owner\n• ${config.prefix}runtime\n\n` +
          `Games:\n• ${config.prefix}ttt @user\n• ${config.prefix}rps <rock/paper/scissors>\n• ${config.prefix}dice\n• ${config.prefix}coinflip\n• ${config.prefix}guess <number>\n\n` +
          `Group Admin:\n• ${config.prefix}add <number>\n• ${config.prefix}kick @user\n• ${config.prefix}promote @user\n• ${config.prefix}demote @user\n• ${config.prefix}tagall\n• ${config.prefix}group <open/close>\n• ${config.prefix}setname <text>\n• ${config.prefix}setdesc <text>\n• ${config.prefix}admins\n• ${config.prefix}groupinfo`
      );

    case 'ping':
      const start = Date.now();
      await reply('🏓 Pinging...');
      return reply(`🏓 Pong! ${Date.now() - start}ms`);

    case 'botinfo':
      return reply(`🤖 Bot: ${config.botName}\nPrefix: ${config.prefix}\nVersion: 2.0.0`);

    case 'owner':
      return reply(`👤 Owner: +${config.ownerNumber}`);

    case 'runtime':
      return reply(`⏱️ Bot running since: ${new Date().toLocaleString()}`);

    // --- Group Management ---
    case 'add':
      if (!isGroup) return reply('❌ Group only command');
      if (!(await isAdmin(sender))) return reply('❌ Admins only');
      if (!(await isBotAdmin())) return reply('❌ Bot must be admin');
      if (!args[0]) return reply('Usage: .add <number>');
      const number = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      await sock.groupParticipantsUpdate(from, [number], 'add');
      return reply(`✅ Added +${args[0]}`);

    case 'kick':
      if (!isGroup) return reply('❌ Group only command');
      if (!(await isAdmin(sender))) return reply('❌ Admins only');
      if (!(await isBotAdmin())) return reply('❌ Bot must be admin');
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentioned.length === 0) return reply('Usage: .kick @user');
      await sock.groupParticipantsUpdate(from, mentioned, 'remove');
      return reply(`✅ Removed ${mentioned.join(', ')}`);

    case 'promote':
      if (!isGroup) return reply('❌ Group only command');
      if (!(await isAdmin(sender))) return reply('❌ Admins only');
      if (!(await isBotAdmin())) return reply('❌ Bot must be admin');
      const promoteJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (promoteJid.length === 0) return reply('Usage: .promote @user');
      await sock.groupParticipantsUpdate(from, promoteJid, 'promote');
      return reply(`✅ Promoted ${promoteJid.join(', ')}`);

    case 'demote':
      if (!isGroup) return reply('❌ Group only command');
      if (!(await isAdmin(sender))) return reply('❌ Admins only');
      if (!(await isBotAdmin())) return reply('❌ Bot must be admin');
      const demoteJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (demoteJid.length === 0) return reply('Usage: .demote @user');
      await sock.groupParticipantsUpdate(from, demoteJid, 'demote');
      return reply(`✅ Demoted ${demoteJid.join(', ')}`);

    case 'tagall':
      if (!isGroup) return reply('❌ Group only command');
      if (!(await isAdmin(sender))) return reply('❌ Admins only');
      const meta = await sock.groupMetadata(from);
      const members = meta.participants.map((p) => p.id);
      return mention('📢 Tagging all members', members);

    case 'group':
      if (!isGroup) return reply('❌ Group only command');
      if (!(await isAdmin(sender))) return reply('❌ Admins only');
      if (!(await isBotAdmin())) return reply('❌ Bot must be admin');
      if (!args[0]) return reply('Usage: .group <open/close>');
      const setting = args[0].toLowerCase() === 'open' ? 'not_announcement' : 'announcement';
      await sock.groupSettingUpdate(from, setting);
      return reply(`✅ Group ${args[0].toLowerCase()}`);

    case 'setname':
      if (!isGroup) return reply('❌ Group only command');
      if (!(await isAdmin(sender))) return reply('❌ Admins only');
      if (!args.join(' ')) return reply('Usage: .setname <text>');
      await sock.groupUpdateSubject(from, args.join(' '));
      return reply(`✅ Group name updated`);

    case 'setdesc':
      if (!isGroup) return reply('❌ Group only command');
      if (!(await isAdmin(sender))) return reply('❌ Admins only');
      if (!args.join(' ')) return reply('Usage: .setdesc <text>');
      await sock.groupUpdateDescription(from, args.join(' '));
      return reply(`✅ Group description updated`);

    case 'admins':
      if (!isGroup) return reply('❌ Group only command');
      const meta2 = await sock.groupMetadata(from);
      const admins = meta2.participants
        .filter((p) => p.admin)
        .map((p) => `• @${p.id.split('@')[0]}`);
      return mention(`👥 Admins:\n${admins.join('\n')}`, meta2.participants.filter((p) => p.admin).map((p) => p.id));

    case 'groupinfo':
      if (!isGroup) return reply('❌ Group only command');
      const meta3 = await sock.groupMetadata(from);
      const info = 
        `📊 *Group Information*\n\n` +
        `📛 Name: ${meta3.subject}\n` +
        `🆔 ID: ${meta3.id}\n` +
        `👥 Members: ${meta3.participants.length}\n` +
        `👑 Owner: ${meta3.owner || 'Unknown'}\n` +
        `📄 Description: ${meta3.desc || 'No description'}`;
      return reply(info);

    default:
      return; // ignore unknown commands
  }
};
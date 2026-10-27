require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  AttachmentBuilder,
  REST,
  Routes,
} = require('discord.js');
const http = require('http');

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const GIST_ID = process.env.GIST_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PORT = process.env.PORT || 3000;

// ===== Instellingen =====
const LOGO = 'https://cdn.discordapp.com/attachments/1564064006837244015/1564414389166014604/EC6CB4B8-367B-42B8-9E92-EF824122CBD9.png?ex=6ae1d6af&is=6ae0852f&hm=ff0e31a6b2668956d70437b411170db595a49c0b21e84ea425e6c8cd689adff0&';
const FOOTER_TEXT = 'Prestige Market';

const VERIFY_CHANNEL_ID = '1564415101234567890'; // Pas dit aan naar je echte Verify kanaal ID
const VERIFIED_ROLE_ID = '1564415134171013154';
const LEGIT_CHANNEL_ID = '1564553823270342758';
const TICKET_PANEL_CHANNEL_ID = '1564415332737884233';
const TICKET_TRANSCRIPT_CHANNEL_ID = '1564415332737884234'; // Pas dit aan naar je echte Transcript kanaal ID

const STAFF_ROLE_IDS = [
  '1564419989002256516',
  '1564415131054772295',
  '1564415129955729418'
];

const TICKET_CATEGORIES = {
  support: { name: 'Support', prefix: 'support', categoryId: '1564627077880094801', emoji: '🎫', color: 0x3498db },
  purchase: { name: 'Purchase', prefix: 'purchase', categoryId: '1564627178384007249', emoji: '🛒', color: 0x00ff88 },
  bug: { name: 'Bug', prefix: 'bug', categoryId: '1564627295816122418', emoji: '⚠️', color: 0xff4444 },
};

// ===== De Regels =====
const RULES_TEXT = 
  "**1. PAYMENTS**\n" +
  "> • Only use the official payment methods provided by Prestige.\n" +
  "> • Double-check your order and total price before paying.\n" +
  "> • Fake payment proofs and fraud are strictly prohibited.\n" +
  "> • Never send payments to unofficial accounts.\n\n" +
  "**2. ORDERS**\n" +
  "> • Check your order carefully before completing your purchase.\n" +
  "> • Always provide accurate information.\n" +
  "> • Delivery times may vary depending on the product.\n" +
  "> • Open a ticket if you experience any issues with your order.\n\n" +
  "**3. REFUNDS**\n" +
  "> • Submit all refund requests through a ticket.\n" +
  "> • Refund requests are handled according to applicable policies and laws.\n" +
  "> • All applicable consumer rights remain valid.\n\n" +
  "**4. FRAUD AND ABUSE**\n" +
  "> • Scamming, fraud, and abuse are strictly prohibited.\n" +
  "> • False claims regarding payments or orders are not allowed.\n\n" +
  "**5. CUSTOMER SUPPORT**\n" +
  "> • Open a ticket if you need assistance.\n" +
  "> • Do not spam tickets or create multiple tickets for the same issue.\n" +
  "> • Remain respectful towards staff members.\n" +
  "> • Never share your passwords or sensitive information.\n\n" +
  "**6. ADVERTISING**\n" +
  "> • Advertising other shops without permission is prohibited.\n" +
  "> • Spam and unsolicited promotional messages are not allowed.\n" +
  "> • Advertising is only permitted in designated channels.\n\n" +
  "*Thank you for choosing Prestige.*";

// ===== HTTP Server (Keep-Alive) =====
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running!');
}).listen(PORT, () => console.log(`✅ Web server running on port ${PORT}`));

const SELF_URL = process.env.RENDER_EXTERNAL_URL;
if (SELF_URL) setInterval(() => fetch(SELF_URL).catch(() => {}), 12 * 60 * 1000);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// ===== GIST DATABASE =====
async function readGist() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`Gist read failed: ${res.status}`);
  const data = await res.json();
  const parsed = JSON.parse(data.files['data.json'].content);
  return {
    legitVotes: parsed.legitVotes || { approve: [], reject: [] },
    legitMessageId: parsed.legitMessageId || null,
    verifyMessageId: parsed.verifyMessageId || null,
    tickets: parsed.tickets || {},
  };
}

async function writeGist(data) {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: { 'data.json': { content: JSON.stringify(data, null, 2) } } }),
  });
  if (!res.ok) throw new Error(`Gist write failed: ${res.status}`);
}

async function getLegitVotes() { const d = await readGist(); return d.legitVotes; }
async function saveLegitVotes(v) { const d = await readGist(); d.legitVotes = v; await writeGist(d); }
async function getLegitMessageId() { const d = await readGist(); return d.legitMessageId; }
async function setLegitMessageId(id) { const d = await readGist(); d.legitMessageId = id; await writeGist(d); }

async function getVerifyMessageId() { const d = await readGist(); return d.verifyMessageId; }
async function setVerifyMessageId(id) { const d = await readGist(); d.verifyMessageId = id; await writeGist(d); }

async function getTickets() { const d = await readGist(); return d.tickets; }
async function saveTickets(t) { const d = await readGist(); d.tickets = t; await writeGist(d); }
async function addTicket(channelId, userId, categoryKey) {
  const t = await getTickets(); t[channelId] = { userId, categorie: categoryKey, gestart: Date.now() }; await saveTickets(t);
}
async function removeTicket(channelId) {
  const t = await getTickets(); delete t[channelId]; await saveTickets(t);
}

// ===== HELPER =====
function isStaff(member) {
  return member && STAFF_ROLE_IDS.some(id => member.roles.cache.has(id));
}

// ===== VERIFY SYSTEEM =====
async function setupVerify() {
  try {
    const channel = await client.channels.fetch(VERIFY_CHANNEL_ID);
    if (!channel) return;

    const fetched = await channel.messages.fetch({ limit: 50 });
    for (const msg of fetched.filter(m => m.author.id === client.user.id).values()) await msg.delete().catch(() => {});

    const guild = channel.guild;
    await guild.members.fetch(); 
    
    const verifiedRole = guild.roles.cache.get(VERIFIED_ROLE_ID);
    const verifiedCount = verifiedRole ? verifiedRole.members.size : 0;

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'PRESTIGE RULES', iconURL: LOGO })
      .setColor(0x2b2b2b)
      .setDescription(`Welcome to Prestige. Please read the rules carefully before placing an order.\n\n${RULES_TEXT}`)
      .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
      .setThumbnail(LOGO)
      .addFields({ name: '👥 Geverifieerde leden', value: `**${verifiedCount}**`, inline: false })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verify_accept_rules').setLabel('Accepteer Regels').setEmoji('✅').setStyle(ButtonStyle.Success)
    );

    const newMsg = await channel.send({ embeds: [embed], components: [row] });
    await setVerifyMessageId(newMsg.id);
    console.log('✅ Verify bericht geplaatst');
  } catch (e) { console.error('Verify setup error:', e.message); }
}

// ===== LEGIT SYSTEEM =====
function buildLegitEmbed(votes) {
  return new EmbedBuilder()
    .setTitle('Are we legit?')
    .setColor(0x00ff88)
    .setDescription(
      '**No without proof = ban**\n\n' +
      `> ✅ Legit — **${votes.approve.length}**\n` +
      `> ❌ Not legit — **${votes.reject.length}**`
    )
    .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
    .setThumbnail(LOGO);
}

function buildLegitRow(votes) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('legit_approve').setLabel(`✅ ${votes.approve.length}`).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('legit_reject').setLabel(`❌ ${votes.reject.length}`).setStyle(ButtonStyle.Secondary)
  );
}

async function setupLegit() {
  try {
    const channel = await client.channels.fetch(LEGIT_CHANNEL_ID);
    if (!channel) return;

    const votes = await getLegitVotes();
    const embed = buildLegitEmbed(votes);
    const row = buildLegitRow(votes);

    const messageId = await getLegitMessageId();
    if (messageId) {
      try {
        const msg = await channel.messages.fetch(messageId);
        if (msg && msg.author.id === client.user.id) {
          await msg.edit({ embeds: [embed], components: [row] });
          return;
        }
      } catch (e) {}
    }

    const fetched = await channel.messages.fetch({ limit: 50 });
    for (const m of fetched.filter(m => m.author.id === client.user.id).values()) await m.delete().catch(() => {});

    const newMsg = await channel.send({ embeds: [embed], components: [row] });
    await setLegitMessageId(newMsg.id);
    console.log('✅ Legit poll geplaatst');
  } catch (e) { console.error('Legit setup error:', e.message); }
}

// ===== TICKET SYSTEEM =====
function buildTicketPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🎫 Prestige Support')
    .setColor(0x5865f2)
    .setDescription('Kies hieronder een categorie om een ticket te openen.\n\n> 🎫 **Support**\n> 🛒 **Purchase**\n> ⚠️ **Bug**')
    .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
    .setThumbnail(LOGO);
}

function buildTicketPanelMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_category_select')
      .setPlaceholder('Categorie...')
      .addOptions([
        { label: 'Support', value: 'support', emoji: '🎫' },
        { label: 'Purchase', value: 'purchase', emoji: '🛒' },
        { label: 'Bug', value: 'bug', emoji: '⚠️' },
      ])
  );
}

async function setupTicketPanel() {
  try {
    const channel = await client.channels.fetch(TICKET_PANEL_CHANNEL_ID);
    if (!channel) return;

    const fetched = await channel.messages.fetch({ limit: 50 });
    for (const m of fetched.filter(m => m.author.id === client.user.id).values()) await m.delete().catch(() => {});

    await channel.send({ embeds: [buildTicketPanelEmbed()], components: [buildTicketPanelMenu()] });
    console.log('✅ Ticket panel geplaatst');
  } catch (e) { console.error('Ticket panel error:', e.message); }
}

async function makeTranscript(channel) {
  let allMessages = [], lastId = null, searching = true;
  while (searching) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;
    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) break;
    allMessages.push(...messages.values());
    lastId = messages.last().id;
    if (messages.size < 100) searching = false;
  }
  allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const html = `<!DOCTYPE html><html><head><title>Transcript</title><style>body { font-family: Arial; background: #313338; color: #fff; } .msg { margin: 10px; } .author { font-weight: bold; color: #5865f2; }</style></head><body><h1>Transcript: #${channel.name}</h1>${allMessages.map(m => `<div class="msg"><span class="author">${m.author.username}</span> <small>${new Date(m.createdTimestamp).toLocaleString()}</small><p>${m.content || '[Embed/Attachment]'}</p></div>`).join('')}</body></html>`;
  return { html, messageCount: allMessages.length };
}

async function closeTicket(channel, closerId) {
  const tickets = await getTickets();
  const ticket = tickets[channel.id];
  if (!ticket) return;

  try {
    const { html, messageCount } = await makeTranscript(channel);
    const buffer = Buffer.from(html, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.html` });
    
    const transcriptChannel = await client.channels.fetch(TICKET_TRANSCRIPT_CHANNEL_ID);
    const cat = TICKET_CATEGORIES[ticket.categorie];

    const embed = new EmbedBuilder()
      .setTitle('Ticket Transcript')
      .setColor(cat ? cat.color : 0x5865f2)
      .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
      .addFields(
        { name: 'Kanaal', value: `#${channel.name}`, inline: true },
        { name: 'Klant', value: `<@${ticket.userId}>`, inline: true },
        { name: 'Gesloten door', value: `<@${closerId}>`, inline: true },
        { name: 'Berichten', value: `${messageCount}`, inline: true }
      ).setTimestamp();

    await transcriptChannel.send({ embeds: [embed], files: [attachment] });
    try {
      const user = await client.users.fetch(ticket.userId);
      await user.send({ content: `🔒 Je ticket **#${channel.name}** is gesloten. Hier is het transcript:`, files: [attachment] });
    } catch (e) {}
  } catch (e) { console.error('Transcript error:', e.message); }

  await removeTicket(channel.id);
  setTimeout(async () => { try { await channel.delete('Ticket gesloten'); } catch (e) {} }, 5000);
}

// ===== COMMANDS =====
const commands = [
  { name: 'add', description: 'Voeg een user toe aan ticket', options: [{ name: 'user', description: 'User', type: 6, required: true }] },
  { name: 'remove', description: 'Verwijder een user uit ticket', options: [{ name: 'user', description: 'User', type: 6, required: true }] },
  { name: 'close', description: 'Sluit dit ticket' },
  { name: 'rename', description: 'Hernoem dit ticket', options: [{ name: 'name', description: 'Nieuwe naam', type: 3, required: true }] },
  { name: 'ticketpanel', description: 'Plaats het ticket panel' },
  { name: 'refreshverify', description: 'Refresh het verify bericht' }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Commands geladen');
  } catch (e) { console.error(e); }
})();

// ===== INTERACTION HANDLER =====
client.on('interactionCreate', async (i) => {
  if (i.isChatInputCommand()) {
    const name = i.commandName;
    
    if (name === 'ticketpanel') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ Geen permissie.', ephemeral: true });
      await i.deferReply({ ephemeral: true });
      await setupTicketPanel();
      return i.editReply({ content: '✅ Ticket panel geplaatst!' });
    }
    
    if (name === 'refreshverify') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ Geen permissie.', ephemeral: true });
      await i.deferReply({ ephemeral: true });
      await setupVerify();
      return i.editReply({ content: '✅ Verify bericht vernieuwd!' });
    }

    const tickets = await getTickets();
    const ticket = tickets[i.channelId];

    if (name === 'close') {
      if (!isStaff(i.member) && (!ticket || ticket.userId !== i.user.id)) return i.reply({ content: '❌ Geen permissie.', ephemeral: true });
      if (!ticket) return i.reply({ content: '❌ Dit is geen actief ticket.', ephemeral: true });
      await i.reply({ content: '🔒 Ticket wordt gesloten...' });
      return await closeTicket(i.channel, i.user.id);
    }

    if (name === 'add' || name === 'remove') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ Geen permissie.', ephemeral: true });
      if (!ticket) return i.reply({ content: '❌ Dit is geen actief ticket.', ephemeral: true });
      await i.deferReply({ ephemeral: true });
      const targetUser = i.options.getUser('user');
      try {
        if (name === 'add') {
          await i.channel.permissionOverwrites.edit(targetUser.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true });
          await i.channel.send({ content: `➕ <@${targetUser.id}> is toegevoegd door <@${i.user.id}>.` });
        } else {
          await i.channel.permissionOverwrites.delete(targetUser.id);
          await i.channel.send({ content: `➖ <@${targetUser.id}> is verwijderd door <@${i.user.id}>.` });
        }
        await i.editReply({ content: '✅ Gelukt.' });
      } catch (e) { await i.editReply({ content: `❌ Fout: ${e.message}` }); }
      return;
    }

    if (name === 'rename') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ Geen permissie.', ephemeral: true });
      if (!ticket) return i.reply({ content: '❌ Dit is geen actief ticket.', ephemeral: true });
      await i.deferReply({ ephemeral: true });
      const newName = i.options.getString('name').toLowerCase().replace(/[^a-z0-9-]/g, '-');
      try {
        await i.channel.setName(newName);
        await i.editReply({ content: `✅ Hernoemd naar ${newName}.` });
      } catch (e) { await i.editReply({ content: `❌ Fout: ${e.message}` }); }
      return;
    }
  }

  if (i.isStringSelectMenu() && i.customId === 'ticket_category_select') {
    await i.deferReply({ ephemeral: true });
    const choice = i.values[0];
    const cat = TICKET_CATEGORIES[choice];
    if (!cat) return i.editReply({ content: '❌ Onbekende categorie.' });

    try {
      const guild = i.guild;
      const tickets = await getTickets();
      if (Object.values(tickets).find(t => t.userId === i.user.id)) {
        return i.editReply({ content: '❌ Je hebt al een open ticket.' });
      }

      const channelName = `${cat.prefix}-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const overwrites = [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
      ];
      for (const roleId of STAFF_ROLE_IDS) {
        overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] });
      }

      const ticketChannel = await guild.channels.create({
        name: channelName, type: ChannelType.GuildText, parent: cat.categoryId, permissionOverwrites: overwrites, topic: `Ticket van ${i.user.tag}`,
      });

      await addTicket(ticketChannel.id, i.user.id, choice);

      const embed = new EmbedBuilder().setTitle(cat.name).setColor(cat.color).setDescription(`<@${i.user.id}> — Beschrijf hieronder je vraag.`).setTimestamp();
      const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Sluiten').setEmoji('🔒').setStyle(ButtonStyle.Danger));

      const staffMentions = STAFF_ROLE_IDS.map(id => `<@&${id}>`).join(' ');
      await ticketChannel.send({ content: `<@${i.user.id}> ${staffMentions}`, embeds: [embed], components: [closeRow] });
      
      await i.editReply({ content: `✅ Ticket aangemaakt: <#${ticketChannel.id}>` });
    } catch (e) { await i.editReply({ content: `❌ Fout: ${e.message}` }); }
    return;
  }

  if (i.isButton()) {
    if (i.customId === 'verify_accept_rules') {
      if (i.member.roles.cache.has(VERIFIED_ROLE_ID)) return i.reply({ content: '❌ Je bent al geverifieerd!', ephemeral: true });
      try {
        await i.member.roles.add(VERIFIED_ROLE_ID);
        await i.reply({ content: '✅ Je hebt de regels geaccepteerd en bent nu geverifieerd!', ephemeral: true });
        
        // Update teller
        const messageId = await getVerifyMessageId();
        if (messageId) {
          const verifiedRole = i.guild.roles.cache.get(VERIFIED_ROLE_ID);
          const verifiedCount = verifiedRole ? verifiedRole.members.size : 0;
          try {
            const msg = await i.channel.messages.fetch(messageId);
            if (msg) {
              const newEmbed = EmbedBuilder.from(msg.embeds[0]).spliceFields(0, 1, { name: '👥 Geverifieerde leden', value: `**${verifiedCount}**`, inline: false });
              await msg.edit({ embeds: [newEmbed] });
            }
          } catch (e) {}
        }
      } catch (e) { await i.reply({ content: `❌ Fout: ${e.message}`, ephemeral: true }); }
      return;
    }

    if (i.customId === 'ticket_close') {
      const tickets = await getTickets();
      const ticket = tickets[i.channelId];
      if (!ticket) return i.reply({ content: '❌ Geen actief ticket.', ephemeral: true });
      if (ticket.userId !== i.user.id && !isStaff(i.member)) return i.reply({ content: '❌ Je mag dit ticket niet sluiten.', ephemeral: true });
      await i.reply({ content: '🔒 Ticket wordt gesloten...' });
      await closeTicket(i.channel, i.user.id);
      return;
    }

    if (i.customId === 'legit_approve' || i.customId === 'legit_reject') {
      try {
        const votes = await getLegitVotes();
        votes.approve = votes.approve.filter(id => id !== i.user.id);
        votes.reject = votes.reject.filter(id => id !== i.user.id);
        if (i.customId === 'legit_approve') votes.approve.push(i.user.id);
        else votes.reject.push(i.user.id);
        await saveLegitVotes(votes);
        await i.update({ embeds: [buildLegitEmbed(votes)], components: [buildLegitRow(votes)] });
      } catch (e) { await i.reply({ content: `❌ Fout: ${e.message}`, ephemeral: true }); }
      return;
    }
  }
});

client.once('ready', async () => {
  console.log(`✅ Bot online als ${client.user.tag}`);
  const guild = client.guilds.cache.first();
  if (guild) {
    await guild.members.fetch();
    client.user.setActivity(`${guild.memberCount} Discord Members`, { type: 3 });
  }
  await setupVerify();
  await setupLegit();
  await setupTicketPanel();
});

client.login(TOKEN);

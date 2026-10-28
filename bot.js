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
  MessageFlags,
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

// Kanalen
const VERIFY_CHANNEL_ID = '1564632375336505344'; 
const LEGIT_CHANNEL_ID = '1564553823270342758';
const TICKET_PANEL_CHANNEL_ID = '1564415332737884233';
const LOG_CHANNEL_ID = '1555729409535774833'; 
const TICKET_TRANSCRIPT_CHANNEL_ID = '1564415332737884234';
const VOUCH_CHANNEL_ID = '1564555149865656401';

// Rollen
const VERIFIED_ROLE_ID = '1564415134171013154';
const VOUCH_ROLE_ID = '1564635023787950090';
const MAIN_TAG_ROLE_ID = '1564638227204149258'; 
const STAFF_ROLE_IDS = [
  '1564419989002256516',
  '1564415131054772295',
  '1564415129955729418',
  MAIN_TAG_ROLE_ID
];

// Ticket Categories
const NOT_LEGIT_TICKET_CATEGORY_ID = '1564632244235014315';
const TICKET_CATEGORIES = {
  support: { name: 'Support', prefix: 'support', categoryId: '1564627077880094801', emoji: '🎫', color: 0x3498db },
  purchase: { name: 'Purchase', prefix: 'purchase', categoryId: '1564627178384007249', emoji: '🛒', color: 0x00ff88 },
  bug: { name: 'Bug', prefix: 'bug', categoryId: '1564627295816122418', emoji: '⚠️', color: 0xff4444 },
  notlegit: { name: 'Not Legit Proof', prefix: 'notlegit', categoryId: NOT_LEGIT_TICKET_CATEGORY_ID, emoji: '❌', color: 0xff4444 },
};

// Lijst met toegestane kanalen voor /move
const ALLOWED_MOVE_CATEGORIES = {
  '1564627077880094801': 'Support',
  '1564627178384007249': 'Purchase',
  '1564627295816122418': 'Bug',
  '1564632244235014315': 'Not Legit Proof',
  '1564636952676802700': 'Other/Archive'
};

// Betaalmethodes
const PAYMENT_METHODS = {
  ideal: 'iDeal',
  paypal: 'PayPal',
  crypto: 'Crypto (LTC)',
  bank: 'Bank Transfer'
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

// ===== HTTP Server =====
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
  
  if (!data.files || !data.files['data.json']) {
    return {
      legitVotes: { approve: [], reject: [] },
      legitMessageId: null,
      verifyMessageId: null,
      tickets: {},
      notlegitTickets: {},
      confirmedRejects: [],
      vouchCounter: 0,
      storeData: { sections: {}, services: {}, products: {} },
    };
  }

  const parsed = JSON.parse(data.files['data.json'].content);
  return {
    legitVotes: parsed.legitVotes || { approve: [], reject: [] },
    legitMessageId: parsed.legitMessageId || null,
    verifyMessageId: parsed.verifyMessageId || null,
    tickets: parsed.tickets || {},
    notlegitTickets: parsed.notlegitTickets || {},
    confirmedRejects: parsed.confirmedRejects || [],
    vouchCounter: parsed.vouchCounter || 0,
    storeData: parsed.storeData || { sections: {}, services: {}, products: {} },
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
async function getConfirmedRejects() { const d = await readGist(); return d.confirmedRejects || []; }
async function saveConfirmedRejects(list) { const d = await readGist(); d.confirmedRejects = list; await writeGist(d); }

async function getVerifyMessageId() { const d = await readGist(); return d.verifyMessageId; }
async function setVerifyMessageId(id) { const d = await readGist(); d.verifyMessageId = id; await writeGist(d); }

async function getTickets() { const d = await readGist(); return d.tickets; }
async function saveTickets(t) { const d = await readGist(); d.tickets = t; await writeGist(d); }
async function addTicket(channelId, userId, categoryKey) {
  const t = await getTickets(); t[channelId] = { userId, categorie: categoryKey, gestart: Date.now(), extraUsers: [] }; await saveTickets(t);
}
async function removeTicket(channelId) {
  const t = await getTickets(); delete t[channelId]; await saveTickets(t);
}
async function updateTicketCategory(channelId, newCategoryKey) {
  const t = await getTickets();
  if (t[channelId]) {
    t[channelId].categorie = newCategoryKey;
    await saveTickets(t);
    return true;
  }
  return false;
}

async function getNotLegitTickets() { const d = await readGist(); return d.notlegitTickets || {}; }
async function saveNotLegitTickets(n) { const d = await readGist(); d.notlegitTickets = n; await writeGist(d); }
async function setNotLegitStatus(channelId, status) {
  const n = await getNotLegitTickets();
  if (n[channelId]) {
    n[channelId].status = status;
    n[channelId].updatedAt = Date.now();
    await saveNotLegitTickets(n);
  }
}

async function readVouchCounter() { const d = await readGist(); return d.vouchCounter; }
async function writeVouchCounter(n) { const d = await readGist(); d.vouchCounter = n; await writeGist(d); }

// Store Data
async function getStoreData() { const d = await readGist(); return d.storeData; }
async function saveStoreData(s) { const d = await readGist(); d.storeData = s; await writeGist(d); }

// ===== HELPERS =====
function isStaff(member) {
  return member && STAFF_ROLE_IDS.some(id => member.roles.cache.has(id));
}

async function sendLog(title, description, color = 0x5865f2, fields = []) {
  try {
    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setDescription(description)
      .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
      .setTimestamp();
      
    if (fields.length > 0) embed.addFields(fields);

    await logChannel.send({ embeds: [embed] });
  } catch (e) {
    console.error('Failed to send log:', e.message);
  }
}

// ===== STATUS SYSTEEM =====
let statusState = 0; // 0 = Members, 1 = Vouches
let cachedVouches = 0;

async function updateBotStatus() {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    if (statusState === 0) {
      client.user.setActivity(`${guild.memberCount} Discord Members`, { type: 3 }); 
    } else {
      client.user.setActivity(`${cachedVouches} Vouches`, { type: 3 }); 
    }
    
    statusState = (statusState + 1) % 2;
  } catch (error) {
    console.error("Failed to update status:", error);
  }
}

async function refreshCounters() {
  try {
    const d = await readGist();
    cachedVouches = d.vouchCounter || 0;
  } catch (e) {}
}

function startStatusInterval() {
  refreshCounters();
  updateBotStatus();
  setInterval(refreshCounters, 60000);
  setInterval(updateBotStatus, 10000); 
}

// ===== LEGIT SYSTEEM =====
function buildLegitEmbed(votes, confirmedRejects = []) {
  const confirmedCount = confirmedRejects.length;
  return new EmbedBuilder()
    .setTitle('Are we legit?')
    .setColor(0x00ff88)
    .setDescription(
      '**No without proof = ban**\n\n' +
      `> ✅ Legit — **${votes.approve.length}**\n` +
      `> ❌ Not legit — **${votes.reject.length}**` +
      (confirmedCount > 0 ? `\n> 🟢 Confirmed (with proof) — **${confirmedCount}**` : '')
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
    const channel = await client.channels.fetch(LEGIT_CHANNEL_ID).catch(() => null);
    
    if (!channel || !channel.isTextBased()) {
      console.error(`❌ Legit channel (${LEGIT_CHANNEL_ID}) not found.`);
      return;
    }

    const votes = await getLegitVotes();
    const confirmed = await getConfirmedRejects();
    const embed = buildLegitEmbed(votes, confirmed);
    const row = buildLegitRow(votes);

    const messageId = await getLegitMessageId();
    if (messageId) {
      try {
        const msg = await channel.messages.fetch(messageId);
        if (msg && msg.author.id === client.user.id) {
          await msg.edit({ embeds: [embed], components: [row] });
          console.log('✅ Legit poll updated');
          return;
        }
      } catch (e) {}
    }

    const newMsg = await channel.send({ embeds: [embed], components: [row] });
    await setLegitMessageId(newMsg.id);
    console.log('✅ Legit poll placed');
  } catch (e) { 
    console.error('Legit setup error:', e.message); 
  }
}

// ===== VERIFY SYSTEEM =====
async function updateVerifyMessage() {
  try {
    const channel = await client.channels.fetch(VERIFY_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const messageId = await getVerifyMessageId();
    if (!messageId) return;

    const guild = channel.guild;
    await guild.members.fetch();
    
    const verifiedRole = guild.roles.cache.get(VERIFIED_ROLE_ID);
    const verifiedCount = verifiedRole ? verifiedRole.members.size : 0;

    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg) return;

    const newEmbed = new EmbedBuilder()
      .setAuthor({ name: 'PRESTIGE RULES', iconURL: LOGO })
      .setColor(0x2b2b2b)
      .setDescription(`Welcome to Prestige. Please read the rules carefully before placing an order.\n\n${RULES_TEXT}`)
      .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
      .setThumbnail(LOGO)
      .setTimestamp();

    const newRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verify_accept_rules')
        .setLabel(`✅ ${verifiedCount}`)
        .setStyle(ButtonStyle.Secondary)
    );

    await msg.edit({ embeds: [newEmbed], components: [newRow] });
  } catch (e) {
    console.error('Failed to update verify message:', e.message);
  }
}

async function setupVerify() {
  try {
    const channel = await client.channels.fetch(VERIFY_CHANNEL_ID).catch(() => null);
    if (!channel) return console.error(`❌ Verify channel (${VERIFY_CHANNEL_ID}) not found.`);

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
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verify_accept_rules')
        .setLabel(`✅ ${verifiedCount}`)
        .setStyle(ButtonStyle.Secondary)
    );

    const newMsg = await channel.send({ embeds: [embed], components: [row] });
    await setVerifyMessageId(newMsg.id);
    console.log('✅ Verify message placed');
  } catch (e) { console.error('Verify setup error:', e.message); }
}

// ===== TICKET SYSTEEM =====
function buildTicketPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🎫 Prestige Support')
    .setColor(0x5865f2)
    .setDescription('Select a category below to open a ticket.\n\n> 🎫 **Support**\n> 🛒 **Purchase**\n> ⚠️ **Bug**')
    .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
    .setThumbnail(LOGO);
}

function buildTicketPanelMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_category_select')
      .setPlaceholder('Category...')
      .addOptions([
        { label: 'Support', value: 'support', emoji: '🎫' },
        { label: 'Purchase', value: 'purchase', emoji: '🛒' },
        { label: 'Bug', value: 'bug', emoji: '⚠️' },
      ])
  );
}

async function setupTicketPanel() {
  try {
    const channel = await client.channels.fetch(TICKET_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const fetched = await channel.messages.fetch({ limit: 50 });
    for (const m of fetched.filter(m => m.author.id === client.user.id).values()) await m.delete().catch(() => {});

    await channel.send({ embeds: [buildTicketPanelEmbed()], components: [buildTicketPanelMenu()] });
    console.log('✅ Ticket panel placed');
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
    
    const transcriptChannel = await client.channels.fetch(TICKET_TRANSCRIPT_CHANNEL_ID).catch(() => null);
    const cat = TICKET_CATEGORIES[ticket.categorie];

    if (transcriptChannel) {
      const embed = new EmbedBuilder()
        .setTitle('Ticket Transcript')
        .setColor(cat ? cat.color : 0x5865f2)
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .addFields(
          { name: 'Channel', value: `#${channel.name}`, inline: true },
          { name: 'Customer', value: `<@${ticket.userId}>`, inline: true },
          { name: 'Closed by', value: `<@${closerId}>`, inline: true },
          { name: 'Messages', value: `${messageCount}`, inline: true }
        ).setTimestamp();

      await transcriptChannel.send({ embeds: [embed], files: [attachment] });
    }

    await sendLog('🔒 Ticket Closed', `<@${closerId}> closed the ticket from <@${ticket.userId}>.`, 0xff4444, [
      { name: 'Channel', value: `#${channel.name}`, inline: true },
      { name: 'Category', value: cat ? cat.name : 'Unknown', inline: true },
      { name: 'Messages', value: `${messageCount}`, inline: true }
    ]);

    try {
      const user = await client.users.fetch(ticket.userId);
      await user.send({ content: `🔒 Your ticket **#${channel.name}** has been closed. Here is the transcript:`, files: [attachment] });
    } catch (e) {}
  } catch (e) { console.error('Transcript error:', e.message); }

  await removeTicket(channel.id);
  setTimeout(async () => { try { await channel.delete('Ticket closed'); } catch (e) {} }, 5000);
}

// ===== COMMANDS =====
const commands = [
  { 
    name: 'vouch', 
    description: 'Leave a vouch',
    options: [
      { name: 'product', description: 'What did you buy?', type: 3, required: true },
      { name: 'extra', description: 'Extra information', type: 3, required: true }
    ]
  },
  { name: 'addsection', description: 'Add a new section to the store', options: [{ name: 'name', description: 'Section name', type: 3, required: true }] },
  { name: 'addservice', description: 'Add a service to a section', options: [{ name: 'section', description: 'Section name', type: 3, required: true }, { name: 'name', description: 'Service name', type: 3, required: true }] },
  { name: 'addproduct', description: 'Add a product to a service', options: [{ name: 'service', description: 'Service name', type: 3, required: true }, { name: 'name', description: 'Product name', type: 3, required: true }] },
  { name: 'addprice', description: 'Set the price of a product', options: [{ name: 'product', description: 'Product name', type: 3, required: true }, { name: 'price', description: 'Price (e.g. €5.00)', type: 3, required: true }] },
  { name: 'add', description: 'Add a user to this ticket', options: [{ name: 'user', description: 'User', type: 6, required: true }] },
  { name: 'remove', description: 'Remove a user from this ticket', options: [{ name: 'user', description: 'User', type: 6, required: true }] },
  { name: 'close', description: 'Close this ticket' },
  { name: 'rename', description: 'Rename this ticket', options: [{ name: 'name', description: 'New name', type: 3, required: true }] },
  { name: 'move', description: 'Move this ticket to another category' },
  { name: 'ticketpanel', description: 'Place the ticket panel' },
  { name: 'refreshverify', description: 'Refresh the verify message' },
  { name: 'removekruis', description: 'Remove ❌ votes from the legit poll', options: [{ name: 'amount', description: 'How many crosses to remove?', type: 4, required: true, min_value: 1 }] }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Commands loaded');
  } catch (e) { console.error(e); }
})();

// ===== INTERACTION HANDLER =====
client.on('interactionCreate', async (i) => {
  if (i.isChatInputCommand()) {
    const name = i.commandName;
    
    if (name === 'vouch') {
      if (!i.member.roles.cache.has(VOUCH_ROLE_ID)) {
        return i.reply({ content: `❌ You need the <@&${VOUCH_ROLE_ID}> role to use this command.`, flags: MessageFlags.Ephemeral });
      }

      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const product = i.options.getString('product');
      const extra = i.options.getString('extra');

      try {
        const channel = await client.channels.fetch(VOUCH_CHANNEL_ID).catch(() => null);
        if (!channel) return i.editReply({ content: '❌ Vouch channel not found.' });

        let nummer = 1;
        try {
          const current = await readVouchCounter();
          nummer = current + 1;
          await writeVouchCounter(nummer);
          cachedVouches = nummer;
        } catch (e) { console.error('Counter error:', e); }

        const embed = new EmbedBuilder()
          .setTitle(`Vouch #${nummer}`)
          .setColor(0x00ff88)
          .setThumbnail(LOGO)
          .setAuthor({ name: i.user.displayName, iconURL: i.user.displayAvatarURL() })
          .addFields(
            { name: 'Product', value: product, inline: true },
            { name: 'Customer', value: `<@${i.user.id}>`, inline: true },
            { name: 'Extra', value: extra, inline: false }
          )
          .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
        
        await sendLog('⭐ New Vouch', `<@${i.user.id}> left a vouch (#${nummer}).`, 0x00ff88);
        
        try {
          await i.user.send({ content: `✅ Your vouch has been successfully posted in <#${VOUCH_CHANNEL_ID}>!` });
        } catch (err) {}

        return i.editReply({ content: `✅ Vouch posted!` });
      } catch (e) {
        console.error(e);
        return i.editReply({ content: `❌ Error: ${e.message}` });
      }
    }

    if (name === 'addsection' || name === 'addservice' || name === 'addproduct' || name === 'addprice') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      
      const store = await getStoreData();
      
      if (name === 'addsection') {
        const secName = i.options.getString('name');
        if (!store.sections[secName]) store.sections[secName] = [];
        await saveStoreData(store);
        return i.reply({ content: `✅ Section **${secName}** added.`, flags: MessageFlags.Ephemeral });
      }
      
      if (name === 'addservice') {
        const secName = i.options.getString('section');
        const servName = i.options.getString('name');
        if (!store.sections[secName]) return i.reply({ content: `❌ Section **${secName}** does not exist.`, flags: MessageFlags.Ephemeral });
        if (!store.sections[secName].includes(servName)) store.sections[secName].push(servName);
        if (!store.services[servName]) store.services[servName] = [];
        await saveStoreData(store);
        return i.reply({ content: `✅ Service **${servName}** added to **${secName}**.`, flags: MessageFlags.Ephemeral });
      }
      
      if (name === 'addproduct') {
        const servName = i.options.getString('service');
        const prodName = i.options.getString('name');
        if (!store.services[servName]) return i.reply({ content: `❌ Service **${servName}** does not exist.`, flags: MessageFlags.Ephemeral });
        if (!store.services[servName].includes(prodName)) store.services[servName].push(prodName);
        if (!store.products[prodName]) store.products[prodName] = { price: 'N/A' };
        await saveStoreData(store);
        return i.reply({ content: `✅ Product **${prodName}** added to **${servName}**.`, flags: MessageFlags.Ephemeral });
      }
      
      if (name === 'addprice') {
        const prodName = i.options.getString('product');
        const price = i.options.getString('price');
        if (!store.products[prodName]) return i.reply({ content: `❌ Product **${prodName}** does not exist.`, flags: MessageFlags.Ephemeral });
        store.products[prodName].price = price;
        await saveStoreData(store);
        return i.reply({ content: `✅ Price for **${prodName}** set to **${price}**.`, flags: MessageFlags.Ephemeral });
      }
    }

    if (name === 'ticketpanel') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      await setupTicketPanel();
      await sendLog('🛠️ Command Used', `<@${i.user.id}> refreshed the ticket panel.`, 0x5865f2);
      return i.editReply({ content: '✅ Ticket panel placed!' });
    }
    
    if (name === 'refreshverify') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      await setupVerify();
      await sendLog('🛠️ Command Used', `<@${i.user.id}> refreshed the verify message.`, 0x5865f2);
      return i.editReply({ content: '✅ Verify message refreshed!' });
    }

    if (name === 'removekruis') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const amount = i.options.getInteger('amount');
      
      try {
        const votes = await getLegitVotes();
        const current = votes.reject.length;
        if (current === 0) return i.editReply({ content: '⚠️ There are currently no crosses to remove.' });
        
        const toRemove = Math.min(amount, current);
        votes.reject.splice(current - toRemove, toRemove);
        await saveLegitVotes(votes);
        await setupLegit();
        
        await sendLog('🧹 Crosses Removed', `<@${i.user.id}> removed **${toRemove}** ❌ vote(s) from the legit poll.`, 0xff4444, [
          { name: 'Remaining ❌', value: `${votes.reject.length}`, inline: true }
        ]);
        
        return i.editReply({ content: `✅ Removed **${toRemove}** crosses.` });
      } catch (e) { 
        return i.editReply({ content: `❌ Error: ${e.message}` }); 
      }
    }

    const tickets = await getTickets();
    const ticket = tickets[i.channelId];

    if (name === 'close') {
      if (!isStaff(i.member) && (!ticket || ticket.userId !== i.user.id)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });
      await i.reply({ content: '🔒 Closing ticket...' });
      return await closeTicket(i.channel, i.user.id);
    }

    if (name === 'add' || name === 'remove') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const targetUser = i.options.getUser('user');
      try {
        if (name === 'add') {
          await i.channel.permissionOverwrites.edit(targetUser.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true });
          await i.channel.send({ content: `➕ <@${targetUser.id}> has been added by <@${i.user.id}>.` });
          await sendLog('➕ User Added', `<@${i.user.id}> added <@${targetUser.id}> to **#${i.channel.name}**.`, 0x00ff88);
        } else {
          await i.channel.permissionOverwrites.delete(targetUser.id);
          await i.channel.send({ content: `➖ <@${targetUser.id}> has been removed by <@${i.user.id}>.` });
          await sendLog('➖ User Removed', `<@${i.user.id}> removed <@${targetUser.id}> from **#${i.channel.name}**.`, 0xff4444);
        }
        await i.editReply({ content: '✅ Success.' });
      } catch (e) { await i.editReply({ content: `❌ Error: ${e.message}` }); }
      return;
    }

    if (name === 'rename') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const newName = i.options.getString('name').toLowerCase().replace(/[^a-z0-9-]/g, '-');
      try {
        const oldName = i.channel.name;
        await i.channel.setName(newName);
        await sendLog('✏️ Ticket Renamed', `<@${i.user.id}> renamed ticket **#${oldName}** to **#${newName}**.`, 0xf39c12);
        await i.editReply({ content: `✅ Renamed to ${newName}.` });
      } catch (e) { await i.editReply({ content: `❌ Error: ${e.message}` }); }
      return;
    }

    if (name === 'move') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });
      
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('move_ticket_select')
        .setPlaceholder('Kies een categorie...')
        .addOptions(Object.entries(ALLOWED_MOVE_CATEGORIES).map(([id, name]) => ({
          label: name,
          value: id
        })));

      const row = new ActionRowBuilder().addComponents(selectMenu);

      return i.reply({ content: 'Kies de categorie waar je dit ticket naartoe wilt verplaatsen:', components: [row], flags: MessageFlags.Ephemeral });
    }
  }

  // Purchase flow handling
  if (i.isStringSelectMenu()) {
    const tickets = await getTickets();
    const ticket = tickets[i.channelId];

    if (i.customId === 'purchase_section') {
      const store = await getStoreData();
      const section = i.values[0];
      const services = store.sections[section] || [];
      
      if (services.length === 0) {
        return i.update({ content: '❌ Geen services gevonden voor deze sectie.', components: [] });
      }

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`purchase_service_${section}`)
        .setPlaceholder('What service do you want to buy?')
        .addOptions(services.map(s => ({ label: s, value: s })));

      return i.update({ content: 'What service do you want to buy?', components: [new ActionRowBuilder().addComponents(menu)] });
    }

    if (i.customId.startsWith('purchase_service_')) {
      const store = await getStoreData();
      const service = i.values[0];
      const products = store.services[service] || [];
      
      if (products.length === 0) {
        return i.update({ content: '❌ Geen producten gevonden voor deze service.', components: [] });
      }

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`purchase_product_${service}`)
        .setPlaceholder('Which sort product do you want to buy?')
        .addOptions(products.map(p => ({ label: `${p} (${store.products[p]?.price || 'N/A'})`, value: p })));

      return i.update({ content: 'Which sort product do you want to buy?', components: [new ActionRowBuilder().addComponents(menu)] });
    }

    if (i.customId.startsWith('purchase_product_')) {
      const store = await getStoreData();
      const product = i.values[0];
      const price = store.products[product]?.price || 'N/A';

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`purchase_payment_${product}`)
        .setPlaceholder('Select payment method')
        .addOptions(Object.entries(PAYMENT_METHODS).map(([key, name]) => ({ label: name, value: key })));

      return i.update({ content: `You chose **${product}** for **${price}**. Select your payment method:`, components: [new ActionRowBuilder().addComponents(menu)] });
    }

    if (i.customId.startsWith('purchase_payment_')) {
      const product = i.customId.replace('purchase_payment_', '');
      const payment = i.values[0];
      const store = await getStoreData();
      const price = store.products[product]?.price || 'N/A';
      const paymentName = PAYMENT_METHODS[payment];

      // Maak het ticket klaar
      const embed = new EmbedBuilder()
        .setTitle('🛒 Purchase Details')
        .setColor(0x00ff88)
        .setThumbnail(LOGO)
        .setDescription(`Thank you for your order, <@${i.user.id}>! Please wait for a staff member to assist you.`)
        .addFields(
          { name: 'Product', value: product, inline: true },
          { name: 'Price', value: price, inline: true },
          { name: 'Payment Method', value: paymentName, inline: true }
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .setTimestamp();

      await i.channel.send({ content: `<@${i.user.id}> <@&${MAIN_TAG_ROLE_ID}>`, embeds: [embed] });
      
      await sendLog('🛒 Purchase Started', `<@${i.user.id}> started a purchase: **${product}** (${price}) via **${paymentName}**.`, 0x00ff88);
      
      return i.update({ content: '✅ Your purchase details have been sent to the staff!', components: [] });
    }

    if (i.customId === 'move_ticket_select') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      
      if (!ticket) return i.editReply({ content: '❌ This is not an active ticket.' });

      const newCategoryId = i.values[0];
      const newCategoryName = ALLOWED_MOVE_CATEGORIES[newCategoryId];

      try {
        await i.channel.setParent(newCategoryId, { lockPermissions: false });
        
        let newCatKey = null;
        for (const [key, cat] of Object.entries(TICKET_CATEGORIES)) {
          if (cat.categoryId === newCategoryId) {
            newCatKey = key;
            break;
          }
        }

        if (newCatKey) {
          await updateTicketCategory(i.channelId, newCatKey);
        }

        await i.channel.send({ content: `📁 Ticket has been moved to **${newCategoryName}** by <@${i.user.id}>.` });
        await sendLog('📁 Ticket Moved', `<@${i.user.id}> moved ticket **#${i.channel.name}** to **${newCategoryName}**.`, 0xf39c12, [
          { name: 'From', value: ticket.categorie || 'Unknown', inline: true },
          { name: 'To', value: newCategoryName, inline: true }
        ]);
        await i.editReply({ content: `✅ Moved to **${newCategoryName}**.` });
      } catch (e) {
        await i.editReply({ content: `❌ Error: ${e.message}` });
      }
      return;
    }

    if (i.customId === 'ticket_category_select') {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const choice = i.values[0];
      const cat = TICKET_CATEGORIES[choice];
      if (!cat) return i.editReply({ content: '❌ Unknown category.' });

      try {
        const guild = i.guild;
        const existingTicket = Object.values(tickets).find(t => t.userId === i.user.id);
        if (existingTicket) {
          return i.editReply({ content: `❌ You already have an open ticket: <#${Object.keys(tickets).find(key => tickets[key] === existingTicket)}>` });
        }

        const channelName = `${cat.prefix}-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const overwrites = [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
        ];
        
        overwrites.push({ id: MAIN_TAG_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] });

        const ticketChannel = await guild.channels.create({
          name: channelName, type: ChannelType.GuildText, parent: cat.categoryId, permissionOverwrites: overwrites, topic: `Ticket from ${i.user.tag}`,
        });

        await addTicket(ticketChannel.id, i.user.id, choice);

        const embed = new EmbedBuilder().setTitle(cat.name).setColor(cat.color).setDescription(`<@${i.user.id}> — Please describe your question below.`).setTimestamp();
        const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger));

        await ticketChannel.send({ content: `<@${i.user.id}> <@&${MAIN_TAG_ROLE_ID}>`, embeds: [embed], components: [closeRow] });
        
        await sendLog('🎫 New Ticket', `<@${i.user.id}> opened a new **${cat.name}** ticket.`, 0x00ff88, [
          { name: 'Channel', value: `<#${ticketChannel.id}>`, inline: true }
        ]);

        // Als het een Purchase ticket is, start de flow
        if (choice === 'purchase') {
          const store = await getStoreData();
          const sections = Object.keys(store.sections);
          
          if (sections.length > 0) {
            const menu = new StringSelectMenuBuilder()
              .setCustomId('purchase_section')
              .setPlaceholder('Select a section')
              .addOptions(sections.map(s => ({ label: s, value: s })));

            await i.editReply({ 
              content: 'Which section do you want to buy?', 
              components: [new ActionRowBuilder().addComponents(menu)],
              flags: MessageFlags.Ephemeral 
            });
          } else {
            await i.editReply({ 
              content: '✅ Ticket created! (No store sections configured yet, please wait for staff.)', 
              flags: MessageFlags.Ephemeral 
            });
          }
        } else {
          await i.editReply({ content: `✅ Ticket created: <#${ticketChannel.id}>`, flags: MessageFlags.Ephemeral });
        }

      } catch (e) { await i.editReply({ content: `❌ Error: ${e.message}` }); }
      return;
    }
  }

  if (i.isButton()) {
    // VERIFY
    if (i.customId === 'verify_accept_rules') {
      if (i.member.roles.cache.has(VERIFIED_ROLE_ID)) return i.reply({ content: '❌ You are already verified!', flags: MessageFlags.Ephemeral });
      try {
        await i.member.roles.add(VERIFIED_ROLE_ID);
        await i.reply({ content: '✅ You have accepted the rules and are now verified!', flags: MessageFlags.Ephemeral });
        
        await updateVerifyMessage();

        const verifiedRole = i.guild.roles.cache.get(VERIFIED_ROLE_ID);
        const currentCount = verifiedRole ? verifiedRole.members.size : 0;

        await sendLog('✅ User Verified', `<@${i.user.id}> accepted the rules.`, 0x00ff88, [
          { name: 'Total verified', value: `${currentCount}`, inline: true }
        ]);
      } catch (e) { await i.reply({ content: `❌ Error: ${e.message}`, flags: MessageFlags.Ephemeral }); }
      return;
    }

    // LEGIT APPROVE
    if (i.customId === 'legit_approve') {
      try {
        const votes = await getLegitVotes();
        const userId = i.user.id;
        votes.approve = votes.approve.filter(id => id !== userId);
        votes.reject = votes.reject.filter(id => id !== userId);
        votes.approve.push(userId);
        
        const confirmed = await getConfirmedRejects();
        const newConfirmed = confirmed.filter(id => id !== userId);
        if (newConfirmed.length !== confirmed.length) await saveConfirmedRejects(newConfirmed);
        
        await saveLegitVotes(votes);
        await setupLegit();

        await sendLog('🗳️ Legit Vote', `<@${i.user.id}> voted: **Legit (✅)**`, 0x5865f2, [
          { name: 'Total ✅', value: `${votes.approve.length}`, inline: true }
        ]);

        try {
          await i.user.send({ content: `✅ Your vote has been saved as **Legit** in Prestige Market.` });
        } catch (err) {}

        await i.reply({ content: '✅ Your vote has been saved as **Legit**.', flags: MessageFlags.Ephemeral });
      } catch (e) { await i.reply({ content: `❌ Error: ${e.message}`, flags: MessageFlags.Ephemeral }); }
      return;
    }

    // LEGIT REJECT (AUTO TICKET)
    if (i.customId === 'legit_reject') {
      try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const tickets = await getTickets();

        const existingNotLegit = Object.entries(tickets).find(
          ([_, t]) => t.userId === i.user.id && t.categorie === 'notlegit'
        );
        if (existingNotLegit) {
          return i.reply({
            content: `❌ You already have an open proof ticket: <#${existingNotLegit[0]}>. Upload your proof there.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        await i.deferReply({ flags: MessageFlags.Ephemeral });

        const cat = TICKET_CATEGORIES.notlegit;
        const channelName = `notlegit-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
        const ticketChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: NOT_LEGIT_TICKET_CATEGORY_ID,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] },
          ],
          topic: `Not-Legit proof from ${i.user.tag}`,
        });

        await ticketChannel.permissionOverwrites.edit(MAIN_TAG_ROLE_ID, {
          ViewChannel: true, SendMessages: true, ReadMessageHistory: true, ManageMessages: true
        }).catch(() => {});

        await addTicket(ticketChannel.id, i.user.id, 'notlegit');

        const notLegitStore = await getNotLegitTickets();
        notLegitStore[ticketChannel.id] = {
          userId: i.user.id,
          status: 'pending',
          createdAt: Date.now(),
        };
        await saveNotLegitTickets(notLegitStore);

        const promptEmbed = new EmbedBuilder()
          .setTitle('Upload proof')
          .setColor(0xff4444)
          .setThumbnail(LOGO)
          .setDescription(
            `Please upload your proof here (screenshots, video, files).\n\n` +
            `Staff will review it and click **Positive** or **False**.`
          )
          .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
          .setTimestamp();

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        );

        const reviewRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('notlegit_positive').setLabel('Positive').setEmoji('✅').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('notlegit_false').setLabel('False').setEmoji('❌').setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
          content: `<@${i.user.id}> <@&${MAIN_TAG_ROLE_ID}>`,
          embeds: [promptEmbed],
          components: [reviewRow, closeRow],
        });

        await i.editReply({ content: `✅ Ticket created: <#${ticketChannel.id}> — upload your proof there.` });

        try {
          await i.user.send({ content: `❌ Your vote has been saved as **Not Legit**. Please upload your proof in the ticket that was just created for you.` });
        } catch (err) {}

      } catch (e) {
        console.error('legit_reject error:', e);
        try { await i.editReply({ content: `❌ Error: ${e.message}` }); } catch (_) {}
      }
      return;
    }

    // NOT-LEGIT REVIEW (AUTO CLOSE)
    if (i.customId === 'notlegit_positive' || i.customId === 'notlegit_false') {
      if (!isStaff(i.member)) {
        return i.reply({ content: `❌ Only staff can review this.`, flags: MessageFlags.Ephemeral });
      }

      await i.deferReply({ flags: MessageFlags.Ephemeral });

      const nlt = await getNotLegitTickets();
      const entry = nlt[i.channelId];
      const tickets = await getTickets();
      const ticket = tickets[i.channelId];

      if (!entry || !ticket || ticket.categorie !== 'notlegit') {
        return i.editReply({ content: '❌ This is not an active Not-Legit proof ticket.' });
      }
      if (entry.status !== 'pending') {
        return i.editReply({ content: `❌ Already reviewed as **${entry.status}**.` });
      }

      try {
        const targetUserId = entry.userId;
        const votes = await getLegitVotes();
        const confirmed = await getConfirmedRejects();

        if (i.customId === 'notlegit_positive') {
          if (!votes.reject.includes(targetUserId)) votes.reject.push(targetUserId);
          if (!confirmed.includes(targetUserId)) confirmed.push(targetUserId);
          await saveLegitVotes(votes);
          await saveConfirmedRejects(confirmed);
          await setNotLegitStatus(i.channelId, 'positive');

          await setupLegit();

          await i.channel.send({ content: `✅ Reviewed as **Positive**. ❌ vote has been added. Ticket is closing...` });
          await sendLog('✅ Not-Legit Confirmed', `<@${targetUserId}> proof approved by <@${i.user.id}>.`, 0x00ff88);
          await i.editReply({ content: '✅ Reviewed as **Positive**. Ticket closing...' });
        } else {
          await setNotLegitStatus(i.channelId, 'false');
          await i.channel.send({ content: `❌ Reviewed as **False**. No vote added. Ticket is closing...` });
          await sendLog('❌ Not-Legit Rejected', `<@${targetUserId}> proof rejected by <@${i.user.id}>.`, 0xff4444);
          await i.editReply({ content: '❌ Reviewed as **False**. Ticket closing...' });
        }

        await closeTicket(i.channel, i.user.id);

      } catch (e) {
        console.error('notlegit review error:', e);
        try { await i.editReply({ content: `❌ Error: ${e.message}` }); } catch (_) {}
      }
      return;
    }

    // TICKET CLOSE
    if (i.customId === 'ticket_close') {
      const tickets = await getTickets();
      const ticket = tickets[i.channelId];
      if (!ticket) return i.reply({ content: '❌ No active ticket.', flags: MessageFlags.Ephemeral });
      if (ticket.userId !== i.user.id && !isStaff(i.member)) return i.reply({ content: '❌ You cannot close this ticket.', flags: MessageFlags.Ephemeral });
      await i.reply({ content: '🔒 Closing ticket...' });
      await closeTicket(i.channel, i.user.id);
      return;
    }
  }
});

// ===== EVENTS VOOR VERIFY UPDATE =====
client.on('guildMemberAdd', async (member) => {
  if (member.guild.id !== GUILD_ID) return;
  try {
    const embed = new EmbedBuilder()
      .setTitle('Welcome to Prestige Market!')
      .setColor(0x5865f2)
      .setThumbnail(LOGO)
      .setDescription(
        `Hey <@${member.id}>,\n\n` +
        `Welcome to the **Prestige Market** Discord server!\n\n` +
        `Please make sure to read the rules and accept them in the verify channel to get access.`
      )
      .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
      .setTimestamp();
      
    await member.send({ embeds: [embed] });
  } catch (e) {
    console.log(`Could not send welcome DM to ${member.user.tag} (DMs closed).`);
  }
  await updateVerifyMessage();
});

client.on('guildMemberRemove', async (member) => {
  if (member.guild.id !== GUILD_ID) return;
  await updateVerifyMessage();
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (newMember.guild.id !== GUILD_ID) return;
  
  const hadRole = oldMember.roles.cache.has(VERIFIED_ROLE_ID);
  const hasRole = newMember.roles.cache.has(VERIFIED_ROLE_ID);

  if (hadRole !== hasRole) {
    await updateVerifyMessage();
  }
});

client.once('ready', async () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
  startStatusInterval();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await setupVerify();
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await setupLegit();
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await setupTicketPanel();
});

client.login(TOKEN);

require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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

// ===== Settings =====
const LOGO = 'https://cdn.discordapp.com/attachments/1564064006837244015/1564414389166014604/EC6CB4B8-367B-42B8-9E92-EF824122CBD9.png?ex=6ae1d6af&is=6ae0852f&hm=ff0e31a6b2668956d70437b411170db595a49c0b21e84ea425e6c8cd689adff0&';
const FOOTER_TEXT = 'Prestige Market';

// Channels
const VERIFY_CHANNEL_ID = '1564632375336505344';
const LEGIT_CHANNEL_ID = '1564553823270342758';
const TICKET_PANEL_CHANNEL_ID = '1564415332737884233';
const LOG_CHANNEL_ID = '1555729409535774833';
const TICKET_TRANSCRIPT_CHANNEL_ID = '1564415332737884234';
const VOUCH_CHANNEL_ID = '1564555149865656401';
const STORE_PANEL_CHANNEL_ID = '1564761625104490607';

// Roles
const VERIFIED_ROLE_ID = '1564415134171013154';
const VOUCH_ROLE_ID = '1564635023787950090';
const MAIN_TAG_ROLE_ID = '1564638227204149258';
const STAFF_ROLE_IDS = [
  '1564419989002256516',
  '1564415131054772295',
  '1564415129955729418',
  MAIN_TAG_ROLE_ID
];

// Specifieke rollen voor payment/delivered commando's
const PAYMENT_ROLE_IDS = [
  '1564415129955729418',
  '1564415131054772295'
];

// Categories
const NOT_LEGIT_TICKET_CATEGORY_ID = '1564632244235014315';
const ARCHIVE_CATEGORY_ID = '1564636952676802700';

const TICKET_CATEGORIES = {
  support: { name: 'Support', prefix: 'support', categoryId: '1564627077880094801', emoji: '🎫', color: 0x3498db },
  purchase: { name: 'Purchase', prefix: 'purchase', categoryId: '1564627178384007249', emoji: '🛒', color: 0x00ff88 },
  bug: { name: 'Bug', prefix: 'bug', categoryId: '1564627295816122418', emoji: '⚠️', color: 0xff4444 },
  notlegit: { name: 'Not Legit Proof', prefix: 'notlegit', categoryId: NOT_LEGIT_TICKET_CATEGORY_ID, emoji: '❌', color: 0xff4444 },
};

const ALLOWED_MOVE_CATEGORIES = {
  '1564627077880094801': 'Support',
  '1564627178384007249': 'Purchase',
  '1564627295816122418': 'Bug',
  '1564632244235014315': 'Not Legit Proof',
  '1564636952676802700': 'Other/Archive'
};

const PAYMENT_METHODS = {
  ideal: 'iDeal',
  tikkie: 'Tikkie',
  paypal: 'PayPal',
  crypto: 'Crypto (LTC)',
  bank: 'Bank Transfer'
};

const pendingPurchases = new Map();

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
      storeData: { sections: {}, services: {}, products: {}, lastSection: null, lastService: null, lastProduct: null },
      storePanelMessageId: null,
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
    storeData: parsed.storeData || { sections: {}, services: {}, products: {}, lastSection: null, lastService: null, lastProduct: null },
    storePanelMessageId: parsed.storePanelMessageId || null,
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
async function addTicket(channelId, userId, categoryKey, extraData = {}) {
  const t = await getTickets();
  t[channelId] = { userId, categorie: categoryKey, gestart: Date.now(), extraUsers: [], ...extraData };
  await saveTickets(t);
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

async function getStoreData() { const d = await readGist(); return d.storeData; }
async function saveStoreData(s) { const d = await readGist(); d.storeData = s; await writeGist(d); }

async function getStorePanelMessageId() { const d = await readGist(); return d.storePanelMessageId; }
async function setStorePanelMessageId(id) { const d = await readGist(); d.storePanelMessageId = id; await writeGist(d); }

// ===== HELPERS =====
function isStaff(member) {
  return member && STAFF_ROLE_IDS.some(id => member.roles.cache.has(id));
}

function isPaymentStaff(member) {
  return member && PAYMENT_ROLE_IDS.some(id => member.roles.cache.has(id));
}

function formatPrice(priceStr) {
  if (!priceStr) return 'N/A';
  let clean = priceStr.toString().trim();
  if (clean.toLowerCase() === 'n/a' || clean === '') return 'N/A';
  const check = clean.replace(/€/g, '').trim();
  if (!clean.includes('€')) {
    clean = `€${clean}`;
  }
  return clean;
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

// ===== STATUS SYSTEM =====
let statusState = 0;
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

// ===== LEGIT SYSTEM =====
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

// ===== VERIFY SYSTEM =====
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

// ===== STORE MANAGEMENT SYSTEM =====
function buildStoreEmbed(store) {
  const embed = new EmbedBuilder()
    .setTitle('🛒 Store Management')
    .setColor(0x5865f2)
    .setThumbnail(LOGO)
    .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
    .setTimestamp();

  if (Object.keys(store.sections).length === 0) {
    embed.setDescription('*No sections configured yet.*\n\nUse the buttons below to add sections, services, and products.');
    return embed;
  }

  for (const [section, services] of Object.entries(store.sections)) {
    let sectionText = '';

    if (services.length === 0) {
      sectionText += `↳ *No services*\n`;
    } else {
      services.forEach((service) => {
        sectionText += `• **${service}**\n`;

        const products = store.services[service] || [];
        if (products.length === 0) {
          sectionText += `  ↳ *No products*\n`;
        } else {
          products.forEach((prod) => {
            sectionText += `  ↳ ${prod}\n`;

            const p = store.products[prod];
            const price = formatPrice(p?.price);
            const amount = p?.amount ? ` per ${p.amount}` : '';

            sectionText += `      ↳ 💰 ${price}${amount}\n`;
          });
        }
      });
    }

    if (sectionText.length > 1024) sectionText = sectionText.slice(0, 1000) + '\n... *(truncated)*';
    embed.addFields({ name: `🔹 ${section}`, value: sectionText || '*Empty*', inline: false });
  }

  return embed;
}

function buildStoreRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('store_add_section').setLabel('Add Section').setEmoji('➕').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('store_add_service').setLabel('Add Service').setEmoji('➕').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('store_add_product').setLabel('Add Product').setEmoji('➕').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('store_add_price').setLabel('Add Price').setEmoji('💰').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('store_remove').setLabel('Remove').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
  );
}

async function setupStorePanel() {
  try {
    const channel = await client.channels.fetch(STORE_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel) return console.error(`❌ Store panel channel (${STORE_PANEL_CHANNEL_ID}) not found.`);

    const fetched = await channel.messages.fetch({ limit: 50 });
    for (const msg of fetched.filter(m => m.author.id === client.user.id).values()) await msg.delete().catch(() => {});

    const store = await getStoreData();
    const embed = buildStoreEmbed(store);
    const row = buildStoreRow();

    const newMsg = await channel.send({ embeds: [embed], components: [row] });
    await setStorePanelMessageId(newMsg.id);
    console.log('✅ Store panel placed');
  } catch (e) { console.error('Store panel error:', e.message); }
}

async function updateStorePanel() {
  try {
    const channel = await client.channels.fetch(STORE_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const messageId = await getStorePanelMessageId();
    if (!messageId) return;

    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg) return;

    const store = await getStoreData();
    const embed = buildStoreEmbed(store);
    await msg.edit({ embeds: [embed], components: [buildStoreRow()] });
  } catch (e) { console.error('Failed to update store panel:', e.message); }
}

// ===== TICKET SYSTEM =====
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

    await sendLog('🔒 Ticket Closed', `<@${closerId}> closed the ticket from <@${ticket.userId}>.`, 0xff4444);
  } catch (e) { console.error('Transcript error:', e.message); }

  await removeTicket(channel.id);
  setTimeout(async () => { try { await channel.delete('Ticket closed'); } catch (e) {} }, 5000);
}

// ===== COMMANDS =====
const commands = [
  { name: 'vouch', description: 'Leave a vouch', options: [
      { name: 'product', description: 'What did you buy?', type: 3, required: true },
      { name: 'extra', description: 'Extra information', type: 3, required: true }
  ] },
  { name: 'payment', description: 'Send the payment details for this ticket', options: [
      { name: 'link', description: 'Payment link (iDeal/Tikkie/PayPal)', type: 3, required: false },
      { name: 'crypto_address', description: 'Crypto wallet address (LTC)', type: 3, required: false },
      { name: 'bank_account_number', description: 'Bank account number (IBAN)', type: 3, required: false },
      { name: 'account_name', description: 'Bank account holder name', type: 3, required: false }
  ] },
  { name: 'changepaymentmethod', description: 'Change the payment method for this ticket' },
  { name: 'delivered', description: 'Mark ticket as delivered and move to archive' },
  { name: 'add', description: 'Add a user to this ticket', options: [{ name: 'user', description: 'User', type: 6, required: true }] },
  { name: 'remove', description: 'Remove a user from this ticket', options: [{ name: 'user', description: 'User', type: 6, required: true }] },
  { name: 'close', description: 'Close this ticket' },
  { name: 'rename', description: 'Rename this ticket', options: [{ name: 'name', description: 'New name', type: 3, required: true }] },
  { name: 'move', description: 'Move this ticket to another category' },
  { name: 'ticketpanel', description: 'Place the ticket panel' },
  { name: 'refreshverify', description: 'Refresh the verify message' },
  { name: 'setupstore', description: 'Place the store management panel' },
  { name: 'removekruis', description: 'Remove ❌ votes from the legit poll', options: [{ name: 'amount', description: 'How many?', type: 4, required: true, min_value: 1 }] }
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

    // Payment Commands restricted to specific roles
    if (name === 'payment' || name === 'delivered' || name === 'changepaymentmethod') {
      if (!isPaymentStaff(i.member)) {
        return i.reply({ content: '❌ You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
      }
    }

    if (name === 'setupstore') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      await setupStorePanel();
      return i.editReply({ content: '✅ Store panel placed!' });
    }

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

        try { await i.user.send({ content: `✅ Your vouch has been successfully posted in <#${VOUCH_CHANNEL_ID}>!` }); } catch (err) {}

        return i.editReply({ content: `✅ Vouch posted!` });
      } catch (e) {
        console.error(e);
        return i.editReply({ content: `❌ Error: ${e.message}` });
      }
    }

    if (name === 'ticketpanel') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      await setupTicketPanel();
      return i.editReply({ content: '✅ Ticket panel placed!' });
    }

    if (name === 'refreshverify') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      await setupVerify();
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
        return i.editReply({ content: `✅ Removed **${toRemove}** crosses.` });
      } catch (e) { return i.editReply({ content: `❌ Error: ${e.message}` }); }
    }

    const tickets = await getTickets();
    const ticket = tickets[i.channelId];

    // === /PAYMENT ===
    if (name === 'payment') {
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });
      
      const method = ticket.payment || 'ideal';
      const methodName = PAYMENT_METHODS[method] || 'Unknown';

      const link = i.options.getString('link');
      const cryptoAddress = i.options.getString('crypto_address');
      const bankAccountNumber = i.options.getString('bank_account_number');
      const accountName = i.options.getString('account_name');

      const embed = new EmbedBuilder()
        .setTitle('💳 Payment Information')
        .setColor(0x2ecc71)
        .setDescription(`Please complete your payment using the details below.\n\n**Method:** ${methodName}`)
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .setTimestamp();

      if (method === 'bank') {
        if (!bankAccountNumber || !accountName) {
          return i.reply({ content: '❌ For Bank Transfer you must provide both `bank_account_number` and `account_name`.', flags: MessageFlags.Ephemeral });
        }
        embed.addFields(
          { name: 'Bank Account (IBAN)', value: `\`${bankAccountNumber}\``, inline: false },
          { name: 'Account Name', value: `\`${accountName}\``, inline: false }
        );
      } else if (method === 'crypto') {
        if (!cryptoAddress) {
          return i.reply({ content: '❌ For Crypto you must provide a `crypto_address`.', flags: MessageFlags.Ephemeral });
        }
        embed.addFields({ name: 'Crypto Address (LTC)', value: `\`${cryptoAddress}\``, inline: false });
      } else {
        if (!link) {
          return i.reply({ content: '❌ For this method you must provide a `link`.', flags: MessageFlags.Ephemeral });
        }
        embed.addFields({ name: 'Payment Link', value: link, inline: false });
      }

      return i.reply({ embeds: [embed] });
    }

    // === /CHANGEPAYMENTMETHOD ===
    if (name === 'changepaymentmethod') {
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });
      
      const menu = new StringSelectMenuBuilder()
        .setCustomId('change_payment_method')
        .setPlaceholder('Select a new payment method')
        .addOptions(Object.entries(PAYMENT_METHODS).map(([key, name]) => ({ label: name, value: key })));

      return i.reply({ content: 'Select the new payment method for this ticket:', components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
    }

    // === /DELIVERED ===
    if (name === 'delivered') {
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });
      
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      
      try {
        await i.channel.setParent(ARCHIVE_CATEGORY_ID, { lockPermissions: false });
        
        const t = await getTickets();
        if (t[i.channelId]) {
          t[i.channelId].categorie = 'archived';
          await saveTickets(t);
        }

        const targetUser = await client.users.fetch(ticket.userId).catch(() => null);
        if (targetUser) {
          const dmEmbed = new EmbedBuilder()
            .setTitle('Thank you for your purchase!')
            .setColor(0x00ff88)
            .setDescription(`Thank you for your purchase at **Prestige Market**! We hope you are satisfied with your order.\n\nPlease consider leaving a vouch in <#${VOUCH_CHANNEL_ID}> to support us.`)
            .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
            .setTimestamp();

          const vouchButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Leave a Vouch')
              .setStyle(ButtonStyle.Link)
              .setURL(`https://discord.com/channels/${GUILD_ID}/${VOUCH_CHANNEL_ID}`)
          );

          await targetUser.send({ embeds: [dmEmbed], components: [vouchButton] }).catch(() => console.log('Could not DM user'));
        }

        await i.channel.send({ content: `✅ Order delivered! Ticket moved to archive. Thank you for your purchase, <@${ticket.userId}>!` });
        await sendLog('📦 Order Delivered', `Order for <@${ticket.userId}> in <#${i.channelId}> marked as delivered by <@${i.user.id}>.`, 0x00ff88);
        return i.editReply({ content: '✅ Ticket archived and user notified.' });

      } catch (e) {
        return i.editReply({ content: `❌ Error: ${e.message}` });
      }
    }

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
        } else {
          await i.channel.permissionOverwrites.delete(targetUser.id);
          await i.channel.send({ content: `➖ <@${targetUser.id}> has been removed by <@${i.user.id}>.` });
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
        await i.channel.setName(newName);
        await i.editReply({ content: `✅ Renamed to ${newName}.` });
      } catch (e) { await i.editReply({ content: `❌ Error: ${e.message}` }); }
      return;
    }

    if (name === 'move') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('move_ticket_select')
        .setPlaceholder('Choose a category...')
        .addOptions(Object.entries(ALLOWED_MOVE_CATEGORIES).map(([id, name]) => ({
          label: name,
          value: id
        })));

      const row = new ActionRowBuilder().addComponents(selectMenu);

      return i.reply({ content: 'Choose the category to move this ticket to:', components: [row], flags: MessageFlags.Ephemeral });
    }
  }

  if (i.isModalSubmit()) {
    if (i.customId === 'modal_add_section') {
      const name = i.fields.getTextInputValue('section_name');
      const store = await getStoreData();
      if (!store.sections[name]) store.sections[name] = [];
      store.lastSection = name;
      await saveStoreData(store);
      await updateStorePanel();
      return i.reply({ content: `✅ Section **${name}** added.`, flags: MessageFlags.Ephemeral });
    }

    if (i.customId.startsWith('modal_add_service_')) {
      const section = i.customId.replace('modal_add_service_', '');
      const name = i.fields.getTextInputValue('service_name');
      const store = await getStoreData();
      if (!store.sections[section]) return i.reply({ content: '❌ Section not found.', flags: MessageFlags.Ephemeral });
      if (!store.sections[section].includes(name)) store.sections[section].push(name);
      if (!store.services[name]) store.services[name] = [];
      store.lastService = name;
      await saveStoreData(store);
      await updateStorePanel();
      return i.reply({ content: `✅ Service **${name}** added to **${section}**.`, flags: MessageFlags.Ephemeral });
    }

    if (i.customId.startsWith('modal_add_product_')) {
      const service = i.customId.replace('modal_add_product_', '');
      const name = i.fields.getTextInputValue('product_name');
      const store = await getStoreData();
      if (!store.services[service]) return i.reply({ content: '❌ Service not found.', flags: MessageFlags.Ephemeral });
      if (!store.services[service].includes(name)) store.services[service].push(name);
      if (!store.products[name]) store.products[name] = {};
      store.lastProduct = name;
      await saveStoreData(store);
      await updateStorePanel();
      return i.reply({ content: `✅ Product **${name}** added to **${service}**.`, flags: MessageFlags.Ephemeral });
    }

    if (i.customId.startsWith('modal_add_price_single_')) {
      const product = i.customId.replace('modal_add_price_single_', '');
      const price = i.fields.getTextInputValue('product_price');
      const store = await getStoreData();
      if (!store.products[product]) return i.reply({ content: '❌ Product not found.', flags: MessageFlags.Ephemeral });
      store.products[product].price = price;
      store.products[product].amount = '';
      await saveStoreData(store);
      await updateStorePanel();
      return i.reply({ content: `✅ Single price for **${product}** set to **${formatPrice(price)}**.`, flags: MessageFlags.Ephemeral });
    }

    if (i.customId.startsWith('modal_add_price_amount_')) {
      const product = i.customId.replace('modal_add_price_amount_', '');
      const price = i.fields.getTextInputValue('product_price');
      const amount = i.fields.getTextInputValue('product_amount');
      const store = await getStoreData();
      if (!store.products[product]) return i.reply({ content: '❌ Product not found.', flags: MessageFlags.Ephemeral });
      store.products[product].price = price;
      store.products[product].amount = amount;
      await saveStoreData(store);
      await updateStorePanel();
      return i.reply({ content: `✅ Price for **${product}** set to **${formatPrice(price)}** per **${amount}**.`, flags: MessageFlags.Ephemeral });
    }

    if (i.customId.startsWith('modal_purchase_amount_')) {
      const product = i.customId.replace('modal_purchase_amount_', '');
      const amountStr = i.fields.getTextInputValue('quantity');
      const quantity = parseInt(amountStr);

      if (isNaN(quantity) || quantity <= 0) {
        return i.reply({ content: '❌ Invalid quantity. Enter a number.', flags: MessageFlags.Ephemeral });
      }

      const store = await getStoreData();
      const prodData = store.products[product];
      if (!prodData || !prodData.price || prodData.price === 'N/A') {
        return i.reply({ content: '❌ Price not set for this product.', flags: MessageFlags.Ephemeral });
      }

      const cleanPrice = prodData.price.toString().replace('€', '').replace(',', '.').trim();
      const pricePer = parseFloat(cleanPrice);
      const amountPer = prodData.amount ? parseInt(prodData.amount) : 1;
      const total = ((pricePer / amountPer) * quantity).toFixed(2).replace('.', ',');
      const formattedTotal = `€${total}`;

      const data = pendingPurchases.get(i.user.id);
      if (!data) return i.reply({ content: '❌ Session expired.', flags: MessageFlags.Ephemeral });

      data.product = product;
      data.quantity = quantity;
      data.total = formattedTotal;

      const menu = new StringSelectMenuBuilder()
        .setCustomId('purchase_payment')
        .setPlaceholder('Select payment method')
        .addOptions(Object.entries(PAYMENT_METHODS).map(([key, name]) => ({ label: name, value: key })));

      return i.update({ content: `You want **${quantity}** of **${product}**. Total: **${formattedTotal}**.\n\nSelect your payment method:`, components: [new ActionRowBuilder().addComponents(menu)] });
    }
  }

  if (i.isStringSelectMenu()) {
    const userId = i.user.id;

    if (i.customId === 'ticket_category_select') {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const choice = i.values[0];
      const cat = TICKET_CATEGORIES[choice];
      if (!cat) return i.editReply({ content: '❌ Unknown category.' });

      if (choice === 'purchase') {
        const store = await getStoreData();
        const sections = Object.keys(store.sections);

        if (sections.length === 0) {
          return i.editReply({ content: '❌ No store sections configured yet. Please contact staff.' });
        }

        pendingPurchases.set(userId, { section: null, service: null, product: null, quantity: null, total: null, payment: null });

        const menu = new StringSelectMenuBuilder()
          .setCustomId('purchase_section')
          .setPlaceholder('Select a section')
          .addOptions(sections.map(s => ({ label: s, value: s })));

        return i.editReply({
          content: 'Which section do you want to buy?',
          components: [new ActionRowBuilder().addComponents(menu)],
        });
      }

      try {
        const guild = i.guild;
        const tickets = await getTickets();
        const existingTicket = Object.values(tickets).find(t => t.userId === userId);
        if (existingTicket) {
          return i.editReply({ content: `❌ You already have an open ticket.` });
        }

        const channelName = `${cat.prefix}-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const overwrites = [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
          { id: MAIN_TAG_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }
        ];

        const ticketChannel = await guild.channels.create({
          name: channelName, type: ChannelType.GuildText, parent: cat.categoryId, permissionOverwrites: overwrites, topic: `Ticket from ${i.user.tag}`,
        });

        await addTicket(ticketChannel.id, userId, choice);

        const embed = new EmbedBuilder().setTitle(cat.name).setColor(cat.color).setDescription(`<@${userId}> — Please describe your question below.`).setTimestamp();
        const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger));

        await ticketChannel.send({ content: `<@${userId}> <@&${MAIN_TAG_ROLE_ID}>`, embeds: [embed], components: [closeRow] });
        await i.editReply({ content: `✅ Ticket created: <#${ticketChannel.id}>` });
      } catch (e) { await i.editReply({ content: `❌ Error: ${e.message}` }); }
      return;
    }

    if (i.customId === 'change_payment_method') {
      if (!isPaymentStaff(i.member)) return i.reply({ content: '❌ You do not have permission.', flags: MessageFlags.Ephemeral });
      const newMethod = i.values[0];
      const tickets = await getTickets();
      if (!tickets[i.channelId]) return i.update({ content: '❌ Ticket not found.', components: [] });
      
      tickets[i.channelId].payment = newMethod;
      await saveTickets(tickets);

      return i.update({ content: `✅ Payment method changed to **${PAYMENT_METHODS[newMethod]}**.`, components: [] });
    }

    if (i.customId.startsWith('select_price_type_')) {
      const product = i.customId.replace('select_price_type_', '');
      const choice = i.values[0];

      if (choice === 'single') {
        const modal = new ModalBuilder().setCustomId(`modal_add_price_single_${product}`).setTitle('Add Single Price');
        const input = new TextInputBuilder().setCustomId('product_price').setLabel('Price (e.g. 5 or 0,75)').setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return i.showModal(modal);
      }

      const modal = new ModalBuilder().setCustomId(`modal_add_price_amount_${product}`).setTitle('Add Price Per Amount');
      const input1 = new TextInputBuilder().setCustomId('product_price').setLabel('Price (e.g. 5 or 0,75)').setStyle(TextInputStyle.Short).setRequired(true);
      const input2 = new TextInputBuilder().setCustomId('product_amount').setLabel('Amount (e.g. 1000)').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input1), new ActionRowBuilder().addComponents(input2));
      return i.showModal(modal);
    }

    if (i.customId === 'store_remove_type') {
      const type = i.values[0];
      const store = await getStoreData();

      if (type === 'section') {
        const sections = Object.keys(store.sections);
        if (sections.length === 0) return i.update({ content: '❌ No sections to remove.', components: [] });
        const menu = new StringSelectMenuBuilder()
          .setCustomId('store_remove_section')
          .setPlaceholder('Select a section to remove')
          .addOptions(sections.map(s => ({ label: s, value: s })));
        return i.update({ content: '🗑️ Which **section** do you want to remove?', components: [new ActionRowBuilder().addComponents(menu)] });
      }

      if (type === 'service') {
        const services = Object.keys(store.services);
        if (services.length === 0) return i.update({ content: '❌ No services to remove.', components: [] });
        const menu = new StringSelectMenuBuilder()
          .setCustomId('store_remove_service')
          .setPlaceholder('Select a service to remove')
          .addOptions(services.map(s => ({ label: s, value: s })));
        return i.update({ content: '🗑️ Which **service** do you want to remove?', components: [new ActionRowBuilder().addComponents(menu)] });
      }

      if (type === 'product') {
        const products = Object.keys(store.products);
        if (products.length === 0) return i.update({ content: '❌ No products to remove.', components: [] });
        const menu = new StringSelectMenuBuilder()
          .setCustomId('store_remove_product')
          .setPlaceholder('Select a product to remove')
          .addOptions(products.map(p => ({ label: p, value: p })));
        return i.update({ content: '🗑️ Which **product** do you want to remove?', components: [new ActionRowBuilder().addComponents(menu)] });
      }

      if (type === 'price') {
        const products = Object.entries(store.products).filter(([_, p]) => p.price || p.amount);
        if (products.length === 0) return i.update({ content: '❌ No prices to remove.', components: [] });
        const menu = new StringSelectMenuBuilder()
          .setCustomId('store_remove_price')
          .setPlaceholder('Select a product price to remove')
          .addOptions(products.map(([name, p]) => ({ label: `${name} (${formatPrice(p.price)})`, value: name })));
        return i.update({ content: '🗑️ Which **price** do you want to remove?', components: [new ActionRowBuilder().addComponents(menu)] });
      }
      return;
    }

    if (i.customId === 'store_remove_section') {
      const section = i.values[0];
      const store = await getStoreData();
      const services = store.sections[section] || [];

      for (const service of services) {
        const stillUsed = Object.entries(store.sections).some(([s, list]) => s !== section && list.includes(service));
        if (!stillUsed) {
          const prods = store.services[service] || [];
          for (const prod of prods) {
            const prodUsed = Object.values(store.services).some(list => list.includes(prod));
            if (!prodUsed) delete store.products[prod];
          }
          delete store.services[service];
        }
      }

      delete store.sections[section];
      await saveStoreData(store);
      await updateStorePanel();
      return i.update({ content: `✅ Section **${section}** removed.`, components: [] });
    }

    if (i.customId === 'store_remove_service') {
      const service = i.values[0];
      const store = await getStoreData();

      for (const [sec, list] of Object.entries(store.sections)) {
        store.sections[sec] = list.filter(s => s !== service);
      }

      const prods = store.services[service] || [];
      for (const prod of prods) {
        const prodUsed = Object.values(store.services).some(list => list.includes(prod));
        if (!prodUsed) delete store.products[prod];
      }

      delete store.services[service];
      await saveStoreData(store);
      await updateStorePanel();
      return i.update({ content: `✅ Service **${service}** removed.`, components: [] });
    }

    if (i.customId === 'store_remove_product') {
      const product = i.values[0];
      const store = await getStoreData();

      for (const [svc, list] of Object.entries(store.services)) {
        store.services[svc] = list.filter(p => p !== product);
      }

      delete store.products[product];
      await saveStoreData(store);
      await updateStorePanel();
      return i.update({ content: `✅ Product **${product}** removed.`, components: [] });
    }

    if (i.customId === 'store_remove_price') {
      const product = i.values[0];
      const store = await getStoreData();
      if (!store.products[product]) return i.update({ content: '❌ Product not found.', components: [] });
      store.products[product].price = 'N/A';
      store.products[product].amount = '';
      await saveStoreData(store);
      await updateStorePanel();
      return i.update({ content: `✅ Price for **${product}** removed.`, components: [] });
    }

    if (i.customId === 'select_section_for_service') {
      const section = i.values[0];
      const modal = new ModalBuilder().setCustomId(`modal_add_service_${section}`).setTitle('Add Service');
      const input = new TextInputBuilder().setCustomId('service_name').setLabel('Service Name').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return i.showModal(modal);
    }

    if (i.customId === 'select_service_for_product') {
      const service = i.values[0];
      const modal = new ModalBuilder().setCustomId(`modal_add_product_${service}`).setTitle('Add Product');
      const input = new TextInputBuilder().setCustomId('product_name').setLabel('Product Name').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return i.showModal(modal);
    }

    if (i.customId === 'select_product_for_price') {
      const product = i.values[0];
      const menu = new StringSelectMenuBuilder()
        .setCustomId(`select_price_type_${product}`)
        .setPlaceholder('Is this a single price?')
        .addOptions([
          { label: 'Yes — single price', value: 'single', emoji: '✅' },
          { label: 'No — price per amount', value: 'per_amount', emoji: '➗' },
        ]);
      return i.update({ content: `💰 Is **${product}** a single price or a price per amount?`, components: [new ActionRowBuilder().addComponents(menu)] });
    }

    if (i.customId === 'purchase_section') {
      const data = pendingPurchases.get(userId);
      if (!data) return i.update({ content: '❌ Session expired. Please try again.', components: [] });

      data.section = i.values[0];
      const store = await getStoreData();
      const services = store.sections[data.section] || [];

      if (services.length === 0) return i.update({ content: '❌ No services found for this section.', components: [] });

      const menu = new StringSelectMenuBuilder()
        .setCustomId('purchase_service')
        .setPlaceholder('What service do you want to buy?')
        .addOptions(services.map(s => ({ label: s, value: s })));

      return i.update({ content: 'What service do you want to buy?', components: [new ActionRowBuilder().addComponents(menu)] });
    }

    if (i.customId === 'purchase_service') {
      const data = pendingPurchases.get(userId);
      if (!data) return i.update({ content: '❌ Session expired. Please try again.', components: [] });

      data.service = i.values[0];
      const store = await getStoreData();
      const products = store.services[data.service] || [];

      if (products.length === 0) return i.update({ content: '❌ No products found for this service.', components: [] });

      const menu = new StringSelectMenuBuilder()
        .setCustomId('purchase_product')
        .setPlaceholder('Which product do you want to buy?')
        .addOptions(products.map(p => {
          const pd = store.products[p];
          const priceLabel = pd?.amount ? `${formatPrice(pd.price)} per ${pd.amount}` : formatPrice(pd?.price);
          return { label: `${p} (${priceLabel})`, value: p };
        }));

      return i.update({ content: 'Which product do you want to buy?', components: [new ActionRowBuilder().addComponents(menu)] });
    }

    if (i.customId === 'purchase_product') {
      const data = pendingPurchases.get(userId);
      if (!data) return i.update({ content: '❌ Session expired. Please try again.', components: [] });

      data.product = i.values[0];
      const store = await getStoreData();
      const prod = store.products[data.product];

      if (!prod || !prod.price || prod.price === 'N/A') {
        return i.update({ content: '❌ Price not set for this product.', components: [] });
      }

      const amountLabel = prod.amount ? ` per ${prod.amount}` : '';

      const modal = new ModalBuilder().setCustomId(`modal_purchase_amount_${data.product}`).setTitle('Enter Quantity');
      const input = new TextInputBuilder().setCustomId('quantity').setLabel(`How many? (Price: ${formatPrice(prod.price)}${amountLabel})`).setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return i.showModal(modal);
    }

    if (i.customId === 'purchase_payment') {
      const data = pendingPurchases.get(userId);
      if (!data) return i.update({ content: '❌ Session expired. Please try again.', components: [] });

      data.payment = i.values[0];
      const paymentName = PAYMENT_METHODS[data.payment];

      await i.update({ content: '✅ Creating your ticket...', components: [] });

      try {
        const guild = i.guild;
        const tickets = await getTickets();
        const existingTicket = Object.values(tickets).find(t => t.userId === userId);
        if (existingTicket) {
          pendingPurchases.delete(userId);
          return i.editReply({ content: `❌ You already have an open ticket.` });
        }

        const cat = TICKET_CATEGORIES.purchase;
        const channelName = `${cat.prefix}-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const overwrites = [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
          { id: MAIN_TAG_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }
        ];

        const ticketChannel = await guild.channels.create({
          name: channelName, type: ChannelType.GuildText, parent: cat.categoryId, permissionOverwrites: overwrites, topic: `Ticket from ${i.user.tag}`,
        });

        await addTicket(ticketChannel.id, userId, 'purchase', {
          section: data.section,
          service: data.service,
          product: data.product,
          quantity: data.quantity,
          total: data.total,
          payment: data.payment
        });

        const embed = new EmbedBuilder()
          .setTitle('🛒 Purchase Details')
          .setColor(0x00ff88)
          .setThumbnail(LOGO)
          .setDescription(`Thank you for your order, <@${userId}>! Please wait for a staff member to assist you.`)
          .addFields(
            { name: 'Section', value: data.section, inline: true },
            { name: 'Service', value: data.service, inline: true },
            { name: 'Product', value: data.product, inline: true },
            { name: 'Quantity', value: `${data.quantity}`, inline: true },
            { name: 'Total Price', value: data.total, inline: true },
            { name: 'Payment Method', value: paymentName, inline: true }
          )
          .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
          .setTimestamp();

        const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger));

        await ticketChannel.send({ content: `<@${userId}> <@&${MAIN_TAG_ROLE_ID}>`, embeds: [embed], components: [closeRow] });
        await sendLog('🛒 Purchase Started', `<@${userId}> started a purchase: **${data.quantity}** of **${data.product}** (${data.total}) via **${paymentName}**.`, 0x00ff88);

        pendingPurchases.delete(userId);
        await i.editReply({ content: `✅ Ticket created: <#${ticketChannel.id}>` });
      } catch (e) { await i.editReply({ content: `❌ Error: ${e.message}` }); }
      return;
    }

    if (i.customId === 'move_ticket_select') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });

      const tickets = await getTickets();
      const ticket = tickets[i.channelId];
      if (!ticket) return i.editReply({ content: '❌ This is not an active ticket.' });

      const newCategoryId = i.values[0];
      const newCategoryName = ALLOWED_MOVE_CATEGORIES[newCategoryId];

      try {
        await i.channel.setParent(newCategoryId, { lockPermissions: false });
        let newCatKey = null;
        for (const [key, cat] of Object.entries(TICKET_CATEGORIES)) {
          if (cat.categoryId === newCategoryId) { newCatKey = key; break; }
        }
        if (newCatKey) await updateTicketCategory(i.channelId, newCatKey);

        await i.channel.send({ content: `📁 Ticket has been moved to **${newCategoryName}** by <@${i.user.id}>.` });
        await i.editReply({ content: `✅ Moved to **${newCategoryName}**.` });
      } catch (e) { await i.editReply({ content: `❌ Error: ${e.message}` }); }
      return;
    }
  }

  if (i.isButton()) {
    if (i.customId === 'store_add_section') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      const modal = new ModalBuilder().setCustomId('modal_add_section').setTitle('Add Section');
      const input = new TextInputBuilder().setCustomId('section_name').setLabel('Section Name').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return i.showModal(modal);
    }

    if (i.customId === 'store_add_service') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      const store = await getStoreData();
      const sections = Object.keys(store.sections);
      if (sections.length === 0) return i.reply({ content: '❌ Add a section first.', flags: MessageFlags.Ephemeral });

      const menu = new StringSelectMenuBuilder()
        .setCustomId('select_section_for_service')
        .setPlaceholder('Select a section')
        .addOptions(sections.map(s => ({ label: s, value: s })));

      return i.reply({ content: 'Which section does this service belong to?', components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
    }

    if (i.customId === 'store_add_product') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      const store = await getStoreData();
      const services = Object.keys(store.services);
      if (services.length === 0) return i.reply({ content: '❌ Add a service first.', flags: MessageFlags.Ephemeral });

      const menu = new StringSelectMenuBuilder()
        .setCustomId('select_service_for_product')
        .setPlaceholder('Select a service')
        .addOptions(services.map(s => ({ label: s, value: s })));

      return i.reply({ content: 'Which service does this product belong to?', components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
    }

    if (i.customId === 'store_add_price') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      const store = await getStoreData();
      const products = Object.keys(store.products);
      if (products.length === 0) return i.reply({ content: '❌ Add a product first.', flags: MessageFlags.Ephemeral });

      const menu = new StringSelectMenuBuilder()
        .setCustomId('select_product_for_price')
        .setPlaceholder('Select a product')
        .addOptions(products.map(p => ({ label: p, value: p })));

      return i.reply({ content: 'Which product do you want to set a price for?', components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
    }

    if (i.customId === 'store_remove') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      const menu = new StringSelectMenuBuilder()
        .setCustomId('store_remove_type')
        .setPlaceholder('What do you want to remove?')
        .addOptions([
          { label: 'Section', value: 'section', emoji: '🔹' },
          { label: 'Service', value: 'service', emoji: '🔧' },
          { label: 'Product', value: 'product', emoji: '📦' },
          { label: 'Price', value: 'price', emoji: '💰' },
        ]);
      return i.reply({ content: '🗑️ What do you want to remove?', components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
    }

    if (i.customId === 'verify_accept_rules') {
      if (i.member.roles.cache.has(VERIFIED_ROLE_ID)) return i.reply({ content: '❌ You are already verified!', flags: MessageFlags.Ephemeral });
      try {
        await i.member.roles.add(VERIFIED_ROLE_ID);
        await i.reply({ content: '✅ You have accepted the rules and are now verified!', flags: MessageFlags.Ephemeral });
        await updateVerifyMessage();
      } catch (e) { await i.reply({ content: `❌ Error: ${e.message}`, flags: MessageFlags.Ephemeral }); }
      return;
    }

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
        try { await i.user.send({ content: `✅ Your vote has been saved as **Legit**.` }); } catch (err) {}
        await i.reply({ content: '✅ Your vote has been saved as **Legit**.', flags: MessageFlags.Ephemeral });
      } catch (e) { await i.reply({ content: `❌ Error: ${e.message}`, flags: MessageFlags.Ephemeral }); }
      return;
    }

    if (i.customId === 'legit_reject') {
      try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const tickets = await getTickets();
        const existingNotLegit = Object.entries(tickets).find(([_, t]) => t.userId === i.user.id && t.categorie === 'notlegit');
        if (existingNotLegit) return i.reply({ content: `❌ You already have an open proof ticket: <#${existingNotLegit[0]}>.`, flags: MessageFlags.Ephemeral });

        await i.deferReply({ flags: MessageFlags.Ephemeral });

        const cat = TICKET_CATEGORIES.notlegit;
        const channelName = `notlegit-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
        const ticketChannel = await guild.channels.create({
          name: channelName, type: ChannelType.GuildText, parent: NOT_LEGIT_TICKET_CATEGORY_ID,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] },
            { id: MAIN_TAG_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }
          ],
          topic: `Not-Legit proof from ${i.user.tag}`,
        });

        await addTicket(ticketChannel.id, i.user.id, 'notlegit');
        const notLegitStore = await getNotLegitTickets();
        notLegitStore[ticketChannel.id] = { userId: i.user.id, status: 'pending', createdAt: Date.now() };
        await saveNotLegitTickets(notLegitStore);

        const promptEmbed = new EmbedBuilder().setTitle('Upload proof').setColor(0xff4444).setThumbnail(LOGO)
          .setDescription(`Please upload your proof here (screenshots, video, files).\n\nStaff will review it and click **Positive** or **False**.`)
          .setFooter({ text: FOOTER_TEXT, iconURL: LOGO }).setTimestamp();

        const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger));
        const reviewRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('notlegit_positive').setLabel('Positive').setEmoji('✅').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('notlegit_false').setLabel('False').setEmoji('❌').setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ content: `<@${i.user.id}> <@&${MAIN_TAG_ROLE_ID}>`, embeds: [promptEmbed], components: [reviewRow, closeRow] });
        await i.editReply({ content: `✅ Ticket created: <#${ticketChannel.id}>` });
        try { await i.user.send({ content: `❌ Your vote has been saved as **Not Legit**. Please upload your proof in the ticket that was just created for you.` }); } catch (err) {}
      } catch (e) { console.error(e); try { await i.editReply({ content: `❌ Error: ${e.message}` }); } catch (_) {} }
      return;
    }

    if (i.customId === 'notlegit_positive' || i.customId === 'notlegit_false') {
      if (!isStaff(i.member)) return i.reply({ content: `❌ Only staff can review this.`, flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const nlt = await getNotLegitTickets();
      const entry = nlt[i.channelId];
      const tickets = await getTickets();
      const ticket = tickets[i.channelId];

      if (!entry || !ticket || ticket.categorie !== 'notlegit') return i.editReply({ content: '❌ This is not an active Not-Legit proof ticket.' });
      if (entry.status !== 'pending') return i.editReply({ content: `❌ Already reviewed as **${entry.status}**.` });

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
          await i.editReply({ content: '✅ Reviewed as **Positive**. Ticket closing...' });
        } else {
          await setNotLegitStatus(i.channelId, 'false');
          await i.channel.send({ content: `❌ Reviewed as **False**. No vote added. Ticket is closing...` });
          await i.editReply({ content: '❌ Reviewed as **False**. Ticket closing...' });
        }
        await closeTicket(i.channel, i.user.id);
      } catch (e) { console.error(e); try { await i.editReply({ content: `❌ Error: ${e.message}` }); } catch (_) {} }
      return;
    }

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

// ===== EVENTS =====
client.on('guildMemberAdd', async (member) => {
  if (member.guild.id !== GUILD_ID) return;
  try {
    const embed = new EmbedBuilder().setTitle('Welcome to Prestige Market!').setColor(0x5865f2).setThumbnail(LOGO)
      .setDescription(`Hey <@${member.id}>,\n\nWelcome to the **Prestige Market** Discord server!\n\nPlease make sure to read the rules and accept them in the verify channel to get access.`)
      .setFooter({ text: FOOTER_TEXT, iconURL: LOGO }).setTimestamp();
    await member.send({ embeds: [embed] });
  } catch (e) {}
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
  if (hadRole !== hasRole) await updateVerifyMessage();
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

  await new Promise(resolve => setTimeout(resolve, 3000));
  await setupStorePanel();
});

client.login(TOKEN);

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
const RECENT_PAYMENTS_CHANNEL_ID = '1564761373026681205';
const EARNINGS_PANEL_CHANNEL_ID = '1564761453402263572';
const PAYMENT_METHODS_CHANNEL_ID = '1564552449585586186';
const GIVEAWAY_CHANNEL_ID = '1564415334658744443';
const CUSTOMER_OVERVIEW_CHANNEL_ID = '1565133390431395840';
const INVITE_REWARDS_CHANNEL_ID = '1564551605095768064';
const INVITE_OVERVIEW_CHANNEL_ID = '1565359774982348890';
const BOOST_CHANNEL_ID = '1564415311401320518';
const WELCOME_CHANNEL_ID = '1565405396527489134';
const TICKET_STATS_CHANNEL_ID = '1565405683678191686';

// Earnings Users
const EARNER_1_ID = '710623438657683486';
const EARNER_2_ID = '755111368839135367';
const EARNER_3_ID = '1033753872927293520';
const EARNER_4_ID = '951548670493462578';
const PAYMENT_COMMAND_ALLOWED_IDS = [EARNER_1_ID, EARNER_2_ID, EARNER_3_ID, EARNER_4_ID];

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
const CLEAR_PRODUCTS_ROLE_ID = '1564415129955729418';
const EDIT_CUSTOMER_ROLE_ID = '1564415129955729418';

// Spent Roles
const SPENT_ROLES = [
  { amount: 5, roleId: '1565355736085692516' },
  { amount: 10, roleId: '1565355972128546816' },
  { amount: 25, roleId: '1565356058766090311' },
  { amount: 50, roleId: '1565356139535671306' },
  { amount: 100, roleId: '1565356226512945172' },
  { amount: 250, roleId: '1565356326136188988' },
];

// Categories
const NOT_LEGIT_TICKET_CATEGORY_ID = '1564632244235014315';
const ARCHIVE_CATEGORY_ID = '1564636952676802700';
const PARTNER_CATEGORY_ID = '1565123254887252229';

const TICKET_CATEGORIES = {
  support: { name: 'Support', prefix: 'support', categoryId: '1564627077880094801', emoji: '🎫', color: 0x3498db },
  purchase: { name: 'Purchase', prefix: 'purchase', categoryId: '1564627178384007249', emoji: '🛒', color: 0x00ff88 },
  bug: { name: 'Bug', prefix: 'bug', categoryId: '1564627295816122418', emoji: '⚠️', color: 0xff4444 },
  partner: { name: 'Partner', prefix: 'partner', categoryId: PARTNER_CATEGORY_ID, emoji: '🤝', color: 0x9b59b6 },
  notlegit: { name: 'Not Legit Proof', prefix: 'notlegit', categoryId: NOT_LEGIT_TICKET_CATEGORY_ID, emoji: '❌', color: 0xff4444 },
};

const ALLOWED_MOVE_CATEGORIES = {
  '1564627077880094801': 'Support',
  '1564627178384007249': 'Purchase',
  '1564627295816122418': 'Bug',
  '1564632244235014315': 'Not Legit Proof',
  '1564636952676802700': 'Other/Archive',
  '1565123254887252229': 'Partner'
};

const PAYMENT_METHODS = {
  ideal: 'iDeal',
  tikkie: 'Tikkie',
  paypal: 'PayPal',
  crypto: 'Crypto (LTC)',
  bank: 'Bank Transfer'
};

// Payment method emojis (zelfde als payment methods kanaal)
const PAYMENT_EMOJIS = {
  ideal: '<:ideal:1564724669129560174>',
  tikkie: '💸',
  paypal: '<:paypal:1564726369219510354>',
  crypto: '<:ltc:1564724536979759124>',
  bank: '<:bank:1564724257164886078>',
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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildInvites],
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
      storeData: { sections: {}, services: {}, products: {}, lastSection: null, lastService: null, lastProduct: null, serviceChannels: {}, serviceMessages: {} },
      storePanelMessageId: null,
      earnings: { [EARNER_1_ID]: 0, [EARNER_2_ID]: 0, [EARNER_3_ID]: 0, [EARNER_4_ID]: 0 },
      earningsMessageId: null,
      paymentMethodsMessageId: null,
      giveaways: {},
      giveawayEntries: {},
      customerSpent: {},
      customerTickets: {},
      customerHistory: {},
      customerOverviewMessageId: null,
      userInvites: {},
      userRewards: {},
      inviteRewardsMessageId: null,
      inviteOverviewMessageId: null,
      ticketStats: { total: 0, closed: 0 },
      ticketStatsMessageId: null,
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
    storeData: parsed.storeData || { sections: {}, services: {}, products: {}, lastSection: null, lastService: null, lastProduct: null, serviceChannels: {}, serviceMessages: {} },
    storePanelMessageId: parsed.storePanelMessageId || null,
    earnings: parsed.earnings || { [EARNER_1_ID]: 0, [EARNER_2_ID]: 0, [EARNER_3_ID]: 0, [EARNER_4_ID]: 0 },
    earningsMessageId: parsed.earningsMessageId || null,
    paymentMethodsMessageId: parsed.paymentMethodsMessageId || null,
    giveaways: parsed.giveaways || {},
    giveawayEntries: parsed.giveawayEntries || {},
    customerSpent: parsed.customerSpent || {},
    customerTickets: parsed.customerTickets || {},
    customerHistory: parsed.customerHistory || {},
    customerOverviewMessageId: parsed.customerOverviewMessageId || null,
    userInvites: parsed.userInvites || {},
    userRewards: parsed.userRewards || {},
    inviteRewardsMessageId: parsed.inviteRewardsMessageId || null,
    inviteOverviewMessageId: parsed.inviteOverviewMessageId || null,
    ticketStats: parsed.ticketStats || { total: 0, closed: 0 },
    ticketStatsMessageId: parsed.ticketStatsMessageId || null,
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

async function getEarnings() { const d = await readGist(); return d.earnings; }
async function saveEarnings(e) { const d = await readGist(); d.earnings = e; await writeGist(d); }
async function getEarningsMessageId() { const d = await readGist(); return d.earningsMessageId; }
async function setEarningsMessageId(id) { const d = await readGist(); d.earningsMessageId = id; await writeGist(d); }

async function getPaymentMethodsMessageId() { const d = await readGist(); return d.paymentMethodsMessageId; }
async function setPaymentMethodsMessageId(id) { const d = await readGist(); d.paymentMethodsMessageId = id; await writeGist(d); }

async function getGiveaways() { const d = await readGist(); return d.giveaways || {}; }
async function saveGiveaways(g) { const d = await readGist(); d.giveaways = g; await writeGist(d); }
async function getGiveawayEntries() { const d = await readGist(); return d.giveawayEntries || {}; }
async function saveGiveawayEntries(e) { const d = await readGist(); d.giveawayEntries = e; await writeGist(d); }

async function getCustomerSpent() { const d = await readGist(); return d.customerSpent || {}; }
async function saveCustomerSpent(s) { const d = await readGist(); d.customerSpent = s; await writeGist(d); }
async function getCustomerTickets() { const d = await readGist(); return d.customerTickets || {}; }
async function saveCustomerTickets(t) { const d = await readGist(); d.customerTickets = t; await writeGist(d); }
async function getCustomerHistory() { const d = await readGist(); return d.customerHistory || {}; }
async function saveCustomerHistory(h) { const d = await readGist(); d.customerHistory = h; await writeGist(d); }
async function getCustomerOverviewMessageId() { const d = await readGist(); return d.customerOverviewMessageId; }
async function setCustomerOverviewMessageId(id) { const d = await readGist(); d.customerOverviewMessageId = id; await writeGist(d); }

async function getUserInvites() { const d = await readGist(); return d.userInvites || {}; }
async function saveUserInvites(inv) { const d = await readGist(); d.userInvites = inv; await writeGist(d); }
async function getUserRewards() { const d = await readGist(); return d.userRewards || {}; }
async function saveUserRewards(r) { const d = await readGist(); d.userRewards = r; await writeGist(d); }
async function getInviteRewardsMessageId() { const d = await readGist(); return d.inviteRewardsMessageId; }
async function setInviteRewardsMessageId(id) { const d = await readGist(); d.inviteRewardsMessageId = id; await writeGist(d); }
async function getInviteOverviewMessageId() { const d = await readGist(); return d.inviteOverviewMessageId; }
async function setInviteOverviewMessageId(id) { const d = await readGist(); d.inviteOverviewMessageId = id; await writeGist(d); }

async function getTicketStats() { const d = await readGist(); return d.ticketStats || { total: 0, closed: 0 }; }
async function saveTicketStats(s) { const d = await readGist(); d.ticketStats = s; await writeGist(d); }
async function getTicketStatsMessageId() { const d = await readGist(); return d.ticketStatsMessageId; }
async function setTicketStatsMessageId(id) { const d = await readGist(); d.ticketStatsMessageId = id; await writeGist(d); }

// ===== HELPERS =====
function isStaff(member) {
  return member && STAFF_ROLE_IDS.some(id => member.roles.cache.has(id));
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

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  return parseFloat(priceStr.toString().replace('€', '').replace(',', '.').trim()) || 0;
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

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return amount * multipliers[unit];
}

// ===== TICKET STATS =====
function buildTicketStatsEmbed(stats, openCount) {
  return new EmbedBuilder()
    .setTitle('📊 Ticket Statistics')
    .setColor(0x5865f2)
    .setThumbnail(LOGO)
    .addFields(
      { name: '🟢 Open Tickets', value: `**${openCount}**`, inline: true },
      { name: '📁 Total Tickets', value: `**${stats.total}**`, inline: true },
      { name: '🔒 Closed Tickets', value: `**${stats.closed}**`, inline: true }
    )
    .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
    .setTimestamp();
}

async function updateTicketStats() {
  try {
    const channel = await client.channels.fetch(TICKET_STATS_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const tickets = await getTickets();
    const openCount = Object.keys(tickets).length;
    const stats = await getTicketStats();
    const embed = buildTicketStatsEmbed(stats, openCount);

    const messageId = await getTicketStatsMessageId();
    if (messageId) {
      const msg = await channel.messages.fetch(messageId).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [embed] });
        return;
      }
    }

    const newMsg = await channel.send({ embeds: [embed] });
    await setTicketStatsMessageId(newMsg.id);
    console.log('✅ Ticket Stats placed');
  } catch (e) { console.error('Failed to update ticket stats:', e.message); }
}

// ===== CUSTOMER OVERVIEW =====
function buildCustomerOverviewEmbed(spent) {
  const entries = Object.entries(spent).filter(([_, amount]) => amount > 0).sort((a, b) => b[1] - a[1]);
  
  const embed = new EmbedBuilder()
    .setTitle('👥 Customer Overview')
    .setColor(0x00ff88)
    .setThumbnail(LOGO)
    .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
    .setTimestamp();

  if (entries.length === 0) {
    embed.setDescription('*No customers yet.*');
    return embed;
  }

  let desc = '';
  for (const [userId, amount] of entries.slice(0, 50)) {
    desc += `<@${userId}>: **€${amount.toFixed(2)}**\n`;
  }

  embed.setDescription(desc);
  return embed;
}

async function updateCustomerOverview() {
  try {
    const channel = await client.channels.fetch(CUSTOMER_OVERVIEW_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const messageId = await getCustomerOverviewMessageId();
    const spent = await getCustomerSpent();
    const embed = buildCustomerOverviewEmbed(spent);

    if (messageId) {
      const msg = await channel.messages.fetch(messageId).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [embed] });
        return;
      }
    }

    const newMsg = await channel.send({ embeds: [embed] });
    await setCustomerOverviewMessageId(newMsg.id);
    console.log('✅ Customer Overview placed');
  } catch (e) { console.error('Failed to update customer overview:', e.message); }
}

// ===== INVITE REWARDS SYSTEM =====
function buildInviteRewardsEmbed() {
  return new EmbedBuilder()
    .setTitle('🎁 Invite Rewards')
    .setColor(0xffaa00)
    .setThumbnail(LOGO)
    .setDescription(
      `Invite your friends to **Prestige Market** and earn exclusive rewards!\n\n` +
      `**How it works:**\n` +
      `> Click **Get My Invite Link** to receive your personal link.\n` +
      `> Share it with your friends.\n` +
      `> Check your invites via **Check My Invites**.\n\n` +
      `**Rewards:**\n` +
      `> 🔥 **5 Valid Invites** → **1x 5% Discount**\n` +
      `> 🔥 **10 Valid Invites** → **1x 10% Discount**\n\n` +
      `**How to claim:**\n` +
      `> Open a ticket with a staff member and mention your reward.\n\n` +
      `-# We do not accept fake invites or bots. Invites from users who were previously in the server do not count.`
    )
    .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
    .setTimestamp();
}

function buildInviteRewardsButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('invite_get_link').setLabel('Get My Invite Link').setEmoji('🔗').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('invite_check').setLabel('Check My Invites').setEmoji('📊').setStyle(ButtonStyle.Secondary)
  );
}

async function setupInviteRewards() {
  try {
    const channel = await client.channels.fetch(INVITE_REWARDS_CHANNEL_ID).catch(() => null);
    if (!channel) return console.error(`❌ Invite rewards channel (${INVITE_REWARDS_CHANNEL_ID}) not found.`);

    const fetched = await channel.messages.fetch({ limit: 50 });
    for (const m of fetched.filter(m => m.author.id === client.user.id).values()) await m.delete().catch(() => {});

    const embed = buildInviteRewardsEmbed();
    const buttons = buildInviteRewardsButtons();

    const newMsg = await channel.send({ embeds: [embed], components: [buttons] });
    await setInviteRewardsMessageId(newMsg.id);
    console.log('✅ Invite rewards placed');
  } catch (e) { console.error('Invite rewards error:', e.message); }
}

function buildInviteOverviewEmbed(invites) {
  const entries = Object.entries(invites).filter(([_, d]) => d.valid > 0).sort((a, b) => b[1].valid - a[1].valid).slice(0, 20);
  
  const embed = new EmbedBuilder()
    .setTitle('🏆 Top Inviters')
    .setColor(0xffaa00)
    .setThumbnail(LOGO)
    .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
    .setTimestamp();

  if (entries.length === 0) {
    embed.setDescription('*No invites yet.*');
    return embed;
  }

  let desc = '';
  for (const [userId, data] of entries) {
    const availableTens = Math.floor(data.valid / 10);
    const availableFives = Math.floor((data.valid % 10) / 5);
    const rewardText = `${availableTens > 0 ? `${availableTens}x 10%` : ''} ${availableFives > 0 ? `${availableFives}x 5%` : ''}`.trim() || '0';
    desc += `<@${userId}>: **${data.valid}** valid invites — **${rewardText}** available\n`;
  }

  embed.setDescription(desc);
  return embed;
}

async function updateInviteOverview() {
  try {
    const channel = await client.channels.fetch(INVITE_OVERVIEW_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const messageId = await getInviteOverviewMessageId();
    const invites = await getUserInvites();
    const embed = buildInviteOverviewEmbed(invites);

    if (messageId) {
      const msg = await channel.messages.fetch(messageId).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [embed] });
        return;
      }
    }

    const newMsg = await channel.send({ embeds: [embed] });
    await setInviteOverviewMessageId(newMsg.id);
    console.log('✅ Invite Overview placed');
  } catch (e) { console.error('Failed to update invite overview:', e.message); }
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

// ===== EARNINGS SYSTEM =====
function buildEarningsEmbed(earnings) {
  const earned1 = earnings[EARNER_1_ID] || 0;
  const earned2 = earnings[EARNER_2_ID] || 0;
  const earned3 = earnings[EARNER_3_ID] || 0;
  const earned4 = earnings[EARNER_4_ID] || 0;

  return new EmbedBuilder()
    .setTitle('💰 Total Earned (Profit)')
    .setColor(0x00ff88)
    .setDescription(
      `**Profit overview for our sellers:**\n\n` +
      `<@${EARNER_1_ID}>: **€${earned1.toFixed(2)}**\n` +
      `<@${EARNER_2_ID}>: **€${earned2.toFixed(2)}**\n` +
      `<@${EARNER_3_ID}>: **€${earned3.toFixed(2)}**\n` +
      `<@${EARNER_4_ID}>: **€${earned4.toFixed(2)}**`
    )
    .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
    .setThumbnail(LOGO)
    .setTimestamp();
}

async function updateEarningsPanel() {
  try {
    const channel = await client.channels.fetch(EARNINGS_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const messageId = await getEarningsMessageId();
    if (!messageId) {
      const earnings = await getEarnings();
      const embed = buildEarningsEmbed(earnings);
      const newMsg = await channel.send({ embeds: [embed] });
      await setEarningsMessageId(newMsg.id);
      console.log('✅ Earnings panel created');
      return;
    }

    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg) {
       const earnings = await getEarnings();
       const embed = buildEarningsEmbed(earnings);
       const newMsg = await channel.send({ embeds: [embed] });
       await setEarningsMessageId(newMsg.id);
       return;
    }

    const earnings = await getEarnings();
    const embed = buildEarningsEmbed(earnings);
    await msg.edit({ embeds: [embed] });
  } catch (e) { console.error('Failed to update earnings panel:', e.message); }
}

// ===== PAYMENT METHODS EMBED =====
async function setupPaymentMethods() {
  try {
    const channel = await client.channels.fetch(PAYMENT_METHODS_CHANNEL_ID).catch(() => null);
    if (!channel) return console.error(`❌ Payment methods channel (${PAYMENT_METHODS_CHANNEL_ID}) not found.`);

    const embed = new EmbedBuilder()
      .setTitle('Payment Methods')
      .setDescription(
        `<:arrowrightalt:1564725822772879473>   <:ideal:1564724669129560174>  **(Ideal)**\n` +
        `<:arrowrightalt:1564725822772879473>  <:paypal:1564726369219510354> **(paypal)**\n` +
        `<:arrowrightalt:1564725822772879473>  <:ltc:1564724536979759124>  **(Cryptocurrencies, LTC) = 10% Off!**\n` +
        `<:arrowrightalt:1564725822772879473>  <:bank:1564724257164886078>  **(Bank transfer)**\n\n` +
        `-# Please share your suggestions for new payment methods we can add.`
      )
      .setColor(0x2b2b2b);

    const messageId = await getPaymentMethodsMessageId();
    if (messageId) {
      const msg = await channel.messages.fetch(messageId).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [embed] });
        console.log('✅ Payment methods updated');
        return;
      }
    }

    const newMsg = await channel.send({ embeds: [embed] });
    await setPaymentMethodsMessageId(newMsg.id);
    console.log('✅ Payment methods placed');
  } catch (e) { console.error('Payment methods error:', e.message); }
}

// ===== GIVEAWAY SYSTEM =====
async function runGiveaway(channel, winners, product, durationMs, blacklistRoles) {
  try {
    const endsAt = Date.now() + durationMs;
    const embed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY 🎉')
      .setColor(0xffaa00)
      .setDescription(
        `**Prize:** ${product}\n` +
        `**Winners:** ${winners}\n` +
        `**Ends:** <t:${Math.floor(endsAt / 1000)}:R>\n\n` +
        `Click the button below to join!`
      )
      .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
      .setTimestamp();

    const joinBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('giveaway_join').setLabel('Join Giveaway').setEmoji('🎉').setStyle(ButtonStyle.Success)
    );

    const msg = await channel.send({ embeds: [embed], components: [joinBtn] });

    const giveaways = await getGiveaways();
    giveaways[msg.id] = {
      product,
      winners,
      channelId: channel.id,
      endsAt,
      blacklistRoles: blacklistRoles || [],
      active: true,
      participants: [],
    };
    await saveGiveaways(giveaways);

    setTimeout(async () => {
      const g = await getGiveaways();
      const giveaway = g[msg.id];
      if (!giveaway || !giveaway.active) return;

      const entries = giveaway.participants || [];
      const filtered = entries.filter(id => {
        return !giveaway.blacklistRoles.some(roleId => {
          const member = channel.guild.members.cache.get(id);
          return member && member.roles.cache.has(roleId);
        });
      });

      if (filtered.length === 0) {
        await channel.send({ content: `❌ No valid participants for the giveaway of **${giveaway.product}**.` });
        giveaway.active = false;
        await saveGiveaways(g);
        return;
      }

      const shuffled = filtered.sort(() => Math.random() - 0.5);
      const selectedWinners = shuffled.slice(0, giveaway.winners);

      giveaway.active = false;
      giveaway.finished = true;
      giveaway.winnersList = selectedWinners;
      await saveGiveaways(g);

      const winnerMentions = selectedWinners.map(id => `<@${id}>`).join(', ');

      const resultEmbed = new EmbedBuilder()
        .setTitle('🎉 Giveaway Ended 🎉')
        .setColor(0x00ff88)
        .setDescription(
          `**Prize:** ${giveaway.product}\n` +
          `**Winners:** ${winnerMentions}\n\n` +
          `Congratulations!`
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .setTimestamp();

      const rerollBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`giveaway_reroll_${msg.id}`).setLabel('Reroll').setEmoji('🔄').setStyle(ButtonStyle.Secondary)
      );

      await channel.send({ content: `🎉 Congratulations ${winnerMentions}! You won **${giveaway.product}**!`, embeds: [resultEmbed], components: [rerollBtn] });
    }, durationMs);
  } catch (e) { console.error('Giveaway error:', e.message); }
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
            const buyCost = p?.buyCost ? ` (Buy: €${p.buyCost})` : '';

            sectionText += `      ↳ 💰 ${price}${amount}${buyCost}\n\n`;
          });
        }
      });
    }

    if (sectionText.length > 1024) sectionText = sectionText.slice(0, 1000) + '\n... *(truncated)*';
    embed.addFields({ name: `🔹 ${section}`, value: sectionText || '*Empty*', inline: false });
  }

  return embed;
}

function buildStoreRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('store_add_section').setLabel('Add Section').setEmoji('➕').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('store_add_service').setLabel('Add Service').setEmoji('➕').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('store_add_product').setLabel('Add Product').setEmoji('➕').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('store_add_price').setLabel('Add Price').setEmoji('💰').setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('store_edit').setLabel('Edit').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('store_remove').setLabel('Remove').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
  );

  return [row1, row2];
}

async function setupStorePanel() {
  try {
    const channel = await client.channels.fetch(STORE_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel) return console.error(`❌ Store panel channel (${STORE_PANEL_CHANNEL_ID}) not found.`);

    const fetched = await channel.messages.fetch({ limit: 50 });
    for (const msg of fetched.filter(m => m.author.id === client.user.id).values()) await msg.delete().catch(() => {});

    const store = await getStoreData();
    const embed = buildStoreEmbed(store);
    const rows = buildStoreRows();

    const newMsg = await channel.send({ embeds: [embed], components: rows });
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
    await msg.edit({ embeds: [embed], components: buildStoreRows() });
  } catch (e) { console.error('Failed to update store panel:', e.message); }
}

// ===== SERVICE SHOP EMBED =====
async function updateServiceShop(serviceName) {
  try {
    const store = await getStoreData();
    const channelId = store.serviceChannels?.[serviceName];
    if (!channelId) return;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const products = store.services[serviceName] || [];
    const productLines = products.length > 0 ? products.map(p => {
      const pd = store.products[p];
      let priceLabel = '';
      if (pd && pd.price && pd.price !== 'N/A') {
        const amount = pd.amount ? ` per ${pd.amount}` : '';
        priceLabel = ` - **${formatPrice(pd.price)}**${amount}`;
      }
      return `> ${p}${priceLabel}`;
    }).join('\n') : '*No products available yet.*';

    const embed = new EmbedBuilder()
      .setTitle(`Prestige ${serviceName} Shop`)
      .setColor(0x2b2b2b)
      .setDescription(
        `${productLines}\n\n` +
        `**HOW TO ORDER**\n` +
        `- Open a ticket\n` +
        `- Choose your preferred service\n` +
        `- Ask for prices and availability\n` +
        `- Complete your purchase\n\n` +
        `Prestige\n` +
        `*Your entertainment, your choice.*`
      )
      .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
      .setTimestamp();

    const existingMsgId = store.serviceMessages?.[serviceName];
    if (existingMsgId) {
      const msg = await channel.messages.fetch(existingMsgId).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [embed] });
        return;
      }
    }

    const newMsg = await channel.send({ embeds: [embed] });
    if (!store.serviceMessages) store.serviceMessages = {};
    store.serviceMessages[serviceName] = newMsg.id;
    await saveStoreData(store);
  } catch (e) { console.error('Failed to update service shop:', e.message); }
}

// ===== TICKET SYSTEM =====
function buildTicketPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🎫 Prestige Support')
    .setColor(0x5865f2)
    .setDescription('Select a category below to open a ticket.\n\n> 🎫 **Support**\n> 🛒 **Purchase**\n> ⚠️ **Bug**\n> 🤝 **Partner**')
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
        { label: 'Partner', value: 'partner', emoji: '🤝' },
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

  const stats = await getTicketStats();
  stats.closed += 1;
  await saveTicketStats(stats);
  await updateTicketStats();

  setTimeout(async () => { try { await channel.delete('Ticket closed'); } catch (e) {} }, 5000);
}

// ===== COMMANDS =====
const commands = [
  { name: 'vouch', description: 'Leave a vouch', options: [
      { name: 'product', description: 'What did you buy?', type: 3, required: true },
      { name: 'extra', description: 'Extra information', type: 3, required: true }
  ] },
  { name: 'payment', description: 'Send the payment details for this ticket', options: [
      { name: 'link_or_crypto', description: 'Payment link (iDeal/Tikkie) or Crypto Address (LTC)', type: 3, required: false },
      { name: 'bank_account_number', description: 'Bank account number (IBAN) for Bank Transfer', type: 3, required: false },
      { name: 'account_name', description: 'Bank account holder name for Bank Transfer', type: 3, required: false }
  ] },
  { name: 'changepaymentmethod', description: 'Change the payment method for this ticket' },
  { name: 'delivered', description: 'Mark ticket as delivered, log payment, and add earnings' },
  { name: 'giveproduct', description: 'Give the product to the customer (single price only)', options: [
      { name: 'logins', description: 'The account login(s), separated by spaces', type: 3, required: true }
  ] },
  { name: 'search', description: 'Search a user their stats', options: [
      { name: 'user', description: 'User', type: 6, required: true }
  ] },
  { name: 'checkinvites', description: 'See a user their invites', options: [
      { name: 'user', description: 'User', type: 6, required: true }
  ] },
  { name: 'userewards', description: 'Use rewards for a user', options: [
      { name: 'user', description: 'User', type: 6, required: true },
      { name: 'reward', description: 'Reward to claim', type: 3, required: true, choices: [
          { name: '5%', value: '5' },
          { name: '10%', value: '10' }
      ] }
  ] },
  { name: 'editcustomer', description: 'Edit the amount a customer spent', options: [
      { name: 'user', description: 'User', type: 6, required: true },
      { name: 'spent', description: 'New spent amount (e.g. 0,75)', type: 3, required: true }
  ] },
  { name: 'resetearned', description: 'Reset all earnings to 0' },
  { name: 'clearallproducts', description: 'Clear all products and store data' },
  { name: 'giveaway', description: 'Start a giveaway', options: [
      { name: 'winners', description: 'Amount of winners', type: 4, required: true, min_value: 1 },
      { name: 'product', description: 'What is the prize?', type: 3, required: true },
      { name: 'time', description: 'Duration (e.g. 10m, 1h, 1d)', type: 3, required: true },
      { name: 'blacklist_roles', description: 'Roles that cannot win (mention them, separated by spaces)', type: 3, required: false }
  ] },
  { name: 'clear', description: 'Clear messages in this channel', options: [
      { name: 'amount', description: 'Amount of messages (1-100)', type: 4, required: true, min_value: 1, max_value: 100 }
  ] },
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

    if (name === 'payment' || name === 'delivered' || name === 'giveproduct') {
      if (!PAYMENT_COMMAND_ALLOWED_IDS.includes(i.user.id)) {
        return i.reply({ content: '❌ You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
      }
    }

    if (name === 'changepaymentmethod' || name === 'resetearned' || name === 'userewards') {
      if (!isStaff(i.member)) {
        return i.reply({ content: '❌ You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
      }
    }

    if (name === 'search') {
      if (!isStaff(i.member)) {
        return i.reply({ content: '❌ You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
      }

      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const targetUser = i.options.getUser('user');
      const spent = await getCustomerSpent();
      const tickets = await getCustomerTickets();
      const history = await getCustomerHistory();

      const totalSpent = spent[targetUser.id] || 0;
      const ticketCount = tickets[targetUser.id] || 0;
      const purchases = history[targetUser.id] || [];

      const embed = new EmbedBuilder()
        .setTitle(`🔍 Customer Stats for ${targetUser.tag}`)
        .setColor(0x00ff88)
        .setThumbnail(targetUser.displayAvatarURL())
        .setDescription(
          `**Total Tickets:** ${ticketCount}\n` +
          `**Total Spent:** €${totalSpent.toFixed(2)}\n\n` +
          `**Purchases:**\n` +
          (purchases.length > 0 ? purchases.map(p => `> ${p.product} (${p.quantity}x) - ${p.total}`).join('\n') : '*No purchases yet.*')
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .setTimestamp();

      return i.editReply({ embeds: [embed] });
    }

    if (name === 'checkinvites') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const targetUser = i.options.getUser('user');
      const invites = await getUserInvites();
      const userData = invites[targetUser.id] || { valid: 0, fake: 0, rewarded: 0, invitedUsers: [] };
      const invitedList = (userData.invitedUsers || []).map(id => `<@${id}>`).join('\n') || '*Nobody*';
      const availableTens = Math.floor(userData.valid / 10);
      const availableFives = Math.floor((userData.valid % 10) / 5);
      const rewardText = `${availableTens > 0 ? `${availableTens}x 10%` : ''} ${availableFives > 0 ? `${availableFives}x 5%` : ''}`.trim() || '0';

      const embed = new EmbedBuilder()
        .setTitle(`📊 Invites for ${targetUser.tag}`)
        .setColor(0xffaa00)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: 'Valid Invites', value: `${userData.valid || 0}`, inline: true },
          { name: 'Available Rewards', value: rewardText, inline: true },
          { name: 'Invited Users', value: invitedList, inline: false }
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .setTimestamp();

      return i.editReply({ embeds: [embed] });
    }

    if (name === 'editcustomer') {
      if (!i.member.roles.cache.has(EDIT_CUSTOMER_ROLE_ID)) {
        return i.reply({ content: '❌ You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
      }

      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const targetUser = i.options.getUser('user');
      const spentRaw = i.options.getString('spent');
      
      const spentAmount = parseFloat(spentRaw.replace(',', '.').replace('€', '').trim());
      if (isNaN(spentAmount) || spentAmount < 0) {
        return i.editReply({ content: '❌ Invalid amount. Use a number like `0,75` or `5.50`.' });
      }

      const spent = await getCustomerSpent();
      const oldAmount = spent[targetUser.id] || 0;
      spent[targetUser.id] = spentAmount;
      await saveCustomerSpent(spent);
      await updateCustomerOverview();
      await sendLog('✏️ Customer Edited', `<@${i.user.id}> changed <@${targetUser.id}>'s spent from **€${oldAmount.toFixed(2)}** to **€${spentAmount.toFixed(2)}**.`, 0xffaa00);
      return i.editReply({ content: `✅ Updated <@${targetUser.id}> spent from **€${oldAmount.toFixed(2)}** to **€${spentAmount.toFixed(2)}**.` });
    }

    if (name === 'userewards') {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const targetUser = i.options.getUser('user');
      const reward = i.options.getString('reward');
      const invites = await getUserInvites();
      const userData = invites[targetUser.id] || { valid: 0, fake: 0, rewarded: 0, invitedUsers: [] };

      const requiredInvites = reward === '5' ? 5 : 10;
      if (userData.valid < requiredInvites) {
        return i.editReply({ content: `❌ ${targetUser.username} has only **${userData.valid}** valid invites, but needs **${requiredInvites}** to claim the **${reward}%** reward.` });
      }

      userData.valid -= requiredInvites;
      userData.rewarded = (userData.rewarded || 0) + 1;
      invites[targetUser.id] = userData;
      await saveUserInvites(invites);

      const rewards = await getUserRewards();
      if (!rewards[targetUser.id]) rewards[targetUser.id] = [];
      rewards[targetUser.id].push({ percent: parseInt(reward), claimedAt: Date.now() });
      await saveUserRewards(rewards);

      await updateInviteOverview();
      await sendLog('🎁 Reward Claimed', `<@${targetUser.id}> claimed a **${reward}%** discount reward.`, 0x00ff88);

      return i.editReply({ content: `✅ Reward of **${reward}%** claimed for ${targetUser.username}!` });
    }

    if (name === 'clear') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      const amount = i.options.getInteger('amount');
      try {
        await i.channel.bulkDelete(amount, true);
        return i.reply({ content: `✅ Cleared **${amount}** messages.`, flags: MessageFlags.Ephemeral });
      } catch (e) {
        return i.reply({ content: `❌ Error: ${e.message}`, flags: MessageFlags.Ephemeral });
      }
    }

    if (name === 'clearallproducts') {
      if (!i.member.roles.cache.has(CLEAR_PRODUCTS_ROLE_ID)) {
        return i.reply({ content: '❌ You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
      }
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const emptyStore = { sections: {}, services: {}, products: {}, lastSection: null, lastService: null, lastProduct: null, serviceChannels: {}, serviceMessages: {} };
      await saveStoreData(emptyStore);
      await updateStorePanel();
      return i.editReply({ content: '✅ All products, services, and sections have been cleared!' });
    }

    if (name === 'giveaway') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });

      const winners = i.options.getInteger('winners');
      const product = i.options.getString('product');
      const timeStr = i.options.getString('time');
      const blacklistRolesRaw = i.options.getString('blacklist_roles') || '';

      const duration = parseDuration(timeStr);
      if (!duration) return i.editReply({ content: '❌ Invalid time format. Use `10m`, `1h`, `1d`, etc.' });

      const blacklistRoles = blacklistRolesRaw.split(/\s+/).map(r => r.replace(/[<@&>]/g, '')).filter(Boolean);
      
      const channel = await client.channels.fetch(GIVEAWAY_CHANNEL_ID).catch(() => null);
      if (!channel) return i.editReply({ content: '❌ Giveaway channel not found.' });

      await runGiveaway(channel, winners, product, duration, blacklistRoles);
      return i.editReply({ content: `✅ Giveaway started in <#${GIVEAWAY_CHANNEL_ID}>!` });
    }

    if (name === 'setupstore') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      await setupStorePanel();
      return i.editReply({ content: '✅ Store panel placed!' });
    }

    if (name === 'resetearned') {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      
      const oldEarnings = await getEarnings();
      const earnings = { [EARNER_1_ID]: 0, [EARNER_2_ID]: 0, [EARNER_3_ID]: 0, [EARNER_4_ID]: 0 };
      
      const fields = [
        { name: 'Old Earnings', value:
          `<@${EARNER_1_ID}>: €${(oldEarnings[EARNER_1_ID] || 0).toFixed(2)}\n` +
          `<@${EARNER_2_ID}>: €${(oldEarnings[EARNER_2_ID] || 0).toFixed(2)}\n` +
          `<@${EARNER_3_ID}>: €${(oldEarnings[EARNER_3_ID] || 0).toFixed(2)}\n` +
          `<@${EARNER_4_ID}>: €${(oldEarnings[EARNER_4_ID] || 0).toFixed(2)}`
        }
      ];

      await saveEarnings(earnings);
      await updateEarningsPanel();
      await sendLog('🔄 Earnings Reset', `All earnings have been reset to **€0.00** by <@${i.user.id}>.`, 0xffaa00, fields);
      return i.editReply({ content: '✅ Earnings reset to 0 for all users.' });
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

      const linkOrCrypto = i.options.getString('link_or_crypto');
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
        if (!linkOrCrypto) {
          return i.reply({ content: '❌ For Crypto you must provide a `link_or_crypto` (crypto address).', flags: MessageFlags.Ephemeral });
        }
        embed.addFields({ name: 'Crypto Address (LTC)', value: `\`${linkOrCrypto}\``, inline: false });
      } else {
        if (!linkOrCrypto) {
          return i.reply({ content: '❌ For this method you must provide a `link_or_crypto`.', flags: MessageFlags.Ephemeral });
        }
        embed.addFields({ name: 'Payment Link', value: linkOrCrypto, inline: false });
      }

      return i.reply({ embeds: [embed] });
    }

    // === /GIVEPRODUCT ===
    if (name === 'giveproduct') {
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });

      const store = await getStoreData();
      const prodData = store.products[ticket.product];

      if (!prodData) return i.reply({ content: '❌ Product not found in store data.', flags: MessageFlags.Ephemeral });
      if (prodData.amount) return i.reply({ content: '❌ This command only works for products with a Single Price.', flags: MessageFlags.Ephemeral });

      await i.deferReply({ flags: MessageFlags.Ephemeral });

      const logins = i.options.getString('logins').trim().split(/\s+/);
      const loginList = logins.map((l, index) => `${index + 1}. \`${l}\``).join('\n');

      const dmEmbed = new EmbedBuilder()
        .setTitle('✅ Your Product Delivery')
        .setColor(0x00ff88)
        .setDescription(`Thank you for your purchase at **Prestige Market**!\n\nHere are your account details for **${ticket.product}**:\n\n${loginList}`)
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .setTimestamp();

      const ticketEmbed = new EmbedBuilder()
        .setTitle('📦 Product Delivered')
        .setColor(0x00ff88)
        .setDescription(`The product has been successfully delivered to <@${ticket.userId}>.\n\n**Product:** ${ticket.product}\n**Logins:**\n${loginList}`)
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .setTimestamp();

      try {
        const targetUser = await client.users.fetch(ticket.userId);
        await targetUser.send({ embeds: [dmEmbed] }).catch(() => console.log('Could not DM user'));
        
        await i.channel.send({ embeds: [ticketEmbed] });
        await sendLog('📦 Product Given', `<@${i.user.id}> gave **${ticket.product}** to <@${ticket.userId}> in <#${i.channelId}>.`, 0x00ff88);

        return i.editReply({ content: '✅ Product successfully delivered and sent to the customer!' });
      } catch (e) {
        return i.editReply({ content: `❌ Error: ${e.message}` });
      }
    }

    // === /CHANGEPAYMENTMETHOD ===
    if (name === 'changepaymentmethod') {
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });
      
      const menu = new StringSelectMenuBuilder()
        .setCustomId('change_payment_method')
        .setPlaceholder('Select a new payment method')
        .addOptions(Object.entries(PAYMENT_METHODS).map(([key, name]) => ({ label: name, value: key, emoji: PAYMENT_EMOJIS[key] })));

      return i.reply({ content: 'Select the new payment method for this ticket:', components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
    }

    // === /DELIVERED ===
    if (name === 'delivered') {
      if (!ticket) return i.reply({ content: '❌ This is not an active ticket.', flags: MessageFlags.Ephemeral });
      
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      
      try {
        const store = await getStoreData();
        const prodData = store.products[ticket.product];
        let profit = 0;
        const totalPrice = parsePrice(ticket.total);

        if (prodData) {
          const buyCostPer = prodData.buyCost ? parsePrice(prodData.buyCost) : 0;
          const quantity = ticket.quantity || 1;
          profit = totalPrice - (buyCostPer * quantity);
        }

        if (profit !== 0) {
          const earnings = await getEarnings();
          if (PAYMENT_COMMAND_ALLOWED_IDS.includes(i.user.id)) {
            earnings[i.user.id] = (earnings[i.user.id] || 0) + profit;
            await saveEarnings(earnings);
            await updateEarningsPanel();
          }
        }

        const spent = await getCustomerSpent();
        spent[ticket.userId] = (spent[ticket.userId] || 0) + totalPrice;
        await saveCustomerSpent(spent);
        await updateCustomerOverview();

        const customerTickets = await getCustomerTickets();
        customerTickets[ticket.userId] = (customerTickets[ticket.userId] || 0) + 1;
        await saveCustomerTickets(customerTickets);

        const history = await getCustomerHistory();
        if (!history[ticket.userId]) history[ticket.userId] = [];
        history[ticket.userId].push({ product: ticket.product, quantity: ticket.quantity, total: ticket.total });
        await saveCustomerHistory(history);

        const member = await i.guild.members.fetch(ticket.userId).catch(() => null);
        if (member && !member.roles.cache.has(VOUCH_ROLE_ID)) {
          await member.roles.add(VOUCH_ROLE_ID).catch(() => console.log('Could not add vouch role'));
        }

        if (member) {
          const newTotal = spent[ticket.userId];
          for (const role of SPENT_ROLES) {
            if (newTotal >= role.amount && !member.roles.cache.has(role.roleId)) {
              await member.roles.add(role.roleId).catch(() => console.log(`Could not add spent role ${role.roleId}`));
            }
          }
        }

        const recentChannel = await client.channels.fetch(RECENT_PAYMENTS_CHANNEL_ID).catch(() => null);
        if (recentChannel) {
          const paymentEmbed = new EmbedBuilder()
            .setTitle('💸 Recent Payment')
            .setColor(0x00ff88)
            .setDescription(`**Delivered by:** <@${i.user.id}>\n**Customer:** <@${ticket.userId}>\n**Product:** ${ticket.product} (${ticket.quantity}x)\n**Total:** ${ticket.total}\n**Profit:** €${profit.toFixed(2)}`)
            .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
            .setTimestamp();
          await recentChannel.send({ embeds: [paymentEmbed] });
        }

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
      
      const channels = i.guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.id !== STORE_PANEL_CHANNEL_ID);
      if (channels.size === 0) {
        return i.reply({ content: `✅ Service **${name}** added to **${section}**. (No text channels found to link.)`, flags: MessageFlags.Ephemeral });
      }

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`link_channel_to_service_${name}`)
        .setPlaceholder('Select a channel for this service shop')
        .addOptions(channels.first(25).map(c => ({ label: c.name, value: c.id })));

      return i.reply({ content: `✅ Service **${name}** added to **${section}**.\n\nWould you like to link a text channel to this service for a shop embed?`, components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
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
      
      if (store.serviceChannels?.[service]) {
        await updateServiceShop(service);
      }
      
      return i.reply({ content: `✅ Product **${name}** added to **${service}**.`, flags: MessageFlags.Ephemeral });
    }

    if (i.customId.startsWith('modal_add_price_single_')) {
      const product = i.customId.replace('modal_add_price_single_', '');
      const price = i.fields.getTextInputValue('product_price');
      const buyCost = i.fields.getTextInputValue('product_buy_cost');
      const store = await getStoreData();
      if (!store.products[product]) return i.reply({ content: '❌ Product not found.', flags: MessageFlags.Ephemeral });
      store.products[product].price = price;
      store.products[product].amount = '';
      if (buyCost) store.products[product].buyCost = buyCost;
      await saveStoreData(store);
      await updateStorePanel();
      return i.reply({ content: `✅ Single price for **${product}** set to **${formatPrice(price)}**. Buy cost: €${buyCost || 0}.`, flags: MessageFlags.Ephemeral });
    }

    if (i.customId.startsWith('modal_add_price_amount_')) {
      const product = i.customId.replace('modal_add_price_amount_', '');
      const price = i.fields.getTextInputValue('product_price');
      const amount = i.fields.getTextInputValue('product_amount');
      const buyCost = i.fields.getTextInputValue('product_buy_cost');
      const store = await getStoreData();
      if (!store.products[product]) return i.reply({ content: '❌ Product not found.', flags: MessageFlags.Ephemeral });
      store.products[product].price = price;
      store.products[product].amount = amount;
      if (buyCost) store.products[product].buyCost = buyCost;
      await saveStoreData(store);
      await updateStorePanel();
      return i.reply({ content: `✅ Price for **${product}** set to **${formatPrice(price)}** per **${amount}**. Buy cost: €${buyCost || 0}.`, flags: MessageFlags.Ephemeral });
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
        .addOptions(Object.entries(PAYMENT_METHODS).map(([key, name]) => ({ label: name, value: key, emoji: PAYMENT_EMOJIS[key] })));

      return i.update({ content: `You want **${quantity}** of **${product}**. Total: **${formattedTotal}**.\n\nSelect your payment method:`, components: [new ActionRowBuilder().addComponents(menu)] });
    }

    if (i.customId.startsWith('modal_create_ticket_')) {
      const category = i.customId.replace('modal_create_ticket_', '');
      const cat = TICKET_CATEGORIES[category];
      if (!cat) return i.reply({ content: '❌ Unknown category.', flags: MessageFlags.Ephemeral });

      const questionAnswer = i.fields.getTextInputValue('question_answer');
      const questionAnswer2 = category === 'partner' ? i.fields.getTextInputValue('question_answer_2') : null;

      await i.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        const guild = i.guild;
        const tickets = await getTickets();
        const existingTicket = Object.values(tickets).find(t => t.userId === i.user.id);
        if (existingTicket) {
          return i.editReply({ content: '❌ You already have an open ticket.' });
        }

        const channelName = `${cat.prefix}-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const overwrites = [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
          { id: MAIN_TAG_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }
        ];

        const ticketChannel = await guild.channels.create({
          name: channelName, type: ChannelType.GuildText, parent: cat.categoryId, permissionOverwrites: overwrites, topic: `Ticket from ${i.user.tag}`,
        });

        await addTicket(ticketChannel.id, i.user.id, category);

        const customerTickets = await getCustomerTickets();
        customerTickets[i.user.id] = (customerTickets[i.user.id] || 0) + 1;
        await saveCustomerTickets(customerTickets);

        const stats = await getTicketStats();
        stats.total += 1;
        await saveTicketStats(stats);
        await updateTicketStats();

        const embed = new EmbedBuilder()
          .setTitle(cat.name)
          .setColor(cat.color)
          .setDescription(`<@${i.user.id}> — Thank you for opening a ticket. Please wait for a staff member to assist you.`)
          .addFields({ name: 'Your Answer', value: questionAnswer })
          .setTimestamp();

        if (questionAnswer2) {
          embed.addFields({ name: 'Second Answer', value: questionAnswer2 });
        }

        const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger));

        await ticketChannel.send({ content: `<@${i.user.id}> <@&${MAIN_TAG_ROLE_ID}>`, embeds: [embed], components: [closeRow] });
        await i.editReply({ content: `✅ Ticket created: <#${ticketChannel.id}>` });
      } catch (e) { await i.editReply({ content: `❌ Error: ${e.message}` }); }
      return;
    }

    if (i.customId.startsWith('edit_service_modal_')) {
      const oldName = i.customId.replace('edit_service_modal_', '');
      const newName = i.fields.getTextInputValue('new_name');
      const store = await getStoreData();
      
      if (!store.services[oldName]) return i.reply({ content: '❌ Service not found.', flags: MessageFlags.Ephemeral });
      
      for (const [sec, list] of Object.entries(store.sections)) {
        const idx = list.indexOf(oldName);
        if (idx !== -1) list[idx] = newName;
      }
      
      if (store.services[oldName]) {
        store.services[newName] = store.services[oldName];
        delete store.services[oldName];
      }
      
      if (store.serviceChannels?.[oldName]) {
        if (!store.serviceChannels) store.serviceChannels = {};
        store.serviceChannels[newName] = store.serviceChannels[oldName];
        delete store.serviceChannels[oldName];
      }
      
      if (store.serviceMessages?.[oldName]) {
        if (!store.serviceMessages) store.serviceMessages = {};
        store.serviceMessages[newName] = store.serviceMessages[oldName];
        delete store.serviceMessages[oldName];
      }
      
      await saveStoreData(store);
      await updateStorePanel();
      
      if (store.serviceChannels?.[newName]) {
        await updateServiceShop(newName);
      }
      
      return i.reply({ content: `✅ Service **${oldName}** has been renamed to **${newName}**.`, flags: MessageFlags.Ephemeral });
    }

    if (i.customId.startsWith('edit_price_modal_')) {
      const product = i.customId.replace('edit_price_modal_', '');
      const price = i.fields.getTextInputValue('product_price');
      const amount = i.fields.getTextInputValue('product_amount');
      const buyCost = i.fields.getTextInputValue('product_buy_cost');
      const store = await getStoreData();
      
      if (!store.products[product]) return i.reply({ content: '❌ Product not found.', flags: MessageFlags.Ephemeral });
      
      store.products[product].price = price;
      store.products[product].amount = amount;
      if (buyCost) store.products[product].buyCost = buyCost;
      await saveStoreData(store);
      await updateStorePanel();
      
      return i.reply({ content: `✅ Price for **${product}** has been updated.`, flags: MessageFlags.Ephemeral });
    }

    if (i.customId.startsWith('giveaway_reroll_modal_')) {
      const messageId = i.customId.replace('giveaway_reroll_modal_', '');
      const amount = parseInt(i.fields.getTextInputValue('reroll_amount'));

      if (isNaN(amount) || amount <= 0) {
        return i.reply({ content: '❌ Invalid amount.', flags: MessageFlags.Ephemeral });
      }

      const giveaways = await getGiveaways();
      const giveaway = giveaways[messageId];
      if (!giveaway) return i.reply({ content: '❌ Giveaway not found.', flags: MessageFlags.Ephemeral });

      const entries = giveaway.participants || [];
      const filtered = entries.filter(id => !giveaway.winnersList.includes(id));
      
      if (filtered.length === 0) {
        return i.reply({ content: '❌ No new participants to reroll from.', flags: MessageFlags.Ephemeral });
      }

      const shuffled = filtered.sort(() => Math.random() - 0.5);
      const newWinners = shuffled.slice(0, amount);

      giveaway.winnersList = newWinners;
      await saveGiveaways(giveaways);

      const winnerMentions = newWinners.map(id => `<@${id}>`).join(', ');

      const resultEmbed = new EmbedBuilder()
        .setTitle('🔄 Giveaway Rerolled 🔄')
        .setColor(0xffaa00)
        .setDescription(
          `**Prize:** ${giveaway.product}\n` +
          `**New Winners:** ${winnerMentions}\n\n` +
          `Congratulations!`
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .setTimestamp();

      await i.channel.send({ content: `🔄 Rerolled! Congratulations ${winnerMentions}!`, embeds: [resultEmbed] });
      return i.reply({ content: '✅ Winners rerolled!', flags: MessageFlags.Ephemeral });
    }
  }

  if (i.isStringSelectMenu()) {
    const userId = i.user.id;

    if (i.customId.startsWith('link_channel_to_service_')) {
      const serviceName = i.customId.replace('link_channel_to_service_', '');
      const channelId = i.values[0];
      
      const store = await getStoreData();
      if (!store.serviceChannels) store.serviceChannels = {};
      store.serviceChannels[serviceName] = channelId;
      await saveStoreData(store);
      
      await updateServiceShop(serviceName);
      
      return i.update({ content: `✅ Service **${serviceName}** is now linked to <#${channelId}> and the shop embed has been placed!`, components: [] });
    }

    if (i.customId === 'ticket_category_select') {
      const choice = i.values[0];
      const cat = TICKET_CATEGORIES[choice];
      if (!cat) return i.reply({ content: '❌ Unknown category.', flags: MessageFlags.Ephemeral });

      if (choice === 'purchase') {
        await i.deferReply({ flags: MessageFlags.Ephemeral });
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

      if (choice === 'support' || choice === 'bug') {
        const modal = new ModalBuilder().setCustomId(`modal_create_ticket_${choice}`).setTitle(`${cat.name} Ticket`);
        const input = new TextInputBuilder().setCustomId('question_answer').setLabel('Describe your issue / question').setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return i.showModal(modal);
      }

      if (choice === 'partner') {
        const modal = new ModalBuilder().setCustomId(`modal_create_ticket_${choice}`).setTitle(`${cat.name} Ticket`);
        const input1 = new TextInputBuilder().setCustomId('question_answer').setLabel('Why do you want to become a partner?').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const input2 = new TextInputBuilder().setCustomId('question_answer_2').setLabel('What benefits do we have being partners?').setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input1), new ActionRowBuilder().addComponents(input2));
        return i.showModal(modal);
      }

      await i.deferReply({ flags: MessageFlags.Ephemeral });
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

        const customerTickets = await getCustomerTickets();
        customerTickets[userId] = (customerTickets[userId] || 0) + 1;
        await saveCustomerTickets(customerTickets);

        const stats = await getTicketStats();
        stats.total += 1;
        await saveTicketStats(stats);
        await updateTicketStats();

        const embed = new EmbedBuilder().setTitle(cat.name).setColor(cat.color).setDescription(`<@${userId}> — Please describe your question below.`).setTimestamp();
        const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger));

        await ticketChannel.send({ content: `<@${userId}> <@&${MAIN_TAG_ROLE_ID}>`, embeds: [embed], components: [closeRow] });
        await i.editReply({ content: `✅ Ticket created: <#${ticketChannel.id}>` });
      } catch (e) { await i.editReply({ content: `❌ Error: ${e.message}` }); }
      return;
    }

    if (i.customId === 'change_payment_method') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ You do not have permission.', flags: MessageFlags.Ephemeral });
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
        const input1 = new TextInputBuilder().setCustomId('product_price').setLabel('Price (e.g. 5 or 0,75)').setStyle(TextInputStyle.Short).setRequired(true);
        const input2 = new TextInputBuilder().setCustomId('product_buy_cost').setLabel('Buy Cost (e.g. 2 or 0,50)').setStyle(TextInputStyle.Short).setRequired(false);
        modal.addComponents(new ActionRowBuilder().addComponents(input1), new ActionRowBuilder().addComponents(input2));
        return i.showModal(modal);
      }

      const modal = new ModalBuilder().setCustomId(`modal_add_price_amount_${product}`).setTitle('Add Price Per Amount');
      const input1 = new TextInputBuilder().setCustomId('product_price').setLabel('Price (e.g. 5 or 0,75)').setStyle(TextInputStyle.Short).setRequired(true);
      const input2 = new TextInputBuilder().setCustomId('product_amount').setLabel('Amount (e.g. 1000)').setStyle(TextInputStyle.Short).setRequired(true);
      const input3 = new TextInputBuilder().setCustomId('product_buy_cost').setLabel('Buy Cost (e.g. 2 or 0,50)').setStyle(TextInputStyle.Short).setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(input1), new ActionRowBuilder().addComponents(input2), new ActionRowBuilder().addComponents(input3));
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
      delete store.products[product].buyCost;
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

        const customerTickets = await getCustomerTickets();
        customerTickets[userId] = (customerTickets[userId] || 0) + 1;
        await saveCustomerTickets(customerTickets);

        const stats = await getTicketStats();
        stats.total += 1;
        await saveTicketStats(stats);
        await updateTicketStats();

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

    if (i.customId === 'store_edit_type') {
      const type = i.values[0];
      const store = await getStoreData();

      if (type === 'section') {
        const sections = Object.keys(store.sections);
        if (sections.length === 0) return i.update({ content: '❌ No sections to edit.', components: [] });
        const menu = new StringSelectMenuBuilder()
          .setCustomId('edit_section_select')
          .setPlaceholder('Select a section to edit')
          .addOptions(sections.map(s => ({ label: s, value: s })));
        return i.update({ content: '✏️ Which **section** do you want to edit?', components: [new ActionRowBuilder().addComponents(menu)] });
      }

      if (type === 'service') {
        const services = Object.keys(store.services);
        if (services.length === 0) return i.update({ content: '❌ No services to edit.', components: [] });
        const menu = new StringSelectMenuBuilder()
          .setCustomId('edit_service_select')
          .setPlaceholder('Select a service to edit')
          .addOptions(services.map(s => ({ label: s, value: s })));
        return i.update({ content: '✏️ Which **service** do you want to edit?', components: [new ActionRowBuilder().addComponents(menu)] });
      }

      if (type === 'product') {
        const products = Object.keys(store.products);
        if (products.length === 0) return i.update({ content: '❌ No products to edit.', components: [] });
        const menu = new StringSelectMenuBuilder()
          .setCustomId('edit_product_select')
          .setPlaceholder('Select a product to edit')
          .addOptions(products.map(p => ({ label: p, value: p })));
        return i.update({ content: '✏️ Which **product** do you want to edit?', components: [new ActionRowBuilder().addComponents(menu)] });
      }

      if (type === 'price') {
        const products = Object.keys(store.products);
        if (products.length === 0) return i.update({ content: '❌ No products to edit.', components: [] });
        const menu = new StringSelectMenuBuilder()
          .setCustomId('edit_price_select')
          .setPlaceholder('Select a product price to edit')
          .addOptions(products.map(p => ({ label: p, value: p })));
        return i.update({ content: '✏️ Which **price** do you want to edit?', components: [new ActionRowBuilder().addComponents(menu)] });
      }
      return;
    }

    if (i.customId === 'edit_section_select') {
      const section = i.values[0];
      const modal = new ModalBuilder().setCustomId(`edit_section_modal_${section}`).setTitle('Edit Section');
      const input = new TextInputBuilder().setCustomId('new_name').setLabel('New Section Name').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return i.showModal(modal);
    }

    if (i.customId === 'edit_service_select') {
      const service = i.values[0];
      const store = await getStoreData();
      
      const modal = new ModalBuilder().setCustomId(`edit_service_modal_${service}`).setTitle('Edit Service');
      const input1 = new TextInputBuilder().setCustomId('new_name').setLabel('New Service Name').setStyle(TextInputStyle.Short).setValue(service).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input1));
      
      await i.showModal(modal);
      
      const channels = i.guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.id !== STORE_PANEL_CHANNEL_ID);
      if (channels.size > 0) {
        const menu = new StringSelectMenuBuilder()
          .setCustomId(`link_channel_to_service_${service}`)
          .setPlaceholder('Select a channel to link to this service')
          .addOptions(channels.first(25).map(c => ({ label: c.name, value: c.id })));

        await i.followUp({ content: `Would you like to link a text channel to **${service}** for the shop embed?`, components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
      }
      return;
    }

    if (i.customId === 'edit_product_select') {
      const product = i.values[0];
      const modal = new ModalBuilder().setCustomId(`edit_product_modal_${product}`).setTitle('Edit Product');
      const input = new TextInputBuilder().setCustomId('new_name').setLabel('New Product Name').setStyle(TextInputStyle.Short).setValue(product).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return i.showModal(modal);
    }

    if (i.customId === 'edit_price_select') {
      const product = i.values[0];
      const store = await getStoreData();
      const pd = store.products[product] || {};
      
      const modal = new ModalBuilder().setCustomId(`edit_price_modal_${product}`).setTitle('Edit Price');
      const input1 = new TextInputBuilder().setCustomId('product_price').setLabel('Price (e.g. 5 or 0,75)').setStyle(TextInputStyle.Short).setValue(pd.price || '').setRequired(true);
      const input2 = new TextInputBuilder().setCustomId('product_amount').setLabel('Amount (leave empty for single price)').setStyle(TextInputStyle.Short).setValue(pd.amount || '').setRequired(false);
      const input3 = new TextInputBuilder().setCustomId('product_buy_cost').setLabel('Buy Cost (e.g. 2 or 0,50)').setStyle(TextInputStyle.Short).setValue(pd.buyCost || '').setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(input1), new ActionRowBuilder().addComponents(input2), new ActionRowBuilder().addComponents(input3));
      return i.showModal(modal);
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

    if (i.customId === 'store_edit') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      const menu = new StringSelectMenuBuilder()
        .setCustomId('store_edit_type')
        .setPlaceholder('What do you want to edit?')
        .addOptions([
          { label: 'Section', value: 'section', emoji: '🔹' },
          { label: 'Service', value: 'service', emoji: '🔧' },
          { label: 'Product', value: 'product', emoji: '📦' },
          { label: 'Price', value: 'price', emoji: '💰' },
        ]);
      return i.reply({ content: '✏️ What do you want to edit?', components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
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

        const stats = await getTicketStats();
        stats.total += 1;
        await saveTicketStats(stats);
        await updateTicketStats();

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

    if (i.customId === 'giveaway_join') {
      const giveaways = await getGiveaways();
      const giveaway = giveaways[i.message.id];
      if (!giveaway || !giveaway.active) return i.reply({ content: '❌ This giveaway has ended.', flags: MessageFlags.Ephemeral });

      if (giveaway.blacklistRoles && giveaway.blacklistRoles.some(roleId => i.member.roles.cache.has(roleId))) {
        return i.reply({ content: '❌ You are not eligible to join this giveaway.', flags: MessageFlags.Ephemeral });
      }

      if (giveaway.participants.includes(i.user.id)) {
        return i.reply({ content: '❌ You have already joined this giveaway!', flags: MessageFlags.Ephemeral });
      }

      giveaway.participants.push(i.user.id);
      await saveGiveaways(giveaways);
      return i.reply({ content: '✅ You have joined the giveaway! Good luck!', flags: MessageFlags.Ephemeral });
    }

    if (i.customId.startsWith('giveaway_reroll_')) {
      if (!isStaff(i.member)) return i.reply({ content: '❌ No permission.', flags: MessageFlags.Ephemeral });
      const messageId = i.customId.replace('giveaway_reroll_', '');

      const modal = new ModalBuilder().setCustomId(`giveaway_reroll_modal_${messageId}`).setTitle('Reroll Giveaway');
      const input = new TextInputBuilder().setCustomId('reroll_amount').setLabel('How many winners do you want to reroll?').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return i.showModal(modal);
    }

    if (i.customId === 'invite_get_link') {
      try {
        const guild = i.guild;
        const invites = await guild.invites.fetch();
        let userInvite = invites.find(inv => inv.inviter?.id === i.user.id);
        
        if (!userInvite) {
          const channel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me).has(PermissionFlagsBits.CreateInstantInvite));
          if (channel) {
            userInvite = await channel.createInvite({ maxAge: 0, maxUses: 0, unique: true, reason: 'Personal invite link' });
          }
        }

        if (userInvite) {
          await i.user.send({ content: `Here is your personal invite link: https://discord.gg/${userInvite.code}` }).catch(() => console.log('Could not DM user'));
          return i.reply({ content: '✅ I have sent your personal invite link in DM!', flags: MessageFlags.Ephemeral });
        } else {
          return i.reply({ content: '❌ Could not create an invite. Please contact staff.', flags: MessageFlags.Ephemeral });
        }
      } catch (e) {
        return i.reply({ content: `❌ Error: ${e.message}`, flags: MessageFlags.Ephemeral });
      }
    }

    if (i.customId === 'invite_check') {
      const invites = await getUserInvites();
      const userData = invites[i.user.id] || { valid: 0, fake: 0, rewarded: 0, invitedUsers: [] };
      
      const availableTens = Math.floor(userData.valid / 10);
      const availableFives = Math.floor((userData.valid % 10) / 5);
      
      let rewardText = '0 rewards';
      if (availableTens > 0 || availableFives > 0) {
        const parts = [];
        if (availableTens > 0) parts.push(`${availableTens}x 10%`);
        if (availableFives > 0) parts.push(`${availableFives}x 5%`);
        rewardText = parts.join(' + ');
      }

      const embed = new EmbedBuilder()
        .setTitle('📊 Your Invites')
        .setColor(0xffaa00)
        .setThumbnail(i.user.displayAvatarURL())
        .addFields(
          { name: 'Valid Invites', value: `${userData.valid || 0}`, inline: true },
          { name: 'Available Rewards', value: rewardText, inline: true }
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .setTimestamp();

      return i.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
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

  // Public welcome message
  try {
    const welcomeChannel = await client.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
    if (welcomeChannel) {
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎉 Welcome to Prestige Market!')
        .setColor(0x5865f2)
        .setDescription(`Welcome <@${member.id}> to **Prestige Market**! 🎊\n\nWe are happy to have you here. Make sure to check out our store and open a ticket if you need any help.`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage(LOGO)
        .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
        .setTimestamp();

      await welcomeChannel.send({ content: `<@${member.id}>`, embeds: [welcomeEmbed] });
    }
  } catch (e) { console.error('Welcome message error:', e.message); }

  await updateVerifyMessage();

  // Invite tracking
  try {
    const guild = member.guild;
    const cachedInvites = client.invitesCache?.get(guild.id) || new Map();
    const newInvites = await guild.invites.fetch();
    
    for (const [code, invite] of newInvites) {
      const cached = cachedInvites.get(code);
      if (cached && cached.uses < invite.uses) {
        const inviter = invite.inviter;
        if (inviter) {
          const invites = await getUserInvites();
          const userData = invites[inviter.id] || { valid: 0, fake: 0, rewarded: 0, invitedUsers: [] };
          
          const wasMember = await guild.members.fetch(member.id).catch(() => null);
          const isNew = !wasMember || !wasMember.joinedTimestamp || Date.now() - wasMember.joinedTimestamp < 10000;
          
          if (isNew) {
            userData.valid += 1;
          } else {
            userData.fake += 1;
          }
          
          if (!userData.invitedUsers) userData.invitedUsers = [];
          userData.invitedUsers.push(member.id);
          invites[inviter.id] = userData;
          await saveUserInvites(invites);
          await updateInviteOverview();
        }
        break;
      }
    }
    
    client.invitesCache.set(guild.id, new Map(newInvites.map(inv => [inv.code, inv])));
  } catch (e) { console.error('Invite tracking error:', e.message); }
});

client.on('guildMemberRemove', async (member) => {
  if (member.guild.id !== GUILD_ID) return;
  await updateVerifyMessage();

  try {
    const tickets = await getTickets();
    const userTickets = Object.entries(tickets).filter(([_, t]) => t.userId === member.id);
    for (const [channelId, ticket] of userTickets) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel) {
        await channel.send({ content: `⚠️ Customer <@${member.id}> has left the server. Ticket will be closed automatically.` });
        await closeTicket(channel, client.user.id);
      }
    }
  } catch (e) { console.error('Auto-close error:', e.message); }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (newMember.guild.id !== GUILD_ID) return;
  const hadRole = oldMember.roles.cache.has(VERIFIED_ROLE_ID);
  const hasRole = newMember.roles.cache.has(VERIFIED_ROLE_ID);
  if (hadRole !== hasRole) await updateVerifyMessage();

  if (!oldMember.premiumSince && newMember.premiumSince) {
    try {
      const boostChannel = await client.channels.fetch(BOOST_CHANNEL_ID).catch(() => null);
      if (boostChannel) {
        const boostEmbed = new EmbedBuilder()
          .setTitle('🚀 New Server Boost!')
          .setColor(0xff73fa)
          .setDescription(`<@${newMember.id}> just boosted the server! Thank you so much for your support! 💖\n\nWe now have **${newMember.guild.premiumSubscriptionCount}** boosts!`)
          .setFooter({ text: FOOTER_TEXT, iconURL: LOGO })
          .setTimestamp();
        await boostChannel.send({ content: `<@${newMember.id}>`, embeds: [boostEmbed] });
      }
    } catch (e) { console.error('Boost notification error:', e.message); }
  }
});

client.once('ready', async () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
  startStatusInterval();

  client.invitesCache = new Map();
  for (const guild of client.guilds.cache.values()) {
    const invites = await guild.invites.fetch().catch(() => null);
    if (invites) {
      client.invitesCache.set(guild.id, new Map(invites.map(inv => [inv.code, inv])));
    }
  }

  await new Promise(resolve => setTimeout(resolve, 3000));
  await setupVerify();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await setupLegit();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await setupTicketPanel();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await setupStorePanel();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await setupPaymentMethods();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await updateEarningsPanel();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await updateCustomerOverview();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await setupInviteRewards();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await updateInviteOverview();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await updateTicketStats();

  const store = await getStoreData();
  if (store.services['Streaming'] && !store.serviceChannels?.['Streaming']) {
    if (!store.serviceChannels) store.serviceChannels = {};
    store.serviceChannels['Streaming'] = '1564628292269772892';
    await saveStoreData(store);
  }
  
  if (store.serviceChannels) {
    for (const serviceName of Object.keys(store.serviceChannels)) {
      await updateServiceShop(serviceName);
    }
  }
});

client.login(TOKEN);

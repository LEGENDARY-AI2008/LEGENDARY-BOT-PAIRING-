
require('./setting/config')
const { 
  default: baileys, proto, jidNormalizedUser, generateWAMessage, 
  generateWAMessageFromContent, getContentType, prepareWAMessageMedia 
} = require("@boruto_vk7/baileys");
const { downloadMediaMessage } = require("@boruto_vk7/baileys");

const {
  downloadContentFromMessage, emitGroupParticipantsUpdate, emitGroupUpdate, 
  generateWAMessageContent, makeInMemoryStore, MediaType, areJidsSameUser, 
  WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, 
  GroupMetadata, initInMemoryKeyStore, MiscMessageGenerationOptions, 
  useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, 
  WAFlag, WANode, WAMetric, ChatModification, MessageTypeProto, 
  WALocationMessage, WAContextInfo, WAGroupMetadata, ProxyAgent, 
  waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, 
  WAContactsArrayMessage, WAGroupInviteMessage, WATextMessage, 
  WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, 
  MediariyuInfo, URL_REGEX, WAUrlInfo, WA_DEFAULT_EPHEMERAL, 
  WAMediaUpload, mentionedJid, processTime, Browser, MessageType, 
  Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, 
  GroupSettingChange, DisriyuectReason, WASocket, getStream, WAProto, 
  isBaileys, AnyMessageContent, fetchLatestBaileysVersion, 
  templateMessage, InteractiveMessage, Header 
} = require("@boruto_vk7/baileys");

const fs = require('fs')
const path = require('path')
const util = require('util')
const chalk = require('chalk')
const os = require('os')
const axios = require('axios')
const fsx = require('fs-extra')

async function askOpenAI(prompt) {
    const { data } = await axios.get(
        "https://api-madrin.zone.id/ai/gpt5",
        {
            params: {
                apikey: "test",
                text: prompt
            }
        }
    );
    return data.result || "No response.";
}

// Wraps askOpenAI with per-chat conversation memory. The underlying API is a
// plain single-prompt completion endpoint (no messages array/roles), so
// memory is added by prepending a transcript of recent turns to the prompt.
async function askOpenAIWithMemory(getSetting, setSetting, chatId, prompt) {
    const history = getSetting(chatId, "chatbotHistory", []);

    let fullPrompt = prompt;
    if (history.length) {
        const transcript = history
            .map(turn => `User: ${turn.user}\nAssistant: ${turn.bot}`)
            .join('\n');
        fullPrompt = `Continue this conversation naturally. Here is the recent history:\n\n${transcript}\n\nUser: ${prompt}\nAssistant:`;
    }

    const answer = await askOpenAI(fullPrompt);

    const updatedHistory = [...history, { user: prompt, bot: answer }].slice(-6); // keep last 6 turns
    setSetting(chatId, "chatbotHistory", updatedHistory);

    return answer;
}
const crypto = require('crypto')
const googleTTS = require('google-tts-api')
const ffmpeg = require('fluent-ffmpeg')
const speed = require('performance-now')
const { spawn: spawn, exec } = require('child_process')
const timestampp = speed();
const jimp = require("jimp")
const latensi = speed() - timestampp
const moment = require('moment-timezone')
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const FormData = require('form-data');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { smsg, tanggal, getTime, isUrl, sleep, clockString, runtime, fetchJson, getBuffer, jsonformat, format, parseMention, getRandom, getGroupAdmins, generateProfilePicture } = require('./allfunc/storage')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid, addExif } = require('./allfunc/exif.js')
const richpic = fs.readFileSync(`./media/image1.jpg`)
const numberEmojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

// ============ CREATE REQUIRED DIRECTORIES ============
const requiredDirs = [
    './database',
    './database/pairing',
    './database/sessions',
    './tmp',
    './media'
];

requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});
// ====================================================

// ============ PERSISTENT STORAGE FOR MUTED USERS ============
const MUTED_FILE = './database/muted.json';

function loadMutedData() {
  try {
    if (!fs.existsSync(MUTED_FILE)) {
      fs.writeFileSync(MUTED_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(MUTED_FILE));
  } catch (e) {
    console.log('Error loading muted data:', e);
    return {};
  }
}

function saveMutedData(data) {
  try {
    fs.writeFileSync(MUTED_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.log('Error saving muted data:', e);
    return false;
  }
}

// Load existing muted data
global.muted = loadMutedData();
// ============================================================

// ============ SUDO FUNCTIONS ============
const SUDO_FILE = './database/sudo.json';

function loadSudoList() {
  if (!fs.existsSync(SUDO_FILE)) {
    fs.writeFileSync(SUDO_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(SUDO_FILE));
}

function saveSudoList(data) {
  fs.writeFileSync(SUDO_FILE, JSON.stringify(data, null, 2));
}
// ========================================

// ============ CHANNEL LOG FUNCTIONS ============
const CHANNELLOG_FILE = './database/channellog.json';

function loadChannelLog() {
    try {
        if (!fs.existsSync(CHANNELLOG_FILE)) fs.writeFileSync(CHANNELLOG_FILE, JSON.stringify({}));
        return JSON.parse(fs.readFileSync(CHANNELLOG_FILE));
    } catch (e) { return {}; }
}

function saveChannelLog(data) {
    try { fs.writeFileSync(CHANNELLOG_FILE, JSON.stringify(data, null, 2)); } catch (e) {}
}
// Structure: { 'userJid': { enabled: false, channels: ['jid@newsletter'] } }
// ===============================================

// ============ PREFIX FUNCTIONS ============
const PREFIX_FILE = './database/prefixes.json';

function loadPrefixes() {
  if (!fs.existsSync(PREFIX_FILE)) {
    fs.writeFileSync(PREFIX_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(PREFIX_FILE));
}

function savePrefixes(data) {
  fs.writeFileSync(PREFIX_FILE, JSON.stringify(data, null, 2));
}

function getUserPrefix(userId) {
  const prefixes = loadPrefixes();
  return prefixes[userId] || '.'; // Default to '.' if no custom prefix
}

function setUserPrefix(userId, prefix) {
  const prefixes = loadPrefixes();
  prefixes[userId] = prefix;
  savePrefixes(prefixes);
}

// ============ SESSION FUNCTIONS ============
const SESSION_FILE = './database/sessions.json';
const PAIRING_DIR = './database/pairing/';

function loadUsers() {
    try {
        if (!fs.existsSync(SESSION_FILE)) {
            fs.writeFileSync(SESSION_FILE, JSON.stringify([]));
        }
        return JSON.parse(fs.readFileSync(SESSION_FILE));
    } catch (e) {
        console.log('Error loading sessions:', e);
        return [];
    }
}

function getSession(userId) {
    try {
        const cleanId = userId.split('@')[0].replace(/[^0-9]/g, '');
        const sessionFiles = fs.readdirSync(PAIRING_DIR).filter(file => 
            file.includes(cleanId) || file.includes(userId)
        );
        
        if (sessionFiles.length > 0) {
            const sessionFile = sessionFiles[0];
            const sessionPath = path.join(PAIRING_DIR, sessionFile);
            const sessionData = JSON.parse(fs.readFileSync(sessionPath));
            
            return {
                user: { id: userId },
                id: userId,
                jid: userId,
                data: sessionData,
                sendMessage: async (jid, message) => {
                    try {
                        // Check if devtrust exists and is ready
                        if (typeof devtrust !== 'undefined' && devtrust && devtrust.sendMessage) {
                            return await devtrust.sendMessage(jid, message);
                        } else {
                            console.log(`⚠️ devtrust not ready yet for ${userId}, message queued`);
                            // Store message to send later (optional - you can implement a queue)
                            return null;
                        }
                    } catch (err) {
                        console.error(`SendMessage error for ${userId}:`, err);
                        return null;
                    }
                }
            };
        }
        return null;
    } catch (e) {
        console.log('Error getting session:', e);
        return null;
    }
}
// ========================================

// ============ GLOBAL VARIABLES ============
global.packname = (global.botConfig?.botName || process.env.BOT_NAME || "LËGĚNDÃRY BØT") + " MD";
global.author = "LËGĚNDÃRY Ł𝗮𝗯𝘀™";
// ============ GLOBAL VARIABLES FOR FEATURES ============
global.antispam = {};      // For anti-spam feature
global.warns = {};         // For warning system
global.muted = {};         // For mute system
global.banned = global.banned || {};  // For banned users
const tictactoeGames = {};
const hangmanGames = {};

// ============ SCROLLABLE TABLE HELPER ============
// Wraps the fork's native table-message support (confirmed working by boss's
// test) so any command can send a scrollable table without repeating the
// boilerplate. `rows` should include the header row as rows[0].
async function sendTable(sock, chatId, { title, headerText, rows, footerText, disclaimerText, contextMsg }) {
    return await sock.sendMessage(chatId, {
        disclaimerText: disclaimerText || 'Table',
        headerText: headerText || '',
        contentText: '---',
        title: title || '',
        table: rows,
        noHeading: false,
        footerText: footerText || ''
    }, contextMsg ? { quoted: contextMsg } : undefined);
}

// ============ MADRIN API HELPER ============
// Generic GET wrapper for api-madrin.zone.id endpoints. Response shapes are
// NOT consistent across endpoints (confirmed: ytmp3 is flat with
// `download_url` at the root; facebook nests everything under `.data`), so
// this returns the raw parsed body and each command handles its own shape —
// with fallbacks for common shapes where the real response hasn't been
// tested yet.
const MADRIN_BASE = 'https://api-madrin.zone.id';
const MADRIN_APIKEY = 'test';
async function madrinGet(endpoint, extraParams = {}, timeoutMs = 25000) {
    const res = await axios.get(`${MADRIN_BASE}${endpoint}`, {
        params: { apikey: MADRIN_APIKEY, ...extraParams },
        timeout: timeoutMs
    });
    return res.data;
}
// Pulls a usable link out of a response no matter which shape it came back
// in — flat `download_url`/`url`, or nested under `.data`/`.result`.
function madrinExtractLink(data) {
    if (!data) return null;
    return data.download_url || data.url || data.link
        || data?.data?.hd || data?.data?.sd || data?.data?.url || data?.data?.download_url
        || data?.result?.url || data?.result?.download_url || data?.result?.link
        || null;
}
function madrinExtractTitle(data, fallback = 'File') {
    if (!data) return fallback;
    return data.title || data?.data?.title || data?.result?.title || fallback;
}
const hangmanVisual = [
    "😃🪓______", "😃🪓__|____", "😃🪓__|/___",
    "😃🪓__|/__", "😃🪓__|/\\_", "😃🪓__|/\\_", "💀 Game Over!"
];
const { getSetting, setSetting } = require("./setting/Settings.js");
const groupCache = new Map();

// ============ ANTI-LINK SETTINGS - MOVED UP HERE ============
const ANTILINK_FILE = './database/antilink_settings.json';

function loadAntilinkSettings() {
    try {
        if (!fs.existsSync(ANTILINK_FILE)) {
            fs.writeFileSync(ANTILINK_FILE, JSON.stringify({}));
            console.log('📁 Created antilink_settings.json file');
        }
        const data = fs.readFileSync(ANTILINK_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.log('⚠️ Error loading antilink settings:', e.message);
        return {};
    }
}

function saveAntilinkSettings(settings) {
    try {
        fs.writeFileSync(ANTILINK_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (e) {
        console.log('⚠️ Error saving antilink settings:', e.message);
        return false;
    }
}

// Generate per-session antilink key — prevents collisions between users
function getAntilinkKey(botNum, chatId) {
    return `${botNum}::${chatId}`;
}

// Load antilink settings BEFORE anything else uses them
let antilinkSettings = loadAntilinkSettings();
// =========================================================


module.exports = devtrust = async (devtrust, m, chatUpdate, store) => {
const { from } = m
try {

// Per-instance bot name — falls back to the default if not configured
const botDisplayName = global.botConfig?.botName || process.env.BOT_NAME || "LËGĚNDÃRY BØT";

      
// Newsletter configuration
const NEWSLETTER_JID = '120363425882730200@newsletter';
const NEWSLETTER_NAME = `© ${botDisplayName} BY LËGĚNDÃRY Ł𝗮𝗯𝘀™`;

const addNewsletterContext = (messageContent) => {
  // Disabled: this used to stamp every reply as "forwarded" from a
  // promotional channel (isForwarded: true + forwardedNewsletterMessageInfo).
  // Now a plain passthrough so replies look like normal bot messages.
  return messageContent;
};

const replyWithNewsletter = async (jid, text, quotedMsg, mentions = []) => {
  try {
    await devtrust.sendMessage(jid, 
      addNewsletterContext({ 
        text: text,
        mentions: mentions 
      }), 
      { quoted: quotedMsg }
    );
  } catch (error) {
    console.error('Reply with newsletter error:', error);
    await devtrust.sendMessage(jid, 
      { text: text, mentions: mentions }, 
      { quoted: quotedMsg }
    );
  }
};

const reply = async (text, mentions = []) => {
  try {
    return await replyWithNewsletter(m.chat, text, m, mentions);
  } catch (error) {
    console.error('Reply failed:', error);
    return null;
  }
};

// ======================[ FIXED COMMAND DETECTION ]======================
const body = (
    m.mtype === "conversation" ? m.message?.conversation :
    m.mtype === "extendedTextMessage" ? m.message?.extendedTextMessage?.text :
    m.mtype === "imageMessage" ? m.message?.imageMessage?.caption :
    m.mtype === "videoMessage" ? m.message?.videoMessage?.caption :
    m.mtype === "documentMessage" ? m.message?.documentMessage?.caption || "" :
    m.mtype === "audioMessage" ? m.message?.audioMessage?.caption || "" :
    m.mtype === "stickerMessage" ? m.message?.stickerMessage?.caption || "" :
    m.mtype === "buttonsResponseMessage" ? m.message?.buttonsResponseMessage?.selectedButtonId :
    m.mtype === "listResponseMessage" ? m.message?.listResponseMessage?.singleSelectReply?.selectedRowId :
    m.mtype === "templateButtonReplyMessage" ? m.message?.templateButtonReplyMessage?.selectedId :
    m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg?.nativeFlowResponseMessage?.paramsJson).id :
    m.mtype === "messageContextInfo" ? m.message?.buttonsResponseMessage?.selectedButtonId ||
    m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || m.text :
    m.mtype === "reactionMessage" ? m.message?.reactionMessage?.text :
    m.mtype === "contactMessage" ? m.message?.contactMessage?.displayName :
    m.mtype === "contactsArrayMessage" ? m.message?.contactsArrayMessage?.contacts?.map(c => c.displayName).join(", ") :
    m.mtype === "locationMessage" ? `${m.message?.locationMessage?.degreesLatitude}, ${m.message?.locationMessage?.degreesLongitude}` :
    m.mtype === "liveLocationMessage" ? `${m.message?.liveLocationMessage?.degreesLatitude}, ${m.message?.liveLocationMessage?.degreesLongitude}` :
    m.mtype === "pollCreationMessage" ? m.message?.pollCreationMessage?.name :
    m.mtype === "pollUpdateMessage" ? m.message?.pollUpdateMessage?.name :
    m.mtype === "groupInviteMessage" ? m.message?.groupInviteMessage?.groupJid :
    m.mtype === "viewOnceMessage" ? (m.message?.viewOnceMessage?.message?.imageMessage?.caption ||
                                     m.message?.viewOnceMessage?.message?.videoMessage?.caption ||
                                     "[Pesan sekali lihat]") :
    m.mtype === "viewOnceMessageV2" ? (m.message?.viewOnceMessageV2?.message?.imageMessage?.caption ||
                                       m.message?.viewOnceMessageV2?.message?.videoMessage?.caption ||
                                       "[Pesan sekali lihat]") :
    m.mtype === "viewOnceMessageV2Extension" ? (m.message?.viewOnceMessageV2Extension?.message?.imageMessage?.caption ||
                                                m.message?.viewOnceMessageV2Extension?.message?.videoMessage?.caption ||
                                                "[Pesan sekali lihat]") :
    m.mtype === "ephemeralMessage" ? (m.message?.ephemeralMessage?.message?.conversation ||
                                      m.message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
                                      "[Pesan sementara]") :
    m.mtype === "interactiveMessage" ? "[Pesan interaktif]" :
    m.mtype === "protocolMessage" ? "[Pesan telah dihapus]" :
    ""
);


// ============ COMMAND DETECTION (PER-USER PREFIX) ============
const owner = JSON.parse(fs.readFileSync('./allfunc/owner.json'))
const Premium = JSON.parse(fs.readFileSync('./allfunc/premium.json'))
const ownerNumber = owner[0] || "254700000000";

// Read botowner.txt and merge with owner list for creator check
let botOwnerNumbers = [];
try {
    const botOwnerRaw = fs.readFileSync('./setting/botowner.txt', 'utf-8');
    botOwnerNumbers = botOwnerRaw.split('\n').map(n => n.trim()).filter(Boolean);
} catch(_) {}
const allOwners = [...new Set([...owner, ...botOwnerNumbers])];

// Get user-specific prefix from the new system
let prefix = getUserPrefix(m.sender);

// STRICT command detection - ONLY detect if message STARTS WITH user's prefix
const isCmd = body && typeof body === 'string' && body.startsWith(prefix);

let command = '';
let args = [];
let text = '';

if (isCmd) {
    // Extract command ONLY if it starts with user's prefix
    const afterPrefix = body.slice(prefix.length).trim();
    const parts = afterPrefix.split(/ +/);
    command = parts[0].toLowerCase();
    args = parts.slice(1);
    text = args.join(' ');
    
    console.log('✅ Command detected for user:', command);
}

const qtext = args.join(" ");
const q = args.join(" ");
const tempMailData = {};
const quoted = m.quoted ? m.quoted : m;
const from = m.key.remoteJid;

// ============ FRESH REQUIRE (no stale cache for commands/*.js) ============
// case.js hot-reloads itself via fs.watchFile at the bottom of this file,
// but that self-reload does NOT clear Node's require cache for files it
// requires internally (like commands/menu.js). Without this, editing files
// inside commands/ would need a full process kill+restart to take effect.
function freshRequire(relPath) {
    const resolved = require.resolve(relPath);
    delete require.cache[resolved];
    return require(resolved);
}

// ============ MENU LIST INTERCEPTOR (buttons/list taps) ============
// Handles taps from the paginated menu (commands/menu.js). Runs BEFORE the
// big switch(command) below, since rowIds like "OPEN_football" or
// "CMD_health_sleep_guide" never start with the user's prefix and would
// otherwise be silently ignored.
function slugToCamel(slug) {
    return slug.split('_').filter(Boolean).map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join('');
}

async function dispatchMenuCommand(sock, chatId, selectedId, sender) {
    // selectedId format: CMD_<categoryKey>_<slugified_item>
    const match = selectedId.match(/^CMD_([a-z]+)_(.+)$/);
    if (!match) return false;
    const [, categoryKey, slug] = match;
    const fnName = slugToCamel(slug);
    const readableTitle = slug.split('_').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    try {
        const mod = freshRequire(`./commands/${categoryKey}`);
        // 1) explicit menuMap (preferred — category files declare exactly which
        //    function answers which button, regardless of naming style).
        // 2) auto camelCase match (legacy behavior, e.g. football.js).
        const fn = (mod.menuMap && mod.menuMap[slug]) || mod[fnName];

        if (typeof fn === 'function') {
            // sender is passed as a 3rd arg for handlers that need to know who
            // tapped (e.g. games.js multiplayer challenges). Handlers that
            // don't need it simply ignore the extra argument.
            await fn(sock, chatId, sender);
            return true;
        }

        // 3) No dedicated handler yet — AI fallback instead of a dead placeholder.
        console.log(chalk.yellow(`⚠️ No handler for "${selectedId}" — using AI fallback`));
        let categoryName = categoryKey;
        try {
            const { MENU_DATA } = freshRequire('./commands/menu');
            if (MENU_DATA[categoryKey]) categoryName = MENU_DATA[categoryKey].name;
        } catch (_) {}

        const prompt = `You are a WhatsApp bot feature called "${readableTitle}" inside the "${categoryName}" category. A user just tapped this button with no extra input. Give a genuinely useful, well-formatted reply (light emoji use, under 150 words) for this exact feature. If the feature normally needs specific input (like a game name, city, or search term), briefly ask the user to send it instead of inventing fake data.`;
        const aiReply = await askOpenAI(prompt);
        await sock.sendMessage(chatId, { text: `${aiReply}\n\n_🤖 AI-generated for now — full feature coming soon_` });
        return true;
    } catch (e) {
        console.log(chalk.red(`❌ Menu dispatch error for ${selectedId}: ${e.message}`));
        await sock.sendMessage(chatId, { text: `🚧 This feature isn't available yet. Try another one for now!` });
        return true;
    }
}

if (m.mtype === 'listResponseMessage' || m.mtype === 'buttonsResponseMessage' || m.mtype === 'interactiveResponseMessage') {
    (async () => {
        try {
            const { handleMenuSelection } = freshRequire('./commands/menu');
            const handledNav = await handleMenuSelection(devtrust, from, body);
            if (handledNav) return;

            // group.js's own buttons (settings toggle, jail list, votekick vote)
            // — these ids never start with CMD_, so dispatchMenuCommand won't
            // see them; handleGroupSelection is the router that does.
            // groupMetadata is only actually needed for VK_VOTE_ taps — fetching
            // it unconditionally on every single button tap was hammering
            // WhatsApp's servers with redundant requests during fast tapping.
            const { handleGroupSelection } = freshRequire('./commands/group');
            const groupMetaForBtn = (m.isGroup && body && body.startsWith('VK_VOTE_'))
                ? await devtrust.groupMetadata(from).catch(() => null)
                : null;
            const handledGroupBtn = await handleGroupSelection(devtrust, from, body, {
                senderId: m.sender,
                groupMetadata: groupMetaForBtn
            });
            if (handledGroupBtn) return;

            if (body && body.startsWith('CMD_')) {
                await dispatchMenuCommand(devtrust, from, body, m.sender);
            }
        } catch (e) {
            console.log(chalk.red(`❌ Menu interceptor error: ${e.message}`));
        }
    })();
    return;
}

// ============ ACTIVE GAME REPLY INTERCEPTOR ============
// If this chat has a live game session (commands/games.js), plain text like
// "A", "42", or a guessed word should go to the game, not be ignored or
// misread as a menu number. Must run BEFORE the menu text-reply block below.
if (!isCmd && (m.mtype === 'conversation' || m.mtype === 'extendedTextMessage') && body && body.trim()) {
    const gamesMod = freshRequire('./commands/games');
    if (gamesMod.hasActiveGame(from)) {
        (async () => {
            try {
                await gamesMod.handleGameReply(devtrust, from, m.sender, body.trim());
            } catch (e) {
                console.log(chalk.red(`❌ Game reply error: ${e.message}`));
            }
        })();
        // This chat has an active game, so any non-prefixed text belongs to it
        // (a valid move, or an off-topic message the game safely ignores) —
        // stop here either way. Real prefixed commands (isCmd === true) never
        // reach this block, so .balance, .menu etc still work mid-game.
        return;
    }
}

// ============ SHAZAM DOWNLOAD REPLY INTERCEPTOR ============
// After .shazam identifies a song, this waits (60s) for the user to reply
// "audio"/"1" or "video"/"2" in THAT SAME chat before doing anything —
// gated the same way as the music interceptor so it can't fire on unrelated
// messages in other chats.
if (!isCmd && (m.mtype === 'conversation' || m.mtype === 'extendedTextMessage') && body && body.trim()) {
    const shzPending = global.__shazamPending && global.__shazamPending.get(from);
    if (shzPending && Date.now() <= shzPending.expires) {
        const shzChoice = body.trim().toLowerCase();
        if (shzChoice === 'audio' || shzChoice === '1' || shzChoice === 'video' || shzChoice === '2') {
            global.__shazamPending.delete(from);
            (async () => {
                try {
                    if (shzChoice === 'audio' || shzChoice === '1') {
                        reply('⏳ *Fetching audio...*');
                        const info = await ytdl.getInfo(shzPending.ytUrl);
                        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
                        await devtrust.sendMessage(from, { audio: { url: format.url }, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
                    } else {
                        reply('⏳ *Fetching video...*');
                        const info = await ytdl.getInfo(shzPending.ytUrl);
                        const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: f => f.hasAudio && f.hasVideo });
                        await devtrust.sendMessage(from, { video: { url: format.url }, caption: `*${shzPending.title}*` }, { quoted: m });
                    }
                } catch (e) {
                    console.log(chalk.yellow(`⚠️ Shazam download failed: ${e.message}`));
                    reply(`❌ *Download failed:* ${e.message}`);
                }
            })();
            return;
        }
    }
}

// ============ MUSIC SEARCH REPLY INTERCEPTOR ============
// Only fires if THIS chat actually tapped a music button (search/download)
// recently — checked via musicMod.getAwaitingMusic(from). Previously this
// ran unconditionally on any plain text in any chat, which is what caused
// random DMs and groups to get "music search" / "downloading mp3" replies.
if (!isCmd && (m.mtype === 'conversation' || m.mtype === 'extendedTextMessage') && body && body.trim()) {
    try {
        const musicMod = freshRequire('./commands/music');
        const awaiting = musicMod.getAwaitingMusic(from);
        if (awaiting) {
            const text = body.trim();

            if (awaiting === 'download') {
                (async () => {
                    try {
                        await musicMod.performMusicDownload(devtrust, from, text, m.sender);
                    } catch (e) {
                        console.log(chalk.yellow(`⚠️ Music download tried but failed: ${e.message}`));
                    }
                })();
            } else if (awaiting === 'search' && text.length > 1 && text.length < 100 && !/^\d+$/.test(text)) {
                (async () => {
                    try {
                        await musicMod.performMusicSearch(devtrust, from, text, m.sender);
                    } catch (e) {
                        console.log(chalk.yellow(`⚠️ Music search tried but failed: ${e.message}`));
                    }
                })();
            }
        }
    } catch (e) {
        console.log(chalk.yellow(`⚠️ Music module not ready: ${e.message}`));
    }
}

// Plain-text menu reply (e.g. "1", "next", "back", "menu") — only when the
// message ISN'T a real prefixed command, so normal commands are untouched.
if (!isCmd && (m.mtype === 'conversation' || m.mtype === 'extendedTextMessage') && body && body.trim()) {
    const menuMod = freshRequire('./commands/menu');
    const resolvedId = menuMod.resolveTextReply(from, body);
    if (resolvedId) {
        (async () => {
            try {
                const handledNav = await menuMod.handleMenuSelection(devtrust, from, resolvedId);
                if (handledNav) return;
                if (resolvedId.startsWith('CMD_')) {
                    await dispatchMenuCommand(devtrust, from, resolvedId, m.sender);
                }
            } catch (e) {
                console.log(chalk.red(`❌ Menu text-reply error: ${e.message}`));
            }
        })();
        return;
    }
}
// ============ END MENU LIST INTERCEPTOR ============
const sender = m.isGroup ? (m.key.participant ? m.key.participant : m.participant) : m.key.remoteJid;
const userMovieSessions = {};
const groupMetadata = m.isGroup ? await devtrust.groupMetadata(from).catch(() => null) : null;
const participants = m.isGroup ? groupMetadata?.participants || [] : [];
const groupAdmins = m.isGroup ? await getGroupAdmins(participants, devtrust) : [];
const botNumber = await devtrust.decodeJid(devtrust.user.id);
const botLid = devtrust.user?.lid ? await devtrust.decodeJid(devtrust.user.lid) : null;
const isCreator = [botNumber, ...allOwners].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
const isDev = allOwners.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
const isOwner = [botNumber, ...allOwners].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
const isPremium = [botNumber, ...Premium].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
const isSudo = loadSudoList().includes(m.sender);

// Private mode: only the owner and sudo users can use the bot when it's
// not set to public. This used to live in bot.js as a plain fromMe check,
// which silently blocked sudo users too since bot.js has no idea what
// sudo even is — moved here where isCreator/isSudo are actually known.
if (!devtrust.public && !m.fromMe && !isCreator && !isSudo) return;

const isBotAdmins = m.isGroup ? (groupAdmins.includes(botNumber) || (botLid && groupAdmins.includes(botLid))) : false;
const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;

// ===== PER-USER MUTE ENFORCEMENT =====
if (m.isGroup) {
    const mutedUsers = getSetting(m.chat, 'mutedUsers', []);
    if (mutedUsers.includes(m.sender) && !isAdmins && !isCreator) {
        try { await devtrust.sendMessage(m.chat, { delete: m.key }); } catch (_) {}
        return;
    }
}

// ===== AFK SYSTEM =====
try {
    // If the sender themselves was AFK, welcome them back and clear it.
    const myAfk = getSetting(m.sender, 'afk', null);
    if (myAfk && command !== 'afk') {
        setSetting(m.sender, 'afk', null);
        const mins = Math.floor((Date.now() - myAfk.since) / 60000);
        reply(`👋 Welcome back! You were AFK for ${mins} minute(s).`);
    }

    // If someone mentioned or replied to a currently-AFK user, let them know.
    const mentioned = m.mentionedJid || [];
    const repliedTo = m.quoted?.sender;
    const afkTargets = [...new Set([...mentioned, repliedTo].filter(Boolean))];
    for (const target of afkTargets) {
        if (target === m.sender) continue;
        const theirAfk = getSetting(target, 'afk', null);
        if (theirAfk) {
            const mins = Math.floor((Date.now() - theirAfk.since) / 60000);
            reply(`💤 @${target.split('@')[0]} is AFK: ${theirAfk.reason} (${mins}m ago)`, target ? [target] : []);
        }
    }
} catch (_) {}

// ===== AUTO-REPLY FILTER TRIGGER (pfilter/gfilter) =====
// .pfilter/.gfilter only ever saved entries before — nothing checked
// incoming messages against them. Wiring that up here.
try {
    const bodyText = (m.text || '').toLowerCase();
    if (bodyText) {
        if (!m.isGroup) {
            const filters = JSON.parse(fs.existsSync('./database/pfilter.json') ? fs.readFileSync('./database/pfilter.json') : '{}');
            for (const keyword in filters) {
                if (bodyText.includes(keyword)) {
                    reply(filters[keyword]);
                    break;
                }
            }
        } else {
            const gfFile = `./database/gfilter_${m.chat.replace(/[^0-9]/g, '')}.json`;
            const gfilters = JSON.parse(fs.existsSync(gfFile) ? fs.readFileSync(gfFile) : '{}');
            for (const keyword in gfilters) {
                if (bodyText.includes(keyword)) {
                    reply(gfilters[keyword]);
                    break;
                }
            }
        }
    }
} catch (_) {}


// ============ PER-MESSAGE GROUP HOOKS (group.js) ============
// Runs on every group message, command or not — groupCommands.js can't do
// this since it only fires for recognized commands. Awaited + can `return`
// early so a deleted spam/anti-feature violation never reaches the switch.
if (m.isGroup) {
    try {
        const groupCmds = freshRequire('./commands/group');
        const actioned = await groupCmds.handleAntiChecks(devtrust, m.chat, m, m.sender, isAdmins);
        if (actioned) return;

        groupCmds.trackActivity(m.chat, m.sender);
        if (/image|video|sticker/.test(m.mtype || '')) groupCmds.trackMedia(m.chat, m.sender);

        const rawText = m.text || m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        if (rawText) await groupCmds.handleGuess(devtrust, m.chat, m.sender, rawText);
    } catch (e) {
        console.log(chalk.red(`❌ Group per-message hook error: ${e.message}`));
    }
}
const groupName = m.isGroup ? groupMetadata?.subject || "" : "";
const pushname = m.pushName || "No Name";
const time = moment(Date.now()).tz('Africa/Lagos').locale('en').format('HH:mm:ss z');
const mime = (quoted.msg || quoted).mimetype || '';
const todayDateWIB = new Date().toLocaleDateString('id-ID', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// ============ STICKER HELPER FUNCTIONS ============
async function sendImageAsSticker(chatId, media, quoted, options = {}) {
    try {
        const sticker = new Sticker(media, {
            pack: options.packname || global.packname || botDisplayName,
            author: options.author || global.author || "LËGĚNDÃRY Ł𝗮𝗯𝘀™",
            type: StickerTypes.FULL,
            quality: 80,
            background: '#00000000'
        });
        const stickerBuffer = await sticker.toBuffer();
        await devtrust.sendMessage(chatId, { sticker: stickerBuffer }, { quoted });
        return true;
    } catch (error) {
        console.error('Image sticker error:', error);
        throw error;
    }
}

async function sendVideoAsSticker(chatId, media, quoted, options = {}) {
    try {
        const sticker = new Sticker(media, {
            pack: options.packname || global.packname || botDisplayName,
            author: options.author || global.author || "LËGĚNDÃRY Ł𝗮𝗯𝘀™",
            type: StickerTypes.FULL,
            quality: 50,
            background: '#00000000'
        });
        const stickerBuffer = await sticker.toBuffer();
        await devtrust.sendMessage(chatId, { sticker: stickerBuffer }, { quoted });
        return true;
    } catch (error) {
        console.error('Video sticker error:', error);
        throw error;
    }
}

// ============ STYLETEXT FUNCTION ============
async function styletext(text) {
    return [
        { name: 'Normal', result: text },
        { name: 'Bold', result: '**' + text + '**' },
        { name: 'Italic', result: '*' + text + '*' },
        { name: 'Strikethrough', result: '~' + text + '~' },
        { name: 'Monospace', result: '```' + text + '```' }
    ];
}

// ============ RANDOM COLOR FUNCTION ============
function randomColor() {
    const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'greenBright', 'yellowBright'];
    const colorIndex = Math.floor(Math.random() * colors.length);
    const colorName = colors[colorIndex];
    
    // Return chalk color function
    switch(colorName) {
        case 'red': return chalk.red;
        case 'green': return chalk.green;
        case 'yellow': return chalk.yellow;
        case 'blue': return chalk.blue;
        case 'magenta': return chalk.magenta;
        case 'cyan': return chalk.cyan;
        case 'white': return chalk.white;
        case 'greenBright': return chalk.greenBright;
        case 'yellowBright': return chalk.yellowBright;
        default: return chalk.white;
    }
}
// ==================================================
   
// BUG FUNCTIONS REMOVED TO ADD BUG FUNCTIONS / MAINTENANCE OF BOT CONTACT BASE OWNER 2348087253512 DON’T EDIT ANYTHING IN CASE WITH OUT THE OWNER NOTICE MAY CAUSE ERRRORS - BY ×͜× 𝙿𝚛𝚘𝚋𝚊𝚋𝚕𝚢 𝙱𝚞𝚜𝚢 永 𝙲𝙴𝙾 o̶f̶ Λ𝗫𝗜𝗦 Ł𝗮𝗯𝘀™


// ============ ACCOUNT FUNCTIONS ============
const ACCOUNT_FILE = './database/accounts.json';

function loadAccounts() {
  if (!fs.existsSync(ACCOUNT_FILE)) {
    fs.writeFileSync(ACCOUNT_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(ACCOUNT_FILE));
}

function saveAccounts(data) {
  fs.writeFileSync(ACCOUNT_FILE, JSON.stringify(data, null, 2));
}

// Ensure directories exist (SESSION_FILE and PAIRING_DIR already declared above)
if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
if (!fs.existsSync(PAIRING_DIR)) fs.mkdirSync(PAIRING_DIR, { recursive: true });

// ============ GLOBAL VARIABLES ============
const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);
const Richie = "LËGĚNDÃRY Ł𝗮𝗯𝘀™ 🥶";

global.packname = botDisplayName;
global.author = "LËGĚNDÃRY Ł𝗮𝗯𝘀™";

// ===== AUTO REACT (runs for ALL users, before private mode gate) =====
const _autoReactOn = getSetting(m.chat, "autoReact", false);
if (process.env.DEBUG_AUTOREACT) {
    console.log('[AutoReact Debug]', { chat: m.chat, settingOn: _autoReactOn, fromMe: m.key.fromMe });
}
if (_autoReactOn) {
    const emojis = [
        "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊",
        "😍", "😘", "😎", "🤩", "🤔", "😏", "😣", "😥", "😮", "🤐",
        "😪", "😫", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓",
        "😔", "😕", "🙃", "🤑", "😲", "😖", "😞", "😟", "😤", "😢",
        "😭", "😨", "😩", "🤯", "😬", "😰", "😱", "🥵", "🥶", "😳",
        "🤪", "🀄", "😠", "🀄", "😷", "🤒", "🤕", "🤢", "🤮", "🤧",
        "😇", "🥳", "🤠", "🤡", "🤥", "🤫", "🤭", "🧐", "🤓", "😈",
        "👿", "👹", "👺", "💀", "👻", "🖕", "🙏", "🤖", "🎃", "😺",
        "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "💋", "💌",
        "💘", "💝", "💖", "💗", "💓", "💞", "💕", "💟", "💔", "❤️"
    ];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    try {
        await devtrust.sendMessage(m.chat, {
            react: { text: randomEmoji, key: m.key },
        });
    } catch (err) {
        console.error('AutoReact error:', err.message);
    }
}
// =====================================================================

// ======================[ 🛡️ ANTI FEATURES — runs BEFORE public mode gate ]======================

// ── Shared helper: delete msg + take action ──────────────────────────────
async function antiAction(action, reason, warningEmoji, targetKey) {
    try { 
        await devtrust.sendMessage(m.chat, { 
            delete: targetKey || {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.sender
            }
        }); 
    } catch(e) {}
    if (action === 'kick') {
        try {
            await devtrust.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
            await reply(`👢 @${m.sender.split('@')[0]} was kicked for ${reason}`, [m.sender]);
        } catch(e) {
            await reply(`${warningEmoji} @${m.sender.split('@')[0]} ${reason} is not allowed here!\n_(Make me admin to enable kick mode)_`, [m.sender]);
        }
    } else {
        await reply(`${warningEmoji} @${m.sender.split('@')[0]} ${reason} is not allowed here!`, [m.sender]);
    }
}

// ── 1. ANTILINK ──────────────────────────────────────────────────────────
// NOTE: this block must always stay ABOVE the "if (!devtrust.public) { if (!isCreator) return }"
// gate further down in this file. It runs for every group message regardless of
// public/private mode, exactly like ANTIBADWORD below — do not move it under that gate.
if (m.isGroup && !isAdmins && !isCreator) {
    const groupSettings = antilinkSettings[getAntilinkKey(botNumber, m.chat)];
    if (groupSettings && groupSettings.enabled) {
        // NOTE: no /g flag — using /g with .test() causes stateful lastIndex bug
        const linkRegex = /https?:\/\/[^\s]+|www\.[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/[^\s]+|t\.me\/[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|io|gov|edu|xyz|tk|ml|ga|cf|gq|me|tv|cc|ws|club|online|site|tech|store|blog|live|app|co)[^\s]*/i;

        const checkTexts = [
            body,
            m.message?.conversation,
            m.message?.extendedTextMessage?.text,
            m.message?.imageMessage?.caption,
            m.message?.videoMessage?.caption,
            m.message?.documentMessage?.caption,
        ].filter(Boolean).join(' ');

        // WhatsApp's native "Invite via link" share sends a structured
        // groupInviteMessage (groupJid/inviteCode/groupName) — no URL string
        // anywhere in the text fields above, so the regex alone can't catch it.
        const isGroupInviteShare = m.mtype === 'groupInviteMessage' || !!m.message?.groupInviteMessage;

        if ((checkTexts && linkRegex.test(checkTexts)) || isGroupInviteShare) {
            // Same pattern as ANTIBADWORD: always attempt the delete directly,
            // unconditionally, instead of branching on isBotAdmins first.
            try {
                await devtrust.sendMessage(m.chat, { delete: m.key });
            } catch (e) {}

            if (groupSettings.action === 'kick') {
                try {
                    await devtrust.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
                    await reply(`👢 @${m.sender.split('@')[0]} was kicked for posting links`, [m.sender]);
                } catch (e) {
                    await reply(`⚠️ @${m.sender.split('@')[0]} Links are not allowed here!\n\n_Make me admin to enable kick mode_`, [m.sender]);
                }
            } else {
                await reply(`⚠️ @${m.sender.split('@')[0]} Links are not allowed here!`, [m.sender]);
            }
            return;
        }
    }
}

// ── 2. ANTI-TAG (includes WA @all feature) ───────────────────────────────
if (m.isGroup && !isAdmins && !isCreator) {
    const config = getSetting(botNumber + m.chat, "antitag", { enabled: false, action: 'delete' });
    if (config.enabled) {
        const allMentioned = [
            ...(m.mentionedJid || []),
            ...(m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []),
            ...(m.message?.imageMessage?.contextInfo?.mentionedJid || []),
            ...(m.message?.videoMessage?.contextInfo?.mentionedJid || []),
            ...(m.message?.conversation?.contextInfo?.mentionedJid || []),
        ];
        const uniqueMentioned = [...new Set(allMentioned)];

        const rawText2 = [
            m.message?.conversation,
            m.message?.extendedTextMessage?.text,
            m.message?.imageMessage?.caption,
            m.message?.videoMessage?.caption,
        ].filter(Boolean).join(' ');

        const signal1 = uniqueMentioned.includes('0@s.whatsapp.net');
        const signal2 = /@all\b|@everyone\b/i.test(rawText2);
        const signal3 = participants.length > 4 && uniqueMentioned.length >= participants.length;
        const signal4 = uniqueMentioned.some(j =>
            j === 'all@s.whatsapp.net' || j === 'all@broadcast' || j?.includes('@broadcast')
        );

        const isAtAll = signal1 || signal2 || signal3 || signal4;
        const isMassTag = uniqueMentioned.length > 5;

        if (isAtAll || isMassTag) {
            const reason = isAtAll ? 'using @all to tag everyone' : 'mass tagging members';
            await antiAction(config.action, reason, '🏷️');
            return;
        }
    }
}

// ── 3. ANTI-SPAM ────────────────────────────────────────────────────────
if (m.isGroup && !isAdmins && !isCreator) {
    const config = getSetting(botNumber + m.chat, "antispam", { enabled: false, action: 'delete' });
    if (config.enabled) {
        if (!global.antispam) global.antispam = {};
        if (!global.antispam[m.chat]) global.antispam[m.chat] = {};
        const spamUser = global.antispam[m.chat][m.sender];
        const now = Date.now();
        if (!spamUser) {
            global.antispam[m.chat][m.sender] = { count: 1, ts: now };
        } else {
            if (now - spamUser.ts < 5000) {
                spamUser.count++;
                if (spamUser.count >= 6) {
                    await antiAction(config.action, 'spamming', '🚫');
                    global.antispam[m.chat][m.sender] = { count: 0, ts: now };
                    return;
                }
            } else {
                global.antispam[m.chat][m.sender] = { count: 1, ts: now };
            }
        }
    }
}

// ── 4. ANTI-BOT ─────────────────────────────────────────────────────────
if (m.isGroup && body && !isAdmins && !isCreator) {
    const config = getSetting(botNumber + m.chat, "antibot", { enabled: false, action: 'delete' });
    if (config.enabled) {
        const botPrefixes = ['.', '!', '/', '#', '$', '%', '&', '*', '^', '~'];
        // Only flags a genuine unresolved device-suffix JID (e.g. "1234:5@s.whatsapp.net")
        // as bot-like — the old version used loose substring checks (.includes('bot'),
        // .includes('broadcast')) that could false-positive on real users, especially
        // @lid-format accounts, silently deleting their messages with zero reply.
        const rawJid = m.key?.participant || m.key?.remoteJid || '';
        const looksLikeBot = /:\d+@/.test(rawJid) || rawJid.endsWith('@broadcast');
        if (botPrefixes.some(p => body.startsWith(p)) && looksLikeBot) {
            await antiAction(config.action, 'using bot commands', '🤖');
            return;
        }
    }
}

// ── 5. ANTI-BEG ─────────────────────────────────────────────────────────
if (m.isGroup && !isAdmins && !isCreator) {
    const config = getSetting(botNumber + m.chat, "antibeg", { enabled: false, action: 'delete' });
    if (config.enabled) {
        const begCheckText = [
            body,
            m.message?.conversation,
            m.message?.extendedTextMessage?.text,
        ].filter(Boolean).join(' ');
        const begPatterns = [
            /bless me/i, /send me money/i, /give me money/i, /help me financially/i,
            /i need money/i, /i dey suffer/i, /no money/i, /hungry dey catch me/i,
            /send me airtime/i, /buy me data/i, /fund me/i, /donate to me/i,
            /my account number/i, /send cash/i, /poor me/i,
            /assist me financially/i, /anything for me/i,
            /broke as hell/i, /i am starving/i, /no food/i
        ];
        if (begCheckText && begPatterns.some(p => p.test(begCheckText))) {
            await antiAction(config.action, 'begging', '💰');
            return;
        }
    }
}

// ── 6. ANTIBADWORD ──────────────────────────────────────────────────────
if (getSetting(botNumber + m.chat, "feature.antibadword", false) && m.isGroup && !isAdmins && !isCreator) {
   const badWords = ["fuck", "bitch", "sex", "nigga","bastard","fool","mumu","idiot","werey","mother","mama","ass","mad","dick","pussy","bast"];
   const badWordCheckText = [
       body,
       m.message?.conversation,
       m.message?.extendedTextMessage?.text,
       m.message?.imageMessage?.caption,
       m.message?.videoMessage?.caption,
       m.message?.documentMessage?.caption,
   ].filter(Boolean).join(' ').toLowerCase();
   if (badWordCheckText && badWords.some(word => badWordCheckText.includes(word))) {
      try { await devtrust.sendMessage(m.chat, { delete: m.key }); } catch(e) {}
      await reply(`❌ @${m.sender.split('@')[0]} watch your language 😟!`, [m.sender]);
   }
}

// =====================================================================

if (!devtrust.public) {
    if (!isCreator) return
}

// SPECIAL CHECK: If user types ONLY the default "." - show THEIR current prefix
// (placed here, below the private-mode gate, so it doesn't leak replies to
// non-owner users/groups while the bot is in private mode)
if (body && body.trim() === '.') {
    reply(`🔧 *Your current prefix:* \`${prefix}\`\n_You can change it using_ \`${prefix}setprefix [new]\``);
    return;
}

const example = (teks) => {
    return `Usage : *${prefix+command}* ${teks}`
}

let antilinkStatus = {};
if (!global.banned) global.banned = {} // stores banned users JIDs

if (getSetting(m.sender, "autobio", true)) {
    devtrust.updateProfileStatus(`${botDisplayName} IS HERE`).catch(_ => _)
}

if (isCmd) {
    console.log(chalk.black(chalk.bgWhite('[ Λ𝗫𝗜𝗦 𝗫𝗠𝗗 ]')), chalk.black(chalk.bgGreen(new Date)), chalk.black(chalk.bgBlue(body || m.mtype)) + '\n' + chalk.magenta('=> From'), chalk.green(pushname), chalk.yellow(m.sender) + '\n' + chalk.blueBright('=>In'), chalk.green(m.isGroup ? pushname : 'Private Chat', m.chat))
}


if (getSetting(m.chat, "autoTyping", false)) {
    devtrust.sendPresenceUpdate('composing', from)
}
if (getSetting(m.chat, "autoRecording", false)) {
    devtrust.sendPresenceUpdate('recording', from)
}
if (getSetting(m.chat, "autoRecordType", false)) {
    let xeonrecordin = ['recording','composing']
    let xeonrecordinfinal = xeonrecordin[Math.floor(Math.random() * xeonrecordin.length)]
    devtrust.sendPresenceUpdate(xeonrecordinfinal, from)
}
     
//----------------------Func End----------------//
if (getSetting(m.sender, "autoViewStatus", false) && m.key.remoteJid === "status@broadcast") {
    try {
        await devtrust.readMessages([m.key]);
        console.log(`👀 Viewed status from: ${m.key.participant}`);
    } catch (err) {
        console.log("❌ Error viewing status:", err);
    }
}

if (getSetting(m.chat, "autoRecording", false)) {
    devtrust.sendPresenceUpdate('recording', from)
}  
    
if (getSetting(m.chat, "autoTyping", false)) {
    devtrust.sendPresenceUpdate('composing', from)
}

if (getSetting(m.chat, "autoRecordType", false)) {
    let xeonrecordin = ['recording','composing']
    let xeonrecordinfinal = xeonrecordin[Math.floor(Math.random() * xeonrecordin.length)]
    devtrust.sendPresenceUpdate(xeonrecordinfinal, from)
}

if (getSetting(m.sender, "autoread", false)) {
   try {
      await devtrust.readMessages([m.key]) 
   } catch (e) {
      console.log("Auto-Read Error:", e)
   }
}

// ======================[ BANNED USERS CHECK ]======================
if (getSetting(m.sender, "banned", false)) {
    await reply(`⛔ You are banned from using this bot, @${m.sender.split('@')[0]}`, [m.sender])
    return
}

// ======================[ 🔇 MUTED USERS CHECK ]======================
if (m.isGroup && global.muted?.[m.chat]?.includes(m.sender) && !isAdmins && !isCreator) {
    await devtrust.sendMessage(m.chat, { delete: m.key });
    return;
}

if (getSetting(botNumber + m.chat, "feature.autoreply", false)) {
   const autoReplyList = { 
       "hi": "Hello 👋", 
       "hello": "Hi there!", 
       "I am ${botDisplayName}": "Coolest Whatsapp bot 😌" 
   }
   if (autoReplyList[m.text?.toLowerCase()]) {
      await reply(autoReplyList[m.text.toLowerCase()])
   }
}

// ======================[ 🤖 AI CHATBOT (auto-reply) ]======================
const chatbotGlobalOn = getSetting(botNumber, "feature.chatbot.global", false);
const chatbotChatOn = getSetting(botNumber + m.chat, "feature.chatbot.enabled", false);

if ((chatbotGlobalOn || chatbotChatOn) && !isCmd && m.text) {
    const allMentioned = [
        ...(m.mentionedJid || []),
        ...(m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []),
    ];
    const botDigits = botNumber.split('@')[0];
    const botWasTagged = allMentioned.some(jid => jid.split('@')[0] === botDigits)
        || (m.text && m.text.includes(botDigits));
    const repliedToBot = m.quoted && m.quoted.fromMe;
    const shouldReply = !m.isGroup || botWasTagged || repliedToBot;

    if (shouldReply) {
        try {
            await devtrust.sendPresenceUpdate('composing', m.chat);
            const answer = await askOpenAIWithMemory(getSetting, setSetting, m.chat, m.text);
            await devtrust.sendMessage(m.chat, { text: answer });
        } catch (e) {
            console.log(chalk.red(`Chatbot reply error: ${e.message}`));
            let errMsg = "🤖 Sorry, I couldn't process that right now.";
            if (e.code === 'ECONNABORTED' || /timeout/i.test(e.message)) {
                errMsg = "🤖 That took too long to respond — try again?";
            } else if (e.response?.status === 429) {
                errMsg = "🤖 I'm getting a lot of requests right now — give me a moment and try again.";
            } else if (e.response?.status >= 500) {
                errMsg = "🤖 The AI service is having issues right now, not your fault — try again shortly.";
            }
            try {
                await devtrust.sendMessage(m.chat, { text: errMsg });
            } catch (_) {}
        }
    }
}

//LOADING FUNCTION
async function nexusLoading() {
    const nexusMylove = [`Loading menu...`];
    let msg = await devtrust.sendMessage(from, { text: "Connecting to Λ𝗫𝗜𝗦 𝗫𝗠𝗗 server....." });

    for (let i = 0; i < nexusMylove.length; i++) {
        await devtrust.sendMessage(from, {
            text: nexusMylove[i],
            edit: msg.key
        });
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

// Newsletter JIDs to auto-react to
const newsletterJids = ["120363406376026638@newsletter"];
const newsletterEmojis = [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', 
    '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🥺', '😊', '🙏', 
    '😙', '😻', '🔥', '😀', '😍', '🥰', '😘', '🤗', '🤩', '😎', '😇', 
    '🥶','🥳', '😋', '🎉', '🔥'
];

const hansRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ============ REGISTER ONCE GUARD ============
// Prevents duplicate listeners every time a message comes in
// Guard lives on the devtrust (socket) instance itself, not global,
// so each paired number gets its own listener exactly once.
if (!devtrust._newsletterListenerReady) {
    devtrust._newsletterListenerReady = true;
// =============================================

    devtrust.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages?.[0];
            if (!msg) return;
            const sender = msg.key.remoteJid;

            // Auto-react to followed newsletters
            if (!msg.key.fromMe && newsletterJids.includes(sender)) {
                if (getSetting(devtrust.decodeJid(devtrust.user.id), 'autoReactChannel', false)) {
                    const serverId = msg.newsletterServerId;
                    if (serverId) {
                        const emoji = hansRandom(newsletterEmojis);
                        await devtrust.newsletterReactMessage(sender, serverId.toString(), emoji);
                    }
                }
            }

            // ===== CHANNEL LOG ALERT =====
            if (sender && sender.endsWith('@newsletter')) {
                try {
                    const clData = loadChannelLog();
                    const currentBotJid = devtrust.user?.id ? devtrust.decodeJid(devtrust.user.id) : null;
                    if (currentBotJid && clData[currentBotJid]?.enabled) {

                        // Prevent spam — only process each message ID once
                        const msgId = msg.key.id;
                        if (!global.processedChannelMsgs) global.processedChannelMsgs = new Set();
                        if (global.processedChannelMsgs.has(msgId)) return;
                        global.processedChannelMsgs.add(msgId);
                        if (global.processedChannelMsgs.size > 500) {
                            const first = global.processedChannelMsgs.values().next().value;
                            global.processedChannelMsgs.delete(first);
                        }

                        // ── Fetch channel metadata (name + admin list) ──
                        let channelName = sender;
                        let adminsList = [];
                        try {
                            const nlMeta = await devtrust.newsletterMetadata('jid', sender).catch(() => null);
                            if (nlMeta) {
                                if (nlMeta.name) channelName = nlMeta.name;
                                else if (nlMeta.handle) channelName = '@' + nlMeta.handle;
                                const subs = nlMeta.subscribers || nlMeta.members || nlMeta.admins || [];
                                for (const sub of subs) {
                                    const role = (sub.role || sub.type || '').toString().toLowerCase();
                                    if (role.includes('admin') || role.includes('owner')) {
                                        const jid = sub.id || sub.jid || '';
                                        if (jid) adminsList.push({
                                            number: jid.replace(/@[^@]+$/, ''),
                                            name: sub.name || sub.display_name || null
                                        });
                                    }
                                }
                            }
                        } catch (_) {}

                        // ── Who posted ──
                        let adminNumber = null;
                        let adminName   = null;

                        const rawAdminJid =
                            msg.key?.participant ||
                            msg.participant ||
                            msg.message?.extendedTextMessage?.contextInfo?.participant ||
                            msg.message?.imageMessage?.contextInfo?.participant ||
                            msg.message?.videoMessage?.contextInfo?.participant ||
                            msg.message?.audioMessage?.contextInfo?.participant ||
                            msg.message?.documentMessage?.contextInfo?.participant ||
                            null;

                        if (rawAdminJid && rawAdminJid !== sender) {
                            adminNumber = rawAdminJid.replace(/@[^@]+$/, '');
                            adminName   = msg.pushName || adminNumber;
                        }

                        if (!adminNumber && msg.key?.fromMe) {
                            adminNumber = currentBotJid.replace(/@[^@]+$/, '');
                            adminName   = 'You (Bot / ' + adminNumber + ')';
                        }

                        let phoneDisplay;
                        if (adminNumber) {
                            phoneDisplay = '+' + adminNumber.replace(/^\+/, '');
                            if (adminName && adminName !== adminNumber) phoneDisplay += ' (' + adminName + ')';
                        } else if (adminsList.length > 0) {
                            phoneDisplay = '_Posted by one of the channel admins:_\n' +
                                adminsList.map(a => '  • +' + a.number + (a.name ? ' (' + a.name + ')' : '')).join('\n');
                            adminName = 'Channel Admin';
                        } else {
                            phoneDisplay = '_Not available (bot is not a channel admin)_';
                            adminName = msg.pushName || 'Channel Admin';
                        }

                        const timeNow = moment(Date.now()).tz('Africa/Lagos').format('DD/MM/YYYY HH:mm:ss z');

                        let contentInfo = '';
                        const msgContent = msg.message || {};
                        if (msgContent.conversation) contentInfo = '📝 *Text:* ' + msgContent.conversation;
                        else if (msgContent.extendedTextMessage) contentInfo = '📝 *Text:* ' + msgContent.extendedTextMessage.text;
                        else if (msgContent.imageMessage) contentInfo = '🖼️ *Image*' + (msgContent.imageMessage.caption ? '\n📝 *Caption:* ' + msgContent.imageMessage.caption : '');
                        else if (msgContent.videoMessage) contentInfo = '🎥 *Video*' + (msgContent.videoMessage.caption ? '\n📝 *Caption:* ' + msgContent.videoMessage.caption : '');
                        else if (msgContent.audioMessage) contentInfo = '🎵 *Audio/Voice Note*';
                        else if (msgContent.documentMessage) contentInfo = '📄 *Document:* ' + (msgContent.documentMessage.fileName || 'File');
                        else if (msgContent.stickerMessage) contentInfo = '🎭 *Sticker*';
                        else contentInfo = '📦 *Media/Other*';

                        const alertMsg =
                            '📢 *CHANNEL ACTIVITY ALERT*\n' +
                            '━━━━━━━━━━━━━━━━━━━━━━\n' +
                            '📺 *Channel:* ' + channelName + '\n' +
                            '👤 *Posted by:* ' + adminName + '\n' +
                            '📞 *Phone:* ' + phoneDisplay + '\n' +
                            '⏰ *Time:* ' + timeNow + '\n' +
                            '━━━━━━━━━━━━━━━━━━━━━━\n' +
                            contentInfo;

                        await devtrust.sendMessage(currentBotJid, { text: alertMsg });
                    }
                } catch (e) {
                    console.log('Channel log error:', e.message);
                }
            }
            // =============================

        } catch (err) {
            console.error("❌ Newsletter handler error:", err);
        }
    });
}

if (m.message) {
    console.log(chalk.hex('#3498db')(`message "${m.text || m.body || '<media/no text>'}" from ${pushname} id ${m.isGroup ? `group ${groupMetadata?.subject || 'Unknown Group'}` : 'private chat'}`));
}

// ===== ANTI-DELETE SYSTEM =====
if (!devtrust._antiDeleteListenersReady) {
    devtrust._antiDeleteListenersReady = true;
    const messageStore = new Map(); // Store recent messages for anti-delete

    // Store messages as they come in
    devtrust.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.message) continue;
            if (msg.key.fromMe) continue;
            // Store message for 10 minutes
            messageStore.set(msg.key.id, {
                msg,
                chat: msg.key.remoteJid,
                sender: msg.key.participant || msg.key.remoteJid,
                timestamp: Date.now()
            });
            // Clean old messages (older than 10 mins)
            for (const [id, data] of messageStore.entries()) {
                if (Date.now() - data.timestamp > 600000) messageStore.delete(id);
            }
        }
    });

    // Catch deleted messages
    devtrust.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
        try {
            if (!update.update?.message) continue;
            const isRevoked = update.update.message?.protocolMessage?.type === 0;
            if (!isRevoked) continue;

            const deletedId = update.update.message.protocolMessage?.key?.id;
            if (!deletedId) continue;

            const stored = messageStore.get(deletedId);
            if (!stored) continue;

            const { msg, chat, sender } = stored;

            // Check if antiDelete is on — find which user enabled it
            // Check sender's setting first, then global bot setting
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const senderNumber = senderJid.split('@')[0];
            
            // Check if the person who sent the deleted msg has antidelete on
            // OR if the chat owner (bot user) has it on globally
            const antiDeleteEnabled = getSetting(senderJid, 'antiDelete', false) || 
                                      getSetting(chat, 'antiDelete', false) ||
                                      getSetting(botNumber, 'antiDelete', false) ||
                                      (chat === 'status@broadcast' && getSetting(botNumber, 'antiDeleteStatus', false));
            
            if (!antiDeleteEnabled) continue;

            // Send to the session user (person who paired the bot), not owner
            // Each Baileys session has their own number as botNumber
            const ownerJid = botNumber.includes('@') ? botNumber : botNumber + '@s.whatsapp.net';
            const senderName = msg.pushName || sender.split('@')[0];
            const chatName = chat === 'status@broadcast' ? 'Status' : (chat.endsWith('@g.us') ? 'Group' : 'DM');

            let caption = `🗑️ *ANTI-DELETE${chatName === 'Status' ? ' — STATUS' : ''}*\n\n` +
                `👤 *Sender:* ${senderName}\n` +
                `📍 *Chat:* ${chatName}\n` +
                `🕐 *Time:* ${new Date().toLocaleString()}\n\n` +
                `*Deleted Message:*`;

            const msgContent = msg.message;
            const mtype = Object.keys(msgContent)[0];

            if (mtype === 'conversation' || mtype === 'extendedTextMessage') {
                const text = msgContent.conversation || msgContent.extendedTextMessage?.text;
                await devtrust.sendMessage(ownerJid, {
                    text: caption + '\n' + text
                });
            } else if (mtype === 'imageMessage') {
                try {
                    const buffer = await devtrust.downloadMediaMessage(msg);
                    await devtrust.sendMessage(ownerJid, {
                        image: buffer,
                        caption: caption
                    });
                } catch {
                    await devtrust.sendMessage(ownerJid, { text: caption + '\n[Image - could not retrieve]' });
                }
            } else if (mtype === 'videoMessage') {
                try {
                    const buffer = await devtrust.downloadMediaMessage(msg);
                    await devtrust.sendMessage(ownerJid, {
                        video: buffer,
                        caption: caption
                    });
                } catch {
                    await devtrust.sendMessage(ownerJid, { text: caption + '\n[Video - could not retrieve]' });
                }
            } else if (mtype === 'audioMessage') {
                try {
                    const buffer = await devtrust.downloadMediaMessage(msg);
                    await devtrust.sendMessage(ownerJid, {
                        audio: buffer,
                        mimetype: 'audio/mpeg',
                        caption: caption
                    });
                } catch {
                    await devtrust.sendMessage(ownerJid, { text: caption + '\n[Audio - could not retrieve]' });
                }
            } else if (mtype === 'stickerMessage') {
                try {
                    const buffer = await devtrust.downloadMediaMessage(msg);
                    await devtrust.sendMessage(ownerJid, { sticker: buffer });
                    await devtrust.sendMessage(ownerJid, { text: caption + '\n[Sticker above]' });
                } catch {
                    await devtrust.sendMessage(ownerJid, { text: caption + '\n[Sticker - could not retrieve]' });
                }
            } else {
                await devtrust.sendMessage(ownerJid, { text: caption + `\n[${mtype}]` });
            }

            messageStore.delete(deletedId);
        } catch (err) {
            console.error('[AntiDelete] Error:', err.message);
        }
    }
});
} // end devtrust._antiDeleteListenersReady guard

// ===== WELCOME / GOODBYE SYSTEM =====
if (!devtrust._welcomeListenerReady) {
    devtrust._welcomeListenerReady = true;
    const welcomeCooldown = new Set();

    devtrust.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;

            if (!getSetting(id, "welcome")) return;

        const metadata = await devtrust.groupMetadata(id);
        const groupName = metadata.subject || "the group";
        const memberCount = metadata.participants.length;

        for (let user of participants) {

            // Fix object/string issue
            const userId = typeof user === "string" ? user : user.id;

            if (!userId) continue;

            const tag = `@${userId.split('@')[0]}`;

            // Prevent duplicate triggers
            const key = `${id}-${userId}-${action}`;
            if (welcomeCooldown.has(key)) continue;

            welcomeCooldown.add(key);

            setTimeout(() => {
                welcomeCooldown.delete(key);
            }, 5000);

            if (action === "add") {

                const customMsg = getSetting(id, "welcomeMessage", null);

                const defaultText =
`╭───〔 ${groupName} 〕───╮
│ 👋 Welcome ${tag}!
│ 👥 Member #${memberCount}
│
│ Please read the group description.
╰────────────────────────╯`;

                const text = customMsg
                    ? customMsg
                        .replace(/@user/g, tag)
                        .replace(/@gname/g, groupName)
                        .replace(/@count/g, memberCount)
                    : defaultText;

                // Try to attach the new member's profile picture — falls back
                // to plain text if they don't have one or it's private.
                let pfpUrl = null;
                try {
                    pfpUrl = await devtrust.profilePictureUrl(userId, 'image');
                } catch (_) {
                    pfpUrl = null;
                }

                if (pfpUrl) {
                    await devtrust.sendMessage(id, {
                        image: { url: pfpUrl },
                        caption: text,
                        mentions: [userId]
                    });
                } else {
                    await devtrust.sendMessage(id, {
                        text,
                        mentions: [userId]
                    });
                }

            }

            if (action === "remove") {

                const customMsg = getSetting(id, "goodbyeMessage", null);

                const defaultText =
`╭───〔 ${groupName} 〕───╮
│ 👋 ${tag} left the group
│ 👥 Members remaining: ${memberCount}
╰────────────────────────╯`;

                const text = customMsg
                    ? customMsg
                        .replace(/@user/g, tag)
                        .replace(/@gname/g, groupName)
                        .replace(/@count/g, memberCount)
                    : defaultText;

                let pfpUrl = null;
                try {
                    pfpUrl = await devtrust.profilePictureUrl(userId, 'image');
                } catch (_) {
                    pfpUrl = null;
                }

                if (pfpUrl) {
                    await devtrust.sendMessage(id, {
                        image: { url: pfpUrl },
                        caption: text,
                        mentions: [userId]
                    });
                } else {
                    await devtrust.sendMessage(id, {
                        text,
                        mentions: [userId]
                    });
                }

            }
        }

    } catch (err) {
        console.log("Group update error:", err);
    }
});
} // end devtrust._welcomeListenerReady guard

// ===== ANTI-CALL SYSTEM =====
// Toggle with .anticall on / .anticall off (owner-only, checked in the command handler).
// Default: off, so existing deploys don't suddenly start rejecting calls.
if (!devtrust._antiCallListenerReady) {
    devtrust._antiCallListenerReady = true;
    devtrust.ev.on('call', async (calls) => {
        const enabled = getSetting('bot', 'anticall', false);
        if (!enabled) return;
        for (const call of calls) {
            if (call.status !== 'offer') continue;
            try {
                await devtrust.rejectCall(call.id, call.from);
                await devtrust.sendMessage(call.from, {
                    text: `📵 *Calls are not allowed on this number.*\n\nThis is a bot account — please send a text message instead.`
                });
            } catch (e) {
                console.log(`Anti-call error: ${e.message}`);
            }
        }
    });
}

// ======================[ ⚠️ WARN SYSTEM HELPER ]======================
async function handleWarn(chatId, userId, reason, mode) {
    if (!global.warns[chatId]) global.warns[chatId] = {};
    if (!global.warns[chatId][userId]) global.warns[chatId][userId] = 0;
    
    // MODE 1: DELETE ONLY - no warnings
    if (mode === 'delete') {
        return { action: 'delete', kicked: false };
    }
    
    // MODE 2: WARN - add warning
    if (mode === 'warn') {
        global.warns[chatId][userId] += 1;
        const warnCount = global.warns[chatId][userId];
        
        // Check if reached 3 warnings
        if (warnCount >= 3) {
            // Reset warns
            delete global.warns[chatId][userId];
            return { action: 'kick', kicked: true, warnCount };
        }
        
        return { action: 'warn', kicked: false, warnCount };
    }
    
    // MODE 3: KICK - immediate kick
    if (mode === 'kick') {
        return { action: 'kick', kicked: true, warnCount: 0 };
    }
    
    return { action: 'delete', kicked: false };
}

// ============ MENU HELPER FUNCTIONS ============

function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;
    return time.trim();
}

function formatRam(total, free) {
    const used = (total - free) / (1024 * 1024 * 1024);
    const totalGb = total / (1024 * 1024 * 1024);
    const percent = ((used / totalGb) * 100).toFixed(1);
    return `${used.toFixed(1)}GB / ${totalGb.toFixed(1)}GB (${percent}%)`;
}

function countCommands() {
    try {
        const caseFileContent = fs.readFileSync(__filename).toString();
        // Count all unique case statements
        const commandRegex = /case ['"]([^'"]+)['"]:/g;
        const matches = [...caseFileContent.matchAll(commandRegex)];
        const uniqueCommands = new Set(matches.map(match => match[1]));
        const count = uniqueCommands.size;
        console.log(`📊 Total commands detected: ${count}`);
        return count;
    } catch (e) {
        console.error('Error counting commands:', e);
        return 4; // Your actual command count
    }
}

function getMoodEmoji() {
    const hour = getLagosTime().getHours();
    if (hour < 12) return '🌅';
    if (hour < 18) return '☀️';
    return '🌙';
}

function getLagosTime() {
    try {
        const options = {
            timeZone: 'Africa/Lagos',
            hour12: false,
            hour: 'numeric',
            minute: 'numeric'
        };
        const formatter = new Intl.DateTimeFormat('en-GB', options);
        const parts = formatter.formatToParts(new Date());
        const hour = parts.find(part => part.type === 'hour').value;
        const minute = parts.find(part => part.type === 'minute').value;
        const now = new Date();
        const lagosDate = new Date(now.toLocaleString('en-US', {timeZone: 'Africa/Lagos'}));
        return lagosDate;
    } catch (error) {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + (3600000 * 1));
    }
}

// FIXED: Changed variable name from "penis" to avoid issues
const caseFileContent = fs.readFileSync(__filename).toString();
const matches = caseFileContent.match(/case '[^']+'(?!.*case '[^']+')/g) || [];
const caseCount = matches.length;
const caseNames = matches.map(match => match.match(/case '([^']+)'/)[1]);
let totalCases = caseCount;
let listCases = caseNames.join('\n⭔ '); 

async function autoJoinGroup(devtrust, inviteLink) {
  try {
    const inviteCode = inviteLink.match(/([a-zA-Z0-9_-]{22})/)?.[1];
    if (!inviteCode) {
      throw new Error('Invalid invite link');
    }
    const result = await devtrust.groupAcceptInvite(inviteCode);
    console.log('✅ Joined group:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to join group:', error.message);
    return null;
  }
}

function formatLagosTime() {
    const lagosTime = getLagosTime();
    const hours = lagosTime.getHours().toString().padStart(2, '0');
    const minutes = lagosTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// ============ GET PROFESSIONAL FEATURES ============

function getOwnerName() {
    return "LËGĚNDÃRY Ł𝗮𝗯𝘀™";
}

function getBotVersion() {
    return "1";
}

function getBotMode() {
    return devtrust.public ? "PUBLIC" : "PRIVATE";
}

function getCurrentDateTime() {
    const date = new Date();
    const options = { 
        timeZone: 'Africa/Lagos',
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    return date.toLocaleString('en-US', options) + ' WAT';
}

// ============ GROUP COMMANDS (groupCommands.js) ============
try {
    const groupCmds = require("./groupCommands");
    const handled = await groupCmds(devtrust, m, {
        command, args, text, prefix, reply,
        isAdmins, isCreator, isBotAdmins,
        participants, groupMetadata, pushname,
        getSetting, setSetting
    });
    if (handled !== false) return;
} catch(e) {
    console.log("groupCommands error:", e.message);
}

// ============ PLUGIN LOADER (community plugins from ./plugins/) ============
function loadPlugins() {
    const pluginsDir = path.join(__dirname, 'plugins');
    const map = {};
    if (!fs.existsSync(pluginsDir)) return map;

    for (const file of fs.readdirSync(pluginsDir)) {
        if (!file.endsWith('.js')) continue;
        try {
            const plugin = freshRequire(`./plugins/${file}`);
            if (!plugin?.cmd || !plugin?.handler) continue;

            const aliases = Array.isArray(plugin.cmd) ? plugin.cmd : String(plugin.cmd).split('|');
            for (const alias of aliases) {
                map[alias.trim().toLowerCase()] = plugin;
            }
        } catch (e) {
            console.log(chalk.red(`⚠️ Plugin load error (${file}): ${e.message}`));
        }
    }
    return map;
}

if (isCmd && command) {
    const pluginMap = loadPlugins();
    const matchedPlugin = pluginMap[command];

    if (matchedPlugin) {
        try {
            await matchedPlugin.handler(m, args, text, {
                reply, prefix, isCreator, isSudo, isAdmins, isBotAdmins,
                devtrust, getSetting, setSetting, botNumber
            });
        } catch (e) {
            await reply(`❌ *Plugin error:* ${e.message}`);
            console.log(chalk.red(`Plugin execution error (${command}): ${e.message}`));
        }
        return;
    }
}

// ============ MENU COMMAND ============

// React ✅️ to every command as soon as it's recognized, before running it.
if (isCmd && command) {
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '✅️', key: m.key } });
    } catch (e) {
        console.log(chalk.yellow(`⚠️ Command reaction failed: ${e.message}`));
    }
}

switch(command) {
// ============ CONTACT BASE OWNER ×͜× 𝙿𝚛𝚘𝚋𝚊𝚋𝚕𝚢 𝙱𝚞𝚜𝚢 永 FOR MAINTENANCE 2348087253512 - DON'T ANYTHING MIGHT GIVE ERRORS ============

case 'allmenu':
case 'legend':
case 'menu': {

    const { sendMainMenu } = freshRequire('./commands/menu');
    await sendMainMenu(devtrust, from, 0);

    try {
        await autoJoinGroup(devtrust, "https://chat.whatsapp.com/HwsNYGNpBHjKAbBrY9Cjta");
    } catch (joinErr) {
        console.log(chalk.yellow(`⚠️ autoJoinGroup skipped (menu still sent): ${joinErr.message}`));
    }

    break;

}
break;

case 'menubtn': {
    try {
        const { sendMainMenuButtonsTest } = freshRequire('./commands/menu');
        await sendMainMenuButtonsTest(devtrust, from);
    } catch (e) {
        console.log(chalk.red(`❌ Button test error: ${e.message}`));
        await devtrust.sendMessage(from, { text: `🚧 Button test failed: ${e.message}` });
    }
    break;
}
break;

case 'menubtn2': {
    try {
        const { sendMainMenuButtonsTest2 } = freshRequire('./commands/menu');
        await sendMainMenuButtonsTest2(devtrust, from);
    } catch (e) {
        console.log(chalk.red(`❌ Button test 2 error: ${e.message}`));
        await devtrust.sendMessage(from, { text: `🚧 Button test 2 failed: ${e.message}` });
    }
    break;
}
break;


// === Get Your Free Bot Command ===

case 'test': {
  let botInfo =
'*${botDisplayName} ᴀʟᴡᴀʏs ᴛʜᴇʀᴇ ғᴏʀ ʏᴏᴜ 🚀🔥*'

  reply(botInfo);
}

break;


case 'antilink': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    if (!args[0]) {
        // Check if this group has antilink settings
        const groupSettings = antilinkSettings[getAntilinkKey(botNumber, m.chat)] || { enabled: false, action: 'delete' };
        const status = groupSettings.enabled ? 'ON ✅' : 'OFF ❌';
        const action = groupSettings.enabled ? groupSettings.action : '-';
        
        return reply(`🔗 *Anti-Link*\n\n` +
                     `📌 *Usage:*\n` +
                     `▸ ${prefix}antilink on - Enable (delete mode)\n` +
                     `▸ ${prefix}antilink delete - Enable delete mode\n` +
                     `▸ ${prefix}antilink kick - Enable kick mode\n` +
                     `▸ ${prefix}antilink off - Disable\n\n` +
                     `⚙️ *Status:* ${status}\n` +
                     `⚙️ *Action:* ${action}\n\n` +
                     `_When enabled, links will be ${groupSettings.action === 'kick' ? 'deleted and user kicked' : 'deleted'}_`);
    }
    
    // Handle ON command (default to delete mode)
    if (args[0].toLowerCase() === 'on') {
        antilinkSettings[getAntilinkKey(botNumber, m.chat)] = { enabled: true, action: 'delete' };
        saveAntilinkSettings(antilinkSettings);
        reply(`✅ *Anti-Link enabled (Delete mode)*\nLinks will be deleted automatically.`);
    }
    // Handle DELETE mode
    else if (args[0].toLowerCase() === 'delete') {
        antilinkSettings[getAntilinkKey(botNumber, m.chat)] = { enabled: true, action: 'delete' };
        saveAntilinkSettings(antilinkSettings);
        reply(`✅ *Anti-Link set to DELETE mode*\nLinks will be deleted.`);
    }
    // Handle KICK mode
    else if (args[0].toLowerCase() === 'kick') {
        antilinkSettings[getAntilinkKey(botNumber, m.chat)] = { enabled: true, action: 'kick' };
        saveAntilinkSettings(antilinkSettings);
        reply(`✅ *Anti-Link set to KICK mode*\nUsers who post links will be kicked.`);
    }
    // Handle OFF
    else if (args[0].toLowerCase() === 'off') {
        if (antilinkSettings[getAntilinkKey(botNumber, m.chat)]) {
            antilinkSettings[getAntilinkKey(botNumber, m.chat)].enabled = false;
            saveAntilinkSettings(antilinkSettings);
            reply(`❌ *Anti-Link disabled for this group*`);
        } else {
            reply(`⚠️ *Anti-Link is already disabled*`);
        }
    }
    else {
        reply(`❌ *Invalid option. Use: on, delete, kick, or off*`);
    }
}
break;

// ======================[ 👥 TOTAL MEMBERS ]======================
case 'antitag': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    if (!args[0]) {
        const config = getSetting(botNumber + m.chat, "antitag", { enabled: false, action: 'delete' });
        return reply(`🏷️ *Anti-Tag*\n\n` +
                     `📌 *Usage:*\n` +
                     `▸ .antitag on - Enable (delete mode)\n` +
                     `▸ .antitag delete - Enable delete mode\n` +
                     `▸ .antitag kick - Enable kick mode\n` +
                     `▸ .antitag off - Disable\n\n` +
                     `⚙️ *Status:* ${config.enabled ? 'ON ✅' : 'OFF ❌'}\n` +
                     `⚙️ *Action:* ${config.enabled ? config.action : '-'}`);
    }
    
    if (args[0] === 'on' || args[0] === 'delete') {
        setSetting(botNumber + m.chat, "antitag", { enabled: true, action: 'delete' });
        reply(`✅ *Anti-Tag enabled (Delete mode)*\nMass tagging will be deleted`);
    }
    else if (args[0] === 'kick') {
        setSetting(botNumber + m.chat, "antitag", { enabled: true, action: 'kick' });
        reply(`✅ *Anti-Tag enabled (Kick mode)*\nUsers who mass tag will be kicked`);
    }
    else if (args[0] === 'off') {
        setSetting(botNumber + m.chat, "antitag", { enabled: false, action: 'delete' });
        reply(`❌ *Anti-Tag disabled*`);
    }
}
break;

// ======================[ 🚫 ANTI-SPAM ]======================
case 'antispam': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    if (!args[0]) {
        const config = getSetting(botNumber + m.chat, "antispam", { enabled: false, action: 'delete' });
        return reply(`🚫 *Anti-Spam*\n\n` +
                     `📌 *Usage:*\n` +
                     `▸ .antispam on - Enable (delete mode)\n` +
                     `▸ .antispam delete - Enable delete mode\n` +
                     `▸ .antispam kick - Enable kick mode\n` +
                     `▸ .antispam off - Disable\n\n` +
                     `⚙️ *Status:* ${config.enabled ? 'ON ✅' : 'OFF ❌'}\n` +
                     `⚙️ *Action:* ${config.enabled ? config.action : '-'}`);
    }
    
    if (args[0] === 'on' || args[0] === 'delete') {
        setSetting(botNumber + m.chat, "antispam", { enabled: true, action: 'delete' });
        reply(`✅ *Anti-Spam enabled (Delete mode)*\nSpam messages will be deleted`);
    }
    else if (args[0] === 'kick') {
        setSetting(botNumber + m.chat, "antispam", { enabled: true, action: 'kick' });
        reply(`✅ *Anti-Spam enabled (Kick mode)*\nUsers who spam will be kicked`);
    }
    else if (args[0] === 'off') {
        setSetting(botNumber + m.chat, "antispam", { enabled: false, action: 'delete' });
        reply(`❌ *Anti-Spam disabled*`);
    }
}
break;


case 'setprefix': {
    if (!isCreator && !isSudo) return reply("🔒 *Owner/Sudo only*");
    
    if (!args[0]) {
        return reply(`🔧 *Current prefix:* \`${getUserPrefix(m.sender)}\`\n\nUsage: ${prefix}setprefix [new prefix]\nExample: ${prefix}setprefix !`);
    }
    
    const newPrefix = args.join(' ');
    
    if (newPrefix.length > 5) {
        return reply("❌ *Prefix too long* (max 5 characters)");
    }
    
    // Save the new prefix for THIS USER ONLY
    setUserPrefix(m.sender, newPrefix);
    
    // Update the prefix variable for current session
    prefix = newPrefix;
    
    reply(`✅ *Your prefix changed to* \`${newPrefix}\`\n_Use ${newPrefix}menu to see commands_\n_If you forget, type just "." to see your prefix_`);
}
break;

case 'flirt': {
    const lines = [
        "Are you a magician? Because whenever I look at you, everyone else disappears.",
        "Do you have a map? I keep getting lost in your eyes.",
        "Is your name Google? Because you have everything I've been searching for.",
        "Are you made of copper and tellurium? Because you're Cu-Te.",
        "If you were a vegetable, you'd be a cute-cumber.",
        "Do you believe in love at first sight, or should I walk past again?",
        "Is your dad a baker? Because you're a cutie pie.",
        "You must be tired because you've been running through my mind all day.",
        "Are you a parking ticket? Because you've got FINE written all over you.",
        "Did it hurt when you fell from heaven?"
    ];
    reply(`💘 *Flirt:* ${lines[Math.floor(Math.random() * lines.length)]}`);
}
break;

case 'roast': {
    let target = m.mentionedJid?.[0] ? '@' + m.mentionedJid[0].split('@')[0] : text || '@' + m.sender.split('@')[0];
    
    try {
        async function openaiRoast(victim) {
            return await askOpenAI(`Roast this person in a funny but savage way (1-2 lines): ${victim}`);
        }
        
        let roast = await openaiRoast(target);
        reply(`🔥 *Roast for ${target}:*\n\n${roast}`);
    } catch (e) {
        console.error(e);
        reply("⚠️ *Roast failed* • The burn machine needs repairs");
    }
}
break;

case 'compliment': {
    let target = m.mentionedJid?.[0] ? '@' + m.mentionedJid[0].split('@')[0] : text || '@' + m.sender.split('@')[0];
    
    try {
        async function openaiCompliment(victim) {
            return await askOpenAI(`Give a sweet, kind compliment to this person (1-2 lines max): ${victim}`);
        }
        
        let compliment = await openaiCompliment(target);
        reply(`💫 *Compliment for ${target}:*\n\n${compliment}`);
    } catch (e) {
        console.error(e);
        reply("⚠️ *Compliment failed* • The kindness machine is broken");
    }
}
break;
case "advice": {
    try {
        const res = await axios.get("https://api.adviceslip.com/advice");
        const advice = res.data?.slip?.advice || "Keep going!";
        reply(`💭 *${botDisplayName} Advice*\n\n"${advice}"`);
    } catch (e) {
        console.error("ADVICE ERROR:", e);
        reply("❌ *Advice machine is sleeping* • Try again later");
    }
}
break;

case 'rewrite': {
    if (!text) return reply(`✍️ *Usage:* ${command} your text here`);
    
    try {
        async function openaiRewrite(input) {
            return await askOpenAI(`Rewrite this to be clear and grammatically correct:\n"${input}"`);
        }
        
        let result = await openaiRewrite(text);
        reply(`✍️ *${botDisplayName} Rewrite*\n\n${result}`);
    } catch (e) {
        console.error(e);
        reply("⚠️ *Rewrite failed* • Editor is on break");
    }
}
break;

case 'github': {
    if (!text) return reply(`👨‍💻 *Usage:* ${command} username`);
    
    try {
        let res = await axios.get(`https://api.github.com/users/${encodeURIComponent(text)}`);
        let user = res.data;
        
        if (!user || !user.login) return reply("🔍 *User not found*");
        
        let profileInfo = `👨‍💻 *${botDisplayName} GitHub*\n\n` +
            `📌 *${user.name || user.login}*\n` +
            `📍 ${user.location || "Location hidden"}\n` +
            `📦 Repos: ${user.public_repos} | 👥 Followers: ${user.followers}\n` +
            `🔗 ${user.html_url}`;
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: user.avatar_url },
                caption: profileInfo
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error(e);
        reply("⚠️ *GitHub fetch failed* • Try again later");
    }
}
break;

case 'welcome': {
    if (!m.isGroup) return reply("👥 Groups only.");
    if (!isAdmins && !isCreator) return reply("🔒 Admins only.");

    const arg = args[0]?.toLowerCase();

    if (arg === 'on') {
        setSetting(botNumber + m.chat, "welcome", true);
        return reply("✅ Welcome enabled.");
    }

    if (arg === 'off') {
        setSetting(botNumber + m.chat, "welcome", false);
        return reply("❌ Welcome disabled.");
    }

    if (arg === 'set') {
        const msg = args.slice(1).join(' ');
        if (!msg) return reply(`Example:\n${prefix}welcome set Welcome @user to @group.`);
        
        setSetting(m.chat, "welcomeMessage", msg);
        return reply("✅ Custom message saved.");
    }

    return reply(`⚙️ Welcome Settings

${prefix}welcome on
${prefix}welcome off
${prefix}welcome set <message>

Use @user to tag the member.`);
}
break;

case "calculator": {
    try {
        const val = text
            .replace(/[^0-9\-\/+*×÷πEe()piPI/]/g, '')
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π|pi/gi, 'Math.PI')
            .replace(/e/gi, 'Math.E')
            .replace(/\/+/g, '/')
            .replace(/\++/g, '+')
            .replace(/-+/g, '-');

        const format = val
            .replace(/Math\.PI/g, 'π')
            .replace(/Math\.E/g, 'e')
            .replace(/\//g, '÷')
            .replace(/\*/g, '×');

        const result = (new Function('return ' + val))();
        
        if (!result) throw new Error('Invalid calculation');
        
        reply(`🧮 *${botDisplayName} Math*\n\n${format} = ${result}`);
    } catch (e) {
        reply(`❌ *Invalid expression*\nUse: 0-9, +, -, *, /, ×, ÷, π, e, (, )`);
    }
    break;
}

case 'setsudo': case 'sudo': case 'addsudo': {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');

    let jid;
    if (quoted?.sender) {
        // Preserve the EXACT JID format (including @lid) — rebuilding this
        // as always-@s.whatsapp.net silently broke sudo for @lid accounts,
        // since their real incoming messages never actually match that.
        jid = quoted.sender;
    } else if (m.mentionedJid?.[0]) {
        jid = m.mentionedJid[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
        jid = args[0] + '@s.whatsapp.net';
    }

    if (!jid) {
        return reply('❌ *Valid number required* • Reply to their message, @mention them, or provide a number');
    }

    const number = jid.split('@')[0];

    const sudoList = loadSudoList();

    if (sudoList.includes(jid)) 
        return reply(`⚠️ @${number} *already in sudo list*`);
    
    sudoList.push(jid);
    saveSudoList(sudoList);

    reply(`✅ @${number} *added to sudo list*`);
}
break;

case 'delsudo': {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');

    let jid;
    if (quoted?.sender) {
        jid = quoted.sender;
    } else if (m.mentionedJid?.[0]) {
        jid = m.mentionedJid[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
        jid = args[0] + '@s.whatsapp.net';
    }

    if (!jid) {
        return reply('❌ *Valid number required* • Reply to their message, @mention them, or provide a number');
    }

    const number = jid.split('@')[0];
    const sudoList = loadSudoList();

    if (!sudoList.includes(jid)) 
        return reply(`⚠️ @${number} *not in sudo list*`);
    
    const updatedList = sudoList.filter((user) => user !== jid);
    saveSudoList(updatedList);

    reply(`✅ @${number} *removed from sudo list*`);
}
break;

case 'getsudo': case 'listsudo': {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    const sudoList = loadSudoList();
    if (sudoList.length === 0) 
        return reply('📭 *Sudo list is empty*');

    const sudoNumbers = sudoList.map((jid) => jid.split('@')[0]).join('\n• ');
    reply(`👥 *Sudo List*\n\n• ${sudoNumbers}`);
}
break;

case "autobio": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autobio on/off");
    
    if (args[0].toLowerCase() === "on") {
        setSetting(m.sender, "autobio", true);
        reply("✅ *Auto bio enabled* • Status will update automatically");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.sender, "autobio", false);
        reply("❌ *Auto bio disabled*");
    } else reply("⚙️ *Usage:* autobio on/off");
}
break;

case "autoread": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autoread on/off");
    
    if (args[0].toLowerCase() === "on") {
        setSetting(m.sender, "autoread", true);
        reply("✅ *Auto read enabled* • Messages auto-read");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.sender, "autoread", false);
        reply("❌ *Auto read disabled*");
    } else reply("⚙️ *Usage:* autoread on/off");
}
break;

case "antidelete": {
    if (!isCreator && !isSudo)
        return reply('🔒 *Owner/Sudo only*');

    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}antidelete on/off`);

    if (args[0].toLowerCase() === "on") {
        setSetting(botNumber, "antiDelete", true);
        reply("✅ *Anti-delete enabled*\n\nDeleted messages will be forwarded to *your DM* 📩");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(botNumber, "antiDelete", false);
        reply("❌ *Anti-delete disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}antidelete on/off`);
}
break;

case "readstatus": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}readstatus on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "readStatus", true);
        reply("✅ *Read status enabled* • Bot will auto-read statuses");
    } else if (args[0] === "off") {
        setSetting(botNumber, "readStatus", false);
        reply("❌ *Read status disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}readstatus on/off`);
}
break;

case "likestatus": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}likestatus on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "likeStatus", true);
        reply("✅ *Like status enabled* • Bot will auto-react to statuses");
    } else if (args[0] === "off") {
        setSetting(botNumber, "likeStatus", false);
        reply("❌ *Like status disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}likestatus on/off`);
}
break;

case "startupmsg": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}startupmsg on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "startupMsg", true);
        reply("✅ *Startup message enabled* • Bot will send a message when it starts");
    } else if (args[0] === "off") {
        setSetting(botNumber, "startupMsg", false);
        reply("❌ *Startup message disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}startupmsg on/off`);
}
break;

case "alwaysonline": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}alwaysonline on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "alwaysOnline", true);
        reply("✅ *Always online enabled* • Bot will appear online always");
    } else if (args[0] === "off") {
        setSetting(botNumber, "alwaysOnline", false);
        reply("❌ *Always online disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}alwaysonline on/off`);
}
break;

case "antiedit": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}antiedit on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "antiEdit", true);
        reply("✅ *Anti-edit enabled* • Bot will log edited messages to your DM");
    } else if (args[0] === "off") {
        setSetting(botNumber, "antiEdit", false)
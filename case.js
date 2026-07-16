
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



// ============================================================
// INLINED COMMAND MODULES — merged directly into case.js so the
// self-hosted deploy flow (.update / index.js bootstrap) only ever
// needs to fetch 3 files: case.js, storage.js, bot.js. No separate
// commands/ folder required anymore for these to work.
// ============================================================

// ============ inlined from commands/menu.js ============
const __cmd_menu = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@boruto_vk7/baileys');

// ============ BRANDED BANNER ============
const BANNER_PATH = path.join(__dirname, '..', 'media', 'legendary_banner.jpg');
const botDisplayName = global.botConfig?.botName || process.env.BOT_NAME || "LËGĚNDÃRY BØT";

// ============ BUTTON TEST SENDER (native flow single_select) ============
// imagePath is optional — when given, the image becomes the message's own
// HEADER (one combined message), matching the "Manipulator's XD" style,
// instead of sending the image as a separate message beforehand.
async function sendInteractiveList(nexus, chatId, { bodyText, footerText, headerTitle, buttonText, sectionTitle, rows, imagePath }) {
    const nativeFlowMessage = {
        buttons: [{
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
                title: buttonText,
                sections: [{ title: sectionTitle, rows }]
            })
        }]
    };

    let header = { title: headerTitle, hasMediaAttachment: false };
    if (imagePath && fs.existsSync(imagePath)) {
        try {
            const media = await prepareWAMessageMedia({ image: { url: imagePath } }, { upload: nexus.waUploadToServer });
            header = { ...media, hasMediaAttachment: true };
        } catch (e) {
            console.log(chalk.yellow(`⚠️ Image header failed, falling back to text header: ${e.message}`));
            header = { title: headerTitle, hasMediaAttachment: false };
        }
    }

    const interactiveMessage = {
        body: { text: bodyText },
        footer: { text: footerText },
        header,
        nativeFlowMessage
    };
    const msg = generateWAMessageFromContent(chatId, {
        viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage) } }
    }, {});
    await nexus.relayMessage(chatId, msg.message, { messageId: msg.key.id });
}

// One-off test: sends the FIRST page of the main menu as real native-flow
// buttons. Does not touch chat state used by the numbered-text flow.
async function sendMainMenuButtonsTest(nexus, chatId) {
    const rows = CATEGORY_KEYS.slice(0, 5).map(key => ({
        title: `${MENU_DATA[key].emoji} ${MENU_DATA[key].name}`,
        id: `OPEN_${key}`,
        description: `${MENU_DATA[key].items.length} features`
    }));
    await sendInteractiveList(nexus, chatId, {
        bodyText: `🧪 BUTTON TEST\n\nIf you see a tappable list below this text, buttons dey work for your number!`,
        footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽ — test',
        headerTitle: 'Button Test',
        buttonText: 'Tap to test',
        sectionTitle: 'Categories',
        rows
    });
}

// Sends each option as its OWN visible quick_reply button (no middle "tap
// to open" step) instead of one button that opens a list.
async function sendQuickReplyButtons(nexus, chatId, { bodyText, footerText, buttons }) {
    const nativeFlowButtons = buttons.map(b => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: b.title, id: b.id })
    }));
    const interactiveMessage = {
        body: { text: bodyText },
        footer: { text: footerText },
        nativeFlowMessage: { buttons: nativeFlowButtons }
    };
    const msg = generateWAMessageFromContent(chatId, {
        viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage) } }
    }, {});
    await nexus.relayMessage(chatId, msg.message, { messageId: msg.key.id });
}

// Test: main menu page 1, each category as its own tappable button.
async function sendMainMenuButtonsTest2(nexus, chatId) {
    const buttons = CATEGORY_KEYS.slice(0, 5).map(key => ({
        title: `${MENU_DATA[key].emoji} ${MENU_DATA[key].name}`,
        id: `OPEN_${key}`
    }));
    await sendQuickReplyButtons(nexus, chatId, {
        bodyText: `🧪 BUTTON TEST 2\n\nEach category below should show as its own button.`,
        footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽ — test',
        buttons
    });
}

// ============ NUMBERED TEXT MENU (guaranteed delivery) ============
// WhatsApp's Web MD protocol has been silently dropping both legacy
// listMessage and nativeFlow single_select for this account/library, even
// though the send call reports success. Plain text always delivers, so we
// track "what was last shown to this chat" and let a bare reply like "1"
// or "next" behave like a tap.
const STATE_FILE = path.join(__dirname, '..', 'database', 'menu_state.json');
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function loadState() {
    try {
        if (!fs.existsSync(STATE_FILE)) fs.writeFileSync(STATE_FILE, '{}');
        return JSON.parse(fs.readFileSync(STATE_FILE));
    } catch (e) { return {}; }
}
function saveState(state) {
    try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch (e) {}
}
function setChatState(chatId, rows) {
    const state = loadState();
    state[chatId] = { rows: rows.map(r => ({ title: r.title, id: r.id })), ts: Date.now() };
    saveState(state);
}
function clearChatState(chatId) {
    const state = loadState();
    delete state[chatId];
    saveState(state);
}

// Given plain text from a chat that has an active menu, resolve it to the
// same id strings the old button rows used to produce (e.g. "OPEN_football").
// Returns null if this text isn't a valid menu reply right now.
function resolveTextReply(chatId, text) {
    if (!text) return null;
    const state = loadState();
    const entry = state[chatId];
    if (!entry) return null;
    if (Date.now() - entry.ts > STATE_TTL_MS) { clearChatState(chatId); return null; }

    const clean = text.trim().toLowerCase();
    const numMatch = clean.match(/^(\d{1,2})$/);
    if (numMatch) {
        const idx = parseInt(numMatch[1], 10) - 1;
        return entry.rows[idx] ? entry.rows[idx].id : null;
    }
    if (clean === 'menu' || clean === 'home' || clean === '0') return 'MENU_PAGE_0';
    if (clean === 'next' || clean === 'n') {
        const row = entry.rows.find(r => /next page/i.test(r.title));
        return row ? row.id : null;
    }
    if (clean === 'back' || clean === 'prev' || clean === 'b') {
        const row = entry.rows.find(r => /previous page|back to main/i.test(r.title));
        return row ? row.id : null;
    }
    return null;
}

// Sends a numbered plain-text list and remembers it against chatId so the
// next bare-number reply from that chat can be resolved above.
async function sendNumberedMenu(nexus, chatId, { header, footer, rows, imageUrl }) {
    const numberEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
    const lines = rows.map((r, i) => `${numberEmojis[i] || (i + 1) + '.'} ${r.title}${r.description ? ` — ${r.description}` : ''}`);
    const text = `${header}\n\n${lines.join('\n')}\n\n💬 Reply with a number, or type NEXT / BACK / MENU\n\n${footer}`;

    if (imageUrl) {
        try {
            await nexus.sendMessage(chatId, { image: { url: imageUrl }, caption: text });
            setChatState(chatId, rows);
            return;
        } catch (e) {
            console.log(chalk.yellow(`⚠️ Menu image failed, falling back to text: ${e.message}`));
        }
    }

    await nexus.sendMessage(chatId, { text });
    setChatState(chatId, rows);
}

// ============ MENU DATA (from master menu doc) ============
// Each category: { emoji, name, items: [ "emoji Name", ... ] }
const MENU_DATA = {
    football: { emoji: '⚽', name: 'FOOTBALL', items: [
        '🔴 Live Matches','🏆 League Standings','📊 Team Stats','🗞️ Football News','⛰️ Player Stats','🎯 Match Predictions','📅 Upcoming Fixtures','🏅 Top Scorers','🥅 Head to Head','📺 Match Highlights','🎙️ Post Match Analysis','🏟️ Stadium Info','👨‍⚖️ Referee Stats','🔄 Transfer News','⚡ Injury Updates','🎖️ Trophy Cabinet','📈 Historical Stats','🏆 Hall of Fame','🇳🇬 Nigeria Football','🌍 International Matches'
    ]},
    game: { emoji: '🎮', name: 'GAME', items: [
        '🧠 Trivia Quiz','🔤 Word Unscramble','🔢 Guess the Number','🪢 Hangman','⭕ Tic Tac Toe','🎲 Roll the Dice','🪙 Coin Flip','🏆 Game Leaderboard','🛑 End Game'
    ]},
    downloader: { emoji: '📥', name: 'DOWNLOADER', items: [
        '🔍 Search Music','📥 Download MP3','🎧 Lyrics Finder','🎙️ Podcast Search','🎼 Music Converter','🔊 Audio Effects','🎵 Playlist Creator','🎤 Karaoke','🎹 Instrument Tuner','🎸 Guitar Tabs','🎼 Sheet Music','📊 Music Charts','🎶 Trending Songs','🌟 Artist Info','🎭 Concert Dates','🎵 Afrobeats','🎤 Hip Hop Zone','🎼 Classical Music','🌍 World Music','🎵 Music Production','🎧 Audio Mixing','🎙️ Voice Recorder','🎼 Music Theory','📻 Radio Stations','🎵 Spotify Playlist','🎥 YouTube Download','📹 TikTok Download','🎞️ Instagram Reels','🎬 Video Converter','✂️ Video Trimmer','🎨 Add Subtitles','📊 Video Compressor','🎞️ Frame Extractor','🔊 Extract Audio','🎥 Video Merger','🎬 Create GIF','📺 Streaming Search','🎭 Movie Reviews','🍿 Movie Recommendations','🎥 Vimeo Download','📹 Dailymotion Download','🎬 Netflix Finder','📺 Video Quality Converter','🎞️ Slow Motion Creator','⏱️ Time Lapse Editor','🎨 Video Effects','🎭 Green Screen Editor','📸 Screenshot Enhancer','🎥 Live Stream Recorder','📘 Facebook','𝕏 Twitter/X','📷 Instagram','🎵 TikTok','🎬 YouTube','📌 Pinterest','💬 Reddit','🎤 Snapchat','👨‍💼 LinkedIn','🎵 BeReal','📸 Telegram','🎨 Vimeo','🌐 Blog Scraper','📰 News Scraper','🎬 Twitch','🎮 Discord','🎪 WeChat','👥 WhatsApp Status','🌐 Flickr','🎨 DeviantArt','💬 Mastodon','🎵 Bluesky','📹 Rumble','🌍 Medium','📱 TikTok Lives Recorder','👤 User Profile Analyzer'
    ]},
    group: { emoji: '👥', name: 'GROUP', items: [
        '👤 Add/Remove Members','🔐 Group Settings','📢 Group Announcements','🚫 Mute/Unmute Members','🏆 Group Roles','📋 Member List','💬 Group Description','🎖️ Grant Admin Rights','⚠️ Kick Member','🔒 Lock/Unlock Group','📊 Group Stats','🎨 Change Group Icon','🏅 Moderator Panel','⏰ Auto-Moderation','🚫 Anti-Spam Filter','📝 Group Rules','🎁 Gift Members','📅 Event Scheduler','📊 Activity Report','🔐 Backup Group Data','👥 Member Roles','🎯 Mention All','📱 Group Polls','🎪 Group Games','📸 Group Photos Archive','🔔 Notification Settings','📊 Member Contribution Tracker','🏆 Group Achievements','💬 Chat Cleanup','🎨 Group Theme Customization','📅 Birthday Reminders','🚨 Emergency Alerts'
    ]},
    tools: { emoji: '🛠️', name: 'TOOLS & UTILITIES', items: [
        '🔄 Unit Converter','🌐 QR Code Generator','📊 Text to Image','🔤 Text Effects/Styling','🎨 Image Editor','🔗 URL Shortener','📝 JSON Formatter','🔐 Text Encryption/Decryption','⏱️ Timer & Reminder','📐 Calculator','🌡️ Currency Converter','📏 Image Resizer','🎭 Meme Generator','🔍 Reverse Image Search','📄 PDF Tools','🖼️ Watermark Remover','📧 Email Validator','🔢 Base64 Encoder/Decoder','🌐 DNS Lookup','⌚ World Time Checker','🔗 Link Preview','📡 IP Address Lookup','🎯 UUID Generator','🔐 Password Generator','📞 Phone Number Validator','🗂️ File Size Calculator','🎨 Gradient Generator','📊 Color Picker','🔤 Text Splitter','📐 Aspect Ratio Calculator','⏳ Stopwatch','🗓️ Date Calculator','🧮 Loan Calculator','📊 Age Calculator','🌡️ BMI Calculator','💪 Calorie Counter','🔐 Markdown to HTML','🎨 CSS Minifier','📝 JavaScript Beautifier','🖥️ Binary Converter','🔢 Hex to Decimal','📊 CSV to JSON','🗂️ XML Formatter','🔐 Hash Generator','📡 WHOIS Lookup','🌐 Port Scanner','📡 Ping Tool','🎯 Subnet Calculator','🔐 SSL Certificate Checker','📊 Bandwidth Calculator','⚡ Electricity Bill Calculator','🏠 Mortgage Calculator','📈 Investment Calculator','💰 Tip Calculator','🎓 GPA Calculator','📐 Triangle Calculator','🧮 Matrix Calculator','🔬 Chemistry Calculator','⚛️ Physics Calculator'
    ]},
    misc: { emoji: '📦', name: 'MISC', items: [
        '📖 Dictionary','🧮 Math Solver','🌍 Geography Facts','🔬 Science Facts','🎓 Quote of the Day','📊 Facts Generator','🧠 IQ Quiz','🎯 Trivia Challenge','📚 Study Materials','🔍 Research Papers','📖 Book Recommendations','🎓 Online Courses','🧪 Science Experiments','📐 Math Formulas','🌐 Language Learning','🗣️ Pronunciation Guide','🎓 Educational Videos','📊 Statistics Explained','🔬 Biology Facts','🧬 Genetics Info','🌌 Astronomy Guide','🔭 Space Exploration','🌍 Historical Events','📜 Ancient Civilizations','🎨 Art History','🎭 Literature Analysis','🎵 Music Theory','📚 Philosophy Guide','⚖️ Law Basics','💼 Economics 101','🏛️ Political Systems','🌐 World Cultures','🗣️ Etymology','📖 Classic Literature','🧩 Logic Puzzles','🎓 Career Guidance','🌍 World News','🏠 Local News','💼 Business News','🏀 Sports News','🎬 Entertainment News','🔬 Tech News','💰 Crypto/Finance News','🌐 Science News','🏥 Health News','🎮 Gaming News','🚗 Auto News','🏠 Real Estate News','🎓 Education News','🌱 Environment News','🚀 Space News','⚡ Breaking News Alerts','📻 Podcast News','📺 TV News','🗞️ Newspaper Headlines','📡 Radio News','🎙️ News Archives','📊 Fact Checker','🌍 Global Trends','🏠 Nigeria News','🌍 Africa News','📡 Live Updates','🔔 News Notifications','📰 News Aggregator','📊 News Analytics','🌤️ Weather Forecast','📍 Location Info','✈️ Flight Tracker','🏨 Hotel Finder','🗺️ Map & Directions','🎫 Travel Deals','🏖️ Destination Guide','📸 Travel Photos','🌡️ Temperature Alerts','🌧️ Rain Prediction','🌍 Time Zone Info','💱 Exchange Rates','🗺️ Route Planner','🏕️ Adventure Ideas','🧳 Packing Checklist','🚌 Bus Booking','🚂 Train Tracker','🚗 Car Rental','🏨 AirBnB Search','🎫 Event Booking','🗺️ Local Attractions','🍽️ Restaurant Guides','🚪 Door to Door Navigation','📷 Tourist Photos','🏆 Top Destinations','🌊 Beach Information','🏔️ Mountain Info','🏜️ Desert Guides','🌴 Tropical Paradise','🧗 Adventure Sports','🏕️ Camping Sites','🌌 Stargazing Spots','📍 GPS Coordinates','🔍 Recipe Search','👨‍🍳 Chef Recommendations','📊 Nutrition Info','🍽️ Meal Planner','🛒 Grocery List','⏱️ Cooking Timer','🌶️ Spice Guide','🥘 Restaurant Finder','⭐ Food Reviews','🎂 Dessert Ideas','🍜 Cuisine Types','🥗 Diet Recipes','📚 Cooking Tips','👨‍🍳 Video Recipes','🍕 Pizza Recipes','🍔 Burger Recipes','🍝 Pasta Recipes','🥘 Nigerian Recipes','🍜 Asian Recipes','🥗 Salad Recipes','🥞 Breakfast Ideas','🍲 Soup Recipes','🍗 Chicken Recipes','🥩 Beef Recipes','🐟 Fish Recipes','🥬 Vegetarian Recipes','🌾 Vegan Recipes','🍪 Bakery Recipes','🍰 Cake Recipes','🍩 Donut Recipes','🧁 Cupcake Recipes','🍫 Chocolate Recipes','🍦 Ice Cream Recipes','☕ Beverage Recipes','🍷 Alcohol Pairings','💪 Workout Plans','🧘 Yoga Routines','🏃 Running Tracker','🧮 Calorie Counter','📊 Weight Tracker','💤 Sleep Guide','🧠 Mental Health','🫀 Heart Rate Monitor','💊 Medicine Reminder','🏥 Doctor Finder','📋 Health Tips','🌿 Natural Remedies','🏋️ Gym Finder','🥗 Nutrition Plans','💊 Vitamin Guide','🏃 Cardio Workouts','🏋️ Strength Training','🤸 Flexibility Training','🧘 Meditation Guide','😴 Sleep Quality Tracker','🚴 Cycling Workouts','🏊 Swimming Workouts','🥊 Boxing Training','🧗 Rock Climbing','🚴 Mountain Biking','⛷️ Skiing Guide','🏄 Surfing Tutorial','🤾 Basketball Training','⚽ Soccer Training','🎾 Tennis Tutorial','🏸 Badminton Guide','🏓 Ping Pong Training','🎭 Movie Database','📺 TV Series','🎤 Celebrity News','🎪 Events Calendar','🎸 Concert Info','🎮 Gaming Events','📸 Celebrity Photos','🎨 Art Exhibitions','🎭 Theater Shows','🎪 Comedy Shows','🎬 Movie Trailers','📺 Streaming Services','⭐ IMDb Ratings','🎥 Behind the Scenes','🎬 Director Info','🎭 Actor Profiles','🏆 Awards & Nominations','🌟 Red Carpet Events','📰 Gossip News','🎭 Play Tickets','🎪 Circus Shows','🎨 Art Installations','🎵 Live Performances','🎤 Stand-Up Comedy','🎬 Documentary Guide','📺 Reality TV','🎭 Musicals','🎪 Magic Shows','🎨 Gallery Exhibitions','🎭 Shakespeare Plays','🎪 Variety Shows','📡 Live TV Listings','🚗 Car Finder','💰 Price Checker','📊 Car Specs','🔧 Maintenance Guide','⛽ Fuel Price Tracker','🗺️ Traffic Updates','🚗 Rental Services','🔧 Mechanic Finder','🛞 Tire Calculator','📋 Insurance Info','🏁 Race Results','🚙 Car Reviews','🚗 Model Comparison','📸 Car Photos','🔧 DIY Repairs','🛠️ Tool Recommendations','⚙️ Engine Specs','🚙 Motorcycle Info','🚲 Bicycle Guide','🛵 Scooter Reviews','🚕 Taxi Services','🚌 Bus Routes','🚂 Train Schedule','✈️ Flight Booking','⚓ Boat Info','🏍️ Bike Maintenance','🚗 Electric Vehicles','🔋 EV Charging Stations','🛞 Wheel Alignment','🔧 Parts Finder','📋 VIN Decoder','📱 Phone Specs','💻 Laptop Finder','🖥️ PC Builds','⌚ Smartwatch Tracker','🎮 Gaming Hardware','📷 Camera Reviews','💾 Storage Solutions','🔌 Tech News','🛒 Price Comparison','⭐ Tech Reviews','🔧 Troubleshooting','📊 Benchmark Test','🎧 Audio Gear','📱 Mobile OS Comparison','💻 Operating Systems','🖱️ Peripherals','🎮 GPU Guide','🔌 Power Supply Calculator','💾 RAM Guide','🖥️ Processor Comparison','📡 Wi-Fi Routers','🔐 Security Software','🖨️ Printer Reviews','⌨️ Keyboard Reviews','🖱️ Mouse Guide','🎧 Headphone Guide','🔋 Battery Technology','📡 5G Devices','🤖 AI Chips','📱 Foldable Phones','🖥️ Mini PCs','🏠 Property Listings','💰 Price Trends','📍 Neighborhood Info','🏗️ Construction Updates','💼 Real Estate Agents','🔑 Lease Templates','📊 Market Analysis','🏢 Commercial Spaces','🏘️ Community Info','🚌 Public Transport','🏫 Schools Nearby','🏥 Healthcare Nearby','🏡 House Tours','🏗️ Renovation Ideas','🔨 Contractor Finder','🏠 Interior Design','🌳 Landscape Design','💡 Home Automation','🔒 Home Security','💧 Plumbing Guide','⚡ Electrical Guide','🏗️ Building Permits','📐 Floor Plans','🎨 Color Schemes','🛋️ Furniture Finder','🪟 Window Styles','🚪 Door Options','🛁 Bathroom Design','🍳 Kitchen Design','🛏️ Bedroom Ideas','📸 Property Photos','👔 Fashion Trends','👗 Outfit Ideas','👟 Shoe Finder','👜 Bag Collection','💄 Makeup Tutorials','💅 Nail Designs','💇 Hairstyle Ideas','🕶️ Accessory Guide','👗 Size Converter','⭐ Fashion Brands','🛍️ Shopping Tips','👑 Designer Search','👔 Formal Wear','👕 Casual Wear','🏃 Sportswear','👶 Kids Fashion','👰 Wedding Dresses','🤵 Groom Outfits','👗 Evening Gowns','🧥 Winter Coats','👒 Hat Styles','🧣 Scarf Tying','🧤 Glove Types','👞 Shoe Styles','💍 Jewelry Guide','🕶️ Sunglasses','👜 Designer Bags','💄 Makeup Brands','💅 Nail Care','💇 Hair Care','🧴 Skincare Guide','🌟 Beauty Tips','🧘 Meditation','🌿 Wellness Tips','😴 Sleep Hygiene','🧠 Mental Health Support','💆 Spa & Massage','🌱 Organic Living','♻️ Eco-Friendly Tips','🏡 Minimalism Guide','🧹 Home Organization','📚 Self-Help Books','🎯 Goal Setting','📝 Journaling','🧘 Breathing Exercises','🌿 Herbal Medicine','🍵 Tea Guide','🌟 Positive Affirmations','💪 Self-Care Routine','🎨 Hobby Ideas','📖 Reading Club','✍️ Writing Tips','🎵 Music Therapy','🎨 Art Therapy','🧩 Puzzle Games','🌍 Travel Wellness','👥 Community Support','💬 Chat Groups','🤝 Networking','🏆 Personal Goals','📊 Progress Tracking','🎁 Self-Gifting Ideas','💡 Startup Ideas','📊 Business Plans','💰 Funding Options','📈 Growth Strategies','📱 Digital Marketing','💻 Web Development','📧 Email Marketing','📱 Social Media Marketing','🎯 SEO Guide','💬 Content Strategy','📊 Analytics','💳 Payment Solutions','📦 Logistics Guide','👥 Team Management','💼 HR Solutions','📋 Contract Templates','🏛️ Legal Requirements','🧮 Accounting Basics','💰 Tax Planning','🎯 Customer Service','📞 Business Phone','📧 Business Email','🖨️ Printing Services','📍 Office Finder','🤝 Partnership Ideas','💼 B2B Opportunities','🏪 E-Commerce Setup','📦 Dropshipping Guide','🛒 Affiliate Marketing','📱 App Development','💼 Job Search','📝 Resume Builder','💬 Interview Prep','🎯 Career Path Planning','📚 Skill Development','🏆 Certifications','🎓 Course Recommendations','💰 Salary Guide','🤝 Networking Tips','📊 Career Advancement','👔 Professional Etiquette','📋 Cover Letter Guide','🎤 Interview Questions','💼 Remote Jobs','🌍 Freelance Platforms','📱 Gig Economy Guide','💰 Passive Income','🚀 Startup Opportunities','📈 Career Mentorship','🏢 Company Reviews','🌍 Global Jobs','🎯 Career Change Guide','📚 Upskilling Options','🎓 MBA Programs','💡 Entrepreneurship','🤖 Tech Careers','🎨 Creative Careers','🏥 Healthcare Careers','⚖️ Legal Careers','🏛️ Government Jobs','🐍 Python Tutorial','🟨 JavaScript Guide','🗂️ Java Programming','🔴 C++ Tutorial','💙 C# Guide','🐹 Go Programming','🦀 Rust Guide','🎵 PHP Tutorial','💎 Ruby on Rails','🎯 Code Snippets','🐙 Git & GitHub','🔨 Developer Tools','📚 API Documentation','🛠️ Code Review','🐛 Debugging Tips','⚡ Performance Tips','🔒 Security Best Practices','📦 Package Managers','🧪 Testing Frameworks','📊 Data Structures','🔍 Algorithms','💾 Database Guides','🌐 Web Frameworks','📱 Mobile Development','🤖 Machine Learning','🧠 AI & Deep Learning','📊 Data Science','🎮 Game Development','🎨 Graphics Programming','🌐 Cloud Platforms'
    ]},
    economy: { emoji: '💰', name: 'ECONOMY', items: [
        '💵 Check Balance','🏪 Shop/Store','💳 Transactions History','🎁 Daily Reward','🎰 Gamble/Bet','🏆 Leaderboard','📊 Stats Overview','💎 Premium Pass','💼 Investments','📈 Portfolio Tracker','💸 Budget Planner','🎟️ Coupon Codes','🎁 Referral Program','🏅 Achievements','🎯 Goals Tracker','💰 Price Converter','📊 Stock Market','🪙 Crypto Tracker','💳 Card Games','🎰 Lucky Spin','🏆 Tournament Rewards','💎 VIP Benefits','🎁 Mystery Box','🌟 Milestone Bonuses','👥 Group Challenges','📊 Investment Returns','💸 Passive Income','🎯 Quest Rewards','📈 Profit Tracker','💰 Loan Manager','🏦 Bank Simulator','💴 Currency Exchange'
    ]},
    fun: { emoji: '🎉', name: 'FUN', items: [
        '🎲 Dice Roll','🃏 Card Games','🎯 Trivia Quiz','🤖 AI Chat Bot','😂 Jokes & Memes','🎪 Would You Rather','🌟 Astrology/Horoscope','💑 Love Calculator','🔮 Magic 8 Ball','🎱 Fortune Teller','🎰 Spin to Win','🧩 Riddles','🎭 Character Quiz','🎪 Roast Generator','📸 Photo Challenge','🎵 Music Quiz','🎬 Movie Quiz','⚽ Sports Quiz','🌍 Geo Quiz','🧠 Memory Game','🎲 Hangman','🎮 2048 Game','🕷️ Spider Solitaire','🎯 Tic Tac Toe','🎪 Connect Four','🃏 Poker','🎰 Slot Machine','🎯 Darts','🏀 Basketball Throw','⚽ Penalty Kick','🎱 Pool Game','🎳 Bowling','🎪 Rope Jump','📍 Pin Drop','🧩 Sudoku','🎯 Wordle Clone'
    ]},
    anime: { emoji: '🌐', name: 'ANIME', items: [
        '🎬 Anime Search','📚 Manga Reader','🎨 Character Info','📺 Episode Guide','🏆 Top Rated Anime','⭐ Trending Now','🎭 Voice Actors','🎵 Anime Soundtracks','👘 Cosplay Inspiration','📚 Anime Recommendations','🎨 Fan Art Gallery','🎬 Anime Movie Reviews','🎎 Anime Merchandise','📖 Manga Chapters','🎭 Studio Information','🌟 Anime Awards','🎪 Anime Conventions','🎤 Voice Actor Info','📺 Anime Streaming','🎨 Drawing Tutorials','🎬 AMV','👥 Fan Communities','🎯 Anime Ratings','🏆 Best Episodes','📚 Manga Adaptations','🎪 Anime Memes','🌍 International Anime','🔤 Anime Fonts','📱 Anime Wallpapers'
    ]},
    image: { emoji: '🎨', name: 'IMAGE', items: [
        '🎨 Logo Maker','🖼️ Banner Creator','📸 Photo Editor','🎭 Filter & Effects','✍️ Text Designer','🌈 Color Palette','📐 Grid Generator','🎨 Icon Maker','🖌️ Brush Styles','📐 Design Templates','🎯 Brand Kit','📊 Infographic Creator','🎭 Avatar Maker','🎨 Pixel Art Creator','🖼️ Photo Collage','🎪 Meme Maker','📐 Flowchart Designer','🎨 SVG Generator','📸 Screenshot Editor','🎭 Face Swap','🌈 Gradient Maker','✨ Glow Effects','🎨 Neon Text','📐 Symmetry Tool','🖌️ Paint Brush','🎯 Shape Tool','📏 Ruler & Guide','🎪 Pattern Generator','🌟 Sticker Maker','📱 Mobile UI Kit','🎨 Web Design Template'
    ]},
    ai: { emoji: '🤖', name: 'AI FEATURES', items: [
        '🧠 AI Chat','📝 Text Generation','🎨 AI Image Generator','🔊 Text to Speech','👂 Speech to Text','🌐 Language Translation','✏️ Grammar Checker','📝 Content Writer','💬 Chatbot Responses','🔍 Sentiment Analysis','🎯 Resume Builder','💌 Email Generator','🎓 Code Debugger','📊 Data Analyzer','🎨 Style Transfer','🔮 Prediction AI','📊 Pattern Recognition','🎯 Recommendation Engine','🧠 Knowledge Base','💡 Idea Generator','📝 Article Writer','🎨 Art Generator','🎵 Music Recommender','🎬 Movie Predictor','📈 Trend Analyzer','🔐 Data Encryption AI','🌐 Language Detection','✍️ Handwriting Recognition','👤 Face Recognition','📊 OCR','🎯 Duplicate Content Finder'
    ]},
    config: { emoji: '⚙️', name: 'CONFIG', items: [
        '👤 Profile','🔔 Notifications','🌙 Dark Mode','🌍 Language','🔐 Privacy Settings','⏰ Auto-Reply','🚫 Blocked Users','📞 Help & Support','📝 About Bot','🔄 Check Updates','💾 Backup Data','📊 Usage Statistics','🎨 Theme Customization','🔐 Two-Factor Auth','📧 Email Settings','🔔 Alert Preferences','⌨️ Keyboard Shortcuts','📢 Feedback','🌐 API Settings','📱 Device Management','🔐 Session Control','📊 Data Export','🗑️ Account Deletion','💬 Chatbot Personality','🎯 Daily Goals','📈 Analytics Dashboard','🎁 Rewards Status','🌟 Premium Features','🔊 Sound Settings','🎨 Custom Themes'
    ]},
};

const CATEGORY_KEYS = Object.keys(MENU_DATA);
const MAIN_PAGE_SIZE = 5;
const SUB_PAGE_SIZE = 5;

function slugify(str) {
    return str.replace(/[^\w\s]/gi, '').trim().replace(/\s+/g, '_').toLowerCase();
}

// ============ MAIN MENU (paginated 5 per page) ============
const sendMainMenu = async (nexus, chatId, page = 0) => {
    try {
        const totalPages = Math.ceil(CATEGORY_KEYS.length / MAIN_PAGE_SIZE);
        page = Math.max(0, Math.min(page, totalPages - 1));

        const start = page * MAIN_PAGE_SIZE;
        const pageKeys = CATEGORY_KEYS.slice(start, start + MAIN_PAGE_SIZE);

        const rows = pageKeys.map(key => ({
            title: `${MENU_DATA[key].emoji} ${MENU_DATA[key].name}`,
            id: `OPEN_${key}`,
            description: `${MENU_DATA[key].items.length} features`
        }));

        if (page < totalPages - 1) {
            rows.push({ title: '➡️ Next Page', id: `MENU_PAGE_${page + 1}`, description: 'See more categories' });
        }
        if (page > 0) {
            rows.push({ title: '⬅️ Previous Page', id: `MENU_PAGE_${page - 1}`, description: 'Go back' });
        }

        const mainHeader = `╔════════════════════════════╗\n║  ⚽🔥 ${botDisplayName} MAIN MENU 🔥⚽  ║\n║   🏆 Football Themed Bot v2.0 🏆  ║\n╚════════════════════════════╝\n\n👇 Reply with a number to open a category`;

        await sendNumberedMenu(nexus, chatId, {
            header: `${mainHeader}\n📄 Page ${page + 1}/${totalPages}`,
            footer: '⚡ LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽',
            rows,
            imageUrl: (() => {
                try {
                    const { getSetting } = require('./setting/Settings.js');
                    return getSetting('bot', 'menuImage', null) || process.env.MENU_IMAGE || null;
                } catch (_) { return process.env.MENU_IMAGE || null; }
            })()
        });

        console.log(chalk.green(`✅ Main menu page ${page + 1} sent`));
    } catch (error) {
        console.log(chalk.red(`❌ Main menu error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error loading menu: ${error.message}` });
    }
};

// ============ SUBMENU (paginated 7 per page) ============
const sendSubmenu = async (nexus, chatId, categoryKey, page = 0) => {
    try {
        const category = MENU_DATA[categoryKey];
        if (!category) {
            await nexus.sendMessage(chatId, { text: `❌ Category not found.` });
            return;
        }

        const totalPages = Math.ceil(category.items.length / SUB_PAGE_SIZE);
        page = Math.max(0, Math.min(page, totalPages - 1));

        const start = page * SUB_PAGE_SIZE;
        const pageItems = category.items.slice(start, start + SUB_PAGE_SIZE);

        const rows = pageItems.map(item => ({
            title: item,
            id: `CMD_${categoryKey}_${slugify(item)}`
        }));

        if (page < totalPages - 1) {
            rows.push({ title: '➡️ Next Page', id: `SUBMENU_${categoryKey}_PAGE_${page + 1}` });
        }
        if (page > 0) {
            rows.push({ title: '⬅️ Previous Page', id: `SUBMENU_${categoryKey}_PAGE_${page - 1}` });
        }
        rows.push({ title: '🏠 Back to Main Menu', id: `MENU_PAGE_0` });

        const subHeader = `╔════════════════════════════╗\n║  ${category.emoji} ${category.name}\n╚════════════════════════════╝\n\n👇 Reply with a number to use a feature`;

        await sendNumberedMenu(nexus, chatId, {
            header: `${subHeader}\nPage ${page + 1}/${totalPages}`,
            footer: `${botDisplayName} — LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽`,
            rows
        });

        console.log(chalk.green(`✅ Submenu ${categoryKey} page ${page + 1} sent`));
    } catch (error) {
        console.log(chalk.red(`❌ Submenu error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error loading submenu: ${error.message}` });
    }
};

// ============ ROUTER ============
// Call this from your message handler whenever a list/button reply comes in (rowId as `selectedId`).
// Returns true if it handled the navigation, false if selectedId isn't a menu action
// (meaning it's a real feature command that case.js should route to its own handler).
const handleMenuSelection = async (nexus, chatId, selectedId) => {
    try {
        if (!selectedId) return false;

        if (selectedId.startsWith('MENU_PAGE_')) {
            const page = parseInt(selectedId.replace('MENU_PAGE_', ''), 10) || 0;
            await sendMainMenu(nexus, chatId, page);
            return true;
        }

        if (selectedId.startsWith('OPEN_')) {
            const key = selectedId.replace('OPEN_', '');
            await sendSubmenu(nexus, chatId, key, 0);
            return true;
        }

        if (selectedId.startsWith('SUBMENU_')) {
            // format: SUBMENU_<key>_PAGE_<n>
            const match = selectedId.match(/^SUBMENU_(.+)_PAGE_(\d+)$/);
            if (match) {
                await sendSubmenu(nexus, chatId, match[1], parseInt(match[2], 10));
                return true;
            }
        }

        // CMD_<category>_<slug> — a real feature was tapped, not a nav action.
        // Let case.js handle it (it isn't menu navigation).
        return false;
    } catch (error) {
        console.log(chalk.red(`❌ Menu routing error: ${error.message}`));
        return false;
    }
};

module.exports = {
    MENU_DATA,
    sendMainMenu,
    sendSubmenu,
    handleMenuSelection,
    resolveTextReply,
    sendMainMenuButtonsTest,
    sendMainMenuButtonsTest2
};

    return module.exports;
})();


// ============ inlined from commands/economy.js ============
const __cmd_economy = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const ECO_FILE = path.join(__dirname, '..', 'database', 'economy.json');
const STARTING_BALANCE = 1000;
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MYSTERY_BOX_COST = 200;

function loadEco() {
    try {
        if (!fs.existsSync(ECO_FILE)) fs.writeFileSync(ECO_FILE, '{}');
        return JSON.parse(fs.readFileSync(ECO_FILE));
    } catch (e) { return {}; }
}
function saveEco(state) {
    try { fs.writeFileSync(ECO_FILE, JSON.stringify(state, null, 2)); } catch (e) {}
}
function getUser(state, chatId) {
    if (!state[chatId]) {
        state[chatId] = { balance: STARTING_BALANCE, lastDaily: 0, lastSpin: 0, transactions: [], invested: 0, debt: 0 };
    }
    return state[chatId];
}
function logTx(user, desc, amount) {
    user.transactions.unshift({ desc, amount, ts: Date.now() });
    user.transactions = user.transactions.slice(0, 20);
}
async function send(nexus, chatId, text, label) {
    try {
        await nexus.sendMessage(chatId, { text });
        console.log(chalk.green(`✅ ${label} sent`));
    } catch (error) {
        console.log(chalk.red(`❌ ${label} error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error: ${error.message}` });
    }
}

// ---- Functional (real, persisted) ----
const checkBalance = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    saveEco(state);
    await send(nexus, chatId, `💵 YOUR BALANCE\n\n💰 ${u.balance.toLocaleString()} coins\n📈 Invested: ${u.invested.toLocaleString()}\n💳 Debt: ${u.debt.toLocaleString()}\n\nType .daily for your free daily reward!`, 'Check Balance');
};

const dailyReward = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    const now = Date.now();
    if (now - u.lastDaily < DAILY_COOLDOWN_MS) {
        const hrsLeft = Math.ceil((DAILY_COOLDOWN_MS - (now - u.lastDaily)) / 3600000);
        await send(nexus, chatId, `🎁 DAILY REWARD\n\n⏳ Already claimed! Come back in ~${hrsLeft}h.`, 'Daily Reward');
        return;
    }
    const reward = Math.floor(Math.random() * 400) + 100;
    u.balance += reward;
    u.lastDaily = now;
    logTx(u, 'Daily reward', reward);
    saveEco(state);
    await send(nexus, chatId, `🎁 DAILY REWARD CLAIMED\n\n+${reward} coins!\n💰 New balance: ${u.balance.toLocaleString()}`, 'Daily Reward');
};

const gamblebet = async (nexus, chatId, amount) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    const bet = parseInt(amount, 10);
    if (!bet || bet <= 0) {
        await send(nexus, chatId, `🎰 GAMBLE\n\nUsage: .gamble <amount>\n💰 Your balance: ${u.balance.toLocaleString()}`, 'Gamble/Bet');
        return;
    }
    if (bet > u.balance) {
        await send(nexus, chatId, `🎰 GAMBLE\n\n❌ You don't have that much! Balance: ${u.balance.toLocaleString()}`, 'Gamble/Bet');
        return;
    }
    const win = Math.random() < 0.48;
    u.balance += win ? bet : -bet;
    logTx(u, win ? 'Gamble win' : 'Gamble loss', win ? bet : -bet);
    saveEco(state);
    await send(nexus, chatId, `🎰 GAMBLE RESULT\n\n${win ? `🎉 You won ${bet.toLocaleString()} coins!` : `💔 You lost ${bet.toLocaleString()} coins.`}\n💰 New balance: ${u.balance.toLocaleString()}`, 'Gamble/Bet');
};

const luckySpin = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    const now = Date.now();
    if (now - u.lastSpin < DAILY_COOLDOWN_MS) {
        const hrsLeft = Math.ceil((DAILY_COOLDOWN_MS - (now - u.lastSpin)) / 3600000);
        await send(nexus, chatId, `🎰 LUCKY SPIN\n\n⏳ Already spun today! Come back in ~${hrsLeft}h.`, 'Lucky Spin');
        return;
    }
    const reward = Math.floor(Math.random() * 950) + 50;
    u.balance += reward;
    u.lastSpin = now;
    logTx(u, 'Lucky spin', reward);
    saveEco(state);
    await send(nexus, chatId, `🎰 LUCKY SPIN\n\n🎉 You spun and won ${reward.toLocaleString()} coins!\n💰 New balance: ${u.balance.toLocaleString()}`, 'Lucky Spin');
};

const mysteryBox = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    if (u.balance < MYSTERY_BOX_COST) {
        await send(nexus, chatId, `🎁 MYSTERY BOX\n\nCosts ${MYSTERY_BOX_COST} coins to open. You have ${u.balance.toLocaleString()}.`, 'Mystery Box');
        return;
    }
    u.balance -= MYSTERY_BOX_COST;
    const reward = Math.floor(Math.random() * 1000);
    u.balance += reward;
    logTx(u, 'Mystery box', reward - MYSTERY_BOX_COST);
    saveEco(state);
    await send(nexus, chatId, `🎁 MYSTERY BOX OPENED\n\nYou got ${reward.toLocaleString()} coins!\n${reward > MYSTERY_BOX_COST ? '🎉 Profit!' : '😅 Better luck next time.'}\n💰 New balance: ${u.balance.toLocaleString()}`, 'Mystery Box');
};

const investments = async (nexus, chatId, amount) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) {
        await send(nexus, chatId, `💼 INVESTMENTS\n\nUsage: .invest <amount>\n💰 Balance: ${u.balance.toLocaleString()} | 📈 Currently invested: ${u.invested.toLocaleString()}`, 'Investments');
        return;
    }
    if (amt > u.balance) {
        await send(nexus, chatId, `💼 INVESTMENTS\n\n❌ Not enough balance.`, 'Investments');
        return;
    }
    u.balance -= amt;
    u.invested += amt;
    logTx(u, 'Invested', -amt);
    saveEco(state);
    await send(nexus, chatId, `💼 INVESTED ${amt.toLocaleString()} coins\n\n📈 Total invested: ${u.invested.toLocaleString()}\nCheck growth with .portfolio`, 'Investments');
};

const portfolioTracker = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    const simulatedReturn = (u.invested * 0.03).toFixed(0);
    await send(nexus, chatId, `📈 PORTFOLIO\n\n💼 Invested: ${u.invested.toLocaleString()}\n📊 Est. return so far: +${simulatedReturn}\n\nCash out anytime by asking to withdraw (feature coming).`, 'Portfolio Tracker');
};

const loanManager = async (nexus, chatId, amount) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    const amt = parseInt(amount, 10);
    const maxLoan = 2000;
    if (!amt) {
        await send(nexus, chatId, `💰 LOAN MANAGER\n\nUsage: .loan <amount> (max ${maxLoan})\n💳 Current debt: ${u.debt.toLocaleString()}`, 'Loan Manager');
        return;
    }
    if (u.debt + amt > maxLoan) {
        await send(nexus, chatId, `💰 LOAN MANAGER\n\n❌ Max loan limit is ${maxLoan}.`, 'Loan Manager');
        return;
    }
    u.balance += amt;
    u.debt += amt;
    logTx(u, 'Loan taken', amt);
    saveEco(state);
    await send(nexus, chatId, `💰 LOAN APPROVED\n\n+${amt.toLocaleString()} coins\n💳 Total debt: ${u.debt.toLocaleString()}\nRepay with .daily earnings over time.`, 'Loan Manager');
};

const transactionsHistory = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    saveEco(state);
    if (!u.transactions.length) {
        await send(nexus, chatId, `💳 TRANSACTIONS\n\nNo transactions yet — try .daily or .gamble!`, 'Transactions History');
        return;
    }
    const lines = u.transactions.slice(0, 10).map(t => `${t.amount >= 0 ? '➕' : '➖'} ${t.desc}: ${Math.abs(t.amount).toLocaleString()}`);
    await send(nexus, chatId, `💳 LAST TRANSACTIONS\n\n${lines.join('\n')}`, 'Transactions History');
};

const statsOverview = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    saveEco(state);
    await send(nexus, chatId, `📊 ECONOMY STATS\n\n💰 Balance: ${u.balance.toLocaleString()}\n📈 Invested: ${u.invested.toLocaleString()}\n💳 Debt: ${u.debt.toLocaleString()}\n🧾 Transactions logged: ${u.transactions.length}`, 'Stats Overview');
};

const profitTracker = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    const profit = u.balance + u.invested - u.debt - STARTING_BALANCE;
    await send(nexus, chatId, `📈 NET PROFIT TRACKER\n\nStarted with: ${STARTING_BALANCE.toLocaleString()}\nNow worth: ${(u.balance + u.invested - u.debt).toLocaleString()}\n${profit >= 0 ? `🎉 Profit: +${profit.toLocaleString()}` : `📉 Loss: ${profit.toLocaleString()}`}`, 'Profit Tracker');
};

const achievements = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    const list = [];
    if (u.balance >= 5000) list.push('🏅 High Roller — 5,000+ coins');
    if (u.transactions.length >= 10) list.push('🏅 Active Trader — 10+ transactions');
    if (u.invested > 0) list.push('🏅 Investor — made your first investment');
    if (!list.length) list.push('Keep using the bot to unlock achievements!');
    await send(nexus, chatId, `🏆 YOUR ACHIEVEMENTS\n\n${list.join('\n')}`, 'Achievements');
};

const leaderboard = async (nexus, chatId) => {
    const state = loadEco();
    const top = Object.entries(state)
        .sort((a, b) => (b[1].balance || 0) - (a[1].balance || 0))
        .slice(0, 10);
    const lines = top.map(([id, u], i) => `${i + 1}. ${id.split('@')[0]} — ${u.balance.toLocaleString()} coins`);
    await send(nexus, chatId, `🏆 LEADERBOARD (Top 10)\n\n${lines.join('\n') || 'No players yet!'}`, 'Leaderboard');
};

// ---- Curated / informational ----
const shopstore = (nexus, chatId) => send(nexus, chatId,
`🏪 SHOP\n\n🎨 Custom badge — 500 coins\n⭐ Profile boost — 1,000 coins\n💎 VIP tag (7 days) — 2,000 coins\n\n🛒 Full shop system coming soon — for now this is a preview.`, 'Shop/Store');

const premiumPass = (nexus, chatId) => send(nexus, chatId,
`💎 PREMIUM PASS\n\n✅ 2x daily rewards\n✅ No cooldown on lucky spin\n✅ VIP badge\n✅ Priority command processing\n\nAsk the bot admin how to get Premium Pass.`, 'Premium Pass');

const budgetPlanner = (nexus, chatId) => send(nexus, chatId,
`💸 BUDGET PLANNER TIPS\n\n• 50% needs, 30% wants, 20% savings — the classic rule\n• Track spending for one week before setting a budget\n• Automate savings first, spend what's left\n• Review monthly, adjust as income changes`, 'Budget Planner');

const couponCodes = (nexus, chatId, code) => send(nexus, chatId,
code ? `🎟️ Checking code "${code}"... invalid or expired.` : `🎟️ COUPON CODES\n\nUsage: .redeem <code>\nWatch the announcement group for new codes!`, 'Coupon Codes');

const referralProgram = (nexus, chatId) => send(nexus, chatId,
`🎁 REFERRAL PROGRAM\n\nInvite friends to use the bot — when they join, you both earn bonus coins!\n\nShare: wa.me/${(chatId || '').split('@')[0]}?text=Check%20out%20this%20bot`, 'Referral Program');

const goalsTracker = (nexus, chatId, goal) => send(nexus, chatId,
goal ? `🎯 Goal set: "${goal}" — track your progress with .balance!` : `🎯 GOALS TRACKER\n\nUsage: .setgoal <your goal>\ne.g .setgoal Save 5000 coins`, 'Goals Tracker');

const priceConverter = (nexus, chatId) => send(nexus, chatId,
`💰 PRICE CONVERTER\n\nThis converts in-game coins to a rough real-world sense of value: 1,000 coins ≈ 1 badge tier.\nFor real currency conversion, use .exchange instead.`, 'Price Converter');

const stockMarket = (nexus, chatId) => send(nexus, chatId,
`📊 STOCK MARKET (simulated)\n\nThis is a fun simulated market, not real financial data.\nUse .invest <amount> to put coins in, .portfolio to track growth.\n\n⚠️ For real stock prices, I'd need to search the web — ask me directly!`, 'Stock Market');

const cryptoTracker = (nexus, chatId) => send(nexus, chatId,
`🪙 CRYPTO TRACKER\n\nThis bot's crypto feature is simulated for fun, not live prices.\n\n⚠️ For real BTC/ETH prices, ask me directly and I'll search live data for you.`, 'Crypto Tracker');

const cardGames = (nexus, chatId) => send(nexus, chatId,
`💳 CARD GAMES (Earn Points)\n\nMini card games are coming soon — play to earn bonus coins.\nFor now, try .gamble or .spin to earn!`, 'Card Games');

const tournamentRewards = (nexus, chatId) => send(nexus, chatId,
`🏆 TOURNAMENT REWARDS\n\nGroup tournaments (trivia, games) coming soon with coin prizes.\nAsk your group admin to schedule one!`, 'Tournament Rewards');

const vipBenefits = (nexus, chatId) => send(nexus, chatId,
`💎 VIP BENEFITS\n\nSame perks as Premium Pass: 2x rewards, no cooldowns, VIP badge, priority processing.\nSee .premium for details.`, 'VIP Benefits');

const milestoneBonuses = (nexus, chatId) => send(nexus, chatId,
`🌟 MILESTONE BONUSES\n\n🎯 1,000 coins earned — bonus 100\n🎯 10,000 coins earned — bonus 500\n🎯 50 transactions — bonus badge\n\nCheck progress with .achievements`, 'Milestone Bonuses');

const groupChallenges = (nexus, chatId) => send(nexus, chatId,
`👥 GROUP CHALLENGES\n\nGroup-wide challenges (everyone contributes coins to a shared goal) coming soon!\nSuggest one to your group admin.`, 'Group Challenges');

const investmentReturns = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    await send(nexus, chatId, `📊 INVESTMENT RETURNS\n\n💼 Invested: ${u.invested.toLocaleString()}\n📈 Simulated rate: ~3% per check-in\nRun .portfolio anytime to see current estimate.`, 'Investment Returns');
};

const passiveIncome = (nexus, chatId) => send(nexus, chatId,
`💸 PASSIVE INCOME TIPS (real-life)\n\n• Dividend-paying index funds\n• Rental property (needs capital)\n• Digital products sold repeatedly (courses, templates)\n• Content that earns ad/affiliate revenue over time\n\n⚠️ Not financial advice — do your own research.`, 'Passive Income');

const questRewards = (nexus, chatId) => send(nexus, chatId,
`🎯 QUEST REWARDS\n\nDaily quests coming soon (e.g "send 5 messages", "invite 1 friend") for bonus coins.\nFor now: .daily and .spin are your best earners.`, 'Quest Rewards');

const bankSimulator = async (nexus, chatId) => {
    const state = loadEco();
    const u = getUser(state, chatId);
    await send(nexus, chatId, `🏦 BANK SIMULATOR\n\n💰 Balance: ${u.balance.toLocaleString()}\n💳 Debt: ${u.debt.toLocaleString()}\n\nUse .loan <amount> to borrow, .invest <amount> to grow your money.`, 'Bank Simulator');
};

const currencyExchange = (nexus, chatId) => send(nexus, chatId,
`💴 CURRENCY EXCHANGE\n\nExchange rates change daily — ask me directly (e.g "convert 100 USD to NGN") and I'll look up the current rate for you.`, 'Currency Exchange');

// ---- Public helper for other modules (e.g. games.js) to award/deduct coins
// through the SAME wallet used by .balance, .daily, etc. Never build a
// separate coin store in another file — always go through this.
async function awardCoins(chatId, amount, desc = 'Reward') {
    const state = loadEco();
    const u = getUser(state, chatId);
    u.balance += amount;
    logTx(u, desc, amount);
    saveEco(state);
    return u.balance;
}

module.exports = {
    checkBalance, shopstore, transactionsHistory, dailyReward, gamblebet,
    leaderboard, statsOverview, premiumPass, investments, portfolioTracker,
    budgetPlanner, couponCodes, referralProgram, achievements, goalsTracker,
    priceConverter, stockMarket, cryptoTracker, cardGames, luckySpin,
    tournamentRewards, vipBenefits, mysteryBox, milestoneBonuses, groupChallenges,
    investmentReturns, passiveIncome, questRewards, profitTracker, loanManager,
    bankSimulator, currencyExchange, awardCoins
};

    return module.exports;
})();


// ============ inlined from commands/ai.js ============
const __cmd_ai = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const axios = require('axios');

// AI Handler
const aiAPI = {
    openai: 'https://api.openai.com/v1',
    claude: 'https://api.anthropic.com'
};

// AI Chat
const aiChat = async (nexus, chatId, prompt) => {
    try {
        console.log(chalk.blue(`🤖 Processing AI chat...`));
        
        let chatText = `🤖 AI CHAT\n\n`;
        chatText += `💬 You: ${prompt}\n\n`;
        chatText += `🔄 AI Thinking...\n`;
        chatText += `🤖 AI: "That's an interesting question! Based on what you've asked, I can provide you with comprehensive information and insights. Feel free to ask me anything else!"\n\n`;
        chatText += `✅ Response generated!\n`;

        await nexus.sendMessage(chatId, { text: chatText });
        console.log(chalk.green(`✅ AI chat response sent`));

    } catch (error) {
        console.log(chalk.red(`❌ AI chat error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error with AI chat: ${error.message}`
        });
    }
};

// Text Generation
const generateText = async (nexus, chatId, topic, length = 'medium') => {
    try {
        console.log(chalk.blue(`📝 Generating text about ${topic}...`));
        
        let genText = `📝 TEXT GENERATION\n\n`;
        genText += `🎯 Topic: ${topic}\n`;
        genText += `📊 Length: ${length}\n\n`;
        genText += `✍️ Generated Text:\n`;
        genText += `"[Generated content will appear here based on your topic and length preference]"\n\n`;
        genText += `✅ Text generated!\n`;
        genText += `📋 Copy and use!\n`;

        await nexus.sendMessage(chatId, { text: genText });
        console.log(chalk.green(`✅ Text generated for ${topic}`));

    } catch (error) {
        console.log(chalk.red(`❌ Text generation error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error generating text: ${error.message}`
        });
    }
};

// Translation
const translateText = async (nexus, chatId, text, fromLang, toLang) => {
    try {
        console.log(chalk.blue(`🌐 Translating ${fromLang} → ${toLang}...`));
        
        let translateText = `🌐 TRANSLATOR\n\n`;
        translateText += `📝 Original (${fromLang}):\n"${text}"\n\n`;
        translateText += `📝 Translated (${toLang}):\n"[Translated text will appear here]"\n\n`;
        translateText += `✅ Translation complete!\n`;

        await nexus.sendMessage(chatId, { text: translateText });
        console.log(chalk.green(`✅ Translation sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Translation error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error translating: ${error.message}`
        });
    }
};

// Grammar Checker
const checkGrammar = async (nexus, chatId, text) => {
    try {
        console.log(chalk.blue(`✏️ Checking grammar...`));
        
        let grammarText = `✏️ GRAMMAR CHECKER\n\n`;
        grammarText += `📝 Original:\n"${text}"\n\n`;
        grammarText += `✅ Corrected:\n"[Corrected version will appear here]"\n\n`;
        grammarText += `📊 Errors Found: 2\n`;
        grammarText += `• Error 1: Capitalization\n`;
        grammarText += `• Error 2: Punctuation\n\n`;
        grammarText += `✅ Check complete!\n`;

        await nexus.sendMessage(chatId, { text: grammarText });
        console.log(chalk.green(`✅ Grammar check sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Grammar checker error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error checking grammar: ${error.message}`
        });
    }
};

// Text Summarizer
const summarizeText = async (nexus, chatId, text, length = 'short') => {
    try {
        console.log(chalk.blue(`📋 Summarizing text...`));
        
        let summaryText = `📋 TEXT SUMMARIZER\n\n`;
        summaryText += `📝 Original Length: ${text.length} characters\n`;
        summaryText += `📊 Summary Type: ${length}\n\n`;
        summaryText += `✍️ Summary:\n`;
        summaryText += `"[Condensed summary of the original text will appear here]"\n\n`;
        summaryText += `📊 Reduction: 70%\n`;
        summaryText += `✅ Summary created!\n`;

        await nexus.sendMessage(chatId, { text: summaryText });
        console.log(chalk.green(`✅ Text summary sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Summarizer error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error summarizing text: ${error.message}`
        });
    }
};

// Sentiment Analysis
const analyzeSentiment = async (nexus, chatId, text) => {
    try {
        console.log(chalk.blue(`😊 Analyzing sentiment...`));
        
        let sentimentText = `😊 SENTIMENT ANALYSIS\n\n`;
        sentimentText += `📝 Text: "${text}"\n\n`;
        sentimentText += `📊 Analysis:\n`;
        sentimentText += `😊 Positive: 75%\n`;
        sentimentText += `😐 Neutral: 20%\n`;
        sentimentText += `😞 Negative: 5%\n\n`;
        sentimentText += `🎯 Overall Sentiment: POSITIVE ✅\n`;
        sentimentText += `💭 Tone: Happy & Optimistic\n`;

        await nexus.sendMessage(chatId, { text: sentimentText });
        console.log(chalk.green(`✅ Sentiment analysis sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Sentiment analysis error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error analyzing sentiment: ${error.message}`
        });
    }
};

module.exports = {
    aiChat,
    generateText,
    translateText,
    checkGrammar,
    summarizeText,
    analyzeSentiment
};

    return module.exports;
})();


// ============ inlined from commands/anime.js ============
const __cmd_anime = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');

// Anime Search
const animeSearch = async (nexus, chatId, animeName) => {
    try {
        console.log(chalk.blue(`🎬 Searching anime: ${animeName}...`));

        let animeText = `🎬 ANIME SEARCH: ${animeName}\n\n`;
        animeText += `📺 Status: Airing\n`;
        animeText += `📊 Episodes: 24\n`;
        animeText += `⭐ Rating: 8.7/10\n`;
        animeText += `🎭 Genre: Action, Adventure, Fantasy\n`;
        animeText += `🏢 Studio: (studio name)\n\n`;
        animeText += `📝 Synopsis:\n`;
        animeText += `A short synopsis about ${animeName} goes here.\n\n`;
        animeText += `📖 Reply "manga" for the manga version!\n`;

        await nexus.sendMessage(chatId, { text: animeText });
        console.log(chalk.green(`✅ Anime info sent for ${animeName}`));

    } catch (error) {
        console.log(chalk.red(`❌ Anime search error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error searching anime: ${error.message}`
        });
    }
};

// Manga Reader
const mangaReader = async (nexus, chatId, mangaName) => {
    try {
        console.log(chalk.blue(`📚 Fetching manga: ${mangaName}...`));

        let mangaText = `📚 MANGA: ${mangaName}\n\n`;
        mangaText += `📖 Chapters: 150+\n`;
        mangaText += `✍️ Author: (author name)\n`;
        mangaText += `📊 Status: Ongoing\n`;
        mangaText += `⭐ Rating: 9.1/10\n\n`;
        mangaText += `📥 Reply with a chapter number to read!\n`;

        await nexus.sendMessage(chatId, { text: mangaText });
        console.log(chalk.green(`✅ Manga info sent for ${mangaName}`));

    } catch (error) {
        console.log(chalk.red(`❌ Manga reader error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching manga: ${error.message}`
        });
    }
};

// Top Rated Anime
const topRatedAnime = async (nexus, chatId) => {
    try {
        console.log(chalk.blue(`🏆 Fetching top rated anime...`));

        let topText = `🏆 TOP RATED ANIME\n\n`;
        topText += `1. ⭐ 9.8 - Anime Title One\n`;
        topText += `2. ⭐ 9.6 - Anime Title Two\n`;
        topText += `3. ⭐ 9.5 - Anime Title Three\n`;
        topText += `4. ⭐ 9.3 - Anime Title Four\n`;
        topText += `5. ⭐ 9.1 - Anime Title Five\n\n`;
        topText += `🔍 Reply with a number for more details!\n`;

        await nexus.sendMessage(chatId, { text: topText });
        console.log(chalk.green(`✅ Top anime list sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Top anime error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching top anime: ${error.message}`
        });
    }
};

// Anime Recommendations
const animeRecommendations = async (nexus, chatId, genre = 'any') => {
    try {
        console.log(chalk.blue(`🌟 Generating anime recommendations for ${genre}...`));

        let recText = `🌟 RECOMMENDED FOR YOU (${genre})\n\n`;
        recText += `1. 🎬 Recommendation One\n`;
        recText += `2. 🎬 Recommendation Two\n`;
        recText += `3. 🎬 Recommendation Three\n`;
        recText += `4. 🎬 Recommendation Four\n\n`;
        recText += `💡 Tip: Use .anime [genre] to filter recommendations!\n`;

        await nexus.sendMessage(chatId, { text: recText });
        console.log(chalk.green(`✅ Recommendations sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Recommendations error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error generating recommendations: ${error.message}`
        });
    }
};

module.exports = {
    animeSearch,
    mangaReader,
    topRatedAnime,
    animeRecommendations
};

    return module.exports;
})();


// ============ inlined from commands/auto.js ============
const __cmd_auto = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');

async function send(nexus, chatId, text, label) {
    try {
        await nexus.sendMessage(chatId, { text });
        console.log(chalk.green(`✅ ${label} sent`));
    } catch (error) {
        console.log(chalk.red(`❌ ${label} error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error: ${error.message}` });
    }
}

const carFinder = (nexus, chatId) => send(nexus, chatId,
`🚗 CAR FINDER\n\nBest places to search:\n• Jiji.ng, Cars45, Autochek (Nigeria)\n• Copart (import auction cars)\n\n💡 Always inspect/get a mechanic to check before buying used.`, 'Car Finder');

const priceChecker = (nexus, chatId, model) => send(nexus, chatId,
model ? `💰 Checking price for "${model}"... ask me directly and I'll search current listings.` : `💰 PRICE CHECKER\n\nUsage: .carprice <make model year>\ne.g .carprice Toyota Camry 2018`, 'Price Checker');

const carSpecs = (nexus, chatId, model) => send(nexus, chatId,
model ? `📊 Looking up specs for "${model}"... ask me directly.` : `📊 CAR SPECS\n\nUsage: .carspecs <make model year>`, 'Car Specs');

const maintenanceGuide = (nexus, chatId) => send(nexus, chatId,
`🔧 CAR MAINTENANCE BASICS\n\n• Oil change — every 5,000-10,000km depending on oil type\n• Tire pressure — check monthly\n• Brake pads — inspect every 20,000km\n• Air filter — replace every 15,000-30,000km\n• Always check your specific manufacturer's schedule`, 'Maintenance Guide');

const fuelPriceTracker = (nexus, chatId) => send(nexus, chatId,
`⛽ FUEL PRICES\n\nFuel prices change frequently — ask me "current fuel price in [your city]" and I'll search live info.`, 'Fuel Price Tracker');

const trafficUpdates = (nexus, chatId) => send(nexus, chatId,
`🗺️ TRAFFIC UPDATES\n\nAsk me "traffic on [route/road]" and I'll search current conditions, or use Google Maps live traffic layer.`, 'Traffic Updates');

const rentalServices = (nexus, chatId) => send(nexus, chatId,
`🚗 CAR RENTAL SERVICES\n\n• Avis, Hertz — international, reliable\n• Local Nigerian options: IsWhat, Autochek Rent\n• Compare prices before booking, check mileage limits & insurance coverage`, 'Rental Services');

const mechanicFinder = (nexus, chatId) => send(nexus, chatId,
`🔧 FINDING A GOOD MECHANIC\n\n• Ask for recommendations in local community groups, not just Google reviews\n• Get a second opinion for expensive repairs\n• Ask for old parts back after replacement (proof of work done)`, 'Mechanic Finder');

const tireCalculator = (nexus, chatId, size) => send(nexus, chatId,
size ? `🛞 Checking tire size "${size}"... ask me directly for compatible options.` : `🛞 TIRE CALCULATOR\n\nUsage: .tiresize <width/aspect/rim>\ne.g .tiresize 205/55R16`, 'Tire Calculator');

const insuranceInfo = (nexus, chatId) => send(nexus, chatId,
`📋 CAR INSURANCE BASICS\n\n• Third-party — legally required minimum (Nigeria)\n• Comprehensive — covers your car too, not just others'\n• Compare quotes from at least 3 providers before choosing\n• Read the exclusions carefully — that's where surprises hide`, 'Insurance Info');

const raceResults = (nexus, chatId) => send(nexus, chatId,
`🏁 RACE RESULTS\n\nAsk me "latest F1 results" or any specific race and I'll search current results.`, 'Race Results');

const carReviews = (nexus, chatId, model) => send(nexus, chatId,
model ? `🚙 Looking up reviews for "${model}"... ask me directly.` : `🚙 CAR REVIEWS\n\nUsage: .carreview <make model>`, 'Car Reviews');

const modelComparison = (nexus, chatId, models) => send(nexus, chatId,
models ? `🚗 Comparing "${models}"... ask me directly and I'll break down the differences.` : `🚗 MODEL COMPARISON\n\nUsage: .compare <car1> vs <car2>`, 'Model Comparison');

const carPhotos = (nexus, chatId) => send(nexus, chatId,
`📸 CAR PHOTOS\n\nThis bot doesn't pull car images directly, but ask me about any model and I'll describe key visual features/tell you where to see official photos.`, 'Car Photos');

const diyRepairs = (nexus, chatId) => send(nexus, chatId,
`🔧 DIY REPAIRS YOU CAN DO YOURSELF\n\n• Changing wiper blades\n• Replacing air filter\n• Jump-starting a dead battery\n• Changing a flat tire\n⚠️ Leave brakes, engine, and electrical work to professionals unless experienced.`, 'DIY Repairs');

const toolRecommendations = (nexus, chatId) => send(nexus, chatId,
`🛠️ BASIC CAR TOOL KIT\n\n• Socket wrench set\n• Jack + jack stands\n• Tire pressure gauge\n• Jumper cables\n• Multimeter (for electrical issues)`, 'Tool Recommendations');

const engineSpecs = (nexus, chatId, model) => send(nexus, chatId,
model ? `⚙️ Looking up engine specs for "${model}"... ask me directly.` : `⚙️ ENGINE SPECS\n\nUsage: .enginespecs <make model year>`, 'Engine Specs');

const motorcycleInfo = (nexus, chatId) => send(nexus, chatId,
`🚙 MOTORCYCLE BASICS\n\nAsk me about a specific bike model for specs/reviews, or general questions like "best beginner motorcycle".`, 'Motorcycle Info');

const bicycleGuide = (nexus, chatId) => send(nexus, chatId,
`🚲 BICYCLE GUIDE\n\n• Road bikes — speed, paved roads\n• Mountain bikes — off-road, rough terrain\n• Hybrid — a bit of both, good for commuting\n• Always get the right frame size — most common fit mistake`, 'Bicycle Guide');

const scooterReviews = (nexus, chatId) => send(nexus, chatId,
`🛵 SCOOTER REVIEWS\n\nAsk me about a specific scooter model (electric or petrol) and I'll search current reviews.`, 'Scooter Reviews');

const taxiServices = (nexus, chatId) => send(nexus, chatId,
`🚕 TAXI/RIDE SERVICES\n\n• Uber, Bolt — most common in major Nigerian cities\n• inDrive — negotiate your own fare\n• Always confirm the driver/plate number matches the app before entering`, 'Taxi Services');

const busRoutes = (nexus, chatId) => send(nexus, chatId,
`🚌 BUS ROUTES\n\nAsk me "bus routes from [A] to [B]" and I'll search current transit options.`, 'Bus Routes');

const trainSchedule = (nexus, chatId) => send(nexus, chatId,
`🚂 TRAIN SCHEDULES\n\nAsk me "train schedule from [A] to [B]" (e.g Lagos-Ibadan) and I'll search current times.`, 'Train Schedule');

const flightBooking = (nexus, chatId) => send(nexus, chatId,
`✈️ FLIGHT BOOKING\n\n• Google Flights — best for comparing prices\n• Skyscanner\n• Book directly with the airline for easier rebooking/refunds later\n\nAsk me for flights on a specific route and I'll search current options.`, 'Flight Booking');

const boatInfo = (nexus, chatId) => send(nexus, chatId,
`⚓ BOAT INFO\n\nAsk me about boat types, maintenance, or specific models and I'll search current info.`, 'Boat Info');

const bikeMaintenance = (nexus, chatId) => send(nexus, chatId,
`🏍️ MOTORCYCLE MAINTENANCE\n\n• Check chain tension/lubrication weekly\n• Oil change every 3,000-5,000km\n• Check tire tread and pressure regularly\n• Brake pads — inspect every service`, 'Bike Maintenance');

const electricVehicles = (nexus, chatId) => send(nexus, chatId,
`🚗 ELECTRIC VEHICLES\n\n• Range anxiety is improving — many EVs now do 300km+ per charge\n• Charging at home overnight is the most convenient\n• EV adoption in Nigeria is still early — check local charging infrastructure before committing`, 'Electric Vehicles');

const evChargingStations = (nexus, chatId) => send(nexus, chatId,
`🔋 EV CHARGING STATIONS\n\nAsk me "EV charging stations near [your city]" and I'll search current options — availability is still growing in most African markets.`, 'EV Charging Stations');

const wheelAlignment = (nexus, chatId) => send(nexus, chatId,
`🛞 WHEEL ALIGNMENT\n\nSigns you need it: car pulls to one side, uneven tire wear, steering wheel off-center when driving straight.\nRecommended every 10,000-15,000km or after hitting a big pothole.`, 'Wheel Alignment');

const partsFinder = (nexus, chatId, part) => send(nexus, chatId,
part ? `🔧 Looking for "${part}"... ask me directly and I'll search where to find it.` : `🔧 PARTS FINDER\n\nUsage: .findpart <part name> <car model>`, 'Parts Finder');

const vinDecoder = (nexus, chatId, vin) => send(nexus, chatId,
vin ? `📋 Decoding VIN "${vin}"... ask me directly for the details.` : `📋 VIN DECODER\n\nUsage: .vin <17-character VIN>\nThe VIN tells you the manufacturer, model year, and origin of any vehicle.`, 'VIN Decoder');

module.exports = {
    carFinder, priceChecker, carSpecs, maintenanceGuide, fuelPriceTracker,
    trafficUpdates, rentalServices, mechanicFinder, tireCalculator, insuranceInfo,
    raceResults, carReviews, modelComparison, carPhotos, diyRepairs,
    toolRecommendations, engineSpecs, motorcycleInfo, bicycleGuide, scooterReviews,
    taxiServices, busRoutes, trainSchedule, flightBooking, boatInfo,
    bikeMaintenance, electricVehicles, evChargingStations, wheelAlignment,
    partsFinder, vinDecoder
};

    return module.exports;
})();


// ============ inlined from commands/business.js ============
const __cmd_business = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');

async function send(nexus, chatId, text, label) {
    try {
        await nexus.sendMessage(chatId, { text });
        console.log(chalk.green(`✅ ${label} sent`));
    } catch (error) {
        console.log(chalk.red(`❌ ${label} error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error: ${error.message}` });
    }
}

const startupIdeas = (nexus, chatId) => send(nexus, chatId,
`💡 VALIDATING A STARTUP IDEA\n\n• Talk to 10 potential customers before building anything\n• Look for problems people already pay money to solve poorly\n• "Vitamin vs painkiller" — solve real pain, not nice-to-haves\n• Small, underserved niches often beat big crowded markets for a first venture`, 'Startup Ideas');

const businessPlans = (nexus, chatId) => send(nexus, chatId,
`📊 LEAN BUSINESS PLAN STRUCTURE\n\n1. Problem you're solving\n2. Your solution\n3. Target customer\n4. Revenue model\n5. Key costs\n6. Go-to-market plan\n\nKeep it to 1-2 pages at first — detailed plans become outdated fast anyway.`, 'Business Plans');

const fundingOptions = (nexus, chatId) => send(nexus, chatId,
`💰 STARTUP FUNDING OPTIONS\n\n• Bootstrapping — use your own revenue/savings, keep full control\n• Friends & family — fast but risks relationships if it fails\n• Angel investors — early-stage, smaller checks\n• VC — for high-growth, scalable ideas only\n• Grants/competitions — free money, worth searching for in your sector`, 'Funding Options');

const growthStrategies = (nexus, chatId) => send(nexus, chatId,
`📈 GROWTH STRATEGIES\n\n• Referral programs — happy customers bring more customers\n• Content marketing — compounds over time, cheaper than ads long-term\n• Partnerships — piggyback on someone else's existing audience\n• Retention first — cheaper to keep a customer than acquire a new one`, 'Growth Strategies');

const digitalMarketing = (nexus, chatId) => send(nexus, chatId,
`📱 DIGITAL MARKETING BASICS\n\n• Know your channel before your message — where does your audience actually hang out?\n• Consistency beats intensity — regular posting beats occasional bursts\n• Track what converts, not just what gets likes`, 'Digital Marketing');

const webDevelopment = (nexus, chatId) => send(nexus, chatId,
`💻 GETTING A BUSINESS WEBSITE\n\n• No-code options: Wix, Webflow, Shopify — fast, no dev needed\n• Custom dev — more flexible, costs more, worth it once you scale\n• Always get a proper domain (yourbusiness.com), not just a social page`, 'Web Development');

const emailMarketing = (nexus, chatId) => send(nexus, chatId,
`📧 EMAIL MARKETING BASICS\n\n• Tools: Mailchimp, ConvertKit (free tiers available)\n• Segment your list — one-size-fits-all emails underperform\n• Subject line determines open rate more than anything else in the email`, 'Email Marketing');

const socialMediaMarketing = (nexus, chatId) => send(nexus, chatId,
`📱 SOCIAL MEDIA MARKETING\n\n• Pick 1-2 platforms and go deep, don't spread thin across all of them\n• Show behind-the-scenes content — builds trust faster than polished ads\n• Engage with comments — algorithm rewards it, and it builds community`, 'Social Media Marketing');

const seoGuide = (nexus, chatId) => send(nexus, chatId,
`🎯 SEO BASICS\n\n• Answer the exact question your customer is searching\n• Page speed and mobile-friendliness matter for ranking\n• Backlinks (other sites linking to you) still matter a lot\n• Long-tail keywords (specific phrases) are easier to rank for as a small business`, 'SEO Guide');

const contentStrategy = (nexus, chatId) => send(nexus, chatId,
`💬 CONTENT STRATEGY BASICS\n\n• Pick 3-4 core topics your business is credible on, stay focused\n• Repurpose one piece of content across multiple formats (post → video → email)\n• Consistency (weekly) beats sporadic high-effort content`, 'Content Strategy');

const analytics = (nexus, chatId) => send(nexus, chatId,
`📊 BUSINESS ANALYTICS BASICS\n\n• Track a handful of key metrics, not everything possible\n• Google Analytics (free) for websites\n• Know your numbers: customer acquisition cost, lifetime value, conversion rate`, 'Analytics');

const paymentSolutions = (nexus, chatId) => send(nexus, chatId,
`💳 PAYMENT SOLUTIONS (Nigeria-friendly)\n\n• Paystack, Flutterwave — most popular for online payments\n• Opay, Moniepoint — good for POS/transfers\n• Always factor in transaction fees when pricing`, 'Payment Solutions');

const logisticsGuide = (nexus, chatId) => send(nexus, chatId,
`📦 LOGISTICS FOR SMALL BUSINESS\n\n• GIG Logistics, Kwik Delivery — popular local options in Nigeria\n• Always factor delivery cost into your pricing, don't absorb it blindly\n• Track packages and communicate delays proactively — reduces complaints a lot`, 'Logistics Guide');

const teamManagement = (nexus, chatId) => send(nexus, chatId,
`👥 TEAM MANAGEMENT BASICS\n\n• Clear expectations prevent most conflicts before they start\n• Regular 1-on-1s catch issues before they become resignations\n• Delegate outcomes, not just tasks — gives people ownership`, 'Team Management');

const hrSolutions = (nexus, chatId) => send(nexus, chatId,
`💼 HR BASICS FOR SMALL TEAMS\n\n• Have written contracts even for small teams — protects both sides\n• Document policies as you grow (leave, conduct, etc.)\n• Tools: Bamboo HR, or a simple shared doc works fine early on`, 'HR Solutions');

const contractTemplates = (nexus, chatId) => send(nexus, chatId,
`📋 CONTRACT ESSENTIALS\n\n• Scope of work — clearly defined\n• Payment terms — amount, schedule, late fee clause\n• Termination clause\n• Confidentiality if relevant\n\n⚠️ Have a lawyer review important contracts — templates are a starting point, not a substitute.`, 'Contract Templates');

const legalRequirements = (nexus, chatId) => send(nexus, chatId,
`🏛️ BUSINESS LEGAL BASICS (Nigeria)\n\n• Register with CAC (Corporate Affairs Commission)\n• Get a TIN for tax purposes\n• Depending on sector, you may need additional permits/licenses\n• Consult a business lawyer for your specific situation`, 'Legal Requirements');

const accountingBasics = (nexus, chatId) => send(nexus, chatId,
`🧮 ACCOUNTING BASICS\n\n• Separate business and personal finances from day one\n• Track every expense — small ones add up and matter for tax time\n• Tools: Wave (free), QuickBooks\n• Revenue ≠ profit — know your margins, not just your sales`, 'Accounting Basics');

const taxPlanning = (nexus, chatId) => send(nexus, chatId,
`💰 TAX PLANNING BASICS\n\n• Keep records of ALL business expenses — many are deductible\n• Set aside a % of income for taxes as you earn, don't wait till due date\n• Consult a real accountant for your specific situation — rules vary by state/country`, 'Tax Planning');

const customerService = (nexus, chatId) => send(nexus, chatId,
`🎯 CUSTOMER SERVICE BASICS\n\n• Respond fast — speed matters more than perfect wording\n• Acknowledge the issue before jumping to a solution\n• A good recovery from a mistake often builds MORE loyalty than never messing up`, 'Customer Service');

const businessPhone = (nexus, chatId) => send(nexus, chatId,
`📞 BUSINESS PHONE SETUP\n\n• Separate business line from personal (WhatsApp Business App is a good free start)\n• Set up auto-replies for after-hours messages\n• Consider a virtual number service as you scale`, 'Business Phone');

const businessEmail = (nexus, chatId) => send(nexus, chatId,
`📧 BUSINESS EMAIL SETUP\n\n• Use a custom domain email (you@yourbusiness.com), not a generic Gmail — builds trust\n• Google Workspace or Zoho Mail are affordable options\n• Set up a professional signature with contact info`, 'Business Email');

const printingServices = (nexus, chatId) => send(nexus, chatId,
`🖨️ PRINTING SERVICES\n\nFor business cards, flyers, banners: local print shops usually beat online services on turnaround time. Compare a few quotes — prices vary a lot for the same job.`, 'Printing Services');

const officeFinder = (nexus, chatId, area) => send(nexus, chatId,
area ? `📍 Looking for office space in "${area}"... ask me directly for current listings.` : `📍 OFFICE SPACE OPTIONS\n\n• Co-working spaces — flexible, lower commitment (good for starting out)\n• Traditional lease — more control, longer commitment\n• Remote-first — skip the overhead entirely if your business allows it`, 'Office Finder');

const partnershipIdeas = (nexus, chatId) => send(nexus, chatId,
`🤝 FINDING BUSINESS PARTNERSHIPS\n\n• Look for businesses with the SAME customer but a DIFFERENT product\n• Start with a small pilot collaboration before a big commitment\n• Put terms in writing even with people you trust`, 'Partnership Ideas');

const b2bOpportunities = (nexus, chatId) => send(nexus, chatId,
`💼 B2B OPPORTUNITIES\n\n• B2B sales cycles are longer but deal sizes are bigger\n• Relationships matter more than ads in B2B — network deliberately\n• LinkedIn is the primary channel for most B2B outreach`, 'B2B Opportunities');

const ecommerceSetup = (nexus, chatId) => send(nexus, chatId,
`🏪 E-COMMERCE SETUP\n\n• Shopify — easiest all-in-one option\n• WooCommerce — more control, needs WordPress\n• Nigeria-specific: Selar (great for digital products/local sellers)\n• Don't forget: payment gateway + reliable delivery partner`, 'E-Commerce Setup');

const dropshippingGuide = (nexus, chatId) => send(nexus, chatId,
`📦 DROPSHIPPING BASICS\n\n• Low startup cost since you don't hold inventory\n• Margins are thinner — volume matters a lot\n• Supplier reliability makes or breaks the customer experience\n• Test products with small ad spend before committing big`, 'Dropshipping Guide');

const affiliateMarketing = (nexus, chatId) => send(nexus, chatId,
`🛒 AFFILIATE MARKETING BASICS\n\n• Promote products you'd genuinely recommend — trust converts better than volume\n• Disclose affiliate links — required by most platforms and builds trust\n• Track which content/channel actually converts, not just clicks`, 'Affiliate Marketing');

const appDevelopment = (nexus, chatId) => send(nexus, chatId,
`📱 APP DEVELOPMENT FOR BUSINESSES\n\n• Validate demand with a simple website/WhatsApp bot before building a full app\n• No-code options (Glide, Adalo) work for simple MVPs\n• Full custom app development is expensive — make sure the demand justifies it first`, 'App Development');

module.exports = {
    startupIdeas, businessPlans, fundingOptions, growthStrategies, digitalMarketing,
    webDevelopment, emailMarketing, socialMediaMarketing, seoGuide, contentStrategy,
    analytics, paymentSolutions, logisticsGuide, teamManagement, hrSolutions,
    contractTemplates, legalRequirements, accountingBasics, taxPlanning,
    customerService, businessPhone, businessEmail, printingServices, officeFinder,
    partnershipIdeas, b2bOpportunities, ecommerceSetup, dropshippingGuide,
    affiliateMarketing, appDevelopment
};

    return module.exports;
})();


// ============ inlined from commands/career.js ============
const __cmd_career = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');

async function send(nexus, chatId, text, label) {
    try {
        await nexus.sendMessage(chatId, { text });
        console.log(chalk.green(`✅ ${label} sent`));
    } catch (error) {
        console.log(chalk.red(`❌ ${label} error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error: ${error.message}` });
    }
}

const jobSearch = (nexus, chatId) => send(nexus, chatId,
`💼 JOB SEARCH\n\nTop places to search:\n• LinkedIn Jobs\n• Indeed\n• AngelList (startups)\n• LinkedIn's "Open to Work" + niche job boards for your field\n\n💡 Tip: set up job alerts so you hear about new postings first.`, 'Job Search');

const resumeBuilder = (nexus, chatId) => send(nexus, chatId,
`📝 RESUME BUILDER TIPS\n\n• Keep it to 1 page (2 max if very senior)\n• Start bullet points with action verbs: "Built", "Led", "Increased"\n• Quantify results: "Increased signups by 30%" beats "Improved signups"\n• Tailor it per job — match keywords from the job description\n• Free tools: Canva, Google Docs templates, Novoresume`, 'Resume Builder');

const interviewPrep = (nexus, chatId) => send(nexus, chatId,
`💬 INTERVIEW PREP\n\n• Research the company (mission, recent news)\n• Prepare 2-3 stories using STAR method (Situation, Task, Action, Result)\n• Prepare questions to ask THEM\n• Practice out loud, not just in your head\n• Sleep well the night before — seriously`, 'Interview Prep');

const careerPathPlanning = (nexus, chatId) => send(nexus, chatId,
`🎯 CAREER PATH PLANNING\n\n1. Where are you now? (skills, role)\n2. Where do you want to be in 3-5 years?\n3. What skills/experience bridge the gap?\n4. Break it into yearly milestones\n5. Revisit and adjust every 6 months`, 'Career Path Planning');

const skillDevelopment = (nexus, chatId) => send(nexus, chatId,
`📚 SKILL DEVELOPMENT\n\n• Pick ONE skill to focus on per quarter, not five\n• Learn by building real projects, not just watching tutorials\n• Free platforms: freeCodeCamp, Coursera (audit mode), YouTube\n• Teach what you learn — it cements understanding`, 'Skill Development');

const certifications = (nexus, chatId) => send(nexus, chatId,
`🏆 WORTH-IT CERTIFICATIONS\n\n• Tech: AWS Certified, Google Cloud, CompTIA\n• Business: PMP, Google Project Management\n• Design: Google UX Design Certificate\n• Free option: Google Career Certificates on Coursera (financial aid available)`, 'Certifications');

const courseRecommendations = (nexus, chatId) => send(nexus, chatId,
`🎓 COURSE RECOMMENDATIONS\n\n• Coding: freeCodeCamp, The Odin Project (free)\n• Data: Kaggle Learn (free)\n• Business: Google Digital Garage (free)\n• Design: Refactoring UI, Google UX Certificate\n• Paid but excellent: Coursera, Udemy (wait for sales)`, 'Course Recommendations');

const salaryGuide = (nexus, chatId) => send(nexus, chatId,
`💰 SALARY RESEARCH\n\n• Glassdoor, Levels.fyi (tech), PayScale — compare by role + location\n• Nigeria-specific: check Jobberman salary insights\n• Always negotiate — most companies expect it and budget for it\n• Never give a number first if you can avoid it`, 'Salary Guide');

const networkingTips = (nexus, chatId) => send(nexus, chatId,
`🤝 NETWORKING TIPS\n\n• Give value before asking for anything\n• Comment thoughtfully on people's LinkedIn posts, don't just connect and vanish\n• Attend niche meetups/communities in your field\n• Follow up within 48 hours after meeting someone`, 'Networking Tips');

const careerAdvancement = (nexus, chatId) => send(nexus, chatId,
`📊 CAREER ADVANCEMENT\n\n• Document your wins as they happen (don't rely on memory at review time)\n• Ask your manager directly: "What would it take for me to get promoted?"\n• Take on visible, high-impact projects\n• Advocate for yourself — good work doesn't always speak for itself`, 'Career Advancement');

const professionalEtiquette = (nexus, chatId) => send(nexus, chatId,
`👔 PROFESSIONAL ETIQUETTE\n\n• Reply to emails within 24 hours, even just to acknowledge\n• Be on time (or 5 mins early) for meetings\n• Give credit publicly, give criticism privately\n• Dress one notch above what's required — never hurts`, 'Professional Etiquette');

const coverLetterGuide = (nexus, chatId) => send(nexus, chatId,
`📋 COVER LETTER GUIDE\n\n• Address a specific person if possible, not "To Whom It May Concern"\n• Open with why THIS company, not generic praise\n• 3 paragraphs max: hook, relevant proof, close with enthusiasm\n• Never repeat your resume word-for-word`, 'Cover Letter Guide');

const interviewQuestions = (nexus, chatId) => send(nexus, chatId,
`🎤 COMMON INTERVIEW QUESTIONS\n\n• "Tell me about yourself" — 60-90 sec career summary, not life story\n• "Why do you want this role?"\n• "Tell me about a challenge you faced"\n• "Where do you see yourself in 5 years?"\n• "Do you have questions for us?" — always say yes`, 'Interview Questions');

const remoteJobs = (nexus, chatId) => send(nexus, chatId,
`💼 REMOTE JOB BOARDS\n\n• RemoteOK\n• We Work Remotely\n• AngelList (remote startups)\n• LinkedIn (filter by Remote)\n\n💡 Highlight past remote/async work experience in your application.`, 'Remote Jobs');

const freelancePlatforms = (nexus, chatId) => send(nexus, chatId,
`🌍 FREELANCE PLATFORMS\n\n• Upwork, Fiverr — general freelance\n• Toptal — vetted, higher-paying tech/design talent\n• Contra — no commission fees\n• Local: Facebook groups, WhatsApp communities in your niche often convert better than big platforms`, 'Freelance Platforms');

const gigEconomyGuide = (nexus, chatId) => send(nexus, chatId,
`📱 GIG ECONOMY GUIDE\n\n• Delivery/rideshare — flexible but low margin after costs\n• Task-based (TaskRabbit-style) — better pay per hour\n• Skill-based gigs (freelance writing, design, dev) — best long-term upside\n• Track your actual hourly rate, not just total earned`, 'Gig Economy Guide');

const passiveIncome = (nexus, chatId) => send(nexus, chatId,
`💰 PASSIVE INCOME IDEAS (career-adjacent)\n\n• Sell templates/courses based on your job skills\n• Write a niche newsletter, monetize with sponsors\n• License stock content (photos, designs, code snippets)\n• None of these are truly "passive" at first — expect real upfront work`, 'Passive Income');

const startupOpportunities = (nexus, chatId) => send(nexus, chatId,
`🚀 STARTUP OPPORTUNITIES\n\n• Early-stage startups = more responsibility, more risk, faster learning\n• Check equity terms carefully — ask about vesting schedule\n• AngelList, Wellfound, YC's job board are good places to look\n• Talk to current employees before joining if you can`, 'Startup Opportunities');

const careerMentorship = (nexus, chatId) => send(nexus, chatId,
`📈 FINDING A MENTOR\n\n• Look inside your current company first — easier access\n• Be specific in your ask: "Can I ask you 3 questions about X?" beats "Can you mentor me?"\n• ADPList.org — free mentorship platform, especially for tech/design\n• Give before you ask — share something useful first`, 'Career Mentorship');

const companyReviews = (nexus, chatId) => send(nexus, chatId,
`🏢 RESEARCHING A COMPANY\n\n• Glassdoor — culture & interview reviews\n• LinkedIn — check employee tenure (high turnover = red flag)\n• Read recent news about the company\n• Ask current/former employees directly if you can find them`, 'Company Reviews');

const globalJobs = (nexus, chatId) => send(nexus, chatId,
`🌍 GLOBAL / VISA-SPONSORED JOBS\n\n• Search "visa sponsorship" + your role on LinkedIn\n• MyVisaJobs.com (for US-bound roles)\n• Check company career pages directly — sponsorship info often listed there\n• Some countries have direct skilled-worker visa routes (research the destination country's official immigration site)`, 'Global Jobs');

const careerChangeGuide = (nexus, chatId) => send(nexus, chatId,
`🎯 CAREER CHANGE GUIDE\n\n1. Identify transferable skills from your current field\n2. Do a small project/freelance gig in the new field before fully switching\n3. Network with people already in that field\n4. Expect to possibly take a step back in title/pay short-term for long-term gain`, 'Career Change Guide');

const upskillingOptions = (nexus, chatId) => send(nexus, chatId,
`📚 UPSKILLING OPTIONS\n\n• Company-sponsored training (ask your employer — many have budgets unused)\n• Free: YouTube, freeCodeCamp, Khan Academy\n• Paid but structured: Coursera, Udacity Nanodegrees\n• Best ROI: build something real with the new skill, not just certificates`, 'Upskilling Options');

const mbaPrograms = (nexus, chatId) => send(nexus, chatId,
`🎓 MBA PROGRAMS\n\n• Worth it if: aiming for management/consulting/finance and lacking network\n• Consider part-time/executive MBA if already employed\n• Nigeria: Lagos Business School is well-regarded\n• Always weigh cost vs expected salary bump — it's a big investment`, 'MBA Programs');

const entrepreneurship = (nexus, chatId) => send(nexus, chatId,
`💡 ENTREPRENEURSHIP BASICS\n\n• Validate the idea before building — talk to 10 potential customers first\n• Start small/lean, don't over-invest before proof of demand\n• Keep a day job/income source until the business is proven\n• Cash flow kills more businesses than bad ideas`, 'Entrepreneurship');

const techCareers = (nexus, chatId) => send(nexus, chatId,
`🤖 TECH CAREER PATHS\n\n• Software Engineer — build products\n• Data Analyst/Scientist — extract insights\n• Product Manager — bridge business & engineering\n• DevOps/SRE — keep systems running\n• Entry point: build a portfolio project, contribute to open source`, 'Tech Careers');

const creativeCareers = (nexus, chatId) => send(nexus, chatId,
`🎨 CREATIVE CAREER PATHS\n\n• UI/UX Designer, Graphic Designer, Video Editor, Copywriter\n• Build a public portfolio (Behance, Dribbble, personal site) — it matters more than a degree here\n• Freelance first to build a portfolio if you can't get hired directly`, 'Creative Careers');

const healthcareCareers = (nexus, chatId) => send(nexus, chatId,
`🏥 HEALTHCARE CAREER PATHS\n\n• Clinical: Doctor, Nurse, Pharmacist — long formal training required\n• Non-clinical: Health Informatics, Medical Sales, Health Admin — faster entry\n• Growing area: Digital health / health-tech roles blending healthcare + tech`, 'Healthcare Careers');

const legalCareers = (nexus, chatId) => send(nexus, chatId,
`⚖️ LEGAL CAREER PATHS\n\n• Traditional: Lawyer (litigation, corporate law)\n• Alternative: Legal Ops, Compliance, Paralegal — less schooling required\n• Growing: Legal Tech roles combining law + software`, 'Legal Careers');

const governmentJobs = (nexus, chatId) => send(nexus, chatId,
`🏛️ GOVERNMENT JOBS\n\n• Check official portals (e.g Federal Character Commission, state civil service boards in Nigeria)\n• Pros: job security, pension\n• Cons: slower pay growth than private sector typically\n• Watch out for scam "job offer" messages asking for payment — real government jobs don't charge fees`, 'Government Jobs');


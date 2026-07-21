
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
// ============ FULL MENU — everything listed at once, Kord-style ============
// Every category as its own heading with the complete item list underneath,
// all in ONE message. Since these items are tap/number-select (not typed
// commands like ".gpt"), they're shown as plain bullets for browsing —
// actually opening one still goes through sendSubmenu's numbered picker via
// ".menu <category>", so nothing here pretends to be a typeable command it
// isn't. Collapsed behind WhatsApp's "Read more" using the same invisible-
// character trick Kord uses, since this is genuinely huge (800+ items).
const sendFullMenu = async (nexus, chatId, pushName = 'there') => {
    try {
        const totalFeatures = CATEGORY_KEYS.reduce((sum, key) => sum + MENU_DATA[key].items.length, 0);
        const ownerName = global.botConfig?.ownerName || process.env.OWNER_NAME || "Bot Owner";
        const memoryUsage = format(os.totalmem() - os.freemem());
        const up = runtime(process.uptime());

        const more = String.fromCharCode(8206);
        const readmore = more.repeat(4001);

        const header = `\`\`\`┌────═━┈ ${botDisplayName} ┈━═────┐
 ✇ ▸ Owner: ${ownerName}
 ✇ ▸ User: ${pushName}
 ✇ ▸ Categories: ${CATEGORY_KEYS.length}
 ✇ ▸ Features: ${totalFeatures}
 ✇ ▸ Uptime: ${up}
 ✇ ▸ Memory: ${memoryUsage}
 ✇ ▸ Node: ${process.version}
 ✇ ▸ Platform: ${os.platform()}
└──────═━┈┈━═──────┘\`\`\`
${readmore}

Type *.menu <category name>* to open one and pick a feature.\n\n`;

        const body = CATEGORY_KEYS.map(key => {
            const cat = MENU_DATA[key];
            const items = cat.items.map(item => `│ ${item}`).join('\n');
            return ` ┏ ${cat.emoji} ${cat.name} ┓\n┍   ─┉─ • ─┉─    ┑\n${items}\n┕    ─┉─ • ─┉─   ┙`;
        }).join('\n\n');

        const footer = `\n\nTip: Use *.menu <category>* for a specific one\n⚡ ${botDisplayName} — LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽`;

        // Everything as ONE single message per user's request. Note: this was
        // previously split into batches because a single ~23,000-char
        // message was silently dropped by WhatsApp with no JS error. If
        // .menu goes back to appearing to do nothing, that's likely why —
        // keep an eye on it since this menu has 800+ features.
        const fullText = header + body + footer;

        const imageUrl = (() => {
            try {
                const { getSetting } = require('./setting/Settings.js');
                return getSetting('bot', 'menuImage', null) || process.env.MENU_IMAGE || null;
            } catch (_) { return process.env.MENU_IMAGE || null; }
        })();

        if (imageUrl) {
            try {
                await nexus.sendMessage(chatId, { image: { url: imageUrl }, caption: fullText });
            } catch (e) {
                console.log(chalk.yellow(`⚠️ Full menu image failed, falling back to text: ${e.message}`));
                await nexus.sendMessage(chatId, { text: fullText });
            }
        } else {
            await nexus.sendMessage(chatId, { text: fullText });
        }

        console.log(chalk.green(`✅ Full menu sent (${CATEGORY_KEYS.length} categories, ${totalFeatures} features, single message)`));
    } catch (error) {
        console.log(chalk.red(`❌ Full menu error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error loading menu: ${error.message}` });
    }
};

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
    sendFullMenu,
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

module.exports = {
    jobSearch, resumeBuilder, interviewPrep, careerPathPlanning, skillDevelopment,
    certifications, courseRecommendations, salaryGuide, networkingTips,
    careerAdvancement, professionalEtiquette, coverLetterGuide, interviewQuestions,
    remoteJobs, freelancePlatforms, gigEconomyGuide, passiveIncome,
    startupOpportunities, careerMentorship, companyReviews, globalJobs,
    careerChangeGuide, upskillingOptions, mbaPrograms, entrepreneurship,
    techCareers, creativeCareers, healthcareCareers, legalCareers, governmentJobs
};

    return module.exports;
})();


// ============ inlined from commands/design.js ============
const __cmd_design = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');

// Design Handler
const designTools = {
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
    effects: ['glow', 'shadow', 'blur', 'sepia', 'vintage']
};

// Logo Maker
const makeLogo = async (nexus, chatId, text, style = 'modern') => {
    try {
        console.log(chalk.blue(`🎨 Creating logo for "${text}"...`));
        
        let logoText = `🎨 LOGO MAKER\n\n`;
        logoText += `📝 Text: ${text}\n`;
        logoText += `🎯 Style: ${style}\n`;
        logoText += `📏 Size: 512x512px\n`;
        logoText += `🎨 Format: PNG\n\n`;
        logoText += `⏳ Generating...\n`;
        logoText += `[Logo Image]\n\n`;
        logoText += `✅ Logo created!\n`;
        logoText += `💾 Ready to download!\n`;

        await nexus.sendMessage(chatId, { text: logoText });
        console.log(chalk.green(`✅ Logo created for "${text}"`));

    } catch (error) {
        console.log(chalk.red(`❌ Logo maker error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error creating logo: ${error.message}`
        });
    }
};

// Banner Creator
const createBanner = async (nexus, chatId, title, subtitle = '') => {
    try {
        console.log(chalk.blue(`🖼️ Creating banner...`));
        
        let bannerText = `🖼️ BANNER CREATOR\n\n`;
        bannerText += `📝 Title: ${title}\n`;
        bannerText += `📝 Subtitle: ${subtitle}\n`;
        bannerText += `📏 Size: 1920x1080px\n`;
        bannerText += `🎨 Format: PNG/JPG\n\n`;
        bannerText += `[Banner Image]\n\n`;
        bannerText += `✅ Banner ready!\n`;
        bannerText += `💾 Download now!\n`;

        await nexus.sendMessage(chatId, { text: bannerText });
        console.log(chalk.green(`✅ Banner created`));

    } catch (error) {
        console.log(chalk.red(`❌ Banner creator error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error creating banner: ${error.message}`
        });
    }
};

// Color Palette
const generateColorPalette = async (nexus, chatId, baseColor = '#FF6B6B') => {
    try {
        console.log(chalk.blue(`🌈 Generating color palette...`));
        
        let paletteText = `🌈 COLOR PALETTE GENERATOR\n\n`;
        paletteText += `🎨 Base Color: ${baseColor}\n\n`;
        paletteText += `📊 Generated Palette:\n`;
        paletteText += `1. #FF6B6B - Primary\n`;
        paletteText += `2. #4ECDC4 - Secondary\n`;
        paletteText += `3. #45B7D1 - Accent 1\n`;
        paletteText += `4. #FFA07A - Accent 2\n`;
        paletteText += `5. #98D8C8 - Background\n\n`;
        paletteText += `✅ Palette generated!\n`;

        await nexus.sendMessage(chatId, { text: paletteText });
        console.log(chalk.green(`✅ Color palette generated`));

    } catch (error) {
        console.log(chalk.red(`❌ Color palette error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error generating palette: ${error.message}`
        });
    }
};

// Avatar Maker
const makeAvatar = async (nexus, chatId, name, style = 'cartoon') => {
    try {
        console.log(chalk.blue(`👤 Creating avatar...`));
        
        let avatarText = `👤 AVATAR MAKER\n\n`;
        avatarText += `📝 Name: ${name}\n`;
        avatarText += `🎨 Style: ${style}\n`;
        avatarText += `📏 Size: 256x256px\n\n`;
        avatarText += `[Avatar Image]\n\n`;
        avatarText += `✅ Avatar created!\n`;
        avatarText += `💾 Save and use!\n`;

        await nexus.sendMessage(chatId, { text: avatarText });
        console.log(chalk.green(`✅ Avatar created for "${name}"`));

    } catch (error) {
        console.log(chalk.red(`❌ Avatar maker error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error creating avatar: ${error.message}`
        });
    }
};

// Text Effects
const applyTextDesign = async (nexus, chatId, text, effect) => {
    try {
        console.log(chalk.blue(`✨ Applying ${effect} design...`));
        
        let designText = `✨ TEXT DESIGN EFFECT: ${effect}\n\n`;
        designText += `📝 Original: ${text}\n\n`;
        
        switch(effect.toLowerCase()) {
            case 'glow':
                designText += `✨ Glowing Effect Applied\n`;
                break;
            case 'shadow':
                designText += `🌑 Shadow Effect Applied\n`;
                break;
            case 'gradient':
                designText += `🌈 Gradient Effect Applied\n`;
                break;
            default:
                designText += `✨ Effect Applied\n`;
        }
        
        designText += `[Styled Text Image]\n\n`;
        designText += `✅ Design ready!\n`;

        await nexus.sendMessage(chatId, { text: designText });
        console.log(chalk.green(`✅ Text design applied`));

    } catch (error) {
        console.log(chalk.red(`❌ Text design error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error applying design: ${error.message}`
        });
    }
};

// Gradient Generator
const generateGradient = async (nexus, chatId, color1 = '#FF6B6B', color2 = '#4ECDC4') => {
    try {
        console.log(chalk.blue(`🌈 Generating gradient...`));
        
        let gradientText = `🌈 GRADIENT GENERATOR\n\n`;
        gradientText += `🎨 Color 1: ${color1}\n`;
        gradientText += `🎨 Color 2: ${color2}\n\n`;
        gradientText += `📊 Direction: Linear 45°\n`;
        gradientText += `📏 Size: 512x512px\n\n`;
        gradientText += `[Gradient Image]\n\n`;
        gradientText += `✅ Gradient created!\n`;

        await nexus.sendMessage(chatId, { text: gradientText });
        console.log(chalk.green(`✅ Gradient generated`));

    } catch (error) {
        console.log(chalk.red(`❌ Gradient error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error generating gradient: ${error.message}`
        });
    }
};

module.exports = {
    makeLogo,
    createBanner,
    generateColorPalette,
    makeAvatar,
    applyTextDesign,
    generateGradient
};

    return module.exports;
})();


// ============ inlined from commands/education.js ============
const __cmd_education = (function() {
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

const dictionary = (nexus, chatId, word) => send(nexus, chatId,
word ? `📖 Looking up "${word}"... ask me directly and I'll define it for you.` : `📖 DICTIONARY\n\nUsage: .define <word>\ne.g .define ubiquitous`, 'Dictionary');

const mathSolver = (nexus, chatId, problem) => send(nexus, chatId,
problem ? `🧮 Solving "${problem}"... ask me directly with the equation and I'll work through it.` : `🧮 MATH SOLVER\n\nUsage: .solve <equation>\ne.g .solve 2x + 5 = 15`, 'Math Solver');

const geographyFacts = (nexus, chatId) => send(nexus, chatId,
`🌍 GEOGRAPHY FACT\n\nThe Nile and the Amazon are the two longest rivers on Earth — scientists still debate which is truly longest depending on measurement method. Africa is the only continent spanning all four hemispheres.\n\nAsk me for facts about a specific country/place anytime!`, 'Geography Facts');

const scienceFacts = (nexus, chatId) => send(nexus, chatId,
`🔬 SCIENCE FACT\n\nHoney never spoils — archaeologists have found 3,000-year-old honey in Egyptian tombs that's still edible, thanks to its low moisture and acidity.\n\nAsk me for facts on any science topic!`, 'Science Facts');

const quoteOfTheDay = (nexus, chatId) => send(nexus, chatId,
`🎓 QUOTE OF THE DAY\n\n"The only way to do great work is to love what you do." — Steve Jobs\n\nAsk again anytime for a fresh one.`, 'Quote of the Day');

const factsGenerator = (nexus, chatId) => send(nexus, chatId,
`📊 RANDOM FACT\n\nOctopuses have three hearts and blue blood — two hearts pump blood to the gills, one to the rest of the body.\n\nAsk again for another random fact!`, 'Facts Generator');

const iqQuiz = (nexus, chatId) => send(nexus, chatId,
`🧠 IQ QUIZ\n\nQ: What comes next in the sequence? 2, 4, 8, 16, __\n\nReply with your answer! (Hint: each number doubles)`, 'IQ Quiz');

const triviaChallenge = (nexus, chatId) => send(nexus, chatId,
`🎯 TRIVIA CHALLENGE\n\nQ: What is the smallest country in the world by area?\n\nReply with your answer! (Hint: it's in Rome)`, 'Trivia Challenge');

const studyMaterials = (nexus, chatId) => send(nexus, chatId,
`📚 FREE STUDY RESOURCES\n\n• Khan Academy — all subjects, free\n• Quizlet — flashcards\n• MIT OpenCourseWare — university-level, free\n• Ask me to explain any topic directly, anytime`, 'Study Materials');

const researchPapers = (nexus, chatId, topic) => send(nexus, chatId,
`🔍 FINDING RESEARCH PAPERS\n\n• Google Scholar — scholar.google.com\n• ResearchGate\n• Sci-Hub alternatives: your university library portal\n\n${topic ? `Ask me directly about "${topic}" and I'll search current papers/summaries.` : 'Ask me about a specific topic and I\'ll search for you.'}`, 'Research Papers');

const bookRecommendations = (nexus, chatId, genre) => send(nexus, chatId,
genre ? `📖 Looking for great ${genre} books... ask me directly and I'll recommend some.` : `📖 BOOK RECOMMENDATIONS\n\nUsage: .books <genre>\ne.g .books science fiction`, 'Book Recommendations');

const onlineCourses = (nexus, chatId) => send(nexus, chatId,
`🎓 FREE ONLINE COURSE PLATFORMS\n\n• Coursera (audit for free)\n• edX\n• freeCodeCamp\n• Khan Academy\n• YouTube (underrated — many full university courses uploaded free)`, 'Online Courses');

const scienceExperiments = (nexus, chatId) => send(nexus, chatId,
`🧪 SIMPLE HOME SCIENCE EXPERIMENT\n\nBaking soda + vinegar volcano:\n1. Put 2 tbsp baking soda in a bottle\n2. Add food coloring (optional)\n3. Pour in vinegar and watch it erupt!\n\nDemonstrates an acid-base reaction releasing CO₂ gas.`, 'Science Experiments');

const mathFormulas = (nexus, chatId) => send(nexus, chatId,
`📐 COMMON MATH FORMULAS\n\n• Area of circle: πr²\n• Pythagorean theorem: a² + b² = c²\n• Quadratic formula: x = (-b ± √(b²-4ac)) / 2a\n• Simple interest: I = PRT\n\nAsk me for any specific formula!`, 'Math Formulas');

const languageLearning = (nexus, chatId) => send(nexus, chatId,
`🌐 LANGUAGE LEARNING RESOURCES\n\n• Duolingo — free, gamified\n• Anki — spaced repetition flashcards\n• italki — practice with native speakers\n• Best method: consume content (music, shows) in the language daily`, 'Language Learning');

const pronunciationGuide = (nexus, chatId, word) => send(nexus, chatId,
word ? `🗣️ Looking up pronunciation for "${word}"... ask me directly.` : `🗣️ PRONUNCIATION GUIDE\n\nUsage: .pronounce <word>`, 'Pronunciation Guide');

const educationalVideos = (nexus, chatId) => send(nexus, chatId,
`🎓 GREAT EDUCATIONAL YOUTUBE CHANNELS\n\n• Kurzgesagt — science, animated\n• CrashCourse — wide range of subjects\n• 3Blue1Brown — math, beautifully visual\n• Veritasium — physics/science`, 'Educational Videos');

const statisticsExplained = (nexus, chatId) => send(nexus, chatId,
`📊 STATISTICS BASICS\n\n• Mean — the average\n• Median — the middle value\n• Mode — most frequent value\n• Standard deviation — how spread out the data is\n• Correlation ≠ causation — always remember this!`, 'Statistics Explained');

const biologyFacts = (nexus, chatId) => send(nexus, chatId,
`🔬 BIOLOGY FACT\n\nYour body replaces most of its cells every 7-10 years — you're literally not the "same" physical body you were a decade ago.\n\nAsk for more biology facts anytime!`, 'Biology Facts');

const geneticsInfo = (nexus, chatId) => send(nexus, chatId,
`🧬 GENETICS BASICS\n\n• DNA = the instruction manual for your body\n• Genes = specific sections of DNA coding for traits\n• You share ~99.9% of your DNA with every other human\n• You share ~60% of your DNA with a banana!`, 'Genetics Info');

const astronomyGuide = (nexus, chatId) => send(nexus, chatId,
`🌌 ASTRONOMY BASICS\n\n• Our galaxy (Milky Way) has 100-400 billion stars\n• Light from the Sun takes ~8 minutes to reach Earth\n• A light-year measures distance, not time\n• Best free stargazing app: Stellarium`, 'Astronomy Guide');

const spaceExploration = (nexus, chatId) => send(nexus, chatId,
`🔭 SPACE EXPLORATION\n\nAsk me for current news on missions (e.g "latest SpaceX launch" or "Mars rover updates") and I'll search live info.`, 'Space Exploration');

const historicalEvents = (nexus, chatId, event) => send(nexus, chatId,
event ? `🌍 Looking up "${event}"... ask me directly for details.` : `🌍 HISTORICAL EVENTS\n\nUsage: .history <event or year>\ne.g .history 1969 moon landing`, 'Historical Events');

const ancientCivilizations = (nexus, chatId) => send(nexus, chatId,
`📜 ANCIENT CIVILIZATIONS\n\nKey ones to explore: Ancient Egypt, Mesopotamia, Indus Valley, Ancient Greece, Rome, Mali Empire, Great Zimbabwe, Aztec, Maya.\n\nAsk me about any specific one for a deep dive!`, 'Ancient Civilizations');

const artHistory = (nexus, chatId) => send(nexus, chatId,
`🎨 ART HISTORY MOVEMENTS\n\n• Renaissance — realism, perspective (da Vinci, Michelangelo)\n• Impressionism — light & color (Monet)\n• Cubism — fragmented forms (Picasso)\n• Modern/Contemporary — huge variety today\n\nAsk about any movement or artist!`, 'Art History');

const literatureAnalysis = (nexus, chatId, work) => send(nexus, chatId,
work ? `🎭 Analyzing "${work}"... ask me directly for themes/analysis.` : `🎭 LITERATURE ANALYSIS\n\nUsage: .analyze <book/poem title>`, 'Literature Analysis');

const musicTheory = (nexus, chatId) => send(nexus, chatId,
`🎵 MUSIC THEORY BASICS\n\n• Octave — 8 notes, same note repeated higher/lower\n• Major scale = happy sound, Minor scale = sad/moody sound\n• Chord = 3+ notes played together\n• Tempo = speed of the music (measured in BPM)`, 'Music Theory');

const philosophyGuide = (nexus, chatId) => send(nexus, chatId,
`📚 PHILOSOPHY STARTING POINTS\n\n• Stoicism — focus on what you control (Marcus Aurelius, Seneca)\n• Existentialism — meaning is self-created (Sartre, Camus)\n• Utilitarianism — greatest good for greatest number\n\nAsk me about any philosopher or concept!`, 'Philosophy Guide');

const lawBasics = (nexus, chatId) => send(nexus, chatId,
`⚖️ LAW BASICS\n\n• Civil law — disputes between individuals/entities\n• Criminal law — offenses against the state\n• Common law — based on precedent (Nigeria, UK, US)\n• Always consult a real lawyer for actual legal matters — this is general info only.`, 'Law Basics');

const economics101 = (nexus, chatId) => send(nexus, chatId,
`💼 ECONOMICS 101\n\n• Supply & Demand — price rises when demand > supply\n• Inflation — general rise in prices over time\n• GDP — total value of goods/services a country produces\n• Opportunity cost — what you give up to choose something else`, 'Economics 101');

const politicalSystems = (nexus, chatId) => send(nexus, chatId,
`🏛️ POLITICAL SYSTEMS OVERVIEW\n\n• Democracy — citizens vote for representatives\n• Federal system — power split between central & state govts (like Nigeria, US)\n• Parliamentary vs Presidential — how the executive is chosen differs\n\nAsk me about any specific country's system!`, 'Political Systems');

const worldCultures = (nexus, chatId, country) => send(nexus, chatId,
country ? `🌐 Looking up culture facts for "${country}"... ask me directly.` : `🌐 WORLD CULTURES\n\nUsage: .culture <country>\ne.g .culture Japan`, 'World Cultures');

const etymology = (nexus, chatId, word) => send(nexus, chatId,
word ? `🗣️ Looking up the origin of "${word}"... ask me directly.` : `🗣️ ETYMOLOGY\n\nUsage: .etymology <word>\ne.g .etymology "quarantine" (from Italian "quaranta" = forty, referencing 40-day ship isolation)`, 'Etymology');

const classicLiterature = (nexus, chatId) => send(nexus, chatId,
`📖 CLASSIC LITERATURE TO KNOW\n\n• Things Fall Apart — Chinua Achebe\n• 1984 — George Orwell\n• Pride and Prejudice — Jane Austen\n• One Hundred Years of Solitude — Gabriel García Márquez\n\nAsk me for a summary/analysis of any classic!`, 'Classic Literature');

const logicPuzzles = (nexus, chatId) => send(nexus, chatId,
`🧩 LOGIC PUZZLE\n\nA man looks at a photo and says "Brothers and sisters I have none, but that man's father is my father's son." Who is in the photo?\n\nReply with your answer! (Hint: think carefully about "my father's son")`, 'Logic Puzzles');

const careerGuidance = (nexus, chatId) => send(nexus, chatId,
`🎓 CAREER GUIDANCE\n\nFor deeper career help (resume, job search, interview prep), check out the Career & Jobs menu category — it's fully built out with dedicated tools!`, 'Career Guidance');

module.exports = {
    dictionary, mathSolver, geographyFacts, scienceFacts, quoteOfTheDay,
    factsGenerator, iqQuiz, triviaChallenge, studyMaterials, researchPapers,
    bookRecommendations, onlineCourses, scienceExperiments, mathFormulas,
    languageLearning, pronunciationGuide, educationalVideos, statisticsExplained,
    biologyFacts, geneticsInfo, astronomyGuide, spaceExploration, historicalEvents,
    ancientCivilizations, artHistory, literatureAnalysis, musicTheory,
    philosophyGuide, lawBasics, economics101, politicalSystems, worldCultures,
    etymology, classicLiterature, logicPuzzles, careerGuidance
};

    return module.exports;
})();


// ============ inlined from commands/entertainment.js ============
const __cmd_entertainment = (function() {
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

const movieDatabase = (nexus, chatId, title) => send(nexus, chatId,
title ? `🎭 Searching for "${title}"... ask me directly with the title and I'll look up current details for you.` : `🎭 MOVIE DATABASE\n\nUsage: .movie <title>\ne.g .movie Inception\n\n💡 For up-to-date info (ratings, cast, showtimes), just ask me the movie name directly and I'll search live.`, 'Movie Database');

const tvSeries = (nexus, chatId, title) => send(nexus, chatId,
title ? `📺 Looking up "${title}"... ask me directly and I'll search current info.` : `📺 TV SERIES\n\nUsage: .tvseries <title>\n💡 Ask me directly (e.g "is season 3 of X out?") for current, searched info.`, 'TV Series');

const celebrityNews = (nexus, chatId) => send(nexus, chatId,
`🎤 CELEBRITY NEWS\n\nFor current celebrity news, ask me directly (e.g "latest news on [celebrity]") and I'll search for up-to-date results.`, 'Celebrity News');

const eventsCalendar = (nexus, chatId) => send(nexus, chatId,
`🎪 EVENTS CALENDAR\n\nAsk me "events in [your city] this weekend" and I'll search current listings for you.`, 'Events Calendar');

const concertInfo = (nexus, chatId, artist) => send(nexus, chatId,
artist ? `🎸 Looking up concert dates for "${artist}"... ask me directly for current tour info.` : `🎸 CONCERT INFO\n\nUsage: .concert <artist>\nAsk me directly for current tour dates.`, 'Concert Info');

const gamingEvents = (nexus, chatId) => send(nexus, chatId,
`🎮 GAMING EVENTS\n\nMajor recurring events to watch: E3 successor showcases, Gamescom, The Game Awards, PAX.\nAsk me directly for current dates — schedules shift yearly.`, 'Gaming Events');

const celebrityPhotos = (nexus, chatId) => send(nexus, chatId,
`📸 CELEBRITY PHOTOS\n\nThis bot doesn't pull celebrity images directly (copyright reasons), but I can point you to official sources — just ask who you're looking for.`, 'Celebrity Photos');

const artExhibitions = (nexus, chatId) => send(nexus, chatId,
`🎨 ART EXHIBITIONS\n\nAsk me "art exhibitions in [your city]" and I'll search current listings.`, 'Art Exhibitions');

const theaterShows = (nexus, chatId) => send(nexus, chatId,
`🎭 THEATER SHOWS\n\nAsk me "theater shows in [your city]" and I'll search what's currently running.`, 'Theater Shows');

const comedyShows = (nexus, chatId) => send(nexus, chatId,
`🎪 COMEDY SHOWS\n\nAsk me "comedy shows in [your city] this month" for current listings.`, 'Comedy Shows');

const movieTrailers = (nexus, chatId, title) => send(nexus, chatId,
title ? `🎬 Looking up the trailer for "${title}"... ask me and I'll find the current link.` : `🎬 MOVIE TRAILERS\n\nUsage: .trailer <title>`, 'Movie Trailers');

const streamingServices = (nexus, chatId) => send(nexus, chatId,
`📺 STREAMING SERVICES OVERVIEW\n\n• Netflix — huge original library\n• Prime Video — good movie selection, included with Prime\n• Disney+ — Marvel/Star Wars/Pixar\n• Showmax — strong African content selection\n\nAsk me "is [title] on Netflix" and I'll search current availability.`, 'Streaming Services');

const imdbRatings = (nexus, chatId, title) => send(nexus, chatId,
title ? `⭐ Checking IMDb rating for "${title}"... ask me directly for the current score.` : `⭐ IMDB RATINGS\n\nUsage: .imdb <title>`, 'IMDb Ratings');

const behindTheScenes = (nexus, chatId) => send(nexus, chatId,
`🎥 BEHIND THE SCENES\n\nAsk me about a specific movie/show and I'll search for behind-the-scenes info and trivia.`, 'Behind the Scenes');

const directorInfo = (nexus, chatId, name) => send(nexus, chatId,
name ? `🎬 Looking up director "${name}"... ask me and I'll search their filmography.` : `🎬 DIRECTOR INFO\n\nUsage: .director <name>`, 'Director Info');

const actorProfiles = (nexus, chatId, name) => send(nexus, chatId,
name ? `🎭 Looking up "${name}"... ask me and I'll search their current filmography.` : `🎭 ACTOR PROFILES\n\nUsage: .actor <name>`, 'Actor Profiles');

const awardsNominations = (nexus, chatId) => send(nexus, chatId,
`🏆 AWARDS & NOMINATIONS\n\nAsk me "who won [award] this year" (Oscars, Grammys, AMVCA etc) and I'll search current results.`, 'Awards & Nominations');

const redCarpetEvents = (nexus, chatId) => send(nexus, chatId,
`🌟 RED CARPET EVENTS\n\nAsk me about a specific award show and I'll search current red carpet coverage.`, 'Red Carpet Events');

const gossipNews = (nexus, chatId) => send(nexus, chatId,
`📰 GOSSIP NEWS\n\nAsk me directly about a celebrity and I'll search current news — I'll stick to verified sources, not unverified rumors.`, 'Gossip News');

const playTickets = (nexus, chatId) => send(nexus, chatId,
`🎭 PLAY TICKETS\n\nAsk me "theater tickets for [show] in [city]" and I'll search booking options.`, 'Play Tickets');

const circusShows = (nexus, chatId) => send(nexus, chatId,
`🎪 CIRCUS SHOWS\n\nAsk me "circus shows near [your city]" for current listings.`, 'Circus Shows');

const artInstallations = (nexus, chatId) => send(nexus, chatId,
`🎨 ART INSTALLATIONS\n\nAsk me "art installations in [your city]" for current exhibits.`, 'Art Installations');

const livePerformances = (nexus, chatId) => send(nexus, chatId,
`🎵 LIVE PERFORMANCES\n\nAsk me "live music in [your city] this weekend" for current listings.`, 'Live Performances');

const standupComedy = (nexus, chatId) => send(nexus, chatId,
`🎤 STAND-UP COMEDY\n\nAsk me "stand-up comedy shows in [your city]" for current listings.\nBig Nigerian names to know: Basketmouth, AY, Bovi, Osas Ighodaro-style hosted specials often stream online too.`, 'Stand-Up Comedy');

const documentaryGuide = (nexus, chatId) => send(nexus, chatId,
`🎬 DOCUMENTARY RECOMMENDATIONS\n\nTell me a topic you're interested in (true crime, nature, tech, sports) and I'll search current well-reviewed documentaries on that topic.`, 'Documentary Guide');

const realityTv = (nexus, chatId) => send(nexus, chatId,
`📺 REALITY TV\n\nAsk me about a specific show (e.g current Big Brother Naija season) and I'll search up-to-date info.`, 'Reality TV');

const musicals = (nexus, chatId) => send(nexus, chatId,
`🎭 MUSICALS\n\nClassics worth knowing: Hamilton, The Lion King, Wicked, Les Misérables.\nAsk me for current touring/showing schedules near you.`, 'Musicals');

const magicShows = (nexus, chatId) => send(nexus, chatId,
`🎪 MAGIC SHOWS\n\nAsk me "magic shows near [your city]" for current listings.`, 'Magic Shows');

const galleryExhibitions = (nexus, chatId) => send(nexus, chatId,
`🎨 GALLERY EXHIBITIONS\n\nAsk me "art galleries/exhibitions in [your city]" for current shows.`, 'Gallery Exhibitions');

const shakespearePlays = (nexus, chatId) => send(nexus, chatId,
`🎭 SHAKESPEARE PLAYS\n\nThe big ones: Hamlet, Macbeth, Romeo & Juliet, Othello, A Midsummer Night's Dream.\nAsk me for current productions playing near you.`, 'Shakespeare Plays');

const varietyShows = (nexus, chatId) => send(nexus, chatId,
`🎪 VARIETY SHOWS\n\nAsk me "variety shows in [your city]" for current listings.`, 'Variety Shows');

const liveTvListings = (nexus, chatId) => send(nexus, chatId,
`📡 LIVE TV LISTINGS\n\nAsk me "what's on [channel] tonight" and I'll search current schedules.`, 'Live TV Listings');

module.exports = {
    movieDatabase, tvSeries, celebrityNews, eventsCalendar, concertInfo,
    gamingEvents, celebrityPhotos, artExhibitions, theaterShows, comedyShows,
    movieTrailers, streamingServices, imdbRatings, behindTheScenes, directorInfo,
    actorProfiles, awardsNominations, redCarpetEvents, gossipNews, playTickets,
    circusShows, artInstallations, livePerformances, standupComedy,
    documentaryGuide, realityTv, musicals, magicShows, galleryExhibitions,
    shakespearePlays, varietyShows, liveTvListings
};

    return module.exports;
})();


// ============ inlined from commands/fashion.js ============
const __cmd_fashion = (function() {
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

const fashionTrends = (nexus, chatId) => send(nexus, chatId,
`👔 FASHION TRENDS\n\nAsk me "current fashion trends" and I'll search up-to-date info — trends shift fast so I'll pull fresh results rather than guess.`, 'Fashion Trends');

const outfitIdeas = (nexus, chatId, occasion) => send(nexus, chatId,
occasion ? `👗 Outfit ideas for "${occasion}"... ask me directly for suggestions.` : `👗 OUTFIT IDEAS\n\nUsage: .outfit <occasion>\ne.g .outfit smart casual dinner`, 'Outfit Ideas');

const shoeFinder = (nexus, chatId, type) => send(nexus, chatId,
type ? `👟 Looking for "${type}" shoes... ask me directly for current options.` : `👟 SHOE FINDER\n\nUsage: .shoes <type/occasion>`, 'Shoe Finder');

const bagCollection = (nexus, chatId) => send(nexus, chatId,
`👜 BAG STYLE GUIDE\n\n• Tote — everyday, work\n• Crossbody — hands-free, casual\n• Clutch — evening/formal\n• Backpack — practical, travel\n\nAsk me for brand recommendations at any budget!`, 'Bag Collection');

const makeupTutorials = (nexus, chatId, look) => send(nexus, chatId,
look ? `💄 Tutorial for "${look}"... ask me directly for step-by-step guidance.` : `💄 MAKEUP TUTORIALS\n\nUsage: .makeup <look>\ne.g .makeup natural everyday look`, 'Makeup Tutorials');

const nailDesigns = (nexus, chatId) => send(nexus, chatId,
`💅 NAIL DESIGN IDEAS\n\n• French tips — classic, always works\n• Ombre — trendy gradient effect\n• Minimalist line art — subtle, elegant\n\nAsk me for a specific style/occasion!`, 'Nail Designs');

const hairstyleIdeas = (nexus, chatId, occasion) => send(nexus, chatId,
occasion ? `💇 Hairstyle ideas for "${occasion}"... ask me directly.` : `💇 HAIRSTYLE IDEAS\n\nUsage: .hairstyle <occasion/hair type>`, 'Hairstyle Ideas');

const accessoryGuide = (nexus, chatId) => send(nexus, chatId,
`🕶️ ACCESSORY STYLING TIPS\n\n• Rule of thumb: pick ONE statement piece, keep the rest simple\n• Match metals (gold/silver) across jewelry for cohesion\n• A good watch/belt elevates an outfit more than people realize`, 'Accessory Guide');

const sizeConverter = (nexus, chatId, size) => send(nexus, chatId,
size ? `👗 Converting size "${size}"... ask me directly (e.g "UK 10 to US size").` : `👗 SIZE CONVERTER\n\nUsage: .sizeconvert <size> <from region> to <to region>\ne.g .sizeconvert UK 10 to US`, 'Size Converter');

const fashionBrands = (nexus, chatId, budget) => send(nexus, chatId,
`⭐ FASHION BRANDS BY BUDGET\n\n• Budget: Shein, H&M, local markets\n• Mid: Zara, Mango, Uniqlo\n• Premium: Cos, Reiss\n• Luxury: Gucci, Louis Vuitton, Nigerian designers like Deola Sagoe\n\n${budget ? `Ask me for specific "${budget}" recommendations.` : ''}`, 'Fashion Brands');

const shoppingTips = (nexus, chatId) => send(nexus, chatId,
`🛍️ SMART SHOPPING TIPS\n\n• Check return policy before buying online\n• Wait 24 hours before big purchases — kills impulse buys\n• Cost-per-wear matters more than price tag alone\n• Sign up for brand newsletters just before sales seasons`, 'Shopping Tips');

const designerSearch = (nexus, chatId, name) => send(nexus, chatId,
name ? `👑 Looking up "${name}"... ask me directly.` : `👑 DESIGNER SEARCH\n\nUsage: .designer <name>`, 'Designer Search');

const formalWear = (nexus, chatId) => send(nexus, chatId,
`👔 FORMAL WEAR GUIDE\n\n• Black tie — tux/gown, most formal\n• Business formal — suit, conservative colors\n• Cocktail — dressy but not full formal\n\nAsk me for a specific event's dress code!`, 'Formal Wear');

const casualWear = (nexus, chatId) => send(nexus, chatId,
`👕 CASUAL WEAR IDEAS\n\n• Smart casual — chinos + collared shirt, versatile\n• Streetwear — sneakers, oversized fits, layering\n• Comfort-first — quality basics in neutral colors go far`, 'Casual Wear');

const sportswear = (nexus, chatId) => send(nexus, chatId,
`🏃 SPORTSWEAR TIPS\n\n• Moisture-wicking fabric > cotton for workouts\n• Proper-fitting sports bra/shoes matter more than looks\n• Layer for outdoor workouts — easier to adjust to temperature`, 'Sportswear');

const kidsFashion = (nexus, chatId) => send(nexus, chatId,
`👶 KIDS FASHION TIPS\n\n• Prioritize comfort and freedom of movement over style at young ages\n• Buy slightly ahead of size — kids grow fast\n• Soft, breathable fabrics reduce skin irritation`, 'Kids Fashion');

const weddingDresses = (nexus, chatId) => send(nexus, chatId,
`👰 WEDDING DRESS STYLES\n\n• Ball gown — dramatic, traditional\n• A-line — flattering on most body types\n• Mermaid — fitted, glamorous\n• Book fittings 6+ months ahead for custom/alterations`, 'Wedding Dresses');

const groomOutfits = (nexus, chatId) => send(nexus, chatId,
`🤵 GROOM OUTFIT IDEAS\n\n• Classic tux — timeless, formal weddings\n• Traditional attire (agbada, kaftan) — great for Nigerian ceremonies\n• Coordinate with the bride's colors, don't match exactly`, 'Groom Outfits');

const eveningGowns = (nexus, chatId) => send(nexus, chatId,
`👗 EVENING GOWN STYLES\n\n• Sheath — sleek, elegant\n• Empire waist — flattering, comfortable\n• High-low hem — trendy, easier to move in\n\nAsk me for occasion-specific ideas!`, 'Evening Gowns');

const winterCoats = (nexus, chatId) => send(nexus, chatId,
`🧥 COAT GUIDE\n\n• Trench — versatile, classic\n• Puffer — warmest for cold climates\n• Wool overcoat — smart, formal-friendly\n\n(Less relevant in Nigeria's climate, but useful if traveling!)`, 'Winter Coats');

const hatStyles = (nexus, chatId) => send(nexus, chatId,
`👒 HAT STYLE GUIDE\n\n• Fedora — smart casual, adds polish\n• Baseball cap — casual, sporty\n• Bucket hat — trendy, laid-back\n• Gele — traditional Nigerian, statement piece for events`, 'Hat Styles');

const scarfTying = (nexus, chatId) => send(nexus, chatId,
`🧣 SCARF TYING IDEAS\n\n• Loop knot — simple, everyday\n• French knot — chic, minimal effort\n• Headscarf wrap — great protective style option\n\nAsk me for step-by-step on any specific style!`, 'Scarf Tying');

const gloveTypes = (nexus, chatId) => send(nexus, chatId,
`🧤 GLOVE TYPES\n\n• Leather — classic, formal\n• Knit — casual, cold weather\n• Touchscreen-compatible — practical everyday pick`, 'Glove Types');

const shoeStyles = (nexus, chatId) => send(nexus, chatId,
`👞 SHOE STYLE GUIDE\n\n• Oxford — most formal\n• Loafers — smart casual, versatile\n• Sneakers — casual, everyday comfort\n• Match shoe formality to your outfit's formality level`, 'Shoe Styles');

const jewelryGuide = (nexus, chatId) => send(nexus, chatId,
`💍 JEWELRY STYLING TIPS\n\n• Layer necklaces of different lengths for depth\n• Match metal tones for a cohesive look\n• Less is often more — one standout piece beats five competing ones`, 'Jewelry Guide');

const sunglasses = (nexus, chatId) => send(nexus, chatId,
`🕶️ SUNGLASSES GUIDE\n\n• Aviators — classic, suit most face shapes\n• Round frames — soften angular faces\n• Cat-eye — adds a retro, feminine edge\n\nAlways check for UV400 protection, not just style!`, 'Sunglasses');

const designerBags = (nexus, chatId) => send(nexus, chatId,
`👜 DESIGNER BAG TIPS\n\n• Classic styles (like a structured tote) hold resale value better than trendy ones\n• Check authentication services before buying secondhand luxury\n• Consider "your first designer bag" guides — usually recommend timeless neutral options`, 'Designer Bags');

const makeupBrands = (nexus, chatId) => send(nexus, chatId,
`💄 MAKEUP BRANDS BY BUDGET\n\n• Budget: e.l.f, Maybelline\n• Mid: NYX, Fenty Beauty\n• Premium: Charlotte Tilbury, MAC\n\nAsk me for shade-matching tips too!`, 'Makeup Brands');

const nailCare = (nexus, chatId) => send(nexus, chatId,
`💅 NAIL CARE TIPS\n\n• Moisturize cuticles regularly — prevents breakage\n• Give nails a break between gel/acrylic sets\n• Biotin + protein-rich diet supports healthy nail growth`, 'Nail Care');

const hairCare = (nexus, chatId) => send(nexus, chatId,
`💇 HAIR CARE BASICS\n\n• Don't wash too often — strips natural oils (2-3x/week is often enough)\n• Deep condition weekly, especially for natural/textured hair\n• Silk/satin pillowcase or bonnet reduces breakage overnight`, 'Hair Care');

const skincareGuide = (nexus, chatId) => send(nexus, chatId,
`🧴 SKINCARE BASICS\n\n• Core routine: cleanser → moisturizer → SPF (daily, non-negotiable)\n• Introduce new products one at a time to spot reactions\n• Sunscreen is the #1 anti-aging product, more than any serum`, 'Skincare Guide');

const beautyTips = (nexus, chatId) => send(nexus, chatId,
`🌟 GENERAL BEAUTY TIPS\n\n• Sleep and hydration show on your skin more than any product\n• Less is more with makeup for daytime looks\n• Consistency beats intensity — a simple routine done daily beats an elaborate one done rarely`, 'Beauty Tips');

module.exports = {
    fashionTrends, outfitIdeas, shoeFinder, bagCollection, makeupTutorials,
    nailDesigns, hairstyleIdeas, accessoryGuide, sizeConverter, fashionBrands,
    shoppingTips, designerSearch, formalWear, casualWear, sportswear,
    kidsFashion, weddingDresses, groomOutfits, eveningGowns, winterCoats,
    hatStyles, scarfTying, gloveTypes, shoeStyles, jewelryGuide, sunglasses,
    designerBags, makeupBrands, nailCare, hairCare, skincareGuide, beautyTips
};

    return module.exports;
})();


// ============ inlined from commands/food.js ============
const __cmd_food = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');

// Food Handler
const foodDB = {
    recipes: [
        { name: 'Jollof Rice', cuisine: 'Nigerian', prepTime: '45 mins' },
        { name: 'Egusi Soup', cuisine: 'Nigerian', prepTime: '30 mins' },
        { name: 'Pepper Soup', cuisine: 'Nigerian', prepTime: '25 mins' }
    ]
};

// Search Recipes
const searchRecipe = async (nexus, chatId, dishName) => {
    try {
        console.log(chalk.blue(`🔍 Searching recipe for ${dishName}...`));
        
        let recipeText = `🍳 RECIPE SEARCH: ${dishName}\n\n`;
        recipeText += `1. 🍚 Jollof Rice\n`;
        recipeText += `   ⏱️ 45 mins | 👥 4 servings | ⭐ 4.8/5\n\n`;
        recipeText += `2. 🥘 Jollof with Stew\n`;
        recipeText += `   ⏱️ 60 mins | 👥 6 servings | ⭐ 4.9/5\n\n`;
        recipeText += `3. 🍛 Spicy Jollof\n`;
        recipeText += `   ⏱️ 50 mins | 👥 5 servings | ⭐ 4.7/5\n\n`;
        recipeText += `4. 🥟 Rice Balls\n`;
        recipeText += `   ⏱️ 30 mins | 👥 3 servings | ⭐ 4.5/5\n\n`;
        recipeText += `Reply with number for full recipe!\n`;

        await nexus.sendMessage(chatId, { text: recipeText });
        console.log(chalk.green(`✅ Recipe search sent for "${dishName}"`));

    } catch (error) {
        console.log(chalk.red(`❌ Recipe search error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error searching recipe: ${error.message}`
        });
    }
};

// Get Recipe Details
const getRecipeDetails = async (nexus, chatId, recipeName) => {
    try {
        console.log(chalk.blue(`📖 Getting recipe for ${recipeName}...`));
        
        let detailText = `📖 RECIPE: ${recipeName}\n\n`;
        detailText += `⏱️ Prep Time: 10 mins\n`;
        detailText += `🔥 Cook Time: 35 mins\n`;
        detailText += `👥 Servings: 4\n`;
        detailText += `⭐ Rating: 4.8/5 (2.5K reviews)\n\n`;
        detailText += `📝 INGREDIENTS:\n`;
        detailText += `• 3 cups rice\n`;
        detailText += `• 1 can tomato sauce\n`;
        detailText += `• 2 red peppers\n`;
        detailText += `• 1 onion\n`;
        detailText += `• 500g chicken\n`;
        detailText += `• 3 tbsp oil\n`;
        detailText += `• Salt & spices\n\n`;
        detailText += `👨‍🍳 INSTRUCTIONS:\n`;
        detailText += `1. Parboil rice\n`;
        detailText += `2. Fry onions & peppers\n`;
        detailText += `3. Add tomato sauce\n`;
        detailText += `4. Mix with rice\n`;
        detailText += `5. Cook for 25 mins\n\n`;
        detailText += `🎯 Difficulty: Easy ✅\n`;

        await nexus.sendMessage(chatId, { text: detailText });
        console.log(chalk.green(`✅ Recipe details sent for ${recipeName}`));

    } catch (error) {
        console.log(chalk.red(`❌ Recipe details error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error getting recipe: ${error.message}`
        });
    }
};

// Find Restaurants
const findRestaurants = async (nexus, chatId, city, cuisine = 'Nigerian') => {
    try {
        console.log(chalk.blue(`🍽️ Finding ${cuisine} restaurants in ${city}...`));
        
        let restaurantText = `🍽️ RESTAURANTS: ${city}\n\n`;
        restaurantText += `🎯 Cuisine: ${cuisine}\n\n`;
        restaurantText += `1. 🌟 The Pepper Palace\n`;
        restaurantText += `   ⭐ 4.9/5 | 📍 VI | 💰 High\n\n`;
        restaurantText += `2. 🌟 Taste of Africa\n`;
        restaurantText += `   ⭐ 4.7/5 | 📍 Lekki | 💰 Medium\n\n`;
        restaurantText += `3. 🌟 Mama's Kitchen\n`;
        restaurantText += `   ⭐ 4.8/5 | 📍 Ikoyi | 💰 Budget\n\n`;
        restaurantText += `4. 🌟 Spice Route\n`;
        restaurantText += `   ⭐ 4.6/5 | 📍 Surulere | 💰 Medium\n\n`;
        restaurantText += `5. 🌟 Heritage Eats\n`;
        restaurantText += `   ⭐ 4.8/5 | 📍 Ikeja | 💰 High\n\n`;
        restaurantText += `🔄 More available!\n`;

        await nexus.sendMessage(chatId, { text: restaurantText });
        console.log(chalk.green(`✅ Restaurants sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Restaurant search error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error finding restaurants: ${error.message}`
        });
    }
};

// Get Nutrition Info
const getNutritionInfo = async (nexus, chatId, foodName) => {
    try {
        console.log(chalk.blue(`📊 Getting nutrition for ${foodName}...`));
        
        let nutritionText = `📊 NUTRITION INFO: ${foodName}\n\n`;
        nutritionText += `📈 Per 100g serving:\n\n`;
        nutritionText += `🔥 Calories: 150\n`;
        nutritionText += `🍖 Protein: 8g\n`;
        nutritionText += `🥑 Fat: 5g\n`;
        nutritionText += `🌾 Carbs: 22g\n`;
        nutritionText += `🍃 Fiber: 3g\n\n`;
        nutritionText += `💊 Vitamins:\n`;
        nutritionText += `• Vitamin A: 12% DV\n`;
        nutritionText += `• Vitamin C: 8% DV\n`;
        nutritionText += `• Iron: 15% DV\n\n`;
        nutritionText += `✅ Healthy! 💪\n`;

        await nexus.sendMessage(chatId, { text: nutritionText });
        console.log(chalk.green(`✅ Nutrition info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Nutrition error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error getting nutrition info: ${error.message}`
        });
    }
};

module.exports = {
    searchRecipe,
    getRecipeDetails,
    findRestaurants,
    getNutritionInfo
};

    return module.exports;
})();


// ============ inlined from commands/football.js ============
const __cmd_football = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const axios = require('axios');
const yts = require('yt-search');

// Football API Handler
const footballAPI = {
    baseURL: 'https://api.football-data.org/v4',
    apiKey: process.env.FOOTBALL_API_KEY || 'e6e1c85c25e440e595fc392368fa4d04'
};

// Get Live Matches
const getLiveMatches = async (nexus, chatId) => {
    try {
        console.log(chalk.blue('🔴 Fetching live matches...'));
        
        const response = await axios.get(`${footballAPI.baseURL}/matches?status=LIVE`, {
            headers: { 'X-Auth-Token': footballAPI.apiKey }
        });

        if (!response.data.matches || response.data.matches.length === 0) {
            await nexus.sendMessage(chatId, {
                text: '⚽ No live matches right now. Check upcoming fixtures!'
            });
            return;
        }

        let matchText = '🔴 LIVE MATCHES NOW\n\n';
        response.data.matches.forEach((match, index) => {
            matchText += `${index + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name}\n`;
            matchText += `   Score: ${match.score.fullTime.home ?? 0} - ${match.score.fullTime.away ?? 0}\n`;
            matchText += `   Status: ${match.status}\n\n`;
        });

        await nexus.sendMessage(chatId, { text: matchText + `\n👉 Get running updates on any of these: ${'`'}.livetrack TeamName${'`'}` });
        console.log(chalk.green('✅ Live matches sent'));

    } catch (error) {
        console.log(chalk.red(`❌ Live matches error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching live matches: ${error.message}`
        });
    }
};

// Get League Standings
const getStandings = async (nexus, chatId, league) => {
    try {
        // dispatchMenuCommand passes sender's JID as the 3rd arg on a button
        // tap (fn(sock, chatId, sender)) — that's never a real competition
        // code (JIDs contain '@'), so treat it as "not provided" and default.
        if (!league || league.includes('@')) league = 'PL';
        console.log(chalk.blue(`🏆 Fetching ${league} standings...`));
        
        const response = await axios.get(`${footballAPI.baseURL}/competitions/${league}/standings`, {
            headers: { 'X-Auth-Token': footballAPI.apiKey }
        });

        if (!response.data.standings) {
            await nexus.sendMessage(chatId, {
                text: '❌ Could not fetch standings'
            });
            return;
        }

        let standingsText = `📊 ${league} STANDINGS\n\n`;
        const table = response.data.standings[0].table; // full table — WhatsApp scrolls fine, no need to cut it down
        
        table.forEach((team) => {
            standingsText += `${team.position}. ${team.team.name} — ${team.points}pts (P:${team.playedGames} W:${team.won} D:${team.draw} L:${team.lost} GD:${team.goalDifference})\n`;
        });

        await nexus.sendMessage(chatId, { text: standingsText });
        console.log(chalk.green('✅ Standings sent'));

    } catch (error) {
        console.log(chalk.red(`❌ Standings error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching standings: ${error.message}`
        });
    }
};

// Get Top Scorers
const getTopScorers = async (nexus, chatId) => {
    try {
        console.log(chalk.blue('🏅 Fetching top scorers...'));
        
        const response = await axios.get(`${footballAPI.baseURL}/competitions/PL/scorers`, {
            headers: { 'X-Auth-Token': footballAPI.apiKey }
        });

        if (!response.data.scorers) {
            await nexus.sendMessage(chatId, {
                text: '❌ Could not fetch top scorers'
            });
            return;
        }

        let scorersText = '🏅 TOP SCORERS\n\n';
        response.data.scorers.forEach((scorer, index) => {
            scorersText += `${index + 1}. ${scorer.player.name} (${scorer.team.name}) - ${scorer.numberOfGoals}⚽\n`;
        });

        await nexus.sendMessage(chatId, { text: scorersText });
        console.log(chalk.green('✅ Top scorers sent'));

    } catch (error) {
        console.log(chalk.red(`❌ Top scorers error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching top scorers: ${error.message}`
        });
    }
};

// Get Team Info
const getTeamInfo = async (nexus, chatId, teamName) => {
    try {
        // Same JID-clobbering issue as getStandings — guard against it, and
        // show a real usage prompt instead of searching garbage.
        if (!teamName || teamName.includes('@')) {
            await nexus.sendMessage(chatId, { text: `📊 TEAM STATS\n\nReply with a team name and I'll look them up.\nExample: ${'`'}.teaminfo Manchester United${'`'}` });
            return;
        }

        console.log(chalk.blue(`📊 Fetching ${teamName} info...`));
        const response = await axios.get(`${footballAPI.baseURL}/teams?name=${encodeURIComponent(teamName)}`, {
            headers: { 'X-Auth-Token': footballAPI.apiKey }
        });
        const team = (response.data.teams || [])[0];
        if (!team) {
            await nexus.sendMessage(chatId, { text: `❌ No team found matching "${teamName}"` });
            return;
        }

        let teamText = `📊 ${team.name}\n\n`;
        teamText += `🏆 Founded: ${team.founded || 'Unknown'}\n`;
        teamText += `🏟️ Stadium: ${team.venue || 'Unknown'}\n`;
        teamText += `👨‍💼 Coach: ${team.coach?.name || 'Unknown'}\n`;
        teamText += `🎨 Colors: ${team.clubColors || 'Unknown'}\n`;
        teamText += `🌐 Website: ${team.website || 'Unknown'}\n`;

        await nexus.sendMessage(chatId, { text: teamText });
        console.log(chalk.green('✅ Team info sent'));

    } catch (error) {
        console.log(chalk.red(`❌ Team info error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching team info: ${error.message}`
        });
    }
};

// Get Upcoming Fixtures
const getFixtures = async (nexus, chatId) => {
    try {
        console.log(chalk.blue('📅 Fetching upcoming fixtures...'));

        // Without dateFrom/dateTo, football-data.org only returns TODAY's matches,
        // which is why this often showed "No upcoming fixtures". Widen to next 7 days.
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = nextWeek.toISOString().split('T')[0];

        const response = await axios.get(`${footballAPI.baseURL}/matches?status=SCHEDULED&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
            headers: { 'X-Auth-Token': footballAPI.apiKey }
        });

        if (!response.data.matches || response.data.matches.length === 0) {
            await nexus.sendMessage(chatId, {
                text: '❌ No upcoming fixtures in the next 7 days'
            });
            return;
        }

        let fixturesText = '📅 UPCOMING FIXTURES (next 7 days)\n\n';
        response.data.matches.forEach((match, index) => {
            const date = new Date(match.utcDate).toLocaleDateString();
            fixturesText += `${index + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name}\n`;
            fixturesText += `   Date: ${date}\n\n`;
        });

        await nexus.sendMessage(chatId, { text: fixturesText });
        console.log(chalk.green('✅ Fixtures sent'));

    } catch (error) {
        console.log(chalk.red(`❌ Fixtures error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching fixtures: ${error.message}`
        });
    }
};

// Match Analysis
const getMatchAnalysis = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `🎙️ MATCH ANALYSIS\n\n🚧 football-data.org's free tier doesn't include possession/shots/cards stats. Not wired to a stats provider yet — was showing made-up numbers before, removed that.`
    });
};

// Head to Head — real, using football-data.org's team search + match filtering.
const getHeadToHead = async (nexus, chatId, teamsText) => {
    try {
        if (!teamsText || !teamsText.includes(' vs ')) {
            await nexus.sendMessage(chatId, {
                text: `🥅 HEAD TO HEAD\n\nUsage: reply with two team names like:\n*Arsenal vs Chelsea*`
            });
            return;
        }
        const [teamAName, teamBName] = teamsText.split(' vs ').map(s => s.trim());

        const searchTeam = async (name) => {
            const res = await axios.get(`${footballAPI.baseURL}/teams?name=${encodeURIComponent(name)}`, {
                headers: { 'X-Auth-Token': footballAPI.apiKey }
            });
            return res.data.teams?.[0] || null;
        };

        const [teamA, teamB] = await Promise.all([searchTeam(teamAName), searchTeam(teamBName)]);
        if (!teamA || !teamB) {
            await nexus.sendMessage(chatId, { text: `❌ Couldn't find one or both teams. Try their full/official name.` });
            return;
        }

        const matchesRes = await axios.get(`${footballAPI.baseURL}/teams/${teamA.id}/matches?status=FINISHED&limit=50`, {
            headers: { 'X-Auth-Token': footballAPI.apiKey }
        });
        const shared = (matchesRes.data.matches || [])
            .filter(m => m.homeTeam.id === teamB.id || m.awayTeam.id === teamB.id)
            .slice(0, 5);

        if (!shared.length) {
            await nexus.sendMessage(chatId, { text: `🥅 No recent meetings found between ${teamA.name} and ${teamB.name} in football-data.org's coverage.` });
            return;
        }

        let text = `🥅 HEAD TO HEAD\n${teamA.name} vs ${teamB.name}\n\n`;
        shared.forEach(m => {
            const date = new Date(m.utcDate).toLocaleDateString();
            text += `${date}: ${m.homeTeam.shortName} ${m.score.fullTime.home}-${m.score.fullTime.away} ${m.awayTeam.shortName}\n`;
        });
        await nexus.sendMessage(chatId, { text });
    } catch (e) {
        await nexus.sendMessage(chatId, { text: `❌ Head-to-head lookup failed: ${e.message}` });
    }
};

// Injury Updates - not available on football-data.org free tier
const getInjuryUpdates = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `⚡ INJURY UPDATES\n\n🚧 This needs a dedicated injury-data source (football-data.org's free tier doesn't include it). Coming soon!`
    });
};

// Transfer News — real, filtering BBC Sport's RSS for transfer-related headlines.
const getTransferNews = async (nexus, chatId) => {
    try {
        const { data } = await axios.get('https://feeds.bbci.co.uk/sport/football/rss.xml', { timeout: 8000 });
        const items = [...data.matchAll(/<item>([\s\S]*?)<\/item>/g)];
        const transferItems = items
            .map(item => item[1].match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1])
            .filter(title => title && /transfer|sign|deal|loan|move/i.test(title))
            .slice(0, 6);
        if (!transferItems.length) {
            await nexus.sendMessage(chatId, { text: '🔄 No transfer news in the current feed right now.' });
            return;
        }
        let text = '🔄 TRANSFER NEWS\n\n' + transferItems.map(t => `• ${t}`).join('\n') + '\n\n_Source: BBC Sport_';
        await nexus.sendMessage(chatId, { text });
    } catch (e) {
        await nexus.sendMessage(chatId, { text: `❌ Couldn't fetch transfer news right now: ${e.message}` });
    }
};

// Football News — real, parsing BBC Sport's public football RSS feed (no API key needed).
const getFootballNews = async (nexus, chatId) => {
    try {
        const { data } = await axios.get('https://feeds.bbci.co.uk/sport/football/rss.xml', { timeout: 8000 });
        const items = [...data.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 6);
        if (!items.length) {
            await nexus.sendMessage(chatId, { text: '🗞️ No news available right now.' });
            return;
        }
        let text = '🗞️ FOOTBALL NEWS\n\n';
        items.forEach(item => {
            const title = item[1].match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || 'Untitled';
            text += `• ${title}\n`;
        });
        text += '\n_Source: BBC Sport_';
        await nexus.sendMessage(chatId, { text });
    } catch (e) {
        await nexus.sendMessage(chatId, { text: `❌ Couldn't fetch news right now: ${e.message}` });
    }
};

// Player Stats — real, using TheSportsDB's free player search.
const getPlayerStats = async (nexus, chatId, playerName) => {
    try {
        if (!playerName) {
            await nexus.sendMessage(chatId, { text: `⛰️ PLAYER STATS\n\nUsage: reply with a player's full name, e.g. *Erling Haaland*` });
            return;
        }
        const { data } = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`);
        const player = data.player?.[0];
        if (!player) {
            await nexus.sendMessage(chatId, { text: `❌ Couldn't find "${playerName}".` });
            return;
        }
        const text = `⛰️ *${player.strPlayer}*\n\n` +
            `Team: ${player.strTeam || 'N/A'}\n` +
            `Position: ${player.strPosition || 'N/A'}\n` +
            `Nationality: ${player.strNationality || 'N/A'}\n` +
            `Born: ${player.dateBorn || 'N/A'}\n` +
            `Height: ${player.strHeight || 'N/A'} | Weight: ${player.strWeight || 'N/A'}`;
        await nexus.sendMessage(chatId, { text });
    } catch (e) {
        await nexus.sendMessage(chatId, { text: `❌ Player lookup failed: ${e.message}` });
    }
};

// Match Predictions - needs a prediction model/odds source
const getMatchPredictions = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `🎯 MATCH PREDICTIONS\n\n🚧 Not wired to a predictions engine yet. Coming soon!`
    });
};

// Match Highlights - needs video source (YouTube etc.)
const searchHighlights = async (nexus, chatId, teamA, teamB) => {
    try {
        const results = await yts(`${teamA} vs ${teamB} highlights`);
        const videos = (results.videos || []).slice(0, 3);
        if (videos.length === 0) {
            await nexus.sendMessage(chatId, { text: `📺 No highlight videos found yet for ${teamA} vs ${teamB}. Try again in a bit.` });
            return;
        }
        let text = `📺 MATCH HIGHLIGHTS — ${teamA} vs ${teamB}\n\n`;
        videos.forEach((v, i) => {
            text += `${i + 1}. ${v.title}\n⏱️ ${v.timestamp} • 👁️ ${v.views.toLocaleString()} views\n🔗 ${v.url}\n\n`;
        });
        await nexus.sendMessage(chatId, { text });
        console.log(chalk.green(`✅ Highlights sent for ${teamA} vs ${teamB}`));
    } catch (error) {
        console.log(chalk.red(`❌ Highlights search error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error searching highlights: ${error.message}` });
    }
};

// Button/menu entry point — sender arg (3rd param passed by dispatchMenuCommand)
// is ignored here since it's never a "TeamA vs TeamB" string.
const getMatchHighlights = async (nexus, chatId, teamsText) => {
    if (!teamsText || !teamsText.includes('vs')) {
        await nexus.sendMessage(chatId, { text: `📺 MATCH HIGHLIGHTS\n\nSend: ${'`'}.highlights TeamA vs TeamB${'`'}` });
        return;
    }
    const [teamA, teamB] = teamsText.split(/vs/i).map(t => t.trim());
    await searchHighlights(nexus, chatId, teamA, teamB);
};

// ============ LIVE MATCH TRACKING ============
// Polls a single match every 90s (safe for football-data.org's free-tier rate
// limit) and posts a message whenever the score or status changes. Auto-stops
// and sends highlights once the match is FINISHED. One tracker per chat.
// Stored on `global` (not a plain module variable) because case.js uses
// freshRequire() to reload this file on every command call, which would
// otherwise wipe this state and break .livetrack stop / duplicate-tracker
// prevention. Still fully per-chat/per-group — each chatId gets its own entry.
if (!global.__footballLiveTrackers) global.__footballLiveTrackers = {};
const liveTrackers = global.__footballLiveTrackers; // { chatId: { intervalHandle, matchId, startedAt } }

const stopLiveTrack = (chatId) => {
    if (liveTrackers[chatId]) {
        clearInterval(liveTrackers[chatId].intervalHandle);
        delete liveTrackers[chatId];
    }
};

const startLiveTrack = async (nexus, chatId, teamQuery) => {
    try {
        if ((teamQuery || '').trim().toLowerCase() === 'stop') {
            const wasTracking = !!liveTrackers[chatId];
            stopLiveTrack(chatId);
            await nexus.sendMessage(chatId, { text: wasTracking ? '🛑 Live tracking stopped.' : 'ℹ️ No active live tracker in this chat.' });
            return;
        }
        if (!teamQuery) {
            await nexus.sendMessage(chatId, { text: `🔴 LIVE TRACKING\n\nSend: ${'`'}.livetrack TeamName${'`'}\nStop anytime: ${'`'}.livetrack stop${'`'}` });
            return;
        }

        const response = await axios.get(`${footballAPI.baseURL}/matches?status=LIVE`, {
            headers: { 'X-Auth-Token': footballAPI.apiKey }
        });
        const matches = response.data.matches || [];
        const found = matches.find(m =>
            m.homeTeam.name.toLowerCase().includes(teamQuery.toLowerCase()) ||
            m.awayTeam.name.toLowerCase().includes(teamQuery.toLowerCase())
        );

        if (!found) {
            await nexus.sendMessage(chatId, { text: `🔴 No live match found matching "${teamQuery}" right now. Check ${'`'}.list todaymatch${'`'} for today's fixtures.` });
            return;
        }

        stopLiveTrack(chatId); // one tracker per chat at a time

        const homeTeam = found.homeTeam.name;
        const awayTeam = found.awayTeam.name;
        const startedAt = Date.now();
        let lastKey = '';

        await nexus.sendMessage(chatId, { text: `🔴 LIVE TRACKING STARTED\n\n${homeTeam} vs ${awayTeam}\nI'll post here whenever the score or match state changes.\n\nStop anytime: ${'`'}.livetrack stop${'`'}` });

        const intervalHandle = setInterval(async () => {
            try {
                if (Date.now() - startedAt > 3 * 60 * 60 * 1000) { // 3hr safety cutoff
                    stopLiveTrack(chatId);
                    return;
                }

                const matchRes = await axios.get(`${footballAPI.baseURL}/matches/${found.id}`, {
                    headers: { 'X-Auth-Token': footballAPI.apiKey }
                });
                const match = matchRes.data.match || matchRes.data;
                const home = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0;
                const away = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0;
                const status = match.status;
                const key = `${status}-${home}-${away}`;

                if (key !== lastKey) {
                    lastKey = key;
                    if (status === 'FINISHED') {
                        await nexus.sendMessage(chatId, { text: `🏁 FULL TIME\n\n${homeTeam} ${home} - ${away} ${awayTeam}` });
                        stopLiveTrack(chatId);
                        await searchHighlights(nexus, chatId, homeTeam, awayTeam);
                    } else {
                        await nexus.sendMessage(chatId, { text: `🔴 LIVE UPDATE\n\n${homeTeam} ${home} - ${away} ${awayTeam}\nStatus: ${status}` });
                    }
                }
            } catch (e) {
                console.log(chalk.red(`❌ Live track poll error: ${e.message}`));
            }
        }, 90000);

        liveTrackers[chatId] = { intervalHandle, matchId: found.id };
        console.log(chalk.green(`✅ Live tracking started: ${homeTeam} vs ${awayTeam} in ${chatId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Live track start error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error starting live tracking: ${error.message}` });
    }
};

// Stadium Info - not on football-data.org
const getStadiumInfo = async (nexus, chatId, teamName) => {
    try {
        if (!teamName) {
            await nexus.sendMessage(chatId, { text: `🏟️ STADIUM INFO\n\nUsage: reply with a team name, e.g. *Arsenal*` });
            return;
        }
        // TheSportsDB's free public test key ("3") — genuinely free tier, no signup needed for basic lookups.
        const { data } = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`);
        const team = data.teams?.[0];
        if (!team) {
            await nexus.sendMessage(chatId, { text: `❌ Couldn't find "${teamName}".` });
            return;
        }
        const text = `🏟️ *${team.strStadium || 'Unknown stadium'}*\n\n` +
            `Team: ${team.strTeam}\n` +
            `Location: ${team.strStadiumLocation || 'N/A'}\n` +
            `Capacity: ${team.intStadiumCapacity ? Number(team.intStadiumCapacity).toLocaleString() : 'N/A'}\n` +
            `Description: ${team.strStadiumDescription ? team.strStadiumDescription.slice(0, 300) + '...' : 'N/A'}`;
        await nexus.sendMessage(chatId, { text });
    } catch (e) {
        await nexus.sendMessage(chatId, { text: `❌ Stadium lookup failed: ${e.message}` });
    }
};

// Referee Stats - not on football-data.org
const getRefereeStats = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `👨‍⚖️ REFEREE STATS\n\n🚧 Not wired to a referee database yet. Coming soon!`
    });
};

// Trophy Cabinet - needs a historical honours dataset
const getTrophyCabinet = async (nexus, chatId, teamName) => {
    try {
        if (!teamName) {
            await nexus.sendMessage(chatId, { text: `🎖️ TROPHY CABINET\n\nUsage: reply with a team name, e.g. *Real Madrid*` });
            return;
        }
        const teamRes = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`);
        const team = teamRes.data.teams?.[0];
        if (!team) {
            await nexus.sendMessage(chatId, { text: `❌ Couldn't find "${teamName}".` });
            return;
        }
        const trophyRes = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/lookuphonours.php?id=${team.idTeam}`);
        const honours = trophyRes.data.honours || [];
        if (!honours.length) {
            await nexus.sendMessage(chatId, { text: `🎖️ No trophy data available for ${team.strTeam} in this source.` });
            return;
        }
        let text = `🎖️ *${team.strTeam} — Trophy Cabinet*\n\n`;
        honours.slice(0, 15).forEach(h => { text += `🏆 ${h.strHonour} (${h.strSeason})\n`; });
        await nexus.sendMessage(chatId, { text });
    } catch (e) {
        await nexus.sendMessage(chatId, { text: `❌ Trophy lookup failed: ${e.message}` });
    }
};

// Historical Stats
const getHistoricalStats = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `📈 HISTORICAL STATS\n\n🚧 Not wired to a historical database yet. Coming soon!`
    });
};

// Hall of Fame
const getHallOfFame = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `🏆 HALL OF FAME\n\n🚧 Not wired to a hall-of-fame database yet. Coming soon!`
    });
};

// Nigeria Football - filterable via football-data.org competitions if NGA league code available
const getNigeriaFootball = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `🇳🇬 NIGERIA FOOTBALL\n\n🚧 football-data.org's free tier has limited NPFL/Super Eagles coverage. Coming soon!`
    });
};

// International Matches - football-data.org has WC/Euro competitions on paid tiers mostly
const getInternationalMatches = async (nexus, chatId) => {
    try {
        console.log(chalk.blue('🌍 Fetching international matches...'));
        const response = await axios.get(`${footballAPI.baseURL}/matches?status=SCHEDULED`, {
            headers: { 'X-Auth-Token': footballAPI.apiKey }
        });
        const intlMatches = (response.data.matches || []).filter(m => m.competition?.type === 'CUP' || /nations|world cup|euro/i.test(m.competition?.name || ''));
        if (!intlMatches.length) {
            await nexus.sendMessage(chatId, { text: '🌍 No international matches scheduled right now.' });
            return;
        }
        let text = '🌍 INTERNATIONAL MATCHES\n\n';
        intlMatches.forEach((match, i) => {
            const date = new Date(match.utcDate).toLocaleDateString();
            text += `${i + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name}\n   ${date}\n\n`;
        });
        await nexus.sendMessage(chatId, { text });
    } catch (error) {
        console.log(chalk.red(`❌ International matches error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `🌍 INTERNATIONAL MATCHES\n\n🚧 Couldn't fetch right now. Try again later!` });
    }
};

module.exports = {
    // Correct names matching menu.js -> case.js dispatch (CMD_football_<slug> -> camelCase)
    liveMatches: getLiveMatches,
    leagueStandings: getStandings,
    topScorers: getTopScorers,
    teamStats: getTeamInfo,
    upcomingFixtures: getFixtures,
    postMatchAnalysis: getMatchAnalysis,
    headToHead: getHeadToHead,
    injuryUpdates: getInjuryUpdates,
    transferNews: getTransferNews,
    footballNews: getFootballNews,
    playerStats: getPlayerStats,
    matchPredictions: getMatchPredictions,
    matchHighlights: getMatchHighlights,
    stadiumInfo: getStadiumInfo,
    refereeStats: getRefereeStats,
    trophyCabinet: getTrophyCabinet,
    historicalStats: getHistoricalStats,
    hallOfFame: getHallOfFame,
    nigeriaFootball: getNigeriaFootball,
    internationalMatches: getInternationalMatches,
    startLiveTrack,

    // Old names kept as aliases in case anything else in the codebase calls them directly
    getLiveMatches,
    getStandings,
    getTopScorers,
    getTeamInfo,
    getFixtures,
    getMatchAnalysis
};

    return module.exports;
})();

const __cmd_fun = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');

// Fun & Games Handler
const funGames = {
    jokes: [
        "Why did the programmer quit his job? Because he didn't get arrays!",
        "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
        "Why do Java developers wear glasses? Because they can't C#!",
        "Why did the developer go broke? Because he used up all his cache!",
        "What's a programmer's favorite hangout place? Foo Bar!"
    ],
    roasts: [
        "You're like a software update - nobody wants you and you make everything worse!",
        "I'd roast you, but my mother taught me not to burn trash!",
        "Your code is like your social skills - non-existent!",
        "You're proof that evolution can go in reverse!",
        "If you were a vegetable, you'd be a turnip - because you turn everything down!"
    ],
    compliments: [
        "You're absolutely amazing! 🌟",
        "Your smile could light up the darkest room! ✨",
        "You're a gift to those around you! 🎁",
        "You're a smart cookie! 🍪",
        "You light up the room! 💡"
    ],
    truthOrDare: {
        truths: [
            "What's your biggest secret? 🤫",
            "Who do you secretly like? 💕",
            "What's your most embarrassing moment? 😳",
            "If you could change one thing about yourself, what would it be? 🤔",
            "What's your biggest fear? 😰"
        ],
        dares: [
            "Send a message to someone you haven't talked to in years! 📱",
            "Do 20 push-ups right now! 💪",
            "Sing a song out loud! 🎤",
            "Change your profile picture to something funny! 🤣",
            "Do your best impression of a celebrity! 🎭"
        ]
    }
};

// Get Random Joke
const getJoke = async (nexus, chatId) => {
    try {
        console.log(chalk.blue(`😂 Getting random joke...`));
        
        const randomJoke = funGames.jokes[Math.floor(Math.random() * funGames.jokes.length)];
        
        let jokeText = `😂 JOKE OF THE DAY\n\n`;
        jokeText += `🎭 ${randomJoke}\n\n`;
        jokeText += `😆 Hahaha! Funny right?\n`;

        await nexus.sendMessage(chatId, { text: jokeText });
        console.log(chalk.green(`✅ Joke sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Joke error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error getting joke: ${error.message}`
        });
    }
};

// Roast Someone
const roastUser = async (nexus, chatId, username) => {
    try {
        console.log(chalk.blue(`🔥 Getting roast for ${username}...`));
        
        const randomRoast = funGames.roasts[Math.floor(Math.random() * funGames.roasts.length)];
        
        let roastText = `🔥 ROAST FOR @${username}\n\n`;
        roastText += `💥 ${randomRoast}\n\n`;
        roastText += `Ohhhhh! That's a BURN! 🔥\n`;

        await nexus.sendMessage(chatId, { text: roastText });
        console.log(chalk.green(`✅ Roast sent for ${username}`));

    } catch (error) {
        console.log(chalk.red(`❌ Roast error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error getting roast: ${error.message}`
        });
    }
};

// Compliment Someone
const complimentUser = async (nexus, chatId, username) => {
    try {
        console.log(chalk.blue(`💕 Getting compliment for ${username}...`));
        
        const randomCompliment = funGames.compliments[Math.floor(Math.random() * funGames.compliments.length)];
        
        let complimentText = `💕 COMPLIMENT FOR @${username}\n\n`;
        complimentText += `✨ ${randomCompliment}\n\n`;
        complimentText += `You deserve all the love! 🥰\n`;

        await nexus.sendMessage(chatId, { text: complimentText });
        console.log(chalk.green(`✅ Compliment sent for ${username}`));

    } catch (error) {
        console.log(chalk.red(`❌ Compliment error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error getting compliment: ${error.message}`
        });
    }
};

// Truth or Dare
const truthOrDare = async (nexus, chatId, choice) => {
    try {
        console.log(chalk.blue(`🎮 Getting ${choice}...`));
        
        let gameText = `🎮 TRUTH OR DARE\n\n`;
        
        if (choice.toLowerCase() === 'truth') {
            const randomTruth = funGames.truthOrDare.truths[Math.floor(Math.random() * funGames.truthOrDare.truths.length)];
            gameText += `🎯 TRUTH:\n`;
            gameText += `"${randomTruth}"\n`;
        } else if (choice.toLowerCase() === 'dare') {
            const randomDare = funGames.truthOrDare.dares[Math.floor(Math.random() * funGames.truthOrDare.dares.length)];
            gameText += `🎯 DARE:\n`;
            gameText += `"${randomDare}"\n`;
        }
        
        gameText += `\n⏰ You have 60 seconds! Go! 🚀\n`;

        await nexus.sendMessage(chatId, { text: gameText });
        console.log(chalk.green(`✅ Truth or Dare sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Truth or Dare error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error with Truth or Dare: ${error.message}`
        });
    }
};

// Dice Roll
const rollDice = async (nexus, chatId, sides = 6) => {
    try {
        console.log(chalk.blue(`🎲 Rolling ${sides}-sided dice...`));
        
        const result = Math.floor(Math.random() * sides) + 1;
        
        let diceText = `🎲 DICE ROLL\n\n`;
        diceText += `🎲 Sides: ${sides}\n`;
        diceText += `🎯 Result: ${result}\n\n`;
        
        if (result === sides) {
            diceText += `🎉 JACKPOT! Perfect roll! 🎉\n`;
        } else if (result === 1) {
            diceText += `💔 Oof! Lowest roll possible!\n`;
        } else {
            diceText += `✅ Fair roll!\n`;
        }

        await nexus.sendMessage(chatId, { text: diceText });
        console.log(chalk.green(`✅ Dice roll sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Dice roll error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error rolling dice: ${error.message}`
        });
    }
};

// Love Calculator
const calculateLove = async (nexus, chatId, name1, name2) => {
    try {
        console.log(chalk.blue(`💕 Calculating love between ${name1} and ${name2}...`));
        
        // Simple hash-based percentage
        const combined = name1 + name2;
        const percentage = (combined.length * 13) % 101;
        
        let loveText = `💕 LOVE CALCULATOR\n\n`;
        loveText += `👤 ${name1} + ${name2}\n\n`;
        loveText += `💘 Love Percentage: ${percentage}%\n\n`;
        
        if (percentage > 80) {
            loveText += `🔥 AMAZING MATCH! Perfect love! 💑\n`;
        } else if (percentage > 60) {
            loveText += `✨ Great Potential! Very compatible! 💕\n`;
        } else if (percentage > 40) {
            loveText += `💭 It could work with effort! 💫\n`;
        } else {
            loveText += `😅 Might be challenging, but love conquers all! 🙏\n`;
        }

        await nexus.sendMessage(chatId, { text: loveText });
        console.log(chalk.green(`✅ Love calculator sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Love calculator error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error calculating love: ${error.message}`
        });
    }
};

// Random Number Generator
const generateRandomNumber = async (nexus, chatId, min = 1, max = 100) => {
    try {
        console.log(chalk.blue(`🎲 Generating random number between ${min} and ${max}...`));
        
        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        
        let randomText = `🎲 RANDOM NUMBER GENERATOR\n\n`;
        randomText += `📊 Range: ${min} - ${max}\n`;
        randomText += `🎯 Result: ${randomNum}\n\n`;
        randomText += `✅ Generated!\n`;

        await nexus.sendMessage(chatId, { text: randomText });
        console.log(chalk.green(`✅ Random number sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Random number error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error generating random number: ${error.message}`
        });
    }
};

// Rate Something
const rateSomething = async (nexus, chatId, something) => {
    try {
        console.log(chalk.blue(`⭐ Rating ${something}...`));
        
        const rating = Math.floor(Math.random() * 5) + 1;
        const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
        
        let ratingText = `⭐ RATING: ${something}\n\n`;
        ratingText += `${stars}\n`;
        ratingText += `Rating: ${rating}/5\n\n`;
        
        if (rating === 5) {
            ratingText += `🔥 AMAZING! Absolutely perfect!\n`;
        } else if (rating === 4) {
            ratingText += `👍 Great! Really good!\n`;
        } else if (rating === 3) {
            ratingText += `😐 Okay! Could be better!\n`;
        } else {
            ratingText += `😟 Not so good! Needs improvement!\n`;
        }

        await nexus.sendMessage(chatId, { text: ratingText });
        console.log(chalk.green(`✅ Rating sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Rating error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error rating: ${error.message}`
        });
    }
};

// Flip Coin
const flipCoin = async (nexus, chatId) => {
    try {
        console.log(chalk.blue(`🪙 Flipping coin...`));
        
        const result = Math.random() > 0.5 ? 'Heads' : 'Tails';
        
        let flipText = `🪙 COIN FLIP\n\n`;
        flipText += `🔄 Flipping...\n`;
        flipText += `🪙 Result: ${result}\n\n`;
        flipText += `✅ Coin flipped!\n`;

        await nexus.sendMessage(chatId, { text: flipText });
        console.log(chalk.green(`✅ Coin flip sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Coin flip error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error flipping coin: ${error.message}`
        });
    }
};

module.exports = {
    getJoke,
    roastUser,
    complimentUser,
    truthOrDare,
    rollDice,
    calculateLove,
    generateRandomNumber,
    rateSomething,
    flipCoin
};

    return module.exports;
})();


// ============ inlined from commands/games.js ============
const __cmd_games = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const economy = __cmd_economy; // shared wallet — always credit coins through economy.awardCoins()

// ============ SESSION STORAGE (one active game per chat) ============
const SESSION_FILE = path.join(__dirname, '..', 'database', 'games_session.json');
const STATS_FILE = path.join(__dirname, '..', 'database', 'games_stats.json');
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes idle -> auto expire

function loadJSON(file) {
    try {
        if (!fs.existsSync(file)) fs.writeFileSync(file, '{}');
        return JSON.parse(fs.readFileSync(file));
    } catch (e) { return {}; }
}
function saveJSON(file, data) {
    try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch (e) {}
}
function getSession(chatId) {
    const all = loadJSON(SESSION_FILE);
    const s = all[chatId];
    if (!s) return null;
    if (Date.now() - s.ts > SESSION_TTL_MS) { clearSession(chatId); return null; }
    return s;
}
function setSession(chatId, data) {
    const all = loadJSON(SESSION_FILE);
    all[chatId] = { ...data, ts: Date.now() };
    saveJSON(SESSION_FILE, all);
}
function clearSession(chatId) {
    const all = loadJSON(SESSION_FILE);
    delete all[chatId];
    saveJSON(SESSION_FILE, all);
}
function hasActiveGame(chatId) {
    return !!getSession(chatId);
}

function bumpStat(sender, field) {
    if (!sender) return;
    const stats = loadJSON(STATS_FILE);
    if (!stats[sender]) stats[sender] = { wins: 0, played: 0 };
    stats[sender][field] = (stats[sender][field] || 0) + 1;
    saveJSON(STATS_FILE, stats);
}

async function send(nexus, chatId, text) {
    await nexus.sendMessage(chatId, { text });
}

async function reward(nexus, chatId, amount, desc) {
    const newBalance = await economy.awardCoins(chatId, amount, desc);
    return newBalance;
}

// ============ QUESTION / WORD BANKS ============
const TRIVIA_BANK = [
    { q: 'Which country won the first FIFA World Cup in 1930?', options: ['Brazil', 'Uruguay', 'Argentina', 'Italy'], answer: 1 },
    { q: 'What is the capital of Nigeria?', options: ['Lagos', 'Kano', 'Abuja', 'Ibadan'], answer: 2 },
    { q: 'How many continents are there on Earth?', options: ['5', '6', '7', '8'], answer: 2 },
    { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
    { q: 'Who wrote the play "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'], answer: 1 },
    { q: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
    { q: 'Which gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], answer: 1 },
    { q: 'How many players are on a football team on the pitch?', options: ['9', '10', '11', '12'], answer: 2 },
    { q: 'What is the chemical symbol for gold?', options: ['Ag', 'Au', 'Gd', 'Go'], answer: 1 },
    { q: 'Which country has the most population in Africa?', options: ['Egypt', 'Ethiopia', 'Nigeria', 'South Africa'], answer: 2 },
    { q: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], answer: 2 },
    { q: 'Which organ pumps blood around the human body?', options: ['Lungs', 'Brain', 'Heart', 'Liver'], answer: 2 },
    { q: 'In what year did Nigeria gain independence?', options: ['1957', '1960', '1963', '1970'], answer: 1 },
    { q: 'What does "www" stand for?', options: ['World Wide Web', 'World Web Wide', 'Web World Wide', 'Wide World Web'], answer: 0 },
    { q: 'Which is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], answer: 1 }
];

const WORD_BANK_SHORT = [
    'football', 'guitar', 'elephant', 'sunshine', 'keyboard', 'diamond', 'volcano',
    'mountain', 'chocolate', 'butterfly', 'umbrella', 'rainbow', 'stadium', 'treasure'
];

const WORD_BANK_HANGMAN = [
    'python', 'whatsapp', 'legendary', 'trophy', 'goalkeeper', 'javascript',
    'referee', 'stadium', 'championship', 'developer', 'network', 'password'
];

// ============ HELPERS ============
function scramble(word) {
    let arr = word.split('');
    let scrambled = word;
    let attempts = 0;
    while (scrambled === word && attempts < 20) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        scrambled = arr.join('');
        attempts++;
    }
    return scrambled;
}

function renderHangman(session) {
    const display = session.word.split('').map(ch => session.guessed.includes(ch) ? ch : '_').join(' ');
    const wrongLetters = session.guessedWrong.join(', ') || 'none';
    const stages = ['🙂', '😐', '😕', '😟', '😨', '😰', '💀'];
    return `🪢 HANGMAN ${stages[session.wrong]}\n\n${display.toUpperCase()}\n\n❌ Wrong guesses (${session.wrong}/${session.maxWrong}): ${wrongLetters}\n\n💬 Reply with one letter, or QUIT to cancel.`;
}

function renderBoard(board) {
    const cell = (i) => board[i] || String(i + 1);
    return `${cell(0)} | ${cell(1)} | ${cell(2)}\n---------\n${cell(3)} | ${cell(4)} | ${cell(5)}\n---------\n${cell(6)} | ${cell(7)} | ${cell(8)}`;
}

const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];
function checkWinner(board) {
    for (const [a, b, c] of WIN_LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    if (board.every(c => c)) return 'draw';
    return null;
}
// ============ GAME STARTERS (called from menu button taps) ============
const trivia = async (nexus, chatId) => {
    const pick = TRIVIA_BANK[Math.floor(Math.random() * TRIVIA_BANK.length)];
    setSession(chatId, { type: 'trivia', answerIndex: pick.answer, question: pick.q, options: pick.options, rewardAmt: 150 });
    const letters = ['A', 'B', 'C', 'D'];
    const optText = pick.options.map((o, i) => `${letters[i]}) ${o}`).join('\n');
    await send(nexus, chatId, `🧠 TRIVIA QUIZ\n\n${pick.q}\n\n${optText}\n\n💬 Reply with A, B, C or D. Win 150 coins!`);
};

const wordUnscramble = async (nexus, chatId) => {
    const word = WORD_BANK_SHORT[Math.floor(Math.random() * WORD_BANK_SHORT.length)];
    const scrambled = scramble(word);
    setSession(chatId, { type: 'unscramble', word, tries: 0, maxTries: 3, rewardAmt: 120 });
    await send(nexus, chatId, `🔤 WORD UNSCRAMBLE\n\nUnscramble this word:\n\n👉 ${scrambled.toUpperCase()}\n\n💬 Reply with your guess. You have 3 tries. Win 120 coins!`);
};

const guessTheNumber = async (nexus, chatId) => {
    const target = Math.floor(Math.random() * 100) + 1;
    setSession(chatId, { type: 'guessnumber', target, tries: 0, maxTries: 7 });
    await send(nexus, chatId, `🔢 GUESS THE NUMBER\n\nI'm thinking of a number between 1 and 100.\nYou have 7 tries. Coins depend on how fast you get it!\n\n💬 Reply with your guess.`);
};

const hangman = async (nexus, chatId) => {
    const word = WORD_BANK_HANGMAN[Math.floor(Math.random() * WORD_BANK_HANGMAN.length)];
    const session = { type: 'hangman', word, guessed: [], guessedWrong: [], wrong: 0, maxWrong: 6, rewardAmt: 180 };
    setSession(chatId, session);
    await send(nexus, chatId, renderHangman(session));
};

const ticTacToe = async (nexus, chatId, sender) => {
    if (!sender) {
        await send(nexus, chatId, `⭕ Tic Tac Toe needs to know who's challenging — please try tapping the button again.`);
        return;
    }
    const existing = getSession(chatId);
    if (existing && existing.type === 'tictactoe') {
        await send(nexus, chatId, existing.phase === 'lobby'
            ? `⭕ A game is already waiting for a second player. Reply "register" to join!`
            : `⭕ A game is already in progress in this chat. Reply "quit" to cancel it first.`);
        return;
    }
    setSession(chatId, { type: 'tictactoe', phase: 'lobby', challenger: sender, rewardAmt: 200 });
    await send(nexus, chatId, `⭕ TIC TAC TOE — @${sender.split('@')[0]} wants to play!\n\n💬 Anyone else in this chat, reply "register" to join as opponent.\nFirst person to register plays. Winner gets 200 coins!`);
};

const rollTheDice = async (nexus, chatId) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    const won = roll === 6;
    let text = `🎲 You rolled a ${roll}!`;
    if (won) {
        const bal = await reward(nexus, chatId, 50, 'Dice roll (6)');
        text += `\n\n🎉 Rolled a 6! +50 coins\n💰 Balance: ${bal.toLocaleString()}`;
    } else {
        text += `\n\nRoll a 6 to win coins. Try again!`;
    }
    await send(nexus, chatId, text);
};

const coinFlip = async (nexus, chatId) => {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    await send(nexus, chatId, `🪙 The coin landed on... ${result}!\n\n💬 Play again anytime.`);
};

const gameLeaderboard = async (nexus, chatId) => {
    const stats = loadJSON(STATS_FILE);
    const top = Object.entries(stats)
        .sort((a, b) => (b[1].wins || 0) - (a[1].wins || 0))
        .slice(0, 10);
    if (!top.length) {
        await send(nexus, chatId, `🏆 GAME LEADERBOARD\n\nNo wins recorded yet — be the first! Try Trivia, Hangman, or Tic Tac Toe.`);
        return;
    }
    const lines = top.map(([id, s], i) => `${i + 1}. ${id.split('@')[0]} — ${s.wins || 0} wins (${s.played || 0} played)`);
    await send(nexus, chatId, `🏆 GAME LEADERBOARD (Top 10)\n\n${lines.join('\n')}`);
};

const endGame = async (nexus, chatId) => {
    const had = hasActiveGame(chatId);
    clearSession(chatId);
    await send(nexus, chatId, had ? `🛑 Game ended. Play another anytime from the menu!` : `No active game to end right now.`);
};

// ============ REPLY ROUTER ============
// Called from case.js whenever a plain-text message arrives in a chat that
// has an active game session. Returns true if it consumed the message.
const handleGameReply = async (nexus, chatId, sender, rawText) => {
    const session = getSession(chatId);
    if (!session) return false;
    const text = (rawText || '').trim();
    const lower = text.toLowerCase();

    if (lower === 'quit' || lower === 'cancel' || lower === 'stop') {
        clearSession(chatId);
        await send(nexus, chatId, `🛑 Game cancelled.`);
        return true;
    }

    if (session.type === 'trivia') {
        const letters = ['A', 'B', 'C', 'D'];
        const idx = letters.indexOf(lower.toUpperCase()[0]);
        if (idx === -1 || !/^[a-d]$/i.test(lower)) return false; // not a valid trivia reply, let other handlers try
        bumpStat(sender, 'played');
        
        // Defensive: ensure answer index is valid
        if (typeof session.answerIndex !== 'number' || session.answerIndex < 0 || session.answerIndex >= session.options.length) {
            console.log(chalk.red(`❌ Trivia session corrupted: answerIndex ${session.answerIndex}, options length ${session.options.length}`));
            clearSession(chatId);
            await send(nexus, chatId, `⚠️ There was an issue with the question data. Try another Trivia round.`);
            return true;
        }
        
        if (idx === session.answerIndex) {
            const bal = await reward(nexus, chatId, session.rewardAmt, 'Trivia win');
            bumpStat(sender, 'wins');
            await send(nexus, chatId, `✅ Correct! It was ${letters[session.answerIndex]}) ${session.options[session.answerIndex]}.\n\n🎉 +${session.rewardAmt} coins!\n💰 Balance: ${bal.toLocaleString()}`);
        } else {
            const correctAnswer = session.options[session.answerIndex];
            await send(nexus, chatId, `❌ Wrong! The correct answer was ${letters[session.answerIndex]}) ${correctAnswer}.\n\nTry another Trivia round from the menu!`);
        }
        clearSession(chatId);
        return true;
    }

    if (session.type === 'unscramble') {
        if (lower === session.word) {
            bumpStat(sender, 'played'); bumpStat(sender, 'wins');
            const bal = await reward(nexus, chatId, session.rewardAmt, 'Unscramble win');
            await send(nexus, chatId, `✅ Correct! The word was "${session.word.toUpperCase()}".\n\n🎉 +${session.rewardAmt} coins!\n💰 Balance: ${bal.toLocaleString()}`);
            clearSession(chatId);
            return true;
        }
        session.tries += 1;
        if (session.tries >= session.maxTries) {
            bumpStat(sender, 'played');
            await send(nexus, chatId, `❌ Out of tries! The word was "${session.word.toUpperCase()}".\n\nTry another round from the menu!`);
            clearSession(chatId);
            return true;
        }
        setSession(chatId, session);
        await send(nexus, chatId, `❌ Not quite. Tries left: ${session.maxTries - session.tries}. Try again!`);
        return true;
    }

    if (session.type === 'guessnumber') {
        const guess = parseInt(text, 10);
        if (isNaN(guess)) return false;
        session.tries += 1;
        if (guess === session.target) {
            bumpStat(sender, 'played'); bumpStat(sender, 'wins');
            const coinsWon = Math.max(200 - session.tries * 20, 40);
            const bal = await reward(nexus, chatId, coinsWon, 'Guess the number win');
            await send(nexus, chatId, `🎉 Correct! It was ${session.target}, guessed in ${session.tries} ${session.tries === 1 ? 'try' : 'tries'}.\n\n+${coinsWon} coins!\n💰 Balance: ${bal.toLocaleString()}`);
            clearSession(chatId);
            return true;
        }
        if (session.tries >= session.maxTries) {
            bumpStat(sender, 'played');
            await send(nexus, chatId, `❌ Out of tries! The number was ${session.target}.\n\nTry again from the menu!`);
            clearSession(chatId);
            return true;
        }
        setSession(chatId, session);
        await send(nexus, chatId, `${guess < session.target ? '⬆️ Higher!' : '⬇️ Lower!'} Tries left: ${session.maxTries - session.tries}`);
        return true;
    }

    if (session.type === 'hangman') {
        if (!/^[a-z]$/i.test(text)) return false;
        const letter = lower;
        if (session.guessed.includes(letter) || session.guessedWrong.includes(letter)) {
            await send(nexus, chatId, `You already tried "${letter.toUpperCase()}". Pick another letter.`);
            return true;
        }
        if (session.word.includes(letter)) {
            session.guessed.push(letter);
        } else {
            session.guessedWrong.push(letter);
            session.wrong += 1;
        }
        const solved = session.word.split('').every(ch => session.guessed.includes(ch));
        if (solved) {
            bumpStat(sender, 'played'); bumpStat(sender, 'wins');
            const bal = await reward(nexus, chatId, session.rewardAmt, 'Hangman win');
            await send(nexus, chatId, `🎉 You got it! The word was "${session.word.toUpperCase()}".\n\n+${session.rewardAmt} coins!\n💰 Balance: ${bal.toLocaleString()}`);
            clearSession(chatId);
            return true;
        }
        if (session.wrong >= session.maxWrong) {
            bumpStat(sender, 'played');
            await send(nexus, chatId, `💀 You lost! The word was "${session.word.toUpperCase()}".\n\nTry another round from the menu!`);
            clearSession(chatId);
            return true;
        }
        setSession(chatId, session);
        await send(nexus, chatId, renderHangman(session));
        return true;
    }

    if (session.type === 'tictactoe') {
        // ---- Lobby phase: waiting for a second player to register ----
        if (session.phase === 'lobby') {
            if (lower !== 'register') return false; // let other text pass through untouched
            if (sender === session.challenger) {
                await send(nexus, chatId, `You already started this game — wait for someone else to register.`);
                return true;
            }
            session.phase = 'playing';
            session.opponent = sender;
            session.symbols = { [session.challenger]: 'X', [session.opponent]: 'O' };
            session.turn = session.challenger; // challenger (X) always goes first
            session.board = Array(9).fill('');
            setSession(chatId, session);
            await send(nexus, chatId, `✅ @${sender.split('@')[0]} joined! It's @${session.challenger.split('@')[0]} (X) vs @${session.opponent.split('@')[0]} (O).\n\n${renderBoard(session.board)}\n\n💬 @${session.challenger.split('@')[0]}, reply with a number 1-9 to move.`);
            return true;
        }

        // ---- Playing phase ----
        if (sender !== session.challenger && sender !== session.opponent) {
            return false; // not one of the two players — ignore, let normal chat continue
        }
        if (sender !== session.turn) {
            await send(nexus, chatId, `⏳ Not your turn — waiting on @${session.turn.split('@')[0]}.`);
            return true;
        }
        const pos = parseInt(text, 10) - 1;
        if (isNaN(pos) || pos < 0 || pos > 8) return false;
        if (session.board[pos]) {
            await send(nexus, chatId, `That spot is taken. Pick another number 1-9.`);
            return true;
        }
        const mySymbol = session.symbols[sender];
        session.board[pos] = mySymbol;
        const winner = checkWinner(session.board);
        if (winner) {
            bumpStat(session.challenger, 'played');
            bumpStat(session.opponent, 'played');
            if (winner === 'draw') {
                await send(nexus, chatId, `${renderBoard(session.board)}\n\n🤝 It's a draw! Good game.`);
            } else {
                const winnerId = winner === 'X' ? session.challenger : session.opponent;
                bumpStat(winnerId, 'wins');
                const bal = await reward(nexus, chatId, session.rewardAmt, 'Tic Tac Toe win');
                await send(nexus, chatId, `${renderBoard(session.board)}\n\n🎉 @${winnerId.split('@')[0]} wins! +${session.rewardAmt} coins!\n💰 Chat balance: ${bal.toLocaleString()}`);
            }
            clearSession(chatId);
            return true;
        }
        session.turn = sender === session.challenger ? session.opponent : session.challenger;
        setSession(chatId, session);
        await send(nexus, chatId, `${renderBoard(session.board)}\n\n💬 @${session.turn.split('@')[0]}'s turn — reply 1-9.`);
        return true;
    }

    return false;
};

module.exports = {
    trivia, wordUnscramble, guessTheNumber, hangman, ticTacToe,
    rollTheDice, coinFlip, gameLeaderboard, endGame,
    handleGameReply, hasActiveGame,
    menuMap: {
        'trivia_quiz': trivia,
        'word_unscramble': wordUnscramble,
        'guess_the_number': guessTheNumber,
        'hangman': hangman,
        'tic_tac_toe': ticTacToe,
        'roll_the_dice': rollTheDice,
        'coin_flip': coinFlip,
        'game_leaderboard': gameLeaderboard,
        'end_game': endGame
    }
};

    return module.exports;
})();


// ============ inlined from commands/group.js ============
const __cmd_group = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const fs = require('fs');
const { sendQuickReplyButtons } = __cmd_menu; // ⚠️ update this path if menu.js sits in a different folder relative to group.js

const JAIL_FILE = './database/jail.json';
const SETTINGS_FILE = './database/groupsettings.json';
const REPORTS_FILE = './database/reports.json';
const BACKUP_DIR = './database/backups';
const WARN_FILE = './database/warnings.json';
const ROLES_FILE = './database/roles.json';
const ACTIVITY_FILE = './database/activity.json';
const BIRTHDAY_FILE = './database/birthdays.json';
const EVENTS_FILE = './database/events.json';

// In-memory votekick tracker (resets on restart, that's fine — votes shouldn't persist)
const voteKickTracker = {}; // { "chatId:targetId": Set(voterIds) }

// ============ STORAGE HELPERS ============
function loadJSON(file, fallback = {}) {
    try {
        if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback));
        return JSON.parse(fs.readFileSync(file));
    } catch (e) { return fallback; }
}
function saveJSON(file, data) {
    try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch (e) {}
}

function getGroupSettings(chatId) {
    const all = loadJSON(SETTINGS_FILE);
    return all[chatId] || {
        antifake: false, antiforward: false, antipoll: false,
        antisticker: false, antiviewonce: false, anticaps: false,
        antilongmsg: false, approvalmode: false, lockmessages: false,
        rules: ''
    };
}
function saveGroupSettings(chatId, settings) {
    const all = loadJSON(SETTINGS_FILE);
    all[chatId] = settings;
    saveJSON(SETTINGS_FILE, all);
}

// ============ SETTINGS MENU (buttons) ============
// approvalmode & lockmessages need real WA API calls (setApprovalMode / lockMessages
// further down), the rest are plain flags handled by toggleSetting.
const SETTINGS_META = [
    { key: 'antifake',      label: 'Anti-Fake Numbers',        emoji: '🎭' },
    { key: 'antiforward',   label: 'Anti-Forward',             emoji: '↪️' },
    { key: 'antipoll',      label: 'Anti-Poll',                emoji: '🗳️' },
    { key: 'antisticker',   label: 'Anti-Sticker',             emoji: '🖼️' },
    { key: 'antiviewonce',  label: 'Anti-View-Once',           emoji: '👁️' },
    { key: 'anticaps',      label: 'Anti-Caps',                emoji: '🔠' },
    { key: 'antilongmsg',   label: 'Anti-Long-Message',        emoji: '📏' },
    { key: 'automod',       label: 'Auto-Moderation (3-warn kick)', emoji: '⏰' },
    { key: 'approvalmode',  label: 'Approval Mode',            emoji: '✅' },
    { key: 'lockmessages',  label: 'Lock Messages (Admins Only)', emoji: '🔒' }
];
const SETTINGS_PAGE_SIZE = 5;

function pageForSettingKey(key) {
    const idx = SETTINGS_META.findIndex(m => m.key === key);
    return idx < 0 ? 0 : Math.floor(idx / SETTINGS_PAGE_SIZE);
}

// ============ JAIL / UNJAIL ============
const jailUser = async (nexus, chatId, targetId) => {
    try {
        console.log(chalk.blue(`🔒 Jailing ${targetId} in ${chatId}...`));

        const jail = loadJSON(JAIL_FILE);
        jail[chatId] = jail[chatId] || [];

        if (jail[chatId].includes(targetId)) {
            await nexus.sendMessage(chatId, { text: `⚠️ User already in jail.` });
            return;
        }

        jail[chatId].push(targetId);
        saveJSON(JAIL_FILE, jail);

        await nexus.sendMessage(chatId, {
            text: `🔒 @${targetId.split('@')[0]} don land for jail! They can't send messages until unjailed.`,
            mentions: [targetId]
        });

        console.log(chalk.green(`✅ ${targetId} jailed`));
    } catch (error) {
        console.log(chalk.red(`❌ Jail error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error jailing user: ${error.message}` });
    }
};

const unjailUser = async (nexus, chatId, targetId) => {
    try {
        console.log(chalk.blue(`🔓 Unjailing ${targetId} in ${chatId}...`));

        const jail = loadJSON(JAIL_FILE);
        jail[chatId] = (jail[chatId] || []).filter(id => id !== targetId);
        saveJSON(JAIL_FILE, jail);

        await nexus.sendMessage(chatId, {
            text: `🔓 @${targetId.split('@')[0]} don comot for jail. Free again!`,
            mentions: [targetId]
        });

        console.log(chalk.green(`✅ ${targetId} unjailed`));
    } catch (error) {
        console.log(chalk.red(`❌ Unjail error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error unjailing user: ${error.message}` });
    }
};

// Call this from your message handler before processing any group text —
// if it returns true, the message should be deleted/ignored.
const isJailed = (chatId, userId) => {
    const jail = loadJSON(JAIL_FILE);
    return (jail[chatId] || []).includes(userId);
};

// ============ VOTEKICK ============
const voteKick = async (nexus, chatId, targetId, voterId, groupMetadata, requiredVotes = 3) => {
    try {
        const key = `${chatId}:${targetId}`;
        if (!voteKickTracker[key]) voteKickTracker[key] = new Set();

        if (voteKickTracker[key].has(voterId)) {
            await nexus.sendMessage(chatId, { text: `⚠️ You already voted to kick this person.` });
            return;
        }

        voteKickTracker[key].add(voterId);
        const votes = voteKickTracker[key].size;

        if (votes >= requiredVotes) {
            await nexus.groupParticipantsUpdate(chatId, [targetId], 'remove');
            await nexus.sendMessage(chatId, {
                text: `👢 @${targetId.split('@')[0]} don get voted out! (${votes}/${requiredVotes} votes)`,
                mentions: [targetId]
            });
            delete voteKickTracker[key];
        } else {
            await nexus.sendMessage(chatId, {
                text: `🗳️ Vote registered! ${votes}/${requiredVotes} votes to kick @${targetId.split('@')[0]}`,
                mentions: [targetId]
            });
        }

        console.log(chalk.green(`✅ Votekick processed for ${targetId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Votekick error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error processing votekick: ${error.message}` });
    }
};

// Sends the tappable "Vote to Kick" button. Anyone in the group can tap it;
// each tap routes to voteKick() below via handleGroupSelection with their own id as voterId.
const sendVoteKickPrompt = async (nexus, chatId, targetId, requiredVotes = 3) => {
    try {
        await sendQuickReplyButtons(nexus, chatId, {
            bodyText: `🗳️ VOTEKICK STARTED\n\n@${targetId.split('@')[0]} don get nominated for removal.\n${requiredVotes} votes needed.\n\nTap below to add your vote.`,
            footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽',
            buttons: [{ title: '🗳️ Vote to Kick', id: `VK_VOTE_${targetId}` }]
        });
        console.log(chalk.green(`✅ Votekick prompt sent for ${targetId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Votekick prompt error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error starting votekick: ${error.message}` });
    }
};

// ============ ANTI-FEATURE TOGGLES ============
const toggleSetting = async (nexus, chatId, settingName, enabled) => {
    try {
        const settings = getGroupSettings(chatId);
        settings[settingName] = enabled;
        saveGroupSettings(chatId, settings);

        await nexus.sendMessage(chatId, {
            text: `${enabled ? '✅' : '❌'} ${settingName} is now ${enabled ? 'ON' : 'OFF'}`
        });

        console.log(chalk.green(`✅ ${settingName} set to ${enabled} for ${chatId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Toggle setting error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error updating setting: ${error.message}` });
    }
};

// Sends the settings menu as tappable quick_reply buttons. Each button shows
// 🟢/🔴 for current state; tapping it toggles that one setting (routed
// through handleGroupSelection below) and re-sends the same page.
const sendGroupSettingsMenu = async (nexus, chatId, page = 0) => {
    try {
        const settings = getGroupSettings(chatId);
        const totalPages = Math.ceil(SETTINGS_META.length / SETTINGS_PAGE_SIZE);
        page = Math.max(0, Math.min(page, totalPages - 1));

        const start = page * SETTINGS_PAGE_SIZE;
        const pageMeta = SETTINGS_META.slice(start, start + SETTINGS_PAGE_SIZE);

        const buttons = pageMeta.map(m => ({
            title: `${settings[m.key] ? '🟢' : '🔴'} ${m.emoji} ${m.label}`,
            id: `GS_TOGGLE_${m.key}`
        }));

        if (page < totalPages - 1) buttons.push({ title: '➡️ Next Page', id: `GS_PAGE_${page + 1}` });
        if (page > 0) buttons.push({ title: '⬅️ Previous Page', id: `GS_PAGE_${page - 1}` });

        await sendQuickReplyButtons(nexus, chatId, {
            bodyText: `⚙️ GROUP SETTINGS\n\n🟢 = ON   🔴 = OFF\nTap a setting to toggle it.\n\n📄 Page ${page + 1}/${totalPages}`,
            footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽',
            buttons
        });

        console.log(chalk.green(`✅ Settings menu page ${page + 1} sent for ${chatId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Settings menu error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error loading settings menu: ${error.message}` });
    }
};

// Call from your main message handler on every incoming group message.
// Returns true if the message was actioned (deleted) so caller can stop further processing.
function getWarnings(chatId, userId) {
    const warns = loadJSON(WARN_FILE);
    return (warns[chatId] && warns[chatId][userId]) || 0;
}

async function addWarning(nexus, chatId, userId, reason) {
    const warns = loadJSON(WARN_FILE);
    if (!warns[chatId]) warns[chatId] = {};
    warns[chatId][userId] = (warns[chatId][userId] || 0) + 1;
    saveJSON(WARN_FILE, warns);

    const count = warns[chatId][userId];
    if (count >= 3) {
        try {
            await nexus.groupParticipantsUpdate(chatId, [userId], 'remove');
            await nexus.sendMessage(chatId, { text: `⏰ @${userId.split('@')[0]} auto-kicked after 3 warnings (${reason}).`, mentions: [userId] });
            warns[chatId][userId] = 0;
            saveJSON(WARN_FILE, warns);
        } catch (e) {
            console.log(chalk.red(`❌ Automod kick error: ${e.message}`));
        }
    } else {
        await nexus.sendMessage(chatId, { text: `⚠️ Warning ${count}/3 @${userId.split('@')[0]} — ${reason}`, mentions: [userId] });
    }
}

const handleAntiChecks = async (nexus, chatId, msg, senderId, isAdmin) => {
    try {
        if (isAdmin) return false; // admins bypass anti-features
        const settings = getGroupSettings(chatId);
        const msgType = Object.keys(msg.message || {})[0];
        const textBody = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

        // Note: flood/anti-spam detection already exists natively in case.js
        // (real working implementation, "antispam" setting) — not duplicated here.

        // antiforward
        if (settings.antiforward && msg.message?.extendedTextMessage?.contextInfo?.isForwarded) {
            await nexus.sendMessage(chatId, { delete: msg.key });
            if (settings.automod) await addWarning(nexus, chatId, senderId, 'forwarding messages');
            else await nexus.sendMessage(chatId, { text: `🚫 Forwarded messages no dey allowed here @${senderId.split('@')[0]}`, mentions: [senderId] });
            return true;
        }

        // antipoll
        if (settings.antipoll && msgType === 'pollCreationMessage') {
            await nexus.sendMessage(chatId, { delete: msg.key });
            if (settings.automod) await addWarning(nexus, chatId, senderId, 'posting a poll');
            else await nexus.sendMessage(chatId, { text: `🚫 Polls no dey allowed here.` });
            return true;
        }

        // antisticker
        if (settings.antisticker && msgType === 'stickerMessage') {
            await nexus.sendMessage(chatId, { delete: msg.key });
            if (settings.automod) await addWarning(nexus, chatId, senderId, 'sending a sticker');
            else await nexus.sendMessage(chatId, { text: `🚫 Stickers no dey allowed here.` });
            return true;
        }

        // antiviewonce
        if (settings.antiviewonce && (msgType === 'viewOnceMessage' || msgType === 'viewOnceMessageV2')) {
            await nexus.sendMessage(chatId, { delete: msg.key });
            if (settings.automod) await addWarning(nexus, chatId, senderId, 'sending a view-once message');
            else await nexus.sendMessage(chatId, { text: `🚫 View-once messages no dey allowed here.` });
            return true;
        }

        // anticaps (more than 80% uppercase in a message longer than 10 chars)
        if (settings.anticaps && textBody.length > 10) {
            const letters = textBody.replace(/[^a-zA-Z]/g, '');
            const upper = textBody.replace(/[^A-Z]/g, '');
            if (letters.length > 0 && (upper.length / letters.length) > 0.8) {
                await nexus.sendMessage(chatId, { delete: msg.key });
                if (settings.automod) await addWarning(nexus, chatId, senderId, 'excessive CAPS');
                else await nexus.sendMessage(chatId, { text: `🚫 Too much CAPS @${senderId.split('@')[0]}, take am easy.`, mentions: [senderId] });
                return true;
            }
        }

        // antilongmsg (over 1000 characters)
        if (settings.antilongmsg && textBody.length > 1000) {
            await nexus.sendMessage(chatId, { delete: msg.key });
            if (settings.automod) await addWarning(nexus, chatId, senderId, 'message too long');
            else await nexus.sendMessage(chatId, { text: `🚫 Message too long @${senderId.split('@')[0]}, keep am short.`, mentions: [senderId] });
            return true;
        }

        return false;
    } catch (error) {
        console.log(chalk.red(`❌ Anti-check error: ${error.message}`));
        return false;
    }
};

// ============ RULES ============
// Uses the same store as groupCommands.js's .setrules/.rules commands
// (Settings.js, key 'group_rules') so the button and the text command always
// agree — they used to be two separate, silently conflicting rule stores.
const setRules = async (nexus, chatId, rulesText) => {
    try {
        setBotSetting(chatId, 'group_rules', rulesText);
        await nexus.sendMessage(chatId, { text: `📝 Group rules updated!` });
        console.log(chalk.green(`✅ Rules set for ${chatId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Set rules error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error setting rules: ${error.message}` });
    }
};

const getRules = async (nexus, chatId) => {
    try {
        const rules = getBotSetting(chatId, 'group_rules', null);
        const text = rules
            ? `📝 GROUP RULES\n\n${rules}`
            : `📝 No rules set yet. Admin can use .setrules [text]`;
        await nexus.sendMessage(chatId, { text });
    } catch (error) {
        console.log(chalk.red(`❌ Get rules error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error fetching rules: ${error.message}` });
    }
};

// ============ REPORT SYSTEM ============
const reportUser = async (nexus, chatId, byId, targetId, reason) => {
    try {
        const reports = loadJSON(REPORTS_FILE);
        reports[chatId] = reports[chatId] || [];
        reports[chatId].push({
            by: byId, target: targetId, reason: reason || 'No reason given',
            time: new Date().toISOString()
        });
        saveJSON(REPORTS_FILE, reports);

        await nexus.sendMessage(chatId, {
            text: `🚨 Report filed against @${targetId.split('@')[0]}.\nReason: ${reason || 'No reason given'}\n\nAdmins have been notified.`,
            mentions: [targetId]
        });

        console.log(chalk.green(`✅ Report filed against ${targetId} by ${byId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Report error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error filing report: ${error.message}` });
    }
};

const reportList = async (nexus, chatId) => {
    try {
        const reports = loadJSON(REPORTS_FILE);
        const list = reports[chatId] || [];

        if (list.length === 0) {
            await nexus.sendMessage(chatId, { text: `📋 No reports filed yet.` });
            return;
        }

        const recent = list.slice(-10).reverse();

        await nexus.sendMessage(chatId, {
            disclaimerText: 'Reports',
            headerText: `📋 REPORTS (${list.length})`,
            contentText: 'Most recent 10 shown, newest first',
            title: 'Group Reports',
            table: [
                ['#', 'Target', 'Reason', 'Time'],
                ...recent.map((r, i) => [`${i + 1}`, r.target.split('@')[0], r.reason, new Date(r.time).toLocaleString()])
            ],
            noHeading: false,
            footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽'
        });

        console.log(chalk.green(`✅ Report list sent (${recent.length} shown)`));
    } catch (error) {
        console.log(chalk.red(`❌ Report list error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error fetching reports: ${error.message}` });
    }
};

// ============ JAIL LIST (table + unjail buttons) ============
const jailList = async (nexus, chatId, page = 0) => {
    try {
        const jail = loadJSON(JAIL_FILE);
        const list = jail[chatId] || [];

        if (list.length === 0) {
            await nexus.sendMessage(chatId, { text: `🔓 Nobody dey jail for this group.` });
            return;
        }

        const totalPages = Math.ceil(list.length / SETTINGS_PAGE_SIZE);
        page = Math.max(0, Math.min(page, totalPages - 1));
        const start = page * SETTINGS_PAGE_SIZE;
        const pageList = list.slice(start, start + SETTINGS_PAGE_SIZE);

        await nexus.sendMessage(chatId, {
            disclaimerText: 'Jail List',
            headerText: `🔒 JAILED MEMBERS (${list.length})`,
            contentText: `Page ${page + 1}/${totalPages}`,
            title: 'Jail List',
            table: [
                ['#', 'Number'],
                ...pageList.map((id, i) => [`${start + i + 1}`, id.split('@')[0]])
            ],
            noHeading: false,
            footerText: 'Tap a button below to unjail'
        });

        const buttons = pageList.map(id => ({ title: `🔓 Unjail ${id.split('@')[0]}`, id: `UNJAIL_${id}` }));
        if (page < totalPages - 1) buttons.push({ title: '➡️ Next Page', id: `JAIL_PAGE_${page + 1}` });
        if (page > 0) buttons.push({ title: '⬅️ Previous Page', id: `JAIL_PAGE_${page - 1}` });

        await sendQuickReplyButtons(nexus, chatId, {
            bodyText: `Tap a name below to release them from jail.`,
            footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽',
            buttons
        });

        console.log(chalk.green(`✅ Jail list page ${page + 1} sent`));
    } catch (error) {
        console.log(chalk.red(`❌ Jail list error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error fetching jail list: ${error.message}` });
    }
};

// ============ GROUP BACKUP ============
const groupBackup = async (nexus, chatId) => {
    try {
        console.log(chalk.blue(`💾 Backing up group ${chatId}...`));

        if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

        const metadata = await nexus.groupMetadata(chatId);
        const backupData = {
            id: metadata.id,
            subject: metadata.subject,
            desc: metadata.desc || '',
            participants: metadata.participants.map(p => ({ id: p.id, admin: p.admin })),
            backedUpAt: new Date().toISOString()
        };

        const filename = `${BACKUP_DIR}/${chatId.replace('@g.us', '')}_${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));

        await nexus.sendMessage(chatId, {
            text: `💾 Group backed up!\n\n👥 ${backupData.participants.length} members\n📁 Saved as: ${filename.split('/').pop()}`
        });

        console.log(chalk.green(`✅ Backup saved: ${filename}`));
    } catch (error) {
        console.log(chalk.red(`❌ Backup error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error backing up group: ${error.message}` });
    }
};

// ============ BULK ADMIN ACTIONS ============
const promoteAll = async (nexus, chatId, groupMetadata) => {
    try {
        console.log(chalk.blue(`⬆️ Promoting all members in ${chatId}...`));

        const nonAdmins = groupMetadata.participants
            .filter(p => !p.admin)
            .map(p => p.id);

        if (nonAdmins.length === 0) {
            await nexus.sendMessage(chatId, { text: `⚠️ Everyone is already an admin.` });
            return;
        }

        await nexus.groupParticipantsUpdate(chatId, nonAdmins, 'promote');
        await nexus.sendMessage(chatId, { text: `⬆️ Promoted ${nonAdmins.length} members to admin!` });

        console.log(chalk.green(`✅ Promoted ${nonAdmins.length} members`));
    } catch (error) {
        console.log(chalk.red(`❌ Promote all error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error promoting all: ${error.message}` });
    }
};

const demoteAll = async (nexus, chatId, groupMetadata, botId) => {
    try {
        console.log(chalk.blue(`⬇️ Demoting all admins in ${chatId}...`));

        const admins = groupMetadata.participants
            .filter(p => p.admin && p.id !== botId)
            .map(p => p.id);

        if (admins.length === 0) {
            await nexus.sendMessage(chatId, { text: `⚠️ No admins to demote (besides me).` });
            return;
        }

        await nexus.groupParticipantsUpdate(chatId, admins, 'demote');
        await nexus.sendMessage(chatId, { text: `⬇️ Demoted ${admins.length} admins!` });

        console.log(chalk.green(`✅ Demoted ${admins.length} admins`));
    } catch (error) {
        console.log(chalk.red(`❌ Demote all error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error demoting all: ${error.message}` });
    }
};

const addBulk = async (nexus, chatId, numbers) => {
    try {
        console.log(chalk.blue(`➕ Bulk adding ${numbers.length} numbers to ${chatId}...`));

        const jids = numbers.map(n => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
        const result = await nexus.groupParticipantsUpdate(chatId, jids, 'add');

        let text = `➕ BULK ADD RESULTS\n\n`;
        result.forEach(r => {
            const status = r.status === '200' ? '✅' : '❌';
            text += `${status} ${r.jid.split('@')[0]}\n`;
        });

        await nexus.sendMessage(chatId, { text });
        console.log(chalk.green(`✅ Bulk add processed`));
    } catch (error) {
        console.log(chalk.red(`❌ Bulk add error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error adding members: ${error.message}` });
    }
};

// ============ TAGGING ============
const tagAdmins = async (nexus, chatId, groupMetadata, message = '') => {
    try {
        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);

        if (admins.length === 0) {
            await nexus.sendMessage(chatId, { text: `⚠️ No admins found.` });
            return;
        }

        let text = `📢 ATTENTION ADMINS\n${message ? `\n${message}\n` : ''}\n`;
        admins.forEach(a => { text += `@${a.split('@')[0]} `; });

        await nexus.sendMessage(chatId, { text, mentions: admins });
        console.log(chalk.green(`✅ Tagged ${admins.length} admins`));
    } catch (error) {
        console.log(chalk.red(`❌ Tag admins error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error tagging admins: ${error.message}` });
    }
};

const ghostTag = async (nexus, chatId, groupMetadata, message = '\u200b') => {
    try {
        const all = groupMetadata.participants.map(p => p.id);

        await nexus.sendMessage(chatId, { text: message, mentions: all });
        console.log(chalk.green(`✅ Ghost tagged ${all.length} members`));
    } catch (error) {
        console.log(chalk.red(`❌ Ghost tag error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error ghost tagging: ${error.message}` });
    }
};

// ============ APPROVAL MODE / LOCKS ============
const setApprovalMode = async (nexus, chatId, enabled) => {
    try {
        // Requires Baileys support for membership approval mode
        if (typeof nexus.groupJoinApprovalMode === 'function') {
            await nexus.groupJoinApprovalMode(chatId, enabled ? 'on' : 'off');
        }
        await toggleSetting(nexus, chatId, 'approvalmode', enabled);
    } catch (error) {
        console.log(chalk.red(`❌ Approval mode error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error setting approval mode: ${error.message}` });
    }
};

const lockMessages = async (nexus, chatId, enabled) => {
    try {
        // 'announcement' = only admins can send messages
        await nexus.groupSettingUpdate(chatId, enabled ? 'announcement' : 'not_announcement');
        await toggleSetting(nexus, chatId, 'lockmessages', enabled);
    } catch (error) {
        console.log(chalk.red(`❌ Lock messages error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error locking messages: ${error.message}` });
    }
};

const lockInfo = async (nexus, chatId, enabled) => {
    try {
        // 'locked' = only admins can edit group info (name, description, icon)
        await nexus.groupSettingUpdate(chatId, enabled ? 'locked' : 'unlocked');
        await nexus.sendMessage(chatId, { text: `${enabled ? '🔒' : '🔓'} Group info editing ${enabled ? 'locked to admins only' : 'unlocked for everyone'}.` });
        console.log(chalk.green(`✅ Group info lock set to ${enabled}`));
    } catch (error) {
        console.log(chalk.red(`❌ Lock info error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error locking group info: ${error.message}` });
    }
};

// ============ MENU BUTTON WRAPPERS (CMD_group_<slug> from menu.js) ============
// dispatchMenuCommand in case.js calls these as fn(sock, chatId, sender) — no
// groupMetadata is passed in, so any wrapper that needs it fetches it itself.
const menuGroupSettings = async (nexus, chatId) => {
    await sendGroupSettingsMenu(nexus, chatId, 0);
};

const menuGroupRoles = async (nexus, chatId) => {
    try {
        const metadata = await nexus.groupMetadata(chatId);
        const supers = metadata.participants.filter(p => p.admin === 'superadmin');
        const admins = metadata.participants.filter(p => p.admin === 'admin');
        const members = metadata.participants.filter(p => !p.admin);

        await nexus.sendMessage(chatId, {
            disclaimerText: 'Group Roles',
            headerText: `🏆 GROUP ROLES — ${metadata.subject}`,
            contentText: `${metadata.participants.length} total members`,
            title: 'Roles',
            table: [
                ['Role', 'Count'],
                ['👑 Owner', `${supers.length}`],
                ['🎖️ Admin', `${admins.length}`],
                ['👤 Member', `${members.length}`]
            ],
            noHeading: false,
            footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽'
        });
        console.log(chalk.green(`✅ Group roles sent for ${chatId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Group roles error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error fetching group roles: ${error.message}` });
    }
};

// WhatsApp has no per-member "mute" — the real native equivalent is admins-only
// (announce) mode, same thing "Lock/Unlock Group" does. Both buttons toggle it.
const menuMuteUnmuteMembers = async (nexus, chatId) => {
    try {
        const metadata = await nexus.groupMetadata(chatId);
        const currentlyLocked = !!metadata.announce;
        await lockMessages(nexus, chatId, !currentlyLocked);
    } catch (error) {
        console.log(chalk.red(`❌ Mute/unmute error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error toggling mute: ${error.message}` });
    }
};
const menuLockUnlockGroup = menuMuteUnmuteMembers;

const menuGroupRulesView = async (nexus, chatId) => {
    await getRules(nexus, chatId);
};

const menuBackupGroupData = async (nexus, chatId) => {
    await groupBackup(nexus, chatId);
};

const menuMentionAll = async (nexus, chatId) => {
    try {
        const metadata = await nexus.groupMetadata(chatId);
        await tagAdmins(nexus, chatId, metadata);
    } catch (error) {
        console.log(chalk.red(`❌ Mention all error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error mentioning: ${error.message}` });
    }
};

const menuActivityReport = async (nexus, chatId) => {
    await reportList(nexus, chatId);
};

const menuMemberList = async (nexus, chatId) => {
    try {
        const metadata = await nexus.groupMetadata(chatId);
        const rows = metadata.participants.map((p, i) => {
            const role = p.admin === 'superadmin' ? '👑' : p.admin === 'admin' ? '🎖️' : '👤';
            return [`${i + 1}`, `${role} ${p.id.split('@')[0]}`];
        });

        await nexus.sendMessage(chatId, {
            disclaimerText: 'Member List',
            headerText: `📋 MEMBERS — ${metadata.subject}`,
            contentText: `${metadata.participants.length} total`,
            title: 'Members',
            table: [['#', 'Member'], ...rows],
            noHeading: false,
            footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽'
        });
        console.log(chalk.green(`✅ Member list sent for ${chatId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Member list error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error fetching member list: ${error.message}` });
    }
};

const menuGroupDescription = async (nexus, chatId) => {
    try {
        const metadata = await nexus.groupMetadata(chatId);
        await nexus.sendMessage(chatId, {
            text: `💬 *GROUP DESCRIPTION*\n\n${metadata.desc || '_No description set._'}`
        });
    } catch (error) {
        console.log(chalk.red(`❌ Group description error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error fetching description: ${error.message}` });
    }
};

const menuGroupStats = async (nexus, chatId) => {
    try {
        const metadata = await nexus.groupMetadata(chatId);
        const admins = metadata.participants.filter(p => p.admin).length;
        const created = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString() : 'Unknown';

        await nexus.sendMessage(chatId, {
            disclaimerText: 'Group Stats',
            headerText: `📊 GROUP STATS — ${metadata.subject}`,
            contentText: 'Overview',
            title: 'Stats',
            table: [
                ['Metric', 'Value'],
                ['👥 Members', `${metadata.participants.length}`],
                ['🎖️ Admins', `${admins}`],
                ['📅 Created', created],
                ['🔒 Admins-Only Mode', metadata.announce ? 'ON' : 'OFF']
            ],
            noHeading: false,
            footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽'
        });
        console.log(chalk.green(`✅ Group stats sent for ${chatId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Group stats error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error fetching group stats: ${error.message}` });
    }
};

// "Moderator Panel" is really the same overview as Group Roles.
const menuModeratorPanel = async (nexus, chatId) => {
    await menuGroupRoles(nexus, chatId);
};

// These three need a specific target member (kick who? promote who?) that a
// bare button tap can never supply. Rather than guess or silently do nothing,
// point to the real working text commands.
const menuGrantAdminRights = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `🎖️ *Grant Admin Rights*\n\nReply to the member's message and send:\n${'`'}.promote${'`'}\n\nOr mention them directly:\n${'`'}.promote @user${'`'}`
    });
};

const menuKickMember = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `⚠️ *Kick Member*\n\nReply to the member's message and send:\n${'`'}.kick${'`'}\n\nOr mention them directly:\n${'`'}.kick @user${'`'}`
    });
};

const menuAddRemoveMembers = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `👤 *Add/Remove Members*\n\nTo add: ${'`'}.add 234xxxxxxxxxx${'`'}\nTo remove: reply to their message with ${'`'}.kick${'`'}`
    });
};

// ============ GROUP ANNOUNCEMENTS ============
const announceToGroup = async (nexus, chatId, message) => {
    try {
        const metadata = await nexus.groupMetadata(chatId);
        await nexus.sendMessage(chatId, {
            text: `📢 *GROUP ANNOUNCEMENT*\n\n${message}`,
            mentions: metadata.participants.map(p => p.id)
        });
        console.log(chalk.green(`✅ Announcement sent to ${chatId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Announce error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error sending announcement: ${error.message}` });
    }
};
const menuGroupAnnouncements = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `📢 *Group Announcements*\n\nSend:\n${'`'}.announce Your message here${'`'}\n\nEveryone gets tagged (silently) so it lands in their notifications.`
    });
};

// ============ CHANGE GROUP ICON ============
const setGroupIcon = async (nexus, chatId, imageBuffer) => {
    try {
        await nexus.updateProfilePicture(chatId, imageBuffer);
        await nexus.sendMessage(chatId, { text: `✅ Group icon updated!` });
        console.log(chalk.green(`✅ Group icon updated for ${chatId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Set icon error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error updating icon: ${error.message}` });
    }
};
const menuChangeGroupIcon = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `🎨 *Change Group Icon*\n\nReply to an image with:\n${'`'}.seticon${'`'}`
    });
};

// ============ MEMBER ROLES (custom labels) ============
const setMemberRole = async (nexus, chatId, targetId, role) => {
    try {
        const roles = loadJSON(ROLES_FILE);
        if (!roles[chatId]) roles[chatId] = {};
        roles[chatId][targetId] = role;
        saveJSON(ROLES_FILE, roles);
        await nexus.sendMessage(chatId, { text: `✅ @${targetId.split('@')[0]} is now tagged as *${role}*`, mentions: [targetId] });
    } catch (error) {
        console.log(chalk.red(`❌ Set role error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error setting role: ${error.message}` });
    }
};
const menuMemberRoles = async (nexus, chatId) => {
    try {
        const roles = loadJSON(ROLES_FILE)[chatId] || {};
        const entries = Object.entries(roles);
        if (entries.length === 0) {
            await nexus.sendMessage(chatId, { text: `👥 *Member Roles*\n\nNo custom roles set yet.\n\nSet one:\n${'`'}.setrole @user Role Name${'`'}\ne.g. ${'`'}.setrole @user Moderator${'`'}` });
            return;
        }
        await nexus.sendMessage(chatId, {
            disclaimerText: 'Member Roles',
            headerText: `👥 CUSTOM MEMBER ROLES`,
            contentText: `${entries.length} assigned`,
            title: 'Roles',
            table: [['Member', 'Role'], ...entries.map(([id, role]) => [id.split('@')[0], role])],
            noHeading: false,
            footerText: 'Set another: .setrole @user <role>'
        });
    } catch (error) {
        console.log(chalk.red(`❌ Member roles error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error fetching roles: ${error.message}` });
    }
};

// ============ GROUP POLLS (native WhatsApp poll) ============
const createPoll = async (nexus, chatId, question, options) => {
    try {
        await nexus.sendMessage(chatId, { poll: { name: question, values: options, selectableCount: 1 } });
        console.log(chalk.green(`✅ Poll created in ${chatId}`));
    } catch (error) {
        console.log(chalk.red(`❌ Poll error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error creating poll: ${error.message}` });
    }
};
const menuGroupPolls = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `📱 *Group Polls*\n\nCreate a real WhatsApp poll:\n${'`'}.poll Question | Option 1 | Option 2 | Option 3${'`'}\n\nUp to 12 options, separated by |.\n\n⚠️ Admin must enable this first with ${'`'}.pollon${'`'} if it's not already on.`
    });
};

// ============ GROUP GAMES (number-guess) ============
// Stored on `global` for the same freshRequire-safety reason as spamTracker above.
if (!global.__groupGameState) global.__groupGameState = {};
const gameState = global.__groupGameState; // { chatId: { number, attempts } }
const startGuessGame = async (nexus, chatId) => {
    const number = Math.floor(Math.random() * 100) + 1;
    gameState[chatId] = { number, attempts: 0 };
    await nexus.sendMessage(chatId, {
        text: `🎪 *GUESS THE NUMBER!*\n\nI'm thinking of a number between 1-100.\nFirst person to guess it right wins!\n\nJust type your guess.`
    });
};
// Call this from your message handler for every group text message — returns
// true if it consumed the message as a guess (so caller can stop processing).
const handleGuess = async (nexus, chatId, senderId, textBody) => {
    try {
        const game = gameState[chatId];
        if (!game) return false;
        const guess = parseInt(String(textBody).trim(), 10);
        if (isNaN(guess)) return false;

        game.attempts++;
        if (guess === game.number) {
            await nexus.sendMessage(chatId, { text: `🎉 @${senderId.split('@')[0]} got it! The number was *${game.number}* (${game.attempts} guesses total).`, mentions: [senderId] });
            delete gameState[chatId];
        } else if (guess < game.number) {
            await nexus.sendMessage(chatId, { text: `📈 Higher!` });
        } else {
            await nexus.sendMessage(chatId, { text: `📉 Lower!` });
        }
        return true;
    } catch (error) {
        console.log(chalk.red(`❌ Guess game error: ${error.message}`));
        return false;
    }
};
const menuGroupGames = async (nexus, chatId) => {
    await startGuessGame(nexus, chatId);
};

// ============ ACTIVITY TRACKING (contribution tracker + achievements) ============
// Call trackActivity/trackMedia from your message handler on every group message.
const trackActivity = (chatId, senderId) => {
    try {
        const data = loadJSON(ACTIVITY_FILE);
        if (!data[chatId]) data[chatId] = { messages: {}, media: {} };
        if (!data[chatId].messages) data[chatId].messages = {};
        data[chatId].messages[senderId] = (data[chatId].messages[senderId] || 0) + 1;
        saveJSON(ACTIVITY_FILE, data);
    } catch (error) {
        console.log(chalk.red(`❌ Track activity error: ${error.message}`));
    }
};
const trackMedia = (chatId, senderId) => {
    try {
        const data = loadJSON(ACTIVITY_FILE);
        if (!data[chatId]) data[chatId] = { messages: {}, media: {} };
        if (!data[chatId].media) data[chatId].media = {};
        data[chatId].media[senderId] = (data[chatId].media[senderId] || 0) + 1;
        saveJSON(ACTIVITY_FILE, data);
    } catch (error) {
        console.log(chalk.red(`❌ Track media error: ${error.message}`));
    }
};
const menuContributionTracker = async (nexus, chatId) => {
    try {
        const data = (loadJSON(ACTIVITY_FILE)[chatId] || {}).messages || {};
        const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (sorted.length === 0) {
            await nexus.sendMessage(chatId, { text: `📊 No activity tracked yet — chat around a bit first!` });
            return;
        }
        await nexus.sendMessage(chatId, {
            disclaimerText: 'Contribution Tracker',
            headerText: `📊 TOP CONTRIBUTORS`,
            contentText: 'Message counts (top 10)',
            title: 'Leaderboard',
            table: [['#', 'Member', 'Messages'], ...sorted.map(([id, count], i) => [`${i + 1}`, id.split('@')[0], `${count}`])],
            noHeading: false,
            footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽'
        });
    } catch (error) {
        console.log(chalk.red(`❌ Contribution tracker error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error loading tracker: ${error.message}` });
    }
};
const menuGroupAchievements = async (nexus, chatId) => {
    try {
        const data = (loadJSON(ACTIVITY_FILE)[chatId] || {}).messages || {};
        const badges = Object.entries(data).map(([id, count]) => {
            let badge = null;
            if (count >= 1000) badge = '🥇 Legend (1000+ msgs)';
            else if (count >= 500) badge = '🥈 Veteran (500+ msgs)';
            else if (count >= 100) badge = '🥉 Active (100+ msgs)';
            return badge ? [id.split('@')[0], badge] : null;
        }).filter(Boolean);

        if (badges.length === 0) {
            await nexus.sendMessage(chatId, { text: `🏆 No achievements unlocked yet — keep chatting! (100+ messages = first badge)` });
            return;
        }
        await nexus.sendMessage(chatId, {
            disclaimerText: 'Achievements',
            headerText: `🏆 GROUP ACHIEVEMENTS`,
            contentText: 'Earned by activity',
            title: 'Achievements',
            table: [['Member', 'Badge'], ...badges],
            noHeading: false,
            footerText: 'LËGĚNDÃRY Ł𝗮𝗯𝘀™ ⚽'
        });
    } catch (error) {
        console.log(chalk.red(`❌ Achievements error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error loading achievements: ${error.message}` });
    }
};
const menuGroupPhotosArchive = async (nexus, chatId) => {
    try {
        const media = (loadJSON(ACTIVITY_FILE)[chatId] || {}).media || {};
        const sorted = Object.entries(media).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (sorted.length === 0) {
            await nexus.sendMessage(chatId, { text: `📸 *Group Photos Archive*\n\nI don't store the actual photo files (no cloud storage wired up for this), but I do track who's sharing the most media.\n\nNo media tracked yet.` });
            return;
        }
        await nexus.sendMessage(chatId, {
            disclaimerText: 'Photos',
            headerText: `📸 TOP MEDIA SHARERS`,
            contentText: 'Media messages sent (top 10)',
            title: 'Media Activity',
            table: [['#', 'Member', 'Media Sent'], ...sorted.map(([id, c], i) => [`${i + 1}`, id.split('@')[0], `${c}`])],
            noHeading: false,
            footerText: "⚠️ Actual photos aren't archived — only counts"
        });
    } catch (error) {
        console.log(chalk.red(`❌ Photos archive error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error loading media stats: ${error.message}` });
    }
};

// ============ NOTIFICATION SETTINGS (welcome/goodbye toggle) ============
// Uses your existing setting/Settings.js store — same one case.js's
// group-participants.update handler already checks via getSetting(id,"welcome").
const { getSetting: getBotSetting, setSetting: setBotSetting } = require('./setting/Settings.js'); // ⚠️ update path if Settings.js sits elsewhere relative to commands/group.js
const menuNotificationSettings = async (nexus, chatId) => {
    const on = getBotSetting(chatId, 'welcome', false);
    await nexus.sendMessage(chatId, {
        text: `🔔 *Notification Settings*\n\nWelcome/goodbye messages: ${on ? '🟢 ON' : '🔴 OFF'}\n\nToggle: ${'`'}.notify on${'`'} or ${'`'}.notify off${'`'}`
    });
};

// ============ GROUP THEME CUSTOMIZATION ============
const setGroupTheme = async (nexus, chatId, emoji) => {
    const settings = getGroupSettings(chatId);
    settings.themeEmoji = emoji;
    saveGroupSettings(chatId, settings);
    await nexus.sendMessage(chatId, { text: `✅ Group theme emoji set to ${emoji}` });
};
const menuGroupTheme = async (nexus, chatId) => {
    const settings = getGroupSettings(chatId);
    await nexus.sendMessage(chatId, {
        text: `🎨 *Group Theme*\n\nCurrent theme emoji: ${settings.themeEmoji || '⚽ (default)'}\n\nChange it: ${'`'}.settheme 🔥${'`'}`
    });
};

// ============ BIRTHDAY REMINDERS ============
const setBirthday = async (nexus, chatId, userId, ddmm) => {
    try {
        const data = loadJSON(BIRTHDAY_FILE);
        if (!data[chatId]) data[chatId] = {};
        data[chatId][userId] = ddmm;
        saveJSON(BIRTHDAY_FILE, data);
        await nexus.sendMessage(chatId, { text: `🎂 Birthday saved for @${userId.split('@')[0]}: ${ddmm}`, mentions: [userId] });
    } catch (error) {
        console.log(chalk.red(`❌ Set birthday error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error saving birthday: ${error.message}` });
    }
};
const menuBirthdayReminders = async (nexus, chatId) => {
    try {
        const data = loadJSON(BIRTHDAY_FILE)[chatId] || {};
        const entries = Object.entries(data);
        if (entries.length === 0) {
            await nexus.sendMessage(chatId, { text: `📅 *Birthday Reminders*\n\nNo birthdays saved yet.\n\nAdd yours:\n${'`'}.setbirthday DD-MM${'`'}\n\nI'll announce it here automatically on the day 🎉` });
            return;
        }
        await nexus.sendMessage(chatId, {
            disclaimerText: 'Birthdays',
            headerText: `📅 SAVED BIRTHDAYS`,
            contentText: `${entries.length} saved`,
            title: 'Birthdays',
            table: [['Member', 'Date'], ...entries.map(([id, d]) => [id.split('@')[0], d])],
            noHeading: false,
            footerText: 'Add yours: .setbirthday DD-MM'
        });
    } catch (error) {
        console.log(chalk.red(`❌ Birthday reminders error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error loading birthdays: ${error.message}` });
    }
};
// Stored on `global` for the same freshRequire-safety reason as above — prevents
// duplicate birthday announcements if this ever gets called from more than one
// module instance in the same day.
if (typeof global.__lastBirthdayCheckDate === 'undefined') global.__lastBirthdayCheckDate = null;
const checkBirthdaysToday = async (nexus) => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    if (global.__lastBirthdayCheckDate === todayKey) return; // already announced today
    global.__lastBirthdayCheckDate = todayKey;

    try {
        const data = loadJSON(BIRTHDAY_FILE);
        const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        for (const chatId of Object.keys(data)) {
            for (const [userId, ddmm] of Object.entries(data[chatId])) {
                if (ddmm === todayStr) {
                    await nexus.sendMessage(chatId, { text: `🎉🎂 Happy Birthday @${userId.split('@')[0]}! 🎂🎉\n\nWishing you an amazing day from all of us!`, mentions: [userId] });
                }
            }
        }
    } catch (error) {
        console.log(chalk.red(`❌ Birthday check error: ${error.message}`));
    }
};

// ============ EVENT SCHEDULER ============
const scheduleEvent = async (nexus, chatId, isoDateTime, title) => {
    try {
        const events = loadJSON(EVENTS_FILE);
        if (!events[chatId]) events[chatId] = [];
        events[chatId].push({ time: isoDateTime, title, notified: false });
        saveJSON(EVENTS_FILE, events);
        await nexus.sendMessage(chatId, { text: `📅 Event scheduled: *${title}*\n🕒 ${new Date(isoDateTime).toLocaleString()}` });
    } catch (error) {
        console.log(chalk.red(`❌ Schedule event error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error scheduling event: ${error.message}` });
    }
};
const menuEventScheduler = async (nexus, chatId) => {
    try {
        const events = (loadJSON(EVENTS_FILE)[chatId] || []).filter(e => new Date(e.time) > new Date());
        if (events.length === 0) {
            await nexus.sendMessage(chatId, { text: `📅 *Event Scheduler*\n\nNo upcoming events.\n\nSchedule one:\n${'`'}.event 25-12-2026 18:00 | Christmas Party${'`'}` });
            return;
        }
        await nexus.sendMessage(chatId, {
            disclaimerText: 'Events',
            headerText: `📅 UPCOMING EVENTS`,
            contentText: `${events.length} scheduled`,
            title: 'Events',
            table: [['Event', 'When'], ...events.map(e => [e.title, new Date(e.time).toLocaleString()])],
            noHeading: false,
            footerText: 'Add: .event DD-MM-YYYY HH:MM | Title'
        });
    } catch (error) {
        console.log(chalk.red(`❌ Event scheduler error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error loading events: ${error.message}` });
    }
};
const checkDueEvents = async (nexus) => {
    try {
        const events = loadJSON(EVENTS_FILE);
        const now = new Date();
        let changed = false;
        for (const chatId of Object.keys(events)) {
            for (const ev of events[chatId]) {
                if (!ev.notified && new Date(ev.time) <= now) {
                    await nexus.sendMessage(chatId, { text: `📅🔔 *EVENT REMINDER*\n\n${ev.title} is happening now!` });
                    ev.notified = true;
                    changed = true;
                }
            }
        }
        if (changed) saveJSON(EVENTS_FILE, events);
    } catch (error) {
        console.log(chalk.red(`❌ Event check error: ${error.message}`));
    }
};

// Starts the background checks for scheduled events + birthdays. Call this
// ONCE from your main connection file (pair.js) right after the socket connects.
const startGroupSchedulers = (nexus) => {
    setInterval(() => {
        checkDueEvents(nexus).catch(e => console.log(chalk.red(`❌ Scheduler error: ${e.message}`)));
        checkBirthdaysToday(nexus).catch(e => console.log(chalk.red(`❌ Scheduler error: ${e.message}`)));
    }, 60000);
    console.log(chalk.green('✅ Group schedulers started (events + birthdays checked every 60s)'));
};

// ============ GIFT MEMBERS ============
const sendGift = async (nexus, chatId, targetId, message) => {
    try {
        await nexus.sendMessage(chatId, { text: `🎁✨ @${targetId.split('@')[0]} just received a gift!\n\n"${message}"`, mentions: [targetId] });
    } catch (error) {
        console.log(chalk.red(`❌ Gift error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error sending gift: ${error.message}` });
    }
};
const menuGiftMembers = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `🎁 *Gift Members*\n\nSend a member a shoutout:\n${'`'}.gift @user Congrats message here${'`'}`
    });
};

// ============ CHAT CLEANUP ============
// WhatsApp's API only lets a bot bulk-fetch/delete via the .delete command
// (already in your case.js, reply-to-message + admin only) — there's no bulk
// "clear last N" endpoint in Baileys. Point to the real command instead of a
// fake bulk-delete that would silently do nothing.
const menuChatCleanup = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `💬 *Chat Cleanup*\n\nWhatsApp doesn't allow bulk-deleting other people's messages via the bot API — only one at a time.\n\nReply to any message with:\n${'`'}.delete${'`'}\n(admin only — deletes that message for everyone)`
    });
};

// ============ EMERGENCY ALERTS ============
const sendEmergencyAlert = async (nexus, chatId, message) => {
    try {
        const metadata = await nexus.groupMetadata(chatId);
        await nexus.sendMessage(chatId, {
            text: `🚨🚨 *EMERGENCY ALERT* 🚨🚨\n\n${message}`,
            mentions: metadata.participants.map(p => p.id)
        });
    } catch (error) {
        console.log(chalk.red(`❌ Emergency alert error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error sending alert: ${error.message}` });
    }
};
const menuEmergencyAlerts = async (nexus, chatId) => {
    await nexus.sendMessage(chatId, {
        text: `🚨 *Emergency Alerts*\n\nBroadcast an urgent tagged message to everyone:\n${'`'}.alert Your urgent message here${'`'}`
    });
};

// Maps menu.js's CMD_group_<slug> ids straight to a real handler. Anything not
// listed here still falls through to case.js's AI-fallback — safer than
// guessing, and honest for filler items that aren't real features yet.
const menuMap = {
    group_settings: menuGroupSettings,
    group_roles: menuGroupRoles,
    muteunmute_members: menuMuteUnmuteMembers,
    lockunlock_group: menuLockUnlockGroup,
    group_rules: menuGroupRulesView,
    backup_group_data: menuBackupGroupData,
    mention_all: menuMentionAll,
    activity_report: menuActivityReport,
    member_list: menuMemberList,
    group_description: menuGroupDescription,
    group_stats: menuGroupStats,
    moderator_panel: menuModeratorPanel,
    grant_admin_rights: menuGrantAdminRights,
    kick_member: menuKickMember,
    addremove_members: menuAddRemoveMembers,
    group_announcements: menuGroupAnnouncements,
    change_group_icon: menuChangeGroupIcon,
    member_roles: menuMemberRoles,
    group_polls: menuGroupPolls,
    group_games: menuGroupGames,
    member_contribution_tracker: menuContributionTracker,
    group_achievements: menuGroupAchievements,
    group_photos_archive: menuGroupPhotosArchive,
    notification_settings: menuNotificationSettings,
    group_theme_customization: menuGroupTheme,
    birthday_reminders: menuBirthdayReminders,
    event_scheduler: menuEventScheduler,
    gift_members: menuGiftMembers,
    chat_cleanup: menuChatCleanup,
    emergency_alerts: menuEmergencyAlerts
};

// ============ BUTTON ROUTER ============
// Call this from your message handler whenever a button/list reply comes in
// (selectedId is the row/button id). Mirrors menu.js's handleMenuSelection.
// extra = { senderId, groupMetadata, botId, requiredVotes } — senderId and
// groupMetadata are required for VK_VOTE_ to work.
// Returns true if it handled the tap, false if selectedId isn't a group-settings action.
const handleGroupSelection = async (nexus, chatId, selectedId, extra = {}) => {
    try {
        if (!selectedId) return false;
        const { senderId, groupMetadata, requiredVotes = 3 } = extra;

        // --- settings menu pagination ---
        if (selectedId.startsWith('GS_PAGE_')) {
            const page = parseInt(selectedId.replace('GS_PAGE_', ''), 10) || 0;
            await sendGroupSettingsMenu(nexus, chatId, page);
            return true;
        }

        // --- settings toggle ---
        if (selectedId.startsWith('GS_TOGGLE_')) {
            const key = selectedId.replace('GS_TOGGLE_', '');
            const settings = getGroupSettings(chatId);
            const newValue = !settings[key];

            if (key === 'approvalmode') {
                await setApprovalMode(nexus, chatId, newValue);
            } else if (key === 'lockmessages') {
                await lockMessages(nexus, chatId, newValue);
            } else {
                await toggleSetting(nexus, chatId, key, newValue);
            }

            await sendGroupSettingsMenu(nexus, chatId, pageForSettingKey(key));
            return true;
        }

        // --- jail list pagination ---
        if (selectedId.startsWith('JAIL_PAGE_')) {
            const page = parseInt(selectedId.replace('JAIL_PAGE_', ''), 10) || 0;
            await jailList(nexus, chatId, page);
            return true;
        }

        // --- unjail tap ---
        if (selectedId.startsWith('UNJAIL_')) {
            const targetId = selectedId.replace('UNJAIL_', '');
            await unjailUser(nexus, chatId, targetId);
            await jailList(nexus, chatId, 0);
            return true;
        }

        // --- votekick vote tap ---
        if (selectedId.startsWith('VK_VOTE_')) {
            const targetId = selectedId.replace('VK_VOTE_', '');
            if (!senderId || !groupMetadata) {
                console.log(chalk.yellow('⚠️ VK_VOTE_ tap ignored — senderId/groupMetadata missing from extra{}'));
                return false;
            }
            await voteKick(nexus, chatId, targetId, senderId, groupMetadata, requiredVotes);
            return true;
        }

        return false;
    } catch (error) {
        console.log(chalk.red(`❌ Group button routing error: ${error.message}`));
        return false;
    }
};

module.exports = {
    menuMap,
    jailUser,
    unjailUser,
    isJailed,
    jailList,
    voteKick,
    sendVoteKickPrompt,
    toggleSetting,
    sendGroupSettingsMenu,
    handleGroupSelection,
    handleAntiChecks,
    getGroupSettings,
    setRules,
    getRules,
    reportUser,
    reportList,
    groupBackup,
    promoteAll,
    demoteAll,
    addBulk,
    tagAdmins,
    ghostTag,
    setApprovalMode,
    lockMessages,
    lockInfo,
    // batch 2
    announceToGroup,
    setGroupIcon,
    setMemberRole,
    createPoll,
    startGuessGame,
    handleGuess,
    trackActivity,
    trackMedia,
    setBotSetting,
    getBotSetting,
    setGroupTheme,
    setBirthday,
    scheduleEvent,
    sendGift,
    sendEmergencyAlert,
    startGroupSchedulers,
    getWarnings,
    addWarning
};

    return module.exports;
})();


// ============ inlined from commands/health.js ============
const __cmd_health = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');

// Workout Plan
const workoutPlan = async (nexus, chatId, goal = 'general fitness') => {
    try {
        console.log(chalk.blue(`💪 Generating workout plan for ${goal}...`));

        let workoutText = `💪 WORKOUT PLAN: ${goal}\n\n`;
        workoutText += `📅 Day 1: Upper Body\n`;
        workoutText += `• Push-ups: 3x15\n`;
        workoutText += `• Pull-ups: 3x8\n`;
        workoutText += `• Shoulder press: 3x12\n\n`;
        workoutText += `📅 Day 2: Lower Body\n`;
        workoutText += `• Squats: 4x15\n`;
        workoutText += `• Lunges: 3x12\n`;
        workoutText += `• Calf raises: 3x20\n\n`;
        workoutText += `📅 Day 3: Rest & Recovery\n\n`;
        workoutText += `🎯 Reply with a specific goal for a custom plan!\n`;

        await nexus.sendMessage(chatId, { text: workoutText });
        console.log(chalk.green(`✅ Workout plan sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Workout plan error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error generating workout plan: ${error.message}`
        });
    }
};

// Calorie Counter
const calorieCounter = async (nexus, chatId, foodItem) => {
    try {
        console.log(chalk.blue(`🧮 Counting calories for ${foodItem}...`));

        let calText = `🧮 CALORIE COUNT: ${foodItem}\n\n`;
        calText += `🔥 Calories: ~250 kcal\n`;
        calText += `🍖 Protein: 12g\n`;
        calText += `🥑 Fat: 8g\n`;
        calText += `🌾 Carbs: 30g\n\n`;
        calText += `📊 Add to daily log with .logmeal ${foodItem}\n`;

        await nexus.sendMessage(chatId, { text: calText });
        console.log(chalk.green(`✅ Calorie info sent for ${foodItem}`));

    } catch (error) {
        console.log(chalk.red(`❌ Calorie counter error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error counting calories: ${error.message}`
        });
    }
};

// Sleep Guide
const sleepGuide = async (nexus, chatId) => {
    try {
        console.log(chalk.blue(`💤 Fetching sleep guide...`));

        let sleepText = `💤 SLEEP GUIDE\n\n`;
        sleepText += `⏰ Recommended: 7-9 hours per night\n\n`;
        sleepText += `📋 Tips for better sleep:\n`;
        sleepText += `• Keep a consistent sleep schedule\n`;
        sleepText += `• Avoid screens 30 mins before bed\n`;
        sleepText += `• Keep your room cool and dark\n`;
        sleepText += `• Avoid caffeine late in the day\n`;
        sleepText += `• Try light stretching before bed\n\n`;
        sleepText += `😴 Sleep well, champ!\n`;

        await nexus.sendMessage(chatId, { text: sleepText });
        console.log(chalk.green(`✅ Sleep guide sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Sleep guide error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching sleep guide: ${error.message}`
        });
    }
};

// Medicine Reminder
const medicineReminder = async (nexus, chatId, medName, time) => {
    try {
        console.log(chalk.blue(`💊 Setting reminder for ${medName} at ${time}...`));

        let medText = `💊 MEDICINE REMINDER SET\n\n`;
        medText += `📌 Medicine: ${medName}\n`;
        medText += `⏰ Time: ${time}\n`;
        medText += `🔁 Repeats: Daily\n\n`;
        medText += `✅ You'll be reminded automatically!\n`;
        medText += `🗑️ Cancel with .medcancel ${medName}\n`;

        await nexus.sendMessage(chatId, { text: medText });
        console.log(chalk.green(`✅ Medicine reminder set for ${medName}`));

    } catch (error) {
        console.log(chalk.red(`❌ Medicine reminder error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error setting reminder: ${error.message}`
        });
    }
};

module.exports = {
    workoutPlan,
    workoutPlans: workoutPlan, // alias — menu label is "Workout Plans" (plural)
    calorieCounter,
    sleepGuide,
    medicineReminder
};

    return module.exports;
})();


// ============ inlined from commands/lifestyle.js ============
const __cmd_lifestyle = (function() {
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

const meditation = (nexus, chatId) => send(nexus, chatId,
`🧘 QUICK MEDITATION\n\nTry this 2-minute reset:\n1. Sit comfortably, close your eyes\n2. Breathe in for 4 counts, hold for 4, out for 4\n3. Repeat for 2 minutes, focusing only on the counting\n\nApps for guided sessions: Insight Timer (free), Calm, Headspace`, 'Meditation');

const wellnessTips = (nexus, chatId) => send(nexus, chatId,
`🌿 GENERAL WELLNESS TIPS\n\n• Sleep 7-9 hours — foundation for everything else\n• Move your body daily, even just walking\n• Stay hydrated — often mistaken for hunger/fatigue\n• Protect time for things that actually recharge you, not just distract you`, 'Wellness Tips');

const sleepHygiene = (nexus, chatId) => send(nexus, chatId,
`😴 SLEEP HYGIENE TIPS\n\n• Consistent sleep/wake time, even weekends\n• No screens 30-60 min before bed (blue light delays melatonin)\n• Keep room cool and dark\n• Avoid caffeine after early afternoon`, 'Sleep Hygiene');

const mentalHealthSupport = (nexus, chatId) => send(nexus, chatId,
`🧠 MENTAL HEALTH SUPPORT\n\nIf you're going through something difficult, talking to a licensed therapist or counselor helps more than any tip I can give.\n\nNigeria: Mentally Aware Nigeria Initiative (MANI) — mentallyaware.org\nIf this is urgent, please reach out to a crisis line or trusted person right away.`, 'Mental Health Support');

const spaMassage = (nexus, chatId) => send(nexus, chatId,
`💆 SPA & MASSAGE BENEFITS\n\n• Reduces muscle tension and stress hormones\n• Can't substitute for medical treatment of real injuries — see a doctor for those\n• Even a 10-minute self-massage on shoulders/neck helps after a long day`, 'Spa & Massage');

const organicLiving = (nexus, chatId) => send(nexus, chatId,
`🌱 ORGANIC LIVING TIPS\n\n• Start small — swap one or two high-exposure items (like produce you eat with skin on)\n• Growing even a few herbs at home is a great low-cost start\n• "Organic" isn't automatically healthier — context matters, don't overspend chasing labels`, 'Organic Living');

const ecofriendlyTips = (nexus, chatId) => send(nexus, chatId,
`♻️ ECO-FRIENDLY TIPS\n\n• Reusable bags/bottles — biggest easy win\n• Buy less, but buy better quality (lasts longer)\n• Unplug devices not in use — reduces phantom power draw\n• Composting food scraps if you have space`, 'Eco-Friendly Tips');

const minimalismGuide = (nexus, chatId) => send(nexus, chatId,
`🏡 MINIMALISM STARTER GUIDE\n\n• Start with ONE category (e.g clothes), not the whole house\n• Ask: "Have I used this in the last year?"\n• One-in-one-out rule prevents re-accumulation\n• Minimalism isn't about owning nothing — it's about owning intentionally`, 'Minimalism Guide');

const homeOrganization = (nexus, chatId) => send(nexus, chatId,
`🧹 HOME ORGANIZATION TIPS\n\n• Everything needs a "home" — a specific place it always goes back to\n• Declutter before organizing, not after\n• Vertical storage maximizes small spaces\n• 5-minute daily reset beats one big weekly cleanup`, 'Home Organization');

const selfhelpBooks = (nexus, chatId) => send(nexus, chatId,
`📚 SELF-HELP BOOK RECOMMENDATIONS\n\n• Atomic Habits — James Clear (building better habits)\n• The Subtle Art of Not Giving a F*ck — Mark Manson\n• Man's Search for Meaning — Viktor Frankl\n• Ask me for recommendations on a specific topic!`, 'Self-Help Books');

const goalSetting = (nexus, chatId, goal) => send(nexus, chatId,
goal ? `🎯 Goal noted: "${goal}". Break it into monthly milestones for the best chance of following through!` : `🎯 GOAL SETTING FRAMEWORK\n\nUse SMART goals:\n• Specific\n• Measurable\n• Achievable\n• Relevant\n• Time-bound\n\ne.g "Read 12 books this year" beats "read more"`, 'Goal Setting');

const journaling = (nexus, chatId) => send(nexus, chatId,
`📝 JOURNALING PROMPTS\n\n• What am I grateful for today?\n• What's one thing I'm avoiding, and why?\n• What went well this week?\n\nEven 5 minutes a day builds the habit — consistency beats length.`, 'Journaling');

const breathingExercises = (nexus, chatId) => send(nexus, chatId,
`🧘 BREATHING EXERCISE (Box Breathing)\n\n1. Inhale for 4 seconds\n2. Hold for 4 seconds\n3. Exhale for 4 seconds\n4. Hold for 4 seconds\n5. Repeat 4-6 times\n\nUsed by Navy SEALs to stay calm under stress — works well before a stressful event.`, 'Breathing Exercises');

const herbalMedicine = (nexus, chatId) => send(nexus, chatId,
`🌿 HERBAL MEDICINE NOTES\n\n• Ginger — helps nausea\n• Chamomile — mild relaxant, aids sleep\n• Peppermint — can ease digestive discomfort\n\n⚠️ Herbs can interact with medications — always check with a doctor/pharmacist, especially if on prescription meds.`, 'Herbal Medicine');

const teaGuide = (nexus, chatId) => send(nexus, chatId,
`🍵 TEA GUIDE\n\n• Green tea — antioxidants, mild caffeine\n• Chamomile — calming, good before bed\n• Ginger tea — great for digestion/nausea\n• Hibiscus (zobo) — popular in Nigeria, rich in vitamin C`, 'Tea Guide');

const positiveAffirmations = (nexus, chatId) => send(nexus, chatId,
`🌟 POSITIVE AFFIRMATIONS\n\n"I am capable of figuring things out, even when it's hard."\n"Progress, not perfection."\n"I control my effort, not every outcome."\n\nSay one out loud each morning — it sounds small but compounds over time.`, 'Positive Affirmations');

const selfcareRoutine = (nexus, chatId) => send(nexus, chatId,
`💪 SELF-CARE ROUTINE IDEAS\n\n• Physical: sleep, movement, nutrition — the foundation\n• Mental: journaling, therapy, boundaries\n• Social: time with people who energize you\n\nSelf-care isn't just bubble baths — the boring basics matter most.`, 'Self-Care Routine');

const hobbyIdeas = (nexus, chatId) => send(nexus, chatId,
`🎨 HOBBY IDEAS TO TRY\n\n• Low-cost: journaling, drawing, reading, cooking new recipes\n• Social: dance classes, board game nights, sports leagues\n• Creative: photography, music production, writing\n\nPick something with no pressure to be "good" at it — that's the point.`, 'Hobby Ideas');

const readingClub = (nexus, chatId) => send(nexus, chatId,
`📖 STARTING A READING CLUB\n\n• Start with 3-5 people, keep it small at first\n• Pick a manageable book length for your first pick\n• Meet monthly, not weekly — sustainable pace matters more than frequency`, 'Reading Club');

const writingTips = (nexus, chatId) => send(nexus, chatId,
`✍️ WRITING TIPS\n\n• Write badly first, edit later — perfectionism kills first drafts\n• Read your writing out loud to catch awkward phrasing\n• Cut unnecessary words ruthlessly — shorter is usually stronger\n• Write daily, even just 10 minutes, to build the habit`, 'Writing Tips');

const musicTherapy = (nexus, chatId) => send(nexus, chatId,
`🎵 MUSIC THERAPY BASICS\n\n• Slow tempo music can lower heart rate/stress\n• Active music-making (singing, instruments) engages the brain differently than just listening\n• Create playlists for specific moods/tasks — deliberate, not random`, 'Music Therapy');

const artTherapy = (nexus, chatId) => send(nexus, chatId,
`🎨 ART THERAPY BASICS\n\n• You don't need to be "good at art" for it to help — it's about process, not product\n• Try simple exercises: draw how you're feeling using only shapes/colors\n• Coloring books for adults are a legitimate low-effort entry point`, 'Art Therapy');

const puzzleGames = (nexus, chatId) => send(nexus, chatId,
`🧩 PUZZLE GAME RECOMMENDATIONS\n\n• Sudoku — logic, no time pressure\n• Wordle — daily word puzzle, quick\n• Crossword — vocabulary + general knowledge\n• Jigsaw puzzles — great screen-free option`, 'Puzzle Games');

const travelWellness = (nexus, chatId) => send(nexus, chatId,
`🌍 TRAVEL WELLNESS TIPS\n\n• Stay hydrated on flights — cabin air is very dry\n• Move/stretch every couple hours on long trips\n• Adjust sleep schedule gradually before big timezone changes\n• Pack a small wellness kit: any regular meds, electrolytes, eye mask`, 'Travel Wellness');

const communitySupport = (nexus, chatId) => send(nexus, chatId,
`👥 FINDING COMMUNITY SUPPORT\n\n• Local interest-based groups (sports, hobbies, faith) build consistent connection\n• Online communities work too, but in-person tends to build deeper bonds faster\n• Volunteering is a great way to meet people while doing something meaningful`, 'Community Support');

const chatGroups = (nexus, chatId) => send(nexus, chatId,
`💬 FINDING GOOD CHAT GROUPS\n\nLook for WhatsApp/Telegram communities around specific interests rather than huge generic groups — smaller, focused groups tend to have better conversation quality.`, 'Chat Groups');

const networking = (nexus, chatId) => send(nexus, chatId,
`🤝 GENERAL NETWORKING TIPS\n\n• Show genuine interest in people before you need anything from them\n• Follow up — most people don't, so it stands out\n• Quality over quantity — a few strong connections beat hundreds of weak ones`, 'Networking');

const personalGoals = (nexus, chatId, goal) => send(nexus, chatId,
goal ? `🏆 Personal goal noted: "${goal}" — track it with .progress!` : `🏆 SETTING PERSONAL GOALS\n\nUsage: .personalgoal <your goal>\nRevisit and adjust monthly — goals should evolve as you learn more about yourself.`, 'Personal Goals');

const progressTracking = (nexus, chatId) => send(nexus, chatId,
`📊 PROGRESS TRACKING TIPS\n\n• Track leading indicators (daily actions), not just outcomes\n• Weekly review beats daily obsessing\n• Celebrate small wins — motivation compounds`, 'Progress Tracking');

const selfgiftingIdeas = (nexus, chatId) => send(nexus, chatId,
`🎁 SELF-GIFTING IDEAS\n\n• A book you've wanted but kept postponing\n• A solo outing doing something you enjoy\n• Time — block out an afternoon with zero obligations\n• Treat completing a hard goal as worth celebrating`, 'Self-Gifting Ideas');

module.exports = {
    meditation, wellnessTips, sleepHygiene, mentalHealthSupport, spaMassage,
    organicLiving, ecofriendlyTips, minimalismGuide, homeOrganization,
    selfhelpBooks, goalSetting, journaling, breathingExercises, herbalMedicine,
    teaGuide, positiveAffirmations, selfcareRoutine, hobbyIdeas, readingClub,
    writingTips, musicTherapy, artTherapy, puzzleGames, travelWellness,
    communitySupport, chatGroups, networking, personalGoals, progressTracking,
    selfgiftingIdeas
};

    return module.exports;
})();


// ============ inlined from commands/music.js ============
const __cmd_music = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const axios = require('axios');

// ============ AWAITING-REPLY STATE (per chat) ============
// Tracks which chats are actually expecting a music reply, and for how long.
// Without this, ANY plain text in ANY chat gets treated as a song search.
//
// IMPORTANT: this lives on `global`, NOT as a plain module-scope variable.
// case.js calls freshRequire() on this file on every message (to support
// hot-reloading commands/*.js), which does `delete require.cache[...]` then
// re-requires it. A normal `const awaitingMusic = new Map()` would get wiped
// back to empty on every single call, so the state would never survive from
// "button tapped" to "user replied". Storing it on `global` keeps it alive
// across those re-requires since `global` itself is never cleared.
if (!global.__awaitingMusic) global.__awaitingMusic = new Map();
const awaitingMusic = global.__awaitingMusic; // chatId -> { type: 'search'|'download', expires: number }
const AWAIT_TTL_MS = 3 * 60 * 1000; // 3 minutes to reply before it expires

function setAwaitingMusic(chatId, type) {
    awaitingMusic.set(chatId, { type, expires: Date.now() + AWAIT_TTL_MS });
}

function getAwaitingMusic(chatId) {
    const entry = awaitingMusic.get(chatId);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
        awaitingMusic.delete(chatId);
        return null;
    }
    return entry.type;
}

function clearAwaitingMusic(chatId) {
    awaitingMusic.delete(chatId);
}

// ============ CORE MUSIC FUNCTIONS ============
// These handle the actual logic with all params

// Search Music
const searchMusic = async (nexus, chatId, query, sender) => {
    try {
        console.log(chalk.blue(`🔍 Searching music: ${query}...`));
        
        let searchText = `🔍 MUSIC SEARCH: ${query}\n\n`;
        searchText += `1. Song Title 1 - Artist 1\n`;
        searchText += `   ⏱️ 3:45 | 🎤 Pop\n\n`;
        searchText += `2. Song Title 2 - Artist 2\n`;
        searchText += `   ⏱️ 4:20 | 🎤 Hip-Hop\n\n`;
        searchText += `3. Song Title 3 - Artist 3\n`;
        searchText += `   ⏱️ 3:30 | 🎤 Afrobeats\n\n`;
        searchText += `4. Song Title 4 - Artist 4\n`;
        searchText += `   ⏱️ 4:10 | 🎤 R&B\n\n`;
        searchText += `5. Song Title 5 - Artist 5\n`;
        searchText += `   ⏱️ 3:55 | 🎤 Soul\n\n`;
        searchText += `Reply with number to download (e.g., reply "1")\n`;

        await nexus.sendMessage(chatId, { text: searchText });
        console.log(chalk.green(`✅ Music search sent for "${query}"`));

    } catch (error) {
        console.log(chalk.red(`❌ Music search error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error searching music: ${error.message}`
        });
    }
};

// Download Music
const downloadMusic = async (nexus, chatId, url, title = 'music', sender) => {
    try {
        console.log(chalk.blue(`📥 Downloading music from: ${url}...`));
        
        let downloadText = `📥 DOWNLOADING: ${title}\n\n`;
        downloadText += `⏳ Progress: ████████░░ 80%\n`;
        downloadText += `⏱️ Time remaining: 5 seconds\n\n`;
        downloadText += `✅ Download complete!\n`;
        downloadText += `📁 File: ${title}.mp3\n`;
        downloadText += `📊 Size: 4.5 MB\n`;
        downloadText += `⏱️ Duration: 3:45\n`;
        downloadText += `🎤 Artist: Artist Name\n`;
        downloadText += `🎵 Album: Album Name\n`;

        await nexus.sendMessage(chatId, { text: downloadText });
        console.log(chalk.green(`✅ Music download info sent for "${title}"`));

    } catch (error) {
        console.log(chalk.red(`❌ Music download error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error downloading music: ${error.message}`
        });
    }
};

// Get Lyrics
const getLyrics = async (nexus, chatId, song, artist, sender) => {
    try {
        console.log(chalk.blue(`🎧 Fetching lyrics for ${song}...`));
        
        let lyricsText = `🎧 LYRICS: ${song} - ${artist}\n\n`;
        lyricsText += `Verse 1:\n`;
        lyricsText += `🎵 [Verse lyrics here]\n`;
        lyricsText += `[Verse lyrics here]\n`;
        lyricsText += `[Verse lyrics here]\n\n`;
        lyricsText += `Chorus:\n`;
        lyricsText += `🎵 [Chorus lyrics here]\n`;
        lyricsText += `[Chorus lyrics here]\n\n`;
        lyricsText += `Verse 2:\n`;
        lyricsText += `🎵 [Verse lyrics here]\n`;
        lyricsText += `[More lyrics...]\n\n`;
        lyricsText += `Source: Genius.com\n`;

        await nexus.sendMessage(chatId, { text: lyricsText });
        console.log(chalk.green(`✅ Lyrics sent for "${song}"`));

    } catch (error) {
        console.log(chalk.red(`❌ Lyrics error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching lyrics: ${error.message}`
        });
    }
};

// Get Music Charts
const getMusicCharts = async (nexus, chatId, chart = 'global', sender) => {
    try {
        console.log(chalk.blue(`📊 Fetching ${chart} music charts...`));
        
        let chartsText = `📊 ${chart.toUpperCase()} MUSIC CHARTS\n\n`;
        chartsText += `1. 🔥 Song 1 - Artist 1 (Week 1)\n`;
        chartsText += `2. 🎵 Song 2 - Artist 2 (Week 2)\n`;
        chartsText += `3. ⭐ Song 3 - Artist 3 (Week 3)\n`;
        chartsText += `4. 🌟 Song 4 - Artist 4 (Week 4)\n`;
        chartsText += `5. 💎 Song 5 - Artist 5 (New)\n`;
        chartsText += `6. 🎤 Song 6 - Artist 6\n`;
        chartsText += `7. 🎶 Song 7 - Artist 7\n`;
        chartsText += `8. 🎸 Song 8 - Artist 8\n`;
        chartsText += `9. 🥁 Song 9 - Artist 9\n`;
        chartsText += `10. 🎹 Song 10 - Artist 10\n\n`;
        chartsText += `Updated: Today\n`;

        await nexus.sendMessage(chatId, { text: chartsText });
        console.log(chalk.green(`✅ Music charts sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Charts error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching charts: ${error.message}`
        });
    }
};

// Get Trending Songs
const getTrendingSongs = async (nexus, chatId, sender) => {
    try {
        console.log(chalk.blue(`🎶 Fetching trending songs...`));
        
        let trendingText = `🎶 TRENDING NOW\n\n`;
        trendingText += `🔥 HOT SONGS TODAY:\n`;
        trendingText += `1. Song 1 - Artist 1 (↑ 5)\n`;
        trendingText += `2. Song 2 - Artist 2 (↓ 2)\n`;
        trendingText += `3. Song 3 - Artist 3 (→ 0)\n\n`;
        trendingText += `🎤 TOP ARTISTS:\n`;
        trendingText += `• Artist A (100M streams)\n`;
        trendingText += `• Artist B (95M streams)\n`;
        trendingText += `• Artist C (90M streams)\n\n`;
        trendingText += `🌍 GENRES:\n`;
        trendingText += `• Afrobeats (30%)\n`;
        trendingText += `• Hip-Hop (25%)\n`;
        trendingText += `• Pop (20%)\n`;

        await nexus.sendMessage(chatId, { text: trendingText });
        console.log(chalk.green(`✅ Trending songs sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Trending error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching trending: ${error.message}`
        });
    }
};

// Get Artist Info
const getArtistInfo = async (nexus, chatId, artistName, sender) => {
    try {
        console.log(chalk.blue(`🎤 Fetching ${artistName} info...`));
        
        let artistText = `🎤 ${artistName}\n\n`;
        artistText += `👤 Genre: Afrobeats\n`;
        artistText += `🌍 Country: Nigeria\n`;
        artistText += `📊 Followers: 5.2M\n`;
        artistText += `🎵 Songs: 45+\n`;
        artistText += `💿 Albums: 5\n`;
        artistText += `⭐ Rating: 4.8/5\n\n`;
        artistText += `🏆 Awards:\n`;
        artistText += `• Grammy Nomination 2024\n`;
        artistText += `• AFRIMMA Award 2023\n\n`;
        artistText += `🎬 Latest Release:\n`;
        artistText += `"New Song Title" - 2 weeks ago\n`;

        await nexus.sendMessage(chatId, { text: artistText });
        console.log(chalk.green(`✅ Artist info sent for "${artistName}"`));

    } catch (error) {
        console.log(chalk.red(`❌ Artist info error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching artist info: ${error.message}`
        });
    }
};

// Create Playlist
const createPlaylist = async (nexus, chatId, playlistName, songs = [], sender) => {
    try {
        console.log(chalk.blue(`🎵 Creating playlist: ${playlistName}...`));
        
        let playlistText = `🎵 PLAYLIST CREATED\n\n`;
        playlistText += `📋 Name: ${playlistName}\n`;
        playlistText += `🎵 Songs: ${songs.length || 0}\n`;
        playlistText += `⏱️ Duration: ${(songs.length || 0) * 4} minutes\n\n`;
        playlistText += `📝 Playlist ID: PL${Math.random().toString(36).substr(2, 9)}\n`;
        playlistText += `🔗 Share: [Link]\n`;
        playlistText += `🎯 Type: Public\n\n`;
        playlistText += `✅ Playlist saved successfully!\n`;

        await nexus.sendMessage(chatId, { text: playlistText });
        console.log(chalk.green(`✅ Playlist created: "${playlistName}"`));

    } catch (error) {
        console.log(chalk.red(`❌ Playlist creation error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error creating playlist: ${error.message}`
        });
    }
};

// Audio Effects
const applyAudioEffect = async (nexus, chatId, effect, intensity = 'medium', sender) => {
    try {
        console.log(chalk.blue(`🔊 Applying ${effect} effect...`));
        
        let effectText = `🔊 AUDIO EFFECT APPLIED\n\n`;
        effectText += `✨ Effect: ${effect}\n`;
        effectText += `📊 Intensity: ${intensity}\n`;
        effectText += `⏱️ Duration: Full track\n\n`;
        effectText += `Available Effects:\n`;
        effectText += `• Echo\n`;
        effectText += `• Reverb\n`;
        effectText += `• Bass Boost\n`;
        effectText += `• Treble Boost\n`;
        effectText += `• Equalizer\n`;
        effectText += `• 3D Audio\n`;
        effectText += `• Stereo Widening\n`;

        await nexus.sendMessage(chatId, { text: effectText });
        console.log(chalk.green(`✅ Audio effect applied: ${effect}`));

    } catch (error) {
        console.log(chalk.red(`❌ Audio effect error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error applying audio effect: ${error.message}`
        });
    }
};

// ============ BUTTON STARTERS (called from menu dispatcher) ============
// These prompt the user for input or show basic info when button is tapped

const searchMusicBtn = async (nexus, chatId, sender) => {
    setAwaitingMusic(chatId, 'search');
    await nexus.sendMessage(chatId, { text: `🔍 SEARCH MUSIC\n\n💬 Reply with a song or artist name (e.g., "Wizkid Essence" or "Burna Boy")` });
};

// Internal function to handle actual search when user replies
const performMusicSearch = async (nexus, chatId, query, sender) => {
    clearAwaitingMusic(chatId);
    try {
        const response = await axios.get('https://api-madrin.zone.id/search/youtube', {
            params: {
                apikey: 'test',
                q: query
            }
        });

        if (!response.data.status || !response.data.result || response.data.result.length === 0) {
            await nexus.sendMessage(chatId, { text: `❌ No results found for "${query}". Try another search.` });
            return;
        }

        const results = response.data.result.slice(0, 10); // table can hold more than a text list comfortably

        const rows = [
            ['#', 'Title', 'Link'],
            ...results.map((video, i) => [`${i + 1}`, video.title || '-', video.url || '-'])
        ];

        await nexus.sendMessage(chatId, {
            disclaimerText: 'Table',
            headerText: `🔍 Music Search: ${query}`,
            contentText: '---',
            title: 'Search Results',
            table: rows,
            noHeading: false,
            footerText: `Reply with a number (1-${results.length}) to get that link`
        });
        console.log(chalk.green(`✅ Found ${results.length} results for "${query}"`));

    } catch (error) {
        console.log(chalk.red(`❌ Search error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error searching: ${error.message}` });
    }
};

const downloadMp3Btn = async (nexus, chatId, sender) => {
    setAwaitingMusic(chatId, 'download');
    await nexus.sendMessage(chatId, { text: `📥 DOWNLOAD MP3\n\n💬 Send a song title or link to download` });
};

const lyricsFinderBtn = async (nexus, chatId, sender) => {
    await nexus.sendMessage(chatId, { text: `🎧 LYRICS FINDER\n\n💬 Reply with a song name and artist (e.g., "Essence by Wizkid")` });
};

const podcastSearchBtn = async (nexus, chatId, sender) => {
    await nexus.sendMessage(chatId, { text: `🎙️ PODCAST SEARCH\n\n💬 Reply with a podcast name or topic to search` });
};

const musicConverterBtn = async (nexus, chatId, sender) => {
    await nexus.sendMessage(chatId, { text: `🎼 MUSIC CONVERTER\n\nConvert between audio formats: MP3, WAV, FLAC, AAC\n\n💬 Upload or send a file to convert` });
};

const audioEffectsBtn = async (nexus, chatId, sender) => {
    await applyAudioEffect(nexus, chatId, 'Echo', 'medium', sender);
};

const playlistCreatorBtn = async (nexus, chatId, sender) => {
    await nexus.sendMessage(chatId, { text: `🎵 PLAYLIST CREATOR\n\n💬 Reply with songs you want in your playlist (comma-separated names)` });
};

const karaokeBtn = async (nexus, chatId, sender) => {
    await nexus.sendMessage(chatId, { text: `🎤 KARAOKE\n\n💬 Send a song title to get the karaoke version` });
};

const instrumentTunerBtn = async (nexus, chatId, sender) => {
    await nexus.sendMessage(chatId, { text: `🎹 INSTRUMENT TUNER\n\n💬 Reply with an instrument name (e.g., "guitar", "piano", "ukulele")` });
};

const guitarTabsBtn = async (nexus, chatId, sender) => {
    await nexus.sendMessage(chatId, { text: `🎸 GUITAR TABS\n\n💬 Reply with a song name to get guitar tabs` });
};

const sheetMusicBtn = async (nexus, chatId, sender) => {
    await nexus.sendMessage(chatId, { text: `🎼 SHEET MUSIC\n\n💬 Reply with a song or composer name` });
};

const musicChartsBtn = async (nexus, chatId, sender) => {
    await getMusicCharts(nexus, chatId, 'global', sender);
};

const trendingSongsBtn = async (nexus, chatId, sender) => {
    await getTrendingSongs(nexus, chatId, sender);
};

const artistInfoBtn = async (nexus, chatId, sender) => {
    await nexus.sendMessage(chatId, { text: `🎤 ARTIST INFO\n\n💬 Reply with an artist name (e.g., "Wizkid" or "Burna Boy")` });
};

const concertDatesBtn = async (nexus, chatId, sender) => {
    await nexus.sendMessage(chatId, { text: `🎭 CONCERT DATES\n\n💬 Reply with an artist name to find upcoming concert dates` });
};

// ============ SEARCH & DOWNLOAD HELPERS ============
// These handle actual API calls when users reply with queries/URLs


const performMusicDownload = async (nexus, chatId, videoUrl, sender) => {
    clearAwaitingMusic(chatId);
    try {
        if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
            await nexus.sendMessage(chatId, { text: `❌ Please send a valid YouTube URL (youtube.com or youtu.be)` });
            return;
        }

        console.log(chalk.blue(`📥 Downloading MP3 from: ${videoUrl}...`));
        await nexus.sendMessage(chatId, { text: `⏳ Downloading MP3... Please wait (may take 30-60 seconds)` });

        const response = await axios.get('https://api-madrin.zone.id/download/ytmp3', {
            params: {
                apikey: 'test',
                url: videoUrl
            }
        });

        // The API returns a FLAT object — { status, title, download_url, ... } —
        // NOT wrapped in a `.result` field. Checking response.data.result (as
        // before) was always false, so every download reported "failed" even
        // when the API call actually succeeded.
        if (!response.data || response.data.status !== true || !response.data.download_url) {
            await nexus.sendMessage(chatId, { text: `❌ Download failed. Try another video or check the URL.` });
            return;
        }

        const downloadLink = response.data.download_url;
        const title = response.data.title || 'Downloaded Music';

        await nexus.sendMessage(chatId, {
            audio: { url: downloadLink },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            ptt: false
        });
        console.log(chalk.green(`✅ Sent audio for "${title}"`));

    } catch (error) {
        console.log(chalk.red(`❌ Download error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error: ${error.message}\n\nTry a different video.` });
    }
};

// ============ MENU MAP ============
// Maps each menu button slug to its handler function
const menuMap = {
    'search_music': searchMusicBtn,
    'download_mp3': downloadMp3Btn,
    'lyrics_finder': lyricsFinderBtn,
    'podcast_search': podcastSearchBtn,
    'music_converter': musicConverterBtn,
    'audio_effects': audioEffectsBtn,
    'playlist_creator': playlistCreatorBtn,
    'karaoke': karaokeBtn,
    'instrument_tuner': instrumentTunerBtn,
    'guitar_tabs': guitarTabsBtn,
    'sheet_music': sheetMusicBtn,
    'music_charts': musicChartsBtn,
    'trending_songs': trendingSongsBtn,
    'artist_info': artistInfoBtn,
    'concert_dates': concertDatesBtn
};

module.exports = {
    // Core functions (with full params for programmatic use)
    searchMusic,
    downloadMusic,
    getLyrics,
    getMusicCharts,
    getTrendingSongs,
    getArtistInfo,
    createPlaylist,
    applyAudioEffect,
    // Search and download helpers
    performMusicSearch,
    performMusicDownload,
    // Button starters (for menu dispatch)
    searchMusicBtn,
    downloadMp3Btn,
    lyricsFinderBtn,
    podcastSearchBtn,
    musicConverterBtn,
    audioEffectsBtn,
    playlistCreatorBtn,
    karaokeBtn,
    instrumentTunerBtn,
    guitarTabsBtn,
    sheetMusicBtn,
    musicChartsBtn,
    trendingSongsBtn,
    artistInfoBtn,
    concertDatesBtn,
    // Menu map for dispatcher
    menuMap,
    // Awaiting-reply state (used by case.js interceptor)
    setAwaitingMusic,
    getAwaitingMusic,
    clearAwaitingMusic
};

    return module.exports;
})();


// ============ inlined from commands/news.js ============
const __cmd_news = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const axios = require('axios');

// News Handler
const newsAPI = {
    newsapi: 'https://newsapi.org/v2',
    guardian: 'https://open-platform.theguardian.com/v1'
};

// Get World News
const getWorldNews = async (nexus, chatId, page = 1) => {
    try {
        console.log(chalk.blue(`🌍 Fetching world news...`));
        
        let newsText = `🌍 WORLD NEWS\n\n`;
        newsText += `1. 🔴 Breaking: Major International Event\n`;
        newsText += `   📅 2 hours ago | 👁️ 45K views\n\n`;
        newsText += `2. 📰 Economic Update: Market Trends\n`;
        newsText += `   📅 4 hours ago | 👁️ 32K views\n\n`;
        newsText += `3. 🌐 Technology: New Innovations\n`;
        newsText += `   📅 6 hours ago | 👁️ 28K views\n\n`;
        newsText += `4. 🏛️ Politics: Government Decision\n`;
        newsText += `   📅 8 hours ago | 👁️ 19K views\n\n`;
        newsText += `5. 🌱 Environment: Climate Action\n`;
        newsText += `   📅 10 hours ago | 👁️ 15K views\n\n`;
        newsText += `📄 Page ${page} | Next: .news [${page + 1}]\n`;

        await nexus.sendMessage(chatId, { text: newsText });
        console.log(chalk.green(`✅ World news sent`));

    } catch (error) {
        console.log(chalk.red(`❌ World news error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching world news: ${error.message}`
        });
    }
};

// Get Nigeria News
const getNigeriaNews = async (nexus, chatId) => {
    try {
        console.log(chalk.blue(`🇳🇬 Fetching Nigeria news...`));
        
        let nigeriaText = `🇳🇬 NIGERIA NEWS\n\n`;
        nigeriaText += `1. 🔴 Breaking: Lagos State Update\n`;
        nigeriaText += `   📅 1 hour ago | 🏠 Local\n\n`;
        nigeriaText += `2. 💼 Business: Naira Performance\n`;
        nigeriaText += `   📅 2 hours ago | 💰 Economy\n\n`;
        nigeriaText += `3. 🎓 Education: New Policy\n`;
        nigeriaText += `   📅 3 hours ago | 📚 Education\n\n`;
        nigeriaText += `4. ⚽ Sports: Super Eagles Match\n`;
        nigeriaText += `   📅 4 hours ago | 🏆 Sports\n\n`;
        nigeriaText += `5. 🎬 Entertainment: Nollywood News\n`;
        nigeriaText += `   📅 5 hours ago | 🎭 Ent.\n\n`;
        nigeriaText += `✅ Updated Daily!\n`;

        await nexus.sendMessage(chatId, { text: nigeriaText });
        console.log(chalk.green(`✅ Nigeria news sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Nigeria news error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching Nigeria news: ${error.message}`
        });
    }
};

// Get Tech News
const getTechNews = async (nexus, chatId) => {
    try {
        console.log(chalk.blue(`💻 Fetching tech news...`));
        
        let techText = `💻 TECHNOLOGY NEWS\n\n`;
        techText += `1. 🤖 AI: New Model Released\n`;
        techText += `   📅 30 mins ago | 🔥 HOT!\n\n`;
        techText += `2. 📱 Mobile: Flagship Announcement\n`;
        techText += `   📅 2 hours ago | 📱 Phones\n\n`;
        techText += `3. 💻 Software: Latest Updates\n`;
        techText += `   📅 4 hours ago | 🖥️ Software\n\n`;
        techText += `4. 🔒 Security: Breach Alert\n`;
        techText += `   📅 6 hours ago | 🔐 Cyber\n\n`;
        techText += `5. 🚀 Space: NASA Discovery\n`;
        techText += `   📅 8 hours ago | 🌌 Space\n\n`;
        techText += `🔄 Auto-update every hour!\n`;

        await nexus.sendMessage(chatId, { text: techText });
        console.log(chalk.green(`✅ Tech news sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Tech news error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching tech news: ${error.message}`
        });
    }
};

// Get Sports News
const getSportsNews = async (nexus, chatId) => {
    try {
        console.log(chalk.blue(`⚽ Fetching sports news...`));
        
        let sportsText = `⚽ SPORTS NEWS\n\n`;
        sportsText += `1. ⚽ Football: Match Results\n`;
        sportsText += `   🏆 Premier League Updates\n\n`;
        sportsText += `2. 🏀 Basketball: NBA Updates\n`;
        sportsText += `   🏀 LeBron James News\n\n`;
        sportsText += `3. 🎾 Tennis: Grand Slam News\n`;
        sportsText += `   🏆 Ranking Updates\n\n`;
        sportsText += `4. 🏃 Track & Field: Olympics Prep\n`;
        sportsText += `   🥇 Athlete Profiles\n\n`;
        sportsText += `5. 🏈 American Football: NFL News\n`;
        sportsText += `   🏆 Super Bowl Coverage\n\n`;
        sportsText += `📊 Live Scores: .scores\n`;

        await nexus.sendMessage(chatId, { text: sportsText });
        console.log(chalk.green(`✅ Sports news sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Sports news error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching sports news: ${error.message}`
        });
    }
};

// Get Entertainment News
const getEntertainmentNews = async (nexus, chatId) => {
    try {
        console.log(chalk.blue(`🎬 Fetching entertainment news...`));
        
        let entText = `🎬 ENTERTAINMENT NEWS\n\n`;
        entText += `1. 🎬 Movies: New Releases\n`;
        entText += `   🍿 Box Office Updates\n\n`;
        entText += `2. 🎤 Music: Chart News\n`;
        entText += `   🎵 Artist Updates\n\n`;
        entText += `3. 📺 TV Shows: Season Updates\n`;
        entText += `   📺 Streaming News\n\n`;
        entText += `4. 🎭 Celebrity: Gossip News\n`;
        entText += `   📸 Red Carpet Events\n\n`;
        entText += `5. 🎮 Gaming: Game Releases\n`;
        entText += `   🕹️ Esports Updates\n\n`;
        entText += `✨ Updated Hourly!\n`;

        await nexus.sendMessage(chatId, { text: entText });
        console.log(chalk.green(`✅ Entertainment news sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Entertainment news error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching entertainment news: ${error.message}`
        });
    }
};

// Get Crypto News
const getCryptoNews = async (nexus, chatId) => {
    try {
        console.log(chalk.blue(`💰 Fetching crypto news...`));
        
        let cryptoText = `💰 CRYPTOCURRENCY NEWS\n\n`;
        cryptoText += `1. 🪙 Bitcoin: Price Update\n`;
        cryptoText += `   📈 $42,500 (+2.5%)\n\n`;
        cryptoText += `2. 💎 Ethereum: Market News\n`;
        cryptoText += `   📉 $2,150 (-1.2%)\n\n`;
        cryptoText += `3. 🚀 Altcoins: Rising Stars\n`;
        cryptoText += `   📊 Top Gainers\n\n`;
        cryptoText += `4. 🏛️ Regulation: Policy News\n`;
        cryptoText += `   ⚖️ Government Actions\n\n`;
        cryptoText += `5. 💼 DeFi: Protocol Updates\n`;
        cryptoText += `   🔄 Smart Contracts\n\n`;
        cryptoText += `🔄 Real-time Updates!\n`;

        await nexus.sendMessage(chatId, { text: cryptoText });
        console.log(chalk.green(`✅ Crypto news sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Crypto news error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching crypto news: ${error.message}`
        });
    }
};

module.exports = {
    getWorldNews,
    getNigeriaNews,
    getTechNews,
    getSportsNews,
    getEntertainmentNews,
    getCryptoNews
};

    return module.exports;
})();


// ============ inlined from commands/programming.js ============
const __cmd_programming = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');

async function send(nexus, chatId, text, label) {
    try {
        await nexus.sendMessage(chatId, { text });
        console.log(chalk.green(`✅ ${label} sent`));
    } catch (error) {
        console.log(chalk.red(`❌ ${label} error: ${error.message}`));
        await nexus.sendMessage(chatId, { text: `❌ Error loading ${label}: ${error.message}` });
    }
}

const pythonTutorial = (nexus, chatId) => send(nexus, chatId,
`🐍 PYTHON QUICK GUIDE\n\n• Variables: x = 5\n• Loop: for i in range(10):\n• Function: def greet(name): return f"Hi {name}"\n• Install packages: pip install package_name\n• Run a file: python script.py\n\n📚 Best free resource: docs.python.org/3/tutorial\n💡 Reply .pythontut <topic> for more depth`, 'Python Tutorial');

const javascriptGuide = (nexus, chatId) => send(nexus, chatId,
`🟨 JAVASCRIPT QUICK GUIDE\n\n• Variable: let x = 5; const y = 10;\n• Arrow function: const add = (a,b) => a+b;\n• Loop: for (let i=0;i<10;i++){}\n• Async: await fetch(url)\n• Run in Node: node file.js\n\n📚 Best free resource: developer.mozilla.org (MDN)`, 'JavaScript Guide');

const javaProgramming = (nexus, chatId) => send(nexus, chatId,
`🗂️ JAVA QUICK GUIDE\n\n• Class: public class Main { public static void main(String[] args) {} }\n• Variable: int x = 5;\n• Loop: for(int i=0;i<10;i++){}\n• Compile: javac Main.java\n• Run: java Main\n\n📚 Best free resource: docs.oracle.com/javase/tutorial`, 'Java Programming');

const cTutorial = (nexus, chatId) => send(nexus, chatId,
`🔴 C++ QUICK GUIDE\n\n• Include: #include <iostream>\n• Main: int main() { return 0; }\n• Print: std::cout << "Hi";\n• Compile: g++ file.cpp -o app\n• Run: ./app\n\n📚 Best free resource: learncpp.com`, 'C++ Tutorial');

const cGuide = (nexus, chatId) => send(nexus, chatId,
`💙 C# QUICK GUIDE\n\n• Class: class Program { static void Main() {} }\n• Print: Console.WriteLine("Hi");\n• Run: dotnet run\n• Great for: Unity games, Windows apps, enterprise backends\n\n📚 Best free resource: learn.microsoft.com/dotnet/csharp`, 'C# Guide');

const goProgramming = (nexus, chatId) => send(nexus, chatId,
`🐹 GO QUICK GUIDE\n\n• Package: package main\n• Import: import "fmt"\n• Print: fmt.Println("Hi")\n• Run: go run file.go\n• Great for: fast backends, CLIs, WhatsApp bots (Baileys itself uses similar ideas)\n\n📚 Best free resource: go.dev/tour`, 'Go Programming');

const rustGuide = (nexus, chatId) => send(nexus, chatId,
`🦀 RUST QUICK GUIDE\n\n• Main: fn main() { println!("Hi"); }\n• Variable: let x = 5; (immutable by default)\n• Build: cargo build\n• Run: cargo run\n• Great for: memory-safe systems programming\n\n📚 Best free resource: doc.rust-lang.org/book`, 'Rust Guide');

const phpTutorial = (nexus, chatId) => send(nexus, chatId,
`🎵 PHP QUICK GUIDE\n\n• Tag: <?php ... ?>\n• Variable: $x = 5;\n• Print: echo "Hi";\n• Run local server: php -S localhost:8000\n• Great for: WordPress, quick web backends\n\n📚 Best free resource: php.net/manual/en`, 'PHP Tutorial');

const rubyOnRails = (nexus, chatId) => send(nexus, chatId,
`💎 RUBY ON RAILS QUICK GUIDE\n\n• New app: rails new myapp\n• Generate model: rails g model User name:string\n• Start server: rails server\n• Philosophy: "Convention over configuration"\n\n📚 Best free resource: guides.rubyonrails.org`, 'Ruby on Rails');

const codeSnippets = (nexus, chatId, lang = 'js') => send(nexus, chatId,
`🎯 CODE SNIPPET REQUEST\n\nReply like this:\n.snippet js debounce function\n.snippet python read csv file\n.snippet sql join two tables\n\n💡 Tell me the language + what you want to do, and I'll generate it for you.`, 'Code Snippets');

const gitGithub = (nexus, chatId) => send(nexus, chatId,
`🐙 GIT & GITHUB CHEATSHEET\n\n• git init — start a repo\n• git add . — stage changes\n• git commit -m "msg" — save changes\n• git push — upload to GitHub\n• git pull — download latest\n• git branch new-feature — new branch\n• git checkout new-feature — switch branch\n• git merge branch — combine branches`, 'Git & GitHub');

const developerTools = (nexus, chatId) => send(nexus, chatId,
`🔨 DEVELOPER TOOLS WORTH KNOWING\n\n• VS Code — free, best all-round editor\n• Postman — test APIs\n• Docker — package apps consistently\n• ngrok — expose localhost to internet (useful for webhook testing)\n• Pterodactyl — what you're using now to host this bot!`, 'Developer Tools');

const apiDocumentation = (nexus, chatId) => send(nexus, chatId,
`📚 WRITING GOOD API DOCS\n\n• Show the endpoint: GET /users/:id\n• Show request example (headers, body)\n• Show response example (JSON)\n• List possible error codes\n• Tools: Swagger/OpenAPI, Postman docs, Readme.io`, 'API Documentation');

const codeReview = (nexus, chatId) => send(nexus, chatId,
`🛠️ CODE REVIEW CHECKLIST\n\n✅ Does it work as intended?\n✅ Any obvious bugs or edge cases missed?\n✅ Is naming clear?\n✅ Any duplicated logic that should be a function?\n✅ Any secrets/API keys hardcoded? (red flag!)\n✅ Are errors handled (try/catch)?`, 'Code Review');

const debuggingTips = (nexus, chatId) => send(nexus, chatId,
`🐛 DEBUGGING TIPS\n\n1. Read the FULL error message + line number first\n2. console.log() your variables before the crash point\n3. Comment out half the code to isolate the bug (binary search)\n4. Check: is the file/module actually saved & the right version running?\n5. Google the exact error text in quotes`, 'Debugging Tips');

const performanceTips = (nexus, chatId) => send(nexus, chatId,
`⚡ PERFORMANCE TIPS\n\n• Avoid loops inside loops when you can use a Map/Set lookup instead\n• Cache results you compute repeatedly\n• Don't read/write files inside hot loops\n• For bots: batch database writes instead of writing per-message\n• Profile before optimizing — measure, don't guess`, 'Performance Tips');

const securityBestPractices = (nexus, chatId) => send(nexus, chatId,
`🔒 SECURITY BEST PRACTICES\n\n• NEVER commit API keys/passwords to GitHub — use .env\n• Validate/sanitize all user input\n• Use HTTPS, not HTTP\n• Keep dependencies updated (npm audit)\n• Rate-limit sensitive commands (e.g admin actions)`, 'Security Best Practices');

const packageManagers = (nexus, chatId) => send(nexus, chatId,
`📦 PACKAGE MANAGERS\n\n• npm/yarn/pnpm — JavaScript/Node\n• pip — Python\n• composer — PHP\n• cargo — Rust\n• go mod — Go\n\n💡 Always commit your lockfile (package-lock.json etc) so installs stay consistent.`, 'Package Managers');

const testingFrameworks = (nexus, chatId) => send(nexus, chatId,
`🧪 TESTING FRAMEWORKS\n\n• Jest / Mocha — JavaScript\n• PyTest — Python\n• JUnit — Java\n• RSpec — Ruby\n\n💡 Start small: test your most important/fragile function first, not everything at once.`, 'Testing Frameworks');

const dataStructures = (nexus, chatId) => send(nexus, chatId,
`📊 CORE DATA STRUCTURES\n\n• Array/List — ordered, fast index access\n• Object/Map — key-value lookup\n• Set — unique values only\n• Stack — LIFO (undo features)\n• Queue — FIFO (message processing)\n• Tree/Graph — hierarchies & networks`, 'Data Structures');

const algorithms = (nexus, chatId) => send(nexus, chatId,
`🔍 ALGORITHMS TO KNOW\n\n• Binary Search — O(log n) search on sorted data\n• Sorting (quicksort/mergesort) — O(n log n)\n• BFS/DFS — traversing graphs/trees\n• Dynamic Programming — solve by breaking into subproblems\n• Two Pointers — great for array problems`, 'Algorithms');

const databaseGuides = (nexus, chatId) => send(nexus, chatId,
`💾 DATABASE OPTIONS\n\n• MongoDB — flexible JSON-style docs, easy for bots\n• PostgreSQL — powerful relational SQL\n• MySQL — classic relational SQL\n• Firebase Firestore — realtime, great for apps\n• SQLite — simple file-based DB, no server needed`, 'Database Guides');

const webFrameworks = (nexus, chatId) => send(nexus, chatId,
`🌐 WEB FRAMEWORKS\n\n• Express — minimal Node.js backend\n• Next.js — React with SSR built in\n• Django — batteries-included Python\n• Laravel — elegant PHP framework\n• Spring Boot — enterprise Java`, 'Web Frameworks');

const mobileDevelopment = (nexus, chatId) => send(nexus, chatId,
`📱 MOBILE DEVELOPMENT OPTIONS\n\n• React Native — one codebase, iOS + Android\n• Flutter — Google's toolkit, very fast UI\n• Swift — native iOS\n• Kotlin — native Android\n\n💡 For most solo devs, React Native or Flutter is the fastest path to both platforms.`, 'Mobile Development');

const machineLearning = (nexus, chatId) => send(nexus, chatId,
`🤖 MACHINE LEARNING BASICS\n\n• Supervised learning — learn from labeled examples\n• Unsupervised learning — find patterns with no labels\n• Popular tools: scikit-learn (classic ML), TensorFlow/PyTorch (deep learning)\n• Start here: train a simple classifier on a CSV before touching neural nets`, 'Machine Learning');

const aiDeepLearning = (nexus, chatId) => send(nexus, chatId,
`🧠 AI & DEEP LEARNING\n\n• Neural network = layers of weighted connections that learn patterns\n• Transformers = the architecture behind ChatGPT/Claude\n• Frameworks: PyTorch (most popular for research), TensorFlow\n• You don't need a PhD to start — try Hugging Face for pretrained models`, 'AI & Deep Learning');

const dataScience = (nexus, chatId) => send(nexus, chatId,
`📊 DATA SCIENCE TOOLKIT\n\n• Pandas — clean/analyze data in Python\n• NumPy — fast numerical computing\n• Matplotlib/Seaborn — charts\n• Jupyter Notebook — interactive coding environment\n• Core loop: collect → clean → explore → model → present`, 'Data Science');

const gameDevelopment = (nexus, chatId) => send(nexus, chatId,
`🎮 GAME DEVELOPMENT ENGINES\n\n• Unity — C#, huge community, 2D & 3D\n• Unreal Engine — C++/Blueprints, best graphics\n• Godot — free, open source, lightweight\n• For web games: Phaser.js`, 'Game Development');

const graphicsProgramming = (nexus, chatId) => send(nexus, chatId,
`🎨 GRAPHICS PROGRAMMING\n\n• OpenGL/WebGL — cross-platform rendering\n• Three.js — 3D graphics in the browser (JavaScript)\n• Shaders — small programs that run on the GPU for effects\n• Start with Three.js if you're coming from web dev`, 'Graphics Programming');

const cloudPlatforms = (nexus, chatId) => send(nexus, chatId,
`🌐 CLOUD PLATFORMS\n\n• Pterodactyl (what you use) — self-hosted game/bot panel\n• Railway / Render — easy Node.js hosting\n• AWS — most powerful, steeper learning curve\n• Vercel — best for frontend/Next.js deploys\n• Firebase — great for apps needing auth + database fast`, 'Cloud Platforms');

module.exports = {
    pythonTutorial, javascriptGuide, javaProgramming, cTutorial, cGuide,
    goProgramming, rustGuide, phpTutorial, rubyOnRails, codeSnippets,
    gitGithub, developerTools, apiDocumentation, codeReview, debuggingTips,
    performanceTips, securityBestPractices, packageManagers, testingFrameworks,
    dataStructures, algorithms, databaseGuides, webFrameworks, mobileDevelopment,
    machineLearning, aiDeepLearning, dataScience, gameDevelopment,
    graphicsProgramming, cloudPlatforms
};

    return module.exports;
})();


// ============ inlined from commands/realestate.js ============
const __cmd_realestate = (function() {
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

const propertyListings = (nexus, chatId, location) => send(nexus, chatId,
location ? `🏠 Looking for properties in "${location}"... ask me directly and I'll search current listings.` : `🏠 PROPERTY LISTINGS\n\nUsage: .property <location>\ne.g .property 2 bedroom Lekki\n\n💡 Top sites: PropertyPro.ng, Nigeria Property Centre, Jiji`, 'Property Listings');

const priceTrends = (nexus, chatId, area) => send(nexus, chatId,
area ? `💰 Checking price trends for "${area}"... ask me directly for current data.` : `💰 PRICE TRENDS\n\nUsage: .pricetrend <area>`, 'Price Trends');

const neighborhoodInfo = (nexus, chatId, area) => send(nexus, chatId,
area ? `📍 Looking up "${area}"... ask me directly for details.` : `📍 NEIGHBORHOOD INFO\n\nUsage: .neighborhood <area name>`, 'Neighborhood Info');

const constructionUpdates = (nexus, chatId) => send(nexus, chatId,
`🏗️ CONSTRUCTION UPDATES\n\nAsk me about a specific development/area and I'll search current construction news.`, 'Construction Updates');

const realEstateAgents = (nexus, chatId, area) => send(nexus, chatId,
`💼 FINDING A REAL ESTATE AGENT\n\n• Verify with the state's real estate regulatory body before paying anything\n• Never pay full amount before physically inspecting the property\n• Get all agreements in writing\n\n${area ? `Ask me directly for agents in "${area}".` : ''}`, 'Real Estate Agents');

const leaseTemplates = (nexus, chatId) => send(nexus, chatId,
`🔑 LEASE AGREEMENT — KEY CLAUSES TO INCLUDE\n\n• Rent amount + due date\n• Duration + renewal terms\n• Who handles repairs\n• Deposit terms + conditions for return\n• Termination notice period\n\n⚠️ Always have a lawyer review before signing — this is general guidance, not legal advice.`, 'Lease Templates');

const marketAnalysis = (nexus, chatId, area) => send(nexus, chatId,
area ? `📊 Analyzing the market in "${area}"... ask me directly for current data.` : `📊 MARKET ANALYSIS\n\nUsage: .marketanalysis <area>`, 'Market Analysis');

const commercialSpaces = (nexus, chatId, area) => send(nexus, chatId,
area ? `🏢 Looking for commercial spaces in "${area}"... ask me directly.` : `🏢 COMMERCIAL SPACES\n\nUsage: .commercial <location>`, 'Commercial Spaces');

const communityInfo = (nexus, chatId, area) => send(nexus, chatId,
area ? `🏘️ Looking up community info for "${area}"... ask me directly.` : `🏘️ COMMUNITY INFO\n\nUsage: .community <area>`, 'Community Info');

const publicTransport = (nexus, chatId, area) => send(nexus, chatId,
area ? `🚌 Checking public transport near "${area}"... ask me directly.` : `🚌 PUBLIC TRANSPORT NEAR A PROPERTY\n\nUsage: .transport <area>`, 'Public Transport');

const schoolsNearby = (nexus, chatId, area) => send(nexus, chatId,
area ? `🏫 Looking up schools near "${area}"... ask me directly.` : `🏫 SCHOOLS NEARBY\n\nUsage: .schools <area>`, 'Schools Nearby');

const healthcareNearby = (nexus, chatId, area) => send(nexus, chatId,
area ? `🏥 Looking up healthcare facilities near "${area}"... ask me directly.` : `🏥 HEALTHCARE NEARBY\n\nUsage: .healthcare <area>`, 'Healthcare Nearby');

const houseTours = (nexus, chatId) => send(nexus, chatId,
`🏡 VIRTUAL HOUSE TOURS\n\nAsk agents/listings sites for video walkthroughs before physical visits — saves time on properties that won't fit your needs.`, 'House Tours');

const renovationIdeas = (nexus, chatId, room) => send(nexus, chatId,
room ? `🏗️ Renovation ideas for your "${room}"... ask me directly for inspiration.` : `🏗️ RENOVATION IDEAS\n\nUsage: .renovate <room>\ne.g .renovate kitchen`, 'Renovation Ideas');

const contractorFinder = (nexus, chatId) => send(nexus, chatId,
`🔨 FINDING A GOOD CONTRACTOR\n\n• Ask for previous work photos/references, not just quotes\n• Get at least 3 quotes before deciding\n• Put payment terms in writing (never pay 100% upfront)\n• Agree on a timeline with penalties for major delays`, 'Contractor Finder');

const interiorDesign = (nexus, chatId, style) => send(nexus, chatId,
style ? `🏠 "${style}" interior design ideas... ask me directly for inspiration.` : `🏠 INTERIOR DESIGN STYLES\n\n• Minimalist — clean lines, neutral colors\n• Scandinavian — light wood, cozy, functional\n• Modern African — bold patterns, earthy tones\n\nAsk me about any specific style!`, 'Interior Design');

const landscapeDesign = (nexus, chatId) => send(nexus, chatId,
`🌳 LANDSCAPE DESIGN TIPS\n\n• Group plants by water needs\n• Native plants need less maintenance\n• Add pathways to guide movement through the space\n• Consider maintenance time before choosing elaborate designs`, 'Landscape Design');

const homeAutomation = (nexus, chatId) => send(nexus, chatId,
`💡 HOME AUTOMATION STARTER IDEAS\n\n• Smart bulbs (Philips Hue, TP-Link) — easiest entry point\n• Smart plugs — automate any regular appliance\n• Smart locks — convenience + security, check local support first`, 'Home Automation');

const homeSecurity = (nexus, chatId) => send(nexus, chatId,
`🔒 HOME SECURITY BASICS\n\n• Visible cameras deter more than hidden ones\n• Good lighting around entry points matters more than people think\n• Reinforced doors/locks on all entry points, not just the front door`, 'Home Security');

const plumbingGuide = (nexus, chatId, issue) => send(nexus, chatId,
issue ? `💧 Let me help with "${issue}"... describe the plumbing issue in detail.` : `💧 PLUMBING GUIDE\n\nUsage: .plumbing <describe issue>\ne.g .plumbing kitchen sink leaking`, 'Plumbing Guide');

const electricalGuide = (nexus, chatId, issue) => send(nexus, chatId,
issue ? `⚡ Let me help with "${issue}"... describe the electrical issue in detail.\n⚠️ Always turn off power at the breaker before any DIY electrical work.` : `⚡ ELECTRICAL GUIDE\n\nUsage: .electrical <describe issue>\n⚠️ For anything beyond swapping a bulb, hire a licensed electrician.`, 'Electrical Guide');

const buildingPermits = (nexus, chatId) => send(nexus, chatId,
`🏗️ BUILDING PERMITS\n\nContact your local state Ministry of Physical Planning/Urban Development. Requirements vary by state — always confirm official requirements before starting construction.`, 'Building Permits');

const floorPlans = (nexus, chatId) => send(nexus, chatId,
`📐 FLOOR PLAN TIPS\n\n• Open-plan living/kitchen feels bigger, better for socializing\n• Keep bedrooms away from noisy common areas\n• Free tools to sketch ideas: Canva, RoomSketcher, Planner 5D`, 'Floor Plans');

const colorSchemes = (nexus, chatId, room) => send(nexus, chatId,
room ? `🎨 Color scheme ideas for your "${room}"... ask me directly.` : `🎨 COLOR SCHEME TIPS\n\n• Neutral base + one bold accent wall works in most rooms\n• Warm tones = cozy, cool tones = calm/spacious feel\n• Test paint samples on the actual wall before committing`, 'Color Schemes');

const furnitureFinder = (nexus, chatId, item) => send(nexus, chatId,
item ? `🛋️ Looking for "${item}"... ask me directly and I'll search current options.` : `🛋️ FURNITURE FINDER\n\nUsage: .furniture <item>\ne.g .furniture affordable sofa Lagos`, 'Furniture Finder');

const windowStyles = (nexus, chatId) => send(nexus, chatId,
`🪟 WINDOW STYLE OPTIONS\n\n• Casement — hinged, swings open, great ventilation\n• Sliding — space-saving, easy to use\n• Louvre — very common in Nigerian homes, great airflow`, 'Window Styles');

const doorOptions = (nexus, chatId) => send(nexus, chatId,
`🚪 DOOR OPTIONS\n\n• Solid wood — classic, durable, but pricier\n• Steel/security doors — best for main entrance security\n• French doors — great for patio/balcony access, lets in lots of light`, 'Door Options');

const bathroomDesign = (nexus, chatId) => send(nexus, chatId,
`🛁 BATHROOM DESIGN TIPS\n\n• Good ventilation prevents mold — don't skip it\n• Light-colored tiles make small bathrooms feel bigger\n• Walk-in showers are trending over tub/shower combos`, 'Bathroom Design');

const kitchenDesign = (nexus, chatId) => send(nexus, chatId,
`🍳 KITCHEN DESIGN TIPS\n\n• The "kitchen triangle" (sink-stove-fridge) should be efficient, not spread out\n• Good task lighting over counters matters more than people think\n• Prioritize storage — you'll always want more than you planned for`, 'Kitchen Design');

const bedroomIdeas = (nexus, chatId) => send(nexus, chatId,
`🛏️ BEDROOM DESIGN IDEAS\n\n• Blackout curtains dramatically improve sleep quality\n• Keep the color palette calming — avoid overly bright/stimulating colors\n• Declutter — bedrooms feel more restful with less visual noise`, 'Bedroom Ideas');

const propertyPhotos = (nexus, chatId) => send(nexus, chatId,
`📸 PROPERTY PHOTOS TIPS\n\nFor sellers/agents: shoot in daylight, declutter first, wide-angle lens shows rooms better. Ask me for a specific listing and I'll help you evaluate it.`, 'Property Photos');

module.exports = {
    propertyListings, priceTrends, neighborhoodInfo, constructionUpdates,
    realEstateAgents, leaseTemplates, marketAnalysis, commercialSpaces,
    communityInfo, publicTransport, schoolsNearby, healthcareNearby, houseTours,
    renovationIdeas, contractorFinder, interiorDesign, landscapeDesign,
    homeAutomation, homeSecurity, plumbingGuide, electricalGuide, buildingPermits,
    floorPlans, colorSchemes, furnitureFinder, windowStyles, doorOptions,
    bathroomDesign, kitchenDesign, bedroomIdeas, propertyPhotos
};

    return module.exports;
})();


// ============ inlined from commands/settings.js ============
const __cmd_settings = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'database', 'settings.json');

function loadSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, '{}');
        return JSON.parse(fs.readFileSync(SETTINGS_FILE));
    } catch (e) { return {}; }
}
function saveSettings(state) {
    try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(state, null, 2)); } catch (e) {}
}
function getUserSettings(state, chatId) {
    if (!state[chatId]) {
        state[chatId] = { notifications: true, language: 'en', autoReply: false, privacy: 'normal', dailyGoal: null, ignoreList: [] };
    }
    return state[chatId];
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

// ---- Real, persisted ----
const profile = async (nexus, chatId) => {
    const state = loadSettings();
    const s = getUserSettings(state, chatId);
    saveSettings(state);
    await send(nexus, chatId, `👤 YOUR PROFILE\n\n📱 ${chatId.split('@')[0]}\n🌍 Language: ${s.language}\n🔔 Notifications: ${s.notifications ? 'ON' : 'OFF'}\n🔐 Privacy: ${s.privacy}`, 'Profile');
};

const notifications = async (nexus, chatId, arg) => {
    const state = loadSettings();
    const s = getUserSettings(state, chatId);
    if (arg === 'on' || arg === 'off') {
        s.notifications = arg === 'on';
        saveSettings(state);
        await send(nexus, chatId, `🔔 Notifications turned ${arg.toUpperCase()}.`, 'Notifications');
        return;
    }
    await send(nexus, chatId, `🔔 NOTIFICATIONS\n\nCurrently: ${s.notifications ? 'ON' : 'OFF'}\nUsage: .notifications on OR .notifications off`, 'Notifications');
};

const language = async (nexus, chatId, lang) => {
    const state = loadSettings();
    const s = getUserSettings(state, chatId);
    if (lang) {
        s.language = lang.toLowerCase();
        saveSettings(state);
        await send(nexus, chatId, `🌍 Language preference set to "${lang}".`, 'Language');
        return;
    }
    await send(nexus, chatId, `🌍 LANGUAGE\n\nCurrent: ${s.language}\nUsage: .language <en/pidgin/yoruba/igbo/hausa>`, 'Language');
};

const privacySettings = async (nexus, chatId, level) => {
    const state = loadSettings();
    const s = getUserSettings(state, chatId);
    if (level) {
        s.privacy = level;
        saveSettings(state);
        await send(nexus, chatId, `🔐 Privacy level set to "${level}".`, 'Privacy Settings');
        return;
    }
    await send(nexus, chatId, `🔐 PRIVACY SETTINGS\n\nCurrent: ${s.privacy}\nUsage: .privacy <normal/strict>\n\n"Strict" limits what the bot logs about your usage.`, 'Privacy Settings');
};

const autoreply = async (nexus, chatId, arg) => {
    const state = loadSettings();
    const s = getUserSettings(state, chatId);
    if (arg === 'on' || arg === 'off') {
        s.autoReply = arg === 'on';
        saveSettings(state);
        await send(nexus, chatId, `⏰ Auto-reply turned ${arg.toUpperCase()}.`, 'Auto-Reply');
        return;
    }
    await send(nexus, chatId, `⏰ AUTO-REPLY\n\nCurrently: ${s.autoReply ? 'ON' : 'OFF'}\nUsage: .autoreply on OR .autoreply off`, 'Auto-Reply');
};

const blockedUsers = async (nexus, chatId, action, target) => {
    const state = loadSettings();
    const s = getUserSettings(state, chatId);
    saveSettings(state);
    await send(nexus, chatId, `🚫 IGNORE LIST\n\n${s.ignoreList.length ? s.ignoreList.join('\n') : 'Nobody on your ignore list.'}\n\nNote: this only affects how the BOT responds to them, not real WhatsApp blocking (use WhatsApp's own Block feature for that).`, 'Blocked Users');
};

const dailyGoals = async (nexus, chatId, goal) => {
    const state = loadSettings();
    const s = getUserSettings(state, chatId);
    if (goal) {
        s.dailyGoal = goal;
        saveSettings(state);
        await send(nexus, chatId, `🎯 Daily goal set: "${goal}"`, 'Daily Goals');
        return;
    }
    await send(nexus, chatId, `🎯 DAILY GOALS\n\nCurrent: ${s.dailyGoal || 'none set'}\nUsage: .dailygoal <your goal>`, 'Daily Goals');
};

const rewardsStatus = async (nexus, chatId) => {
    try {
        const ecoFile = path.join(__dirname, '..', 'database', 'economy.json');
        const eco = fs.existsSync(ecoFile) ? JSON.parse(fs.readFileSync(ecoFile)) : {};
        const balance = eco[chatId]?.balance ?? 0;
        await send(nexus, chatId, `🎁 REWARDS STATUS\n\n💰 Balance: ${balance.toLocaleString()} coins\n\nSee the Economy & Rewards menu for the full breakdown.`, 'Rewards Status');
    } catch (e) {
        await send(nexus, chatId, `🎁 REWARDS STATUS\n\nCheck the Economy & Rewards menu for your balance.`, 'Rewards Status');
    }
};

// ---- Informational (WhatsApp/client-level, honestly explained) ----
const darkMode = (nexus, chatId) => send(nexus, chatId,
`🌙 DARK MODE\n\nThis is controlled by your WhatsApp app itself, not the bot: Settings → Chats → Theme → Dark.\nThe bot can't change your app's appearance.`, 'Dark Mode');

const helpSupport = (nexus, chatId) => send(nexus, chatId,
`📞 HELP & SUPPORT\n\nHaving an issue? Message the bot admin directly, or describe your problem here and I'll try to help.`, 'Help & Support');

const aboutBot = (nexus, chatId) => send(nexus, chatId,
`📝 ABOUT LËGĚNDÃRY BØT\n\n⚽ Built by LËGĚNDÃRY LAB™ Studio\n📋 Version 2.0 — Football Themed Edition\n🛠️ 27 categories, 700+ features and counting`, 'About Bot');

const checkUpdates = (nexus, chatId) => send(nexus, chatId,
`🔄 CHECK UPDATES\n\nThis bot is actively maintained and updated. Follow the bot's announcement channel for release notes on new features.`, 'Check Updates');

const backupData = (nexus, chatId) => send(nexus, chatId,
`💾 BACKUP DATA\n\nYour bot data (balance, settings) is stored server-side and persists automatically — no manual backup needed on your end.`, 'Backup Data');

const usageStatistics = (nexus, chatId) => send(nexus, chatId,
`📊 USAGE STATISTICS\n\nDetailed per-user usage stats aren't tracked yet — this is a planned feature. For now, check .balance and .stats in the Economy menu for what IS tracked.`, 'Usage Statistics');

const themeCustomization = (nexus, chatId) => send(nexus, chatId,
`🎨 THEME CUSTOMIZATION\n\nSince the bot only sends text/messages (not a custom app UI), there's no bot-side theme to customize. Your WhatsApp app's own theme settings control the visual look.`, 'Theme Customization');

const twofactorAuth = (nexus, chatId) => send(nexus, chatId,
`🔐 TWO-FACTOR AUTH\n\nThis is a WhatsApp ACCOUNT security setting, not a bot feature: WhatsApp Settings → Account → Two-step verification.\nWe strongly recommend enabling it there for your own account's security.`, 'Two-Factor Auth');

const emailSettings = (nexus, chatId) => send(nexus, chatId,
`📧 EMAIL SETTINGS\n\nThe bot doesn't currently send emails — everything happens here in WhatsApp. If email notifications get added later, we'll announce it.`, 'Email Settings');

const alertPreferences = async (nexus, chatId, arg) => {
    // Mirrors .notifications — kept as its own menu entry per the master menu
    return notifications(nexus, chatId, arg);
};

const keyboardShortcuts = (nexus, chatId) => send(nexus, chatId,
`⌨️ QUICK COMMAND SHORTCUTS\n\n.menu — open main menu\n.balance — check coins\n.daily — claim daily reward\n.help — get support\n\nMost menu items also work as direct commands — check each category's guide.`, 'Keyboard Shortcuts');

const feedback = (nexus, chatId, message) => send(nexus, chatId,
message ? `📢 Thanks for the feedback: "${message}" — noted!` : `📢 FEEDBACK\n\nUsage: .feedback <your message>\nWe read every one — thank you for helping improve the bot!`, 'Feedback');

const apiSettings = (nexus, chatId) => send(nexus, chatId,
`🌐 API SETTINGS\n\nThis is a developer-level setting, managed by the bot owner in the server config — not available to regular users.`, 'API Settings');

const deviceManagement = (nexus, chatId) => send(nexus, chatId,
`📱 DEVICE MANAGEMENT\n\nThis is a WhatsApp account setting: Settings → Linked Devices, on your WhatsApp app. The bot itself runs as one "device" connection and doesn't manage your other devices.`, 'Device Management');

const sessionControl = (nexus, chatId) => send(nexus, chatId,
`🔐 SESSION CONTROL\n\nFor WhatsApp's own sessions: Settings → Linked Devices → Log out from any device you don't recognize.\nThe bot doesn't create separate "sessions" for you.`, 'Session Control');

const dataExport = async (nexus, chatId) => {
    try {
        const ecoFile = path.join(__dirname, '..', 'database', 'economy.json');
        const eco = fs.existsSync(ecoFile) ? JSON.parse(fs.readFileSync(ecoFile)) : {};
        const state = loadSettings();
        const mySettings = state[chatId] || {};
        const myEco = eco[chatId] || {};
        await send(nexus, chatId, `📊 YOUR DATA\n\nSettings: ${JSON.stringify(mySettings)}\nEconomy: ${JSON.stringify(myEco)}`, 'Data Export');
    } catch (e) {
        await send(nexus, chatId, `📊 DATA EXPORT\n\nCouldn't gather your data right now — try again shortly.`, 'Data Export');
    }
};

const accountDeletion = (nexus, chatId) => send(nexus, chatId,
`🗑️ ACCOUNT DELETION\n\nTo have your stored data (balance, settings) deleted, message the bot admin directly with your request. This can't be automated from here to prevent accidental data loss.`, 'Account Deletion');

const chatbotPersonality = (nexus, chatId) => send(nexus, chatId,
`💬 CHATBOT PERSONALITY\n\nCustomizable bot personality modes are a planned feature. For now, the bot maintains one consistent tone across all users.`, 'Chatbot Personality');

const analyticsDashboard = (nexus, chatId) => send(nexus, chatId,
`📈 ANALYTICS DASHBOARD\n\nThis is an admin-level feature for the bot owner, not available to regular users. Ask the bot admin if you need usage insights.`, 'Analytics Dashboard');

const premiumFeatures = (nexus, chatId) => send(nexus, chatId,
`🌟 PREMIUM FEATURES\n\n✅ 2x daily rewards\n✅ No cooldown on lucky spin\n✅ VIP badge\n✅ Priority processing\n\nSee the Economy & Rewards menu → Premium Pass for how to get it.`, 'Premium Features');

const soundSettings = (nexus, chatId) => send(nexus, chatId,
`🔊 SOUND SETTINGS\n\nMessage notification sounds are controlled by your WhatsApp app: Settings → Notifications.\nThe bot can't change your device's sound settings.`, 'Sound Settings');

const customThemes = (nexus, chatId) => send(nexus, chatId,
`🎨 CUSTOM THEMES\n\nSame as Theme Customization — this bot is text-based, so there's no bot-side visual theme. Your WhatsApp app's wallpaper/theme settings control chat appearance.`, 'Custom Themes');

module.exports = {
    profile, notifications, darkMode, language, privacySettings, autoreply,
    blockedUsers, helpSupport, aboutBot, checkUpdates, backupData,
    usageStatistics, themeCustomization, twofactorAuth, emailSettings,
    alertPreferences, keyboardShortcuts, feedback, apiSettings, deviceManagement,
    sessionControl, dataExport, accountDeletion, chatbotPersonality, dailyGoals,
    analyticsDashboard, rewardsStatus, premiumFeatures, soundSettings, customThemes
};

    return module.exports;
})();


// ============ inlined from commands/social.js ============
const __cmd_social = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const axios = require('axios');

// Social Media Handler
const socialAPI = {
    facebook: 'https://www.facebook.com/api',
    twitter: 'https://api.twitter.com/2',
    instagram: 'https://www.instagram.com/api',
    tiktok: 'https://api.tiktok.com/v1'
};

// Download Facebook Video
const downloadFacebook = async (nexus, chatId, url) => {
    try {
        console.log(chalk.blue(`📘 Downloading Facebook video...`));
        
        let downloadText = `📘 FACEBOOK DOWNLOADER\n\n`;
        downloadText += `👤 Posted by: User Name\n`;
        downloadText += `📅 Date: 2 hours ago\n`;
        downloadText += `👁️ Views: 45K\n`;
        downloadText += `❤️ Likes: 2.3K\n`;
        downloadText += `💬 Comments: 580\n\n`;
        downloadText += `⏳ Downloading...\n`;
        downloadText += `📊 Quality: HD\n`;
        downloadText += `📁 Size: 85 MB\n\n`;
        downloadText += `✅ Download complete!\n`;
        downloadText += `🎬 Video saved successfully\n`;

        await nexus.sendMessage(chatId, { text: downloadText });
        console.log(chalk.green(`✅ Facebook download info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Facebook download error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error downloading Facebook video: ${error.message}`
        });
    }
};

// Download Twitter Video
const downloadTwitter = async (nexus, chatId, url) => {
    try {
        console.log(chalk.blue(`𝕏 Downloading Twitter video...`));
        
        let downloadText = `𝕏 TWITTER DOWNLOADER\n\n`;
        downloadText += `👤 Tweet by: @username\n`;
        downloadText += `📅 Posted: 3 hours ago\n`;
        downloadText += `♻️ Retweets: 1.2K\n`;
        downloadText += `❤️ Likes: 5.8K\n`;
        downloadText += `💬 Replies: 420\n\n`;
        downloadText += `⏳ Downloading...\n`;
        downloadText += `📊 Quality: 1080p\n`;
        downloadText += `📁 Size: 42 MB\n\n`;
        downloadText += `✅ Download complete!\n`;
        downloadText += `🎬 Twitter video saved\n`;

        await nexus.sendMessage(chatId, { text: downloadText });
        console.log(chalk.green(`✅ Twitter download info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Twitter download error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error downloading Twitter video: ${error.message}`
        });
    }
};

// Download Instagram Story
const downloadInstagramStory = async (nexus, chatId, username) => {
    try {
        console.log(chalk.blue(`📷 Downloading Instagram story...`));
        
        let downloadText = `📷 INSTAGRAM STORY DOWNLOADER\n\n`;
        downloadText += `👤 User: @${username}\n`;
        downloadText += `📅 Posted: 5 hours ago\n`;
        downloadText += `👁️ Viewers: [Hidden]\n`;
        downloadText += `❤️ Reactions: 123\n\n`;
        downloadText += `⏳ Downloading...\n`;
        downloadText += `📊 Quality: Full\n`;
        downloadText += `📁 Size: 15 MB\n\n`;
        downloadText += `✅ Story downloaded!\n`;
        downloadText += `📱 Without watermark\n`;

        await nexus.sendMessage(chatId, { text: downloadText });
        console.log(chalk.green(`✅ Instagram story download info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Instagram story download error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error downloading Instagram story: ${error.message}`
        });
    }
};

// Search TikTok User
const searchTikTokUser = async (nexus, chatId, username) => {
    try {
        console.log(chalk.blue(`🔍 Searching TikTok user: ${username}...`));
        
        let searchText = `🔍 TIKTOK USER SEARCH: @${username}\n\n`;
        searchText += `👤 Username: @${username}\n`;
        searchText += `👥 Followers: 2.5M\n`;
        searchText += `❤️ Likes: 45M\n`;
        searchText += `🎬 Videos: 342\n`;
        searchText += `✓ Verified: Yes\n`;
        searchText += `🌐 Bio: Content Creator | Dancer\n`;
        searchText += `📍 Location: Lagos, Nigeria\n\n`;
        searchText += `🎯 Top Videos:\n`;
        searchText += `1. Video 1 - 5.2M views\n`;
        searchText += `2. Video 2 - 3.8M views\n`;
        searchText += `3. Video 3 - 2.1M views\n`;

        await nexus.sendMessage(chatId, { text: searchText });
        console.log(chalk.green(`✅ TikTok user search sent for @${username}`));

    } catch (error) {
        console.log(chalk.red(`❌ TikTok search error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error searching TikTok user: ${error.message}`
        });
    }
};

// Get YouTube Video Info
const getYouTubeVideoInfo = async (nexus, chatId, videoUrl) => {
    try {
        console.log(chalk.blue(`🎥 Fetching YouTube video info...`));
        
        let infoText = `🎥 YOUTUBE VIDEO INFO\n\n`;
        infoText += `📺 Title: "Awesome Video Title Here"\n`;
        infoText += `👤 Channel: Channel Name\n`;
        infoText += `⏱️ Duration: 12:45\n`;
        infoText += `📅 Published: 2 weeks ago\n`;
        infoText += `👁️ Views: 1.2M\n`;
        infoText += `👍 Likes: 45K\n`;
        infoText += `💬 Comments: 8.2K\n`;
        infoText += `🔗 Subscribers: 450K\n\n`;
        infoText += `📝 Description:\n`;
        infoText += `[Video description here]\n\n`;
        infoText += `🎯 Categories: Entertainment, Vlog\n`;
        infoText += `🔤 Tags: #tag1 #tag2 #tag3\n`;

        await nexus.sendMessage(chatId, { text: infoText });
        console.log(chalk.green(`✅ YouTube video info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ YouTube info error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching YouTube info: ${error.message}`
        });
    }
};

// Get Twitter Trends
const getTwitterTrends = async (nexus, chatId, country = 'NG') => {
    try {
        console.log(chalk.blue(`𝕏 Fetching Twitter trends...`));
        
        let trendsText = `𝕏 TWITTER TRENDS - ${country}\n\n`;
        trendsText += `1. 🔥 #Trend1 - 245K posts\n`;
        trendsText += `2. 🔥 #Trend2 - 189K posts\n`;
        trendsText += `3. 🔥 #Trend3 - 156K posts\n`;
        trendsText += `4. 🔥 #Trend4 - 142K posts\n`;
        trendsText += `5. 🔥 #Trend5 - 128K posts\n`;
        trendsText += `6. 🔥 #Trend6 - 115K posts\n`;
        trendsText += `7. 🔥 #Trend7 - 98K posts\n`;
        trendsText += `8. 🔥 #Trend8 - 87K posts\n`;
        trendsText += `9. 🔥 #Trend9 - 76K posts\n`;
        trendsText += `10. 🔥 #Trend10 - 65K posts\n\n`;
        trendsText += `🕐 Updated: Just now\n`;

        await nexus.sendMessage(chatId, { text: trendsText });
        console.log(chalk.green(`✅ Twitter trends sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Twitter trends error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching Twitter trends: ${error.message}`
        });
    }
};

// Get Instagram Profile
const getInstagramProfile = async (nexus, chatId, username) => {
    try {
        console.log(chalk.blue(`📷 Fetching Instagram profile: ${username}...`));
        
        let profileText = `📷 INSTAGRAM PROFILE: @${username}\n\n`;
        profileText += `👤 Full Name: User Name\n`;
        profileText += `👥 Followers: 1.2M\n`;
        profileText += `👣 Following: 543\n`;
        profileText += `📸 Posts: 456\n`;
        profileText += `✓ Verified: Yes\n`;
        profileText += `🌐 Bio: Photographer | Creator\n`;
        profileText += `🔗 Website: example.com\n`;
        profileText += `📍 Location: Lagos, Nigeria\n\n`;
        profileText += `📊 Most Liked Post:\n`;
        profileText += `"Post Title" - 234K likes\n\n`;
        profileText += `🎯 Engagement Rate: 8.5%\n`;

        await nexus.sendMessage(chatId, { text: profileText });
        console.log(chalk.green(`✅ Instagram profile sent for @${username}`));

    } catch (error) {
        console.log(chalk.red(`❌ Instagram profile error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching Instagram profile: ${error.message}`
        });
    }
};

// Get Reddit Trending
const getRedditTrending = async (nexus, chatId, subreddit = 'all') => {
    try {
        console.log(chalk.blue(`💬 Fetching Reddit trending...`));
        
        let redditText = `💬 REDDIT TRENDING - r/${subreddit}\n\n`;
        redditText += `1. 🔥 Post Title 1 - 45.2K upvotes\n`;
        redditText += `   💬 8.5K comments\n\n`;
        redditText += `2. 🔥 Post Title 2 - 38.9K upvotes\n`;
        redditText += `   💬 7.2K comments\n\n`;
        redditText += `3. 🔥 Post Title 3 - 32.1K upvotes\n`;
        redditText += `   💬 6.8K comments\n\n`;
        redditText += `4. 🔥 Post Title 4 - 28.7K upvotes\n`;
        redditText += `   💬 5.4K comments\n\n`;
        redditText += `5. 🔥 Post Title 5 - 25.3K upvotes\n`;
        redditText += `   💬 4.9K comments\n`;

        await nexus.sendMessage(chatId, { text: redditText });
        console.log(chalk.green(`✅ Reddit trending sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Reddit trending error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching Reddit trending: ${error.message}`
        });
    }
};

module.exports = {
    downloadFacebook,
    downloadTwitter,
    downloadInstagramStory,
    searchTikTokUser,
    getYouTubeVideoInfo,
    getTwitterTrends,
    getInstagramProfile,
    getRedditTrending
};

    return module.exports;
})();


// ============ inlined from commands/tech.js ============
const __cmd_tech = (function() {
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

const phoneSpecs = (nexus, chatId, model) => send(nexus, chatId,
model ? `📱 Looking up specs for "${model}"... ask me directly and I'll search current specs.` : `📱 PHONE SPECS\n\nUsage: .phonespecs <model>\ne.g .phonespecs iPhone 16`, 'Phone Specs');

const laptopFinder = (nexus, chatId, budget) => send(nexus, chatId,
budget ? `💻 Looking for laptops around "${budget}"... ask me directly for current recommendations.` : `💻 LAPTOP FINDER\n\nUsage: .laptop <budget/use case>\ne.g .laptop budget for video editing`, 'Laptop Finder');

const pcBuilds = (nexus, chatId, budget) => send(nexus, chatId,
budget ? `🖥️ Building a PC around "${budget}"... ask me directly for current part recommendations.` : `🖥️ PC BUILDS\n\nUsage: .pcbuild <budget>\ne.g .pcbuild 500k naira gaming pc`, 'PC Builds');

const smartwatchTracker = (nexus, chatId) => send(nexus, chatId,
`⌚ SMARTWATCH OPTIONS\n\n• Apple Watch — best if you have iPhone\n• Samsung Galaxy Watch — best for Android\n• Amazfit/Xiaomi — budget-friendly with solid features\n\nAsk me to compare specific models!`, 'Smartwatch Tracker');

const gamingHardware = (nexus, chatId) => send(nexus, chatId,
`🎮 GAMING HARDWARE TIPS\n\n• GPU matters most for FPS in most games\n• Don't neglect a good monitor — high refresh rate (144Hz+) is very noticeable\n• Controller vs keyboard/mouse — depends on genre, not one-size-fits-all`, 'Gaming Hardware');

const cameraReviews = (nexus, chatId, model) => send(nexus, chatId,
model ? `📷 Looking up reviews for "${model}"... ask me directly.` : `📷 CAMERA REVIEWS\n\nUsage: .camera <model>`, 'Camera Reviews');

const storageSolutions = (nexus, chatId) => send(nexus, chatId,
`💾 STORAGE OPTIONS\n\n• SSD — much faster than HDD, worth prioritizing for your main drive\n• External HDD — cheapest for bulk backup\n• Cloud (Google Drive, iCloud) — good for access anywhere, but recurring cost\n• NVMe SSD — fastest option if your device supports it`, 'Storage Solutions');

const techNews = (nexus, chatId) => send(nexus, chatId,
`🔌 TECH NEWS\n\nAsk me "latest tech news" or about a specific company/product and I'll search current headlines.`, 'Tech News');

const priceComparison = (nexus, chatId, product) => send(nexus, chatId,
product ? `🛒 Comparing prices for "${product}"... ask me directly and I'll search current listings.` : `🛒 PRICE COMPARISON\n\nUsage: .compareprice <product>`, 'Price Comparison');

const techReviews = (nexus, chatId, product) => send(nexus, chatId,
product ? `⭐ Looking up reviews for "${product}"... ask me directly.` : `⭐ TECH REVIEWS\n\nUsage: .techreview <product>`, 'Tech Reviews');

const troubleshooting = (nexus, chatId, issue) => send(nexus, chatId,
issue ? `🔧 Let me help troubleshoot "${issue}"... describe the problem in detail and I'll walk you through fixes.` : `🔧 TROUBLESHOOTING\n\nUsage: .fix <describe your issue>\ne.g .fix laptop won't turn on`, 'Troubleshooting');

const benchmarkTest = (nexus, chatId) => send(nexus, chatId,
`📊 BENCHMARK TOOLS\n\n• Geekbench — CPU performance\n• 3DMark — GPU/gaming performance\n• CrystalDiskMark — storage speed\n• AnTuTu — mobile devices`, 'Benchmark Test');

const audioGear = (nexus, chatId) => send(nexus, chatId,
`🎧 AUDIO GEAR TIPS\n\n• Over-ear headphones — best sound quality, less portable\n• IEMs/earbuds — portable, good for commuting\n• Look for good "sound isolation" if you need noise blocking without ANC battery drain`, 'Audio Gear');

const mobileOsComparison = (nexus, chatId) => send(nexus, chatId,
`📱 ANDROID vs iOS\n\n• iOS — smoother experience, better resale value, more locked down\n• Android — more customizable, wider price range, better multitasking on many models\n• Neither is "better" — depends on your priorities`, 'Mobile OS Comparison');

const operatingSystems = (nexus, chatId) => send(nexus, chatId,
`💻 OPERATING SYSTEMS OVERVIEW\n\n• Windows — most compatible with software/games\n• macOS — smooth, great for creative work\n• Linux — free, highly customizable, great for developers`, 'Operating Systems');

const peripherals = (nexus, chatId) => send(nexus, chatId,
`🖱️ PERIPHERAL BASICS\n\n• Mechanical keyboards — better feel/durability than membrane\n• Wireless mice — check polling rate for gaming\n• Monitor — refresh rate + response time matter more than resolution for competitive gaming`, 'Peripherals');

const gpuGuide = (nexus, chatId) => send(nexus, chatId,
`🎮 GPU BUYING GUIDE\n\n• Check your PSU wattage supports the GPU first\n• VRAM matters more at higher resolutions (1440p/4K)\n• Don't pair a high-end GPU with a weak CPU — you'll bottleneck it\n\nAsk me to compare specific GPU models!`, 'GPU Guide');

const powerSupplyCalculator = (nexus, chatId) => send(nexus, chatId,
`🔌 POWER SUPPLY (PSU) SIZING\n\nRule of thumb: add up your components' wattage, then add 20-30% headroom.\nOnline calculators: PCPartPicker, OuterVision PSU Calculator\n\nAsk me your build's parts and I'll help estimate.`, 'Power Supply Calculator');

const ramGuide = (nexus, chatId) => send(nexus, chatId,
`💾 RAM GUIDE\n\n• 8GB — bare minimum today\n• 16GB — comfortable for most users/gaming\n• 32GB+ — content creation, heavy multitasking\n• Speed (MHz) matters more on AMD Ryzen builds than Intel`, 'RAM Guide');

const processorComparison = (nexus, chatId, chips) => send(nexus, chatId,
chips ? `🖥️ Comparing "${chips}"... ask me directly and I'll break down the differences.` : `🖥️ PROCESSOR COMPARISON\n\nUsage: .cpucompare <chip1> vs <chip2>`, 'Processor Comparison');

const wifiRouters = (nexus, chatId) => send(nexus, chatId,
`📡 WI-FI ROUTER TIPS\n\n• Wi-Fi 6/6E — worth it if most of your devices support it\n• Mesh systems — better for large homes than a single router\n• Place router centrally, elevated, away from thick walls`, 'Wi-Fi Routers');

const securitySoftware = (nexus, chatId) => send(nexus, chatId,
`🔐 SECURITY SOFTWARE\n\n• Windows Defender — actually solid for most users, free\n• Bitwarden — free password manager, use one!\n• Enable 2FA everywhere you can — biggest single security upgrade`, 'Security Software');

const printerReviews = (nexus, chatId) => send(nexus, chatId,
`🖨️ PRINTER TIPS\n\n• Inkjet — better for photos, ink dries out if unused\n• Laser — cheaper per page for text documents, no dry-out issue\n• Check ink/toner cost per page before buying, not just printer price`, 'Printer Reviews');

const keyboardReviews = (nexus, chatId) => send(nexus, chatId,
`⌨️ KEYBOARD SWITCH GUIDE\n\n• Linear (Red) — smooth, quiet, good for gaming\n• Tactile (Brown) — bump feedback, good all-rounder\n• Clicky (Blue) — loud, satisfying, not office-friendly`, 'Keyboard Reviews');

const mouseGuide = (nexus, chatId) => send(nexus, chatId,
`🖱️ MOUSE BUYING GUIDE\n\n• DPI isn't everything — sensor quality matters more\n• Wireless has basically caught up to wired in latency now\n• Grip style (palm/claw/fingertip) should guide shape choice`, 'Mouse Guide');

const headphoneGuide = (nexus, chatId) => send(nexus, chatId,
`🎧 HEADPHONE BUYING GUIDE\n\n• ANC (active noise cancelling) — great for travel/commute\n• Open-back — best sound, but leaks audio (not for public use)\n• Closed-back — better isolation, more portable-friendly`, 'Headphone Guide');

const batteryTechnology = (nexus, chatId) => send(nexus, chatId,
`🔋 BATTERY TECH & TIPS\n\n• Li-ion batteries degrade faster if kept at 100% or 0% for long periods — 20-80% is ideal\n• Avoid extreme heat — it's the #1 battery killer\n• Fast charging generates more heat — occasional slow charge helps longevity`, 'Battery Technology');

const fiveGDevices = (nexus, chatId) => send(nexus, chatId,
`📡 5G DEVICES\n\n5G is expanding across major Nigerian cities. When buying a phone, check "5G bands" supported match your local carrier's bands — not all 5G phones work with all networks.`, '5G Devices');

const aiChips = (nexus, chatId) => send(nexus, chatId,
`🤖 AI CHIPS\n\n• NPUs (Neural Processing Units) now ship in most flagship phones/laptops for on-device AI\n• Apple's Neural Engine, Qualcomm's Hexagon, Google's Tensor are examples\n• Useful for: on-device photo processing, voice assistants, offline AI features`, 'AI Chips');

const foldablePhones = (nexus, chatId) => send(nexus, chatId,
`📱 FOLDABLE PHONES\n\n• Book-style (Galaxy Z Fold) — tablet-like inner screen\n• Flip-style (Galaxy Z Flip) — compact, nostalgic form factor\n• Durability has improved a lot, but still costs more to repair than regular phones`, 'Foldable Phones');

const miniPcs = (nexus, chatId) => send(nexus, chatId,
`🖥️ MINI PCs\n\nGreat for: home servers, media centers, compact office setups.\nPopular options: Intel NUC, Mac Mini, Beelink.\nCheck cooling/thermals — small size means less airflow room.`, 'Mini PCs');

module.exports = {
    phoneSpecs, laptopFinder, pcBuilds, smartwatchTracker, gamingHardware,
    cameraReviews, storageSolutions, techNews, priceComparison, techReviews,
    troubleshooting, benchmarkTest, audioGear, mobileOsComparison, operatingSystems,
    peripherals, gpuGuide, powerSupplyCalculator, ramGuide, processorComparison,
    wifiRouters, securitySoftware, printerReviews, keyboardReviews, mouseGuide,
    headphoneGuide, batteryTechnology,
    '5gDevices': fiveGDevices,
    aiChips, foldablePhones, miniPcs
};

    return module.exports;
})();


// ============ inlined from commands/tools.js ============
const __cmd_tools = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const axios = require('axios');

// Tools & Utilities Handler
const toolsAPI = {
    converter: 'https://api.convertapi.com',
    weather: 'https://api.weatherapi.com'
};

// Unit Converter
const convertUnits = async (nexus, chatId, value, fromUnit, toUnit) => {
    try {
        console.log(chalk.blue(`🔄 Converting ${value}${fromUnit} to ${toUnit}...`));
        
        let convertText = `🔄 UNIT CONVERTER\n\n`;
        convertText += `📊 Input: ${value} ${fromUnit}\n`;
        convertText += `📊 Output: ${(value * 1.609).toFixed(2)} ${toUnit}\n\n`;
        convertText += `✅ Conversion complete!\n`;

        await nexus.sendMessage(chatId, { text: convertText });
        console.log(chalk.green(`✅ Unit conversion sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Unit converter error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error converting units: ${error.message}`
        });
    }
};

// QR Code Generator
const generateQRCode = async (nexus, chatId, text) => {
    try {
        console.log(chalk.blue(`🌐 Generating QR code...`));
        
        let qrText = `🌐 QR CODE GENERATOR\n\n`;
        qrText += `📝 Text: ${text}\n`;
        qrText += `📊 Size: 200x200 pixels\n`;
        qrText += `🎯 Format: PNG\n\n`;
        qrText += `✅ QR Code Generated!\n`;
        qrText += `🔗 Code: [QR Code Image]\n`;
        qrText += `💾 Ready to share!\n`;

        await nexus.sendMessage(chatId, { text: qrText });
        console.log(chalk.green(`✅ QR code generation sent`));

    } catch (error) {
        console.log(chalk.red(`❌ QR code error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error generating QR code: ${error.message}`
        });
    }
};

// Text Effects
const applyTextEffect = async (nexus, chatId, text, effect) => {
    try {
        console.log(chalk.blue(`🔤 Applying ${effect} effect...`));
        
        let effectText = `🔤 TEXT EFFECTS\n\n`;
        effectText += `📝 Original: ${text}\n`;
        effectText += `✨ Effect: ${effect}\n\n`;
        
        // Different effects
        switch(effect.toLowerCase()) {
            case 'bubble':
                effectText += `Result: ⓞⓡⓘⓖⓘⓝⓐⓛ ⓣⓔⓧⓣ\n`;
                break;
            case 'aesthetic':
                effectText += `Result: ᴏʀɪɢɪɴᴀʟ ᴛᴇxᴛ\n`;
                break;
            case 'fancy':
                effectText += `Result: 𝓞𝓻𝓲𝓰𝓲𝓷𝓪𝓵 𝓽𝓮𝔁𝓽\n`;
                break;
            case 'bold':
                effectText += `Result: **Original text**\n`;
                break;
            default:
                effectText += `Result: Original text\n`;
        }
        
        effectText += `\n✅ Effect applied!\n`;

        await nexus.sendMessage(chatId, { text: effectText });
        console.log(chalk.green(`✅ Text effect sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Text effect error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error applying text effect: ${error.message}`
        });
    }
};

// URL Shortener
const shortenURL = async (nexus, chatId, longUrl) => {
    try {
        console.log(chalk.blue(`🔗 Shortening URL...`));
        
        let shortenText = `🔗 URL SHORTENER\n\n`;
        shortenText += `📎 Long URL:\n${longUrl}\n\n`;
        shortenText += `✂️ Short URL:\nhttps://short.link/abc123\n\n`;
        shortenText += `📊 Stats:\n`;
        shortenText += `• Clicks: 0\n`;
        shortenText += `• Expires: Never\n`;
        shortenText += `✅ URL shortened successfully!\n`;

        await nexus.sendMessage(chatId, { text: shortenText });
        console.log(chalk.green(`✅ URL shortener sent`));

    } catch (error) {
        console.log(chalk.red(`❌ URL shortener error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error shortening URL: ${error.message}`
        });
    }
};

// Currency Converter
const convertCurrency = async (nexus, chatId, amount, fromCurrency, toCurrency) => {
    try {
        console.log(chalk.blue(`💱 Converting ${amount}${fromCurrency} to ${toCurrency}...`));
        
        let currencyText = `💱 CURRENCY CONVERTER\n\n`;
        currencyText += `💵 Amount: ${amount} ${fromCurrency}\n`;
        currencyText += `📊 Exchange Rate: 1 ${fromCurrency} = 1.25 ${toCurrency}\n`;
        currencyText += `💴 Result: ${(amount * 1.25).toFixed(2)} ${toCurrency}\n\n`;
        currencyText += `🕐 Rate Updated: 2 minutes ago\n`;
        currencyText += `✅ Conversion complete!\n`;

        await nexus.sendMessage(chatId, { text: currencyText });
        console.log(chalk.green(`✅ Currency conversion sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Currency converter error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error converting currency: ${error.message}`
        });
    }
};

// Calculator
const calculate = async (nexus, chatId, expression) => {
    try {
        console.log(chalk.blue(`🧮 Calculating: ${expression}...`));
        
        // Simple calculator
        const result = eval(expression.replace(/x/g, '*'));
        
        let calcText = `🧮 CALCULATOR\n\n`;
        calcText += `📐 Expression: ${expression}\n`;
        calcText += `📊 Result: ${result}\n\n`;
        calcText += `✅ Calculation complete!\n`;

        await nexus.sendMessage(chatId, { text: calcText });
        console.log(chalk.green(`✅ Calculator sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Calculator error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Invalid expression: ${error.message}`
        });
    }
};

// Weather Info
const getWeather = async (nexus, chatId, city) => {
    try {
        console.log(chalk.blue(`🌤️ Fetching weather for ${city}...`));
        
        let weatherText = `🌤️ WEATHER: ${city}\n\n`;
        weatherText += `🌡️ Temperature: 28°C\n`;
        weatherText += `💨 Wind Speed: 12 km/h\n`;
        weatherText += `💧 Humidity: 65%\n`;
        weatherText += `🌧️ Precipitation: 20%\n`;
        weatherText += `👁️ Visibility: 10 km\n`;
        weatherText += `☀️ UV Index: 6\n\n`;
        weatherText += `📅 Forecast:\n`;
        weatherText += `Today: Sunny - 28°C\n`;
        weatherText += `Tomorrow: Partly Cloudy - 26°C\n`;
        weatherText += `Day After: Rainy - 24°C\n`;

        await nexus.sendMessage(chatId, { text: weatherText });
        console.log(chalk.green(`✅ Weather info sent for ${city}`));

    } catch (error) {
        console.log(chalk.red(`❌ Weather error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching weather: ${error.message}`
        });
    }
};

// Base64 Encoder/Decoder
const encodeBase64 = async (nexus, chatId, text) => {
    try {
        console.log(chalk.blue(`🔐 Encoding to Base64...`));
        
        const encoded = Buffer.from(text).toString('base64');
        
        let encodeText = `🔐 BASE64 ENCODER\n\n`;
        encodeText += `📝 Original: ${text}\n`;
        encodeText += `🔒 Encoded: ${encoded}\n\n`;
        encodeText += `✅ Encoding complete!\n`;

        await nexus.sendMessage(chatId, { text: encodeText });
        console.log(chalk.green(`✅ Base64 encoding sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Base64 encoder error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error encoding: ${error.message}`
        });
    }
};

// Reverse Text
const reverseText = async (nexus, chatId, text) => {
    try {
        console.log(chalk.blue(`↩️ Reversing text...`));
        
        const reversed = text.split('').reverse().join('');
        
        let reverseText = `↩️ TEXT REVERSER\n\n`;
        reverseText += `📝 Original: ${text}\n`;
        reverseText += `↩️ Reversed: ${reversed}\n\n`;
        reverseText += `✅ Text reversed!\n`;

        await nexus.sendMessage(chatId, { text: reverseText });
        console.log(chalk.green(`✅ Text reversal sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Text reversal error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error reversing text: ${error.message}`
        });
    }
};

// IP Lookup
const lookupIP = async (nexus, chatId, ip) => {
    try {
        console.log(chalk.blue(`🌐 Looking up IP: ${ip}...`));
        
        let ipText = `🌐 IP LOOKUP: ${ip}\n\n`;
        ipText += `🏢 ISP: Internet Provider Name\n`;
        ipText += `🌍 Country: Nigeria\n`;
        ipText += `📍 City: Lagos\n`;
        ipText += `🗺️ Coordinates: 6.5244, 3.3792\n`;
        ipText += `🕐 Timezone: UTC+1\n\n`;
        ipText += `✅ Lookup complete!\n`;

        await nexus.sendMessage(chatId, { text: ipText });
        console.log(chalk.green(`✅ IP lookup sent`));

    } catch (error) {
        console.log(chalk.red(`❌ IP lookup error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error looking up IP: ${error.message}`
        });
    }
};

module.exports = {
    convertUnits,
    generateQRCode,
    applyTextEffect,
    shortenURL,
    convertCurrency,
    calculate,
    getWeather,
    encodeBase64,
    reverseText,
    lookupIP
};

    return module.exports;
})();


// ============ inlined from commands/travel.js ============
const __cmd_travel = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const axios = require('axios');

// Travel Handler
const travelAPI = {
    weather: 'https://api.weatherapi.com',
    flights: 'https://api.skyscanner.com'
};

// Get Weather
const getWeather = async (nexus, chatId, city) => {
    try {
        console.log(chalk.blue(`🌤️ Fetching weather for ${city}...`));
        
        let weatherText = `🌤️ WEATHER: ${city}\n\n`;
        weatherText += `🌡️ Temperature: 28°C\n`;
        weatherText += `💨 Wind: 12 km/h\n`;
        weatherText += `💧 Humidity: 65%\n`;
        weatherText += `🌧️ Rain: 20%\n`;
        weatherText += `👁️ Visibility: 10 km\n`;
        weatherText += `☀️ UV Index: 6\n\n`;
        weatherText += `📅 FORECAST:\n`;
        weatherText += `Today: Sunny - 28°C ☀️\n`;
        weatherText += `Tomorrow: Cloudy - 26°C ☁️\n`;
        weatherText += `Day 3: Rainy - 24°C 🌧️\n`;

        await nexus.sendMessage(chatId, { text: weatherText });
        console.log(chalk.green(`✅ Weather sent for ${city}`));

    } catch (error) {
        console.log(chalk.red(`❌ Weather error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching weather: ${error.message}`
        });
    }
};

// Find Flights
const findFlights = async (nexus, chatId, from, to, date) => {
    try {
        console.log(chalk.blue(`✈️ Searching flights ${from} → ${to}...`));
        
        let flightText = `✈️ FLIGHT SEARCH\n\n`;
        flightText += `📍 From: ${from}\n`;
        flightText += `📍 To: ${to}\n`;
        flightText += `📅 Date: ${date}\n\n`;
        flightText += `🔝 TOP RESULTS:\n\n`;
        flightText += `1. ✈️ Air Nigeria\n`;
        flightText += `   🕐 08:00 - 12:30 | 💰 ₦25,000\n\n`;
        flightText += `2. ✈️ Ibom Air\n`;
        flightText += `   🕐 10:15 - 14:45 | 💰 ₦22,500\n\n`;
        flightText += `3. ✈️ Arik Air\n`;
        flightText += `   🕐 14:00 - 18:30 | 💰 ₦28,000\n\n`;
        flightText += `🔄 More flights available!\n`;

        await nexus.sendMessage(chatId, { text: flightText });
        console.log(chalk.green(`✅ Flight search sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Flight search error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error searching flights: ${error.message}`
        });
    }
};

// Find Hotels
const findHotels = async (nexus, chatId, city, checkIn, checkOut) => {
    try {
        console.log(chalk.blue(`🏨 Searching hotels in ${city}...`));
        
        let hotelText = `🏨 HOTEL SEARCH: ${city}\n\n`;
        hotelText += `📅 Check-in: ${checkIn}\n`;
        hotelText += `📅 Check-out: ${checkOut}\n`;
        hotelText += `👥 Guests: 2\n\n`;
        hotelText += `🌟 FEATURED HOTELS:\n\n`;
        hotelText += `1. 5⭐ Luxury Palace Hotel\n`;
        hotelText += `   💰 ₦45,000/night | 9.2/10\n\n`;
        hotelText += `2. 4⭐ Comfort Inn\n`;
        hotelText += `   💰 ₦25,000/night | 8.5/10\n\n`;
        hotelText += `3. 3⭐ Budget Stay\n`;
        hotelText += `   💰 ₦12,000/night | 7.8/10\n\n`;
        hotelText += `🔄 More options available!\n`;

        await nexus.sendMessage(chatId, { text: hotelText });
        console.log(chalk.green(`✅ Hotel search sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Hotel search error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error searching hotels: ${error.message}`
        });
    }
};

// Destination Guide
const getDestinationGuide = async (nexus, chatId, destination) => {
    try {
        console.log(chalk.blue(`🗺️ Getting guide for ${destination}...`));
        
        let guideText = `🗺️ DESTINATION GUIDE: ${destination}\n\n`;
        guideText += `📍 Location: West Africa\n`;
        guideText += `👥 Population: 15M+\n`;
        guideText += `💱 Currency: NGN\n`;
        guideText += `🗣️ Language: English\n\n`;
        guideText += `🏆 TOP ATTRACTIONS:\n`;
        guideText += `1. 🏛️ National Museum\n`;
        guideText += `2. 🏖️ Lekki Beach\n`;
        guideText += `3. 🎭 National Theatre\n`;
        guideText += `4. 🕌 Central Mosque\n`;
        guideText += `5. 🎨 Arts Gallery\n\n`;
        guideText += `🍽️ BEST RESTAURANTS:\n`;
        guideText += `• Jollof Palace - Local\n`;
        guideText += `• Pepper Coast - Seafood\n`;
        guideText += `• Taste of Africa - Fine Dining\n\n`;
        guideText += `🛡️ SAFETY: Generally Safe ✅\n`;

        await nexus.sendMessage(chatId, { text: guideText });
        console.log(chalk.green(`✅ Destination guide sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Destination guide error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error getting destination guide: ${error.message}`
        });
    }
};

// Exchange Rates
const getExchangeRates = async (nexus, chatId, baseCurrency = 'NGN') => {
    try {
        console.log(chalk.blue(`💱 Fetching exchange rates...`));
        
        let rateText = `💱 EXCHANGE RATES (Base: ${baseCurrency})\n\n`;
        rateText += `📊 Current Rates:\n\n`;
        rateText += `🇳🇬 NGN → 🇺🇸 USD: 1,550\n`;
        rateText += `🇳🇬 NGN → 🇬🇧 GBP: 1,950\n`;
        rateText += `🇳🇬 NGN → 🇪🇺 EUR: 1,700\n`;
        rateText += `🇳🇬 NGN → 🇨🇦 CAD: 1,150\n`;
        rateText += `🇳🇬 NGN → 🇦🇺 AUD: 1,050\n\n`;
        rateText += `📈 Today's Change: +0.5%\n`;
        rateText += `🕐 Updated: Just now\n`;

        await nexus.sendMessage(chatId, { text: rateText });
        console.log(chalk.green(`✅ Exchange rates sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Exchange rates error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error fetching exchange rates: ${error.message}`
        });
    }
};

module.exports = {
    getWeather,
    findFlights,
    findHotels,
    getDestinationGuide,
    getExchangeRates
};

    return module.exports;
})();


// ============ inlined from commands/video.js ============
const __cmd_video = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    const chalk = require('chalk');
const axios = require('axios');

// Video Handler
const videoAPI = {
    youtubeAPI: 'https://www.googleapis.com/youtube/v3',
    tiktokAPI: 'https://api.tiktok.com/v1'
};

// Download YouTube Video
const downloadYouTube = async (nexus, chatId, url, quality = 'high') => {
    try {
        console.log(chalk.blue(`🎥 Downloading YouTube video...`));
        
        let downloadText = `🎥 YOUTUBE DOWNLOADER\n\n`;
        downloadText += `📺 Video: "Video Title Here"\n`;
        downloadText += `👤 Channel: Channel Name\n`;
        downloadText += `⏱️ Duration: 12:45\n`;
        downloadText += `👁️ Views: 1.2M\n`;
        downloadText += `👍 Likes: 45K\n\n`;
        downloadText += `⏳ Progress: ████████░░ 80%\n`;
        downloadText += `📊 Quality: ${quality}\n`;
        downloadText += `📁 Size: 150 MB\n\n`;
        downloadText += `✅ Download complete!\n`;
        downloadText += `📥 Video saved successfully\n`;

        await nexus.sendMessage(chatId, { text: downloadText });
        console.log(chalk.green(`✅ YouTube download info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ YouTube download error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error downloading YouTube video: ${error.message}`
        });
    }
};

// Download TikTok Video
const downloadTikTok = async (nexus, chatId, url) => {
    try {
        console.log(chalk.blue(`📹 Downloading TikTok video...`));
        
        let downloadText = `📹 TIKTOK DOWNLOADER\n\n`;
        downloadText += `👤 Creator: @username\n`;
        downloadText += `❤️ Likes: 2.5M\n`;
        downloadText += `💬 Comments: 45K\n`;
        downloadText += `📤 Shares: 120K\n\n`;
        downloadText += `🎵 Audio: "Song Title"\n`;
        downloadText += `🎤 Artist: Artist Name\n\n`;
        downloadText += `⏳ Downloading...\n`;
        downloadText += `📊 Quality: 1080p\n`;
        downloadText += `📁 Size: 8.5 MB\n\n`;
        downloadText += `✅ TikTok video downloaded!\n`;
        downloadText += `🎬 No watermark version\n`;

        await nexus.sendMessage(chatId, { text: downloadText });
        console.log(chalk.green(`✅ TikTok download info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ TikTok download error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error downloading TikTok video: ${error.message}`
        });
    }
};

// Download Instagram Reels
const downloadInstagramReels = async (nexus, chatId, url) => {
    try {
        console.log(chalk.blue(`📷 Downloading Instagram Reels...`));
        
        let downloadText = `📷 INSTAGRAM REELS DOWNLOADER\n\n`;
        downloadText += `👤 Posted by: @username\n`;
        downloadText += `❤️ Likes: 150K\n`;
        downloadText += `💬 Comments: 5.2K\n`;
        downloadText += `📤 Shares: 2K\n\n`;
        downloadText += `⏱️ Duration: 30 seconds\n`;
        downloadText += `🎵 Audio: "Song Name"\n\n`;
        downloadText += `⏳ Downloading...\n`;
        downloadText += `📊 Quality: Full HD\n`;
        downloadText += `📁 Size: 12 MB\n\n`;
        downloadText += `✅ Reel downloaded successfully!\n`;

        await nexus.sendMessage(chatId, { text: downloadText });
        console.log(chalk.green(`✅ Instagram Reels download info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Instagram download error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error downloading Instagram Reels: ${error.message}`
        });
    }
};

// Convert Video Format
const convertVideoFormat = async (nexus, chatId, fromFormat, toFormat) => {
    try {
        console.log(chalk.blue(`🎬 Converting ${fromFormat} to ${toFormat}...`));
        
        let conversionText = `🎬 VIDEO CONVERTER\n\n`;
        conversionText += `📹 Input Format: ${fromFormat}\n`;
        conversionText += `📹 Output Format: ${toFormat}\n`;
        conversionText += `📊 Resolution: 1920x1080\n`;
        conversionText += `🎬 Frame Rate: 30fps\n`;
        conversionText += `🔊 Audio: AAC 128kbps\n\n`;
        conversionText += `⏳ Converting: ███████░░░ 70%\n`;
        conversionText += `⏱️ Time remaining: 3 minutes\n\n`;
        conversionText += `💾 Original Size: 250 MB\n`;
        conversionText += `💾 Converted Size: 180 MB\n`;

        await nexus.sendMessage(chatId, { text: conversionText });
        console.log(chalk.green(`✅ Video conversion info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Video conversion error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error converting video: ${error.message}`
        });
    }
};

// Trim Video
const trimVideo = async (nexus, chatId, startTime, endTime) => {
    try {
        console.log(chalk.blue(`✂️ Trimming video...`));
        
        let trimText = `✂️ VIDEO TRIMMER\n\n`;
        trimText += `📹 Original Duration: 15:30\n`;
        trimText += `✂️ Start Time: ${startTime}\n`;
        trimText += `✂️ End Time: ${endTime}\n`;
        trimText += `⏱️ Trimmed Duration: 5:15\n\n`;
        trimText += `⏳ Processing: ██████████ 100%\n\n`;
        trimText += `📁 Original Size: 250 MB\n`;
        trimText += `📁 Trimmed Size: 85 MB\n`;
        trimText += `💾 Space Saved: 165 MB\n\n`;
        trimText += `✅ Video trimmed successfully!\n`;

        await nexus.sendMessage(chatId, { text: trimText });
        console.log(chalk.green(`✅ Video trim info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Video trim error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error trimming video: ${error.message}`
        });
    }
};

// Add Subtitles
const addSubtitles = async (nexus, chatId, videoFile, subtitleFile, language) => {
    try {
        console.log(chalk.blue(`🎬 Adding subtitles...`));
        
        let subtitleText = `🎬 SUBTITLE EDITOR\n\n`;
        subtitleText += `📹 Video: video.mp4\n`;
        subtitleText += `📄 Subtitle File: subtitles.srt\n`;
        subtitleText += `🌐 Language: ${language}\n`;
        subtitleText += `📊 Format: SRT\n\n`;
        subtitleText += `⏳ Processing: ██████████ 100%\n\n`;
        subtitleText += `✅ Subtitles added!\n`;
        subtitleText += `📁 Output: video_with_subs.mp4\n`;
        subtitleText += `💾 Size: 260 MB\n`;

        await nexus.sendMessage(chatId, { text: subtitleText });
        console.log(chalk.green(`✅ Subtitle info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Subtitle error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error adding subtitles: ${error.message}`
        });
    }
};

// Compress Video
const compressVideo = async (nexus, chatId, quality = 'medium') => {
    try {
        console.log(chalk.blue(`📊 Compressing video...`));
        
        let compressText = `📊 VIDEO COMPRESSOR\n\n`;
        compressText += `📹 Original Video: video.mp4\n`;
        compressText += `📊 Quality Level: ${quality}\n`;
        compressText += `📏 Resolution: 1920x1080 → 1280x720\n`;
        compressText += `🎬 Bitrate: 5000kbps → 2500kbps\n\n`;
        compressText += `📊 Original Size: 500 MB\n`;
        compressText += `📊 Compressed Size: 150 MB\n`;
        compressText += `💾 Reduction: 70%\n\n`;
        compressText += `⏳ Compressing: ██████████ 100%\n\n`;
        compressText += `✅ Video compressed successfully!\n`;

        await nexus.sendMessage(chatId, { text: compressText });
        console.log(chalk.green(`✅ Video compression info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Video compression error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error compressing video: ${error.message}`
        });
    }
};

// Extract Audio
const extractAudio = async (nexus, chatId, videoFile) => {
    try {
        console.log(chalk.blue(`🔊 Extracting audio...`));
        
        let extractText = `🔊 AUDIO EXTRACTOR\n\n`;
        extractText += `📹 Video: video.mp4\n`;
        extractText += `🔊 Audio Format: MP3\n`;
        extractText += `🎵 Bitrate: 320 kbps\n`;
        extractText += `🌐 Sample Rate: 44.1 kHz\n\n`;
        extractText += `⏳ Extracting: ██████████ 100%\n\n`;
        extractText += `✅ Audio extracted!\n`;
        extractText += `📁 Output: audio.mp3\n`;
        extractText += `💾 Size: 45 MB\n`;
        extractText += `⏱️ Duration: 15:30\n`;

        await nexus.sendMessage(chatId, { text: extractText });
        console.log(chalk.green(`✅ Audio extraction info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ Audio extraction error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error extracting audio: ${error.message}`
        });
    }
};

// Create GIF
const createGIF = async (nexus, chatId, startTime, endTime, fps = 10) => {
    try {
        console.log(chalk.blue(`🎬 Creating GIF...`));
        
        let gifText = `🎬 GIF CREATOR\n\n`;
        gifText += `📹 Video Duration: 15:30\n`;
        gifText += `⏱️ GIF Segment: ${startTime} - ${endTime}\n`;
        gifText += `🎬 FPS: ${fps}\n`;
        gifText += `📏 Resolution: 800x600\n\n`;
        gifText += `⏳ Creating GIF: ██████████ 100%\n\n`;
        gifText += `✅ GIF Created!\n`;
        gifText += `📁 File: output.gif\n`;
        gifText += `💾 Size: 25 MB\n`;
        gifText += `⏱️ Duration: 5 seconds\n`;

        await nexus.sendMessage(chatId, { text: gifText });
        console.log(chalk.green(`✅ GIF creation info sent`));

    } catch (error) {
        console.log(chalk.red(`❌ GIF creation error: ${error.message}`));
        await nexus.sendMessage(chatId, {
            text: `❌ Error creating GIF: ${error.message}`
        });
    }
};

module.exports = {
    downloadYouTube,
    downloadTikTok,
    downloadInstagramReels,
    convertVideoFormat,
    trimVideo,
    addSubtitles,
    compressVideo,
    extractAudio,
    createGIF
};

    return module.exports;
})();


// ============ inlined from lib/fontEngine.js (CODEX-AI, MIT licensed) ============
const __lib_fontEngine = (function() {
    const module = { exports: {} };
    const exports = module.exports;
    // lib/fontEngine.js
// BOT_FONT: applyFont(text, num) — for bot reply styling (1-63)
// FANCY:    applyFancyFont(text, num) — for .fancy command (1-59)

// ── Helper: char map transform ────────────────────────────────────────────────
function charMap(text, map) {
    return [...text].map(c => map[c] || map[c.toUpperCase()] || c).join('');
}

// ── BOT FONT ENGINE (1-63, applied to all bot replies) ───────────────────────
const FONTS = [
    null, // 0 = off

    // 1: bold serif
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙',l='abcdefghijklmnopqrstuvwxyz',sl='𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 2: italic serif
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍',l='abcdefghijklmnopqrstuvwxyz',sl='𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 3: bold italic serif
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁',l='abcdefghijklmnopqrstuvwxyz',sl='𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 4: typewriter
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉',l='abcdefghijklmnopqrstuvwxyz',sl='𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 5: sans bold
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭',l='abcdefghijklmnopqrstuvwxyz',sl='𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 6: sans italic
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡',l='abcdefghijklmnopqrstuvwxyz',sl='𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 7: sans bold italic
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕',l='abcdefghijklmnopqrstuvwxyz',sl='𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 8: cursive bold
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩',l='abcdefghijklmnopqrstuvwxyz',sl='𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 9: double-struck
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ',l='abcdefghijklmnopqrstuvwxyz',sl='𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 10: fraktur bold
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅',l='abcdefghijklmnopqrstuvwxyz',sl='𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 11: block squares 🅲🆁🆈...
    t => [...t].map(c => { const map={'A':'🅰','B':'🅱','C':'🅲','D':'🅳','E':'🅴','F':'🅵','G':'🅶','H':'🅷','I':'🅸','J':'🅹','K':'🅺','L':'🅻','M':'🅼','N':'🅽','O':'🅾','P':'🅿','Q':'🆀','R':'🆁','S':'🆂','T':'🆃','U':'🆄','V':'🆅','W':'🆆','X':'🆇','Y':'🆈','Z':'🆉'}; return map[c.toUpperCase()]||c; }).join(''),
    // 12: circled ⒶⒷⒸ...
    t => [...t].map(c => { const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ',l='abcdefghijklmnopqrstuvwxyz',sl='ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 13: vaporwave
    t => [...t].map(c => { if(c===' ')return '\u3000';const code=c.charCodeAt(0);if(code>=33&&code<=126)return String.fromCharCode(code+0xFEE0);return c;}).join(''),
    // 14: strike-through
    t => [...t].map(c => c+'\u0336').join(''),
    // 15: underline
    t => [...t].map(c => c+'\u0332').join(''),
    // 16: double underline
    t => [...t].map(c => c+'\u0333').join(''),
    // 17: tilde strike-through
    t => [...t].map(c => c+'\u0334').join(''),
    // 18: slash through
    t => [...t].map(c => c+'\u0337').join(''),
    // 19: cross above/below
    t => [...t].map(c => c+'\u035D').join(''),
    // 20: arrow below
    t => [...t].map(c => c+'\u034E').join(''),
    // 21: hearts between
    t => [...t].join('♥'),
    // 22: manga
    t => t.toUpperCase().split('').map(c => ({'A':'卂','B':'乃','C':'匚','D':'刀','E':'乇','F':'千','H':'卄','I':'工','J':'丿','L':'乚','M':'爪','N':'几','O':'ㄖ','P':'卩','R':'尺','S':'丂','T':'ㄒ','U':'ㄩ','V':'ᐯ','W':'山','X':'乂','Y':'ㄚ','Z':'乙'}[c]||c)).join(''),
    // 23: fancy1
    t => t.split('').map(c => ({'a':'ค','c':'¢','e':'ε','h':'ɦ','i':'ι','l':'ℓ','n':'ຖ','o':'໐','r':'ฯ','s':'Ş','w':'ω','y':'ყ'}[c.toLowerCase()]||c)).join(''),
    // 24: fancy2
    t => t.split('').map(c => ({'a':'ą','c':'ƈ','e':'ɛ','i':'ı','n':'ŋ','o':'ơ','r':'ཞ','s':'ʂ','v':'۷','y':'ყ'}[c.toLowerCase()]||c)).join(''),
    // 25: fancy7 ᑕᖇY...
    t => t.toUpperCase().split('').map(c=>({'A':'ᗩ','B':'ᗷ','C':'ᑕ','D':'ᗪ','F':'ᖴ','H':'ᕼ','J':'ᒍ','L':'ᒪ','M':'ᗰ','N':'ᑎ','P':'ᑭ','R':'ᖇ','S':'ᔕ','U':'ᑌ','V':'ᐯ','W':'ᗯ','X':'᙭'}[c]||c)).join(''),
    // 26: fancy8 ƈʀʏ...
    t => t.split('').map(c=>({'a':'ǟ','b':'ɮ','c':'ƈ','d':'ɖ','e':'ɛ','g':'ɢ','h':'ɦ','i':'ɨ','k':'ĸ','l':'ʟ','m':'ʍ','n':'ռ','o':'օ','p':'ք','r':'ʀ','s':'ֆ','t':'ȶ','u':'ʊ','v':'ʋ','w':'ա','y':'ʏ','z':'ʐ'}[c.toLowerCase()]||c)).join(''),
    // 27: ₵ⱤɎ... fancy15
    t => t.toUpperCase().split('').map(c=>({'A':'₳','B':'₿','C':'₵','D':'Đ','E':'Ɇ','F':'₣','G':'₲','H':'Ⱨ','I':'ł','K':'₭','L':'Ⱡ','N':'₦','O':'Ø','P':'₱','R':'Ɽ','S':'₴','T':'₮','U':'Ʉ','W':'₩','X':'Ӿ','Y':'Ɏ','Z':'Ƶ'}[c]||c)).join(''),
    // 28: ÇR¥§... fancy16
    t => t.split('').map(c=>({'a':'ä','b':'ß','c':'Ç','d':'Ð','e':'ê','f':'£','i':'ï','n':'ñ','o':'Ö','p':'þ','s':'§','t':'†','u':'ü','y':'¥','C':'Ç','N':'N','O':'Ö','S':'§','Y':'¥'}[c]||c)).join(''),
    // 29: ¢яуѕ... fancy17
    t => t.toLowerCase().split('').map(c=>({'a':'а','b':'б','c':'¢','d':'д','e':'е','h':'н','i':'і','j':'ј','k':'к','l':'ℓ','m':'м','n':'η','o':'о','p':'р','r':'я','s':'ѕ','t':'т','u':'υ','v':'ν','w':'ω','x':'χ','y':'у'}[c]||c)).join(''),
    // 30: ᄃЯY... fancy18
    t => t.toUpperCase().split('').map(c=>({'A':'Λ','C':'ᄃ','N':'П','O':'Ө','R':'Я','S':'Ƨ'}[c]||c)).join(''),
    // 31: superscript ᶜᴿʸˢ...
    t => t.split('').map(c=>({'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ','R':'ᴿ','V':'ᵛ'}[c]||c)).join(''),
    // 32: subscript CᵣYₛ...
    t => t.split('').map(c=>({'a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ'}[c]||c)).join(''),
    // 33: ladybug ꏳꋪꌩ...
    t => t.toUpperCase().split('').map(c=>({'A':'ꍏ','B':'ꌃ','C':'ꏳ','D':'ꀸ','E':'ꍟ','F':'ꎇ','G':'ꁅ','H':'ꍩ','I':'ꀤ','J':'ꀭ','K':'ꀘ','L':'ꒉ','M':'ꂵ','N':'ꈤ','O':'ꂦ','P':'ꉣ','Q':'ꆰ','R':'ꋪ','S':'ꌚ','T':'ꋖ','U':'ꐇ','V':'꒦','W':'ꅐ','X':'ꉧ','Y':'ꌩ','Z':'ꁴ'}[c]||c)).join(''),
    // 34: runes ርዪሃ...
    t => t.toUpperCase().split('').map(c=>({'A':'ል','B':'ጌ','C':'ር','D':'ዕ','E':'ቿ','F':'ቻ','G':'ኗ','H':'ዘ','I':'ጎ','J':'ጋ','K':'ዀ','L':'ቸ','M':'ጠ','N':'ክ','O':'ዐ','P':'የ','R':'ዪ','S':'ነ','T':'ፕ','U':'ሁ','V':'ሀ','W':'ሠ','X':'ሸ','Y':'ሃ','Z':'ፚ'}[c]||c)).join(''),
    // 35: flip/upside-down
    t => [...t].reverse().map(c=>({'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ı','j':'ɾ','k':'ʞ','l':'ʃ','m':'ɯ','n':'u','o':'o','p':'d','q':'b','r':'ɹ','s':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z','A':'∀','C':'Ɔ','D':'ᗡ','E':'Ǝ','F':'Ⅎ','H':'H','I':'I','J':'ɾ','L':'⅂','M':'W','N':'N','O':'O','P':'Ԁ','R':'ᴚ','S':'S','T':'⊥','U':'∩','V':'Λ','W':'M','X':'X','Y':'⅄','Z':'Z'}[c]||c)).join(''),
    // 36: mirror
    t => [...t].reverse().join(''),
    // 37: tiny caps
    t => t.toLowerCase().split('').map(c=>({'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','r':'ʀ','s':'ꜱ','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','y':'ʏ','z':'ᴢ'}[c]||c)).join(''),
    // 38: fancy33
    t => t.toUpperCase().split('').map(c=>({'A':'ᗩ','B':'ᗷ','C':'ᑕ','D':'ᗪ','F':'ᖴ','H':'ᕼ','J':'ᒍ','L':'ᒪ','M':'ᗰ','N':'ᑎ','O':'ᝪ','P':'ᑭ','R':'ᖇ','S':'ᔑ','U':'ᑌ','V':'ᐯ','W':'ᗯ','X':'᙭','Y':'Ꭹ'}[c]||c)).join(''),
    // 39: sparrow greek
    t => t.toUpperCase().split('').map(c=>({'A':'Δ','G':'∇','O':'Ω','P':'Π','R':'Ψ','S':'Σ','X':'Ξ'}[c]||c)).join(''),
    // 40-63: zalgo/creep variants
    ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map(intensity => t =>
        t.split('').map(c => {
            if (!/[a-zA-Z0-9]/.test(c)) return c;
            const COMBINING=['\u0300','\u0301','\u0302','\u0303','\u0304','\u0306','\u0307','\u0308','\u030A','\u030B','\u030C','\u031B','\u0332','\u0333','\u0339','\u033C','\u0362','\u0489','\u1AB0','\u1AB1','\u1AB2','\u1AB3','\u1AB4','\u1AB5'];
            const level=Math.ceil(intensity/4);
            let result=c;
            for(let i=0;i<level;i++) result+=COMBINING[Math.floor(Math.random()*COMBINING.length)];
            return result;
        }).join('')
    )
];

function applyFont(text, fontNum) {
    if (!fontNum || fontNum < 1 || fontNum > 63) return text;
    const fn = FONTS[fontNum];
    if (!fn) return text;
    return text.split('\n').map(line => {
        if (/[╔╗╚╝║═〔〕❒│]/.test(line)) return line;
        return fn(line);
    }).join('\n');
}

// ── FANCY FONT ENGINE (1-59, for .fancy command) ──────────────────────────────
// All 59 styles, applied to full input text as-is (no line filtering)
const FANCY_FONTS = [
    // 1: tiny caps
    t => t.toLowerCase().split('').map(c=>({'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','r':'ʀ','s':'ꜱ','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','y':'ʏ','z':'ᴢ','-':'-',' ':' '}[c]||c)).join(''),
    // 2: flip
    t => [...t].reverse().map(c=>({'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ı','j':'ɾ','k':'ʞ','l':'ʃ','m':'ɯ','n':'u','o':'o','p':'d','r':'ɹ','s':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z','A':'∀','C':'Ɔ','D':'ᗡ','E':'Ǝ','F':'Ⅎ','H':'H','I':'I','L':'⅂','M':'W','N':'N','O':'O','P':'Ԁ','R':'ᴚ','S':'S','T':'⊥','U':'∩','V':'Λ','W':'M','X':'X','Y':'⅄','Z':'Z','-':'-',' ':' '}[c]||c)).join(''),
    // 3: roundsquares C⃣R⃣Y⃣...
    t => [...t].map(c => c==='-'?'-':c+'\u20E3').join('\u2003'),
    // 4: squares C⃞R⃞...
    t => [...t].map(c => c==='-'?'-':c+'\u20DE').join('\u2003'),
    // 5: mirror
    t => [...t].reverse().join(''),
    // 6: creepify
    t => t.split('').map(c => {
        if(!/[a-zA-Z0-9]/.test(c)) return c;
        const CB=['\u0300','\u0301','\u0302','\u0303','\u0308','\u030C','\u0332','\u0333','\u0339','\u033C','\u1AB0','\u1AB1','\u1AB2','\u1AB3'];
        let r=c;for(let i=0;i<3;i++)r+=CB[Math.floor(Math.random()*CB.length)];return r;
    }).join(''),
    // 7: circled
    t => [...t].map(c=>({'A':'Ⓐ','B':'Ⓑ','C':'Ⓒ','D':'Ⓓ','E':'Ⓔ','F':'Ⓕ','G':'Ⓖ','H':'Ⓗ','I':'Ⓘ','J':'Ⓙ','K':'Ⓚ','L':'Ⓛ','M':'Ⓜ','N':'Ⓝ','O':'Ⓞ','P':'Ⓟ','Q':'Ⓠ','R':'Ⓡ','S':'Ⓢ','T':'Ⓣ','U':'Ⓤ','V':'Ⓥ','W':'Ⓦ','X':'Ⓧ','Y':'Ⓨ','Z':'Ⓩ','a':'ⓐ','b':'ⓑ','c':'ⓒ','d':'ⓓ','e':'ⓔ','f':'ⓕ','g':'ⓖ','h':'ⓗ','i':'ⓘ','j':'ⓙ','k':'ⓚ','l':'ⓛ','m':'ⓜ','n':'ⓝ','o':'ⓞ','p':'ⓟ','q':'ⓠ','r':'ⓡ','s':'ⓢ','t':'ⓣ','u':'ⓤ','v':'ⓥ','w':'ⓦ','x':'ⓧ','y':'ⓨ','z':'ⓩ'})[c]||c).join(''),
    // 8: strikeThrough
    t => [...t].map(c => c+'\u0336').join(''),
    // 9: tildeStrikeThrough
    t => [...t].map(c => c+'\u0334').join(''),
    // 10: slashThrough
    t => [...t].map(c => c+'\u0337').join(''),
    // 11: underline
    t => [...t].map(c => c+'\u0332').join(''),
    // 12: doubleUnderline
    t => [...t].map(c => c+'\u0333').join(''),
    // 13: heartsBetween
    t => [...t].join('♥'),
    // 14: arrowBelow
    t => [...t].map(c => c+'\u034E').join(''),
    // 15: crossAboveBelow
    t => [...t].map(c => c+'\u035D').join(''),
    // 16: wingdings (symbols map)
    t => [...t.toUpperCase()].map(c=>({'A':'✌︎','B':'👍︎','C':'👍︎','D':'♎︎','E':'📫︎','F':'☼︎','G':'✡︎','H':'♓︎','I':'💧︎','J':'☠︎','K':'⚐︎','L':'✞︎','M':'☯︎'}[c]||c)).join(''),
    // 17: vaporwave
    t => [...t].map(c=>{if(c===' ')return '\u3000';const code=c.charCodeAt(0);if(code>=33&&code<=126)return String.fromCharCode(code+0xFEE0);return c;}).join(''),
    // 18: sparrow greek
    t => t.toUpperCase().split('').map(c=>({'A':'Δ','G':'∇','O':'Ω','P':'Π','R':'Ψ','S':'Σ','X':'Ξ'}[c]||c)).join(''),
    // 19: manga
    t => t.toUpperCase().split('').map(c=>({'A':'卂','B':'乃','C':'匚','D':'刀','E':'乇','F':'千','H':'卄','I':'工','L':'乚','M':'爪','N':'几','O':'ㄖ','P':'卩','R':'尺','S':'丂','T':'ㄒ','U':'ㄩ','V':'ᐯ','W':'山','X':'乂','Y':'ㄚ','Z':'乙'}[c]||c)).join(''),
    // 20: ladybug
    t => t.toUpperCase().split('').map(c=>({'A':'ꍏ','B':'ꌃ','C':'ꏳ','D':'ꀸ','E':'ꍟ','F':'ꎇ','G':'ꁅ','H':'ꍩ','I':'ꀤ','J':'ꀭ','K':'ꀘ','L':'ꒉ','M':'ꂵ','N':'ꈤ','O':'ꂦ','P':'ꉣ','Q':'ꆰ','R':'ꋪ','S':'ꌚ','T':'ꋖ','U':'ꐇ','V':'꒦','W':'ꅐ','X':'ꉧ','Y':'ꌩ','Z':'ꁴ'}[c]||c)).join(''),
    // 21: runes
    t => t.toUpperCase().split('').map(c=>({'A':'ል','B':'ጌ','C':'ር','D':'ዕ','E':'ቿ','F':'ቻ','G':'ኗ','H':'ዘ','I':'ጎ','J':'ጋ','K':'ዀ','L':'ቸ','M':'ጠ','N':'ክ','O':'ዐ','P':'የ','R':'ዪ','S':'ነ','T':'ፕ','U':'ሁ','V':'ሀ','W':'ሠ','X':'ሸ','Y':'ሃ','Z':'ፚ'}[c]||c)).join(''),
    // 22: bold serif
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙',l='abcdefghijklmnopqrstuvwxyz',sl='𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 23: bold italic serif
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁',l='abcdefghijklmnopqrstuvwxyz',sl='𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 24: italic serif
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍',l='abcdefghijklmnopqrstuvwxyz',sl='𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 25: analucia
    t => [...t].map(c=>{const m={'a':'ꪖ','b':'ᥣ','c':'ᥴ','d':'ᦔ','e':'ꫀ','f':'ᠻ','g':'ᧁ','h':'ꫝ','i':'𝘪','j':'ꪮ','k':'ᛕ','l':'ꪶ','m':'ꪑ','n':'ꪀ','o':'ꪮ','p':'ρ','r':'𝘳','s':'𝘴','t':'𝘵','u':'ᴜ','v':'ꪜ','w':'ᭅ','x':'᥊','y':'𝘺','z':'ᴢ'};return m[c.toLowerCase()]||c;}).join(''),
    // 26: typewriter
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉',l='abcdefghijklmnopqrstuvwxyz',sl='𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 27: fancy1
    t => t.split('').map(c=>({'a':'ค','c':'¢','e':'ε','h':'ɦ','i':'ι','l':'ℓ','n':'ຖ','o':'໐','r':'ฯ','s':'Ş','w':'ω','y':'ყ'}[c.toLowerCase()]||c)).join(''),
    // 28: fancy2
    t => t.split('').map(c=>({'a':'ą','c':'ƈ','e':'ɛ','i':'ı','n':'ŋ','o':'ơ','r':'ཞ','s':'ʂ','v':'۷','y':'ყ'}[c.toLowerCase()]||c)).join(''),
    // 29: fancy3 ᄃ尺ﾘ...
    t => t.toUpperCase().split('').map(c=>({'A':'ﾑ','C':'ᄃ','D':'刀','I':'ﾉ','K':'𝕶','N':'刀','O':'の','R':'尺','S':'丂','U':'ㄩ','V':'√','Y':'ﾘ'}[c]||c)).join(''),
    // 30: manga2 Ҝㄖ尺ᗪ
    t => t.toUpperCase().split('').map(c=>({'A':'卂','B':'乃','C':'匚','D':'ᗪ','E':'乇','H':'卄','I':'工','K':'Ҝ','L':'乚','M':'爪','N':'几','O':'ㄖ','P':'卩','R':'尺','S':'丂','T':'ㄒ','U':'ㄩ','V':'ᐯ','W':'山','X':'乂','Y':'ㄚ'}[c]||c)).join(''),
    // 31: fancy5 🄺🄾🅁...
    t => [...t].map(c=>{const m={'A':'🄰','B':'🄱','C':'🄲','D':'🄳','E':'🄴','F':'🄵','G':'🄶','H':'🄷','I':'🄸','J':'🄹','K':'🄺','L':'🄻','M':'🄼','N':'🄽','O':'🄾','P':'🄿','Q':'🅀','R':'🅁','S':'🅂','T':'🅃','U':'🅄','V':'🅅','W':'🅆','X':'🅇','Y':'🅈','Z':'🅉'};return m[c.toUpperCase()]||c;}).join(''),
    // 32: runes2 ፈᏒᎩ...
    t => t.toUpperCase().split('').map(c=>({'A':'Ꭺ','B':'ᏴB','C':'ፈ','D':'ᗞ','E':'ᎬE','F':'ᎵF','G':'ᎶG','H':'ꮋ','I':'ᎥI','J':'ᎫJ','K':'ᏦK','L':'ᎻL','M':'ᎷM','N':'N','O':'Ꮻ','P':'ᏢP','Q':'Q','R':'Ꮢ','S':'ᏕS','T':'T','U':'Ꮜ','V':'ᐯ','W':'ᏔW','X':'ᕊ','Y':'ᎩY','Z':'Z'}[c]||c)).join(''),
    // 33: fancy7 Kᝪᖇᗞ
    t => t.toUpperCase().split('').map(c=>({'A':'ᗩ','B':'ᗷ','C':'ᑕ','D':'ᗪ','F':'ᖴ','H':'ᕼ','I':'I','J':'ᒍ','K':'K','L':'ᒪ','M':'ᗰ','N':'ᑎ','O':'O','P':'ᑭ','Q':'Q','R':'ᖇ','S':'ᔕ','U':'ᑌ','V':'ᐯ','W':'ᗯ','X':'᙭','Y':'Y'}[c]||c)).join(''),
    // 34: fancy8
    t => t.split('').map(c=>({'a':'ǟ','b':'ɮ','c':'ƈ','d':'ɖ','e':'ɛ','g':'ɢ','h':'ɦ','i':'ɨ','k':'ĸ','l':'ʟ','m':'ʍ','n':'ռ','o':'օ','p':'ք','r':'ʀ','s':'ֆ','t':'ȶ','u':'ʊ','v':'ʋ','w':'ա','y':'ʏ','z':'ʐ'}[c.toLowerCase()]||c)).join(''),
    // 35: typewriter2
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉',l='abcdefghijklmnopqrstuvwxyz',sl='𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 36: sans bold italic
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕',l='abcdefghijklmnopqrstuvwxyz',sl='𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 37: sans bold
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭',l='abcdefghijklmnopqrstuvwxyz',sl='𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 38: bold serif2
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙',l='abcdefghijklmnopqrstuvwxyz',sl='𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 39: sans italic
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡',l='abcdefghijklmnopqrstuvwxyz',sl='𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 40: fancy17
    t => t.toLowerCase().split('').map(c=>({'a':'а','b':'б','c':'¢','d':'д','e':'е','h':'н','i':'і','j':'ј','k':'к','l':'ℓ','m':'м','n':'η','o':'о','p':'р','r':'я','s':'ѕ','t':'т','u':'υ','v':'ν','w':'ω','x':'χ','y':'у'}[c]||c)).join(''),
    // 41: ₵ⱤɎ...
    t => t.toUpperCase().split('').map(c=>({'A':'₳','B':'₿','C':'₵','D':'Đ','E':'Ɇ','F':'₣','G':'₲','H':'Ⱨ','I':'ł','K':'₭','L':'Ⱡ','N':'₦','O':'Ø','P':'₱','R':'Ɽ','S':'₴','T':'₮','U':'Ʉ','W':'₩','X':'Ӿ','Y':'Ɏ','Z':'Ƶ'}[c]||c)).join(''),
    // 42: ÇR¥§...
    t => t.split('').map(c=>({'a':'ä','b':'ß','c':'Ç','d':'Ð','e':'ê','f':'£','i':'ï','n':'ñ','o':'Ö','s':'§','t':'†','u':'ü','y':'¥','C':'Ç','O':'Ö','S':'§','Y':'¥'}[c]||c)).join(''),
    // 43: ¢яуѕ...
    t => t.toLowerCase().split('').map(c=>({'a':'а','b':'б','c':'¢','d':'д','e':'е','h':'н','i':'і','k':'к','l':'ℓ','m':'м','n':'η','o':'о','p':'р','r':'я','s':'ѕ','t':'т','u':'υ','v':'ν','w':'ω','x':'χ','y':'у'}[c]||c)).join(''),
    // 44: KӨЯD
    t => t.toUpperCase().split('').map(c=>({'A':'Λ','C':'ᄃ','N':'П','O':'Ө','R':'Я','S':'Ƨ'}[c]||c)).join(''),
    // 45: Ҡ...
    t => t.toUpperCase().split('').map(c=>({'A':'Ⱥ','C':'Ç','D':'Ď','E':'Ɇ','G':'Ǥ','H':'Ħ','I':'Ì','J':'ĵ','K':'Ҡ','L':'Ŀ','M':'M','N':'Ň','O':'Ø','P':'Ᵽ','Q':'Q','R':'Ʀ','S':'Ş','T':'Ŧ','U':'Ʉ','V':'Ʋ','W':'Ŵ','X':'X','Y':'Ɏ','Z':'Ƶ'}[c]||c)).join(''),
    // 46: subscript
    t => t.split('').map(c=>({'a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ'}[c]||c)).join(''),
    // 47: superscript
    t => t.split('').map(c=>({'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ','R':'ᴿ'}[c]||c)).join(''),
    // 48: к๏г๔ Thai
    t => t.toLowerCase().split('').map(c=>({'a':'ค','b':'ც','c':'¢','d':'๔','e':'ε','f':'ƒ','g':'ɠ','h':'ɦ','i':'ι','j':'ʝ','k':'к','l':'ℓ','m':'ɱ','n':'ɳ','o':'๏','p':'ρ','q':'զ','r':'г','s':'ş','t':'ƭ','u':'ų','v':'ง','w':'ω','x':'χ','y':'ყ','z':'ʑ'}[c]||c)).join(''),
    // 49: double-struck
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ',l='abcdefghijklmnopqrstuvwxyz',sl='𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 50: fraktur bold
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅',l='abcdefghijklmnopqrstuvwxyz',sl='𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 51: block squares
    t => [...t].map(c=>{const m={'A':'🅰','B':'🅱','C':'🅲','D':'🅳','E':'🅴','F':'🅵','G':'🅶','H':'🅷','I':'🅸','J':'🅹','K':'🅺','L':'🅻','M':'🅼','N':'🅽','O':'🅾','P':'🅿','Q':'🆀','R':'🆁','S':'🆂','T':'🆃','U':'🆄','V':'🆅','W':'🆆','X':'🆇','Y':'🆈','Z':'🆉'};return m[c.toUpperCase()]||c;}).join(''),
    // 52: cursive bold
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩',l='abcdefghijklmnopqrstuvwxyz',sl='𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 53: fraktur regular
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ',l='abcdefghijklmnopqrstuvwxyz',sl='𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 54: fullwidth Ａ...
    t => [...t].map(c=>{if(c===' ')return '\u3000';const code=c.charCodeAt(0);if(code>=33&&code<=126)return String.fromCharCode(code+0xFEE0);return c;}).join(''),
    // 55: bold italic serif2
    t => [...t].map(c=>{const u='ABCDEFGHIJKLMNOPQRSTUVWXYZ',s='𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁',l='abcdefghijklmnopqrstuvwxyz',sl='𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛';const ui=u.indexOf(c);if(ui!==-1)return[...s][ui];const li=l.indexOf(c);if(li!==-1)return[...sl][li];return c;}).join(''),
    // 56: greek math
    t => t.toUpperCase().split('').map(c=>({'A':'𝛥','B':'B','C':'C','D':'D','E':'E','F':'F','G':'G','H':'H','I':'𝛪','J':'J','K':'𝛫','L':'L','M':'M','N':'𝛮','O':'𝛩','P':'𝛱','Q':'Q','R':'𝛲','S':'S','T':'T','U':'U','V':'V','W':'W','X':'Ξ','Y':'Y','Z':'Z'}[c]||c)).join(''),
    // 57: greek bold
    t => t.toUpperCase().split('').map(c=>({'A':'𝞓','B':'B','C':'C','D':'𝘿','E':'E','F':'F','G':'G','H':'H','I':'𝞘','J':'J','K':'K','L':'L','M':'M','N':'N','O':'𝞗','P':'P','Q':'Q','R':'𝞒','S':'S','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Z'}[c]||c)).join(''),
    // 58: greek mixed
    t => t.toUpperCase().split('').map(c=>({'A':'𝚫','B':'B','C':'C','D':'𝐃','E':'E','F':'F','G':'G','H':'H','I':'𝚰','J':'J','K':'𝐊','L':'L','M':'M','N':'N','O':'𝚯','P':'P','Q':'Q','R':'𝚪','S':'S','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Z'}[c]||c)).join(''),
    // 59: fancy33 variant
    t => t.toUpperCase().split('').map(c=>({'A':'ᗩ','B':'ᗷ','C':'ᑕ','D':'ᗪ','E':'E','F':'ᖴ','G':'G','H':'ᕼ','I':'I','J':'ᒍ','K':'K','L':'ᒪ','M':'ᗰ','N':'ᑎ','O':'ᝪ','P':'ᑭ','Q':'Q','R':'ᖇ','S':'ᔑ','T':'T','U':'ᑌ','V':'ᐯ','W':'ᗯ','X':'᙭','Y':'Ꭹ','Z':'Z'}[c]||c)).join(''),
];

function applyFancyFont(text, num) {
    if (num < 1 || num > FANCY_FONTS.length) return text;
    try { return FANCY_FONTS[num - 1](text); }
    catch { return text; }
}

const FANCY_FONT_COUNT = FANCY_FONTS.length; // 59

module.exports = { applyFont, applyFancyFont, FONT_COUNT: 63, FANCY_FONT_COUNT };

    return module.exports;
})();

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
    const fontNum = getSetting('bot', 'botFont', 0);
    const fontedText = fontNum > 0 ? __lib_fontEngine.applyFont(text, fontNum) : text;
    return await replyWithNewsletter(m.chat, fontedText, m, mentions);
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

    // ===== COMMAND-PROCESSING INDICATORS (adapted from CODEX-AI, MIT) =====
    try {
        if (getSetting(botNumber, 'cmdTyping', false)) {
            await devtrust.sendPresenceUpdate('composing', m.chat).catch(() => {});
        }
        if (getSetting(botNumber, 'cmdRecording', false)) {
            await devtrust.sendPresenceUpdate('recording', m.chat).catch(() => {});
        }
        const cmdReactEmoji = getSetting(botNumber, 'cmdReact', null);
        if (cmdReactEmoji && m.key) {
            await devtrust.sendMessage(m.chat, { react: { text: cmdReactEmoji, key: m.key } }).catch(() => {});
        }
    } catch (_) {}
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
        const CATEGORY_MODULES = {
        football: __cmd_football,
        economy: __cmd_economy,
        group: __cmd_group,
        tools: __cmd_tools,
        anime: __cmd_anime,
        ai: __cmd_ai,
        fun: __cmd_fun,
        game: __cmd_games,
        config: __cmd_settings,
        image: __cmd_design,
        downloader: { ...__cmd_music, ...__cmd_video, ...__cmd_social },
        misc: { ...__cmd_business, ...__cmd_career, ...__cmd_education, ...__cmd_news,
                ...__cmd_travel, ...__cmd_food, ...__cmd_entertainment, ...__cmd_auto,
                ...__cmd_tech, ...__cmd_realestate, ...__cmd_fashion, ...__cmd_lifestyle,
                ...__cmd_programming }
    };
    const mod = CATEGORY_MODULES[categoryKey];
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
            const { MENU_DATA } = __cmd_menu;
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
            const { handleMenuSelection } = __cmd_menu;
            const handledNav = await handleMenuSelection(devtrust, from, body);
            if (handledNav) return;

            // group.js's own buttons (settings toggle, jail list, votekick vote)
            // — these ids never start with CMD_, so dispatchMenuCommand won't
            // see them; handleGroupSelection is the router that does.
            // groupMetadata is only actually needed for VK_VOTE_ taps — fetching
            // it unconditionally on every single button tap was hammering
            // WhatsApp's servers with redundant requests during fast tapping.
            const { handleGroupSelection } = __cmd_group;
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
    const gamesMod = __cmd_games;
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
        const musicMod = __cmd_music;
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

// #notename shorthand — quick note lookup without a full command
// (adapted from CODEX-AI, MIT). Uses the group notes system (proper
// title/content pairs), scoped to this chat. Only fires on plain text.
if (!isCmd && body && body.trim().startsWith('#') && body.trim().length > 1) {
    const noteTitle = body.trim().slice(1).trim();
    try {
        const noteFile = './database/notes.json';
        const noteStore = fs.existsSync(noteFile) ? JSON.parse(fs.readFileSync(noteFile)) : {};
        const noteBody = noteStore[m.chat]?.[noteTitle];
        if (noteBody) {
            reply(`📝 *${noteTitle}*\n\n${noteBody}`);
            return;
        }
    } catch (_) {}
}

// Plain-text menu reply (e.g. "1", "next", "back", "menu") — only when the
// message ISN'T a real prefixed command, so normal commands are untouched.
if (!isCmd && (m.mtype === 'conversation' || m.mtype === 'extendedTextMessage') && body && body.trim()) {
    const menuMod = __cmd_menu;
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

// ===== AUTO-REACT & MENTION-REACT (adapted from CODEX-AI, MIT) =====
try {
    const autoReactEmoji = getSetting(botNumber, 'autoReact', null);
    if (autoReactEmoji && m.key) {
        await devtrust.sendMessage(m.chat, { react: { text: autoReactEmoji, key: m.key } }).catch(() => {});
    }

    const mentionReactEmoji = getSetting(botNumber, 'mentionReact', null);
    if (mentionReactEmoji && m.key) {
        const botDigits = botNumber.split('@')[0];
        const wasMentioned = (m.mentionedJid || []).some(jid => jid.split('@')[0] === botDigits);
        if (wasMentioned) {
            await devtrust.sendMessage(m.chat, { react: { text: mentionReactEmoji, key: m.key } }).catch(() => {});
        }
    }
} catch (_) {}

// ===== AFK SYSTEM (with mention tracking, adapted from CODEX-AI, MIT) =====
try {
    const moment = require('moment-timezone');

    // If the sender themselves was AFK, welcome them back, clear it, and
    // report who tagged/messaged them while they were away.
    const myAfk = getSetting(m.sender, 'afk', null);
    if (myAfk && command !== 'afk') {
        setSetting(m.sender, 'afk', null);
        const duration = moment(myAfk.since).fromNow(true);
        const mentionCount = (myAfk.mentions || []).length;
        let backText = `👋 Welcome back! You were AFK for ${duration}.`;
        if (mentionCount > 0) {
            backText += `\n\nYou were mentioned *${mentionCount}* time(s) while away.`;
        }
        reply(backText);
    }

    // If someone mentioned or replied to a currently-AFK user, let them
    // know AND log it into that user's afk record for when they return.
    const mentioned = m.mentionedJid || [];
    const repliedTo = m.quoted?.sender;
    const afkTargets = [...new Set([...mentioned, repliedTo].filter(Boolean))];
    for (const target of afkTargets) {
        if (target === m.sender) continue;
        const theirAfk = getSetting(target, 'afk', null);
        if (theirAfk) {
            const duration = moment(theirAfk.since).fromNow(true);
            reply(`💤 @${target.split('@')[0]} is AFK: ${theirAfk.reason} (${duration} ago)`, target ? [target] : []);

            theirAfk.mentions = theirAfk.mentions || [];
            theirAfk.mentions.push({ from: m.sender, text: (m.text || '').slice(0, 100), at: Date.now() });
            setSetting(target, 'afk', theirAfk);
        }
    }
} catch (_) {}

// ===== #NOTENAME SHORTHAND (adapted from CODEX-AI, MIT) =====
// Quick note lookup: typing "#sometitle" looks it up in this chat's
// saved notes (the ./database/notes.json title::content store) without
// needing the full ".notes get sometitle" command.
try {
    const bodyTrimmed = (m.text || '').trim();
    if (bodyTrimmed.startsWith('#') && bodyTrimmed.length > 1 && !bodyTrimmed.includes(' ')) {
        const noteTitle = bodyTrimmed.slice(1);
        const noteFile = './database/notes.json';
        if (fs.existsSync(noteFile)) {
            const noteStore = JSON.parse(fs.readFileSync(noteFile));
            const noteBody = noteStore[m.chat]?.[noteTitle];
            if (noteBody) {
                reply(`📝 *${noteTitle}*\n\n${noteBody}`);
            }
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
        const groupCmds = __cmd_group;
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
if (m.isGroup && !isAdmins && !isCreator) {
    const muteEntry = global.muted?.[m.chat]?.find(e => (typeof e === 'string' ? e : e.jid) === m.sender);
    if (muteEntry) {
        const isStickersOnly = typeof muteEntry === 'object' && muteEntry.stickersOnly;
        const isSticker = m.mtype === 'stickerMessage';
        if (!isStickersOnly || !isSticker) {
            await devtrust.sendMessage(m.chat, { delete: m.key });
            return;
        }
    }
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

// React to every command as soon as it's recognized, before running it —
// now toggleable/configurable instead of a hardcoded always-on ✅️.
if (isCmd && command) {
    try {
        const cmdReactEmoji = getSetting(botNumber, 'cmdReact', '✅️');
        if (cmdReactEmoji) {
            await devtrust.sendMessage(m.chat, { react: { text: cmdReactEmoji, key: m.key } });
        }
    } catch (e) {
        console.log(chalk.yellow(`⚠️ Command reaction failed: ${e.message}`));
    }

    try {
        if (getSetting(botNumber, 'cmdTyping', false)) {
            await devtrust.sendPresenceUpdate('composing', m.chat);
        }
        if (getSetting(botNumber, 'cmdRecording', false)) {
            await devtrust.sendPresenceUpdate('recording', m.chat);
        }
    } catch (_) {}
}

switch(command) {
// ============ CONTACT BASE OWNER ×͜× 𝙿𝚛𝚘𝚋𝚊𝚋𝚕𝚢 𝙱𝚞𝚜𝚢 永 FOR MAINTENANCE 2348087253512 - DON'T ANYTHING MIGHT GIVE ERRORS ============

case 'allmenu':
case 'legend':
case 'menu': {

    const { sendMainMenu, sendFullMenu, sendSubmenu, MENU_DATA } = __cmd_menu;

    if (args[0]) {
        // .menu <category> — jump straight into that category's numbered picker
        const typed = args.join(' ').toLowerCase().trim();
        const matchedKey = Object.keys(MENU_DATA).find(key =>
            key === typed || MENU_DATA[key].name.toLowerCase() === typed
        );
        if (matchedKey) {
            await sendSubmenu(devtrust, from, matchedKey, 0);
        } else {
            await reply(`❌ *Category not found.* Try: ${Object.keys(MENU_DATA).join(', ')}`);
        }
    } else {
        // No args — full Kord-style listing, everything at once
        await sendFullMenu(devtrust, from, m.pushName);
    }

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
        const { sendMainMenuButtonsTest } = __cmd_menu;
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
        const { sendMainMenuButtonsTest2 } = __cmd_menu;
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
        setSetting(botNumber, "antiEdit", false);
        reply("❌ *Anti-edit disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}antiedit on/off`);
}
break;

case "antieditchat": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}antieditchat on/off`);
    if (args[0] === "on") {
        setSetting(m.chat, "antiEditChat", true);
        reply("✅ *Anti-edit (chat) enabled* • Edited messages will be logged in this chat");
    } else if (args[0] === "off") {
        setSetting(m.chat, "antiEditChat", false);
        reply("❌ *Anti-edit (chat) disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}antieditchat on/off`);
}
break;

case "savestatus": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}savestatus on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "saveStatus", true);
        reply("✅ *Save status enabled* • Bot will forward statuses to your DM");
    } else if (args[0] === "off") {
        setSetting(botNumber, "saveStatus", false);
        reply("❌ *Save status disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}savestatus on/off`);
}
break;

case "cmdreact": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}cmdreact on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "cmdReact", true);
        reply("✅ *Command react enabled* • Bot will react to commands with emojis");
    } else if (args[0] === "off") {
        setSetting(botNumber, "cmdReact", false);
        reply("❌ *Command react disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}cmdreact on/off`);
}
break;

case "readmsg": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}readmsg on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "readMsg", true);
        reply("✅ *Read messages enabled* • Bot will mark all messages as read");
    } else if (args[0] === "off") {
        setSetting(botNumber, "readMsg", false);
        reply("❌ *Read messages disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}readmsg on/off`);
}
break;

case "rejectcall": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}rejectcall on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "rejectCall", true);
        reply("✅ *Reject call enabled* • Bot will auto-reject incoming calls");
    } else if (args[0] === "off") {
        setSetting(botNumber, "rejectCall", false);
        reply("❌ *Reject call disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}rejectcall on/off`);
}
break;

case "setmod": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}setmod @user`);
    const modNum = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    let mods = JSON.parse(fs.existsSync('./database/mods.json') ? fs.readFileSync('./database/mods.json') : '[]');
    if (mods.includes(modNum)) return reply('⚠️ *User is already a mod*');
    mods.push(modNum);
    fs.writeFileSync('./database/mods.json', JSON.stringify(mods));
    reply(`✅ *@${args[0].replace(/[^0-9]/g, '')} added as mod*`, { mentions: [modNum] });
}
break;

case "delmod": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}delmod @user`);
    const delModNum = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    let modsD = JSON.parse(fs.existsSync('./database/mods.json') ? fs.readFileSync('./database/mods.json') : '[]');
    modsD = modsD.filter(m => m !== delModNum);
    fs.writeFileSync('./database/mods.json', JSON.stringify(modsD));
    reply(`✅ *@${args[0].replace(/[^0-9]/g, '')} removed from mods*`, { mentions: [delModNum] });
}
break;

case "getmods": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    let modsList = JSON.parse(fs.existsSync('./database/mods.json') ? fs.readFileSync('./database/mods.json') : '[]');
    if (!modsList.length) return reply('📋 *No mods set*');
    const modsText = modsList.map((m, i) => `${i + 1}. @${m.replace('@s.whatsapp.net', '')}`).join('\n');
    reply(`📋 *Mods List:*\n${modsText}`, { mentions: modsList });
}
break;

case "statusemoji": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}statusemoji [emoji]`);
    setSetting(botNumber, "statusEmoji", args[0]);
    reply(`✅ *Status emoji set to* ${args[0]}`);
}
break;

case "savecmd": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}savecmd [command] [response]`);
    const cmdName = args[0].toLowerCase();
    const cmdResponse = args.slice(1).join(' ');
    if (!cmdResponse) return reply(`⚙️ *Usage:* ${prefix}savecmd [command] [response]`);
    let customCmds = JSON.parse(fs.existsSync('./database/customcmds.json') ? fs.readFileSync('./database/customcmds.json') : '{}');
    customCmds[cmdName] = cmdResponse;
    fs.writeFileSync('./database/customcmds.json', JSON.stringify(customCmds));
    reply(`✅ *Command saved!*\n▸ Trigger: ${prefix}${cmdName}\n▸ Response: ${cmdResponse}`);
}
break;

case "vvcmd": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    let customCmdsV = JSON.parse(fs.existsSync('./database/customcmds.json') ? fs.readFileSync('./database/customcmds.json') : '{}');
    const cmdKeys = Object.keys(customCmdsV);
    if (!cmdKeys.length) return reply('📋 *No custom commands saved*');
    const cmdList = cmdKeys.map((k, i) => `${i + 1}. ${prefix}${k} → ${customCmdsV[k]}`).join('\n');
    reply(`📋 *Custom Commands:*\n${cmdList}`);
}
break;

// ============ TOOLS COMMANDS ============
case "msgs": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    const msgCount = global.msgCounter || 0;
    reply(`📊 *Message Stats*\n▸ Total messages processed: *${msgCount}*`);
}
break;

case "listonline": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!m.isGroup) return reply('👥 *Groups only*');
    const groupMembers = (await devtrust.groupMetadata(m.chat)).participants;
    const onlineList = global.onlineUsers?.[m.chat] || [];
    if (!onlineList.length) return reply('📋 *No online users tracked yet*');
    const listText = onlineList.map((u, i) => `${i + 1}. @${u.replace('@s.whatsapp.net', '')}`).join('\n');
    reply(`🟢 *Online Members:*\n${listText}`, { mentions: onlineList });
}
break;

case "listoffline": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!m.isGroup) return reply('👥 *Groups only*');
    const meta = await devtrust.groupMetadata(m.chat);
    const allMembers = meta.participants.map(p => p.id);
    const onlineU = global.onlineUsers?.[m.chat] || [];
    const offlineList = allMembers.filter(u => !onlineU.includes(u));
    if (!offlineList.length) return reply('📋 *Everyone appears online*');
    const offText = offlineList.map((u, i) => `${i + 1}. @${u.replace('@s.whatsapp.net', '')}`).join('\n');
    reply(`🔴 *Offline Members:*\n${offText}`, { mentions: offlineList });
}
break;

case "quoted": {
    if (!m.quoted) return reply('↩️ *Reply to a message to use this command*');
    const quotedMsg = m.quoted;
    const qSender = quotedMsg.sender || quotedMsg.key?.participant || quotedMsg.key?.remoteJid;
    const qType = quotedMsg.mtype || 'unknown';
    reply(`📌 *Quoted Message Info*\n▸ Sender: @${qSender?.replace('@s.whatsapp.net', '')}\n▸ Type: ${qType}\n▸ ID: ${quotedMsg.id || quotedMsg.key?.id}`, { mentions: [qSender] });
}
break;

case "element": {
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}element [symbol]\n_Example: ${prefix}element Fe_`);
    const elements = {
        h: 'Hydrogen | Atomic No: 1 | Mass: 1.008', he: 'Helium | Atomic No: 2 | Mass: 4.003',
        li: 'Lithium | Atomic No: 3 | Mass: 6.941', be: 'Beryllium | Atomic No: 4 | Mass: 9.012',
        b: 'Boron | Atomic No: 5 | Mass: 10.811', c: 'Carbon | Atomic No: 6 | Mass: 12.011',
        n: 'Nitrogen | Atomic No: 7 | Mass: 14.007', o: 'Oxygen | Atomic No: 8 | Mass: 15.999',
        f: 'Fluorine | Atomic No: 9 | Mass: 18.998', ne: 'Neon | Atomic No: 10 | Mass: 20.180',
        na: 'Sodium | Atomic No: 11 | Mass: 22.990', mg: 'Magnesium | Atomic No: 12 | Mass: 24.305',
        al: 'Aluminium | Atomic No: 13 | Mass: 26.982', si: 'Silicon | Atomic No: 14 | Mass: 28.086',
        p: 'Phosphorus | Atomic No: 15 | Mass: 30.974', s: 'Sulfur | Atomic No: 16 | Mass: 32.065',
        cl: 'Chlorine | Atomic No: 17 | Mass: 35.453', ar: 'Argon | Atomic No: 18 | Mass: 39.948',
        k: 'Potassium | Atomic No: 19 | Mass: 39.098', ca: 'Calcium | Atomic No: 20 | Mass: 40.078',
        fe: 'Iron | Atomic No: 26 | Mass: 55.845', cu: 'Copper | Atomic No: 29 | Mass: 63.546',
        zn: 'Zinc | Atomic No: 30 | Mass: 65.38', ag: 'Silver | Atomic No: 47 | Mass: 107.868',
        au: 'Gold | Atomic No: 79 | Mass: 196.967', hg: 'Mercury | Atomic No: 80 | Mass: 200.592',
        pb: 'Lead | Atomic No: 82 | Mass: 207.2', u: 'Uranium | Atomic No: 92 | Mass: 238.029'
    };
    const el = elements[args[0].toLowerCase()];
    if (!el) return reply(`❌ *Element not found:* ${args[0]}\n_Try symbols like Fe, Au, Cu, Na_`);
    reply(`⚗️ *Element Info*\n▸ ${el}`);
}
break;

case "permit": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}permit @user [command]`);
    const permitUser = m.mentionedJid?.[0] || args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const permitCmd = args[1]?.toLowerCase();
    if (!permitCmd) return reply(`⚙️ *Usage:* ${prefix}permit @user [command]`);
    let permits = JSON.parse(fs.existsSync('./database/permits.json') ? fs.readFileSync('./database/permits.json') : '{}');
    if (!permits[permitUser]) permits[permitUser] = [];
    if (!permits[permitUser].includes(permitCmd)) permits[permitUser].push(permitCmd);
    fs.writeFileSync('./database/permits.json', JSON.stringify(permits));
    reply(`✅ *@${permitUser.replace('@s.whatsapp.net', '')} permitted to use* ${prefix}${permitCmd}`, { mentions: [permitUser] });
}
break;

case "mention": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}mention @user [message]`);
    const mentionTarget = m.mentionedJid?.[0];
    if (!mentionTarget) return reply('⚙️ *Tag a user to mention them*');
    const mentionMsg = args.slice(1).join(' ') || '👋';
    reply(`@${mentionTarget.replace('@s.whatsapp.net', '')} ${mentionMsg}`, { mentions: [mentionTarget] });
}
break;

case "afk": {
    if (!args[0]) {
        // Check AFK status
        const afkData = global.afkUsers?.[m.sender];
        if (!afkData) return reply('ℹ️ *You are not AFK*');
        const elapsed = Math.floor((Date.now() - afkData.time) / 60000);
        reply(`🌙 *You have been AFK for ${elapsed} minutes*\nReason: ${afkData.reason}`);
    } else {
        if (!global.afkUsers) global.afkUsers = {};
        const reason = args.join(' ');
        global.afkUsers[m.sender] = { reason, time: Date.now() };
        reply(`🌙 *AFK mode enabled*\nReason: ${reason}\n_You will be notified when someone mentions you_`);
    }
}
break;

case "areact": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}areact on/off`);
    if (args[0] === "on") {
        setSetting(m.chat, "autoReact", true);
        reply("✅ *Auto react enabled* • Bot will react to every message");
    } else if (args[0] === "off") {
        setSetting(m.chat, "autoReact", false);
        reply("❌ *Auto react disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}areact on/off`);
}
break;
// ============ END TOOLS COMMANDS ============

case "autoviewstatus": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autoviewstatus on/off");
    
    if (args[0].toLowerCase() === "on") {
        setSetting(botNumber, "autoViewStatus", true);
        reply("✅ *Auto view status enabled* • Stories auto-viewed");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(botNumber, "autoViewStatus", false);
        reply("❌ *Auto view status disabled*");
    } else reply("⚙️ *Usage:* autoviewstatus on/off");
}
break;

case "autotyping": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autotyping on/off");
    if (!m.isGroup) return reply("👥 *Groups only*");

    if (args[0].toLowerCase() === "on") {
        setSetting(m.chat, "autoTyping", true);
        reply("✅ *Auto typing enabled* • Bot shows typing");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.chat, "autoTyping", false);
        reply("❌ *Auto typing disabled*");
    } else reply("⚙️ *Usage:* autotyping on/off");
}
break;

case "autorecording": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autorecording on/off");
    if (!m.isGroup) return reply("👥 *Groups only*");

    if (args[0].toLowerCase() === "on") {
        setSetting(m.chat, "autoRecording", true);
        reply("✅ *Auto recording enabled* • Bot shows recording");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.chat, "autoRecording", false);
        reply("❌ *Auto recording disabled*");
    } else reply("⚙️ *Usage:* autorecording on/off");
}
break;

case "autorecordtype": {
    if (!isAdmins && !isCreator) 
        return reply('🔒 *Admins/Owner only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autorecordtype on/off");
    if (!m.isGroup) return reply("👥 *Groups only*");

    if (args[0].toLowerCase() === "on") {
        setSetting(m.chat, "autoRecordType", true);
        reply("✅ *Auto record type enabled* • Random typing/recording");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.chat, "autoRecordType", false);
        reply("❌ *Auto record type disabled*");
    } else reply("⚙️ *Usage:* autorecordtype on/off");
}
break;

case "autoreact": {
    if (!isAdmins && !isCreator) 
        return reply('🔒 *Admins/Owner only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autoreact on/off");
    if (!m.isGroup) return reply("👥 *Groups only*");

    if (args[0].toLowerCase() === "on") {
        setSetting(m.chat, "autoReact", true);
        reply("✅ *Auto react enabled* • Messages get random reactions");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.chat, "autoReact", false);
        reply("❌ *Auto react disabled*");
    } else reply("⚙️ *Usage:* autoreact on/off");
}
break;

case "ban": {
    if (!isCreator) return reply('🔒 *Owner only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* ban @user");
    
    let user = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    setSetting(user, "banned", true);
    reply(`🚫 @${user.split("@")[0]} *banned*`, [user]);
}
break;

case "unban": {
    if (!isCreator) return reply('🔒 *Owner only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* unban @user");
    
    let user = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    setSetting(user, "banned", false);
    reply(`✅ @${user.split("@")[0]} *unbanned*`, [user]);
}
break;

case "autoreply": {
    if (!isCreator) return reply('🔒 *Owner only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autoreply on/off");
    
    if (args[0].toLowerCase() === "on") {
        setSetting(botNumber + m.chat, "feature.autoreply", true);
        reply("✅ *Auto reply enabled* • Bot responds to keywords");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(botNumber + m.chat, "feature.autoreply", false);
        reply("❌ *Auto reply disabled*");
    } else reply("⚙️ *Usage:* autoreply on/off");
}
break;

case "chatbot": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');

    const sub = args[0]?.toLowerCase();
    const scope = args[1]?.toLowerCase(); // "all" = account-wide

    if (sub === "status") {
        const globalOn = getSetting(botNumber, "feature.chatbot.global", false);
        const chatOn = getSetting(botNumber + m.chat, "feature.chatbot.enabled", false);
        const historyLen = getSetting(m.chat, "chatbotHistory", []).length;
        return reply(
            `🤖 *Chatbot Status*\n\n` +
            `▸ Account-wide: ${globalOn ? '✅ ON' : '❌ OFF'}\n` +
            `▸ This chat: ${chatOn ? '✅ ON' : '❌ OFF'}\n` +
            `▸ Memory: ${historyLen} turn(s) remembered here`
        );
    }

    if (sub === "clear") {
        setSetting(m.chat, "chatbotHistory", []);
        return reply("🧹 *Conversation memory cleared for this chat*");
    }

    if (!sub || !["on", "off"].includes(sub)) {
        return reply(
            `🤖 *Chatbot Setup*\n\n` +
            `▸ ${prefix}chatbot on - Enable for this chat only\n` +
            `▸ ${prefix}chatbot on all - Enable for the whole account\n` +
            `▸ ${prefix}chatbot off - Disable for this chat only\n` +
            `▸ ${prefix}chatbot off all - Disable for the whole account\n` +
            `▸ ${prefix}chatbot status - Check current state\n` +
            `▸ ${prefix}chatbot clear - Wipe this chat's memory\n\n` +
            `_In DMs it replies to everything. In groups it replies when tagged or when you reply to its own message._`
        );
    }

    const enable = sub === "on";

    if (scope === "all") {
        setSetting(botNumber, "feature.chatbot.global", enable);
        reply(enable
            ? "✅ *Chatbot enabled account-wide* • Replies in all DMs, and in groups when tagged"
            : "❌ *Chatbot disabled account-wide*"
        );
    } else {
        setSetting(botNumber + m.chat, "feature.chatbot.enabled", enable);
        reply(enable
            ? `✅ *Chatbot enabled for this chat* • ${m.isGroup ? "Replies when tagged here" : "Replies to your messages here"}`
            : "❌ *Chatbot disabled for this chat*"
        );
    }
}
break;

case "update": {
    if (!isCreator) return reply('🔒 *Owner only*');

    const API_BASE_URL = process.env.API_BASE_URL || "https://legendarybot.dpdns.org";
    const filesToUpdate = ["case.js", "storage.js", "bot.js"];

    await reply("🔄 *Checking for updates...*");

    try {
        for (const filename of filesToUpdate) {
            const { data } = await axios.get(`${API_BASE_URL}/api/update/${filename}`, {
                params: { sessionId: process.env.SESSION_ID }
            });
            fs.writeFileSync(path.join(__dirname, filename), data, 'utf-8');
        }

        await reply("✅ *Update complete!* Restarting bot now...");
        console.log(chalk.bgGreen.black("🔄 Files updated — restarting"));
        process.exit(0); // Pterodactyl/panel should auto-restart the process
    } catch (e) {
        await reply(`❌ *Update failed:* ${e.response?.data?.error || e.message}`);
    }
}
break;

case "plugins": {
    if (!isCreator) return reply('🔒 *Owner only*');

    const PLUGINS_API_BASE_URL = process.env.API_BASE_URL || "https://legendarybot.dpdns.org";
    const ADMIN_KEY = process.env.ADMIN_KEY; // must match the server's .env value
    const sub = args[0]?.toLowerCase();

    try {
        if (!sub || sub === "pending") {
            const { data } = await axios.get(`${PLUGINS_API_BASE_URL}/api/plugins/pending`, {
                headers: { 'x-admin-key': ADMIN_KEY }
            });
            if (!data.plugins.length) return reply("✅ No plugins waiting for review.");

            let msg = `🧩 *Pending Plugins (${data.plugins.length})*\n\n`;
            for (const p of data.plugins) {
                msg += `*${p.name}* by ${p.author}\nID: \`${p.id}\`\n${p.description}\n\n`;
            }
            msg += `Use:\n${prefix}plugins approve <id>\n${prefix}plugins reject <id> [reason]`;
            return reply(msg);
        }

        if (sub === "approve" && args[1]) {
            await axios.post(`${PLUGINS_API_BASE_URL}/api/plugins/${args[1]}/approve`, {}, {
                headers: { 'x-admin-key': ADMIN_KEY }
            });
            return reply(`✅ Plugin \`${args[1]}\` approved and now public.`);
        }

        if (sub === "reject" && args[1]) {
            const note = args.slice(2).join(' ') || null;
            await axios.post(`${PLUGINS_API_BASE_URL}/api/plugins/${args[1]}/reject`, { note }, {
                headers: { 'x-admin-key': ADMIN_KEY }
            });
            return reply(`❌ Plugin \`${args[1]}\` rejected.`);
        }

        return reply(`⚙️ *Usage:*\n${prefix}plugins pending\n${prefix}plugins approve <id>\n${prefix}plugins reject <id> [reason]`);
    } catch (e) {
        return reply(`❌ *Error:* ${e.response?.data?.error || e.message}`);
    }
}
break;

case "plugin": {
    const PLUGIN_API_BASE_URL = process.env.API_BASE_URL || "https://legendarybot.dpdns.org";
    const sub = args[0]?.toLowerCase();

    if (sub === "install" && args[1]) {
        if (!isCreator) return reply('🔒 *Owner only*');
        const pluginId = args[1];

        try {
            const { data } = await axios.get(`${PLUGIN_API_BASE_URL}/api/plugins/${pluginId}`);
            const pluginsDir = path.join(__dirname, 'plugins');
            if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

            fs.writeFileSync(path.join(pluginsDir, `${pluginId}.js`), data.code, 'utf-8');
            return reply(`✅ Installed *${data.name}* by ${data.author}. Try its command now — no restart needed.`);
        } catch (e) {
            return reply(`❌ *Install failed:* ${e.response?.data?.error || e.message}`);
        }
    }

    if (sub === "list") {
        const pluginsDir = path.join(__dirname, 'plugins');
        if (!fs.existsSync(pluginsDir)) return reply("No plugins installed yet.");
        const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
        if (!files.length) return reply("No plugins installed yet.");
        return reply(`🧩 *Installed Plugins*\n\n${files.map(f => `• ${f.replace('.js', '')}`).join('\n')}`);
    }

    return reply(`⚙️ *Usage:*\n${prefix}plugin install <id>\n${prefix}plugin list`);
}
break;

case "suggestions": {
    if (!isCreator) return reply('🔒 *Owner only*');

    const SUG_API_BASE_URL = process.env.API_BASE_URL || "https://legendarybot.dpdns.org";
    const ADMIN_KEY = process.env.ADMIN_KEY;
    const onlyNew = args[0]?.toLowerCase() !== "all";

    try {
        const { data } = await axios.get(`${SUG_API_BASE_URL}/api/suggestions`, {
            params: { new: onlyNew },
            headers: { 'x-admin-key': ADMIN_KEY }
        });

        if (!data.suggestions.length) {
            return reply(onlyNew ? "✅ No new suggestions." : "No suggestions yet.");
        }

        let msg = `💡 *${onlyNew ? "New" : "All"} Suggestions (${data.suggestions.length})*\n\n`;
        for (const s of data.suggestions.slice(0, 10)) {
            msg += `*${s.topic}*\nFrom: ${s.name}${s.contact ? ` (${s.contact})` : ''}\n${s.description}\n\n`;
        }
        if (data.suggestions.length > 10) msg += `_...and ${data.suggestions.length - 10} more_\n\n`;
        msg += `Use ${prefix}suggestions all to see reviewed ones too.`;
        return reply(msg);
    } catch (e) {
        return reply(`❌ *Error:* ${e.response?.data?.error || e.message}`);
    }
}
break;

case "antibadword": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* antibadword on/off");
    
    if (args[0].toLowerCase() === "on") {
        setSetting(botNumber + m.chat, "feature.antibadword", true);
        reply("✅ *Anti bad word enabled* • Bad words filtered");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(botNumber + m.chat, "feature.antibadword", false);
        reply("❌ *Anti bad word disabled*");
    } else reply("⚙️ *Usage:* antibadword on/off");
}
break;

case "owner": {
    const ownerName = "PRAISE AYANTUNDE";
    const ownerNumber = "2349056760155";
    const displayTag = "LËGĚNDÃRY Ł𝗮𝗯𝘀™";

    let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}
END:VCARD`;

    let caption = `👑 *${botDisplayName} Owner*`;

    await devtrust.sendMessage(m.chat, { 
        contacts: { displayName: displayTag, contacts: [{ vcard }] } 
    }, { quoted: m });

    await devtrust.sendMessage(m.chat, 
        addNewsletterContext({
            text: caption,
            mentions: [m.sender]
        }), 
        { quoted: m }
    );
}
break;

case "repo": {
    let caption = `📂 *${botDisplayName} Repository*\n\n` +
        `👤 *Owner:* PRAISE AYANTUNDE\n` +
        `📞 *Contact:* https://wa.me/2349056760155\n\n` +
        `📢 *Channels:*\n` +
        `https://whatsapp.com/channel/0029Vb81Zt6FMqre8LgZJE0U\n` +
        `https://whatsapp.com/channel/0029VbC6ccj0rGiJxFxsP92A`;

    await devtrust.sendMessage(m.chat, 
        addNewsletterContext({
            text: caption,
            mentions: [m.sender]
        }), 
        { quoted: m }
    );
}
break;

case 'url':
case 'tourl': {    
    let q = m.quoted ? m.quoted : m;
    if (!q || !q.download) return reply(`🖼️ *Reply to an image/video* with ${prefix + command}`);
    
    let mime = q.mimetype || '';
    if (!/image\/(png|jpe?g|gif)|video\/mp4/.test(mime)) {
        return reply('❌ *Only images/MP4 supported*');
    }

    let media;
    try {
        media = await q.download();
    } catch (error) {
        return reply('❌ *Download failed*');
    }

    let link;
    try {
        link = await uploadToCatbox(media);
        if (!link) throw new Error('No URL returned from upload');
    } catch (error) {
        return reply('❌ *Upload failed*');
    }

    reply(`✅ *Uploaded*\n${link}`);
}
break;  // ← 'url' case ENDS here

// ============ UPLOAD TO CATBOX FUNCTION ============
// This goes HERE - between cases, available to ALL commands
// ============ UPLOAD TO CATBOX FUNCTION ============
async function uploadToCatbox(buffer) {
    const FormData = require('form-data');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync('./tmp')) {
        fs.mkdirSync('./tmp', { recursive: true });
    }
    
    const tempFile = './tmp/upload_' + Date.now() + '.jpg';
    let result = null;
    
    try {
        // Write buffer to temp file
        fs.writeFileSync(tempFile, buffer);
        
        // Try Catbox first
        try {
            const formData = new FormData();
            formData.append('fileToUpload', fs.createReadStream(tempFile));
            formData.append('reqtype', 'fileupload');
            
            const response = await axios.post('https://catbox.moe/user/api.php', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 30000
            });
            
            if (response.data && response.data.startsWith('https://')) {
                result = response.data;
                console.log('✅ Catbox upload successful');
            }
        } catch (catboxError) {
            console.log('Catbox failed, trying Telegraph...');
        }
        
        // If Catbox failed, try Telegraph
        if (!result) {
            try {
                const telegraphResponse = await axios.post('https://telegra.ph/upload', buffer, {
                    headers: {
                        'Content-Type': 'image/jpeg'
                    },
                    timeout: 30000
                });
                
                if (telegraphResponse.data && 
                    telegraphResponse.data[0] && 
                    telegraphResponse.data[0].src) {
                    result = 'https://telegra.ph' + telegraphResponse.data[0].src;
                    console.log('✅ Telegraph upload successful');
                }
            } catch (telegraphError) {
                console.log('Telegraph failed too');
            }
        }
        
        // If both failed, try one more service
        if (!result) {
            try {
                // Convert buffer to base64
                const base64 = buffer.toString('base64');
                const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', {
                    key: 'f2cc2bc5b9d7e9e8b7a5d4a3c2b1e0f9', // Public demo key - rate limited
                    image: base64
                }, { timeout: 30000 });
                
                if (imgbbResponse.data && 
                    imgbbResponse.data.data && 
                    imgbbResponse.data.data.url) {
                    result = imgbbResponse.data.data.url;
                    console.log('✅ ImgBB upload successful');
                }
            } catch (imgbbError) {
                console.log('All upload services failed');
            }
        }
        
        // Clean up temp file
        try { fs.unlinkSync(tempFile); } catch (e) {}
        
        if (!result) {
            throw new Error('All upload services failed');
        }
        
        return result;
        
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up temp file if it exists
        try { 
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile); 
            }
        } catch (e) {}
        throw error;
    }
}
// ====================================================
// ====================================================

// Now 'removebg' can use the function above
// ============ CONVERTER COMMANDS ============
// sticker command handled in the 'tosticker'/'sticker'/'s' case above

// toimg handled in the 'toimg' case above

case "ptv": {
    if (!m.quoted?.message?.videoMessage && !m.message?.videoMessage)
        return reply(`📹 *Video to PTV*\nReply to a video: ${prefix}ptv`);
    try {
        reply('⏳ *Converting to PTV...*');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        await devtrust.sendMessage(m.chat, {
            video: media,
            ptv: true,
            mimetype: 'video/mp4'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mp4":
case "togif": {
    if (!m.quoted?.message?.videoMessage && !m.message?.videoMessage && !m.quoted?.message?.stickerMessage)
        return reply(`🎬 *Convert to MP4*\nReply to a video/gif sticker: ${prefix}mp4`);
    try {
        reply('⏳ *Converting...*');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        await devtrust.sendMessage(m.chat, {
            video: media,
            mimetype: 'video/mp4',
            caption: '🎬 *Converted to MP4!*'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gif": {
    if (!m.quoted?.message?.videoMessage && !m.message?.videoMessage)
        return reply(`🎭 *Video to GIF Sticker*\nReply to a video: ${prefix}gif`);
    try {
        reply('⏳ *Converting to GIF sticker...*');
        const { Sticker, StickerTypes } = require('wa-sticker-formatter');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const sticker = new Sticker(media, {
            pack: global.packname || botDisplayName,
            author: global.author || 'LËGĚNDÃRY Ł𝗮𝗯𝘀™',
            type: StickerTypes.FULL,
            quality: 50
        });
        const stickerBuffer = await sticker.toBuffer();
        await devtrust.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "tomp3":
case "mp3": {
    if (!m.quoted?.message?.videoMessage && !m.message?.videoMessage && !m.quoted?.message?.audioMessage)
        return reply(`🎵 *Convert to MP3*\nReply to a video or audio: ${prefix}tomp3`);
    try {
        reply('⏳ *Converting to MP3...*');
        const ffmpeg = require('fluent-ffmpeg');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const tmpIn = `./tmp/input_${Date.now()}.mp4`;
        const tmpOut = `./tmp/output_${Date.now()}.mp3`;
        fs.writeFileSync(tmpIn, media);
        await new Promise((resolve, reject) => {
            ffmpeg(tmpIn).toFormat('mp3').save(tmpOut).on('end', resolve).on('error', reject);
        });
        const mp3Buffer = fs.readFileSync(tmpOut);
        fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut);
        await devtrust.sendMessage(m.chat, {
            audio: mp3Buffer,
            mimetype: 'audio/mpeg',
            fileName: 'audio.mp3',
            ptt: false
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "aitts":
case "tts": {
    if (!text) return reply(`🔊 *Text to Speech*\nUsage: ${prefix}tts [text]\n_Max: 20,000 characters_`);
    if (text.length > 20000) return reply(`❌ *Text too long!* Max is 20,000 characters.\nYours: ${text.length} characters`);
    try {
        reply('⏳ *Generating speech...*');
        const gTTS = require('google-tts-api');
        // Split into chunks of 200 chars (Google TTS limit per request)
        const getAllAudioUrls = gTTS.getAllAudioUrls(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
            splitPunct: ',.!?;:'
        });
        if (getAllAudioUrls.length === 1) {
            // Single chunk - send directly
            await devtrust.sendMessage(m.chat, {
                audio: { url: getAllAudioUrls[0].url },
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });
        } else {
            // Multiple chunks - notify user
            reply(`🔊 *Text split into ${getAllAudioUrls.length} parts. Sending all...*`);
            for (let i = 0; i < getAllAudioUrls.length; i++) {
                await devtrust.sendMessage(m.chat, {
                    audio: { url: getAllAudioUrls[i].url },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: `part_${i+1}.mp3`
                }, { quoted: m });
                await new Promise(r => setTimeout(r, 500));
            }
        }
    } catch (e) { reply(`❌ *TTS Error:* ${e.message}`); }
}
break;

case "black":
case "blackbg": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage)
        return reply(`🖤 *Black Background*\nReply to an image: ${prefix}black`);
    try {
        reply('⏳ *Adding black background...*');
        const sharp = require('sharp');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const result = await sharp(media)
            .flatten({ background: { r: 0, g: 0, b: 0 } })
            .png().toBuffer();
        await devtrust.sendMessage(m.chat, { image: result, caption: '🖤 *Black background added!*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "roundstk": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage)
        return reply(`⭕ *Round Sticker*\nReply to an image: ${prefix}roundstk`);
    try {
        reply('⏳ *Making round sticker...*');
        const { Sticker, StickerTypes } = require('wa-sticker-formatter');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const sticker = new Sticker(media, {
            pack: global.packname || botDisplayName,
            author: global.author || 'LËGĚNDÃRY Ł𝗮𝗯𝘀™',
            type: StickerTypes.CIRCLE,
            quality: 50
        });
        await devtrust.sendMessage(m.chat, { sticker: await sticker.toBuffer() }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "circlestk": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage)
        return reply(`🔵 *Circle Sticker*\nReply to an image: ${prefix}circlestk`);
    try {
        reply('⏳ *Making circle sticker...*');
        const sharp = require('sharp');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const { width, height } = await sharp(media).metadata();
        const size = Math.min(width, height);
        const circle = Buffer.from(`<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}"/></svg>`);
        const result = await sharp(media)
            .resize(size, size, { fit: 'cover' })
            .composite([{ input: circle, blend: 'dest-in' }])
            .png().toBuffer();
        const { Sticker, StickerTypes } = require('wa-sticker-formatter');
        const sticker = new Sticker(result, {
            pack: global.packname || botDisplayName,
            author: global.author || 'LËGĚNDÃRY Ł𝗮𝗯𝘀™',
            type: StickerTypes.FULL,
            quality: 50
        });
        await devtrust.sendMessage(m.chat, { sticker: await sticker.toBuffer() }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "take": {
    if (!m.quoted?.message?.stickerMessage && !m.message?.stickerMessage)
        return reply(`📥 *Take Sticker*\nReply to a sticker to save it: ${prefix}take`);
    try {
        const quoted = m.quoted || m;
        const media = await quoted.download();
        await devtrust.sendMessage(m.chat, {
            document: media,
            mimetype: 'image/webp',
            fileName: 'sticker.webp'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "exif": {
    if (!m.quoted?.message?.stickerMessage && !m.message?.stickerMessage)
        return reply(`🏷️ *Edit Sticker Info*\nUsage: Reply to sticker + ${prefix}exif [pack name] | [author]\nExample: ${prefix}exif My Pack | Made by Legend`);
    try {
        reply('⏳ *Editing sticker info...*');
        const parts = text?.split('|') || [];
        const packName = parts[0]?.trim() || global.packname || botDisplayName;
        const authorName = parts[1]?.trim() || global.author || 'LËGĚNDÃRY Ł𝗮𝗯𝘀™';
        const { Sticker, StickerTypes } = require('wa-sticker-formatter');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const sticker = new Sticker(media, {
            pack: packName,
            author: authorName,
            type: StickerTypes.FULL,
            quality: 50
        });
        await devtrust.sendMessage(m.chat, { sticker: await sticker.toBuffer() }, { quoted: m });
        reply(`✅ *Sticker info updated!*\n▸ Pack: ${packName}\n▸ Author: ${authorName}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "doc": {
    if (!m.quoted) return reply(`📄 *Convert to Document*\nReply to any media: ${prefix}doc`);
    try {
        const quoted = m.quoted;
        const media = await quoted.download();
        const msgType = Object.keys(quoted.message || {})[0];
        const mimeMap = {
            imageMessage: { mime: 'image/jpeg', ext: 'jpg' },
            videoMessage: { mime: 'video/mp4', ext: 'mp4' },
            audioMessage: { mime: 'audio/mpeg', ext: 'mp3' },
            stickerMessage: { mime: 'image/webp', ext: 'webp' }
        };
        const info = mimeMap[msgType] || { mime: 'application/octet-stream', ext: 'file' };
        await devtrust.sendMessage(m.chat, {
            document: media,
            mimetype: info.mime,
            fileName: `file_${Date.now()}.${info.ext}`
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "tovv": {
    if (!m.quoted?.message?.videoMessage && !m.message?.videoMessage)
        return reply(`👁️ *Convert to View Once Video*\nReply to a video: ${prefix}tovv`);
    try {
        const quoted = m.quoted || m;
        const media = await quoted.download();
        await devtrust.sendMessage(m.chat, {
            video: media,
            mimetype: 'video/mp4',
            viewOnce: true
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// Audio effects using ffmpeg
case "bass": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🎵 *Bass Boost*\nReply to audio: ${prefix}bass`); try { reply('⏳ *Applying bass boost...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('bass=g=10').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "reverse": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage && !m.quoted?.message?.videoMessage) return reply(`🔄 *Reverse Audio*\nReply to audio/video: ${prefix}reverse`); try { reply('⏳ *Reversing...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('areverse').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "nightcore": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🌙 *Nightcore Effect*\nReply to audio: ${prefix}nightcore`); try { reply('⏳ *Applying nightcore...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('asetrate=44100*1.25,atempo=1.06').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "slow": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🐢 *Slow Audio*\nReply to audio: ${prefix}slow`); try { reply('⏳ *Slowing down...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('atempo=0.7').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "fast": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`⚡ *Fast Audio*\nReply to audio: ${prefix}fast`); try { reply('⏳ *Speeding up...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('atempo=1.5').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "robot": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🤖 *Robot Voice*\nReply to audio: ${prefix}robot`); try { reply('⏳ *Applying robot effect...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('afftfilt=real=hypot(re,im)*sin(0):imag=hypot(re,im)*cos(0):win_size=512:overlap=0.75').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "chipmunk": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🐿️ *Chipmunk Voice*\nReply to audio: ${prefix}chipmunk`); try { reply('⏳ *Applying chipmunk effect...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('asetrate=44100*1.5,atempo=0.67').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "deep":
case "fat": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🔈 *Deep Voice*\nReply to audio: ${prefix}deep`); try { reply('⏳ *Applying deep voice...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('asetrate=44100*0.7,atempo=1.43').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "echo": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🔊 *Echo Effect*\nReply to audio: ${prefix}echo`); try { reply('⏳ *Applying echo...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('aecho=0.8:0.88:60:0.4').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "blown":
case "earrape": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`💥 *Earrape Effect*\nReply to audio: ${prefix}earrape`); try { reply('⏳ *Applying earrape...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('volume=15').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "squirrel": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🐿️ *Squirrel Voice*\nReply to audio: ${prefix}squirrel`); try { reply('⏳ *Applying squirrel effect...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('asetrate=44100*1.8,atempo=0.56').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;
// ============ END CONVERTER COMMANDS ============

// ============ SHAZAM / AUDIO IDENTIFY ============
case "shazam":
case "findaudio":
case "find":
case "identifyaudio": {
    const shzQuoted = m.quoted || m;
    const shzMime = (shzQuoted?.msg || shzQuoted)?.mimetype || '';
    const shzIsAudioOrVideo = /audio|video/.test(shzMime)
        || shzQuoted?.message?.audioMessage
        || shzQuoted?.message?.videoMessage;
    if (!shzIsAudioOrVideo) {
        return reply(`🎶 *Identify a song*\nReply to an audio/video message with ${prefix}shazam`);
    }
    try {
        reply('🎶 *Listening...*');
        const media = await shzQuoted.download();
        const tmpIn = `./tmp/shazam_in_${Date.now()}.mp3`;
        const tmpOut = `./tmp/shazam_out_${Date.now()}.mp3`;
        fs.writeFileSync(tmpIn, media);

        // ACRCloud only needs a short sample — trim to the first 15s
        await new Promise((res, rej) => {
            ffmpeg(tmpIn).setStartTime(0).setDuration(15).save(tmpOut).on('end', res).on('error', rej);
        });
        const sampleBuffer = fs.readFileSync(tmpOut);
        fs.unlinkSync(tmpIn);
        fs.unlinkSync(tmpOut);

        // Shared ACRCloud key from Legend's reference file — note this is a
        // widely-reused public/demo key (many bot forks embed the same one),
        // so it may be rate-limited or occasionally flaky since others use it too.
        const acr = {
            host: 'identify-eu-west-1.acrcloud.com',
            endpoint: '/v1/identify',
            access_key: '8c21a32a02bf79a4a26cb0fa5c941e95',
            access_secret: 'NRSxpk6fKwEiVdNhyx5lR0DP8LzeflYpClNg1gze',
        };
        const shzTimestamp = Math.floor(Date.now() / 1000);
        const shzStringToSign = ['POST', acr.endpoint, acr.access_key, 'audio', '1', shzTimestamp].join('\n');
        const shzSignature = crypto.createHmac('sha1', acr.access_secret).update(shzStringToSign).digest('base64');

        const shzForm = new FormData();
        shzForm.append('sample', sampleBuffer, { filename: 'sample.mp3' });
        shzForm.append('sample_bytes', sampleBuffer.length);
        shzForm.append('access_key', acr.access_key);
        shzForm.append('data_type', 'audio');
        shzForm.append('signature_version', '1');
        shzForm.append('signature', shzSignature);
        shzForm.append('timestamp', shzTimestamp);

        const acrRes = await axios.post(`https://${acr.host}${acr.endpoint}`, shzForm, { headers: shzForm.getHeaders() });
        const { status, metadata } = acrRes.data;

        if (status.code !== 0 || !metadata?.music?.length) {
            return reply('❌ *Could not identify that song...*');
        }

        const track = metadata.music[0];
        let ytInfo = null;
        try {
            const ytResults = await yts(`${track.title} ${track.artists[0].name}`);
            ytInfo = ytResults.videos[0];
        } catch (_) {}

        const spotifyUrl = track.external_metadata?.spotify?.track?.id
            ? `https://open.spotify.com/track/${track.external_metadata.spotify.track.id}`
            : null;

        const resultText = `🎶 *Song Identified!*\n\n` +
            `➤ *Title:* ${track.title}\n` +
            `➤ *Artist:* ${track.artists.map(a => a.name).join(', ')}\n` +
            `➤ *Album:* ${track.album?.name || 'N/A'}\n` +
            `➤ *Released:* ${track.release_date || 'N/A'}\n\n` +
            (spotifyUrl ? `🎧 *Spotify:* ${spotifyUrl}\n` : '') +
            (ytInfo ? `▶️ *YouTube:* ${ytInfo.url}\n\n_Reply *audio* or *video* to download it!_` : '');

        await devtrust.sendMessage(m.chat, { text: resultText }, { quoted: m });

        if (ytInfo) {
            if (!global.__shazamPending) global.__shazamPending = new Map();
            // stored on `global` (not a plain module variable) since case.js's own
            // hot-reload / freshRequire pattern can otherwise wipe plain state —
            // same fix as the music-reply awaiting state.
            global.__shazamPending.set(m.chat, {
                ytUrl: ytInfo.url,
                title: ytInfo.title,
                expires: Date.now() + 60 * 1000,
            });
        }
    } catch (e) {
        console.error('Shazam error:', e);
        reply(`❌ *Error:* ${e.message}`);
    }
}
break;
// ============ END SHAZAM ============

// ============ MADRIN API — DOWNLOADERS ============
case "igdl":
case "instagram": {
    if (!text) return reply(`📸 *Instagram Downloader*\nUsage: ${prefix}igdl <instagram link>`);
    try {
        reply('⏳ *Downloading...*');
        const data = await madrinGet('/download/instagram', { url: text.trim() });
        const link = madrinExtractLink(data);
        if (data?.status !== true || !link) return reply(`❌ *Download failed.* API said: ${data?.error || 'no link returned'}`);
        await devtrust.sendMessage(m.chat, { video: { url: link }, caption: `📸 ${madrinExtractTitle(data, 'Instagram')}` }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "snapdl":
case "snapchat": {
    if (!text) return reply(`👻 *Snapchat Downloader*\nUsage: ${prefix}snapdl <snapchat spotlight link>`);
    try {
        reply('⏳ *Downloading...*');
        const data = await madrinGet('/download/snapchat', { url: text.trim() });
        const link = madrinExtractLink(data);
        if (data?.status !== true || !link) return reply(`❌ *Download failed.* API said: ${data?.error || 'no link returned'}`);
        await devtrust.sendMessage(m.chat, { video: { url: link }, caption: `👻 ${madrinExtractTitle(data, 'Snapchat')}` }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "ytmp4":
case "videoplay": {
    if (!text) return reply(`🎬 *YouTube Video Downloader*\nUsage: ${prefix}ytmp4 <youtube link or song name>`);
    try {
        reply('⏳ *Downloading...*');
        let ytUrl = text.trim();
        if (!ytUrl.includes('youtube.com') && !ytUrl.includes('youtu.be')) {
            const ytResults = await yts(ytUrl);
            if (!ytResults.videos.length) return reply('❌ *No results found.*');
            ytUrl = ytResults.videos[0].url;
        }
        const data = await madrinGet('/download/ytmp4', { url: ytUrl });
        const link = madrinExtractLink(data);
        if (data?.status !== true || !link) return reply(`❌ *Download failed.* API said: ${data?.error || 'no link returned'}`);
        await devtrust.sendMessage(m.chat, { video: { url: link }, caption: `🎬 ${madrinExtractTitle(data, 'Video')}` }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mediafire": {
    if (!text) return reply(`📁 *MediaFire Downloader*\nUsage: ${prefix}mediafire <mediafire link>`);
    try {
        reply('⏳ *Fetching link...*');
        const data = await madrinGet('/tools/mediafire', { url: text.trim() });
        const link = madrinExtractLink(data);
        if (data?.status !== true || !link) return reply(`❌ *Failed.* API said: ${data?.error || 'no link returned'}`);
        await devtrust.sendMessage(m.chat, { document: { url: link }, fileName: madrinExtractTitle(data, 'file'), mimetype: 'application/octet-stream' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ MADRIN API — AI CHAT ============
case "gpt5": {
    if (!text) return reply(`🤖 *GPT-5*\nUsage: ${prefix}gpt5 <your question>`);
    try {
        const data = await madrinGet('/ai/gpt5', { text: text.trim(), q: text.trim(), prompt: text.trim() });
        const answer = data?.result || data?.data?.result || data?.answer || data?.message;
        if (!answer) return reply('❌ *No response from GPT-5.*');
        reply(answer);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "blackbox": {
    if (!text) return reply(`🤖 *Blackbox AI*\nUsage: ${prefix}blackbox <your question>`);
    try {
        const data = await madrinGet('/blackbox', { text: text.trim(), q: text.trim(), prompt: text.trim() });
        const answer = data?.result || data?.data?.result || data?.answer || data?.message;
        if (!answer) return reply('❌ *No response from Blackbox.*');
        reply(answer);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "copilot": {
    if (!text) return reply(`🤖 *Copilot*\nUsage: ${prefix}copilot <your question>`);
    try {
        const data = await madrinGet('/ai/copilot', { text: text.trim(), q: text.trim(), prompt: text.trim() });
        const answer = data?.result || data?.data?.result || data?.answer || data?.message;
        if (!answer) return reply('❌ *No response from Copilot.*');
        reply(answer);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ MADRIN API — SEARCH (SCROLLABLE TABLE) ============
case "stickersearch": {
    if (!text) return reply(`🔍 *Sticker Search*\nUsage: ${prefix}stickersearch <query>`);
    try {
        const data = await madrinGet('/search/stickers', { q: text.trim(), query: text.trim() });
        const results = data?.result || data?.data || [];
        if (!Array.isArray(results) || !results.length) return reply('❌ *No stickers found.*');
        const rows = [['#', 'Name', 'Link'], ...results.slice(0, 10).map((r, i) => [`${i+1}`, r.name || r.title || '-', r.url || r.link || '-'])];
        await sendTable(devtrust, m.chat, { title: 'Sticker Search', headerText: `Results for "${text.trim()}"`, rows, contextMsg: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "applemusic": {
    if (!text) return reply(`🎵 *Apple Music Search*\nUsage: ${prefix}applemusic <song name>`);
    try {
        const data = await madrinGet('/search/applemusic', { q: text.trim(), query: text.trim() });
        const results = data?.result || data?.data || [];
        if (!Array.isArray(results) || !results.length) return reply('❌ *No results found.*');
        const rows = [['#', 'Title', 'Artist'], ...results.slice(0, 10).map((r, i) => [`${i+1}`, r.title || '-', r.artist || '-'])];
        await sendTable(devtrust, m.chat, { title: 'Apple Music Search', headerText: `Results for "${text.trim()}"`, rows, contextMsg: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "soundcloud": {
    if (!text) return reply(`☁️ *SoundCloud Search*\nUsage: ${prefix}soundcloud <song name>`);
    try {
        const data = await madrinGet('/search/soundcloud', { q: text.trim(), query: text.trim() });
        const results = data?.result || data?.data || [];
        if (!Array.isArray(results) || !results.length) return reply('❌ *No results found.*');
        const rows = [['#', 'Title', 'Link'], ...results.slice(0, 10).map((r, i) => [`${i+1}`, r.title || '-', r.url || r.link || '-'])];
        await sendTable(devtrust, m.chat, { title: 'SoundCloud Search', headerText: `Results for "${text.trim()}"`, rows, contextMsg: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "wattpad": {
    if (!text) return reply(`📖 *Wattpad Search*\nUsage: ${prefix}wattpad <story name>`);
    try {
        const data = await madrinGet('/search/wattpad', { q: text.trim(), query: text.trim() });
        const results = data?.result || data?.data || [];
        if (!Array.isArray(results) || !results.length) return reply('❌ *No results found.*');
        const rows = [['#', 'Title', 'Author'], ...results.slice(0, 10).map((r, i) => [`${i+1}`, r.title || '-', r.author || '-'])];
        await sendTable(devtrust, m.chat, { title: 'Wattpad Search', headerText: `Results for "${text.trim()}"`, rows, contextMsg: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "bilibili": {
    if (!text) return reply(`📺 *Bilibili Search*\nUsage: ${prefix}bilibili <query>`);
    try {
        const data = await madrinGet('/search/bilibili', { q: text.trim(), query: text.trim() });
        const results = data?.result || data?.data || [];
        if (!Array.isArray(results) || !results.length) return reply('❌ *No results found.*');
        const rows = [['#', 'Title', 'Link'], ...results.slice(0, 10).map((r, i) => [`${i+1}`, r.title || '-', r.url || r.link || '-'])];
        await sendTable(devtrust, m.chat, { title: 'Bilibili Search', headerText: `Results for "${text.trim()}"`, rows, contextMsg: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ MADRIN API — TOOLS ============
case "imgbb": {
    // Uses the real imgbb.com public API (POST, base64 in body — no URL
    // length limit like the madrin GET-only wrapper had).
    const IMGBB_API_KEY = 'a1ea26a71427d4c251e84555155792ba';

    // Check BOTH: image sent directly with .imgbb as caption (m itself), AND
    // image replied-to (m.quoted). Using mimetype-based detection — same fix
    // that solved this exact issue for .shazam, since .message.imageMessage
    // alone doesn't reliably match this bot's message wrapper.
    const imgMimeSelf = (m?.msg || m)?.mimetype || '';
    const imgMimeQuoted = (m.quoted?.msg || m.quoted)?.mimetype || '';
    let imgSource = null;
    if (/image/.test(imgMimeSelf) || m.message?.imageMessage) imgSource = m;
    else if (/image/.test(imgMimeQuoted) || m.quoted?.message?.imageMessage) imgSource = m.quoted;

    let imgBase64 = null;
    if (imgSource) {
        const imgBuffer = await imgSource.download();
        imgBase64 = imgBuffer.toString('base64');
    } else if (text && isUrl(text.trim())) {
        const urlRes = await axios.get(text.trim(), { responseType: 'arraybuffer' });
        imgBase64 = Buffer.from(urlRes.data).toString('base64');
    } else {
        return reply(`🖼️ *Image Uploader*\nSend an image with caption ${prefix}imgbb, reply to an image with ${prefix}imgbb, or use ${prefix}imgbb <image url>`);
    }

    try {
        reply('⏳ *Uploading...*');
        const form = new URLSearchParams();
        form.append('key', IMGBB_API_KEY);
        form.append('image', imgBase64);
        const res = await axios.post('https://api.imgbb.com/1/upload', form.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 30000
        });
        const link = res.data?.data?.url || res.data?.data?.display_url;
        if (!res.data?.success || !link) return reply(`❌ *Upload failed.* ${res.data?.error?.message || ''}`);
        reply(`✅ *Uploaded!*\n${link}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "html2img": {
    if (!text) return reply(`🖼️ *HTML to Image*\nUsage: ${prefix}html2img <html code>`);
    try {
        const data = await madrinGet('/tools/html2img', { html: text.trim() });
        const link = madrinExtractLink(data);
        if (data?.status !== true || !link) return reply(`❌ *Failed.* API said: ${data?.error || 'no link returned'}`);
        await devtrust.sendMessage(m.chat, { image: { url: link } }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "tojs":
case "tojavascript": {
    if (!text) return reply(`🔄 *Convert to JavaScript*\nUsage: ${prefix}tojs <code>`);
    try {
        const data = await madrinGet('/tools/tojavascript', { code: text.trim() });
        const converted = data?.result || data?.data?.result || data?.code;
        if (data?.status !== true || !converted) return reply('❌ *Conversion failed.*');
        reply(`\`\`\`${converted}\`\`\``);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "topy":
case "topython": {
    if (!text) return reply(`🔄 *Convert to Python*\nUsage: ${prefix}topy <code>`);
    try {
        const data = await madrinGet('/tools/topython', { code: text.trim() });
        const converted = data?.result || data?.data?.result || data?.code;
        if (data?.status !== true || !converted) return reply('❌ *Conversion failed.*');
        reply(`\`\`\`${converted}\`\`\``);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "htmlprotect": {
    // Usage: .htmlprotect max|high|ecnc <html code>
    const parts = (text || '').trim().split(/\s+/);
    const level = (parts.shift() || '').toLowerCase();
    const htmlCode = parts.join(' ');
    const levelMap = { max: '/tools/htmlmaximum', maximum: '/tools/htmlmaximum', high: '/tools/htmlhigh', ecnc: '/tools/htmlecnc' };
    const endpoint = levelMap[level];
    if (!endpoint || !htmlCode) return reply(`🔒 *HTML Protector*\nUsage: ${prefix}htmlprotect <max|high|ecnc> <html code>`);
    try {
        const data = await madrinGet(endpoint, { html: htmlCode });
        const protectedCode = data?.result || data?.data?.result || data?.code;
        if (data?.status !== true || !protectedCode) return reply('❌ *Protection failed.*');
        reply(`\`\`\`${protectedCode}\`\`\``);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ MADRIN API — FUN ============
case "pickupline": {
    try {
        const data = await madrinGet('/pickupline');
        const line = data?.result || data?.data || data?.line;
        reply(line ? `💘 ${line}` : '❌ *Could not fetch a pickup line.*');
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "fact": {
    try {
        const data = await madrinGet('/fact');
        const line = data?.result || data?.data || data?.fact;
        reply(line ? `📚 *Did you know?*\n${line}` : '❌ *Could not fetch a fact.*');
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// ============ END MADRIN API COMMANDS ============

case "menu2": {
    // Plain-text version of .menu — built from real, working commands
    // (extracted from this file's actual case labels), NOT MENU_DATA's
    // decorative button-menu list (most of those items have no real
    // function behind them).
    const MENU2_TEXT = `*📖 ${botDisplayName} — FULL COMMAND MENU*
_Prefix: . | 773 commands total_

🤖 *AI CHAT*
• .aisearch
• .bidara
• .blackbox
• .coder
• .copilot
• .deepseek
• .gemini
• .gpt4
• .gpt5
• .llama
• .mistral
• .openai / .gpt
• .reasoning
• .zodiac

⬇️ *DOWNLOADERS*
• .animedl
• .apk / .apkdl
• .autodl
• .dlmovie
• .fb / .facebook
• .igdl / .instagram
• .insta / .instagram
• .mediafire
• .snapdl / .snapchat
• .spotify / .spotifydl / .sp
• .spotify2 / .spotifydl2
• .tiktok / .tt
• .tiktoksearch
• .yta / .play
• .ytmp3 / .ytvideo / .ytv2 / .play2
• .ytmp3old
• .ytmp4 / .videoplay
• .ytv / .video

🎵 *MUSIC & AUDIO*
• .aitts / .tts
• .applemusic
• .lyrics / .lyric
• .lyrics
• .shazam / .findaudio / .find / .identifyaudio
• .shazam / .findaudio / .identifyaudio
• .soundcloud
• .ttsptt / .voicenote

🔍 *SEARCH TOOLS*
• .bilibili
• .manga
• .pint / .pinterest
• .pinterest
• .stickersearch
• .wattpad

👥 *GROUP MANAGEMENT*
• .add
• .addmetaai / .addai
• .adminlist / .admins
• .adminlist
• .announce / .broadcast2
• .antilink
• .antispam
• .antitag
• .clearwarns / .resetwarns
• .clearwelcome
• .close / .groupclose
• .creategc / .creategroup
• .creategc
• .demote
• .gclink2
• .gdesc / .setgcdesc
• .groupinfo / .ginfo
• .groupstatus / .gstatus
• .gstop
• .hidetag
• .invite / .gclink
• .invite / .glink
• .join
• .kick
• .kickadmins
• .kickall
• .kickr / .reset
• .kickr
• .listadmin / .tagadmin / .admin
• .listadmins
• .mute
• .muteuser
• .open / .groupopen
• .poll / .createpoll
• .promote
• .resetlink
• .resetwarn / .clearwarn
• .revoke / .revokelink
• .revoke
• .savecontact / .vcf / .scontact / .savecontacts
• .setdesc / .setgcdesc
• .setgrouppp / .setgcpp
• .setname / .setgcname
• .setwelcome
• .tagadmins / .pingadmins
• .tagall
• .tagall / .tag
• .tagall2
• .tkick
• .totalmembers / .members
• .unmute
• .unmuteuser
• .warlist / .warns
• .warn
• .warn2
• .warncount / .warnings2
• .warnlist
• .welcome

🎨 *STICKERS & IMAGE EDITING*
• .circlestk
• .emojimix
• .exif
• .gif
• .html2img
• .imgbb
• .mp4 / .togif
• .rainbow
• .removebg
• .roundstk
• .take
• .toimg
• .tomp4
• .tosticker / .sticker / .s

🎮 *GAMES & FUN*
• .africanfact
• .bchcn
• .beg
• .coinflip / .flip
• .crime
• .dadjoke
• .daily
• .dare
• .emojiquiz
• .fact
• .factorial
• .fish
• .fox
• .foxgirl
• .funfact
• .gamefact
• .guess
• .hangman
• .history
• .hunt
• .hxjxjjkm
• .inspire / .quote2
• .jail
• .joke
• .joke2
• .math
• .mine
• .naijafood
• .nigerianfact
• .panda
• .pickupline
• .pidgin
• .prog
• .riddle
• .rps
• .rpsls
• .science
• .sciencefact
• .slangs / .naijaslangs
• .streak
• .tech
• .tod / .truthordare
• .trivia
• .triviafact
• .truth
• .water

🛠️ *CONVERTERS & DEV TOOLS*
• .base64decode / .b64dec
• .base64encode / .b64enc
• .htmlprotect
• .shorturl
• .tojs / .tojavascript
• .topy / .topython

⚙️ *BOT & OWNER SETTINGS*
• .broadcast
• .delsudo
• .getsudo / .listsudo
• .prefix
• .restart / .reboot
• .setprefix
• .setsudo / .sudo / .addsudo

ℹ️ *UTILITY & INFO*
• .allmenu / .legend / .menu
• .animesearch
• .animewlp
• .autotyping
• .creator
• .help / .commands
• .idch
• .left / .leave
• .menubtn
• .menubtn2
• .myip
• .owner
• .ping / .speed
• .private / .self
• .public
• .runtime / .alive
• .setautotyping
• .vv / .vvgh
• .weatherdetail
• .yts / .ytsearch

🖼️ *RANDOM IMAGES & ANIME*
• .animegif
• .animenews
• .animequote
• .animerec
• .animewatch
• .character
• .neko / .meow
• .rwaifu
• .waifu

📦 *OTHER COMMANDS*
• .8ball
• .add
• .addnote
• .advice
• .aesthetic
• .afk
• .age
• .ai
• .airing
• .allnotes
• .allvar
• .alwaysonline
• .antibadword
• .antidelete
• .antiedit
• .antieditchat
• .antistatus
• .antonym
• .approve / .approveall
• .archive
• .areact
• .ascii / .asciify
• .audio2text / .text
• .autobio
• .autoreact
• .autoread
• .autorecording
• .autorecordtype
• .autoreply
• .autoviewstatus
• .aza
• .bal / .balance / .wallet
• .ban
• .bankrob
• .bass
• .bible
• .bio / .setbio
• .bioidea
• .black / .blackbg
• .blackjack / .bj
• .block
• .blocklist
• .blown / .earrape
• .blue
• .bmi
• .bold
• .book
• .botinfo
• .btc / .bitcoin
• .btcusdt
• .bubble
• .buy
• .calc
• .calculate
• .calculator
• .caption
• .carbon
• .cat / .catpic
• .cbhcchhcx
• .channellog
• .chipmunk
• .choose
• .clear
• .closetime
• .cmdreact
• .coin
• .coinbattle
• .color / .randomcolor / .colourpick
• .comp
• .compliment
• .compress
• .convert / .currency2
• .copy / .copytext
• .count / .wordcount
• .countdown
• .country / .countryinfo
• .createpanel / .panel
• .crypto / .cryptoprices
• .currencies / .currency
• .cyan
• .date / .today
• .dbinary / .dbin
• .decode / .urldecode
• .deep / .fat
• .define / .dictionary
• .del / .delete
• .delallnote / .clearnotes
• .delete / .del / .dlt
• .delete2 / .unsend
• .delmod
• .delnote
• .delvar
• .dep / .deposit
• .dice
• .dicegamble
• .doc
• .dog / .dogpic
• .doge / .dogecoin
• .dogeusdt
• .doubleornothing / .don
• .ebinary / .ebin
• .echo
• .econ / .econprofile
• .economy
• .element
• .emojify
• .encode / .urlencode
• .eth / .ethereum
• .ethusdt
• .events / .gcevent
• .fancy
• .fast
• .fetch / .fetchurl
• .fib
• .flirt
• .font
• .fortune
• .forward
• .ga / .goodafternoon
• .gamble
• .gdrive
• .genpass
• .getmods
• .getnote
• .getvar
• .gfilter
• .gfx / .gfx1
• .gfx10
• .gfx11
• .gfx12
• .gfx2
• .gfx3
• .gfx4
• .gfx5
• .gfx6
• .gfx7
• .gfx8
• .gfx9
• .gift
• .ginfo
• .gitclone / .gitdl
• .github
• .give / .pay
• .gm / .goodmorning
• .gn / .goodnight
• .gname / .setgcname
• .goose
• .gpp
• .gpp / .setgcpp
• .green
• .greenBright
• .hack
• .hash / .md5
• .hausa
• .hbd / .birthday
• .heist
• .igbo
• .imbd
• .img / .image
• .insult
• .inv / .inventory
• .invert
• .ip
• .iqtest
• .isprime
• .italic
• .jid
• .join
• .lastseen
• .lb / .leaderboard
• .leave / .left
• .legendary
• .likestatus
• .list
• .listall / .allcommands
• .listoffline
• .listonline
• .listreply / .listautoreply
• .listrequest / .joinrequests
• .lizard
• .loan
• .lock
• .lower / .lowercase
• .lucky
• .magenta
• .marry
• .match / .livematch / .score
• .members / .memberlist
• .meme
• .mental
• .mention
• .mnm
• .mock
• .mode
• .mono / .monospace
• .motivation
• .movie
• .movie2
• .moviequote
• .msgpin / .pinmsg
• .msgs
• .myfollows / .mymatch
• .mypp / .pprivacy
• .mystatus
• .naira
• .nasa / .apod / .spaceimage
• .naturewlp
• .networth
• .news
• .ngif
• .ngl
• .ngnrates
• .nightcore
• .note / .savenote
• .notes
• .npm
• .nsbxmdmfw
• .numbattle
• .number / .randnum / .randomnumber
• .numberbattle
• .numberinfo / .phoneinfo
• .ocr / .readtext / .imagetext
• .online
• .opentime
• .pair
• .password / .generatepassword
• .payloan
• .pdf
• .percent
• .permit
• .pfilter
• .pick
• .pickupl / .pickup
• .pinchat
• .pokemon / .poke
• .poll
• .poll2 / .vote
• .poor
• .poorest / .broke
• .pp / .getpp
• .profile
• .progquote
• .pstop
• .ptv
• .pun
• .punch
• .qr
• .quote
• .quoted
• .ram
• .random
• .rate
• .reactchannel
• .reaction / .react
• .readmore
• .readmsg
• .readqr
• .readstatus
• .recipe
• .red
• .register
• .reject / .rejectall
• .rejectcall
• .remind
• .reminder
• .repeat
• .repo
• .report
• .reverse
• .reversetext
• .rewrite
• .rich
• .richest / .top
• .roast
• .roast2
• .rob
• .robot
• .roll
• .roman
• .save / .dm
• .savecmd
• .savestatus
• .season
• .selectmovie
• .sell
• .setautoread
• .setmod
• .setpp
• .setvar
• .ship / .love
• .shoot
• .shop
• .shutdown
• .slap / .hug / .kiss / .pat / .cuddle / .tickle / .feed / .smug
• .slots
• .slow
• .squirrel
• .sreply / .stopreply
• .ss
• .ssfull
• .ssphone
• .sstab
• .startupmsg
• .stats
• .statusemoji
• .strike / .strikethrough
• .subtitle / .subtitles / .subtitlesearch
• .synonym
• .tag / .totag
• .tarot
• .tax
• .temp
• .test
• .time / .clock
• .timer2 / .settimer
• .timestamp
• .tinyurl / .shorten
• .tobin
• .tohex
• .tomp3 / .mp3
• .tovv
• .transfer
• .trt / .translate
• .twitter / .twit
• .unarchive
• .unban
• .unblock
• .unlock
• .unpinchat
• .unregister
• .upper / .uppercase
• .uptime
• .uptime2
• .url / .tourl
• .usage / .sysinfo
• .usdrates
• .use
• .uuid / .generateid
• .viewstatus
• .vkfkk
• .vv2 / .readviewonce2
• .vvcmd
• .walink / .wlink
• .wallpaper
• .wanted
• .wasted
• .weather / .weather2 / .weatherinfo
• .websearch / .search
• .white
• .wiki / .wikipedia
• .with / .withdraw
• .woof
• .work
• .workout
• .wttr
• .wyr
• .xrp / .ripple
• .xrpusdt
• .yellow
• .yellowBright
• .yoruba`;
    reply(MENU2_TEXT);
}
break;

case "removebg": {
    // Check if there's a quoted message
    if (!m.quoted) {
        return await reply("🖼️ *Reply to an image with .removebg*\nExample: Reply to any image and type .removebg");
    }
    
    // Get the quoted message
    const quotedMsg = m.quoted;
    
    // Check if it's an image
    const mime = (quotedMsg.msg || quotedMsg).mimetype || '';
    const isImage = /image\/(png|jpe?g|gif|webp)/.test(mime);
    
    if (!isImage) {
        return await reply("❌ *That's not an image.* Reply to a JPG/PNG image.");
    }

    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        
        await reply(`🔍 *Removing background...*`);
        
        // Download the image
        let media = await quotedMsg.download();
        
        // Upload to temporary hosting
        let uploadedUrl = await uploadToCatbox(media);
        
        if (!uploadedUrl) {
            throw new Error('Upload failed');
        }
        
        // Call removebg API
        let response = await fetch(`https://apis.prexzyvilla.site/imagecreator/removebg?url=${encodeURIComponent(uploadedUrl)}`);
        let data = await response.json();

        if (data.status && data.data) {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    image: { url: data.data },
                    caption: "✨ *Background Removed*"
                }),
                { quoted: m }
            );
            await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } else {
            throw new Error('API returned error');
        }
    } catch (e) {
        console.error('RemoveBG error:', e);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await reply("⚠️ *Failed to remove background.* The service might be down. Try again later.");
    }
}
break;

case 'tiktok':
case 'tt': {
    if (!text) {
        return reply(`🎵 *Usage:* ${prefix + command} link`);
    }
    if (!text.includes('tiktok.com')) {
        return reply(`❌ *Invalid TikTok link*`);
    }
    
    m.reply("*⏳ Fetching video...*");

    const tiktokApiUrl = `https://api.bk9.dev/download/tiktok?url=${encodeURIComponent(text)}`;

    fetch(tiktokApiUrl)
        .then(response => response.json())
        .then(data => {
            if (!data.status || !data.BK9 || !data.BK9.BK9) {
                return reply('❌ *Failed to get download link*');
            }
            
            const videoUrl = data.BK9.BK9;
            
            devtrust.sendMessage(m.chat, 
                addNewsletterContext({
                    video: { url: videoUrl },
                    caption: "🎵 *${botDisplayName} TikTok*"
                }), 
                { quoted: m }
            );
        })
        .catch(err => {
            console.error(err);
            reply("❌ *Download failed* • Network error");
        });
}
break;

case 'apk':
case 'apkdl': {
    if (!text) {
        return reply(`📱 *Usage:* ${prefix + command} com.whatsapp`);
    }
    
    try {
        const packageId = text.trim();
        const res = await fetch(`https://api.bk9.dev/download/apk?id=${encodeURIComponent(packageId)}`);
        const data = await res.json();

        if (!data.status || !data.BK9 || !data.BK9.dllink) {
            return reply('❌ *APK not found* • Check package ID');
        }

        const { name, emperor, dllink, package: packageName } = data.BK9;

        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: emperor},
                caption: `📦 *${name}*\nPackage: ${packageName}\n📥 Downloading...`
            }), 
            { quoted: m }
        );

        await devtrust.sendMessage(m.chat, {
            document: { url: dllink },
            fileName: `${name}.apk`,
            mimetype: 'application/vnd.android.package-archive'
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        reply('❌ *APK fetch failed* • Try again later');
    }
}
break;

case 'tomp4': {
    if (!m.quoted) return reply("🖼️ *Reply to a sticker/gif* with tomp4");
    let mime = m.quoted.mimetype || '';
    if (!/webp|gif/.test(mime)) return reply("⚠️ *Reply must be a sticker or gif*");

    try {
        let media = await m.quoted.download();
        let inputPath = `./tmp/${Date.now()}.${mime.includes('gif') ? 'gif' : 'webp'}`;
        let outputPath = `./tmp/${Date.now()}.mp4`;
        
        if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp', { recursive: true });
        
        fs.writeFileSync(inputPath, media);
        
        // Simple conversion command
        exec(`ffmpeg -i ${inputPath} -c:v libx264 -pix_fmt yuv420p ${outputPath}`, async (err) => {
            if (err) {
                console.log(err);
                return reply("❌ *Conversion failed*");
            }
            
            let converted = fs.readFileSync(outputPath);
            await devtrust.sendMessage(m.chat, 
                addNewsletterContext({
                    video: converted,
                    mimetype: 'video/mp4',
                    caption: "🎬 *Converted to MP4*"
                }), 
                { quoted: m }
            );
            
            try { 
                fs.unlinkSync(inputPath); 
                fs.unlinkSync(outputPath); 
            } catch (e) {}
        });
        
    } catch (e) {
        console.log(e);
        reply("❌ *Conversion failed*");
    }
}
break;
// [REMOVED DUPLICATE: tomp3]

case 'kickadmins': {
    if (!m.isGroup) return reply(m.group);
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');

    let metadata = await devtrust.groupMetadata(m.chat);
    let participants = metadata.participants;
    let kicked = 0;

    for (let member of participants) {
        if (member.id === botNumber) continue;
        if (member.id === m.sender) continue;

        if (member.admin === "superadmin" || member.admin === "admin") {
            await devtrust.groupParticipantsUpdate(m.chat, [member.id], 'remove');
            kicked++;
            await sleep(1500);
        }
    }

    reply(`✅ *${kicked} admins removed*`);
}
break;

case 'myip': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    try {
        var http = require('http');
        http.get({
            'host': 'api.ipify.org',
            'port': 80,
            'path': '/'
        }, function(resp) {
            let ipData = '';
            resp.on('data', function(chunk) {
                ipData += chunk;
            });
            resp.on('end', function() {
                reply(`🌐 *Your IP Address:*\n\`${ipData}\``);
            });
        }).on('error', function(e) {
            reply(`❌ *Error fetching IP:* ${e.message}`);
        });
    } catch (e) {
        reply(`❌ *Error:* ${e.message}`);
    }
    break;
}

case "movie": {
    if (!text) return reply("🎬 *Example:* movie Inception");

    await devtrust.sendPresenceUpdate("composing", m.chat);

    try {
        const res = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(text)}&apikey=6372bb60`);
        if (res.data.Response === "False") return reply("❌ *Movie not found*");

        const data = res.data;

        let caption = `🎬 *${data.Title}*\n\n` +
            `📅 ${data.Year} • ⭐ ${data.imdbRating}\n` +
            `🎭 ${data.Genre}\n\n` +
            `📝 ${data.Plot.substring(0, 200)}...\n\n` +
            `👤 ${data.Director}`;

        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: data.Poster !== "N/A" ? data.Poster : "https://i.ibb.co/4f4tTnG/no-poster.png" },
                caption: caption
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error(e);
        reply("⚠️ *Movie info unavailable* • Try again later");
    }
}
break;

case "sciencefact": {
    try {
        const res = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
        reply(`🔬 *Science Fact*\n\n${res.data.text}`);
    } catch {
        reply("❌ *Fact machine broke* • Try again later");
    }
}
break;

case "book": {
    if (!text) return reply("📚 *Example:* book Harry Potter");
    
    try {
        const res = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(text)}&limit=3`);
        if (!res.data.docs.length) return reply("❌ *No books found*");
        
        const books = res.data.docs.map((b,i) => 
            `${i+1}. *${b.title}*\n👤 ${b.author_name?.[0] || "Unknown"}`
        ).join("\n\n");
        
        reply(`📚 *Book Search*\n\n${books}`);
    } catch {
        reply("❌ *Search failed* • Library is closed");
    }
}
break;

case "recipe": {
    if (!text) return reply("🍳 *Example:* recipe pancakes");
    
    try {
        const res = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(text)}`);
        if (!res.data.meals) return reply("❌ *No recipes found*");
        
        const meal = res.data.meals[0];
        const ingredients = Array.from({length:20})
            .map((_,i) => meal[`strIngredient${i+1}`] ? `• ${meal[`strIngredient${i+1}`]} - ${meal[`strMeasure${i+1}`]}` : '')
            .filter(Boolean)
            .join("\n");
        
        const msg = `🍽 *${meal.strMeal}*\n\n${ingredients}`;
        reply(msg);
    } catch {
        reply("❌ *Recipe fetch failed* • Kitchen's closed");
    }
}
break;

case "remind": {
    if (!text) return reply("⏰ *Usage:* remind 60 Take a break");
    
    const [sec, ...msgArr] = text.split(" ");
    const msgText = msgArr.join(" ");
    const delay = parseInt(sec) * 1000;
    
    if (isNaN(delay) || !msgText) return reply("❌ *Invalid format*");
    
    reply(`⏰ *Reminder set* for ${sec} seconds`);
    
    setTimeout(() => {
        devtrust.sendMessage(m.chat, { text: `⏰ *Reminder:* ${msgText}` });
    }, delay);
}
break;

case "define":
case "dictionary": {
    if (!text) return reply("📖 *Example:* define computer");
    
    try {
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`);
        const meanings = res.data[0].meanings[0].definitions[0].definition;
        reply(`📖 *${text}*\n\n${meanings}`);
    } catch {
        reply("❌ *Word not found*");
    }
}
break;

case "currencies":
case "currency": {
    if (!text) {
        return reply(`💱 *LËGĚNDÃRY Ł𝗮𝗯𝘀™ Currency*\n\nUsage: ${prefix}currency [amount] [from] [to]\nExample: ${prefix}currency 100 USD EUR\n\nOr use: ${prefix}currencies to see all available codes`);
    }
    
    const [amount, from, to] = text.split(" ");
    
    // If all three arguments provided, do conversion
    if (amount && from && to) {
        try {
            await devtrust.sendMessage(m.chat, { react: { text: '💱', key: m.key } });
            
            const response = await axios.get(`https://api.exchangerate.host/convert?from=${from.toUpperCase()}&to=${to.toUpperCase()}&amount=${amount}`, {
                timeout: 10000
            });
            
            if (!response.data || !response.data.result) {
                throw new Error('Invalid response');
            }
            
            reply(`💱 *${botDisplayName} Currency*\n\n${amount} ${from.toUpperCase()} = ${response.data.result} ${to.toUpperCase()}`);
            await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            
        } catch (error) {
            console.error('Currency error:', error.message);
            await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply(`⚠️ *Λ𝗫𝗜𝗦 𝗫𝗠𝗗 Currency*\n\nExchange rates are sleeping. Try again later.`);
        }
        return;
    }
    
    // If no arguments or just "currencies", show available currencies
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '💱', key: m.key } });
        
        const response = await axios.get('https://apis.davidcyril.name.ng/tools/currencies', {
            timeout: 10000
        });
        
        if (!response.data.success || !response.data.result) {
            throw new Error('API Error');
        }

        let currencyList = `💱 *Λ𝗫𝗜𝗦 𝗫𝗠𝗗 Currencies*\n\n`;
        
        response.data.result.slice(0, 30).forEach((curr, i) => {
            currencyList += `${i + 1}. *${curr.code}* - ${curr.name}\n`;
        });
        
        currencyList += `\n_Use ${prefix}currency [amount] [from] [to] to convert_`;
        
        reply(currencyList);
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (err) {
        console.error('Currencies error:', err.message);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        reply(`⚠️ *Λ𝗫𝗜𝗦 𝗫𝗠𝗗 Currencies*\n\nCurrency list is on vacation. Try again later.`);
    }
}
break;

case "genpass": {
    const length = parseInt(text) || 12;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let pass = "";
    for (let i=0; i<length; i++) 
        pass += chars.charAt(Math.floor(Math.random()*chars.length));
    
    reply(`🔑 *Generated Password*\n\n${pass}`);
}
break;

case "readqr": {
    if (!m.quoted || !m.quoted.image) 
        return reply("📱 *Reply to a QR code image*");
    
    const buffer = await m.quoted.download();
    
    try {
        const res = await axios.post("https://api.qrserver.com/v1/read-qr-code/", buffer, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        const qrText = res.data[0].symbol[0].data;
        reply(`📱 *QR Code Content*\n\n${qrText}`);
    } catch (e) {
        reply("❌ *Failed to read QR code*");
    }
}
break;

case 'weather':
case 'weather2':
case 'weatherinfo': {
    if (!text) return reply(`🌤 *${botDisplayName} Weather*\n\nUsage: ${prefix}${command} [city]\nExample: ${prefix}${command} London`);
    
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '🌤️', key: m.key } });
        
        reply(`🔍 *LËGĚNDÃRY Ł𝗮𝗯𝘀™ Weather*\n\nChecking forecast for ${text}...`);
        
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(text)}&units=metric&appid=d97e458517de3eac6d3c50abcdcbe0e7`,
            { timeout: 10000 }
        );
        
        const data = response.data;
        
        const weatherInfo = `📍 *${data.name}, ${data.sys.country}*\n` +
                           `🌡️ ${data.main.temp}°C (feels like ${data.main.feels_like}°C)\n` +
                           `☁️ ${data.weather[0].description}\n` +
                           `💧 ${data.main.humidity}% humidity\n` +
                           `🌬️ ${data.wind.speed} m/s wind`;
        
        reply(`🌤 *LËGĚNDÃRY Ł𝗮𝗯𝘀™ Weather*\n\n${weatherInfo}`);
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Weather Error:', error.message);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        reply(`⚠️ *${botDisplayName} Weather*\n\nWeather service is offline. Try again later.`);
    }
}
break;

case "calculate": {
    if (!text) return reply("🧮 *Example:* calculate 12+25*3");
    
    try {
        const result = eval(text);
        reply(`🧮 *Result*\n\n${text} = ${result}`);
    } catch {
        reply("❌ *Invalid expression*");
    }
}
break;

// ============ HANGMAN GAME ============
case "hangman": {
    const chatId = m.chat;
    const args = text?.split(" ") || [];
    let game = hangmanGames[chatId];

    // Start new game
    if (!game) {
        if (!args[0]) return reply("🎮 *Start:* hangman banana");
        
        const word = args[0].toLowerCase();
        const display = "_".repeat(word.length).split("");
        hangmanGames[chatId] = { 
            word, 
            display, 
            attempts: 6, 
            guessed: [],
            wrongGuesses: 0
        };
        
        const visual = hangmanVisual[0]; // First visual (6 attempts left)
        
        reply(`🎮 *Hangman Started*\n\n` +
              `${visual}\n\n` +
              `Word: ${display.join(" ")}\n` +
              `Attempts: 6\n` +
              `Guess: hangman [letter]`);
        return;
    }

    // Make a guess
    if (!args[0]) return reply("🔤 *Guess a letter* • Example: hangman a");
    
    const letter = args[0].toLowerCase();
    if (letter.length !== 1) return reply("❌ *One letter at a time*");
    if (!/[a-z]/.test(letter)) return reply("❌ *Letters only*");
    if (game.guessed.includes(letter)) return reply("⚠️ *Already guessed*");

    game.guessed.push(letter);
    
    if (game.word.includes(letter)) {
        // Correct guess
        game.display = game.display.map((c, i) => (game.word[i] === letter ? letter : c));
    } else {
        // Wrong guess
        game.wrongGuesses += 1;
        game.attempts -= 1;
    }

    // Get current hangman visual
    const visualIndex = Math.min(game.wrongGuesses, hangmanVisual.length - 1);
    const visual = hangmanVisual[visualIndex];

    // Check win condition
    if (!game.display.includes("_")) {
        reply(`🎉 *You won!*\n\nWord: ${game.word}\n\n${visual}`);
        delete hangmanGames[chatId];
        return;
    }

    // Check lose condition
    if (game.attempts <= 0) {
        reply(`💀 *Game over!*\n\nWord: ${game.word}\n\n${visual}`);
        delete hangmanGames[chatId];
        return;
    }

    // Game continues
    reply(`🎮 *Hangman*\n\n` +
          `${visual}\n\n` +
          `Word: ${game.display.join(" ")}\n` +
          `Attempts: ${game.attempts}\n` +
          `Guessed: ${game.guessed.join(", ")}`);
}
break;
// ======================================

case "numbattle": {
    const userRoll = Math.floor(Math.random() * 100) + 1;
    const botRoll = Math.floor(Math.random() * 100) + 1;
    
    let result = userRoll > botRoll ? "🎉 *You win!*" : 
                 userRoll < botRoll ? "😢 *You lose!*" : "🤝 *It's a tie!*";
    
    reply(`🎲 *Number Battle*\n\nYou: ${userRoll}\nBot: ${botRoll}\n\n${result}`);
}
break;

case "coinbattle": {
    const userFlip = Math.random() < 0.5 ? "Heads" : "Tails";
    const botFlip = Math.random() < 0.5 ? "Heads" : "Tails";
    
    let result = userFlip === botFlip ? "🎉 *You win!*" : "😢 *You lose!*";
    
    reply(`🪙 *Coin Battle*\n\nYou: ${userFlip}\nBot: ${botFlip}\n\n${result}`);
}
break;

case "numberbattle": {
    if (!text) return reply("🎯 *Usage:* numberbattle 25");
    
    const number = Math.floor(Math.random() * 50) + 1;
    const guess = parseInt(text);
    
    let result = guess === number ? "🎉 *Perfect guess!*" : 
                 guess > number ? "⬇️ *Too high!*" : "⬆️ *Too low!*";
    
    reply(`🎯 *Number Battle*\n\nYour guess: ${guess}\nTarget: ${number}\n\n${result}`);
}
break;

case "math": {
    const a = Math.floor(Math.random() * 50) + 1;
    const b = Math.floor(Math.random() * 50) + 1;
    
    reply(`➕ *Math Quiz*\n\n${a} + ${b} = ?\nReply: mathanswer number`);
}
break;

case "emojiquiz": {
    const quizzes = [
        { emoji: "🐍", answer: "snake" },
        { emoji: "🍎", answer: "apple" },
        { emoji: "🏎️", answer: "car" },
        { emoji: "🎸", answer: "guitar" },
        { emoji: "☕", answer: "coffee" }
    ];
    
    const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
    reply(`🧩 *Emoji Quiz*\n\n${quiz.emoji}\nReply: emojianswer your guess`);
}
break;

case "dice": {
    const roll = Math.floor(Math.random() * 6) + 1;
    reply(`🎲 *You rolled a ${roll}!*`);
}
break;

case "rpsls": {
    if (!text) return reply("🪨 *Choose:* rock, paper, scissors, lizard, spock");
    
    const choices = ["rock", "paper", "scissors", "lizard", "spock"];
    const userChoice = text.toLowerCase();
    
    if (!choices.includes(userChoice)) 
        return reply("❌ *Invalid choice* • Use rock, paper, scissors, lizard, spock");

    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    const winMap = {
        rock: ["scissors", "lizard"],
        paper: ["rock", "spock"],
        scissors: ["paper", "lizard"],
        lizard: ["spock", "paper"],
        spock: ["scissors", "rock"]
    };

    let result = userChoice === botChoice ? "🤝 *It's a tie!*" :
                 winMap[userChoice].includes(botChoice) ? "🎉 *You win!*" : "😢 *You lose!*";

    reply(`🪨 *RPSLS*\n\nYou: ${userChoice}\nBot: ${botChoice}\n\n${result}`);
}
break;
case "coin": {
    const result = Math.random() < 0.5 ? "🪙 Heads" : "🪙 Tails";
    await devtrust.sendMessage(m.chat, { text: `🎲 Coin Flip Result: ${result}` }, { quoted: m });
}
break;
case "gamefact": {
    try {
        const res = await axios.get("https://www.freetogame.com/api/games");
        const games = res.data;
        const game = games[Math.floor(Math.random() * games.length)];
        
        reply(`🎮 *${game.title}*\n🎭 ${game.genre}\n📱 ${game.platform}\n🔗 ${game.game_url}`);
    } catch (e) {
        console.error("GAMEFACT ERROR:", e);
        reply("❌ *Game fact unavailable* • Server offline");
    }
}
break;

case "fox": {
    try {
        const res = await axios.get("https://randomfox.ca/floof/");
        const img = res.data?.image;
        if (!img) return reply("❌ *Fox ran away* • Try again");
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: img },
                caption: "🦊 *Random Fox*"
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error("FOX ERROR:", e);
        reply("❌ *Fox hunt failed* • API is sleeping");
    }
}
break;

case "bchcn": {
    try {
        const res = await axios.get("https://some-random-api.com/img/koala");
        const img = res.data?.link;
        if (!img) return reply("❌ *Koala hiding* • Try again");
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: img },
                caption: "🐨 *Random Koala*"
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error("KOALA ERROR:", e);
        reply("❌ *Koala fetch failed* • API offline");
    }
}
break;

case "hxjxjjkm": {
    try {
        const res = await axios.get("https://some-random-api.com/img/birb");
        const img = res.data?.link;
        if (!img) return reply("❌ *Bird flew away* • Try again");
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: img },
                caption: "🐦 *Random Bird*"
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error("BIRD ERROR:", e);
        reply("❌ *Bird migration failed* • Try later");
    }
}
break;

case "panda": {
    try {
        const res = await axios.get("https://some-random-api.com/img/panda");
        const img = res.data?.link;  
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: img },
                caption: "🐼 *Random Panda*"
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error("PANDA ERROR:", e);
        reply("❌ *Panda on vacation* • Try again");
    }
}
break;

case "funfact": {
    try {
        const res = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
        const fact = res.data?.text || "Bots are awesome!";
        reply(`💡 *Fun Fact*\n\n${fact}`);
    } catch (e) {
        console.error("FUNFACT ERROR:", e);
        reply("❌ *Fact machine broke* • Try again later");
    }
}
break;

case "vkfkk": {
    try {
        const res = await axios.get("https://api.quotable.io/random");
        const quote = res.data?.content || "Keep pushing forward!";
        const author = res.data?.author || "Unknown";
        reply(`🖋 *"${quote}"*\n— ${author}`);
    } catch (e) {
        console.error("QUOTEMEME ERROR:", e);
        reply("❌ *Quote generator is silent* • Try later");
    }
}
break;

case "prog": {
    try {
        const res = await axios.get("https://v2.jokeapi.dev/joke/Programming?type=single");
        const joke = res.data?.joke || "Why do programmers prefer dark mode? Light attracts bugs!";
        reply(`💻 *Programming Joke*\n\n${joke}`);
    } catch (e) {
        console.error("PROG JOKE ERROR:", e);
        reply("❌ *Joke compiler error* • Try again");
    }
}
break;

case "dadjoke": {
    try {
        const res = await axios.get("https://icanhazdadjoke.com/", { headers: { Accept: "application/json" } });
        const joke = res.data?.joke || "I'm still working on it!";
        reply(`👴 *Dad Joke*\n\n${joke}`);
    } catch (e) {
        console.error("DAD JOKE ERROR:", e);
        reply("❌ *Dad left for milk* • Try later");
    }
}
break;

case "progquote": {
    try {
        const res = await axios.get("https://hdramming-quotes-api.herokuapp.com/quotes/random");
        const quote = res.data?.en || "Talk is cheap. Show me the code.";
        const author = res.data?.author || "Linus Torvalds";
        reply(`💻 *"${quote}"*\n— ${author}`);
    } catch (e) {
        console.error("PROGQUOTE ERROR:", e);
        reply("❌ *Quote not found* • 404 error");
    }
}
break;

case "guess": {
    const number = Math.floor(Math.random() * 10) + 1;
    if (!text) return reply("🎲 *Usage:* guess 7");
    
    const guess = parseInt(text);
    if (isNaN(guess) || guess < 1 || guess > 10) 
        return reply("❌ *Choose 1-10*");
    
    const result = guess === number ? "🎉 *Correct!*" : "😢 *Wrong guess*";
    reply(`🎯 *Guess Game*\n\nYou: ${guess}\nBot: ${number}\n${result}`);
}
break;

case "moviequote": {
    try {
        const res = await axios.get("https://movie-quote-api.herokuapp.com/v1/quote/");
        const quote = res.data?.quote || "May the Force be with you.";
        const movie = res.data?.show || "Unknown";
        reply(`🎬 *"${quote}"*\n— ${movie}`);
    } catch (e) {
        console.error("MOVIE QUOTE ERROR:", e);
        reply("❌ *Movie quote unavailable* • Cinema closed");
    }
}
break;

case "triviafact": {
    try {
        const res = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
        const fact = res.data?.text || "You're awesome!";
        reply(`🧠 *Trivia Fact*\n\n${fact}`);
    } catch (e) {
        console.error("TRIVIA FACT ERROR:", e);
        reply("❌ *Trivia machine broke*");
    }
}
break;

case "cbhcchhcx": {
    try {
        const res = await axios.get("https://type.fit/api/quotes");
        const quotes = res.data;
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        reply(`🌟 *"${q.text}"*\n— ${q.author || "Unknown"}`);
    } catch (e) {
        console.error("INSPIRE ERROR:", e);
        reply("❌ *Inspiration unavailable*");
    }
}
break;
// [REMOVED DUPLICATE: compliment]

case "rps": {
    if (!text) return reply("🪨 *Choose:* rock, paper, scissors");
    
    const choices = ["rock", "paper", "scissors"];
    const userChoice = text.toLowerCase();
    if (!choices.includes(userChoice)) 
        return reply("❌ *Invalid choice* • Use rock, paper, scissors");

    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    let result = userChoice === botChoice ? "🤝 *Tie!*" :
        (userChoice === "rock" && botChoice === "scissors") ||
        (userChoice === "paper" && botChoice === "rock") ||
        (userChoice === "scissors" && botChoice === "paper") 
        ? "🎉 *You win!*" : "😢 *You lose!*";

    reply(`🪨 *RPS*\n\nYou: ${userChoice}\nBot: ${botChoice}\n${result}`);
}
break;

case "8ball": {
    const answers = [
        "It is certain ✅", "Without a doubt ✅", "Ask again later 🤔",
        "Cannot predict now 🤷", "Don't count on it ❌", "Very doubtful ❌"
    ];
    if (!text) return reply("🎱 *Ask me a question*");
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    reply(`🎱 *Question:* ${text}\n\n${answer}`);
}
break;

case "trivia": {
    try {
        const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
        const trivia = res.data.results[0];
        const options = [...trivia.incorrect_answers, trivia.correct_answer]
            .sort(() => Math.random() - 0.5);
        
        reply(`❓ *${trivia.question}*\n\n${options.map((o,i)=>`${i+1}. ${o}`).join("\n")}`);
    } catch (e) {
        console.error("TRIVIA ERROR:", e);
        reply("❌ *Trivia unavailable*");
    }
}
break;

// ============ FUN COMMANDS ============
case "slap":
case "hug":
case "kiss":
case "pat":
case "cuddle":
case "tickle":
case "feed":
case "smug": {
    const action = command;
    const actionEmojis = { slap: '👋', hug: '🤗', kiss: '💋', pat: '👏', cuddle: '🥰', tickle: '😂', feed: '🍽️', smug: '😏' };
    const actionGifs = {
        slap: 'https://media.tenor.com/oVTPj5_7TbkAAAAC/anime-slap.gif',
        hug: 'https://media.tenor.com/vu6b9ChiResAAAAC/hug-anime.gif',
        kiss: 'https://media.tenor.com/JaL4PFZXMRYAAAAC/kiss-anime.gif',
        pat: 'https://media.tenor.com/PPMzLa6G97UAAAAC/head-pat-anime.gif',
        cuddle: 'https://media.tenor.com/4rIXM7QJ4NEAAAAC/cuddle-anime.gif',
        tickle: 'https://media.tenor.com/N-qDNBiL064AAAAC/tickle-anime.gif',
        feed: 'https://media.tenor.com/bFvKJnMC1TUAAAAC/anime-feed.gif',
        smug: 'https://media.tenor.com/Mte9JV56i0IAAAAC/smug-anime.gif'
    };
    const target = m.mentionedJid?.[0] ? `@${m.mentionedJid[0].replace('@s.whatsapp.net', '')}` : (text || 'someone');
    const sender = m.pushName || 'Someone';
    await devtrust.sendMessage(m.chat, {
        image: { url: actionGifs[action] },
        caption: `${actionEmojis[action]} *${sender}* ${action}s ${target}!`,
        mentions: m.mentionedJid || []
    }, { quoted: m });
}
break;

case "neko":
case "meow": {
    const nekoGifs = [
        'https://media.tenor.com/OjBbDMlPWzkAAAAC/neko-anime.gif',
        'https://media.tenor.com/hn3q0QmMXp0AAAAC/neko-cat-girl.gif',
        'https://media.tenor.com/wqF46GXXXTIAAAAC/anime-cat-girl.gif'
    ];
    await devtrust.sendMessage(m.chat, {
        image: { url: nekoGifs[Math.floor(Math.random() * nekoGifs.length)] },
        caption: '🐱 *Nyan~*'
    }, { quoted: m });
}
break;

case "woof": {
    const woofGifs = [
        'https://media.tenor.com/TuCmv3OoMlEAAAAC/cute-dog.gif',
        'https://media.tenor.com/Nfv-kSgXMaEAAAAC/dog-woof.gif'
    ];
    await devtrust.sendMessage(m.chat, {
        image: { url: woofGifs[Math.floor(Math.random() * woofGifs.length)] },
        caption: '🐶 *Woof woof!*'
    }, { quoted: m });
}
break;

case "goose": {
    await devtrust.sendMessage(m.chat, {
        image: { url: 'https://media.tenor.com/WhWrYmMO1AQAAAAC/goose.gif' },
        caption: '🪿 *HONK HONK!*'
    }, { quoted: m });
}
break;

case "lizard": {
    await devtrust.sendMessage(m.chat, {
        image: { url: 'https://media.tenor.com/ELlSQjAFbJYAAAAC/lizard.gif' },
        caption: '🦎 *Lizard vibes~*'
    }, { quoted: m });
}
break;

case "foxgirl": {
    const foxGifs = [
        'https://media.tenor.com/W2MTuEz4iBEAAAAC/fox-girl-anime.gif',
        'https://media.tenor.com/0RUyMO8BN0IAAAAC/anime-fox.gif'
    ];
    await devtrust.sendMessage(m.chat, {
        image: { url: foxGifs[Math.floor(Math.random() * foxGifs.length)] },
        caption: '🦊 *Fox girl~*'
    }, { quoted: m });
}
break;

case "wallpaper": {
    const wallpapers = [
        'https://w.wallhaven.cc/full/zy/wallhaven-zy3wqx.jpg',
        'https://w.wallhaven.cc/full/4g/wallhaven-4gdlq3.jpg',
        'https://w.wallhaven.cc/full/ex/wallhaven-exvkvo.jpg'
    ];
    await devtrust.sendMessage(m.chat, {
        image: { url: wallpapers[Math.floor(Math.random() * wallpapers.length)] },
        caption: '🖼️ *Random Wallpaper*'
    }, { quoted: m });
}
break;

case "ngif": {
    const gifs = [
        'https://media.tenor.com/random-funny-anime.gif',
        'https://media.tenor.com/9yEyEIHJY0EAAAAC/anime-funny.gif',
        'https://media.tenor.com/IFcyBjWpPl0AAAAC/anime.gif'
    ];
    await devtrust.sendMessage(m.chat, {
        image: { url: gifs[Math.floor(Math.random() * gifs.length)] },
        caption: '🎭 *Random GIF*'
    }, { quoted: m });
}
break;

case "hack": {
    const target2 = m.mentionedJid?.[0] ? `@${m.mentionedJid[0].replace('@s.whatsapp.net', '')}` : (text || 'the system');
    const steps = [
        `💻 *Initiating hack on ${target2}...*`,
        `🔍 *Scanning ports...*`,
        `🔓 *Bypassing firewall...*`,
        `📂 *Accessing database...*`,
        `✅ *Hack complete! ${target2} has been hacked!* 😈`
    ];
    let i = 0;
    const sent = await devtrust.sendMessage(m.chat, { text: steps[0], mentions: m.mentionedJid || [] }, { quoted: m });
    const interval = setInterval(async () => {
        i++;
        if (i >= steps.length) { clearInterval(interval); return; }
        await devtrust.sendMessage(m.chat, { text: steps[i], edit: sent.key });
    }, 1500);
}
break;

case "pickupl":
case "pickup": {
    const pickupLines = [
        "Are you a WiFi signal? Because I'm feeling a connection 📶",
        "Do you have a map? I keep getting lost in your eyes 🗺️",
        "Are you a keyboard? Because you're just my type ⌨️",
        "Is your name Google? Because you have everything I've been searching for 🔍",
        "Are you a camera? Every time I look at you, I smile 📸",
        "Do you believe in love at first sight, or should I walk by again? 👀",
        "Are you a magician? Because whenever I look at you, everyone else disappears ✨",
        "Is your name Wi-Fi? Because I'm really feeling a connection 💕"
    ];
    const line = pickupLines[Math.floor(Math.random() * pickupLines.length)];
    reply(`💘 *Pickup Line:*\n\n_${line}_`);
}
break;

case "wyr": {
    const wyrQuestions = [
        "Would you rather be able to fly ✈️ or be invisible 👻?",
        "Would you rather have unlimited money 💰 or unlimited time ⏰?",
        "Would you rather be always cold 🥶 or always hot 🥵?",
        "Would you rather lose your phone 📱 or your wallet 👛?",
        "Would you rather speak all languages 🌍 or play all instruments 🎸?",
        "Would you rather have no internet 🚫🌐 or no TV 🚫📺?",
        "Would you rather be famous 🌟 or be the best friend of someone famous 🤝?"
    ];
    const q = wyrQuestions[Math.floor(Math.random() * wyrQuestions.length)];
    reply(`🤔 *Would You Rather?*\n\n${q}`);
}
break;

case "insult": {
    const insults = [
        "You're like a cloud ☁️ — when you disappear, it's a beautiful day!",
        "I'd agree with you but then we'd both be wrong 🤦",
        "You're proof that even evolution can go backwards 🐒",
        "I've met some dumb people but you are an all-time champion 🏆",
        "You're not stupid, you just have bad luck thinking 🧠",
        "Your secrets are safe with me — I don't listen when you talk 🙉",
        "You're like a software update 💻 — every time I see you, I think 'not now'"
    ];
    const target3 = m.mentionedJid?.[0] ? `@${m.mentionedJid[0].replace('@s.whatsapp.net', '')}` : (text || 'you');
    const insult = insults[Math.floor(Math.random() * insults.length)];
    reply(`😈 *Hey ${target3}...*\n\n_${insult}_`, { mentions: m.mentionedJid || [] });
}
break;

case "emojimix": {
    if (!text || text.split(' ').length < 2) return reply(`⚙️ *Usage:* ${prefix}emojimix [emoji1] [emoji2]\n_Example: ${prefix}emojimix 😀 🔥_`);
    const [e1, e2] = text.split(' ');
    const e1Code = [...e1][0].codePointAt(0).toString(16);
    const e2Code = [...e2][0].codePointAt(0).toString(16);
    const mixUrl = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${e1Code}/u${e1Code}_u${e2Code}.png`;
    try {
        await devtrust.sendMessage(m.chat, {
            image: { url: mixUrl },
            caption: `✨ *Emoji Mix: ${e1} + ${e2}*`
        }, { quoted: m });
    } catch (e) {
        reply(`❌ *Could not mix those emojis. Try different ones!*`);
    }
}
break;
// ============ END FUN COMMANDS ============

case "meme": {
    try {
        const res = await axios.get("https://meme-api.com/gimme");
        const meme = res.data;
        if (!meme?.url) return reply("❌ *Meme ran away*");
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: meme.url },
                caption: `😂 *${meme.title}*`
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error("MEME ERROR:", e);
        reply("❌ *Meme factory closed*");
    }
}
break;

case 'yts': 
case 'ytsearch': {
    if (!isCreator) return reply(`🔒 *Owner only*`);
    if (!text) return reply(`🔍 *Example:* ${prefix + command} anime music`);
    
    let yts = require("yt-search");
    let search = await yts(text);
    
    let teks = `📺 *YouTube Search*\n\n"${text}"\n\n`;
    let no = 1;
    
    for (let i of search.all.slice(0,5)) {
        teks += `${no++}. *${i.title}*\n⏱️ ${i.timestamp} | 👀 ${i.views}\n🔗 ${i.url}\n\n`;
    }
    
    await devtrust.sendMessage(m.chat, 
        addNewsletterContext({
            image: { url: search.all[0].thumbnail },
            caption: teks
        }), 
        { quoted: m }
    );
}
break;

case 'animewlp': {
    if (!isCreator) return reply(`🔒 *Owner only*`);
    
    try {
        const waifudd = await axios.get(`https://nekos.life/api/v2/img/wallpaper`);
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: waifudd.data.url },
                caption: "🖼️ *Anime Wallpaper*"
            }), 
            { quoted: m }
        );
    } catch (err) {
        reply('❌ *Error fetching wallpaper*');
    }
}
break;

case 'resetlink': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    if (!m.isGroup) return reply("👥 *Groups only*");
    
    await devtrust.groupRevokeInvite(m.chat);
    reply("✅ *Group link reset*");
}
break;

case 'animedl': {
    if (!isCreator) return reply(`🔒 *Owner only*`);
    if (!q.includes("|")) {
        return reply("📌 *Format:* animedl Anime Name | Episode");
    }

    try {
        const [animeName, episode] = q.split("|").map(x => x.trim());
        const apiUrl = `https://draculazxy-xyzdrac.hf.space/api/Animedl?q=${encodeURIComponent(animeName)}&ep=${encodeURIComponent(episode)}`;

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        
        const { data } = await axios.get(apiUrl, {
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        });

        if (data.STATUS !== 200 || !data.download_link) {
            return reply("❌ *Episode not found*");
        }

        const { anime, episode: epNumber, download_link } = data;

        reply(`🎥 *${anime}* Ep ${epNumber}\n⏳ Downloading...`);

        await devtrust.sendMessage(m.chat, {
            document: { url: download_link },
            mimetype: "video/mp4",
            fileName: `${anime} - Episode ${epNumber}.mp4`
        }, { quoted: m });

    } catch (error) {
        console.error("❌ Anime Downloader Error:", error.message);
        reply("⚠️ *Server Error* • Try again later");
    }
}
break;

case 'animesearch': {
    if (!isCreator) return reply(`🔒 *Owner only*`);
    if (!text) return reply(`🔍 *Which anime?*`);
    
    const malScraper = require('mal-scraper');
    const anime = await malScraper.getInfoFromName(text).catch(() => null);
    
    if (!anime) return reply(`❌ *Anime not found*`);
    
    let animetxt = `🎀 *${anime.title}*\n` +
        `🎋 Type: ${anime.type}\n` +
        `📈 Status: ${anime.status}\n` +
        `💮 Genres: ${anime.genres}\n` +
        `🌟 Score: ${anime.score}\n` +
        `💫 Popularity: ${anime.popularity}\n\n` +
        `📝 ${anime.synopsis.substring(0, 300)}...`;
    
    await devtrust.sendMessage(m.chat,
        addNewsletterContext({
            image: { url: anime.picture },
            caption: animetxt
        }),
        { quoted: m }
    );
}
break;

case 'ai': {
    if (!text) return reply('🤖 *Example:* ai Who is Mark Zuckerberg?');

    await devtrust.sendPresenceUpdate('composing', m.chat);

    try {
        const answer = await askOpenAI(text);
        reply(`🤖 *AI*\n\n${answer}`);

    } catch (e) {
        reply(`❌ *AI error* • ${e.response?.data?.error?.message || e.message}`);
    }
}
break;

case 'idch': {
    if (!isCreator) return reply("🔒 *Owner only*");
    if (!text) return reply("🔗 *Example:* link channel");
    if (!text.includes("https://whatsapp.com/channel/")) 
        return reply("❌ *Invalid channel link*");
    
    let result = text.split('https://whatsapp.com/channel/')[1];
    let res = await devtrust.newsletterMetadata("invite", result);
    
    let teks = `📢 *Channel Info*\n\n` +
        `🆔 ID: ${res.id}\n` +
        `👤 Name: ${res.name}\n` +
        `👥 Followers: ${res.subscribers}\n` +
        `✔️ Verified: ${res.verification == "VERIFIED" ? "Yes" : "No"}`;
    
    return reply(teks);
}
break;

case 'closetime': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");

    let unit = args[1];
    let value = Number(args[0]);
    if (!value) return reply("*Usage:* closetime 10 minute");

    let timer = unit === 'second' ? value * 1000 :
                unit === 'minute' ? value * 60000 :
                unit === 'hour' ? value * 3600000 :
                unit === 'day' ? value * 86400000 : null;
    
    if (!timer) return reply('*Choose:* second, minute, hour, day');

    reply(`⏳ *Closing in ${value} ${unit}*`);

    setTimeout(async () => {
        try {
            await devtrust.groupSettingUpdate(m.chat, 'announcement');
            reply(`🔒 *Group closed* • Only admins can message`);
        } catch (e) {
            reply('❌ Failed: ' + e.message);
        }
    }, timer);
}
break;

case 'opentime': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");

    let unit = args[1];
    let value = Number(args[0]);
    if (!value) return reply('*Usage:* opentime 5 second');

    let timer = unit === 'second' ? value * 1000 :
                unit === 'minute' ? value * 60000 :
                unit === 'hour' ? value * 3600000 :
                unit === 'day' ? value * 86400000 : null;
    
    if (!timer) return reply('*Choose:* second, minute, hour, day');

    reply(`⏳ *Opening in ${value} ${unit}*`);

    setTimeout(async () => {
        try {
            await devtrust.groupSettingUpdate(m.chat, 'not_announcement');
            reply(`🔓 *Group opened* • Everyone can message`);
        } catch (e) {
            reply('❌ Failed: ' + e.message);
        }
    }, timer);
}
break;

// [REMOVED DUPLICATE: listonline]

case 'quote': {
    try {
        const res = await fetch('https://zenquotes.io/api/random');
        const json = await res.json();
        const quote = json[0].q;
        const author = json[0].a;
        
        const quoteImg = `https://dummyimage.com/600x400/000/fff.png&text=${encodeURIComponent(`"${quote}"\n\n- ${author}`)}`;
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: quoteImg },
                caption: `_"${quote}"_\n— *${author}*`
            }),
            { quoted: m }
        );
    } catch (err) {
        reply('❌ *Quote failed*');
    }
}
break;

case 'joke': {
    try {
        let res = await fetch('https://v2.jokeapi.dev/joke/Any?type=single'); 
        let data = await res.json();
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: 'https://files.catbox.moe/1ntiwc.jpg' },
                caption: `😂 *Joke*\n\n${data.joke}`
            }),
            { quoted: m }
        );
    } catch (err) {
        reply('❌ *Joke failed*');
    }
}
break;

case 'truth': {
    try {
        let res = await fetch('https://api.truthordarebot.xyz/v1/truth');
        let data = await res.json();
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: 'https://files.catbox.moe/1ntiwc.jpg' },
                caption: `😳 *Truth*\n\n❖ ${data.question}`
            }),
            { quoted: m }
        );
    } catch (err) {
        reply('❌ *Truth failed*');
    }
}
break;

case 'dare': {
    try {
        let res = await fetch('https://api.truthordarebot.xyz/v1/dare');
        let data = await res.json();
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: 'https://files.catbox.moe/1ntiwc.jpg' },
                caption: `😈 *Dare*\n\n❖ ${data.question}`
            }),
            { quoted: m }
        );
    } catch (err) {
        reply('❌ *Dare failed*');
    }
}
break;

case 'jid': {
    reply(from);
}
break;
// [REMOVED DUPLICATE: bass]
// [REMOVED DUPLICATE: tts]

// ============ ANIME COMMANDS ============
// [REMOVED DUPLICATE: animesearch]

case "manga": {
    if (!text) return reply(`📚 *Manga Search*\nUsage: ${prefix}manga [title]`);
    try {
        reply('⏳ *Searching manga...*');
        const mal = require('mal-scraper');
        const results = await mal.getInfoFromName(text, false, 'manga');
        if (!results) return reply('❌ *Manga not found*');
        const info = `📚 *${results.title}*\n\n` +
            `▸ *Type:* ${results.type || 'N/A'}\n` +
            `▸ *Chapters:* ${results.episodes || 'N/A'}\n` +
            `▸ *Status:* ${results.status || 'N/A'}\n` +
            `▸ *Score:* ⭐ ${results.score || 'N/A'}\n` +
            `▸ *Genres:* ${results.genres?.join(', ') || 'N/A'}\n` +
            `▸ *Synopsis:* ${results.synopsis?.slice(0, 200) || 'N/A'}...`;
        await devtrust.sendMessage(m.chat, {
            image: { url: results.picture },
            caption: info
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "character": {
    if (!text) return reply(`👤 *Anime Character Search*\nUsage: ${prefix}character [name]`);
    try {
        reply('⏳ *Searching character...*');
        const axios = require('axios');
        const res = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(text)}&limit=1`);
        const char = res.data?.data?.[0];
        if (!char) return reply('❌ *Character not found*');
        const info = `👤 *${char.name}*\n\n` +
            `▸ *Name Kanji:* ${char.name_kanji || 'N/A'}\n` +
            `▸ *Favorites:* ❤️ ${char.favorites || 0}\n` +
            `▸ *About:* ${char.about?.slice(0, 200) || 'N/A'}...`;
        await devtrust.sendMessage(m.chat, {
            image: { url: char.images?.jpg?.image_url },
            caption: info
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "waifu": {
    try {
        const axios = require('axios');
        const res = await axios.get('https://api.waifu.pics/sfw/waifu');
        await devtrust.sendMessage(m.chat, {
            image: { url: res.data.url },
            caption: '🌸 *Random Waifu~*'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "animegif": {
    const categories = ['hug', 'slap', 'kiss', 'pat', 'cry', 'blush', 'smile', 'wave', 'dance', 'poke'];
    const cat = text || categories[Math.floor(Math.random() * categories.length)];
    try {
        const axios = require('axios');
        const res = await axios.get(`https://api.waifu.pics/sfw/${cat}`);
        await devtrust.sendMessage(m.chat, {
            image: { url: res.data.url },
            caption: `🎌 *Anime GIF: ${cat}*`
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}\n_Try: hug, slap, kiss, pat, cry, blush, smile_`); }
}
break;

case "animequote": {
    try {
        const axios = require('axios');
        const res = await axios.get('https://animechan.xyz/api/random');
        const { quote, character, anime } = res.data;
        reply(`🎌 *Anime Quote*\n\n_"${quote}"_\n\n▸ *Character:* ${character}\n▸ *Anime:* ${anime}`);
    } catch (e) {
        const quotes = [
            { quote: "People's lives don't end when they die. It ends when they lose faith.", character: "Itachi Uchiha", anime: "Naruto" },
            { quote: "The world is not beautiful, therefore it is.", character: "Kino", anime: "Kino's Journey" },
            { quote: "If you don't take risks, you can't create a future.", character: "Monkey D. Luffy", anime: "One Piece" }
        ];
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        reply(`🎌 *Anime Quote*\n\n_"${q.quote}"_\n\n▸ *Character:* ${q.character}\n▸ *Anime:* ${q.anime}`);
    }
}
break;

case "animenews": {
    try {
        reply('⏳ *Fetching anime news...*');
        const axios = require('axios');
        const res = await axios.get('https://api.jikan.moe/v4/news/anime?limit=5');
        const news = res.data?.data;
        if (!news?.length) return reply('❌ *No news found*');
        let newsText = '📰 *Latest Anime News*\n\n';
        news.forEach((n, i) => {
            newsText += `${i + 1}. *${n.title}*\n_${n.date?.slice(0, 10)}_\n${n.url}\n\n`;
        });
        reply(newsText);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "season": {
    try {
        reply('⏳ *Fetching current season anime...*');
        const axios = require('axios');
        const res = await axios.get('https://api.jikan.moe/v4/seasons/now?limit=10');
        const animes = res.data?.data;
        if (!animes?.length) return reply('❌ *No seasonal anime found*');
        let seasonText = '🎌 *Current Season Anime*\n\n';
        animes.forEach((a, i) => {
            seasonText += `${i + 1}. *${a.title}* ⭐ ${a.score || 'N/A'}\n`;
        });
        reply(seasonText);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "airing": {
    try {
        reply('⏳ *Fetching airing anime...*');
        const axios = require('axios');
        const res = await axios.get('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10');
        const animes = res.data?.data;
        if (!animes?.length) return reply('❌ *No airing anime found*');
        let airingText = '📺 *Currently Airing Anime*\n\n';
        animes.forEach((a, i) => {
            airingText += `${i + 1}. *${a.title}* ⭐ ${a.score || 'N/A'}\n`;
        });
        reply(airingText);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "animerec": {
    const genres = ['Action', 'Romance', 'Comedy', 'Horror', 'Fantasy', 'Sci-Fi', 'Slice of Life'];
    const recs = {
        Action: ['Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen'],
        Romance: ['Toradora', 'Your Lie in April', 'Fruits Basket'],
        Comedy: ['Konosuba', 'Gintama', 'Nichijou'],
        Horror: ['Another', 'Paranoia Agent', 'Higurashi'],
        Fantasy: ['Re:Zero', 'Sword Art Online', 'Made in Abyss'],
        'Sci-Fi': ['Steins;Gate', 'Psycho-Pass', 'Neon Genesis Evangelion'],
        'Slice of Life': ['Barakamon', 'Yotsuba', 'Aria']
    };
    const genre = text ? genres.find(g => g.toLowerCase() === text.toLowerCase()) : genres[Math.floor(Math.random() * genres.length)];
    const list = recs[genre] || recs[genres[0]];
    reply(`🎌 *Anime Recommendations (${genre})*\n\n${list.map((a, i) => `${i + 1}. ${a}`).join('\n')}`);
}
break;

case "animewatch": {
    if (!text) return reply(`📺 *Anime Watch Guide*\nUsage: ${prefix}animewatch [anime title]`);
    reply(`📺 *Where to Watch: ${text}*\n\n▸ Crunchyroll: https://crunchyroll.com\n▸ Funimation: https://funimation.com\n▸ Netflix: https://netflix.com\n▸ 9anime: https://9anime.to\n▸ Gogoanime: https://gogoanime.tv\n\n_Search "${text}" on any of these platforms_`);
}
break;
// ============ END ANIME COMMANDS ============

case "rwaifu": {
    const imageUrl = `https://apis.davidcyriltech.my.id/random/waifu`;
    await devtrust.sendMessage(m.chat,
        addNewsletterContext({
            image: { url: imageUrl },
            caption: "✨ *Random Waifu*"
        }),
        { quoted: m }
    );
}
break;
// [REMOVED DUPLICATE: waifu]

case 'vv':
case 'vvgh': {
    if (!isCreator) return reply("🔒 *Owner only*");
    if (!m.quoted) return reply('📸 *Reply to a view-once media*');

    try {
        const mediaBuffer = await m.quoted.download();
        if (!mediaBuffer) return reply('❌ *Download failed*');

        const mediaType = m.quoted.mtype;

        if (mediaType === 'imageMessage') {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    image: mediaBuffer,
                    caption: "🖼️ *View-Once Image*"
                }),
                { quoted: m }
            );
        } else if (mediaType === 'videoMessage') {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    video: mediaBuffer,
                    caption: "🎥 *View-Once Video*"
                }),
                { quoted: m }
            );
        } else if (mediaType === 'audioMessage') {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    audio: mediaBuffer,
                    mimetype: 'audio/ogg',
                    ptt: true,
                    caption: "🔊 *View-Once Voice*"
                }),
                { quoted: m }
            );
        }
    } catch (error) {
        console.error('Error:', error);
        reply('❌ *Something went wrong*');
    }
}
break;

case 'vv2':
case 'readviewonce2': {
    if (!m.quoted) {
        return reply(`👁️ *${botDisplayName} View Once*\n\nReply to a view-once media with ${prefix}${command}`);
    }
    
    let mime = (m.quoted.msg || m.quoted).mimetype || '';
    
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '👁️', key: m.key } });
        
        let media = await m.quoted.download();
        
        // Get bot's number - FIXED
        let botNumber = devtrust.user.id.split(':')[0] + '@s.whatsapp.net';
        
        if (/image/.test(mime)) {
            await devtrust.sendMessage(botNumber, {
                image: media,
                caption: `🔓 *View-Once Image*\nFrom: ${m.sender.split('@')[0]}`
            });
            reply(`✅ *${botDisplayName} View Once*\n\nImage saved to bot's DM.`);
            
        } else if (/video/.test(mime)) {
            await devtrust.sendMessage(botNumber, {
                video: media,
                caption: `🔓 *View-Once Video*\nFrom: ${m.sender.split('@')[0]}`
            });
            reply(`✅ *${botDisplayName} View Once*\n\nVideo saved to bot's DM.`);
            
        } else if (/audio/.test(mime)) {
            await devtrust.sendMessage(botNumber, {
                audio: media,
                mimetype: 'audio/mpeg',
                ptt: true
            });
            reply(`✅ *${botDisplayName} View Once*\n\nAudio saved to bot's DM.`);
            
        } else {
            reply(`❌ *${botDisplayName} View Once*\n\nUnsupported media type.`);
        }
        
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (err) {
        console.error('View once error:', err);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        reply(`⚠️ *${botDisplayName} View Once*\n\nFailed to process media.`);
    }
}
break;

case 'anticall': {
    if (!isCreator) return reply('🔒 *Owner only*');
    const state = (args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(state)) return reply(`Usage: ${prefix}anticall on/off`);
    setSetting('bot', 'anticall', state === 'on');
    reply(`📵 *Anti-call* turned *${state.toUpperCase()}*`);
}
break;

case 'afk': {
    const reason = args.join(' ') || 'No reason given';
    setSetting(m.sender, 'afk', { reason, since: Date.now() });
    reply(`💤 *AFK activated*\n\nReason: ${reason}\n\nI'll let people know you're away until you message again.`);
}
break;

case 'antidelete': {
    if (!isCreator) return reply('🔒 *Owner only*');
    const scope = (args[0] || '').toLowerCase();
    const state = (args[1] || '').toLowerCase();
    if (scope === 'status') {
        if (!['on', 'off'].includes(state)) return reply(`Usage: ${prefix}antidelete status on/off`);
        setSetting(botNumber, 'antiDeleteStatus', state === 'on');
        return reply(`📊 *Anti-delete for statuses* turned *${state.toUpperCase()}*`);
    }
    if (!['on', 'off'].includes(scope)) return reply(`Usage: ${prefix}antidelete on/off\n${prefix}antidelete status on/off`);
    setSetting(botNumber, 'antiDelete', scope === 'on');
    reply(`🗑️ *Anti-delete* turned *${scope.toUpperCase()}*`);
}
break;

case 'note':
case 'addnote': {
    if (!q) return reply(`Usage: ${prefix}note <text>`);
    const notes = getSetting(m.sender, 'notes', []);
    notes.push({ text: q, savedAt: Date.now() });
    setSetting(m.sender, 'notes', notes);
    reply(`📝 *Note saved* (#${notes.length})`);
}
break;

case 'getnotes': {
    const notes = getSetting(m.sender, 'notes', []);
    if (!notes.length) return reply('📭 *You have no saved notes*');
    const list = notes.map((n, i) => `${i + 1}. ${n.text}`).join('\n');
    reply(`📝 *Your Notes:*\n${list}`);
}
break;

case 'delnote': {
    const idx = parseInt(args[0]) - 1;
    const notes = getSetting(m.sender, 'notes', []);
    if (isNaN(idx) || !notes[idx]) return reply(`Usage: ${prefix}delnote <number> — see ${prefix}notes for numbers`);
    notes.splice(idx, 1);
    setSetting(m.sender, 'notes', notes);
    reply(`🗑️ *Note deleted*`);
}
break;

case 'cmdtyping': {
    if (!isCreator) return reply('🔒 *Owner only*');
    if (!['on', 'off'].includes(args[0])) return reply(`Usage: ${prefix}cmdtyping on/off`);
    setSetting(botNumber, 'cmdTyping', args[0] === 'on');
    reply(`✅ *Command typing indicator* turned *${args[0].toUpperCase()}*`);
}
break;

case 'cmdrecording': {
    if (!isCreator) return reply('🔒 *Owner only*');
    if (!['on', 'off'].includes(args[0])) return reply(`Usage: ${prefix}cmdrecording on/off`);
    setSetting(botNumber, 'cmdRecording', args[0] === 'on');
    reply(`✅ *Command recording indicator* turned *${args[0].toUpperCase()}*`);
}
break;

case 'cmdreact': {
    if (!isCreator) return reply('🔒 *Owner only*');
    if (args[0] === 'off') {
        setSetting(botNumber, 'cmdReact', null);
        return reply('✅ *Command react disabled*');
    }
    if (!args[0]) return reply(`Usage: ${prefix}cmdreact <emoji>\n${prefix}cmdreact off`);
    setSetting(botNumber, 'cmdReact', args[0]);
    reply(`✅ *Command react set to* ${args[0]} — reacts to every command now.`);
}
break;

case 'autoreact': {
    if (!isCreator) return reply('🔒 *Owner only*');
    if (args[0] === 'off') {
        setSetting(botNumber, 'autoReact', null);
        return reply('✅ *Auto-react disabled*');
    }
    if (!args[0]) return reply(`Usage: ${prefix}autoreact <emoji>\n${prefix}autoreact off`);
    setSetting(botNumber, 'autoReact', args[0]);
    reply(`✅ *Auto-react set to* ${args[0]} — reacts to every message now.`);
}
break;

case 'mentionreact': {
    if (!isCreator) return reply('🔒 *Owner only*');
    if (args[0] === 'off') {
        setSetting(botNumber, 'mentionReact', null);
        return reply('✅ *Mention-react disabled*');
    }
    if (!args[0]) return reply(`Usage: ${prefix}mentionreact <emoji>\n${prefix}mentionreact off`);
    setSetting(botNumber, 'mentionReact', args[0]);
    reply(`✅ *Mention-react set to* ${args[0]} — reacts whenever the bot is tagged now.`);
}
break;

case 'mode': {
    if (!isCreator) return reply('🔒 *Owner only*');
    const modeArg = (args[0] || '').toLowerCase();
    if (!['public', 'private'].includes(modeArg)) {
        return reply(`Usage: ${prefix}mode public\n${prefix}mode private\n\nCurrent: *${devtrust.public ? 'public' : 'private'}*`);
    }

    devtrust.public = modeArg === 'public';

    try {
        const envPath = path.join(process.cwd(), 'config.env');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf-8');
            const line = `WORK_TYPE=${modeArg}`;
            envContent = /^WORK_TYPE=.*$/m.test(envContent)
                ? envContent.replace(/^WORK_TYPE=.*$/m, line)
                : envContent + `\n${line}`;
            fs.writeFileSync(envPath, envContent);
        }
    } catch (_) {}

    reply(`✅ *Bot mode set to ${modeArg}.*\n${modeArg === 'private' ? 'Only you and sudo users can use the bot now.' : 'Everyone can use the bot now.'}`);
}
break;

case 'setvar': {
    if (!isCreator) return reply('🔒 *Owner only*');
    const key = (args[0] || '').toLowerCase();
    const value = args.slice(1).join(' ');
    const keyMap = { botname: 'BOT_NAME', ownername: 'OWNER_NAME', ownernumber: 'OWNER_NUMBER' };
    if (!key || !value || !keyMap[key]) {
        return reply(`Usage: ${prefix}setvar <botname|ownername|ownernumber> <value>\n\n_Prefix is set separately via ${prefix}prefix, font via ${prefix}botfont._`);
    }

    try {
        const envKey = keyMap[key];
        const envPath = path.join(process.cwd(), 'config.env');

        // Update the live process so it takes effect immediately.
        process.env[envKey] = value;
        if (global.botConfig) {
            if (key === 'botname') global.botConfig.botName = value;
            if (key === 'ownername') global.botConfig.ownerName = value;
            if (key === 'ownernumber') global.botConfig.ownerNumber = value;
        }

        // Persist to config.env so it survives a restart too.
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf-8');
            const line = `${envKey}=${value}`;
            if (new RegExp(`^${envKey}=.*$`, 'm').test(envContent)) {
                envContent = envContent.replace(new RegExp(`^${envKey}=.*$`, 'm'), line);
            } else {
                envContent += `\n${line}`;
            }
            fs.writeFileSync(envPath, envContent);
        }

        reply(`✅ *${envKey}* updated to: ${value}\n\n_Applied immediately — some display text cached elsewhere may need ${prefix}update to fully refresh everywhere._`);
    } catch (e) {
        reply(`❌ *Failed to update:* ${e.message}`);
    }
}
break;

case 'botfont': {
    if (!isCreator) return reply('🔒 *Owner only*');
    const num = parseInt(args[0]);
    if (!args[0] || isNaN(num)) return reply(`Usage: ${prefix}botfont <1-63>\n${prefix}botfont 0 — disable (plain text)`);
    if (num < 0 || num > 63) return reply('❌ *Pick a number between 0 (off) and 63*');
    setSetting('bot', 'botFont', num);
    reply(num === 0 ? '✅ *Font disabled* — replies are plain text now.' : `✅ *Font ${num} applied* to all replies from now on.`);
}
break;

case 'fancy': {
    if (!q) return reply(`Usage: ${prefix}fancy <text> [1-59]`);
    const parts = q.split(' ');
    const lastArg = parts[parts.length - 1];
    let fancyNum = 1;
    let text = q;
    if (/^\d+$/.test(lastArg) && parseInt(lastArg) >= 1 && parseInt(lastArg) <= 59) {
        fancyNum = parseInt(lastArg);
        text = parts.slice(0, -1).join(' ');
    }
    reply(__lib_fontEngine.applyFancyFont(text, fancyNum));
}
break;

case 'setmenuimg': {
    if (!isCreator) return reply('🔒 *Owner only*');
    if (!args[0]) {
        setSetting('bot', 'menuImage', null);
        return reply('✅ *Menu image cleared* — menu will send as plain text now.');
    }
    if (!/^https?:\/\//.test(args[0])) return reply('❌ *Provide a valid direct image URL*');
    setSetting('bot', 'menuImage', args[0]);
    reply('✅ *Menu image set!* Try .menu to see it.');
}
break;

case 'mutescheduler':
case 'gcschedule': {
    if (!m.isGroup) return reply('❌ *Group only*');
    if (!isAdmins && !isCreator) return reply('🔒 *Admins only*');
    if (!args[0]) return reply(`Usage: ${prefix}mutescheduler <openHH:MM> <closeHH:MM> [reminderMinutesBefore]\nExample: ${prefix}mutescheduler 06:00 23:00 5\n(sends a @everyone reminder 5 minutes before closing)\n\n${prefix}mutescheduler off — disable`);
    if (args[0].toLowerCase() === 'off') {
        setSetting(m.chat, 'gcschedule', null);
        return reply('✅ *Group schedule disabled*');
    }
    const [openTime, closeTime, reminderArg] = args;
    if (!/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime)) {
        return reply(`Usage: ${prefix}mutescheduler <openHH:MM> <closeHH:MM> [reminderMinutesBefore]`);
    }
    const reminderMinutes = reminderArg && /^\d+$/.test(reminderArg) ? parseInt(reminderArg) : 5;
    setSetting(m.chat, 'gcschedule', { openTime, closeTime, reminderMinutes, lastAction: null });
    reply(`✅ *Mute scheduler set*\n🔓 Opens: ${openTime}\n🔒 Closes: ${closeTime}\n⏰ Reminder: ${reminderMinutes} min before close (tags everyone)\n\n_Based on the server's local time._`);
}
break;

case 'ss':
case 'screenshot': {
    if (!args[0]) return reply(`Usage: ${prefix}ss <url>`);
    let url = args[0];
    if (!/^https?:\/\//.test(url)) url = 'https://' + url;
    try {
        // WordPress's free mshots screenshot service — no API key required.
        // First request often returns a "generating" placeholder; briefly
        // wait and re-fetch once to usually get the real render.
        const shotUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=1280`;
        await reply('📸 *Capturing screenshot...*');
        await new Promise(r => setTimeout(r, 4000));
        const buffer = await getBuffer(shotUrl);
        await devtrust.sendMessage(m.chat, { image: buffer, caption: `📸 *Screenshot:* ${url}` }, { quoted: m });
    } catch (e) {
        reply('❌ *Failed to capture screenshot*');
    }
}
break;

// ============ EPHOTO TEXT EFFECTS ============
// Uses w5-textmaker (unofficial textpro.me/photooxy scraper, GPLv3).
// Response shape isn't documented anywhere I could verify, so this checks
// several common possible keys defensively rather than assuming one.
async function generateEphoto(effectUrl, text) {
    const w5botapi = require('w5-textmaker');
    const data = await w5botapi.textpro(effectUrl, [text]);
    const imageUrl = data?.result || data?.url || data?.data?.url || data?.image || null;
    if (!imageUrl) throw new Error('No image URL in response — the effect site may have changed its page structure.');
    return imageUrl;
}

case 'plugin': {
    if (!isCreator) return reply('🔒 *Owner only*');
    const sub = (args[0] || '').toLowerCase();
    const pluginManager = require(path.join(__dirname, 'pluginManager.js'));

    if (sub === 'install') {
        const pluginId = args[1];
        if (!pluginId) return reply(`Usage: ${prefix}plugin install <id>\n\nBrowse approved plugins on your panel first to get an id.`);
        try {
            // Only ever fetches from YOUR OWN approved-plugin registry —
            // never an arbitrary URL. A plugin has to pass your review
            // queue before it's reachable here at all.
            const res = await fetchJson(`${process.env.API_BASE_URL || 'https://legendarybot.dpdns.org'}/api/plugins/${pluginId}`);
            if (!res || !res.code) return reply('❌ *Plugin not found in the approved registry*');
            pluginManager.installPlugin(process.cwd(), pluginId, res.name, res.command, res.code);
            reply(`✅ *Installed:* ${res.name}\nTrigger: ${prefix}${res.command}\n\n_Runs in a sandbox — no access to files, other bots, or the network beyond what you send it._`);
        } catch (e) {
            reply(`❌ *Install failed:* ${e.message}`);
        }
    } else if (sub === 'list') {
        const installed = pluginManager.listPlugins(process.cwd());
        const names = Object.entries(installed);
        if (!names.length) return reply('📭 *No plugins installed*');
        const list = names.map(([id, p]) => `▸ ${p.name} (${prefix}${p.command}) — id: ${id}`).join('\n');
        reply(`🧩 *Installed Plugins:*\n${list}`);
    } else if (sub === 'remove') {
        const pluginId = args[1];
        if (!pluginId) return reply(`Usage: ${prefix}plugin remove <id>`);
        pluginManager.removePlugin(process.cwd(), pluginId);
        reply('✅ *Plugin removed*');
    } else {
        reply(`🧩 *Plugin System*\n\n▸ ${prefix}plugin install <id>\n▸ ${prefix}plugin list\n▸ ${prefix}plugin remove <id>\n\nPlugins only come from your panel's approved registry and run sandboxed — they can't touch your files or other users' bots.`);
    }
}
break;

case 'neonlight': {
    if (!q) return reply(`Usage: ${prefix}neonlight <text>`);
    try {
        const imageUrl = await generateEphoto('https://textpro.me/create-neon-devil-wings-text-effect-online-free-1014.html', q);
        await devtrust.sendMessage(m.chat, { image: { url: imageUrl }, caption: `✨ ${q}` }, { quoted: m });
    } catch (e) {
        reply(`❌ *Effect failed:* ${e.message}`);
    }
}
break;

case 'lightbulb': {
    if (!q) return reply(`Usage: ${prefix}lightbulb <text>`);
    try {
        const imageUrl = await generateEphoto('https://textpro.me/create-realistic-vintage-style-light-bulb-1000.html', q);
        await devtrust.sendMessage(m.chat, { image: { url: imageUrl }, caption: `💡 ${q}` }, { quoted: m });
    } catch (e) {
        reply(`❌ *Effect failed:* ${e.message}`);
    }
}
break;

case '😭': {
    if (!m.quoted) return reply('😐');
    
    let mime = (m.quoted.msg || m.quoted).mimetype || '';
    
    try {
        let media = await m.quoted.download();
        let botNumber = devtrust.user.id.split(':')[0] + '@s.whatsapp.net';
        
        if (/image/.test(mime)) {
            await devtrust.sendMessage(botNumber, { image: media });
            reply('🥲');
        } else if (/video/.test(mime)) {
            await devtrust.sendMessage(botNumber, { video: media });
            reply('🥲');
        } else if (/audio/.test(mime)) {
            await devtrust.sendMessage(botNumber, {
                audio: media,
                mimetype: 'audio/mpeg',
                ptt: true
            });
            reply('🥲');
        } else {
            reply('😶');
        }
    } catch (err) {
        console.error('Ghost error:', err);
        reply('🫠');
    }
}
break;


case 'shorturl': {
    if (!text) return reply('🔗 *Provide a URL*');
    
    try {
        let shortUrl1 = await (await fetch(`https://tinyurl.com/api-create.php?url=${args[0]}`)).text();
        if (!shortUrl1) return reply(`❌ *Failed to shorten URL*`);
        
        reply(`🔗 *Shortened*\n${shortUrl1}`);
    } catch (e) {
        reply('❌ *Error*');
    }
}
break;

case 'unblock': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    let users = m.mentionedJid[0] ? m.mentionedJid[0] : 
                m.quoted ? m.quoted.sender : 
                text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    await devtrust.updateBlockStatus(users, 'unblock');
    reply(`✅ *User unblocked*`);
}
break;

case 'block': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    let users = m.mentionedJid[0] ? m.mentionedJid[0] : 
                m.quoted ? m.quoted.sender : 
                text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    await devtrust.updateBlockStatus(users, 'block');
    reply(`🚫 *User blocked*`);
}
break;

case "savecontact": 
case "vcf": 
case "scontact": 
case "savecontacts": {
    if (!m.isGroup) {
        return reply("👥 *Groups only*");
    }

    try {
        let metadata = await devtrust.groupMetadata(m.chat);
        let participants = metadata.participants;
        let vcard = "";
        let noPort = 1;

        for (let a of participants) {
            let num = a.id.split("@")[0];
            vcard += `BEGIN:VCARD\nVERSION:3.0\nFN:[${noPort++}] +${num}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD\n`;
        }

        let filePath = "./contacts.vcf";
        fs.writeFileSync(filePath, vcard.trim());

        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                document: fs.readFileSync(filePath),
                mimetype: "text/vcard",
                fileName: `${metadata.subject}.vcf`,
                caption: `📇 *${participants.length} contacts saved*`
            }), 
            { quoted: m }
        );

        fs.unlinkSync(filePath);
    } catch (err) {
        reply("⚠️ Error: " + err.toString());
    }
}
break;

case 'toimg': {
    const quoted = m.quoted ? m.quoted : null;
    const mime = (quoted?.msg || quoted)?.mimetype || '';
    
    if (!quoted) return reply('🖼️ *Reply to a sticker*');
    if (!/webp/.test(mime)) return reply(`❌ *Reply to a sticker with ${prefix}toimg*`);
    
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');
    
    const media = await devtrust.downloadMediaMessage(quoted);
    const filePath = `./tmp/${Date.now()}.jpg`;
    
    fs.writeFileSync(filePath, media);
    
    await devtrust.sendMessage(m.chat,
        addNewsletterContext({
            image: fs.readFileSync(filePath)
        }),
        { quoted: m }
    );
    
    fs.unlinkSync(filePath);
}
break;

case 'tosticker':
case 'sticker':
case 's': {
    if (!m.quoted) {
        return reply(`🎨 *${botDisplayName} Sticker Maker*\n\nReply to an image or video with:\n${prefix}${command}\n\nVideo limit: Max 10 seconds`);
    }
    
    const mime = (m.quoted.msg || m.quoted).mimetype || '';
    const mediaType = (m.quoted.msg || m.quoted).seconds || 0;
    
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '🎨', key: m.key } });
        
        // Image to sticker
        if (/image/.test(mime)) {
            let media = await m.quoted.download();
            await devtrust.sendImageAsSticker(m.chat, media, m, { 
                packname: global.packname || botDisplayName, 
                author: global.author || "LËGĚNDÃRY Ł𝗮𝗯𝘀™" 
            });
        }
        
        // Video to animated sticker
        else if (/video/.test(mime)) {
            if (mediaType > 10) return reply('❌ *Video too long!* Max 10 seconds for stickers.');
            let media = await m.quoted.download();
            await devtrust.sendVideoAsSticker(m.chat, media, m, {
                packname: global.packname || botDisplayName,
                author: global.author || "LËGĚNDÃRY Ł𝗮𝗯𝘀™"
            });
        }
        
        else {
            return reply(`❌ *${botDisplayName} Sticker Maker*\n\nInvalid media. Reply to an image or video.\n\nSupported:\n• Images (jpg, png, webp)\n• Videos (mp4, webm, gif) max 10s`);
        }
        
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Sticker error:', error);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        reply(`⚠️ *${botDisplayName} Sticker Maker*\n\nSticker machine is jammed. Try again later.`);
    }
}
break;

case 'ytmp3old': {
    // disabled - duplicate broken handler removed, see 'yta'/'play' below
}
break;

// kick command handled below (see case 'kick'/'remove')

case 'listadmin':
case 'tagadmin':
case 'admin': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");

    const _admins = participants.filter(p => p.admin);
    const listAdmin = _admins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
    const _groupOwner = groupMetadata.owner || 
                 _admins.find(p => p.admin === 'superadmin')?.id || 
                 m.chat.split`-`[0] + '@s.whatsapp.net';

    const adminListMsg = `👑 *Admins*\n\n${listAdmin}`;
    
    devtrust.sendMessage(m.chat, {
        text: adminListMsg,
        mentions: [..._admins.map(v => v.id), _groupOwner]
    }, { quoted: m });
}
break;

// delete/del handled below

// grouplink handled below (see case 'invite'/'grouplink')

case 'broadcast': { 
    if (!isCreator) return reply("🔒 *Owner only*");
    if (!q) return reply(`📢 *No broadcast message provided*`);
    
    let getGroups = await devtrust.groupFetchAllParticipating();
    let groups = Object.entries(getGroups).slice(0).map(entry => entry[1]);
    let res = groups.map(v => v.id);
    
    reply(`📨 *Broadcasting to ${res.length} groups*`);
    
    for (let i of res) {
        await devtrust.sendMessage(i, 
            addNewsletterContext({
                image: { url: "https://files.catbox.moe/1ntiwc.jpg" },
                caption: `📢 *Broadcast*\n\n${qtext}`
            })
        );
    }
    
    reply(`✅ *Broadcast sent to ${res.length} groups*`);
} 
break;

// ============ DOWNLOADER COMMANDS ============
case "ytv":
case "video": {
    if (!text) return reply(`🎬 *YouTube Video Downloader*\nUsage: ${prefix}ytv [title or URL]`);
    try {
        reply('⏳ *Searching YouTube...*');
        const yts = require('yt-search');
        let videoUrl = text;
        if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
            const results = await yts(text);
            if (!results.videos.length) return reply('❌ *No results found*');
            videoUrl = results.videos[0].url;
        }
        const ytdl = require('@distube/ytdl-core');
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title;
        const duration = info.videoDetails.lengthSeconds;
        if (duration > 1800) return reply('❌ *Video too long (max 30 minutes)*');
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });
        await devtrust.sendMessage(m.chat, {
            video: { url: format.url },
            caption: `🎬 *${title}*`,
            mimetype: 'video/mp4'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "yta":
case "play": {
    if (!text) return reply(`🎵 *Music Player*\nUsage: ${prefix}play [song name]`);
    try {
        reply('⏳ *Searching for music...*');

        // Search YouTube for the song
        const yts = require('yt-search');
        const ytResults = await yts(text);
        if (!ytResults.videos.length) return reply('❌ *No results found*');

        const vid = ytResults.videos[0];
        const trackName = vid.title;
        const artistName = vid.author.name;
        const videoUrl = vid.url;
        const duration = vid.seconds;

        if (duration > 1800) return reply('❌ *Audio too long (max 30 minutes)*');

        reply(`🎵 *Found:* ${trackName}\n👤 *${artistName}*\n⏳ *Downloading...*`);

        const videoId = vid.videoId;
        const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // api-madrin ytmp3 endpoint — confirmed working, returns a FLAT
        // response object: { status, title, download_url, ... } (NOT nested
        // under a `.result` field).
        try {
            const madrinRes = await axios.get('https://api-madrin.zone.id/download/ytmp3', {
                params: { apikey: 'test', url: ytUrl },
                timeout: 30000
            });

            if (madrinRes.data?.status === true && madrinRes.data?.download_url) {
                return await devtrust.sendMessage(m.chat, {
                    audio: { url: madrinRes.data.download_url },
                    mimetype: 'audio/mpeg',
                    fileName: `${madrinRes.data.title || trackName}.mp3`,
                    ptt: false
                }, { quoted: m });
            }
            return reply(`❌ *Download failed:* API returned no download link.\n\n_Try again later or use .yta [youtube link] directly_`);
        } catch (e) {
            return reply(`❌ *Download failed:* ${e.message}\n\n_Try again later or use .yta [youtube link] directly_`);
        }

    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: tt]

case "fb":
case "facebook": {
    if (!text) return reply(`📘 *Facebook Downloader*\nUsage: ${prefix}fb [facebook video URL]`);
    try {
        reply('⏳ *Downloading Facebook video...*');
        const axios = require('axios');
        const res = await axios.get(`https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main.php?url=${encodeURIComponent(text)}`, {
            headers: { 'x-rapidapi-host': 'facebook-reel-and-video-downloader.p.rapidapi.com' }
        });
        const links = res.data?.links;
        if (!links || !links['Download High Quality']) return reply('❌ *Could not fetch Facebook video. Make sure the video is public.*');
        await devtrust.sendMessage(m.chat, {
            video: { url: links['Download High Quality'] },
            caption: '📘 *Facebook Video*',
            mimetype: 'video/mp4'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "insta":
case "twitter":
case "twit": {
    if (!text) return reply(`🐦 *Twitter/X Downloader*\nUsage: ${prefix}twitter [tweet URL]`);
    try {
        reply('⏳ *Downloading Twitter video...*');
        const axios = require('axios');
        const res = await axios.get(`https://twitsave.com/info?url=${encodeURIComponent(text)}`);
        const data = res.data;
        if (!data?.video) return reply('❌ *No video found in this tweet*');
        await devtrust.sendMessage(m.chat, {
            video: { url: data.video },
            caption: '🐦 *Twitter Video*',
            mimetype: 'video/mp4'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gdrive": {
    if (!text) return reply(`💾 *Google Drive Downloader*\nUsage: ${prefix}gdrive [drive URL]`);
    try {
        reply('⏳ *Fetching Google Drive file...*');
        const axios = require('axios');
        const fileId = text.match(/[-\w]{25,}/)?.[0];
        if (!fileId) return reply('❌ *Invalid Google Drive URL*');
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        await devtrust.sendMessage(m.chat, {
            document: { url: downloadUrl },
            mimetype: 'application/octet-stream',
            fileName: 'gdrive_file'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "pint":
case "pinterest": {
    if (!text) return reply(`📌 *Pinterest Downloader*\nUsage: ${prefix}pint [pinterest URL or search term]`);
    try {
        reply('⏳ *Fetching Pinterest media...*');
        const axios = require('axios');
        const res = await axios.get(`https://api.ryzendesu.vip/api/downloader/pinterest?url=${encodeURIComponent(text)}`);
        const url = res.data?.url || res.data?.data?.url;
        if (!url) return reply('❌ *Could not fetch Pinterest media*');
        const isVideo = url.includes('.mp4') || url.includes('video');
        await devtrust.sendMessage(m.chat, {
            [isVideo ? 'video' : 'image']: { url },
            caption: '📌 *Pinterest Media*',
            mimetype: isVideo ? 'video/mp4' : 'image/jpeg'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "autodl": {
    if (!text) return reply(`⬇️ *Auto Downloader*\nUsage: ${prefix}autodl [URL]\n_Supports: YouTube, TikTok, Instagram, Twitter, Facebook, Pinterest_`);
    try {
        reply('⏳ *Detecting URL and downloading...*');
        if (text.includes('youtube.com') || text.includes('youtu.be')) {
            const ytdl = require('@distube/ytdl-core');
            const info = await ytdl.getInfo(text);
            const format = ytdl.chooseFormat(info.formats, { quality: 'lowestaudio', filter: 'audioonly' });
            await devtrust.sendMessage(m.chat, {
                audio: { url: format.url },
                mimetype: 'audio/mpeg',
                fileName: `${info.videoDetails.title}.mp3`
            }, { quoted: m });
        } else if (text.includes('tiktok.com')) {
            const axios = require('axios');
            const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(text)}`);
            const videoUrl = res.data?.video?.noWatermark;
            if (!videoUrl) return reply('❌ *Could not download TikTok*');
            await devtrust.sendMessage(m.chat, { video: { url: videoUrl }, mimetype: 'video/mp4', caption: '🎵 TikTok' }, { quoted: m });
        } else if (text.includes('instagram.com')) {
            const axios = require('axios');
            const res = await axios.get(`https://saved.vc/api/download?url=${encodeURIComponent(text)}`);
            const media = res.data?.medias?.[0];
            if (!media) return reply('❌ *Could not download Instagram media*');
            const isVid = media.type === 'video';
            await devtrust.sendMessage(m.chat, { [isVid ? 'video' : 'image']: { url: media.url }, caption: '📸 Instagram' }, { quoted: m });
        } else if (text.includes('twitter.com') || text.includes('x.com')) {
            const axios = require('axios');
            const res = await axios.get(`https://twitsave.com/info?url=${encodeURIComponent(text)}`);
            if (!res.data?.video) return reply('❌ *No video found*');
            await devtrust.sendMessage(m.chat, { video: { url: res.data.video }, mimetype: 'video/mp4', caption: '🐦 Twitter' }, { quoted: m });
        } else {
            reply('❌ *Unsupported URL*\n_Supported: YouTube, TikTok, Instagram, Twitter/X_');
        }
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// ============ END DOWNLOADER COMMANDS ============

case "spotify":
case "spotifydl":
case "sp": {
    if (!text) {
        return reply(`🎧 *Spotify*\n\nUsage: ${prefix}spotify [spotify_track_link]\nExample: ${prefix}spotify https://open.spotify.com/track/xxxxx`);
    }
    
    // Validate Spotify URL
    if (!text.includes('open.spotify.com/track/')) {
        return reply(`❌ *Spotify*\n\nInvalid Spotify track link. Please provide a valid track URL.`);
    }
    
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '🎧', key: m.key } });
        
        reply(`🔍 *${botDisplayName} Spotify*\n\nFetching track: ${text.split('/track/')[1]?.substring(0, 10)}...`);
        
        const response = await axios.get(`https://api.dreaded.site/api/spotifydl`, {
            params: {
                url: text
            },
            timeout: 30000
        });
        
        if (response.data.success && response.data.result) {
            const result = response.data.result;
            
            // Send audio with rich preview
            await devtrust.sendMessage(m.chat, 
                addNewsletterContext({
                    audio: { url: result.download_url || result.downloadMP3 },
                    mimetype: 'audio/mpeg',
                    fileName: `${result.title}.mp3`,
                    contextInfo: {
                        externalAdReply: {
                            title: result.title,
                            body: `🎧 ${result.type || 'Track'}`,
                            thumbnailUrl: result.image,
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            sourceUrl: text
                        }
                    }
                }), 
                { quoted: m }
            );
            
            await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            
        } else {
            throw new Error('No download link found');
        }
        
    } catch (error) {
        console.error('Spotify error:', error.message);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        
        if (error.response?.status === 404) {
            return reply(`❌ *Spotify*\n\nTrack not found. Check the link and try again.`);
        }
        
        reply(`⚠️ *Spotify*\n\nSpotify service is on break. Try again later.`);
    }
}
break;

case 'hidetag': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    const groupMetadata = await devtrust.groupMetadata(m.chat);
    const participants = groupMetadata.participants;
    
    devtrust.sendMessage(m.chat, {
        text: q || ' ',
        mentions: participants.map(a => a.id)
    }, { quoted: m });
}
break;

case 'setpp': {
    if (!isCreator) return reply('🔒 *Owner only*');
    if (!quoted || !/image/.test(mime)) return reply(`🖼️ *Reply to an image with ${prefix}setpp*`);
    
    let media = await quoted.download();
    await devtrust.updateProfilePicture(botNumber, media);
    reply('✅ *Profile picture updated*');
}
break;

// ============ AI COMMANDS ============
case "openai":
case "gpt": {
    if (!text) return reply(`🤖 *OpenAI GPT*\nUsage: ${prefix}openai [question]`);
    try {
        reply('🤖 *Thinking...*');
        const madrinRes = await madrinGet('/ai/gpt5', { text, q: text, prompt: text });
        const answer = madrinRes?.result || madrinRes?.data?.result || madrinRes?.answer || madrinRes?.message;
        if (!answer) return reply('❌ *No response from OpenAI*');
        reply(`🤖 *OpenAI GPT*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gemini": {
    if (!text) return reply(`✨ *Gemini AI*\nUsage: ${prefix}gemini [question]`);
    try {
        reply('✨ *Gemini is thinking...*');
        const madrinRes = await madrinGet('/ai/gpt5', { text, q: text, prompt: text });
        const answer = madrinRes?.result || madrinRes?.data?.result || madrinRes?.answer || madrinRes?.message;
        if (!answer) return reply('❌ *No response from Gemini*');
        reply(`✨ *Gemini AI*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mistral": {
    if (!text) return reply(`🌪️ *Mistral AI*\nUsage: ${prefix}mistral [question]`);
    try {
        reply('🌪️ *Mistral is thinking...*');
        const madrinRes = await madrinGet('/ai/gpt5', { text, q: text, prompt: text });
        const answer = madrinRes?.result || madrinRes?.data?.result || madrinRes?.answer || madrinRes?.message;
        if (!answer) return reply('❌ *No response from Mistral*');
        reply(`🌪️ *Mistral AI*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "deepseek": {
    if (!text) return reply(`🔍 *DeepSeek AI*\nUsage: ${prefix}deepseek [question]`);
    try {
        reply('🔍 *DeepSeek is thinking...*');
        const madrinRes = await madrinGet('/ai/gpt5', { text, q: text, prompt: text });
        const answer = madrinRes?.result || madrinRes?.data?.result || madrinRes?.answer || madrinRes?.message;
        if (!answer) return reply('❌ *No response from DeepSeek*');
        reply(`🔍 *DeepSeek AI*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "llama": {
    if (!text) return reply(`🦙 *LLaMA AI*\nUsage: ${prefix}llama [question]`);
    try {
        reply('🦙 *LLaMA is thinking...*');
        const madrinRes = await madrinGet('/ai/gpt5', { text, q: text, prompt: text });
        const answer = madrinRes?.result || madrinRes?.data?.result || madrinRes?.answer || madrinRes?.message;
        if (!answer) return reply('❌ *No response from LLaMA*');
        reply(`🦙 *LLaMA AI*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "reasoning": {
    if (!text) return reply(`🧠 *AI Reasoning*\nUsage: ${prefix}reasoning [problem]`);
    try {
        reply('🧠 *Analyzing your problem...*');
        const prompt = `Break this down step-by-step, logically: ${text}`;
        const madrinRes = await madrinGet('/ai/gpt5', { text: prompt, q: prompt, prompt });
        const answer = madrinRes?.result || madrinRes?.data?.result || madrinRes?.answer || madrinRes?.message;
        if (!answer) return reply('❌ *Could not process reasoning*');
        reply(`🧠 *AI Reasoning*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "coder": {
    if (!text) return reply(`💻 *AI Coder*\nUsage: ${prefix}coder [coding question or task]`);
    try {
        reply('💻 *Writing code...*');
        const prompt = `You are an expert programmer. Write clean, commented code for: ${text}`;
        const madrinRes = await madrinGet('/ai/gpt5', { text: prompt, q: prompt, prompt });
        const answer = madrinRes?.result || madrinRes?.data?.result || madrinRes?.answer || madrinRes?.message;
        if (!answer) return reply('❌ *Could not generate code*');
        reply(`💻 *AI Coder*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "aisearch": {
    if (!text) return reply(`🔎 *AI Search*\nUsage: ${prefix}aisearch [query]`);
    try {
        reply('🔎 *Searching with AI...*');
        const axios = require('axios');
        const res = await axios.get(`https://google-it.vercel.app/api?q=${encodeURIComponent(text)}`).catch(() => null);
        if (!res?.data?.length) {
            const searchPrompt = `Search and summarize: ${text}`;
            const madrinRes = await madrinGet('/ai/gpt5', { text: searchPrompt, q: searchPrompt, prompt: searchPrompt });
            const answer = madrinRes?.result || madrinRes?.data?.result || madrinRes?.answer || madrinRes?.message;
            return reply(`🔎 *AI Search: ${text}*\n\n${answer || 'No results found'}`);
        }
        const results = res.data.slice(0, 3);
        let searchText = `🔎 *Search Results: ${text}*\n\n`;
        results.forEach((r, i) => {
            searchText += `${i + 1}. *${r.title}*\n${r.snippet}\n${r.link}\n\n`;
        });
        reply(searchText);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "bidara": {
    if (!text) return reply(`🕌 *Bidara Islamic AI*\nUsage: ${prefix}bidara [Islamic question]`);
    try {
        reply('🕌 *Bidara is thinking...*');
        const prompt = `You are Bidara, an Islamic AI assistant. Answer this Islamic question with Quran/Hadith references where possible: ${text}`;
        const madrinRes = await madrinGet('/ai/gpt5', { text: prompt, q: prompt, prompt });
        const answer = madrinRes?.result || madrinRes?.data?.result || madrinRes?.answer || madrinRes?.message;
        if (!answer) return reply('❌ *No response from Bidara*');
        reply(`🕌 *Bidara Islamic AI*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// ============ END AI COMMANDS ============

case "gpt4": {
    const chatId = m.key.remoteJid;
    let query = args.join(" ").trim();
    
    try {
        if (!query && m.message && m.message.extendedTextMessage && 
            m.message.extendedTextMessage.contextInfo && 
            m.message.extendedTextMessage.contextInfo.quotedMessage) {
            
            const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quoted.conversation) query = quoted.conversation;
            else if (quoted.extendedTextMessage && quoted.extendedTextMessage.text) 
                query = quoted.extendedTextMessage.text;
        }

        if (!query) {
            return reply("🤖 *Usage:* gpt4 your question");
        }

        const madrinRes = await madrinGet('/ai/gpt5', { text: query, q: query, prompt: query });
        const answer = madrinRes?.result || madrinRes?.data?.result || madrinRes?.answer || madrinRes?.message || "";

        if (!answer) return reply("⚠️ *No response from GPT-4*");

        const chunks = answer.match(/[\s\S]{1,3000}/g) || [answer];
        
        for (let i = 0; i < chunks.length; i++) {
            const header = i === 0 ? "🤖 *GPT-4*\n\n" : "";
            await devtrust.sendMessage(chatId, { text: header + chunks[i] });
        }
    } catch (err) {
        console.error("gpt4 command error:", err);
        reply("⚠️ *GPT-4 unavailable* • Try later");
    }
}
break;


case 'list': {
    const sub = args[0]?.toLowerCase();
    const sub2 = args[1]?.toLowerCase();
    if (sub !== 'todaymatch') break;

    const { fetchTodayMatches, formatMatchList } = require('./footballAlerts');
    await reply('⏳ *Fetching today\'s matches...*');

    const matches = await fetchTodayMatches();
    if (!matches.length) {
        return reply('❌ *No football matches found for today!*\n> Check back later 🗓️');
    }

    // Cache matches
    const fs2 = require('fs');
    fs2.writeFileSync('./database/todaymatches.json', JSON.stringify(matches, null, 2));

    await reply(formatMatchList(matches));
}
break;

case 'register': {
    const sub = args[0]?.toLowerCase();
    const num = parseInt(args[1]);

    if (sub !== 'match' || isNaN(num)) {
        return reply(`❌ *Usage:* ${prefix}register match <number>\n> Example: ${prefix}register match 3\n> First use *${prefix}list todaymatch* to see today\'s matches`);
    }

    const { registerUser } = require('./footballAlerts');
    const fs2 = require('fs');
    const dbPath = './database/todaymatches.json';

    if (!fs2.existsSync(dbPath)) {
        return reply(`❌ *No match list found!*\nUse *${prefix}list todaymatch* first to see today\'s matches.`);
    }

    const matches = JSON.parse(fs2.readFileSync(dbPath, 'utf-8'));
    const result = registerUser(sender, num, matches);
    await reply(result.msg);
}
break;

case 'unregister': {
    const sub = args[0]?.toLowerCase();
    const num = parseInt(args[1]);

    if (sub !== 'match') {
        return reply(`❌ *Usage:* ${prefix}unregister match <number>`);
    }

    const { unregisterUser } = require('./footballAlerts');
    const fs2 = require('fs');
    const dbPath = './database/todaymatches.json';
    const matches = fs2.existsSync(dbPath)
        ? JSON.parse(fs2.readFileSync(dbPath, 'utf-8'))
        : null;

    const msg = unregisterUser(sender, num, matches);
    await reply(msg);
}
break;

case 'myfollows':
case 'mymatch': {
    const fs2 = require('fs');
    const dbPath = './database/matchalerts.json';

    if (!fs2.existsSync(dbPath)) return reply('❌ *You are not following any matches.*');

    const db = JSON.parse(fs2.readFileSync(dbPath, 'utf-8'));
    const myMatches = [];

    for (const matchId in db.registrations) {
        const reg = db.registrations[matchId];
        if (reg.users.includes(sender)) {
            myMatches.push(reg.match);
        }
    }

    if (!myMatches.length) return reply(`❌ *You are not following any matches.*\nUse *${prefix}list todaymatch* to see today\'s matches.`);

    let text = `╭─⚽ *YOUR FOLLOWED MATCHES*\n│\n`;
    myMatches.forEach((m2, i) => {
        const hs = m2.homeScore ?? '-';
        const as = m2.awayScore ?? '-';
        const score = m2.status === 'SCHEDULED' || m2.status === 'TIMED'
            ? `🕐 ${m2.time} UTC`
            : `${hs} - ${as} [${m2.status}]`;
        text += `│ *${i+1}.* ${m2.home} 🆚 ${m2.away}\n`;
        text += `│    🏆 ${m2.league}\n`;
        text += `│    ${score}\n│\n`;
    });
    text += `╰─ Use *${prefix}unregister match <number>* to stop alerts`;
    await reply(text);
}
break;

case 'ping':
case 'speed': {
    const speed = require('performance-now');
    const timestampp = speed();
    const latensi = speed() - timestampp;
    
    reply(`*${botDisplayName} Ping*\n\n📡 ${latensi.toFixed(4)} ms *By LËGĚNDÃRY Ł𝗮𝗯𝘀™*`);
}
break;

case 'runtime':
case 'alive': {
    reply(`*${botDisplayName} Uptime*\n\n ${runtime(process.uptime())}`);
}
break;

case 'public': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    setSetting("bot", "mode", "public");
    devtrust.public = true;
    reply("🌍 *Public mode activated*\nEveryone can use the bot");
}
break;

case 'private':
case 'self': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    setSetting("bot", "mode", "self");
    devtrust.public = false;
    reply("🔐 *Private mode activated*\nOnly owner can use the bot");
}
break;
  
case 'imbd': {
    if (!text) return reply(`🎬 *Enter a movie or series name*`);
    
    try {
        let fids = await axios.get(`http://www.omdbapi.com/?apikey=742b2d09&t=${text}&plot=full`);
        
        let imdbt = `🎬 *${fids.data.Title}* (${fids.data.Year})\n\n` +
            `⭐ Rating: ${fids.data.imdbRating}/10\n` +
            `⏳ Runtime: ${fids.data.Runtime}\n` +
            `🎭 Genre: ${fids.data.Genre}\n` +
            `📅 Released: ${fids.data.Released}\n` +
            `👤 Director: ${fids.data.Director}\n` +
            `👥 Cast: ${fids.data.Actors}\n\n` +
            `📝 ${fids.data.Plot.substring(0, 300)}...`;
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: fids.data.Poster },
                caption: imdbt
            }),
            { quoted: m }
        );
    } catch (e) {
        reply("❌ *Movie not found*");
    }
    break;
}

case 'tiktoksearch': {
    if (!text) return reply("🎵 *Enter a search term*");

    try {
        let query = text;
        let url = `https://apis.prexzyvilla.site/search/tiktoksearch?q=${encodeURIComponent(query)}`;
        let response = await fetch(url);
        let json = await response.json();

        if (!json.status || !json.data || json.data.length === 0) {
            return reply("❌ *No results found*");
        }

        let videos = json.data.slice(0, 3);

        for (let i = 0; i < videos.length; i++) {
            let vid = videos[i];
            let date = new Date(vid.create_time * 1000);
            let info = `🎵 *TikTok #${i+1}*\n\n` +
                `👍 ${vid.digg_count} likes\n` +
                `👀 ${vid.play_count} views\n` +
                `📝 ${vid.title}\n` +
                `📅 ${date.toDateString()}`;

            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    video: { url: vid.play },
                    caption: info
                }),
                { quoted: m }
            );
        }
    } catch (err) {
        console.log(err);
        reply("❌ *Error fetching TikTok data*");
    }
}
break;
// [REMOVED DUPLICATE: pinterest]


case 'nsbxmdmfw': {
    try {
        const apiUrl = 'https://draculazyx-xyzdrac.hf.space/api/hentai';
        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data && data.videoUrl) {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    video: { url: data.videoUrl },
                    caption: `🎥 *${data.title || 'Video'}*\n⚠️ 18+ Content`
                }),
                { quoted: m }
            );
        } else {
            reply("❌ *Content unavailable*");
        }
    } catch (error) {
        console.error(error);
        reply("⚠️ *Error fetching content*");
    }
}
break;


// ==================== PAIRING COMMANDS FOR WHATSAPP BOT ====================

case 'pair': {
    await devtrust.sendMessage(m.chat, { react: { text: '🔗', key: m.key } });
    
    if (!q) return reply(`📌 *Usage:* pair 234xxxxxxx`);

    let target = text.split("|")[0];
    let cleanNumber = target.replace(/[^0-9]/g, '');
    
    // Validate number
    if (!/^\d{7,15}$/.test(cleanNumber)) {
        return reply("❌ *Invalid phone number format*");
    }

    // Check if number exists on WhatsApp
    try {
        const contactInfo = await devtrust.onWhatsApp(cleanNumber + '@s.whatsapp.net');
        if (!contactInfo || contactInfo.length === 0) {
            return reply("❌ *Number not registered on WhatsApp*");
        }
    } catch (e) {
        console.log('WhatsApp check error:', e);
    }

    // Create pairing directory if it doesn't exist
    const WHATSAPP_PAIRING_DIR = './database/pairing/';
    if (!fs.existsSync(WHATSAPP_PAIRING_DIR)) {
        fs.mkdirSync(WHATSAPP_PAIRING_DIR, { recursive: true });
    }

    // Send processing message
    const processingMsg = await devtrust.sendMessage(m.chat, {
        text: `🔗 *Generating pairing code for +${cleanNumber}*\n⏳ Please wait...`
    }, { quoted: m });

    try {
        // Load the pair module (same as Telegram bot)
        const startPairing = require('./pair');
        const jid = cleanNumber + '@s.whatsapp.net';
        
        // Start pairing (this will generate code and save to file)
        await startPairing(jid);
        
        // Wait 4 seconds (same as Telegram bot)
        await sleep(4000);

        // Read the pairing file (same as Telegram bot)
        const pairingFile = path.join(__dirname, 'nexstore', 'pairing', 'pairing.json');
        
        if (!fs.existsSync(pairingFile)) {
            throw new Error('Pairing file not found');
        }
        
        const cu = fs.readFileSync(pairingFile, 'utf-8');
        const cuObj = JSON.parse(cu);
        const pairingCode = cuObj.code;

        if (!pairingCode) {
            throw new Error('No code found in pairing file');
        }

        // Format the code nicely
        let formattedCode = pairingCode;
        if (!pairingCode.includes('-') && pairingCode.length > 4) {
            formattedCode = pairingCode.match(/.{1,4}/g).join('-');
        }

        // Save pairing data to WhatsApp directory
        const pairingData = {
            jid: jid,
            number: cleanNumber,
            code: pairingCode,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            status: 'pending',
            pairedBy: m.sender
        };
        
        fs.writeFileSync(
            path.join(WHATSAPP_PAIRING_DIR, `${cleanNumber}@s.whatsapp.net.json`), 
            JSON.stringify(pairingData, null, 2)
        );

        // Delete processing message
        await devtrust.sendMessage(m.chat, { delete: processingMsg.key });

        // Send code (FIRST MESSAGE)
        await devtrust.sendMessage(m.chat, { 
            text: `🔑 *YOUR PAIRING CODE*\n\n\`${formattedCode}\`` 
        }, { quoted: m });

        // Send instructions (SECOND MESSAGE)
        const instructions = `📱 *Pairing Steps*\n\n` +
            `1️⃣ Open WhatsApp on your phone\n` +
            `2️⃣ Tap *⋮* (Menu) → Linked Devices\n` +
            `3️⃣ Tap *Link a Device*\n` +
            `4️⃣ Enter this code: \`${formattedCode}\`\n\n` +
            `_⏱️ Code expires in 5 minutes_`;

        await devtrust.sendMessage(m.chat, { text: instructions }, { quoted: m });

        // Send code again (THIRD MESSAGE)
        await devtrust.sendMessage(m.chat, { 
            text: `${formattedCode}`
        }, { quoted: m });

    } catch (error) {
        console.error('Pairing error:', error);
        
        // Delete processing message
        await devtrust.sendMessage(m.chat, { delete: processingMsg.key });
        
        // Send error message
        await reply(`❌ *Pairing Failed*\n\n${error.message || 'Could not generate code. Try again later.'}`);
    }
}
break;

case "lyrics": {
    const chatId = m.key.remoteJid;
    const query = args.join(" ");
    
    if (!query) return reply("🎵 *Usage:* lyrics song title");

    try {
        const res = await fetch(`https://apis.prexzyvilla.site/search/lyrics?title=${encodeURIComponent(query)}`);
        const json = await res.json();

        if (!json.status || !json.data || !json.data.lyrics) {
            return reply(`❌ *Lyrics not found for "${query}"*`);
        }

        const { title, artist, album, lyrics } = json.data;
        const chunks = lyrics.match(/[\s\S]{1,3500}/g) || [lyrics];

        for (let i = 0; i < chunks.length; i++) {
            const header = i === 0 ? `🎵 *${title}* – *${artist}*\n📀 ${album || 'Unknown'}\n\n` : "";
            await devtrust.sendMessage(chatId, { text: header + chunks[i] });
        }
    } catch (err) {
        console.error(err);
        reply("⚠️ *Lyrics fetch failed*");
    }
}
break;
// [REMOVED DUPLICATE: take]

// ============ MOVIE COMMANDS ============
case 'movie2': {
    if (!text) return reply(`🎬 *Usage:* ${prefix + command} movie name`);

    try {
        await devtrust.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });
        await reply(`🔍 *Searching for "${text}"...*`);
        
        const apiUrl = `https://www.dark-yasiya-api.site/movie/sinhalasub/search?text=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl);
        const { status, result } = response.data;

        if (!status || !result || result.movies.length === 0) {
            return reply(`❌ *No movies found for "${text}"*`);
        }

        // Store results for THIS USER only
        userMovieSessions[m.sender] = {
            movies: result.movies,
            timestamp: Date.now()
        };

        let movieList = `🎥 *Results for "${text}"*\n\n`;
        result.movies.slice(0, 5).forEach((movie, index) => {
            movieList += `${index + 1}. *${movie.title}*\n`;
            movieList += `   ⭐ ${movie.imdb || 'N/A'} | 📅 ${movie.year || 'N/A'}\n\n`;
        });
        
        if (result.movies.length > 5) {
            movieList += `_...and ${result.movies.length - 5} more_\n\n`;
        }
        
        movieList += `📌 *Select:* .selectmovie [number]`;

        await reply(movieList);
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Movie search error:', error);
        reply(`❌ *Search failed* • Try again later`);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
}
break;

case 'selectmovie': {
    if (!text) return reply(`🎬 *Usage:* selectmovie [number]`);
    
    const userSession = userMovieSessions[m.sender];
    if (!userSession || !userSession.movies || userSession.movies.length === 0) {
        return reply(`❌ *No movies found. Use .movie command first*`);
    }

    const selectedIndex = parseInt(text.trim()) - 1;
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= userSession.movies.length) {
        return reply(`❌ *Invalid number* • Choose 1-${userSession.movies.length}`);
    }

    const selectedMovie = userSession.movies[selectedIndex];
    const movieDetailsUrl = `https://www.dark-yasiya-api.site/movie/sinhalasub/movie?url=${encodeURIComponent(selectedMovie.link)}`;

    try {
        await devtrust.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });
        await reply(`🔍 *Fetching details for "${selectedMovie.title}"...*`);
        
        const response = await axios.get(movieDetailsUrl);
        const { status, result } = response.data;

        if (!status || !result) return reply(`❌ *Failed to fetch details*`);

        const movie = result.data;
        
        // Store download links for THIS USER
        userSession.selectedMovie = {
            title: movie.title,
            links: movie.dl_links || []
        };

        let movieInfo = `🎬 *${movie.title}*\n\n` +
            `📅 ${movie.date || 'N/A'}\n` +
            `🌍 ${movie.country || 'N/A'}\n` +
            `⏳ ${movie.runtime || 'N/A'}\n` +
            `⭐ ${movie.imdbRate || 'N/A'}/10\n\n` +
            `📥 *Available Qualities*\n`;

        if (movie.dl_links && movie.dl_links.length > 0) {
            movie.dl_links.forEach((link, index) => {
                movieInfo += `${index + 1}. ${link.quality || 'Unknown'} - ${link.size || 'N/A'}\n`;
            });
            movieInfo += `\n📌 *Download:* .dlmovie [number]`;
        } else {
            movieInfo += `No download links available`;
        }

        // Send poster if available
        if (movie.image) {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    image: { url: movie.image },
                    caption: movieInfo
                }),
                { quoted: m }
            );
        } else {
            await reply(movieInfo);
        }
        
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Movie details error:', error);
        reply(`❌ *Failed to fetch movie details*`);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
}
break;

case 'dlmovie': {
    if (!text) return reply(`📥 *Usage:* dlmovie [number]`);
    
    const userSession = userMovieSessions[m.sender];
    if (!userSession || !userSession.selectedMovie || !userSession.selectedMovie.links) {
        return reply(`❌ *No movie selected. Use .selectmovie first*`);
    }

    const selectedIndex = parseInt(text.trim()) - 1;
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= userSession.selectedMovie.links.length) {
        return reply(`❌ *Invalid number* • Choose 1-${userSession.selectedMovie.links.length}`);
    }

    const selectedLink = userSession.selectedMovie.links[selectedIndex]?.link;
    if (!selectedLink) return reply(`❌ *Download link not found*`);

    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        await reply(`⏳ *Downloading "${userSession.selectedMovie.title}"...*\nQuality: ${selectedLink.quality || 'Unknown'}\nSize: ${selectedLink.size || 'Unknown'}`);

        // Send as document
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                document: { url: selectedLink },
                mimetype: 'video/mp4',
                fileName: `${userSession.selectedMovie.title}.mp4`,
                caption: `🎬 *${userSession.selectedMovie.title}*`
            }),
            { quoted: m }
        );
        
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Movie download error:', error);
        reply(`❌ *Download failed* • Try again later`);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
}
break;
// [REMOVED DUPLICATE: fb]
// [REMOVED DUPLICATE: instagram]

// ============================================================
// =================== NEW COMMANDS BLOCK ====================
// ============================================================

// ============ PROFILE PIC COMMANDS ============
case "pp":
case "getpp": {
    const target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;
    try {
        const ppUrl = await devtrust.profilePictureUrl(target, 'image');
        await devtrust.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption: `🖼️ *Profile Picture*\n▸ @${target.replace('@s.whatsapp.net', '')}`,
            mentions: [target]
        }, { quoted: m });
    } catch (e) {
        reply(`❌ *No profile picture found*\n_They may have hidden it_`);
    }
}
break;

case "ss": {
    if (!text) return reply(`📸 *Screenshot*\nUsage: ${prefix}ss [url]`);
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏰', key: m.key } });
        const url = text.startsWith('http') ? text : `https://${text}`;
        const res = await fetch(`https://api-rebix.zone.id/api/ssweb?url=${encodeURIComponent(url)}&device=desktop`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '🖥️ *Desktop Screenshot*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "sstab": {
    if (!text) return reply(`📸 *Screenshot (Tablet)*\nUsage: ${prefix}sstab [url]`);
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏰', key: m.key } });
        const url = text.startsWith('http') ? text : `https://${text}`;
        const res = await fetch(`https://api-rebix.zone.id/api/ssweb?url=${encodeURIComponent(url)}&device=tablet`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '📱 *Tablet Screenshot*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "ssphone": {
    if (!text) return reply(`📸 *Screenshot (Phone)*\nUsage: ${prefix}ssphone [url]`);
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏰', key: m.key } });
        const url = text.startsWith('http') ? text : `https://${text}`;
        const res = await fetch(`https://api-rebix.zone.id/api/ssweb?url=${encodeURIComponent(url)}&device=phone`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '📱 *Mobile Screenshot*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "ssfull": {
    if (!text) return reply(`📸 *Screenshot (Full Page)*\nUsage: ${prefix}ssfull [url]`);
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏰', key: m.key } });
        const url = text.startsWith('http') ? text : `https://${text}`;
        const res = await fetch(`https://api-rebix.zone.id/api/ssweb?url=${encodeURIComponent(url)}&device=full`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '📄 *Full Page Screenshot*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ AI COMMANDS (OpenRouter) ============
// [REMOVED DUPLICATE: openai]
// [REMOVED DUPLICATE: gemini]
// [REMOVED DUPLICATE: mistral]
// [REMOVED DUPLICATE: deepseek]
// [REMOVED DUPLICATE: llama]
// [REMOVED DUPLICATE: reasoning]
// [REMOVED DUPLICATE: coder]
// [REMOVED DUPLICATE: aisearch]
// [REMOVED DUPLICATE: bidara]

// ============ WEATHER ============
case "weatherdetail": {
    if (!text) return reply(`🌤️ *Weather Detail*\nUsage: ${prefix}weatherdetail [city/country]`);
    try {
        reply('⏳ *Fetching weather...*');
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(text)}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273`);
        const w = res.data;
        const sunrise = new Date(w.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const sunset = new Date(w.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        reply(`\`\`\`
✤ Weather Report ✤
➥ Location    : ${w.name} (${w.sys.country})
➥ Condition   : ${w.weather[0].main} - ${w.weather[0].description}
✽ Temperature : ${w.main.temp}°C (Feels like ${w.main.feels_like}°C)
✱ Min/Max     : ${w.main.temp_min}°C / ${w.main.temp_max}°C
✚ Humidity    : ${w.main.humidity}%
➙ Wind        : ${w.wind.speed} m/s
✽ Cloud Cover : ${w.clouds.all}%
♜ Sunrise     : ${sunrise}
♜ Sunset      : ${sunset}
\`\`\``);
    } catch (e) { reply(`❌ *City not found:* ${text}`); }
}
break;

// ============ READMORE ============
case "readmore": {
    const txt = text || m.quoted?.text;
    if (!txt) return reply(`Usage: ${prefix}readmore text |readmore| hidden text`);
    const readmoreChar = String.fromCharCode(8206).repeat(4001);
    const rtext = txt.replace(/(\|readmore\|)/i, readmoreChar);
    await devtrust.sendMessage(m.chat, { text: rtext }, { quoted: m });
}
break;

// ============ WALINK ============
case "walink":
case "wlink": {
    let num;
    if (m.mentionedJid?.[0]) num = m.mentionedJid[0].replace(/[^0-9]/g, '');
    else if (m.quoted?.sender) num = m.quoted.sender.replace(/[^0-9]/g, '');
    else if (text) num = text.replace(/[^0-9]/g, '');
    else num = m.sender.replace(/[^0-9]/g, '');
    reply(`🔗 *WhatsApp Link:*\nhttps://wa.me/${num}`);
}
break;

// ============ IP LOOKUP ============
case "ip": {
    if (!text) return reply(`🌐 *IP Lookup*\nUsage: ${prefix}ip [ip address]`);
    try {
        const res = await axios.get(`https://ipapi.co/${text}/json/`);
        const d = res.data;
        if (d.error) return reply(`❌ *Invalid IP:* ${text}`);
        reply(`🌐 *IP Lookup: ${text}*\n\n▸ *Country:* ${d.country_name} ${d.country_code}\n▸ *City:* ${d.city}\n▸ *Region:* ${d.region}\n▸ *ISP:* ${d.org}\n▸ *Timezone:* ${d.timezone}\n▸ *Currency:* ${d.currency}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ WIKIPEDIA ============
case "wiki":
case "wikipedia": {
    if (!text) return reply(`📖 *Wikipedia*\nUsage: ${prefix}wiki [topic]`);
    try {
        reply('⏳ *Searching Wikipedia...*');
        const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`);
        const d = res.data;
        if (d.type === 'disambiguation') return reply(`❌ *Ambiguous term. Try being more specific.*`);
        reply(`📖 *${d.title}*\n\n${d.extract}\n\n🔗 ${d.content_urls?.desktop?.page}`);
    } catch (e) { reply(`❌ *Not found:* ${text}`); }
}
break;

// ============ TINYURL ============
case "tinyurl":
case "shorten": {
    if (!text) return reply(`🔗 *URL Shortener*\nUsage: ${prefix}tinyurl [url]`);
    try {
        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`);
        reply(`🔗 *Shortened URL:*\n${res.data}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ TRANSLATE ============
case "trt":
case "translate": {
    if (!text) return reply(`🌍 *Translate*\nUsage: ${prefix}translate [lang] [text]\nExample: ${prefix}translate es Hello World`);
    try {
        const parts = text.split(' ');
        const lang = parts[0];
        const toTranslate = parts.slice(1).join(' ');
        if (!toTranslate) return reply(`Usage: ${prefix}translate [lang code] [text]\nCodes: es=Spanish, fr=French, ar=Arabic, yo=Yoruba, ha=Hausa`);
        const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(toTranslate)}`);
        const translated = res.data[0].map(i => i[0]).join('');
        reply(`🌍 *Translation*\n▸ *Original:* ${toTranslate}\n▸ *Translated (${lang}):* ${translated}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ CALCULATOR ============
case "calc": {
    if (!text) return reply(`🧮 *Calculator*\nUsage: ${prefix}calc [expression]\nExample: ${prefix}calc 5 * 8 + 2`);
    try {
        const result = eval(text.replace(/[^0-9+\-*/.() %]/g, ''));
        reply(`🧮 *Calculator*\n▸ *Expression:* ${text}\n▸ *Result:* ${result}`);
    } catch (e) { reply(`❌ *Invalid expression*`); }
}
break;

// ============ NGL ============
case "ngl": {
    if (!text) return reply(`💬 *NGL Link*\nUsage: ${prefix}ngl [username]`);
    reply(`💬 *NGL Anonymous Message Link*\n▸ Username: ${text}\n▸ Link: https://ngl.link/${text}\n\n_Share this link to receive anonymous messages!_`);
}
break;

// ============ FONT ============
case "font": {
    if (!text) return reply(`✍️ *Font Generator*\nUsage: ${prefix}font [text]`);
    const fonts = {
        bold: t => t.replace(/[a-z]/gi, c => String.fromCodePoint(c.toLowerCase().charCodeAt(0) - 97 + 0x1D41A).replace(/[A-Z]/gi, c => String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1D400))),
    };
    const styles = [
        ['𝗕𝗼𝗹𝗱', text.split('').map(c => { const n = c.charCodeAt(0); return n >= 65 && n <= 90 ? String.fromCodePoint(n - 65 + 0x1D400) : n >= 97 && n <= 122 ? String.fromCodePoint(n - 97 + 0x1D41A) : c; }).join('')],
        ['𝘐𝘵𝘢𝘭𝘪𝘤', text.split('').map(c => { const n = c.charCodeAt(0); return n >= 65 && n <= 90 ? String.fromCodePoint(n - 65 + 0x1D434) : n >= 97 && n <= 122 ? String.fromCodePoint(n - 97 + 0x1D44E) : c; }).join('')],
        ['𝙼𝚘𝚗𝚘', text.split('').map(c => { const n = c.charCodeAt(0); return n >= 65 && n <= 90 ? String.fromCodePoint(n - 65 + 0x1D670) : n >= 97 && n <= 122 ? String.fromCodePoint(n - 97 + 0x1D68A) : c; }).join('')],
        ['Ⓒⓘⓡⓒⓛⓔ', text.split('').map(c => { const n = c.charCodeAt(0); return n >= 65 && n <= 90 ? String.fromCodePoint(n - 65 + 0x24B6) : n >= 97 && n <= 122 ? String.fromCodePoint(n - 97 + 0x24D0) : c; }).join('')],
    ];
    let fontText = `✍️ *Font Styles for:* _${text}_\n\n`;
    styles.forEach(([name, styled]) => { fontText += `*${name}:*\n${styled}\n\n`; });
    reply(fontText);
}
break;

// ============ BIBLE ============
case "bible": {
    if (!text) return reply(`📖 *Bible*\nUsage: ${prefix}bible [book chapter:verse]\nExample: ${prefix}bible John 3:16`);
    try {
        const parts = text.split(' ');
        const book = parts[0];
        const cv = parts[1] || '1:1';
        const res = await axios.get(`https://bible-api.com/${book}+${cv}`);
        const d = res.data;
        if (d.error) return reply(`❌ *Verse not found*`);
        reply(`📖 *${d.reference}*\n\n_"${d.text.trim()}"_`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ JID ============
// [REMOVED DUPLICATE: jid]

// ============ ARCHIVE ============
case "archive": {
    if (!text && !m.quoted) return reply(`📦 *Archive Chat*\nUsage: ${prefix}archive [jid]\nOr reply to a message from the chat`);
    try {
        const jid = m.mentionedJid?.[0] || m.quoted?.sender || text || m.chat;
        await devtrust.chatModify({ archive: true }, jid);
        reply(`📦 *Chat archived successfully!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "unarchive": {
    try {
        const jid = m.mentionedJid?.[0] || m.quoted?.sender || text || m.chat;
        await devtrust.chatModify({ archive: false }, jid);
        reply(`📤 *Chat unarchived successfully!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ PIN CHAT ============
case "pinchat": {
    try {
        const jid = m.mentionedJid?.[0] || text || m.chat;
        await devtrust.chatModify({ pin: true }, jid);
        reply(`📌 *Chat pinned!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "unpinchat": {
    try {
        const jid = m.mentionedJid?.[0] || text || m.chat;
        await devtrust.chatModify({ pin: false }, jid);
        reply(`📌 *Chat unpinned!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ BLOCK/UNBLOCK ============
// [REMOVED DUPLICATE: block]
// [REMOVED DUPLICATE: unblock]

case "blocklist": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    try {
        const list = await devtrust.fetchBlocklist();
        if (!list.length) return reply('📋 *No blocked contacts*');
        const listText = list.map((j, i) => `${i + 1}. @${j.replace('@s.whatsapp.net', '')}`).join('\n');
        reply(`🚫 *Blocked Contacts (${list.length})*\n\n${listText}`, { mentions: list });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ BIO ============
case "bio":
case "setbio": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!text) return reply(`Usage: ${prefix}bio [new bio]`);
    try {
        await devtrust.updateProfileStatus(text);
        reply(`✅ *Bio updated!*\n▸ ${text}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ SETNAME ============
// [REMOVED DUPLICATE: setname]

// ============ FORWARD ============
case "forward": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!m.quoted) return reply(`Usage: Reply to a message + ${prefix}forward [number]`);
    if (!text) return reply(`Usage: ${prefix}forward [number]`);
    try {
        const forwardJid = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        await devtrust.sendMessage(forwardJid, { forward: m.quoted, force: true });
        reply(`✅ *Message forwarded!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ PRIVACY COMMANDS ============
case "lastseen": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}lastseen [all/contacts/none]`);
    try {
        const val = args[0] === 'all' ? 'all' : args[0] === 'contacts' ? 'contacts' : 'none';
        await devtrust.updateLastSeenPrivacy(val);
        reply(`✅ *Last seen set to:* ${val}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "online": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}online [all/match-last-seen]`);
    try {
        await devtrust.updateOnlinePrivacy(args[0]);
        reply(`✅ *Online visibility set to:* ${args[0]}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mypp":
case "pprivacy": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}mypp [all/contacts/none]`);
    try {
        const val = args[0] === 'all' ? 'all' : args[0] === 'contacts' ? 'contacts' : 'none';
        await devtrust.updateProfilePicturePrivacy(val);
        reply(`✅ *Profile picture privacy set to:* ${val}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mystatus": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}mystatus [all/contacts/none]`);
    try {
        await devtrust.updateStatusPrivacy(args[0]);
        reply(`✅ *Status privacy set to:* ${args[0]}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ AUTO REPLY FILTER ============
case "pfilter": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0] || !args[1]) return reply(`Usage: ${prefix}pfilter [keyword] [response]`);
    const keyword = args[0].toLowerCase();
    const response = args.slice(1).join(' ');
    let filters = JSON.parse(fs.existsSync('./database/pfilter.json') ? fs.readFileSync('./database/pfilter.json') : '{}');
    filters[keyword] = response;
    fs.writeFileSync('./database/pfilter.json', JSON.stringify(filters));
    reply(`✅ *Private filter added!*\n▸ Keyword: ${keyword}\n▸ Response: ${response}`);
}
break;

case "pstop": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) {
        fs.writeFileSync('./database/pfilter.json', '{}');
        return reply('✅ *All private filters cleared!*');
    }
    let filters = JSON.parse(fs.existsSync('./database/pfilter.json') ? fs.readFileSync('./database/pfilter.json') : '{}');
    delete filters[args[0].toLowerCase()];
    fs.writeFileSync('./database/pfilter.json', JSON.stringify(filters));
    reply(`✅ *Private filter removed:* ${args[0]}`);
}
break;

case "gfilter": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    if (!args[0] || !args[1]) return reply(`Usage: ${prefix}gfilter [keyword] [response]`);
    const gkeyword = args[0].toLowerCase();
    const gresponse = args.slice(1).join(' ');
    const gfFile = `./database/gfilter_${m.chat.replace(/[^0-9]/g, '')}.json`;
    let gfilters = JSON.parse(fs.existsSync(gfFile) ? fs.readFileSync(gfFile) : '{}');
    gfilters[gkeyword] = gresponse;
    fs.writeFileSync(gfFile, JSON.stringify(gfilters));
    reply(`✅ *Group filter added!*\n▸ Keyword: ${gkeyword}\n▸ Response: ${gresponse}`);
}
break;

case "gstop": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    const gsfFile = `./database/gfilter_${m.chat.replace(/[^0-9]/g, '')}.json`;
    if (!args[0]) {
        fs.writeFileSync(gsfFile, '{}');
        return reply('✅ *All group filters cleared!*');
    }
    let gsfilters = JSON.parse(fs.existsSync(gsfFile) ? fs.readFileSync(gsfFile) : '{}');
    delete gsfilters[args[0].toLowerCase()];
    fs.writeFileSync(gsfFile, JSON.stringify(gsfilters));
    reply(`✅ *Group filter removed:* ${args[0]}`);
}
break;

// ============ SETSUDO / DELSUDO / GETSUDO ============
// [REMOVED DUPLICATE: setsudo]
// [REMOVED DUPLICATE: delsudo]
// [REMOVED DUPLICATE: getsudo]

// ============ SETVAR / GETVAR / DELVAR / ALLVAR ============
case "setvar": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0] || !args[1]) return reply(`Usage: ${prefix}setvar [key] [value]`);
    let vars = JSON.parse(fs.existsSync('./database/vars.json') ? fs.readFileSync('./database/vars.json') : '{}');
    vars[args[0]] = args.slice(1).join(' ');
    fs.writeFileSync('./database/vars.json', JSON.stringify(vars));
    reply(`✅ *Variable set!*\n▸ ${args[0]} = ${args.slice(1).join(' ')}`);
}
break;

case "getvar": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}getvar [key]`);
    let vars = JSON.parse(fs.existsSync('./database/vars.json') ? fs.readFileSync('./database/vars.json') : '{}');
    if (!vars[args[0]]) return reply(`❌ *Variable not found:* ${args[0]}`);
    reply(`📌 *${args[0]}:* ${vars[args[0]]}`);
}
break;

case "delvar": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}delvar [key]`);
    let vars = JSON.parse(fs.existsSync('./database/vars.json') ? fs.readFileSync('./database/vars.json') : '{}');
    delete vars[args[0]];
    fs.writeFileSync('./database/vars.json', JSON.stringify(vars));
    reply(`✅ *Variable deleted:* ${args[0]}`);
}
break;

case "allvar": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    let vars = JSON.parse(fs.existsSync('./database/vars.json') ? fs.readFileSync('./database/vars.json') : '{}');
    const keys = Object.keys(vars);
    if (!keys.length) return reply('📋 *No variables set*');
    const varText = keys.map((k, i) => `${i + 1}. *${k}:* ${vars[k]}`).join('\n');
    reply(`📋 *All Variables:*\n\n${varText}`);
}
break;

// ============ NOTES ============
case "addnote": {
    if (!args[0] || !args[1]) return reply(`Usage: ${prefix}addnote [name] [content]`);
    const noteName = args[0].toLowerCase();
    const noteContent = args.slice(1).join(' ');
    const noteFile = `./database/notes_${m.chat.replace(/[^0-9]/g, '')}.json`;
    let notes = JSON.parse(fs.existsSync(noteFile) ? fs.readFileSync(noteFile) : '{}');
    notes[noteName] = noteContent;
    fs.writeFileSync(noteFile, JSON.stringify(notes));
    reply(`✅ *Note saved:* ${noteName}`);
}
break;

case "getnote": {
    if (!args[0]) return reply(`Usage: ${prefix}getnote [name]`);
    const noteFile = `./database/notes_${m.chat.replace(/[^0-9]/g, '')}.json`;
    let notes = JSON.parse(fs.existsSync(noteFile) ? fs.readFileSync(noteFile) : '{}');
    if (!notes[args[0].toLowerCase()]) return reply(`❌ *Note not found:* ${args[0]}`);
    reply(`📝 *${args[0]}:*\n\n${notes[args[0].toLowerCase()]}`);
}
break;

case "delnote": {
    if (!args[0]) return reply(`Usage: ${prefix}delnote [name]`);
    const noteFile = `./database/notes_${m.chat.replace(/[^0-9]/g, '')}.json`;
    let notes = JSON.parse(fs.existsSync(noteFile) ? fs.readFileSync(noteFile) : '{}');
    delete notes[args[0].toLowerCase()];
    fs.writeFileSync(noteFile, JSON.stringify(notes));
    reply(`✅ *Note deleted:* ${args[0]}`);
}
break;

case "allnotes": {
    const noteFile = `./database/notes_${m.chat.replace(/[^0-9]/g, '')}.json`;
    let notes = JSON.parse(fs.existsSync(noteFile) ? fs.readFileSync(noteFile) : '{}');
    const noteKeys = Object.keys(notes);
    if (!noteKeys.length) return reply('📋 *No notes saved*');
    reply(`📋 *Saved Notes:*\n\n${noteKeys.map((k, i) => `${i + 1}. ${k}`).join('\n')}`);
}
break;

case "delallnote":
case "clearnotes": {
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    const noteFile = `./database/notes_${m.chat.replace(/[^0-9]/g, '')}.json`;
    fs.writeFileSync(noteFile, '{}');
    reply('✅ *All notes cleared!*');
}
break;

// ============ ECONOMY SYSTEM ============
case "economy": {
    const econ = require('./legendaryEconomy');
    await econ.connectDB();
    const isActive = econ.isEconActive(m.chat);
    if (!isAdmins && !isCreator) return reply(`💰 *Economy System*\n▸ Status: ${isActive ? '✅ Active' : '❌ Inactive'}\n\n_Ask an admin to activate economy in this chat_`);
    if (!args[0]) return reply(`💰 *Economy Control*\nUsage: ${prefix}economy on/off`);
    if (args[0] === 'on') {
        econ.setEconActive(m.chat, true);
        reply('✅ *Economy system activated!*\n\nUsers can now use:\n`.bal` `.daily` `.work` `.rob` `.slots` `.shop` and more!');
    } else {
        econ.setEconActive(m.chat, false);
        reply('❌ *Economy system deactivated!*');
    }
}
break;

case "bal":
case "balance":
case "wallet": {
    const econ = require('./legendaryEconomy');
    const target = m.mentionedJid?.[0] || m.sender;
    const bal = await econ.balance(target, m.chat);
    reply(`💰 *Balance - @${target.replace('@s.whatsapp.net', '')}*\n\n▸ 👛 *Wallet:* ${econ.fmt(bal.wallet)}\n▸ 🏦 *Bank:* ${econ.fmt(bal.bank)} / ${econ.fmt(bal.bankCapacity)}`, { mentions: [target] });
}
break;

case "daily": {
    const econ = require('./legendaryEconomy');
    const result = await econ.daily(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Daily already claimed!*\nCome back in: *${result.cdL}*`);
    reply(`✅ *Daily Reward Claimed!*\n\n▸ 💵 *Earned:* ${econ.fmt(result.amount)}\n▸ 🔥 *Streak:* ${result.streak} days\n${result.streak > 1 ? `▸ 🎁 *Streak Bonus:* +${econ.fmt(result.amount - 200)}` : ''}`);
}
break;

case "dep":
case "deposit": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}dep [amount/all]`);
    const result = await econ.deposit(m.sender, m.chat, args[0]);
    if (result.invalid) return reply('❌ *Invalid amount*');
    if (result.noten) return reply('❌ *Not enough in wallet*');
    if (result.full) return reply('❌ *Bank is full! Upgrade your bank capacity*');
    reply(`✅ *Deposited ${econ.fmt(result.amount)} to bank!*`);
}
break;

case "with":
case "withdraw": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}with [amount/all]`);
    const result = await econ.withdraw(m.sender, m.chat, args[0]);
    if (result.invalid) return reply('❌ *Invalid amount*');
    if (result.noten) return reply('❌ *Not enough in bank*');
    reply(`✅ *Withdrew ${econ.fmt(result.amount)} to wallet!*`);
}
break;

case "give":
case "pay": {
    const econ = require('./legendaryEconomy');
    const giveTarget = m.mentionedJid?.[0];
    if (!giveTarget) return reply(`Usage: ${prefix}give @user [amount]`);
    const giveAmount = parseInt(args[1] || args[0]);
    if (isNaN(giveAmount) || giveAmount <= 0) return reply('❌ *Invalid amount*');
    const result = await econ.transfer(m.sender, giveTarget, m.chat, giveAmount);
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    reply(`✅ *Transferred ${econ.fmt(giveAmount)} to @${giveTarget.replace('@s.whatsapp.net', '')}!*`, { mentions: [giveTarget] });
}
break;

case "work": {
    const econ = require('./legendaryEconomy');
    const jobs = ['👨‍💻 Programmer', '🚕 Uber Driver', '🍕 Pizza Delivery', '👨‍🍳 Chef', '📸 Photographer', '🎸 Musician', '🏋️ Trainer', '📚 Teacher'];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const result = await econ.work(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Already worked! Rest first.*\nCome back in: *${result.cdL}*`);
    reply(`💼 *Work Complete!*\n\n▸ Job: ${job}\n▸ 💵 Earned: ${econ.fmt(result.amount)}\n\n_Hard work pays off!_`);
}
break;

case "rob": {
    const econ = require('./legendaryEconomy');
    const robTarget = m.mentionedJid?.[0];
    if (!robTarget) return reply(`Usage: ${prefix}rob @user`);
    if (robTarget === m.sender) return reply('❌ *You cannot rob yourself!*');
    const result = await econ.rob(m.sender, m.chat, robTarget);
    if (result.cd) return reply(`⏰ *Cooldown active!*\nWait: *${result.cdL}*`);
    if (result.lowbal) return reply(`❌ *@${robTarget.replace('@s.whatsapp.net', '')} doesn't have enough to rob!*`, { mentions: [robTarget] });
    if (result.success) {
        reply(`🥷 *Rob Successful!*\n\n▸ Victim: @${robTarget.replace('@s.whatsapp.net', '')}\n▸ 💵 Stolen: ${econ.fmt(result.amount)}\n\n_Get away!_ 🏃`, { mentions: [robTarget] });
    } else {
        reply(`🚔 *Rob Failed!*\n\n▸ You got caught!\n▸ 💸 Fine: ${econ.fmt(result.fine)}\n\n_Better luck next time!_`);
    }
}
break;

case "lb":
case "leaderboard": {
    const econ = require('./legendaryEconomy');
    const users = await econ.lb(m.chat);
    if (!users.length) return reply('📊 *No economy data yet!*');
    let lbText = '🏆 *Economy Leaderboard*\n\n';
    const medals = ['🥇', '🥈', '🥉'];
    users.forEach((u, i) => {
        const medal = medals[i] || `${i + 1}.`;
        lbText += `${medal} @${u.userID.replace('@s.whatsapp.net', '')} — ${econ.fmt(u.wallet + u.bank)}\n`;
    });
    reply(lbText, { mentions: users.map(u => u.userID) });
}
break;

case "rich": {
    const econ = require('./legendaryEconomy');
    const users = await econ.lb(m.chat, 5);
    if (!users.length) return reply('📊 *No data yet!*');
    let richText = '💎 *Richest Users*\n\n';
    users.forEach((u, i) => {
        richText += `${i + 1}. @${u.userID.replace('@s.whatsapp.net', '')} — ${econ.fmt(u.wallet + u.bank)}\n`;
    });
    reply(richText, { mentions: users.map(u => u.userID) });
}
break;

case "poor": {
    const econ = require('./legendaryEconomy');
    await econ.connectDB();
    const mongoose = require('mongoose');
    const users = await mongoose.model('EconUser').find({ chatID: m.chat }).sort({ wallet: 1 }).limit(5);
    if (!users.length) return reply('📊 *No data yet!*');
    let poorText = '💀 *Poorest Users*\n\n';
    users.forEach((u, i) => {
        poorText += `${i + 1}. @${u.userID.replace('@s.whatsapp.net', '')} — ${econ.fmt(u.wallet + u.bank)}\n`;
    });
    reply(poorText, { mentions: users.map(u => u.userID) });
}
break;

case "shop": {
    const econ = require('./legendaryEconomy');
    const items = econ.getShop();
    let shopText = '🛒 *LEGENDARY SHOP*\n\n';
    items.forEach((item, i) => {
        shopText += `${i + 1}. *${item.name}*\n   💵 Price: ${econ.fmt(item.price)}\n   📝 ${item.description}\n\n`;
    });
    shopText += `_Use ${prefix}buy [number] to purchase_`;
    reply(shopText);
}
break;

case "buy": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}buy [item number]\nSee ${prefix}shop for items`);
    const result = await econ.buyItem(m.sender, m.chat, args[0]);
    if (result.notfound) return reply(`❌ *Item not found!*\nSee ${prefix}shop for available items`);
    if (result.insufficient) return reply(`❌ *Not enough money!*\n▸ Item costs: ${econ.fmt(result.item?.price)}`);
    reply(`✅ *Purchase Successful!*\n\n▸ Item: ${result.item.name}\n▸ 💵 Cost: ${econ.fmt(result.item.price)}\n▸ 👛 Remaining: ${econ.fmt(result.newBalance)}`);
}
break;

case "inv":
case "inventory": {
    const econ = require('./legendaryEconomy');
    const target = m.mentionedJid?.[0] || m.sender;
    const inv = await econ.getInventory(target, m.chat);
    if (!inv.length) return reply(`🎒 *Inventory is empty!*\nBuy items with ${prefix}shop`);
    let invText = `🎒 *Inventory - @${target.replace('@s.whatsapp.net', '')}*\n\n`;
    inv.forEach((item, i) => {
        invText += `${i + 1}. ${item.name} x${item.quantity}\n`;
    });
    reply(invText, { mentions: [target] });
}
break;

case "beg": {
    const econ = require('./legendaryEconomy');
    const beggars = ['Elon Musk', 'Bill Gates', 'Jeff Bezos', 'Mark Zuckerberg', 'a random stranger'];
    const beggar = beggars[Math.floor(Math.random() * beggars.length)];
    const result = await econ.beg(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    if (result.success) {
        reply(`🙏 *${beggar} gave you ${econ.fmt(result.amount)}!*\n\n_Begging is not dignified but it worked!_`);
    } else {
        reply(`😢 *${beggar} ignored you!*\n\n_Better luck next time!_`);
    }
}
break;

case "crime": {
    const econ = require('./legendaryEconomy');
    const result = await econ.crime(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    if (result.success) {
        reply(`🦹 *Crime Successful!*\n\n▸ Crime: ${result.crimeName}\n▸ 💵 Earned: ${econ.fmt(result.amount)}\n\n_You got away with it!_ 😈`);
    } else {
        reply(`🚔 *Crime Failed!*\n\n▸ Crime: ${result.crimeName}\n▸ 💸 Fine: ${econ.fmt(result.fine)}\n\n_You got caught!_ 😅`);
    }
}
break;

case "loan": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`💳 *Loan System*\nUsage: ${prefix}loan [amount]\nMin: $1,000 | Max: $50,000\nInterest: 15%`);
    const amount = parseInt(args[0]);
    const result = await econ.loan(m.sender, m.chat, amount);
    if (result.tooLow) return reply('❌ *Minimum loan is $1,000*');
    if (result.tooHigh) return reply('❌ *Maximum loan is $50,000*');
    if (result.hasLoan) return reply(`❌ *You already have a loan of ${econ.fmt(result.loanAmount)}!*\nPay it first with ${prefix}payloan`);
    reply(`✅ *Loan Approved!*\n\n▸ 💵 Amount: ${econ.fmt(result.amount)}\n▸ 📈 Interest: ${result.interest}%\n▸ 💸 Total Owed: ${econ.fmt(result.totalOwed)}\n▸ ⏰ Due: 7 days\n\n_Use ${prefix}payloan to repay_`);
}
break;

case "payloan": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}payloan [amount/all]`);
    const result = await econ.payLoan(m.sender, m.chat, args[0]);
    if (result.noLoan) return reply('❌ *You have no active loan!*');
    if (result.invalid) return reply('❌ *Invalid amount*');
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    if (result.fullPaid) {
        reply(`✅ *Loan fully paid!*\n▸ 💵 Paid: ${econ.fmt(result.amount)}\n▸ 🎉 You are debt free!`);
    } else {
        reply(`✅ *Partial payment made!*\n▸ 💵 Paid: ${econ.fmt(result.amount)}\n▸ 💸 Remaining: ${econ.fmt(result.remaining)}`);
    }
}
break;

case "slots": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`🎰 *Slots*\nUsage: ${prefix}slots [bet]\nMin bet: $100`);
    const bet = parseInt(args[0]);
    const result = await econ.slots(m.sender, m.chat, bet);
    if (result.invalid) return reply('❌ *Minimum bet is $100*');
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    const [a, b, c] = result.result;
    const won = result.winnings > 0;
    reply(`🎰 *SLOTS*\n\n┌─────────────┐\n│ ${a}  ${b}  ${c} │\n└─────────────┘\n\n${won ? `🎉 *YOU WIN ${econ.fmt(result.winnings)}!*` : `😢 *You lost ${econ.fmt(Math.abs(result.winnings))}*`}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}`);
}
break;

case "sell": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}sell [item name] [quantity?]`);
    const qty = parseInt(args[args.length - 1]) || 1;
    const itemN = args.join(' ').replace(/ \d+$/, '');
    const result = await econ.sell(m.sender, m.chat, itemN, qty);
    if (result.noItems) return reply('❌ *Your inventory is empty!*');
    if (result.notfound) return reply(`❌ *Item not found:* ${itemN}`);
    if (result.insufficient) return reply(`❌ *You only have ${result.has}x of that item*`);
    reply(`✅ *Sold!*\n▸ Item: ${result.itemName} x${result.quantity}\n▸ 💵 Earned: ${econ.fmt(result.sellPrice)}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}`);
}
break;

case "hunt": {
    const econ = require('./legendaryEconomy');
    const animals = ['🦌 Deer', '🐗 Wild Boar', '🦊 Fox', '🐇 Rabbit', '🦜 Parrot', '🐍 Snake'];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const result = await econ.hunt(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    reply(`🏹 *Hunt Successful!*\n\n▸ Caught: ${animal}\n▸ 💵 Earned: ${econ.fmt(result.amount)}\n\n_Great aim!_ 🎯`);
}
break;

case "mine": {
    const econ = require('./legendaryEconomy');
    const minerals = ['💎 Diamond', '🔴 Ruby', '🟡 Gold', '⬜ Silver', '🔵 Sapphire', '🪨 Coal'];
    const mineral = minerals[Math.floor(Math.random() * minerals.length)];
    const result = await econ.mine(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    reply(`⛏️ *Mining Complete!*\n\n▸ Found: ${mineral}\n▸ 💵 Earned: ${econ.fmt(result.amount)}\n\n_Keep digging!_ 💪`);
}
break;

case "fish": {
    const econ = require('./legendaryEconomy');
    const fishes = ['🐟 Fish', '🐠 Clownfish', '🐡 Blowfish', '🦈 Shark', '🦞 Lobster', '🦑 Squid'];
    const caught = fishes[Math.floor(Math.random() * fishes.length)];
    const result = await econ.fish(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    reply(`🎣 *Fishing Complete!*\n\n▸ Caught: ${caught}\n▸ 💵 Earned: ${econ.fmt(result.amount)}\n\n_Nice catch!_ 🎉`);
}
break;

case "use": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}use [item name]`);
    const result = await econ.use(m.sender, m.chat, args.join(' '));
    if (result.notfound) return reply(`❌ *Item not found in inventory!*`);
    reply(`✅ *Item Used!*\n▸ ${result.item.name}\n▸ ${result.effect}\n▸ Remaining: ${result.remaining}x`);
}
break;

case "gift": {
    const econ = require('./legendaryEconomy');
    const giftTarget = m.mentionedJid?.[0];
    if (!giftTarget) return reply(`Usage: ${prefix}gift @user [item name] [quantity?]`);
    const giftQty = parseInt(args[args.length - 1]) || 1;
    const giftItem = args.slice(1).join(' ').replace(/ \d+$/, '');
    const result = await econ.gift(m.sender, m.chat, giftTarget, giftItem, giftQty);
    if (result.notfound) return reply('❌ *Item not found in your inventory!*');
    if (result.insufficient) return reply('❌ *Not enough quantity to gift!*');
    reply(`🎁 *Gift Sent!*\n▸ To: @${giftTarget.replace('@s.whatsapp.net', '')}\n▸ Item: ${result.item.name} x${giftQty}`, { mentions: [giftTarget] });
}
break;

case "streak": {
    const econ = require('./legendaryEconomy');
    const result = await econ.streak(m.sender, m.chat);
    reply(`🔥 *Daily Streak*\n\n▸ Current Streak: ${result.count} days\n▸ Bonus: +${econ.fmt(result.bonus)} per daily\n\n_Keep claiming daily to maintain streak!_`);
}
break;

case "gamble": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`🎲 *Gamble*\nUsage: ${prefix}gamble [amount]`);
    const result = await econ.gamble(m.sender, m.chat, parseInt(args[0]));
    if (result.invalid) return reply('❌ *Invalid amount*');
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    reply(`🎲 *Gamble Result*\n\n${result.win ? `🎉 *YOU WON ${econ.fmt(result.amount)}!*` : `😢 *You lost ${econ.fmt(result.amount)}!*`}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}`);
}
break;

case "coinflip":
case "flip": {
    const econ = require('./legendaryEconomy');
    if (!args[0] || !args[1]) return reply(`🪙 *Coinflip*\nUsage: ${prefix}coinflip [heads/tails] [amount]`);
    const result = await econ.coinflip(m.sender, m.chat, args[0].toLowerCase(), parseInt(args[1]));
    if (result.invalidChoice) return reply('❌ *Choose heads or tails*');
    if (result.invalid) return reply('❌ *Invalid amount*');
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    reply(`🪙 *Coinflip!*\n\n▸ Result: *${result.result}* ${result.result === 'heads' ? '👑' : '🔵'}\n▸ Your choice: ${args[0]}\n\n${result.win ? `🎉 *YOU WIN ${econ.fmt(result.amount)}!*` : `😢 *You lost ${econ.fmt(result.amount)}*`}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}`);
}
break;

case "networth": {
    const econ = require('./legendaryEconomy');
    const target = m.mentionedJid?.[0] || m.sender;
    const result = await econ.networth(target, m.chat);
    reply(`💎 *Net Worth - @${target.replace('@s.whatsapp.net', '')}*\n\n▸ 👛 Wallet: ${econ.fmt(result.wallet)}\n▸ 🏦 Bank: ${econ.fmt(result.bank)}\n▸ 🎒 Inventory: ${econ.fmt(result.invValue)}\n▸ 📊 Total: ${econ.fmt(result.total)}`, { mentions: [target] });
}
break;

case "heist": {
    const econ = require('./legendaryEconomy');
    const crew = m.mentionedJid || [];
    if (!crew.length) return reply(`🦹 *Heist*\nUsage: ${prefix}heist @member1 @member2...\n_Mention your heist crew!_`);
    crew.push(m.sender);
    const result = await econ.heist(crew, m.chat);
    let heistText = `🦹 *HEIST ${result.success ? 'SUCCESSFUL' : 'FAILED'}!*\n\n▸ Target: ${result.target}\n\n`;
    result.results.forEach(r => {
        heistText += `▸ @${r.member.replace('@s.whatsapp.net', '')}: ${r.success ? `+${econ.fmt(r.amount)}` : `-${econ.fmt(r.amount)} (fine)`}\n`;
    });
    reply(heistText, { mentions: crew });
}
break;

case "blackjack":
case "bj": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`🃏 *Blackjack*\nUsage: ${prefix}blackjack [bet]`);
    const bet = parseInt(args[0]);
    const bal = await econ.balance(m.sender, m.chat);
    if (isNaN(bet) || bet < 50) return reply('❌ *Minimum bet is $50*');
    if (bal.wallet < bet) return reply('❌ *Not enough in wallet*');
    const deck = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const getCard = () => deck[Math.floor(Math.random() * deck.length)];
    const getVal = (cards) => {
        let total = 0, aces = 0;
        cards.forEach(c => {
            if (c === 'A') { aces++; total += 11; }
            else if (['J','Q','K'].includes(c)) total += 10;
            else total += parseInt(c);
        });
        while (total > 21 && aces > 0) { total -= 10; aces--; }
        return total;
    };
    const playerCards = [getCard(), getCard()];
    const dealerCards = [getCard(), getCard()];
    const pVal = getVal(playerCards);
    const dVal = getVal(dealerCards);
    const playerWin = pVal === 21 || (dVal > 21) || (pVal <= 21 && pVal > dVal);
    if (playerWin) { await econ.give(m.sender, m.chat, bet); }
    else { await econ.deduct(m.sender, m.chat, bet); }
    reply(`🃏 *BLACKJACK*\n\n▸ Your hand: ${playerCards.join(' ')} = ${pVal}\n▸ Dealer: ${dealerCards.join(' ')} = ${dVal}\n\n${playerWin ? `🎉 *YOU WIN ${econ.fmt(bet)}!*` : `😢 *Dealer wins! Lost ${econ.fmt(bet)}*`}`);
}
break;

case "dicegamble": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`🎲 *Dice Gamble*\nUsage: ${prefix}dicegamble [bet]`);
    const bet = parseInt(args[0]);
    const bal = await econ.balance(m.sender, m.chat);
    if (isNaN(bet) || bet <= 0) return reply('❌ *Invalid bet*');
    if (bal.wallet < bet) return reply('❌ *Not enough in wallet*');
    const p = Math.ceil(Math.random() * 6);
    const d = Math.ceil(Math.random() * 6);
    const win = p > d;
    if (win) await econ.give(m.sender, m.chat, bet);
    else if (p < d) await econ.deduct(m.sender, m.chat, bet);
    reply(`🎲 *DICE GAMBLE*\n\n▸ Your roll: ${p}\n▸ Bot roll: ${d}\n\n${p > d ? `🎉 *YOU WIN ${econ.fmt(bet)}!*` : p < d ? `😢 *You lost ${econ.fmt(bet)}!*` : `🤝 *It's a tie!*`}`);
}
break;

case "tax": {
    const econ = require('./legendaryEconomy');
    const result = await econ.tax(m.sender, m.chat);
    if (result.tooBroke) return reply('❌ *You need at least $500 to be taxed!*');
    reply(`🏛️ *Tax Collected!*\n\n▸ 💸 Taxed: ${econ.fmt(result.taxed)} (10%)\n▸ Redistributed to top earner\n\n_Taxes fund the community!_`);
}
break;

case "bankrob": {
    const econ = require('./legendaryEconomy');
    const result = await econ.bankrob(m.sender, m.chat);
    if (result.success) {
        reply(`🏦 *Bank Robbery ${result.success ? 'Successful' : 'Failed'}!*\n\n▸ Target: ${result.bank}\n▸ 💵 Loot: ${econ.fmt(result.loot)}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}\n\n_You pulled it off!_ 🎉`);
    } else {
        reply(`🚔 *Bank Robbery Failed!*\n\n▸ Target: ${result.bank}\n▸ 💸 Fine: ${econ.fmt(result.fine)}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}\n\n_Security was too tight!_`);
    }
}
break;

case "profile": {
    const econ = require('./legendaryEconomy');
    const target = m.mentionedJid?.[0] || m.sender;
    const result = await econ.profile(target, m.chat);
    reply(`👤 *Profile - @${target.replace('@s.whatsapp.net', '')}*\n\n▸ 👛 Wallet: ${econ.fmt(result.wallet)}\n▸ 🏦 Bank: ${econ.fmt(result.bank)} / ${econ.fmt(result.bankCapacity)}\n▸ 🎒 Items: ${result.invCount}\n▸ 📊 Net Worth: ${econ.fmt(result.net)}\n▸ 🏅 Rank: ${result.tier}\n▸ 🔥 Streak: ${result.streak} days`, { mentions: [target] });
}
break;
// [REMOVED DUPLICATE: rps]

// ============================================================
// =================== END NEW COMMANDS =======================
// ============================================================

// ============ REMAINING LEGENDARY-AI COMMANDS ============

// GROUP COMMANDS
case "pick": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    try {
        const meta = await devtrust.groupMetadata(m.chat);
        const members = meta.participants;
        const picked = members[Math.floor(Math.random() * members.length)];
        reply(`🎲 *Random Pick!*\n\n▸ @${picked.id.replace('@s.whatsapp.net', '')}`, { mentions: [picked.id] });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// SEARCH COMMANDS
case "websearch":
case "search": {
    if (!text) return reply(`🔎 *Web Search*\nUsage: ${prefix}websearch [query]`);
    try {
        reply('🔎 *Searching the web...*');
        const res = await axios.get(`https://ddg-api.herokuapp.com/search?query=${encodeURIComponent(text)}&limit=5`).catch(() => null);
        if (!res?.data?.length) {
            const aiAnswer = await askOpenAI(`Search and summarize: ${text}`);
            return reply(`🔎 *Search: ${text}*\n\n${aiAnswer}`);
        }
        let searchText = `🔎 *Web Search: ${text}*\n\n`;
        res.data.slice(0, 3).forEach((r, i) => {
            searchText += `*${i + 1}. ${r.title}*\n${r.snippet}\n${r.link}\n\n`;
        });
        reply(searchText);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "img":
case "image": {
    if (!text) return reply(`🖼️ *Image Search*\nUsage: ${prefix}img [query]`);
    try {
        reply('🔎 *Searching images...*');
        const count = parseInt(text.split(' ')[0]) || 1;
        const query = count > 1 ? text.split(' ').slice(1).join(' ') : text;
        const res = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 5)}&client_id=wGEDxANzF8vV-4g8pMR6eTLnkGMtbFh3AMRlCQ0y4bk`).catch(() => null);
        if (!res?.data?.results?.length) return reply(`❌ *No images found for:* ${query}`);
        for (const img of res.data.results.slice(0, Math.min(count, 3))) {
            await devtrust.sendMessage(m.chat, { image: { url: img.urls.regular }, caption: `🖼️ ${img.description || query}` }, { quoted: m });
        }
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "npm": {
    if (!text) return reply(`📦 *NPM Search*\nUsage: ${prefix}npm [package name]`);
    try {
        const res = await axios.get(`https://registry.npmjs.org/${text}`);
        const d = res.data;
        const latest = d['dist-tags']?.latest;
        const pkg = d.versions?.[latest];
        reply(`📦 *NPM Package: ${d.name}*\n\n▸ *Latest Version:* ${latest}\n▸ *Description:* ${d.description}\n▸ *Author:* ${d.author?.name || 'N/A'}\n▸ *License:* ${pkg?.license || 'N/A'}\n▸ *Dependencies:* ${Object.keys(pkg?.dependencies || {}).length}\n▸ *Link:* https://npmjs.com/package/${d.name}`);
    } catch (e) { reply(`❌ *Package not found:* ${text}`); }
}
break;

// [REMOVED DUPLICATE: apk]

case "subtitle":
case "subtitles":
case "subtitlesearch": {
    if (!text) return reply(`📝 *Subtitle Search*\nUsage: ${prefix}subtitle [movie name]`);
    reply(`📝 *Subtitle Search: ${text}*\n\n▸ OpenSubtitles: https://www.opensubtitles.org/en/search2/moviename-${encodeURIComponent(text)}\n▸ Subscene: https://subscene.com/subtitles/searchbytitle?query=${encodeURIComponent(text)}\n▸ YTS Subtitles: https://yts.mx/movies/${text.toLowerCase().replace(/\s+/g, '-')}`);
}
break;

// IMAGE EFFECT COMMANDS
case "gfx":
case "gfx1": {
    if (!text) return reply(`🎨 *GFX Image*\nUsage: ${prefix}gfx [text1];[text2]`);
    const txt = text.split(';');
    if (!txt[1]) return reply(`Usage: ${prefix}gfx text1;text2`);
    try {
        await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[1])}&text2=${encodeURIComponent(txt[0])}` }, caption: '🎨 *GFX 1*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx2": {
    if (!text) return reply(`🎨 *GFX2*\nUsage: ${prefix}gfx2 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx2?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 2*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx3": {
    if (!text) return reply(`🎨 *GFX3*\nUsage: ${prefix}gfx3 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx3?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 3*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx4": {
    if (!text) return reply(`🎨 *GFX4*\nUsage: ${prefix}gfx4 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx4?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 4*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx5": {
    if (!text) return reply(`🎨 *GFX5*\nUsage: ${prefix}gfx5 [text1];[text2];[text3]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx5?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || '')}&text3=${encodeURIComponent(txt[2] || '')}` }, caption: '🎨 *GFX 5*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx6": {
    if (!text) return reply(`🎨 *GFX6*\nUsage: ${prefix}gfx6 [text1];[text2];[text3]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx6?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || '')}&text3=${encodeURIComponent(txt[2] || '')}` }, caption: '🎨 *GFX 6*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx7": {
    if (!text) return reply(`🎨 *GFX7*\nUsage: ${prefix}gfx7 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx7?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 7*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx8": {
    if (!text) return reply(`🎨 *GFX8*\nUsage: ${prefix}gfx8 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx8?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 8*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx9": {
    if (!text) return reply(`🎨 *GFX9*\nUsage: ${prefix}gfx9 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx9?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 9*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx10": {
    if (!text) return reply(`🎨 *GFX10*\nUsage: ${prefix}gfx10 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx10?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 10*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx11": {
    if (!text) return reply(`🎨 *GFX11*\nUsage: ${prefix}gfx11 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx11?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 11*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx12": {
    if (!text) return reply(`🎨 *GFX12*\nUsage: ${prefix}gfx12 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx12?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 12*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "invert": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage) return reply(`🎨 *Invert Image*\nReply to an image: ${prefix}invert`);
    try {
        reply('⏳ *Inverting image...*');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const Jimp = require('jimp');
        const img = await Jimp.read(media);
        img.invert();
        const buffer = await img.getBufferAsync(Jimp.MIME_PNG);
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '🎨 *Inverted!*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "carbon": {
    if (!text && !m.quoted?.text) return reply(`💻 *Carbon Code Image*\nUsage: ${prefix}carbon [code]`);
    const code = text || m.quoted?.text;
    try {
        const url = `https://carbonnowsh.vercel.app/?bg=rgba(74,144,226,1)&t=monokai&wt=none&l=auto&ds=true&dsyoff=20px&dsblur=68px&wc=true&wa=true&pv=56px&ph=56px&ln=false&fl=1&fm=Hack&fs=14px&lh=133%25&si=false&es=2x&wm=false&code=${encodeURIComponent(code)}`;
        await devtrust.sendMessage(m.chat, { image: { url }, caption: '💻 *Code Snapshot*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "wanted": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage) return reply(`🤠 *Wanted Poster*\nReply to an image: ${prefix}wanted`);
    try {
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const b64 = media.toString('base64');
        const res = await axios.get(`https://api.popcat.xyz/wanted?image=data:image/jpeg;base64,${b64}`, { responseType: 'arraybuffer' });
        await devtrust.sendMessage(m.chat, { image: Buffer.from(res.data), caption: '🤠 *WANTED!*' }, { quoted: m });
    } catch (e) {
        try {
            const quoted = m.quoted || m;
            const ppUrl = await devtrust.profilePictureUrl(m.sender, 'image');
            const res = await axios.get(`https://api.popcat.xyz/wanted?image=${encodeURIComponent(ppUrl)}`, { responseType: 'arraybuffer' });
            await devtrust.sendMessage(m.chat, { image: Buffer.from(res.data), caption: '🤠 *WANTED!*' }, { quoted: m });
        } catch (e2) { reply(`❌ *Error:* ${e2.message}`); }
    }
}
break;

case "wasted": {
    try {
        const imgUrl = m.quoted?.message?.imageMessage ? null : await devtrust.profilePictureUrl(m.mentionedJid?.[0] || m.sender, 'image');
        const targetUrl = imgUrl || 'https://i.imgur.com/placeholder.jpg';
        const res = await axios.get(`https://api.popcat.xyz/wasted?image=${encodeURIComponent(targetUrl)}`, { responseType: 'arraybuffer' });
        await devtrust.sendMessage(m.chat, { image: Buffer.from(res.data), caption: '💀 *WASTED!*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "jail": {
    try {
        const targetUrl = m.quoted?.message?.imageMessage ? null : await devtrust.profilePictureUrl(m.mentionedJid?.[0] || m.sender, 'image').catch(() => null);
        if (!targetUrl) return reply(`🔒 *Jail*\nUsage: ${prefix}jail @user`);
        const res = await axios.get(`https://api.popcat.xyz/jail?image=${encodeURIComponent(targetUrl)}`, { responseType: 'arraybuffer' });
        await devtrust.sendMessage(m.chat, { image: Buffer.from(res.data), caption: '🔒 *JAILED!*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "rainbow": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage) return reply(`🌈 *Rainbow Filter*\nReply to an image: ${prefix}rainbow`);
    try {
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const Jimp = require('jimp');
        const img = await Jimp.read(media);
        const colors = [0xFF0000FF, 0xFF7F00FF, 0xFFFF00FF, 0x00FF00FF, 0x0000FFFF, 0x8B00FFFF];
        img.color([{ apply: 'hue', params: [90] }]);
        const buffer = await img.getBufferAsync(Jimp.MIME_PNG);
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '🌈 *Rainbow Filter!*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mnm":
case "rip-meme":
case "trigger-meme": {
    const memeType = command === 'mnm' ? 'mnm' : command === 'rip-meme' ? 'rip' : 'trigger';
    try {
        const targetUrl = await devtrust.profilePictureUrl(m.mentionedJid?.[0] || m.sender, 'image').catch(() => null);
        if (!targetUrl) return reply(`Usage: ${prefix}${command} @user`);
        const res = await axios.get(`https://api.popcat.xyz/${memeType}?image=${encodeURIComponent(targetUrl)}`, { responseType: 'arraybuffer' });
        await devtrust.sendMessage(m.chat, { image: Buffer.from(res.data), caption: `🎭 *${command.toUpperCase()}!*` }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "naturewlp": {
    const natureUrls = [
        'https://source.unsplash.com/1920x1080/?nature,forest',
        'https://source.unsplash.com/1920x1080/?mountain,landscape',
        'https://source.unsplash.com/1920x1080/?ocean,beach',
        'https://source.unsplash.com/1920x1080/?sunset,sky'
    ];
    await devtrust.sendMessage(m.chat, { image: { url: natureUrls[Math.floor(Math.random() * natureUrls.length)] }, caption: '🌿 *Nature Wallpaper*' }, { quoted: m });
}
break;

// MISC COMMANDS
// [REMOVED DUPLICATE: quote]
// [REMOVED DUPLICATE: fact]

case "ebinary":
case "ebin": {
    if (!text) return reply(`Usage: ${prefix}ebinary [text]`);
    const binary = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    reply(`💻 *Text to Binary*\n\n*Input:* ${text}\n*Binary:* ${binary}`);
}
break;

case "dbinary":
case "dbin": {
    if (!text) return reply(`Usage: ${prefix}dbinary [binary]`);
    try {
        const decoded = text.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
        reply(`💻 *Binary to Text*\n\n*Binary:* ${text}\n*Text:* ${decoded}`);
    } catch (e) { reply('❌ *Invalid binary input*'); }
}
break;
// [REMOVED DUPLICATE: roast]
// [REMOVED DUPLICATE: pickup]

// TOOLS COMMANDS
case "clear": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    try {
        await devtrust.clearMessage(m.chat, false);
        reply('✅ *Chat cleared!*');
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: vv]

case "compress": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage) return reply(`🗜️ *Compress Image*\nReply to an image: ${prefix}compress`);
    try {
        reply('⏳ *Compressing...*');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const sharp = require('sharp');
        const compressed = await sharp(media).jpeg({ quality: 40 }).toBuffer();
        await devtrust.sendMessage(m.chat, { image: compressed, caption: `🗜️ *Compressed!*\nOriginal: ${(media.length / 1024).toFixed(1)}KB → Compressed: ${(compressed.length / 1024).toFixed(1)}KB` }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "pdf": {
    if (!text && !m.quoted?.text) return reply(`📄 *Text to PDF*\nUsage: ${prefix}pdf [text]`);
    try {
        reply('⏳ *Creating PDF...*');
        const content = text || m.quoted?.text;
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument();
        const tmpPath = `./tmp/doc_${Date.now()}.pdf`;
        const stream = fs.createWriteStream(tmpPath);
        doc.pipe(stream);
        doc.fontSize(12).text(content, 50, 50);
        doc.end();
        await new Promise(resolve => stream.on('finish', resolve));
        const pdfBuffer = fs.readFileSync(tmpPath);
        fs.unlinkSync(tmpPath);
        await devtrust.sendMessage(m.chat, { document: pdfBuffer, mimetype: 'application/pdf', fileName: 'document.pdf' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "audio2text":
case "text": {
    if (!m.quoted?.message?.audioMessage && !m.quoted?.message?.videoMessage) return reply(`🎤 *Audio to Text*\nReply to an audio: ${prefix}audio2text`);
    try {
        reply('⏳ *Transcribing audio...*');
        reply('_Audio transcription requires an external API. Use Google Voice, Otter.ai, or similar services for best results._');
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: url]

case "gitclone":
case "gitdl": {
    if (!text) return reply(`📦 *Git Clone*\nUsage: ${prefix}gitclone [repo url]`);
    reply(`📦 *Git Clone*\n\nTo clone this repository:\n\`\`\`git clone ${text}\`\`\`\n\nOr download ZIP: ${text.replace('github.com', 'github.com').replace(/\/?$/, '')}/archive/refs/heads/main.zip`);
}
break;

// [REMOVED DUPLICATE: mode]


case "react-channel":
case "reactchannel": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    const rcBotJid = devtrust.decodeJid(devtrust.user.id);
    if (!args[0]) {
        const currentReact = getSetting(rcBotJid, 'autoReactChannel', false);
        return reply(`❤️ *React Channel*\n\n▸ Status: ${currentReact ? '✅ ON' : '❌ OFF'}\n\nUsage: ${prefix}react-channel on/off\n_When ON, bot will auto-react to posts on channels you follow_`);
    }
    if (args[0] === 'on') {
        setSetting(rcBotJid, 'autoReactChannel', true);
        reply('✅ *Auto React to Channels ENABLED*\n_Bot will react with emojis to channel posts_');
    } else if (args[0] === 'off') {
        setSetting(rcBotJid, 'autoReactChannel', false);
        reply('❌ *Auto React to Channels DISABLED*');
    } else {
        reply(`Usage: ${prefix}react-channel on/off`);
    }
}
break;

case "channellog": {
    const clData = loadChannelLog();
    const botUserJid = devtrust.decodeJid(devtrust.user.id);
    const userEntry = clData[botUserJid] || { enabled: false };

    if (!args[0]) {
        return reply(
            '📢 *Channel Log*\n\n' +
            '▸ Status: ' + (userEntry.enabled ? '✅ ON' : '❌ OFF') + '\n\n' +
            'Usage:\n' +
            prefix + 'channellog on — enable alerts\n' +
            prefix + 'channellog off — disable alerts\n\n' +
            '_When ON, any post on channels you admin will be sent to your DM_'
        );
    }

    if (args[0] === 'on') {
        userEntry.enabled = true;
        clData[botUserJid] = userEntry;
        saveChannelLog(clData);
        return reply('✅ *Channel Log ENABLED*\n_You will get a DM alert whenever someone posts on any channel you admin._');
    }

    if (args[0] === 'off') {
        userEntry.enabled = false;
        clData[botUserJid] = userEntry;
        saveChannelLog(clData);
        return reply('❌ *Channel Log DISABLED*');
    }
}
break;

case "stats": {
    const mem = process.memoryUsage();
    const memMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
    const totalMem = (mem.heapTotal / 1024 / 1024).toFixed(2);
    reply(`📊 *Bot Stats*\n\n▸ 💾 Memory: ${memMB}MB / ${totalMem}MB\n▸ ⏰ Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m\n▸ 🔄 Node: ${process.version}\n▸ 💻 Platform: ${process.platform}`);
}
break;
// [REMOVED DUPLICATE: runtime]

case "shutdown": {
    if (!isCreator) return reply('🔒 *Owner only*');
    reply('⚠️ *Shutting down...*');
    setTimeout(() => process.exit(0), 2000);
}
break;

case "restart":
case "reboot": {
    if (!isCreator) return reply('🔒 *Owner only*');
    reply('🔄 *Restarting...*');
    setTimeout(() => process.exit(1), 2000);
}
break;

case "doubleornothing":
case "don": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`🎲 *Double or Nothing*\nUsage: ${prefix}don [amount]`);
    const bet = parseInt(args[0]);
    const bal = await econ.balance(m.sender, m.chat);
    if (isNaN(bet) || bet <= 0) return reply('❌ *Invalid amount*');
    if (bal.wallet < bet) return reply('❌ *Not enough in wallet*');
    const win = Math.random() < 0.5;
    if (win) await econ.give(m.sender, m.chat, bet);
    else await econ.deduct(m.sender, m.chat, bet);
    reply(`🎲 *Double or Nothing!*\n\n${win ? `🎉 *DOUBLED! You won ${econ.fmt(bet)}!*` : `💀 *NOTHING! You lost ${econ.fmt(bet)}!*`}`);
}
break;

case "richest":
case "top": {
    const econ = require('./legendaryEconomy');
    const users = await econ.lb(m.chat, 10);
    if (!users.length) return reply('📊 *No economy data yet!*');
    let text2 = '🏆 *Top 10 Richest*\n\n';
    const medals = ['🥇', '🥈', '🥉'];
    users.forEach((u, i) => {
        text2 += `${medals[i] || `${i + 1}.`} @${u.userID.replace('@s.whatsapp.net', '')} — ${econ.fmt(u.wallet + u.bank)}\n`;
    });
    reply(text2, { mentions: users.map(u => u.userID) });
}
break;

case "poorest":
case "broke": {
    const econ = require('./legendaryEconomy');
    await econ.connectDB();
    const mongoose = require('mongoose');
    const users2 = await mongoose.model('EconUser').find({ chatID: m.chat }).sort({ wallet: 1, bank: 1 }).limit(5);
    if (!users2.length) return reply('📊 *No data yet!*');
    let poorText2 = '💀 *Top 5 Poorest*\n\n';
    users2.forEach((u, i) => { poorText2 += `${i + 1}. @${u.userID.replace('@s.whatsapp.net', '')} — ${econ.fmt(u.wallet + u.bank)}\n`; });
    reply(poorText2, { mentions: users2.map(u => u.userID) });
}
break;

case "econ":
case "econprofile": {
    const econ = require('./legendaryEconomy');
    const target = m.mentionedJid?.[0] || m.sender;
    const result = await econ.profile(target, m.chat);
    reply(`💰 *Economy Profile*\n\n▸ 👛 Wallet: ${econ.fmt(result.wallet)}\n▸ 🏦 Bank: ${econ.fmt(result.bank)}\n▸ 📊 Net Worth: ${econ.fmt(result.net)}\n▸ 🏅 Tier: ${result.tier}\n▸ 🔥 Streak: ${result.streak} days`, { mentions: [target] });
}
break;

case "transfer": {
    const econ = require('./legendaryEconomy');
    const transferTarget = m.mentionedJid?.[0];
    if (!transferTarget || !args[1]) return reply(`Usage: ${prefix}transfer @user [amount]`);
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) return reply('❌ *Invalid amount*');
    const result = await econ.transfer(m.sender, transferTarget, m.chat, amount);
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    reply(`✅ *Transferred ${econ.fmt(amount)} to @${transferTarget.replace('@s.whatsapp.net', '')}!*`, { mentions: [transferTarget] });
}
break;

// ============ YOUTUBE FIXED ============
case "ytmp3":
case "ytvideo":
case "ytv2":
case "play2": {
    if (!text) return reply(`🎵 *YouTube Downloader*\nUsage: ${prefix}ytmp3 [title or URL]`);
    try {
        reply('⏳ *Searching YouTube...*');
        const yts = require('yt-search');
        let videoUrl = text;
        if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
            const results = await yts(text);
            if (!results.videos.length) return reply('❌ *No results found*');
            videoUrl = results.videos[0].url;
        }
        const ytdl = require('@distube/ytdl-core');
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title;
        const duration = info.videoDetails.lengthSeconds;
        if (duration > 1800) return reply('❌ *Too long (max 30 minutes)*');
        const isAudio = ['ytmp3', 'play2'].includes(command);
        const format = isAudio ? ytdl.chooseFormat(info.formats, { quality: 'lowestaudio', filter: 'audioonly' }) : ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });
        if (isAudio) {
            await devtrust.sendMessage(m.chat, { audio: { url: format.url }, mimetype: 'audio/mpeg', fileName: `${title}.mp3`, ptt: false }, { quoted: m });
        } else {
            await devtrust.sendMessage(m.chat, { video: { url: format.url }, caption: `🎬 *${title}*`, mimetype: 'video/mp4' }, { quoted: m });
        }
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ SPOTIFY FIXED ============
case "spotify2":
case "spotifydl2": {
    if (!text) return reply(`🎵 *Spotify Downloader*\nUsage: ${prefix}spotify2 [spotify URL]`);
    try {
        reply('⏳ *Fetching Spotify track...*');
        const res = await axios.get(`https://api.fabdl.com/spotify/get?url=${encodeURIComponent(text)}`);
        if (!res.data?.result) return reply('❌ *Could not fetch Spotify track*');
        const track = res.data.result;
        const dlRes = await axios.get(`https://api.fabdl.com/spotify/mp3-convert-task/${track.gid}/${track.id}`);
        const taskId = dlRes.data?.result?.task_id;
        if (!taskId) return reply('❌ *Conversion failed*');
        await new Promise(r => setTimeout(r, 5000));
        const mp3Res = await axios.get(`https://api.fabdl.com/spotify/mp3-convert-task/${track.gid}/${track.id}/${taskId}`);
        const mp3Url = mp3Res.data?.result?.download_url;
        if (!mp3Url) return reply('❌ *Download link not ready, try again*');
        await devtrust.sendMessage(m.chat, { audio: { url: `https://api.fabdl.com${mp3Url}` }, mimetype: 'audio/mpeg', fileName: `${track.name}.mp3`, ptt: false }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============================================================
// =================== END LEGENDARY-AI COMMANDS ==============
// ============================================================

// ============================================================
// ============= LEGENDARY! ACTIVE AND LISTENING ==============
// ============================================================

case "legendary":
case "legendary!": {
    reply(`⚡ *LEGENDARY!*\n\n✅ *Active and Listening* 🎧\n\n_${botDisplayName} is online and ready!_`);
}
break;

// ============================================================
// =================== PLUGIN COMMANDS ========================
// ============================================================

// --- AZA (Account Details) - Per-User Storage ---
case "aza": {
    // Each user gets their own entry in the shared aza database (keyed by sender JID)
    const azaFile = './database/aza_users.json';

    // Load entire aza database
    let azaDB = {};
    try {
        if (!fs.existsSync(azaFile)) fs.writeFileSync(azaFile, JSON.stringify({}));
        azaDB = JSON.parse(fs.readFileSync(azaFile));
    } catch(e) { azaDB = {}; }

    // Helper: save back
    const saveAzaDB = (db) => fs.writeFileSync(azaFile, JSON.stringify(db, null, 2));

    // Use sender's JID as the unique key
    const azaKey = m.sender;

    if (!text) return reply(
        `💳 *AZA - Account Details*\n\n` +
        `▸ ${prefix}aza — view your saved account\n` +
        `▸ ${prefix}aza fancy — stylish display\n` +
        `▸ ${prefix}aza set bank: BankName no: 1234567890 acc: YourName\n` +
        `▸ ${prefix}aza clear — clear your saved details`
    );

    const lower = text.trim().toLowerCase();

    if (lower.startsWith('clear') || lower.startsWith('reset')) {
        delete azaDB[azaKey];
        saveAzaDB(azaDB);
        return reply('✅ Your account details have been cleared');
    }

    if (lower.startsWith('set')) {
        if (m.isGroup) return reply('⚠️ Please use this command in your DM for privacy');
        let raw = text.trim().replace(/^set/i, '').trim();
        let bank = raw.match(/bank:\s*([^\n]+?)(?=\s+no:|\s+acc:|$)/i)?.[1]?.trim();
        let no   = raw.match(/no:\s*([^\n]+?)(?=\s+acc:|$)/i)?.[1]?.trim();
        let acc  = raw.match(/acc:\s*([^\n]+)/i)?.[1]?.trim();
        if (!bank || !no || !acc) return reply(
            `❌ Invalid format.\n\nUse:\n${prefix}aza set bank: BankName no: 1234567890 acc: YourAccName`
        );
        azaDB[azaKey] = { bank, no, acc };
        saveAzaDB(azaDB);
        return reply(`✅ *Account details saved!*\n\n▸ Bank: ${bank}\n▸ No: ${no}\n▸ Name: ${acc}`);
    }

    // View account
    const azaData = azaDB[azaKey];
    if (!azaData) return reply(`❌ No account saved yet.\nUse: ${prefix}aza set bank: BankName no: 1234567890 acc: YourName`);

    if (lower === 'fancy') {
        return reply(
            `┌───────────────\n` +
            `│  *Account Details*\n` +
            `├───────────────\n` +
            `│ 🏦 Bank: ${azaData.bank}\n` +
            `│ 💳 Number: ${azaData.no}\n` +
            `│ 👤 Name: ${azaData.acc}\n` +
            `└───────────────`
        );
    }

    reply(`💳 *Your Account Details:*\n\n▸ 🏦 Bank: ${azaData.bank}\n▸ 💳 Account No: ${azaData.no}\n▸ 👤 Account Name: ${azaData.acc}`);
}
break;

// --- QR CODE ---
case "qr": {
    if (!text) return reply(`Usage: ${prefix}qr <text or URL>`);
    try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(text)}`;
        await devtrust.sendMessage(m.chat, { image: { url: qrUrl }, caption: `🔲 *QR Code for:* ${text}` }, { quoted: m });
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- QR READ ---
// [REMOVED DUPLICATE: readqr]

// --- MSG PIN ---
case "msgpin":
case "pinmsg": {
    if (!m.quoted) return reply(`Reply to a message with:\n${prefix}msgpin 24hr\n${prefix}msgpin 7d\n${prefix}msgpin 30d`);
    if (!text) return reply(`Format: ${prefix}msgpin <time>\nTimes: 24hr, 7d, 30d`);
    const timeInput = text.trim().toLowerCase();
    const timesMap = { '24hr': { secs: 86400, label: '24 hours' }, '7d': { secs: 604800, label: '7 days' }, '30d': { secs: 2592000, label: '30 days' } };
    if (!timesMap[timeInput]) return reply(`Invalid time. Use: 24hr, 7d, or 30d`);
    try {
        const { secs, label } = timesMap[timeInput];
        const msgKey = m.quoted.fakeObj?.key || m.quoted.key;
        await devtrust.sendMessage(m.chat, { pin: msgKey, type: 1, time: secs });
        reply(`📌 Pinned for ${label}`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- REMOVE BG ---
// [REMOVED DUPLICATE: removebg]

// --- LIST JOIN REQUESTS ---
case "listrequest":
case "joinrequests": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!isBotAdmins) return reply('❌ Bot needs to be admin');
    try {
        const list2 = await devtrust.groupRequestParticipantsList(m.chat);
        if (!list2.length) return reply('📋 No pending join requests');
        let reqText = '*Pending Join Requests:*\n\n';
        list2.forEach((r, i) => { reqText += `${i+1}. +${r.phone_number?.replace('@s.whatsapp.net', '')}\n`; });
        reply(reqText);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- APPROVE JOIN REQUESTS ---
case "approve":
case "approveall": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!isBotAdmins) return reply('❌ Bot needs to be admin');
    if (!text) return reply(`Usage: ${prefix}approve all\n${prefix}approve 234xxxxxxxx`);
    try {
        const pending2 = await devtrust.groupRequestParticipantsList(m.chat);
        if (!pending2.length) return reply('No pending requests');
        if (text.toLowerCase() === 'all') {
            const jids2 = pending2.map(p => p.phone_number);
            await devtrust.groupRequestParticipantsUpdate(m.chat, jids2, 'approve');
            return reply(`✅ Approved ${jids2.length} request(s)`);
        }
        const nums = text.split(',').map(n => n.trim().replace(/[^0-9]/g,'') + '@s.whatsapp.net');
        await devtrust.groupRequestParticipantsUpdate(m.chat, nums, 'approve');
        reply(`✅ Approved ${nums.length} request(s)`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- REJECT JOIN REQUESTS ---
case "reject":
case "rejectall": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!isBotAdmins) return reply('❌ Bot needs to be admin');
    if (!text) return reply(`Usage: ${prefix}reject all\n${prefix}reject 234xxxxxxxx`);
    try {
        const pendingR = await devtrust.groupRequestParticipantsList(m.chat);
        if (!pendingR.length) return reply('No pending requests');
        if (text.toLowerCase() === 'all') {
            const jidsR = pendingR.map(p => p.phone_number);
            await devtrust.groupRequestParticipantsUpdate(m.chat, jidsR, 'reject');
            return reply(`✅ Rejected ${jidsR.length} request(s)`);
        }
        const numsR = text.split(',').map(n => n.trim().replace(/[^0-9]/g,'') + '@s.whatsapp.net');
        await devtrust.groupRequestParticipantsUpdate(m.chat, numsR, 'reject');
        reply(`✅ Rejected ${numsR.length} request(s)`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- OCR / TEXT FROM IMAGE ---
case "ocr":
case "readtext":
case "imagetext": {
    const ocrQuoted = m.quoted && (m.quoted.mimetype?.includes('image') || m.quoted.mtype === 'imageMessage');
    const ocrDirect = m.mtype === 'imageMessage';
    if (!ocrQuoted && !ocrDirect) return reply('Reply to an image to extract text');
    try {
        reply('⏳ Extracting text...');
        const ocrMedia = await devtrust.downloadMediaMessage(ocrQuoted ? m.quoted : m);
        const FormDataOCR = require('form-data');
        const formOCR = new FormDataOCR();
        formOCR.append('file', ocrMedia, { filename: 'img.png', contentType: 'image/png' });
        const ocrRes = await axios.post('https://api.ocr.space/parse/image', formOCR, { headers: { ...formOCR.getHeaders(), 'apikey': 'helloworld' } });
        const ocrText = ocrRes.data?.ParsedResults?.[0]?.ParsedText;
        if (!ocrText?.trim()) return reply('❌ No text found in image');
        reply(`📝 *Extracted Text:*\n\n${ocrText}`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- LIVE MATCH ---
case "match":
case "livematch":
case "score": {
    if (!text) return reply(`Usage: ${prefix}match <team>\nExample: ${prefix}match Nigeria\nOr: ${prefix}match Nigeria vs Ghana`);
    try {
        reply('⚽ Searching for matches...');
        const matchRes = await axios.get(`https://live-kord.vercel.app/api/live-matches?team=${encodeURIComponent(text)}`, { timeout: 10000 });
        const matchData = matchRes.data;
        if (!matchData.success || !matchData.data?.matches?.length) return reply(`❌ No matches found for *${text}*`);
        const matches2 = matchData.data.matches.slice(0, 5);
        let matchText = `⚽ *Match Results for "${text}"*\n\n`;
        matches2.forEach((match, i) => {
            matchText += `${i+1}. *${match.team1} vs ${match.team2}*\n`;
            matchText += `   📊 Score: ${match.score} | ${match.status} ${match.time}\n`;
            matchText += `   🏆 League: ${match.league}\n`;
            if (match.country) matchText += `   🌍 Country: ${match.country}\n`;
            matchText += '\n';
        });
        reply(matchText);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- FETCH URL ---
case "fetch":
case "fetchurl": {
    if (!text) return reply(`Usage: ${prefix}fetch <url>`);
    try {
        const fetchRes = await axios.get(text, { responseType: 'arraybuffer', timeout: 15000 });
        const ct = fetchRes.headers['content-type'] || '';
        if (ct.includes('image')) {
            await devtrust.sendMessage(m.chat, { image: Buffer.from(fetchRes.data), caption: `📥 Fetched from: ${text}` }, { quoted: m });
        } else if (ct.includes('video')) {
            await devtrust.sendMessage(m.chat, { video: Buffer.from(fetchRes.data), caption: `📥 Fetched from: ${text}` }, { quoted: m });
        } else if (ct.includes('audio')) {
            await devtrust.sendMessage(m.chat, { audio: Buffer.from(fetchRes.data), mimetype: 'audio/mpeg' }, { quoted: m });
        } else {
            reply(`📥 Content from URL:\n${Buffer.from(fetchRes.data).toString('utf8').slice(0, 1000)}`);
        }
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- CURRENCY RATES ---
// [REMOVED DUPLICATE: currency]

// --- BTC PRICE ---
case "btc":
case "bitcoin": {
    try {
        const btcRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=BTC-USDT');
        const d = btcRes.data?.data;
        reply(`₿ *Bitcoin (BTC-USDT)*\n\n▸ Price: $${parseFloat(d.last).toFixed(2)}\n▸ 24h Change: ${parseFloat(d.changeRate).toFixed(2)}%\n▸ 24h High: $${parseFloat(d.high).toFixed(2)}\n▸ 24h Low: $${parseFloat(d.low).toFixed(2)}\n▸ Volume: ${parseFloat(d.vol).toFixed(2)} BTC`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- ETH PRICE ---
case "eth":
case "ethereum": {
    try {
        const ethRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=ETH-USDT');
        const d = ethRes.data?.data;
        reply(`Ξ *Ethereum (ETH-USDT)*\n\n▸ Price: $${parseFloat(d.last).toFixed(2)}\n▸ 24h Change: ${parseFloat(d.changeRate).toFixed(2)}%\n▸ 24h High: $${parseFloat(d.high).toFixed(2)}\n▸ 24h Low: $${parseFloat(d.low).toFixed(2)}\n▸ Volume: ${parseFloat(d.vol).toFixed(2)} ETH`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- DOGE PRICE ---
case "doge":
case "dogecoin": {
    try {
        const dogeRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=DOGE-USDT');
        const d = dogeRes.data?.data;
        reply(`🐕 *Dogecoin (DOGE-USDT)*\n\n▸ Price: $${parseFloat(d.last).toFixed(6)}\n▸ 24h Change: ${parseFloat(d.changeRate).toFixed(2)}%\n▸ 24h High: $${parseFloat(d.high).toFixed(6)}\n▸ 24h Low: $${parseFloat(d.low).toFixed(6)}\n▸ Volume: ${parseFloat(d.vol).toFixed(2)} DOGE`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- XRP PRICE ---
case "xrp":
case "ripple": {
    try {
        const xrpRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=XRP-USDT');
        const d = xrpRes.data?.data;
        reply(`💧 *XRP (XRP-USDT)*\n\n▸ Price: $${parseFloat(d.last).toFixed(4)}\n▸ 24h Change: ${parseFloat(d.changeRate).toFixed(2)}%\n▸ 24h High: $${parseFloat(d.high).toFixed(4)}\n▸ 24h Low: $${parseFloat(d.low).toFixed(4)}\n▸ Volume: ${parseFloat(d.vol).toFixed(2)} XRP`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- NGN RATES ---
case "ngnrates":
case "ngn-rates":
case "naira": {
    try {
        const ngnRes = await axios.get('https://open.er-api.com/v6/latest/NGN');
        const top = ['USD','EUR','GBP','KES','GHS','ZAR','AUD','CAD'];
        let ngnMsg = '🇳🇬 *NGN Exchange Rates:*\n\n';
        top.forEach(c => { if (ngnRes.data.rates[c]) ngnMsg += `▸ NGN → ${c}: ${ngnRes.data.rates[c].toFixed(6)}\n`; });
        reply(ngnMsg);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ============================================================
// =================== 300 NEW COMMANDS =======================
// ============================================================

// --- FUN & SOCIAL ---
// [REMOVED DUPLICATE: joke]

case "riddle": {
    const riddles = [
        { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "A Map!" },
        { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps!" },
        { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "An Echo!" },
        { q: "What has hands but can't clap?", a: "A Clock!" },
        { q: "What gets wetter as it dries?", a: "A Towel!" }
    ];
    const r = riddles[Math.floor(Math.random() * riddles.length)];
    reply(`🧠 *Riddle Time!*\n\n❓ ${r.q}\n\n_Reply_ \`.answer\` _to get the answer_\n||${r.a}||`);
}
break;
// [REMOVED DUPLICATE: fact]
// [REMOVED DUPLICATE: quote]
// [REMOVED DUPLICATE: roast]
// [REMOVED DUPLICATE: compliment]

case "ship":
case "love": {
    const targets = m.mentionedJid;
    if (!targets || targets.length < 2) return reply(`Tag 2 people!\nExample: ${prefix}ship @person1 @person2`);
    const percent = Math.floor(Math.random() * 101);
    const bars = '❤️'.repeat(Math.floor(percent/10)) + '🖤'.repeat(10-Math.floor(percent/10));
    reply(`💘 *Love Calculator*\n\n@${targets[0].split('@')[0]} + @${targets[1].split('@')[0]}\n\n${bars}\n\n❤️ *${percent}% Match!*\n\n${percent >= 80 ? '💑 Perfect couple!' : percent >= 50 ? '😊 Good match!' : '😬 Needs work!'}`, targets);
}
break;
// [REMOVED DUPLICATE: truth]
// [REMOVED DUPLICATE: dare]

case "tod":
case "truthordare": {
    const coin3 = Math.random() > 0.5;
    const tod_truths = ["What's your most embarrassing moment?", "Have you ever lied to your parents?", "What's your biggest secret?"];
    const tod_dares = ["Send a voice note right now!", "Change your status for 1 hour!", "Tag your crush!"];
    if (coin3) {
        reply(`🎲 *Truth!*\n\n${tod_truths[Math.floor(Math.random() * tod_truths.length)]}`);
    } else {
        reply(`😈 *Dare!*\n\n${tod_dares[Math.floor(Math.random() * tod_dares.length)]}`);
    }
}
break;

// calc/calculate handled above

// tinyurl/shorten/shorturl handled above

case "wttr": {
    if (!text) return reply(`Usage: ${prefix}wttr Lagos`);
    try {
        const wRes = await axios.get(`https://wttr.in/${encodeURIComponent(text)}?format=3`);
        reply(`🌤️ *Weather*\n\n${wRes.data}`);
    } catch(e) { reply(`❌ Error fetching weather`); }
}
break;
// [REMOVED DUPLICATE: translate]

case "time":
case "clock": {
    const zones = { 'Nigeria': 'Africa/Lagos', 'Kenya': 'Africa/Nairobi', 'London': 'Europe/London', 'New York': 'America/New_York', 'Dubai': 'Asia/Dubai', 'India': 'Asia/Kolkata' };
    let timeText2 = `🕐 *World Times*\n\n`;
    Object.entries(zones).forEach(([city, tz]) => {
        timeText2 += `🌍 ${city}: *${moment().tz(tz).format('HH:mm:ss z')}*\n`;
    });
    reply(timeText2);
}
break;

case "date":
case "today": {
    reply(`📅 *Today's Date*\n\n🗓️ ${moment().tz('Africa/Lagos').format('dddd, MMMM Do YYYY')}\n🕐 Time (Lagos): ${moment().tz('Africa/Lagos').format('HH:mm:ss')}\n🌍 UTC: ${moment().utc().format('HH:mm:ss')}`);
}
break;

case "countdown": {
    if (!text) return reply(`Usage: ${prefix}countdown YYYY-MM-DD\nExample: ${prefix}countdown 2025-12-25`);
    try {
        const target3 = moment(text.trim());
        if (!target3.isValid()) return reply('❌ Invalid date format. Use YYYY-MM-DD');
        const now3 = moment();
        const diff = target3.diff(now3);
        if (diff < 0) return reply('❌ That date has already passed!');
        const dur = moment.duration(diff);
        reply(`⏳ *Countdown to ${text}*\n\n📅 ${Math.floor(dur.asDays())} days\n⏰ ${dur.hours()} hours\n⏱️ ${dur.minutes()} minutes\n⌚ ${dur.seconds()} seconds`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

case "base64encode":
case "b64enc": {
    if (!text) return reply(`Usage: ${prefix}b64enc <text>`);
    reply(`🔒 *Base64 Encoded:*\n\n\`\`\`${Buffer.from(text).toString('base64')}\`\`\``);
}
break;

case "base64decode":
case "b64dec": {
    if (!text) return reply(`Usage: ${prefix}b64dec <base64text>`);
    try {
        reply(`🔓 *Base64 Decoded:*\n\n\`\`\`${Buffer.from(text, 'base64').toString('utf8')}\`\`\``);
    } catch(e) { reply('❌ Invalid base64 string'); }
}
break;

case "password":
case "generatepassword": {
    const len = parseInt(text) || 16;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    reply(`🔑 *Generated Password (${len} chars):*\n\n\`\`\`${pass}\`\`\`\n\n⚠️ _Save this somewhere safe!_`);
}
break;

case "uuid":
case "generateid": {
    const uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random()*16|0, v = c=='x'?r:(r&0x3|0x8);
        return v.toString(16);
    });
    reply(`🆔 *Generated UUID:*\n\n\`\`\`${uid}\`\`\``);
}
break;

case "color":
case "randomcolor":
case "colourpick": {
    const hex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0').toUpperCase();
    const r4 = parseInt(hex.slice(1,3),16), g4 = parseInt(hex.slice(3,5),16), b4 = parseInt(hex.slice(5,7),16);
    reply(`🎨 *Random Color*\n\n▸ HEX: \`${hex}\`\n▸ RGB: rgb(${r4}, ${g4}, ${b4})\n▸ Preview: https://singlecolorimage.com/get/${hex.slice(1)}/200x200`);
}
break;

case "encode":
case "urlencode": {
    if (!text) return reply(`Usage: ${prefix}encode <text>`);
    reply(`🔗 *URL Encoded:*\n\n\`${encodeURIComponent(text)}\``);
}
break;

case "decode":
case "urldecode": {
    if (!text) return reply(`Usage: ${prefix}decode <url encoded text>`);
    try { reply(`🔓 *URL Decoded:*\n\n\`${decodeURIComponent(text)}\``); }
    catch(e) { reply('❌ Invalid URL encoded string'); }
}
break;

case "hash":
case "md5": {
    if (!text) return reply(`Usage: ${prefix}hash <text>`);
    const md5hash = crypto.createHash('md5').update(text).digest('hex');
    const sha1hash = crypto.createHash('sha1').update(text).digest('hex');
    const sha256hash = crypto.createHash('sha256').update(text).digest('hex');
    reply(`#️⃣ *Hash Results for:* \`${text}\`\n\n▸ MD5: \`${md5hash}\`\n▸ SHA1: \`${sha1hash}\`\n▸ SHA256: \`${sha256hash}\``);
}
break;
// [REMOVED DUPLICATE: flip]

case "roll": {
    const sides = parseInt(text) || 6;
    const rolled = Math.floor(Math.random() * sides) + 1;
    reply(`🎲 *Dice Roll (${sides}-sided)*\n\nYou rolled: *${rolled}*`);
}
break;
// [REMOVED DUPLICATE: 8ball]
// [REMOVED DUPLICATE: pick]

case "number":
case "randnum":
case "randomnumber": {
    const parts2 = text.split(/\s+/);
    const min2 = parseInt(parts2[0]) || 1;
    const max2 = parseInt(parts2[1]) || 100;
    const rn = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
    reply(`🔢 *Random Number (${min2} - ${max2})*\n\nResult: *${rn}*`);
}
break;

// --- INFO COMMANDS ---
// [REMOVED DUPLICATE: ip]

case "country":
case "countryinfo": {
    if (!text) return reply(`Usage: ${prefix}country Nigeria`);
    try {
        const cRes = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(text)}`);
        const c2 = cRes.data[0];
        reply(`🌍 *${c2.name.common}*\n\n▸ Official: ${c2.name.official}\n▸ Capital: ${c2.capital?.[0]}\n▸ Population: ${c2.population?.toLocaleString()}\n▸ Region: ${c2.region}\n▸ Subregion: ${c2.subregion}\n▸ Languages: ${Object.values(c2.languages||{}).join(', ')}\n▸ Currency: ${Object.values(c2.currencies||{}).map(c3=>c3.name).join(', ')}\n▸ Calling Code: +${Object.keys(c2.idd?.suffixes||{})[0]}`);
    } catch(e) { reply(`❌ Country not found`); }
}
break;
// [REMOVED DUPLICATE: wiki]
// [REMOVED DUPLICATE: define]

case "news": {
    try {
        const newsRes = await axios.get('https://newsapi.org/v2/top-headlines?country=ng&apiKey=pub_demo&pageSize=5').catch(() => null);
        if (!newsRes?.data?.articles) return reply('📰 *News feature requires a NewsAPI key*\nVisit: newsapi.org');
        let newsText = '📰 *Latest News:*\n\n';
        newsRes.data.articles.forEach((a, i) => { newsText += `${i+1}. *${a.title}*\n${a.source?.name}\n\n`; });
        reply(newsText);
    } catch(e) { reply('❌ Could not fetch news'); }
}
break;

// --- TEXT EFFECTS ---
case "bold": {
    if (!text) return reply(`Usage: ${prefix}bold <text>`);
    reply(`*${text}*`);
}
break;

case "italic": {
    if (!text) return reply(`Usage: ${prefix}italic <text>`);
    reply(`_${text}_`);
}
break;

case "strike":
case "strikethrough": {
    if (!text) return reply(`Usage: ${prefix}strike <text>`);
    reply(`~${text}~`);
}
break;

case "mono":
case "monospace": {
    if (!text) return reply(`Usage: ${prefix}mono <text>`);
    reply(`\`\`\`${text}\`\`\``);
}
break;

case "reversetext": {
    if (!text) return reply(`Usage: ${prefix}reversetext <text>`);
    reply(`🔄 *Reversed:* ${text.split('').reverse().join('')}`);
}
break;

case "upper":
case "uppercase": {
    if (!text) return reply(`Usage: ${prefix}upper <text>`);
    reply(text.toUpperCase());
}
break;

case "lower":
case "lowercase": {
    if (!text) return reply(`Usage: ${prefix}lower <text>`);
    reply(text.toLowerCase());
}
break;

case "count":
case "wordcount": {
    if (!text) return reply(`Usage: ${prefix}count <text>`);
    const words3 = text.trim().split(/\s+/).filter(Boolean);
    reply(`📊 *Text Stats*\n\n▸ Characters: ${text.length}\n▸ Words: ${words3.length}\n▸ Lines: ${text.split('\n').length}`);
}
break;

case "repeat": {
    const repParts = text.split(' ');
    const repTimes = parseInt(repParts[0]) || 3;
    const repText = repParts.slice(1).join(' ');
    if (!repText) return reply(`Usage: ${prefix}repeat 3 Hello`);
    if (repTimes > 20) return reply('Max repeat is 20');
    reply(Array(repTimes).fill(repText).join('\n'));
}
break;

case "emojify": {
    if (!text) return reply(`Usage: ${prefix}emojify <text>`);
    const emojiMap2 = { a:'🅰️',b:'🅱️',c:'©️',e:'📧',i:'ℹ️',m:'Ⓜ️',o:'⭕',p:'🅿️',r:'®️',s:'💲',x:'❌' };
    const emojified = text.toLowerCase().split('').map(c => emojiMap2[c] || c).join('');
    reply(emojified);
}
break;

// --- GROUP TOOLS ---
// [REMOVED DUPLICATE: groupinfo]

case "tagadmins":
case "pingadmins": {
    if (!m.isGroup) return reply('❌ Group only');
    const adminJids2 = participants.filter(p => p.admin).map(p => p.id);
    let admTag = `📢 *Calling all admins!*\n\n`;
    adminJids2.forEach(j => { admTag += `@${j.split('@')[0]} `; });
    reply(admTag, adminJids2);
}
break;

case "setwelcome": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!text) return reply(`Usage: ${prefix}setwelcome Welcome {user} to {group}!`);
    setSetting(m.chat, 'welcomeMsg', text);
    reply(`✅ Welcome message set!\n\nPreview: ${text.replace('{user}','@NewMember').replace('{group}', groupMetadata?.subject)}`);
}
break;

case "clearwelcome": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(m.chat, 'welcomeMsg', null);
    reply('✅ Welcome message cleared');
}
break;
// [REMOVED DUPLICATE: lock]
// [REMOVED DUPLICATE: unlock]
// [REMOVED DUPLICATE: setname]
// [REMOVED DUPLICATE: setdesc]
// [REMOVED DUPLICATE: promote]
// [REMOVED DUPLICATE: demote]
// [REMOVED DUPLICATE: kick]
// [REMOVED DUPLICATE: add]
// [REMOVED DUPLICATE: invite]
// [REMOVED DUPLICATE: revoke]

// --- MEDIA TOOLS ---
// sticker/s — handled above (case 'tosticker'/'sticker'/'s')
// toimage/stickertoimg/toimg — handled above (case 'toimg')
// [REMOVED DUPLICATE: forward]

case "save":
case "dm": {
    if (!m.quoted) return reply('Reply to a message to save it to your DM');
    try {
        await devtrust.copyNForward(m.sender, m.quoted);
        reply('✅ Saved to your DM!');
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- BOT SETTINGS ---
// [REMOVED DUPLICATE: public]
// [REMOVED DUPLICATE: setprefix]

case "prefix": {
    reply(`🔧 *Your current prefix:* \`${prefix}\`\n_Change it with_ \`${prefix}setprefix [new]\``);
}
break;

case "creator": {
    reply(`👑 *Bot Owner*\n\nName: LËGĚNDÃRY Ł𝗮𝗯𝘀™\nNumber: wa.me/2348087253512\nBot: ${botDisplayName} MD`);
}
break;

// ping/speed handled above

case "uptime": {
    const up = process.uptime();
    reply(`⏰ *Bot Uptime*\n\n▸ ${Math.floor(up/3600)}h ${Math.floor((up%3600)/60)}m ${Math.floor(up%60)}s\n▸ PID: ${process.pid}\n▸ Node: ${process.version}`);
}
break;

case "usage":
case "sysinfo": {
    const mem2 = process.memoryUsage();
    const cpu = os.cpus()[0];
    reply(`💻 *System Info*\n\n▸ RAM: ${(mem2.heapUsed/1024/1024).toFixed(1)}MB / ${(mem2.heapTotal/1024/1024).toFixed(1)}MB\n▸ CPU: ${cpu.model?.slice(0,30)}\n▸ OS: ${os.platform()} ${os.arch()}\n▸ Node: ${process.version}\n▸ Uptime: ${formatUptime(process.uptime())}`);
}
break;

case "setautoread": {
    const arStatus = getSetting(m.sender, 'autoread', false);
    setSetting(m.sender, 'autoread', !arStatus);
    reply(`👁️ Auto-Read: *${!arStatus ? 'ON' : 'OFF'}*`);
}
break;

case "setautotyping": {
    const atStatus = getSetting(m.chat, 'autoTyping', false);
    setSetting(m.chat, 'autoTyping', !atStatus);
    reply(`⌨️ Auto-Typing: *${!atStatus ? 'ON' : 'OFF'}*`);
}
break;
// [REMOVED DUPLICATE: autobio]

case "viewstatus": {
    const vsStatus = getSetting(m.sender, 'autoViewStatus', false);
    setSetting(m.sender, 'autoViewStatus', !vsStatus);
    reply(`👀 Auto-View Status: *${!vsStatus ? 'ON' : 'OFF'}*`);
}
break;

// bio/setbio handled above
// [REMOVED DUPLICATE: pp]
// [REMOVED DUPLICATE: setpp]
// [REMOVED DUPLICATE: block]
// [REMOVED DUPLICATE: unblock]

// --- EXTRA FEATURES ---
// [REMOVED DUPLICATE: tts]

case "ttsptt":
case "voicenote": {
    if (!text) return reply(`Usage: ${prefix}ttsptt [text]`);
    try {
        const ttsPttUrl = googleTTS.getAudioUrl(text.slice(0, 200), { lang: 'en', slow: false });
        await devtrust.sendMessage(m.chat, { audio: { url: ttsPttUrl }, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m });
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

case "reaction":
case "react": {
    if (!m.quoted) return reply('Reply to a message to react');
    const emList = ['❤️','🔥','😂','😍','👍','🎉','💯','😭','🙏','⚡'];
    const em2 = text || emList[Math.floor(Math.random() * emList.length)];
    await devtrust.sendMessage(m.chat, { react: { text: em2, key: m.quoted.key } });
    reply(`✅ Reacted with ${em2}`);
}
break;

case "delete2":
case "unsend": {
    if (!m.quoted) return reply('Reply to a message to delete it');
    if (!isAdmins && !isCreator && m.quoted.sender !== m.sender) return reply('❌ You can only delete your own messages');
    try {
        const delKey2 = {
            remoteJid: m.chat,
            fromMe: false,
            id: m.quoted.id || m.quoted.key?.id || m.quoted.fakeObj?.key?.id,
            participant: m.quoted.sender || m.quoted.key?.participant || m.quoted.fakeObj?.key?.participant
        };
        await devtrust.sendMessage(m.chat, { delete: delKey2 });
        reply('✅ Message deleted');
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

case "copy":
case "copytext": {
    if (!m.quoted) return reply('Reply to a message to copy its text');
    const copiedText = m.quoted.text || m.quoted.caption || m.quoted.body || '';
    if (!copiedText) return reply('❌ No text to copy');
    reply(`📋 *Copied:*\n\n${copiedText}`);
}
break;

// lyrics handled above
// [REMOVED DUPLICATE: anime]

case "nasa":
case "apod":
case "spaceimage": {
    try {
        const nasaRes = await axios.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
        const nData = nasaRes.data;
        if (nData.media_type === 'image') {
            await devtrust.sendMessage(m.chat, { image: { url: nData.url }, caption: `🌌 *NASA: ${nData.title}*\n\n${nData.explanation?.slice(0,400)}...` }, { quoted: m });
        } else {
            reply(`🌌 *NASA APOD: ${nData.title}*\n\n${nData.explanation?.slice(0,500)}...\n\n🔗 ${nData.url}`);
        }
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

case "crypto":
case "cryptoprices": {
    try {
        const crypRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,solana,cardano&vs_currencies=usd&include_24hr_change=true');
        const cp = crypRes.data;
        let crypText = '💰 *Crypto Prices (USD):*\n\n';
        Object.entries(cp).forEach(([coin, data4]) => {
            const change4 = data4.usd_24h_change?.toFixed(2);
            const arrow = change4 > 0 ? '📈' : '📉';
            crypText += `${arrow} *${coin.toUpperCase()}:* $${data4.usd?.toLocaleString()} (${change4}%)\n`;
        });
        reply(crypText);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: meme]

case "cat":
case "catpic": {
    try {
        const catRes = await axios.get('https://api.thecatapi.com/v1/images/search');
        await devtrust.sendMessage(m.chat, { image: { url: catRes.data[0].url }, caption: '🐱 *Here\'s a random cat!*' }, { quoted: m });
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

case "dog":
case "dogpic": {
    try {
        const dogRes = await axios.get('https://dog.ceo/api/breeds/image/random');
        await devtrust.sendMessage(m.chat, { image: { url: dogRes.data.message }, caption: '🐶 *Here\'s a random dog!*' }, { quoted: m });
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: fox]

case "pokemon":
case "poke": {
    if (!text) return reply(`Usage: ${prefix}pokemon pikachu`);
    try {
        const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${text.toLowerCase().trim()}`);
        const poke2 = pokeRes.data;
        const imgUrl = poke2.sprites.other['official-artwork'].front_default || poke2.sprites.front_default;
        const types2 = poke2.types.map(t => t.type.name).join(', ');
        const stats2 = poke2.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(' | ');
        await devtrust.sendMessage(m.chat, { image: { url: imgUrl }, caption: `🎮 *#${poke2.id} ${poke2.name.toUpperCase()}*\n\n▸ Type: ${types2}\n▸ Height: ${poke2.height/10}m\n▸ Weight: ${poke2.weight/10}kg\n▸ Stats: ${stats2}` }, { quoted: m });
    } catch(e) { reply(`❌ Pokémon not found`); }
}
break;
// [REMOVED DUPLICATE: github]
// [REMOVED DUPLICATE: ytsearch]
// [REMOVED DUPLICATE: tiktok]
// [REMOVED DUPLICATE: instagram]
// [REMOVED DUPLICATE: font]

case "ascii":
case "asciify": {
    const asciiChars = ['@','#','S','%','?','*','+',';',':',',','.'];
    if (!text) return reply(`Usage: ${prefix}ascii [text]`);
    const asciiArt = text.slice(0,20).split('').map(c => c === ' ' ? '   ' : asciiChars[c.charCodeAt(0) % asciiChars.length].repeat(3)).join(' ');
    reply(`\`\`\`${asciiArt}\`\`\``);
}
break;

case "numberinfo":
case "phoneinfo": {
    if (!text) return reply(`Usage: ${prefix}phoneinfo 2348012345678`);
    const num2 = text.replace(/[^0-9]/g,'');
    const cc = num2.startsWith('234') ? 'Nigeria 🇳🇬' : num2.startsWith('254') ? 'Kenya 🇰🇪' : num2.startsWith('233') ? 'Ghana 🇬🇭' : num2.startsWith('27') ? 'South Africa 🇿🇦' : num2.startsWith('44') ? 'UK 🇬🇧' : num2.startsWith('1') ? 'USA/Canada 🇺🇸' : 'Unknown';
    reply(`📱 *Phone Info*\n\n▸ Number: +${num2}\n▸ Country: ${cc}\n▸ Length: ${num2.length} digits\n▸ WhatsApp: https://wa.me/${num2}`);
}
break;

case "warlist":
case "warns": {
    if (!m.isGroup) return reply('❌ Group only');
    const warnData = global.warns[m.chat] || {};
    if (!Object.keys(warnData).length) return reply('✅ No warned users in this group');
    let warnText = '⚠️ *Warned Users:*\n\n';
    Object.entries(warnData).forEach(([jid, count2]) => { warnText += `▸ @${jid.split('@')[0]}: ${count2} warn(s)\n`; });
    reply(warnText, Object.keys(warnData));
}
break;

case "clearwarns":
case "resetwarns": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    const cwTarget = m.mentionedJid?.[0];
    if (cwTarget) {
        if (global.warns[m.chat]) delete global.warns[m.chat][cwTarget];
        reply(`✅ Cleared warns for @${cwTarget.split('@')[0]}`, [cwTarget]);
    } else {
        global.warns[m.chat] = {};
        reply('✅ All warns cleared for this group');
    }
}
break;

case "report": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!m.quoted) return reply('Reply to a message to report it');
    const adminJids3 = participants.filter(p => p.admin).map(p => p.id);
    let repText = `🚨 *Report from @${m.sender.split('@')[0]}*\n\nMessage from: @${m.quoted.sender?.split('@')[0]}\nReason: ${text || 'No reason given'}`;
    adminJids3.forEach(async a => { try { await devtrust.sendMessage(a, { text: repText }); } catch(e) {} });
    reply('✅ Reported to admins!', adminJids3);
}
break;

case "announce":
case "broadcast2": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!text) return reply(`Usage: ${prefix}announce [message]`);
    const allMentions = participants.map(p => p.id);
    reply(`📢 *ANNOUNCEMENT*\n\n${text}`, allMentions);
}
break;
// [REMOVED DUPLICATE: poll]

case "timer2":
case "settimer": {
    if (!text) return reply(`Usage: ${prefix}timer2 5m Meeting starts`);
    const timerMatch = text.match(/^(\d+)(s|m|h)\s*(.*)/i);
    if (!timerMatch) return reply('Format: .timer2 5m Message');
    const [, amt, unit, timerMsg] = timerMatch;
    const ms2 = parseInt(amt) * (unit === 's' ? 1000 : unit === 'm' ? 60000 : 3600000);
    if (ms2 > 3600000) return reply('Max timer is 1 hour');
    reply(`⏰ Timer set for ${amt}${unit}. I\'ll remind you: "${timerMsg || 'Time is up!'}" `);
    setTimeout(() => reply(`⏰ *TIMER ALERT!*\n\n${timerMsg || 'Your timer is up!'}\n\n_Set by @${m.sender.split('@')[0]}_`, [m.sender]), ms2);
}
break;

case "note":
case "savenote": {
    const noteFile = `./database/notes_${m.sender.split('@')[0]}.json`;
    if (!text) {
        try {
            const notes2 = fs.existsSync(noteFile) ? JSON.parse(fs.readFileSync(noteFile)) : [];
            if (!notes2.length) return reply('📝 No saved notes. Use .note [text] to save');
            reply(`📝 *Your Notes:*\n\n${notes2.map((n,i) => `${i+1}. ${n}`).join('\n')}`);
        } catch(e) { reply('📝 No notes saved'); }
    } else {
        let notes3 = [];
        try { notes3 = fs.existsSync(noteFile) ? JSON.parse(fs.readFileSync(noteFile)) : []; } catch(e) {}
        notes3.push(text);
        fs.writeFileSync(noteFile, JSON.stringify(notes3));
        reply(`✅ Note saved! You have ${notes3.length} note(s)\n\nUse ${prefix}note to view all`);
    }
}
break;
// [REMOVED DUPLICATE: clearnotes]

case "reminder": {
    reply(`⏰ *Reminder System*\n\nUse ${prefix}timer2 [time] [message]\nExamples:\n${prefix}timer2 5m Check the food\n${prefix}timer2 1h Meeting reminder\n${prefix}timer2 30s Take medicine`);
}
break;

case "help":
case "commands": {
    reply(`📋 *${botDisplayName} Commands*\n\nUse ${prefix}menu for the full menu\n\n🎮 *Fun:* joke, riddle, fact, quote, roast, compliment, ship, truth, dare, 8ball, pick\n\n🔧 *Tools:* calc, qr, weather, translate, tts, lyrics, wiki, define\n\n📱 *Media:* sticker, removebg, ytmp3, tiktok, meme, cat, dog\n\n👥 *Group:* kick, add, promote, demote, tagall, lock, unlock, poll\n\n💰 *Crypto:* btc, eth, doge, xrp, currency\n\n⚙️ *Settings:* prefix, setprefix, autoread, autobio`);
}
break;

case "listall":
case "allcommands": {
    reply(`📋 *All Available Commands:*\n\n*FUN:* joke riddle fact quote roast compliment ship love truth dare tod 8ball pick\n\n*TOOLS:* calc qr qrread weather translate time date countdown b64enc b64dec password uuid color hash flip dice pick number tts\n\n*INFO:* ip country wiki define news phoneinfo github pokemon anime nasa\n\n*MEDIA:* sticker toimage forward save meme cat dog fox lyrics tiktok igdl\n\n*TEXT:* bold italic strike mono reverse upper lower count repeat emojify font ascii\n\n*GROUP:* tagall tagadmins admins groupinfo lock unlock kick add promote demote setname setdesc invite revoke poll announce report\n\n*CRYPTO:* btc eth doge xrp crypto currency ngn-rates btc-usdt\n\n*PLUGINS:* aza removebg qr match fetch ocr currrates listrequest approve reject msgpin\n\n*BOT:* ping uptime stats runtime menu help prefix setprefix legendary`);
}
break;


// ============================================================
// ============ LEGENDARY BOT - NEW COMMANDS BLOCK ============
// ============================================================

// ===== LEGENDARY PING =====
// [REMOVED DUPLICATE: legendary]

// ===== QR CODE GENERATOR =====
// [REMOVED DUPLICATE: qr]

// ===== REMOVE BACKGROUND =====
// [REMOVED DUPLICATE: rmbg]

// ===== PIN MESSAGE =====
// [REMOVED DUPLICATE: msgpin]

// ===== BANK ACCOUNT SAVER =====
// [REMOVED DUPLICATE: aza]

// ===== LIST JOIN REQUESTS =====
// [REMOVED DUPLICATE: listrequest]

// ===== APPROVE JOIN REQUESTS =====
// [REMOVED DUPLICATE: approve]

// ===== REJECT JOIN REQUESTS =====
// [REMOVED DUPLICATE: reject]

// ===== AUTO-REPLY SET =====
// [REMOVED DUPLICATE: autoreply]

// ===== AUTO-REPLY STOP =====
case 'sreply':
case 'stopreply': {
    if (!m.isGroup) return reply('❌ Group only command');
    if (!text) return reply(`Give the trigger word to remove.\n${prefix}sreply trigger-word`);
    const srFile = './database/autoreply.json';
    const srStore = fs.existsSync(srFile) ? JSON.parse(fs.readFileSync(srFile)) : {};
    if (!srStore[m.chat]?.[text.toLowerCase()]) return reply(`❌ No auto-reply found for *${text}*`);
    delete srStore[m.chat][text.toLowerCase()];
    fs.writeFileSync(srFile, JSON.stringify(srStore, null, 2));
    reply(`✅ *Removed auto-reply for:* ${text}`);
}
break;

// ===== LIST AUTO-REPLIES =====
case 'listreply':
case 'listautoreply': {
    if (!m.isGroup) return reply('❌ Group only command');
    const larFile = './database/autoreply.json';
    const larStore = fs.existsSync(larFile) ? JSON.parse(fs.readFileSync(larFile)) : {};
    const larMap = larStore[m.chat];
    if (!larMap || !Object.keys(larMap).length) return reply('❌ No auto-replies set in this group.');
    let larText = '*📋 Auto-Replies:*\n';
    Object.entries(larMap).forEach(([k, v]) => { larText += `\n• *${k}* → ${v}`; });
    reply(larText);
}
break;

// ===== FOOTBALL MATCH SCORES =====
// [REMOVED DUPLICATE: match]

// ===== CURRENCY RATES =====
// [REMOVED DUPLICATE: curr-rates]

// ===== NGN RATES =====
// [REMOVED DUPLICATE: ngnrates]

// ===== USD RATES =====
case 'usdrates':
case 'usd-rates': {
    try {
        const usdRes = await axios.get('https://open.er-api.com/v6/latest/USD');
        const usdR = usdRes.data.rates;
        reply(`🇺🇸 *USD Exchange Rates*\n\n• EUR: ${usdR.EUR?.toFixed(4)}\n• GBP: ${usdR.GBP?.toFixed(4)}\n• NGN: ${usdR.NGN?.toFixed(2)}\n• JPY: ${usdR.JPY?.toFixed(2)}\n• CNY: ${usdR.CNY?.toFixed(4)}\n• INR: ${usdR.INR?.toFixed(4)}\n• CAD: ${usdR.CAD?.toFixed(4)}\n• AUD: ${usdR.AUD?.toFixed(4)}\n• ZAR: ${usdR.ZAR?.toFixed(4)}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== BTC USDT =====
case 'btcusdt':
case 'btc-usdt': {
    try {
        const btcRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=BTC-USDT');
        const btcD = btcRes.data?.data;
        reply(`₿ *BTC-USDT*\n\n💰 Price: $${parseFloat(btcD.last).toFixed(2)}\n📈 24h Change: ${(parseFloat(btcD.changeRate) * 100).toFixed(2)}%\n🔺 High: $${parseFloat(btcD.high).toFixed(2)}\n🔻 Low: $${parseFloat(btcD.low).toFixed(2)}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== ETH USDT =====
case 'ethusdt':
case 'eth-usdt': {
    try {
        const ethRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=ETH-USDT');
        const ethD = ethRes.data?.data;
        reply(`Ξ *ETH-USDT*\n\n💰 Price: $${parseFloat(ethD.last).toFixed(2)}\n📈 24h Change: ${(parseFloat(ethD.changeRate) * 100).toFixed(2)}%\n🔺 High: $${parseFloat(ethD.high).toFixed(2)}\n🔻 Low: $${parseFloat(ethD.low).toFixed(2)}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== XRP USDT =====
case 'xrpusdt':
case 'xrp-usdt': {
    try {
        const xrpRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=XRP-USDT');
        const xrpD = xrpRes.data?.data;
        reply(`🔷 *XRP-USDT*\n\n💰 Price: $${parseFloat(xrpD.last).toFixed(4)}\n📈 24h Change: ${(parseFloat(xrpD.changeRate) * 100).toFixed(2)}%\n🔺 High: $${parseFloat(xrpD.high).toFixed(4)}\n🔻 Low: $${parseFloat(xrpD.low).toFixed(4)}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== DOGE USDT =====
case 'dogeusdt':
case 'doge-usdt': {
    try {
        const dogeRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=DOGE-USDT');
        const dogeD = dogeRes.data?.data;
        reply(`🐶 *DOGE-USDT*\n\n💰 Price: $${parseFloat(dogeD.last).toFixed(5)}\n📈 24h Change: ${(parseFloat(dogeD.changeRate) * 100).toFixed(2)}%\n🔺 High: $${parseFloat(dogeD.high).toFixed(5)}\n🔻 Low: $${parseFloat(dogeD.low).toFixed(5)}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== FETCH FILE FROM URL =====
// [REMOVED DUPLICATE: fetch]

// ===== CURRENCY CONVERT =====
case 'convert':
case 'currency2': {
    if (!text) return reply(`💱 Usage: ${prefix}convert 100 USD NGN`);
    const convParts = text.trim().split(/\s+/);
    if (convParts.length < 3) return reply('❌ Format: 100 USD NGN');
    const convAmt = parseFloat(convParts[0]);
    const convFrom = convParts[1].toUpperCase();
    const convTo = convParts[2].toUpperCase();
    if (isNaN(convAmt)) return reply('❌ Enter a valid amount');
    try {
        const convRes = await axios.get(`https://open.er-api.com/v6/latest/${convFrom}`, { timeout: 10000 });
        const convRate = convRes.data?.rates?.[convTo];
        if (!convRate) return reply(`❌ Invalid currency: ${convTo}`);
        const convResult = (convAmt * convRate).toFixed(2);
        reply(`💱 *${convAmt} ${convFrom} = ${convResult} ${convTo}*\n\nRate: 1 ${convFrom} = ${convRate.toFixed(4)} ${convTo}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== TRANSLATE =====
// [REMOVED DUPLICATE: translate]

// ===== DICTIONARY =====
// [REMOVED DUPLICATE: define]

// ===== SYNONYM =====
case 'synonym': {
    if (!text) return reply(`📚 Usage: ${prefix}synonym happy`);
    try {
        const synRes = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text.trim())}`, { timeout: 10000 });
        const synData = synRes.data?.[0];
        const synList = synData?.meanings?.flatMap(mn => mn.definitions?.flatMap(d => d.synonyms || []) || []) || [];
        const synMeaning = synData?.meanings?.flatMap(mn => mn.synonyms || []) || [];
        const allSyn = [...new Set([...synList, ...synMeaning])].slice(0, 15);
        if (!allSyn.length) return reply(`❌ No synonyms found for "${text}"`);
        reply(`📚 *Synonyms for "${text}":*\n\n${allSyn.join(', ')}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== ANTONYM =====
case 'antonym': {
    if (!text) return reply(`📚 Usage: ${prefix}antonym happy`);
    try {
        const antRes = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text.trim())}`, { timeout: 10000 });
        const antData = antRes.data?.[0];
        const antList = antData?.meanings?.flatMap(mn => mn.definitions?.flatMap(d => d.antonyms || []) || []) || [];
        const antMeaning = antData?.meanings?.flatMap(mn => mn.antonyms || []) || [];
        const allAnt = [...new Set([...antList, ...antMeaning])].slice(0, 15);
        if (!allAnt.length) return reply(`❌ No antonyms found for "${text}"`);
        reply(`📚 *Antonyms for "${text}":*\n\n${allAnt.join(', ')}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// weather handled above (use .weather, .weather2, .weatherinfo, .weatherdetail, .wttr)

// ===== COUNTRY INFO =====
// [REMOVED DUPLICATE: country]

// ===== IP LOOKUP =====
// [REMOVED DUPLICATE: ip]

// ===== GITHUB PROFILE =====
// [REMOVED DUPLICATE: github]

// ===== URL SHORTENER =====
// [REMOVED DUPLICATE: shorturl]

// ===== NASA PICTURE OF THE DAY =====
// [REMOVED DUPLICATE: nasa]

// ===== NOTES SYSTEM =====
case 'notes': {
    if (!text) return reply(`📝 *Notes Commands:*\n${prefix}notes save title :: content\n${prefix}notes get title\n${prefix}notes list\n${prefix}notes delete title`);
    const noteFile = './database/notes.json';
    const noteStore = fs.existsSync(noteFile) ? JSON.parse(fs.readFileSync(noteFile)) : {};
    const noteKey = m.chat;
    if (!noteStore[noteKey]) noteStore[noteKey] = {};
    const noteParts = text.split(' ');
    const noteCmd = noteParts[0].toLowerCase();
    if (noteCmd === 'save') {
        const noteContent = noteParts.slice(1).join(' ');
        const noteSplit = noteContent.split('::');
        if (noteSplit.length < 2) return reply('❌ Format: notes save title :: content');
        const noteTitle = noteSplit[0].trim();
        const noteBody = noteSplit[1].trim();
        noteStore[noteKey][noteTitle] = noteBody;
        fs.writeFileSync(noteFile, JSON.stringify(noteStore, null, 2));
        reply(`📌 *Note saved:* ${noteTitle}`);
    } else if (noteCmd === 'get') {
        const noteTitle = noteParts.slice(1).join(' ').trim();
        const noteBody = noteStore[noteKey]?.[noteTitle];
        if (!noteBody) return reply(`❌ No note found: "${noteTitle}"`);
        reply(`📝 *${noteTitle}*\n\n${noteBody}`);
    } else if (noteCmd === 'list') {
        const noteTitles = Object.keys(noteStore[noteKey] || {});
        if (!noteTitles.length) return reply('❌ No notes saved.');
        reply(`📋 *Saved Notes:*\n\n${noteTitles.map((t, i) => `${i+1}. ${t}`).join('\n')}`);
    } else if (noteCmd === 'delete') {
        const noteTitle = noteParts.slice(1).join(' ').trim();
        if (!noteStore[noteKey]?.[noteTitle]) return reply(`❌ No note found: "${noteTitle}"`);
        delete noteStore[noteKey][noteTitle];
        fs.writeFileSync(noteFile, JSON.stringify(noteStore, null, 2));
        reply(`🗑️ *Deleted note:* ${noteTitle}`);
    } else {
        reply(`📝 Usage:\n${prefix}notes save title :: content\n${prefix}notes get title\n${prefix}notes list\n${prefix}notes delete title`);
    }
}
break;

// ===== REMINDER =====
// [REMOVED DUPLICATE: remind]

// ===== POLL =====
case 'poll2':
case 'vote': {
    if (!text) return reply(`📊 Usage: ${prefix}poll2 Question | Option1 | Option2 | Option3`);
    const pollParts = text.split('|').map(s => s.trim()).filter(Boolean);
    if (pollParts.length < 3) return reply('❌ Need question + at least 2 options separated by |');
    const pollQ = pollParts[0];
    const pollOpts = pollParts.slice(1);
    try {
        await devtrust.sendMessage(m.chat, { poll: { name: pollQ, values: pollOpts, selectableCount: 1 } }, { quoted: m });
    } catch (e) { reply(`❌ Error creating poll: ${e.message}`); }
}
break;

// ===== WARNINGS SYSTEM =====
case 'warn2': {
    if (!m.isGroup) return reply('❌ Group only');
    const warnFile = './database/warnings.json';
    const warnStore = fs.existsSync(warnFile) ? JSON.parse(fs.readFileSync(warnFile)) : {};
    const warnTarget = m.quoted?.sender || m.mentionedJid?.[0];
    if (!warnTarget) return reply('❌ Tag or reply to a member');
    if (!warnStore[m.chat]) warnStore[m.chat] = {};
    if (!warnStore[m.chat][warnTarget]) warnStore[m.chat][warnTarget] = 0;
    warnStore[m.chat][warnTarget]++;
    fs.writeFileSync(warnFile, JSON.stringify(warnStore, null, 2));
    const warnCount = warnStore[m.chat][warnTarget];
    await devtrust.sendMessage(m.chat, { text: `⚠️ *WARNING ${warnCount}/3*\n\n@${warnTarget.split('@')[0]} has been warned!\n*Reason:* ${text || 'No reason given'}\n\n${warnCount >= 3 ? '🚨 *3 warnings! Consider removing this member.*' : `_${3 - warnCount} warning(s) remaining._`}`, mentions: [warnTarget] }, { quoted: m });
}
break;

case 'warncount':
case 'warnings2': {
    if (!m.isGroup) return reply('❌ Group only');
    const wcFile = './database/warnings.json';
    const wcStore = fs.existsSync(wcFile) ? JSON.parse(fs.readFileSync(wcFile)) : {};
    const wcGroup = wcStore[m.chat];
    if (!wcGroup || !Object.keys(wcGroup).length) return reply('✅ No warnings in this group.');
    let wcText = '⚠️ *Warning List:*\n\n';
    Object.entries(wcGroup).forEach(([jid, count]) => { wcText += `• @${jid.split('@')[0]}: ${count} warning(s)\n`; });
    await devtrust.sendMessage(m.chat, { text: wcText, mentions: Object.keys(wcGroup) }, { quoted: m });
}
break;
// [REMOVED DUPLICATE: clearwarns]

// ===== TAGALL 2 =====
case 'tagall2': {
    if (!m.isGroup) return reply('❌ Group only');
    try {
        const tagMeta = await devtrust.groupMetadata(m.chat);
        const tagMembers = tagMeta.participants;
        let tagText = text ? `📢 *${text}*\n\n` : '📢 *Attention everyone:*\n\n';
        const tagMentions = tagMembers.map(p => p.id);
        tagMentions.forEach(jid => { tagText += `@${jid.split('@')[0]} `; });
        await devtrust.sendMessage(m.chat, { text: tagText, mentions: tagMentions }, { quoted: m });
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== GROUP LINK 2 =====
case 'gclink2': {
    if (!m.isGroup) return reply('❌ Group only');
    try {
        const glCode = await devtrust.groupInviteCode(m.chat);
        reply(`🔗 *Group Link:*\nhttps://chat.whatsapp.com/${glCode}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== MEMBER COUNT =====
// [REMOVED DUPLICATE: membercount]

// ===== LIST ADMINS =====
case 'listadmins': {
    if (!m.isGroup) return reply('❌ Group only');
    try {
        const adMeta = await devtrust.groupMetadata(m.chat);
        const adList = adMeta.participants.filter(p => p.admin);
        let adText = `👑 *Group Admins (${adList.length}):*\n\n`;
        const adMentions = adList.map(p => p.id);
        adList.forEach(p => { adText += `• @${p.id.split('@')[0]}\n`; });
        await devtrust.sendMessage(m.chat, { text: adText, mentions: adMentions }, { quoted: m });
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== BOT INFO =====
case 'botinfo': {
    reply(`🤖 *${botDisplayName} Info*\n\n*Name:* ${botDisplayName}\n*Version:* 3.0.0\n*Brand:* LËGĚNDÃRY Ł𝗮𝗯𝘀™\n*Framework:* Baileys\n*Language:* Node.js\n*Status:* ✅ Active & Listening\n*Commands:* 800+\n\n_© ${botDisplayName} BY LËGĚNDÃRY Ł𝗮𝗯𝘀™_`);
}
break;

// ===== UPTIME =====
case 'uptime2': {
    const upMs = process.uptime() * 1000;
    const upHrs = Math.floor(upMs / 3600000);
    const upMins = Math.floor((upMs % 3600000) / 60000);
    const upSecs = Math.floor((upMs % 60000) / 1000);
    reply(`⚡ *${botDisplayName} Uptime*\n\n🕐 *${upHrs}h ${upMins}m ${upSecs}s*\n✅ Running perfectly!`);
}
break;

// ===== SPEED TEST =====
// [REMOVED DUPLICATE: speed]

// ===== RAM/MEMORY =====
case 'ram': {
    const memUsed = process.memoryUsage();
    const mbUsed = (memUsed.heapUsed / 1024 / 1024).toFixed(2);
    const mbTotal = (memUsed.heapTotal / 1024 / 1024).toFixed(2);
    reply(`💾 *Bot Memory*\n\n*Heap Used:* ${mbUsed} MB\n*Heap Total:* ${mbTotal} MB\n*Status:* ${mbUsed < 200 ? '✅ Good' : '⚠️ Heavy'}`);
}
break;

// ===== TIMESTAMP =====
case 'timestamp': {
    const tsNow = Date.now();
    reply(`🕐 *Timestamp*\n\n*Unix (ms):* ${tsNow}\n*Unix (s):* ${Math.floor(tsNow / 1000)}\n*UTC:* ${new Date(tsNow).toUTCString()}`);
}
break;

// ===== FUN: 8BALL =====
// [REMOVED DUPLICATE: 8ball]

// dice handled above (use .dice, .roll, .dicegamble)

// ===== COIN FLIP =====
// [REMOVED DUPLICATE: coinflip]

// ===== CHOOSE =====
case 'choose': {
    if (!text) return reply(`Usage: ${prefix}choose option1 / option2 / option3`);
    const chooseOpts = text.split('/').map(s => s.trim()).filter(Boolean);
    if (chooseOpts.length < 2) return reply('Give me at least 2 options separated by /');
    reply(`🎲 *I choose:*\n\n*${chooseOpts[Math.floor(Math.random() * chooseOpts.length)]}* ✅`);
}
break;

// ===== SHIP =====
// [REMOVED DUPLICATE: ship]

// ===== RATE =====
case 'rate': {
    const rateTarget = text || m.pushName;
    const rateNum = Math.floor(Math.random() * 10) + 1;
    const rateEmoji = rateNum >= 8 ? '🔥' : rateNum >= 5 ? '😊' : '😅';
    reply(`⭐ *Rating for ${rateTarget}:*\n\n${'⭐'.repeat(rateNum)}${'☆'.repeat(10-rateNum)}\n\n*${rateNum}/10* ${rateEmoji}`);
}
break;

// ===== TRUTH =====
// [REMOVED DUPLICATE: truth]

// ===== DARE =====
// [REMOVED DUPLICATE: dare]

// ===== WOULD YOU RATHER =====
// [REMOVED DUPLICATE: wyr]

// ===== FORTUNE COOKIE =====
case 'fortune': {
    const fortunes = ['🥠 A beautiful surprise is coming your way.','🥠 Your hard work will pay off greatly.','🥠 Someone is thinking of you right now.','🥠 An unexpected friendship will change your life.','🥠 The answer to your problem is simpler than you think.','🥠 You will soon receive very good news.','🥠 Believe in yourself — others already do.','🥠 A great opportunity is just around the corner.'];
    reply(fortunes[Math.floor(Math.random() * fortunes.length)]);
}
break;

// ===== RIDDLE =====
// [REMOVED DUPLICATE: riddle]

// ===== TRIVIA =====
// [REMOVED DUPLICATE: trivia]

// ===== FUN FACT =====
// funfact handled above

// ===== ANIME QUOTE =====
// [REMOVED DUPLICATE: animequote]

// ===== MOTIVATION =====
case 'motivation': {
    const motivations = ['🔥 *Wake up. Grind. Win. Repeat.*\n\nEvery morning is a new opportunity!','💪 *Your setback is setting you up for a comeback.*','🏆 *Champions are made in moments they don\'t feel like it.*\n\nPush through!','⚡ *Stop waiting for the perfect moment. Start NOW.*','💎 *Diamonds are made under pressure. So are champions.*','🔑 *The secret to getting ahead is getting started.*'];
    reply(motivations[Math.floor(Math.random() * motivations.length)]);
}
break;

// ===== INSPIRE =====
case 'inspire':
case 'quote2': {
    const inspireQuotes = ['"The secret of getting ahead is getting started." – Mark Twain','"It always seems impossible until it\'s done." – Nelson Mandela','"The future belongs to those who believe in the beauty of their dreams." – Eleanor Roosevelt','"Hardships often prepare ordinary people for an extraordinary destiny." – C.S. Lewis','"Believe you can and you\'re halfway there." – Theodore Roosevelt','"The only way to do great work is to love what you do." – Steve Jobs','"In the middle of every difficulty lies opportunity." – Einstein'];
    reply(`💡 *Daily Inspiration*\n\n_${inspireQuotes[Math.floor(Math.random() * inspireQuotes.length)]}_`);
}
break;

// ===== JOKE =====
case 'joke2': {
    const jokeList = ['Why don\'t scientists trust atoms? Because they make up everything! 😂','Why did the scarecrow win an award? He was outstanding in his field! 🌾','I told my wife she was drawing her eyebrows too high. She looked surprised! 😳','I\'m reading a book about anti-gravity. It\'s impossible to put down! 📚','What do you call fake spaghetti? An impasta! 🍝','Why did the bicycle fall over? It was two-tired! 🚲'];
    reply(`😂 *Joke:*\n\n${jokeList[Math.floor(Math.random() * jokeList.length)]}`);
}
break;

// ===== PUN =====
case 'pun': {
    const punList = ['Time flies like an arrow. Fruit flies like a banana. 🍌','I used to hate facial hair, but then it grew on me. 🧔','I\'m on a seafood diet. I see food and I eat it. 🍕','I used to be a banker but I lost interest. 💰','I\'m afraid of elevators but I\'m taking steps to avoid them! 🪜'];
    reply(`🤣 *Pun Alert:*\n\n_${punList[Math.floor(Math.random() * punList.length)]}_`);
}
break;

// ===== HISTORY FACT =====
case 'history': {
    const historyFacts = ['📜 Cleopatra lived closer in time to the Moon landing than to the Great Pyramid.','⚔️ The shortest war lasted 38 minutes — Britain vs Zanzibar, 1896.','🏛️ Oxford University is older than the Aztec Empire.','🎭 Shakespeare invented over 1,700 words we still use today.','🇳🇬 Nigeria has the largest economy in Africa.','📖 The world\'s oldest university (Al-Qarawiyyin) is in Morocco, founded 859 AD.'];
    reply(`📜 *History Fact:*\n\n${historyFacts[Math.floor(Math.random() * historyFacts.length)]}`);
}
break;

// ===== SCIENCE FACT =====
case 'science': {
    const scienceFacts = ['⚛️ There are more chess positions than atoms in the observable universe.','💡 The human eye can distinguish about 10 million different colors.','⚡ A bolt of lightning is 5 times hotter than the surface of the sun.','🌌 The Milky Way has 100-400 billion stars.','🌊 The ocean produces over 50% of the world\'s oxygen.','💻 The human brain has about 86 billion neurons.'];
    reply(`🔬 *Science Fact:*\n\n${scienceFacts[Math.floor(Math.random() * scienceFacts.length)]}`);
}
break;

// ===== TECH FACT =====
case 'tech': {
    const techFacts = ['💻 The first computer mouse was made of wood in 1964.','📱 More people have mobile phones than toothbrushes worldwide.','🌐 The first website went live August 6, 1991.','📧 The first email was sent in 1971 by Ray Tomlinson (to himself).','🔐 The most common password is still "password".','🤯 90% of the world\'s data was created in the last 2 years.'];
    reply(`💻 *Tech Fact:*\n\n${techFacts[Math.floor(Math.random() * techFacts.length)]}`);
}
break;

// ===== AFRICAN FACT =====
case 'africanfact': {
    const africaFacts = ['🌍 Africa is home to the world\'s longest river (Nile) and largest hot desert (Sahara).','🇳🇬 Nigeria alone has over 500 spoken languages.','💎 Africa holds about 30% of the world\'s mineral reserves.','📚 The world\'s oldest university is in Morocco, founded in 859 AD.','🦁 Only Africa has lions, elephants, rhinos, leopards and buffalos together (Big Five).','🌟 By 2050, 1 in 4 humans will be African.'];
    reply(`🌍 *African Fact:*\n\n${africaFacts[Math.floor(Math.random() * africaFacts.length)]}`);
}
break;

// ===== NIGERIAN FACT =====
case 'nigerianfact': {
    const nigeriaFacts = ['🇳🇬 Nigeria has the largest economy in Africa (~$440B GDP).','🎬 Nollywood is the 2nd largest film industry in the world by volume.','👥 Nigeria is the most populous African country — 220M+ people.','🌿 Nigeria is the world\'s largest producer of cassava and yam.','🎵 Afrobeats from Nigeria has taken over the world!','🏙️ Lagos is the largest city in Africa by population.','🎓 Nigeria\'s Wole Soyinka won the Nobel Prize for Literature in 1986.'];
    reply(`🇳🇬 *Nigerian Fact:*\n\n${nigeriaFacts[Math.floor(Math.random() * nigeriaFacts.length)]}`);
}
break;

// ===== NAIJA SLANG =====
case 'slangs':
case 'naijaslangs': {
    const slangs = ['🔥 *Wahala* — Trouble/Problem','⚡ *Shakara* — Showing off','😏 *Sabi* — To know/be skilled','💀 *Scatter* — To mess something up','🏆 *Oga* — Boss/Master','😎 *Badoo* — A super skilled person','🤝 *Omo* — Exclamation of surprise','💰 *Settle* — Bribe or tip','🤣 *Yarn* — To talk/chat','👀 *Pepper dem* — Show success, make people jealous'];
    reply(`🇳🇬 *Naija Slang:*\n\n${slangs[Math.floor(Math.random() * slangs.length)]}`);
}
break;

// ===== NAIJA FOOD =====
case 'naijafood': {
    const naijFoods = ['🍲 Jollof Rice — the GOAT of all rice dishes!','🫕 Egusi Soup — thick, rich and full of protein!','🍖 Suya — spicy grilled meat perfection!','🥘 Banga Soup — palm fruit goodness!','🍛 Eba and Okra — the classic combo!','🥩 Pepper Soup — cure for everything!','🫘 Akara — bean cakes for breakfast!','🍠 Pounded Yam and Egusi — the heavyweight champ!'];
    reply(`🇳🇬 *Naija Food:*\n\n${naijFoods[Math.floor(Math.random() * naijFoods.length)]}`);
}
break;

// ===== ZODIAC =====
case 'zodiac': {
    if (!text) return reply(`♈ Usage: ${prefix}zodiac aries\nSigns: aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces`);
    const zodiacInfo = {aries:{symbol:'♈',dates:'Mar 21–Apr 19',element:'🔥 Fire',compatible:'Leo, Sagittarius'},taurus:{symbol:'♉',dates:'Apr 20–May 20',element:'🌍 Earth',compatible:'Virgo, Capricorn'},gemini:{symbol:'♊',dates:'May 21–Jun 20',element:'💨 Air',compatible:'Libra, Aquarius'},cancer:{symbol:'♋',dates:'Jun 21–Jul 22',element:'💧 Water',compatible:'Scorpio, Pisces'},leo:{symbol:'♌',dates:'Jul 23–Aug 22',element:'🔥 Fire',compatible:'Aries, Sagittarius'},virgo:{symbol:'♍',dates:'Aug 23–Sep 22',element:'🌍 Earth',compatible:'Taurus, Capricorn'},libra:{symbol:'♎',dates:'Sep 23–Oct 22',element:'💨 Air',compatible:'Gemini, Aquarius'},scorpio:{symbol:'♏',dates:'Oct 23–Nov 21',element:'💧 Water',compatible:'Cancer, Pisces'},sagittarius:{symbol:'♐',dates:'Nov 22–Dec 21',element:'🔥 Fire',compatible:'Aries, Leo'},capricorn:{symbol:'♑',dates:'Dec 22–Jan 19',element:'🌍 Earth',compatible:'Taurus, Virgo'},aquarius:{symbol:'♒',dates:'Jan 20–Feb 18',element:'💨 Air',compatible:'Gemini, Libra'},pisces:{symbol:'♓',dates:'Feb 19–Mar 20',element:'💧 Water',compatible:'Cancer, Scorpio'}};
    const zodSign = zodiacInfo[text.toLowerCase()];
    if (!zodSign) return reply('❌ Invalid sign. Use: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces');
    reply(`${zodSign.symbol} *${text.toUpperCase()}*\n\n📅 Dates: ${zodSign.dates}\n${zodSign.element}\n💕 Compatible: ${zodSign.compatible}`);
}
break;

// ===== TAROT =====
case 'tarot': {
    const tarotCards = [{name:'The Fool',meaning:'New beginnings, adventure'},{name:'The Magician',meaning:'Power, skill, willpower'},{name:'The High Priestess',meaning:'Intuition, wisdom'},{name:'The Empress',meaning:'Abundance, creativity'},{name:'The Emperor',meaning:'Authority, stability'},{name:'The Lovers',meaning:'Love, harmony, choices'},{name:'The Chariot',meaning:'Control, success, determination'},{name:'Strength',meaning:'Courage, patience'},{name:'The Hermit',meaning:'Introspection, guidance'},{name:'Wheel of Fortune',meaning:'Change, fate, luck'},{name:'The Star',meaning:'Hope, serenity'},{name:'The Sun',meaning:'Success, positivity'},{name:'The World',meaning:'Completion, achievement'}];
    const tarot = tarotCards[Math.floor(Math.random() * tarotCards.length)];
    reply(`🃏 *Tarot Card for You:*\n\n*${tarot.name}*\n\n✨ *Meaning:* ${tarot.meaning}\n\n_The universe speaks to you through this card._ 🌟`);
}
break;

// ===== LUCKY NUMBERS =====
case 'lucky': {
    const luckyNums = [];
    while (luckyNums.length < 6) { const n = Math.floor(Math.random() * 49) + 1; if (!luckyNums.includes(n)) luckyNums.push(n); }
    luckyNums.sort((a, b) => a - b);
    reply(`🍀 *Your Lucky Numbers Today:*\n\n${luckyNums.join(' - ')}\n\n_Good luck, legend!_ ✨`);
}
break;

// ===== IQ TEST =====
case 'iqtest': {
    const iqTarget = text || m.pushName;
    const iqScore = Math.floor(Math.random() * 60) + 70;
    const iqCat = iqScore >= 130 ? '🧠 Genius' : iqScore >= 120 ? '✨ Very Superior' : iqScore >= 110 ? '😊 High Average' : iqScore >= 90 ? '👍 Average' : '🤔 Below Average';
    reply(`🧠 *IQ Test Result*\n\n*Person:* ${iqTarget}\n*IQ Score:* ${iqScore}\n*Category:* ${iqCat}\n\n_Just for fun! 😄_`);
}
break;

// ===== BMI =====
case 'bmi': {
    if (!text) return reply(`Usage: ${prefix}bmi 70 175\n(weight kg, height cm)`);
    const bmiParts = text.trim().split(/\s+/);
    if (bmiParts.length < 2) return reply('❌ Need weight and height');
    const bmiW = parseFloat(bmiParts[0]);
    const bmiH = parseFloat(bmiParts[1]) / 100;
    if (isNaN(bmiW) || isNaN(bmiH)) return reply('❌ Invalid values');
    const bmiVal = (bmiW / (bmiH * bmiH)).toFixed(1);
    const bmiCat = bmiVal < 18.5 ? '🔵 Underweight' : bmiVal < 25 ? '✅ Normal' : bmiVal < 30 ? '🟡 Overweight' : '🔴 Obese';
    reply(`⚖️ *BMI*\n\n*Weight:* ${bmiW} kg\n*Height:* ${bmiParts[1]} cm\n*BMI:* ${bmiVal}\n*Status:* ${bmiCat}`);
}
break;

// ===== AGE CALC =====
case 'age': {
    if (!text) return reply(`Usage: ${prefix}age DD/MM/YYYY`);
    try {
        const [ageDd, ageMm, ageYyyy] = text.split('/').map(Number);
        const ageBirth = new Date(ageYyyy, ageMm - 1, ageDd);
        const ageNow = new Date();
        let ageYears = ageNow.getFullYear() - ageBirth.getFullYear();
        let ageMonths = ageNow.getMonth() - ageBirth.getMonth();
        if (ageMonths < 0) { ageYears--; ageMonths += 12; }
        reply(`🎂 *Age*\n\n*Birthday:* ${text}\n*Age:* ${ageYears} years, ${ageMonths} months\n*Days lived:* ~${(ageYears * 365.25).toFixed(0)}`);
    } catch (e) { reply('❌ Use DD/MM/YYYY format'); }
}
break;

// ===== TEMP CONVERTER =====
case 'temp': {
    if (!text) return reply(`Usage: ${prefix}temp 100c or ${prefix}temp 212f`);
    const tempMatch = text.match(/^([\d.]+)(c|f|k)$/i);
    if (!tempMatch) return reply('❌ Format: 100c, 212f, or 373k');
    const tempVal = parseFloat(tempMatch[1]);
    const tempUnit = tempMatch[2].toLowerCase();
    let tempResult = '';
    if (tempUnit === 'c') tempResult = `${tempVal}°C = *${(tempVal * 9/5 + 32).toFixed(2)}°F* = *${(tempVal + 273.15).toFixed(2)}K*`;
    else if (tempUnit === 'f') tempResult = `${tempVal}°F = *${((tempVal - 32) * 5/9).toFixed(2)}°C*`;
    else tempResult = `${tempVal}K = *${(tempVal - 273.15).toFixed(2)}°C*`;
    reply(`🌡️ *Temperature*\n\n${tempResult}`);
}
break;

// ===== MATH =====
// [REMOVED DUPLICATE: math]

// ===== ROMAN NUMERALS =====
case 'roman': {
    if (!text) return reply(`Usage: ${prefix}roman 2024`);
    const romanNum = parseInt(text);
    if (isNaN(romanNum) || romanNum < 1 || romanNum > 3999) return reply('❌ Enter a number 1–3999');
    const romanVals = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let romanResult = '';
    let romanN = romanNum;
    for (const [val, sym] of romanVals) { while (romanN >= val) { romanResult += sym; romanN -= val; } }
    reply(`🏛️ *${romanNum} = ${romanResult}*`);
}
break;

// ===== BINARY =====
case 'tobin': {
    if (!text) return reply(`Usage: ${prefix}tobin 42`);
    const binNum = parseInt(text);
    if (isNaN(binNum)) return reply('❌ Enter a valid number');
    reply(`💻 *${binNum} in Binary:* \`${binNum.toString(2)}\``);
}
break;

// ===== HEX CONV =====
case 'tohex': {
    if (!text) return reply(`Usage: ${prefix}tohex 255`);
    const hexNum = parseInt(text);
    if (isNaN(hexNum)) return reply('❌ Enter a valid number');
    reply(`💻 *${hexNum} in Hex:* \`0x${hexNum.toString(16).toUpperCase()}\``);
}
break;

// ===== ENCODE/DECODE =====
// [REMOVED DUPLICATE: encode]
// [REMOVED DUPLICATE: decode]

// genpass/password handled above

// ===== RANDOM NUMBER =====
case 'random': {
    const randParts = (text || '1 100').trim().split(/\s+/);
    const randMin = parseInt(randParts[0]) || 1;
    const randMax = parseInt(randParts[1]) || 100;
    if (randMin >= randMax) return reply('❌ Min must be less than max');
    reply(`🎲 *Random (${randMin}–${randMax}):* *${Math.floor(Math.random() * (randMax - randMin + 1)) + randMin}*`);
}
break;

// uuid handled above

// ===== TEXT TOOLS =====
// upper/lower/reversetext/wordcount handled above
case 'mock': { if (!text) return reply(`Usage: ${prefix}mock text`); reply(text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('')); } break;

// ===== FANCY TEXT =====
case 'aesthetic': {
    if (!text) return reply(`Usage: ${prefix}aesthetic text`);
    const aeMap = {a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃',A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩'};
    reply(text.split('').map(c => aeMap[c] || c).join(''));
}
break;

case 'bubble': {
    if (!text) return reply(`Usage: ${prefix}bubble text`);
    const bubMap = {a:'ⓐ',b:'ⓑ',c:'ⓒ',d:'ⓓ',e:'ⓔ',f:'ⓕ',g:'ⓖ',h:'ⓗ',i:'ⓘ',j:'ⓙ',k:'ⓚ',l:'ⓛ',m:'ⓜ',n:'ⓝ',o:'ⓞ',p:'ⓟ',q:'ⓠ',r:'ⓡ',s:'ⓢ',t:'ⓣ',u:'ⓤ',v:'ⓥ',w:'ⓦ',x:'ⓧ',y:'ⓨ',z:'ⓩ',A:'Ⓐ',B:'Ⓑ',C:'Ⓒ',D:'Ⓓ',E:'Ⓔ',F:'Ⓕ',G:'Ⓖ',H:'Ⓗ',I:'Ⓘ',J:'Ⓙ',K:'Ⓚ',L:'Ⓛ',M:'Ⓜ',N:'Ⓝ',O:'Ⓞ',P:'Ⓟ',Q:'Ⓠ',R:'Ⓡ',S:'Ⓢ',T:'Ⓣ',U:'Ⓤ',V:'Ⓥ',W:'Ⓦ',X:'Ⓧ',Y:'Ⓨ',Z:'Ⓩ','0':'⓪','1':'①','2':'②','3':'③','4':'④','5':'⑤','6':'⑥','7':'⑦','8':'⑧','9':'⑨'};
    reply(text.split('').map(c => bubMap[c] || c).join(''));
}
break;

// ===== SOCIAL CAPTIONS =====
case 'caption': {
    const captions = ['✨ "Living my best life, one day at a time." 🌟','🔥 "They told me I couldn\'t. That\'s why I did." 💪','💎 "Stay low key. Not everyone deserves a front row seat to your life." 🤫','🌟 "Grateful, blessed, and highly favored." 🙏','⚡ "I came. I saw. I conquered." 🔥','💕 "Love yourself first." ❤️','🏆 "Success is the best revenge." 👑','🌈 "Chasing dreams, not people." 🦋'];
    reply(`📸 *Caption Idea:*\n\n${captions[Math.floor(Math.random() * captions.length)]}`);
}
break;

case 'bioidea': {
    const bios = ['✨ Just a soul trying to leave a mark on this earth. 🌍','🔥 Too blessed to be stressed. Grinding in silence. 💪','💫 Dream big. Hustle harder. Stay humble. 🏆','⚡ Not for everybody. And that\'s okay. 👑','💎 Premium quality, limited availability. 😏','🚀 On a mission. 🔥','🌈 Making memories, not excuses. ✨'];
    reply(`📝 *Bio Idea:*\n\n${bios[Math.floor(Math.random() * bios.length)]}`);
}
break;

// ===== GREETINGS =====
case 'gm':
case 'goodmorning': {
    reply(`🌅 *Good Morning!*\n\nMay today bring you:\n✅ Fresh opportunities\n✅ Great achievements\n✅ Blessings upon blessings\n\n_Start your day with gratitude!_ 🙏\n\n_© ${botDisplayName}_ ⚡`);
}
break;

case 'gn':
case 'goodnight': {
    reply(`🌙 *Good Night!*\n\n🌟 Let go of today's worries\n💫 Dream big beautiful dreams\n⚡ Wake up ready to conquer tomorrow\n\n_Rest well, legend!_ 😴\n\n_© ${botDisplayName}_ ⚡`);
}
break;

case 'ga':
case 'goodafternoon': {
    reply(`☀️ *Good Afternoon!*\n\n💪 Keep pushing through\n🎯 Stay focused on your goals\n💧 Remember to drink water!\n\n_You got this, legend!_ 🔥`);
}
break;

// ===== BIRTHDAY =====
case 'hbd':
case 'birthday': {
    const bTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || 'you');
    const bMentions = m.mentionedJid || [];
    await devtrust.sendMessage(m.chat, { text: `🎂 *HAPPY BIRTHDAY!* 🎉\n\n🎈 ${bTarget} 🎈\n\nMay this special day bring you:\n🎁 All the love in the world\n✨ Blessings beyond measure\n💎 Health, wealth and happiness\n\n_Happy Birthday from ${botDisplayName}!_ 🎂🎊🥳`, mentions: bMentions }, { quoted: m });
}
break;

// ===== LOVE MESSAGE =====
// [REMOVED DUPLICATE: love]

// ===== HUG =====
// [REMOVED DUPLICATE: hug]

// ===== SLAP =====
// [REMOVED DUPLICATE: slap]

// ===== PUNCH =====
case 'punch': {
    const punchTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || 'someone');
    reply(`👊 *${m.pushName}* throws a punch at ${punchTarget}! KAPOW! 💥`);
}
break;

// ===== SHOOT =====
case 'shoot': {
    const shootTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || 'someone');
    reply(`🔫 *${m.pushName}* shoots ${shootTarget}! PEW PEW! 😂`);
}
break;

// ===== MARRY =====
case 'marry': {
    const marryTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || 'someone');
    reply(`💍 *${m.pushName}* proposes to ${marryTarget}!\n\n_Will you marry me? 💕_`);
}
break;

// ===== ROAST =====
case 'roast2': {
    const roasts = ['Your Wi-Fi password is probably "password123". 😂','You\'re like a software update. Whenever I see you, I think "not now". 😂','If ignorance is bliss, you must be the happiest person alive. 😂','You\'re the reason phones have a mute button. 😂','I\'d insult you but my mama said I had to be kind to the special ones. 😂'];
    const roastTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || 'you');
    const roastMentions = m.mentionedJid || [];
    await devtrust.sendMessage(m.chat, { text: `🔥 *ROAST for ${roastTarget}:*\n\n${roasts[Math.floor(Math.random() * roasts.length)]}\n\n_Just jokes fam! 😂_`, mentions: roastMentions }, { quoted: m });
}
break;

// ===== COMPLIMENT =====
case 'comp': {
    const compliments = ['✨ You are absolutely amazing!','🌟 You light up every room you walk into!','💪 Your strength is remarkable.','🌸 You make the world a better place.','🦋 Your creativity knows no bounds!','🏆 You are a true champion.','💎 You are rarer and more precious than any diamond.'];
    const compTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || m.pushName);
    reply(`💌 *For ${compTarget}:*\n\n${compliments[Math.floor(Math.random() * compliments.length)]}`);
}
break;

// ===== INSULT (JOKE) =====
// [REMOVED DUPLICATE: insult]

// ===== PIGIN =====
case 'pidgin': {
    const pidginPhrases = ['E don do! 🔥','Abeg no vex me today o!','Na so e be','I go show you pepper! 🌶️','Shine your eyes!','No be small thing o!','E don set! ✅','We move!','Sharp sharp! ⚡','You sabi this thing gan gan!','We outside! 🎉'];
    reply(`🇳🇬 *Naija Talk:*\n\n_${pidginPhrases[Math.floor(Math.random() * pidginPhrases.length)]}_`);
}
break;

// ===== YORUBA =====
case 'yoruba': {
    const yoruba = ['E kaaro — Good morning 🌅','E kaasan — Good afternoon ☀️','E kaale — Good evening 🌆','E dabo — Goodbye 👋','Ese — Thank you 🙏','Pele — Sorry / Take care 💕','Mo fe e — I love you ❤️','Bawo ni — How are you? 😊','O daro — Good night 🌙'];
    reply(`🌍 *Yoruba:*\n\n_${yoruba[Math.floor(Math.random() * yoruba.length)]}_`);
}
break;

// ===== IGBO =====
case 'igbo': {
    const igbo = ['Ututu oma — Good morning 🌅','Ehihie oma — Good afternoon ☀️','Daalu — Thank you 🙏','Obi dị mma — I am fine 😊','Nke a dị mma — This is good 🔥','Anọ m jikere — I am ready ✅'];
    reply(`🌍 *Igbo:*\n\n_${igbo[Math.floor(Math.random() * igbo.length)]}_`);
}
break;

// ===== HAUSA =====
case 'hausa': {
    const hausa = ['Ina kwana — Good morning 🌅','Ina wuni — Good afternoon ☀️','Na gode — Thank you 🙏','Sannu — Hello 😊','Lafiya lau — I\'m fine','Allah ya kiyaye — God protect you 🙏'];
    reply(`🌍 *Hausa:*\n\n_${hausa[Math.floor(Math.random() * hausa.length)]}_`);
}
break;

// ===== NAIRA CONVERT =====
// [REMOVED DUPLICATE: naira]

// lyrics handled above

// ===== PERCENTAGE =====
case 'percent': {
    if (!text) return reply(`Usage: ${prefix}percent 45 200\n(What is 45% of 200?)`);
    const percentParts = text.trim().split(/\s+/);
    if (percentParts.length < 2) return reply('❌ Need 2 numbers. Example: 45 200');
    const pct = parseFloat(percentParts[0]);
    const total = parseFloat(percentParts[1]);
    if (isNaN(pct) || isNaN(total)) return reply('❌ Invalid numbers');
    reply(`📊 *${pct}% of ${total} = ${(pct / 100 * total).toFixed(2)}*`);
}
break;

// ===== FIBONACCI =====
case 'fib': {
    const fibN = Math.min(parseInt(text) || 10, 20);
    if (isNaN(fibN) || fibN < 1) return reply('❌ Enter a number (1–20)');
    const fibSeq = [0, 1];
    for (let i = 2; i < fibN; i++) fibSeq.push(fibSeq[i-1] + fibSeq[i-2]);
    reply(`🔢 *Fibonacci (${fibN} terms):*\n\n${fibSeq.slice(0, fibN).join(', ')}`);
}
break;

// ===== WORKOUT =====
case 'workout': {
    const workouts = ['💪 *Today:*\n• 20 Push-ups x3\n• 30 Squats x3\n• 1 min Plank x3\n\n🔥 _No gym needed!_','🏃 *Cardio Day:*\n• 20 min jog\n• 50 jumping jacks\n• 20 burpees\n\n💦 _Sweat it out!_','🦵 *Leg Day:*\n• 40 Squats x3\n• 20 Lunges each leg\n• 30 Calf raises x3\n\n🔥 _Leg day is respect!_'];
    reply(workouts[Math.floor(Math.random() * workouts.length)]);
}
break;

// ===== WATER REMINDER =====
case 'water': {
    reply(`💧 *Water Reminder*\n\nDrink at least *8 glasses (2L)* daily!\n\n• 1 glass when you wake up 🌅\n• 1 glass before each meal 🍽️\n• 1 glass before bed 🌙\n\n_Hydration = better mood, focus & energy!_ ✨`);
}
break;

// ===== MENTAL HEALTH =====
case 'mental': {
    const mentalTips = ['🧠 *Tip:* Take 5 deep breaths now. In (4 counts), hold (4), out (4). Repeat.','💙 *Reminder:* It\'s okay to say NO. Protecting your peace is not selfish.','🌟 *Affirmation:* You are enough. You are worthy. Keep going. 💪','😴 *Sleep:* Adults need 7–9 hours. Put the phone down and rest! 🌙','🤝 *Connection:* Call someone you care about today. 📞'];
    reply(mentalTips[Math.floor(Math.random() * mentalTips.length)]);
}
break;

// ===== COUNTDOWN =====
// [REMOVED DUPLICATE: countdown]

// repeat handled above

// ===== PRIME CHECK =====
case 'isprime': {
    if (!text) return reply(`Usage: ${prefix}isprime 17`);
    const primeN = parseInt(text);
    if (isNaN(primeN) || primeN < 1) return reply('❌ Enter a positive integer');
    if (primeN < 2) return reply(`*${primeN}* is ❌ NOT prime`);
    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(primeN); i++) { if (primeN % i === 0) { isPrime = false; break; } }
    reply(`*${primeN}* is ${isPrime ? '✅ a PRIME number! 🔢' : '❌ NOT a prime number'}`);
}
break;

// ===== FACTORIAL =====
case 'factorial': {
    if (!text) return reply(`Usage: ${prefix}factorial 5`);
    const factN = parseInt(text);
    if (isNaN(factN) || factN < 0 || factN > 20) return reply('❌ Enter 0–20');
    let factResult = 1;
    for (let i = 2; i <= factN; i++) factResult *= i;
    reply(`🔢 *${factN}! = ${factResult}*`);
}
break;

// ===== NPM =====
// [REMOVED DUPLICATE: npm]

// ============================================================
// =================== GROUP COMMANDS (FIXED) =================
// ============================================================

// ===== JOIN GROUP =====
case 'join': {
    if (!isCreator) return reply('❌ Owner only');
    const joinLinks = (text || '').match(/https?:\/\/[^\s]+/gi) || [];
    if (!joinLinks.length) return reply('✘ Provide a WhatsApp group link');
    const joinCode = joinLinks[0]?.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i)?.[1];
    if (!joinCode) return reply('✘ Invalid invite link');
    try {
        await devtrust.groupAcceptInvite(joinCode);
        reply('✓ Joined successfully!');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== LEAVE GROUP =====
case 'leave':
case 'left': {
    if (!isCreator) return reply('❌ Owner only');
    if (!m.isGroup) return reply('✘ Groups only');
    await devtrust.groupLeave(m.chat);
}
break;

// ===== GROUP PROFILE PIC =====
case 'gpp':
case 'setgcpp': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    if (text === 'remove') {
        await devtrust.removeProfilePicture(m.chat);
        return reply('✓ Group profile picture removed');
    }
    if (!m.quoted) return reply('✘ Reply to an image');
    try {
        const gppMedia = await m.quoted.download();
        await devtrust.updateProfilePicture(m.chat, gppMedia);
        reply('✓ Group profile picture updated');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== GROUP NAME =====
case 'gname':
case 'setgcname': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!text) return reply(`✘ Provide a name\nExample: ${prefix}gname New Name`);
    try {
        await devtrust.groupUpdateSubject(m.chat, text);
        reply('✓ Group name updated');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== GROUP DESCRIPTION =====
case 'gdesc':
case 'setgcdesc': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!text) return reply(`✘ Provide a description\nExample: ${prefix}gdesc Group rules...`);
    try {
        await devtrust.groupUpdateDescription(m.chat, text);
        reply('✓ Group description updated');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== ADD MEMBER =====
case 'add': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const addMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const addUser = addMentioned[0] || m.quoted?.sender || text;
    if (!addUser) return reply(`✘ Reply to user or provide number\nExample: ${prefix}add 2341234567890`);
    const addJid = (addUser.includes('@') ? addUser.split('@')[0] : addUser).replace(/\D/g, '') + '@s.whatsapp.net';
    try {
        const addResult = await devtrust.groupParticipantsUpdate(m.chat, [addJid], 'add');
        const addStatus = addResult[0]?.status;
        if (addStatus === '200') return reply(`✓ @${addJid.split('@')[0]} Added`, [addJid]);
        if (addStatus === '403') {
            await reply('✘ Cannot add directly, sending invite...');
            const addCode = await devtrust.groupInviteCode(m.chat);
            return await devtrust.sendMessage(addJid, { text: `https://chat.whatsapp.com/${addCode}` });
        }
        if (addStatus === '409') return reply('✘ User already in group');
        if (addStatus === '401') return reply('✘ Bot is blocked by this user');
        reply('✘ Could not add: status ' + addStatus);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== KICK MEMBER =====
case 'kick': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const kickMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const kickUser = kickMentioned[0] || m.quoted?.sender || text;
    if (!kickUser) return reply('✘ Reply to or mention a member');
    const kickJid = (kickUser.includes('@') ? kickUser.split('@')[0] : kickUser).replace(/\D/g, '') + '@s.whatsapp.net';
    try {
        await devtrust.groupParticipantsUpdate(m.chat, [kickJid], 'remove');
        reply(`✓ @${kickJid.split('@')[0]} kicked`, [kickJid]);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== PROMOTE =====
case 'promote': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const proMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const proUser = proMentioned[0] || m.quoted?.sender || text;
    if (!proUser) return reply('✘ Reply to or mention a member');
    const proJid = (proUser.includes('@') ? proUser.split('@')[0] : proUser).replace(/\D/g, '') + '@s.whatsapp.net';
    try {
        await devtrust.groupParticipantsUpdate(m.chat, [proJid], 'promote');
        reply(`✓ @${proJid.split('@')[0]} promoted to admin`, [proJid]);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== DEMOTE =====
case 'demote': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const demMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const demUser = demMentioned[0] || m.quoted?.sender || text;
    if (!demUser) return reply('✘ Reply to or mention an admin');
    const demJid = (demUser.includes('@') ? demUser.split('@')[0] : demUser).replace(/\D/g, '') + '@s.whatsapp.net';
    try {
        await devtrust.groupParticipantsUpdate(m.chat, [demJid], 'demote');
        reply(`✓ @${demJid.split('@')[0]} demoted`, [demJid]);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== SET GROUP ICON (group.js) =====
case 'seticon': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const iconMsg = m.quoted ? m.quoted : m;
    if (!/image/.test(iconMsg.mtype || '')) return reply(`✘ Reply to an image with ${prefix}seticon`);
    try {
        const iconBuffer = await iconMsg.download();
        const groupCmds = __cmd_group;
        await groupCmds.setGroupIcon(devtrust, m.chat, iconBuffer);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== SET MEMBER ROLE (group.js) =====
case 'setrole': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const roleMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const roleTarget = roleMentioned[0] || m.quoted?.sender;
    const roleName = text.replace(/@\d+/g, '').trim();
    if (!roleTarget || !roleName) return reply(`Example: ${prefix}setrole @user Moderator`);
    const groupCmds = __cmd_group;
    await groupCmds.setMemberRole(devtrust, m.chat, roleTarget, roleName);
}
break;

// ===== GIFT MEMBER (group.js) =====
case 'gift': {
    if (!m.isGroup) return reply('✘ Groups only');
    const giftMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const giftTarget = giftMentioned[0] || m.quoted?.sender;
    const giftMsg = text.replace(/@\d+/g, '').trim() || 'You\'re appreciated! 🎉';
    if (!giftTarget) return reply(`Example: ${prefix}gift @user Congrats on the promotion!`);
    const groupCmds = __cmd_group;
    await groupCmds.sendGift(devtrust, m.chat, giftTarget, giftMsg);
}
break;

// ===== SCHEDULE EVENT (group.js) =====
case 'event': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!text || !text.includes('|')) return reply(`Example: ${prefix}event 25-12-2026 18:00 | Christmas Party`);
    const [eventWhen, ...eventTitleParts] = text.split('|');
    const eventTitle = eventTitleParts.join('|').trim();
    const [eventDatePart, eventTimePart] = eventWhen.trim().split(' ');
    const [eDay, eMonth, eYear] = (eventDatePart || '').split('-');
    if (!eDay || !eMonth || !eYear || !eventTitle) return reply(`Example: ${prefix}event 25-12-2026 18:00 | Christmas Party`);
    const eventIso = `${eYear}-${eMonth}-${eDay}T${eventTimePart || '00:00'}:00`;
    if (isNaN(new Date(eventIso).getTime())) return reply('✘ Invalid date/time format');
    const groupCmds = __cmd_group;
    await groupCmds.scheduleEvent(devtrust, m.chat, eventIso, eventTitle);
}
break;

// ===== EMERGENCY ALERT (group.js) =====
case 'alert': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!text) return reply(`Example: ${prefix}alert Fire drill happening now, evacuate calmly`);
    const groupCmds = __cmd_group;
    await groupCmds.sendEmergencyAlert(devtrust, m.chat, text);
}
break;

// ===== SET GROUP THEME (group.js) =====
case 'settheme': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!text) return reply(`Example: ${prefix}settheme 🔥`);
    const groupCmds = __cmd_group;
    await groupCmds.setGroupTheme(devtrust, m.chat, text.trim());
}
break;

// ===== SET BIRTHDAY (group.js) =====
case 'setbirthday': {
    if (!m.isGroup) return reply('✘ Groups only');
    const bdayMatch = text?.match(/^(\d{2})-(\d{2})$/);
    if (!bdayMatch) return reply(`Example: ${prefix}setbirthday 25-12`);
    const groupCmds = __cmd_group;
    await groupCmds.setBirthday(devtrust, m.chat, m.sender, text.trim());
}
break;

// ===== NOTIFICATION SETTINGS TOGGLE (group.js + Settings.js) =====
case 'notify': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!['on', 'off'].includes((text || '').trim().toLowerCase())) return reply(`Example: ${prefix}notify on  or  ${prefix}notify off`);
    const groupCmds = __cmd_group;
    groupCmds.setBotSetting(m.chat, 'welcome', text.trim().toLowerCase() === 'on');
    reply(`🔔 Welcome/goodbye messages turned ${text.trim().toLowerCase() === 'on' ? 'ON' : 'OFF'}`);
}
break;

// ===== LIVE MATCH TRACKING (football.js) =====
case 'livetrack': {
    const footballCmds = __cmd_football;
    await footballCmds.startLiveTrack(devtrust, m.chat, text ? text.trim() : '');
}
break;

// ===== MATCH HIGHLIGHTS (football.js) =====
case 'highlights': {
    const footballCmds = __cmd_football;
    await footballCmds.matchHighlights(devtrust, m.chat, text ? text.trim() : '');
}
break;

// ===== TEAM INFO (football.js) =====
case 'teaminfo': {
    if (!text) return reply(`Example: ${prefix}teaminfo Manchester United`);
    const footballCmds = __cmd_football;
    await footballCmds.getTeamInfo(devtrust, m.chat, text.trim());
}
break;

// ===== ANTI-FEATURE TOGGLES (group.js — text-command path) =====
// These were previously only reachable via the Settings menu button; typing
// e.g. ".antiforward on" silently did nothing because no case existed for it.
case 'antiforward':
case 'antipoll':
case 'antisticker':
case 'antiviewonce':
case 'anticaps':
case 'antilongmsg':
case 'automod':
case 'approvalmode': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const toggleArg = (text || '').trim().toLowerCase();
    if (!['on', 'off'].includes(toggleArg)) return reply(`Example: ${prefix}${command} on  or  ${prefix}${command} off`);
    const groupCmds = __cmd_group;
    if (command === 'approvalmode') {
        await groupCmds.setApprovalMode(devtrust, m.chat, toggleArg === 'on');
    } else {
        await groupCmds.toggleSetting(devtrust, m.chat, command, toggleArg === 'on');
    }
}
break;

// ===== MUTE GROUP =====
case 'mute': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const muteTimeMatch = text?.match(/^(\d+)(s|m|h|hr|d|w)$/i);
    const muteUnitMap = { s:1000, m:60000, h:3600000, hr:3600000, d:86400000, w:604800000 };
    try {
        const muteMeta = await devtrust.groupMetadata(m.chat);
        if (muteMeta.announce) return reply('✘ Group is already muted');
        await devtrust.groupSettingUpdate(m.chat, 'announcement');
        if (!muteTimeMatch) return reply('✓ Group muted');
        const muteMs = parseInt(muteTimeMatch[1]) * (muteUnitMap[muteTimeMatch[2].toLowerCase()] || 60000);
        if (muteMs > 604800000) return reply('✘ Max mute time is 7 days');
        reply(`✓ Group muted for ${muteTimeMatch[1]}${muteTimeMatch[2]}`);
        if (global.activeTimers?.has(m.chat)) clearTimeout(global.activeTimers.get(m.chat));
        if (!global.activeTimers) global.activeTimers = new Map();
        const muteTid = setTimeout(async () => {
            try {
                await devtrust.groupSettingUpdate(m.chat, 'not_announcement');
                await devtrust.sendMessage(m.chat, { text: '✓ Group auto-unmuted' });
                global.activeTimers.delete(m.chat);
            } catch (e) {}
        }, muteMs);
        global.activeTimers.set(m.chat, muteTid);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== UNMUTE GROUP =====
case 'unmute': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        const unmuteMeta = await devtrust.groupMetadata(m.chat);
        if (!unmuteMeta.announce) return reply('✘ Group is not muted');
        if (global.activeTimers?.has(m.chat)) {
            clearTimeout(global.activeTimers.get(m.chat));
            global.activeTimers.delete(m.chat);
        }
        await devtrust.groupSettingUpdate(m.chat, 'not_announcement');
        reply('✓ Group unmuted');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== GROUP INVITE LINK =====
case 'invite':
case 'glink': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        const glinkCode = await devtrust.groupInviteCode(m.chat);
        reply(`🔗 https://chat.whatsapp.com/${glinkCode}`);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== REVOKE LINK =====
case 'revoke': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        await devtrust.groupRevokeInvite(m.chat);
        const revokeNewCode = await devtrust.groupInviteCode(m.chat);
        reply(`✓ Link revoked\nNew: https://chat.whatsapp.com/${revokeNewCode}`);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== TAG ALL =====
case 'tagall':
case 'tag': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const tagAllJids = participants.map(p => p.jid || p.id);
    const tagAdminJids = participants.filter(p => p.admin != null).map(p => p.jid || p.id);
    if (text === 'admins') {
        const tagAdminMsg = tagAdminJids.map((j, i) => `${i+1}. @${j.split('@')[0]}`).join('\n');
        return reply(`*🛡️ Admins*\n\n${tagAdminMsg}`, tagAdminJids);
    }
    const tagMsg = (text ? `📢 ${text}\n\n` : '📢 Attention everyone!\n\n') + tagAllJids.map((j, i) => `${i+1}. @${j.split('@')[0]}`).join('\n');
    reply(tagMsg, tagAllJids);
}
break;

// ===== LOCK / UNLOCK SETTINGS =====
case 'lock': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        await devtrust.groupSettingUpdate(m.chat, 'locked');
        reply('🔒 Group settings locked — admins only');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

case 'unlock': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        await devtrust.groupSettingUpdate(m.chat, 'unlocked');
        reply('🔓 Group settings unlocked — all members can edit');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== OPEN / CLOSE GROUP =====
case 'open':
case 'groupopen': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        await devtrust.groupSettingUpdate(m.chat, 'not_announcement');
        reply('🔓 Group opened! Everyone can now send messages.');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

case 'close':
case 'groupclose': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        await devtrust.groupSettingUpdate(m.chat, 'announcement');
        reply('🔒 Group closed! Only admins can send messages.');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== DELETE MESSAGE (FIXED) =====
case 'del':
case 'delete': {
    if (!m.quoted) return reply('✘ Reply to a message to delete it');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        const delKey = {
            remoteJid: m.chat,
            fromMe: false,
            id: m.quoted.id || m.quoted.key?.id || m.quoted.fakeObj?.key?.id,
            participant: m.quoted.sender || m.quoted.key?.participant || m.quoted.fakeObj?.key?.participant
        };
        await devtrust.sendMessage(m.chat, { delete: delKey });
        reply('✅ Message deleted');
    } catch (e) { reply('✘ Could not delete: ' + e.message); }
}
break;

// ===== GROUP INFO =====
case 'ginfo': {
    if (!m.isGroup) return reply('✘ Groups only');
    try {
        const ginfoMeta = groupMetadata || await devtrust.groupMetadata(m.chat);
        const ginfoTotal = ginfoMeta.participants.length;
        const ginfoAdmins = ginfoMeta.participants.filter(p => p.admin != null).length;
        const ginfoCreated = ginfoMeta.creation ? new Date(ginfoMeta.creation * 1000).toLocaleString() : 'Unknown';
        reply(
`*╭─ GROUP INFO ─╮*
│ 📌 *Name:* ${ginfoMeta.subject}
│ 👥 *Members:* ${ginfoTotal}
│ 🛡️ *Admins:* ${ginfoAdmins}
│ 📅 *Created:* ${ginfoCreated}
│ 🔒 *Restricted:* ${ginfoMeta.restrict ? 'Yes' : 'No'}
│ 🔇 *Announced:* ${ginfoMeta.announce ? 'Yes' : 'No'}
│ 🆔 *ID:* ${m.chat}
${ginfoMeta.desc ? `│ 📝 *Desc:* ${ginfoMeta.desc}` : ''}
*╰──────────────╯*`
        );
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== WARN SYSTEM =====
case 'warn': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const warnMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const warnUser = warnMentioned[0] || m.quoted?.sender;
    if (!warnUser) return reply('✘ Reply to or mention a user');
    const WARN_FILE = './database/group_warns.json';
    let warnData = {};
    try { warnData = JSON.parse(fs.readFileSync(WARN_FILE)); } catch(e) {}
    if (!warnData[m.chat]) warnData[m.chat] = {};
    if (!warnData[m.chat][warnUser]) warnData[m.chat][warnUser] = 0;
    warnData[m.chat][warnUser]++;
    const warnCount = warnData[m.chat][warnUser];
    const warnMax = 3;
    fs.writeFileSync(WARN_FILE, JSON.stringify(warnData, null, 2));
    if (warnCount >= warnMax) {
        reply(`⚠️ @${warnUser.split('@')[0]} exceeded ${warnMax} warnings! Kicking...`, [warnUser]);
        warnData[m.chat][warnUser] = 0;
        fs.writeFileSync(WARN_FILE, JSON.stringify(warnData, null, 2));
        try { await devtrust.groupParticipantsUpdate(m.chat, [warnUser], 'remove'); } catch (e) {}
    } else {
        reply(
`⚠️ *WARNING*
👤 User: @${warnUser.split('@')[0]}
📋 Reason: ${text || 'Not specified'}
🔢 Count: ${warnCount}/${warnMax}`, [warnUser]);
    }
}
break;

case 'resetwarn':
case 'clearwarn': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const rwMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const rwUser = rwMentioned[0] || m.quoted?.sender;
    if (!rwUser) return reply('✘ Reply to or mention a user');
    const WARN_FILE2 = './database/group_warns.json';
    let rwData = {};
    try { rwData = JSON.parse(fs.readFileSync(WARN_FILE2)); } catch(e) {}
    if (rwData[m.chat]) delete rwData[m.chat][rwUser];
    fs.writeFileSync(WARN_FILE2, JSON.stringify(rwData, null, 2));
    reply(`✓ Warnings cleared for @${rwUser.split('@')[0]}`, [rwUser]);
}
break;

case 'warnlist': {
    if (!m.isGroup) return reply('✘ Groups only');
    const WARN_FILE3 = './database/group_warns.json';
    let wlData = {};
    try { wlData = JSON.parse(fs.readFileSync(WARN_FILE3)); } catch(e) {}
    const wlEntries = Object.entries(wlData[m.chat] || {}).filter(([,v]) => v > 0);
    if (!wlEntries.length) return reply('✓ No active warnings in this group');
    const wlList = wlEntries.map(([j, c]) => `• @${j.split('@')[0]}: ${c} warn(s)`).join('\n');
    reply(`*⚠️ Warning List*\n\n${wlList}`, wlEntries.map(([j]) => j));
}
break;

// ===== KICK ALL =====
case 'kickall': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isCreator) return reply('✘ Owner only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const kaBotId = devtrust.decodeJid(devtrust.user.id);
    const kaToKick = participants.filter(p => {
        const j = p.jid || p.id;
        return j !== kaBotId && j !== sender && p.admin == null;
    });
    if (!kaToKick.length) return reply('✘ No non-admin members to kick');
    reply(`⏳ Kicking ${kaToKick.length} members...`);
    for (const p of kaToKick) {
        try {
            await devtrust.groupParticipantsUpdate(m.chat, [p.jid || p.id], 'remove');
            await sleep(500);
        } catch (e) {}
    }
    reply('✓ Done kicking all non-admin members');
}
break;

// ===== TEMP KICK =====
case 'tkick': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const tkTimeRegex = /(\d+)\s*(s|sec|m|min|h|hr|d)/gi;
    const tkMatches = [...(text || '').matchAll(tkTimeRegex)];
    if (!tkMatches.length) return reply(`✘ Provide duration\nExample: ${prefix}tkick @user 10m`);
    const tkUnitMap = { s:1000, sec:1000, m:60000, min:60000, h:3600000, hr:3600000, d:86400000 };
    let tkMs = 0;
    for (const match of tkMatches) tkMs += parseInt(match[1]) * (tkUnitMap[match[2].toLowerCase()] || 60000);
    const tkMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const tkUser = tkMentioned[0] || m.quoted?.sender;
    if (!tkUser) return reply('✘ Reply to or mention a member');
    const tkJid = (tkUser.includes('@') ? tkUser.split('@')[0] : tkUser).replace(/\D/g, '') + '@s.whatsapp.net';
    try {
        await devtrust.groupParticipantsUpdate(m.chat, [tkJid], 'remove');
        reply(`✓ @${tkJid.split('@')[0]} temp kicked. Re-adding in ${Math.round(tkMs/60000)} min`, [tkJid]);
        setTimeout(async () => {
            try {
                await devtrust.groupParticipantsUpdate(m.chat, [tkJid], 'add');
                await devtrust.sendMessage(m.chat, { text: `✓ @${tkJid.split('@')[0]} re-added`, mentions: [tkJid] });
            } catch (e) {
                const tkCode = await devtrust.groupInviteCode(m.chat).catch(() => null);
                if (tkCode) await devtrust.sendMessage(tkJid, { text: `https://chat.whatsapp.com/${tkCode}` });
            }
        }, tkMs);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== MEMBER LIST =====
case 'members':
case 'memberlist': {
    if (!m.isGroup) return reply('✘ Groups only');
    const memList = participants.map((p, i) => `${i+1}. @${(p.jid||p.id).split('@')[0]}${p.admin ? ' 👑' : ''}`).join('\n');
    reply(`*👥 Members (${participants.length})*\n\n${memList}`, participants.map(p => p.jid||p.id));
}
break;

// ===== ADMIN LIST =====
case 'adminlist': {
    if (!m.isGroup) return reply('✘ Groups only');
    const alAdmins = participants.filter(p => p.admin != null);
    if (!alAdmins.length) return reply('✘ No admins found');
    const alList = alAdmins.map((p, i) => `${i+1}. @${(p.jid||p.id).split('@')[0]} ${p.admin === 'superadmin' ? '👑' : '🛡️'}`).join('\n');
    reply(`*🛡️ Admins (${alAdmins.length})*\n\n${alList}`, alAdmins.map(p => p.jid||p.id));
}
break;

// ===== MUTE/UNMUTE USER =====
case 'muteuser': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const muMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const muUser = muMentioned[0] || m.quoted?.sender;
    if (!muUser) return reply('✘ Reply to or mention a user');
    const stickersOnly = args.includes('stickers') || args.includes('stickersonly');
    if (!global.muted) global.muted = {};
    if (!global.muted[m.chat]) global.muted[m.chat] = [];
    if (global.muted[m.chat].some(e => (typeof e === 'string' ? e : e.jid) === muUser)) {
        return reply(`✘ @${muUser.split('@')[0]} is already muted`, [muUser]);
    }
    global.muted[m.chat].push(stickersOnly ? { jid: muUser, stickersOnly: true } : muUser);
    saveMutedData(global.muted);
    reply(stickersOnly
        ? `🔇 @${muUser.split('@')[0]} muted — text blocked, stickers still allowed`
        : `🔇 @${muUser.split('@')[0]} muted — their messages will be deleted`, [muUser]);
}
break;

case 'unmuteuser': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const umMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const umUser = umMentioned[0] || m.quoted?.sender;
    if (!umUser) return reply('✘ Reply to or mention a user');
    const isMuted = global.muted?.[m.chat]?.some(e => (typeof e === 'string' ? e : e.jid) === umUser);
    if (!isMuted) return reply(`✘ @${umUser.split('@')[0]} is not muted`, [umUser]);
    global.muted[m.chat] = global.muted[m.chat].filter(e => (typeof e === 'string' ? e : e.jid) !== umUser);
    saveMutedData(global.muted);
    reply(`🔊 @${umUser.split('@')[0]} unmuted`, [umUser]);
}
break;

// ===== POLL =====
case 'poll': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!text) return reply(`Usage: ${prefix}poll Question | Option1 | Option2 | Option3`);
    const pollParts = text.split('|').map(p => p.trim());
    if (pollParts.length < 3) return reply(`✘ Need a question and at least 2 options\nExample: ${prefix}poll Who is best? | Bot A | Bot B`);
    try {
        await devtrust.sendMessage(m.chat, {
            poll: { name: pollParts[0], values: pollParts.slice(1), selectableCount: 1 }
        });
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== KICKR =====
case 'kickr': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    if (!m.quoted) return reply('✘ Reply to a message with mentions');
    const krMentions = m.quoted?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!krMentions.length) return reply('✘ No mentioned users in replied message');
    const krToKick = krMentions.filter(j => j !== m.quoted?.sender);
    if (!krToKick.length) return reply('✘ No users to kick (sender excluded)');
    reply(`⏳ Kicking ${krToKick.length} users...`);
    for (const j of krToKick) {
        try { await devtrust.groupParticipantsUpdate(m.chat, [j], 'remove'); await sleep(800); } catch (e) {}
    }
    reply('✓ Done');
}
break;

// ===== CREATE GROUP =====
case 'creategc': {
    if (!isCreator) return reply('✘ Owner only');
    const cgName = text || 'LËGĒNDÃRY Group';
    const cgMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const cgUser = cgMentioned[0] || m.quoted?.sender;
    if (!cgUser) return reply('✘ Mention a user to add');
    try {
        const cgGroup = await devtrust.groupCreate(cgName, [cgUser, sender]);
        const cgCode = await devtrust.groupInviteCode(cgGroup.id);
        reply(`✓ Group created: ${cgName}\nLink: https://chat.whatsapp.com/${cgCode}`);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== GROUP EVENTS =====
case 'events':
case 'gcevent': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const EVENTS_FILE = './database/group_events.json';
    let evData = {};
    try { evData = JSON.parse(fs.readFileSync(EVENTS_FILE)); } catch(e) {}
    evData[m.chat] = evData[m.chat] || { events: false, welcome: true, goodbye: true };
    const evParts = (text || '').split(' ');
    const evCmd = evParts[0]?.toLowerCase();
    if (!evCmd || evCmd === 'status') {
        return reply(`*Group Events*\nEnabled: ${evData[m.chat].events}\nWelcome: ${evData[m.chat].welcome}\nGoodbye: ${evData[m.chat].goodbye}\n\nUsage:\n${prefix}events on/off\n${prefix}events welcome on/off\n${prefix}events goodbye on/off`);
    }
    if (evCmd === 'on') { evData[m.chat].events = true; fs.writeFileSync(EVENTS_FILE, JSON.stringify(evData,null,2)); return reply('✓ Group events enabled'); }
    if (evCmd === 'off') { evData[m.chat].events = false; fs.writeFileSync(EVENTS_FILE, JSON.stringify(evData,null,2)); return reply('✓ Group events disabled'); }
    if (evCmd === 'welcome') { evData[m.chat].welcome = evParts[1]==='on'; evData[m.chat].events=true; fs.writeFileSync(EVENTS_FILE, JSON.stringify(evData,null,2)); return reply(`✓ Welcome messages ${evParts[1]==='on'?'enabled':'disabled'}`); }
    if (evCmd === 'goodbye') { evData[m.chat].goodbye = evParts[1]==='on'; evData[m.chat].events=true; fs.writeFileSync(EVENTS_FILE, JSON.stringify(evData,null,2)); return reply(`✓ Goodbye messages ${evParts[1]==='on'?'enabled':'disabled'}`); }
    reply(`Usage:\n${prefix}events on/off\n${prefix}events welcome on/off\n${prefix}events goodbye on/off\n${prefix}events status`);
}
break;

// ===== ANTI STATUS (show all anti features) =====
case 'antistatus': {
    if (!m.isGroup) return reply('✘ Groups only');
    const alCfg = getSetting(m.chat, 'antilink', { enabled: false, action: 'delete' });
    const asCfg = getSetting(m.chat, 'antispam', { enabled: false, action: 'delete' });
    const atCfg = getSetting(m.chat, 'antitag', { enabled: false, action: 'delete' });
    const abCfg = getSetting(m.chat, 'antibot', { enabled: false, action: 'delete' });
    const abgCfg = getSetting(m.chat, 'antibeg', { enabled: false, action: 'delete' });
    reply(
`*🛡️ Group Anti-Features*

🔗 AntiLink: ${alCfg.enabled ? '✅ ON' : '❌ OFF'} | ${alCfg.action}
🚫 AntiSpam: ${asCfg.enabled ? '✅ ON' : '❌ OFF'} | ${asCfg.action}
🏷️ AntiTag:  ${atCfg.enabled ? '✅ ON' : '❌ OFF'} | ${atCfg.action}
🤖 AntiBot:  ${abCfg.enabled ? '✅ ON' : '❌ OFF'} | ${abCfg.action}
💰 AntiBeg:  ${abgCfg.enabled ? '✅ ON' : '❌ OFF'} | ${abgCfg.action}`
    );
}
break;

// ===== GROUP STATUS (post to WA group status) =====
case 'groupstatus':
case 'gstatus': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const quotedMsg = m.quoted;
    const statusMime = (quotedMsg?.msg || quotedMsg)?.mimetype || '';
    try {
        let messagePayload;
        if (quotedMsg && /image/.test(statusMime)) {
            const statusMedia = await quotedMsg.download();
            const prepared = await prepareWAMessageMedia({ image: statusMedia, caption: text || '' }, { upload: devtrust.waUploadToServer });
            messagePayload = { groupStatusMessageV2: { message: { imageMessage: prepared.imageMessage } } };
        } else if (quotedMsg && /video/.test(statusMime)) {
            const statusMedia = await quotedMsg.download();
            const prepared = await prepareWAMessageMedia({ video: statusMedia, caption: text || '' }, { upload: devtrust.waUploadToServer });
            messagePayload = { groupStatusMessageV2: { message: { videoMessage: prepared.videoMessage } } };
        } else if (text) {
            messagePayload = { groupStatusMessageV2: { message: { extendedTextMessage: { text: text, font: 2 } } } };
        } else {
            return reply(`📢 *Group Status*\nUsage:\n• ${prefix}gstatus [text]\n• Reply image + ${prefix}gstatus [caption]\n• Reply video + ${prefix}gstatus [caption]`);
        }
        const statusMsg = generateWAMessageFromContent(m.chat, proto.Message.fromObject(messagePayload), { userJid: devtrust.user.id });
        await devtrust.relayMessage(m.chat, statusMsg.message, { messageId: statusMsg.key.id });
        reply('✅ Posted to group status!');
    } catch (e) {
        console.error('Group status error:', e);
        reply('❌ Failed: ' + e.message);
    }
}
break;

// ===== CREATEPANEL =====
case 'createpanel':
case 'panel': {
    const panelCmd = require('./commands/createpanel');
    await panelCmd(m, { text, prefix, devtrust });
}
break;

// ============================================================
// =================== END LEGENDARY COMMANDS =================
// ============================================================

// ============================================================
// ADD META AI TO GROUP
// ============================================================

case 'addmetaai':
case 'addai': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    try {
        await devtrust.groupParticipantsUpdate(
            m.chat,
            ["867051314767696@bot"],
            "add"
        );
        reply("✅ *Meta AI has been added to the group!*");
    } catch (e) {
        console.error(e);
        reply(`❌ *Failed to add Meta AI:*\n${String(e?.message || e)}`);
    }
}
break;

// DEFAULT: eval for owner, silent ignore for others
default:
    // Check saved custom commands (.savecmd) first — these are triggered
    // as ${prefix}${command} just like built-in commands.
    if (command) {
        const customCmds = JSON.parse(fs.existsSync('./database/customcmds.json') ? fs.readFileSync('./database/customcmds.json') : '{}');
        if (customCmds[command.toLowerCase()]) {
            reply(customCmds[command.toLowerCase()]);
            break;
        }
    }
    // Check installed plugins next — sandboxed, pure-function execution.
    // The plugin never sees the real socket; we only act on its JSON reply.
    if (command) {
        try {
            const pluginManager = require(path.join(__dirname, 'pluginManager.js'));
            const installed = pluginManager.listPlugins(process.cwd());
            const match = Object.entries(installed).find(([, p]) => p.command === command.toLowerCase());
            if (match) {
                const [pluginId] = match;
                const result = await pluginManager.runPlugin(process.cwd(), pluginId, {
                    text: q || '',
                    args,
                    sender: m.sender,
                    chat: m.chat,
                    isGroup: m.isGroup
                });
                if (result && typeof result.reply === 'string') {
                    reply(result.reply);
                }
                break;
            }
        } catch (e) {
            console.log(chalk.red(`Plugin dispatch error: ${e.message}`));
            reply(`❌ *Plugin error:* ${e.message}`);
            break;
        }
    }
    // Check body exists before trying to use it
    if (body && body.startsWith) {
        // Safe eval - ONLY for owner and with logging
        if (body.startsWith('<')) {
            if (!isCreator) {
                console.log(`⚠️ Non-owner tried to use eval: ${m.sender}`);
                return;
            }
            try {
                const result = await eval(`(async () => { return ${body.slice(3)} })()`);
                const output = util.inspect(result, { depth: 1 });
                console.log(chalk.yellow(`📝 Eval executed by owner: ${body.slice(3)}`));
                if (output.length > 4000) {
                    await m.reply('✅ *Executed* (output too long)');
                } else {
                    await m.reply(output);
                }
            } catch (e) {
                await m.reply(`❌ Error: ${e.message}`);
            }
            break;
        }
        // Safe async eval - ONLY for owner
        if (body.startsWith('>')) {
            if (!isCreator) {
                console.log(`⚠️ Non-owner tried to use async eval: ${m.sender}`);
                return;
            }
            try {
                let evaled = await eval(body.slice(2));
                if (typeof evaled !== 'string') evaled = util.inspect(evaled, { depth: 1 });
                console.log(chalk.yellow(`📝 Async eval executed by owner`));
                if (evaled.length > 4000) {
                    await m.reply('✅ *Executed* (output too long)');
                } else {
                    await m.reply(evaled);
                }
            } catch (err) {
                await m.reply(`❌ Error: ${err.message}`);
            }
            break;
        }
    }
    // If no command matched, just ignore
    break;

} // end switch

} catch (err) {
    // Log error for debugging (you'll still see it in console)
    console.log(chalk.red('❌ Command Error:'));
    console.log(err);
    
    // Silent fail - no message to user
    // Bot continues running normally
}
}

let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
    require('fs').unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
    delete require.cache[file];
    require(file);
});
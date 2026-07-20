// ============================================================
// setting/Settings.js
// Simple JSON-file-backed key/value settings store.
//
// Reconstructed from usage patterns in case.js — every call site
// follows one of these two shapes:
//
//   getSetting(scopeKey, settingName, defaultValue)
//   setSetting(scopeKey, settingName, value)
//
// scopeKey   — usually a chat/JID or botNumber+chat combo, e.g. m.chat,
//              m.sender, botNumber + m.chat
// settingName — a plain key ("welcome") or a dotted path
//              ("feature.chatbot.global") for nested settings
// ============================================================

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(process.cwd(), 'database');
const DB_FILE = path.join(DB_DIR, 'settings.json');

function ensureDB() {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
}

// In-memory cache so we don't hit disk on every single getSetting() call
// (this runs on nearly every incoming message, sometimes many times per message).
let cache = null;
let dirty = false;

function loadAll() {
    if (cache) return cache;
    ensureDB();
    try {
        cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
        console.log(`⚠️ settings.json was corrupted, resetting. (${e.message})`);
        cache = {};
    }
    return cache;
}

let flushTimer = null;
function scheduleFlush() {
    dirty = true;
    if (flushTimer) return;
    // Debounce writes — settings can be written rapidly in a hot message loop.
    flushTimer = setTimeout(() => {
        flushTimer = null;
        if (!dirty) return;
        try {
            fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2));
            dirty = false;
        } catch (e) {
            console.log(`⚠️ Failed to save settings.json: ${e.message}`);
        }
    }, 250);
}

/**
 * getSetting(scopeKey, settingName, defaultValue)
 * Reads a value for a given scope (chat/user/bot). settingName is stored
 * as a literal flat key — e.g. "feature.chatbot.global" is one key with
 * dots in its name, NOT a nested path. This matches the real settings.json
 * data shape (each scope is a flat { settingName: value } map).
 */
function getSetting(scopeKey, settingName, defaultValue) {
    if (!scopeKey || !settingName) return defaultValue;
    const all = loadAll();
    const scoped = all[scopeKey];
    if (scoped === undefined) return defaultValue;
    const value = scoped[settingName];
    return value === undefined ? defaultValue : value;
}

/**
 * setSetting(scopeKey, settingName, value)
 * Writes a value for a given scope, persisted to disk (debounced).
 */
function setSetting(scopeKey, settingName, value) {
    if (!scopeKey || !settingName) return false;
    const all = loadAll();
    if (!all[scopeKey]) all[scopeKey] = {};
    all[scopeKey][settingName] = value;
    scheduleFlush();
    return true;
}

/**
 * Force an immediate synchronous write — useful right before shutdown.
 */
function flushSettingsSync() {
    if (!cache) return;
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2));
        dirty = false;
    } catch (e) {
        console.log(`⚠️ Failed to force-save settings.json: ${e.message}`);
    }
}

module.exports = { getSetting, setSetting, flushSettingsSync };

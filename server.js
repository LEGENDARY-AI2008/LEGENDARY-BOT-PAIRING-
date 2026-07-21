require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');

/**
 * Delivers a freshly-issued session ID the same way every time, regardless
 * of which pairing flow (phone number, QR, QR-reconnect) triggered it.
 * Bare session ID gets its own message so it's easy to long-press-copy,
 * separate from the explanation/warning text.
 */
async function deliverSessionId(nexus, ownJid, sessionId) {
    await nexus.sendPresenceUpdate('composing', ownJid);
    await new Promise(r => setTimeout(r, 1500));

    await nexus.sendMessage(ownJid, { text: '✅ Done' });
    await new Promise(r => setTimeout(r, 800));

    // Bare ID alone — nothing else on this message, easy to copy.
    await nexus.sendMessage(ownJid, { text: sessionId });
    await new Promise(r => setTimeout(r, 500));

    await nexus.sendMessage(ownJid, {
        text: `☝️ Above is your session ID.\n\n⚠️ Keep this private — anyone with this ID can control your bot.\nUse it in your config when deploying on your panel.`
    });
}
const path = require('path');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require('@boruto_vk7/baileys');
const pino = require('pino');
const axios = require('axios');
const qrcode = require('qrcode');
const { createSession, getSession, packageSessionFiles } = require('./sessionManager');
const pluginManager = require('./pluginManager');
const suggestionManager = require('./suggestionManager');
const instanceManager = require('./instanceManager');

const app = express();
const PORT = process.env.PORT || 3059;

app.use(cors());
app.use((req, res, next) => {
    res.setHeader("ngrok-skip-browser-warning", "true");
    next();
});
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// Serve index.html at root
app.get('/', (req, res) => res.sendFile(path.join(process.cwd(), 'index.html')));

// ─── Ping route for UptimeRobot ───────────────────────────
app.get('/ping', (req, res) => res.status(200).json({ status: 'ok', bot: 'LËGĚNDÃRY BØT', uptime: process.uptime() }));

app.use(express.static(__dirname));

const PAIRING_DIR = './nexstore/pairing';
const activeSessions = new Map();

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(PAIRING_DIR);

// ─── Generate Pairing Code ────────────────────────────────────────────────────
app.post('/pair', async (req, res) => {
    let { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number is required' });

    number = number.replace(/[^0-9]/g, '');
    if (!number || number.length < 7) return res.status(400).json({ error: 'Invalid phone number' });

    if (activeSessions.has(number)) {
        try { activeSessions.get(number)?.ws?.close(); } catch {}
        activeSessions.delete(number);
    }

    const sessionPath = `${PAIRING_DIR}/${number}@s.whatsapp.net`;
    if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
    ensureDir(sessionPath);

    let codeSent = false; // tracks whether we've already responded to the HTTP request

    async function connectAndPair() {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const nexus = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.ubuntu('Edge'),
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: true,
            fireInitQueries: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            downloadHistory: false,
            markOnlineOnConnect: true,
        });

        activeSessions.set(number, nexus);
        nexus.ev.on('creds.update', saveCreds);

        nexus.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (connection === 'open') {
                if (!nexus.sessionIdIssued) {
                    try {
                        const sessionId = createSession(number, sessionPath);
                        const ownJid = number + '@s.whatsapp.net';

                        await deliverSessionId(nexus, ownJid, sessionId);

                        nexus.sessionIdIssued = true;
                        console.log(`🔑 Session ID issued for ${number}: ${sessionId}`);

                        // Job done — the real bot deployment will open its own
                        // persistent connection using these saved creds. Close this
                        // temporary socket ourselves rather than let it dangle until
                        // WhatsApp closes it (which was logging as a false "logged out").
                        setTimeout(() => { try { nexus.end(undefined); } catch {} }, 2000);
                    } catch (e) {
                        console.log(`❌ Failed to issue session ID: ${e.message}`);
                    }
                }
            }

            if (connection === 'close') {
                const code = lastDisconnect?.error?.output?.statusCode;

                // ⭐ THE FIX: WhatsApp closes the socket with "restart required" right
                // after the phone confirms the pairing code — this is expected, not a
                // failure. You must open a fresh socket with the SAME saved creds to
                // finish the handshake, otherwise the phone shows "couldn't link device".
                if (code === DisconnectReason.restartRequired) {
                    console.log(`🔄 Restart required for ${number} — reconnecting to finish pairing...`);
                    activeSessions.delete(number);
                    return connectAndPair();
                }

                activeSessions.delete(number);

                if (nexus.sessionIdIssued) {
                    // Expected: this is just the socket we closed ourselves above.
                    console.log(`✅ Pairing session for ${number} closed cleanly after issuing session ID`);
                } else if (code === DisconnectReason.loggedOut) {
                    console.log(`🚪 ${number} logged out / rejected pairing before completion`);
                }

                if (!codeSent && !res.headersSent) {
                    codeSent = true;
                    res.status(500).json({ error: 'Connection closed before pairing completed' });
                }
            }
        });

        // Only request a pairing code the first time — on the post-515 reconnect,
        // state.creds.registered will already be true, so this is skipped.
        if (!codeSent && !state.creds.registered) {
            setTimeout(async () => {
                try {
                    let code = await nexus.requestPairingCode(number);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;

                    ensureDir(PAIRING_DIR);
                    fs.writeFileSync(
                        `${PAIRING_DIR}/pairing.json`,
                        JSON.stringify({ number, code, timestamp: new Date().toISOString() }, null, 2)
                    );

                    codeSent = true;
                    if (!res.headersSent) res.json({ success: true, code });
                } catch (err) {
                    codeSent = true;
                    if (!res.headersSent) res.status(500).json({ error: err.message });
                }
            }, 3000);
        }
    }

    try {
        await connectAndPair();
    } catch (err) {
        console.error('Pairing error:', err.message);
        if (!res.headersSent) res.status(500).json({ error: err.message || 'Failed to generate pairing code' });
    }
});

// ─── Generate QR Code for pairing ─────────────────────────────────────────────
let qrSession = null; // single active QR session at a time (fine for current scale)

app.get('/qr', async (req, res) => {
    // Clean up any previous QR session before starting a new one
    if (qrSession?.nexus) {
        try { qrSession.nexus.ws?.close(); } catch {}
    }

    const tempId = `qr-${Date.now()}`;
    const sessionPath = `${PAIRING_DIR}/${tempId}`;
    ensureDir(sessionPath);

    qrSession = { tempId, sessionPath, linked: false, nexus: null };

    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const nexus = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.ubuntu('Edge'),
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: true,
            fireInitQueries: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            downloadHistory: false,
            markOnlineOnConnect: true,
        });

        qrSession.nexus = nexus;
        nexus.ev.on('creds.update', saveCreds);

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('QR generation timeout')), 20000);

            nexus.ev.on('connection.update', async (update) => {
                const { connection, qr, lastDisconnect } = update;

                if (qr && !res.headersSent) {
                    clearTimeout(timeout);
                    try {
                        const qrDataUrl = await qrcode.toDataURL(qr);
                        res.json({ success: true, qr: qrDataUrl });
                        resolve();
                    } catch (e) {
                        res.status(500).json({ error: 'Failed to render QR code' });
                        reject(e);
                    }
                }

                if (connection === 'open' && qrSession && qrSession.tempId === tempId) {
                    const number = nexus.user?.id?.split(':')[0]?.split('@')[0];
                    if (number && !nexus.sessionIdIssued) {
                        try {
                            const sessionId = createSession(number, sessionPath);
                            const ownJid = number + '@s.whatsapp.net';

                            await deliverSessionId(nexus, ownJid, sessionId);

                            nexus.sessionIdIssued = true;
                            qrSession.linked = true;
                            console.log(`🔑 Session ID issued via QR for ${number}: ${sessionId}`);
                        } catch (e) {
                            console.log(`❌ Failed to issue session ID: ${e.message}`);
                        }
                    }
                }

                if (connection === 'close') {
                    const code = lastDisconnect?.error?.output?.statusCode;

                    // ⭐ Same fix as /pair: WhatsApp closes the socket right after the
                    // phone scans the QR — reconnect with the same saved creds to finish.
                    if (code === DisconnectReason.restartRequired) {
                        clearTimeout(timeout);
                        console.log(`🔄 Restart required for QR session ${tempId} — reconnecting to finish pairing...`);
                        try {
                            const { state: state2, saveCreds: saveCreds2 } = await useMultiFileAuthState(sessionPath);
                            const nexus2 = makeWASocket({
                                version, logger: pino({ level: 'silent' }), printQRInTerminal: false,
                                auth: state2, browser: Browsers.ubuntu('Edge'),
                                connectTimeoutMs: 60000, defaultQueryTimeoutMs: 60000, keepAliveIntervalMs: 30000,
                                emitOwnEvents: true, fireInitQueries: true, generateHighQualityLinkPreview: true,
                                syncFullHistory: false, downloadHistory: false, markOnlineOnConnect: true,
                            });
                            qrSession.nexus = nexus2;
                            nexus2.ev.on('creds.update', saveCreds2);
                            nexus2.ev.on('connection.update', async (u2) => {
                                if (u2.connection === 'open' && !nexus2.sessionIdIssued) {
                                    const number = nexus2.user?.id?.split(':')[0]?.split('@')[0];
                                    if (number) {
                                        try {
                                            const sessionId = createSession(number, sessionPath);
                                            await deliverSessionId(nexus2, number + '@s.whatsapp.net', sessionId);
                                            nexus2.sessionIdIssued = true;
                                            qrSession.linked = true;
                                            console.log(`🔑 Session ID issued via QR for ${number}: ${sessionId}`);
                                        } catch (e) {
                                            console.log(`❌ Failed to issue session ID: ${e.message}`);
                                        }
                                    }
                                }
                            });
                        } catch (e) {
                            console.log(`❌ QR reconnect failed: ${e.message}`);
                        }
                        return;
                    }

                    clearTimeout(timeout);
                    if (code === DisconnectReason.loggedOut) reject(new Error('Connection closed'));
                }
            });
        });

    } catch (err) {
        console.error('QR pairing error:', err.message);
        if (!res.headersSent) res.status(500).json({ error: err.message || 'Failed to generate QR code' });
    }
});

app.get('/qr/status', (req, res) => {
    res.json({ linked: qrSession?.linked || false });
});

// ─── Fetch session data for deployed bots ─────────────────────────────────────
app.get('/api/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session ID not found' });

    const bundle = packageSessionFiles(sessionId);
    if (!bundle) return res.status(404).json({ error: 'Session files not found on server' });

    res.json({ sessionId, phoneNumber: session.phoneNumber, files: bundle });
});

// ─── Frontend compatibility routes (matches index.html's actual calls) ────────
app.get('/plugins', (req, res) => {
    const plugins = pluginManager.listApproved().map(p => ({
        id: p.id, name: p.name, author: p.author, desc: p.description,
        date: p.submittedAt, cmd: `.plugin install ${p.id}`,
        url: `${req.protocol}://${req.get('host')}/api/plugins/${p.id}`, demo: false
    }));
    res.json({ plugins });
});

app.post('/plugins', express.json(), (req, res) => {
    const { name, author, desc, code, cmd } = req.body;
    if (!name || !author || !desc || !code) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = pluginManager.submitPlugin({ name, author, description: desc, code, category: 'misc' });
    res.json({ success: true, id, message: 'Submitted for review' });
});

app.post('/suggest', express.json(), (req, res) => {
    const { name, idea } = req.body;
    if (!idea) return res.status(400).json({ error: 'Missing suggestion text' });
    const id = suggestionManager.submitSuggestion({
        name: name || 'Anonymous', contact: null,
        topic: idea.slice(0, 60), language: 'English', description: idea
    });
    res.json({ success: true, id, message: 'Suggestion received — thank you!' });
});

// ─── LËGĒNDÃRY PANEL — hosted deployment (session ID acts as login) ───────────
// Login check — just confirms the session ID is real
app.get('/api/panel/login/:sessionId', (req, res) => {
    const session = getSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Invalid session ID' });
    const instance = instanceManager.getInstance(req.params.sessionId);
    res.json({ success: true, phoneNumber: session.phoneNumber, instance });
});

// Deploy — spins up this user's bot on our own server
app.post('/api/panel/deploy', express.json(), (req, res) => {
    const { sessionId, ownerName, botName, prefix, workType } = req.body;

    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Invalid session ID' });

    const result = instanceManager.deployInstance({
        sessionId,
        botConfig: {
            ownerNumber: session.phoneNumber,
            ownerName: ownerName || 'Owner',
            botName: botName || 'LËGĒNDÃRY BØT',
            prefix: prefix || '.',
            workType: workType || 'private'
        }
    });

    res.status(result.success ? 200 : 400).json(result);
});

// Status — check if a user's bot is running
app.get('/api/panel/status/:sessionId', (req, res) => {
    const instance = instanceManager.getInstance(req.params.sessionId);
    if (!instance) return res.json({ deployed: false });
    res.json({ deployed: true, ...instance });
});

// Logs — basic output view
app.get('/api/panel/logs/:sessionId', (req, res) => {
    const logs = instanceManager.getInstanceLogs(req.params.sessionId);
    res.json({ logs });
});

// Stop
app.post('/api/panel/stop', express.json(), (req, res) => {
    const { sessionId } = req.body;
    const result = instanceManager.stopInstance(sessionId);
    res.status(result.success ? 200 : 400).json(result);
});

// ─── Plugin submissions & moderation ──────────────────────────────────────────
const ADMIN_KEY = process.env.ADMIN_KEY; // set in .env — protects moderation actions

function requireAdmin(req, res, next) {
    const key = req.headers['x-admin-key'];
    if (!key || key !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Public — anyone can submit a plugin (goes into pending queue, not visible until approved)
app.post('/api/plugins/submit', express.json(), (req, res) => {
    const { name, author, description, code, category, contact, command } = req.body;
    if (!name || !author || !description || !code || !command) {
        return res.status(400).json({ error: 'Missing required fields: name, author, description, code, command' });
    }
    if (!/^[a-z0-9_-]+$/i.test(command)) {
        return res.status(400).json({ error: 'command must be a single word (letters, numbers, - or _ only) — this is what users type to trigger it' });
    }
    const id = pluginManager.submitPlugin({ name, author, description, code, category, contact, command });
    res.json({ success: true, id, message: 'Submitted for review' });
});

// Public — list approved plugins only (what the site/search shows)
app.get('/api/plugins', (req, res) => {
    const q = req.query.q;
    const plugins = q ? pluginManager.searchApproved(q) : pluginManager.listApproved();
    res.json({ plugins });
});

// Public — fetch a single approved plugin's code by ID (used by .plugin install)
app.get('/api/plugins/:id', (req, res) => {
    const plugin = pluginManager.getPlugin(req.params.id);
    if (!plugin || plugin.status !== 'approved') {
        return res.status(404).json({ error: 'Plugin not found or not approved' });
    }
    res.json({ id: plugin.id, name: plugin.name, author: plugin.author, command: plugin.command, code: plugin.code });
});

// Admin-only — see what's waiting for review
app.get('/api/plugins/pending', requireAdmin, (req, res) => {
    res.json({ plugins: pluginManager.listPending() });
});

// Admin-only — approve a plugin
app.post('/api/plugins/:id/approve', requireAdmin, express.json(), (req, res) => {
    const ok = pluginManager.approvePlugin(req.params.id, req.body?.note);
    if (!ok) return res.status(404).json({ error: 'Plugin not found' });
    res.json({ success: true });
});

// Admin-only — reject a plugin
app.post('/api/plugins/:id/reject', requireAdmin, express.json(), (req, res) => {
    const ok = pluginManager.rejectPlugin(req.params.id, req.body?.note);
    if (!ok) return res.status(404).json({ error: 'Plugin not found' });
    res.json({ success: true });
});

// ─── Feature suggestions ───────────────────────────────────────────────────────
// Public — anyone can submit a suggestion from the site form
app.post('/api/suggestions', express.json(), (req, res) => {
    const { name, contact, topic, language, description } = req.body;
    if (!name || !topic || !description) {
        return res.status(400).json({ error: 'Missing required fields: name, topic, description' });
    }
    const id = suggestionManager.submitSuggestion({ name, contact, topic, language, description });
    res.json({ success: true, id, message: 'Suggestion received — thank you!' });
});

// Admin-only — review suggestions
app.get('/api/suggestions', requireAdmin, (req, res) => {
    const onlyNew = req.query.new === 'true';
    res.json({ suggestions: onlyNew ? suggestionManager.listNew() : suggestionManager.listAll() });
});

// ─── Serve latest bot files from the private GitHub repo (for .update command) ──
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // <-- set this as an env var on your panel, never hardcode
const GITHUB_REPO = 'LEGENDARY-AI2008/LEGENDARY-BOT-PAIRING-'; // owner/repo
const ALLOWED_UPDATE_FILES = [
    'bot.js', 'case.js', 'storage.js',
    'setting/config.js', 'setting/Settings.js', 'allfunc/storage.js', 'allfunc/exif.js'
]; // whitelist — only these can be fetched

// NOTE: changed from '/api/update/:filename' to a wildcard route below,
// because Express's single :param segment does not match slashes — so
// nested paths like 'setting/config.js' would 404 before ever reaching
// the whitelist check.
app.get(/^\/api\/update\/(.+)$/, async (req, res) => {
    const filename = req.params[0];
    const { sessionId } = req.query;

    if (!ALLOWED_UPDATE_FILES.includes(filename)) {
        return res.status(403).json({ error: 'File not allowed for update' });
    }

    if (!sessionId || !getSession(sessionId)) {
        return res.status(401).json({ error: 'Valid sessionId required — pair first' });
    }

    try {
        const ghRes = await axios.get(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.raw+json'
                }
            }
        );
        res.type('text/plain').send(ghRes.data);
    } catch (e) {
        res.status(500).json({ error: 'Could not fetch file from repo', detail: e.message });
    }
});

// ─── Check pairing status ─────────────────────────────────────────────────────
app.get('/status/:number', (req, res) => {
    let { number } = req.params;
    number = number.replace(/[^0-9]/g, '');
    const credsPath = path.join(`${PAIRING_DIR}/${number}@s.whatsapp.net`, 'creds.json');
    if (fs.existsSync(credsPath)) {
        try {
            const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            if (creds?.me?.id) return res.json({ paired: true });
        } catch {}
    }
    res.json({ paired: false });
});

// ─── Start server + Cloudflare Tunnel ─────────────────────────────────────────
app.listen(PORT, async () => {
    console.log(`✅ LËGĚNDÃRY BØT Pairing Server running on port ${PORT}`);

    try {
        const { spawn } = require('child_process');

        // ⚠️ Set your Cloudflare Tunnel token as an env var: TUNNEL_TOKEN
        const tunnelToken = process.env.TUNNEL_TOKEN;
        if (!tunnelToken) {
            console.log(`⚠️ No TUNNEL_TOKEN set in .env — skipping Cloudflare Tunnel.`);
            return;
        }

        const { bin: cloudflaredBin, install: installCloudflared } = require('cloudflared');

        // The postinstall step that normally downloads this binary can get
        // blocked by npm's install-scripts permission gate — this is the
        // package's own documented fallback: check, install on demand.
        if (!fs.existsSync(cloudflaredBin)) {
            console.log(`⬇️ cloudflared binary missing — downloading it now...`);
            await installCloudflared(cloudflaredBin);
            console.log(`✅ cloudflared binary installed.`);
        }

        const cloudflared = spawn(cloudflaredBin, ['tunnel', 'run', '--token', tunnelToken], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        // Without this, an unhandled 'error' event crashes the process AND
        // dumps the full spawnargs — including the tunnel token — to the
        // console in plaintext. This was happening before this fix.
        cloudflared.on('error', (err) => {
            console.log(`⚠️ Cloudflare Tunnel failed to start: ${err.code || err.message}`);
        });

        cloudflared.stdout.on('data', d => console.log(`[tunnel] ${d}`.trim()));
        cloudflared.stderr.on('data', d => console.log(`[tunnel] ${d}`.trim()));

        console.log(`\n🌐 ====================================`);
        console.log(`🌐 Cloudflare Tunnel starting...`);
        console.log(`🌐 Your custom domain will be live shortly (check Cloudflare DNS for the exact hostname).`);
        console.log(`🌐 ====================================\n`);

    } catch (e) {
        console.log(`⚠️ Cloudflare Tunnel failed: ${e.message}`);
    }
});

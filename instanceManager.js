const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DB_FILE = path.join(__dirname, 'instances', 'instances.json');
const INSTANCES_DIR = path.join(__dirname, 'instances');

// ⚠️ Safety cap — raise this only once you've confirmed your server can handle more.
// Each running bot is a live process holding an open WhatsApp connection.
const MAX_CONCURRENT_INSTANCES = 20;

function ensureDB() {
    if (!fs.existsSync(INSTANCES_DIR)) fs.mkdirSync(INSTANCES_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
}

function loadDB() {
    ensureDB();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const runningProcesses = new Map(); // sessionId -> child process object (in-memory only)

function countRunning() {
    const db = loadDB();
    return Object.values(db).filter(i => i.status === 'running').length;
}

function getInstance(sessionId) {
    const db = loadDB();
    return db[sessionId] || null;
}

/**
 * Deploys a bot instance for the given session — one per session ID, enforced.
 * @param {object} opts { sessionId, botConfig: { ownerNumber, ownerName, botName, prefix, workType } }
 * @returns {object} { success, message }
 */
function deployInstance({ sessionId, botConfig }) {
    const db = loadDB();

    if (db[sessionId] && db[sessionId].status === 'running') {
        return { success: false, message: 'You already have a bot deployed. Stop it first to redeploy.' };
    }

    if (countRunning() >= MAX_CONCURRENT_INSTANCES) {
        return { success: false, message: 'Server is at capacity right now. Please try again later.' };
    }

    const instanceDir = path.join(INSTANCES_DIR, sessionId);
    if (!fs.existsSync(instanceDir)) fs.mkdirSync(instanceDir, { recursive: true });

    // Write this instance's own config.env
    const envLines = [
        `SESSION_ID=${sessionId}`,
        `OWNER_NUMBER=${botConfig.ownerNumber}`,
        `OWNER_NAME=${botConfig.ownerName}`,
        `BOT_NAME=${botConfig.botName || 'LËGĒNDÃRY BØT'}`,
        `PREFIX=${botConfig.prefix || '.'}`,
        `WORKTYPE=${botConfig.workType || 'private'}`,
        `API_BASE_URL=https://legendarybot.dpdns.org`
    ];
    fs.writeFileSync(path.join(instanceDir, 'config.env'), envLines.join('\n'));

    // Copy the entire core bot codebase (everything case.js depends on)
    // into this instance's folder — excludes node_modules (resolved via
    // the parent directory automatically) and other instances/sessions data.
    const EXCLUDE_DIRS = new Set(['node_modules', 'instances', 'sessions', 'plugins', 'suggestions', '.git', 'session']);

    function copyRecursive(src, dest) {
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
            const dirName = path.basename(src);
            if (EXCLUDE_DIRS.has(dirName)) return;
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            for (const entry of fs.readdirSync(src)) {
                copyRecursive(path.join(src, entry), path.join(dest, entry));
            }
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    for (const entry of fs.readdirSync(__dirname)) {
        if (EXCLUDE_DIRS.has(entry)) continue;
        if (entry === '.env') continue; // never copy the main .env (has secrets) into instance folders
        copyRecursive(path.join(__dirname, entry), path.join(instanceDir, entry));
    }

    // Spawn the bot as its own isolated process
    const child = spawn('node', ['bot.js'], {
        cwd: instanceDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
    });

    const logPath = path.join(instanceDir, 'output.log');
    const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB cap

    // If the existing log is already oversized (e.g. left over from a
    // crash loop before this fix), truncate it before appending more —
    // otherwise every restart just keeps piling onto an already-huge file.
    try {
        if (fs.existsSync(logPath) && fs.statSync(logPath).size > MAX_LOG_SIZE) {
            fs.writeFileSync(logPath, `[log truncated — exceeded ${MAX_LOG_SIZE / 1024 / 1024}MB]\n`);
        }
    } catch (_) {}

    const logFile = fs.createWriteStream(logPath, { flags: 'a' });
    const logPrefix = `[bot:${sessionId.slice(0, 20)}]`;

    // Also cap mid-write: if a single crash-loop burst blows past the
    // limit between deploys, stop writing instead of growing forever.
    let loggedBytes = 0;
    const cappedWrite = (chunk) => {
        loggedBytes += chunk.length;
        if (loggedBytes > MAX_LOG_SIZE) return;
        logFile.write(chunk);
    };
    child.stdout.on('data', cappedWrite);
    child.stderr.on('data', cappedWrite);
    child.stdout.on('data', d => process.stdout.write(`${logPrefix} ${d}`));
    child.stderr.on('data', d => process.stderr.write(`${logPrefix} ${d}`));

    runningProcesses.set(sessionId, child);

    db[sessionId] = {
        sessionId,
        pid: child.pid,
        status: 'running',
        deployedAt: new Date().toISOString(),
        botConfig,
        intentionalStop: false,
        crashCount: db[sessionId]?.crashCount || 0
    };
    saveDB(db);

    // If it stays up for 60s, treat it as healthy and clear the crash counter
    // so a bot that had trouble earlier isn't permanently capped.
    setTimeout(() => {
        const check = loadDB();
        if (check[sessionId] && check[sessionId].status === 'running') {
            check[sessionId].crashCount = 0;
            saveDB(check);
        }
    }, 60000);

    child.on('exit', (code) => {
        const current = loadDB();
        if (!current[sessionId]) {
            runningProcesses.delete(sessionId);
            return;
        }

        current[sessionId].status = 'stopped';
        current[sessionId].exitCode = code;

        const wasIntentional = current[sessionId].intentionalStop;
        runningProcesses.delete(sessionId);

        if (wasIntentional) {
            saveDB(current);
            return;
        }

        // Unexpected exit (crash, or a self-restart like .update calling
        // process.exit(0)) — auto-respawn instead of leaving the bot dead.
        // Capped to avoid an infinite respawn loop if something is
        // fundamentally broken (bad session, missing file, etc.).
        current[sessionId].crashCount = (current[sessionId].crashCount || 0) + 1;
        saveDB(current);

        if (current[sessionId].crashCount > 5) {
            console.log(`⚠️ ${sessionId} exited ${current[sessionId].crashCount} times in a row — not auto-respawning. Manual redeploy required.`);
            return;
        }

        console.log(`🔄 ${sessionId} exited unexpectedly (code ${code}) — auto-respawning in 3s...`);
        setTimeout(() => {
            const latest = loadDB();
            if (!latest[sessionId] || latest[sessionId].intentionalStop) return; // stopped in the meantime
            deployInstance({ sessionId, botConfig: latest[sessionId].botConfig });
        }, 3000);
    });

    return { success: true, message: 'Bot deployed successfully.' };
}

/**
 * Stops a running instance for the given session.
 */
function stopInstance(sessionId) {
    const db = loadDB();
    if (!db[sessionId] || db[sessionId].status !== 'running') {
        return { success: false, message: 'No running bot found for this session.' };
    }

    const child = runningProcesses.get(sessionId);
    if (child) {
        child.kill();
    }

    db[sessionId].status = 'stopped';
    db[sessionId].intentionalStop = true;
    saveDB(db);
    runningProcesses.delete(sessionId);

    return { success: true, message: 'Bot stopped.' };
}

/**
 * Gets the last N lines of an instance's log output — useful for a basic status view.
 */
function getInstanceLogs(sessionId, lines = 50) {
    const logPath = path.join(INSTANCES_DIR, sessionId, 'output.log');
    if (!fs.existsSync(logPath)) return '';
    const content = fs.readFileSync(logPath, 'utf-8');
    return content.split('\n').slice(-lines).join('\n');
}

module.exports = {
    deployInstance,
    stopInstance,
    getInstance,
    getInstanceLogs,
    countRunning,
    MAX_CONCURRENT_INSTANCES
};

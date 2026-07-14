// ============================================================
// pluginManager.js
// Per-instance plugin storage + sandboxed execution.
//
// SECURITY NOTE: this deliberately does NOT use vm2. vm2 was
// deprecated by its own maintainers in 2023 after several
// unfixable sandbox-escape vulnerabilities were found — using it
// would be worse than no sandbox at all, since it gives a false
// sense of safety. This uses isolated-vm instead, which runs
// plugin code in a genuine separate V8 isolate with its own heap.
// An isolate starts completely empty — it has no access to fs,
// process, require, or anything else in this process UNLESS we
// explicitly inject it. We inject nothing but plain JSON data.
//
// DESIGN: plugins are pure functions — (input JSON) => (output JSON).
// A plugin can read the incoming message text/sender/chat we hand it
// and return an object describing what it wants sent back, but it
// NEVER gets a live reference to the real WhatsApp socket, the
// filesystem, or any other instance's data. All actual side effects
// (sending the reply) happen in the host process (case.js), driven
// by the plugin's returned instructions — not by the plugin itself.
// This is a smaller, safer surface than trying to bridge live async
// socket calls into the isolate, which is where sandbox bugs hide.
// ============================================================

const fs = require('fs');
const path = require('path');
let ivm;
try {
    ivm = require('isolated-vm');
} catch (e) {
    console.log('⚠️ isolated-vm not installed — plugin execution will fail until `npm install isolated-vm` is run.');
}

function getPluginsDir(instanceDir) {
    const dir = path.join(instanceDir, 'plugins');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function getManifestPath(instanceDir) {
    return path.join(getPluginsDir(instanceDir), 'manifest.json');
}

function loadManifest(instanceDir) {
    const p = getManifestPath(instanceDir);
    if (!fs.existsSync(p)) return {};
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch (_) { return {}; }
}

function saveManifest(instanceDir, manifest) {
    fs.writeFileSync(getManifestPath(instanceDir), JSON.stringify(manifest, null, 2));
}

/**
 * Saves a plugin's code + metadata into THIS instance's own plugins/
 * folder only. Different instances never share or see each other's
 * plugins/ directory — each session gets its own under
 * instances/<sessionId>/plugins/.
 */
function installPlugin(instanceDir, pluginId, name, command, code) {
    if (!/^[a-zA-Z0-9_-]+$/.test(pluginId)) throw new Error('Invalid plugin id');
    const dir = getPluginsDir(instanceDir);
    fs.writeFileSync(path.join(dir, `${pluginId}.js`), code);
    const manifest = loadManifest(instanceDir);
    manifest[pluginId] = { name, command, installedAt: new Date().toISOString() };
    saveManifest(instanceDir, manifest);
}

function listPlugins(instanceDir) {
    return loadManifest(instanceDir);
}

function removePlugin(instanceDir, pluginId) {
    const dir = getPluginsDir(instanceDir);
    const file = path.join(dir, `${pluginId}.js`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    const manifest = loadManifest(instanceDir);
    delete manifest[pluginId];
    saveManifest(instanceDir, manifest);
}

/**
 * Runs a plugin in a fresh, disposable isolate. `input` must be plain
 * JSON-serializable data (e.g. { text, sender, args }) — never a live
 * object. Returns whatever plain JSON the plugin returns (e.g.
 * { reply: "..." }), which the caller in case.js decides how to act on.
 *
 * A plugin's source must define:
 *   function plugin(input) { return { reply: "..." }; }
 */
async function runPlugin(instanceDir, pluginId, input, timeoutMs = 3000) {
    if (!ivm) throw new Error('isolated-vm is not installed on this server');
    const file = path.join(getPluginsDir(instanceDir), `${pluginId}.js`);
    if (!fs.existsSync(file)) throw new Error('Plugin not installed');
    const code = fs.readFileSync(file, 'utf-8');

    const isolate = new ivm.Isolate({ memoryLimit: 32 }); // 32MB hard cap
    try {
        const context = await isolate.createContext();
        const jail = context.global;
        await jail.set('global', jail.derefInto());

        const inputCopy = new ivm.ExternalCopy(input);
        await jail.set('__input', inputCopy.copyInto());

        const wrapped = `
            (function() {
                "use strict";
                ${code}
                if (typeof plugin !== 'function') {
                    throw new Error('Plugin must define: function plugin(input) { return output; }');
                }
                const result = plugin(__input);
                return JSON.stringify(result === undefined ? null : result);
            })()
        `;

        const script = await isolate.compileScript(wrapped);
        const resultJson = await script.run(context, { timeout: timeoutMs });
        return JSON.parse(resultJson);
    } finally {
        isolate.dispose(); // always tear down — no isolate outlives one call
    }
}

module.exports = { installPlugin, listPlugins, removePlugin, runPlugin, getPluginsDir };

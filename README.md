# LËGĒNDÃRY BØT — Deploy Template

Deploy your own instance of LËGĒNDÃRY BØT in a few steps.

## 1. Get a session ID

Pair your WhatsApp number at [our pairing site], and you'll receive a session ID
(looks like `legendarybot-a3f9c21e08b7`) sent directly to your own WhatsApp DM.

**Keep this private.** Anyone with your session ID can control your WhatsApp account.

## 2. Configure your bot

Copy `config.example.js` to a new file called `config.js`, and fill in your details:

```js
module.exports = {
    sessionId: "legendarybot-a3f9c21e08b7", // your session ID from pairing
    botName: "My LËGĒNDÃRY BØT",
    ownerName: "Your Name",
    prefix: ".",
    publicMode: false,
    sudoNumbers: []
};
```

## 3. Install dependencies

```bash
npm install
```

## 4. Run your bot

```bash
node index.js
```

Your bot will fetch its session automatically and connect to WhatsApp.

## Deploying on a panel (Pterodactyl, etc.)

1. Upload all files in this repo to your server
2. Add `config.js` (see step 2 above)
3. Set the startup command to `node index.js`
4. Start the server

## Commands

Once your bot is running, message it `.menu` to see available commands.

## Support

Having issues? Reach out in the LËGĒNDÃRY DĚVṢ̌ community, or open an issue on this repo.

---
© LËGĒNDÃRY LAB™ Studio

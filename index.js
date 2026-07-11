const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ========================================
//  EDIT YOUR INFO HERE
// ========================================
const config = {
  SESSION_ID: 'your-session-id',
  OWNER_NUMBER: '234XXXXXXXXXX',
  WORKTYPE: 'private',        // 'private' or 'public'
  PREFIX: '.',
  TIMEZONE: 'Africa/Lagos',
  OWNER_NAME: 'Your Name',
  BOT_NAME: 'LËGĒNDÃRY BØT'
}
// ========================================

const API_BASE_URL = 'https://dragonish-flip-universal.ngrok-free.dev' // staging — update when live
const CORE_FILES = ['bot.js', 'case.js', 'storage.js']

function printBanner() {
  console.log(`
\x1b[33m  ██╗     ██╗   ██╗    ██████╗  ██████╗ ████████╗
  ██║     ██║   ██║    ██╔══██╗██╔═══██╗╚══██╔══╝
  ██║     ██║   ██║    ██████╔╝██║   ██║   ██║
  ██║     ╚██╗ ██╔╝    ██╔══██╗██║   ██║   ██║
  ███████╗ ╚████╔╝     ██████╔╝╚██████╔╝   ██║
  ╚══════╝  ╚═══╝      ╚═════╝  ╚═════╝    ╚═╝\x1b[0m
\x1b[32m   LËGĒNDÃRY BØT — by LËGĒNDÃRY LAB™ Studio\x1b[0m
`)
}

function writeEnvFile(filePath) {
  const envText = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  fs.writeFileSync(filePath, envText)
  console.log('✅ config.env written')
}

async function fetchCoreFile(filename) {
  const url = `${API_BASE_URL}/api/update/${filename}`
  const { data } = await axios.get(url, { params: { sessionId: config.SESSION_ID } })
  fs.writeFileSync(path.join(process.cwd(), filename), data, 'utf-8')
  console.log(`✅ ${filename} downloaded`)
}

function writePackageJson() {
  const pkg = {
    name: 'legendary-bot-instance',
    version: '1.0.0',
    main: 'bot.js',
    scripts: { start: 'node bot.js' },
    dependencies: {
      '@boruto_vk7/baileys': 'latest',
      '@hapi/boom': '^10.0.1',
      axios: '^1.7.0',
      chalk: '^4.1.2',
      dotenv: '^16.4.5',
      pino: '^9.0.0'
    }
  }
  fs.writeFileSync(path.join(process.cwd(), 'package.json'), JSON.stringify(pkg, null, 2))
}

;(async () => {
  try {
    printBanner()

    if (config.SESSION_ID === 'your-session-id') {
      console.error('❌ Please set your SESSION_ID at the top of this file before running.')
      process.exit(1)
    }

    console.log('Fetching LËGĒNDÃRY BØT core files...')
    for (const file of CORE_FILES) {
      await fetchCoreFile(file)
    }

    if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
      writePackageJson()
    }

    writeEnvFile(path.join(process.cwd(), 'config.env'))

    console.log('Installing dependencies...')
    execSync('npm install', { stdio: 'inherit' })

    console.log('Starting bot...')
    execSync('npm start', { stdio: 'inherit' })

  } catch (err) {
    console.error('Setup failed:', err.response?.data?.error || err.message)
    process.exit(1)
  }
})()

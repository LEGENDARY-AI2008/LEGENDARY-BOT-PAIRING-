const util = require('util')
const { spawn, exec } = require('child_process')
const { sizeFormatter } = require('human-readable')
const PhoneNumber = require('awesome-phonenumber')
const jimp = require('jimp')
const path = require('path')
const fs = require('fs')

function unixTimestampSeconds(date = new Date()) {
    return Math.floor(date.getTime() / 1000)
}
exports.unixTimestampSeconds = unixTimestampSeconds

exports.generateMessageTag = (epoch) => {
    let tag = `${unixTimestampSeconds()}.--${epoch || ''}`
    return tag
}

exports.processTime = (timestamp, now) => {
    return runtime(Math.round((now - (timestamp * 1000)) / 1000))
}

exports.getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

exports.getBuffer = async (url, options) => {
    try {
        options ? options : {}
        const axios = require('axios')
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        })
        return res.data
    } catch (e) {
        console.log(`Error getBuffer: ${e}`)
    }
}

exports.fetchJson = async (url, options) => {
    try {
        const axios = require('axios')
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'Accept': 'application/json'
            },
            ...options
        })
        return res.data
    } catch (err) {
        console.log(`Error fetchJson: ${err}`)
        return err
    }
}

exports.runtime = function(seconds) {
    seconds = Number(seconds)
    var d = Math.floor(seconds / (3600 * 24))
    var h = Math.floor(seconds % (3600 * 24) / 3600)
    var m = Math.floor(seconds % 3600 / 60)
    var s = Math.floor(seconds % 60)
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : ""
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : ""
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : ""
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : ""
    return dDisplay + hDisplay + mDisplay + sDisplay
}

exports.clockString = (ms) => {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

exports.isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi))
}

exports.getTime = (format, date) => {
    const moment = require('moment-timezone')
    return moment(date).tz('Africa/Lagos').format(format)
}

exports.formatDate = (n, locale = 'id') => {
    const d = new Date(n)
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
}

exports.tanggal = (numer) => {
    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
    const tgl = new Date(numer)
    const day = tgl.getDate()
    const month = bulan[tgl.getMonth()]
    const year = tgl.getFullYear()
    return `${day} ${month} ${year}`
}

exports.formatp = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`
})

exports.jsonformat = (string) => {
    return JSON.stringify(string, null, 2)
}

exports.logic = (check, inp, out) => {
    return check ? inp : out
}

exports.generateProfilePicture = async (buffer) => {
    const jimp = require('jimp')
    const image = await jimp.read(buffer)
    const min = image.getWidth()
    const max = image.getHeight()
    const cropped = image.crop(0, 0, Math.min(min, max), Math.min(min, max))
    return {
        img: await cropped.scaleToFit(720, 720).getBufferAsync(jimp.MIME_JPEG),
        preview: await cropped.scaleToFit(96, 96).getBufferAsync(jimp.MIME_JPEG)
    }
}

exports.bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

exports.getSizeMedia = (path) => {
    const stats = fs.statSync(path)
    return stats.size
}

exports.parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
}

exports.getGroupAdmins = (participants, client) => {
    let admins = []
    for (let i of participants) {
        i.admin === "superadmin" ? admins.push(i.id) : i.admin === "admin" ? admins.push(i.id) : ""
    }
    return admins
}

exports.smsg = (client, m, store) => {
    if (!m) return m
    let M = require('@boruto_vk7/baileys').proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = client.decodeJid(m.fromMe && client.user.id || m.participant || m.key.participant || m.chat || '')
        if (m.isGroup) m.participant = client.decodeJid(m.key.participant) || ''
    }
    if (m.message) {
        m.mtype = Object.keys(m.message)[0]
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[Object.keys(m.message[m.mtype].message)[0]] : m.message[m.mtype])
        m.body = (m.mtype === 'conversation') ? m.message.conversation : (m.mtype == 'imageMessage') && m.message.imageMessage.caption ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') && m.message.videoMessage.caption ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : ''
        m.msg.text = m.body
        m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null
        if (m.quoted) {
            let type = Object.keys(m.quoted)[0]
            m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) type = Object.keys(m.quoted)[0]
            m.quoted = (type == 'templateMessage') ? m.quoted.hydratedTemplate[Object.keys(m.quoted.hydratedTemplate)[0]] : m.quoted
            m.quoted = (type == 'templateMessage') ? m.quoted.hydratedFourRowTemplate[Object.keys(m.quoted.hydratedFourRowTemplate)[0]] : m.quoted
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
            m.quoted.sender = client.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === client.decodeJid(client.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
            m.quoted.mentionedJid = m.msg.contextInfo?.mentionedJid || []
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false
                let q = await store.loadMessage(m.chat, m.quoted.id, client)
                return exports.smsg(client, q, store)
            }
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: m.quoted
            })
            m.quoted.delete = () => client.sendMessage(m.quoted.chat, { delete: vM.key })
            m.quoted.copyNForward = (asal = m.chat, quoted = false, options = {}) => client.copyNForward(asal, vM, quoted, options)
            m.quoted.download = () => client.downloadMediaMessage(vM)
        }
    }
    m.text = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || ''
    try {
        m.reply = (text, chatId = m.chat, options = {}) => client.sendMessage(chatId, { text: text, ...options }, { quoted: m, ...options })
    } catch (e) {}
    return m
}
</parameter>
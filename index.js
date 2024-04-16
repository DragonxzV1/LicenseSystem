require('dotenv').config();
const express = require('express');
const Discord = require('discord.js');
const { QuickDB } = require('quick.db');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const mysql = require('mysql');
const fs = require('fs');

const app = express();
const db = new QuickDB({
    filePath: './dragonxz.sqlite'
});
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB
});

const WEBHOOK_RATELIMIT = new Discord.WebhookClient({
    url: process.env.WEBHOOK_RATELIMIT
});
const WEBHOOK_SUCCESS = new Discord.WebhookClient({
    url: process.env.WEBHOOK_SUCCESS
});
const WEBHOOK_INVALID = new Discord.WebhookClient({
    url: process.env.WEBHOOK_INVALID
});
const WEBHOOK_BANNED = new Discord.WebhookClient({
    url: process.env.WEBHOOK_BANNED
});

app.get('/connect/:key/:cfx', async (req, res) => {
    const address = req.headers['x-forwarded-for'] || req.ip;

    const ip = address.replaceAll('::ffff:', '');
    if (ip == '::1' || ip === '127.0.0.1') return res.status(200).json({
        status: 400,
        content: '[Dragonxz] Invalid request'
    });
    if ((await db.get('blockedIPs') || []).includes(ip)) return;
    const dateIsrael = new Date().toLocaleDateString().replaceAll('/', '-');
    if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');
    if (!fs.existsSync(`./logs/${dateIsrael}`)) fs.mkdirSync(`./logs/${dateIsrael}`);

    let IpInfo = await fetch(`http://ip-api.com/json/${ip}`).then((res) => res.json()).catch((err) => { });
    if (!IpInfo) IpInfo = {};
    const { country, countryCode, regionName, region, isp, org, timezone, zip } = IpInfo;
    fs.writeFileSync(`./logs/${dateIsrael}/${ip}.log`, `
[INFO] IP: ${ip}
[INFO] Country: ${country} (${countryCode})
[INFO] Region: ${regionName} (${region})
[INFO] ISP: ${isp}
[INFO] Organization: ${org}
[INFO] Date: ${new Date().toLocaleString()}`, { flag: 'a' });

    if (await db.get(`requests.${ip}`)) {
        await db.add(`requests.${ip}.amount`, 1);

        if (await db.get(`requests.${ip}.amount`) > 5) {
            if (Date.now() - await db.get(`requests.${ip}.date`) < 1000 * 60) {
                if (await db.get(`requests.${ip}.alert`)) return res.status(200).json({
                    status: 400,
                    content: '[Dragonxz] Too many requests'
                });
                await db.set(`requests.${ip}.alert`, true);
                const WEBHOOK_EMBED = new Discord.MessageEmbed()
                    .setAuthor({
                        name: 'Dragonxz - Rate Limit',
                        iconURL: process.env.IMAGE_LOGO
                    })
                    .setColor('DARK_ORANGE')
                    .setThumbnail(process.env.IMAGE_LOGO)
                    .addFields(
                        { name: 'IP', value: `${ip || 'Unknown'}`, inline: true },
                        { name: 'Date', value: `${new Date().toLocaleString()}`, inline: true },
                        { name: 'Country', value: `${country || 'Unknown'}`, inline: true },
                        { name: 'Region', value: `${regionName || 'Unknown'}`, inline: true },
                        { name: 'ISP', value: `${isp || 'Unknown'}`, inline: true },
                        { name: 'Organization', value: `${org || 'Unknown'}`, inline: true },
                        { name: 'Information', value: `The IP address has been rate limited.`, inline: false }
                    )
                    .setImage(process.env.IMAGE_BANNER)
                    .setFooter({
                        text: 'Dragonxz Auth System - /blockip <ip> <reason>',
                        iconURL: process.env.IMAGE_LOGO
                    }).setTimestamp();
                WEBHOOK_RATELIMIT.send({
                    embeds: [WEBHOOK_EMBED]
                });
                return res.status(200).json({
                    status: 400,
                    content: '[Dragonxz] Too many requests'
                });
            } else {
                await db.delete(`requests.${ip}`);
            };
        };
    } else {
        await db.set(`requests.${ip}`, {
            date: Date.now(),
            amount: 1
        });
    };

    const { key, cfx } = req.params;
    if (!key || !cfx) {
        const WEBHOOK_EMBED = new Discord.MessageEmbed()
            .setAuthor({
                name: 'Dragonxz - Invalid Request',
                iconURL: process.env.IMAGE_LOGO
            })
            .setColor('DARK_ORANGE')
            .setThumbnail(process.env.IMAGE_LOGO)
            .addFields(
                { name: 'IP', value: `${ip || 'Unknown'}`, inline: true },
                { name: 'Date', value: `${new Date().toLocaleString()}`, inline: true },
                { name: 'Country', value: `${country || 'Unknown'}`, inline: true },
                { name: 'Region', value: `${regionName || 'Unknown'}`, inline: true },
                { name: 'ISP', value: `${isp || 'Unknown'}`, inline: true },
                { name: 'Organization', value: `${org || 'Unknown'}`, inline: true },
                { name: 'Information', value: `Invalid request`, inline: false }
            )
            .setImage(process.env.IMAGE_BANNER)
            .setFooter({
                text: 'Dragonxz Auth System - /blockip <ip> <reason>',
                iconURL: process.env.IMAGE_LOGO
            }).setTimestamp();
        WEBHOOK_INVALID.send({
            embeds: [WEBHOOK_EMBED]
        });
        return res.status(200).json({
            status: 400,
            content: '[Dragonxz] Invalid request'
        });
    };
    const license = await getLicense(key);
    if (!license) {
        const WEBHOOK_EMBED = new Discord.MessageEmbed()
            .setAuthor({
                name: 'Dragonxz - Invalid License',
                iconURL: process.env.IMAGE_LOGO
            })
            .setColor('DARK_ORANGE')
            .setThumbnail(process.env.IMAGE_LOGO)
            .addFields(
                { name: 'IP', value: `${ip || 'Unknown'}`, inline: true },
                { name: 'Date', value: `${new Date().toLocaleString()}`, inline: true },
                { name: 'Country', value: `${country || 'Unknown'}`, inline: true },
                { name: 'Region', value: `${regionName || 'Unknown'}`, inline: true },
                { name: 'ISP', value: `${isp || 'Unknown'}`, inline: true },
                { name: 'Organization', value: `${org || 'Unknown'}`, inline: true },
                { name: 'Information', value: `Invalid license`, inline: false }
            )
            .setImage(process.env.IMAGE_BANNER)
            .setFooter({
                text: 'Dragonxz Auth System - /blockip <ip> <reason>',
                iconURL: process.env.IMAGE_LOGO
            }).setTimestamp();
        WEBHOOK_INVALID.send({
            embeds: [WEBHOOK_EMBED]
        });
        return res.status(200).json({
            status: 400,
            content: '[Dragonxz] Invalid license'
        });
    };
    if (license.banned == 1) {
        const WEBHOOK_EMBED = new Discord.MessageEmbed()
            .setAuthor({
                name: 'Dragonxz - Banned License',
                iconURL: process.env.IMAGE_LOGO
            })
            .setColor('DARK_ORANGE')
            .setThumbnail(process.env.IMAGE_LOGO)
            .addFields(
                { name: 'IP', value: `${ip || 'Unknown'}`, inline: true },
                { name: 'Date', value: `${new Date().toLocaleString()}`, inline: true },
                { name: 'Country', value: `${country || 'Unknown'}`, inline: true },
                { name: 'Region', value: `${regionName || 'Unknown'}`, inline: true },
                { name: 'ISP', value: `${isp || 'Unknown'}`, inline: true },
                { name: 'Organization', value: `${org || 'Unknown'}`, inline: true },
                { name: 'Information', value: `License is banned`, inline: false }
            )
            .setImage(process.env.IMAGE_BANNER)
            .setFooter({
                text: 'Dragonxz Auth System - /blockip <ip> <reason>',
                iconURL: process.env.IMAGE_LOGO
            }).setTimestamp();
        WEBHOOK_BANNED.send({
            embeds: [WEBHOOK_EMBED]
        });
        return res.status(200).json({
            status: 400,
            content: '[Dragonxz] License is banned'
        });
    };
    if (license.expires < new Date()) {
        const WEBHOOK_EMBED = new Discord.MessageEmbed()
            .setAuthor({
                name: 'Dragonxz - Expired License',
                iconURL: process.env.IMAGE_LOGO
            })
            .setColor('DARK_ORANGE')
            .setThumbnail(process.env.IMAGE_LOGO)
            .addFields(
                { name: 'IP', value: `${ip || 'Unknown'}`, inline: true },
                { name: 'Date', value: `${new Date().toLocaleString()}`, inline: true },
                { name: 'Country', value: `${country || 'Unknown'}`, inline: true },
                { name: 'Region', value: `${regionName || 'Unknown'}`, inline: true },
                { name: 'ISP', value: `${isp || 'Unknown'}`, inline: true },
                { name: 'Organization', value: `${org || 'Unknown'}`, inline: true },
                { name: 'Information', value: `License is expired`, inline: false }
            )
            .setImage(process.env.IMAGE_BANNER)
            .setFooter({
                text: 'Dragonxz Auth System - /blockip <ip> <reason>',
                iconURL: process.env.IMAGE_LOGO
            }).setTimestamp();
        WEBHOOK_INVALID.send({
            embeds: [WEBHOOK_EMBED]
        });
        return res.status(200).json({
            status: 400,
            content: '[Dragonxz] License is expired'
        });
    };

    if (license.ip == 'null') {
        const date = new Date(license.expires);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const expires = `${year}-${month}-${day}`;

        await updateLicense(key, ip, cfx, license.discord, expires, license.banned);

        const WEBHOOK_EMBED = new Discord.MessageEmbed()
            .setAuthor({
                name: 'Dragonxz - License Connected',
                iconURL: process.env.IMAGE_LOGO
            })
            .setColor('GREEN')
            .setThumbnail(process.env.IMAGE_LOGO)
            .addFields(
                { name: 'IP', value: `${ip || 'Unknown'}`, inline: true },
                { name: 'Date', value: `${new Date().toLocaleString()}`, inline: true },
                { name: 'Country', value: `${country || 'Unknown'}`, inline: true },
                { name: 'Region', value: `${regionName || 'Unknown'}`, inline: true },
                { name: 'ISP', value: `${isp || 'Unknown'}`, inline: true },
                { name: 'Organization', value: `${org || 'Unknown'}`, inline: true },
                { name: 'Information', value: `License connected`, inline: false }
            )
            .setImage(process.env.IMAGE_BANNER)
            .setFooter({
                text: 'Dragonxz Auth System - /blockip <ip> <reason>',
                iconURL: process.env.IMAGE_LOGO
            }).setTimestamp();
        WEBHOOK_SUCCESS.send({
            embeds: [WEBHOOK_EMBED]
        });        
        return res.status(200).json({
            status: 200,
            content: '[Dragonxz] License connected',
            expires: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
        });
    };

    if (license.ip !== ip) {
        const WEBHOOK_EMBED = new Discord.MessageEmbed()
            .setAuthor({
                name: 'Dragonxz - Invalid IP',
                iconURL: process.env.IMAGE_LOGO
            })
            .setColor('DARK_ORANGE')
            .setThumbnail(process.env.IMAGE_LOGO)
            .addFields(
                { name: 'IP', value: `${ip || 'Unknown'}`, inline: true },
                { name: 'Date', value: `${new Date().toLocaleString()}`, inline: true },
                { name: 'Country', value: `${country || 'Unknown'}`, inline: true },
                { name: 'Region', value: `${regionName || 'Unknown'}`, inline: true },
                { name: 'ISP', value: `${isp || 'Unknown'}`, inline: true },
                { name: 'Organization', value: `${org || 'Unknown'}`, inline: true },
                { name: 'Information', value: `Invalid IP`, inline: false }
            )
            .setImage(process.env.IMAGE_BANNER)
            .setFooter({
                text: 'Dragonxz Auth System - /blockip <ip> <reason>',
                iconURL: process.env.IMAGE_LOGO
            }).setTimestamp();
        WEBHOOK_INVALID.send({
            embeds: [WEBHOOK_EMBED]
        });

        return res.status(200).json({
            status: 400,
            content: 'Invalid IP'
        });
    };
    const WEBHOOK_EMBED = new Discord.MessageEmbed()
        .setAuthor({
            name: 'Dragonxz - License Connected',
            iconURL: process.env.IMAGE_LOGO
        })
        .setColor('GREEN')
        .setThumbnail(process.env.IMAGE_LOGO)
        .addFields(
            { name: 'IP', value: `${ip || 'Unknown'}`, inline: true },
            { name: 'Date', value: `${new Date().toLocaleString()}`, inline: true },
            { name: 'Country', value: `${country || 'Unknown'}`, inline: true },
            { name: 'Region', value: `${regionName || 'Unknown'}`, inline: true },
            { name: 'ISP', value: `${isp || 'Unknown'}`, inline: true },
            { name: 'Organization', value: `${org || 'Unknown'}`, inline: true },
            { name: 'Information', value: `License connected`, inline: false }
        )
        .setImage(process.env.IMAGE_BANNER)
        .setFooter({
            text: 'Dragonxz Auth System - /blockip <ip> <reason>',
            iconURL: process.env.IMAGE_LOGO
        }).setTimestamp();
    WEBHOOK_SUCCESS.send({
        embeds: [WEBHOOK_EMBED]
    });

    const licenseInfo = await getLicense(key);
    const date = new Date(licenseInfo.expires);
    
    return res.status(200).json({
        status: 200,
        content: '[Dragonxz] License connected',
        expires: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    });
});
app.get('*', async (req, res) => {
    res.status(200).json({
        status: 200,
        content: 'AYO'
    })
});
app.listen(80, async () => {
    console.clear();
    console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1mServer is running on http://localhost:80`);

    await db.delete('requests');
    console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1mRequests database is cleared`);
    connection.connect();
    console.log(`\x1b[1m\x1b[7m\x1b[32m[INFO]\x1b[0m \x1b[1mMySQL is connected`);
    connection.query(`CREATE TABLE IF NOT EXISTS licenses (license VARCHAR(255), ip VARCHAR(255), cfx VARCHAR(255), discord VARCHAR(255), expires DATE, banned BOOLEAN)`, (err, results) => {
        if (err) console.log(`[WARN] Error:`, err);
    });
    require('./src/bot.js');
    console.log(IconInPrint());
    function sqlExportFile() {
        const dateIsrael = new Date().toLocaleDateString().replaceAll('/', '-');
        if (!fs.existsSync('./backups')) fs.mkdirSync('./backups');
        if (!fs.existsSync(`./backups/${dateIsrael}`)) fs.mkdirSync(`./backups/${dateIsrael}`);

        connection.query(`SELECT * FROM licenses`, (err, results) => {
            if (err) console.log(`[WARN] Error:`, err);
            fs.writeFileSync(`./backups/${dateIsrael}/licenses.sql`, JSON.stringify(results), { flag: 'w' });
        });
    };
    setInterval(checkExpiredLicenses, 1000 * 60 * 10);
    setInterval(sqlExportFile, 1000 * 60 * 60 * 12);
});

// -=+=- Functions -=+=- //
function generateLicenseKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const key = [];
    for (let i = 0; i < 25; i++) {
        key.push(characters.charAt(Math.floor(Math.random() * characters.length)));
    };
    return 'Dragonxz-' + key.join('');
};

async function addLicense(license, ip, cfx, discord, expires, banned) {
    return new Promise((resolve, reject) => {
        connection.query(`INSERT INTO licenses (license, ip, cfx, discord, expires, banned) VALUES ('${license}', '${ip}', '${cfx}', '${discord}', '${expires}', '${banned}')`, (err, results) => {
            if (err) {
                console.log(`[WARN] Error:`, err);
                reject(err);
            } else {
                resolve(results[0]);
            };
        });
    });
};
async function updateLicense(license, ip, cfx, discord, expires, banned) {
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE licenses SET ip='${ip}', cfx='${cfx}', discord='${discord}', expires='${expires}', banned='${banned}' WHERE license='${license}'`, (err, results) => {
            if (err) {
                console.log(`[WARN] Error:`, err);
                reject(err);
            } else {
                resolve(results[0]);
            };
        });
    });
};
async function removeLicense(license) {
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM licenses WHERE license='${license}'`, (err, results) => {
            if (err) {
                console.log(`[WARN] Error:`, err);
                reject(err);
            } else {
                resolve(results[0]);
            };
        });
    });
};
async function getLicenses() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM licenses`, (err, results) => {
            if (err) {
                console.log(`[WARN] Error:`, err);
                reject(err);
            } else {
                resolve(results);
            };
        });
    });
};
async function getLicense(license) {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM licenses WHERE license='${license}'`, (err, results) => {
            if (err) {
                console.log(`[WARN] Error:`, err);
                reject(err);
            } else {
                resolve(results[0]);
            };
        });
    });
};
async function getLicenseByIP(ip) {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM licenses WHERE ip='${ip}'`, (err, results) => {
            if (err) {
                console.log(`[WARN] Error:`, err);
                reject(err);
            } else {
                resolve(results[0]);
            };
        });
    });
};
function checkExpiredLicenses() {
    connection.query(`SELECT * FROM licenses`, (err, results) => {
        if (err) console.log(`[WARN] Error:`, err);
        for (const license of results) {
            if (license.expires < new Date()) {
                removeLicense(license.license);
            };
        };
    });
};
global.db = db;
global.generateLicenseKey = generateLicenseKey;
global.addLicense = addLicense;
global.updateLicense = updateLicense;
global.removeLicense = removeLicense;
global.getLicenses = getLicenses;
global.getLicense = getLicense;
global.getLicenseByIP = getLicenseByIP;
global.checkExpiredLicenses = checkExpiredLicenses;

function IconInPrint() {
    return `
\x1b[34m   - Dragonxz API System.
\x1b[34m   - The API is running on port 80.
\x1b[34m   - The API ready to get requests from the servers.\x1b[0m`;
};


process.on('unhandledRejection', (err) => {
    console.log(`[ERROR] Unhandled Rejection:`, err);
});
process.on('uncaughtException', (err) => {
    console.log(`[ERROR] Uncaught Exception:`, err);
});
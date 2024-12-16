import config from "./config.js";
import fs from "node:fs";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";
import sharp from "sharp";
import { Client, GatewayIntentBits, ActivityType, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
dotenv.config();
const app = express();
app.use(express.static("public"));
const version = fs.readFileSync("version", "utf8");
let updateNeeded = false;
let last = JSON.parse(fs.readFileSync("public/last.json", "utf8"));
let sessionInfo = { checks: { testers: 0, updates: 0, topics: 0, status: 0 }, testupd: 0, mainupd: 0, newTopics: 0, erd: 0, efd: 0, esm: 0, ce: 0, tsit: [], lastStatusBegin: "", lastStatus: -1, lastLocation: "", placeId: null, gameId: null, status: 0, startTime: new Date().toISOString(), nextChecks: { testers: "", updates: "", topics:"", status: "" } };
async function log(data) {
    return fs.appendFileSync("public/logs.txt", `[${new Date().toISOString()}] ${data}\n`);
};
let gameChannel;
let devChannel;
const send = async (c, m) => await c.send(m).then((msg) => { msg.crosspost(); }).catch((err) => {
    sessionInfo.esm += 1;
    log(`❌ Error sending message: ${err.message}, ${err.stack || 'no stack trace available'}`);
});
function timeSince(isostr) {
    const timestamp = new Date(isostr).getTime();
    const now = new Date().getTime();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    let parts = [];
    if (hours && hours > 0) parts.push(`${hours} hora${hours != 1 ? "s" : ""}`);
    if (minutes && minutes > 0) parts.push(`${minutes} minuto${minutes != 1 ? "s" : ""}`);
    if (seconds && seconds > 0) parts.push(`${seconds} segundo${seconds != 1 ? "s" : ""}`);
    return parts.length > 0 ? parts.join(", ") : "agora";
};
async function downloadImageAsBuffer(url) {
    const response = await axios({
        url,
        responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
};
async function combineImages(imageUrls) {
    const sharpImages = [];
    for (let url of imageUrls) {
        const imageBuffer = await downloadImageAsBuffer(url);
        sharpImages.push(sharp(imageBuffer));
    }
    const { height } = await sharpImages[0].metadata();
    const resizedImagesBuffers = await Promise.all(
        sharpImages.map(image => image.resize({ height }).toBuffer({ resolveWithObject: true }))
    );
    const totalWidth = resizedImagesBuffers.reduce((sum, { info }) => sum + info.width, 0);
    const combinedHeight = resizedImagesBuffers[0].info.height;
    const combinedImageBuffer = await sharp({
        create: {
            width: totalWidth,
            height: combinedHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0 }
        }
    }).composite(resizedImagesBuffers.map((bufferObj, i) => ({
        input: bufferObj.data,
        left: resizedImagesBuffers.slice(0, i).reduce((sum, b) => sum + b.info.width, 0),
        top: 0
    }))).png().toBuffer();
    return combinedImageBuffer;
};
app.get("/version", (_, res) => {
    res.json({version: version, updateNeeded: updateNeeded});
});
app.get("/info", (_, res) => {
    res.json(sessionInfo);
});
app.get("/config", function(_, res) {
    res.json(config);
});
app.get("/check", async function (req, res) {
    if (req.query.check == "testers") {
        await checkTesters(true);
    } else if (req.query.check == "updates") {
        await checkUpdates(true);
    } else if (req.query.check == "topics") {
        await checkTopics(true);
        (true);
    } else if (req.query.check == "status") {
        await checkStatus(true);
    };
    res.json(sessionInfo);
});

const statusEmoji = ['⚫', '🔵', '🟢', '🟠', '❔'];
const statusText = ['offline', 'online', 'jogando', 'no studio', 'invisível'];
async function checkTesters(individual) {
    await axios.get(`https://games.roblox.com/v1/games/${config.testGame.placeId}/servers/0?sortOrder=2&excludeFullGames=false&limit=10`, { "headers": { "accept": "application/json" } })
        .then(async instances => {
            if (instances.data["data"]) {
                if (instances.data.data[0] && instances.data.data[0]["playerTokens"]) {
                    if (instances.data.data[0].playerTokens.length < 1 && sessionInfo.tsit.length == 0) return;
                    let changed = false;
                    let batchData = [];
                    let tokens = [];
                    for (let token of instances.data.data[0].playerTokens) {
                        if (!sessionInfo.tsit.includes(token)) {
                            changed = true;
                            sessionInfo.tsit.push(token);
                        };
                        tokens.push(token);
                        batchData.push({ "requestId": `0:${token}:AvatarHeadshot:150x150:png:regular`, "targetId": 0, "token": token, "type": "AvatarHeadShot", "size": "150x150", "format": "png" });
                    };
                    for (let i = 0; i < sessionInfo.tsit.length; i++) {
                        if (!tokens.includes(sessionInfo.tsit[i])) {
                            changed = true;
                            sessionInfo.tsit.splice(i, 1);
                        };
                    };
                    if (changed) {
                        await axios.post("https://thumbnails.roblox.com/v1/batch", batchData, { "headers": { "accept": "application/json", "Content-Type": "application/json" } })
                            .then(async batches => {
                                if (batches.data["data"] && batches.data.data.length > 0) {
                                    let imageUrls = [];
                                    for (let batch of batches.data.data) imageUrls.push(batch.imageUrl);
                                    const combinedImageBuffer = await combineImages(imageUrls);
                                    const image = new AttachmentBuilder(combinedImageBuffer, { name: 'image.png' })
                                    await send(gameChannel, {content: `\`👥\` desenvolvedores vistos no [${config.testGame.displayName}](<https://www.roblox.com/games/${config.testGame.placeId}>):\n-# ||<@&${config.discord.pings.testerPing}>||`, files: [image]});
                                } else {
                                    sessionInfo.erd += 1;
                                    log("❌ Line 130: Error reading data: " + JSON.stringify(batches.data));
                                };
                            })
                            .catch(error => {
                                sessionInfo.efd += 1;
                                log(`❌ Error fetching data: ${error.message}, ${error.stack || 'no stack trace available'}`);
                            });
                    };
                } else if (sessionInfo.tsit.length > 0) {
                    await send(gameChannel, `\`👥\` todos desenvolvedores vistos no [${config.testGame.displayName}](<https://www.roblox.com/games/${config.testGame.placeId}>) saíram\n-# ||<@&${config.discord.pings.testerPing}>||`);
                    sessionInfo.tsit = [];
                };
            } else {
                sessionInfo.erd += 1;
                log("❌ Line 151: Error reading data: " + JSON.stringify(instances.data));
            };
        })
        .catch(error => {
            sessionInfo.efd += 1;
            log(`❌ Error fetching data: ${error.message}, ${error.stack || 'no stack trace available'}`);
        });
    sessionInfo.checks.testers += 1;
    if (!individual) sessionInfo.nextChecks.testers = new Date(new Date().getTime() + 120000).toISOString();
    await updateStatus();
};
async function checkUpdates(individual) {
    await axios.get(`https://games.roblox.com/v1/games?universeIds=${config.mainGame.universeId}`, { "headers": { "accept": "application/json" } })
        .then(response => {
            if (response.data["data"] && response.data.data[0] && response.data.data[0]["updated"]) {
                if (response.data.data[0].updated != last.updated.main && (new Date(response.data.data[0].updated).getTime() > new Date(last.updated.main).getTime() + 1000)) {
                    log(`✅ ${config.mainGame.name.toUpperCase()} updated. From ${last.updated.main} to ${response.data.data[0].updated}.`);
                    last.updated.main = response.data.data[0].updated;
                    fs.writeFileSync("public/last.json", JSON.stringify(last));
                    sessionInfo.mainupd += 1;
                    axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${config.mainGame.universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`, { "headers": { "accept": "application/json" } })
                        .then(image => {
                            if (image.data["data"] && image.data.data[0] && image.data.data[0]["imageUrl"]) {
                                send(gameChannel, `# \`🚨\` [${config.mainGame.displayName.toUpperCase()}](https://www.roblox.com/games/${config.mainGame.placeId}) ATUALIZOU\n\`\`\`\n${response.data.data[0].description}\n\`\`\`\n[imagem](${image.data.data[0].imageUrl})\n-# há ${timeSince(response.data.data[0].updated)}\n-# ||<@&${config.discord.pings.mainUpdPing}>||`);
                            } else {
                                sessionInfo.erd += 1;
                                log("❌ Line 183: Error reading data: " + JSON.stringify(image.data));
                                send(gameChannel, `# \`🚨\` [${config.mainGame.displayName.toUpperCase()}](https://www.roblox.com/games/${config.mainGame.placeId}) ATUALIZOU\n\`\`\`\n${response.data.data[0].description}\n-# há ${timeSince(response.data.data[0].updated)}\n-# ||<@&${config.discord.pings.mainUpdPing}>||`);
                            }
                        })
                        .catch(error => {
                            sessionInfo.efd += 1;
                            log(`❌ Error fetching data: ${error.message}, ${error.stack || 'no stack trace available'}`)
                        });
                };
            } else {
                sessionInfo.erd += 1;
                log("❌ Line 194: Error reading data: " + JSON.stringify(response.data));
            };
        })
        .catch(error => {
            sessionInfo.efd += 1;
            log(`❌ Error fetching data: ${error.message}, ${error.stack || 'no stack trace available'}`)
        });
    await axios.get(`https://games.roblox.com/v1/games?universeIds=${config.testGame.universeId}`, { "headers": { "accept": "application/json" } })
        .then(async response => {
            if (response.data["data"] && response.data.data[0] && response.data.data[0]["updated"]) {
                if (response.data.data[0].updated != last.updated.test && (new Date(response.data.data[0].updated).getTime() > new Date(last.updated.test).getTime() + 1000)) {
                    log(`✅ ${config.testGame.name.toUpperCase()} updated. From ${last.updated.test} to ${response.data.data[0].updated}.`);
                    last.updated.test = response.data.data[0].updated;
                    fs.writeFileSync("public/last.json", JSON.stringify(last));
                    sessionInfo.testupd += 1;
                    send(gameChannel, `# \`🚨\` [${config.testGame.displayName.toUpperCase()}](<https://www.roblox.com/games/${config.testGame.placeId}>) ATUALIZOU\n-# há ${timeSince(response.data.data[0].updated)}\n-# ||<@&${config.discord.pings.testUpdPing}>||`);
                };
            } else {
                sessionInfo.erd += 1;
                log("❌ Line 161: Error reading data: " + JSON.stringify(response.data));
            };
        })
        .catch(error => {
            sessionInfo.efd += 1;
            log(`❌ Error fetching data: ${error.message}, ${error.stack || 'no stack trace available'}`);
        });
    sessionInfo.checks.updates += 1;
    if (!individual) sessionInfo.nextChecks.updates = new Date(new Date().getTime() + 60000).toISOString();
    await updateStatus();
};
async function checkTopics(individual) {
    await axios.get(`https://devforum.roblox.com/topics/created-by/${config.leadDev.username.toLowerCase()}.json`)
        .then(function (response) {
            if (response.data["topic_list"] && response.data.topic_list["topics"]) {
                response.data.topic_list.topics.forEach(function(topic) {
                    if (!last.topics.includes(topic.id)) {
                        last.topics.push(topic.id);
                        log(`📰 New topic by ${config.leadDev.username}. https://devforum.roblox.com/t/${topic.slug}/${topic.id}`);
                        fs.writeFileSync("public/last.json", JSON.stringify(last));
                        sessionInfo.newTopics += 1;
                        send(devChannel, `\`📰\` novo tópico no devforum pel${config.leadDev.preDisplay} ${config.leadDev.username}: https://devforum.roblox.com/t/${topic.slug}/${topic.id}\n-# há ${timeSince(topic.created_at)}\n-# ||<@&${config.discord.pings.topicsPing}>||`);
                    };
                });
            } else {
                sessionInfo.erd += 1;
                log("❌ Line 231: Error reading data: " + JSON.stringify(response.data));
            }
        })
        .catch(function (error) {
            sessionInfo.efd += 1;
            log(`❌ Error fetching data: ${error.message}, ${error.stack || 'no stack trace available'}`);
        });
    sessionInfo.checks.topics += 1;
    if (!individual) sessionInfo.nextChecks.topics = new Date(new Date().getTime() + 60000).toISOString();
    await updateStatus();
};
async function checkStatus(individual) {
    await axios.post("https://presence.roblox.com/v1/presence/users", { "userIds": [config.leadDev.userId] }, {
        headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "Cookie": process.env.cookie
        }, withCredentials: true
    })
        .then(function (response) {
            if (response.data["userPresences"] && response.data.userPresences[0] && !isNaN(response.data.userPresences[0]["userPresenceType"])) {
                if (sessionInfo.status != response.data.userPresences[0].userPresenceType || sessionInfo.gameId != response.data.userPresences[0].gameId) {
                    log(`🔎 ${config.leadDev.username}'s status changed from ${sessionInfo.status} to ${response.data.userPresences[0].userPresenceType}`);
                    sessionInfo.lastStatus = sessionInfo.status;
                    sessionInfo.status = response.data.userPresences[0].userPresenceType;
                    sessionInfo.placeId = response.data.userPresences[0].placeId;
                    sessionInfo.gameId = response.data.userPresences[0].gameId;
                    if (response.data.userPresences[0].userPresenceType === 2 && response.data.userPresences[0].placeId && response.data.userPresences[0].gameId) {
                        const button = new ButtonBuilder()
                            .setLabel('entrar')
                            .setURL(`https://deepblox.onrender.com/experiences/start?placeId=${response.data.userPresences[0].placeId}&gameInstanceId=${response.data.userPresences[0].gameId}`)
                            .setStyle(ButtonStyle.Link);
                        const row = new ActionRowBuilder()
                            .addComponents(button);
                        send(devChannel, {
                            content: `\`🟢\` ${config.leadDev.preDisplay} [${config.leadDev.displayName}](<https://www.roblox.com/users/${config.leadDev.userId}>) está jogando [${response.data.userPresences[0].lastLocation}](https://www.roblox.com/games/${response.data.userPresences[0].placeId})${sessionInfo.lastStatus > 0 ? `\n-# ficou ${sessionInfo.lastStatus == 2 ? `jogando ${sessionInfo.lastLocation}` : statusText[sessionInfo.lastStatus]} por ${timeSince(sessionInfo.lastStatusBegin)}` : ""}\n-# ||<@&${config.discord.pings.statusPing}>||`,
                            components: [row]
                        });
                    } else send(devChannel, `\`${statusEmoji[sessionInfo.status]}\` ${config.leadDev.preDisplay} [${config.leadDev.displayName}](<https://www.roblox.com/users/${config.leadDev.userId}>) está ${statusText[sessionInfo.status]}${sessionInfo.lastStatus > 0 ? `\n-# ficou ${sessionInfo.lastStatus == 2 ? `jogando ${sessionInfo.lastLocation}` : statusText[sessionInfo.lastStatus]} por ${timeSince(sessionInfo.lastStatusBegin)}` : ""}\n-# ||<@&${response.data.userPresences[0].userPresenceType == 3 ? config.discord.pings.studioPing : config.discord.pings.statusPing}>||`);
                    sessionInfo.lastLocation = response.data.userPresences[0].lastLocation;
                    sessionInfo.lastStatusBegin = new Date().toISOString();
                };
            } else {
                sessionInfo.erd += 1;
                log("❌ Line 214: Error reading data: " + JSON.stringify(response.data));
            };
        })
        .catch(function (error) {
            sessionInfo.efd += 1;
            log(`❌ Error fetching data: ${error.message}, ${error.stack || 'no stack trace available'}`);
        });
    sessionInfo.checks.status += 1;
    if (!individual) sessionInfo.nextChecks.status = new Date(new Date().getTime() + 30000).toISOString();
    await updateStatus();
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let statusMessage;
let updating = false;
async function updateStatus(goingOffline) {
    if (updating) return;
    updating = true;
    const embed = new EmbedBuilder()
        .setColor(goingOffline ? 0xff0000 : 0x00ff00)
        .setTitle(config.discord.displayName)
        .setURL("https://discord.gg/6SMbZn7KtW")
        .setDescription(config.discord.description)
        .addFields(
            { "name": `desenvolvedores no ${config.testGame.name}`, "value": `\`👥\` ${sessionInfo.tsit.length}${sessionInfo.tsit.length > 0 ? " [(veja aqui)](https://discord.com/channels/1247404953073483877/1264712451572891678)" : ""}` },
            { "name": "últimas atualizações", "value": `\`${config.testGame.name}\`  - <t:${Math.floor(new Date(last.updated.test).getTime() / 1000)}>\n\`${config.mainGame.name}\` - <t:${Math.floor(new Date(last.updated.main).getTime() / 1000)}>` },
            { "name": `status atual d${config.leadDev.preDisplay} ${config.leadDev.displayName}`, "value": `\`${statusEmoji[sessionInfo.status]}\` ${statusText[sessionInfo.status]}${sessionInfo.lastStatus >= 0 ? ` (<t:${Math.floor(new Date(sessionInfo.lastStatusBegin).getTime() / 1000)}:R>)` : ""}` },
            { "name": `último status d${config.leadDev.preDisplay} ${config.leadDev.displayName}`, "value": sessionInfo.lastStatus >= 0 ? `\`${statusEmoji[sessionInfo.lastStatus]}\` ${statusText[sessionInfo.lastStatus]}` : "`❔` nenhum" },
            { "name": "próximas verificações", "value": `\`desenvolvedores no ${config.testGame.name}\`: <t:${Math.floor(new Date(sessionInfo.nextChecks.testers).getTime() / 1000)}:R>\n\`atualizações\`: <t:${Math.floor(new Date(sessionInfo.nextChecks.updates).getTime() / 1000)}:R>\n\`tópicos\`: <t:${Math.floor(new Date(sessionInfo.nextChecks.topics).getTime() / 1000)}:R>\n\`status\`: <t:${Math.floor(new Date(sessionInfo.nextChecks.status).getTime() / 1000)}:R>` }
        )
        .setFooter({ text: `v${version}` });

    if (!statusMessage) {
        const statusChannel = await client.channels.fetch(config.discord.channels.statusId);
        await statusChannel.bulkDelete(await statusChannel.messages.fetch({ limit: 100 }));
        await statusChannel.send({ embeds: [embed] })
            .then(message => {
                statusMessage = message;
            });
    } else {
        await statusMessage.edit({ embeds: [embed] });
    };
    updating = false;
};

const advertisement = fs.readFileSync("advertisement.txt", "utf8");
async function advertise() {
    const advertiseChannel = await client.channels.fetch(config.discord.channels.advertiseId);
    await advertiseChannel.bulkDelete(await advertiseChannel.messages.fetch({ limit: 100 }));
    await advertiseChannel.send({content: advertisement})
};

async function checkBotUpdates() {
    if (updateNeeded) return;
    await axios.get("https://raw.githubusercontent.com/luluwaffless/ftfspy/refs/heads/main/version")
        .then(function(response) {
            if (response.data.trim() != version.trim()) {
                updateNeeded = true;
                console.log(`⚠️ New version v${response.data.trim()}! Please update by using "git pull".`); // if this doesn't work istg im gonna freak out
            };
        })
        .catch(function (error) {
            sessionInfo.efd += 1;
            log(`❌ Error fetching data: ${error.message}, ${error.stack || 'no stack trace available'}`);
        });
};

const startUp = (f, t) => { f(); setInterval(f, t * 1000); };
const changeName = (n, c) => { if (c.name != n) return c.setName(n); };
client.on('ready', async function () {
    gameChannel = await client.channels.fetch(config.discord.channels.gameUpdatesId);
    devChannel = await client.channels.fetch(config.discord.channels.devUpdatesId);
    const vc = await client.channels.fetch(config.discord.channels.vcStatusId);
    await changeName("bot: online 🟢", vc);
    client.user.setPresence({
        activities: [{
            name: config.discord.status,
            type: ActivityType.Watching
        }],
        status: 'online'
    });
    if (config.checkBotUpdates) startUp(checkBotUpdates, 300);
    if (config.advertise) startUp(advertise, 86400);
    startUp(checkTesters, 120);
    startUp(checkUpdates, 60);
    startUp(checkTopics, 60);
    startUp(checkStatus, 30);
    app.listen(config.port, function () {
        console.log("✅ http://localhost:" + config.port);
    });
    log("🟢 Online");
    for (let evt of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
        process.on(evt, async function () {
            process.stdin.resume();
            await changeName("bot: offline 🔴", vc);
            await updateStatus(true);
            await log("🔴 Offline");
            process.exit();
        });
    };
    process.on('unhandledRejection', (reason, promise) => {
        sessionInfo.ce += 1;
        log(`❌ Unhandled Rejection at ${promise}: ${reason} (${reason.message || 'no message'}, ${reason.stack || 'no stack'})`);
    });
      
    process.on('uncaughtException', (err) => {
        sessionInfo.ce += 1;
        log(`❌ Uncaught Exception: ${err.message}, ${err.stack}`);
    });
});
client.login(process.env.token);

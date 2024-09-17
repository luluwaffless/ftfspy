import fs from "node:fs";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
dotenv.config();
const app = express();
app.use(express.static("public"));
let lastUpdated = JSON.parse(fs.readFileSync("public/lastupdated.json", "utf8"));
let testers = JSON.parse(fs.readFileSync("public/testers.json", "utf8"));
let sessionInfo = {checks: 0, indupd: 0, ftfupd: 0, erd: 0, efd: 0, esm: 0, tsii: [], lastStatus: 0, startTime: new Date().toISOString(), nextCheck: ""};
async function log(data) {
    return fs.appendFileSync("public/logs.txt", `[${new Date().toISOString()}] ${data}\n`);
};
async function send(content) {
    return await axios.post(process.env.webhook, {"content": content}, {"headers": {'Content-Type': 'application/json'}})
        .catch((error) => {
            sessionInfo.esm += 1;
            log(`❌ Line 19: Error sending message: ${error}`);
        });
};
function timeSince(timestamp) {
    const now = new Date().getTime();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    let parts = [];
    if (hours && hours > 0) parts.push(`${hours} hora${hours != 1 ? "s" : ""}`);
    if (minutes && minutes > 0) parts.push(`${minutes} minuto${minutes != 1 ? "s" : ""}`);
    if (seconds && seconds > 0) parts.push(`${seconds} segundo${seconds != 1 ? "s" : ""}`);
    return parts.length > 0 ? `há ${parts.join(", ")}` : "agora";
};
function getTester(id) {
    for (let i = 0; i < testers.data.length; i++) {
        if (testers.data[i].id === id) {
            return testers.data[i];
        };
    };
    return null;
};
async function getTesters(responseBatch) {
    let returnArr = []
    for (let batch of responseBatch.data) {
        for (let i = 0; i < testers.data.length; i++) {
            if (testers.data[i].img == batch.imageUrl) {
                returnArr.push(testers.data[i]);
            } else {
                await axios.post("https://thumbnails.roblox.com/v1/batch", [{"requestId": `${testers.data[i].id}::AvatarHeadshot:150x150:webp:regular`, "targetId": Number(testers.data[i].id), "token": "", "type": "AvatarHeadShot", "size": "150x150", "format": "webp"}], {"headers": {"accept": "application/json", "Content-Type": "application/json"}})
                    .then(testerBatch => {
                        if (testerBatch.data["data"] && testerBatch.data.data[0] && testerBatch.data.data[0]["imageUrl"]) {
                            if (testerBatch.data.data[0].imageUrl == batch.imageUrl) {
                                returnArr.push(testers.data[i]);
                                testers.data[i].img = testerBatch.data.data[0].imageUrl;
                                fs.writeFileSync("public/testers.json", JSON.stringify(testers));
                            };
                        } else {
                            sessionInfo.erd += 1;
                            log("❌ Line 59: Line  Error reading data: " + JSON.stringify(testerBatch.data));
                        };
                    })
                    .catch(error => {
                        sessionInfo.efd += 1;
                        log("❌ Line 64: Error fetching data: " + error);
                    });
            };
        };
    };
    return returnArr;
};
app.get("/info", (_, res) => {
    res.json(sessionInfo);
});
app.get("/check", async function(_, res) {
    await check(false);
    res.json(sessionInfo);
}); 

const statusEmoji = ['⚫', '🔵', '🟢', '🟠', '❔'];
const statusText = ['offline', 'online', 'jogando', 'no studio', 'invisível'];
async function check(repeat) {
    await axios.get("https://games.roblox.com/v1/games?universeIds=174252938", {"headers": {"accept": "application/json"}})
        .then(async response => {
            if (response.data["data"] && response.data.data[0] && response.data.data[0]["updated"] && !(isNaN(response.data.data[0]["playing"]))) {
                if (response.data.data[0].updated != lastUpdated.indev && (new Date(response.data.data[0].updated).getTime() > new Date(lastUpdated.indev).getTime() + 1000)) {
                    log(`✅ INDEV updated. From ${lastUpdated.indev} to ${response.data.data[0].updated}.`);
                    lastUpdated.indev = response.data.data[0].updated;
                    fs.writeFileSync("public/lastupdated.json", JSON.stringify(lastUpdated));
                    sessionInfo.indupd += 1;
                    send("# `🚨` [INDEV](<https://www.roblox.com/games/455327877/FTF-In-Dev>) ATUALIZOU @everyone\n-# " + timeSince(new Date(response.data.data[0].updated).getTime()));
                };
                if (response.data.data[0].playing > 2 || sessionInfo.tsii.length > 0) {
                    log("🔎 Checking players...")
                    await axios.get("https://games.roblox.com/v1/games/455327877/servers/0?sortOrder=2&excludeFullGames=false&limit=10", {"headers": {"accept": "application/json"}})
                        .then(async instances => {
                            if (instances.data["data"] && instances.data.data[0] && instances.data.data[0]["playerTokens"]) {
                                let batchData = [];
                                for (let token of instances.data.data[0].playerTokens) {
                                    batchData.push({"requestId": `0:${token}:AvatarHeadshot:150x150:webp:regular`, "targetId": 0, "token": token, "type": "AvatarHeadShot", "size": "150x150", "format": "webp"});
                                };
                                await axios.post("https://thumbnails.roblox.com/v1/batch", batchData, {"headers": {"accept": "application/json", "Content-Type": "application/json"}})
                                    .then(async batches => {
                                        if (batches.data["data"] && batches.data.data.length > 0) {
                                            const testers = await getTesters(batches.data);
                                            if (testers && testers.length > 0) {
                                                let diff = [];
                                                let list = [];
                                                let testerIds = [];
                                                testers.forEach(tester => {
                                                    list.push(`- [${tester.name}](<https://www.roblox.com/users/${tester.id}/profile>)`);
                                                    testerIds.push(tester.id);
                                                    if (!sessionInfo.tsii.includes(tester.id)) {
                                                        diff.push(`+ ${tester.name} (${tester.id})`)
                                                        sessionInfo.tsii.push(tester.id);
                                                    };
                                                });
                                                for (let i = 0; i < sessionInfo.tsii.length; i++) {
                                                    if (!testerIds.includes(sessionInfo.tsii[i])) {
                                                        const tester = getTester(sessionInfo.tsii[i]);
                                                        diff.push(`- ${tester.name} (${tester.id})`);
                                                        sessionInfo.tsii.splice(i, 1);
                                                    };
                                                };
                                                if (diff.length > 0) {
                                                    send(`\`👥\` desenvolvedores vistos no [indev](<https://www.roblox.com/games/455327877/FTF-In-Dev>):\n${list.join('\n')}\n\`\`\`diff\n${diff.join('\n')}\n\`\`\`\n-# ||<@&1273043382519861430>||`);
                                                };
                                            };
                                        } else {
                                            sessionInfo.erd += 1;
                                            log("❌ Line 130: Error reading data: " + JSON.stringify(batches.data));
                                        };
                                    })
                                    .catch(error => {
                                        sessionInfo.efd += 1;
                                        log("❌ Line 135: Error fetching data: " + error);
                                    });
                            } else if (sessionInfo.tsii.length > 0 && instances.data["data"] && !instances.data.data[0]) {
                                let diff = [];
                                for (let i = 0; i < sessionInfo.tsii.length; i++) {
                                    if (!testerIds.includes(sessionInfo.tsii[i])) {
                                        const tester = getTester(sessionInfo.tsii[i]);
                                        diff.push(`- ${tester.name} (${tester.id})`);
                                        sessionInfo.tsii.splice(i, 1);
                                    };
                                };
                                if (diff.length > 0) {
                                    send(`\`👥\` desenvolvedores vistos no [indev](<https://www.roblox.com/games/455327877/FTF-In-Dev>):\`\`\`diff\n${diff.join('\n')}\n\`\`\`\n-# ||<@&1273043382519861430>||`);
                                };
                            } else {
                                sessionInfo.erd += 1;
                                log("❌ Line 151: Error reading data: " + JSON.stringify(instances.data));
                            };
                        })
                        .catch(error => {
                            sessionInfo.efd += 1;
                            log("❌ Line 156: Error fetching data: " + error);
                        });
                };
            } else {
                sessionInfo.erd += 1;
                log("❌ Line 161: Error reading data: " + JSON.stringify(response.data));
            };
        })
        .catch(error => {
            sessionInfo.efd += 1;
            log("❌ Line 166: Error fetching data: " + error);
        });
        
    await axios.get("https://games.roblox.com/v1/games?universeIds=372226183", {"headers": {"accept": "application/json"}})
        .then(response => {
            if (response.data["data"] && response.data.data[0] && response.data.data[0]["updated"]) {
                if (response.data.data[0].updated != lastUpdated.ftf && (new Date(response.data.data[0].updated).getTime() > new Date(lastUpdated.ftf).getTime() + 1000)) {
                    log(`✅ FTF updated. From ${lastUpdated.ftf} to ${response.data.data[0].updated}.`);
                    lastUpdated.ftf = response.data.data[0].updated;
                    fs.writeFileSync("public/lastupdated.json", JSON.stringify(lastUpdated));
                    sessionInfo.ftfupd += 1;
                    axios.get("https://thumbnails.roblox.com/v1/games/icons?universeIds=372226183&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false", {"headers": {"accept": "application/json"}})
                        .then(image => {
                            if (image.data["data"] && image.data.data[0] && image.data.data[0]["imageUrl"]) {
                                send(`# \`🚨\` [MARRETÃO](https://www.roblox.com/games/893973440/Flee-the-Facility) ATUALIZOU @everyone\n\`\`\`\n${response.data.data[0].description}\n\`\`\`\n[imagem](${image.data.data[0].imageUrl})\n-# ${timeSince(new Date(response.data.data[0].updated).getTime())}`);
                            } else {
                                sessionInfo.erd += 1;
                                log("❌ Line 183: Error reading data: " + JSON.stringify(image.data));
                                send(`# \`🚨\` [MARRETÃO](https://www.roblox.com/games/893973440/Flee-the-Facility) ATUALIZOU @everyone\n\`\`\`\n${response.data.data[0].description}\n-# ${timeSince(new Date(response.data.data[0].updated).getTime())}`);
                            }
                        })
                        .catch(error => {
                            sessionInfo.efd += 1;
                            log("❌ Line 189: Error fetching data: " + error)
                        });
                };
            } else {
                sessionInfo.erd += 1;
                log("❌ Line 194: Error reading data: " + JSON.stringify(response.data));
            };
        })
        .catch(error => {
            sessionInfo.efd += 1;
            log("❌ Line 199: Error fetching data: " + error)
        });
    axios.post("https://presence.roblox.com/v1/presence/users", {"userIds": [7140919]}, { headers: {
        "accept": "application/json",
        "Content-Type": "application/json"
    } })
        .then(function(response) {
            if (response.data["userPresences"] && response.data.userPresences[0] && !isNaN(response.data.userPresences[0]["userPresenceType"])) {
                if (sessionInfo.lastStatus != response.data.userPresences[0].userPresenceType) {
                    log(`🔎 MrWindy's status changed from ${sessionInfo.lastStatus} to ${response.data.userPresences[0].userPresenceType}`);
                    sessionInfo.lastStatus = response.data.userPresences[0].userPresenceType;
                    send(`\`${statusEmoji[sessionInfo.lastStatus]}\` o [MrWindy](<https://www.roblox.com/users/7140919/profile>) está ${statusText[sessionInfo.lastStatus]}\n-# ||<@&1284206679822696559>||`);
                };
            } else {
                sessionInfo.erd += 1;
                log("❌ Line 214: Error reading data: " + JSON.stringify(response.data));
            };
        })
        .catch(function(error) {
            sessionInfo.efd += 1;
            log(`❌ Line 219: Error fetching data: ${error}`);
        });

    sessionInfo.checks += 1;
    if (repeat === true) { 
        sessionInfo.nextCheck = new Date(new Date().getTime() + 120000).toISOString();
        setTimeout(function() { 
            check(true); 
        }, 120000); 
    };
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.on('ready', async function() {
    const tc = await client.channels.fetch('1264712451572891678');
    const vc = await client.channels.fetch('1283187128469295176');
    await tc.setName("🟢︱ftfspy");
    await vc.setName("bot: online 🟢");
    app.listen(process.env.port, function() {
        console.log("✅ http://localhost:" + process.env.port);
        log("🟢 Online");
    });
    check(true);
    for (let evt of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
        process.on(evt, async function() {
            process.stdin.resume();
            await tc.setName("🔴︱ftfspy");
            await vc.setName("bot: offline 🔴");
            await log("🔴 Offline");
            process.exit();
        });
    };
});
client.login(process.env.token);

export default {
    emoji: "🇧🇷🇵🇹",
    playing: "jogando",
    join: "entrar",
    now: "agora",
    probability: ["`⚫` impossível", "`🔴` muito baixa", "`🟠` baixa", "`🟡` mediana", "`🟢` alta", "`🔵` muito alta", "`🟣` extremamente alto"],
    statusText: ['offline', 'online', 'jogando', 'no studio', 'invisível'],
    hours: (hours) => `hora${hours != 1 ? "s" : ""}`,
    minutes: (minutes) => `minuto${minutes != 1 ? "s" : ""}`,
    seconds: (seconds) => `segundo${seconds != 1 ? "s" : ""}`,
    devsinindev: (displayName, placeId, probability, testerPing) => `\`👥\` desenvolvedores vistos no [${displayName}](<https://www.roblox.com/games/${placeId}>):\n-# probabilidade de atualizar atual: ${probability}\n-# ||<@&${testerPing}>||`,
    devsleft: (displayName, placeId, probability, testerPing) => `\`👥\` todos desenvolvedores vistos no [${displayName}](<https://www.roblox.com/games/${placeId}>) saíram\n-# probabilidade de atualizar atual: ${probability}\n-# ||<@&${testerPing}>||`,
    mainupdimg: (displayName, placeId, description, imageUrl, updatedTime, mainUpdPing) => `# \`🚨\` [${displayName.toUpperCase()}](https://www.roblox.com/games/${placeId}) ATUALIZOU\n\`\`\`\n${description}\n\`\`\`\n[imagem](${imageUrl})\n-# ${updatedTime != "agora" ? "há " : ""}${updatedTime}\n-# ||<@&${mainUpdPing}>||`,
    mainupd: (displayName, placeId, description, updatedTime, mainUpdPing) => `# \`🚨\` [${displayName.toUpperCase()}](https://www.roblox.com/games/${placeId}) ATUALIZOU\n\`\`\`\n${description}\n\`\`\`\n-# ${updatedTime != "agora" ? "há " : ""}${updatedTime}\n-# ||<@&${mainUpdPing}>||`,
    testupd: (displayName, placeId, updatedTime, probability, testUpdPing) => `# \`🚨\` [${displayName.toUpperCase()}](<https://www.roblox.com/games/${placeId}>) ATUALIZOU\n-# ${updatedTime != "agora" ? "há " : ""}${updatedTime}\n-# probabilidade de atualizar atual: ${probability}\n-# ||<@&${testUpdPing}>||`,
    newtopic: (preDisplay, username, topicSlug, topicId, createdAt, probability, topicsPing) => `\`📰\` novo tópico no devforum pel${preDisplay} ${username}: https://devforum.roblox.com/t/${topicSlug}/${topicId}\n-# ${createdAt != "agora" ? "há " : ""}${createdAt}\n-# probabilidade de atualizar atual: ${probability}\n-# ||<@&${topicsPing}>||`,
    onlineindevforum: (preDisplay, displayName, username, probability, topicsPing) => `\`⚪\` ${preDisplay} [${displayName}](<https://devforum.roblox.com/u/${username}/summary>) está online **no devforum**\n-# probabilidade de atualizar atual: ${probability}\n-# ||<@&${topicsPing}>||`,
    joinedgame: (preDisplay, displayName, userId, lastLocation, placeId, lastStatus, lastStatusText, lastStatusBegin, probability, statusPing) => `\`🟢\` ${preDisplay} [${displayName}](<https://www.roblox.com/users/${userId}>) está jogando [${lastLocation}](https://www.roblox.com/games/${placeId})${lastStatus > 0 ? `\n-# ficou ${lastStatus == 2 && lastLocation ? `jogando ${lastLocation}` : lastStatusText} por ${lastStatusBegin}` : ""}\n-# probabilidade de atualizar atual: ${probability}\n-# ||<@&${statusPing}>||`,
    changedstatus: (statusEmoji, status, preDisplay, displayName, userId, lastLocation, lastStatus, lastStatusText, lastStatusBegin, presenceType, probability, studioPing, statusPing) => `\`${statusEmoji}\` ${preDisplay} [${displayName}](<https://www.roblox.com/users/${userId}>) está ${status}${lastStatus > 0 ? `\n-# ficou ${lastStatus == 2  && lastLocation ? `jogando ${lastLocation}` : lastStatusText} por ${lastStatusBegin}` : ""}\n-# probabilidade de atualizar atual: ${probability}\n-# ||<@&${presenceType == 3 ? studioPing : statusPing}>||`,
    embedFields: (serverId, gameUpdatesId, preDisplay, displayName, tsit, testGameName, testLastUpdate, mainGameName, mainLastUpdate, statusEmoji, currentStatusText, currentStatusTime, lastStatusEmoji, lastStatusText, probability, nextChecks) => [
        { "name": `desenvolvedores no ${testGameName}`, "value": `\`👥\` ${tsit}${tsit > 0 ? ` [(veja aqui)](https://discord.com/channels/${serverId}/${gameUpdatesId})` : ""}` },
        { "name": "últimas atualizações", "value": `\`${testGameName}\`  - <t:${testLastUpdate}>\n\`${mainGameName}\` - <t:${mainLastUpdate}>` },
        { "name": `status atual d${preDisplay} ${displayName}`, "value": `\`${statusEmoji}\` ${currentStatusText}${currentStatusTime ? ` (<t:${currentStatusTime}:R>)` : ""}` },
        { "name": `último status d${preDisplay} ${displayName}`, "value": lastStatusEmoji ? `\`${lastStatusEmoji}\` ${lastStatusText}` : "`❔` nenhum" },
        { "name": "probabilidade de atualizar atual", "value": probability },
        { "name": "próximas verificações", "value": `\`probabilidade\`: <t:${nextChecks.probability}:R>\n\`desenvolvedores no ${testGameName}\`: <t:${nextChecks.testers}:R>\n\`atualizações\`: <t:${nextChecks.updates}:R>\n\`tópicos\`: <t:${nextChecks.topics}:R>\n\`status\`: <t:${nextChecks.status}:R>` }
    ]
};
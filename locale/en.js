export default {
    emoji: "🇺🇸🇬🇧",
    playing: "playing",
    join: "join",
    now: "now",
    probability: ["`🔴` very low", "`🟠` low", "`🟡` average", "`🟢` high", "`🔵` very high", "`❔` unknown"],
    statusText: ['offline', 'online', 'playing', 'in studio', 'invisible'],
    hours: (hours) => `hour${hours != 1 ? "s" : ""}`,
    minutes: (minutes) => `minute${minutes != 1 ? "s" : ""}`,
    seconds: (seconds) => `second${seconds != 1 ? "s" : ""}`,
    devsinindev: (displayName, placeId, probability, testerPing) => `\`👥\` developers seen in [${displayName}](<https://www.roblox.com/games/${placeId}>):\n-# current update probability: ${probability}\n-# ||<@&${testerPing}>||`,
    devsleft: (displayName, placeId, probability, testerPing) => `\`👥\` all developers seen in [${displayName}](<https://www.roblox.com/games/${placeId}>) left\n-# current update probability: ${probability}\n-# ||<@&${testerPing}>||`,
    mainupdimg: (displayName, placeId, description, imageUrl, updatedTime, mainUpdPing) => `# \`🚨\` [${displayName.toUpperCase()}](https://www.roblox.com/games/${placeId}) UPDATED\n\`\`\`\n${description}\n\`\`\`\n[image](${imageUrl})\n-# ${updatedTime}${updatedTime != "now" ? " ago" : ""}\n-# ||<@&${mainUpdPing}>||`,
    mainupd: (displayName, placeId, description, updatedTime, mainUpdPing) => `# \`🚨\` [${displayName.toUpperCase()}](https://www.roblox.com/games/${placeId}) UPDATED\n\`\`\`\n${description}\n\`\`\`\n-# ${updatedTime}${updatedTime != "now" ? " ago" : ""}\n-# ||<@&${mainUpdPing}>||`,
    testupd: (displayName, placeId, updatedTime, probability, testUpdPing) => `# \`🚨\` [${displayName.toUpperCase()}](<https://www.roblox.com/games/${placeId}>) UPDATED\n-# ${updatedTime}${updatedTime != "now" ? " ago" : ""}\n-# current update probability: ${probability}\n-# ||<@&${testUpdPing}>||`,
    newtopic: (preDisplay, username, topicSlug, topicId, createdAt, probability, topicsPing) => `\`📰\` new topic in devforum by ${preDisplay} ${username}: https://devforum.roblox.com/t/${topicSlug}/${topicId}\n-# ${createdAt}${createdAt != "now" ? " ago" : ""}\n-# current update probability: ${probability}\n-# ||<@&${topicsPing}>||`,
    onlineindevforum: (preDisplay, displayName, username, probability, topicsPing) => `\`⚪\` ${preDisplay} [${displayName}](<https://devforum.roblox.com/u/${username}/summary>) is online **in devforum**\n-# current update probability: ${probability}\n-# ||<@&${topicsPing}>||`,
    joinedgame: (preDisplay, displayName, userId, lastLocation, placeId, lastStatus, lastStatusText, lastStatusBegin, probability, statusPing) => `\`🟢\` ${preDisplay} [${displayName}](<https://www.roblox.com/users/${userId}>) is playing [${lastLocation}](https://www.roblox.com/games/${placeId})${lastStatus > 0 ? `\n-# was ${lastStatus == 2 && lastLocation ? `jogando ${lastLocation}` : lastStatusText} for ${lastStatusBegin}` : ""}\n-# current update probability: ${probability}\n-# ||<@&${statusPing}>||`,
    changedstatus: (statusEmoji, status, preDisplay, displayName, userId, lastLocation, lastStatus, lastStatusText, lastStatusBegin, presenceType, probability, studioPing, statusPing) => `\`${statusEmoji}\` ${preDisplay} [${displayName}](<https://www.roblox.com/users/${userId}>) is ${status}${lastStatus > 0 ? `\n-# was ${lastStatus == 2 && lastLocation ? `playing ${lastLocation}` : lastStatusText} for ${lastStatusBegin}` : ""}\n-# current update probability: ${probability}\n-# ||<@&${presenceType == 3 ? studioPing : statusPing}>||`,
    embedFields: (serverId, gameUpdatesId, preDisplay, displayName, tsit, testGameName, testLastUpdate, mainGameName, mainLastUpdate, statusEmoji, currentStatusText, currentStatusTime, lastStatusEmoji, lastStatusText, probability, nextChecks) => [
        { "name": `devellopers in ${testGameName}`, "value": `\`👥\` ${tsit}${tsit > 0 ? ` [(view here)](https://discord.com/channels/${serverId}/${gameUpdatesId})` : ""}` },
        { "name": "last updates", "value": `\`${testGameName}\`  - <t:${testLastUpdate}>\n\`${mainGameName}\` - <t:${mainLastUpdate}>` },
        { "name": `current ${preDisplay} ${displayName}'s status`, "value": `\`${statusEmoji}\` ${currentStatusText}${currentStatusTime ? ` (<t:${currentStatusTime}:R>)` : ""}` },
        { "name": `last ${preDisplay} ${displayName}'s status`, "value": lastStatusEmoji ? `\`${lastStatusEmoji}\` ${lastStatusText}` : "`❔` none" },
        { "name": "current update probability", "value": probability },
        { "name": "next checks", "value": `\`probability\`: <t:${nextChecks.probability}:R>\n\`developers in ${testGameName}\`: <t:${nextChecks.testers}:R>\n\`updates\`: <t:${nextChecks.updates}:R>\n\`topics\`: <t:${nextChecks.topics}:R>\n\`status\`: <t:${nextChecks.status}:R>` }
    ]
};
const info = { version: document.getElementById("version"), main: document.getElementById("main"), test: document.getElementById("test"), testersChecks: document.getElementById("testersChecks"), updatesChecks: document.getElementById("updatesChecks"), topicsChecks: document.getElementById("topicsChecks"), statusChecks: document.getElementById("statusChecks"), tsit: document.getElementById("tsit"), status: document.getElementById("status"), mainupd: document.getElementById("mainupd"), testupd: document.getElementById("testupd"), newTopics: document.getElementById("newTopics"), erd: document.getElementById("erd"), efd: document.getElementById("efd"), esm: document.getElementById("esm"), ce: document.getElementById("ce"), runtime: document.getElementById("runtime"), nextTestersCheck: document.getElementById("nextTestersCheck"), nextUpdatesCheck: document.getElementById("nextUpdatesCheck"), nextTopicsCheck: document.getElementById("nextTopicsCheck"), nextStatusCheck: document.getElementById("nextStatusCheck") };
function timeSince(timestamp) {
    const now = new Date().getTime();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    let parts = [];
    if (hours) parts.push(hours);
    if (minutes || hours) parts.push(minutes.toString().padStart(hours ? 2 : 1, '0'));
    parts.push(seconds.toString().padStart(minutes || hours ? 2 : 1, '0'));
    return parts.join(':');
};
function timeUntil(timestamp) {
    const now = new Date().getTime();
    const diff = timestamp - now;
    if (diff < 1000) return 'checking...';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    let parts = [];
    if (hours) parts.push(hours);
    if (minutes || hours) parts.push(minutes.toString().padStart(hours ? 2 : 1, '0'));
    parts.push(seconds.toString().padStart(minutes || hours ? 2 : 1, '0'));
    return parts.join(':');
};
const bodyStatusClasses = ["offline", "online", "playing", "inStudio"];
const containerStatusClasses = ["containerOffline", "containerOnline", "containerPlaying", "containerInStudio"];
const itemStatusClasses = ["item itemOffline", "item itemOnline", "item itemPlaying", "item itemInStudio"];
let status = 0;

$.ajax("/config", {
    success: function (data) {
        info.main.innerHTML = data.mainGame.name.toUpperCase();
        info.main.href = "https://www.roblox.com/games/" + data.mainGame.placeId;
        info.test.innerHTML = data.testGame.name.toUpperCase();
        info.test.href = "https://www.roblox.com/games/" + data.testGame.placeId;
    }
});
$.ajax("/version", {
    success: function (data) {
        info.version.innerHTML = `${data.version} ${data.updateNeeded ? "⚠️" : ""}`
    }
});
function main() {
    const statusText = ['Offline', 'Online', 'Playing', 'In Studio', 'Invisible'];
    $.ajax("/info", {
        success: function (data) {
            const nextTestersCheck = new Date(data.nextChecks.testers).getTime();
            const nextUpdatesCheck = new Date(data.nextChecks.updates).getTime();
            const nextTopicsCheck = new Date(data.nextChecks.topics).getTime();
            const nextStatusCheck = new Date(data.nextChecks.status).getTime();
            const runtimeDate = new Date(data.startTime).getTime();
            info.testersChecks.innerHTML = data.checks.testers;
            info.updatesChecks.innerHTML = data.checks.updates;
            info.topicsChecks.innerHTML = data.checks.topics;
            info.statusChecks.innerHTML = data.checks.status;
            info.tsit.innerHTML = data.tsit.length;
            info.status.innerHTML = statusText[data.status];
            info.mainupd.innerHTML = data.mainupd;
            info.testupd.innerHTML = data.testupd;
            info.newTopics.innerHTML = data.newTopics;
            info.erd.innerHTML = data.erd;
            info.efd.innerHTML = data.efd;
            info.esm.innerHTML = data.esm;
            info.ce.innerHTML = data.ce;
            info.runtime.innerHTML = timeSince(runtimeDate);
            info.nextTestersCheck.innerHTML = timeUntil(nextTestersCheck);
            info.nextUpdatesCheck.innerHTML = timeUntil(nextUpdatesCheck);
            info.nextTopicsCheck.innerHTML = timeUntil(nextTopicsCheck);
            info.nextStatusCheck.innerHTML = timeUntil(nextStatusCheck);
            if (status != data.status) {
                status = data.status;
                document.body.className = bodyStatusClasses[status];
                document.getElementById("container").className = containerStatusClasses[status];
                for (let item of document.getElementById("grid-container")) {
                    item.className = itemStatusClasses[status];
                };
            };
        }
    });
    setTimeout(main, 1000);
};
main();
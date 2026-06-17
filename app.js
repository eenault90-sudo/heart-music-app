const bpmDisplay = document.getElementById("bpm");
const zoneDisplay = document.getElementById("zone");
const currentTrackDisplay = document.getElementById("currentTrack");
const audio = document.getElementById("audio");

let playlists = {};
let currentZone = null;
let pendingZone = null;
let zoneTimer = null;

const CONFIRMATION_DELAY = 10000;
const FADE_DURATION = 2000;

const lastTrackPlayed = {
    chill: null,
    normal: null,
    endurance: null
};

async function loadPlaylists() {

    const response = await fetch("playlist.json");

    playlists = await response.json();

}

loadPlaylists();

function randomTrack(zone) {

    const list = playlists[zone];

    if (!list || list.length === 0) return null;

    if (list.length === 1)
        return list[0];

    let track;

    do {

        track = list[
            Math.floor(Math.random() * list.length)
        ];

    } while (
        track === lastTrackPlayed[zone]
    );

    lastTrackPlayed[zone] = track;

    return track;

}

async function fadeToTrack(trackPath) {

    if (!trackPath) return;

    const filename =
        trackPath.split("/").pop();

    currentTrackDisplay.textContent =
        filename;

    if (!audio.src) {

        audio.src = trackPath;
        audio.volume = 1;

        try {
            await audio.play();
        } catch(e){}

        return;

    }

    const fadeStep = 0.05;
    const interval =
        FADE_DURATION / 20;

    const fadeOut = setInterval(() => {

        if (audio.volume > fadeStep) {

            audio.volume -= fadeStep;

        } else {

            clearInterval(fadeOut);

            audio.pause();

            audio.src = trackPath;

            audio.volume = 0;

            audio.play();

            const fadeIn =
                setInterval(() => {

                    if (
                        audio.volume < 1 - fadeStep
                    ) {

                        audio.volume += fadeStep;

                    } else {

                        audio.volume = 1;

                        clearInterval(fadeIn);

                    }

                }, interval);

        }

    }, interval);

}

function playZone(zone) {

    const track =
        randomTrack(zone);

    if (!track) return;

    fadeToTrack(track);

}

function requestZoneChange(zone) {

    if (zone === currentZone)
        return;

    if (zone === pendingZone)
        return;

    pendingZone = zone;

    clearTimeout(zoneTimer);

    zoneTimer = setTimeout(() => {

        currentZone = pendingZone;

        playZone(currentZone);

    }, CONFIRMATION_DELAY);

}

function bpmToZone(bpm) {

    if (bpm < 90)
        return "chill";

    if (bpm < 110)
        return "normal";

    return "endurance";

}

function handleHeartRate(event) {

    const value =
        event.target.value;

    const bpm =
        value.getUint8(1);

    bpmDisplay.textContent =
        bpm;

    const zone =
        bpmToZone(bpm);

    zoneDisplay.textContent =
        zone.toUpperCase();

    requestZoneChange(zone);

}

document
.getElementById("connect")
.addEventListener(
    "click",
    async () => {

        try {

            const device =
                await navigator.bluetooth.requestDevice({
                    filters: [{
                        services: [
                            "heart_rate"
                        ]
                    }]
                });

            const server =
                await device.gatt.connect();

            const service =
                await server.getPrimaryService(
                    "heart_rate"
                );

            const characteristic =
                await service.getCharacteristic(
                    "heart_rate_measurement"
                );

            await characteristic
                .startNotifications();

            characteristic
                .addEventListener(
                    "characteristicvaluechanged",
                    handleHeartRate
                );

            alert(
                "Polar H10 connecté"
            );

        } catch(error) {

            console.error(error);

            alert(
                "Connexion impossible"
            );

        }

    }
);

document
.getElementById("testChill")
.addEventListener(
    "click",
    () => {

        currentZone = "chill";

        playZone("chill");

        zoneDisplay.textContent =
            "CHILL";

    }
);

document
.getElementById("testNormal")
.addEventListener(
    "click",
    () => {

        currentZone = "normal";

        playZone("normal");

        zoneDisplay.textContent =
            "NORMAL";

    }
);

document
.getElementById("testEndurance")
.addEventListener(
    "click",
    () => {

        currentZone = "endurance";

        playZone("endurance");

        zoneDisplay.textContent =
            "ENDURANCE";

    }
);

document
.getElementById("nextTrack")
.addEventListener(
    "click",
    () => {

        if (!currentZone)
            return;

        playZone(currentZone);

    }
);

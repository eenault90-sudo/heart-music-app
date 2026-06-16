let currentZone = "";
let pendingZone = "";
let zoneTimer = null;

const bpmDisplay = document.getElementById("bpm");
const zoneDisplay = document.getElementById("zone");
const audio = document.getElementById("audio");
const currentTrack = document.getElementById("currentTrack");

const playlists = {
  chill: [],
  normal: [],
  endurance: []
};

function savePlaylists() {

  localStorage.setItem(
    "heartMusicPlaylists",
    JSON.stringify(playlists)
  );

}

function updateCounters() {

  document.getElementById("chillCount").textContent =
    playlists.chill.length;

  document.getElementById("normalCount").textContent =
    playlists.normal.length;

  document.getElementById("enduranceCount").textContent =
    playlists.endurance.length;

}

function loadPlaylists() {

  const saved =
    localStorage.getItem("heartMusicPlaylists");

  if (!saved) return;

  const data = JSON.parse(saved);

  playlists.chill = data.chill || [];
  playlists.normal = data.normal || [];
  playlists.endurance = data.endurance || [];

  updateCounters();

}

loadPlaylists();

function addFilesToPlaylist(files, zone) {

  for (const file of files) {

    playlists[zone].push({
      name: file.name,
      url: URL.createObjectURL(file)
    });

  }

  savePlaylists();

  updateCounters();

}

document.getElementById("addChill")
.addEventListener("change", e => {

  addFilesToPlaylist(
    e.target.files,
    "chill"
  );

});

document.getElementById("addNormal")
.addEventListener("change", e => {

  addFilesToPlaylist(
    e.target.files,
    "normal"
  );

});

document.getElementById("addEndurance")
.addEventListener("change", e => {

  addFilesToPlaylist(
    e.target.files,
    "endurance"
  );

});

document.getElementById("connect")
.addEventListener("click", async () => {

  const device =
    await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: ["heart_rate"]
        }
      ]
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

  await characteristic.startNotifications();

  characteristic.addEventListener(
    "characteristicvaluechanged",
    handleHeartRate
  );

});

function randomTrack(zone) {

  const list = playlists[zone];

  if (list.length === 0) return null;

  return list[
    Math.floor(
      Math.random() * list.length
    )
  ];

}

function playZone(zone) {

  const track = randomTrack(zone);

  if (!track) return;

  audio.src = track.url;

  currentTrack.textContent =
    track.name;

  audio.play();

}

function handleHeartRate(event) {

  const value = event.target.value;

  const bpm = value.getUint8(1);

  bpmDisplay.textContent = bpm;

  let targetZone;

  if (bpm < 105) {

    targetZone = "chill";

  } else if (bpm < 130) {

    targetZone = "normal";

  } else {

    targetZone = "endurance";

  }

  zoneDisplay.textContent =
    targetZone;

  if (
    targetZone === currentZone
  ) {

    pendingZone = "";
    clearTimeout(zoneTimer);

    return;

  }

  if (
    targetZone !== pendingZone
  ) {

    pendingZone = targetZone;

    clearTimeout(zoneTimer);

    zoneTimer = setTimeout(() => {

      currentZone =
        pendingZone;

      playZone(currentZone);

    }, 20000);

  }

    }

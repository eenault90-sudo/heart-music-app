let currentZone = "";

const bpmDisplay = document.getElementById("bpm");
const zoneDisplay = document.getElementById("zone");
const audio = document.getElementById("audio");

const tracks = {
  chill: "chill.mp3",
  normal: "normal.mp3",
  endurance: "endurance.mp3"
};

document.getElementById("connect").addEventListener("click", async () => {

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ["heart_rate"] }]
  });

  const server = await device.gatt.connect();

  const service = await server.getPrimaryService("heart_rate");

  const characteristic = await service.getCharacteristic("heart_rate_measurement");

  await characteristic.startNotifications();

  characteristic.addEventListener(
    "characteristicvaluechanged",
    handleHeartRate
  );

});

function handleHeartRate(event) {

  const value = event.target.value;

  const bpm = value.getUint8(1);

  bpmDisplay.textContent = bpm;

  let zone = "";

  if (bpm < 105) {
    zone = "chill";
  } else if (bpm < 130) {
    zone = "normal";
  } else {
    zone = "endurance";
  }

  zoneDisplay.textContent = zone;

  if (zone !== currentZone) {
    currentZone = zone;

    audio.src = tracks[zone];

    audio.play();
  }
}

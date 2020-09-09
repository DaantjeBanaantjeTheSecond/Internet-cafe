const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const radius = 10;

const highGroup = .1;
const midGroup = .5;
const baseGroup = 1;

const maxAmplitude = .3;

let scl = 1;

let freqLow = 0,
    freqHigh = 700;

let basePulseDuration = 200;
let baseFadeIn = 1;
let baseFadeOut = 150;

let midPulseDuration = 50;
let midFadeIn = 30;
let midFadeOut = 10;

let highPulseDuration = 10;
let highFadeIn = 5;
let highFadeOut = 5;

let holder = document.createElement("div");
holder.className = "holder";
document.body.appendChild(holder);

let oscillators = []
let amplitudes = [];

let biggestY = -1;
let biggestW = -1;

let tempDivs = document.getElementsByTagName("div");
let divs = [];
for (let i = 0; i < tempDivs.length - 1; i++) {
    let exists = false;
    var r1 = tempDivs[i].getBoundingClientRect();
    for (let j = i + 1; j < tempDivs.length; j++) {
        let r2 = tempDivs[j].getBoundingClientRect();
        if (r1.top == r2.top &&
            r1.right == r2.right &&
            r1.bottom == r2.bottom &&
            r1.left == r2.left) exists = true;
    }
    if (!exists) {
        divs.push(tempDivs[i]);
        let osc = audioCtx.createOscillator();
        osc.type = 'sine';
        //osc.frequency.value = map_range(document.documentElement.scrollHeight - r1.top, 0, document.documentElement.scrollHeight, freqLow, freqHigh); //height - y coord
        osc.frequency.value = document.documentElement.scrollHeight - r1.top; //height - y coord

        //console.log(osc.frequency.value);

        if (r1.top > biggestY) biggestY = r1.top;

        let amp = audioCtx.createGain();
        if (r1.right - r1.left > biggestW) biggestW = r1.right - r1.left;
        oscillators.push(osc);
        amplitudes.push(amp);
    }
}

for (let i = 0; i < divs.length; i++) {
    var div = document.createElement("div");
    div.className = "music_visualizer";
    div.style.position = "absolute";
    var rect = divs[i].getBoundingClientRect();
    let y = rect.top - Math.floor(radius / 2); //Y
    div.style.left = rect.left - Math.floor(radius / 2) + "px"; //startX 
    div.style.top = y + "px";
    div.style.width = radius + "px"; //width
    div.style.height = radius + "px"; //height
    let group = "";
    let b = 0;
    if (y < biggestY * highGroup) {
        b = 100;
        group += "high";
    } else if (y < biggestY * midGroup) {
        b = 50;
        group += "mid";
    } else if (y < biggestY * baseGroup) {
        b = 0;
        group += "base";
    }
    div.style.backgroundColor = `hsla(360,0%,${b}%,0.8)`;
    div.innerHTML = `${rect.left - Math.floor(radius/2)} ${rect.right} ${group}`; //startX, endX, group
    holder.appendChild(div);
    oscillators[i].start(audioCtx.currentTime + 1);
    oscillators[i].connect(amplitudes[i]).connect(audioCtx.destination);
}

scl = holder.children.length / 50;

basePulseDuration /= (scl / 2);
baseFadeIn /= (scl / 2);
baseFadeOut /= (scl / 2);

midPulseDuration /= scl;
midFadeIn /= scl;
midFadeOut /= scl;

highPulseDuration /= scl;
highFadeIn /= scl;
highFadeOut /= scl;

function update() {
    for (let i = 0; i < holder.children.length; i++) {
        let x = parseFloat(holder.children[i].style.left);
        let y = parseFloat(holder.children[i].style.top);
        let originalX = parseFloat(holder.children[i].innerHTML.split(" ")[0]);
        let maxX = parseFloat(holder.children[i].innerHTML.split(" ")[1]);
        let group = holder.children[i].innerHTML.split(" ")[2];
        let maxAmp = (maxX - originalX); //biggestW/2+.1;
        maxAmp = map_range(maxAmp, 0, biggestW, .1, maxAmplitude)

        if (group == "base") {
            setAmp(x, maxX, i, basePulseDuration, baseFadeIn, baseFadeOut, maxAmp);
        }
        if (group == "mid") {
            setAmp(x, maxX, i, midPulseDuration, midFadeIn, midFadeOut, maxAmp);
        }
        if (group == "high") {
            setAmp(x, maxX, i, highPulseDuration, highFadeIn, highFadeOut, maxAmp);
        }
        if (x > maxX) {
            x = originalX;
        }
        holder.children[i].style.left = x + 1 + "px";
    }
}

function setAmp(tx, tmaxX, ti, tpulseDuration, tfadeIn, tfadeOut, tmaxAmp) {
    if (tx > tmaxX - tpulseDuration) {
        let tempAmp = 0;
        if (tx < tmaxX - tpulseDuration + tfadeIn) {
            tempAmp = map_range(tx, tmaxX - tpulseDuration, tmaxX - tpulseDuration + tfadeIn, 0, tmaxAmp);
            amplitudes[ti].gain.setValueAtTime(tempAmp, audioCtx.currentTime);
        } else if (tx >= tmaxX - tfadeOut) {
            tempAmp = map_range(tx, tmaxX - tpulseDuration, tmaxX - tfadeOut, tmaxAmp, 0);
            amplitudes[ti].gain.setValueAtTime(tempAmp, audioCtx.currentTime);
        }
    } else {
        amplitudes[ti].gain.setValueAtTime(0, audioCtx.currentTime);
    }
}

function map_range(value, r0, r1, r2, r3) {
    var mag = value - r0,
        sgn = value < 0 ? -1 : 1;
    var result = sgn * mag * (r3 - r2) / (r1 - r0);
    if (result < 0) result = 2 * r2 + result;
    return result;
}

setInterval(update, 1);
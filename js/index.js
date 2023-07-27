const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const endButton = document.getElementById('hangupButton');
callButton.disabled = true;
endButton.disabled = true;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const messageContainer = document.getElementById('callDuration');

let pc1;
let pc2;
let localStream = null;

let startTime = 0;
let endTime = 0;

const constraints = {
    audio: true,
    video: true
}

const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
}
function getOtherPc(pc) {
    return pc === pc1 ? pc2 : pc1;
}

startButton.addEventListener('click', start);

callButton.addEventListener('click', call);

endButton.addEventListener('click', hangup);

async function start() {
    callButton.disabled = false;
    startTime = window.performance.now();
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStream = stream;
        localVideo.srcObject = stream;
        startButton.disabled = true;
    } catch (error) {
        console.log('Error getUserMedia', error);
    }

}
async function call() {
    messageContainer.innerText = '';
    messageContainer.style.display = 'none';
    endButton.disabled = false;
    callButton.disabled = true;
    startTime = window.performance.now();

    const config = {};
    pc1 = new RTCPeerConnection(config);
    pc2 = new RTCPeerConnection(config);

    pc1.addEventListener('icecandidate', e => handleIceCandidate(pc1, e));
    pc2.addEventListener('icecandidate', e => handleIceCandidate(pc2, e));
    pc1.addEventListener('iceconnectionstatechange', e => handleIceConnectionStateChange(pc1, e));
    pc2.addEventListener('iceconnectionstatechange', e => handleIceConnectionStateChange(pc2, e));
    pc2.addEventListener('track', getRemoteStream);

    const tracks = localStream.getTracks();

    for (const track of tracks) {
        pc1.addTrack(track, localStream);
    }

    try {
        const offer = await pc1.createOffer(offerOptions);
        await onCreateOfferSuccess(offer);

    } catch (error) {
        console.log("Error occure while creating offer from pc1", error);

    }

}


async function onCreateOfferSuccess(offer) {
    try {
        await pc1.setLocalDescription(offer);
    } catch (error) {
        console.log("Error occure while setting pc1 local description: ", error);
    }

    try {
        await pc2.setRemoteDescription(offer);
    } catch (error) {
        console.log("Error occure while setting pc2 remote description: ", error);
    }

    try {
        const answer = await pc2.createAnswer();
        await onCreateAnswerSuccess(answer);
    } catch (error) {
        console.log("Error occure while creating answer from pc2", error);
    }
}

async function onCreateAnswerSuccess(answer) {
    try {
        await pc2.setLocalDescription(answer);
    } catch (error) {
        console.log("Error occure while setting pc2 local description: ", error);
    }
    try {
        await pc1.setRemoteDescription(answer);
    } catch (error) {
        console.log("Error occure while setting pc1 remote description: ", error);

    }
}
async function handleIceCandidate(pc, e) {
    try {
        await getOtherPc(pc).addIceCandidate(e?.candidate);
    } catch (error) {
        console.log("Error occure while adding ice candidate: ", error);
    }

}

function getRemoteStream(e) {
    remoteVideo.srcObject = e.streams[0];
}
function hangup() {
    endButton.disabled = true;
    callButton.disabled = false;
    pc1.close();
    pc2.close();
    pc1 = null;
    pc2 = null;
    endTime = window.performance.now();
    messageContainer.innerText = `Call duration: ${((endTime - startTime) / 1000).toFixed(2)} seconds`;
    messageContainer.style.display = 'block';

}
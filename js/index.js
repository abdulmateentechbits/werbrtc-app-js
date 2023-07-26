const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const endButton = document.getElementById('hangupButton');

callButton.disabled = true;
endButton.disabled = true;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let pc1;
let pc2;

let localStream = null;

const constraints = {
    audio: true,
    video: true
};

const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
};

let startTime = 0;
let endTime = 0;

// Start button click event listener
startButton.addEventListener('click', start);

// Call button click event listener
callButton.addEventListener('click', call);

// Hangup button click event listener
endButton.addEventListener('click', hangup);

// Function to start the call
async function start() {
    callButton.disabled = false;
    startButton.disabled = true;
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideo.srcObject = stream;
        localStream = stream;        
    } catch (error) {
        console.error('Error getUserMedia', error);
    }
}

// Function to initiate the call
async function call() {
    startButton.disabled = true;
    endButton.disabled = false;
    startTime = window.performance.now();

    const rtcConfiguration = {};
    
    pc1 = new RTCPeerConnection(rtcConfiguration);
    pc2 = new RTCPeerConnection(rtcConfiguration);

    pc1.addEventListener('icecandidate', e => handleIceCandidate(pc1, e));
    pc2.addEventListener('icecandidate', e => handleIceCandidate(pc2, e));

    pc1.addEventListener('iceconnectionstatechange', e => handleIceConnectionStateChange(pc1, e));
    pc2.addEventListener('iceconnectionstatechange', e => handleIceConnectionStateChange(pc2, e));

    pc2.addEventListener('track', getRemoteStream);

    for (const track of localStream.getTracks()) {
        pc1.addTrack(track, localStream);
    }  

    try {
        const offer = await pc1.createOffer(offerOptions);
        await onCreateOfferSuccess(offer);
    } catch (error) {
        console.log('Error while creating offer', error);
    }
}

// Function to handle the created offer
async function onCreateOfferSuccess(offer) {
    try {
        await pc1.setLocalDescription(offer);      
    } catch (error) {
        console.log('Error on create session description pc1 1: ', error);
    }

    try {
        await pc2.setRemoteDescription(offer);
    } catch (error) {
        console.log('Error on create session description pc2 2: ', error);
    }

    try {
        const answer = await pc2.createAnswer();
        await onCreateAnswerSuccess(answer);
    } catch (error) {
        console.log('Error on create session answer: ', error);
    }
}

// Function to handle the created answer
async function onCreateAnswerSuccess(answer) {
    try {
        await pc2.setLocalDescription(answer);
    } catch (error) {
        console.log('Error on create session answer: 1', error);
    }
    try {
        await pc1.setRemoteDescription(answer);
    } catch (error) {
        console.log('Error on create session answer: 2', error);
    }
}

// Function to get the other peer connection object
function getOtherPc(pc) {
    return pc === pc1 ? pc2 : pc1;
}

// Function to handle ICE candidate events
async function handleIceCandidate(pc, e) {
    try {
        await getOtherPc(pc).addIceCandidate(e?.candidate);
    } catch (error) {
        console.log('Error handling ICE candidate', error);
    }
}

// Function to handle ICE connection state change events
async function handleIceConnectionStateChange(pc, e) {
    // You can add relevant handling here if needed
}

// Function to handle the received remote stream
function getRemoteStream(e) {
    remoteVideo.srcObject = e.streams[0];
}

// Function to handle the call end
function hangup() {
    localStream = null;
    endTime = window.performance.now();
    const callDuration = (endTime - startTime) / 1000; // Convert to seconds
    console.log(`Call duration: ${callDuration.toFixed(2)} seconds`);

    pc1.close();
    pc2.close();
    pc1 = null;
    pc2 = null;
}

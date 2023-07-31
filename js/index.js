// Global variables
const configuration = { iceServers: [{ urls: 'stun:stun.stunprotocol.org' }] };
let peerConnection;
let dataChannel;
const dataChannelOptions = { ordered: true, reliable: true };

// Function to set up the WebRTC connection
async function setupWebRTC() {
  // Create PeerConnection
  peerConnection = new RTCPeerConnection(configuration);

  // Create DataChannel
  dataChannel = peerConnection.createDataChannel('chat', dataChannelOptions);

  // Event listener for incoming messages
  dataChannel.onmessage = event => {
    displayMessage('userA', event.data); // Display received message in User A's chat div
  };

  // Event listener for DataChannel establishment
  dataChannel.onopen = event => {
    console.log('DataChannel opened.');
  };

  // Event listener for DataChannel closing
  dataChannel.onclose = event => {
    console.log('DataChannel closed.');
  };

  // Offer/answer negotiation
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // Simulate signaling server
  // In a real application, you'd send the offer to the other user via a signaling server
  // and receive their answer to set as the remote description
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulating delay for demonstration purposes
  const answer = await peerConnection.createAnswer();
  await peerConnection.setRemoteDescription(answer);
}

// Function to send a message
function sendMessage(targetUser) {
  const inputField = document.getElementById(targetUser === 'userA' ? 'userAInput' : 'userBInput');
  const chatDiv = document.getElementById(targetUser === 'userA' ? 'userBChat' : 'userAChat');
  const message = inputField.value;
  if (message.trim() !== '') {
    chatDiv.innerHTML += `<p><strong>${targetUser}:</strong> ${message}</p>`;
    dataChannel.send(targetUser + ':' + message); // Add the user identifier before the message
    inputField.value = '';
  }
}

// Function to display received messages
function displayMessage(targetUser, message) {
  const chatDiv = document.getElementById(targetUser === 'userA' ? 'userAChat' : 'userBChat');
  chatDiv.innerHTML += `<p><strong>${message.split(':')[0]}:</strong> ${message.split(':')[1]}</p>`;
}

// Call setupWebRTC() when the page has loaded
window.onload = setupWebRTC;

const local = document.getElementById("local")

const call = document.getElementById("call")
const recieve = document.getElementById("recieve")
const mute = document.getElementById("mute")
const unmute = document.getElementById("unmute")
const hangup = document.getElementById("hangup")
const vd_off = document.getElementById("vd_off")
const vd_on = document.getElementById("vd_on")
const ss_off = document.getElementById("ss_off")
const ss_on = document.getElementById("ss_on")

var camVideoTrack
var videoSender
var camAudioTrack
var audioSender
var screenVideoTrack

var localStream = null
var peer = []

const socket = io.connect(location.origin)

const config = {
    "iceServers":[
        {'urls' : "stun:stun.stunprotocol.org:3478"},
        {'urls' : "stun:stun.l.google.com:19302"}
    ]
}

const constraints = {
    video : {
        width: 500,
        height: 300,
        frameRate: { max: 60 }
    },
    audio: {
        sampleRate: 48000,
        channelCount: 2,
        volume: 1.0,
        echoCancellation: true
    }
}

function getLocalMedia(){
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        local.srcObject = stream
        localStream = stream
        local.id = socket.id
        camVideoTrack = stream.getVideoTracks()[0];
        camAudioTrack = stream.getAudioTracks()[0];
    })
//     .catch(err => {
//         alert("Error : ", "couldnt ask for cam perms")
//     })
    mute.style.display = "block"
}

//for screenshare
function getLocalMediaS(){
    
    let displayMediaOptions = {video: true, audio: false};
  navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
  .then(function(stream){
    local.srcObject = stream
    screenVideoTrack = stream.getVideoTracks()[0];
    videoSender.replaceTrack(screenVideoTrack);
  })
  .catch(err => {
        console.log("Error : ", "no screenshare perm")
    })
}

call.onclick = () => {
    call.setAttribute("value", "Calling...")
    socket.emit("request_call")
}

socket.on("request_call", (id) => {

    receive.setAttribute("value", "Receiving Call")

    receive.onclick = () => {
        receive.setAttribute("value", "Connecting...")
        socket.emit("response_call", id)
        makePeer(id)
    }
})

socket.on("response_call", (id) => {

    if(peer[id] == null){
        makePeerLocal(id)
    }
})

function makePeer(id){
    peer[id] = new RTCPeerConnection(config)

   // peer[id].addStream(localStream)

   videoSender = peer[id].addTrack(camVideoTrack, localStream);
   audioSender = peer[id].addTrack(camAudioTrack, localStream);


    var stream1 = document.getElementById("stream1").getElementsByTagName('video').length
    var stream2 = document.getElementById("stream2").getElementsByTagName('video').length

    var remote = document.createElement("video")
    remote.setAttribute("id", id)
    remote.setAttribute("class", "col")
    remote.setAttribute("autoplay", true)

    const top = document.getElementById("stream1")
    const bottom = document.getElementById("stream2")

    if(stream1 == 1 && stream2 == 0){
        top.appendChild(remote)
    }
    else if(stream1 == 2 && stream2 == 0){
        bottom.appendChild(remote)
    }
    else if(stream1 == 2 && stream2 == 1){
        bottom.appendChild(remote)
    }
    else{
        var container = document.getElementById("container")
        container.appendChild(remote)
    }

    peer[id].ontrack = (event) => {
        remote.srcObject = event.streams[0]
    }

    peer[id].onconnectionstatechange = (event) => {

        if(peer[id].connectionstate === "connected"){
            console.log("WebRTC Connection Successfull")  
        }
        call.setAttribute("hidden", true)
        receive.setAttribute("value", "Connected")
        hangup.style.display = "block"
        vd_off.style.display = "block"
        ss_on.style.display = "block"
    }
}

async function makePeerLocal(id){
    makePeer(id)

    const offer = await peer[id].createOffer()
    await peer[id].setLocalDescription(offer)

    socket.emit("offer", id, offer)

    peer[id].onicecandidate = (event) => {

        if(event.candidate){
            socket.emit("ice", id, event.candidate)
        }
    }
}

socket.on("offer", async function(id, offer){

    if(peer[id] != null){
        await peer[id].setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peer[id].createAnswer()
        await peer[id].setLocalDescription(answer)
        socket.emit("answer", id, answer)        
    }
})

socket.on("answer", (id, answer) => {

    if(peer[id] != null){
        peer[id].setRemoteDescription(new RTCSessionDescription(answer))
    }
})

socket.on("ice", (id, ice) => {
    peer[id].addIceCandidate(new RTCIceCandidate(ice))
})

hangup.onclick = () => {
    socket.disconnect()
    window.location.reload()
}

socket.on("delete", (id) => {
    var elem = document.getElementById(id)
    if(elem){
        elem.remove()
    }
})

mute.onclick = () => {
    mute.style.display = "none"
    unmute.style.display = "block"
    //socket.emit("mute")
    localStream.getAudioTracks()[0].enabled = false
}

unmute.onclick = () => {
    unmute.style.display = "none"
    mute.style.display = "block"
    //socket.emit("unmute")
    localStream.getAudioTracks()[0].enabled = true
}

// socket.on("mute", (id) => {
//     localStream.getAudioTracks()[0].enabled = false
// })

// socket.on("unmute", (id) => {
//     localStream.getAudioTracks()[0].enabled = true
// })

vd_off.onclick = () => {
    vd_off.style.display = "none"
    vd_on.style.display = "block"
    localStream.getVideoTracks()[0].enabled = false
}

vd_on.onclick = () => {
    vd_on.style.display = "none"
    vd_off.style.display = "block"
    localStream.getVideoTracks()[0].enabled = true
}

ss_on.onclick = () => {
    ss_on.style.display = "none"
    ss_off.style.display = "block"

//     let displayMediaOptions = {
//         video: true,
//         audio: false
//     }

//     navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
//     .then(function(stream){
//         local.srcObject=stream
//         peer[id].removeStream(localStream)
//         peer[id].addStream(stream)
        
//         screenshareGlobalStream = stream
//   })
    getLocalMediaS();
}

ss_off.onclick = () => {
    ss_off.style.display = "none"
    ss_on.style.display = "block"

    let displayMediaOptions = {
        video: true,
        audio: false
    }

    local.srcObject = localStream
    videoSender.replaceTrack(localStream.getVideoTracks()[0]);
}

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
const gs_on = document.getElementById("gs_on")
const gs_off = document.getElementById("gs_off")
const gsnoti = document.getElementById("gsnoti")
// -----------------------------------------------------------------------------------------------------recording code
// recording buttons
const recordedVideo = document.querySelector('video#recorded');
recordedVideo.style.display="none";
const recordButton = document.querySelector('button#record');
const playButton = document.querySelector('button#play');
const downloadButton = document.querySelector('button#download');





let mediaRecorder;
let recordedBlobs;
    

//for recording the mediastream
//recorded media will be played below the localstream
recordButton.addEventListener('click', () => {
    if (recordButton.textContent === 'Start Recording') {
      startRecording();
      console.log('starting record')
    } else {
      stopRecording();
      recordButton.textContent = 'Start Recording';
      playButton.disabled = false;
      downloadButton.disabled = false;
    }
  });



playButton.addEventListener('click', () => {
    recordedVideo.style.display="block";
  const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
});

  downloadButton.addEventListener('click', () => {
    const blob = new Blob(recordedBlobs, {type: 'video/webm'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  });



  function handleDataAvailable(event) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
  }
  
  function startRecording() {
    recordedBlobs = [];
    let options = {mimeType: 'video/webm;codecs=vp9,opus'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`);
      options = {mimeType: 'video/webm;codecs=vp8,opus'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = {mimeType: 'video/webm'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.error(`${options.mimeType} is not supported`);
          options = {mimeType: ''};
        }
      }
    }
  
    try {
      mediaRecorder = new MediaRecorder(localStream, options);
    } catch (e) {
      console.error('Exception while creating MediaRecorder:', e);
      //errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
      return;
    }
  
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    recordButton.textContent = 'Stop Recording';
    playButton.disabled = true;
    downloadButton.disabled = true;
    mediaRecorder.onstop = (event) => {
      console.log('Recorder stopped: ', event);
      console.log('Recorded Blobs: ', recordedBlobs);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log('MediaRecorder started', mediaRecorder);
  }
  
  function stopRecording() {
    mediaRecorder.stop();
  }
  

// -----------------------------------------------------------------------------------------------------



//for green screen
let c1,ctx1,c_tmp,ctx_tmp; 
c1 = document.getElementById('output-canvas')
gstoggle=0


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

// const constraints = {
//     video : {
//         width: 100,
//         height: 50,
//        // frameRate: { max: 60 }
//     }}
//     audio: {
//         sampleRate: 48000,
//         channelCount: 2,
//         volume: 1.0,
//         echoCancellation: true
//     }
// }
//var constraints = { audio: true, video:true }

function getLocalMedia(){
    //for watermark
    var sb = new WebRtcSB();
    var imgCopy = new ImageCopy();
    var imgAdd = new ImageAdd('sb.png', 10, 10, 50, 50);
    sb.setManipulators([imgCopy, imgAdd]);

    //passing stream through middleware for watermark,rest is same,below method is defined in webercshitblt.js
    sb.sbStartCapture()
    .then((stream)=>{
        local.srcObject = stream
        localStream = stream
        local.id = socket.id
        camVideoTrack = stream.getVideoTracks()[0];
        camAudioTrack = stream.getAudioTracks()[0];
    })
    .catch(err => {
        alert("Error : ", "couldnt ask for cam perms")
    })

    // navigator.mediaDevices.getUserMedia(constraints)
    // .then(stream => {
    //     local.srcObject = stream
    //     localStream = stream
    //     local.id = socket.id
    //     camVideoTrack = stream.getVideoTracks()[0];
    //     camAudioTrack = stream.getAudioTracks()[0];
    // })
    // .catch(err => {
    //     alert("Error : ", "couldnt ask for cam perms")
    // })
    mute.style.display = "block"
    gs_off.style.display= "none"
   // c1.style.display="none"
    gsnoti.style.display="none"


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
    localStream.getAudioTracks()[0].enabled = false
}

unmute.onclick = () => {
    unmute.style.display = "none"
    mute.style.display = "block"
    localStream.getAudioTracks()[0].enabled = true
}



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

gs_on.onclick = () => {
    gstoggle=1
    gs_on.style.display="none"
    gs_off.style.display="block"
    gsnoti.style.display="block"

   // c1.style.display="block"
    //local.hidden=true
    //local.style.display="none"
    computeFrame()
    var stream = c1.captureStream(25);
    videoSender.replaceTrack(stream.getVideoTracks()[0]);
    // local.addEventListener("load", computeFrame );
}

gs_off.onclick = () => {
    gs_off.style.display="none"
    gs_on.style.display="block"
    //local.hidden=false
    //c1.style.display="none"
    gsnoti.style.display="none"

    gstoggle=0
    videoSender.replaceTrack(localStream.getVideoTracks()[0]);

}



//green screen

function computeFrame() {
      
     if(gstoggle==0)
     {return;}

      ctx1 = c1.getContext('2d');
    
       c_tmp = document.createElement('canvas');
       c_tmp.setAttribute('width', 320);
       c_tmp.setAttribute('height',240);
       ctx_tmp = c_tmp.getContext('2d');
    
       ctx_tmp.drawImage(local, 0, 0, 320 , 240 );
       let frame = ctx_tmp.getImageData(0, 0, 320 , 240 );
   
    //    ctx_tmp.drawImage(video2, 0, 0, video2.videoWidth , video2.videoHeight );
    //    let frame2 = ctx_tmp.getImageData(0, 0, video2.videoWidth , video2.videoHeight );
   
    //    for (let i = 0; i < frame.data.length /4; i++) {
    //      let r = frame.data[i * 4 + 0];
    //      let g = frame.data[i * 4 + 1];
    //      let b = frame.data[i * 4 + 2];
   
    //      if (r > 70 && r < 160 && g > 95 && g < 220 && b > 25 && b < 150) 
    //      {  
    //          frame.data[i * 4 + 0] = 0//frame2.data[i * 4 + 0];
    //          frame.data[i * 4 + 1] = 0//frame2.data[i * 4 + 1];
    //          frame.data[i * 4 + 2] = 0//frame2.data[i * 4 + 2];
    //      }
    //    }

    for (let i = 0; i < frame.data.length /4; i++) {
        let r = frame.data[i * 4 + 0];
        let g = frame.data[i * 4 + 1];
        let b = frame.data[i * 4 + 2];
        let a = frame.data[i * 4 + 3];
        
        var selectedR = 110;
            var        selectedG = 154;
               var     selectedB = 90;
                    if (r <= selectedR && g >= selectedG && b >= selectedB) {
        
        // if (r > 70 && r < 160 && g > 95 && g < 220 && b > 25 && b < 150) 
        // {  
            frame.data[i * 4 + 0] = 0;
            frame.data[i * 4 + 1] = 0;
            frame.data[i * 4 + 2] = 0;
            //frame.data[i * 4 + 3] = 0;
        }
        }
        
        
        for (var y = 0; y < frame.height; y++) {
          for (var x = 0; x < frame.width; x++) {
              var r = frame.data[((frame.width * y) + x) * 4];
              var g = frame.data[((frame.width * y) + x) * 4 + 1];
              var b = frame.data[((frame.width * y) + x) * 4 + 2];
              var a = frame.data[((frame.width * y) + x) * 4 + 3];
              if (frame.data[((frame.width * y) + x) * 4 + 3] != 0) {
                  var offsetYup = y - 1;
                  var offsetYdown = y + 1;
                  var offsetXleft = x - 1;
                  var offsetxRight = x + 1;
                  var change = false;
                  if (offsetYup > 0) {
                      if (frame.data[((frame.width * (y - 1)) + (x)) * 4 + 3] == 0) {
                          change = true;
                      }
                  }
                  if (offsetYdown < frame.height) {
                      if (frame.data[((frame.width * (y + 1)) + (x)) * 4 + 3] == 0) {
                          change = true;
                      }
                  }
                  if (offsetXleft > -1) {
                      if (frame.data[((frame.width * y) + (x - 1)) * 4 + 3] == 0) {
                          change = true;
                      }
                  }
                  if (offsetxRight < frame.width) {
                      if (frame.data[((frame.width * y) + (x + 1)) * 4 + 3] == 0) {
                          change = true;
                      }
                  }
                  if (change) {
                    var gray = (frame.data[((frame.width * y) + x) * 4 + 0] * .393) + (frame.data[((frame.width * y) + x) * 4 + 1] * .769) + (frame.data[((frame.width * y) + x) * 4 + 2] * .189);
                    frame.data[((frame.width * y) + x) * 4] = (gray * 0.2) + (imgBackgroundData.data[((frame.width * y) + x) * 4] * 0.9);
                    frame.data[((frame.width * y) + x) * 4 + 1] = (gray * 0.2) + (imgBackgroundData.data[((frame.width * y) + x) * 4 + 1] * 0.9);
                    frame.data[((frame.width * y) + x) * 4 + 2] = (gray * 0.2) + (imgBackgroundData.data[((frame.width * y) + x) * 4 + 2] * 0.9);
                    frame.data[((frame.width * y) + x) * 4 + 3] = 255;
                }
              }
          }
        }
    ctx1.putImageData(frame, 0, 0);
    setTimeout(computeFrame, 0);
    }

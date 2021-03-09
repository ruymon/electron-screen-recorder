const { desktopCapturer, remote } = require('electron');

const { dialog, Menu } = remote;

const { writeFile } = require('fs');
const { start } = require('repl');



// Global States
let mediaRecorder;
const recordedChunks = [];



//Buttons
const videoElement = document.querySelector('video');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
    mediaRecorder.start();

    startBtn.classList.remove('bg-green-500');
    startBtn.classList.remove('hover:bg-green-700');

    startBtn.classList.add('bg-blue-500');
    startBtn.classList.add('hover:bg-blue-700');

    startBtn.innerHTML = "📼 <br /> Recording";
};


const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = e => {
    mediaRecorder.stop();

    startBtn.classList.remove('bg-blue-500');
    startBtn.classList.remove('hover:bg-blue-700');

    startBtn.classList.add('bg-green-500');
    startBtn.classList.add('hover:bg-green-700');

    startBtn.innerHTML = "🎬 <br /> Start";
};


const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;


// Get the available video sources
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoOptionsMenu.popup();
}

// Change the videoSource window to Record
async function selectSource(source) {

    videoSelectBtn.innerHTML = source.name;
    
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    // Create a stream
    const stream = await navigator.mediaDevices
        .getUserMedia(constraints);

    // Preview the Source in the HTML Video Element
    videoElement.srcObject = stream;
    videoElement.play();

    // Create the Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

// Captures all Recorded Chunks
function handleDataAvailable(e) {
    console.log('Video data available')
    recordedChunks.push(e.data);
}


// Saves the video file on stop
async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9',
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    })

    console.log(filePath);
    
    filePath ? writeFile(filePath, buffer, () => console.log('Video saved successfully!')) : console.log('No File Path!');
}
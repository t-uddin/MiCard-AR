var Chat = pc.createScript('chat');

// initialise variables
var audio = null;
var audioRecorder = null;
var chunks = [];
var session_id = null;
var card_id = null;
// var host = "http://127.0.0.1:5000/";
var host = "https://micard.rzseqhyikaq.eu-gb.codeengine.appdomain.cloud/";
var avatar = null;
var avatar_id = null;
var marker = null;
var name_entity = null;
var account_name = null;
var record = false;


// Add HTML audio element
var script = document.createElement('script');
script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
document.getElementsByTagName('head')[0].appendChild(script);


// initialize code called once per entity
Chat.prototype.initialize = function() {
    // set up reference for the entities (avatar, marker, name)
    marker = this.app.root.findByName('marker');
    name_entity = this.app.root.findByPath('Root/2D Screen/card_name');


    // Initialise audio, IBM Watson session and card avatar
    window.addEventListener('load', this.initAudio());
    window.addEventListener('load', this.initSession());


    // IOS touch events
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {

        this.entity.button.on('touchstart', this.onIOSPress, this);
        this.entity.button.on('touchend', this.onIOSRelease, this);
    }

    else {
        // mouse events
        this.entity.button.on('mousedown', this.onPress, this);
        this.entity.button.on('mouseup', this.onRelease, this);

        // touch events
        this.entity.button.on('touchstart', this.onPress, this);
        this.entity.button.on('touchend', this.onRelease, this);  
    }    



};

Chat.prototype.loadAvatar = async function(avatar) {
    avatar = avatar.resource.instantiate();
    marker.addChild(avatar);
};

// Get mic permissions on app load
Chat.prototype.initAudio = function() {
    // handle older browsers/versions of getUserMedia
    if (navigator.mediaDevices === undefined) {
        console.log("old");
        navigator.mediaDevices = {};
        navigator.mediaDevices.getUserMedia = function(constraints) {
            let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
            }
            return new Promise (function(resolve, reject){
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        };
    } else { 
        console.log("new");
        navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            devices.forEach(device => {
                console.log(device.kind.toUpperCase(), device.label);
            });
        })
        .catch(err => {
                    console.log(err.name, err.message);
        });
    }

    // standard implementation
    navigator.mediaDevices.getUserMedia({audio: true})
    .then(this.handleSuccess)

    .catch(function(err){
        console.log(err.name, err.message);
    });    
};


Chat.prototype.initSession = async function() {
    // Get card profile variables from python
    fetch(host + 'start/')
        .then(function (response) {
            return response.json();
        })
        .then(function (text) {
            // set card profile variables
            session_id = text.session;
            account_name = text.account_name;
            avatar_id = text.avatar_id;
            card_id = text.card_id;

            // instantiante variable dependent entities
            // name
            name_entity.element.text = account_name;

            // avatar
            avatar = pc.app.assets.find(avatar_id, 'template');
            avatar = avatar.resource.instantiate();
            marker.addChild(avatar);
        });
};


// Record audio on button hold
Chat.prototype.onPress = function(event) {
    console.log("Pressed");
    this.entity.sound.play('start');
    avatar.script.animationController.playListen();
    audioRecorder.start();
    };


// Stop recording on button release
Chat.prototype.onRelease = function(event) {
    console.log("Released");
    this.entity.sound.play('finish');
    avatar.script.animationController.playThink();
    audioRecorder.stop();
    console.log(audioRecorder.state);
};


// Record audio on button hold
Chat.prototype.onIOSPress = function(event) {
    if(record == false) {
        record = true;
        console.log("Pressed");
        this.entity.sound.play('start');
        avatar.script.animationController.playListen();
        audioRecorder.start();
    }

    else {
        record = false;
        console.log("Released");
        this.entity.sound.play('finish');
        avatar.script.animationController.playThink();
        audioRecorder.stop();
        console.log(audioRecorder.state);
    }
};


// Stop recording on button release
Chat.prototype.onIOSRelease = function(event) {
    console.log("Released");
    event.event.preventDefault();
};


// set up audio input stream
Chat.prototype.handleSuccess = function(streamObj) {
    console.log("handling success");
    audio = streamObj;
    const options = {mimeType: 'audio/webm'};
    audioRecorder = new MediaRecorder(audio, options);

    // save audio to array chunks
    audioRecorder.addEventListener('dataavailable', function(e) {
        console.log("data available");
        if (e.data.size > 0) chunks.push(e.data);
    });

    // on release, send audio to server and get response
    audioRecorder.addEventListener('stop', async function process() {
        console.log("audio stopped");
        let blob = new Blob(chunks, { 'type': 'audio/webm' });

        // clear audio data
        chunks = [];

        // get response audio and play
        Chat.prototype.getResponse(blob, avatar);
    });
};


// Set up audio response
Chat.prototype.getResponse = function(input, avatar) {
    // API call: get the response from watson
    var form = new FormData();
    form.append('session', session_id);
    form.append('data', input);

    $.ajax({
        method: "POST",
        processData: false,
        contentType: false,
        url: host + "chat/",
        data: form,
        success: playCallBack
        });
    
    // callback function: play the returned audio
    function playCallBack(data) {
        avatar.script.animationController.playTalk();

        music = new Audio(host + "static/audio/" + data.audio + ".mp3");
        music.play();
        clearAudio(data);

        // check if email send was requested
        if (data.email) {
            console.log("Sending email");
            address = 'mailto:'+data.email;
            window.open(address);
        }

        // return to idle animation after speech
        music.addEventListener('ended', (event) => {
            avatar.script.animationController.playIdle();
        });
    }

    // delete audio file from server once played
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function clearAudio(data) {
        await sleep(10000);
        console.log('clearing audio');

        $.ajax({
            type: "POST",
            url: host + "clearaudio/",
            data: {"id": data.audio}
        });
    }
};


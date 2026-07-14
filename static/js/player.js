const audio = document.getElementById("audio");
const volumeSlider = document.getElementById("volume");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const soundOn = document.getElementById("soundonIcon");
const soundOff = document.getElementById("soundoffIcon");
const loopIcon = document.getElementById("loopIcon");
const loopIconBg = document.getElementById("loopbtnbg")
const progress = document.getElementById("progress");
const filled = document.querySelector(".progress-filled");
const filledVol = document.querySelector(".volume-filled")
const songListEl = document.getElementById("songListEl")
const songs = JSON.parse(songListEl.dataset.songs)     //json parse to covert string to JS array
const songRows = document.querySelectorAll(".song-row");
let lastVolume = volumeSlider.value; 
let currentSong = null;
let loop = false;
let currentSongIndex = -1;
const loopActive = document.getElementById("activeLoopLogo")
let positionInterval = null;
let filteredSongs = [];

function initMediaSession() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => {
        if (!currentSong) {
            playSong(songs[0]);
            return;
        }

        togglePlay()
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
    });

    navigator.mediaSession.setActionHandler('nexttrack', playNext);
    navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    navigator.mediaSession.setActionHandler('seekforward', null);
    navigator.mediaSession.setActionHandler('seekbackward', null);
}

function updateMediaMetadata(filename) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: filename.replace('.mp3', ''),
        artist: 'Unknown Artist',
        album: 'Riff',
        artwork: [
            {
                src: `/static/cover/${filename.replace('.mp3', '')}.jpg`,
                sizes: '512x512',
                type: 'image/jpeg'
            }
        ]
    });
}

audio.onpause = () => {
    clearInterval(positionInterval);
    navigator.mediaSession.playbackState = "paused";
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
};

function playSong(filename) {
    updateMediaMetadata(filename);
    currentSong = filename;
    const activeQueue = filteredSongs.length ? filteredSongs : songs;
    currentSongIndex = activeQueue.indexOf(filename)
    audio.src = `/stream/${filename}`;
    audio.load();
    audio.pause();
    audio.play().then(() => {
        navigator.mediaSession.playbackState = "playing";
    });

    document.querySelectorAll(".song-row.playing").forEach(r => r.classList.remove("playing"));


    if( currentSongIndex > -1){
        const rowToPlay = document.querySelector(
            `.song-row[data-filename="${filename}"]`
        );
        if(rowToPlay) {
            rowToPlay.classList.add("playing");
            rowToPlay.style.display = "flex";
        rowToPlay.scrollIntoView({ behavior: "smooth", block: "center" });
        } 
    }
}

// event for ended song to play next
audio.onended = () => {
    clearInterval(positionInterval);
    if (loop) {
        audio.play();
    } else {
        playNext();
    }
};

audio.onplay = () => {
    navigator.mediaSession.playbackState = "playing";
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
    startPositionSync();
};



function startPositionSync() {
    if (!('mediaSession' in navigator)) return;

    clearInterval(positionInterval);

    positionInterval = setInterval(() => {
        if (!audio.duration || audio.paused) return;

        navigator.mediaSession.setPositionState({
            duration: audio.duration,
            position: audio.currentTime,
            playbackRate: audio.playbackRate
        });
    }, 1000);
}

function playNext() {
    const activeQueue = filteredSongs.length ? filteredSongs : songs;

    if (activeQueue.length === 0) return;

    if (currentSong === null) {
        playSong(activeQueue[0]);
        return;
    }

    currentSongIndex = activeQueue.indexOf(currentSong);
    currentSongIndex++;

    if (currentSongIndex >= activeQueue.length) {
        currentSongIndex = 0;
    }

    playSong(activeQueue[currentSongIndex]);
}

function playPrev() {
    if (audio.currentTime > 3){
        audio.currentTime = 0;
        return;
    }

    const activeQueue = filteredSongs.length ? filteredSongs : songs;

    if(activeQueue.length === 0) return;

    if(currentSong == null) return;

    currentSongIndex = activeQueue.indexOf(currentSong)
    currentSongIndex--;

    if(currentSongIndex < 0) {
        currentSongIndex = activeQueue.length - 1;
    }
    playSong(activeQueue[currentSongIndex]);

}

function togglePlay() {
    if (audio.paused) {
        if( currentSongIndex == -1 && songs.length > 0){
            playSong(songs[0]);
            return;
        }
        audio.play().catch(() => {});
    } else {
        audio.pause();
    }

}


function toggleLoop() {
    loop = !loop;
    if(loop){
        loopActive.style.display = "block";
    } else {
        loopActive.style.display = "none";
    }
    audio.loop = loop;
}

loopIconBg.addEventListener("mouseenter", () => {
    if (!loop) {
        loopActive.style.display = "block";
    } else{
        loopActive.style.display = "none";
    }
});

loopIconBg.addEventListener("mouseleave", () => {
    if(loop){
        loopActive.style.display = "block"
    } else {
        loopActive.style.display = "none";
    }
});

function seekAudio(value) {
    audio.currentTime = (value / 100) * audio.duration;
    // Update current time display immediately
    const minutes = Math.floor(audio.currentTime / 60);
    const seconds = Math.floor(audio.currentTime % 60)
        .toString()
        .padStart(2, "0");
    currentTimeEl.innerText = `${minutes}:${seconds}`;
}


function setVolume(value) {
    audio.volume = value;
    if(value == 0){
        soundOn.style.display = "none";
        soundOff.style.display = "block";
    } else{
        soundOn.style.display = "block";
        soundOff.style.display = "none";
    }
}


volumeSlider.addEventListener("input", (e) =>{
    setVolume(e.target.value);
    filledVol.style.width = `${e.target.value * 100}%`;
}); 


progress.addEventListener("input", (e) => {
    // Update audio currentTime
    seekAudio(e.target.value);
});

// Click to mute
soundOn.addEventListener("click", () => {
    lastVolume = audio.volume; // save current volume
    audio.volume = 0;
    volumeSlider.value = 0;
    filledVol.style.width = 0;

    soundOn.style.display = "none";
    soundOff.style.display = "block";
});

// Click to unmute
soundOff.addEventListener("click", () => {
    audio.volume = lastVolume;       // restore previous volume
    volumeSlider.value = lastVolume; // update slider
    filledVol.style.width = `${ lastVolume * 100}%`;
    soundOff.style.display = "none";
    soundOn.style.display = "block";
});


audio.onloadedmetadata = () => {
    const minutes = Math.floor(audio.duration / 60);
    const seconds = Math.floor(audio.duration % 60)
        .toString()
        .padStart(2, "0");

    totalTimeEl.innerText = `${minutes}:${seconds}`;

};


audio.ontimeupdate = () => {
    const progressValue = (audio.currentTime / audio.duration) * 100 || 0;
    progress.value = progressValue;
    filled.style.width = `${progressValue}%`;

    const minutes = Math.floor(audio.currentTime / 60);
    const seconds = Math.floor(audio.currentTime % 60)
        .toString()
        .padStart(2, "0");
    currentTimeEl.innerText = `${minutes}:${seconds}`;

};

initMediaSession();

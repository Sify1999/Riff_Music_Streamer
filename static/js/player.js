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
const playlistPlayBtn = document.getElementById("playlist-play-btn");
const barCover = document.getElementById("song-bg")
const barTitle = document.getElementById("song-detail-name")
const barArtist = document.getElementById("song-detail-artist")
const bottomSongTitle = document.getElementById("song-detail-name")
audio.volume = 0.5;
volumeSlider.value = 0.5;
lastVolume = 0.5;
filledVol.style.width = "50%";



if(playlistPlayBtn) {
    playlistPlayBtn.addEventListener('click' , ()=>{
        if(songs.length > 0){
            playSong(songs[0]);
        }
    })
}


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

function updateMediaMetadata(song) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: 'Riff',
        artwork: [
            {
                src: song.cover,
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

function playSong(song) {
    updateMediaMetadata(song);
    upadteBottomBar(song)
    currentSong = song;
    const activeQueue = filteredSongs.length ? filteredSongs : songs;
    currentSongIndex = activeQueue.indexOf(song)
    audio.src = `/stream/${song.filename}`;
    audio.load();
    audio.pause();
    audio.play().then(() => {
        navigator.mediaSession.playbackState = "playing";
    });

    document.querySelectorAll(".song-row.playing").forEach(r => r.classList.remove("playing"));

    if( currentSongIndex > -1){
        const rowToPlay = document.querySelector(
            `.song-row[data-filename="${song.filename}"]`
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

songRows.forEach(row => {
    row.addEventListener("click" , () => {
        playSong(songs[row.dataset.index])
    })
})

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

function upadteBottomBar(song){
    barTitle.textContent = song.title
    barArtist.textContent = song.artist
    barCover.src = song.cover    
}

if (bottomSongTitle) {
    bottomSongTitle.addEventListener("click", scrollToCurrentSong);
}

function scrollToCurrentSong() {
    if (!currentSong) return;

    const row = document.querySelector(
        `.song-row[data-filename="${currentSong.filename}"]`
    );

    if (!row) return;

    row.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    // Optional flash animation
    row.classList.add("highlight-song");
    setTimeout(() => row.classList.remove("highlight-song"), 1000);
}


initMediaSession();

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
let shuffle = false;
let shuffledQueue = [];
const shuffleBtn = document.getElementById("shufflebtnbg");
const playlistPopup = document.getElementById("playlistPopup");
const playlistPopupList = document.querySelector(".playlist-popup-list");``
let selectedSong = null;
playlistPopup.dataset.song = "";


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
    const activeQueue = shuffle
    ? shuffledQueue
    : (filteredSongs.length ? filteredSongs : songs);
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

    const activeQueue = shuffle
        ? shuffledQueue
        : (filteredSongs.length ? filteredSongs : songs);

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

    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }

    const activeQueue = shuffle
        ? shuffledQueue
        : (filteredSongs.length ? filteredSongs : songs);

    if (activeQueue.length === 0) return;
    if (!currentSong) return;

    currentSongIndex = activeQueue.indexOf(currentSong);

    currentSongIndex--;

    if (currentSongIndex < 0)
        currentSongIndex = activeQueue.length - 1;

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
    audio.loop = loop;

    loopIconBg.classList.toggle("active", loop);
}


function createShuffleQueue(queue) {
    shuffledQueue = [...queue];

    // Fisher-Yates shuffle
    for (let i = shuffledQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffledQueue[i], shuffledQueue[j]] =
        [shuffledQueue[j], shuffledQueue[i]];
    }
}

function toggleShuffle() {

    shuffle = !shuffle;

    shuffleBtn.classList.toggle("active", shuffle);

    if (!shuffle) return;

    const activeQueue = filteredSongs.length
        ? filteredSongs
        : songs;

    createShuffleQueue(activeQueue);

    if (currentSong) {

        shuffledQueue =
            shuffledQueue.filter(
                song => song.filename !== currentSong.filename
            );

        shuffledQueue.unshift(currentSong);
    }
}

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
async function loadPlaylistPopup() {
    playlistPopupList.innerHTML = "";

    let playlists = [];
    try {
        const res = await fetch("/get_playlists");
        playlists = await res.json();
    } catch (err) {
        console.error("Failed to load playlists", err);
    }

    playlists.forEach((pl) => {
        const item = document.createElement("div");
        item.className = "playlist-popup-item";

        item.innerHTML = `
            <div class="playlist-popup-left">
                <img class="playlist-popup-cover" src="${pl.cover}" alt="cover" onerror="this.src='/static/assets/def_cover.jpg'">
                <div class="playlist-popup-text">
                    <div class="playlist-popup-name">${pl.name}</div>
                </div>
            </div>
            <div class="playlist-popup-status">+</div>
        `;

        item.addEventListener("click", async () => {
            await addToPlaylist(selectedSong.filename, pl.id);
            playlistPopup.classList.remove("active");
            playlistPopup.dataset.song = "";
        });

        playlistPopupList.appendChild(item);
    });

    // Add "Create Playlist" button
    const createItem = document.createElement("div");
    createItem.className = "playlist-popup-item create-playlist-item";

    createItem.innerHTML = `
        <div class="playlist-popup-left">
            <div class="playlist-popup-icon">+</div>
            <div class="playlist-popup-text">
                <div class="playlist-popup-name">Create Playlist</div>
            </div>
        </div>
    `;

    createItem.addEventListener("click", () => {
        openCreatePlaylistModal();
        playlistPopup.classList.remove("active");
        playlistPopup.dataset.song = "";
    });

    playlistPopupList.appendChild(createItem);
}

const createPlaylistOverlay = document.getElementById("createPlaylistOverlay");
const coverUpload = document.getElementById("coverUpload");
const coverInput = document.getElementById("coverInput");
const coverPreview = document.getElementById("coverPreview");
const coverPlaceholder = document.getElementById("coverPlaceholder");
const playlistNameInput = document.getElementById("playlistNameInput");
const playlistDescInput = document.getElementById("playlistDescInput");
const descCharCount = document.getElementById("descCharCount");
const confirmCreateBtn = document.getElementById("confirmCreatePlaylist");
const cancelCreateBtn = document.getElementById("cancelCreatePlaylist");
const closeCreateBtn = document.getElementById("closeCreatePlaylist");
const createPlaylistError = document.getElementById("createPlaylistError");
let selectedCoverFile = null;

function openCreatePlaylistModal() {
    createPlaylistOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
    setTimeout(() => playlistNameInput.focus(), 50);
}

function closeCreatePlaylistModal() {
    createPlaylistOverlay.classList.remove("active");
    document.body.style.overflow = "";
    playlistNameInput.value = "";
    playlistDescInput.value = "";
    descCharCount.textContent = "0";
    coverPreview.src = "";
    coverPreview.hidden = true;
    coverPlaceholder.hidden = false;
    selectedCoverFile = null;
    confirmCreateBtn.disabled = true;
    createPlaylistError.textContent = "";
}

coverUpload.addEventListener("click", () => coverInput.click());

coverInput.addEventListener("change", () => {
    const file = coverInput.files[0];
    if (!file) return;
    selectedCoverFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        coverPreview.src = e.target.result;
        coverPreview.hidden = false;
        coverPlaceholder.hidden = true;
    };
    reader.readAsDataURL(file);
});

playlistNameInput.addEventListener("input", () => {
    confirmCreateBtn.disabled = playlistNameInput.value.trim().length === 0;
    createPlaylistError.textContent = "";
});

playlistDescInput.addEventListener("input", () => {
    descCharCount.textContent = playlistDescInput.value.length;
});

cancelCreateBtn.addEventListener("click", closeCreatePlaylistModal);
closeCreateBtn.addEventListener("click", closeCreatePlaylistModal);

createPlaylistOverlay.addEventListener("click", (e) => {
    if (e.target === createPlaylistOverlay) closeCreatePlaylistModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && createPlaylistOverlay.classList.contains("active")) {
        closeCreatePlaylistModal();
    }
});

confirmCreateBtn.addEventListener("click", async () => {
    const name = playlistNameInput.value.trim();
    if (!name) return;

    confirmCreateBtn.disabled = true;
    confirmCreateBtn.textContent = "Creating...";
    createPlaylistError.textContent = "";

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", playlistDescInput.value.trim());
    if (selectedCoverFile) {
        formData.append("cover", selectedCoverFile);
    }

    try {
        const res = await fetch("/create_playlist", {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            window.location.reload();
        } else {
            const data = await res.json().catch(() => ({}));
            createPlaylistError.textContent = data.error || "Couldn't create playlist.";
            confirmCreateBtn.disabled = false;
            confirmCreateBtn.textContent = "Create";
        }
    } catch (err) {
        createPlaylistError.textContent = "Network error, try again.";
        confirmCreateBtn.disabled = false;
        confirmCreateBtn.textContent = "Create";
    }
});

document.querySelectorAll(".add-btn").forEach((btn, index) => {

    btn.addEventListener("click", async (e) => {

        e.stopPropagation();

        const row = btn.closest(".song-row");
        selectedSong = songs.find(
            song => song.filename === row.dataset.filename
        );

        const rect = btn.getBoundingClientRect();

        // If this button already opened the popup, close it.
        if (
            playlistPopup.classList.contains("active") &&
            playlistPopup.dataset.song === selectedSong.filename
        ) {
            playlistPopup.classList.remove("active");
            playlistPopup.dataset.song = "";
            return;
        }

        await loadPlaylistPopup();

        // Get popup height (it's fixed at 320px max-height)
        const popupHeight = 320;
        
        // Check if there's enough space below the button
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Position the popup
        playlistPopup.style.left = `${rect.right - 270}px`;
        
        // Remove the 'above' class first
        playlistPopup.classList.remove("above");
        
        if (spaceBelow < popupHeight && spaceAbove > popupHeight) {
            // Not enough space below, show above
            playlistPopup.style.top = `${rect.top - popupHeight - 8}px`;
            playlistPopup.classList.add("above");
        } else {
            // Show below
            playlistPopup.style.top = `${rect.bottom + 8}px`;
        }

        playlistPopup.dataset.song = selectedSong.filename;
        playlistPopup.classList.add("active");

    });

});

document.addEventListener("click", (e) => {

    if (
        !playlistPopup.contains(e.target) &&
        !e.target.closest(".add-btn")
    ) {
        playlistPopup.classList.remove("active");
        playlistPopup.dataset.song = "";
    }

});

initMediaSession();

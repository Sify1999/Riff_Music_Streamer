const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch")
const fileInput = document.getElementById('fileInput');
const uploadIcon = document.getElementById('uploadIcon');
const songsBtn = document.getElementById('songs-btn');
const playlistsBtn = document.getElementById('playlists-btn');
const indicator = document.querySelector(".indicator");
const songList = document.querySelector(".song-list");
const playlistList = document.querySelector(".playlist-list");
const detailBar = document.getElementById("DetailBar")
const openUpload = document.getElementById("openUpload");
const uploadModal = document.getElementById("uploadModal");
const closeUpload = document.getElementById("closeUpload");

const songFile = document.getElementById("songFile");
const uploadProgress = document.getElementById("uploadProgress");
const uploadStatus = document.getElementById("uploadStatus");
const uploadAnimation = document.getElementById("uploadAnimation");
const uploadProgressText = document.getElementById("uploadProgressText")

openUpload.onclick = ()=>{

    uploadModal.classList.add("active");

};


closeUpload.onclick = ()=>{

    uploadModal.classList.remove("active");

};


songFile.onchange = async ()=>{

    const file = songFile.files[0];

    if(!file) return;


    uploadAnimation.classList.add("uploading");

    uploadStatus.innerText="Uploading...";
    uploadProgressText.innerText="";
    const form = new FormData();

    form.append("song",file);



    const xhr = new XMLHttpRequest();


    xhr.upload.onprogress = (e)=>{

        if(e.lengthComputable){

            let percent =
            (e.loaded/e.total)*100;


            uploadProgress.style.width =
            percent+"%";

        }

    };


    xhr.onload = ()=>{

        uploadAnimation.classList.remove("uploading");

        uploadStatus.innerText=
        "✓ Added to library";

        uploadStatus.classList.add("success");


        setTimeout(()=>{

            location.reload();

        },1200);

    };


    xhr.open(
        "POST",
        "/upload"
    );


    xhr.send(form);

};


songsBtn.addEventListener('click' , () => {
    songsBtn.classList.add("active");
    playlistsBtn.classList.remove("active");
    moveIndicator(songsBtn);
    songList.style.display = "block";
    playlistList.style.display = "none";
    detailBar.style.display = "flex"
})

playlistsBtn.addEventListener('click' , () => {
    playlistsBtn.classList.add("active");
    songsBtn.classList.remove("active");
    moveIndicator(playlistsBtn);
    playlistList.style.display = "grid";
    songList.style.display=  "none";
    detailBar.style.display = "none"
})

function moveIndicator(targetBtn){
    const parent = targetBtn.parentElement;

    const targetLeft = targetBtn.offsetLeft + targetBtn.offsetWidth * 0.2;
    const targetWidth = targetBtn.offsetWidth * 0.6;

    const currentLeft = indicator.offsetLeft;
    const currentWidth = indicator.offsetWidth;

    const movingRight = targetLeft > currentLeft;

    if(movingRight){
        indicator.style.width =
            `${targetLeft - currentLeft + targetWidth}px`;

        setTimeout(() => {
            indicator.style.left = `${targetLeft}px`;
            indicator.style.width = `${targetWidth}px`;
        }, 160);
    }else{
        indicator.style.left = `${targetLeft}px`;

        indicator.style.width =
            `${currentLeft - targetLeft + currentWidth}px`;

        setTimeout(() => {
            indicator.style.width = `${targetWidth}px`;
        }, 150);
    }
}

searchInput.addEventListener("input" , () => {
    const query = searchInput.value.toLowerCase().trim();

    filteredSongs = [];

    clearSearchBtn.style.display = query ? "block" : "none";

    songRows.forEach((row, index) => {
        const song = songs[index];

        const searchableText =
            `${song.title} ${song.artist}`.toLowerCase();

        if (searchableText.includes(query)) {
            row.style.display = "flex";
            filteredSongs.push(song);
        } else {
            row.style.display = "none";
        }
    })
})


clearSearchBtn.addEventListener("click" , () => {
    clearSearchBtn.style.display = "none";      
    searchInput.value = "";
    songRows.forEach(row => row.style.display = "flex");
    searchInput.focus();
    filteredSongs = [];

    const playingRow = document.querySelector(".song-row.playing");
    if (playingRow) {
        playingRow.scrollIntoView({ behavior: "smooth", block: "center" });

        const songEL = playingRow.querySelector(".song");
        const filename = playingRow.dataset.filename;

        currentSongIndex = songs.findIndex(
            song => song.filename === filename
        );
    }
})


uploadIcon.addEventListener('click', () => {
    fileInput.click(); // Opens the file dialog
});


async function addToPlaylist(song , playlistId){
    await fetch("/add_to_playlist" , {
        method: "POST",
        headers: {
            "Content-Type" : "application/json"
        },
        body: JSON.stringify({
            song: song,
            playlist_id: playlistId
        })
    });
}

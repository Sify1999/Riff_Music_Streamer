const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch")
const fileInput = document.getElementById('fileInput');
const uploadIcon = document.getElementById('uploadIcon');
const songsBtn = document.getElementById('songs-btn');
const playlistsBtn = document.getElementById('playlists-btn');
let openMenu = null;
let x_btn = null;
const indicator = document.querySelector(".indicator");
const songList = document.querySelector(".song-list");
const playlistList = document.querySelector(".playlist-list");
const detailBar = document.getElementById("DetailBar")


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

    songRows.forEach((row , index) => {
        const songName = songs[index]
        .replace(".mp3" , "")
        .toLowerCase();

        clearSearchBtn.style.display = query ? "block" : "none";

        if( songName.includes(query) ){
            row.style.display ="flex";

            filteredSongs.push(songs[index])    
        } else{
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
        const songName = songEL.textContent.trim().toLocaleLowerCase() + ".mp3";

        currentSongIndex = songs.indexOf(songName);
    }
})


uploadIcon.addEventListener('click', () => {
    fileInput.click(); // Opens the file dialog
});

document.querySelectorAll(".add-btn").forEach((btn , index) => {
    btn.addEventListener("click" , async (e)=> {
        e.stopPropagation();
    
        const wrapper = btn.closest(".menu-wrapper")
        const menu = wrapper.querySelector(".song-menu")
        if(x_btn && x_btn!==btn){
            x_btn.classList.remove("rotated")
        }
        btn.classList.toggle("rotated")
        if (openMenu && openMenu !== menu){
            openMenu.classList.remove("active")
        }

        menu.classList.toggle("active");
        openMenu = menu;
        x_btn = btn;
        if (menu.dataset.loaded) return;

        const res = await fetch("/playlists");
        const playlists = await res.json();

        playlists.forEach(p => {
            const item = document.createElement("div");
            item.className = "menu-item";
            item.textContent = p.name;

            item.onclick = async () => {
            
                await addToPlaylist(songs[index],p.id)
                
                menu.classList.remove("active");
                openMenu = null;
            } 

            menu.appendChild(item)
        });
        menu.dataset.loaded = true;
    });
});

document.addEventListener("click" , (e) => {
    if( openMenu &&  !e.target.closest(".menu-wrapper")){
        openMenu.classList.remove("active");
        openMenu = null;
        x_btn.classList.remove("rotated")
    }
})

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

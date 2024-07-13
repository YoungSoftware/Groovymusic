// DOM Elements
const audioPlayer = new Audio();
const playPauseBtn = document.getElementById('play-pause');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const volumeControl = document.getElementById('volume');
const seekBar = document.getElementById('seek-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playlistElement = document.getElementById('playlist');
const savePlaylistBtn = document.getElementById('save-playlist');
const loadPlaylistBtn = document.getElementById('load-playlist');
const loadFilesInput = document.getElementById('load-files');
const albumArt = document.getElementById('album-art');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');

let playlist = [];
let currentTrack = 0;
let isShuffled = false;
let isRepeat = false;

// Helper Functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updatePlaylist() {
    playlistElement.innerHTML = '';
    playlist.forEach((song, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${song.title}</strong>
                <br>
                <small>${song.artist}</small>
            </div>
            <i class="fas ${index === currentTrack ? 'fa-volume-up' : 'fa-play'}"></i>
        `;
        li.onclick = () => playSong(index);
        if (index === currentTrack) li.classList.add('active');
        playlistElement.appendChild(li);
    });
}

function updateNowPlaying() {
    if (playlist[currentTrack]) {
        trackTitle.textContent = playlist[currentTrack].title;
        trackArtist.textContent = playlist[currentTrack].artist;
        if (playlist[currentTrack].picture) {
            const imageUrl = URL.createObjectURL(playlist[currentTrack].picture);
            albumArt.src = imageUrl;
        } else {
            albumArt.src = 'vinyl-stock.png'; // Use stock photo when no artwork is available
        }
    } else {
        trackTitle.textContent = 'No track selected';
        trackArtist.textContent = 'Select a track to play';
        albumArt.src = 'vinyl-stock.png';
    }
}

function playSong(index) {
    currentTrack = index;
    audioPlayer.src = URL.createObjectURL(playlist[currentTrack].file);
    audioPlayer.play();
    updatePlaylist();
    updateNowPlaying();
    updatePlayPauseIcon();
}

function updatePlayPauseIcon() {
    playPauseBtn.innerHTML = audioPlayer.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
}

function shufflePlaylist() {
    for (let i = playlist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
    currentTrack = 0;
    updatePlaylist();
}

// Event Listeners
playPauseBtn.onclick = () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
    } else {
        audioPlayer.pause();
    }
    updatePlayPauseIcon();
};

prevBtn.onclick = () => {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    playSong(currentTrack);
};

nextBtn.onclick = () => {
    currentTrack = (currentTrack + 1) % playlist.length;
    playSong(currentTrack);
};

shuffleBtn.onclick = () => {
    isShuffled = !isShuffled;
    shuffleBtn.style.color = isShuffled ? 'var(--accent-color)' : 'var(--text-color)';
    if (isShuffled) {
        shufflePlaylist();
    } else {
        playlist.sort((a, b) => a.title.localeCompare(b.title));
        updatePlaylist();
    }
};

repeatBtn.onclick = () => {
    isRepeat = !isRepeat;
    repeatBtn.style.color = isRepeat ? 'var(--accent-color)' : 'var(--text-color)';
};

volumeControl.oninput = (e) => {
    audioPlayer.volume = e.target.value;
};

seekBar.oninput = (e) => {
    const time = (audioPlayer.duration / 100) * e.target.value;
    audioPlayer.currentTime = time;
};

audioPlayer.ontimeupdate = () => {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    seekBar.value = progress;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
};

audioPlayer.onloadedmetadata = () => {
    durationEl.textContent = formatTime(audioPlayer.duration);
};

audioPlayer.onended = () => {
    if (isRepeat) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else if (currentTrack < playlist.length - 1) {
        currentTrack++;
        playSong(currentTrack);
    } else {
        currentTrack = 0;
        playSong(currentTrack);
    }
};

savePlaylistBtn.onclick = () => {
    const playlistData = playlist.map(song => ({
        title: song.title,
        artist: song.artist,
        fileName: song.file.name
    }));
    localStorage.setItem('savedPlaylist', JSON.stringify(playlistData));
    alert('Playlist saved!');
};

loadPlaylistBtn.onclick = () => {
    const savedPlaylist = localStorage.getItem('savedPlaylist');
    if (savedPlaylist) {
        const playlistData = JSON.parse(savedPlaylist);
        playlist = playlistData.map(song => ({
            title: song.title,
            artist: song.artist,
            file: new File([], song.fileName)
        }));
        updatePlaylist();
        alert('Playlist loaded!');
    } else {
        alert('No saved playlist found.');
    }
};

loadFilesInput.onchange = async (event) => {
    const files = event.target.files;
    playlist = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('audio/')) {
            try {
                const metadata = await extractMetadata(file);
                const song = {
                    file: file,
                    title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
                    artist: metadata.artist || 'Unknown Artist',
                    album: metadata.album || 'Unknown Album',
                    picture: metadata.picture || null
                };
                playlist.push(song);
            } catch (error) {
                console.error('Error processing file:', file.name, error);
            }
        }
    }
    updatePlaylist();
    if (playlist.length > 0) {
        playSong(0);
    }
};

// Function to extract metadata from audio files
function extractMetadata(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dv = new DataView(e.target.result);
            try {
                const metadata = parseID3v2(dv);
                resolve(metadata);
            } catch (error) {
                console.error('Error extracting metadata:', error);
                resolve({});
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Function to parse ID3v2 tags
function parseID3v2(dv) {
    const tags = {};
    let offset = 0;

    function readSize(size) {
        let realSize = 0;
        for (let i = 0; i < size; i++) {
            realSize = (realSize << 7) | (dv.getUint8(offset) & 0x7F);
            offset++;
        }
        return realSize;
    }

    if (dv.getString(3, offset) === 'ID3') {
        offset += 6; // Skip ID3 header
        const size = readSize(4);
        const end = offset + size;

        while (offset < end) {
            const frameId = dv.getString(4, offset);
            offset += 4;
            const frameSize = dv.getUint32(offset);
            offset += 6; // 4 for size, 2 for flags

            if (frameId === 'TIT2') tags.title = dv.getString(frameSize, offset, 'utf-8').replace(/\0/g, '');
            else if (frameId === 'TPE1') tags.artist = dv.getString(frameSize, offset, 'utf-8').replace(/\0/g, '');
            else if (frameId === 'TALB') tags.album = dv.getString(frameSize, offset, 'utf-8').replace(/\0/g, '');
            else if (frameId === 'APIC') {
                offset++; // Skip text encoding
                const mimeType = dv.getString(0, offset).replace(/\0/g, '');
                offset += mimeType.length + 2; // +1 for null terminator, +1 for picture type
                const description = dv.getString(0, offset, 'utf-8').replace(/\0/g, '');
                offset += description.length + 1; // +1 for null terminator
                const pictureData = new Uint8Array(dv.buffer, offset, frameSize - (offset - (end - frameSize)));
                tags.picture = new Blob([pictureData], { type: mimeType });
            }

            offset += frameSize;
        }
    }
    return tags;
}

// Initialize the player
updatePlaylist();
updateNowPlaying();
updatePlayPauseIcon();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        playPauseBtn.click();
    } else if (e.code === 'ArrowLeft') {
        prevBtn.click();
    } else if (e.code === 'ArrowRight') {
        nextBtn.click();
    }
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
// DOM Elements
const audioElement = new Audio();
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
const albumArt = document.getElementById('album-art');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const loadFolderInput = document.getElementById('load-folder');
const searchBar = document.getElementById('search-bar');
const sleepTimerBtn = document.getElementById('sleep-timer');
const sleepTimerDropdown = document.getElementById('sleep-timer-dropdown');
const customSleepTimeInput = document.getElementById('custom-sleep-time');
const startCustomSleepTimerBtn = document.getElementById('start-custom-sleep-timer');
const togglePlaylistBtn = document.getElementById('toggle-playlist');
const playlistContainer = document.querySelector('.playlist-container');
const visualizerCanvas = document.getElementById('visualizer');
const visualizerModeSelect = document.getElementById('visualizer-mode');
const sleepTimerModal = document.getElementById('sleep-timer-modal');

let playlist = [];
let currentTrack = 0;
let isShuffled = false;
let isRepeat = false;
let sleepTimerID = null;
let visualizer;

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
        li.textContent = song.title;
        li.onclick = () => playSong(index);
        if (index === currentTrack) li.classList.add('active');
        playlistElement.appendChild(li);
    });
}

function updateNowPlaying() {
    if (playlist[currentTrack]) {
        trackTitle.textContent = playlist[currentTrack].title;
        trackArtist.textContent = playlist[currentTrack].artist;
        albumArt.src = 'vinyl-stock.png'; // Default image
    } else {
        trackTitle.textContent = 'No track selected';
        trackArtist.textContent = 'Select a track to play';
        albumArt.src = 'vinyl-stock.png';
    }
}

function playSong(index) {
    currentTrack = index;
    const song = playlist[currentTrack];
    audioElement.src = song.url;
    audioElement.play();
    updatePlaylist();
    updateNowPlaying();
    updatePlayPauseIcon();

    // Start or restart visualizer
    if (!visualizer) {
        visualizer = new Visualizer(audioElement, visualizerCanvas);
    }
    visualizer.start();
}

function updatePlayPauseIcon() {
    playPauseBtn.innerHTML = audioElement.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
}

function shufflePlaylist() {
    for (let i = playlist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
    updatePlaylist();
}

// Event Listeners
playPauseBtn.onclick = () => {
    if (audioElement.paused) {
        audioElement.play();
    } else {
        audioElement.pause();
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
    shuffleBtn.classList.toggle('active', isShuffled);
    if (isShuffled) {
        shufflePlaylist();
    } else {
        playlist.sort((a, b) => a.title.localeCompare(b.title));
        updatePlaylist();
    }
};

repeatBtn.onclick = () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
    audioElement.loop = isRepeat;
};

volumeControl.oninput = (e) => {
    audioElement.volume = e.target.value;
};

seekBar.oninput = (e) => {
    const seekTime = (audioElement.duration / 100) * e.target.value;
    audioElement.currentTime = seekTime;
};

// File loading
loadFolderInput.onchange = (event) => {
    const files = event.target.files;
    playlist = [];

    for (let file of files) {
        if (file.type.startsWith('audio/')) {
            const url = URL.createObjectURL(file);
            playlist.push({
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: 'Unknown Artist',
                url: url
            });
        }
    }

    updatePlaylist();
    if (playlist.length > 0) {
        playSong(0);
    }
};

// Search functionality
searchBar.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const playlistItems = playlistElement.getElementsByTagName('li');
    
    for (let item of playlistItems) {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    }
});

// Sleep Timer functionality
sleepTimerBtn.onclick = () => {
    sleepTimerModal.style.display = 'block';
};
closeSleepTimerBtn.onclick = () => {
    sleepTimerModal.style.display = 'none';
};

function setSleepTimer(minutes) {
    if (sleepTimerID) clearTimeout(sleepTimerID);
    sleepTimerID = setTimeout(() => {
        audioElement.pause();
        updatePlayPauseIcon();
    }, minutes * 60000);
    alert(`Sleep timer set for ${minutes} minutes`);
    sleepTimerModal.style.display = 'none';
}

// Set up sleep timer options
const sleepTimerOptions = [15, 25, 45, 60, 240];
sleepTimerOptions.forEach(minutes => {
    const option = document.createElement('button');
    option.textContent = minutes < 60 ? `${minutes} min` : `${minutes / 60} h`;
    option.onclick = () => setSleepTimer(minutes);
    sleepTimerDropdown.insertBefore(option, sleepTimerDropdown.firstChild);
});

timerOptions.forEach(option => {
    option.onclick = () => setSleepTimer(parseInt(option.dataset.time));
});
// Custom sleep timer
startCustomSleepTimerBtn.onclick = () => {
    const minutes = parseInt(customSleepTimeInput.value);
    if (minutes > 0) {
        setSleepTimer(minutes);
    } else {
        alert('Please enter a valid number of minutes.');
    }
};

// Toggle playlist
togglePlaylistBtn.onclick = () => {
    playlistContainer.classList.toggle('expanded');
    togglePlaylistBtn.innerHTML = playlistContainer.classList.contains('expanded') 
        ? '<i class="fas fa-chevron-down"></i>' 
        : '<i class="fas fa-chevron-up"></i>';
};

// Visualizer mode change
visualizerModeSelect.onchange = (e) => {
    if (visualizer) {
        visualizer.setMode(e.target.value);
    }
};

// Update progress
audioElement.ontimeupdate = () => {
    const progress = (audioElement.currentTime / audioElement.duration) * 100;
    seekBar.value = progress;
    currentTimeEl.textContent = formatTime(audioElement.currentTime);
    durationEl.textContent = formatTime(audioElement.duration);
};

audioElement.onended = () => {
    if (!isRepeat) {
        nextBtn.click();
    }
};

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

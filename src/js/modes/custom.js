// src/modes/custom.js
import { getRandomTrackFromRandomEra } from '../music.js';

let customScore = 0;
let customLastAnswer = '';
let customLastQuestionType = '';
let customPlayedTracks = new Set();
let customTimerInterval = null;
let customPlaylist = [];
let customSettings = {
  timeLimit: 10000,
  questionTypes: ['artist', 'title'],
  eraFilter: 'all'
};
let showCustomAlbumCover = true; // Global state for album cover visibility in custom mode

export async function startCustom() {
  try {
    console.log('Custom modu başlatılıyor...');
    customScore = 0;
    customPlayedTracks.clear();
    document.querySelector('main')?.remove();
    
    // Show custom setup screen first
    await showCustomSetup();
  } catch (error) {
    console.error('Custom başlatma hatası:', error);
    alert('Oyun başlatılırken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

async function showCustomSetup() {
  const container = initCustomContainer();
  
  container.innerHTML = `
    <div class="max-w-4xl mx-auto bg-black bg-opacity-75 rounded-2xl p-8 text-white">
      <h1 class="text-4xl font-bold text-center mb-8 text-purple-400">Custom Mode Setup</h1>
      
      <!-- Playlist Section -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-purple-300">🎵 Playlist Oluştur</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium mb-2">Era Seç:</label>
            <select id="era-select" class="w-full bg-gray-800 text-white p-3 rounded-lg border border-purple-600">
              <option value="all">Tüm Eras</option>
              <option value="60s">1960s</option>
              <option value="70s">1970s</option>
              <option value="80s">1980s</option>
              <option value="90s">1990s</option>
              <option value="2000s">2000s</option>
              <option value="2010s">2010s</option>
              <option value="2020s">2020s</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Şarkı Sayısı:</label>
            <input type="number" id="track-count" min="5" max="50" value="10" 
                   class="w-full bg-gray-800 text-white p-3 rounded-lg border border-purple-600">
          </div>
        </div>
        <button id="generate-playlist" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition">
          Playlist Oluştur
        </button>
      </div>

      <!-- Settings Section -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-purple-300">⚙️ Oyun Ayarları</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium mb-2">Süre Limiti (saniye):</label>
            <input type="number" id="time-limit" min="5" max="30" value="10" 
                   class="w-full bg-gray-800 text-white p-3 rounded-lg border border-purple-600">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Soru Türleri:</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" id="artist-questions" checked class="mr-2">
                Sanatçı Soruları
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="title-questions" checked class="mr-2">
                Şarkı Adı Soruları
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Playlist Preview -->
      <div id="playlist-preview" class="mb-8 hidden">
        <h2 class="text-2xl font-semibold mb-4 text-purple-300">📋 Playlist Önizleme</h2>
        <div id="playlist-tracks" class="bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
          <!-- Playlist tracks will be populated here -->
        </div>
      </div>

      <!-- Start Button -->
      <div class="text-center">
        <button id="start-custom-game" disabled 
                class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold text-xl transition">
          Oyunu Başlat
        </button>
        <button id="back-to-menu" 
                class="ml-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-lg font-semibold transition">
          Ana Menüye Dön
        </button>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('generate-playlist').addEventListener('click', generateCustomPlaylist);
  document.getElementById('start-custom-game').addEventListener('click', startCustomGame);
  document.getElementById('back-to-menu').addEventListener('click', () => {
    location.reload();
  });
}

async function generateCustomPlaylist() {
  const eraSelect = document.getElementById('era-select').value;
  const trackCount = parseInt(document.getElementById('track-count').value);
  const generateBtn = document.getElementById('generate-playlist');
  const startBtn = document.getElementById('start-custom-game');
  const preview = document.getElementById('playlist-preview');
  const tracksContainer = document.getElementById('playlist-tracks');

  generateBtn.disabled = true;
  generateBtn.textContent = 'Oluşturuluyor...';

  try {
    customPlaylist = [];
    const attempts = trackCount * 3; // Allow more attempts to get enough tracks
    
    for (let i = 0; i < attempts && customPlaylist.length < trackCount; i++) {
      const track = await getRandomTrackFromRandomEra();
      
      // Filter by era if specified
      if (eraSelect === 'all' || track.era === eraSelect) {
        // Avoid duplicates
        if (!customPlaylist.find(t => t.id === track.id)) {
          customPlaylist.push(track);
        }
      }
    }

    // Update settings
    customSettings.eraFilter = eraSelect;
    customSettings.timeLimit = parseInt(document.getElementById('time-limit').value) * 1000;
    customSettings.questionTypes = [];
    if (document.getElementById('artist-questions').checked) {
      customSettings.questionTypes.push('artist');
    }
    if (document.getElementById('title-questions').checked) {
      customSettings.questionTypes.push('title');
    }

    // Show playlist preview
    tracksContainer.innerHTML = customPlaylist.map((track, index) => `
      <div class="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
        <div class="flex items-center space-x-3">
          <span class="text-purple-400 font-semibold">${index + 1}.</span>
          ${track.albumCover ? `<img src="${track.albumCover}" alt="Album Cover" class="w-8 h-8 object-cover rounded">` : ''}
          <div>
            <div class="font-medium">${track.title}</div>
            <div class="text-sm text-gray-400">${track.artist} • ${track.era}</div>
          </div>
        </div>
        <button onclick="removeTrack(${index})" class="text-red-400 hover:text-red-300 text-sm">
          Kaldır
        </button>
      </div>
    `).join('');

    preview.classList.remove('hidden');
    startBtn.disabled = false;

  } catch (error) {
    console.error('Playlist oluşturma hatası:', error);
    alert('Playlist oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Playlist Oluştur';
  }
}

// Add remove track functionality to window for onclick access
window.removeTrack = function(index) {
  customPlaylist.splice(index, 1);
  const tracksContainer = document.getElementById('playlist-tracks');
  const startBtn = document.getElementById('start-custom-game');
  
  tracksContainer.innerHTML = customPlaylist.map((track, idx) => `
    <div class="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
      <div class="flex items-center space-x-3">
        <span class="text-purple-400 font-semibold">${idx + 1}.</span>
        ${track.albumCover ? `<img src="${track.albumCover}" alt="Album Cover" class="w-8 h-8 object-cover rounded">` : ''}
        <div>
          <div class="font-medium">${track.title}</div>
          <div class="text-sm text-gray-400">${track.artist} • ${track.era}</div>
        </div>
      </div>
      <button onclick="removeTrack(${idx})" class="text-red-400 hover:text-red-300 text-sm">
        Kaldır
      </button>
    </div>
  `).join('');

  startBtn.disabled = customPlaylist.length === 0;
};

async function startCustomGame() {
  if (customPlaylist.length === 0) {
    alert('Lütfen önce bir playlist oluşturun.');
    return;
  }

  if (customSettings.questionTypes.length === 0) {
    alert('Lütfen en az bir soru türü seçin.');
    return;
  }

  const container = document.getElementById('custom-container');
  container.innerHTML = '';
  await renderCustomQuestion(container);
}

function initCustomContainer() {
  let c = document.getElementById('custom-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'custom-container';
    c.className = 'absolute inset-0 flex flex-col items-center justify-center px-4 bg-black bg-opacity-75';
    document.body.appendChild(c);
  }
  c.innerHTML = '';
  return c;
}

function createCustomTimerBar() {
  const timerContainer = document.createElement('div');
  timerContainer.className = 'w-full max-w-2xl flex justify-center items-center mb-6';
  timerContainer.id = 'custom-timer-container';

  const barWrapper = document.createElement('div');
  barWrapper.className = 'relative w-full max-w-3xl bg-gray-800 rounded-lg overflow-hidden';
  barWrapper.style.height = '20px';

  const progressBar = document.createElement('div');
  progressBar.id = 'custom-timer-progress';
  progressBar.className = 'h-full bg-purple-600 transition-all duration-100 ease-linear';
  progressBar.style.width = '0%';

  barWrapper.appendChild(progressBar);
  timerContainer.appendChild(barWrapper);
  return timerContainer;
}

function startCustomTimer(container, duration) {
  if (customTimerInterval) {
    clearInterval(customTimerInterval);
  }

  const progressBar = document.getElementById('custom-timer-progress');
  if (!progressBar) return;

  progressBar.style.width = '0%';
  
  const updateInterval = 100;
  const totalUpdates = Math.floor(duration / updateInterval);
  let currentUpdate = 0;

  customTimerInterval = setInterval(() => {
    currentUpdate++;
    const progress = (currentUpdate / totalUpdates) * 100;
    progressBar.style.width = `${progress}%`;
    
    if (currentUpdate >= totalUpdates) {
      clearInterval(customTimerInterval);
      // Auto advance to next question when timer expires
      console.log('Süre doldu, otomatik geçiş yapılıyor');
      renderCustomQuestion(container);
      return;
    }
  }, updateInterval);
}

async function renderCustomQuestion(container) {
  try {
    container.innerHTML = '';

    // Check if game is over
    if (customPlayedTracks.size >= customPlaylist.length) {
      showCustomGameOver(container);
      return;
    }

    // Score and progress
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'text-xl font-semibold text-white mb-2';
    scoreDiv.textContent = `Score: ${customScore}`;
    container.appendChild(scoreDiv);

    const progressDiv = document.createElement('div');
    progressDiv.className = 'text-lg text-purple-300 mb-6';
    progressDiv.textContent = `Soru ${customPlayedTracks.size + 1}/${customPlaylist.length}`;
    container.appendChild(progressDiv);

    // Album Cover Toggle Button
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'flex items-center justify-center mb-4';
    
    const toggleLabel = document.createElement('span');
    toggleLabel.className = 'text-white mr-3';
    toggleLabel.textContent = 'Albüm Kapağı:';
    toggleContainer.appendChild(toggleLabel);
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = `px-4 py-2 rounded-lg font-semibold transition ${showCustomAlbumCover ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`;
    toggleBtn.textContent = showCustomAlbumCover ? 'Açık' : 'Kapalı';
    toggleBtn.onclick = () => {
      showCustomAlbumCover = !showCustomAlbumCover;
      toggleBtn.textContent = showCustomAlbumCover ? 'Açık' : 'Kapalı';
      toggleBtn.className = `px-4 py-2 rounded-lg font-semibold transition ${showCustomAlbumCover ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`;
    };
    toggleContainer.appendChild(toggleBtn);
    container.appendChild(toggleContainer);

    // Timer Bar
    const timerBar = createCustomTimerBar();
    container.appendChild(timerBar);

    // Loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'text-white text-lg mb-4';
    loadingDiv.textContent = 'Şarkı yükleniyor...';
    container.appendChild(loadingDiv);

    // Get unplayed track from custom playlist
    let track;
    let attempts = 0;
    const maxAttempts = customPlaylist.length * 2;
    
    do {
      track = customPlaylist[Math.floor(Math.random() * customPlaylist.length)];
      attempts++;
      if (attempts >= maxAttempts) {
        // If we can't find an unplayed track, reset
        customPlayedTracks.clear();
        console.log('Tüm şarkılar oynandı, liste sıfırlandı');
        break;
      }
    } while (customPlayedTracks.has(track.id));
    
    const { id, title, artist, preview, era, albumCover, albumTitle } = track;
    customPlayedTracks.add(id);
    
    // Remove loading indicator
    loadingDiv.remove();

    // Album Cover Display
    if (albumCover && showCustomAlbumCover) {
      const albumContainer = document.createElement('div');
      albumContainer.className = 'flex flex-col items-center mb-6';
      
      const albumImg = document.createElement('img');
      albumImg.src = albumCover;
      albumImg.alt = 'Album Cover';
      albumImg.className = 'w-48 h-48 object-cover rounded-lg shadow-lg border-2 border-purple-600';
      albumContainer.appendChild(albumImg);
      
      container.appendChild(albumContainer);
    }

    // Play preview
    const audio = document.createElement('audio');
    audio.src = preview;
    audio.autoplay = true;
    audio.volume = 0.5;
    container.appendChild(audio);
    
    audio.addEventListener('error', (e) => {
      console.error('Audio oynatma hatası:', e);
    });
    
    // Start timer with custom duration
    startCustomTimer(container, customSettings.timeLimit);
    
    setTimeout(() => {
      audio.pause();
      audio.remove();
    }, customSettings.timeLimit);

    // Pick question type from custom settings
    const availableTypes = customSettings.questionTypes;
    customLastQuestionType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    customLastAnswer = customLastQuestionType === 'artist' ? artist : title;

    // Question text
    const qText = customLastQuestionType === 'artist'
      ? `Which artist performs this ${era} rock/metal clip?`
      : `Which song title matches this ${era} rock/metal clip?`;
    const qHeader = document.createElement('h2');
    qHeader.className = 'text-4xl font-bold mb-6 text-white text-center';
    qHeader.textContent = qText;
    container.appendChild(qHeader);

    // Generate options
    const optionsSet = new Set([customLastAnswer]);
    let attempts2 = 0;
    while (optionsSet.size < 4 && attempts2 < 20) {
      const randomTrack = customPlaylist[Math.floor(Math.random() * customPlaylist.length)];
      const wrongOption = customLastQuestionType === 'artist' ? randomTrack.artist : randomTrack.title;
      if (wrongOption && !optionsSet.has(wrongOption)) {
        optionsSet.add(wrongOption);
      }
      attempts2++;
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'w-full max-w-md py-4 my-2 bg-purple-900 bg-opacity-50 hover:bg-opacity-80 rounded-lg text-xl font-semibold text-white transition';
      btn.textContent = opt;
      btn.onclick = () => {
        if (customTimerInterval) {
          clearInterval(customTimerInterval);
        }
        
        if (opt === customLastAnswer) {
          customScore++;
          console.log('Doğru cevap! Yeni skor:', customScore);
        } else {
          console.log('Yanlış cevap. Doğru cevap:', customLastAnswer);
        }
        renderCustomQuestion(container);
      };
      container.appendChild(btn);
    });
  } catch (error) {
    console.error('Custom soru render hatası:', error);
    container.innerHTML = `
      <div class="text-white text-center">
        <h2 class="text-2xl font-bold mb-4">Hata Oluştu</h2>
        <p class="mb-4">Şarkı yüklenirken bir sorun oluştu.</p>
        <button onclick="location.reload()" class="bg-purple-600 text-white px-6 py-2 rounded-lg">
          Ana Menüye Dön
        </button>
      </div>
    `;
  }
}

function showCustomGameOver(container) {
  const accuracy = customPlaylist.length > 0 ? Math.round((customScore / customPlaylist.length) * 100) : 0;
  
  container.innerHTML = `
    <div class="max-w-2xl mx-auto bg-black bg-opacity-75 rounded-2xl p-8 text-white text-center">
      <h1 class="text-4xl font-bold mb-6 text-purple-400">🎉 Custom Mode Tamamlandı!</h1>
      
      <div class="grid grid-cols-2 gap-6 mb-8">
        <div class="bg-purple-900 bg-opacity-50 rounded-lg p-4">
          <div class="text-3xl font-bold text-purple-300">${customScore}</div>
          <div class="text-sm text-gray-300">Doğru Cevap</div>
        </div>
        <div class="bg-purple-900 bg-opacity-50 rounded-lg p-4">
          <div class="text-3xl font-bold text-purple-300">${customPlaylist.length}</div>
          <div class="text-sm text-gray-300">Toplam Soru</div>
        </div>
      </div>
      
      <div class="bg-gray-800 rounded-lg p-4 mb-8">
        <div class="text-2xl font-bold text-green-400">${accuracy}%</div>
        <div class="text-sm text-gray-300">Doğruluk Oranı</div>
      </div>
      
      <div class="space-x-4">
        <button onclick="location.reload()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition">
          Ana Menüye Dön
        </button>
        <button onclick="startCustom()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition">
          Tekrar Oyna
        </button>
      </div>
    </div>
  `;
}

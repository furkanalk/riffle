// src/modes/marathon.js
import { getRandomTrackFromRandomEra } from '../music.js';

let score = 0;
let lastAnswer = '';
let lastQuestionType = '';
let playedTracks = new Set();
let timerInterval = null;
let showAlbumCover = true; // Global state for album cover visibility

export async function startMarathon() {
  try {
    console.log('Marathon modu başlatılıyor...');
    score = 0;
    playedTracks.clear();
    document.querySelector('main')?.remove();
    const container = initGameContainer();
    await renderQuestion(container);
  } catch (error) {
    console.error('Marathon başlatma hatası:', error);
    alert('Oyun başlatılırken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

function initGameContainer() {
  let c = document.getElementById('game-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'game-container';
    c.className = 'absolute inset-0 flex flex-col items-center justify-center px-4 bg-black bg-opacity-75';
    document.body.appendChild(c);
  }
  c.innerHTML = '';
  return c;
}

function createTimerBar() {
  const timerContainer = document.createElement('div');
  timerContainer.className = 'w-full max-w-2xl flex justify-center items-center mb-6';
  timerContainer.id = 'timer-container';

  const barWrapper = document.createElement('div');
  barWrapper.className = 'relative w-full max-w-3xl bg-gray-800 rounded-lg overflow-hidden';
  barWrapper.style.height = '20px';

  const progressBar = document.createElement('div');
  progressBar.id = 'timer-progress';
  progressBar.className = 'h-full bg-purple-600 transition-all duration-100 ease-linear';
  progressBar.style.width = '0%';

  barWrapper.appendChild(progressBar);
  timerContainer.appendChild(barWrapper);
  return timerContainer;
}

function startTimer(container, duration = 10000) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  const progressBar = document.getElementById('timer-progress');
  if (!progressBar) return;

  progressBar.style.width = '0%';
  
  const updateInterval = 100;
  const totalUpdates = Math.floor(duration / updateInterval);
  let currentUpdate = 0;

  timerInterval = setInterval(() => {
    currentUpdate++;
    const progress = (currentUpdate / totalUpdates) * 100;
    progressBar.style.width = `${progress}%`;
    
    if (currentUpdate >= totalUpdates) {
      clearInterval(timerInterval);
      // Auto advance to next question when timer expires
      console.log('Süre doldu, otomatik geçiş yapılıyor');
      renderQuestion(container);
      return;
    }
  }, updateInterval);
}

async function renderQuestion(container) {
  try {
    container.innerHTML = '';

    // Score
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'text-xl font-semibold text-white mb-6';
    scoreDiv.textContent = `Score: ${score}`;
    container.appendChild(scoreDiv);

    // Album Cover Toggle Button
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'flex items-center justify-center mb-4';
    
    const toggleLabel = document.createElement('span');
    toggleLabel.className = 'text-white mr-3';
    toggleLabel.textContent = 'Albüm Kapağı:';
    toggleContainer.appendChild(toggleLabel);
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = `px-4 py-2 rounded-lg font-semibold transition ${showAlbumCover ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`;
    toggleBtn.textContent = showAlbumCover ? 'Açık' : 'Kapalı';
    toggleBtn.onclick = () => {
      showAlbumCover = !showAlbumCover;
      toggleBtn.textContent = showAlbumCover ? 'Açık' : 'Kapalı';
      toggleBtn.className = `px-4 py-2 rounded-lg font-semibold transition ${showAlbumCover ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`;
    };
    toggleContainer.appendChild(toggleBtn);
    container.appendChild(toggleContainer);

    // Timer Bar
    const timerBar = createTimerBar();
    container.appendChild(timerBar);

    // Loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'text-white text-lg mb-4';
    loadingDiv.textContent = 'Şarkı yükleniyor...';
    container.appendChild(loadingDiv);

    // Fetch track - oynanmamış bir şarkı bul
    let track;
    let attempts = 0;
    const maxAttempts = 50;
    do {
      track = await getRandomTrackFromRandomEra();
      attempts++;
      if (attempts >= maxAttempts) {
        playedTracks.clear();
        console.log('Tüm şarkılar oynandı, liste sıfırlandı');
        break;
      }
    } while (playedTracks.has(track.id));
    const { id, title, artist, preview, era, albumCover, albumTitle } = track;
    playedTracks.add(id);
    loadingDiv.remove();

    // Album Cover Display (only if enabled)
    if (showAlbumCover && albumCover) {
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
    
    // Start timer
    startTimer(container, 10000);
    
    setTimeout(() => {
      audio.pause();
      audio.remove();
    }, 10000);

    // Pick question type
    lastQuestionType = Math.random() < 0.5 ? 'artist' : 'title';
    lastAnswer = lastQuestionType === 'artist' ? artist : title;

    // Question text
    const qText = lastQuestionType === 'artist'
      ? `Which artist performs this ${era} rock/metal clip?`
      : `Which song title matches this ${era} rock/metal clip?`;
    const qHeader = document.createElement('h2');
    qHeader.className = 'text-4xl font-bold mb-6 text-white text-center';
    qHeader.textContent = qText;
    container.appendChild(qHeader);

    // --- ŞIKLARIN DÜZGÜN OLUŞTURULMASI ---
    const optionsSet = new Set([lastAnswer]);
    let deneme = 0;
    while (optionsSet.size < 4 && deneme < 10) {
      const randomTrack = await getRandomTrackFromRandomEra();
      const wrongOption = lastQuestionType === 'artist' ? randomTrack.artist : randomTrack.title;
      if (wrongOption && !optionsSet.has(wrongOption)) {
        optionsSet.add(wrongOption);
      }
      deneme++;
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'w-full max-w-md py-4 my-2 bg-purple-900 bg-opacity-50 hover:bg-opacity-80 rounded-lg text-xl font-semibold text-white transition';
      btn.textContent = opt;
      btn.onclick = () => {
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        if (opt === lastAnswer) {
          score++;
          console.log('Doğru cevap! Yeni skor:', score);
        } else {
          console.log('Yanlış cevap. Doğru cevap:', lastAnswer);
        }
        renderQuestion(container);
      };
      container.appendChild(btn);
    });
  } catch (error) {
    console.error('Soru render hatası:', error);
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

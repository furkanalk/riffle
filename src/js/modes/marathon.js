// src/modes/marathon.js
import { getRandomTrackFromRandomEra } from '../music.js';

let score = 0;
let lastAnswer = '';
let lastQuestionType = '';

export async function startMarathon() {
  score = 0;
  document.querySelector('main')?.remove();
  const container = initGameContainer();
  await renderQuestion(container);
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

async function renderQuestion(container) {
  container.innerHTML = '';

  // Score
  const scoreDiv = document.createElement('div');
  scoreDiv.className = 'text-xl font-semibold text-white mb-6';
  scoreDiv.textContent = `Score: ${score}`;
  container.appendChild(scoreDiv);

  // Fetch track
  const { id, title, artist, preview, era } = await getRandomTrackFromRandomEra();

  // Play preview
  const audio = document.createElement('audio');
  audio.src = preview;
  audio.autoplay = true;
  container.appendChild(audio);
  setTimeout(() => audio.pause(), 10000);

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

  // For simplicity, use the same correct answer + 3 random eras' answers
  const pool = [artist, title];
  const extras = pool.filter(x => x !== lastAnswer);
  while (extras.length < 3) extras.push(extras[0]);
  const options = [lastAnswer, ...extras.slice(0,3)].sort(() => .5 - Math.random());

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'w-full max-w-md py-4 my-2 bg-purple-900 bg-opacity-50 hover:bg-opacity-80 rounded-lg text-xl font-semibold text-white transition';
    btn.textContent = opt;
    btn.onclick = () => {
      if (opt === lastAnswer) score++;
      renderQuestion(container);
    };
    container.appendChild(btn);
  });
}

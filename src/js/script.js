// src/script.js

import { startMarathon } from './modes/marathon.js';
import { startCoop } from './modes/coop.js';
import { startVersus } from './modes/versus.js';
import { startTeam } from './modes/team.js';
import { startChaos } from './modes/chaos.js';
import { startCustom } from './modes/custom.js';

// Oyun modu seçici
export function startMode(mode) {
  switch (mode) {
    case 'solo':
      startMarathon();
      break;
    case 'coop':
      startCoop();
      break;
    case 'versus':
      startVersus();
      break;
    case 'team':
      startTeam();
      break;
    case 'chaos':
      startChaos();
      break;
    case 'custom':
      startCustom();
      break;
    default:
      console.warn(`Bilinmeyen mod: ${mode}`);
  }
}

// DOM yüklendiğinde olay dinleyicilerini ayarla
document.addEventListener('DOMContentLoaded', () => {
  // Oyun modu seçimi için click event'leri - kartlara bağla
  document.querySelectorAll('[data-mode]').forEach(element => {
    element.addEventListener('click', () => {
      const mode = element.getAttribute('data-mode');
      startMode(mode);
    });
  });

  // Marathon video hover efekti
  const marathonCard = document.querySelector('.marathon-image').closest('.bg-black');
  const marathonVideo = document.querySelector('.marathon');
  const marathonImage = document.querySelector('.marathon-image');

  if (marathonCard && marathonVideo && marathonImage) {
    // Video'ya da click event'i bağla
    marathonVideo.addEventListener('click', () => {
      startMode('solo');
    });

    marathonCard.addEventListener('mouseenter', () => {
      marathonImage.style.opacity = '0';
      marathonVideo.classList.remove('hidden');
      marathonVideo.play();
    });

    marathonCard.addEventListener('mouseleave', () => {
      marathonVideo.pause();
      marathonVideo.classList.add('hidden');
      marathonImage.style.opacity = '1';
    });
  }

  // Coop video hover efekti
  const coopCard = document.querySelector('.coop-image').closest('.bg-black');
  const coopVideo = document.querySelector('.coop');
  const coopImage = document.querySelector('.coop-image');

  if (coopCard && coopVideo && coopImage) {
    // Video'ya da click event'i bağla
    coopVideo.addEventListener('click', () => {
      startMode('coop');
    });

    coopCard.addEventListener('mouseenter', () => {
      coopImage.style.opacity = '0';
      coopVideo.classList.remove('hidden');
      coopVideo.play();
    });

    coopCard.addEventListener('mouseleave', () => {
      coopVideo.pause();
      coopVideo.classList.add('hidden');
      coopImage.style.opacity = '1';
    });
  }

  // Solo VS video hover efekti
  const soloCard = document.querySelector('.solo-image').closest('.bg-black');
  const soloVideo = document.querySelector('.solo');
  const soloImage = document.querySelector('.solo-image');

  if (soloCard && soloVideo && soloImage) {
    // Video'ya da click event'i bağla
    soloVideo.addEventListener('click', () => {
      startMode('versus');
    });

    soloCard.addEventListener('mouseenter', () => {
      soloImage.style.opacity = '0';
      soloVideo.classList.remove('hidden');
      soloVideo.play();
    });

    soloCard.addEventListener('mouseleave', () => {
      soloVideo.pause();
      soloVideo.classList.add('hidden');
      soloImage.style.opacity = '1';
    });
  }

  // Custom video hover efekti
  const customCard = document.querySelector('[data-mode="custom"]').closest('.bg-black');
  const customVideo = document.querySelector('.custom');
  const customImage = document.querySelector('[data-mode="custom"]');

  if (customCard && customVideo && customImage) {
    // Video'ya da click event'i bağla
    customVideo.addEventListener('click', () => {
      startMode('custom');
    });

    customCard.addEventListener('mouseenter', () => {
      customImage.style.opacity = '0';
      customVideo.classList.remove('hidden');
      customVideo.play();
    });

    customCard.addEventListener('mouseleave', () => {
      customVideo.pause();
      customVideo.classList.add('hidden');
      customImage.style.opacity = '1';
    });
  }
});

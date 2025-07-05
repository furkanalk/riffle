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
  document.querySelectorAll('img[data-mode]').forEach(img => {
    img.addEventListener('click', () => {
      const mode = img.getAttribute('data-mode');
      startMode(mode);
    });
  });
});

// src/music.js

// Playlist’den rastgele şarkı al
export async function getRandomTrackFromPlaylist(playlistId) {
  // **Mutlaka** relative path kullanın, port hard-code etmeyin!
  const res = await fetch(`/api/playlist/${playlistId}/tracks`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch playlist tracks');
  }
  const tracks = await res.json();
  if (!tracks.length) throw new Error('No previewable tracks found');
  return tracks[Math.floor(Math.random() * tracks.length)];
}

// ’60s → ’00s arası Deezer playlist ID’leri
const ERA_PLAYLISTS = {
  '60s': '1306931615',  // örnek Deezer ’60s rock hits playlist ID
  '70s': '1306931615',
  '80s': '1306931615',
  '90s': '1306931615',
  '00s': '1306931615'
};

export async function getRandomTrackFromRandomEra() {
  const eras = Object.keys(ERA_PLAYLISTS);
  const era = eras[Math.floor(Math.random() * eras.length)];
  const playlistId = ERA_PLAYLISTS[era];
  const track = await getRandomTrackFromPlaylist(playlistId);
  return { ...track, era };
}

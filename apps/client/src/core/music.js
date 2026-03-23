import MusicService from "../services/music/index.js";

// Track IDs that have already been played in the current game session
let playedTrackIds = [];

// Reset played tracks history (new game session)
export function resetPlayedTracks() {
  playedTrackIds = [];
}

// Get a random track from playlist (avoiding already played tracks)
export async function getRandomTrackFromPlaylist(playlistId) {
  try {
    const tracks = await MusicService.getPlaylistTracks(playlistId);

    // Filter out tracks that have already been played
    const availableTracks = tracks.filter((track) => !playedTrackIds.includes(track.id));

    // If running out of tracks, pick random from full list
    if (availableTracks.length < 1) {
      // Reset history if completely empty to avoid crash, or just pick duplicate
      playedTrackIds = [];
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      return normalizeTrackData(randomTrack);
    }

    // Get a random track from the available ones
    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];

    // Add the track ID to played tracks
    playedTrackIds.push(randomTrack.id);

    return normalizeTrackData(randomTrack);
  } catch (error) {
    console.error("Error getting track:", error);
    throw error;
  }
}

// Normalize track data to a consistent format
function normalizeTrackData(track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist?.name ? track.artist.name : track.artist,
    preview: track.preview,
    album: track.album,
    // Other fields can be added as needed in the future (needs checking for null/undefined)
  };
}

// Playlist catalog — mirrors apps/core-api/data/playlists.ts
// deezer_id values must stay in sync with the API catalog.
const GENRE_PLAYLISTS = {
  // Rock
  rock_60s:     "1437011185",
  rock_70s:     "1405240385",
  rock_80s:     "867825522",
  rock_90s:     "1728093421",
  rock_00s:     "1419215845",
  rock_10s:     "1057779131",
  rock_20s:     "13693489781",

  // Metal
  metal_70s:    "5325499642",
  metal_80s:    "1294679255",
  metal_90s:    "1471284255",
  metal_00s:    "2004964442",
  metal_10s:    "1045800791",
  metal_20s:    "13693525421",

  // Mixed
  mixed_60s:    "620264073",
  mixed_70s:    "1470022445",
  mixed_80s:    "867825522",
  mixed_90s:    "878989033",

  // Turkish
  turkish_rock: "1384032635",
};

const GENRE_INFO = {
  // Rock
  rock_60s:     { name: "60's Rock",    type: "rock",    era: "60s"     },
  rock_70s:     { name: "70's Rock",    type: "rock",    era: "70s"     },
  rock_80s:     { name: "80's Rock",    type: "rock",    era: "80s"     },
  rock_90s:     { name: "90's Rock",    type: "rock",    era: "90s"     },
  rock_00s:     { name: "2000's Rock",  type: "rock",    era: "00s"     },
  rock_10s:     { name: "2010's Rock",  type: "rock",    era: "10s"     },
  rock_20s:     { name: "2020's Rock",  type: "rock",    era: "20s"     },

  // Metal
  metal_70s:    { name: "70's Metal",   type: "metal",   era: "70s"     },
  metal_80s:    { name: "80's Metal",   type: "metal",   era: "80s"     },
  metal_90s:    { name: "90's Metal",   type: "metal",   era: "90s"     },
  metal_00s:    { name: "2000's Metal", type: "metal",   era: "00s"     },
  metal_10s:    { name: "2010's Metal", type: "metal",   era: "10s"     },
  metal_20s:    { name: "2020's Metal", type: "metal",   era: "20s"     },

  // Mixed
  mixed_60s:    { name: "60's Mix",     type: "mixed",   era: "60s"     },
  mixed_70s:    { name: "70's Mix",     type: "mixed",   era: "70s"     },
  mixed_80s:    { name: "80's Mix",     type: "mixed",   era: "80s"     },
  mixed_90s:    { name: "90's Mix",     type: "mixed",   era: "90s"     },

  // Turkish
  turkish_rock: { name: "Turkish Rock", type: "turkish", era: "classic" },
};

// Returns the list of all categories
export function getAllGenres() {
  return Object.keys(GENRE_PLAYLISTS).map((key) => ({
    id: key,
    ...GENRE_INFO[key],
  }));
}

// Get a random track from a specific genre
export async function getRandomTrackFromGenre(genreId) {
  const playlistId = GENRE_PLAYLISTS[genreId];
  if (!playlistId) throw new Error(`Unknown genre: ${genreId}`);

  const track = await getRandomTrackFromPlaylist(playlistId);
  return {
    ...track,
    genre: genreId,
    genreName: GENRE_INFO[genreId]?.name || genreId,
  };
}

// Get normalized tracks from a specific genre playlist
export async function getTracksFromGenre(genreId) {
  const playlistId = GENRE_PLAYLISTS[genreId];
  if (!playlistId) throw new Error(`Unknown genre: ${genreId}`);

  const tracks = await MusicService.getPlaylistTracks(playlistId);
  const normalized = tracks
    .filter((track) => track?.preview)
    .map((track) => normalizeTrackData(track));

  return normalized.map((track) => ({
    ...track,
    genre: genreId,
    genreName: GENRE_INFO[genreId]?.name || genreId,
  }));
}

// Get a random track from a random category
export async function getRandomTrackFromRandomGenre() {
  const genres = Object.keys(GENRE_PLAYLISTS);
  const genre = genres[Math.floor(Math.random() * genres.length)];
  return getRandomTrackFromGenre(genre);
}

// Legacy function - for backward compatibility
export async function getRandomTrackFromRandomEra() {
  const track = await getRandomTrackFromRandomGenre();
  const genreInfo = GENRE_INFO[track.genre];
  return {
    ...track,
    era: genreInfo?.era || "??s",
  };
}

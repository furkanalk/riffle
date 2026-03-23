export async function getPlaylistTracks(playlistId) {
  console.log(`[MOCK] Playlist ID: ${playlistId} - Returning mock tracks.`);

  // Timeout (real data mimic)
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Create mock tracks (10)
  const mockTracks = Array.from({ length: 10 }).map((_, i) => ({
    id: `mock_${playlistId}_${i}`,
    title: `Mock Song ${i + 1} (${playlistId})`,
    artist: { name: `Mock Artist ${i + 1}` },
    album: {
      title: `Mock Album ${i}`,
      cover_medium: null,
    },
    preview: "https://cdns-preview-b.dzcdn.net/stream/c-deda7fa9316d9e9e880226309674381b-8.mp3",
  }));

  return mockTracks;
}

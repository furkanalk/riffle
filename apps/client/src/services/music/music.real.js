const BASE_URL = "/api";

async function handleResponse(response, errorContext) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("text/html")) {
    throw new Error(`Server returned HTML — is the backend running? (${errorContext})`);
  }

  // Guard against empty body (e.g. network error causing Fastify to emit 500 with no body)
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Empty or invalid JSON from server — status ${response.status} (${errorContext}). ` +
      "Check that the API and Docker are running.",
    );
  }

  if (!response.ok) {
    throw new Error(data?.error || `API error ${response.status} (${errorContext})`);
  }

  return data;
}

// Get a list of tracks from a playlist
export async function getPlaylistTracks(playlistId) {
  try {
    const res = await fetch(`${BASE_URL}/playlist/${playlistId}/tracks`);
    const data = await handleResponse(res, `Playlist: ${playlistId}`);

    const allTracks = Array.isArray(data) ? data : (data.data ?? []);

    // Defensive: drop tracks without a usable preview URL (proxy already filters,
    // but guard against edge cases or mock data leaking through)
    const tracks = allTracks.filter(
      (t) => typeof t.preview === "string" && t.preview.length > 0,
    );

    if (tracks.length === 0) {
      throw new Error("No previewable tracks found in this playlist.");
    }

    return tracks;
  } catch (error) {
    console.error("RealService Error:", error);
    throw error;
  }
}

// Get a list of tracks from an album
export async function getAlbumTracks(albumId) {
  try {
    const res = await fetch(`${BASE_URL}/album/${albumId}/tracks`);
    const data = await handleResponse(res, `Album: ${albumId}`);

    const tracks = Array.isArray(data) ? data : data.data;

    if (!tracks || tracks.length === 0) {
      throw new Error("No playable tracks found in this album.");
    }

    return tracks;
  } catch (error) {
    console.error("RealService Error:", error);
    throw error;
  }
}

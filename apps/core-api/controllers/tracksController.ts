import axios from "axios";
import type { FastifyReply, FastifyRequest } from "fastify";

const DEEZER_API = "https://api.deezer.com";

interface DeezerTrack {
  id: number;
  title: string;
  preview: string;
  artist: { name: string };
  album: {
    title: string;
    cover_small: string;
    cover_medium: string;
    cover_big: string;
    cover: string;
  };
}

interface DeezerPlaylistResponse {
  data: DeezerTrack[];
}

export async function getPlaylistTracks(
  req: FastifyRequest<{ Params: { playlistId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { playlistId } = req.params;
  try {
    const { data } = await axios.get<DeezerPlaylistResponse>(
      `${DEEZER_API}/playlist/${playlistId}/tracks`,
    );
    if (!data?.data) throw new Error("Invalid Deezer playlist response");

    const tracks = data.data
      .filter((t) => t.preview)
      .map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist.name,
        preview: t.preview,
        album: {
          title: t.album.title,
          cover_small: t.album.cover_small,
          cover_medium: t.album.cover_medium,
          cover_big: t.album.cover_big ?? t.album.cover,
        },
      }));

    reply.send(tracks);
  } catch (err) {
    req.log.error(err, "Deezer playlist error");
    reply.code(502).send({ error: "Failed to fetch playlist tracks" });
  }
}

export async function getTrack(
  req: FastifyRequest<{ Params: { trackId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { trackId } = req.params;
  try {
    const { data: t } = await axios.get<DeezerTrack>(`${DEEZER_API}/track/${trackId}`);
    if (!t?.preview) throw new Error("No preview for this track");

    reply.send({
      id: t.id,
      title: t.title,
      artist: t.artist.name,
      album: {
        title: t.album.title,
        cover_small: t.album.cover_small,
        cover_medium: t.album.cover_medium,
        cover_big: t.album.cover_big ?? t.album.cover,
      },
      preview: t.preview,
    });
  } catch (err) {
    req.log.error(err, "Deezer track error");
    reply.code(502).send({ error: "Failed to fetch track" });
  }
}

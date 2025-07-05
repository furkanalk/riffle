// server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1) Playlist proxy
app.get('/api/playlist/:playlistId/tracks', async (req, res) => {
  const { playlistId } = req.params;
  try {
    const { data } = await axios.get(`https://api.deezer.com/playlist/${playlistId}/tracks`);
    if (!data?.data) throw new Error('Invalid Deezer playlist response');
    const tracks = data.data
      .filter(t => t.preview)             // sadece preview’i olanlar
      .map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist.name,
        preview: t.preview
      }));
    return res.json(tracks);
  } catch (err) {
    console.error('Deezer playlist error:', err.message);
    return res.status(502).json({ error: 'Failed to fetch playlist tracks' });
  }
});

// 2) (Opsiyonel) Single track proxy
app.get('/api/track/:trackId', async (req, res) => {
  const { trackId } = req.params;
  try {
    const { data: t } = await axios.get(`https://api.deezer.com/track/${trackId}`);
    if (!t?.preview) throw new Error('No preview for this track');
    return res.json({
      id: t.id,
      title: t.title,
      artist: t.artist.name,
      album: t.album.title,
      preview: t.preview
    });
  } catch (err) {
    console.error('Deezer track error:', err.message);
    return res.status(502).json({ error: 'Failed to fetch track' });
  }
});

// 3) Statik dosyalar
app.use(express.static(path.resolve('./')));

app.listen(PORT, () => console.log(`Server @ http://localhost:${PORT}`));

export type Category = "rock" | "metal" | "mixed" | "turkish" | "artist";

export interface PlaylistEntry {
  id: string;
  deezer_id: string;
  name: string;
  category: Category;
  era: string;
}

export const PLAYLISTS: PlaylistEntry[] = [
  // ── Rock ──────────────────────────────────────────────────────────────────
  { id: "rock_60s",  deezer_id: "1437011185",  name: "60's Rock",    category: "rock",  era: "60s"  },
  { id: "rock_70s",  deezer_id: "1405240385",  name: "70's Rock",    category: "rock",  era: "70s"  },
  { id: "rock_80s",  deezer_id: "867825522",   name: "80's Rock",    category: "rock",  era: "80s"  },
  { id: "rock_90s",  deezer_id: "1728093421",  name: "90's Rock",    category: "rock",  era: "90s"  },
  { id: "rock_00s",  deezer_id: "1419215845",  name: "2000's Rock",  category: "rock",  era: "00s"  },
  { id: "rock_10s",  deezer_id: "1057779131",  name: "2010's Rock",  category: "rock",  era: "10s"  },
  { id: "rock_20s",  deezer_id: "13693489781", name: "2020's Rock",  category: "rock",  era: "20s"  },

  // ── Metal ─────────────────────────────────────────────────────────────────
  { id: "metal_70s", deezer_id: "5325499642",  name: "70's Metal",   category: "metal", era: "70s"  },
  { id: "metal_80s", deezer_id: "1294679255",  name: "80's Metal",   category: "metal", era: "80s"  },
  { id: "metal_90s", deezer_id: "1471284255",  name: "90's Metal",   category: "metal", era: "90s"  },
  { id: "metal_00s", deezer_id: "2004964442",  name: "2000's Metal", category: "metal", era: "00s"  },
  { id: "metal_10s", deezer_id: "1045800791",  name: "2010's Metal", category: "metal", era: "10s"  },
  { id: "metal_20s", deezer_id: "13693525421", name: "2020's Metal", category: "metal", era: "20s"  },

  // ── Mixed ─────────────────────────────────────────────────────────────────
  { id: "mixed_60s", deezer_id: "620264073",   name: "60's Mix",     category: "mixed", era: "60s"  },
  { id: "mixed_70s", deezer_id: "1470022445",  name: "70's Mix",     category: "mixed", era: "70s"  },
  { id: "mixed_80s", deezer_id: "867825522",   name: "80's Mix",     category: "mixed", era: "80s"  },
  { id: "mixed_90s", deezer_id: "878989033",   name: "90's Mix",     category: "mixed", era: "90s"  },

  // ── Turkish ───────────────────────────────────────────────────────────────
  { id: "turkish_rock", deezer_id: "1384032635", name: "Turkish Rock", category: "turkish", era: "classic" },
];

export const PLAYLIST_MAP = new Map<string, PlaylistEntry>(
  PLAYLISTS.map((p) => [p.id, p]),
);

export function getPlaylistById(id: string): PlaylistEntry | undefined {
  return PLAYLIST_MAP.get(id);
}

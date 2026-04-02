// GUEST & USER MANAGEMENT
import { DEFAULT_AVATAR_ID, getDailyGuestAvatarIds, normalizeAvatarId } from "./avatars.js";

// Rock & Metal Theme Adjectives
const adjectives = [
  "Heavy",
  "Dark",
  "Neon",
  "Thunder",
  "Iron",
  "Electric",
  "Crazy",
  "Holy",
  "Unholy",
  "Rusty",
  "Broken",
  "Twisted",
  "Screaming",
  "Silent",
  "Loud",
  "Wild",
  "Rebel",
  "Mad",
  "Vicious",
  "Grim",
  "Savage",
  "Wicked",
  "Fuzz",
  "Doom",
  "Speed",
  "Thrash",
  "Acid",
  "Black",
  "Crimson",
  "Sonic",
  "Solar",
  "Lunar",
  "Cyber",
  "Retro",
  "Epic",
  "Fatal",
  "Brutal",
  "Toxic",
  "Rapid",
  "Steel",
  "Golden",
  "Silver",
  "Ghost",
  "Phantom",
  "Raging",
  "Stormy",
];

// Rock & Metal Theme Nouns
const nouns = [
  "Slayer",
  "Rocker",
  "Head",
  "Wolf",
  "Tiger",
  "Bear",
  "Skull",
  "Bone",
  "Riff",
  "Chord",
  "Amp",
  "Pick",
  "King",
  "Queen",
  "Lord",
  "God",
  "Devil",
  "Beast",
  "Snake",
  "Viper",
  "Cobra",
  "Spider",
  "Witch",
  "Wizard",
  "Druid",
  "Vandal",
  "Punk",
  "Drifter",
  "Rider",
  "Pilot",
  "Gunner",
  "Drummer",
  "Bass",
  "Singer",
  "Star",
  "Legend",
  "Hero",
  "Villain",
  "Ghost",
  "Soul",
  "Spirit",
  "Machine",
  "Engine",
  "Hammer",
  "Axe",
  "Blade",
  "Warrior",
  "Knight",
];

function generateGuestId() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}#${number}`;
}

function pickRandomGuestAvatar() {
  const guestSet = getDailyGuestAvatarIds();
  return guestSet[Math.floor(Math.random() * guestSet.length)] || DEFAULT_AVATAR_ID;
}

/** Registered user avatar from API, otherwise guest selection in localStorage. */
export function getEffectiveAvatarId() {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u.avatar) return normalizeAvatarId(u.avatar);
    } catch {
      /* ignore */
    }
  }
  const g = localStorage.getItem("selectedAvatar");
  const dailyGuestIds = getDailyGuestAvatarIds();
  const gNorm = g ? normalizeAvatarId(g) : null;
  if (gNorm && dailyGuestIds.includes(gNorm)) return gNorm;
  const randomGuestAvatar = pickRandomGuestAvatar();
  localStorage.setItem("selectedAvatar", randomGuestAvatar);
  return randomGuestAvatar;
}

// Get current user (registered or guest)
export function getUser() {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      return {
        username: user.username,
        type: "registered",
        avatar: getEffectiveAvatarId(),
      };
    } catch (e) {
      console.error("User profile parse error", e);
    }
  }

  let guestName = localStorage.getItem("guest_name");
  if (!guestName) {
    guestName = generateGuestId();
    localStorage.setItem("guest_name", guestName);
  }

  return {
    username: guestName,
    type: "guest",
    avatar: getEffectiveAvatarId(),
  };
}

/** Numeric user id when logged in, else null. */
export function getRegisteredUserId() {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  if (!token) return null;
  try {
    const u = JSON.parse(
      localStorage.getItem("user") || localStorage.getItem("user_profile") || "{}"
    );
    const id = u?.id;
    if (id == null) return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

// Logout user (legacy keys + auth-ui keys)
export function logoutUser() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_profile");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.reload();
}

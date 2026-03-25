const LANG_STORAGE_KEY = "riffle_lang";

const DICT = {
  en: {
    header: {
      login: "Login",
      signup: "Sign Up",
      leaderboard: "Leaderboard",
    },
    auth: {
      tabLogin: "LOGIN",
      tabRegister: "REGISTER",
      submitLogin: "ENTER THE ARENA",
      submitRegister: "CREATE LEGEND",
      processing: "Processing...",
    },
    profile: {
      title: "Profile",
      desc: "Choose your avatar",
      logout: "Log out",
      usernameLabel: "Username",
      usernameSave: "Save",
    },
    leaderboard: {
      title: "Leaderboard",
      desc: "Top scores per game mode (registered players)",
      modeLabel: "Mode",
      modes: {
        solo: "Marathon (solo)",
        versus: "Solo VS",
        team: "Team VS",
        coop: "Co-op",
        custom: "Custom",
        chaos: "Chaos",
      },
    },
    categories: {
      guestAvatarTitle: "Choose your avatar",
      guestAvatarSub: "Pick a look for this session.",
      guestAvatarContinue: "Continue",
    },
  },
  tr: {
    header: {
      login: "Giriş",
      signup: "Kayıt Ol",
      leaderboard: "Lider Tablosu",
    },
    auth: {
      tabLogin: "GİRİŞ",
      tabRegister: "KAYIT",
      submitLogin: "ARENA'YA GİR",
      submitRegister: "EFSANE OL",
      processing: "İşleniyor...",
    },
    profile: {
      title: "Profil",
      desc: "Avatarını seç",
      logout: "Çıkış Yap",
      usernameLabel: "Kullanıcı Adı",
      usernameSave: "Kaydet",
    },
    leaderboard: {
      title: "Lider Tablosu",
      desc: "Oyun modlarına göre en iyi skorlar (kayıtlı oyuncular)",
      modeLabel: "Mod",
      modes: {
        solo: "Maraton (tek kişi)",
        versus: "Solo VS",
        team: "Takım VS",
        coop: "Ko-op",
        custom: "Özel",
        chaos: "Kaos",
      },
    },
    categories: {
      guestAvatarTitle: "Avatarını seç",
      guestAvatarSub: "Bu oturum için bir görünüm seç.",
      guestAvatarContinue: "Devam",
    },
  },
};

export function getLang() {
  const raw = localStorage.getItem(LANG_STORAGE_KEY);
  if (!raw) return "en";
  if (raw !== "tr" && raw !== "en") return "en";
  return raw;
}

export function setLang(lang) {
  const next = lang === "tr" || lang === "en" ? lang : "en";
  localStorage.setItem(LANG_STORAGE_KEY, next);
  applyIndexLanguage(next);
  applyCategoriesLanguage(next);
}

export function t(path, lang = getLang()) {
  const parts = String(path).split(".");
  let cur = DICT[lang];
  for (const p of parts) {
    if (!cur) return path;
    cur = cur[p];
  }
  return typeof cur === "string" ? cur : path;
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

export function applyIndexLanguage(lang = getLang()) {
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const leaderboardBtn = document.getElementById("leaderboard-btn");

  setText(loginBtn, t("header.login", lang));
  setText(signupBtn, t("header.signup", lang));
  setText(leaderboardBtn, t("header.leaderboard", lang));

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  setText(tabLogin, t("auth.tabLogin", lang));
  setText(tabRegister, t("auth.tabRegister", lang));

  const submitLogin = document.getElementById("btn-login-submit");
  const submitRegister = document.getElementById("btn-register-submit");
  setText(submitLogin, t("auth.submitLogin", lang));
  setText(submitRegister, t("auth.submitRegister", lang));

  const profilePanel = document.getElementById("profile-panel");
  if (profilePanel) {
    setText(profilePanel.querySelector(".profile-title"), t("profile.title", lang));
    setText(profilePanel.querySelector(".profile-desc"), t("profile.desc", lang));
    setText(profilePanel.querySelector("#profile-logout-btn"), t("profile.logout", lang));

    const usernameLabel = profilePanel.querySelector('label[for="profile-username"]');
    if (usernameLabel) setText(usernameLabel, t("profile.usernameLabel", lang));
    setText(profilePanel.querySelector("#profile-username-save"), t("profile.usernameSave", lang));
  }

  const leaderboardPanel = document.getElementById("leaderboard-panel");
  if (leaderboardPanel) {
    setText(leaderboardPanel.querySelector(".profile-title"), t("leaderboard.title", lang));
    setText(leaderboardPanel.querySelector(".profile-desc"), t("leaderboard.desc", lang));

    const modeLabel = leaderboardPanel.querySelector('label[for="leaderboard-mode"]');
    if (modeLabel) setText(modeLabel, t("leaderboard.modeLabel", lang));

    const sel = leaderboardPanel.querySelector("#leaderboard-mode");
    if (sel) {
      sel.querySelectorAll("option").forEach((opt) => {
        const v = opt.value;
        const mapped = DICT[lang].leaderboard.modes[v];
        if (mapped) opt.textContent = mapped;
      });
    }
  }
}

export function applyCategoriesLanguage(lang = getLang()) {
  const title = document.getElementById("guest-avatar-title");
  const sub = document.querySelector(".guest-avatar-modal__sub");
  const cont = document.getElementById("guest-avatar-continue");
  setText(title, t("categories.guestAvatarTitle", lang));
  setText(sub, t("categories.guestAvatarSub", lang));
  setText(cont, t("categories.guestAvatarContinue", lang));
}

export function initLanguageControl() {
  const sel = document.getElementById("language-select");
  if (!sel) return;
  sel.value = getLang();
  applyIndexLanguage(sel.value);

  sel.addEventListener("change", () => {
    setLang(sel.value);
    applyIndexLanguage(sel.value);
  });
}


import { getDailyGuestAvatarIds } from "../core/avatars.js";
import { getLang, t } from "../core/i18n.js";
import { logoutUser } from "../core/user-manager.js";
import { mountAvatarPicker } from "../ui/avatar-picker.js";

export function initAuthUI() {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const elements = {
    // Buttons Containers
    guestButtons: document.getElementById("guest-buttons"),
    userProfileBtn: document.getElementById("user-profile-btn"),
    desktopAuthCta: document.getElementById("desktop-auth-cta"),

    // Trigger Buttons
    loginBtn: document.getElementById("login-btn"),
    signupBtn: document.getElementById("signup-btn"),

    // Panel Elements
    authPanel: document.getElementById("auth-panel"),
    authBox: document.getElementById("auth-box"),
    closeBtn: document.getElementById("close-auth"),

    // Tabs
    tabLogin: document.getElementById("tab-login"),
    tabRegister: document.getElementById("tab-register"),

    // Forms
    formLogin: document.getElementById("form-login"),
    formRegister: document.getElementById("form-register"),

    // Display Info
    userDisplayName: document.getElementById("user-display-name"),
    authMessage: document.getElementById("auth-message"),

    // Inputs
    loginIdentifier: document.getElementById("login-identifier"),
    loginPassword: document.getElementById("login-password"),
    regUsername: document.getElementById("reg-username"),
    regEmail: document.getElementById("reg-email"),
    regPassword: document.getElementById("reg-password"),

    profilePanel: document.getElementById("profile-panel"),
    closeProfile: document.getElementById("close-profile"),
    profileAvatarGrid: document.getElementById("profile-avatar-grid"),
    profileLogoutBtn: document.getElementById("profile-logout-btn"),
    profileUsername: document.getElementById("profile-username"),
    profileUsernameSave: document.getElementById("profile-username-save"),
    profileUsernameMsg: document.getElementById("profile-username-msg"),
    profileFavoritesSection: document.getElementById("profile-favorites-section"),
    profileFavoritesList: document.getElementById("profile-favorites-list"),
    profileFavoritesEmpty: document.getElementById("profile-favorites-empty"),
  };

  const FAVORITE_TRACKS_KEY = "riffle_favorite_tracks_v1";

  // if loginBtn or userProfileBtn not found, exit
  if (!elements.loginBtn && !elements.userProfileBtn) return;

  // Check login status on load
  checkLoginStatus();

  // --- EVENT LISTENERS ---

  // Login button click to open login panel
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener("click", () => {
      elements.guestButtons?.classList.remove("guest-buttons--open");
      switchAuthTab("login");
      openPanel();
    });
  }

  // Signup button click to open register panel
  if (elements.signupBtn) {
    elements.signupBtn.addEventListener("click", () => {
      elements.guestButtons?.classList.remove("guest-buttons--open");
      switchAuthTab("register");
      openPanel();
    });
  }

  // Profile button opens profile panel (logged-in)
  if (elements.userProfileBtn) {
    elements.userProfileBtn.addEventListener("click", () => {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (token) {
        openProfilePanel();
        return;
      }
      if (elements.guestButtons) {
        const isMobile = window.matchMedia("(max-width: 640px)").matches;
        // If the user came here from the Settings card, open profile in read-only mode.
        if (window.riffleOpenProfileFromSettings === true) {
          window.riffleOpenProfileFromSettings = false;
          elements.guestButtons?.classList.remove("guest-buttons--open");
          openProfilePanel();
          return;
        }
        if (isMobile) {
          // Mobile guest UX: show the auth overlay directly (Login / Sign Up).
          switchAuthTab("login");
          openPanel();
          return;
        }
      }
      // Desktop guest fallback: open auth panel.
      switchAuthTab("login");
      openPanel();
    });
  }

  // Close guest dropdown when clicking outside.
  document.addEventListener("click", (e) => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (!isMobile) return;
    if (!elements.guestButtons?.classList.contains("guest-buttons--open")) return;
    const target = e.target;
    if (
      elements.userProfileBtn &&
      target instanceof Node &&
      elements.userProfileBtn.contains(target)
    )
      return;
    if (target instanceof Node && elements.guestButtons.contains(target)) return;
    elements.guestButtons.classList.remove("guest-buttons--open");
  });

  if (elements.closeProfile) {
    elements.closeProfile.addEventListener("click", closeProfilePanel);
  }
  if (elements.profilePanel) {
    elements.profilePanel.addEventListener("click", (e) => {
      if (e.target === elements.profilePanel) closeProfilePanel();
    });
  }
  if (elements.profileLogoutBtn) {
    elements.profileLogoutBtn.addEventListener("click", () => {
      closeProfilePanel();
      logout();
    });
  }

  if (elements.profileUsernameSave) {
    elements.profileUsernameSave.addEventListener("click", saveProfileUsername);
  }

  if (elements.profileFavoritesList) {
    elements.profileFavoritesList.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const removeBtn = target.closest(".profile-favorite-remove");
      if (!removeBtn) return;
      const key = removeBtn.getAttribute("data-track-key");
      if (!key) return;
      removeFavoriteTrack(key);
      renderFavoriteTracks();
    });
  }

  const openLoginOnHome = localStorage.getItem("riffle_open_login_on_home");
  if (openLoginOnHome === "1") {
    localStorage.removeItem("riffle_open_login_on_home");
    switchAuthTab("login");
    openPanel();
  }

  // Close panel
  if (elements.closeBtn) elements.closeBtn.addEventListener("click", closePanel);
  if (elements.authPanel) {
    elements.authPanel.addEventListener("click", (e) => {
      if (e.target === elements.authPanel) closePanel();
    });
  }

  // Tab Switching
  if (elements.tabLogin) elements.tabLogin.addEventListener("click", () => switchAuthTab("login"));
  if (elements.tabRegister)
    elements.tabRegister.addEventListener("click", () => switchAuthTab("register"));

  // --- SMART VALIDATION ---

  // Registration rules and regex patterns
  const rules = {
    username: {
      check: (val) => /^[a-zA-Z0-9_]+$/.test(val),
      msg: "Only letters, numbers, and underscores allowed (No spaces).",
    },
    usernameLength: {
      check: (val) => val.length >= 3 && val.length <= 20,
      msg: "Username must be between 3-20 characters.",
    },
    email: {
      check: (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val),
      msg: "Please enter a valid email address.",
    },
    password: {
      check: (val) => val.length >= 6 && /^[\x21-\x7E]+$/.test(val),
      msg: "Password must be at least 6 characters long.",
    },
  };

  // Validation
  function setupLiveFeedback(inputs, btn, _formType) {
    const validateAll = () => {
      let isFormValid = true;

      inputs.forEach((item) => {
        const val = item.input.value;
        const errEl = item.errorEl;
        let isValidField = true;
        let errorMsg = "";

        if (val.trim() === "") {
          isValidField = false;
          if (errEl) errEl.classList.add("hidden");
        } else {
          if (item.type === "username") {
            if (!rules.username.check(val)) {
              isValidField = false;
              errorMsg = rules.username.msg;
            } else if (!rules.usernameLength.check(val)) {
              isValidField = false;
              errorMsg = rules.usernameLength.msg;
            }
          } else if (item.type === "email") {
            if (!rules.email.check(val)) {
              isValidField = false;
              errorMsg = rules.email.msg;
            }
          } else if (item.type === "password") {
            if (!rules.password.check(val)) {
              isValidField = false;
              errorMsg = rules.password.msg;
            }
          }

          // Show or hide error message
          if (errEl) {
            if (!isValidField && errorMsg) {
              errEl.textContent = errorMsg;
              errEl.classList.remove("hidden");
            } else {
              errEl.classList.add("hidden");
            }
          }
        }

        if (!isValidField) isFormValid = false;
      });

      // Button state
      btn.disabled = !isFormValid;
      if (isFormValid) {
        btn.classList.remove("btn--disabled");
      } else {
        btn.classList.add("btn--disabled");
      }
    };

    inputs.forEach((item) => {
      item.input.addEventListener("input", validateAll);
    });

    // Ensure correct initial disabled/enabled state.
    validateAll();
  }

  // Simple check for non-empty fields (to enable/disable submit button)
  const simpleCheck = (btn, inputs) => {
    const isValid = inputs.every((i) => i.input.value.trim() !== "");
    btn.disabled = !isValid;
    if (isValid) {
      btn.classList.remove("btn--disabled");
      btn.classList.remove("opacity-50", "cursor-not-allowed");
      btn.classList.add("hover:shadow-lg", "hover:-translate-y-1");
    } else {
      btn.classList.add("btn--disabled");
      btn.classList.add("opacity-50", "cursor-not-allowed");
      btn.classList.remove("hover:shadow-lg", "hover:-translate-y-1");
    }
  };

  // Login Form
  if (elements.formLogin) {
    const btn = document.getElementById("btn-login-submit");
    const inputs = [
      { input: elements.loginIdentifier, type: "simple", errorEl: null },
      { input: elements.loginPassword, type: "simple", errorEl: null },
    ];

    inputs.forEach((i) => {
      i.input.addEventListener("input", () => simpleCheck(btn, inputs));
    });

    simpleCheck(btn, inputs); // first run
  }

  // Register Form
  if (elements.formRegister) {
    const btn = document.getElementById("btn-register-submit");
    const inputs = [
      {
        input: elements.regUsername,
        type: "username",
        errorEl: document.getElementById("err-username"),
      },
      {
        input: elements.regEmail,
        type: "email",
        errorEl: document.getElementById("err-email"),
      },
      {
        input: elements.regPassword,
        type: "password",
        errorEl: document.getElementById("err-password"),
      },
    ];

    setupLiveFeedback(inputs, btn, "register");

    // NOTE: Don't call simpleCheck here; it would override regex validation
    // (non-empty check vs. full validation check).
  }

  // --- API REQUESTS ---

  // LOGIN SUBMIT
  if (elements.formLogin) {
    elements.formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      showLoading(true);
      clearMessage();

      const identifier = elements.loginIdentifier.value;
      const password = elements.loginPassword.value;

      try {
        const [res, _] = await Promise.all([
          fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password }),
          }),
          wait(1500), // Minimum wait for UX, for safety its 1.5 seconds
        ]);

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        loginSuccess(data);
      } catch (error) {
        showMessage(error.message, "error");
      } finally {
        showLoading(false);
      }
    });
  }

  // REGISTER SUBMIT
  if (elements.formRegister) {
    elements.formRegister.addEventListener("submit", async (e) => {
      e.preventDefault();
      showLoading(true);
      clearMessage();

      const username = elements.regUsername.value;
      const email = elements.regEmail.value;
      const password = elements.regPassword.value;

      try {
        const [res, _] = await Promise.all([
          fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
          }),
          wait(1500), // Minimum wait for UX, for safety its 1.5 seconds
        ]);

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        loginSuccess(data);
      } catch (error) {
        showMessage(error.message, "error");
      } finally {
        showLoading(false);
      }
    });
  }

  // --- LOGIC FUNCTIONS ---

  // Login Success
  function loginSuccess(data) {
    console.log("✅ Auth Success:", data.user.username);

    // Save token & user info
    localStorage.setItem("token", data.token);
    const user = { ...data.user, avatar: data.user.avatar || "avatar1" };
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("selectedAvatar", user.avatar);

    // Show success message and update UI after one second
    showMessage(`Welcome back, ${data.user.username}!`, "success");
    setTimeout(() => {
      closePanel();
      updateUI(user);
    }, 1000);
  }

  // Check login status on load
  function checkLoginStatus() {
    const raw = localStorage.getItem("user") || localStorage.getItem("user_profile");
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (raw && token) {
      try {
        const user = JSON.parse(raw);
        const u = { ...user, avatar: user.avatar || "avatar1" };
        updateUI(u);
      } catch {
        showGuestMode();
      }
    } else {
      showGuestMode();
    }
  }

  function updateHeaderAvatar(user) {
    const img = document.getElementById("header-user-avatar");
    const ph = document.getElementById("header-user-avatar-placeholder");
    if (!img || !ph) return;
    const id = user.avatar || "avatar1";
    img.src = `./src/img/avatars/${id}.png`;
    img.alt = "";
    img.classList.remove("hidden");
    ph.classList.add("hidden");
  }

  function showGuestHeaderAvatar() {
    const img = document.getElementById("header-user-avatar");
    const ph = document.getElementById("header-user-avatar-placeholder");
    img?.classList.add("hidden");
    ph?.classList.remove("hidden");
  }

  // Update UI after login
  function updateUI(user) {
    // Hide guest buttons
    if (elements.guestButtons) {
      elements.guestButtons.classList.add("hidden");
      elements.guestButtons.style.display = "none";
    }

    // Show profile button and set username
    if (elements.userProfileBtn) elements.userProfileBtn.classList.remove("hidden");
    if (elements.userDisplayName) elements.userDisplayName.textContent = user.username;
    updateHeaderAvatar(user);

    if (elements.desktopAuthCta) {
      // Desktop header CTA should show the username.
      elements.desktopAuthCta.textContent = user.username;
      elements.desktopAuthCta.classList.remove("hidden");
    }
  }

  // Show guest mode
  function showGuestMode() {
    const guestName = localStorage.getItem("guest_name") || "Guest";

    // Desktop guest: hide Login/Sign Up buttons; use CTA text instead.
    // Mobile guest: hide them too; Profile button opens auth overlay directly.
    if (elements.guestButtons) {
      elements.guestButtons.classList.add("hidden");
      elements.guestButtons.style.display = "none";
    }

    if (elements.desktopAuthCta) {
      // Let the guest username show on the profile button instead.
      elements.desktopAuthCta.classList.add("hidden");
    }

    if (elements.userProfileBtn) {
      // Show guest username on both desktop and mobile.
      elements.userProfileBtn.classList.remove("hidden");
      if (elements.userDisplayName) elements.userDisplayName.textContent = guestName;
    }
    const guestAvatar = localStorage.getItem("selectedAvatar");
    if (guestAvatar) {
      updateHeaderAvatar({ avatar: guestAvatar });
    } else {
      showGuestHeaderAvatar();
    }
  }

  async function saveProfileAvatar(avatarId) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: avatarId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save avatar");
      const prev = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...prev, ...data.user }));
      localStorage.setItem("selectedAvatar", data.user.avatar);
      updateHeaderAvatar(data.user);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save avatar");
    }
  }

  async function saveProfileUsername() {
    const token = localStorage.getItem("token");
    const input = elements.profileUsername;
    const msg = elements.profileUsernameMsg;
    if (!token || !input) return;
    const username = input.value.trim();
    if (msg) {
      msg.classList.add("hidden");
      msg.textContent = "";
    }
    if (!username) {
      if (msg) {
        msg.textContent = "Username is required.";
        msg.classList.remove("hidden");
      }
      return;
    }
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save username");
      const prev = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...prev, ...data.user }));
      if (elements.userDisplayName) elements.userDisplayName.textContent = data.user.username;
    } catch (err) {
      if (msg) {
        msg.textContent = err instanceof Error ? err.message : "Could not save username";
        msg.classList.remove("hidden");
      }
    }
  }

  function openProfilePanel() {
    if (!elements.profilePanel || !elements.profileAvatarGrid) return;
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    const userRaw = localStorage.getItem("user") || localStorage.getItem("user_profile") || "{}";
    const user = JSON.parse(userRaw);
    const isLoggedIn = Boolean(token && user?.username);

    // Prevent duplicated guest lock notes when profile panel is reopened.
    elements.profilePanel.querySelectorAll(".profile-lock-note").forEach((n) => {
      n.remove();
    });

    if (elements.profileUsername) {
      if (isLoggedIn) {
        elements.profileUsername.value = user.username || "";
        elements.profileUsername.disabled = false;
      } else {
        elements.profileUsername.value = localStorage.getItem("guest_name") || "Guest";
        elements.profileUsername.disabled = true;
      }
    }
    if (elements.profileUsernameSave) {
      elements.profileUsernameSave.style.display = isLoggedIn ? "" : "none";
    }
    if (elements.profileUsernameMsg) {
      if (isLoggedIn) {
        elements.profileUsernameMsg.classList.add("hidden");
        elements.profileUsernameMsg.textContent = "";
      } else {
        elements.profileUsernameMsg.textContent = "You need to log in first to edit your username.";
        elements.profileUsernameMsg.classList.remove("hidden");
      }
    }
    elements.profileAvatarGrid.innerHTML = "";
    if (isLoggedIn) {
      mountAvatarPicker(elements.profileAvatarGrid, {
        selectedId: user.avatar || "avatar1",
        onPick: (id) => {
          saveProfileAvatar(id);
        },
      });
    } else {
      const guestAvatarSet = getDailyGuestAvatarIds();
      const guestAvatar = localStorage.getItem("selectedAvatar") || guestAvatarSet[0] || "avatar1";
      mountAvatarPicker(elements.profileAvatarGrid, {
        selectedId: guestAvatar,
        allowedIds: guestAvatarSet,
        onPick: (id) => {
          localStorage.setItem("selectedAvatar", id);
          if (elements.userDisplayName) {
            const guestName = localStorage.getItem("guest_name") || "Guest";
            elements.userDisplayName.textContent = guestName;
          }
          updateHeaderAvatar({ avatar: id });
        },
      });
      const desc = document.createElement("p");
      desc.className = "profile-lock-note";
      desc.innerHTML =
        "<strong>Guest mode:</strong> You can pick from 4 featured daily avatars. <span>Log in to unlock all avatars and username edit.</span>";
      elements.profileAvatarGrid.insertAdjacentElement("afterend", desc);
    }
    if (elements.profileLogoutBtn) {
      elements.profileLogoutBtn.style.display = isLoggedIn ? "" : "none";
    }
    renderFavoriteTracks();
    elements.profilePanel.classList.remove("hidden");
  }

  function readFavoriteTracks() {
    try {
      const raw = localStorage.getItem(getFavoritesStorageKey());
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeFavoriteTracks(items) {
    localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(items));
  }

  function getFavoritesStorageKey() {
    const rawUser = localStorage.getItem("user") || localStorage.getItem("user_profile") || "{}";
    try {
      const user = JSON.parse(rawUser);
      const suffix = user?.id ?? user?.username ?? "guest";
      return `${FAVORITE_TRACKS_KEY}:${String(suffix)}`;
    } catch {
      return `${FAVORITE_TRACKS_KEY}:guest`;
    }
  }

  function removeFavoriteTrack(trackKey) {
    const current = readFavoriteTracks();
    const next = current.filter((item) => item?.key !== trackKey);
    writeFavoriteTracks(next);
  }

  function renderFavoriteTracks() {
    if (!elements.profileFavoritesSection || !elements.profileFavoritesList || !elements.profileFavoritesEmpty) {
      return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    const userRaw = localStorage.getItem("user") || localStorage.getItem("user_profile") || "{}";
    let user = {};
    try {
      user = JSON.parse(userRaw);
    } catch {
      user = {};
    }
    const isLoggedIn = Boolean(token && user?.username);
    if (!isLoggedIn) {
      elements.profileFavoritesSection.classList.add("hidden");
      return;
    }

    elements.profileFavoritesSection.classList.remove("hidden");

    const favorites = readFavoriteTracks().slice(0, 100);
    if (favorites.length === 0) {
      elements.profileFavoritesList.innerHTML = "";
      elements.profileFavoritesEmpty.classList.remove("hidden");
      return;
    }

    elements.profileFavoritesEmpty.classList.add("hidden");
    elements.profileFavoritesList.innerHTML = favorites
      .map((item) => {
        const title = escapeHtml(String(item?.title || "Unknown track"));
        const artist = escapeHtml(String(item?.artist || "Unknown artist"));
        const key = escapeHtml(String(item?.key || ""));
        const deezerHref =
          item?.id !== undefined && item?.id !== null
            ? `https://www.deezer.com/track/${encodeURIComponent(String(item.id))}`
            : "https://www.deezer.com/";

        return `
          <article class="profile-favorite-item">
            <div class="profile-favorite-main">
              <div class="profile-favorite-title">${title}</div>
              <div class="profile-favorite-artist">${artist}</div>
            </div>
            <div class="profile-favorite-actions">
              <a class="profile-favorite-link" href="${deezerHref}" target="_blank" rel="noopener noreferrer">Deezer</a>
              <button type="button" class="profile-favorite-remove" data-track-key="${key}">Remove</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function closeProfilePanel() {
    if (!elements.profilePanel) return;
    elements.profilePanel.classList.add("hidden");
  }

  // Logout
  function logout() {
    logoutUser();
  }

  // --- UI Helper Functions ---

  function openPanel() {
    elements.authPanel.classList.remove("hidden");
    setTimeout(() => {
      elements.authBox.classList.remove("scale-95", "opacity-0");
      elements.authBox.classList.add("scale-100", "opacity-100");
    }, 10);
  }

  function closePanel() {
    elements.authBox.classList.remove("scale-100", "opacity-100");
    elements.authBox.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      elements.authPanel.classList.add("hidden");
      clearMessage();
      if (elements.formLogin) elements.formLogin.reset();
      if (elements.formRegister) elements.formRegister.reset();
    }, 300);
  }

  // Switch between login and register tabs
  function switchAuthTab(tab) {
    clearMessage();
    if (tab === "login") {
      elements.tabLogin.classList.add("auth-tab--active");
      elements.tabRegister.classList.remove("auth-tab--active");
      elements.formLogin.classList.remove("hidden");
      elements.formRegister.classList.add("hidden");
    } else {
      elements.tabRegister.classList.add("auth-tab--active");
      elements.tabLogin.classList.remove("auth-tab--active");
      elements.formRegister.classList.remove("hidden");
      elements.formLogin.classList.add("hidden");
    }
  }

  // Show message
  function showMessage(msg, type) {
    elements.authMessage.textContent = msg;
    elements.authMessage.classList.remove("hidden", "text-red-500", "text-green-500");

    if (type === "error") {
      elements.authMessage.classList.add("text-red-500");
    } else {
      elements.authMessage.classList.add("text-green-500");
    }
  }

  // Clear message
  function clearMessage() {
    elements.authMessage.classList.add("hidden");
    elements.authMessage.textContent = "";
  }

  // Show loading state
  function showLoading(isLoading) {
    const btns = document.querySelectorAll('#auth-box button[type="submit"]');

    btns.forEach((btn) => {
      if (isLoading) {
        btn.disabled = true;
        btn.classList.add("opacity-75", "cursor-not-allowed");
        btn.classList.remove("opacity-50");
        btn.innerHTML = `
                    <div class="flex items-center justify-center gap-2">
                        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>${t("auth.processing", getLang())}</span>
                    </div>
                `;
        return;
      }
      btn.disabled = false;
      btn.classList.remove("opacity-75", "cursor-not-allowed");
      btn.classList.add("hover:shadow-lg", "hover:-translate-y-1");

      if (btn.id === "btn-login-submit") {
        btn.textContent = t("auth.submitLogin", getLang());
      } else if (btn.id === "btn-register-submit") {
        btn.textContent = t("auth.submitRegister", getLang());
      }
    });
  }
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

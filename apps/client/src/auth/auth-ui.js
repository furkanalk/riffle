import { mountAvatarPicker } from "../ui/avatar-picker.js";

export function initAuthUI() {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const elements = {
    // Buttons Containers
    guestButtons: document.getElementById("guest-buttons"),
    userProfileBtn: document.getElementById("user-profile-btn"),

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
  };

  // if loginBtn or userProfileBtn not found, exit
  if (!elements.loginBtn && !elements.userProfileBtn) return;

  // Check login status on load
  checkLoginStatus();

  // --- EVENT LISTENERS ---

  // Login button click to open login panel
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener("click", () => {
      switchAuthTab("login");
      openPanel();
    });
  }

  // Signup button click to open register panel
  if (elements.signupBtn) {
    elements.signupBtn.addEventListener("click", () => {
      switchAuthTab("register");
      openPanel();
    });
  }

  // Profile button opens profile panel (logged-in)
  if (elements.userProfileBtn) {
    elements.userProfileBtn.addEventListener("click", () => {
      openProfilePanel();
    });
  }

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
  }

  // Simple check for non-empty fields (to enable/disable submit button)
  const simpleCheck = (btn, inputs) => {
    const isValid = inputs.every((i) => i.input.value.trim() !== "");
    btn.disabled = !isValid;
    if (isValid) {
      btn.classList.remove("opacity-50", "cursor-not-allowed");
      btn.classList.add("hover:shadow-lg", "hover:-translate-y-1");
    } else {
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

    inputs.forEach((i) => {
      i.input.addEventListener("input", () => simpleCheck(btn, inputs));
    });
    simpleCheck(btn, inputs);
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
    const raw = localStorage.getItem("user");
    const token = localStorage.getItem("token");
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
    if (elements.guestButtons) elements.guestButtons.classList.add("hidden");

    // Show profile button and set username
    if (elements.userProfileBtn) elements.userProfileBtn.classList.remove("hidden");
    if (elements.userDisplayName) elements.userDisplayName.textContent = user.username;
    updateHeaderAvatar(user);
  }

  // Show guest mode
  function showGuestMode() {
    if (elements.guestButtons) elements.guestButtons.classList.remove("hidden");
    if (elements.userProfileBtn) elements.userProfileBtn.classList.add("hidden");
    showGuestHeaderAvatar();
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
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (elements.profileUsername) elements.profileUsername.value = user.username || "";
    if (elements.profileUsernameMsg) {
      elements.profileUsernameMsg.classList.add("hidden");
      elements.profileUsernameMsg.textContent = "";
    }
    elements.profileAvatarGrid.innerHTML = "";
    mountAvatarPicker(elements.profileAvatarGrid, {
      selectedId: user.avatar || "avatar1",
      onPick: (id) => {
        saveProfileAvatar(id);
      },
    });
    elements.profilePanel.classList.remove("hidden");
  }

  function closeProfilePanel() {
    if (!elements.profilePanel) return;
    elements.profilePanel.classList.add("hidden");
  }

  // Logout
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload(); // Refresh to renew state
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
                        <span>Processing...</span>
                    </div>
                `;
        return;
      }
      btn.disabled = false;
      btn.classList.remove("opacity-75", "cursor-not-allowed");
      btn.classList.add("hover:shadow-lg", "hover:-translate-y-1");

      if (btn.id === "btn-login-submit") {
        btn.textContent = "ENTER THE ARENA";
      } else if (btn.id === "btn-register-submit") {
        btn.textContent = "CREATE LEGEND";
      }
    });
  }
}

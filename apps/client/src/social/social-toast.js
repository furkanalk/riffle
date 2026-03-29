let hideTimer;

/** @param {string} message */
export function showSocialToast(message) {
  const el = document.getElementById("riffle-social-toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("riffle-social-toast--show");
  el.setAttribute("aria-hidden", "false");
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    el.classList.remove("riffle-social-toast--show");
    hideTimer = window.setTimeout(() => {
      el.textContent = "";
      el.setAttribute("aria-hidden", "true");
    }, 320);
  }, 2800);
}

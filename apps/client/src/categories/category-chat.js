// Sohbet fonksiyonları

// Send chat message
function sendChatMessage() {
  if (typeof window.riffleLobbySendChat === "function") {
    window.riffleLobbySendChat();
    return;
  }

  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  // In a real app, you'd send this to a server
  const messagesContainer = document.getElementById("chat-messages");
  const messageEl = document.createElement("div");
  messageEl.className = "mb-3";
  messageEl.innerHTML = `
    <span class="text-blue-400 font-semibold">You:</span>
    <span class="text-white">${escapeHTML(text)}</span>
  `;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  input.value = "";
}

// Escape HTML
function escapeHTML(str) {
  return str.replace(
    /[&<>"']/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[tag]
  );
}

export { sendChatMessage, escapeHTML };

// timer-manager.js
import { getLang, t } from "../core/i18n.js";

export class TimerManager {
  constructor() {
    this.timer = null;
    this.riffleTimeout = null;
    this.timeLimit = 15; // Default time limit in seconds
    this.timerBar = document.getElementById("timer-bar");
    this.timeoutHandled = false;
    this.answerSelected = false;
  }

  // Set time limit for timer
  setTimeLimit(limit) {
    this.timeLimit = limit;
  }

  // Start timer for VS modes
  startTimer(onTimeout) {
    this.timeoutHandled = false;
    let timeLeft = this.timeLimit;
    this.timerBar.style.width = "100%";
    this.timerBar.style.backgroundColor = "";
    this.timerBar.textContent = "";
    const expiredMsg = document.getElementById("timer-expired-msg");
    if (expiredMsg) {
      expiredMsg.textContent = "";
      expiredMsg.classList.add("hidden");
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.timer = setInterval(() => {
      timeLeft -= 0.1;
      const percentage = (timeLeft / this.timeLimit) * 100;
      this.timerBar.style.width = `${percentage}%`;
      this.timerBar.textContent = "";

      if (timeLeft <= 0) {
        clearInterval(this.timer);
        this.timerBar.style.width = "0%";
        this.timerBar.style.backgroundColor = "#ef4444";
        this.timerBar.textContent = "";
        const msg = document.getElementById("timer-expired-msg");
        if (msg) {
          msg.textContent = t("gamePage.roundTimeUp", getLang());
          msg.classList.remove("hidden");
        }
        if (!this.answerSelected && onTimeout) {
          onTimeout();
        }
      }
    }, 100);
  }

  // Stop timer
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Reset timer UI
  resetTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.timerBar.style.width = "100%";
    this.timerBar.style.backgroundColor = "";
    this.timerBar.textContent = "";
    const expiredMsg = document.getElementById("timer-expired-msg");
    if (expiredMsg) {
      expiredMsg.textContent = "";
      expiredMsg.classList.add("hidden");
    }
    this.timeoutHandled = false;
    this.answerSelected = false;
  }

  // Start preview timeout
  startPreviewTimeout(previewLength, onTimeout) {
    if (this.riffleTimeout) {
      clearTimeout(this.riffleTimeout);
    }

    this.riffleTimeout = setTimeout(() => {
      if (!this.answerSelected && !this.timeoutHandled && onTimeout) {
        onTimeout();
      }
    }, previewLength * 1000);
  }

  // Clear preview timeout
  clearPreviewTimeout() {
    if (this.riffleTimeout) {
      clearTimeout(this.riffleTimeout);
      this.riffleTimeout = null;
    }
  }

  // Set answer selected flag
  setAnswerSelected(selected) {
    this.answerSelected = selected;
    if (selected) {
      this.timeoutHandled = true;
    }
  }

  // Handle timeout scenario
  handleTimeout() {
    if (this.timeoutHandled || this.answerSelected) return;
    this.timeoutHandled = true;

    // Add timeout-correct style if not exists
    if (!document.getElementById("timeout-correct-style")) {
      const style = document.createElement("style");
      style.id = "timeout-correct-style";
      style.textContent = `
        .timeout-correct {
          background: repeating-linear-gradient(
            45deg,
            rgba(74, 222, 128, 0.6),
            rgba(74, 222, 128, 0.6) 10px,
            rgba(74, 222, 128, 0.8) 10px,
            rgba(74, 222, 128, 0.8) 20px
          ) !important;
          color: #111 !important;
          font-weight: bold !important;
          border: 2px dashed #22c55e !important;
          animation: pulse-border 2s infinite;
        }
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `;
      document.head.appendChild(style);
    }

    return true; // Indicates timeout was handled
  }

  // Clean up all timers
  cleanup() {
    this.stopTimer();
    this.clearPreviewTimeout();
  }
}

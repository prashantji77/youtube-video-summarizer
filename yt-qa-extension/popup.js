// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("qa-form");
  const questionInput = document.getElementById("question");
  const answerDiv = document.getElementById("answer");
  const statusDiv = document.getElementById("status");
  const videoInfoDiv = document.getElementById("video-info");
  const submitBtn = document.getElementById("submit-btn");
  const themeBtn = document.getElementById("theme-btn");
  const themeMenu = document.getElementById("theme-menu");
  const themeLabel = document.getElementById("theme-label");
  const themeOptions = document.querySelectorAll(".theme-option");

  let currentVideoUrl = null;
  let currentTheme = "system";

  // Theme Management
  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (theme === "system") {
      theme = getSystemTheme();
    }
    document.documentElement.setAttribute("data-theme", theme);
    currentTheme = theme;
  }

  function updateThemeLabel(theme) {
    const labels = {
      light: "Light",
      dark: "Dark",
      system: "System"
    };
    themeLabel.textContent = labels[theme] || "System";
  }

  function setActiveThemeOption(theme) {
    themeOptions.forEach(option => {
      option.classList.remove("active");
      if (option.dataset.theme === theme) {
        option.classList.add("active");
      }
    });
  }

  // Load saved theme preference
  chrome.storage.sync.get(["theme"], (result) => {
    const savedTheme = result.theme || "system";
    applyTheme(savedTheme);
    updateThemeLabel(savedTheme);
    setActiveThemeOption(savedTheme);
  });

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    chrome.storage.sync.get(["theme"], (result) => {
      const savedTheme = result.theme || "system";
      if (savedTheme === "system") {
        applyTheme("system");
      }
    });
  });

  // Theme menu toggle
  themeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    themeMenu.classList.toggle("active");
  });

  // Close theme menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!themeBtn.contains(e.target) && !themeMenu.contains(e.target)) {
      themeMenu.classList.remove("active");
    }
  });

  // Theme option selection
  themeOptions.forEach(option => {
    option.addEventListener("click", () => {
      const theme = option.dataset.theme;
      chrome.storage.sync.set({ theme: theme }, () => {
        applyTheme(theme);
        updateThemeLabel(theme);
        setActiveThemeOption(theme);
        themeMenu.classList.remove("active");
      });
    });
  });

  // Update status display
  function showStatus(message, type = "loading") {
    statusDiv.textContent = message;
    statusDiv.className = `status show ${type}`;
    if (type === "loading") {
      statusDiv.innerHTML = `<span class="spinner"></span> ${message}`;
    }
  }

  function hideStatus() {
    statusDiv.classList.remove("show");
    statusDiv.textContent = "";
  }

  function showAnswer(answer) {
    answerDiv.textContent = answer;
    answerDiv.classList.add("show");
  }

  function hideAnswer() {
    answerDiv.classList.remove("show");
    answerDiv.textContent = "";
  }

  // Get the current active tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.url) {
      videoInfoDiv.textContent = "No active tab found.";
      videoInfoDiv.classList.add("error");
      form.style.display = "none";
      return;
    }

    const url = tab.url;
    if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
      currentVideoUrl = url;
      // Extract video ID for better display
      const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      
      if (videoId) {
        videoInfoDiv.innerHTML = `
          <strong>✓ YouTube Video Detected</strong><br>
          <span style="color: var(--text-muted); font-size: 12px;">Video ID: ${videoId}</span>
        `;
        videoInfoDiv.classList.add("success");
      } else {
        videoInfoDiv.textContent = "✓ YouTube video detected";
        videoInfoDiv.classList.add("success");
      }
    } else {
      videoInfoDiv.textContent = "⚠ This is not a YouTube video page. Please navigate to a YouTube video first.";
      videoInfoDiv.classList.add("error");
      form.style.display = "none";
    }
  });

  // Handle form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    hideAnswer();
    hideStatus();

    const question = questionInput.value.trim();
    if (!question) {
      showStatus("Please enter a question.", "error");
      return;
    }

    if (!currentVideoUrl) {
      showStatus("No YouTube video detected.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> <span>Processing...</span>';
    showStatus("Processing your question...", "loading");

    try {
      const res = await fetch("http://localhost:8000/api/ask-video/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          video_url: currentVideoUrl,
          question: question
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showStatus(`Error: ${data.error || "Unknown error"}`, "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Ask Question</span>';
        return;
      }

      showStatus("Answer received!", "success");
      showAnswer(data.answer || "No answer returned.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Ask Question</span>';

      // Hide status after 2 seconds
      setTimeout(() => {
        hideStatus();
      }, 2000);
    } catch (err) {
      console.error(err);
      showStatus("Request failed due to internal server error.", "error"); 
// This error occur when the django is not running on localhost:8000 or server is not running
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Ask Question</span>';
    }
  });
});

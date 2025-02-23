//This script handles the debug toggle button's behavior, including updating its text and saving the debug state using chrome.storage.

document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleDebug");

  // Set initial button text based on stored value
  chrome.storage.sync.get(["debugMode"], (result) => {
    const debugMode = result.debugMode !== undefined ? result.debugMode : false;
    toggleButton.textContent = debugMode ? "Turn Debug OFF" : "Turn Debug ON";
  });

  // Handle toggle button click
  toggleButton.addEventListener("click", () => {
    chrome.storage.sync.get(["debugMode"], (result) => {
      const currentMode = result.debugMode !== undefined ? result.debugMode : false;
      const newMode = !currentMode;

      // Save the new state
      chrome.storage.sync.set({ debugMode: newMode }, () => {
        toggleButton.textContent = newMode ? "Turn Debug OFF" : "Turn Debug ON";

        // Send the new state to the content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { debugMode: newMode });
        });
      });
    });
  });
});

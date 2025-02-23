//Updated icon (badge) with slop count

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.slopCount !== undefined) {
    // Update the badge text with the slop count
    chrome.action.setBadgeText({ text: message.slopCount.toString() });
    // Set the badge background color to red
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  }
});

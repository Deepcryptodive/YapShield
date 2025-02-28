//Updated icon (badge) with slop count

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.slopCount !== undefined) {
    const badgeText = message.slopCount > 0 ? message.slopCount.toString() : '';
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  }
});

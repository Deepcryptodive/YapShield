const DEBUG_MODE = true;  // Set to false for production (this will tag more posts as slop)
const SLOP_DISPLAY_MODE = 'highlight';  // Options: 'hide', 'grey', 'highlight'

let slopCount = 0;  // Global counter for slop posts

// Detect if text is Slop or not
function isSlop(text) {
  let slopWords = [
    "provide a valuable insight", "gain a comprehensive understanding", "left an indelible mark",
    "play a significant role in shaping", "an unwavering commitment", "moon", "HODL", "paradigm shift",
    "finding the highlight the importance", "I think everyone needs to follow him", "indeed a fascinating case study",
    "a serf reminder", "pose a significant challenge", "sent shockwaves through", "highlights the importance of",
    "left an indelible mark"
  ];

  // Add extra words only in debug mode
  if (DEBUG_MODE) {
    slopWords = slopWords.concat(["crypto", "token", "DeFi", "Sonic", "@SonicLabs"]);
  }

  // Check if text contains any slop words or is too short
  const lowerText = text.toLowerCase();
  return slopWords.some(w => lowerText.includes(w)) || text.length < 20;
}

// Modify appearance of tweet if it's Slop and update slopCount
function checkPosts(nodes) {
  nodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.matches('article')) {
        const text = node.innerText || node.textContent;
        if (isSlop(text)) {
          slopCount++;
          applySlopStyle(node);
        }
      }
      const posts = node.querySelectorAll('article');
      posts.forEach(post => {
        const text = post.innerText || post.textContent;
        if (isSlop(text)) {
          slopCount++;
          applySlopStyle(post);
        }
      });
    }
  });
  // Send updated slopCount to background script
  chrome.runtime.sendMessage({ slopCount: slopCount });
}

// Helper function to apply slop styling based on SLOP_DISPLAY_MODE
function applySlopStyle(element) {
  if (SLOP_DISPLAY_MODE === 'hide') {
    element.style.display = 'none'; // Hide slop posts
  } else if (SLOP_DISPLAY_MODE === 'grey') {
    element.style.opacity = '0.3'; // Grey out slop posts
  } else if (SLOP_DISPLAY_MODE === 'highlight') {
    element.style.backgroundColor = 'red'; // Highlight slop posts
  }
}

function initObserver() {
  // Find a tweet container
  const tweetContainer = document.querySelector('div[data-testid="cellInnerDiv"]');
  // Get its parent, which is the timeline container
  const container = tweetContainer ? tweetContainer.parentElement : null;

  if (container) {
    // Reset slopCount to 0 for a fresh count each time the observer starts
    slopCount = 0;

    // Set up the MutationObserver to watch for new tweets
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          checkPosts(mutation.addedNodes);
        }
      });
    });
    observer.observe(container, { childList: true, subtree: true });

    // Check existing posts
    checkPosts([container]);
    console.log('✅ SlopShield initialized ✅');
    // Send initial slopCount after checking existing posts
    chrome.runtime.sendMessage({ slopCount: slopCount });
  } else {
    // If the container isn’t found, retry after 1 second
    console.error('Container not (yet) found. Likely still loading timeline. Retrying in 1s...');
    setTimeout(initObserver, 1000);
  }
}

// Start the observer when the script runs
initObserver();

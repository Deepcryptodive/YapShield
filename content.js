const SLOP_DISPLAY_MODE = 'highlight'; // Options: 'hide', 'grey', 'highlight'

// Global variables
let DEBUG_MODE = false; // Debugging mode tags more posts as slop; default to false, overridden by storage
let slopCount = 0;      // Global counter for slop posts

// Load initial debug mode from storage on script load
chrome.storage.sync.get(["debugMode"], (result) => {
  DEBUG_MODE = result.debugMode !== undefined ? result.debugMode : false;
  console.log(`Initial debug mode set to: ${DEBUG_MODE}`);
  // Check existing posts on page load
  const container = document.querySelector('div[data-testid="cellInnerDiv"]')?.parentElement;
  if (container) {
    checkPosts([container]);
  }
});

// Detect if text is slop
function isSlop(text) {
  let slopWords = [
    "provide a valuable insight", "gain a comprehensive understanding", "left an indelible mark",
    "play a significant role in shaping", "an unwavering commitment", "moon", "HODL", "paradigm shift",
    "finding the highlight the importance", "I think everyone needs to follow him", "indeed a fascinating case study",
    "a serf reminder", "pose a significant challenge", "sent shockwaves through", "highlights the importance of",
    "left an indelible mark"
  ];

  // Add debug-specific words when DEBUG_MODE is true
  if (DEBUG_MODE) {
    slopWords = slopWords.concat(["crypto", "token", "DeFi", "Sonic", "@SonicLabs", "all"]);
  }

  const lowerText = text.toLowerCase();
  return slopWords.some(w => lowerText.includes(w)) || text.length < 20;
}

// Reset slop-related styles on an element
function resetStyle(element) {
  element.style.backgroundColor = '';
  element.style.opacity = '1';
  element.style.display = 'block'; // Assumes 'block' is the default display
}

// Apply slop styling based on SLOP_DISPLAY_MODE
function applySlopStyle(element) {
  if (SLOP_DISPLAY_MODE === 'hide') {
    element.style.display = 'none';
  } else if (SLOP_DISPLAY_MODE === 'grey') {
    element.style.opacity = '0.3';
  } else if (SLOP_DISPLAY_MODE === 'highlight') {
    element.style.backgroundColor = 'red';
  }
}

// Check posts for slop and update styles and counter
function checkPosts(nodes) {
  nodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.matches('article')) {
        resetStyle(node); // Reset styles first
        const text = node.innerText || node.textContent;
        if (isSlop(text)) {
          slopCount++;
          applySlopStyle(node);
        }
      }
      const posts = node.querySelectorAll('article');
      posts.forEach(post => {
        resetStyle(post); // Reset styles first
        const text = post.innerText || post.textContent;
        if (isSlop(text)) {
          slopCount++;
          applySlopStyle(post);
        }
      });
    }
  });
  chrome.runtime.sendMessage({ slopCount: slopCount });
}

// Initialize observer to watch for new posts
function initObserver() {
  const tweetContainer = document.querySelector('div[data-testid="cellInnerDiv"]');
  const container = tweetContainer ? tweetContainer.parentElement : null;

  if (container) {
    slopCount = 0; // Reset counter for a fresh start
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
  } else {
    console.error('Container not found. Retrying in 1s...');
    setTimeout(initObserver, 1000);
  }
}

// Listen for debug mode toggle from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.debugMode !== undefined) {
    DEBUG_MODE = message.debugMode;
    console.log(`Debug mode set to: ${DEBUG_MODE}`);
    slopCount = 0; // Reset counter for accurate recount
    const container = document.querySelector('div[data-testid="cellInnerDiv"]')?.parentElement;
    if (container) {
      checkPosts([container]);
    }
  }
});

// Start the observer
initObserver();

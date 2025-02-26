// content.js

// Display mode for slop posts
const SLOP_DISPLAY_MODE = 'highlight'; // Options: 'hide', 'grey', 'highlight'

// Global variables
let EXTENSION_ENABLED = true;
let DEBUG_MODE = false;
let DEFI_MODE_ENABLED = false;
let DEFI_ONLY_FILTER = false;
let slopCount = 0;
let totalPosts = 0;
let observer = null;

// Consolidated message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[SlopShield] Received message:", message);
  if (message.extensionEnabled !== undefined) {
    EXTENSION_ENABLED = message.extensionEnabled;
    console.log(`[SlopShield] Extension enabled: ${EXTENSION_ENABLED}`);
    resetAndReprocess();
  } else if (message.debugMode !== undefined) {
    DEBUG_MODE = message.debugMode;
    console.log(`[SlopShield] Debug mode set to: ${DEBUG_MODE}`);
    resetAndReprocess();
  } else if (message.defiModeEnabled !== undefined) {
    DEFI_MODE_ENABLED = message.defiModeEnabled;
    console.log(`[SlopShield] DeFi mode enabled: ${DEFI_MODE_ENABLED}`);
    resetAndReprocess();
  } else if (message.defiOnlyFilter !== undefined) {
    DEFI_ONLY_FILTER = message.defiOnlyFilter;
    console.log(`[SlopShield] DeFi-only filter set to: ${DEFI_ONLY_FILTER}`);
    resetAndReprocess();
  } else if (message.action === "getSlopScore") {
    const slopScore = totalPosts > 0 ? (slopCount / totalPosts) * 100 : 0;
    sendResponse({ slopScore: slopScore, slopCount: slopCount, totalPosts: totalPosts });
  }
});

// Load initial settings and start observer
chrome.storage.sync.get(["debugMode", "defiModeEnabled", "defiOnlyFilter", "extensionEnabled"], (result) => {
  EXTENSION_ENABLED = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
  DEBUG_MODE = result.debugMode || false;
  DEFI_MODE_ENABLED = result.defiModeEnabled || false;
  DEFI_ONLY_FILTER = result.defiOnlyFilter || false;
  console.log(`[SlopShield] Initial settings - Debug: ${DEBUG_MODE}, DeFi Mode: ${DEFI_MODE_ENABLED}, DeFi Filter: ${DEFI_ONLY_FILTER}, Enabled: ${EXTENSION_ENABLED}`);
  initObserver();
});

function isSlop(text) {
  let slopWords = [
    // Original List (Unique Entries)
    "provide a valuable insight",
    "gain a comprehensive understanding",
    "left an indelible mark",
    "play a significant role in shaping",
    "an unwavering commitment",
    "moon",
    "HODL",
    "vitality",
    " Let's just say it",
    "organic innovation",
    "paradigm shift",
    "more than just",
    "we aim to harmonize",
    "finding the highlight the importance",
    "I think everyone needs to follow him",
    "indeed a fascinating case study",
    "a serf reminder",
    "pose a significant challenge",
    "sent shockwaves through",
    "highlights the importance of",
    "innovative solutions",
    "revolutionary technology",
    "thrives on",
    "game changing",
    "push boundaries",
    "reshaping the",
    "unlocking solutions",
    "technological revolution",
    "driving industries",
    "innovation and",
    "delve into",
    "tapestry",
    "bustling",
    "it's important to note",
    "testament",
    "there are a few considerations",
    "this is not an exhaustive list",
    "reverberate",
    "multifaceted",
    "symphony",
    "in today's digital era",
    "orchestrate",
    "labyrinthine",
    "sounds unheard",
    "underscore",
    "sights unseen",
    "commendable",
    "annals",
    "open a new avenue",
    "a stark reminder",
    "play a crucial role in determining",
    "finding a contribution",
    "crucial role in understanding",
    "finding a shed light",
    "conclusion of the study provides",
    "a nuanced understanding",
    "hold a significant",
    "gain significant attention",
    "continue to inspire",
    "provide a comprehensive overview",
    "endure a legacy",
    "mark a significant",
    "gain a deeper understanding",
    "the multifaceted nature",
    "the complex interplay",
    "study shed light on",
    "need to fully understand",
    "navigate the complex",
    "the potential to revolutionize",
    "the relentless pursuit",
    "offer a valuable",
    "underscore the importance",
    "a complex multifaceted",
    "the transformative power",
    "today the fast pace of the world",
    "a significant milestone",
    "delve deeper into",
    "provide an insight",
    "navigate the challenge",
    "highlight the potential",
    "a unique blend",
    "a crucial development",
    "various fields include",
    "commitment to excellence",
    "emphasize the need",
    "despite the face",
    "understanding the fundamental",
    "leave a lasting",
    "gain a valuable",
    "understand the behavior",
    "broad implications",
    "a prominent figure",
    "study highlights the importance",
    "a significant turning point",
    "curiosity piques",
    "today in the digital age",
    "implication to understand",
    "a beacon of hope",
    "pave the way for the future",
    "finding an important implication",
    "understand the complexity",
    "meticulous attention to",
    "add a layer",
    "the legacy of life",
    "identify the area of improvement",
    "aim to explore",
    "highlight the need",
    "provide the text",
    "conclusion of the study demonstrates",
    "a multifaceted approach",
    "provide a framework to understand",
    "present a unique challenge",
    "highlight the significance",
    "add depth to",
    "a significant stride",
    "gain an insight",
    "underscore the need",
    "the importance to consider",
    "offer a unique perspective",
    "contribute to understanding",
    "a significant implication",
    "despite the challenge faced",
    "enhances the understanding",
    "make an informed decision in regard to",
    "the target intervention",
    "require a careful consideration",
    "essential to recognize",
    "validate the finding",
    "vital role in shaping",
    "sense of camaraderie",
    "influence various factors",
    "make a challenge",
    "unwavering support",
    "importance of the address",
    "a significant step forward",
    "add an extra layer",
    "address the root cause",
    "a profound implication",
    "contributes to understanding"
  ];

  if (DEBUG_MODE) {
    slopWords = slopWords.concat(["crypto", "token", "Sonic", "@SonicLabs", "all"]);
  }

  const lowerText = text.toLowerCase();
  return slopWords.some(w => lowerText.includes(w)) || text.length < 20;
}

function isDeFiPost(text) {
  const defiKeywords = ["defi", "LP", "yield farming", "liquidity pool", "decentralized finance", "APR", "APY", "yieldfarm", "stables","stablecoins","onchain","currently farming"];
  const lowerText = text.toLowerCase();
  return defiKeywords.some(keyword => lowerText.includes(keyword));
}

function isVirtualAgentPost(text) {
  const virtualAgents = ["@AcolytAI", "@luna_virtuals", "@Vader_AI_", "@sekoia_virtuals", "@convo_virtuals", "@aixbt_agent", "@OrangemanAI", "@zaara_ai", "@AntiRugAgent", "@mobyagent", "@gemxbt_agent", "@ultronai_agent", "@rugdoctor_krain", "@HeyTracyAI", "@CallsignCharlie", "@FractalAgent_", "@Agentlosers", "@agentKnows", "@TradeTideAI", "@kizunaagent", "@AgentSpacely"];
  const lowerText = text.toLowerCase();
  return virtualAgents.some(agent => lowerText.includes(agent));
}

function resetStyle(element) {
  element.style.backgroundColor = '';
  element.style.opacity = '1';
  element.style.display = 'block';
  element.style.border = '';
}

function applySlopStyle(element) {
  if (SLOP_DISPLAY_MODE === 'hide') {
    element.style.display = 'none';
  } else if (SLOP_DISPLAY_MODE === 'grey') {
    element.style.opacity = '0.3';
  } else if (SLOP_DISPLAY_MODE === 'highlight') {
    element.style.backgroundColor = 'red';
  }
}

async function checkPosts(nodes) {
  if (!EXTENSION_ENABLED) {
    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches('article')) resetStyle(node);
        node.querySelectorAll('article').forEach(post => resetStyle(post));
      }
    });
    return;
  }

  nodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.matches('article')) {
        totalPosts++;
        resetStyle(node);
        const text = node.innerText || node.textContent;
        if (isVirtualAgentPost(text)) {
          node.style.backgroundColor = 'green';
        } else if (isDeFiPost(text)) {
          if (DEFI_MODE_ENABLED) {
            node.style.border = '3px solid gold';
          }
          if (DEFI_ONLY_FILTER) {
            node.style.display = 'block';
          } else {
            node.style.display = 'block';
          }
        } else if (isSlop(text)) {
          slopCount++;
          if (DEFI_ONLY_FILTER) {
            node.style.display = 'none';
          } else {
            applySlopStyle(node);
          }
        } else {
          if (DEFI_ONLY_FILTER) {
            node.style.display = 'none';
          } else {
            node.style.display = 'block';
          }
        }
      }
      const posts = node.querySelectorAll('article');
      posts.forEach(post => {
        totalPosts++;
        resetStyle(post);
        const text = post.innerText || post.textContent;
        if (isVirtualAgentPost(text)) {
          post.style.backgroundColor = 'green';
        } else if (isDeFiPost(text)) {
          if (DEFI_MODE_ENABLED) {
            post.style.border = '3px solid gold';
          }
          if (DEFI_ONLY_FILTER) {
            post.style.display = 'block';
          } else {
            post.style.display = 'block';
          }
        } else if (isSlop(text)) {
          slopCount++;
          if (DEFI_ONLY_FILTER) {
            post.style.display = 'none';
          } else {
            applySlopStyle(post);
          }
        } else {
          if (DEFI_ONLY_FILTER) {
            post.style.display = 'none';
          } else {
            post.style.display = 'block';
          }
        }
      });
    }
  });
  const slopScore = totalPosts > 0 ? (slopCount / totalPosts) * 100 : 0;
  chrome.runtime.sendMessage({ slopScore: slopScore, slopCount: slopCount, totalPosts: totalPosts });
  updateProgressBar();
}

function initObserver() {
  const tweetContainer = document.querySelector('div[data-testid="cellInnerDiv"]');
  const container = tweetContainer ? tweetContainer.parentElement : null;

  if (container) {
    if (observer) observer.disconnect();
    slopCount = 0;
    totalPosts = 0;
    observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          checkPosts(mutation.addedNodes);
        }
      });
    });
    observer.observe(container, { childList: true, subtree: true });

    if (EXTENSION_ENABLED) {
      checkPosts([container]);
    }
    console.log('✅ SlopShield initialized ✅');
  } else {
    console.error('Container not found. Retrying in 1s...');
    setTimeout(initObserver, 1000);
  }
}

function resetAndReprocess() {
  slopCount = 0;
  totalPosts = 0;
  const container = document.querySelector('div[data-testid="cellInnerDiv"]')?.parentElement;
  if (container) {
    checkPosts([container]);
  }
}

initObserver();

function injectProgressBar() {
  let progressBar = document.getElementById('slop-progress-bar');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'slop-progress-bar';
    progressBar.style.position = 'fixed';
    progressBar.style.top = '0';
    progressBar.style.left = '0';
    progressBar.style.height = '5px';
    progressBar.style.backgroundColor = 'red';
    progressBar.style.width = '0%';
    progressBar.style.transition = 'width 0.3s ease';
    document.body.appendChild(progressBar);
  }
  return progressBar;
}

function updateProgressBar() {
  const progressBar = injectProgressBar();
  const slopScore = totalPosts > 0 ? (slopCount / totalPosts) * 100 : 0;
  progressBar.style.width = `${slopScore}%`;
}

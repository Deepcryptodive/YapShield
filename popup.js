document.addEventListener('DOMContentLoaded', () => {
  console.log("[Popup] Popup loaded - starting verification");
  verifyNFT(); // Run verification when popup opens

  // Check if the active tab is on x.com
  function isOnXCom(tab) {
    return tab.url && tab.url.startsWith("https://x.com/");
  }

  // Load initial states from storage
  chrome.storage.sync.get(
    ["extensionEnabled", "debugMode", "defiModeEnabled", "defiOnlyFilter"],
    (result) => {
      document.getElementById("toggleExtension").checked =
        result.extensionEnabled !== undefined ? result.extensionEnabled : true;
      document.getElementById("toggleDebug").checked = result.debugMode || false;
      document.getElementById("toggleDeFiMode").checked =
        result.defiModeEnabled !== undefined ? result.defiModeEnabled : true;
      document.getElementById("toggleDeFiFilter").checked = result.defiOnlyFilter || false;
    }
  );

  // Handle Slop Score updates from content.js
  chrome.runtime.onMessage.addListener((message) => {
    if (message.slopScore !== undefined && message.slopCount !== undefined && message.totalPosts !== undefined) {
      const slopScore = message.slopScore.toFixed(2);
      const slopFraction = `${message.slopCount} posts (${slopScore}%)`;
      document.getElementById("slopScore").textContent = `Slop filtered: ${slopFraction}`;
      document.getElementById("slopProgress").style.width = `${slopScore}%`;
    }
  });

  // Request initial Slop Score on popup load
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (isOnXCom(tabs[0])) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getSlopScore" }, (response) => {
        if (response && response.slopScore !== undefined) {
          const slopScore = response.slopScore.toFixed(2);
          const slopFraction = `${response.slopCount} posts (${slopScore}%)`;
          document.getElementById("slopScore").textContent = `Slop filtered: ${slopFraction}`;
          document.getElementById("slopProgress").style.width = `${slopScore}%`;
        } else {
          document.getElementById("slopScore").textContent = "Slop filtered: 0 posts (0.00%)";
        }
      });
    } else {
      document.getElementById("slopScore").textContent = "Slop filtered: N/A (Not on x.com)";
    }
  });

  // Toggle Extension On/Off
  document.getElementById("toggleExtension").addEventListener("change", (event) => {
    const newMode = event.target.checked;
    chrome.storage.sync.set({ extensionEnabled: newMode }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isOnXCom(tabs[0])) {
          chrome.tabs.sendMessage(tabs[0].id, { extensionEnabled: newMode });
        }
      });
    });
  });

  // Toggle Debug Mode
  document.getElementById("toggleDebug").addEventListener("change", (event) => {
    const newMode = event.target.checked;
    chrome.storage.sync.set({ debugMode: newMode }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isOnXCom(tabs[0])) {
          chrome.tabs.sendMessage(tabs[0].id, { debugMode: newMode });
        }
      });
    });
  });

  // Toggle DeFi Mode (Highlight DeFi Posts)
  document.getElementById("toggleDeFiMode").addEventListener("change", (event) => {
    const newMode = event.target.checked;
    chrome.storage.sync.set({ defiModeEnabled: newMode }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isOnXCom(tabs[0])) {
          chrome.tabs.sendMessage(tabs[0].id, { defiModeEnabled: newMode });
        }
      });
    });
  });

  // Toggle DeFi-Only Filter
  document.getElementById("toggleDeFiFilter").addEventListener("change", (event) => {
    const newMode = event.target.checked;
    chrome.storage.sync.set({ defiOnlyFilter: newMode }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isOnXCom(tabs[0])) {
          chrome.tabs.sendMessage(tabs[0].id, { defiOnlyFilter: newMode });
        }
      });
    });
  });
});

// Verify ENS and NFT balance using ethers.js v6.13.5
async function verifyNFT() {
  const ensName = 'deepcryptodive.eth';
  try {
    console.log("[Popup] Resolving ENS:", ensName);
    const provider = ethers.getDefaultProvider('mainnet', {
      infura: 'bb002ce1ea394f3b8ce56136acd5212b' // Your Infura ID
    });
    console.log("[Popup] Mainnet provider ready");
    const address = await provider.resolveName(ensName);
    if (!address) {
      console.log("[Popup] ENS resolution failed: no address");
      updateNFTInfo(0);
      return;
    }
    console.log("[Popup] ENS resolved to:", address);

    console.log("[Popup] Checking NFT balance on Mantle");
    const mantleProvider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');
    const contract = new ethers.Contract(
      '0x8ca63b0424c7e609051784f5673a76e78a17abed', // Boys NFT contract address
      ['function balanceOf(address owner) view returns (uint256)'],
      mantleProvider
    );
    const balance = await contract.balanceOf(address);
    const balanceNum = Number(balance);
    console.log("[Popup] NFT balance:", balanceNum);
    updateNFTInfo(balanceNum);
  } catch (error) {
    console.error("[Popup] Verification error:", error);
    updateNFTInfo(0);
  }
}

// Update the popup UI with NFT info
function updateNFTInfo(balance) {
  const nftCheckmark = document.getElementById('nftCheckmark');
  const nftInfo = document.getElementById('nftInfo');
  const nftImage = document.getElementById('nftImage');
  if (balance > 0) {
    nftCheckmark.style.display = 'inline'; // Show checkmark
    nftInfo.textContent = 'Holds Boys NFT — full access!';
    nftImage.src = 'https://arweave.net/XCzQ_qhWRit8ypk0mk5jp0nzrvWARAYJMpyQTzL_1DM/983.jpg';
    nftImage.style.display = 'block';
  } else {
    nftCheckmark.style.display = 'none'; // Hide checkmark
    nftInfo.textContent = '';
    nftImage.style.display = 'none';
  }
}

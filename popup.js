document.addEventListener('DOMContentLoaded', () => {
  console.log("[Popup] Popup loaded");

  function isOnXCom(tab) {
    return tab.url && tab.url.startsWith("https://x.com/");
  }

  // Load and reset initial states to OFF
  chrome.storage.sync.set({
    extensionEnabled: false,
    debugMode: false,
    defiModeEnabled: false,
    defiOnlyFilter: false
  }, () => {
    chrome.storage.sync.get(
      ["extensionEnabled", "debugMode", "defiModeEnabled", "defiOnlyFilter", "nftVerifiedOnce"],
      (result) => {
        document.getElementById("toggleExtension").checked = result.extensionEnabled || false;
        document.getElementById("toggleDebug").checked = result.debugMode || false;
        document.getElementById("toggleDeFiMode").checked = result.defiModeEnabled || false;
        document.getElementById("toggleDeFiFilter").checked = result.defiOnlyFilter || false;

        updateUserInfoVisibility();
        updateSlopScoreVisibility();

        if (result.nftVerifiedOnce) {
          console.log("[Popup] NFT already verified once, auto-running verification");
          verifyNFT();
        }
      }
    );
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.slopScore !== undefined && message.slopCount !== undefined && message.totalPosts !== undefined) {
      const slopScore = message.slopScore.toFixed(1); // Reduced to one decimal
      const slopFraction = `${message.slopCount} slop posts (${slopScore}%)`;
      document.getElementById("slopScore").textContent = slopFraction;
      document.getElementById("slopProgress").style.width = `${message.slopScore}%`;
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (isOnXCom(tabs[0])) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getSlopScore" }, (response) => {
        if (response && response.slopScore !== undefined) {
          const slopScore = response.slopScore.toFixed(1);
          const slopFraction = `${response.slopCount} slop posts (${slopScore}%)`;
          document.getElementById("slopScore").textContent = slopFraction;
          document.getElementById("slopProgress").style.width = `${response.slopScore}%`;
        } else {
          document.getElementById("slopScore").textContent = "0 slop posts (0.0%)";
        }
      });
    } else {
      document.getElementById("slopScore").textContent = "Go to X.com to detect Slop";
    }
  });

  document.getElementById("toggleExtension").addEventListener("change", (event) => {
    const newMode = event.target.checked;
    chrome.storage.sync.set({ extensionEnabled: newMode }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isOnXCom(tabs[0])) {
          chrome.tabs.sendMessage(tabs[0].id, { extensionEnabled: newMode });
        }
      });
      updateUserInfoVisibility();
    });
  });

  document.getElementById("toggleDebug").addEventListener("change", (event) => {
    const newMode = event.target.checked;
    chrome.storage.sync.set({ debugMode: newMode }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isOnXCom(tabs[0])) {
          chrome.tabs.sendMessage(tabs[0].id, { debugMode: newMode });
        }
      });
      updateSlopScoreVisibility();
    });
  });

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

  document.getElementById("toggleDeFiFilter").addEventListener("change", (event) => {
    const newMode = event.target.checked;
    chrome.storage.sync.set({ defiOnlyFilter: newMode }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isOnXCom(tabs[0])) {
          chrome.tabs.sendMessage(tabs[0].id, { defiOnlyFilter: newMode });
        }
      });
      updateDefiModesVisibility();
    });
  });

  document.querySelectorAll('.defi-mode-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.defi-mode-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const mode = button.getAttribute('data-mode');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isOnXCom(tabs[0])) {
          chrome.tabs.sendMessage(tabs[0].id, { defiFilterMode: mode });
        }
      });
    });
  });

  document.getElementById("verifyButton").addEventListener("click", () => {
    const nftStatus = document.getElementById('nftStatus');
    nftStatus.innerHTML = 'Checking access...';
    verifyNFT();
    chrome.storage.sync.set({ nftVerifiedOnce: true }, () => {
      console.log("[Popup] First verification completed");
    });
  });

  async function verifyNFT() {
    const ensName = 'deepcryptodive.eth';
    try {
      console.log("[Popup] Resolving ENS:", ensName);
      const provider = ethers.getDefaultProvider('mainnet', {
        infura: 'bb002ce1ea394f3b8ce56136acd5212b'
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
        '0x8ca63b0424c7e609051784f5673a76e78a17abed',
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

  function updateNFTInfo(balance) {
    const nftStatus = document.getElementById('nftStatus');
    const nftImage = document.getElementById('nftImage');
    const lockInToggle = document.getElementById('lockInToggle');
    if (balance > 0) {
      nftStatus.textContent = '✅';
      nftStatus.title = `${balance} Boys NFT held — full access!`;
      nftImage.src = 'https://i.nfte.ai/ia/l1601/35351/8962769448646292002_1352326503.avif';
      nftImage.style.display = 'block';
      lockInToggle.style.display = 'inline-block';
      updateDefiModesVisibility();
    } else {
      nftStatus.textContent = '❌';
      nftStatus.title = 'Get a Boys NFT to unlock full access!';
      nftImage.style.display = 'none';
      lockInToggle.style.display = 'none';
      document.getElementById('defiModesContainer').style.display = 'none';
    }
  }

  function updateDefiModesVisibility() {
    const defiModesContainer = document.getElementById('defiModesContainer');
    const lockInToggleChecked = document.getElementById("toggleDeFiFilter").checked;
    const nftStatus = document.getElementById('nftStatus').textContent;
    defiModesContainer.style.display = (nftStatus === '✅' && lockInToggleChecked) ? 'block' : 'none';
  }

  function updateUserInfoVisibility() {
    const userInfo = document.querySelector('.hardcoded-info');
    const accessXChecked = document.getElementById("toggleExtension").checked;
    userInfo.style.display = accessXChecked ? 'block' : 'none';
  }

  function updateSlopScoreVisibility() {
    const slopScoreContainer = document.getElementById('slopScoreContainer');
    const slopSpotlightChecked = document.getElementById("toggleDebug").checked;
    slopScoreContainer.style.display = slopSpotlightChecked ? 'block' : 'none';
  }
});

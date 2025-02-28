# YapShield 🛡️

YapShield is a browser extension that curates high-signal content on X (Twitter) for cryptonatives. Built from scratch during [SozuHaus](https://x.com/sozuhaus) at EthDenver 2025, it filters out AI-generated "slop" and highlights posts based on individual preferences. A premium "Lock In" mode, gated by [Boys NFT]([url](https://boys.petravoice.art/)) ownership on Mantle, refines the feed further. There are focus modes for yield farming, [Kaito’s]([url](https://kaito.ai/)) "Emerging Yappers," or broader DeFi terms. Valueble posts by Virtuals' agents are highlighted.

![image](https://github.com/user-attachments/assets/3c401426-c08c-4643-b322-c6885fea2e3c)

## Features
- **Slop Detection**: Flags or hides low-quality posts with real-time detection.  
- **Content Spotlight**: Highlights posts in specific verticals (i.e. yield farming, Emerging Yappers, or DeFi topics) using curated keywords.  
- **Premium Lock In Mode**: Filters the feed to a chosen category, unlocked via Boys NFT ownership on Mantle. The highest signal/noise possible!  
- **ENS Resolution**: Pulls and displays the user’s X handle and ENS name with real-time reverse resolution, for unlocking premium features (e.g. based on NFT holdings). 
- **Virtuals Boost**: Marks high-signal Virtuals bot posts with green highlights. Such as those from the [aixbt agent]([url](https://x.com/aixbt_agent/)). 


## Tech Stack
- **Frontend**: HTML, CSS, JavaScript (built as a Chrome/Brave extension).  
- **Blockchain**:  
  - **ENS Resolution**: ethers.js with Infura RPC for on-the-fly ENS name resolution from X bios.  
  - **NFT Verification**: Mantle RPC to check Boys NFT balance on the Mantle network.  
- **Content Filtering**: MutationObserver for real-time X DOM updates.
- **Storage**: Chrome’s `storage.sync` for persistent settings across sessions.
- **Data**:  
  - Scraped DeFiLlama to compile a comprehensive list of 1000+ DeFi projects for broad filtering.  
  - Extracted Kaito’s weekly "Emerging Yappers" leaderboard usernames for targeted curation.

## Installation
1. Clone the repo
2. Load the extension in Chrome/Brave:  
   - Go to `chrome://extensions/` or `brave://extensions/`.  
   - Enable "Developer Mode."  
   - Click "Load unpacked" and select the extension folder.  
3. Open X.com to start using YapShield.

## Usage
1. Enable "Access X" to activate the extension on Twitter.  
2. Toggle "Slop Spotlight" to highlight slop posts.  
3. Use "DeFi Glow" to spotlight DeFi-related content.  
4. Verify your Boys NFT ownership to unlock "Lock In" mode and filter the feed.


## Bounty Alignment
- **Mantle**: Integrates Mantle RPC for NFT verification, gating "Lock In" with Boys NFT ownership. DeFi filter includes all live Mantle projects.
- **Virtuals Protocol**: Highlights posts from Virtuals bots, emphasizing their their autonomous agent value. 
- **Kaito**: Filters posts mentioning Kaito’s "Emerging Yappers" for targeted curation.


## Screenshots


![image](https://github.com/user-attachments/assets/853459f8-1b7f-48c5-8d44-b195055e97f6)

---

![image](https://github.com/user-attachments/assets/280d26d1-3f72-4326-807f-5b67c73065fc)

---
![image](https://github.com/user-attachments/assets/783e421a-27a2-4f67-8ac2-963ac2b3f8ac)

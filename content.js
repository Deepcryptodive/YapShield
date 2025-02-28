// content.js

// Display mode for slop posts
const SLOP_DISPLAY_MODE = 'highlight'; // Options: 'hide', 'grey', 'highlight'

// Global variables
let EXTENSION_ENABLED = false;
let DEBUG_MODE = false;
let DEFI_MODE_ENABLED = false;
let DEFI_ONLY_FILTER = false;
let DEFI_FILTER_MODE = 'broad'; // Default to 'broad' (All DeFi)
let slopCount = 0;
let totalPosts = 0;
let observer = null;

// Consolidated message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[YapShield] Received message:", message);
  if (message.extensionEnabled !== undefined) {
    EXTENSION_ENABLED = message.extensionEnabled;
    console.log(`[YapShield] Extension enabled: ${EXTENSION_ENABLED}`);
    resetAndReprocess();
  } else if (message.debugMode !== undefined) {
    DEBUG_MODE = message.debugMode;
    console.log(`[YapShield] Debug mode set to: ${DEBUG_MODE}`);
    resetAndReprocess();
  } else if (message.defiModeEnabled !== undefined) {
    DEFI_MODE_ENABLED = message.defiModeEnabled;
    console.log(`[YapShield] DeFi mode enabled: ${DEFI_MODE_ENABLED}`);
    resetAndReprocess();
  } else if (message.defiOnlyFilter !== undefined) {
    DEFI_ONLY_FILTER = message.defiOnlyFilter;
    console.log(`[YapShield] DeFi-only filter set to: ${DEFI_ONLY_FILTER}`);
    resetAndReprocess();
  } else if (message.defiFilterMode) {
    DEFI_FILTER_MODE = message.defiFilterMode;
    console.log(`[YapShield] DeFi filter mode set to: ${DEFI_FILTER_MODE}`);
    resetAndReprocess();
  } else if (message.action === "getSlopScore") {
    const slopScore = totalPosts > 0 ? (slopCount / totalPosts) * 100 : 0;
    sendResponse({ slopScore: slopScore, slopCount: slopCount, totalPosts: totalPosts });
  }
});

// Load initial settings and start observer
chrome.storage.sync.get(["debugMode", "defiModeEnabled", "defiOnlyFilter", "extensionEnabled"], (result) => {
  chrome.storage.sync.set({
    extensionEnabled: false,
    debugMode: false,
    defiModeEnabled: false,
    defiOnlyFilter: false
  }, () => {
    EXTENSION_ENABLED = false;
    DEBUG_MODE = false;
    DEFI_MODE_ENABLED = false;
    DEFI_ONLY_FILTER = false;
    console.log(`[YapShield] Initial settings reset - Debug: ${DEBUG_MODE}, DeFi Mode: ${DEFI_MODE_ENABLED}, DeFi Filter: ${DEFI_ONLY_FILTER}, Enabled: ${EXTENSION_ENABLED}`);
    initObserver();
    resetAndReprocess();
  });
});

// Slop detection (unchanged)
function isSlop(text) {
  let slopWords = [
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
    "contributes to understanding",
    "@kratt_AI",
  ];

  if (DEBUG_MODE) {
    slopWords = slopWords.concat(["web3", "token", "memes", "memecoins"]);
  }

  const lowerText = text.toLowerCase();
  return slopWords.some(w => lowerText.includes(w)) || text.length < 20;
}

// DeFi Keyword Lists
const farmingKeywords = [
  "LP", "yield farming", "auto-compound", "yield", "auto-compounded", "TVL", "liquidity pool",
  "ve33", "ve(3,3)", "x33", "decentralized finance", "APR", "APY", "veToken", "yieldfarm",
  "xSHADOW", "fixed rate", "stables", "stablecoins", "currently farming", "Cryptoyieldinfo",
  "CL", "concentrated liquidity"
];

// Emerging Yappers list (Top 100 Emerging Yappers leaderboard from Kaito)
const emergingYapperKeywords = [
  "@doitbigchicago",
"@stevie_ravioli",
"@ImNotTheWolf",
"@gmnay_",
"@0xFinish",
"@barneyxbt",
"@sjdedic",
"@MonkeyCharts",
"@mteamisloading",
"@0x_ultra",
"@silverfang88",
"@casatay",
"@0xG00gly",
"@Hexen1337",
"@stevenyuntcap",
"@nikokampouris",
"@_FORAB",
"@gauthamzzz",
"@enzo_gte",
"@solo_levelingx",
"@blueclarityone",
"@martypartymusic",
"@yuyue_chris",
"@samcmAU",
"@infinitybanyan",
"@katexbt",
"@aadvark89",
"@TraderNoah",
"@gregthegreek",
"@subinium",
"@AdrianoFeria",
"@btc_charlie",
"@HadickM",
"@Rightsideonly",
"@evilcos",
"@NickPullmanEsq",
"@dxrnelljcl",
"@yashhsm",
"@skarlywarly",
"@emilyxlai",
"@0x0xFeng",
"@ReetikaTrades",
"@redacted_noah",
"@distractedm1nd",
"@1CrypticPoet",
"@fabdarice",
"@0xThaDream",
"@thecryptoskanda",
"@paytkaleiwahea",
"@CryptoTHFC",
"@jason_chen998",
"@solananew",
"@Foxi_xyz",
"@testinprodcap",
"@banditxbt",
"@0xskittles",
"@0xUnicorn",
"@blancxbt",
"@reisnertobias",
"@oldmankotaro",
"@moon_shiesty",
"@ghost93_x",
"@0xLouisT",
"@rbthreek",
"@JW100x",
"@shannholmberg",
"@GracyBitget",
"@GuthixHL",
"@0xGolden_",
"@sparkcsays",
"@CryptosBatman",
"@RasterlyRock",
"@alCamel77",
"@0xalank",
"@blockTVBee",
"@MetamateDaz",
"@greenytrades",
"@berachein",
"@Khallid4397",
"@banterlytics",
"@DogeGirl420",
"@WutalkWu",
"@benafisch",
"@TimHaldorsson",
"@post_polar_",
"@0xyanshu",
"@nichanank",
"@Ice_Frog666666",
"@mia_okx",
"@valardragon",
"@ZeMirch",
"@TheOG_General",
"@KhanAbbas201",
"@0xDith",
"@JBSchweitzer",
"@Steve_4P",
"@riddle245",
"@eli5_defi",
"@ieaturfoods",
"@0xAbhiP"
];

const broadKeywords = [
  "asset-backed", "TVL", "bsdETH", "reserveprotocol", "onchain", "defi", "oracles", "LP",
  "yield farming", "liquidity pool", "decentralized finance", "APR", "APY", "yieldfarm",
  "stables", "stablecoins", "onchain", "currently farming", "Cryptoyieldinfo",
  "Lido","LidoFinance","AAVE V3","aave","WBTC","WrappedBTC","EigenLayer","eigenlayer","Ethena USDe","ethena_labs","Binance Bitcoin","binance","ether.fi Stake","ether_fi","Arbitrum Bridge","arbitrum","Babylon","babylonlabs_io","Pendle","pendle_fi","Binance staked ETH","binance","Base Bridge","BuildOnBase","JustLend","DeFi_JUST","MakerDAO","MakerDAO","Morpho Blue","MorphoLabs","Polygon Bridge & Staking","0xPolygon","Uniswap V3","Uniswap","Portal","portalbridge_","Spark","sparkdotfi","JustCryptos","DeFi_JUST","Royco Protocol","roycoprotocol","Hyperliquid Bridge","HyperliquidX","Optimism Bridge","optimismFND","Coinbase BTC","coinbase","Jito","jito_sol","Maker RWA","MakerDAO","Compound V3","compoundfinance","Curve DEX","CurveFinance","Rocket Pool","Rocket_Pool","Kamino Lend","KaminoFinance","Lombard","Lombard_Finance","Venus Core Pool","VenusProtocol","Jupiter Perpetual Exchange","JupiterExchange","Infrared Finance","InfraredFinance","Kelp","KelpDAO","Uniswap V2","Uniswap","SolvBTC","SolvProtocol","Raydium AMM","RaydiumProtocol","Stargate V2","StargateFinance","Symbiotic","symbioticfi","PancakeSwap AMM","PancakeSwap","Function","FunctionBTC","Usual","usualmoney","mETH Protocol","0xMantle","Kodiak V3","KodiakFi","Hashnote USYC","Hashnote_Labs","Binance Staked SOL","binance","Concrete","ConcreteXYZ","Avalon Finance","avalonfinance_","Ondo Finance","OndoFinance","Sanctum Validator LSTs","sanctumso","Sonic Gateway","SonicLabs","Dolomite","Dolomite_io","SolvBTC LSTs","SolvProtocol","Convex Finance","ConvexFinance","Renzo","RenzoProtocol","Drift Trade","DriftProtocol","Fluid Lending","0xfluid","Merlins Seal","MerlinLayer2","Zircuit Staking","ZircuitL2","Meteora DLMM","MeteoraAG","Cygnus Restake","CygnusFi","Tether Gold","tethergold","Marinade Liquid Staking","MarinadeFinance","BEX","berachain","DeSyn Liquid Strategy","DesynLab","Balancer V2","Balancer","Avalanche Core Bridge","coreapp","Marinade Native","MarinadeFinance","Resolv","ResolvLabs","USDX Money","usdx_money","Eigenpie","Eigenpiexyz_io","ether.fi Vaults","ether_fi","Free Protocol","FreeLayer2","Franklin Templeton","FTI_US","Starknet Bridge","Starknet","Mantle Bridge","0xMantle","Paxos Gold","Paxos","exSat Credit Staking","exSatNetwork","BlackRock BUIDL","BlackRock","Veda","veda_labs","Jupiter Staked SOL","JupiterExchange","PumpBTC","Pumpbtcxyz","Aerodrome Slipstream","aerodromefi","StakeWise V2","stakewise_io","Ronin Bridge","Ronin_Network","Mantle Restaking","0xMantle","Compound V2","compoundfinance","Hyperliquid HLP","HyperliquidX","Stader","staderlabs","Ethereal","etherealdex","PancakeSwap AMM V3","PancakeSwap","Cian Bera","CIAN_protocol","SUNSwap V1","DeFi_JUST","Avalon USDa","avalonfinance_","Core Bitcoin Bridge","@avax","UniRouter","UniRouterBTC","Noble","noble_xyz","Tornado Cash","TornadoCash","Kernel","kernel_dao","Aura","aurafinance","slisBNB","LISTA_DAO","Karak","Karak_Network","AAVE V2","aave","ether.fi Liquid","ether_fi","Rainbow Bridge","auroraisnear","Lightning Network","Bedrock uniBTC","Bedrock_DeFi","lisUSD","LISTA_DAO","tBTC","TheTNetwork","StakeStone Berachain Vault","Stake_Stone","Swell L2 Farm","swellnetworkio","Beraborrow","beraborrow","Suilend","suilendprotocol","CIAN Yield Layer","CIAN_protocol","xDAI Stake Bridge","gnosischain","Bitlayer Bridge","BitlayerLabs","Blast Bridge","Blast_L2","GMX V2 Perps","GMX_IO","Coinbase Wrapped Staked ETH","coinbase","zkSync Era txBridge","txSync_io","Nexus BTC","Matrixport_EN","World Chain","worldcoin","Elixir","elixir","BounceBit CeDeFi Yield","bounce_bit","Mellow LRT","mellowprotocol","Benqi Lending","BenqiFinance","Linea Bridge","LineaBuild","NAVI Lending","navi_protocol","Aries Markets","AriesMarkets","Aerodrome V1","aerodromefi","B2 Buzz","BSquaredNetwork","Euler V2","eulerfinance","SatLayer","satlayer","Pell Network","Pell_Network","UNCX Network V2","UNCX_token","StakeStone STONE","Stake_Stone","dYdX V4","dYdX","Liquity V1","LiquityProtocol","Frax Ether","fraxfinance","Treehouse Protocol","TreehouseFi","Beefy","beefyfinance","Stacks sBTC","Stacks","Liquid Collective","liquid_col","Coinwind","coinwind_com","Morpho AaveV3","MorphoLabs","Save","solendprotocol","RSK Bridge","rootstock_io","Coffer Network","CofferNetwork","Orca","orca_so","Lombard Vault","Lombard_Finance","SUNSwap V2","DeFi_JUST","BounceBit Staking","bounce_bit","Lorenzo enzoBTC","LorenzoProtocol","Tonstakers LSD","tonstakers","DeSyn Safe","DesynLab","Reserve Protocol","reserveprotocol","Buzz Farming","BSquaredNetwork","Fraxtal","fraxfinance","Defi Saver","DefiSaver","Hive Protocol","BsquaredNetwork","Echo Lending","EchoProtocol_","Echo Bridge","EchoProtocol_","SUNSwap V3","DeFi_JUST","Kamino Liquidity","KaminoFinance","Benqi Staked Avax","BenqiFinance","Lisk Bridge","LiskHQ","Silo V2","SiloFinance","Metis Bridge","MetisDAO","Spectra V2","spectra_finance","The Vault","thevaultfinance","Amnis Finance","AmnisFinance","marginfi Lending","marginfi","Yearn Finance","yearnfi","BitFi Basis","Bitfi_Org","Corn Kernels","use_corn","BitFi BTC","Bitfi_Org","Mezo Network","MezoNetwork","Axelar","axelarnetwork","PinkSale","pinkecosystem","VVS Standard","VVS_finance","Puffer Finance","puffer_finance","Spiko","Spiko_finance","Dinero (pxETH)","dinero_xyz","Summer.fi Pro","summerfinance_","Lorenzo","LorenzoProtocol","Nexus Mutual","NexusMutual","Sophon Farm","sophon","IBC","IBCProtocol","SoSoValue Basis","SoSoValueCrypto","BlazeStake","solblaze_org","Superstate USTB","superstatefunds","JPool","JPoolSolana","exSat Bridge","exSatNetwork","Gain","KelpDAO","Cetus AMM","CetusProtocol","BounceBit Premium","bounce_bit","TruStake","TruFinProtocol","Equilibria","Equilibriafi","Flexa","amptoken","OpenEden","OpenEden_Labs","Echelon Market","EchelonMarket","ObeliskBTC","Oblisk_NodeDAO","Thorchain Lending","THORChain","SpringSui","springsui_","Hyperliquid Spot Orderbook","HyperliquidX","RealT Tokens","RealTPlatform","Scroll Bridge","Scroll_ZKP","Moonwell","MoonwellDeFi","Scallop Lend","Scallop_io","SushiSwap","SushiSwap","Tectonic","TectonicFi","Thorchain","THORChain","Solayer Restaking","solayer_labs","Instadapp Lite","Instadapp","Connext","ConnextNetwork","PulseX V1","PulseXcom","Upshift","upshift_fi","Flamincome","flamincome","Astherus asBNB","AstherusHub","Haedal Protocol","HaedalProtocol","iBTC Finance","KiKi_Finance","Swell Liquid Staking","swellnetworkio","Superform","superformxyz","GLIF","glifio","Colend Protocol","colend_xyz","Across","AcrossProtocol","Avalon CeDeFi","avalonfinance_","Meteora vaults","MeteoraAG","SuiBridge","SuiNetwork","Manta Pacific","MantaNetwork","M0","m0foundation","Burrow","burrow_finance","Manta CeDeFi","MantaNetwork","AILayer farm","AILayerXYZ","Polymarket","PolymarketHQ","crvUSD","CurveFinance","Swell Liquid Restaking","swellnetworkio","Sophon Bridge","sophon","iZiSwap","izumi_Finance","Rings","Rings_Protocol","Lulo","uselulo","Bybit Staked SOL","Bybit_Web3","Edgevana","edgevana","Enzyme Finance","enzymefinance","Chiliz Governance Staking","Chiliz","Anzen V2","AnzenFinance","Shadow Exchange CLMM","ShadowOnSonic","Yei Finance","YeiFinance","MoneyOnChain","moneyonchainok","Pulsechain","pulsechaincom","PulseChain Bridge","PulsechainCom","Sumer.money","SumerMoney","Sanctum Infinity","sanctumso","Lolik Liquid Staking","StakeDAO","StakeDAOHQ","EOS REX","EosNFoundation","Swell Earn","swellnetworkio","Polygon zkEVM Bridge","0xPolygonLabs","Beets LST","beets_fi","Multichain","MultichainOrg","Chakra","ChakraChain","Synthetix V3","synthetix_io","VaultCraft","VaultCraft_io","Gravity","GravityChain","Stride","stride_zone","BitFLUX","BitFluxFi","Astherus USDF","AstherusHub","Cygnus Finance","CygnusFi","Team Finance","TeamFinance_","Stargate V1","StargateFinance","zkLink Nova","zkLink_Official","Astar dApps Staking","AstarNetwork","ZeroLend","zerolendxyz","Ethena USDtb","ethena_labs","Babypie","Babypiexyz_io","gALGO Liquid Governance","FolksFinance","Drift Staked SOL","DriftProtocol","Derive V2","derivexyz","PulseX V2","PulseXcom","StakeStone SBTC","Stake_Stone","Syrup.fi","syrupfi","GMX V1","GMX_IO","MorpheusAI","MorpheusAIs","Taiko Bridge","taikoxyz","Uniswap V4","Uniswap","Katana DEX","AxieInfinity","LiNEAR Protocol","LinearProtocol","Libre Capital","librecap","Crypto.com Staked ETH","cryptocom","Synthetix","synthetix_io","sDAI","XRPL DEX","RippleXDev","Extra Finance Leverage Farming","extrafi_io","b14g","b14g_network","Meta Pool Near","meta_pool","Origin Ether","OriginProtocol","Volo","volo_sui","Verus Market","VerusCoin","Aera","aerafinance","Homora V2","Alpha_HomoraV2","Arrakis V1","ArrakisFinance","Helius Staked SOL","heliuslabs","Fuel Bridge","fuel_network","Mento","MentoLabs","Bedrock brBTC","Bedrock_DeFi","Quickswap Dex","QuickswapDEX","Camelot V3","CamelotDEX","SaucerSwap","SaucerSwapLabs","Synapse","SynapseProtocol","Liqwid","liqwidfinance","Seamless Protocol","SeamlessFi","Balancer V3","Balancer","Minswap","MinswapDEX","Fragmetric","fragmetric","Inverse Finance FiRM","InverseFinance","Railgun","railgun_project","Gearbox","GearboxProtocol","fx Protocol","protocol_fx","Merchant Moe Liquidity Book","MerchantMoe_xyz","Superstate USCC","superstatefunds","Thala LSD","ThalaLabs","Fraxlend","fraxfinance","Ring Few","ProtocolRing","Meteora pools","MeteoraAG","Joe V2.2","LFJ_gg","Zest","ZestProtocol","InceptionLRT (Isolated Restaking)","InceptionLRT","Unit","hyperunit","Osmosis DEX","osmosiszone","cBridge","CelerNetwork","stake.link liquid","stakedotlink","ICHI","ichifoundation","Hatom Lending","HatomProtocol","Nest Staking","NestStaking","Sygma","buildwithsygma","Abracadabra Spell","MIM_Spell","Agni Finance","Agnidex","Eclipse Bridge","EclipseFND","Bwatch","Folks Finance Lending","FolksFinance","stUSDT","stusdtio","BOB Bridge","build_on_bob","StackingDAO","StackingDao","Bifrost Liquid Staking","Bifrost","Level","levelusd","Sanctum Reserve","sanctumso","NEOPIN Staking","NeopinOfficial","Bluefin AMM","bluefinapp","INIT Capital","InitCapital_","Vertex Perps","vertex_protocol","Tranchess Yield","tranchess","Mitosis","MitosisOrg","Knightrade","KnightradeTeam","Mountain Protocol","MountainUSDM","Bedrock uniETH","Bedrock_DeFi","Penpie","Penpiexyz_io","Kava Lend","hard_protocol","PayCash","PayCashTweet","SyncSwap","syncswap","Kava Mint","KAVA_CHAIN","Neutral Trade","TradeNeutral","Cellana Finance","CellanaFinance","STON.fi","ston_fi","Poly Network","PolyNetwork2","Lofty","lofty_ai","Orby Network","OrbyNetwork","Tokemak","TokemakXYZ","Hydration","hydration_net","Indigo","Indigo_protocol","vfat.io","vfat_io","Veno Finance","VenoFinance","SiloStake","Silo_Stake","Gravity Bridge","gravity_bridge","Bucket CDP","bucket_protocol","Velodrome V2","VelodromeFi","MerlinSwap","MerlinSwap","Theo Network","TheoNetwork_","NodeDAO","Node_DAO","UNCX Network V3","UNCX_token","KiloEx","KiloEx_perp","alloBTC","allo_xyz","Sygnum FIUSD Liquidity Fund","sygnumofficial","Abacus","AbacusFi","Aevo Perps","aevoxyz","zkSync Lite Bridge","zksync","Lorenzo stBTC","LorenzoProtocol","Sovryn Zero","SovrynBTC","Index Coop","indexcoop","Set Protocol","SetProtocol","Parasail","parasailnetwork","Ref Finance","finance_ref","Alchemix","AlchemixFi","Contango V2","Contango_xyz","SPL Governance","realms_daos","Nucleus","nucleusearn","Tangible RWA","tangibleDAO","TakoTako","Flux Finance","FluxDeFi","SwapX Algebra","SwapXfi","LayerBank","LayerBankFi","Ekubo","EkuboProtocol","Curve LlamaLend","CurveFinance","dYdX V3","dYdX","TermFinance","term_labs","Nostra Money Market","nostrafinance","Paradex","tradeparadex","Blur Bids","blur_io","IDEX V1","idexio","Wrapped","WrappedFi","UwU Lend","UwU_Lend","Zircuit","ZircuitL2","Joe DEX","LFJ_gg","Loopring","loopringorg","Ouchi Finance","OuchiFinance","Ankr","ankr","Hatom Liquid Staking","HatomProtocol","ApeX Pro","OfficialApeXdex","SynFutures V3","SynFuturesDefi","Gyroscope Protocol","GyroStable","DxSale","dxsale","AlphaFi Agg","AlphaFiSUI","Kyros","KyrosFi","Lagoon","lagoon_finance","Abstract","AbstractChain","Beets DEX","beets_fi","ThalaSwap V2","ThalaLabs","Lazy Summer Protocol","summerfinance_","Manta Atlantic Stake","MantaNetwork","Anemoy Capital","anemoycapital","Quickswap V3","QuickswapDEX","WEMIX.FI Staking","WemixNetwork","Storm Trade","storm_trade_ton","bemo","bemo_finance","Pando Leaf","pando_im","APX Finance","APX_Finance","Silo V1","SiloFinance","Gamma","GammaStrategies","JustStables","DeFi_JUST","Bancor V3","Bancor","VenomStake","EVAA Protocol","evaaprotocol","Orbit Bridge","Orbit_Chain","RSS3 Bridge","rss3_","Angle","AngleProtocol","Joe V2.1","LFJ_gg","PancakeSwap StableSwap","PancakeSwap","RateX","RateX_Dex","Particle DUO","particle_trade","Aftermath afSUI","AftermathFi","dHEDGE","dHedgeOrg","Reti Pooling","txnlab","Thala CDP","ThalaLabs","Idle","idlefinance","Noon","noon_capital","Injective Bridge","injective_","Arbitrum Nova Bridge","arbitrum","Astroport","astroport_fi","Outcome Finance","0xOutcome","Alpaca Leveraged Yield Farming","AlpacaFinance","Thruster V3","ThrusterFi","Blur Lending","blur_io","Cronos zkEVM Bridge","cronos_chain","LiquidSwap","PontemNetwork","Rumpel Labs","RumpelLabs","Origin Sonic","OriginProtocol","Smilee Finance gBERA","SmileeFinance","WAGMI","wagmicom","Gains Network","GainsNetwork_io","Pharaoh CL","PharaohExchange","pSTAKE BTC","pStakeFinance","WOOFi Earn","_WOOFi","Meso Finance","Meso_Finance","LiquidLoans","liquidloansio","Sommelier","sommfinance","Hand of God","HandofGodSonic","FlokiFi Locker","FlokiFi","Allbridge Core","Allbridge_io","OpenTrade","opentrade_io","Superposition","superp_fi","Lair Finance","LairFinance","Arrakis V2","ArrakisFinance","marginfi LST","marginfi","Badger DAO","BadgerDAO","Youves","youves_com","Zoth ZeUSD","zothdotio","Cytonic Airdrop Campaign","cytonic_com","GoGoPool","GoGoPool_","MatrixDock","Cakepie","Cakepiexyz_io","Clearpool TPOOL","ClearpoolFin","bitSmiley","bitsmiley_labs","AlphaFi stSUI","stSUI_AlphaFi","Chain Fusion","dfinity","Liquity V2","LiquityProtocol","BitU Protocol","BitU_Protocol","FrankenCoin","frankencoinzchf","Yield Yak Aggregator","yieldyak_","Stakee","THENA FUSION","ThenaFi_","Bonzo Finance","bonzo_finance","Aftermath AMM","AftermathFi","Kriya AMM","KriyaDEX","Kai Finance","kai_finance_sui","Hop Protocol","HopProtocol","Dexalot Portfolio","dexalot","Kinetix Derivatives","KinetixFi","Maverick V2","mavprotocol","MIM Swap","MIMSwap","Octus Bridge","OctusBridge","Acala Liquid Staking","AcalaNetwork","ThalaSwap","ThalaLabs","Morpho Aave","MorphoLabs","Beets DEX V3","beets_fi","SushiSwap V3","SushiSwap","Overnight Finance","overnight_fi","Frax Swap","fraxfinance","Soneium Bridge","soneium","YieldNest","yieldnestFi","Lifinity V2","Lifinity_io","Vectis Finance","vectis_finance","Proxy","BTC_proxy","DeGate","DeGateDex","Toros","torosfinance","Wasabi","wasabi_protocol","Djed Stablecoin","DjedAlliance","Helix Perp","HelixApp_","Amphor","Amphor_io","Ink Bridge","inkonchain","Kava Earn","KAVA_CHAIN","Kava Liquid","KAVA_CHAIN","Tinyman","tinymanorg","ImmutableX","Immutable","Vesper","VesperFi","Dragon Swap V3","dragonswap_dex","BTCFi CDP","Bifrost_Network","Vesta Equity","vestaequityvpm","SX Rollup Bridge","SX_Network","Immutable zkEVM","Immutable","Hydro Protocol","hydro_fi","Sovryn Dex","SovrynBTC","BackedFi","BackedFi","Vesu","vesuxyz","Reya DEX","reya_xyz","Splash Protocol","splashprotocol","Mars Lend","mars_protocol","DeDust","dedust_io","ioTube","iotube_org","Shadow Exchange Legacy","ShadowOnSonic","Mendi Finance","MendiFinance","xExchange","xExchangeApp","BendDAO APE Staking","BendDAO","Gondi V3","gondixyz","Morph Bridge","Morphl2","Midas RWA","MidasRWA","ALEX","@ALEXLabBTC","Hourglass","hourglasshq","Unichain Bridge","unichain","Drop","Dropdotmoney","Button Tranche","ButtonDeFi","Aptin Finance V2","AptinLabs","Hatom TAO Bridge","HatomProtocol","Alpaca Finance 2.0","AlpacaFinance","Serum","ProjectSerum","Satoshi Protocol","Satoshi_BTCFi","STFIL","stfil_io","Bluefin Perps","bluefinapp","Perena","Perena__","Surf Protocol","surf_protocol","Hegic","HegicOptions","SoSoValue Indexes","SoSoValueCrypto","XLink","XLinkbtc","DODO AMM","BreederDodo","Fathom CDP","Fathom_fi","Jellyverse","jlyvrs","Concentrator","0xconcentrator","Maple RWA","maplefinance","FluxBeam","FluxBeamDEX","Carrot","DeFiCarrot","Sceptre Liquid","SceptreLS","Parcl V3","Parcl","Balancer CoW AMM","Balancer","POWERCITY Earn Protocol","POWERCITYio","Pico Staked SOL","pico__sol","Mode Bridge","modenetwork","Adrena Protocol","AdrenaProtocol","Harvest Finance","harvest_finance","NX Finance","NX_Finance","Fulcrom Perps","FulcromFinance","GETH","GuardaWallet","Kinza Finance","kinzafinance","Origin ARM","OriginProtocol","Factorial","FactorialFi","MUX Perps","muxprotocol","Ring Swap","ProtocolRing","Trustin Finance","TrustIn_Finance","DeepBook V3","DeepBookonSui","K2","Karak_Network","Republic Note","republicnote","Zora Bridge","zora","Camelot V2","CamelotDEX","Maya Protocol","Maya_Protocol","Iron Bank","ibdotxyz","ACryptoS","acryptosdao","PoolTogether V5","PoolTogether_","Chainge Finance","FinanceChainge","Latch","UseLatch","Gravita Protocol","gravitaprotocol","Lenfi","LenfiOfficial","Optim Finance","OptimFi","Chainflip","Chainflip","Saber","thesaberdao","MethLab","methlabxyz","NeoBurger","NeoBurger_io","Deri V4","DeriProtocol","Sorare Bridge","sorare","Increment Swap","incrementfi","WaterNeuron","WaterNeuron","VNX","VNX_Platform","Orderly Perps","OrderlyNetwork","Deepr Finance","DeeprFinance","D2 Finance","D2_Finance","Bucket Farm","bucket_protocol","Beradrome","beradrome","Quarry","quarryprotocol","EOS RAM","EOSNetworkFDN","Solayer USD","solayer_labs","Bancor V2.1","Bancor","Alien Base V2","AlienBaseDEX","Service Nervous Systems","dfinity","xALGO Liquid Staking","FolksFinance","ShibaSwap","ShibaSwapDEX","Adrastea LRT","AdrasteaFinance","Inverse Finance Frontier","InverseFinance","Reservoir Protocol","__reservoir","Swell BTC LRT","swellnetworkio","SpookySwap V2","SpookySwap","Stream Finance","StreamDefi","ComTech Gold","ComTechOfficial","Koi Finance CL","koi_finance","Wing Finance","Wing_Finance","Brickken","Brickken","pNetwork","pNetworkDeFi","Exponent","ExponentFinance","Venus Isolated Pools","VenusProtocol","DigiFT","DigiFTTech","BulbaSwap V3","BulbaSwap","Thetanuts Finance","ThetanutsFi","LumenSwap","lumenswap","ExinPool","Belt Finance","BELT_Finance","Astherus asBTC","AstherusHub","Balancer V1","Balancer","REX Staking","EOSauthority","FxDAO","FxDAO_io","Acala LCDOT","AcalaNetwork","MuesliSwap","MuesliSwapTeam","Bifrost Dex","bifrost_finance","Blitz Perps","tradeonblitz","Tensorplex","TensorplexLabs","Goose","GoldenGoose_app","Avantis","avantisfinance","Alien Base V3","AlienBaseDEX","Metronome Synth","MetronomeDAO","Endurance Bridge","fusionistio","Juice Finance","Juice_Finance","GlowSwap","glow_swap","Impermax Finance","ImpermaxFinance","CORE Bridge","Coredao_Org","Juicebox V1","juiceboxETH","Stability","stabilitydao","FlashTrade","FlashTrade_","Strike","StrikeFinance","QiDao","QiDaoProtocol","Verio","verio_story","Origami Finance","origami_fi","DefiBox","DefiboxOfficial","Astherus Perps","AstherusHub","Sailor","SailorFi","DeltaPrime","DeltaPrimeDefi","AAVE V1","aave","Kyo Finance","kyofinance","Balanced Exchange","BalancedDeFi","MilkyWay Zone","milky_way_zone","Ambient","ambient_finance","Nuls","Nuls","Hatom TAO Liquid Staking","HatomProtocol","Lendle","lendlexyz","Acala Euphrates","AcalaNetwork","Turbos","Turbos_finance","HiveSwap V3","hiveswap_io","Parallel Protocol","ParallelMoney","Blackwing","blackwing_fi","WOOFi Swap","_WOOFi","Astrol","AstrolFinance","NerveBridge","nerve_network","Parrot Protocol","gopartyparrot","Fenix Concentrated Liquidity","FenixFinance","CrossCurve (by EYWA)","eywaprotocol","UTONIC","UTONIC_uTON","Symbiosis","symbiosis_fi","Notional V3","NotionalFinance","SundaeSwap V3","SundaeSwap","BounceBit Easy","bounce_bit","King Protocol","thekingprotocol","Reflexer","reflexerfinance","Pharaoh Legacy","PharaohExchange","Elysium Bridge","Elysium_VF","SteakHut Liquidity","steakhut_fi","CLever","0xC_Lever","Kriya CLMM","KriyaDEX","SATOSHI PERPS","SatoshiAppXYZ","Ferro","FerroProtocol","Everdex","SparkDEX V3.1","SparkDexAI","ABC Pool","ABCpospool","Apex Omni","OfficialApeXdex","Awaken Swap","AwakenSwap","Swellchain Bridge","swellnetworkio","Francium","Francium_Defi","H2 Finance V2","H2_Finance","RosSwap","RosSwapdex","Solv Funds","SolvProtocol","Ribbon","ribbonfinance","Sturdy V2","SturdyFinance","Aktionariat","aktionariat","GRVT","grvt_io","HMX","HMXorg","Yay!","Yay_Global","DragonSwap V3","dgswap","MYX Finance","MYX_Finance","Kinetic","Kinetic_Markets","Sushi Aptos","SushiSwap","ApeSwap AMM","ApeBond","Swappi","SwappiDEX","Biswap V2","Biswap_Dex","Joule Finance","JouleFinance","Mole","moledefi","Pando Rings","pando_im","Keep3r Network","thekeep3r","Aquarius Stellar","aqua_token","Rain.fi","RainFi_","ICPSwap","ICPSwap","Blend Pools","Autofarm","autofarmnetwork","StellaSwap V4","StellaSwap","Garden","garden_finance","ReactorFusion","ReactorFusionR","Origin Dollar","OriginProtocol","Manta MYield","CedefiYield","WingRiders","wingriderscom","NFTX","NFTX_","Factor Leverage Vault","Factor_fi","Bonk Staked SOL","bonk_inu","Llama Airforce","0xAlunara","THENA V1","ThenaFi_","unagiswap","Unagi_Swap","Neptune Finance","neptune_finance","SwapX V2","SwapXfi","Basin Exchange","basinexchange","ShardingDAO","ShardingDAO","Velodrome V3","VelodromeFi","Alephium Bridge","alephium","Capybara Dexs","CapybaraDEX","Hinkal","hinkal_protocol","Bedrock uniIOTX","Bedrock_DeFi","Kraken Bitcoin","krakenfx","Umami Finance","UmamiDao","Allbridge Classic","Allbridge_io","IPOR Fusion","ipor_io","Phoenix","PhoenixTrade","DeltaSwap","GammaSwapLabs","SakeFinance","sakefinance","KittyPunch PunchSwap","KittyPunchXYZ","Zeta","ZetaMarkets","DOOAR","Dooarofficial","Metropolis DLMM","MetropolisDEX","Hyperlock Finance","hyperlockfi","Levana Perps","Levana_protocol","Lybra V2","LybraFinanceLSD","Nostra Pools","nostrafinance","Charm Finance V2","CharmFinance","BiFi","BiFi_lending","Hover","hover_market","Allstake","allstake_fi","Unleash Protocol","UnleashProtocol","Flamingo Finance","FlamingoFinance","Cyberperp","cyberperp","Increment Liquid Staking","IncrementFi","Artemis Finance","Artemisfinance","Meta Pool stIP","meta_pool","Tenderize V2","tenderize_me","rhino.fi","rhinofi","bitCow","bitCow_AMM","Typus DOV","TypusFinance","Kayen Protocol","KAYEN_Protocol","KlaySwap V1","KLAYswap","Eggs Finance","eggsonsonic","Maple","maplefinance","Aurora Plus","auroraisnear","Pickle","picklefinance","KittyPunch StableKitty","KittyPunchXYZ","Bitflow","Bitflow_Finance","Endur","endurfi","9mm V3","9mm_pro","Steer Protocol","steerprotocol","Shoebill V2","ShoebillFinance","Typus Safu","TypusFinance","Teller","useteller","SFT Protocol","SFTProtocol","Swaap Maker V2","SwaapFinance","Threshold thUSD","ThresholdUSD","HeliSwap","HeliSwap_DEX","Lynex V2","LynexFi","Polynomial Liquidity","PolynomialFi","Increment Lending","incrementfi","Swapscanner LSD","Swapscanner","Asymmetry Finance","asymmetryfin","Core Earn","Coredao_Org","BendDAO Lending","BendDAO","Folks Finance xChain","FolksFinance","Pit Finance","Pit_Finance","sICX","helloiconworld","SpringSui Ecosystem","springsui_","Vires Finance","viresfinance","cVault Finance","CORE_Vault","Dexalot DEX","dexalot","MiaSwap","MiaSwap","Messina Bridge","MessinaOne","Sirius","Sirius_Coin","Waves Exchange","WXNetwork","Radpie","Radpiexyz_io","Thruster V2","ThrusterFi","Wombat Exchange","WombatExchange","WEMIX Concentrated Range Deposit","WemixNetwork","Arkadiko","ArkadikoFinance","Gud.Tech","gudtech_ai","IPOR Derivatives","ipor_io","Tropykus RSK","tropykus","Dinari","DinariGlobal","Yelay V2","YieldLayer","Unitus","unitusfi","SPOT Cash","AmpleforthOrg","Boba Bridge","bobanetwork","Rari Capital","RariCapital","Mimo","mimoprotocol","Jones DAO","DAOJonesOptions","Stafi","StaFi_Protocol","ArthSwap V2","arthswap","Bunni V2","bunni_xyz","Arkis","ArkisXYZ","The Idols","TheIdolsNFT","RIF ON CHAIN","rifonchain","Web3.world","w3w_exchange","USK","TeamKujira","IntentX","IntentX_","Sphere Finance","SphereDeFi","xWin Finance","xwinfinance","ChainPort","chain_port","Pangolin","pangolindex","eBTC Protocol","eBTCprotocol","Meld Gold","meldgold","PHUX","PHUXGiven","PoolTogether V3","PoolTogether_","Polynomial Trade","PolynomialFi","Uniswap V1","Uniswap","Segment Finance","segment_fi","DYAD","0xDYAD","Balanced Dollar","BalancedDeFi","Wan Bridge","wanchain_org","Phiat Protocol","phiatcrypto","IOLEND","iolendfi","Aztec","aztecnetwork","KordFi","kord_fi","Ease.org","EaseDeFi","Zkfair","ZKFCommunity","Invariant","invariant_labs","BlueMove DEX","BlueMove_OA","Arcadia V2","ArcadiaFi","DeSyn Basis Trading","DesynLab","StaQ","StaQ_io","Conic Finance","ConicFinance","Native Lend","native_fi","Soroswap","SoroswapFinance","Nile CL","NileExchange","Hashport","HashportNetwork","Swaylend","swaylend","InfinityPools","Infpools","Merkle Trade","merkle_trade","Wrapped BNB","Stable Jack","StableJack_xyz","Sanko Bridge","SankoGameCorp","Suzaku","SuzakuNetwork","Hakka Finance","hakkafinance","Pirex","redactedcartel","DoubleUp","doubleup_app","Tarot","TarotFinance","9inch V2","9inch_io","FstSwap","FstSwapbright","MetalX Swap","MetalXApp","Equalizer Exchange","Equalizer0x","Azuro","azuroprotocol","ShadeSwap","Shade_Protocol","SolanaHub Staked SOL","SolanaHubApp","Pact","pact_fi","Synatra","synatraxyz","PoWH3D","PoWH3D","Filet Finance","Filet_finance","Zero Network","zerodotnetwork","Peapods Finance","PeapodsFinance","Blueshift","blueshiftfi","Ostium","OstiumLabs","KLAYstation","Orbit_Chain","Hermetica USDh","HermeticaFi","Baseline Protocol","BaselineMarkets","ViteX","ViteXExchange","Hord","HordApp","Polynomial Bridge","PolynomialFi","Sushi BentoBox","SushiSwap","Gnosis Protocol v1","gnosisPM","AnyHedge","AnyHedge","HawkFi","HawksightCo","DFS Network","dfsdeveloper","Clipper","Clipper_DEX","Canto Lending","CantoPublic","Elara","ElaraLabs","Vaultka","Vaultkaofficial","Solidly V3","SolidlyLabs","Navigator","NaviExSonic","Powercity Flex Protocol","POWERCITYio","RabbitX","rabbitx_io","Aurus","AurusOfficial","DeepLock","deeplockio","MagicSea LB","MagicSeaDEX","BSCSwap","Helix Spot","HelixApp_","VenomBridge","VenomBridge","Sunny","SunnyAggregator","edgeX","edgeX_exchange","Dyson","dyson_money","MineFi","MineFiDAO","Mangrove","MangroveDAO","Hot Cross","hotcrosscom","Reservoir Tools CLMM","reservoir0x","Prime Staking","PrimeNumbersFi","Sovryn Bridge","SovrynBTC","MANTRA Swap","MANTRA_Chain","1inch Network","1inch","Skate Fi","Range_Protocol","3F Mutual","HakkaFinance","Tetu Earn","tetu_io","Frax","fraxfinance","Opyn Gamma","opyn_","Nirvana V2","nirvana_fi","Exactly","ExactlyProtocol","Momodrome","momodrome_io","WEMIX on Kroma","kroma_network","Mutuari","FlowX V2","FlowX_finance","AquaBera","aqua_bera","Sovryn Lend","SovrynBTC","Macaron AMM","macarondex","zkSwap StableSwap","zkSwap_finance","Pencils Protocol","pencilsprotocol","HbarSuite","HbarSuite","BakerySwap","bakery_swap","PiperX V3","PiperxProtocol","CaviarNine Shape Liquidity","CaviarNine","Metastable","MetaStables","MetalX Dex","MetalXApp","Echo Liquid Staking","EchoProtocol_","Kodiak V2","KodiakFi","Glyph V4","glyph_exchange","ZKSwap","ZKSwapOfficial","Nomad","nomadxyz_","Quoll","QuollFinance","Kinetix AMM V3","KinetixFi","SmarDex","SmarDex","VyFinance Dex","VyFiOfficial","White Whale Dex","WhiteWhaleDefi","B.Protocol","bprotocoleth","BurrBear","moneygoesburr","BulbaSwap V2","BulbaSwap","HERE Wallet staking","here_wallet","YieldFlow","yieldflowdotcom","AlgoRai Finance","AlgoRai_finance","FilFi","filfi_io","ApeChain Bridge","apecoin","Fortunafi","_Fortunafi","KongSwap","kongswap","Biswap V3","Biswap_Dex","Omega","omega_infra","Universe XYZ","universe_xyz","LISA","LisaLab_BTC","Reservoir Tools AMM","reservoir0x","FIN","TeamKujira","Jasper Vault","jaspervault","Bunny","PancakeBunnyFin","Estate Protocol","EstateProtocol","ICDex","ICLighthouse",
     "mantle", "@mantleofficial", "mantle staked ether", "meth", "@mantletreasury","0xmantle", "Bybit","Bybit_Official","Pendle","pendle_fi","Uniswap V3","Uniswap","Compound V3","compoundfinance","Curve DEX","CurveFinance","Bitkub","BitkubOfficial","SolvBTC","SolvProtocol","Stargate V2","StargateFinance","Ondo Finance","OndoFinance","Dolomite","Dolomite_io","PumpBTC","Pumpbtcxyz","Avalon USDa","avalonfinance_","Karak","Karak_Network","Bedrock uniBTC","Bedrock_DeFi","Bitrue","BitrueOfficial","Pell Network","Pell_Network","Treehouse Protocol","TreehouseFi","Beefy","beefyfinance","Axelar","axelarnetwork","Equilibria","Equilibriafi","iZiSwap","izumi_Finance","Stargate V1","StargateFinance","zkLink Nova","zkLink_Official","Merchant Moe Liquidity Book","MerchantMoe_xyz","ICHI","ichifoundation","Agni Finance","Agnidex","INIT Capital","InitCapital_","Vertex Perps","vertex_protocol","Mitosis","MitosisOrg","vfat.io","vfat_io","Abacus","AbacusFi","ApeX Pro","OfficialApeXdex","Gamma","GammaStrategies","WOOFi Earn","_WOOFi","Yield Yak Aggregator","yieldyak_","Hourglass","hourglasshq","DODO AMM","BreederDodo","Kinza Finance","kinzafinance","Gravita Protocol","gravitaprotocol","MethLab","methlabxyz","Orderly Perps","OrderlyNetwork","Impermax Finance","ImpermaxFinance","Lendle","lendlexyz","WOOFi Swap","_WOOFi","CrossCurve (by EYWA)","eywaprotocol","Symbiosis","symbiosis_fi","Apex Omni","OfficialApeXdex","Solv Funds","SolvProtocol","Steer Protocol","steerprotocol","Teller","useteller","Swaap Maker V2","SwaapFinance","IntentX","IntentX_","Native Lend","native_fi","Clipper","Clipper_DEX","Skate Fi","Range_Protocol","Omega","omega_infra","Meson","mesonfi","Teahouse Permissionless","TeahouseFinance","Stryke CLAMM","stryke_xyz","XY Finance","xyfinance","Butter Network","ButterNetworkio","Native Swap","native_fi","KTX Perps","KTX_finance","Merchant Moe DEX","MerchantMoe_xyz","Minterest","Minterest","TsunamiX","TsunamiFinance_","Clearpool Lending","ClearpoolFin","Solv RWA","SolvProtocol","AirPuff","airpuff_io","DefiEdge","DefiEdge","Graphene by Velocimeter","VelocimeterDEX","LogX V2","LogX_trade","Lynx","Lynx_Protocol","Circuit Protocol","circuitprotocol","Timeswap V2","TimeswapLabs","Cleopatra CL","CleopatraDEX","Cleopatra Legacy","CleopatraDEX","MYSO V2","MysoFinance","Swapsicle V2","SwapsicleDEX","MUFEX","Mufex_Official","Aurelius","AureliusFi","FusionX V3","FusionX_Finance","Bella Protocol","BellaProtocol","Velocimeter V2","VelocimeterDEX","Puff Penthouse","puff_drgn","fan.tech","joinfantech","PWN","pwndao","FerdyFlip","ferdyfishh","Stratum Exchange","stratumexchange","Altitude","AltitudeDeFi","Butter.xyz","butterexchange","Starmaker","starmakerzksync","FusionX V2","FusionX_Finance","Rivera Money","Rivera_Money_","Archly V2","ArchlyFinance","Chat3","chat3one","PredX Ai","PredX_AI","Pulsar Swap","PulsarSwap","TropicalSwap","tropical_swap","MantleSwap","MantleSwap","LogX V1","LogX_trade","Ammos Finance","Ammosfinance","Nexter","NexterDotFi","Crust V2","CrustFinance","Galador","galadorfi","Crust V1","CrustFinance","FCON DEX","Aboard Exchange","AboardExchange","Jadeswap","JadeSwapFi","RubyDex","Ruby_Dex","Esper Finance","EsperFinance","Reax Swaps","ReaxFinance","Muito Finance","muitofinance","Reax Lending","ReaxFinance","Reax Assets","ReaxFinance"
];

function isDeFiPost(text) {
  const lowerText = text.toLowerCase();
  let activeKeywords;

  switch (DEFI_FILTER_MODE) {
    case 'farming':
      activeKeywords = farmingKeywords;
      break;
    case 'emerging':
      activeKeywords = emergingYapperKeywords;
      break;
    case 'broad':
      activeKeywords = broadKeywords;
      break;
    default:
      activeKeywords = farmingKeywords; // Fallback to farming
  }

  return activeKeywords.some(keyword => lowerText.includes(keyword));
}

// Virtual Agent detection (unchanged)
function isVirtualAgentPost(text) {
  const virtualAgents = [
    "@AcolytAI", "@luna_virtuals", "@Vader_AI_", "@sekoia_virtuals", "@convo_virtuals",
    "@aixbt_agent", "@OrangemanAI", "@zaara_ai", "@AntiRugAgent", "@mobyagent",
    "@gemxbt_agent", "@ultronai_agent", "@rugdoctor_krain", "@HeyTracyAI",
    "@CallsignCharlie", "@FractalAgent_", "@Agentlosers", "@agentKnows",
    "@TradeTideAI", "@kizunaagent", "@AgentSpacely"
  ];
  const lowerText = text.toLowerCase();
  return virtualAgents.some(agent => lowerText.includes(agent));
}

// Styling functions (unchanged)
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

// Post checking logic (unchanged except for sending slopCount)
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

// Observer and reset functions (unchanged)
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
    console.log('✅ YapShield initialized ✅');
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

// Progress bar functions (unchanged)
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

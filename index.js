const {
  PROVIDERS,
  FILTERS,
  ADDRESS,
  CONTRACTS,
  ETHERSCAN,
  ABI,
} = require("./constants");
const Discord = require("discord.js");

const { MessageEmbed } = require("discord.js");
const ethers = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

const { Client, Intents } = require("discord.js");
const client = new Discord.Client({
  partials: ["CHANNEL"],
  intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"],
});

const TESTCHANNEL = "932504732818362378";
let testingChannel;

client.once("ready", async () => {
  console.log("Ready!");
  testingChannel = client.channels.cache.get(TESTCHANNEL);

  await go();
});

const assetInfo = async (asset, chain) => {
    try{
  const tokenContract = new ethers.Contract(asset, ABI.ERC20, PROVIDERS[chain]);
  const symbol = await tokenContract.symbol();
  const decimals = await tokenContract.decimals();
  const price = await CONTRACTS[chain].PRICEFEED.fetchPrice(asset);
  return { symbol, decimals, price };
} catch (error) {
    console.error("Error in assetInfo():", error.message);
}
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const newVesselEmbed = (vesselData) => {
  const vEmbed = new MessageEmbed()
    .setColor("#b06dfc")
    .setTitle("New vessel opened on " + vesselData.chain)
    .setURL(`${ETHERSCAN[vesselData.chain]}/tx/${vesselData.txHash}`)
    // .setDescription("Collateral `"+formatNumber(vesselData.collateral,vesselData.decimals)+" " + vesselData.symbol  +"`\n" + "Debt `"+formatNumber(vesselData.debt,18)+" GRAI`\nLTV `"+vesselData.ltv.toFixed(2)+"%`")
    .setDescription(
      "`" +
        formatNumber(vesselData.collateral, vesselData.decimals) +
        "` " +
        vesselData.symbol +
        " Collateral\n`" +
        formatNumber(vesselData.debt, 18) +
        "` GRAI Debt\n`" +
        vesselData.ltv.toFixed(2) +
        "%` LTV"
    );
  //"Stake `"+formatNumber(vesselData.stake,18)+"`\n"

  return vEmbed;
};

const formatNumber = (number, decimals) => {
  const scaledNumber = number / Math.pow(10, decimals);
  const fixedNum = parseFloat(scaledNumber).toFixed(2);
  let [integerPart, decimalPart] = fixedNum.split(".");
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${integerPart}.${decimalPart}`;
};

async function go() {
try{
  if (!testingChannel) {
    throw new Error("Testing channel is not defined.");
  }

  // testingChannel.send('test msg');

  const activePool = await CONTRACTS[
    "ETHEREUM"
  ].VESSEL_MANAGER_OPERATIONS.activePool();
try{
  PROVIDERS["ETHEREUM"].on(
    FILTERS["ETHEREUM"].VESSEL_CREATED,
    async (vesselCreated) => {
      console.log(vesselCreated);
      const vessel = await processCreated(vesselCreated, "ETHEREUM");
      console.log(vessel);
      testingChannel.send({ embeds: [newVesselEmbed(vessel)] });
    }
  );
} catch (error) {
    console.error("Error in ETHEREUM VESSEL_CREATED event:", error.message);
}
try{
  PROVIDERS["ARBITRUM"].on(
    FILTERS["ARBITRUM"].VESSEL_CREATED,
    async (vesselCreated) => {
      console.log("arb", vesselCreated);
      const vessel = await processCreated(vesselCreated, "ARBITRUM");
      console.log(vessel);
      testingChannel.send({ embeds: [newVesselEmbed(vessel)] });
    }
  );
} catch (error) {
    console.error("Error in ARBITRUM VESSEL_CREATED event:", error.message);
}

  //console.log("active pool", activePool);

  // await delay(10000);
} catch (error) {
    console.error("Error in go():", error.message);
}
}

async function processCreated(log, chain) {
  let asset = ethers.utils.defaultAbiCoder.decode(["address"], log.topics[1]);
  asset = asset[0];
  //console.log("asset", asset);

  let borrower = ethers.utils.defaultAbiCoder.decode(
    ["address"],
    log.topics[2]
  );
  borrower = borrower[0];
  //console.log("borrower", borrower);

  const vessels = await CONTRACTS[chain].VESSEL_MANAGER.Vessels(
    borrower,
    asset
  );
  // console.log("vessels", vessels);
  const { symbol, decimals, price } = await assetInfo(asset, chain);
  const collateralValue =
    parseFloat(ethers.utils.formatUnits(vessels[1], decimals)) *
    parseFloat(ethers.utils.formatUnits(price, decimals));

  const debtFormatted = ethers.utils.formatUnits(vessels[0], 18);
  const ltv = parseFloat(debtFormatted) / collateralValue;
  const ltvPercentage = ltv * 100;

  const vesselInfo = {
    debt: vessels[0].toString(),
    collateral: vessels[1].toString(),
    stake: vessels[2].toString(),
    chain: chain,
    asset: asset,
    borrower: borrower,
    txHash: log.transactionHash,
    symbol: symbol,
    decimals: decimals,
    price: price.toString(),
    ltv: ltvPercentage,
  };

  return vesselInfo;
}

client.login(process.env.BOT_KEY);

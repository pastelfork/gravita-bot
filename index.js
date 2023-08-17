const {
  PROVIDERS,
  FILTERS,
  ADDRESS,
  CONTRACTS,
  ETHERSCAN,
  ABI,
} = require("./constants");
const Discord = require("discord.js");

const { newVesselEmbed, liquidationEmbed } = require('./embeds');

const ethers = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

const { Client, Intents } = require("discord.js");
const client = new Discord.Client({
  partials: ["CHANNEL"],
  intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"],
});

const SUPPORTED_CHAINS = ["ETHEREUM", "ARBITRUM"];

const TESTCHANNEL = "932504732818362378";
let testingChannel;

const VESSEL_MANAGER_INTERFACE = new ethers.utils.Interface(ABI.VESSEL_MANAGER_OPERATIONS)

client.once("ready", async () => {
  console.log("Gravita BOT Ready!");
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

const eventHandlers = {
  VESSEL_CREATED: async (event, chain) => {
    console.log(`${chain} vessel created `, event);
    const vessel = await processCreated(event, chain);
    console.log(vessel);
    testingChannel.send({ embeds: [newVesselEmbed(vessel)] });
  },
  LIQUIDATION: async (event, chain) => {
    console.log(`${chain} liquidation`, event);
    const liq = await processLiquidated(event, chain);
    console.log(liq);
    testingChannel.send({ embeds: [liquidationEmbed(liq)] });
  },
  REDEMPTION: async (event, chain) => {
    console.log(`${chain} redemption`, event);
    const redeemed = await processRedeemed(event, chain);
    console.log(redeemed);
    // testingChannel.send({ embeds: [redeemedEmbed(redeemed)] });
  }
};

// const delay = (ms) => new Promise((res) => setTimeout(res, ms));
async function go() {
  try {
      if (!testingChannel) {
          throw new Error("Testing channel is not defined.");
      }

      // Loop through each supported chain
      SUPPORTED_CHAINS.forEach((chain) => {
          
          // Loop through each event present in the eventHandlers object
          Object.keys(eventHandlers).forEach((event) => {
              try {
                  PROVIDERS[chain].on(FILTERS[chain][event], async (log) => {
                      await eventHandlers[event](log, chain);
                  });
              } catch (error) {
                  console.error(`Error in ${chain} ${event} event:`, error.message);
              }
          });
      });
  } catch (error) {
      console.error("Error in go():", error.message);
  }
}

async function processRedeemed(log, chain) {
  console.log("processing redeemed", log);
  
  const parsedLog = VESSEL_MANAGER_INTERFACE.parseLog(log);
  console.log("redemption parsed", parsedLog);
  
  // const asset = parsedLog.args._asset;
  
  // const { symbol, decimals, price } = await assetInfo(asset, chain);
  
  // const liquidatedDebt = ethers.utils.formatUnits(parsedLog.args._liquidatedDebt, 18);
  // const debtTokenGasCompensation = ethers.utils.formatUnits(parsedLog.args._debtTokenGasCompensation, 18);
  // const liquidatedColl = ethers.utils.formatUnits(parsedLog.args._liquidatedColl, decimals);
  // const collGasCompensation = ethers.utils.formatUnits(parsedLog.args._collGasCompensation, decimals);

  // const liquidationInfo = {
  //     asset: asset,
  //     txHash: log.transactionHash,
  //     chain: chain,
  //     symbol: symbol,
  //     decimals: decimals,
  //     price: price,
  //     liquidatedDebt: liquidatedDebt,
  //     debtTokenGasCompensation: debtTokenGasCompensation,
  //     liquidatedColl: liquidatedColl,
  //     collGasCompensation: collGasCompensation
  // };
  
  // return liquidationInfo;
}

async function processLiquidated(log, chain) {
  console.log("processing liquidated", log);
  
  const parsedLog = VESSEL_MANAGER_INTERFACE.parseLog(log);
  console.log("liquidation parsed", parsedLog);
  
  const asset = parsedLog.args._asset;
  
  const { symbol, decimals, price } = await assetInfo(asset, chain);
  
  const liquidatedDebt = ethers.utils.formatUnits(parsedLog.args._liquidatedDebt, 18);
  const debtTokenGasCompensation = ethers.utils.formatUnits(parsedLog.args._debtTokenGasCompensation, 18);
  const liquidatedColl = ethers.utils.formatUnits(parsedLog.args._liquidatedColl, decimals);
  const collGasCompensation = ethers.utils.formatUnits(parsedLog.args._collGasCompensation, decimals);
  const collateralValue =
    parseFloat(liquidatedColl) *
    parseFloat(ethers.utils.formatUnits(price, decimals));
  const ltv = parseFloat(liquidatedDebt) / collateralValue
  const ltvpercentage = ltv * 100

  const liquidationInfo = {
      asset: asset,
      txHash: log.transactionHash,
      chain: chain,
      symbol: symbol,
      decimals: decimals,
      price: price,
      liquidatedDebt: liquidatedDebt,
      debtTokenGasCompensation: debtTokenGasCompensation,
      liquidatedColl: liquidatedColl,
      collGasCompensation: collGasCompensation,
      ltv: ltvpercentage
  };
  
  return liquidationInfo;
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

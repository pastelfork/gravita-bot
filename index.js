const { PROVIDERS, FILTERS, ADDRESS, CONTRACTS, ETHERSCAN } = require("./constants");
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

const TESTCHANNEL = '932504732818362378';
let testingChannel;

client.once("ready", async () => {
    console.log("Ready!");
    testingChannel = client.channels.cache.get(TESTCHANNEL);

    await go();
});

const assetSymbol = (asset,chain) => { 
for (let token of ADDRESS[chain].TOKENS) {
      if (token.ADDRESS.toLowerCase() === asset.toLowerCase()) {
        return token.NAME;
      }
    }
return "n/a"
}

const delay = ms => new Promise(res => setTimeout(res, ms));
const newVesselEmbed = (vesselData) => {
const vEmbed = new MessageEmbed()
          .setColor("#b06dfc")
          .setTitle("New vessel opened on "+vesselData.chain)
	.setURL(`${ETHERSCAN[vesselData.chain]}/tx/${vesselData.txHash}`)
.setDescription("Collateral `"+formatNumber(vesselData.collateral,18)+assetSymbol(vesselData.asset,vesselData.chain) +"`\n" + "Debt `"+formatNumber(vesselData.debt,18)+" GRAI`"+"Collateral `")

//"Stake `"+formatNumber(vesselData.stake,18)+"`\n"
          

return vEmbed
}

const formatNumber = (number, decimals) => {
    const scaledNumber = number / Math.pow(10, decimals);
    const fixedNum = parseFloat(scaledNumber).toFixed(2);
    let [integerPart, decimalPart] = fixedNum.split('.');
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${integerPart}.${decimalPart}`;
};

async function go() {
    if (!testingChannel) {
        throw new Error("Testing channel is not defined.");
    }

     testingChannel.send('test');

    
    const activePool = await CONTRACTS["ETHEREUM"].VESSEL_MANAGER_OPERATIONS.activePool();

    PROVIDERS["ETHEREUM"].on(FILTERS["ETHEREUM"].VESSEL_CREATED, async (vesselCreated) => {
        console.log(vesselCreated);
        const vessel = await processCreated(vesselCreated, "ETHEREUM");
        console.log(vessel);
        testingChannel.send({ embeds: [newVesselEmbed(vessel)]});

    });

    PROVIDERS["ARBITRUM"].on(FILTERS["ARBITRUM"].VESSEL_CREATED, async (vesselCreated) => {
        console.log("arb", vesselCreated);
        const vessel = await processCreated(vesselCreated, "ARBITRUM");
        console.log(vessel);
        testingChannel.send({ embeds: [newVesselEmbed(vessel)]});
    });

    console.log("active pool", activePool);

    await delay(10000);
}

async function processCreated(log, chain) {
    let asset = ethers.utils.defaultAbiCoder.decode(["address"], log.topics[1]);
    asset = asset[0]    
console.log("asset", asset);

    let borrower = ethers.utils.defaultAbiCoder.decode(["address"], log.topics[2]);
    borrower = borrower[0]    
console.log("borrower", borrower);

    const vessels = await CONTRACTS[chain].VESSEL_MANAGER.Vessels(borrower,asset);
    console.log("vessels", vessels);

    const vesselInfo = {
        debt: vessels[0].toString(),
        collateral: vessels[1].toString(),
        stake: vessels[2].toString(),
        chain: chain,
        asset: asset,
        borrower: borrower,
        txHash: log.transactionHash
    };
    
    return vesselInfo;
}

client.login(process.env.BOT_KEY);

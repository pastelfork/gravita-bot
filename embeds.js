const { MessageEmbed } = require("discord.js");
const { ETHERSCAN } = require("./constants");
const  Emoji  = require("./emojis.js");
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const formatNumber = (number, decimals) => {
  const scaledNumber = number / Math.pow(10, decimals);
  const fixedNum = parseFloat(scaledNumber).toFixed(2);
  let [integerPart, decimalPart] = fixedNum.split(".");
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${integerPart}.${decimalPart}`;
};

const newVesselEmbed = (vesselData) => {
  const vEmbed = new MessageEmbed()
    .setTitle(Emoji("vessel") + " New vessel opened")
    .setColor("#b06dfc")
    .setDescription(
      "["+vesselData.borrower.substring(0,6) + "](" + `https://debank.com/profile/${vesselData.borrower}` + ") opened on [" + 
      capitalizeFirstLetter(vesselData.chain) + 
      "](" + `${ETHERSCAN[vesselData.chain]}/tx/${vesselData.txHash}` + ")"
    )
    .addField(
      vesselData.symbol,
      formatNumber(vesselData.collateral, vesselData.decimals),
      true 
    )
    .addField(
      "GRAI Debt",
      formatNumber(vesselData.debt, 18),
      true 
    )
    .addField(
      "LTV",
      vesselData.ltv.toFixed(2) + "%",
      true
    )
    .addField(
      "Timestamp",
        "<t:"+ vesselData.timestamp +":R> " + "(<t:" + vesselData.timestamp +":f>)");

  return vEmbed;
};

const liquidationEmbed = (liquidationData) => {
  try {
    // Checking for required properties in liquidationData
    if (!liquidationData || !liquidationData.symbol || !liquidationData.chain || !liquidationData.txHash) {
      console.error("Error: Missing required properties in liquidationData:", liquidationData);
      return null;
    }

    const vEmbed = new MessageEmbed()
      .setColor("#b06dfc")
      .setTitle("New " + liquidationData.symbol + " liquidation on " + capitalizeFirstLetter(liquidationData.chain))
      .setURL(`${ETHERSCAN[liquidationData.chain]}/tx/${liquidationData.txHash}`)
      .setDescription(  
          "`$" + (liquidationData.price/1e18).toFixed(2) + "` " + liquidationData.symbol + " \n" +
          "`" + liquidationData.liquidatedColl.toFixed(2) + "` " + liquidationData.symbol + " liquidated\n" +
          "`" + liquidationData.liquidatedDebt.toFixed(2) + "` GRAI debt\n" +
          "`" + liquidationData.ltv.toFixed(2) + "%` LTV\n" +
          "`" + liquidationData.debtTokenGasCompensation.toFixed(2) + "` GRAI to liquidator\n" +
          "`" + liquidationData.collGasCompensation.toFixed(2) + "` " + liquidationData.symbol + " to liquidator"
      );
    return vEmbed;

  } catch (error) {
    console.error("Error in liquidationEmbed:", error);
    return null;
  }
}

const redeemedEmbed = (redemptionData) => {
  try {
    // Checking for required properties in redemption
    if (!redemptionData || !redemptionData.symbol || !redemptionData.chain || !redemptionData.txHash) {
      console.error("Error: Missing required properties in redemptionData:", redemptionData);
      return null;
    }


    const vEmbed = new MessageEmbed()
      .setColor("#f7ab1a")
      .setTitle(Emoji("pepeCry") + " New redemption")
      .setDescription("["+redemptionData.sender.substring(0,6) + "](" + `https://debank.com/profile/${redemptionData.sender}` + ") redeemed on [" + capitalizeFirstLetter(redemptionData.chain) + "]("+`${ETHERSCAN[redemptionData.chain]}/tx/${redemptionData.txHash}`+")")
      .addField(
        redemptionData.symbol + " Price",
        "$" + (redemptionData.price/1e18).toFixed(2),
        true 
      )
       .addField(
      redemptionData.symbol,
      parseFloat(redemptionData.collSent).toFixed(2),
      true 
    )
 .addField(
      redemptionData.symbol + " Fee",
        parseFloat(redemptionData.collFee).toFixed(2),
true     
    )
      .addField(
        "GRAI Debt",
        parseFloat(redemptionData.actualDebtAmount).toFixed(2) 
      )
    .addField(
      "Timestamp",
        "<t:"+ redemptionData.timestamp +":R> " + "(<t:" + redemptionData.timestamp +":f>)");

    return vEmbed;

  } catch (error) {
    console.error("Error in redemption Embed:", error);
    return null;
  }
}



module.exports = {
  newVesselEmbed,
  liquidationEmbed,
  redeemedEmbed

};



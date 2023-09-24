const { MessageEmbed } = require("discord.js");
const { ETHERSCAN } = require("./constants");


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
    .setColor("#b06dfc")
    .setTitle("New vessel opened on " + capitalizeFirstLetter(vesselData.chain))
    .setURL(`${ETHERSCAN[vesselData.chain]}/tx/${vesselData.txHash}`)
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
      .setColor("#b06dfc")
      .setTitle("New " + redemptionData.symbol + " redemption on " + capitalizeFirstLetter(redemptionData.chain))
      .setURL(`${ETHERSCAN[redemptionData.chain]}/tx/${redemptionData.txHash}`)
      .setDescription(  
          "`$" + (redemptionData.price/1e18).toFixed(2) + "` " + redemptionData.symbol + " \n" +
          "`" + redemptionData.attemptedDebtAmount.toFixed(2) + "` attempted GRAI \n" + 
          "`" + redemptionData.actualDebtAmount.toFixed(2) + "` actual GRAI \n" +
          "`" + redemptionData.collSent.toFixed(2) + "` "+ redemptionData.symbol +" sent\n" +
          "`" + redemptionData.collFee.toFixed(2) + "` "+ redemptionData.symbol + " fee\n" 
          // "`" + redemptionData.collGasCompensation.toFixed(2) + "` " + redemptionData.symbol + " to redeemer"
      );
    return vEmbed;

  } catch (error) {
    console.error("Error in redemption Embed:", error);
    return null;
  }
}



/*const liquidationEmbed = (liquidationData) => {
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
}
*/
module.exports = {
  newVesselEmbed,
  liquidationEmbed,
  redeemedEmbed

};



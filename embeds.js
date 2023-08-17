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

module.exports = {
  newVesselEmbed,
  liquidationEmbed
};



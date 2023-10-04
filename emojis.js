const vessel = "989110966543343616"
const pepeCry = "1104058128082927616"
    module.exports = function Emoji(name) {
        if (name === "vessel") {
            return "<:Vessel:" + vessel + ">";
        }
      else if (name === "pepeCry") {
           return "<:3930cryheathug:" + pepeCry+ ">";
       }
      else return null
   }

 

const vessel = "989110966543343616"
const pepeCry = "1104058128082927616"
const rip = "1159180193664094248"

    module.exports = function Emoji(name) {
        if (name === "vessel") {
            return "<:Vessel:" + vessel + ">";
        }
      else if (name === "pepeCry") {
           return "<:3930cryheathug:" + pepeCry+ ">";
       }
      else if (name === "rip") {
           return "<:RIP:" + rip + ">";
      }
      else return null
   }

 

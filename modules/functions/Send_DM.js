//CHOOSE NEXT BOT AND SEND EMBED
//const ratelimit = require('../base/ratelimit.js');
module.exports = (MAIN, guild_id, user_id, content, embed, bot) => {
  if(!MAIN.BOTS[bot]) { bot = 0; }
  let guild = MAIN.BOTS[bot].guilds.cache.get(guild_id);
  let member = guild.members.cache.get(user_id);
  MAIN.Rate_Limit(MAIN, guild_id, user_id);
  if(!member){ return; }
  return member.send(content, embed).catch( error => {
    if(error.code == 'ECONNRESET'){
      return console.error('[Send_DM] ['+MAIN.Bot_Time(null,'stamp')+'] ['+user_id+'] Error Code ',error.code);
    }else{
      return console.error('[Send_DM] ['+MAIN.Bot_Time(null,'stamp')+'] ['+user_id+'] ['+MAIN.BOTS[bot].id+'] ',error);
    }
  });
}

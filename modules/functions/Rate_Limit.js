const NodeCache = require('node-cache');
const myCache = new NodeCache( { stdTTL: 60 } );
const Discord = require('discord.js');
module.exports = (MAIN, guild_id, user_id) => {
  let count = myCache.get(user_id);
  if (count == undefined) {
	  myCache.set(user_id, 1);
	  count = 1;
	  return;
  }
  else if(count <= MAIN.config.Rate_Limit) {
	  const ttl = myCache.getTtl(user_id);
	  myCache.set(user_id, count + 1, Math.floor((ttl - Date.now()) / 1000));
	  return;
  }
  else {
	  myCache.del(user_id);
	  MAIN.pdb.query('UPDATE users SET status = \'PAUSED\'	where user_id = '+ user_id, function(err, baduser, fields) {
		  if(err){ console.error(err) };
		  let guild = MAIN.BOTS[1].guilds.cache.get(guild_id);
		  let member = guild.members.cache.get(user_id);
		  if(!member){ return; }
		  let content = '';
		  let warn_embed = new Discord.MessageEmbed()
		  .setColor('ff0000')
		  .addField('Oops!','Sorry, you have received over 10 subscriptions over the past minute and your subscriptions are now paused. Please remove some subscriptions before starting your subscriptions again or they will get paused again. Thanks!', true);
		  return member.send(content, warn_embed).catch( error => {
    			if(error.code == 'ECONNRESET'){
      				return console.error('[Send_DM] ['+MAIN.Bot_Time(null,'stamp')+'] ['+user_id+'] Error Code ',error.code);
    			}else{
      				return console.error('[Send_DM] ['+MAIN.Bot_Time(null,'stamp')+'] ['+user_id+'] ['+MAIN.BOTS[1].id+'] ',error);
    			}
		  });
	  });
  }
}	 

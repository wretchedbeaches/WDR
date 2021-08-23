// CHOOSE NEXT BOT AND SEND EMBED
module.exports = async (MAIN, type, server, content, embed, channel_id) => {
  if(!MAIN.BOTS){ return console.error('BOTS aren\'t active or problem finding any BOTS.'); }
  if(!MAIN.Next_Bot){ MAIN.Next_Bot = 0; }
  if(MAIN.Next_Bot == MAIN.BOTS.length-1 && MAIN.BOTS[0]){ MAIN.Next_Bot = 0; } else{ MAIN.Next_Bot++; }
  // GET BOT TO SEND MESSAGE ATTEMPT Next_Bot THEN MAIN IF undefined.
  let channel = MAIN.BOTS[MAIN.Next_Bot].channels.cache.get(channel_id) ? MAIN.BOTS[MAIN.Next_Bot].channels.cache.get(channel_id) : MAIN.channels.cache.get(channel_id);
  if(!channel) { return console.error('Problem finding channel: '+channel_id+' using Bot: '+MAIN.Next_Bot); }
  let channel_name = type.boss ? type.boss+type.form : type.name+type.form;
  if(content && !type.boss){ channel_name += ' in '+type.area+', '+type.mins+'min'; }

  // DELETE OLD WEBHOOKS
  let hooks = await channel.fetchWebhooks();
  if(hooks.size > 8){
    hooks.forEach(async webhook => { await webhook.delete(); });
  }

  //SEND DISCORD WEBHOOK
	return channel.createWebhook(channel_name, type.sprite).then( async webhook => {
    await webhook.send(content, embed);
    await webhook.delete();
  }).catch( error => {
    if(error == 'Error: 404 Not Found'){
      // IGNORE 404 ERROR, means nothing.
    } else if(error.code == 'ECONNRESET'){
      return console.error('[Send_Webhook] ['+MAIN.Bot_Time(null,'stamp')+'] ['+channel_id+'] Error Code '+error.code);
    } else {
      return console.error('[Send_Webhook] ['+MAIN.Bot_Time(null,'stamp')+'] ['+channel_id+'] ['+MAIN.BOTS[MAIN.Next_Bot]+'] '+error);
    }
  });
  return;
}

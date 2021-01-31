const { exec } = require('child_process');

module.exports.run = async (MAIN, message, prefix, discord) => {

  let convert_message = '';

  exec('git pull', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }
    let log = '';
    if(stdout){log = `stdout: ${stdout}`}
    if(stderr){log += `\nstderr: ${stderr}`}
    let botRestart = log.indexOf('Already up to date') < 0 ? true : false;
    let restart = botRestart ? ', and restarting in 8sec.' : '.';

    if(MAIN.config.log_channel){
      let pull_embed = new MAIN.Discord.MessageEmbed()
      .setColor('00ff00')
      .setAuthor('Pulling update'+restart)
      .setDescription(log);

      if(message.channel.type == 'dm'){
        message.channel.send(pull_embed).catch(console.error);
      }
      else if(discord.spam_channels.indexOf(message.channel.id) >= 0){
        MAIN.Send_Embed(MAIN, 'chart', 0, discord, '', pull_embed, message.channel.id);
      }
      else {
        // CHECK IF THE TARGET IS A USER
        let guild = MAIN.guilds.cache.get(discord.id);
        let member = guild.members.cache.get(message.author.id);
        if(!member){ return; }
        member.send(pull_embed).catch(console.error);
      }

    if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && message && message.channel.type != 'dm'){ message.delete(); }
    } else { console.log(MAIN.Color.green+log+MAIN.Color.reset); }

    setTimeout(async function() {
      if(botRestart){
        return MAIN.restart('due to an update.', 0);
      } else{ return; }
    }, 8000);

  });

}

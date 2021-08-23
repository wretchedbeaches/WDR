const Discord = require('discord.js');

module.exports.run = async (MAIN, message, prefix, discord) => {

  let pokemon_embed = new Discord.MessageEmbed()
      .setColor('000044')
      .setTitle('Pokemon Channels:');

  MAIN.Pokemon_Channels.forEach((pokemon_channel,index) => {

    // DEFINE FILTER VARIABLES
    let channel = MAIN.channels.cache.get(pokemon_channel[0]);
    let geofences = pokemon_channel[1].geofences.split(',');
    //let filter = MAIN.Filters.get(pokemon_channel[1].filter);
    let embed = pokemon_channel[1].embed ? pokemon_channel[1].embed : 'Default';
    let webhook = pokemon_channel[1].webhook ? pokemon_channel[1].webhook : 'false';
    let role = channel.guild.roles.cache.get(pokemon_channel[1].roleid);
    if(!role){ role = 'None'; }

    pokemon_embed.addField('**'+pokemon_channel[0]+'**','Channel Name: '+channel
                                        +'\nGeofences: '+geofences
                                        +'\nFilter: '+JSON.stringify(pokemon_channel[1].filter)
                                        +'\nEmbed: '+embed
                                        +'\nWebhook Enabled: '+webhook
                                        +'\nRole Tagged: '+role);
    if(pokemon_embed.fields.length > 24){
      message.channel.send(pokemon_embed).catch(console.error);
      pokemon_embed.fields = [];
    }
  });
  if(pokemon_embed.fields.length > 0){
    return message.channel.send(pokemon_embed).catch(console.error);
  } else{
    return;
  }
}

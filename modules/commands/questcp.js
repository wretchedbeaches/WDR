const GeoTz = require('geo-tz');
const Send_Nest = require('../embeds/nests.js');
const InsideGeojson = require('point-in-geopolygon');
const pvp = require('../base/pvp.js');

module.exports.run = async (MAIN, message, prefix, discord) => {

  // GET USER NICKNAME
  let nickname = '';
  if(message.member){
    if(message.member.nickname){ nickname = message.member.nickname; } else{ nickname = message.member.user.username; }
  } else{
    nickname = message.author.username;
  }

  let requestAction = new MAIN.Discord.MessageEmbed()
  .setAuthor(nickname, message.author.displayAvatarURL)
  .setTitle('What Pokémon do you want a CP search string for?')
  .setFooter('Type the name of desired Poké, no command prefix required.');

  message.channel.send(requestAction).catch(console.error).then( msg => {
    initiate_collector(MAIN, 'start', message, msg, nickname, prefix, discord);
    if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && discord.spam_channels.indexOf(message.channel.id) < 0 && message.channel.type != 'dm' && message){ message.delete(); }
    return;
  });
}

async function pokemon_view(MAIN, message, nickname, pokemon, prefix, discord){
  let pokemon_id = pokemon.pokemon_id, form_id = pokemon.form;
  let locale = await MAIN.Get_Locale(MAIN, pokemon, discord);
  let typing = await MAIN.Get_Typing(MAIN, pokemon, false, discord);

  let result_string = '```', role_id = '';
  let pokemon_name = locale.pokemon_name;
  let pokemon_color = typing.color, level = 15;
  let pokemon_type = typing.type, weaknesses = typing.weaknesses;
  for(var atk = 15; atk >= 13; atk--) {
    for(var def = 15; def >= 13; def--) {
      for(var sta = 15; sta >= 13; sta--) {
        iv_percent = Math.round((atk + def + sta) / 45 * 100);
        result_string += atk+','+def+','+sta+' '+pvp.CalculateCP(MAIN,pokemon_id,form_id,atk,def,sta,level)+' CP '+iv_percent+'%\n';
      }
    }
  }
  result_string += '```';

  // DETERMINE BASE STATS
  if (!MAIN.masterfile.pokemon[pokemon_id].attack) {
    attack = MAIN.masterfile.pokemon[pokemon_id].forms[form_id].attack;
    defense = MAIN.masterfile.pokemon[pokemon_id].forms[form_id].defense;
    stamina = MAIN.masterfile.pokemon[pokemon_id].forms[form_id].stamina;
  } else {
    attack = MAIN.masterfile.pokemon[pokemon_id].attack;
    defense = MAIN.masterfile.pokemon[pokemon_id].defense;
    stamina = MAIN.masterfile.pokemon[pokemon_id].stamina;
  }

  let sprite = await MAIN.Get_Sprite(MAIN, pokemon);
  let chart_embed = new MAIN.Discord.MessageEmbed()
  .setColor(pokemon_color)
  .setThumbnail(sprite)
  .setTitle('**'+pokemon_name+'** Quest CP Chart')
  .setDescription('**(ATK,DEF,STA)\t\t LvL'+level+' CP\t\t%**'+result_string);

  if(message.channel.type == 'dm'){
    return message.channel.send(chart_embed).catch(console.error);
  }
  else if(discord.spam_channels.indexOf(message.channel.id) >= 0){
    return MAIN.Send_Embed(MAIN, 'chart', 0, discord, role_id, chart_embed, message.channel.id);
  } else {
    // CHECK IF THE TARGET IS A USER
    let guild = MAIN.guilds.cache.get(discord.id);
    let member = guild.members.cache.get(message.author.id);
    if(!member){ return; }
    return member.send(chart_embed).catch(console.error);
  }
}

async function initiate_collector(MAIN, source, message, msg, nickname, prefix, discord){
  // DEFINE COLLECTOR AND FILTER
  const filter = cMessage => cMessage.author.id == message.author.id;
  const collector = message.channel.createMessageCollector(filter, { time: 60000 });
  let msg_count = 0;

  // FILTER COLLECT EVENT
  await collector.on('collect', message => {
    if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && discord.spam_channels.indexOf(message.channel.id) < 0 && message.channel.type != 'dm' && message){ message.delete(); }
    let pokemon = message.content.toLowerCase();

    if (pokemon != 'NaN' && pokemon < 809) {
      collector.stop({pokemon_id: pokemon.split(' ')[0], form_id: pokemon.split(' ')[1]});
    }

    let searched = MAIN.Pokemon_ID_Search(MAIN, pokemon);
    if (searched) {
      collector.stop(searched);
    }

    if (pokemon === 'cancel' || pokemon === 'time'){
      collector.stop('cancel');
    } else { collector.stop('retry'); }
  });

  // COLLECTOR HAS BEEN ENDED
  collector.on('end', (collected,reason) => {

    // DELETE ORIGINAL MESSAGE
    msg.delete();
    switch(reason){
      case 'cancel': break;
      case 'time': if(source == 'start'){
        message.reply('Your subscription has timed out.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error);
      } break;
      case 'retry':
      message.reply('Please check your spelling, and retry.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error);
      break;
      default:
      pokemon_view(MAIN, message, nickname, reason, prefix, discord);
    } return;
  });
}

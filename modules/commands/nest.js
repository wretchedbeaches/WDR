const Fuzzy = require('fuzzy');
const GeoTz = require('geo-tz');
const Send_Nest = require('../embeds/nests.js');
const InsideGeojson = require('point-in-geopolygon');

const NEST_G1 = [ 1, 4, 7, 25, 35, 37, 43, 54, 58, 60, 63, 66, 72, 77, 81, 84, 86, 90, 92, 95, 100, 102, 104, 111, 116, 123, 124, 125, 126, 127, 129, 133, 138, 140]
const NEST_G2 = [ 152, 155, 158, 170, 185, 190, 193, 200, 202, 203, 206, 209, 211, 213, 215, 216, 220, 226, 227, 231, 234]
const NEST_G3 = [ 252, 255, 258, 261, 273, 278, 283, 285, 296, 299, 300, 302, 307, 309, 311, 312, 318, 320, 322, 325, 333, 341, 343, 345, 347, 353, 355, 370]
const NEST_G4 = [ 387, 390, 393, 399, 401, 427, 434, 449, 453]
const NEST_G5 = [ 495, 498, 501, 504, 506, 509, 522, 590]

module.exports.run = async (MAIN, message, prefix, discord) => {
  // DECLARE VARIABLES
  let nickname = '', park = '', embed = '';

  // LOAD ALL NESTS WITHIN DISCORD GEOFENCE TO AN ARRAY FOR FUZZY
  let nest_collection = new MAIN.Discord.Collection();
  let available_nests = [];
  await MAIN.park_array.forEach((nest,index) => {
    if(InsideGeojson.polygon(discord.geofence, [nest.lon,nest.lat])){
      available_nests.push(nest.name); nest_collection.set(nest.name, nest);
    }
  });

  if(message.content.split(' ')[1]){
    let searched = MAIN.Pokemon_ID_Search(MAIN, message.content.split(' ')[1]);
    if (searched){
      return pokemon_view(MAIN, message, nickname, searched.pokemon_id, 'ALL',prefix, discord);
    }
  }

  // GET USER NICKNAME
  if(message.member){
    if(message.member.nickname){ nickname = message.member.nickname; } else{ nickname = message.member.user.username; }
  } else{
    nickname = message.author.username;
  }
  let avatar = message.author.displayAvatarURL;

  let requestAction = new MAIN.Discord.MessageEmbed()
    .setAuthor(nickname, avatar)
    .setTitle('What Pokémon or Park do you want to find a nest for?')
    .setFooter('Type the name of desired Poké or Park, no command prefix required.');

  message.channel.send(requestAction).catch(console.error).then( msg => {
      initiate_collector(MAIN, 'start', message, msg, avatar, nickname, prefix, discord, available_nests, nest_collection);
      if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && discord.spam_channels.indexOf(message.channel.id) < 0 && message.channel.type != 'dm' && message){ message.delete(); }
      return;
  });
}

function pokemon_view(MAIN, message, nickname, pokemon_id, search_area, prefix, discord){
  embed = 'nests.js';
  new Promise(async function(resolve, reject) {
    MAIN.pmsf.query(`SELECT * FROM nests WHERE pokemon_id = ?`, [pokemon_id],function (error, nests, fields) {
      if(!nests){
        return message.reply('No known nest, please retry.')
        .then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error);
      }
      let nest_found = false;
      MAIN.asyncForEach(nests, async (nest) => {
        let timezone = GeoTz(discord.geofence[0][1][1], discord.geofence[0][1][0])[0]; discord_match = true;
        area = await MAIN.Get_Area(MAIN, nest.lat,nest.lon, discord).catch(console.log);
        if (area){
          if ((search_area == area.embed || search_area == 'ALL') && (nest.name == 'Unknown Parkname' && nest.pokemon_avg < 2)){
            message.channel.send('Not enough info about nest, check map.')
            .then(m => m.delete({ timeout: 8000, reason: 'It had to be done.' })).catch(console.error);
            nest_found = true;
          }else if (search_area == area.embed || search_area == 'ALL') {
            Send_Nest.run(MAIN, message, nest, discord, area, timezone, embed);
            message.channel.send('Nest sent, check your inbox if not in the channel.')
            .then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error);
            nest_found = true;
          }
        }
      }).then( not => { if (nest_found === false) {
        message.reply('No known nest, please retry.')
        .then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error)
      } })
    })
  });
}

function park_view(MAIN, message, nickname, name, search_area, prefix, discord, available_nests, nest_collection){
  embed = 'nests.js'
  new Promise(async function(resolve, reject) {
    MAIN.pmsf.query(`SELECT * FROM nests WHERE name LIKE ?`, [name],function (error, nests, fields) {
      if(!nests){
        return message.reply('No known nest, please retry.')
        .then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error);
      }
      let nest_found = false;
      MAIN.asyncForEach(nests, async (nest) => {
        let timezone = GeoTz(discord.geofence[0][1][1], discord.geofence[0][1][0])[0]; discord_match = true;
        area = await MAIN.Get_Area(MAIN, nest.lat,nest.lon, discord).catch(console.log);
        if (area){
          if (search_area == area.embed || search_area == 'ALL') {
            Send_Nest.run(MAIN, message, nest, discord, area, timezone, embed);
            message.channel.send('Nest sent, check your inbox if not in the channel.')
            .then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error);
            nest_found = true;
          }
        }
      }).then( not => { if (nest_found === false) {
        message.reply('No known nest, please retry.')
        .then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error)
      } })
      return;
    })
  });
}

async function initiate_collector(MAIN, source, message, msg, avatar, nickname, prefix, discord, available_nests, nest_collection){
  // DEFINE COLLECTOR AND FILTER
  const filter = cMessage => cMessage.author.id == message.author.id;
  const collector = message.channel.createMessageCollector(filter, { time: 60000 });
  let msg_count = 0;

  // FILTER COLLECT EVENT
  await collector.on('collect', message => {
    if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && discord.spam_channels.indexOf(message.channel.id) < 0 && message.channel.type != 'dm' && message){ message.delete(); }
    pokemon = message.content;
    park = message.content;
    let nesting = [...NEST_G1, ...NEST_G2, ...NEST_G3, ...NEST_G4, ...NEST_G5];

    if (pokemon.toLowerCase() === 'cancel' || pokemon.toLowerCase() === 'time'){
      collector.stop('cancel');
    }

    //Pokemon ID Search
    if (pokemon != 'NaN' && pokemon < 809) {
      console.log(nesting.indexOf(pokemon));
      if (nesting.indexOf(parseInt(pokemon)) < 0) {
        collector.stop('non_nesting');
      } else { collector.stop(pokemon); }
    }

    let searched = MAIN.Pokemon_ID_Search(MAIN, pokemon);
    if (searched && searched.pokemon_id && nesting.indexOf(parseInt(searched.pokemon_id)) < 0) {
      collector.stop('non_nesting');
    } else if (searched && searched.pokemon_id) {
      collector.stop(searched.pokemon_id);
    }

    //Park Search
    (async () => {
      let results = Fuzzy.filter(pokemon, available_nests);
      let matches = results.map(function(el) { return el.string; });
      if (matches[0]){
        park = matches[0]
        collector.stop('park');
      } else { collector.stop('retry'); }
    })();

  });

  // COLLECTOR HAS BEEN ENDED
  collector.on('end', async (collected,reason) => {
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
      case 'non_nesting':
        message.reply('Pokémon is not known to nest.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error);
      break;
      case 'park':
        return park_view(MAIN, message, nickname, park, 'ALL', prefix, discord);
      break;
      default:
        return pokemon_view(MAIN, message, nickname, reason, 'ALL',prefix, discord);
    }
    return;
  });
}

const capitalize = (s) => {
 if (typeof s !== 'string') {return '';}
 s = s.toLowerCase();
 return s.charAt(0).toUpperCase() + s.slice(1)
}

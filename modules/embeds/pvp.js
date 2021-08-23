module.exports.run = async (MAIN, target, sighting, internal_value, time_now, area, server, timezone, content, embed, possible_cps) => {
  // RETURN IF NO CP PROVIDED
  if(sighting.cp == null){ return; }

  let Embed_Config = require('../../embeds/'+embed.embed);
  let pokemon_embed = {};

  // CHECK IF THE TARGET IS A USER
  let guild = MAIN.guilds.cache.get(server.id);
  let member = guild.members.cache.get(target.user_id);

  // VARIABLES
  let typing = await MAIN.Get_Typing(MAIN, sighting, embed.webhook, server);
  let pokemon = {
    encounter_id: sighting.encounter_id,
    // POKEMON NAME AND FORM
    name: sighting.locale.pokemon_name,
    form: sighting.locale.form,

    // GET SPRITE IMAGE
    sprite: await MAIN.Get_Sprite(MAIN, sighting),

    // IV INFO
    iv: Math.round(internal_value),
    cp: sighting.cp,
    level: sighting.pokemon_level,
    attack: sighting.individual_attack,
    defense: sighting.individual_defense,
    stamina: sighting.individual_stamina,

    // PVP INFO
    possible_cps: possible_cps,
    pvpString: '', ranks: '',

    // DETERMINE HEIGHT, WEIGHT AND SIZE
    height: Math.floor(sighting.height*100)/100,
    weight: Math.floor(sighting.weight*100)/100,
    size: sighting.size,

    // DETERMIND POKEMON TYPES AND WEAKNESSES
    type: typing.type,
    type_noemoji: typing.type_noemoji,
    color: typing.color,
    weather_boost: '',

    // DETERMINE MOVE NAMES AND TYPES
    move_name_1: sighting.locale.move_1,
    move_type_1: MAIN.emotes[MAIN.masterfile.moves[sighting.move_1].type.toLowerCase()],
    move_name_2: sighting.locale.move_2,
    move_type_2: MAIN.emotes[MAIN.masterfile.moves[sighting.move_2].type.toLowerCase()],

    // DESPAWN VERIFICATION
    verified: sighting.disappear_time_verified ? '✅ ' : '❓ ',

    // DETERMINE DESPAWN TIME
    time: await MAIN.Bot_Time(sighting.disappear_time, '1', timezone),
    mins: Math.floor((sighting.disappear_time-(time_now/1000))/60),
    secs: Math.floor((sighting.disappear_time-(time_now/1000)) - ((Math.floor((sighting.disappear_time-(time_now/1000))/60))*60)),

    // GET LOCATION INFO
    lat: sighting.latitude,
    lon: sighting.longitude,
    area: area.embed,
    map_url: MAIN.config.FRONTEND_URL,

    // MAP LINK PROVIDERS
    google: '[Google]('+await MAIN.Short_URL(MAIN, 'https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude)+')',
    apple: '[Apple]('+await MAIN.Short_URL(MAIN, 'http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=d')+')',
    waze: '[Waze]('+await MAIN.Short_URL(MAIN, 'https://www.waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes')+')',
    pmsf: '[Scan Map]('+await MAIN.Short_URL(MAIN, MAIN.config.FRONTEND_URL+'?lat='+sighting.latitude+'&lon='+sighting.longitude+'&zoom=15')+')',
    rdm: '[Scan Map]('+await MAIN.Short_URL(MAIN, MAIN.config.FRONTEND_URL+'@/'+sighting.latitude+'/'+sighting.longitude+'/15')+')'

    // GET STATIC MAP TILE
  };

  let pokemonbody = await MAIN.Get_Spawn_ID(MAIN, sighting.latitude, sighting.longitude, pokemon.sprite, MAIN.config.Grass_URL);
  pokemon.tile = await MAIN.Post_Tile(MAIN, pokemonbody);


  // GET GENDER
  switch(sighting.gender){
    case 1: pokemon.gender = ' '+MAIN.emotes.male; break;
    case 2: pokemon.gender = ' '+MAIN.emotes.female; break;
    default: pokemon.gender = '';
  }

  // GET WEATHER BOOST
  switch(sighting.weather){
    case 1: pokemon.weather_boost = ' | '+MAIN.emotes.clear+' ***Boosted***'; break;
    case 2: pokemon.weather_boost = ' | '+MAIN.emotes.rain+' ***Boosted***'; break;
    case 3: pokemon.weather_boost = ' | '+MAIN.emotes.partlyCloudy+' ***Boosted***'; break;
    case 4: pokemon.weather_boost = ' | '+MAIN.emotes.cloudy+' ***Boosted***'; break;
    case 5: pokemon.weather_boost = ' | '+MAIN.emotes.windy+' ***Boosted***'; break;
    case 6: pokemon.weather_boost = ' | '+MAIN.emotes.snow+' ***Boosted***'; break;
    case 7: pokemon.weather_boost = ' | '+MAIN.emotes.fog+' ***Boosted***'; break;
  }

  // FULL PVP STRING FOR RANKs, LEVEL AND PERCENT
  for(var pokemon_id in possible_cps){
    pokemon.pvpString += MAIN.masterfile.pokemon[pokemon_id].name+" Level "+possible_cps[pokemon_id].level+" CP "+possible_cps[pokemon_id].cp
    +" \n Rank: "+possible_cps[pokemon_id].rank+"("+possible_cps[pokemon_id].percent+"%)\n";
  } if(!pokemon.pvpString){ console.error('Problem with pvpString '+possible_cps);}

  // PVP RANK AND EVO STRING
  for(var id in possible_cps) {
    pokemon.ranks += ' | Rank '+possible_cps[id].rank+ ' ('+MAIN.masterfile.pokemon[id].name+')';
  } if(!pokemon.ranks){ console.error('Problem with Ranks '+possible_cps);}

  // CREATE AND SEND EMBED
  pokemon_embed = Embed_Config(pokemon);
  send_embed(pokemon.mins);

  function send_embed(minutes){
    if(member){
      if (MAIN.config.TIME_REMAIN_SUBS && minutes < MAIN.config.TIME_REMAIN_SUBS) { return; }
      if(MAIN.debug.PVP == 'ENABLED' && MAIN.debug.Subscriptions == 'ENABLED'){ console.info('['+MAIN.config.BOT_NAME+'] ['+MAIN.Bot_Time(null,'stamp')+'] [EMBEDS] [pvp.js] Sent a '+pokemon.name+' to '+member.user.tag+' ('+member.id+').'); }
      return MAIN.Send_DM(MAIN, server.id, member.id, content, pokemon_embed, target.bot);
    } else if(MAIN.config.POKEMON.Discord_Feeds == 'ENABLED'){
      if(content){ content += ' '+pokemon.name+' in '+area.embed+', '+minutes+'min'}
      if(MAIN.config.TIME_REMAIN && minutes < MAIN.config.TIME_REMAIN) { return; }
      if(MAIN.debug.PVP == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('['+MAIN.config.BOT_NAME+'] ['+MAIN.Bot_Time(null,'stamp')+'] [EMBEDS] [pvp.js] Sent a '+pokemon.name+' to '+target.guild.name+' ('+target.id+').'); }
      return MAIN.Send_Embed(MAIN, 'pokemon', 0, server, content, pokemon_embed, target.id);
    } else{ return; }
  }
}

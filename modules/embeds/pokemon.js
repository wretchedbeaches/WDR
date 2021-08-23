module.exports.run = async (MAIN, has_iv, target, sighting, internal_value, time_now, area, server, timezone, content, embed) => {
  let Embed_Config = require('../../embeds/'+embed.embed);
  let pokemon_embed = {};

  // CHECK IF THE TARGET IS A USER
  let guild = MAIN.guilds.cache.get(server.id);
  let member = guild.members.cache.get(target.user_id);

  // VARIABLES POKEMON NAME, FORM AND TYPE EMOTES
  let typing = await MAIN.Get_Typing(MAIN, sighting, embed.webhook, server);
  let pokemon = {
    name: sighting.locale.pokemon_name,
    form: sighting.locale.form,
    gender: ' ',

    // GET SPRITE IMAGE
    sprite: await MAIN.Get_Sprite(MAIN, sighting),

    // Round IV
    iv: Math.round(internal_value),

    // DETERMIND POKEMON TYPES AND WEAKNESSES
    type: typing.type,
    type_noemoji: typing.type_noemoji,
    color: typing.color,
    weather_boost: ' | ',

    // DESPAWN VERIFICATION
    verified: sighting.disappear_time_verified ? '✅ ' : '❓ ',

    // DETERMINE DESPAWN TIME
    time: await MAIN.Bot_Time(sighting.disappear_time, '1', timezone),
    mins: Math.floor((sighting.disappear_time-(time_now/1000))/60),
    secs: Math.floor((sighting.disappear_time-(time_now/1000)) - ((Math.floor((sighting.disappear_time-(time_now/1000))/60))*60)),

    // SHINY
    shiny: sighting.shiny ? '✨✨' : '',
    username: sighting.username,
    password: sighting.password,
    device: sighting.device,

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


  // IDENTIFY DITTO AND ALTER DISPLAY NAME
  if(sighting.pokemon_id == 132){
    let old = await MAIN.Get_Locale(MAIN, {pokemon_id: sighting.display_pokemon_id}, server);
    pokemon.name += ' ('+old.pokemon_name+')';
  }

  // GET GENDER
  switch(sighting.gender){
    case 1: pokemon.gender += embed.webhook ? MAIN.unicode['Male'] : MAIN.emotes.male; break;
    case 2: pokemon.gender += embed.webhook ? MAIN.unicode['Female'] : MAIN.emotes.female; break;
    default: pokemon.gender = '';
  }

  // GET WEATHER BOOST
  switch(sighting.weather){
    case 1: pokemon.weather_boost += embed.webhook ? MAIN.unicode['Clear'] : MAIN.emotes.clear; break;
    case 2: pokemon.weather_boost += embed.webhook ? MAIN.unicode['Rain'] : MAIN.emotes.rain; break;
    case 3: pokemon.weather_boost += embed.webhook ? MAIN.unicode['PartlyCloudy'] : MAIN.emotes.partlyCloudy; break;
    case 4: pokemon.weather_boost += embed.webhook ? MAIN.unicode['Cloudy'] : MAIN.emotes.cloudy; break;
    case 5: pokemon.weather_boost += embed.webhook ? MAIN.unicode['Windy'] : MAIN.emotes.windy; break;
    case 6: pokemon.weather_boost += embed.webhook ? MAIN.unicode['Snow'] : MAIN.emotes.snow; break;
    case 7: pokemon.weather_boost += embed.webhook ? MAIN.unicode['Fog'] : MAIN.emotes.fog; break;
    default: pokemon.weather_boost = '';
  } if(pokemon.weather_boost){ pokemon.weather_boost += ' ***Boosted***'; }

  if(has_iv == false || (sighting.cp == null && MAIN.config.POKEMON.sub_without_iv == 'ENABLED')) {
    pokemon_embed = Embed_Config(pokemon);
    send_embed(pokemon.mins);
  } else {
    // RETURN FOR NULL CP
    if(sighting.cp == null){ return; }

    // DETERMINE MOVE NAMES AND TYPES
    pokemon.move_name_1 = sighting.locale.move_1;
    pokemon.move_type_1 = embed.webhook ? MAIN.unicode[MAIN.masterfile.moves[sighting.move_1].type] : MAIN.emotes[MAIN.masterfile.moves[sighting.move_1].type.toLowerCase()];
    pokemon.move_name_2 = sighting.locale.move_2;
    pokemon.move_type_2 = embed.webhook ? MAIN.unicode[MAIN.masterfile.moves[sighting.move_2].type] : MAIN.emotes[MAIN.masterfile.moves[sighting.move_2].type.toLowerCase()];

    // DETERMINE HEIGHT, WEIGHT AND SIZE
    pokemon.height = Math.floor(sighting.height*100)/100;
    pokemon.weight = Math.floor(sighting.weight*100)/100;
    pokemon.size = sighting.size;

    // POKEMON STATS
    pokemon.attack = sighting.individual_attack;
    pokemon.defense = sighting.individual_defense;
    pokemon.stamina = sighting.individual_stamina;
    pokemon.level = sighting.pokemon_level;
    pokemon.cp = sighting.cp;
    pokemon.encounter_id = sighting.encounter_id;

    // SHINY DM CONTENT
    if(embed.embed == 'shiny.js'){
      content = pokemon.lat+','+pokemon.lon+' '+pokemon.shiny+pokemon.name;
    }

    // CREATE AND SEND EMBED
    pokemon_embed = Embed_Config(pokemon);
    if(MAIN.debug.PROCESSING_SPEED == 'ENABLED'){
      let string = 'Received: '+sighting.wdrReceived+'\nSent: '+new Date().toString();
      pokemon_embed.setFooter(string);
    }
    send_embed(pokemon.mins);
  }

  function send_embed(minutes){
    if(member){
      if (MAIN.config.TIME_REMAIN_SUBS && minutes < MAIN.config.TIME_REMAIN_SUBS) { return; }
      if(MAIN.config.VERBOSE_LOGS == 'ENABLED'){ console.info('[EMBEDS] ['+MAIN.Bot_Time(null,'stamp')+'] [pokemon.js] Sent a '+pokemon.name+' to '+member.user.tag+' ('+member.id+').'); }
      return MAIN.Send_DM(MAIN, server.id, member.id, content, pokemon_embed, target.bot);
    } else if(embed.webhook){
      if(MAIN.config.TIME_REMAIN && minutes < MAIN.config.TIME_REMAIN){ return; }
      return MAIN.Send_Webhook(MAIN, pokemon, server, content, pokemon_embed, target.id);
    } else{
      if(content){ content += ' '+pokemon.name+' in '+area.embed+', '+minutes+'min'}
      if(MAIN.config.TIME_REMAIN && minutes < MAIN.config.TIME_REMAIN){ return; }
      if(MAIN.config.VERBOSE_LOGS == 'ENABLED'){ console.info('[EMBEDS] ['+MAIN.Bot_Time(null,'stamp')+'] [pokemon.js] Sent a '+pokemon.name+' to '+target.guild.name+' ('+target.id+').'); }
      return MAIN.Send_Embed(MAIN, 'pokemon', 0, server, content, pokemon_embed, target.id);
    }
  }
}

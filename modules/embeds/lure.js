module.exports.run = async (MAIN, target, lure, type, area, server, timezone, content, embed) => {
  let Embed_Config = require('../../embeds/'+embed);
  let locale = await MAIN.Get_Locale(MAIN, lure, server);

  // CHECK IF THE TARGET IS A USER
  let guild = MAIN.guilds.cache.get(server.id);
  let member = guild.members.cache.get(target.user_id);

  // VARIABLES
  let time_now = new Date().getTime();
  let pokestop = {
    type: locale.lure_type, color: '',
    // DETERMINE STOP NAME
    name: lure.name,
    url: lure.url,

    // LURE EXPIRATION TIME
    time: await MAIN.Bot_Time(lure.lure_expiration, '1', timezone),
    mins: Math.floor((lure.lure_expiration-(time_now/1000))/60),
    secs: Math.floor((lure.lure_expiration-(time_now/1000)) - ((Math.floor((lure.lure_expiration-(time_now/1000))/60))*60)),

    // GET LOCATION INFO
    lat: lure.latitude, lon: lure.longitude,
    area: area.embed,
    map_url: MAIN.config.FRONTEND_URL,

    // MAP LINK PROVIDERS
    google: '[Google]('+await MAIN.Short_URL(MAIN, 'https://www.google.com/maps?q='+lure.latitude+','+lure.longitude)+')',
    apple: '[Apple]('+await MAIN.Short_URL(MAIN, 'http://maps.apple.com/maps?daddr='+lure.latitude+','+lure.longitude+'&z=10&t=s&dirflg=d')+')',
    pmsf: '[Scan Map]('+await MAIN.Short_URL(MAIN, MAIN.config.FRONTEND_URL+'?lat='+lure.latitude+'&lon='+lure.longitude+'&zoom=15')+')',

    // GET STATIC MAP TILE
  };
  // NULL POKESTOP URL
  if(!pokestop.url || pokestop.url == 'null'){
    pokestop.url = 'https://raw.githubusercontent.com/shindekokoro/PogoAssets/master/static_assets/png/Badge_Pokestop_SILVER_01.png';
  }

  // STC TILES


  // GET LURE TYPE, COLOR, AND SPRITE
  switch(type){
    case 'Normal':
      pokestop.color = 'ec78ea';
      pokestop.sprite = 'https://raw.githubusercontent.com/ZeChrales/PogoAssets/master/static_assets/png/TroyKey.png';
      break;
    case 'Glacial':
      pokestop.color = '5feafd';
      pokestop.sprite = 'https://raw.githubusercontent.com/ZeChrales/PogoAssets/master/static_assets/png/TroyKey_glacial.png';
      break;
    case 'Mossy':
      pokestop.color = '72ea38';
      pokestop.sprite = 'https://raw.githubusercontent.com/ZeChrales/PogoAssets/master/static_assets/png/TroyKey_moss.png';
      break;
    case 'Magnetic':
      pokestop.color = 'fac036';
      pokestop.sprite = 'https://raw.githubusercontent.com/ZeChrales/PogoAssets/00dd14bec9d3e17f89ddb021d71853c8b4667cf0/static_assets/png/TroyKey_magnetic.png'
      break;
    case 'Rainy':
      pokestop.color = '5feafd';
      pokestop.sprite = 'https://raw.githubusercontent.com/nileplumb/PkmnShuffleMap/4f3fde197c19fe09b40699d8b0ab70ed1f4467bc/PMSF_icons_large/rewards/reward_505_1.png';
    default:
      pokestop.color = '188ae2';
      pokestop.sprite = 'https://raw.githubusercontent.com/ZeChrales/PogoAssets/master/static_assets/png/Badge_Pokestop_SILVER_01.png';
      break;
  }

  let pokestopbody = await MAIN.Get_ID(MAIN, lure.latitude, lure.longitude, pokestop.sprite, 'https://raw.githubusercontent.com/whitewillem/PMSF/develop/static/forts/Pstop.png');
  pokestop.tile = await MAIN.Post_Tile(MAIN, pokestopbody);
  let lure_embed = await Embed_Config(pokestop);
  send_embed(pokestop.mins);

  function send_embed(minutes){
    if(member){
      if(MAIN.debug.Lure == 'ENABLED' && MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[EMBEDS] ['+MAIN.Bot_Time(null,'stamp')+'] [lure.js] Sent a '+pokestop.name+' to '+member.user.tag+' ('+member.id+').'); }
      return MAIN.Send_DM(MAIN, server.id, member.id, content, lure_embed, target.bot);
    } else if(MAIN.config.LURE.Discord_Feeds == 'ENABLED'){
      if(minutes < MAIN.config.TIME_REMAIN){ return; }
      if(MAIN.debug.Lure == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('[EMBEDS] ['+MAIN.Bot_Time(null,'stamp')+'] [lure.js] Sent a '+pokestop.name+' to '+target.guild.name+' ('+target.id+').'); }
      return MAIN.Send_Embed(MAIN, 'lure', 0, server, content, lure_embed, target.id);
    } else{ return; }
  }
}

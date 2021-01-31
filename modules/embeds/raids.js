const pvp = require('../base/pvp.js');

module.exports.run = async (MAIN, target, raid, raid_type, area, server, timezone, content, embed) => {
  let Embed_Config = require('../../embeds/'+embed.embed), raid_embed = {};

  // CHECK IF THE TARGET IS A USER
  let guild = MAIN.guilds.cache.get(server.id);
  let member = guild.members.cache.get(target.user_id);

  // VARIABLES
  let typing = await MAIN.Get_Typing(MAIN, raid, embed.webhook, server);
  let gym = {
    id: raid.gym_id,
    pokemon_id: raid.pokemon_id,
    level: raid.level,
    evolution: raid.evolution,
    sprite: '',

    // CHECK FOR GYM NAME AND NOTES
    name: raid.gym_name ? raid.gym_name : 'No Name',
    notes: MAIN.gym_notes[raid.gym_id] ? MAIN.gym_notes[raid.gym_id].description : '',

    // DETERMINE POKEMON NAME AND FORM OR EGG
    boss: raid.locale.pokemon_name ? raid.locale.pokemon_name : 'Egg',
    form: raid.locale.form ? raid.locale.form : '',
    gender: ' ',

    // CHECK IF EXCLUSIVE RAID
    sponsor: '',
    exraid: raid.is_exclusive ? '**EXRaid Invite Only**\n' : '',

    // DETERMIND RAID TYPES AND WEAKNESSES
    type: typing.type,
    type_noemoji: typing.type_noemoji,
    weaknesses: typing.weaknesses,
    resistances: typing.resistances,
    reduced: typing.reduced,

    // GET LOCATION INFO
    lat: raid.latitude, lon: raid.longitude,
    map_img: '',
    area: area.embed,
    map_url: MAIN.config.FRONTEND_URL,

    // MAP LINK PROVIDERS
    google: '[Google]('+await MAIN.Short_URL(MAIN, 'https://www.google.com/maps?q='+raid.latitude+','+raid.longitude)+')',
    apple: '[Apple]('+await MAIN.Short_URL(MAIN, 'http://maps.apple.com/maps?daddr='+raid.latitude+','+raid.longitude+'&z=10&t=s&dirflg=d')+')',
    waze: '[Waze]('+await MAIN.Short_URL(MAIN, 'https://www.waze.com/ul?ll='+raid.latitude+','+raid.longitude+'&navigate=yes')+')',
    pmsf: '[Scan Map]('+await MAIN.Short_URL(MAIN, MAIN.config.FRONTEND_URL+'?lat='+raid.latitude+'&lon='+raid.longitude+'&zoom=15')+')',
    rdm: '[Scan Map]('+await MAIN.Short_URL(MAIN, MAIN.config.FRONTEND_URL+'@/'+raid.latitude+'/'+raid.longitude+'/15')+')'

    // GET STATIC MAP TILE
  };

  // CHECK IF SPONSORED GYM
  if(raid.sponsor_id || raid.ex_raid_eligible){ gym.sponsor = ' | '+MAIN.emotes.exPass+' Eligible'; }

  switch(raid.evolution){
   case 1:
     gym.mega = 'Mega';
     break;
   case 2:
     gym.mega = 'Mega X';
     break;
   case 3:
     gym.mega = 'Mega Y';
     break;
   default:
     gym.mega = '';
     break;
  }


  // DETERMINE GYM CONTROL
  switch(raid.team_id){
    case 1:
      gym.team = MAIN.emotes.mystic+' Gym';
      gym.team_img = MAIN.config.Mystic_URL;
      gym.url = raid.gym_url ? raid.gym_url : gym.team_img;
      break;
    case 2:
      gym.team = MAIN.emotes.valor+' Gym';
      gym.team_img = MAIN.config.Valor_URL;
      gym.url = raid.gym_url ? raid.gym_url : gym.team_img;
      break;
    case 3:
      gym.team = MAIN.emotes.instinct+' Gym';
      gym.team_img = MAIN.config.Instinct_URL;
      gym.url = raid.gym_url ? raid.gym_url : gym.team_img;
      break;
    default:
      gym.team = 'Uncontested Gym';
      gym.team_img = MAIN.config.Uncontested_URL;
      gym.url = raid.gym_url ? raid.gym_url : gym.team_img;
  }

  // GET RAID COLOR
  switch(raid.level){
    case 1:
    case 2: gym.color = 'f358fb'; break;
    case 3:
    case 4: gym.color = 'ffd300'; break;
    case 5: gym.color = '5b00de'; break;
    case 6: gym.color = 'b09823'; break;
  }


  // GET GENDER
  switch(raid.gender){
    case 1: gym.gender += embed.webhook ? MAIN.unicode['Male'] : MAIN.emotes.male; break;
    case 2: gym.gender += embed.webhook ? MAIN.unicode['Female'] : MAIN.emotes.female; break;
    default: gym.gender = '';
  }

  time_now = new Date().getTime();
  gym.start = raid.start, gym.end = raid.end;
  gym.hatch_time = MAIN.Bot_Time(raid.start, '1', timezone);
  gym.end_time = MAIN.Bot_Time(raid.end, '1', timezone);
  gym.hatch_mins = Math.floor((raid.start-(time_now/1000))/60);
  gym.end_mins = Math.floor((raid.end-(time_now/1000))/60);

  // DETERMINE IF IT'S AN EGG OR A RAID
  switch(raid_type){

    case 'Egg':
      // GET EGG IMAGE
      switch(raid.level){
        case 1: gym.sprite = MAIN.config.T1_URL; break;
        case 3: gym.sprite = MAIN.config.T3_URL; break;
        case 5: gym.sprite = MAIN.config.T5_URL; break;
	case 6: gym.sprite = MAIN.config.T6_URL; break;
      }

      let gymbody = await MAIN.Get_ID(MAIN, raid.latitude, raid.longitude, gym.sprite, gym.team_img);
      gym.tile = await MAIN.Post_Tile(MAIN, gymbody);


      // CREATE THE EGG EMBED
      raid_embed = await Embed_Config(gym);

      // ADD FOOTER IF RAID LOBBIES ARE ENABLED
      if(raid.level >= server.min_raid_lobbies){ raid_embed.setFooter(gym.id); }

      return send_embed('Level '+raid.level+' Raid Egg');

    // RAID IS A BOSS
    case 'Boss':
      // DETERMINE MOVE NAMES AND TYPES
      gym.move_name_1 = raid.locale.move_1;
      gym.move_type_1 = embed.webhook ? MAIN.unicode[MAIN.masterfile.moves[sighting.move_1].type] : MAIN.emotes[MAIN.masterfile.moves[raid.move_1].type.toLowerCase()];
      gym.move_name_2 = raid.locale.move_2;
      gym.move_type_2 = embed.webhook ? MAIN.unicode[MAIN.masterfile.moves[sighting.move_2].type] : MAIN.emotes[MAIN.masterfile.moves[raid.move_2].type.toLowerCase()];

      // Run Min-Max CP Calculations for Boss
      gym.minCP = pvp.CalculateCP(MAIN,raid.pokemon_id,raid.form,10,10,10,20);
      gym.maxCP = pvp.CalculateCP(MAIN,raid.pokemon_id,raid.form,15,15,15,20);
      gym.minCP_boosted = pvp.CalculateCP(MAIN,raid.pokemon_id,raid.form,10,10,10,25);
      gym.maxCP_boosted = pvp.CalculateCP(MAIN,raid.pokemon_id,raid.form,15,15,15,25);

      // GET THE RAID BOSS SPRITE
      gym.sprite = await MAIN.Get_Sprite(MAIN, raid);

      let gymbody2 = await MAIN.Get_ID(MAIN, raid.latitude, raid.longitude, gym.sprite, gym.team_img);
      gym.tile = await MAIN.Post_Tile(MAIN, gymbody2);


      // CREATE THE RAID EMBED
      raid_embed = await Embed_Config(gym)

      // ADD FOOTER IF RAID LOBBIES ARE ENABLED
      if(raid.level >= server.min_raid_lobbies){ raid_embed.setFooter(gym.id); }

      return send_embed(gym.boss+' Raid Boss');
  }

  function send_embed(type){
    // CHECK CONFIGS AND SEND TO USER OR FEED
    if(member && MAIN.config.RAID.Subscriptions == 'ENABLED'){
      if(MAIN.config.VERBOSE_LOGS == 'ENABLED'){ console.info('[EMBEDS] ['+MAIN.Bot_Time(null,'stamp')+'] [raids.js] Sent a '+type+' to '+member.user.tag+' ('+member.id+').'); }
      return MAIN.Send_DM(MAIN, server.id, member.id, content, raid_embed, target.bot);
    } else if(embed.webhook){
      return MAIN.Send_Webhook(MAIN, gym, server, content, pokemon_embed, target.id);
    } else{
      if(MAIN.config.VERBOSE_LOGS == 'ENABLED'){ console.info('[EMBEDS] ['+MAIN.Bot_Time(null,'stamp')+'] [raids.js] Sent a '+type+' to '+target.guild.name+' ('+target.id+').'); }
      return MAIN.Send_Embed(MAIN, 'raid', raid.level, server, content, raid_embed, target.id);
    }
  }
}

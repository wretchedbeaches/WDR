delete require.cache[require.resolve('../embeds/pokemon.js')];
const Send_Pokemon = require('../embeds/pokemon.js');

module.exports.run = async (MAIN, sighting, area, server, timezone, role_id) => {

  // IF RUNNING UIV AND POKEMON DOESN'T HAVE IV WAIT UNTIL IT IS RESET BY RDM IF/WHEN IT GETS IV CHECKED
  if(MAIN.config.UIV != 'DISABLED' && !sighting.cp) { return; }

  // DON'T FILTER IF FEEDS ARE DISABLED
  if(MAIN.config.POKEMON.Discord_Feeds != 'ENABLED'){ return; }

  // VARIABLES
  let internal_value = (sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  let time_now = new Date().getTime(); internal_value = Math.floor(internal_value*1000)/10;

  let hook = JSON.stringify(sighting);
  hook = JSON.parse(hook);
  if(hook.weather > 0){ hook.weather = 1 } else{ hook.weather = 0 }
  hook = JSON.stringify(hook);

  // CHECK ALL FILTERS
  MAIN.Pokemon_Channels.forEach((pokemon_channel,index) => {

    // DEFINE FILTER VARIABLES
    let geofences = pokemon_channel[1].geofences.split(',');
    let channel = MAIN.channels.cache.get(pokemon_channel[0]);
    let filter = MAIN.Filters.get(pokemon_channel[1].filter);
    let target = filter[MAIN.masterfile.pokemon[sighting.pokemon_id].name];
    let embed = { embed: pokemon_channel[1].embed ? pokemon_channel[1].embed : '',
                  webhook: pokemon_channel[1].webhook };
    let role_id = '';

    // DETERMINE GENDER
    switch(sighting.gender){
      case 1: gender = 'male'; break;
      case 2: gender = 'female'; break;
      default: gender = 'all';
    }

    // ALLOW FOR OTHER VALUE TARGET FILTERS
    switch (target) {
      case undefined:
        //console.error('['+MAIN.config.BOT_NAME+'] ['+MAIN.Bot_Time(null,'stamp')+'] [filtering/pokemon.js] Missing correct filters for '+sighting.pokemon_id);
        // RETURN IF UNDEFINED IN THE FILTER
        return;
      case true:
      case 'True':
        target = true; break;
      case false:
      case 'False':
        target = false; break;
      default:
        target = target;
    }
    switch (target.form) {
      case undefined:
        filter.form = sighting.form;
      default:
        target.form = target.form;
    }
    // CHECK FOR INVALID DATA
    if(!filter){ return console.error('['+MAIN.config.BOT_NAME+'] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+pokemon_channel[0]+' does not appear to exist.'); }
    if(!channel){ return console.error('['+MAIN.config.BOT_NAME+'] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+pokemon_channel[0]+' does not appear to exist.'); }
    if(filter.Type != 'pokemon'){ return console.error('['+MAIN.config.BOT_NAME+'] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+pokemon_channel[0]+' does not appear to be a pokemon filter.'); }

    // ADD ROLE ID IF IT EXISTS
    if(pokemon_channel[1].roleid){
      if(pokemon_channel[1].roleid == 'here' || pokemon_channel[1].roleid == 'everyone'){
        role_id = '@'+pokemon_channel[1].roleid;
      } else{
        role_id = '<@&'+pokemon_channel[1].roleid+'>';
      }
    }

    // CHECK FILTER GEOFENCES
    if(geofences.indexOf(server.name) >= 0 || geofences.indexOf(area.main) >= 0 || geofences.indexOf(area.sub) >= 0){

      switch(true){
        // POST WITHOUT IV FILTER
        case filter.Post_Without_IV == true && !sighting.cp:
        case filter.Post_Without_IV == 'both' && !sighting.cp:
          switch(true){
            // ONLY BREAK NO_IV CHANNEL IF UIV IS ENABLED
            case (sighting.cp > 0 && MAIN.config.UIV == 'ENABLED'): break;
            case target == false: break;
            default:
              if (!embed.embed) {embed.embed = 'pokemon.js'}
              return Send_Pokemon.run(MAIN, false, channel, sighting, internal_value, time_now, area, server, timezone, role_id, embed);
          } break;

        //  BREAK IF NO CP
        case !sighting.cp: break;

        //  BREAK IF POKEMON IS DISABLED
        case target == false: break;

        //  SIGHTING HAS A SECONDARY FILTER
        case target != true:
          let secondary = {
            form: target.form ? target.form : filter.form,
            gender: target.gender ? target.gender.toLowerCase() : filter.gender.toLowerCase(),
            size: target.size ? target.size.toLowerCase() : filter.size.toLowerCase(),
            min_iv: target.min_iv ? target.min_iv : filter.min_iv,
            max_iv: target.max_iv ? target.max_iv : filter.max_iv,
            min_cp: target.min_cp ? target.min_cp : filter.min_cp,
            max_cp: target.max_cp ? target.max_cp : filter.max_cp,
            min_level: target.min_level ? target.min_level : filter.min_level,
            max_level: target.max_level ? target.max_level : filter.max_level
          };
          return filterPokemon(MAIN, secondary, pokemon_channel, channel, sighting, internal_value, time_now, area, server, timezone, role_id, embed);

        //  SIGHTING DOESN'T HAVE A SECONDARY FILTER
        default:
          return filterPokemon(MAIN, filter, pokemon_channel, channel, sighting, internal_value, time_now, area, server, timezone, role_id, embed);
      }
    }
  }); return;
}

function filterPokemon(MAIN, filter, pokemon_channel, channel, sighting, internal_value, time_now, area, server, timezone, role_id, embed){
  //  PUT SIGHTING THROUGH FILTERS
  switch(true){
    //case filter.min_cp_range:
    //case filter.max_cp_range: return;
    case filter.form != sighting.form: sightingFailed(MAIN, filter, sighting, {fail: 'Form', expected: filter.form, seen: sighting.form}); break;
    case filter.min_cp > sighting.cp: sightingFailed(MAIN, filter, sighting, {fail: 'CP', expected: filter.min_cp, seen: sighting.cp}); break;
    case filter.max_cp < sighting.cp: sightingFailed(MAIN, filter, sighting, {fail: 'CP', expected: filter.max_cp, seen: sighting.cp}); break;
    case filter.min_level > sighting.pokemon_level: sightingFailed(MAIN, filter, sighting, {fail: 'LEVEL', expected: filter.min_level, seen: sighting.pokemon_level}); break;
    case filter.max_level < sighting.pokemon_level: sightingFailed(MAIN, filter, sighting, {fail: 'LEVEL', expected: filter.max_level, seen: sighting.pokemon_level}); break;
    case (filter.size.toLowerCase() != 'all' && filter.size.toLowerCase() != sighting.size): sightingFailed(MAIN, filter, sighting, {fail: 'SIZE', expected: filter.size, seen: sighting.size}); break;
    default:
      switch(true){
        //  INDIVIDUAL VALUE FILTERS (10/10/10)
        case filter.min_iv.length > 3:
          // PARSE INDIVUAL VALUES
          let min_iv = filter.min_iv.split('/');
          let max_iv = filter.max_iv.split('/');
          // SEND SIGHTING THROUGH ALL FILTERS
          switch(true){
            case min_iv[0] > sighting.individual_attack: sightingFailed(MAIN, filter, sighting, {fail: 'IV', expected: min_iv[0], seen: sighting.individual_attack}); break;
            case min_iv[1] > sighting.individual_defense: sightingFailed(MAIN, filter, sighting, {fail: 'IV', expected: min_iv[1], seen: sighting.individual_defense}); break;
            case min_iv[2] > sighting.individual_stamina: sightingFailed(MAIN, filter, sighting, {fail: 'IV', expected: min_iv[2], seen: sighting.individual_stamina}); break;
            case max_iv[0] < sighting.individual_attack: sightingFailed(MAIN, filter, sighting, {fail: 'IV', expected: min_iv[0], seen: sighting.individual_attack}); break;
            case max_iv[1] < sighting.individual_defense: sightingFailed(MAIN, filter, sighting, {fail: 'IV', expected: min_iv[1], seen: sighting.individual_defense}); break;
            case max_iv[2] < sighting.individual_stamina: sightingFailed(MAIN, filter, sighting, {fail: 'IV', expected: min_iv[2], seen: sighting.individual_stamina}); break;
            default:
              if(filter.gender.toLowerCase() == 'all' || filter.gender.toLowerCase() == gender){
                if(!embed.embed){ embed.embed = 'pokemon_iv.js'; }
                return Send_Pokemon.run(MAIN, true, channel, sighting, internal_value, time_now, area, server, timezone, role_id, embed);
              }
          } break;
        //  PERCENTAGE FILTER (80%)
        default:
          switch(true){
            case filter.min_iv > internal_value: sightingFailed(MAIN, filter, sighting, {fail: 'IV', expected: filter.min_iv, seen: internal_value}); break;
            case filter.max_iv < internal_value: sightingFailed(MAIN, filter, sighting, {fail: 'IV', expected: filter.max_iv, seen: internal_value}); break;
            default:
              if(filter.gender.toLowerCase() == 'all' || filter.gender == gender){
                if(!embed.embed){ embed.embed = 'pokemon_iv.js'; }
                return Send_Pokemon.run(MAIN, true, channel, sighting, internal_value, time_now, area, server, timezone, role_id, embed);
              }
          }
      }
  }
}

function sightingFailed(MAIN, filter, sighting, reason){
  if(MAIN.debug.Pokemon == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){
    return console.info(MAIN.Color.cyan+'[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [pokemon.js] '+MAIN.masterfile.pokemon[sighting.pokemon_id].name+' failed '+filter.name+' because of '+reason.fail+'. Expected: '+reason.expected+', Saw: '+reason.seen+MAIN.Color.reset);
  }
}

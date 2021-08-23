const Send_Invasion = require('../embeds/invasion.js');

module.exports.run = async (MAIN, invasion, area, server, timezone, content) => {

  if(MAIN.debug.Invasion == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [invasion.js] Received a Pokestop Invasion.'); }

  // RETURN IF NO CHANNELS ARE SET
  if(!MAIN.Invasion_Channels){ return; }

  // FILTER FEED TYPE
  let stop_id = invasion.pokestop_id;
  let type = MAIN.grunts[invasion.grunt_type].type;
  let gender = MAIN.grunts[invasion.grunt_type].grunt;

  // CHECK EACH FEED FILTER
  MAIN.Invasion_Channels.forEach((invasion_channel,index) => {

    // DEFINE MORE VARIABLES
    let geofences = invasion_channel[1].geofences.split(',');
    let channel = MAIN.channels.cache.get(invasion_channel[0]);
    let filter = MAIN.Filters.get(invasion_channel[1].filter);
    let content = '', embed = 'invasion.js';

    if (invasion_channel[1].roleid) {
      if (invasion_channel[1].roleid == 'here' || invasion_channel[1].roleid == 'everyone'){
        content = '@'+invasion_channel[1].roleid;
      } else {
        content = '<@&'+invasion_channel[1].roleid+'>';
      }
    }

    // SET EMBED FILE NAME
    if (invasion_channel[1].embed) { embed = invasion_channel[1].embed; }

    // THROW ERRORS AND BREAK FOR INVALID DATA
    if(!filter){ return console.error('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [invasion.js] The filter defined for '+invasion_channel[0]+' does not appear to exist.'); }
    if(!channel){ return console.error('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [invasion.js] The channel '+invasion_channel[0]+' does not appear to exist.'); }
    if(filter.Type != 'invasion'){ return console.error('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [invasion.js] The filter defined for '+quest_channel[0]+' does not appear to be a invasion filter.'); }

    // FILTER FOR INVASION TYPE AND GENDER
    else if (filter[type] == 'All' || filter[type] == gender || filter['All'] == 'All') {

      // AREA FILTER
      if(geofences.indexOf(server.name) >= 0 || geofences.indexOf(area.main) >= 0 || geofences.indexOf(area.sub) >= 0){
        if(MAIN.debug.Invasion == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [invasion.js] Lure Passed Filters for '+invasion_channel[0]+'.'); }
        Send_Invasion.run(MAIN, channel, invasion, type, area, server, timezone, content, embed);
      } else{ if(MAIN.debug.Invasion == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [invasion.js] Lure Did Not Pass Channel Geofences for '+invasion_channel[0]+'. Expected: '+invasion_channel[1].geofences+' Saw: '+server.name+'|'+area.main+'|'+area.sub); } }
    } else{ if(MAIN.debug.Invasion == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [invasion.js] Lure Did Not Meet Type or Gender Filter for '+invasion_channel[0]+'. Expected: '+type+' '+filter[type]+', Saw: '+gender); } }
  });

}

const Send_Raid = require('../embeds/raids.js');


module.exports.run = async (MAIN, raid, area, server, timezone, role_id) => {

  // FILTER FEED TYPE FOR EGG, BOSS, OR BOTH
  let boss_name = '', type = '';
  if(raid.cp > 0 || raid.is_exclusive == true){
    type = 'Boss';
    boss_name = raid.locale.pokemon_name;
  } else{
    type = 'Egg'; boss_name = 'Lvl'+raid.level+'-'+type;
  } let channel_name = boss_name+'_'+raid.gym_name;

  let hook = JSON.stringify(raid);
  hook = JSON.parse(hook);
  delete hook.gender;
  hook = JSON.stringify(hook);

  // DON'T FILTER IF FEEDS ARE DISABLED
  if(MAIN.config.RAID.Discord_Feeds != 'ENABLED'){ return; }
  if(MAIN.debug.Raids == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [raids.js] Received a '+boss_name+' Raid.'); }

  // CHECK FOR EX RAID PASSES
  await MAIN.Save_EX(MAIN, raid, boss_name, area, timezone, server);

  // CHECK EACH FEED FILTER
  MAIN.Raid_Channels.forEach( async (raid_channel,index) => {

    // DEFINE MORE VARIABLES
    let geofences = raid_channel[1].geofences.split(',');
    let channel = MAIN.channels.cache.get(raid_channel[0]);
    let filter = MAIN.Filters.get(raid_channel[1].filter);

    let embed = { webhook: raid_channel[1].webhook };
    if (type == 'Egg'){
      embed.embed = raid_channel[1].embed_egg ? raid_channel[1].embed_egg : 'raid_eggs.js';
    } else {
      embed.embed = raid_channel[1].embed ? raid_channel[1].embed : 'raids.js';
    }

    let role_id = '';
    if (raid_channel[1].roleid) {
      if (raid_channel[1].roleid == 'here' || raid_channel[1].roleid == 'everyone'){
        role_id = '@'+raid_channel[1].roleid;
      } else {
        role_id = '<@&'+raid_channel[1].roleid+'>';
      }
    }

    // THROW ERRORS AND BREAK FOR INVALID DATA
    if(!filter){ return console.error('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [raids.js] The filter defined for '+raid_channel[0]+' does not appear to exist.'); }
    if(!channel){ return console.error('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [raids.js] The channel '+raid_channel[0]+' does not appear to exist.'); }
    if(filter.Type != 'raid'){ return console.error('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [raids.js] The filter defined for '+raid_channel[0]+' does not appear to be a raid filter.'); }

    // FILTER FOR EGG LEVEL
    else if( (type == 'Egg' && filter.Egg_Levels.indexOf(raid.level) >= 0) || (type == 'Boss' && (filter.Boss_Levels.indexOf(raid.level) >= 0 || filter.Boss_Levels.indexOf(boss_name) >= 0)) ){

      // AREA FILTER
      if(geofences.indexOf(server.name) >= 0 || geofences.indexOf(area.main) >= 0 || geofences.indexOf(area.sub) >= 0){

        // CHECK FOR EX ELIGIBLE REQUIREMENT
        if(filter.Ex_Eligible_Only == undefined || filter.Ex_Eligible_Only != true){
          if(MAIN.debug.Raids == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [raids.js] Raid Passed Filters for '+raid_channel[0]+'.'); }
          if (raid_channel[1].url) {
            MAIN.Send_Hook(MAIN, raid_channel[1].url, hook,'raid');
          }

          // INSERT RAID LOBBY AND SEND RAID
          await raid_lobbies(MAIN, raid, boss_name, channel, area, timezone, server);
          Send_Raid.run(MAIN, channel, raid, type, area, server, timezone, role_id, embed);
        }
        else if(filter.Ex_Eligible_Only == raid.ex_raid_eligible || filter.Ex_Eligible_Only == raid.sponsor_id){
          if(MAIN.debug.Raids == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [raids.js] Raid Passed Filters for '+raid_channel[0]+'.'); }
          if (raid_channel[1].url) {
            MAIN.Send_Hook(MAIN, raid_channel[1].url, hook,'raid');
          }

          // INSERT RAID LOBBY AND SEND RAID
          await raid_lobbies(MAIN, raid, boss_name, channel, area, timezone, server);
          Send_Raid.run(MAIN, channel, raid, type, area, server, timezone, role_id, embed);
        }
      } else{
        if(MAIN.debug.Raids == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [raids.js] Raid Did Not Pass Channel Geofences for '+raid_channel[0]+'. Expected: '+raid_channel[1].geofences+' Saw: '+server.name+'|'+area.main+'|'+area.sub); }
      }
    } else{
      if(MAIN.debug.Raids == 'ENABLED' && MAIN.debug.Feed == 'ENABLED'){ console.info('[FILTERING] ['+MAIN.Bot_Time(null,'stamp')+'] [raids.js] Raid Did Not Meet Type or Level Filter for '+raid_channel[0]+'. Expected: '+filter.Boss_Levels+', Saw: '+type.toLowerCase()); }
    }
  });
}

function raid_lobbies(MAIN, raid, boss_name, channel, area, timezone, server){
  return new Promise(resolve => {
    // SKIP RAID LOBBIES IF NOT ENABLED
    if(MAIN.config.Raid_Lobbies != 'ENABLED'){
      return resolve();
    }
    // UPDATE/INSERT ACTIVE RAIDS
    else {
      let end_time = MAIN.Bot_Time(raid.end, '1', timezone);
      MAIN.pdb.query(`INSERT INTO active_raids (gym_id, gym_name, raid, guild_id, channel_id, area, boss_name, end_time, expire_time) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE raid = ?`,
      [raid.gym_id, raid.gym_name, JSON.stringify(raid), server.id, channel.id, JSON.stringify(area), boss_name, end_time, raid.end, JSON.stringify(raid)], function (error, record, fields) {
        if(error){ console.error(error); }
        return resolve();
      });
    }
  });
}

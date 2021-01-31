module.exports = (MAIN, raid, boss_name, area, timezone, server) => {
  return new Promise(resolve => {
    // SKIP QUERY IF NO EXRAID LOBBIES LOG CHANNEL
    if(!server.ex_lobbies) {
      return resolve();
    } else{
      // FIND IF GYM IS ALREADY IN THE DB
      MAIN.pdb.query(`SELECT * FROM ex_gyms WHERE id = ?`,
      [raid.gym_id], function (error, gyms, fields) {
        if(error){ console.error(error); }
        if(!gyms || !gyms[0]){
          // EX GYM NOT FOUND, INSERT INTO THE DB
          if(raid.ex_raid_eligible){
            MAIN.pdb.query(`INSERT INTO ex_gyms (id, name, area, discord_id, eligible, pass, message) VALUES (?,?,?,?,?,?,?)`,
            [raid.gym_id, raid.gym_name, area.embed, server.id, true, false, false], function (error, gym, fields) {
              if(error){ console.error(error); }
              else { console.info('exEligible TAG has been added to '+raid.gym_name) }
              return resolve();
            });
          } else{
            return resolve();
          }
        }
        let gym = gyms[0];
        // if(gym[0] && !gym[0].area && gym[0].id == raid.gym_id){
        //   MAIN.pdb.query(`UPDATE ex_gyms SET area = ? where id = ?`,
        //   [area.embed, raid.gym_id], function (error, gym, fields) {
        //     console.log(raid.gym_name+' gym area updated '+area.embed);
        //   });
        // }
        // GYM HAS RE/GAINED EX_TAG, ADD TAG BACK AND REMOVE OTHER INFO
        if(gym && !gym.eligible && raid.ex_raid_eligible){
          let ex_channel = MAIN.channels.cache.get(gym.channel_id);
          let ex_category = MAIN.channels.cache.get(gym.category_id);
          let guild = MAIN.guilds.cache.get(gym.discord_id);
          let ex_role = '';
          if(ex_channel) {
            ex_role = guild.roles.cache.get(gym.role_id);
            if(ex_role){ ex_role.delete().catch(console.error); }
            ex_channel.delete().catch(console.error);
            if(ex_category){
              ex_category.delete().catch(error => {
                // CHANNEL ALREADY DELETED OR NOT FOUND. NOT AN ISSUE
                if(error.message == 'Unknown Channel'){
                  return;
                } else{ console.error(); }
              });
            }
            MAIN.pdb.query(`UPDATE ex_gyms SET eligible = ?, pass = ?, message = ?, channel_id = ?, role_id = ?, category_id = ? WHERE id = ?`,
            [true, false, false, null, null, null, gym.id], function (error, active_raids, fields) {
                if(error){ console.error; }
            });
          }
        }
        // GYM IS NO LONGER "exEligible" (i.e. PASSES WENT OUT)
        else if(gym && gym.eligible && !raid.ex_raid_eligible){
          let timestamp = new Date().getTime()/1000;
          timestamp = Math.round(timestamp);
          MAIN.pdb.query(`UPDATE ex_gyms SET eligible = ?, pass = ?, timestamp = ? WHERE id = ?`,
          [false, true, timestamp, raid.gym_id], function (error, gym, fields) {
            if(error){ console.error(error); }
            else { console.info('exRaid Pass has gone out for '+raid.gym_name)}
          });
        }
        return resolve();
      });
    }
  });
}

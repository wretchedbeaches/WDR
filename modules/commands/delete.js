module.exports.run = (MAIN) => {
  return new Promise(resolve => {
    // Check if passes have been sent
    let raid_passes = new MAIN.Discord.MessageEmbed()
    .setColor('3b444b')
    .setTitle('ExPasses went out for these gyms:');

    // GET GYM NAMES FOR EX RAIDS
    let gym_names = '';

    // CYCLE THROUGH DISCORDS
    MAIN.Discords.Servers.forEach(async (discord, i) => {

      if(!discord.ex_lobbies){ return; }
      let guild = MAIN.guilds.cache.get(discord.id); if(!guild){ return; }
      let channel = MAIN.channels.cache.get(discord.ex_lobbies); if(!channel){ return; }

      MAIN.pdb.query(`SELECT * FROM ex_gyms WHERE pass = ? AND message = ? AND discord_id =? AND channel_id IS NOT NULL`,
      [true, true, discord.id],async function (error, gyms, fields) {
        if(error){ console.error(error); }
        if(!gyms || !gyms[0]){
          console.info('There is nothing to remove.');
          return resolve();
        }
        else{
          await gyms.forEach(async (gym, i) => {
            // GET DISCORD SERVER FOR GYMS
            let ex_channel = MAIN.channels.cache.get(gym.channel_id);
            let ex_category = MAIN.channels.cache.get(gym.category_id);
            let ex_role = '';
            if(ex_channel) {
              ex_role = ex_channel.guild.roles.cache.get(gym.role_id);
              if(ex_role){ ex_role.delete().catch(console.error); }
              if(ex_category){
                ex_category.delete().catch(error => {
                  // CHANNEL ALREADY DELETED OR NOT FOUND. NOT AN ISSUE
                  if(error.message == 'Unknown Channel'){
                    return;
                  } else{ console.error(); }
                });
              }
              ex_channel.delete().catch(console.error);
              MAIN.pdb.query(`UPDATE ex_gyms SET message = ?, channel_id = ?, role_id = ?, category_id = ? WHERE id = ?`,
              [false, null, null, null, gym.id], function (error, active_raids, fields) {
                  if(error){ console.error; }
              });
            }
          });
          return resolve();
        }
      });
    });
  });

}

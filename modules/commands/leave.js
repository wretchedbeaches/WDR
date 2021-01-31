const Discord=require('discord.js');

module.exports.run = async (MAIN, message, raids, count) => {
  let guild = '', member = '';

  // HANDLE CHANNEL COMMANDS
  try {
    guild = MAIN.guilds.cache.get(message.guild.id);
    member = guild.members.cache.get(message.author.id);
  }
  // HANDLE EMOJI REACTIONS
  catch(e) {
    guild = MAIN.guilds.cache.get(message.d.guild_id);
    member = guild.members.cache.get(message.d.user_id);
  }
  let channel = guild.channels.cache.get(raids.raid_channel);
  // RESET LOBBY COUNT
  let lobby_count = 0, present_users = 0, transit_users = 0, member_count = 0;
  let gym_role = guild.roles.cache.get(raids.role_id);

  // SEARCH FOR USER IN lobby_members
  const user_search = function(){
    return new Promise( function(resolve, reject){
      MAIN.pdb.query(`SELECT * FROM lobby_members WHERE user_id = ?`,
      [member.id], function (error, user, fields) {
        if(user === undefined || fields === undefined){
          return reject(new Error("Error fields is undefined"));
        } else{
          return resolve(user[0]);
        }
      }
      )}
  )}

  // IF USER HAS NOT PREVIOUSLY SHOWN INTEREST, IGNORE
  user_search().then(function(results){
    console.log(results);
  if (results === undefined) {
    return channel.send(`${member}, you have not expressed interest in this raid, no need to leave.`).catch(console.error);
  } else {
    // REMOVE ROLE AND DELETE FROM lobby_members
    member.roles.remove(gym_role);
    MAIN.pdb.query(`DELETE FROM lobby_members WHERE user_id = ?`,
    [member.id], function (error, lobby, fields) {
      if(error){ console.error(error); }
    });
    MAIN.pdb.query(`SELECT * FROM lobby_members WHERE gym_id = ?`,
    [raids.gym_id], function (error, lobbies, fields) {
      if(error){ console.error(error);}
      // COUNT LOBBY MEMBERS
      lobbies.forEach(lobby => {
        if (lobby.user_id == member.id) { member_count = lobby.count; }
        if (lobby.arrived == 'here') { present_users += lobby.count; }
        if (lobby.arrived == 'coming') { transit_users += lobby.count; }
        lobby_count += lobby.count;
      });
      let interest = `${member} has *left* the raid. There are:\`\`\`\n`
                    +`${transit_users} accounts on the way.\n`
                    +`${present_users} accounts at the raid\n`
                    +`${lobby_count} total accounts interested\`\`\`${gym_role}`;
      return channel.send(interest).catch(console.error);
    });
  }
}).catch(err => {
 console.error(err);
 });
}

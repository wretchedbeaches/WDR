const Discord=require('discord.js');

module.exports.run = async (MAIN, message, prefix, discord) => {
  console.log('[ROLE_COMMAND] Starting...')
  let members = message.guild.members.map(m => m);
  let role_name = message.content.slice(6,0);
  let role = message.guild.roles.cache.find('name', 'Trainers');
  for(let m=0; m<members.length; m++){
    setTimeout(function() {
      if(!members[m].roles.has(role.id)){
        members[m].roles.add(role).catch(console.error);
        console.log('[ROLE] Added '+role.name+' to '+members[m].user.tag);
      }
    }, 2000*m);
  } return;
}

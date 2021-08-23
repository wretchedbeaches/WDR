const Discord=require('discord.js');

module.exports.run = async (MAIN, message, raids, discord) => {
  let guild = MAIN.guilds.cache.get(message.guild.id);
  let member = guild.members.cache.get(message.author.id);
  let channel = guild.channels.cache.get(raids.raid_channel);

  // RESET LOBBY COUNT
  let lobby_count = 0, present_users = 0, transit_users = 0;
  let gym_role = guild.roles.cache.get(raids.role_id);

  // CHECK IF USER HAS PREVIOUSLY SHOWN INTEREST
  user_search().then(results => {
    if (results === undefined) {
      get_interest();
    }
    else {
      update_status();
      count_members();
    }
  }).catch(function(err){
    console.error();("Promise rejection error: "+err);
  });

  function count_members(){
    // COUNT LOBBY MEMBERS
    MAIN.pdb.query(`SELECT * FROM lobby_members WHERE gym_id = ?`, [raids.gym_id], function (error, lobbys, fields) {
      if(error){ console.error(error);}
      lobbys.forEach(function(lobby) {
        if (lobby.arrived == 'coming') { transit_users += lobby.count; }
        if (lobby.arrived == 'here') { present_users += lobby.count; }
        lobby_count += lobby.count;
      });
      // TAG USER IN EXISTING CHANNEL
      let interest = `${member} is **on the way**! There are:\`\`\`\n`
      +`${transit_users} accounts on the way.\n`
      +`${present_users} accounts at the raid\n`
      +`${lobby_count} total accounts interested\`\`\` ${gym_role}`;

      return channel.send(interest).catch(console.error);
    });
  }

  function user_search(){
    return new Promise( function(resolve, reject){
      MAIN.pdb.query(`SELECT * FROM lobby_members WHERE user_id = ?`, [member.id], function (error, user, fields) {
        if(fields === undefined){
          return reject(new Error("Error fields is undefined"));
        } else {
          return resolve(user[0]);
        }
      }
    )}
  )
}

function get_interest(){
  // DECLARE VARIABLES
  let nickname = '';

  // GET USER NICKNAME
  if(message.member){
    if(message.member.nickname){ nickname = message.member.nickname; }
    else{ nickname = message.member.user.username; }

  } else{
    nickname = message.author.username;
  }

  let addAction = new MAIN.Discord.MessageEmbed()
  .setAuthor(nickname, message.author.displayAvatarURL)
  .setTitle('How many accounts are you coming with?')
  .setFooter('Reply with a numeral, no command prefix required.');

  message.channel.send(addAction).catch(console.error).then( msg => {
    initiate_interest(MAIN, 'start', message, msg, raids);
  });
}

function update_status(){
  MAIN.pdb.query(`UPDATE lobby_members SET arrived = ? WHERE gym_id = ? && user_id = ?`,
  ['coming', raids.gym_id, member.id], function (error, lobby, fields) {
      if(error){ console.error(error); }
  });
}

function insert_user(count){
  // ADD ROLE TO MEMBER
  member.roles.add(gym_role);
  MAIN.pdb.query(`INSERT INTO lobby_members (gym_id, user_id, count, arrived) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE count = ?, arrived = ?`,
  [raids.gym_id, member.id, count, 'coming', count, 'coming'], function (error, lobby, fields) {
    if(error){ console.error(error); }
  });
  count_members();
}

async function initiate_interest(MAIN, source, message, msg, raids){
  // DEFINE COLLECTOR AND FILTER
  const filter = cMessage => cMessage.author.id == message.author.id;
  const collector = message.channel.createMessageCollector(filter, { time: 60000 });
  let msg_count = 0;

  // FILTER COLLECT EVENT
  await collector.on('collect', message => {
    let count = message.content;
    collector.stop(count);
  });

  // COLLECTOR HAS BEEN ENDED
  collector.on('end', (collected,reason) => {

    // DELETE ORIGINAL MESSAGE
    msg.delete();
    switch(reason){
      case 'cancel': break;
      case 'time': if(source == 'start'){
        message.reply('Your response has timed out.')
        .then(m => m.delete({ timeout: 5000, reason: 'Clean Channel' })).catch(console.error);
      }
      break;
      default:
      count = parseInt(reason, 10)
      if (Number.isInteger(count) === true){
        if (count === 0){
          let cmd = MAIN.Commands.get('leave');
          return cmd.run(MAIN, message, raids, discord);
        }
        insert_user(count);
        break;
      } else {
        message.reply('Entry is not a number, please retry.')
        .then(m => m.delete({ timeout: 5000, reason: 'Clean Channel' })).catch(console.error);

        let cmd = MAIN.Commands.get('coming');
        return cmd.run(MAIN, message, raids, discord);
      }
    } return;
  });
}
}

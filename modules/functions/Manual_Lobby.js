const moment = require('moment-timezone');
const Send_Raid = require('../embeds/raids.js');

module.exports = async (MAIN, raid, message, discord, timezone) => {
  // DEFINE GUILD AND MEMBER
  let guild = MAIN.guilds.cache.get(discord.id); if(!guild){ return; }
  let member = guild.members.cache.get(message.author.id); if(!member){ return; }

  // DEFINE VARIABLES
  let member_count = '1';
  raid.locale = await MAIN.Get_Locale(MAIN, raid, discord);

  // GIVE BOT ENOUGH TIME TO INSERT RAID DATA
  await MAIN.Sleep(1);
  MAIN.pdb.query(`SELECT * FROM active_raids WHERE gym_id = ?`,
  [raid.gym_id], function (error, record, fields) {
    if(error){ console.error(error); }
    if(record[0]){
      let channel_id = record[0].channel_id ? record[0].channel_id : message.channel.id
      let channel = MAIN.channels.cache.get(channel_id);
      // CHECK IF THE RAID IS ALREADY ACTIVE
      if(record[0].active == 'true'){
        let cmd = MAIN.Commands.get('interested');
        return cmd.run(MAIN, message, record[0], '1');
      } else {

        // SET VARIABLES
        let area = JSON.parse(record[0].area);
        let boss_name = '', type = '', embed = {};
        if(raid.cp > 0 || raid.is_exclusive == true){
          type = 'Boss', embed.embed = 'raids.js';
          boss_name = raid.locale.pokemon_name;
        } else{
          type = 'Egg', embed.embed = 'raid_eggs.js';;
          boss_name = 'Lvl'+raid.level+'-'+type;
        }
        let channel_name = boss_name+'_'+raid.gym_name

        // CREATE THE CHANNEL
        guild.channel.create(channel_name, { type: 'text', }).then( new_channel => {
          let category = discord.raid_lobbies_category_id ? discord.raid_lobbies_category_id : channel.parent;
          // SET THE CATEGORY ID
          new_channel.setParent(category).then( new_channel => {
            new_channel.lockPermissions();
            new_channel.setPosition(0);

            guild.roles.create({ data: {
              name: raid.gym_name,
              mentionable: true,
              permissions: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'ATTACH_FILES']
            }}).then(new_role => {
              member.roles.add(new_role).then(member => {
                let raid_role = discord.raid_role ? guild.roles.cache.get(discord.raid_role) : '';
                let mention = `${member} has shown interest for a raid in ${area.embed} at ${raid.gym_name}! They are bringing **${member_count}**. Make sure to coordinate a start time. ${mention}`;

                // UPDATE SQL RECORDS
                MAIN.pdb.query(`UPDATE active_raids SET active = ?, channel_id = ?, initiated_by = ?, raid_channel = ?, created = ?, boss_name = ?, role_id = ? WHERE gym_id = ?`,
                [true, channel.id, member.id, new_channel.id, moment().unix(), boss_name, new_role.id, raid.gym_id], function (error, raids, fields) {
                  if(error){ return console.error('[REACTIONS] ['+MAIN.Bot_Time(null,'stamp')+'] Problem updating active_raids',error); }

                  let created_success = new MAIN.Discord.MessageEmbed().setColor('00ff00')
                    .setAuthor(member.nickname, member.displayAvatarURL)
                    .setTitle(boss_name+' Raid Lobby Created!')
                    .setDescription(new_channel)
                    .setFooter('Saved to the '+MAIN.config.BOT_NAME+' Database.');
                  message.channel.send(created_success).catch(console.error);
                });
                MAIN.pdb.query(`INSERT INTO lobby_members (gym_id, user_id, count) VALUES (?,?,?) ON DUPLICATE KEY UPDATE count = ?`,
                [raid.gym_id, member.id, member_count, member_count], function (error, lobby, fields) {
                  if(error){ return console.error('[REACTIONS] ['+MAIN.Bot_Time(null,'stamp')+'] Problem inserting lobby_members',error); }
                  Send_Raid.run(MAIN, new_channel, raid, type, area, discord, timezone, mention, embed)
                });
              });
            });
          });
        });
      }
    }
  });
}

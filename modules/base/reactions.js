const Discord = require('discord.js');
const Send_Raid = require('../embeds/raids.js');
const GeoTz = require('geo-tz');
const moment = require('moment-timezone');

const reactions = { "interval": 60000 };

reactions.run = (MAIN, event) => {
  let guild = MAIN.guilds.cache.get(event.d.guild_id);
  let member = guild.members.cache.get(event.d.user_id);
  let channel = MAIN.channels.cache.get(event.d.channel_id);

  let user_list = '', lobby_count = 0;
  if(!member.user.bot && (event.d.emoji.id == MAIN.emotes.plusOneReact.id || event.d.emoji.id == MAIN.emotes.plusTwoReact.id || event.d.emoji.id == MAIN.emotes.plusThreeReact.id || event.d.emoji.id == MAIN.emotes.plusFourReact.id || event.d.emoji.id == MAIN.emotes.plusFiveReact.id || event.d.emoji.id == MAIN.emotes.cancelReact.id) ){

    let member_count = 0;
    if (event.d.emoji.id == MAIN.emotes.plusOneReact.id) { member_count = 1; }
    if (event.d.emoji.id == MAIN.emotes.plusTwoReact.id) { member_count = 2; }
    if (event.d.emoji.id == MAIN.emotes.plusThreeReact.id) { member_count = 3; }
    if (event.d.emoji.id == MAIN.emotes.plusFourReact.id) { member_count = 4; }
    if (event.d.emoji.id == MAIN.emotes.plusFiveReact.id) { member_count = 5; }
    if (event.d.emoji.id == MAIN.emotes.cancelReact.id) { member_count = 0; }

    // FETCH CHANNEL
    channel.messages.fetch(event.d.message_id).then( async raid => {
      let gym_id = raid.embeds[0].footer.text;

      let discord = MAIN.Discords.Servers.find(server => server.id == guild.id);
      if(!discord){ return; }
      let timezone = GeoTz(discord.geofence[0][1][1], discord.geofence[0][1][0])[0];

      MAIN.pdb.query(`SELECT * FROM active_raids WHERE gym_id = ?`, [gym_id], function (error, record, fields) {
        if(error){ console.error(error); }
        else if(record[0]){

          // CHECK FOR ABUSE
          MAIN.pdb.query(`SELECT * FROM active_raids WHERE initiated_by = ? AND created > UNIX_TIMESTAMP()-900`, [member.id], async function (error, posts, fields) {
            if(error){ console.error(error); }
            if(posts && posts.length >= MAIN.config.Lobby_Limit){
              return member.send('You have have attempted to create too many raid lobbies in a short amount of time. Please only react to raids you can actually make it to and are seriously interested in.').catch(console.error);
            } else{

              // CHECK IF THE RAID ALREADY HAS A LOBBY
              if(record[0].active == true){
                let cmd = MAIN.Commands.get('interested');
                if (member_count == 0) {
                  cmd = MAIN.Commands.get('leave');
                }
                cmd.run(MAIN, event, record[0], member_count);
              }
              // RAID LOBBY NOT CREATED YET
              else {
                if (member_count == 0){
                  return member.send('You\'ve attempted to leave a raid with no lobby, if this was a mistake try again.').catch(console.error);
                } else {
                  // SET VARIABLES
                  let raid = JSON.parse(record[0].raid);
                  let area = JSON.parse(record[0].area);
                  let boss_name = '', type = '', embed = { webhook: false };
                  if(!raid.locale){
                    raid.locale = await MAIN.Get_Locale(MAIN, raid, discord);
                  }

                  // EGG OR BOSS
                  if(raid.cp > 0 || raid.is_exclusive == true){
                    type = 'Boss', embed.embed = 'raids.js';
                    boss_name = raid.locale.pokemon_name;
                  } else{
                    type = 'Egg', embed.embed = 'raid_eggs.js';;
                    boss_name = 'Lvl'+raid.level+'-'+type;
                  }
                  // SET THE CHANNEL NAME AND CREATE THE CHANNEL
                  let channel_name = boss_name+'_'+record[0].gym_name

                  let new_channel = await create_channel(MAIN, member, channel_name, record[0], channel, guild, discord);
                  let raid_role = discord.raid_role ? guild.roles.cache.get(discord.raid_role) : '';
                  let mention = `${member} has shown interest for a raid in ${area.embed} at ${record[0].gym_name}! They are bringing **${member_count}**. Make sure to coordinate a start time. ${raid_role}`;

                  // UPDATE SQL RECORDS
                  MAIN.pdb.query(`UPDATE active_raids SET active = ?, channel_id = ?, initiated_by = ?, raid_channel = ?, created = ?, boss_name = ?, role_id = ? WHERE gym_id = ?`,
                  [true, channel.id, member.id, new_channel.id, moment().unix(), boss_name, new_channel.role.id, raid.gym_id], function (error, raids, fields) {
                    if(error){ return console.error('[REACTIONS] ['+MAIN.Bot_Time(null,'stamp')+'] Problem updating active_raids',error); }
                  });
                  MAIN.pdb.query(`INSERT INTO lobby_members (gym_id, user_id, count) VALUES (?,?,?) ON DUPLICATE KEY UPDATE count = ?`,
                  [raid.gym_id, member.id, member_count, member_count], function (error, lobby, fields) {
                    if(error){ return console.error('[REACTIONS] ['+MAIN.Bot_Time(null,'stamp')+'] Problem inserting lobby_members',error); }
                  });

                  // SEND EMBED
                  Send_Raid.run(MAIN, new_channel, raid, type, area, discord, timezone, mention, embed);
                  }
                }
              }
            });
          } else{
            return member.send('Unable to create an Active Raid for '+raid.embeds[0].author.name+'. That Raid appears to have expired!').catch(console.error);
          }
        });
      }); return;
    }
  }

function getActiveRaids(MAIN){
  return new Promise(function(resolve, reject) {
    MAIN.pdb.query(`SELECT * FROM active_raids WHERE active = ? AND updated = ?`, [true, false], function (error, raids, fields) { return resolve(raids); });
  });
}

function create_channel(MAIN, member, name, record, channel, guild, discord){
  return new Promise(resolve => {
    guild.channels.create(name, { type: 'text', }).then( new_channel => {
      let category = discord.raid_lobbies_category_id ? discord.raid_lobbies_category_id : channel.parent;
      // SET THE CATEGORY ID
      new_channel.setParent(category).then( new_channel => {
        new_channel.lockPermissions();
        new_channel.setPosition(0);

        guild.roles.create({
          data: {
            name: record.gym_name,
            mentionable: true,
            permissions: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'ATTACH_FILES']
          },
          reason: 'Create Role for Gym'
        }).then(role => {
          // ADD ROLE TO MEMBER
          member.roles.add(role).then(member => {
            new_channel.role = role;
            return resolve(new_channel);
          });
        });
      });
    });
  })
}

// KEEP RAID LOBBY UPDATED WITH NEW EMBEDS
reactions.startInterval = async (MAIN) => {
  if(MAIN.config.Raid_Lobbies == 'ENABLED'){
    let active_raids = await getActiveRaids(MAIN);
    //let discord = '', timezone = '';

    setInterval(async function() {
      if(!active_raids){ return; }
      await active_raids.forEach((active,index) => {
        MAIN.pdb.query(`SELECT * FROM active_raids WHERE gym_id = ? AND active = ? AND updated = ?`,
          [active.gym_id, true, false], async function (error, record, fields) {
            if(!record || !record[0]){ return; }

            // PARSE RAID HOOK
            let raid = JSON.parse(record[0].raid);
            if(record[0].boss_name.indexOf('Egg') >= 0 && raid.cp > 0){
              let raid_channel = MAIN.channels.cache.get(record[0].raid_channel);

              let discord = MAIN.Discords.Servers.find(server => server.id == record[0].guild_id);
              if(!discord){ return; }
              let timezone = GeoTz(discord.geofence[0][1][1], discord.geofence[0][1][0])[0];

              let boss_name = '', type = '', embed = { webhook: false };
              if(!raid.locale){
                raid.locale = await MAIN.Get_Locale(MAIN, raid, discord);
              }

              if(raid.cp > 0 || raid.is_exclusive == true){
                type = 'Boss', embed.embed = 'raids.js';
                boss_name = raid.locale.pokemon_name;
              } else{
                type = 'Egg', embed.embed = 'raid_eggs.js';;
                boss_name = 'Lvl'+raid.level+'-'+type;
              } let channel_name = boss_name+'_'+record[0].gym_name;

              MAIN.pdb.query(`UPDATE active_raids SET boss_name = ?, updated = ? WHERE gym_id = ?`, [boss_name, true, active.gym_id], function (error, raids, fields){
                if(error){ console.error(error); }
                if(raid_channel){
                  // SET CHANNEL NAME AND SEND NEW EMBED
                  raid_channel.setName(channel_name).catch(console.error());
                  return Send_Raid.run(MAIN, raid_channel, raid, type, JSON.parse(record[0].area), discord, timezone, '', embed);
                } else{
                  return;
                }
              });
            }
          });
        });
        active_raids = await getActiveRaids(MAIN);
      }, 60000);
    } else{
      return;
    } // RAID LOBBIES ARE NOT ENABLED
}

  module.exports = reactions;

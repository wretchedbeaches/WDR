const GeoTz = require('geo-tz');

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

      MAIN.pdb.query(`SELECT * FROM ex_gyms WHERE pass = ? AND message = ? AND discord_id =?`,
      [true, false, discord.id],async function (error, gyms, fields) {
        if(error){ console.error(error); }
        if(!gyms || !gyms[0]){
          console.info('There are no new passes for the day.');
          return resolve();
        }
        else{
          // SORT GYMS
          gyms.sort(dynamicSortMultiple('area','name'));

          let lobby_role = discord.ex_lobbies_role ? guild.roles.cache.get(discord.ex_lobbies_role) : '';
          let new_category = MAIN.config.Raid_Lobbies == 'ENABLED' ? await create_category(MAIN, 'exRaids', lobby_role, guild, discord) : '';
          let current_area = '';

          // LOOP THROUGH NEW RAIDS
          for(let i = 0; i < gyms.length; i++){
            let gym = gyms[i];

            // CREATE NEW CHANNEL/CATEGORY
            let new_channel = MAIN.config.Raid_Lobbies == 'ENABLED' ? await create_channel(MAIN, gym.name, channel, new_category, gym, guild, discord) : '';

            // SET EMBED FIELD TITLE
            if(!current_area){ current_area = gym.area; }
            if(current_area !== gym.area){
              raid_passes.addField('**'+current_area+'**', gym_names);
              gym_names = '';
              current_area = gym.area;
            }

            // ADD DATA TO FIELD EMBED
            gym_names += `${gym.name} ${new_channel}\n`;

            //DISCORD EMBED LIMITS
            if(raid_passes.fields.length > 24){
              MAIN.Send_Embed(MAIN, 'ExPasses', 0, '', '', raid_passes, discord.ex_lobbies);
              raid_passes.fields = [];
            }

            // DISCORD CHANNEL/CATEGORY LIMITS
            if(i != 0 && i % 48 == 0 && MAIN.config.Raid_Lobbies == 'ENABLED'){
              new_category = await create_category(MAIN, 'exRaids', lobby_role, guild, discord);
            }
          }

          raid_passes.addField('**'+current_area+'**', gym_names);
          MAIN.Send_Embed(MAIN, 'ExPasses', 0, '', '', raid_passes, discord.ex_lobbies);
          return resolve();
        }
      });
    });
  });

  function create_category(MAIN, name, role, guild, discord){
    return new Promise(resolve => {
      guild.channels.create(name, { type: 'category' }).then( new_category => {

        // PUT CATEGORY AT THE TOP FOR EASY ACCESS LATER
        new_category.setPosition(0);

        // MAKE CATEGORY PRIVATE
        new_category.updateOverwrite(guild.roles.everyone, {VIEW_CHANNEL: false});

        // SET CATEGORY PERMISSIONS IF ROLE SET
        if(role){
            new_category.updateOverwrite(role, {VIEW_CHANNEL: true, READ_MESSAGE_HISTORY: true, SEND_MESSAGES: true, EMBED_LINKS: true, ADD_REACTIONS: true, USE_EXTERNAL_EMOJIS: true, ATTACH_FILES: true});
        }

        return resolve(new_category);
      });
    });
  }

  function create_channel(MAIN, name, channel, category, gym, guild, discord){
    return new Promise(resolve => {
      guild.channels.create(name, { type: 'text' }).then( new_channel => {
        // SET THE CATEGORY ID
        new_channel.setParent(category.id).then( async new_channel => {
          new_channel.lockPermissions();

          // CREATE ROLE FOR EX RAID AND GIVE CHANNEL THAT ROLE
          // let new_role = await guild.roles.create({ data: {
          //   name: gym.name,
          //   mentionable: true,
          //   permissions: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'ATTACH_FILES']
          // }});
          let new_role = {id: null};

          // CREATE EMBED FOR NEW CHANNEL
          let timezone = GeoTz(discord.geofence[0][1][1], discord.geofence[0][1][0])[0];
          let time = await MAIN.Bot_Time(gym.timestamp, 'date', timezone);
          let channel_embed = new MAIN.Discord.MessageEmbed()
          .setColor('FFD700')
          .setTitle(gym.name)
          .setDescription(`Pass for this gym appears to have gone out on **${time}**.`);
          MAIN.Send_Embed(MAIN, 'ExPasses', 0, '', '', channel_embed, new_channel.id);

          MAIN.pdb.query(`UPDATE ex_gyms SET message = ?, channel_id = ?, category_id = ?, role_id = ? WHERE id = ?`,
          [true, new_channel.id, category.id, new_role.id, gym.id], function (error, gyms, fields) {
            return resolve(new_channel);
          });

        });
      });
    })
  }

  // DYNAMICALLY SORT OBJECTS
  function dynamicSort(property) {
    let order = 1;
    if(property[0] === "-") {
      order = -1;
      property = property.substr(1);
    }
    return function (a,b) {
      let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * order;
    }
  }


  function dynamicSortMultiple() {
    let props = arguments;
    return function (obj1, obj2) {
      let result = 0, numberOfProperties = props.length;
      for(let i = 0; result === 0 && i < numberOfProperties; i++) {
        result = dynamicSort(props[i])(obj1, obj2);
      }
      return result;
    }
  }

}

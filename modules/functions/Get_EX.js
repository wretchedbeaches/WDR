module.exports = (MAIN) => {
  return new Promise(resolve => {
    // Check if passes have been sent
    let raid_passes = new MAIN.Discord.RichEmbed()
    .setColor('3b444b')
    .setTitle('ExPasses went out for these gyms:');

    // GET GYM NAMES FOR EX RAIDS
    let gym_names = '';

    // CYCLE THROUGH DISCORDS
    MAIN.Discords.Servers.forEach(async (discord, i) => {

      if(!discord.ex_lobbies){ return; }
      let guild = MAIN.guilds.get(discord.id); if(!guild){ return; }
      let channel = MAIN.channels.get(discord.ex_lobbies); if(!channel){ return; }

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

          let lobby_role = discord.ex_lobbies_role ? discord.ex_lobbies_role : guild.defaultRole;
          let new_category = MAIN.config.Raid_Lobbies == 'ENABLED' ? await create_category(MAIN, 'exRaids', lobby_role, guild, discord) : '';
          let current_area = '';
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
            gym_names += gym.name+' '+new_channel+'\n';

            //DISCORD EMBED LIMITS
            if(raid_passes.fields.length > 24){
              MAIN.Send_Embed(MAIN, 'ExPasses', 0, '', '', raid_passes, discord.ex_lobbies);
              raid_passes.fields = [];
            }

            // DISCORD CHANNEL/CATEGORY LIMITS
            if(i == 49 && MAIN.config.Raid_Lobbies == 'ENABLED'){ new_category = await create_category(MAIN, 'exRaids', lobby_role, guild, discord); }
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
      guild.createChannel(name, { type: 'category' }).then( new_category => {
        new_category.setPosition(0);
        new_category.overwritePermissions(guild.defaultRole, {READ_MESSAGES: false});
        new_category.overwritePermissions(role, {READ_MESSAGES: true, READ_MESSAGE_HISTORY: true, SEND_MESSAGES: true, EMBED_LINKS: true, ADD_REACTIONS: true, USE_EXTERNAL_EMOJIS: true, ATTACH_FILES: true});
        return resolve(new_category);
      });
    });
  }

  function create_channel(MAIN, name, channel, category, gym, guild, discord){
    return new Promise(resolve => {
      guild.createChannel(name, { type: 'text' }).then( new_channel => {
        // SET THE CATEGORY ID
        new_channel.setParent(category.id).then( async new_channel => {
          new_channel.lockPermissions();

          // await guild.createRole({name: gym.name, mentionable: true}).then(new_role => {
          //   console.log(new_role+' role created');
          //   new_channel.overwritePermissions(new_role, {READ_MESSAGES: true, READ_MESSAGE_HISTORY: true, SEND_MESSAGES: true, EMBED_LINKS: true, ADD_REACTIONS: true, USE_EXTERNAL_EMOJIS: true, ATTACH_FILES: true});

            let new_role = {id: null};
            MAIN.pdb.query(`UPDATE ex_gyms SET message = ?, channel_id = ?, category_id = ?, role_id = ? WHERE id = ?`,
            [true, new_channel.id, category.id, new_role.id, gym.id], function (error, gyms, fields) {
              return resolve(new_channel);
            });
          // }).catch(console.error);
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

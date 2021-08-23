const insideGeofence = require('point-in-polygon');
const insideGeojson = require('point-in-geopolygon');

module.exports.run = async (MAIN, message, prefix, server) => {

  // DECLARE VARIABLES
  let nickname = '', available_areas = '';

  let geofence = await MAIN.Geofences.get(server.geojson_file);
  if(!geofence){
    return message.reply('No geofence file has been set for this server. Contact a server admin if you think this is incorrect.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error);
  }

  let area_array = geofence.features.map(geofence => geofence.properties.name)

  // GET USER NICKNAME
  if(message.member){
    if(message.member.nickname){ nickname = message.member.nickname; } else{ nickname = message.member.user.username; }
  } else{
    nickname = message.author.username;
  }

  let requestAction = new MAIN.Discord.MessageEmbed()
    .setAuthor(nickname, message.author.displayAvatarURL)
    .setTitle('What would you like to do with your Area Subscriptions?')
    .setDescription('`view`  »  View your Areas.\n'
                   +'`add`  »  Add an Area.\n'
                   +'`remove`  »  Remove an Area.')
    .setFooter('Type the action, no command prefix required.');

  message.channel.send(requestAction).catch(console.error).then( msg => {

    // DEFINE COLLECTOR AND FILTER
    const filter = cMessage => cMessage.author.id == message.author.id;
    const collector = message.channel.createMessageCollector(filter, { time: 60000 });

    // FILTER COLLECT EVENT
    collector.on('collect', message => {
      switch(message.content.toLowerCase()){
        case 'add': collector.stop('add'); break;
        case 'remove': collector.stop('remove'); break;
        case 'view': collector.stop('view'); break;
        case 'cancel': collector.stop('cancel'); break;
        default: message.reply('`'+message.content+'` is not a valid option.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error);
      }
    });

    // COLLECTOR HAS BEEN ENDED
    collector.on('end', (collected,reason) => {

      // DELETE ORIGINAL MESSAGE
      msg.delete();
      switch(reason){
        case 'add': subscription_create(MAIN, message, nickname, prefix, area_array, server); break;
        case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array, server); break;
        case 'view': subscription_view(MAIN, message, nickname, prefix, area_array, server); break;
        default: return message.reply('Your subscription has timed out.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error);
      }
    });
  });
}

// AREA VIEW FUNCTION
async function subscription_view(MAIN, message, nickname, prefix, area_array, server){
  MAIN.pdb.query(`SELECT * FROM users WHERE user_id = ? AND discord_id = ?`, [message.author.id, server.id], function (error, user, fields) {
    if(!user || !user[0]){ return; }

    let area_list = user[0].geofence ? user[0].geofence.replace(/,/g,'\n') : area_list = 'None';

    // CREATE THE EMBED
    let area_subs = new MAIN.Discord.MessageEmbed()
      .setAuthor(nickname, message.author.displayAvatarURL)
      .setTitle('**Area Subscriptions**\nOverall Status: `'+user[0].status+'`')
      .setDescription('**Your Areas**:\n'+area_list)
      .setFooter('You can type \'view\', \'add\', or \'remove\'.');

    // SEND THE EMBED
    message.channel.send(area_subs).catch(console.error).then( msg => {

      // DEFINE COLLECTOR AND FILTER
      const filter = cMessage => cMessage.author.id == message.author.id;
      const collector = message.channel.createMessageCollector(filter, { time: 60000 });

      // FILTER COLLECT EVENT
      collector.on('collect', message => {
        switch(message.content.toLowerCase()){
          case 'add': collector.stop('add'); break;
          case 'remove': collector.stop('remove'); break;
          case 'view': collector.stop('view'); break;
          case 'cancel': collector.stop('cancel'); break;
          default: collector.stop('end');
        }
      });

      // COLLECTOR HAS BEEN ENDED
      collector.on('end', (collected,reason) => {

        // DELETE ORIGINAL MESSAGE
        msg.delete();

        switch(reason){
          case 'add': subscription_create(MAIN, message, nickname, prefix, area_array, server); break;
          case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array, server); break;
          case 'view': subscription_view(MAIN, message, nickname, prefix, area_array, server); break;
          case 'end': return;
        }
      });
    });
  });
}

// SUBSCRIPTION CREATE FUNCTION
async function subscription_create(MAIN, message, nickname, prefix, area_array, server){

  // PULL THE USER'S SUBSCRITIONS FROM THE USER TABLE
  MAIN.pdb.query(`SELECT * FROM users WHERE user_id = ? AND discord_id = ?`, [message.author.id, server.id], async function (error, user, fields) {

    // RETRIEVE AREA NAME FROM USER
    let sub = await sub_collector(MAIN, 'Name', nickname, message, 'Names are not case-sensitive. The Check denotes you are already subscribed to that Area.', user[0].geofence, area_array, server);
    if(sub.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'area` to restart.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error); }
    else if(sub == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error); }

    // DEFINED VARIABLES
    let areas = user[0].geofence ? user[0].geofence.split(',') : [];
    let area_index = areas.indexOf(sub);

    // CHECK IF USER IS ALREADY SUBSCRIBED TO THE AREA OR NOT AND ADD
    if(area_index >= 0){ return message.reply('You are already subscribed to this Area.').then(m => m.delete({ timeout: 10000, reason: 'It had to be done.' })).catch(console.error); }
    else{
      switch(true){
        case sub == 'all': areas = server.name; break;
        case user[0].geofence == server.name:
        case user[0].geofence == 'None': areas = []; areas.push(sub); break;
        default: areas.push(sub);
      }
    }

    // CONVERT TO STRING
    areas = areas.toString();

    // UPDATE THE USER'S RECORD
    MAIN.pdb.query(`UPDATE users SET geofence = ? WHERE user_id = ? AND discord_id = ?`, [areas, message.author.id, server.id], function (error, user, fields) {
      if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error); }
      else{
        let subscription_success = new MAIN.Discord.MessageEmbed().setColor('00ff00')
          .setAuthor(nickname, message.author.displayAvatarURL)
          .setTitle(sub+' Area Added!')
          .setDescription('Saved to the '+MAIN.config.BOT_NAME+' Database.')
          .setFooter('You can type \'view\', \'add\', or \'remove\'.');
        return message.channel.send(subscription_success).then( msg => {

          // DEFINE COLLECTOR AND FILTER
          const filter = cMessage => cMessage.author.id == message.author.id;
          const collector = message.channel.createMessageCollector(filter, { time: 60000 });

          // FILTER COLLECT EVENT
          collector.on('collect', message => {
            switch(message.content.toLowerCase()){
              case 'add': collector.stop('add'); break;
              case 'remove': collector.stop('remove'); break;
              case 'view': collector.stop('view'); break;
              case 'cancel': collector.stop('cancel'); break;
              default: collector.stop('end');
            }
          });

          // COLLECTOR HAS BEEN ENDED
          collector.on('end', (collected,reason) => {

            // DELETE ORIGINAL MESSAGE
            msg.delete();
            switch(reason){
              case 'add': subscription_create(MAIN, message, nickname, prefix, area_array, server); break;
              case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array, server); break;
              case 'view': subscription_view(MAIN, message, nickname, prefix, area_array, server); break;
              case 'end': return;
            }
          });
        });
      }
    });
  });
}

// SUBSCRIPTION REMOVE FUNCTION
async function subscription_remove(MAIN, message, nickname, prefix, area_array, server){

  // PULL THE USER'S SUBSCRITIONS FROM THE USER TABLE
  MAIN.pdb.query(`SELECT * FROM users WHERE user_id = ? AND discord_id = ?`, [message.author.id, server.id], async function (error, user, fields) {

    // RETRIEVE AREA NAME FROM USER
    let sub = await sub_collector(MAIN, 'Remove', nickname, message, 'Names are not case-sensitive. The Check denotes you are already subscribed to that Area.', user[0].geofence, area_array, server);
    if(sub.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'area` to restart.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error); }
    else if(sub == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error); }

    // DEFINED VARIABLES
    let areas = user[0].geofence ? user[0].geofence.split(',') : [];
    let area_index = areas.indexOf(sub);

    // CHECK IF USER IS ALREADY SUBSCRIBED TO THE AREA OR NOT AND ADD
    if(sub == 'all'){ areas = 'None'; }
    else if(area_index < 0){ return message.reply('You are not subscribed to this Area.').then(m => m.delete({ timeout: 10000, reason: 'It had to be done.' })).catch(console.error); }
    else{ areas.splice(area_index,1); }

    if(areas.length == 0){ areas = 'None'; }
    else{ areas = areas.toString(); }

    // UPDATE THE USER'S RECORD
    MAIN.pdb.query(`UPDATE users SET geofence = ? WHERE user_id = ? AND discord_id = ?`, [areas, message.author.id, server.id], function (error, user, fields) {
      if(error){ console.error(error); return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete({ timeout: 10000, reason: 'It had to be done.' })).catch(console.error); }
      else{
        let subscription_success = new MAIN.Discord.MessageEmbed().setColor('00ff00')
          .setAuthor(nickname, message.author.displayAvatarURL)
          .setTitle(sub+' Area Removed!')
          .setFooter('Saved to the '+MAIN.config.BOT_NAME+' Database.');
        return message.channel.send(subscription_success).then( msg => {

          // DEFINE COLLECTOR AND FILTER
          const filter = cMessage => cMessage.author.id == message.author.id;
          const collector = message.channel.createMessageCollector(filter, { time: 60000 });

          // FILTER COLLECT EVENT
          collector.on('collect', message => {
            switch(message.content.toLowerCase()){
              case 'add': collector.stop('add'); break;
              case 'remove': collector.stop('remove'); break;
              case 'view': collector.stop('view'); break;
              case 'cancel': collector.stop('cancel'); break;
              default: collector.stop('end');
            }
          });

          // COLLECTOR HAS BEEN ENDED
          collector.on('end', (collected,reason) => {

            // DELETE ORIGINAL MESSAGE
            msg.delete();
            switch(reason){
              case 'add': subscription_create(MAIN, message, nickname, prefix, area_array, server); break;
              case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array, server); break;
              case 'view': subscription_view(MAIN, message, nickname, prefix, area_array, server); break;
              case 'end': return;
            }
          });
        });
      }
    });
  });
}

// SUB COLLECTOR FUNCTION
function sub_collector(MAIN, type, nickname, message, requirements, sub, area_array, server){
  return new Promise(function(resolve, reject) {

    // DELCARE VARIABLES
    let timeout = true, instruction = '';

    // DEFINE COLLECTOR AND FILTER
    const filter = cMessage => cMessage.author.id == message.author.id;
    const collector = message.channel.createMessageCollector(filter, { time: 120000 });

    let user_areas = sub ? sub.toLowerCase().split(',') : [];
    // CREATE REWARD LIST AND ADD CHECK FOR SUBSCRIBED REWARDS
    let area_list = area_array.map( area => {
      if(user_areas.indexOf(area.toLowerCase()) >= 0){
        return area+' ✅\n';
      }
      else{ return area+'\n'; }
    }).join('');

    switch(type){

      // AREA NAME EMBED
      case 'Name':
        instruction = new MAIN.Discord.MessageEmbed()
          .setAuthor(nickname, message.author.displayAvatarURL)
          .setTitle('What Area would you like to Subscribe to?')
          .setDescription(area_list)
          .setFooter(requirements); break;

      // REMOVAL EMBED
      case 'Remove':
        instruction = new MAIN.Discord.MessageEmbed()
          .setAuthor(nickname, message.author.displayAvatarURL)
          .setTitle('What Area do you want to remove?')
          .setDescription(area_list)
          .setFooter(requirements); break;
    }

    message.channel.send(instruction).catch(console.error).then( msg => {

      // FILTER COLLECT EVENT
      collector.on('collect', message => {
        switch(true){
          case message.content.toLowerCase() == 'cancel': collector.stop('cancel'); break;

          // AREA NAME
          case type.indexOf('Name')>=0:
          case type.indexOf('Remove')>=0:
            if(message.content.toLowerCase() == 'all'){ collector.stop('all'); break; }
            for(let a = 0; a < area_array.length+1; a++){
              if(a == area_array.length){ message.reply('`'+message.content+'` doesn\'t appear to be a valid Area. Please check the spelling and try again.').then(m => m.delete({ timeout: 5000, reason: 'It had to be done.' })).catch(console.error); break; }
              else if(message.content.toLowerCase() == area_array[a].toLowerCase()){ collector.stop(area_array[a]); break; }
            } break;
        }
      });

      // COLLECTOR ENDED
      collector.on('end', (collected,reason) => {
        msg.delete();
        resolve(reason);
      });
    });
  });
}

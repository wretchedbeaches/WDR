const Fuzzy = require('fuzzy');
const InsideGeojson = require('point-in-geopolygon');

module.exports.run = async (MAIN, message, prefix, discord) => {

  let args = message.content.split(' ');
  args.shift();
  let action = args.shift();
  let id = args.shift();
  let account = args.shift();

  // RETURN FOR IMPROPER USE
  if(!action){ return correctUse(MAIN, message); }

  // DEFINE USERID FOR SHINY ACCOUNT
  if(id){
    id = id.slice(2,-1);
    if(id.split('!')[1]){
      id = id.split('!');
      id = id[1].toString();
    }
  }

  let user = await MAIN.guilds.cache.get(discord.id).members.get(id);
  if(!user){ user = { username: '', id: '' }; }
  else {
    user.username = user.user.username.replace(/[\W]+/g,'');
  }

  // DEFINE BOT ACCOUNT TO REPORT TO USER
  if(!account){ account = 'All'; }
  if(account.toLowerCase() == 'all'){ account = 'All'; }

  // DEFINE ACTION
  switch (action.toLowerCase()) {
    case 'add': return addShiny(MAIN, message, account, user);
    case 'list': return listShiny(MAIN, message, account, user);
    case 'remove': return removeShiny(MAIN, message, account, user);
    default: return correctUse(MAIN, message, account, user);
  }
}

function addShiny(MAIN, message, account, user){
  if(!user){ return message.reply('Not a correct user on your discord.').then(m => m.delete({ timeout: 15000, reason: 'It had to be done.' })).catch(console.error); }
  MAIN.pdb.query(`INSERT INTO shiny (account, user_name, user_id) VALUES (?, ?, ?);`, [account, user.username, user.id], function (error, shiny, fields){
    if(error){
      console.log('[COMMANDS] ['+MAIN.Bot_Time(null,'stamp')+'] [shiny.js]'+error);
      return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete({ timeout: 15000, reason: 'It had to be done.' })).catch(console.error);
    }
    message.reply('**Account**: *'+account+'* added for '+user).then(m => m.delete({ timeout: 15000, reason: 'It had to be done.' })).catch(console.error);
    return listShiny(MAIN, message, account, user);
  });
}

function listShiny(MAIN, message, account, user){
  let select = 'SELECT * FROM shiny';
  if(user.id){ select += ' WHERE user_id = ?;' }
  else{ select += ';'; }

  MAIN.pdb.query(select, [user.id],async function (error, shiny, fields){
    if(error){
      console.log('[COMMANDS] ['+MAIN.Bot_Time(null,'stamp')+'] [shiny.js]'+error);
      return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete({ timeout: 15000, reason: 'It had to be done.' })).catch(console.error);
    }

    if(!shiny || !shiny[0]){ return message.channel.send('No accounts.'); }

    let list_embed = new MAIN.Discord.MessageEmbed()
    .setColor('ee0000');
    await shiny.forEach(user => {
      list_embed.addField(user.user_name, user.account);
    })
    return message.channel.send(list_embed).then(m => m.delete({ timeout: 15000, reason: 'It had to be done.' })).catch(console.error);;
  });
}

function removeShiny(MAIN, message, account, user){
  if(!user){ return message.reply('Not a correct user on your discord.').then(m => m.delete({ timeout: 15000, reason: 'It had to be done.' })).catch(console.error); }
  MAIN.pdb.query(`DELETE FROM shiny WHERE account = ? AND user_id = ?;`, [account, user.id], function (error, shiny, fields){
    if(error){
      console.log('[COMMANDS] ['+MAIN.Bot_Time(null,'stamp')+'] [shiny.js]'+error);
      return message.reply('There has been an error removing account: '+account+'for '+user).then(m => m.delete({ timeout: 15000, reason: 'It had to be done.' })).catch(console.error);
    }
    message.reply('**Account**: *'+account+'* removed for '+user).then(m => m.delete({ timeout: 15000, reason: 'It had to be done.' })).catch(console.error);
    return listShiny(MAIN, message, account, user);
  });
}

function correctUse(MAIN, message, account, user){
  return message.reply('Proper use of shiny is:\n```'+MAIN.config.PREFIX+'shiny <add|list|remove> @user accountUsername(Must match account username in DB, if not supplied default `All`)```').then(m => m.delete({ timeout: 15000, reason: 'It had to be done.' })).catch(console.error);;
}

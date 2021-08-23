const Send_PvP = require('../embeds/pvp.js');
const pvp = require('../base/pvp.js');

module.exports.run = async (MAIN, sighting, area, server, timezone) => {

  let internal_value = (sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  let time_now = new Date().getTime(); internal_value = Math.floor(internal_value*1000)/10;
  if(MAIN.config.BLACKLISTED && MAIN.config.BLACKLISTED.split(',').indexOf(sighting.pokemon_id) >= 0){ return; }
  let generation = MAIN.Get_Gen(MAIN, sighting.pokemon_id);

  if(!sighting.cp){ return; }

  // FETCH ALL USERS CHECK POKEMON SUBSCRIPTIONS
  MAIN.pdb.query(`SELECT * FROM users WHERE discord_id = ? AND status = ?;`, [server.id, 'ACTIVE'], function (error, pokemon_subs, fields){
    if(pokemon_subs && pokemon_subs[0]){
      pokemon_subs.forEach(async (user,index) => {

        //FETCH THE GUILD MEMBER AND CHECK IF A ADMINISTRATOR/DONOR
        if(user.discord_id != server.id){ return; }
        let guild = MAIN.guilds.cache.get(server.id);
        let member = guild.members.cache.get(user.user_id);
        switch(true){
          case !guild:
          case !member:
          case member == undefined: return;
          case MAIN.config.Donor_Check == 'DISABLED': break;
          case !member.roles.cache.some(r=>server.donor_role.includes(r.id)): return;
        }

        // DEFINE VARIABLES
        let user_areas = user.geofence ? user.geofence.split(',') : [];
        let embed = {embed: 'pvp.js'};

        if(user.pvp && user.pvp_status == 'ACTIVE' && MAIN.config.PVP.Subscriptions == 'ENABLED'){

          // CONVERT PVP LIST TO AN ARRAY
          let pokemon_pvp = JSON.parse(user.pvp);

          // CHECK EACH USER PVP SUBSCRIPTION
          pokemon_pvp.subscriptions.forEach((sub,index) => {
            // AREA CHECK
            let area_pass = false;
            switch(true){
              case !sub.areas:
              case sub.areas == 'No':
                area_pass = true; break;
              case sub.areas !== 'Yes':
                if(sub.areas.split(',').indexOf(area.main) >= 0){ area_pass = true; }
                if(sub.areas.split(',').indexOf(area.sub) >= 0){ area_pass = true; } break;
              case user.geofence == server.name:
                area_pass = true; break;
              case user_areas.indexOf(area.main) >= 0:
                area_pass = true; break;
              case user_areas.indexOf(area.sub) >= 0:
                area_pass = true; break;
            }

            // CHECK IF THE AREA IS WITHIN THE USER'S GEOFENCES
            if(area_pass == true){

              // CHECK FOR EVOLUTIONS FOR NAME FILTER
              let evolution_pass = false, sub_id = 0;
              for (key in MAIN.masterfile.pokemon) {
                 if (MAIN.masterfile.pokemon[key].name === sub.name.split(' ')[0]) {
                   sub_id = key;
              }}
              MAIN.masterfile.pokemon[sighting.pokemon_id].evolutions.forEach((evolve_id) => {
                if(evolve_id == sub_id){ evolution_pass = true; }
                MAIN.masterfile.pokemon[evolve_id].evolutions.forEach((evolved_id) => {
                  if(evolved_id == sub_id){ evolution_pass = true; }
              }); });

              // CHECK POKEMON NAME
              if(sub.name.startsWith(sighting.locale.pokemon_name) || sub.name.toLowerCase().startsWith('all') || evolution_pass == true){


                if(sub.min_rank.toString().toLowerCase() == 'all'){
                  sub.min_rank = 4096;
                }
                if(sub.min_percent.toString().toLowerCase() == 'all'){
                  sub.min_percent = 0;
                }
                sub.min_rank = parseInt(sub.min_rank);

                // PVP Filtering
                if(sighting.cp > sub.max_cp) { return sightingFailed(MAIN, user, sighting, 'Max CP Range'); }
                let unique_cps = {};

                let league = sub.league.toLowerCase();
                switch (league) {
	          case 'little': league = 'little_league'; break;
	          case 'l50 little': league = 'l50_little_league'; break;
	          case 'bb little': league = 'bb_little_league'; break;
              	  case 'great': league = 'great_league'; break;
		  case 'l50 great': league = 'l50_great_league'; break;
	          case 'bb great': league = 'bb_great_league'; break;
              	  case 'ultra': league = 'ultra_league'; break;
		  case 'l50 ultra': league = 'l50_ultra_league'; break;
		  case 'bb ultra': league = 'bb_ultra_league'; break;
		  case 'master': league = 'master_league'; break;
                  case 'all':
		    if(sub.max_cp <= 1500) {
	 	      league = 'great_league';
		    }
		    else {
		      league = 'ultra_league';
		    }
                  default: league = 'great_league';
                }

                for(let i = 0; i < sighting[league].length; i++){
                  if(sighting[league][i].percent >= sub.min_percent && sighting[league][i].rank <= sub.min_rank && sighting[league][i].cp >= sub.min_cp)
                  {
                    if(!unique_cps[sighting[league][i].pokemon_id]) { unique_cps[sighting[league][i].pokemon_id] = {}; }
                    unique_cps[sighting[league][i].pokemon_id].rank = sighting[league][i].rank;
                    unique_cps[sighting[league][i].pokemon_id].percent = sighting[league][i].percent;
                    unique_cps[sighting[league][i].pokemon_id].level = sighting[league][i].level;
                    unique_cps[sighting[league][i].pokemon_id].cp = sighting[league][i].cp;
                    unique_cps[sighting[league][i].pokemon_id].value = sighting[league][i].value;
                    unique_cps[sighting[league][i].pokemon_id].form_id = sighting[league][i].form_id;
                  }
                }

                if(Object.keys(unique_cps).length == 0 ) { return sightingFailed(MAIN, user, sighting, 'CP Range'); }
                if(evolution_pass && !unique_cps[sub_id]){ return sightingFailed(MAIN, user, sighting, 'Evolution['+sub_id+'] Pass Failed '+JSON.stringify(unique_cps)); }

                Send_PvP.run(MAIN, user, sighting, internal_value, time_now, area, server, timezone, '', embed, unique_cps);
              } else{ return sightingFailed(MAIN, user, sighting, 'Name Filters'); }
            } else{ return sightingFailed(MAIN, user, sighting, 'Area Filter'); }
          });
        }
      });
    } return;
  });
}

function sightingFailed(MAIN, user, sighting, reason){
  if(MAIN.debug.PVP == 'ENABLED' && MAIN.debug.Subscriptions == 'ENABLED'){ return console.info(MAIN.Color.blue+'[SUBSCRIPTIONS] ['+MAIN.Bot_Time(null,'stamp')+'] [pokemon.js] [PvP] '+sighting.locale.pokemon_name+' failed '+user.user_name+'\'s because of '+reason+' check.'+MAIN.Color.reset); }
}

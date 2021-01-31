const StaticMaps = require('staticmaps');
const fs = require('fs');
const axios = require('axios');
// CHECK FOR OR CREATE MAP TILES FOR EMBEDS
module.exports = async (MAIN, lat, lon, url, url2) => {
    //  SET TILE SERVER CACHE URL

    if(!url){ url = 'https://i.imgur.com/OGMRWnh.png'; }

    let spawnstops = await MAIN.Get_Spawn_Stops(MAIN, lat, lon);    
    let spawngyms = await MAIN.Get_Spawn_Gyms(MAIN, lat, lon);

    return new Promise(resolve => {

    if(MAIN.config.Raid_Stops == 'ENABLED') {
	    axios.post(MAIN.config.Tile_Static+'staticmap/wdr-raid/?&pregenerate=true&regeneratable=true' , {
               url: url,
               url2: url2,
               lat: lat,
               lon: lon,
               stops: spawnstops,
               gyms: spawngyms
          })
	  .then((res) => {
          return resolve(res.data)
          })
          .catch((error) => {
          return 'https://i.imgur.com/OGMRWnh.png';
          console.error(error);
          })
    }
    else {
        axios.post(MAIN.config.Tile_Static+'staticmap/wdr-raid/?pregenerate=true&regeneratable=true' , {
               url: url,
               url2: url2,
               lat: lat,
               lon: lon
            })
          .then((res) => {
          return resolve(res.data)
 	  })
          .catch((error) => {
	  return 'https://i.imgur.com/OGMRWnh.png';
          console.error(error);
          })
    }
})
}

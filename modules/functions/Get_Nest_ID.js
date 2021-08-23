const StaticMaps = require('staticmaps');
const fs = require('fs');
const axios = require('axios');
// CHECK FOR OR CREATE MAP TILES FOR EMBEDS
module.exports = async (MAIN, lat, lon, url, url2, url3, geofence) => {
    //  SET TILE SERVER CACHE URL

    if(!url){ url = 'https://i.imgur.com/OGMRWnh.png'; }
    var get_id = '';
    let polygons = JSON.stringify(geofence);

    let neststops = await MAIN.Get_Nest_Stops(MAIN, geofence);
    let nestgyms = await MAIN.Get_Nest_Gyms(MAIN, geofence);


    return new Promise(resolve => {

    if(MAIN.config.Nest_Stops == 'ENABLED') {
    	axios.post(MAIN.config.Tile_Static+'staticmap/nest/?&pregenerate=true&regeneratable=true' , { 
	       url: url,
	       url2: url2,
	       url3: url3,
	       lat: lat,
	       lon: lon,
	       polygon: polygons,
	       stops: neststops,
	       gyms: nestgyms
	  })
	  .then((res) => {
          return resolve(res.data)
	  })
          .catch((error) => {
          return 'https://i.imgur.com/OGMRWnh.png'
          console.error(error)
 	  })
    }
    else {
    	axios.post(MAIN.config.Tile_Static+'staticmap/nest/?pregenerate=true&regeneratable=true' , {
	       url: url,
	       url2: url2,
	       url3: url3,
	       lat: lat,
	       lon: lon,
	       polygon: polygons
	    })		
	  .then((res) => {
          return resolve(res.data)
	  })
          .catch((error) => {
          return 'https://i.imgur.com/OGMRWnh.png'
          console.error(error)
 	  })
    }
    })
}

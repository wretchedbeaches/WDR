const StaticMaps = require('staticmaps');
const fs = require('fs');

// CHECK FOR OR CREATE MAP TILES FOR EMBEDS
module.exports = async (MAIN, lat, lon, url, url2, geofence) => {
  if(MAIN.config.Tile_Static){
    if(!url){ url = 'https://i.imgur.com/OGMRWnh.png'; }
    let zoom = 16;
    let width = parseInt(MAIN.config.Tile_Width);
    let height = parseInt(MAIN.config.Tile_Height);
    let markers = 'markers=';
    let polygons = '&polygons=';

    let json = [{
      url: url,
      height: 40,
      width: 40,
      x_offset: 0,
      y_offset: url2 ? -25 : 0,
      latitude: lat,
      longitude: lon
    }];

    if(url2){
      json.splice(0, 0, {
        url: url2,
        height: 40,
        width: 40,
        x_offset: 0,
        y_offset: 0,
        latitude: lat,
        longitude: lon
      });
    }

    // NEST POLYGON
    if(geofence){
      let polygon_json = [{
        fill_color: 'rgba(255, 0, 0, 0.5)',
        stroke_color: 'black',
        stroke_width: 1,
        path: geofence
      }]
      //console.log(JSON.stringify(polygon_json));
      polygons += encodeURIComponent(JSON.stringify(polygon_json));
    } else { polygons = ''; }
    // ENCODE MARKER URI
    markers += encodeURIComponent(JSON.stringify(json));

    //  SET TILE SERVER CACHE URL
    let tile_server = MAIN.config.Tile_Static+'static/klokantech-basic/'+lat+'/'+lon+'/'+zoom+'/'+width+'/'+height+'/2/png?'+markers;

    // ADD POLYGONS TO TILE SERVER CACHE URL FOR DISCORD API LIMITS
    polygons = tile_server+polygons;

    // SET TILE SERVER URL TO INCLUDE POLYGONS IF OVER THE LIMIT
    if(polygons.length >= 2048 && MAIN.config.SHORTURL){
      tile_server = polygons;
    }
    // ALWAYS ADD POLYGON GEOFENCE IF UNDER API LIMITS
    else if(polygons.length < 2048){
      tile_server = polygons;
    }

    tile_server = await MAIN.Short_URL(MAIN, tile_server);

    if(MAIN.debug.Map_Tiles == 'ENABLED'){
      console.info('[GET_TILE] ['+MAIN.Bot_Time(null,'stamp')+'] '+tile_server);
    }

    return tile_server;
  } else {
    return '';
  }
}

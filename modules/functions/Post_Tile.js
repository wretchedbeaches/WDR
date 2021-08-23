module.exports = async (MAIN, body) => {

        
	let tile_server = '';
	if (body != 'https://i.imgur.com/OGMRWnh.png') {
		tile_server = MAIN.config.Tile_Static+'staticmap/pregenerated/'+body;
		tile_server = await MAIN.Short_URL(MAIN, tile_server);
	}

	else {
		tile_server = body
	}

        if(MAIN.debug.Map_Tiles == 'ENABLED'){
          console.info('[GET_TILE] ['+MAIN.Bot_Time(null,'stamp')+'] '+tile_server);
        }
	return tile_server;
}

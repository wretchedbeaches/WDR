const mysql = require('mysql');


module.exports = (MAIN, lat, lon) => {


    return new Promise(resolve => {

    let stops = "SELECT lat, lon, POW(69.1 * (lat - "+lat+"), 2) + POW(69.1 * ("+lon+" - lon) * COS(lat / 57.3), 2) AS distance FROM pokestop WHERE lat != "+lat +"AND lon != "+lon+" ORDER BY distance ASC LIMIT 30";
    let stoparray = '[';

    MAIN.rdmdb.query(stops, function(err, result, fields){
	if(err) {
		console.log(err);
	}
	else {
		for (j = 0; j < result.length; j++) {
			if(j != result.length-1) {
				stoparray += '['+result[j].lat + ',' + result[j].lon + ']' + ',';
	}
			else {
				stoparray += '['+result[j].lat + ',' + result[j].lon + ']]';
			}
		}
	}
	return resolve(stoparray);

      });
})

}

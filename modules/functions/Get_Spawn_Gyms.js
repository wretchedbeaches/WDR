const mysql = require('mysql');


module.exports = (MAIN, lat, lon) => {


    return new Promise(resolve => {

    let gyms = "SELECT lat, lon, team_id, POW(69.1 * (lat - "+lat+"), 2) + POW(69.1 * ("+lon+" - lon) * COS(lat / 57.3), 2) AS distance FROM gym WHERE lat != "+lat +"AND lon != "+lon+" ORDER BY distance ASC LIMIT 15";

    let gymarray = '[';

    MAIN.rdmdb.query(gyms, function(err, result, fields){
	if(err) {
		console.log(err);
	}
	else {
		for (j = 0; j < result.length; j++) {
			if(j != result.length-1) {
				gymarray += '['+result[j].lat + ',' + result[j].lon + ',' + result[j].team_id + ']' + ',';
	}
			else {
				gymarray += '['+result[j].lat + ',' + result[j].lon + ',' + result[j].team_id + ']]';
			}
		}
	}
	return resolve(gymarray);

      });
})

}

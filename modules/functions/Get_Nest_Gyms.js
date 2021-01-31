const mysql = require('mysql');


module.exports = (MAIN, geofence) => {

    let sqlfence = '';

    for (i = 0; i<=geofence.length-1; i++ ) {
        if(i != geofence.length-1) {
		sqlfence += geofence[i][0] + ' ' + geofence[i][1] + ',';
	}
	else {
		sqlfence += geofence[i][0] + ' ' + geofence[i][1];
	}
    }

    return new Promise(resolve => {

    let gyms = "SELECT lat,lon,team_id FROM gym where ST_CONTAINS(ST_GEOMFROMTEXT(\'POLYGON(("+sqlfence+"))\'), point(gym.lat, gym.lon))";
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

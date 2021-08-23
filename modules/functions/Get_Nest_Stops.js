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

    let stops = "SELECT lat,lon FROM pokestop where ST_CONTAINS(ST_GEOMFROMTEXT(\'POLYGON(("+sqlfence+"))\'), point(pokestop.lat, pokestop.lon))";
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

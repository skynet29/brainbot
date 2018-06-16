var agent = require('../lib/agent')


var stops = require('../db/bebus/stops.json')

agent.onConnect(function() {
	//agent.emit('aisReport.vehicule.drone')
	for(var id in stops) {
		console.log('id', id)
		var stop = stops[id][0]
		console.log('stop', stop)
		if (stop != undefined) {
			agent.emit('mapViewAddShape.default.' + stop.Stop_id, 
			{
				latlng: {
					lat: parseFloat(stop.Stop_lat),
					lng: parseFloat(stop.Stop_lon)
				},
				shape: 'marker',
				label: id
			})				

		}
	}

	

})




agent.start()
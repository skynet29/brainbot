var agent = require('../lib/agent')


var stopsRoute = require('../db/bebus/stopsRoute.json')

var colorsMap = {
	'A': 'blue',
	'1': 'red',
	'3': 'green'
}

agent.onConnect(function() {
	//agent.emit('aisReport.vehicule.drone')
	for(var id in colorsMap) {
		console.log('id', id)
		var stops = stopsRoute[id]
		var color = colorsMap[id]

		if (Array.isArray(stops)) {

			var latlngs = stops.map((stop) => {
					return {
						lat: parseFloat(stop.Stop_lat),
						lng: parseFloat(stop.Stop_lon),
					}
				})

			agent.emit('mapViewAddShape.default.' + id, 
			{
				latlngs: latlngs,
				shape: 'polyline',
				options: {
					color: color
				}
			})	

			stops.forEach((stop) => {
				agent.emit('mapViewAddShape.mission.' + stop.Stop_id, {
					latlng: {
						lat: parseFloat(stop.Stop_lat),
						lng: parseFloat(stop.Stop_lon)
					},
					shape: 'circleMarker',
					options: {
						radius: 3,
						color: 'white'
					},
					label: stop.Stop_name
				})
			})			
		}
	}

	

})

agent.onMsg('mapViewShapeEdited', function(msg) {
	console.log('Receive msg', msg)
	agent.emit('mapViewAddShape.' + msg.data.id, msg.data)
})


agent.onClose(function() {
	for(var id in colorsMap) {
		console.log('id', id)
		var stops = stopsRoute[id]
		var color = colorsMap[id]

		if (Array.isArray(stops)) {

			agent.emit('mapViewAddShape.default.' + id) 

			stops.forEach((stop) => {
				agent.emit('mapViewAddShape.mission.' + stop.Stop_id)
			})			
		}
	}	
}) 

agent.start()
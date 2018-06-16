var agent = require('../lib/agent')
var path = require('path')
var config = agent.config
var depots = require(path.join('../db', config.fileName))
console.log('depots', depots)

agent.onConnect(function() {
	//agent.emit('aisReport.vehicule.drone')
	for(var id in depots) {
		agent.emit('mapViewAddShape.' + id, {latlng: depots[id], shape: 'marker'})			
	}
	

})




agent.start()
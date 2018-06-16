var agent = require('../lib/agent')
var path = require('path')
var config = agent.config
var data = require(path.join('../db', config.fileName))


agent.onConnect(function() {
	//agent.emit('aisReport.vehicule.drone')	
	agent.emit('mapViewAddShape.default.route', {latlngs: data.latlngs, shape: 'polyline'})	

})




agent.start()
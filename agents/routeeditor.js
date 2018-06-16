var agent = require('../lib/agent')
var path = require('path')
var config = agent.config
var data = require(path.join('../db', config.fileName))
var fs = require('fs')


agent.onConnect(function() {
	//agent.emit('aisReport.vehicule.drone')	
	agent.emit('mapViewAddShape.default.route', {latlngs: data.route, shape: 'polyline'})	

})


agent.register('mapViewPolylineCreated', false, (msg) => {
	console.log('Receive msg', msg)
	var data = msg.data

	
	agent.emit('mapViewAddShape.default.route', data)

})

agent.onMsg('mapViewShapeEdited', function(msg) {
	console.log('Receive msg', msg)
	agent.emit('mapViewAddShape.' + msg.data.id, msg.data)
	var fileName = path.join(__dirname, '../db', config.outFileName)
	delete msg.data.id
	delete msg.data.shape
	fs.writeFile(fileName, JSON.stringify(msg.data, null, 4), (err) => {
		if (err) {
			console.log(err)
		}
		else {
			console.log(`The file ${fileName} has been saved`)
		}		
	})
})

agent.start()
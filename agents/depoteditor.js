var agent = require('../lib/agent')
var path = require('path')
var config = agent.config
var fs = require('fs')

var depots = require(path.join('../db', config.fileName))

agent.onConnect(function() {
	for(var id in depots) {
		agent.emit('mapViewAddShape.' + id, {latlng: depots[id], shape: 'marker'})			
	}
	

})

function getFreeId() {
	var max = 0
	for(var k in depots) {
		max = Math.max(max, parseInt(k.split('_')[1]))
	}
	return max + 1
}


agent.register('mapViewMarkerCreated', false, function(msg) {
	console.log('Receive msg', msg)
	var id = getFreeId()
	var fullId = 'default.depot_' + id

	agent.emit('mapViewAddShape.' + fullId, msg.data)
	depots[fullId] = msg.data.latlng
	saveDb()

})


agent.onMsg('mapViewShapeEdited', function(msg) {
	console.log('Receive msg', msg)
	agent.emit('mapViewAddShape.' + msg.data.id, msg.data)
	depots[msg.data.id] = msg.data.latlng
	saveDb()	
})

agent.onMsg('mapViewShapeDeleted', function(msg) {
	console.log('Receive msg', msg)
	agent.emit('mapViewAddShape.' + msg.data.id)
	delete depots[msg.data.id]
	saveDb()	
})

function saveDb() {
	var fileName = path.join(__dirname, '../db', config.fileName)
	fs.writeFile(fileName, JSON.stringify(depots, null, 4), (err) => {
		if (err) {
			console.log(err)
		}
		else {
			console.log(`The file ${fileName} has been saved`)
		}		
	})	
}

agent.start()
const agent  = require('../lib/agent')

var id = 0
var layerName = 'default'

const colors = [
	'green',
	'red', 
	'blue'
]

agent.register('mapViewShapeCreated.circle', false, function(msg) {
	console.log('Receive msg', msg)
	var data = msg.data
	var color = colors[id % 3]
	
	data.options = {color: color, fill: false, dashArray: "5, 5, 1, 5"}
	agent.emit('mapViewAddShape.default.circle_' + id++, data)
})

agent.onMsg('mapViewShapeEdited', function(msg) {
	console.log('Receive msg', msg)
	agent.emit('mapViewAddShape.' + msg.data.id, msg.data)
})

agent.onMsg('mapViewShapeDeleted', function(msg) {
	console.log('Receive msg', msg)
	agent.emit('mapViewAddShape.' + msg.data.id)
})



agent.start()
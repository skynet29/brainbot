const agent  = require('../lib/agent')


agent.start()


setInterval(function() {
	agent.emit('gpsData', {lat: 48, lng: -4})
}, 5000)

setInterval(function() {
	agent.emit('aisData', {lat: 48, lng: -4})
}, 10000)

const agent  = require('../lib/agent')


agent.register('gpsData', true, function(msg) {
	console.log('Receive msg', msg)
})

agent.register('aisData', true, function(msg) {
	console.log('Receive msg', msg)
})

agent.start()
var agent = require('../lib/agent')
var path = require('path')
var config = agent.config
const data = require(path.join('../db', config.fileName))

const period = config.period || 1000
const topic = 'busReport.vehicule.' + config.name
var timer = null

agent.onConnect(function() {
	//agent.emit('aisReport.vehicule.drone')	
	agent.emit(topic)	
})


agent.register('startBus', false, startBus)

function updateBusPos(latlng) {

	agent.emit(topic, {
	//agent.emit('aisReport.vehicule.drone', {
		//heading: simu.heading,
		latlng: latlng,
		 name: config.name,
		 color: 'green',
		 icon: config.icon
	})


}

function startBus() {
	var idx = 0
	if (timer != null) {
		clearInterval(timer)
	}

	timer = setInterval(() => {
		if (idx < data.gps.length) {
			updateBusPos(data.gps[idx++].latlng)
		}
		else {
			clearInterval(timer)
		}

	}, period )	
}







agent.start()
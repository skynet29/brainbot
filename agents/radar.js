const agent  = require('../lib/agent')


agent.start()

var angle = 0
var topic = 'mapViewAddShape.default.radar1'

function update() {
	agent.emit(topic, {
			"shape": "sector",
			"latlng": {
				"lat":48.4, 
				"lng":-4.47		
			},

			"radius": 1000,
			"direction": angle,
			"size": 60,
			"options": {
				"color": "yellow"
			}
	})
}

setInterval(function() {
	update()
	angle = (angle + 10) % 360
}, 100)


agent.onClose(function() {
	agent.emit(topic)
})

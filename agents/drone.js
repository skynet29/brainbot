var agent = require('../lib/agent')
var Geodesy = require('../lib/geodesy')
var formules = require('../lib/formules')
var Simulator = require('../lib/simulator')
var fs  = require('fs')
var path = require('path')

var config = agent.config
var storeInFile = config.storeInFile || false
var storeFileName = config.storeFileName
var history = []

var geodesy = new Geodesy({lat:48.3583, lng:-4.53417})

var target = null
var captureRadius = config.captureRadius || 10 // m

var wpts = null // liste des points à ralier (waypoint)
var routePath = null
var simu = new Simulator(config) 
simu.speed = 15 // en noeud
var posInit = false


agent.onConnect(function() {
	//agent.emit('aisReport.vehicule.drone')	
	agent.emit('mapViewAddShape.vehicule.drone')	
	agent.emit('mapViewAddShape.vehicule.target')
	agent.emit('mapViewAddShape.vehicule.path')
})


function updateDrone(dist, unit) {

	agent.emit('mapViewAddShape.vehicule.drone', {
	//agent.emit('aisReport.vehicule.drone', {
		rotationAngle: simu.heading,
		shape: 'marker',
		latlng: geodesy.pos2gps(simu.curPos),
		 name: 'My Drone',
		 icon: config.icon,
		 popupContent: [
		 	{label: 'Heading', prop: 'heading'},
		 	{label: 'Distance', prop: 'distance'}
		 ],
		 props: {
		 	heading: simu.heading.toFixed(0),
		 	distance: dist + unit
		 }
	})

	if (storeInFile) {
		var id = history.length + 1
		history.push({id: id, latlng: geodesy.pos2gps(simu.curPos)})
	}
}

agent.register('initPos', false, (msg) => {
	console.log('msg', msg)
	
	simu.curPos = geodesy.gps2pos(msg.data)
	posInit = true
	updateDrone()

	if (target != null) {
		startSimu()
	}
	

})

agent.register('goTarget', false, (msg) => {
	console.log('msg', msg)
	target = geodesy.gps2pos(msg.data)
	updateTarget()
	
	if (posInit) {
		startSimu()		
	}


})


agent.register('mapViewShapeCreated.polyline', false, (msg) => {
	console.log('Receive msg', msg)
	var data = msg.data

	
	agent.emit('mapViewAddShape.vehicule.path', data)

	wpts = data.latlngs
	routePath = [].concat(wpts)
	//simu.curPos = geodesy.gps2pos(wpts.shift())
	target = geodesy.gps2pos(wpts.shift())
	//updateDrone()
	updateTarget()

	startSimu()

/*	if (posInit) {
		startSimu()		
	}	*/

})

function updateTarget() {
	agent.emit('mapViewAddShape.vehicule.target', {
		shape: 'circle',
		radius: captureRadius,
		latlng: geodesy.pos2gps(target),
		options:{color: 'yellow'}
	})
}

function startSimu() {

	console.log('startSimu')

	simu.start()
	var timerId = setInterval(() => {
		if (target != null) {



			var route = formules.route(simu.curPos, target)
			if (route.dist < captureRadius) {
				if (wpts != null && wpts.length != 0) {
					target = geodesy.gps2pos(wpts.shift())
					updateTarget()
				}
				else {
					clearInterval(timerId)
					if (storeInFile) {
						var filePath = path.join(__dirname, '../db', storeFileName)
						console.log('filePath', filePath)
						console.log('historyLength', history.length)
						content = JSON.stringify({gps: history, route: routePath}, null, 4)

						fs.writeFile(filePath, content, (err) => {
							if (err) {
								console.log(err)
							}
							else {
								console.log(`The file ${storeFileName} has been saved`)
							}
							
						})
					}
				}
			}

			simu.update(route.heading)
			

			var distance = route.dist
			var distUnit = ' m'
			if (distance > 1000) {
				distance = (distance / 1000).toFixed(2)
				distUnit = ' km'
			}
			else {
				distance = distance.toFixed(0)
			}	

			updateDrone(distance, distUnit)


		}
	}, 100)
}

agent.start()
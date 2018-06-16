const agent  = require('../lib/agent')
var Geodesy = require('../lib/geodesy')
var formules = require('../lib/formules')


var geodesy = new Geodesy({lat:48.3583, lng:-4.53417})

var pts = null


agent.onConnect(function() {
})

agent.register('mapViewAddShape.default.route', true, (msg) => {
	console.log('Receive msg', msg)
	if (msg.data != undefined) {
		var data = msg.data
		pts = convertToXY(data.latlngs)
		console.log('pts', pts)		
	}


})

agent.register('busReport.*.*', false, (msg) => {
	console.log('busReport', msg)
	var dist
	if (pts != null && msg.data != undefined) {
		var pt = geodesy.gps2pos(msg.data.latlng)

		var closest = formules.closestPtToPolyline(pts, pt)
		//console.log('dist', dist)
		dist = formules.distance(closest, pt)

		
	}

	msg.data.popupContent = [{label: 'Distance', prop: 'distance'}]

	if (dist != undefined) {
		msg.data.props = {distance: dist.toFixed(1)}
	}

	if (dist > 3) {
		msg.data.icon.color = 'red'
	}

	var data = Object.assign({shape: 'marker'}, msg.data)
	
	agent.emit('mapViewAddShape.' + msg.id, data)

})


function convertToXY(latlngs) {
	console.log('convertToXY', latlngs)
	return latlngs.map((latlng) => {
		return geodesy.gps2pos(latlng)
	})
}





agent.start()
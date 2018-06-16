const agent  = require('../lib/agent')
var mapDownloader = require('map-tile-downloader/map-tile-downloader.js')


agent.register('mapViewRectangleCreated', false, function(msg) {
	console.log('Receive msg', msg)
	var data = msg.data
	var options = {
		url: 'http://a.tile.osm.org/{z}/{x}/{y}.png',
		rootDir: './temp',
		bbox: [
			data.northWest.lat,
			data.northWest.lng,
			data.southEast.lat,
			data.southEast.lng
		],
		zoom: {
			max: 18,
			min: 11
		}
	}
	mapDownloader.run(options, function(err) {
		console.log('Finish !')
		console.log(err)
	})
})


agent.start()
'use strict';

var https = require('https')
var fs = require('fs')

function fetch(url) {
	console.log('fetch', url)

	return new Promise((resolve, reject) => {

		let data = ''
		let req = https.get(encodeURI(url), (res) => {
			console.log('code', res.statusCode)
			res.on('data', (chunk) => {
				console.log('length', chunk.length)
				data += chunk
				
			})

			res.on('end', () => {
				console.log('end', data)
				resolve(JSON.parse(data != '' ? data : null))			
			})
		})
	})


}

var api = 'https://applications002.brest-metropole.fr/WIPOD01/Transport/REST/'

var urls = {
	getStopsNames: api + 'getStopsNames?format=json',
	getRoutes: api + 'getRoutes?format=json',
	getStop: function(stopName) {return api + `getStop?format=json&stop_name=${stopName}`},
	getDestination: function(routeId) {return api + `getDestinations?format=json&route_id=${routeId}`},
	getStopsRoute: function(routeId, tripHeadSign) {return api + `getStops_route?format=json&route_id=${routeId}&trip_headsign=${tripHeadSign}`}
}


var stopNames
var routes

function getStops(stopNames) {
	return new Promise((resolve, reject) => {
		let count = stopNames.length
		let idx = 0
		let stopPos = {}

		function getNext() {
			console.log('getNext', idx)
			if (idx < count) {
				let stopName = stopNames[idx++]
				fetch(urls.getStop(stopName)).then((data) => {
					stopPos[stopName] = data
					getNext()
				})
				.catch(reject)
			}
			else {
				resolve(stopPos)
			}
		}

		getNext()

	})
}

function getDestination(routeIds) {
	return new Promise((resolve, reject) => {
		let count = routeIds.length
		let idx = 0
		let destinations = {}

		function getNext() {
			console.log('getNext', idx)
			if (idx < count) {
				let routeId = routeIds[idx++]
				fetch(urls.getDestination(routeId)).then((data) => {
					destinations[routeId] = data
					getNext()
				})
				.catch(reject)
			}
			else {
				resolve(destinations)
			}
		}

		getNext()

	})
}

function getStopsRoute(destinations) {
	return new Promise((resolve, reject) => {
		let routeIds = Object.keys(destinations)
		let count = routeIds.length
		let idx = 0
		let ret = {}

		function getNext() {
			console.log('getNext', idx)
			if (idx < count) {
				let routeId = routeIds[idx++]
				let tripHeadSign = destinations[routeId][0].Trip_headsign
				console.log('tripHeadSign', tripHeadSign)

				fetch(urls.getStopsRoute(routeId, tripHeadSign)).then((data) => {
					console.log('data', data)
					ret[routeId] = data
					getNext()
				})
				.catch(reject)
			}
			else {
				resolve(ret)
			}
		}

		getNext()

	})
}




fetch(urls.getStopsNames).then((data) => {
	console.log('stopNames', data.length)
	stopNames = data.map((item) => {return item.Stop_name})

	return fetch(urls.getRoutes)
})
.then((data) => {
	console.log('routes', data.length)
	console.log('stopNames', stopNames.length)
	routes = data.map((item) => item.Route_id)
	console.log('routes', routes)
	return getDestination(routes)
})
.then((data) => {
	console.log('getDestination', data)
	//fs.writeFileSync('../db/bebus/destination.json', JSON.stringify(data, null, 4))
	return getStopsRoute(data)
})
.then((data) => {
	console.log('getStopsRoute', data)
	fs.writeFileSync('../db/bebus/stopsRoute.json', JSON.stringify(data, null, 4))	
})
.catch((e) => {
	console.log('error', e)
})


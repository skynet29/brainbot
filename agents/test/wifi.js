const scanner = require('node-wifi-scanner')

scanner.scan((err, networks) => {
	console.log(networks)
})
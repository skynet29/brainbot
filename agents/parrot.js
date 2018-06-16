const agent  = require('../lib/agent')

const arDrone = require('ar-drone')
const express = require('express')
const client = arDrone.createClient()



client.on('navdata', function(data) {
	//console.log('navdata', data)
	agent.emit('parrotNavData', data)
})




//require('dronestream').listen(3001, {tcpVideoStream: client.getVideoStream()})

agent.register('parrotCmd', false, function(msg) {	
	const data = msg.data
	console.log('data', data)
	const cmd = data.cmd

	if (cmd == 'move') {
		var move  = data.move
		for(var k in move) {
			var speed = move[k]
			var func = client[k]
			if (typeof func == 'function') {
				func.call(client, speed)
			}
		}
	}
	else {
		var func = client[cmd]
		if (typeof func == 'function') {

				func.call(client)
			
		}
		else {
			console.warn('Command not supported')
		}

	}



})
agent.start()

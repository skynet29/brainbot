'use strict'

const ws = require("nodejs-websocket")
var config = require('./config/config.json')

const EventEmitter2 = require('eventemitter2').EventEmitter2
config = Object.assign({masterBufferTimeout: 50}, config)

//const bufferTimeout = config.masterBufferTimeout || 50
const bufferTimeout = config.masterBufferTimeout

console.log('bufferTimeout', bufferTimeout)

const notifHistory = {}

const server = ws.createServer(function (client) {
	console.log('New connection', client.path)

	var id = client.path.substr(1)
	client.id = id
	client.events = new EventEmitter2({wildcard: true})
	client.registeredTopics = {}
	client.registeredServices = {}
	sendStatus()

	//client.registeredregisteredTopics = {}

	client.on('text', function(text) {

		var msg = JSON.parse(text)
		msg.src = id
		handleClientMsg(client, msg)

	})

	client.on('close', function(code) {
		console.log(`Client '${id}' disconnected`)
		sendStatus()
	})

	client.on('error', function(err) {
		console.log('connection error')
	})

})

function getServiceProvider(srvName) {
	return server.connections.find(function(client) {
		return client.registeredServices[srvName] != undefined
	})	
}


function findClient(id) {
	return server.connections.find(function(client) {
		return client.id == id
	})	
}

function handleClientMsg(client, msg) {

	console.log('msg', msg)
	if (typeof msg.type != 'string') {
		console.log('Missing parameter type', msg)
		return
	}	

	switch(msg.type) {
		case 'registerService': {
			const srvName = msg.srvName

			if (typeof srvName != 'string') {
				console.warn('Missing parameter srvName', msg)
				return
			}	
			let dest = getServiceProvider(srvName)
			if (dest != undefined) {
				console.warn(`service '${srvName}' is already registered by agent '${dest.id}'`)
				return				
			}

			client.registeredServices[srvName] = 1
		}
		break

		case 'callService': {
			const srvName = msg.srvName

			if (typeof srvName != 'string') {
				console.warn('Missing parameter srvName', msg)
				return
			}	
			let dest = getServiceProvider(srvName)
			if (dest != undefined) {
				const text = JSON.stringify(msg)
				dest.sendText(text)				
			}
			else {
				var respMsg = {type: 'callServiceResp', srvName: srvName, statusCode: 100}
				client.sendText(JSON.stringify(respMsg))
			}

		}
		break


		case 'cmd': 
		case 'callServiceResp':
			//console.log('msg', msg)
			let dest = findClient(msg.dest)
			if (dest != undefined) {
				let text = JSON.stringify(msg)
				dest.sendText(text)
			}
		break

		case 'unregister':
			if (client.registeredTopics[msg.topic] != undefined) {
				console.log(`client '${msg.src}' unsubscribes to topic '${msg.topic}'`)
				delete client.registeredTopics[msg.topic]
				client.events.removeAllListeners(msg.topic)
				sendStatus()
			}
		break

		case 'register':
			client.registeredTopics[msg.topic] = 1
			sendStatus()
			client.events.on(msg.topic, function(msg) {
				//client.sendText(JSON.stringify(msg))
				sendMsg(client, msg)
			})
			console.log(`client '${msg.src}' subscribes to topic '${msg.topic}'`)
			if (msg.getLast === true) {
				var events = new EventEmitter2({wildcard: true})
				events.on(msg.topic, function(msg) {
					//console.log('on', client.id, msg.topic)
					//client.sendText(JSON.stringify(msg))
					sendMsg(client, msg)
				})
				for(let topic in notifHistory) {
					//console.log('emit', topic)
					events.emit(topic, notifHistory[topic])
				}
				console.log('emit history')

			
			}			
		break

		case 'notif':
			notifHistory[msg.topic] = msg
			if (msg.data == undefined) {
				delete notifHistory[msg.topic]
			}			
			broadcastToSubscribers(msg)
		break

		default:
			console.log('Unknown msg type', msg.type)
	}

}

function sendStatus() {

	var clients = {}
	server.connections.forEach(function(client) {
		clients[client.id] = {
			registeredTopics: Object.keys(client.registeredTopics),
			registeredServices:  Object.keys(client.registeredServices)
		}
	})

	var msg = {
		src: 'master',
		time: Date.now(),
		type: 'notif',
		topic: 'masterClients',
		data: clients
	}	
	notifHistory[msg.topic] = msg
	//console.log('status', msg)
	broadcastToSubscribers(msg)

}


function sendMsg(client, msg) {
	//console.log('sendMsg', msg.topic)
	client.sendText(JSON.stringify(msg))

}

function broadcastToSubscribers(msg) {

	server.connections.forEach(function(client) {
		client.events.emit(msg.topic, msg)

	})
}

server.listen(config.masterPort, function() {
	console.log(`WebSocket server start listening on port ${config.masterPort}`)
})


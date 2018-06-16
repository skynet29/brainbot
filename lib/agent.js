const agentName = process.argv[2]

if (typeof agentName != 'string') {
	console.log('Please, specify agent name')
	process.exit(1)
}

const Client = require('./client')
const globalConfig = require('../config/config.json')


var client  = new Client(agentName, globalConfig)

var onCloseFn = null

client.on('shutdown', function() {
	if (typeof onCloseFn == 'function') {
		onCloseFn()
	}
	process.exit(0)
})

module.exports = {

	start: function() {
		client.connect()
	},

	onMsg: function(topic, callback) {
		client.on(topic, callback)
	},

	onConnect: function(callback) {
		client.events.on('connect', callback)
	},	

	onClose: function(callback) {
		onCloseFn = callback
	},

	emit: function(topic, data) {
		client.emit(topic, data)
	},

	register: function(topic, getLast, callback) {
		client.register(topic, getLast, callback)
	},

	registerService: function(srvName, func) {
		client.registerService(srvName, func)
	},

	callService: function(srvName, data) {
		return client.callService(srvName, data)
	},

	config: globalConfig[agentName] || {}
}




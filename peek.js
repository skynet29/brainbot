const util = require('./lib/util')


var params = util.getParams()

console.log('params', params)



if (params.topic == undefined) {
	console.log('Usage: node peek topic=topicName [hist=true]')
	process.exit(0)
}
const Client = require('./lib/client')
const globalConfig = require('./config/config.json')

var agentName = 'peek' + Date.now() % 100000

const client = new Client(agentName, globalConfig)


var hist = (params.hist === 'true')

client.register(params.topic, hist, function(msg) {
	console.log('msg', JSON.stringify(msg, null, 4))
})


client.connect()
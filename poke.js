const fs = require('fs')
const util = require('./lib/util')


var params = util.getParams()

console.log('params', params)



if (params.topic == undefined) {
	console.log('Usage: node poke topic=topicName [data=data] [file=fileName]')
	process.exit(0)
}

if (params.file != undefined) {
	var content = fs.readFileSync(params.file)
	params.data = JSON.parse(content.toString())
}

//console.log('data', params.data)


const Client = require('./lib/client')
const globalConfig = require('./config/config.json')

var agentName = 'poke' + Date.now() % 100000

const client = new Client(agentName, globalConfig)


client.connect()

client.events.on('connect',function() {
	client.emit(params.topic, params.data)
	process.exit(0)
})

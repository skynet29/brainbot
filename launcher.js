var forever = require('forever-monitor')
var fs = require('fs')
var path = require('path')
const Client = require('./lib/client')
const hostName = require('os').hostname()

var globalConfig = require('./config/config.json')
const name = `launcher.${hostName}`
const client = new Client(name, globalConfig)


if (!('launcher' in globalConfig)) {
	console.error('no laucnher config !')
	process.exit(2)
}

var config = globalConfig.launcher

var logPath = config.logPath || "./log/"
if (!fs.existsSync(logPath)) {
	console.log("create directory ", logPath)
	fs.mkdirSync(logPath)
}






if (!('agents' in config)) {
	console.error('No agent to launch !')
	process.exit(3)
}



function getCurrentHostAgents(agents) {
	var ret = {}
	for(var agentName in agents) {
		var host = agents[agentName].host
		if (host == undefined || host === hostName) {
			ret[agentName] = agents[agentName]
		}
	}
	return ret
}

var agents = getCurrentHostAgents(config.agents)


var agentsState = {}

function startAgent(agentName) {

	if (typeof agents[agentName] != 'object') {
		console.log(`agent ${agentName} is not defined in the configuration file`)
		return
	}

	var script = agents[agentName].script

	if (typeof script != 'string') {
		console.log("no script defined for agent ", agentName)
		return
	}
	
	var child = new forever.Monitor(script, {
		outFile: path.join(logPath, agentName + '.log'),
		errFile: path.join(logPath, agentName + '.log'),
		silent: true,
		args: [agentName],
		max: 1,
		killTree: true
	})
	child.on('exit', function() {
		console.log(`Agent '${agentName}' has exited`)
		var newState
		switch(agentsState[agentName].state) {
			case 'stoping':
				newState = 'stop'
				break;
			case 'killing':
				newState = 'killed'
				break;
			default:
				newState = 'crashed'
		}
		
		//var newState = (agentsState[agentName].state == "stoping") ? "stop" : "crashed"
		agentsState[agentName] = {state:newState, pid: 0}
		sendStatus()
	})

	child.on('start', function(process, data) {
		console.log(`start agent '${agentName}' with pid ${data.pid}`)
		agentsState[agentName] = {state:'run', pid: data.pid}
		sendStatus()
	})
	child.start()
	agentsState[agentName] = {state:'starting', pid: 0}
	sendStatus()
}


function stopAgent(data) {
	var agentName
	var force = false

	if (typeof data == 'string') {
		agentName = data
	}
	else if (typeof data == 'object' && typeof data.agent == "string") {
		agentName = data.agent
		force = data.force
	}

	if (agentName == undefined) {
		console.log(`stopAgent: bad parameters`)
		return		
	}

	if (typeof agentsState[agentName] != 'object') {
		console.log(`agent ${agentName} is not defined in the configuration file`)
		return
	}

	const pid = agentsState[agentName].pid
	if (pid == 0) {
		console.log(`agent ${agentName} is not running`)
		return		
	}
	//process.kill(pid)
	
	if (force === true) {
		agentsState[agentName].state = "killing"
		process.kill(pid)
	}
	else {
		agentsState[agentName].state = "stoping"
		client.sendTo(agentName, 'shutdown')
	}
	
}


function startConfiguredAgents() {
	for(var agentName in agents) {
		var start = agents[agentName].start || "auto"

		agentsState[agentName] = {state:'ready', pid:0}
		if (start != 'manual') {
			startAgent(agentName)	
		}
	}	
}

startConfiguredAgents()




client.register('launcherStartAgent', false, function(msg) {
	console.log(`startAgent '${ msg.data}'`)
	startAgent(msg.data)
})

client.register('launcherStopAgent', false, function(msg) {
	console.log(`stopAgent`, msg.data)
	stopAgent(msg.data)
})

client.events.on('connect', function() {
	sendStatus()
})


client.connect()


function sendStatus() {
	client.emit(`launcherStatus.${hostName}`, agentsState)
}

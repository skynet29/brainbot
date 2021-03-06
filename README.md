## Goal
Create a framework based on WEB technologies to ease developpment of complex application.

At the origin, this framework was developped to pilot and control an underwater drone. 

## Roadmap

- Fullstack **JAVASCRIPT**: nodejs for daemon process, browser js for HMI (webapp)
- Meta OS: set of processes which communicates each other through a soft bus (message broker)
- distributed architecture
- multi-application (like a smartphone)
- users management (acces rights)
- webapp using components
- propose a Map component which can be driven by an external process

## Message Broker
- Each process called agent connect to an unique proxy process called the master (which port and host are known)
- An agent can publish data identified by a name (called a topic) to the master without knowing which processes uses it
- An agent can subscribe to a topic
- An agent can also provide a service identified by a name (like a RPC call) which return data to the caller
- An agent can call a service from its name
- Each agent has an unqiue name which identify it in the whole system

![broker diagram](https://user-images.githubusercontent.com/27694866/42265347-99c79522-7f73-11e8-8675-76f324d3a38c.png)

As you can see on the diagram above, a WEB page is seen as a normal agent.

## Implementation

- The communication between an agent and the master uses the **WebSocket** protocol
- The message are wrtitten in **JSON** format

### Message format
````javascript
{
    src:  string,
    time: number,
    type: string,
    topic: string,
    data: any
}
````
where:

- src is the name of the agent which emit the message
- time is the date when the message was emitted (number of milliseconds since midnight Jan 1, 1970) 
- type is the type of the message:
  - register,
  - unregister,
  - notif,
  - cmd 
- topic is the topic name
- data is the payload which can be anything (string, number, object, etc...)

### Topic naming
the topic name can use the dot notation (like a namespace)

For example **mapViewAddShape.default.circle_1** is a valid topic name

## Topic subscription
To subscribe to a topic, you can use wildcards (*)

For example if an agent subscribes to the topic **mapViewAddShape.\*.\***, it will receive all topic matching this pattern

## Topic persistence
The master stores the last message for each topic

When an agent subscribes to a topic, it can ask to receive the last stored message

## Master

The master is a process like other agent coded with Nodejs

the port on which the master is listening as well as the host on which the master is running are defined in a global JSON configuration file **config.json** located in the **config** directory.

The master publish a topic named **masterClients** upon each connection/deconnection of an agent to the master.


The message payload contains a list of all agents connected to the master and for each agent the list of the registred topic

Example of payload:
````javascript
{
    "launcher": [
            "launcherStartAgent",
            "launcherStopAgent"
        ],
    "shapeAgent": [
            "tacticViewCircleCreated"
        ],
    "bus": [
            "startBus"
        ]
}

````
## Create a new agent

The creation of a new agent is eased by the use of the **agent.js** module available in the **lib** directory.

### Example 1

In this example, you create an agent which publishes a topic called gpsData every 5 seconds

Create a new file named **gpsProvider.js** with the following content in the **agents** folder

````javascript
const agent  = require('../lib/agent')

const config = agent.config

agent.start()

setInterval(function() {
	agent.emit('gpsData', {lat: 48, lng: -4})
}, 5000)

````
Note that your agent can access to its configuration defined in the global configuration file by using the **config** field of the **agent** object.

### Example 2

In this example, you create an agent which subscribes to the gpsData topic published by the agent created in the previous example.

Create a new file named **gpsReader.js** with the following content in the **agents** folder

````javascript
const agent  = require('../lib/agent')

agent.register('gpsData', true, function(msg) {
	console.log('Receive msg', msg)
})

agent.start()

````
Note that the agent ask for the topic history by passing **true** as the second argument of the **register** method

### launch an agent manually

To launch the agent created in the example 1, tape the following command from the framework root directory:
````shell
node agents/gpsProvider.js gpsProvider
````
The first argument of the node command is the javascript script code.


The second one is the name of the agent which **MUST** be unique in the whole system. This name is also used to identify the agent configuration defined in the global configuration file. So you can create several agents which use the same javascript code but with different configuration which is really usefull.

## System tools

The framework provides severals tools to help you to manage and debug your system.

### Peek tool

This tool allow you to display all message emitted on a topic

Usage:
````shell
node peek topic=[topicName] hist=[true | false]

````
where:
- topicName is the name of the topic to spy
- hist (optional)  allow to ask for the history (last message stored by the master)

### Poke tool

This tool allow you to emit a topic on the system

Usage:
````shell
node poke topic=[topicName] data=[data] file=[fileName]

````
where:
- topicName is the name of the topic to emit
- data (optional) is the payload of the topic
- file (optional) is the name (full path) of a JSON file containing the payload

data and file are exclusives

Note: the process returns after the topic was emitted

### Launcher tool

The launcher is a special tool which allow you to launch all the agents of your system included the master and the WEB server and to manage their state (running/stopped). This is also an agent which publishes and subscribes topics like other agents.

To do that, the launcher use the JSON configuration file **config.json** defined in the **config** folder.
For each declared agent, the configuration specified the script (javascript code), the host (optional)  where the agent has to run and the start mode (manual or automatic). See an exmple of configuration below.

Usage:
````shell
node launcher

````
The launcher emits a topic **launcherStatus.HOST** upon each agent state changes (HOST is the machine hostname).

The launcher also subscribes to 2 topics: **launcherStartAgent** and **launcherStopAgent** whose payload contains the name of the agent to start/stop.

The launcher stores the logs of each running agent in the directory defined in its configuration (**logPath** field), one file per agent. The name of the file is the agent name.

Note: Usually this tool is launch at the boot of the machine.

## JSON Configuration file

Example of file:

````json
{
	"masterPort": 8090,
	"masterHost": "localhost",
	"launcher": {
		"logPath": "./logs",
		"agents": {
			"master": {"script": "master.js"},
			"gpsProvider": {"script": "agents/gpsProvider.js", "start": "manual"},
			"shapeAgent": {"script": "agents/shapeAgent.js", "start": "manual"},	
			"server": {"script": "server.js", "start": "auto"},
		}
	},
	"server": {
		"port": 9000,
	 	"dbUrl" : " mongodb://localhost:27017/reviews "
	},
}

````

At the begining of the file, we found the port and the host of the master. Then comes the configuration of the differents agents included the launcher.

## Web Server

The graphical part of the system use a classical WEB client/server technology. All the code (front + back) are located in the **hmi** directory.

The main goal of the server is:
- handle the connection/deconnection of a user to the system (login)
- display the available application (webapp) of the connected user according to his rights
- provide a REST API to manage the users (creation/deletion/update)
- handle connection to the **Mongodb** database which stores the users and session informations

The WEB server (server.js) is based on the nodejs **Express** module and its middleware. It uses the EJS template engine to build the dynamic view (login, home, webapp skeleton).

The webapp (front end) uses my brainjs binding library based on a MVVM model (like angular, react or vue frameworks).

In this model, the view is a HTML fragment, the controler is an object of type ViewController which allow to modify the model and update automatically the DOM HTML of the view.

The front code uses a build system based on the task runner **GULP** nodejs tool. Mainly the tool is used to concatenate javascript or css files and to inject HTML fragment in javascript controller template field using gulp-inject directive.



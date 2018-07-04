## Goal
Create a framework based on WEB technologies to ease developpment of complexe application.

At the origin, this framework was developped to pilot and control an underwater drone 

## Roadmap

- Fullstack **Javascript**
- Meta OS: set of processes which communicates each other through a soft bus (message broker)
- distributed architecture
- multi-application (like a smartphone)
- users management (acces rights)
- HMI using components
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
- topicName is the name of the topc to spy
- hist (optional)  allow to ask for the history (last message stored by the master)




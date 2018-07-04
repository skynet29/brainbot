# brainbot

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
- An agent can also provide a service identified by a name (like a RPC call) which return data
- An agent can call a service from its name
- Each agent has an unqiue name which identify it in the whole system

![broker diagram](https://user-images.githubusercontent.com/27694866/42265347-99c79522-7f73-11e8-8675-76f324d3a38c.png)

As you can see on the diagram above, a WEB page is like a normal agent

## Implementation

- The communication between an agent and the master uses the WebSocket protocol
- The message are wrtitten in JSON format

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

src is the name of the agent which emit the message

type is the type of the message:
  - register,
  - unregister,
  - notif,
  - cmd
  
topic is the topic name

data is the payload which can be anything (string, number, object, etc...)

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

the port on which the master is listening as well as the host on which the master is running are defined in a global JSON configuration file: **config.json**

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


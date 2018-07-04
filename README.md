# brainbot

## Goal
Create a framework based on WEB technologies to ease developpment of complexe application

## Roadmap

- Fullstack JS
- Meta OS: set of processes which communicates between them through a soft bus (message broker)
- distributed architecture
- multi-application (like a smartphone)
- users management (acces rights)
- HMI using components
- propose a Map component which can be driven by an external process

## Message Broker
- Each process (named agent) connect to an unique proxy process named the master (which port and host are known)
- An agent can publish data identified by a name (called a topic) to the master without knowing which processes can use it
- An agent can subscribe to a topic
- An agent can also provide a service identified by a name (like a RPC call) which return data
- An agent can call a service from its name
- Each agent has an unqiue name which identify it in the whole system

![broker diagram](https://user-images.githubusercontent.com/27694866/42265347-99c79522-7f73-11e8-8675-76f324d3a38c.png)

As you can see on the diagram above, a WEB page is like a normal agent

# ViewController
ViewController is a class for binding data model to a view (aka HTML)

A binding library is a library to bind a data model (methods and attributs of an object) to HTML elements. 

I started writting this library after my experience with other popular binding libraries like angularjs, reactjs and vuejs. At the begining, it was just like a challenge for me.
I love working with Angularjs directive but writting your own directive to make component was a real pain.
React is really cool but there is no more separation between HTML, CSS and javascript code

Like angularjs (i.e angular 1), brainjs use proprietary HTML attributs starting with bn- prefix:
- bn-text
- bn-attr
- bn-style
- bn-val
- bn-event
- bn-show
- bn-each
- bn-control

To attach an HTML fragment to a view model, you must create a ViewController object by specifying a CSS selector to identify the fragment and a object with a data field to initialize your model attributs.

HTML code
````html
<div id="main">
  <p>Welcome  <span bn-text="name"/></p>
</div>
````

Javascript code
````javascript
var ctrl = MDZ.viewController('#main', {
  data: {
    name:'Marc'
  }
})
````

To update your data model, you can either modify your attributs and call the update method, or call directly the setData method with the new value.

HTML code
````html
<div id="main">
  <p bn-style="color: color">Welcome  <span bn-text="name"/></p><br/>
  <button bn-event="click: onClick">Update</button>
</div>
````

Javascript code
````javascript
var ctrl = MDZ.viewController('#main', {
  data: {
    name:'Marc',
    color:'black'
  },
  events: {
    onClick: function(ev) {
      ctrl.setData({name: 'Quentin', color: 'green'})
      /* another solution, useful when modifying array attributs
        ctrl.model.name = 'Quentin'
        ctrl.model.color = 'green'
        ctrl.update('name, color')
      */
    }
  }
})

````
As you can see, the event handler must be defined in the **events** attribut of your model.

# Getting started

To get started, see the examples on <a href="https://codepen.io/collection/AKgVOW" target="_blank">my codepen page</a>  

ViewController is based on the excellent jQuery library. jQuery is bundeled in the file view.js in the hmi/dist folder.


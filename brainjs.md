
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
var ctrl = $$.viewController('#main', {
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
var ctrl = $$.viewController('#main', {
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

# Using controls

To use a control in your HTML, add a **bn-control** parameter to an HTML tag depending of the control type (most of the time a **div** tag) with the name of the control to create and optionally a **bn-options** parameter to specify controls options. The value of the options parameter must be an object declared in the viewControler data. This object is passed to the control constructor function.

Example 1 with bn-options

HTML code
````html
<div id="main">
  <div bn-control="MyControl" bn-options="myCtrlOptions"></div>  
</div>  

````

Javascript code
````javascript
var ctrl = $$.viewController('#main', {
  data: {
    myCtrlOptions: {
      title: 'Hello World'
    }
  }
})
````
Another way to parameter your control is to use custom HTML parameters

Example 2 with static custom parameter

HTML code
````html
<div id="main">
  <div bn-control="MyControl" data-title="Hello World"></div>  
</div>  
````
Note: custom parameter must use the **data-** prefix.

If you want tu use a binding to your view control, use the **bn-data** directive:

Example 3 with dynamic custom parameter

HTML code
````html
<div id="main">
  <div bn-control="MyControl" bn-data="title: myTitle"></div>  
</div>  
````

Javascript code
````javascript
var ctrl = $$.viewController('#main', {
  data: {
    myTitle: 'Hello World'
  }
})
````





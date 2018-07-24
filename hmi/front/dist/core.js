(function(){

	
	window.$$ = {}

})();

(function(){

var fnConfigReady
var curRoute
	
$$.configReady = function(fn) {

	fnConfigReady = fn
}

$$.startApp = function(mainControlName, config) {
	$$.viewController('body', {
		template: `<div bn-control="${mainControlName}" class="mainPanel" bn-options="config"></div>`,
		data: {config}
	})
}

function processRoute() {
	var prevRoute = curRoute
	var href = location.href
	var idx = href.indexOf('#')
	curRoute = (idx !== -1)  ? href.substr(idx+1) : '/'
	//console.log('[Core] newRoute', curRoute, prevRoute)


	$(window).trigger('routeChange', {curRoute:curRoute, prevRoute: prevRoute})

}	

$(function() {

	var appName = location.pathname.split('/')[2]

	console.log(`[Core] App '${appName}' started :)`)
	console.log('[Core] jQuery version', $.fn.jquery)
	console.log('[Core] jQuery UI version', $.ui.version)

	


	$(window).on('popstate', function(evt) {
		//console.log('[popstate] state', evt.state)
		processRoute()
	})


	if (typeof fnConfigReady == 'function') {
		$.getJSON(`/api/users/config/${appName}`)
		.then(function(config) {

			$$.configureService('WebSocketService', {id: appName + '.' + config.$userName + '.'})
			$('body').processControls() // process HeaderControl
			
			try {
				fnConfigReady(config)
			}
			catch(e) {
				var html = `
					<div class="w3-container">
						<p class="w3-text-red">${e}</p>
					</div>
				`
				$('body').html(html)
			}
			
			
			processRoute()
		})
		.catch((jqxhr) => {
			console.log('jqxhr', jqxhr)
			//var text = JSON.stringify(jqxhr.responseJSON, null, 4)
			var text = jqxhr.responseText
			var html = `
				<div class="w3-container">
					<p class="w3-text-red">${text}</p>
					<a href="/disconnect" class="w3-btn w3-blue">Logout</a>
				</div>
			`
			$('body').html(html)
		})				
		
	}
	else {
		console.warn('Missing function configReady !!')
	}
	

})

	
})();

$$.dialogController = function(title, options) {
	var div = $('<div>', {title: title})

	var ctrl = $$.viewController(div, options)
	div.dialog({
		autoOpen: false,
		modal: true,
		width: 'auto',
		buttons: {
			'Cancel': function() {
				$(this).dialog('close')
			},
			'Apply': function() {					
				$(this).dialog('close')
				if (typeof options.onApply == 'function') {
					options.onApply.call(ctrl)
				}	
			}
		}
	})
	ctrl.show = function() {
		div.dialog('open')
	}
	return ctrl
};


$$.formDialogController = function(title, options) {
	var div = $('<div>', {title: title})
	var form = $('<form>')
		.appendTo(div)
		.on('submit', function(ev) {
			ev.preventDefault()
			div.dialog('close')
			if (typeof options.onApply == 'function') {
				options.onApply.call(ctrl, ctrl.elt.getFormData())
			}				
		})
	var submitBtn = $('<input>', {type: 'submit', hidden: true}).appendTo(form)

	var ctrl = $$.viewController(form, options)
	div.dialog({
		autoOpen: false,
		modal: true,
		width: 'auto',
		close: function() {
			//$(this).dialog('destroy')
		},
		buttons: {
			'Cancel': function() {
				$(this).dialog('close')
			},
			'Apply': function() {					
				submitBtn.click()
			}
		}
	})
	ctrl.show = function(data, onApply) {
		if (typeof ctrl.beforeShow == 'function') {
			ctrl.beforeShow()
		}
		options.onApply = onApply
		ctrl.elt.setFormData(data)
		div.dialog('open')
	}

	return ctrl
};

(function(){



class ViewController {
    constructor(elt, options) {
    	//console.log('ViewController', options)
    	if (typeof elt == 'string') {
    		elt = $(elt)
    	}

    	options = $.extend({}, options)
        this.elt = elt

        this.elt.on('data:update', (ev, name, value, excludeElt) => {
        	//console.log('[ViewController] data:change', name, value)
        	this.setData(name, value, excludeElt)
        })

        if (typeof options.template == 'string') {
        	this.elt = $(options.template).appendTo(elt)
        }
        this.model = $.extend({}, options.data)
        this.rules = $.extend({}, options.rules)
        this.watches = $.extend({}, options.watches)

        // generate automatic rules for computed data (aka function)
        for(var k in this.model) {
        	var data = this.model[k]
        	if (typeof data == 'function') {
        		var funcText = data.toString()
        		//console.log('funcText', funcText)
        		var rules = []
        		funcText.replace(/this.([a-zA-Z0-9_-]{1,})/g, function(match, captureOne) {
        			//console.log('captureOne', captureOne)
        			rules.push(captureOne)
        		})
        		this.rules[k] = rules.toString()
        	}
        }

        //console.log('rules', this.rules)
        this.dirList = this.elt.processUI(this.model)


        //this.elt.processUI(this.model)
        if (typeof options.events == 'object') {
            this.elt.processEvents(options.events)
        }

        this.scope = this.elt.processBindings()
        //console.log('scope', this.scope)
       
        var init = options.init
        if (typeof init == 'function') {
        	init.call(this)
        }
    } 

    setData(arg1, arg2, excludeElt) {
        //console.log('[ViewController] setData', arg1, arg2)
        var data = arg1
        if (typeof arg1 == 'string') {
        	data = {}
        	data[arg1] = arg2
        }
        //console.log('[ViewController] setData', data)
        $.extend(this.model, data)
        //console.log('model', this.model)
        this.update(Object.keys(data), excludeElt)
    }

    update(fieldsName, excludeElt) {
    	//console.log('[ViewController] update', fieldsName)
    	if (typeof fieldsName == 'string') {
    		fieldsName = fieldsName.split(',')
    	}


    	if (Array.isArray(fieldsName)) {
    		var fieldsSet = {}
    		fieldsName.forEach((field) => {

    			var watch = this.watches[field]
    			if (typeof watch == 'function') {
    				watch.call(null, this.model[field])
    			}
    			fieldsSet[field] = 1

    			for(var rule in this.rules) {
    				if (this.rules[rule].split(',').indexOf(field) != -1) {
    					fieldsSet[rule] = 1
    				}
    			}
    		})


    		this.elt.updateTemplate(this.dirList, this.model, Object.keys(fieldsSet), excludeElt)
    	}

    }
}


    $$.viewController = function (elt, options) {
        return new ViewController(elt, options)
    }

})();
(function(){



$$.registerControl = function(name, arg1, arg2) {
	$$.registerObject('controls', name, arg1, arg2)
}

$$.registerControlEx = function(name, options) {
	if (!$$.checkType(options, {
		$deps: ['string'],
		$iface: 'string',
		$events: 'string',
		init: 'function'
	})) {
		console.error(`[Core] registerControlEx: bad options`, options)
		return
	}


	var deps = options.deps || []


	$$.registerObject('controls', name, deps, options)
}



$$.createControl = function(controlName, elt) {
	elt.addClass(controlName)
	elt.addClass('CustomControl').uniqueId()	
	var ctrl = $$.getObject('controls', controlName)
		
	if (ctrl != undefined) {
		//console.log('createControl', controlName, ctrl)
		if (ctrl.status ===  'ok') {
			
			var iface = {}

			
			if (typeof ctrl.fn == 'function') {
				var args = [elt].concat(ctrl.deps)
				var copyOptions = $.extend(true, {}, elt.getOptions())
				console.log(`[Core] instance control '${controlName}'`)
				ctrl.fn.apply(iface, args)	
				iface.options = copyOptions
							
			}
			else if (typeof ctrl.fn == 'object') {
				var init = ctrl.fn.init
				var props = ctrl.fn.props || {}
				var ctx = {}
				var defaultOptions = ctrl.fn.options || {}

				if (typeof init == 'function') {

					var initValues = {}
					for(var k in props) {
						ctx[k] = props[k].val
					}

					var options = $.extend({}, defaultOptions, elt.getOptions(ctx))

					//console.log(`[Core] options`, options)
					var trueOptions = {}
					for(var k in options) {
						if (!(k in props)) {
							trueOptions[k] = options[k]
						}
					}

					var copyOptions = $.extend(true, {}, trueOptions)

					var args = [elt, options].concat(ctrl.deps)
					console.log(`[Core] instance control '${controlName}' with options`, options)
					init.apply(iface, args)
					iface.options = copyOptions
					iface.events = ctrl.fn.events

					if (Object.keys(props).length != 0) {
						iface.setProp = function(name, value) {
							//console.log(`[Core] setData`, name, value)
							var setter = props[name] && props[name].set
							if (typeof setter == 'string') {
								var setter = iface[setter]
							}
							if (typeof setter == 'function') {
								setter.call(ctx, value)
							}
							
							ctx[name] = value
						}

						iface.props = function() {
							var ret = {}
							for(var k in props) {
								ret[k] = ctx[k]

								var getter = props[k].get
								if (typeof getter == 'string') {
									getter = iface[getter]											
								}
								if (typeof getter == 'function') {
									ret[k] = getter.call(ctx)
								}
							}
							return ret
						}							
					}
				}
				else {
					console.warn(`[Core] control '${controlName}' missing init function`)
				}

			}

			iface.name = controlName
			elt.get(0).ctrl = iface
			
			return iface				
		}


	}
	else {
		throw(`[Core] control '${controlName}' is not registered`)
	}
}

$$.getRegisteredControls = function() {
	var controls = $$.getObjectDomain('controls')
	return Object.keys(controls).filter((name) => !name.startsWith('$'))
}

$$.getRegisteredControlsEx = function() {
	var controls = $$.getObjectDomain('controls')
	var libs = {}
	for(var k in controls) {
		var info = controls[k].fn
		var libName = info.lib
		if (typeof libName == 'string') {
			if (libs[libName] == undefined) {
				libs[libName] = []
			}
			libs[libName].push(k)

		}
	}
	return libs
}

$$.getControlInfo = function(controlName) {
	var controls = $$.getObjectDomain('controls')
	var info = controls[controlName]

	if (info == undefined) {
		console.log(`control '${controlName}' is not registered`)
		return
	}
	info = info.fn

	var ret = $$.extract(info, 'deps,options,lib')

	if (typeof info.events == 'string') {
		ret.events = info.events.split(',')
	}

	var props = {}
	for(var k in info.props) {
		props[k] = info.props[k].val
	}
	if (Object.keys(props).length != 0) {
		ret.props = props
	}
	if (typeof info.iface == 'string') {
		ret.iface = info.iface.split(';')
	}
	return ret
	//return controls[controlName].fn
}


$$.getControlsTree = function(showWhat) {
	showWhat = showWhat || ''
	var showOptions = showWhat.split(',')
	var tree = []
	$('.CustomControl').each(function() {
		var iface = $(this).interface()

		var item = {name:iface.name, elt: $(this), parent: null}
		item.id = $(this).attr('id')

		if (typeof iface.events == 'string' &&
			((showOptions.indexOf('events') >= 0 || showWhat === 'all'))) {
			item.events = iface.events.split(',')
		}			

		tree.push(item)

		if (showOptions.indexOf('iface') >= 0 || showWhat === 'all') {

			var func = []
			for(var k in iface) {
				if (typeof iface[k] == 'function' && k != 'props' && k != 'setProp') {
					func.push(k)
				}
			}
			if (func.length != 0) {
				item.iface = func
			}				
		}



		if (typeof iface.props == 'function' && 
			((showOptions.indexOf('props') >= 0 || showWhat === 'all'))) {
			item.props = iface.props()
		}

		if (typeof iface.getValue == 'function' &&
			((showOptions.indexOf('value') >= 0 || showWhat === 'all'))) {
			item.value = iface.getValue()
		}

		if (typeof iface.options == 'object' && Object.keys(iface.options).length != 0 &&
			((showOptions.indexOf('options') >= 0 || showWhat === 'all'))) {
			item.options = iface.options
		}	

					
		//console.log('name', name)
		item.childs = []


		var parents = $(this).parents('.CustomControl')
		//console.log('parents', parents)
		if (parents.length != 0) {
			var parent = parents.eq(0)
			item.parent = parent
			tree.forEach(function(i) {
				if (i.elt.get(0) == parent.get(0)) {
					i.childs.push(item)
				}
			})
			

		}
	})
	//console.log('tree', tree)

	var ret = []
	tree.forEach(function(i) {
		if (i.parent == null) {
			ret.push(i)
		}
		if (i.childs.length == 0) {
			delete i.childs
		}
		delete i.parent
		delete i.elt
	})

	return JSON.stringify(ret, null, 4)

}

})();

(function(){

var registeredObjects = {
	services: {}
}

var {services} = registeredObjects

function isDepsOk(deps) {
	return deps.reduce(function(prev, cur) {

		return prev && (cur != undefined)
	}, true)		
}

$$.getObjectDomain = function(domain) {
	return registeredObjects[domain]
}

$$.registerObject = function(domain, name, arg1, arg2) {
	var deps = []
	var fn = arg1
	if (Array.isArray(arg1)) {
		deps = arg1
		fn = arg2
	}
	if (typeof domain != 'string' || typeof name != 'string' || typeof fn == 'undefined' || !Array.isArray(deps)) {
		throw('[Core] registerObject called with bad arguments')
	} 
	console.log(`[Core] register object '${domain}:${name}' with deps`, deps)
	if (registeredObjects[domain] == undefined) {
		registeredObjects[domain] = {}
	}
	registeredObjects[domain][name] = {deps: deps, fn :fn, status: 'notloaded'}
}	

$$.getObject = function(domain, name) {
	//console.log(`[Core] getObject ${domain}:${name}`)
	var domain = registeredObjects[domain]
	var ret = domain && domain[name]
	if (ret && ret.status == 'notloaded') {
		ret.deps = $$.getServices(ret.deps)
		ret.status = isDepsOk(ret.deps) ? 'ok' : 'ko'
	}
	return ret
}

$$.getServices = function(deps) {
	//console.log('[Core] getServices', deps)
	return deps.map(function(depName) {
		var srv = services[depName]
		if (srv) {
			if (srv.status == 'notloaded') {
				var deps2 = $$.getServices(srv.deps)
				var config = srv.config || {}
				console.log(`[Core] instance service '${depName}' with config`, config)
				var args = [config].concat(deps2)
				srv.obj = srv.fn.apply(null, args)
				srv.status = 'ready'
			}
			return srv.obj				
		}
		else {
			//srv.status = 'notregistered'
			throw(`[Core] service '${depName}' is not registered`)
		}

	})
}



$$.configureService = function(name, config) {
	console.log('[Core] configureService', name, config)
	if (typeof name != 'string' || typeof config != 'object') {
		console.warn('[Core] configureService called with bad arguments')
		return
	} 	

	var srv = services[name]
	if (srv) {
		srv.config = config
	}
	else {
		throw(`[configureService] service '${name}' is not registered`)
	}

}

$$.registerService = function(name, arg1, arg2) {
	$$.registerObject('services', name, arg1, arg2)
}

$$.getRegisteredServices = function() {
	var ret = []
	for(var k in services) {
		var info = services[k]
		ret.push({name: k, status: info.status})
	}
	return ret
}


})();
(function() {

	$.fn.processBindings = function() {

		var data = {}

		this.bnFind('bn-bind', true, function(elt, varName) {
			//console.log('bn-text', varName)
			data[varName] = elt
		})
		this.bnFind('bn-iface', true, function(elt, varName) {
			//console.log('bn-text', varName)
			data[varName] = elt.interface()
		})
		return data
	
	}

})();
(function() {
	

	$.fn.getOptions = function(defaultValues) {

		var values = defaultValues || {}

		var options = this.data('$options')
		if (typeof options != 'object') {
			options = {}
		}	

		var paramsValue = {}
		for(var k in values) {
			paramsValue[k] = this.data(k)
		}

		return $.extend(values, options, paramsValue)
			
	}

	$.fn.getParentInterface = function(parentCtrlName) {
		var parent = this.parent()
		if (!parent.hasClass(parentCtrlName)) {
			return
		}
		return parent.interface()		
	}

	$.fn.processControls = function( data) {

		data = data || {}

		this.bnFilter('[bn-control]').each(function() {
			var elt = $(this)

			var controlName = elt.attr('bn-control')
			elt.removeAttr('bn-control')
			//console.log('controlName', controlName)



			$$.createControl(controlName, elt)
		})

		return this

	}	

	$.fn.interface = function() {
		return (this.length == 0) ? null : this.get(0).ctrl
	}

	$.fn.dispose = function() {
		console.log('[Core] dispose')
		this.find('.CustomControl').each(function() {		
			var iface = $(this).interface()
			if (typeof iface == 'object' && typeof iface.dispose == 'function') {
				iface.dispose()
			}
			delete $(this).get(0).ctrl
		})
		return this
	}

})();
(function() {

	$.fn.processEvents = function(data) {
		//console.log('processEvents', data)
		if (typeof data != 'object') {
			console.error(`[core] processEvents called with bad parameter 'data' (must be an object):`, data)
			return
		}
		this.bnFindEx('bn-event', true, function(elt, attrName, varName) {
			//console.log('bn-event', attrName, varName)
			var f = attrName.split('.')
			var eventName = f[0]
			var selector = f[1]

			var fn = data[varName]
			if (typeof fn == 'function') {
				var iface = elt.interface()
				if (iface && typeof iface.on == 'function') {
					iface.on(eventName, fn.bind(iface))
					return
				}

				var useNativeEvents = ['mouseenter', 'mouseleave'].indexOf(eventName) != -1

				if (selector != undefined) {

					if (useNativeEvents) {
						elt.get(0).addEventListener(eventName, function(ev) {
							var target = $(ev.target)
							if (target.hasClass(selector)) {
								fn.call(ev.target, ev)
							}

						})					
					}
					else {
						elt.on(eventName, '.' + selector, fn)
					}

				}
				else {
					if (useNativeEvents) {
						elt.get(0).addEventListener(eventName, function(ev) {
								fn.call(ev.target, ev)
						
						})
					}
					else {
						elt.on(eventName, fn)
					}
				}				
			}
			else {
				console.warn(`[Core] processEvents: variable '${varName}' is not a function defined in data`, data)
			}		
		})
		return this
	
	}

})();
(function() {

	$.fn.getValue = function() {
		var type = this.attr('type')
		if (this.get(0).tagName == 'INPUT' && type == 'checkbox') {
			return this.prop('checked')
		}
		var iface = this.interface()
		if (iface && typeof iface.getValue == 'function') {
			return iface.getValue()
		}
		var ret = this.val()

		if (type == 'number' || type == 'range') {
			ret = parseFloat(ret)
		}
		return ret
	}


	$.fn.setValue = function(value) {
		if (this.get(0).tagName == 'INPUT' && this.attr('type') == 'checkbox') {
			this.prop('checked', value)
			return
		}

		var iface = this.interface()
		if (iface && typeof iface.setValue == 'function') {
			iface.setValue(value)
		}
		else {
			this.val(value)
		}
	}



	$.fn.getFormData = function() {
		var ret = {}
		this.find('[name]').each(function() {
			var elt = $(this)
			var name = elt.attr('name')
			ret[name] = elt.getValue()

		})

		return ret
	}

	$.fn.setFormData = function(data) {

		for(var name in data) {
			var elt = this.find(`[name=${name}]`)
			var value = data[name]
			elt.setValue(value)
		
		}

		return this
	}

	$.fn.processFormData = function(data) {
		if (data == undefined) {
			return this
		}

		if (typeof data != 'object') {
			console.error(`[core] processFormData called with bad parameter 'data' (must be an object):`, data)
			return this
		}

		this.bnFind('bn-form', false, function(elt, varName) {
			//console.log('bn-text', varName)
			var value = data[varName]
			if (typeof value == 'object') {
				elt.setFormData(value)
			}
			else {
				console.warn(`[Core] processFormData: variable '${varName}' is not an object defined in data`, data)
			}
			
		})
		return this
	
	}


})();
(function() {


	$.fn.processContextMenu = function(data) {
		if (data == undefined) {
			return this
		}

		if (typeof data != 'object') {
			console.error(`[core] processContextMenu called with bad parameter 'data' (must be an object):`, data)
			return this
		}

		this.bnFind('bn-menu', true, function(elt, varName) {
			//console.log('bn-text', varName)
			var value = data[varName]
			if (typeof value == 'object') {
				var id = elt.uniqueId().attr('id')
				console.log('[processContextMenu] id', id)
				$.contextMenu({
					selector: '#' + id,
					callback: function(key) {
						//console.log('[processContextMenu] callback', key)
						elt.trigger('menuChange', [key])
					},
					items: value
				})
			}
			else {
				console.warn(`[Core] processContextMenu: variable '${varName}' is not an object defined in data`, data)
			}
			
		})
		return this
	
	}


})();
(function() {

	function splitAttr(attrValue, cbk) {
		attrValue.split(',').forEach(function(item) {
			var list = item.split(':')
			if (list.length == 2) {
				var name = list[0].trim()
				var value = list[1].trim()
				cbk(name, value)
			}
			else {
				console.error(`[Core] splitAttr(${attrName}) 'attrValue' not correct:`, item)
			}
		})		
	}

	function getVarValue(varName, data) {
		//console.log('getVarValue', varName, data)
		var ret = data
		for(let f of varName.split('.')) {
			
			if (typeof ret == 'object' && f in ret) {
				ret = ret[f]
			}
			else {
				//console.warn(`[Core] getVarValue: attribut '${varName}' is not in object:`, data)
				return undefined
			}
			
			//console.log('f', f, 'ret', ret)
		}
		//console.log('ret', ret)
		return ret
	}

	function getValue(ctx, varName, fn) {

		//console.log('[Core] getValue', varName, ctx)

		var not = false
		if (varName.startsWith('!')) {
			varName = varName.substr(1)
			not = true
		}			

		var prefixName = varName.split('.')[0]
		//console.log('[Core] prefixName', prefixName)
		if (ctx.varsToUpdate && ctx.varsToUpdate.indexOf(prefixName) < 0) {
			return
		}

		var func = ctx.data[varName]
		var value

		if (typeof func == 'function') {
			value = func.call(ctx.data)
		}
		else {
			value = getVarValue(varName, ctx.data)
		}

		if (value == undefined) {
			//console.warn(`[Core] processTemplate: variable '${varName}' is not defined in object data:`, data)
			return
		}
		//console.log('value', value)
		if (typeof value == 'boolean' && not) {
			value = !value
		}
		fn(value)
	}

	function bnIf(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			if (value === false) {
				ctx.elt.remove()
			}
		})		
	}

	function bnShow(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			if (typeof value == 'boolean') {
				ctx.elt.bnVisible(value)
			}				
			else {
				console.warn(`[Core] bn-show: variable '${varName}' is not an boolean`, data)
			}
		})		
	}


	function bnEach(ctx) {
		var f = ctx.dirValue.split(' ')
		if (f.length != 3 || f[1] != 'of') {
			console.error('[Core] bn-each called with bad arguments:', dirValue)
			return
		}
		var iter = f[0]
		var varName = f[2]
		//console.log('bn-each iter', iter,  ctx.template)
		
		getValue(ctx, varName, function(value) {
			if (Array.isArray(value)) {

				ctx.elt.empty()
				
				value.forEach(function(item) {
					var itemData = $.extend({}, ctx.data)
					itemData[iter] = item
					//var $item = $(ctx.template)
					var $item = ctx.template.clone()
					console.log('$item', $item.get(0).outerHTML)
					$item.processUI(itemData)
					ctx.elt.append($item)
				})
			}	
			else {
				console.warn(`[Core] bn-each: variable '${varName}' is not an array`, data)
			}			
		})
	}

	function bnText(ctx) {
		//console.log('[Core] bnText', ctx)
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.text(value)
		})
	}
	
	function bnHtml(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.html(value)
		})
	}

	function bnCombo(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.initCombo(value)
		})
	}

	function bnOptions(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.data('$options', value)
		})
	}


	function bnVal(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.setValue(value)
		})
	}


	function bnProp(ctx) {
		splitAttr(ctx.dirValue, function(propName, varName) {
			getValue(ctx, varName, function(value) {
				if (typeof value == 'boolean') {
					ctx.elt.prop(propName, value)
				}				
				else {
					console.warn(`[Core] bn-prop: variable '${varName}' is not an boolean`, data)
				}
			})	
		})
	}

	function bnAttr(ctx) {
		splitAttr(ctx.dirValue, function(attrName, varName) {
			getValue(ctx, varName, function(value) {
				ctx.elt.attr(attrName, value)
			})
		})
	}

	function bnStyle(ctx) {
		splitAttr(ctx.dirValue, function(attrName, varName) {
			getValue(ctx, varName, function(value) {
				ctx.elt.css(attrName, value)
			})
		})
	}


	function bnData(ctx) {
		splitAttr(ctx.dirValue, function(attrName, varName) {
			getValue(ctx, varName, function(value) {
				ctx.elt.setProp(attrName, value)
			})
		})
	}


	function bnClass(ctx) {
		splitAttr(ctx.dirValue, function(propName, varName) {
			getValue(ctx, varName, function(value) {
				if (typeof value == 'boolean') {
					if (value) {
						ctx.elt.addClass(propName)
					}
					else {
						ctx.elt.removeClass(propName)
					}				
				}	
				else {
					console.warn(`[Core] bn-class: variable '${varName}' is not an boolean`, data)
				}
			})	
		})
	}	


	var dirMap = {
		'bn-each': bnEach,			
		'bn-if': bnIf,
		'bn-text': bnText,	
		'bn-html': bnHtml,
		'bn-options': bnOptions,			
		'bn-list': bnCombo,			
		'bn-val': bnVal,	
		'bn-prop': bnProp,
		'bn-attr': bnAttr,	
		'bn-data': bnData,			
		'bn-class': bnClass,
		'bn-show': bnShow,
		'bn-style': bnStyle
	}

	$.fn.setProp = function(attrName, value) {
		var iface = this.interface()
		if (iface && iface.setProp) {
			iface.setProp(attrName, value)
		}
		else {
			this.data(attrName, value)
		}

		return this
	}



	$.fn.processTemplate = function(data) {
		//console.log('[Core] processTemplate')
		var that = this

		var dirList = []

		for(let k in dirMap) {
			this.bnFind(k, true, function(elt, dirValue) {
				var template
				if (k == 'bn-each') {
					template = elt.children().remove().clone()//.get(0).outerHTML
					//console.log('template', template)
				}
				if (k == 'bn-val') {
					elt.data('$val', dirValue)
					var updateEvent = elt.attr('bn-update')
					if (updateEvent != undefined) {
						elt.removeAttr('bn-update')
						elt.on(updateEvent, function(ev, ui) {
							//console.log('ui', ui)

							var value = (ui &&  ui.value) ||  $(this).getValue()
							//console.log('value', value)
							that.trigger('data:update', [dirValue, value, elt])
						})
					}
				}

				dirList.push({directive: k, elt: elt, dirValue: dirValue, template: template})
			})
		}

		if (data) {
			this.updateTemplate(dirList, data)
		}
				
		return dirList

	}	

	$.fn.updateTemplate = function(dirList, data, varsToUpdate, excludeElt) {
		//console.log('[core] updateTemplate', data, varsToUpdate)

			//console.log('data', data)
		varsToUpdate = varsToUpdate || Object.keys(data)
		//console.log('varsToUpdate', varsToUpdate)

		dirList.forEach(function(dirItem) {
			var fn = dirMap[dirItem.directive]
			if (typeof fn == 'function' && dirItem.elt != excludeElt) {
				dirItem.data = data;
				dirItem.varsToUpdate = varsToUpdate;
				fn(dirItem)
			}
		})			
		

		
		return this

	}	


})();
(function() {

	$.fn.processUI = function(data) {
		//console.log('processUI', data, this.html())
		var dirList = this.processTemplate(data)
		this.processControls(data)
		.processFormData(data)
		.processContextMenu(data)
		return dirList
	}

})();
(function() {

	$.fn.bnFilter = function(selector) {
		return this.find(selector).add(this.filter(selector))
	}

	$.fn.bnFind = function(attrName, removeAttr, cbk) {
		this.bnFilter(`[${attrName}]`).each(function() {
			var elt = $(this)
			var attrValue = elt.attr(attrName)
			if (removeAttr) {
				elt.removeAttr(attrName)
			}		
			cbk(elt, attrValue)
		})
	}

	$.fn.bnFindEx = function(attrName, removeAttr, cbk) {
		this.bnFind(attrName, removeAttr, function(elt, attrValue) {
			attrValue.split(',').forEach(function(item) {
				var list = item.split(':')
				if (list.length == 2) {
					var name = list[0].trim()
					var value = list[1].trim()
					cbk(elt, name, value)
				}
				else {
					console.error(`[Core] bnFindEx(${attrName}) 'attrValue' not correct:`, item)
				}
			})
		})
	}

	$.fn.bnVisible = function(isVisible) {
		if (isVisible) {
			this.show()
		}
		else {
			this.hide()
		}
		return this	
	}

	$.fn.initCombo = function(values) {
		this
		.empty()
		.append(values.map(function(value) {
			return `<option value=${value}>${value}</option>`
		}))

		return this
	}


})();

$$.showAlert = function(text, title, callback) {
	title = title || 'Information'
	$('<div>', {title: title})
		.append($('<p>').html(text))
		.dialog({
			classes: {
				'ui-dialog-titlebar-close': 'no-close'
			},
			width: 'auto',
			modal: true,
			close: function() {
				$(this).dialog('destroy')
			},
			buttons: [
				{
					text: 'Close',
					click: function() {
						$(this).dialog('close')
						if (typeof callback == 'function') {
							callback()
						}
					}
				}
			]
		})
};	


$$.showConfirm = function(text, title, callback) {
	title = title || 'Information'
	$('<div>', {title: title})
		.append($('<p>').html(text))
		.dialog({

			modal: true,

			close: function() {
				$(this).dialog('destroy')
			},
			buttons: [
				{
					text: 'Cancel',
					//class: 'w3-button w3-red bn-no-corner',
					click: function() {
						$(this).dialog('close')

					}
				},
				{
					text: 'OK',
					//class: 'w3-button w3-blue bn-no-corner',
					click: function() {
						$(this).dialog('close')
						if (typeof callback == 'function') {
							callback()
						}
					}
				}					
			]
		})
};
	


$$.showPicture = function(title, pictureUrl) {
	$('<div>', {title: title})
		.append($('<div>', {class: 'bn-flex-col bn-align-center'})
			.append($('<img>', {src: pictureUrl}))
		)
		.dialog({

			modal: true,
			width: 'auto',
			maxHeight: 600,
			maxWidth: 600,
			//position: {my: 'center center', at: 'center center'},

			close: function() {
				$(this).dialog('destroy')
			}

		})
};




$$.showPrompt = function(label, title, callback, options) {
	title = title || 'Information'
	options = $.extend({type: 'text'}, options)
	//console.log('options', options)

	var div = $('<div>', {title: title})
		.append($('<form>')
			.append($('<p>').text(label))
			.append($('<input>', {class: 'value'}).attr(options).prop('required', true).css('width', '100%'))
			.append($('<input>', {type: 'submit'}).hide())
			.on('submit', function(ev) {
				ev.preventDefault()
				div.dialog('close')
				if (typeof callback == 'function') {
					var val = div.find('.value').val()
					callback(val)
				}				
			})
		)
		.dialog({
			classes: {
				'ui-dialog-titlebar-close': 'no-close'
			},
			modal: true,
			close: function() {
				$(this).dialog('destroy')
			},
			buttons: [
				{
					text: 'Cancel',
					click: function() {
						$(this).dialog('close')
					}
				},
				{
					text: 'Apply',
					click: function() {
						$(this).find('[type=submit]').click()
					}
				}
			]
		})
};


(function(){

	
	function isObject(a) {
		return (typeof a == 'object') && !Array.isArray(a)
	}

	$$.checkType = function(value, type, isOptional) {
		//console.log('checkType',value, type, isOptional)
		if (typeof value == 'undefined' && isOptional === true) {
			return true
		}

		if (typeof type == 'string') {
			return typeof value == type
		}

		if (Array.isArray(value)) {
			if (!Array.isArray(type)) {
				return false
			}

			if (type.length == 0) {
				return true // no item type checking
			}
			for(let i of value) {
				var ret = false
				for(let t of type) {
					ret |= $$.checkType(i, t)
				}
				if (!ret) {
					return false
				}
			}

			return true
		}

		if (isObject(type)) {
			if (!isObject(value)) {
				return false
			}
			for(let f in type) {

				//console.log('f', f, 'value', value)
				var newType = type[f]

				var isOptional = false
				if (f.startsWith('$')) {
					f = f.substr(1)
					isOptional = true
				}
				if (!$$.checkType(value[f], newType, isOptional)) {
					return false
				}

			}

			return true
		}
		return false
	}	


})();

$$.dataURLtoBlob = function(dataURL) {
  // Decode the dataURL
  var split = dataURL.split(/[:,;]/)
  var mimeType = split[1]
  var encodage = split[2]
  if (encodage != 'base64') {
  	return
  }
  var data = split[3]

  console.log('mimeType', mimeType)
  console.log('encodage', encodage)
  //console.log('data', data)

  var binary = atob(data)
 // Create 8-bit unsigned array
  var array = []
  for(var i = 0; i < binary.length; i++) {
  	array.push(binary.charCodeAt(i))
  }

  // Return our Blob object
	return new Blob([ new Uint8Array(array) ], {mimeType})
};

$$.extract = function(obj, values) {
	if (typeof values == 'string') {
		values = values.split(',')
	}
	if (!Array.isArray(values) && typeof values == 'object') {
		values = Object.keys(values)
	}
	var ret = {}
	for(var k in obj) {
		if (values.indexOf(k) >= 0) {
			ret[k] = obj[k]
		}
	}
	return ret
};

$$.isImage = function(fileName) {
	return (/\.(gif|jpg|jpeg|png)$/i).test(fileName)
};

$$.loadStyle = function(styleFilePath, callback) {	
	//console.log('[Core] loadStyle', styleFilePath)

	$(function() {
		var cssOk = $('head').find(`link[href="${styleFilePath}"]`).length
		if (cssOk != 1) {
			console.log(`[Core] loading '${styleFilePath}' dependancy`)
			$('<link>', {href: styleFilePath, rel: 'stylesheet'})
			.on('load', function() {
				console.log(`[Core] '${styleFilePath}' loaded`)
				if (typeof callback == 'function') {
					callback()
				}
			})
			.appendTo($('head'))
		}
	})
};

$$.obj2Array = function(obj) {
	var ret = []
	for(var key in obj) {
		ret.push({key: key, value: obj[key]})
	}
	return ret
};

(function() {

var inputFile = $('<input>', {type: 'file'}).on('change', function() {
	var onApply = $(this).data('onApply')
	var fileName = this.files[0]
	if (typeof onApply == 'function') {
		onApply(fileName)
	}
})

$$.openFileDialog = function(onApply) {
	inputFile.data('onApply', onApply)
	inputFile.click()
}

})();


$$.readFileAsDataURL = function(fileName, onRead) {
	var fileReader = new FileReader()

	fileReader.onload = function() {
		if (typeof onRead == 'function') {
			onRead(fileReader.result)
		}
	}
	fileReader.readAsDataURL(fileName)
};

$$.readTextFile = function(fileName, onRead) {
	var fileReader = new FileReader()

	fileReader.onload = function() {
		if (typeof onRead == 'function') {
			onRead(fileReader.result)
		}
	}
	fileReader.readAsText(fileName)
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYm9vdC9pbmRleC5qcyIsImNvbnRyb2xsZXJzL2RpYWxvZ0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9mb3JtRGlhbG9nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL3ZpZXcuanMiLCJjb3JlL2NvbnRyb2xzLmpzIiwiY29yZS9vYmplY3RzQW5kU2VydmljZXMuanMiLCJwbHVnaW5zL2JpbmRpbmcuanMiLCJwbHVnaW5zL2NvbnRyb2wuanMiLCJwbHVnaW5zL2V2ZW50LmpzIiwicGx1Z2lucy9mb3JtLmpzIiwicGx1Z2lucy9tZW51LmpzIiwicGx1Z2lucy90ZW1wbGF0ZS5qcyIsInBsdWdpbnMvdWkuanMiLCJwbHVnaW5zL3V0aWwuanMiLCJ1aS9zaG93QWxlcnQuanMiLCJ1aS9zaG93Q29uZmlybS5qcyIsInVpL3Nob3dQaWN0dXJlLmpzIiwidWkvc2hvd1Byb21wdC5qcyIsInV0aWwvY2hlY2tUeXBlLmpzIiwidXRpbC9kYXRhVVJMdG9CbG9iLmpzIiwidXRpbC9leHRyYWN0LmpzIiwidXRpbC9pc0ltYWdlLmpzIiwidXRpbC9sb2FkU3R5bGUuanMiLCJ1dGlsL29iajJBcnJheS5qcyIsInV0aWwvb3BlbkZpbGVEaWFsb2cuanMiLCJ1dGlsL3JlYWRGaWxlQXNEYXRhVVJMLmpzIiwidXRpbC9yZWFkVGV4dEZpbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtcclxuXHJcblx0XHJcblx0d2luZG93LiQkID0ge31cclxuXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpe1xyXG5cclxudmFyIGZuQ29uZmlnUmVhZHlcclxudmFyIGN1clJvdXRlXHJcblx0XHJcbiQkLmNvbmZpZ1JlYWR5ID0gZnVuY3Rpb24oZm4pIHtcclxuXHJcblx0Zm5Db25maWdSZWFkeSA9IGZuXHJcbn1cclxuXHJcbiQkLnN0YXJ0QXBwID0gZnVuY3Rpb24obWFpbkNvbnRyb2xOYW1lLCBjb25maWcpIHtcclxuXHQkJC52aWV3Q29udHJvbGxlcignYm9keScsIHtcclxuXHRcdHRlbXBsYXRlOiBgPGRpdiBibi1jb250cm9sPVwiJHttYWluQ29udHJvbE5hbWV9XCIgY2xhc3M9XCJtYWluUGFuZWxcIiBibi1vcHRpb25zPVwiY29uZmlnXCI+PC9kaXY+YCxcclxuXHRcdGRhdGE6IHtjb25maWd9XHJcblx0fSlcclxufVxyXG5cclxuZnVuY3Rpb24gcHJvY2Vzc1JvdXRlKCkge1xyXG5cdHZhciBwcmV2Um91dGUgPSBjdXJSb3V0ZVxyXG5cdHZhciBocmVmID0gbG9jYXRpb24uaHJlZlxyXG5cdHZhciBpZHggPSBocmVmLmluZGV4T2YoJyMnKVxyXG5cdGN1clJvdXRlID0gKGlkeCAhPT0gLTEpICA/IGhyZWYuc3Vic3RyKGlkeCsxKSA6ICcvJ1xyXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBuZXdSb3V0ZScsIGN1clJvdXRlLCBwcmV2Um91dGUpXHJcblxyXG5cclxuXHQkKHdpbmRvdykudHJpZ2dlcigncm91dGVDaGFuZ2UnLCB7Y3VyUm91dGU6Y3VyUm91dGUsIHByZXZSb3V0ZTogcHJldlJvdXRlfSlcclxuXHJcbn1cdFxyXG5cclxuJChmdW5jdGlvbigpIHtcclxuXHJcblx0dmFyIGFwcE5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnLycpWzJdXHJcblxyXG5cdGNvbnNvbGUubG9nKGBbQ29yZV0gQXBwICcke2FwcE5hbWV9JyBzdGFydGVkIDopYClcclxuXHRjb25zb2xlLmxvZygnW0NvcmVdIGpRdWVyeSB2ZXJzaW9uJywgJC5mbi5qcXVlcnkpXHJcblx0Y29uc29sZS5sb2coJ1tDb3JlXSBqUXVlcnkgVUkgdmVyc2lvbicsICQudWkudmVyc2lvbilcclxuXHJcblx0XHJcblxyXG5cclxuXHQkKHdpbmRvdykub24oJ3BvcHN0YXRlJywgZnVuY3Rpb24oZXZ0KSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdbcG9wc3RhdGVdIHN0YXRlJywgZXZ0LnN0YXRlKVxyXG5cdFx0cHJvY2Vzc1JvdXRlKClcclxuXHR9KVxyXG5cclxuXHJcblx0aWYgKHR5cGVvZiBmbkNvbmZpZ1JlYWR5ID09ICdmdW5jdGlvbicpIHtcclxuXHRcdCQuZ2V0SlNPTihgL2FwaS91c2Vycy9jb25maWcvJHthcHBOYW1lfWApXHJcblx0XHQudGhlbihmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0XHRcdCQkLmNvbmZpZ3VyZVNlcnZpY2UoJ1dlYlNvY2tldFNlcnZpY2UnLCB7aWQ6IGFwcE5hbWUgKyAnLicgKyBjb25maWcuJHVzZXJOYW1lICsgJy4nfSlcclxuXHRcdFx0JCgnYm9keScpLnByb2Nlc3NDb250cm9scygpIC8vIHByb2Nlc3MgSGVhZGVyQ29udHJvbFxyXG5cdFx0XHRcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRmbkNvbmZpZ1JlYWR5KGNvbmZpZylcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXRjaChlKSB7XHJcblx0XHRcdFx0dmFyIGh0bWwgPSBgXHJcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XHJcblx0XHRcdFx0XHRcdDxwIGNsYXNzPVwidzMtdGV4dC1yZWRcIj4ke2V9PC9wPlxyXG5cdFx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdFx0YFxyXG5cdFx0XHRcdCQoJ2JvZHknKS5odG1sKGh0bWwpXHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdFxyXG5cdFx0XHRwcm9jZXNzUm91dGUoKVxyXG5cdFx0fSlcclxuXHRcdC5jYXRjaCgoanF4aHIpID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ2pxeGhyJywganF4aHIpXHJcblx0XHRcdC8vdmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeShqcXhoci5yZXNwb25zZUpTT04sIG51bGwsIDQpXHJcblx0XHRcdHZhciB0ZXh0ID0ganF4aHIucmVzcG9uc2VUZXh0XHJcblx0XHRcdHZhciBodG1sID0gYFxyXG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cclxuXHRcdFx0XHRcdDxwIGNsYXNzPVwidzMtdGV4dC1yZWRcIj4ke3RleHR9PC9wPlxyXG5cdFx0XHRcdFx0PGEgaHJlZj1cIi9kaXNjb25uZWN0XCIgY2xhc3M9XCJ3My1idG4gdzMtYmx1ZVwiPkxvZ291dDwvYT5cclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0YFxyXG5cdFx0XHQkKCdib2R5JykuaHRtbChodG1sKVxyXG5cdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0Y29uc29sZS53YXJuKCdNaXNzaW5nIGZ1bmN0aW9uIGNvbmZpZ1JlYWR5ICEhJylcclxuXHR9XHJcblx0XHJcblxyXG59KVxyXG5cclxuXHRcclxufSkoKTtcclxuIiwiJCQuZGlhbG9nQ29udHJvbGxlciA9IGZ1bmN0aW9uKHRpdGxlLCBvcHRpb25zKSB7XHJcblx0dmFyIGRpdiA9ICQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblxyXG5cdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZGl2LCBvcHRpb25zKVxyXG5cdGRpdi5kaWFsb2coe1xyXG5cdFx0YXV0b09wZW46IGZhbHNlLFxyXG5cdFx0bW9kYWw6IHRydWUsXHJcblx0XHR3aWR0aDogJ2F1dG8nLFxyXG5cdFx0YnV0dG9uczoge1xyXG5cdFx0XHQnQ2FuY2VsJzogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0fSxcclxuXHRcdFx0J0FwcGx5JzogZnVuY3Rpb24oKSB7XHRcdFx0XHRcdFxyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uQXBwbHkgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0b3B0aW9ucy5vbkFwcGx5LmNhbGwoY3RybClcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0Y3RybC5zaG93ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRkaXYuZGlhbG9nKCdvcGVuJylcclxuXHR9XHJcblx0cmV0dXJuIGN0cmxcclxufTtcclxuXHJcbiIsIiQkLmZvcm1EaWFsb2dDb250cm9sbGVyID0gZnVuY3Rpb24odGl0bGUsIG9wdGlvbnMpIHtcclxuXHR2YXIgZGl2ID0gJCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHR2YXIgZm9ybSA9ICQoJzxmb3JtPicpXHJcblx0XHQuYXBwZW5kVG8oZGl2KVxyXG5cdFx0Lm9uKCdzdWJtaXQnLCBmdW5jdGlvbihldikge1xyXG5cdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRcdGRpdi5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uQXBwbHkgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdG9wdGlvbnMub25BcHBseS5jYWxsKGN0cmwsIGN0cmwuZWx0LmdldEZvcm1EYXRhKCkpXHJcblx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0fSlcclxuXHR2YXIgc3VibWl0QnRuID0gJCgnPGlucHV0PicsIHt0eXBlOiAnc3VibWl0JywgaGlkZGVuOiB0cnVlfSkuYXBwZW5kVG8oZm9ybSlcclxuXHJcblx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihmb3JtLCBvcHRpb25zKVxyXG5cdGRpdi5kaWFsb2coe1xyXG5cdFx0YXV0b09wZW46IGZhbHNlLFxyXG5cdFx0bW9kYWw6IHRydWUsXHJcblx0XHR3aWR0aDogJ2F1dG8nLFxyXG5cdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQvLyQodGhpcykuZGlhbG9nKCdkZXN0cm95JylcclxuXHRcdH0sXHJcblx0XHRidXR0b25zOiB7XHJcblx0XHRcdCdDYW5jZWwnOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHQnQXBwbHknOiBmdW5jdGlvbigpIHtcdFx0XHRcdFx0XHJcblx0XHRcdFx0c3VibWl0QnRuLmNsaWNrKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0Y3RybC5zaG93ID0gZnVuY3Rpb24oZGF0YSwgb25BcHBseSkge1xyXG5cdFx0aWYgKHR5cGVvZiBjdHJsLmJlZm9yZVNob3cgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRjdHJsLmJlZm9yZVNob3coKVxyXG5cdFx0fVxyXG5cdFx0b3B0aW9ucy5vbkFwcGx5ID0gb25BcHBseVxyXG5cdFx0Y3RybC5lbHQuc2V0Rm9ybURhdGEoZGF0YSlcclxuXHRcdGRpdi5kaWFsb2coJ29wZW4nKVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGN0cmxcclxufTtcclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG5cclxuXHJcbmNsYXNzIFZpZXdDb250cm9sbGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKGVsdCwgb3B0aW9ucykge1xyXG4gICAgXHQvL2NvbnNvbGUubG9nKCdWaWV3Q29udHJvbGxlcicsIG9wdGlvbnMpXHJcbiAgICBcdGlmICh0eXBlb2YgZWx0ID09ICdzdHJpbmcnKSB7XHJcbiAgICBcdFx0ZWx0ID0gJChlbHQpXHJcbiAgICBcdH1cclxuXHJcbiAgICBcdG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucylcclxuICAgICAgICB0aGlzLmVsdCA9IGVsdFxyXG5cclxuICAgICAgICB0aGlzLmVsdC5vbignZGF0YTp1cGRhdGUnLCAoZXYsIG5hbWUsIHZhbHVlLCBleGNsdWRlRWx0KSA9PiB7XHJcbiAgICAgICAgXHQvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIGRhdGE6Y2hhbmdlJywgbmFtZSwgdmFsdWUpXHJcbiAgICAgICAgXHR0aGlzLnNldERhdGEobmFtZSwgdmFsdWUsIGV4Y2x1ZGVFbHQpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRlbXBsYXRlID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgXHR0aGlzLmVsdCA9ICQob3B0aW9ucy50ZW1wbGF0ZSkuYXBwZW5kVG8oZWx0KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm1vZGVsID0gJC5leHRlbmQoe30sIG9wdGlvbnMuZGF0YSlcclxuICAgICAgICB0aGlzLnJ1bGVzID0gJC5leHRlbmQoe30sIG9wdGlvbnMucnVsZXMpXHJcbiAgICAgICAgdGhpcy53YXRjaGVzID0gJC5leHRlbmQoe30sIG9wdGlvbnMud2F0Y2hlcylcclxuXHJcbiAgICAgICAgLy8gZ2VuZXJhdGUgYXV0b21hdGljIHJ1bGVzIGZvciBjb21wdXRlZCBkYXRhIChha2EgZnVuY3Rpb24pXHJcbiAgICAgICAgZm9yKHZhciBrIGluIHRoaXMubW9kZWwpIHtcclxuICAgICAgICBcdHZhciBkYXRhID0gdGhpcy5tb2RlbFtrXVxyXG4gICAgICAgIFx0aWYgKHR5cGVvZiBkYXRhID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBcdFx0dmFyIGZ1bmNUZXh0ID0gZGF0YS50b1N0cmluZygpXHJcbiAgICAgICAgXHRcdC8vY29uc29sZS5sb2coJ2Z1bmNUZXh0JywgZnVuY1RleHQpXHJcbiAgICAgICAgXHRcdHZhciBydWxlcyA9IFtdXHJcbiAgICAgICAgXHRcdGZ1bmNUZXh0LnJlcGxhY2UoL3RoaXMuKFthLXpBLVowLTlfLV17MSx9KS9nLCBmdW5jdGlvbihtYXRjaCwgY2FwdHVyZU9uZSkge1xyXG4gICAgICAgIFx0XHRcdC8vY29uc29sZS5sb2coJ2NhcHR1cmVPbmUnLCBjYXB0dXJlT25lKVxyXG4gICAgICAgIFx0XHRcdHJ1bGVzLnB1c2goY2FwdHVyZU9uZSlcclxuICAgICAgICBcdFx0fSlcclxuICAgICAgICBcdFx0dGhpcy5ydWxlc1trXSA9IHJ1bGVzLnRvU3RyaW5nKClcclxuICAgICAgICBcdH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3J1bGVzJywgdGhpcy5ydWxlcylcclxuICAgICAgICB0aGlzLmRpckxpc3QgPSB0aGlzLmVsdC5wcm9jZXNzVUkodGhpcy5tb2RlbClcclxuXHJcblxyXG4gICAgICAgIC8vdGhpcy5lbHQucHJvY2Vzc1VJKHRoaXMubW9kZWwpXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmV2ZW50cyA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLmVsdC5wcm9jZXNzRXZlbnRzKG9wdGlvbnMuZXZlbnRzKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zY29wZSA9IHRoaXMuZWx0LnByb2Nlc3NCaW5kaW5ncygpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc2NvcGUnLCB0aGlzLnNjb3BlKVxyXG4gICAgICAgXHJcbiAgICAgICAgdmFyIGluaXQgPSBvcHRpb25zLmluaXRcclxuICAgICAgICBpZiAodHlwZW9mIGluaXQgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIFx0aW5pdC5jYWxsKHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfSBcclxuXHJcbiAgICBzZXREYXRhKGFyZzEsIGFyZzIsIGV4Y2x1ZGVFbHQpIHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHNldERhdGEnLCBhcmcxLCBhcmcyKVxyXG4gICAgICAgIHZhciBkYXRhID0gYXJnMVxyXG4gICAgICAgIGlmICh0eXBlb2YgYXJnMSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIFx0ZGF0YSA9IHt9XHJcbiAgICAgICAgXHRkYXRhW2FyZzFdID0gYXJnMlxyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHNldERhdGEnLCBkYXRhKVxyXG4gICAgICAgICQuZXh0ZW5kKHRoaXMubW9kZWwsIGRhdGEpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbW9kZWwnLCB0aGlzLm1vZGVsKVxyXG4gICAgICAgIHRoaXMudXBkYXRlKE9iamVjdC5rZXlzKGRhdGEpLCBleGNsdWRlRWx0KVxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShmaWVsZHNOYW1lLCBleGNsdWRlRWx0KSB7XHJcbiAgICBcdC8vY29uc29sZS5sb2coJ1tWaWV3Q29udHJvbGxlcl0gdXBkYXRlJywgZmllbGRzTmFtZSlcclxuICAgIFx0aWYgKHR5cGVvZiBmaWVsZHNOYW1lID09ICdzdHJpbmcnKSB7XHJcbiAgICBcdFx0ZmllbGRzTmFtZSA9IGZpZWxkc05hbWUuc3BsaXQoJywnKVxyXG4gICAgXHR9XHJcblxyXG5cclxuICAgIFx0aWYgKEFycmF5LmlzQXJyYXkoZmllbGRzTmFtZSkpIHtcclxuICAgIFx0XHR2YXIgZmllbGRzU2V0ID0ge31cclxuICAgIFx0XHRmaWVsZHNOYW1lLmZvckVhY2goKGZpZWxkKSA9PiB7XHJcblxyXG4gICAgXHRcdFx0dmFyIHdhdGNoID0gdGhpcy53YXRjaGVzW2ZpZWxkXVxyXG4gICAgXHRcdFx0aWYgKHR5cGVvZiB3YXRjaCA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBcdFx0XHRcdHdhdGNoLmNhbGwobnVsbCwgdGhpcy5tb2RlbFtmaWVsZF0pXHJcbiAgICBcdFx0XHR9XHJcbiAgICBcdFx0XHRmaWVsZHNTZXRbZmllbGRdID0gMVxyXG5cclxuICAgIFx0XHRcdGZvcih2YXIgcnVsZSBpbiB0aGlzLnJ1bGVzKSB7XHJcbiAgICBcdFx0XHRcdGlmICh0aGlzLnJ1bGVzW3J1bGVdLnNwbGl0KCcsJykuaW5kZXhPZihmaWVsZCkgIT0gLTEpIHtcclxuICAgIFx0XHRcdFx0XHRmaWVsZHNTZXRbcnVsZV0gPSAxXHJcbiAgICBcdFx0XHRcdH1cclxuICAgIFx0XHRcdH1cclxuICAgIFx0XHR9KVxyXG5cclxuXHJcbiAgICBcdFx0dGhpcy5lbHQudXBkYXRlVGVtcGxhdGUodGhpcy5kaXJMaXN0LCB0aGlzLm1vZGVsLCBPYmplY3Qua2V5cyhmaWVsZHNTZXQpLCBleGNsdWRlRWx0KVxyXG4gICAgXHR9XHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuICAgICQkLnZpZXdDb250cm9sbGVyID0gZnVuY3Rpb24gKGVsdCwgb3B0aW9ucykge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmlld0NvbnRyb2xsZXIoZWx0LCBvcHRpb25zKVxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKXtcclxuXHJcblxyXG5cclxuJCQucmVnaXN0ZXJDb250cm9sID0gZnVuY3Rpb24obmFtZSwgYXJnMSwgYXJnMikge1xyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdjb250cm9scycsIG5hbWUsIGFyZzEsIGFyZzIpXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4ID0gZnVuY3Rpb24obmFtZSwgb3B0aW9ucykge1xyXG5cdGlmICghJCQuY2hlY2tUeXBlKG9wdGlvbnMsIHtcclxuXHRcdCRkZXBzOiBbJ3N0cmluZyddLFxyXG5cdFx0JGlmYWNlOiAnc3RyaW5nJyxcclxuXHRcdCRldmVudHM6ICdzdHJpbmcnLFxyXG5cdFx0aW5pdDogJ2Z1bmN0aW9uJ1xyXG5cdH0pKSB7XHJcblx0XHRjb25zb2xlLmVycm9yKGBbQ29yZV0gcmVnaXN0ZXJDb250cm9sRXg6IGJhZCBvcHRpb25zYCwgb3B0aW9ucylcclxuXHRcdHJldHVyblxyXG5cdH1cclxuXHJcblxyXG5cdHZhciBkZXBzID0gb3B0aW9ucy5kZXBzIHx8IFtdXHJcblxyXG5cclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnY29udHJvbHMnLCBuYW1lLCBkZXBzLCBvcHRpb25zKVxyXG59XHJcblxyXG5cclxuXHJcbiQkLmNyZWF0ZUNvbnRyb2wgPSBmdW5jdGlvbihjb250cm9sTmFtZSwgZWx0KSB7XHJcblx0ZWx0LmFkZENsYXNzKGNvbnRyb2xOYW1lKVxyXG5cdGVsdC5hZGRDbGFzcygnQ3VzdG9tQ29udHJvbCcpLnVuaXF1ZUlkKClcdFxyXG5cdHZhciBjdHJsID0gJCQuZ2V0T2JqZWN0KCdjb250cm9scycsIGNvbnRyb2xOYW1lKVxyXG5cdFx0XHJcblx0aWYgKGN0cmwgIT0gdW5kZWZpbmVkKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdjcmVhdGVDb250cm9sJywgY29udHJvbE5hbWUsIGN0cmwpXHJcblx0XHRpZiAoY3RybC5zdGF0dXMgPT09ICAnb2snKSB7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgaWZhY2UgPSB7fVxyXG5cclxuXHRcdFx0XHJcblx0XHRcdGlmICh0eXBlb2YgY3RybC5mbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0dmFyIGFyZ3MgPSBbZWx0XS5jb25jYXQoY3RybC5kZXBzKVxyXG5cdFx0XHRcdHZhciBjb3B5T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBlbHQuZ2V0T3B0aW9ucygpKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gaW5zdGFuY2UgY29udHJvbCAnJHtjb250cm9sTmFtZX0nYClcclxuXHRcdFx0XHRjdHJsLmZuLmFwcGx5KGlmYWNlLCBhcmdzKVx0XHJcblx0XHRcdFx0aWZhY2Uub3B0aW9ucyA9IGNvcHlPcHRpb25zXHJcblx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAodHlwZW9mIGN0cmwuZm4gPT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHR2YXIgaW5pdCA9IGN0cmwuZm4uaW5pdFxyXG5cdFx0XHRcdHZhciBwcm9wcyA9IGN0cmwuZm4ucHJvcHMgfHwge31cclxuXHRcdFx0XHR2YXIgY3R4ID0ge31cclxuXHRcdFx0XHR2YXIgZGVmYXVsdE9wdGlvbnMgPSBjdHJsLmZuLm9wdGlvbnMgfHwge31cclxuXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBpbml0ID09ICdmdW5jdGlvbicpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgaW5pdFZhbHVlcyA9IHt9XHJcblx0XHRcdFx0XHRmb3IodmFyIGsgaW4gcHJvcHMpIHtcclxuXHRcdFx0XHRcdFx0Y3R4W2tdID0gcHJvcHNba10udmFsXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0dmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbnMsIGVsdC5nZXRPcHRpb25zKGN0eCkpXHJcblxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW0NvcmVdIG9wdGlvbnNgLCBvcHRpb25zKVxyXG5cdFx0XHRcdFx0dmFyIHRydWVPcHRpb25zID0ge31cclxuXHRcdFx0XHRcdGZvcih2YXIgayBpbiBvcHRpb25zKSB7XHJcblx0XHRcdFx0XHRcdGlmICghKGsgaW4gcHJvcHMpKSB7XHJcblx0XHRcdFx0XHRcdFx0dHJ1ZU9wdGlvbnNba10gPSBvcHRpb25zW2tdXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHR2YXIgY29weU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdHJ1ZU9wdGlvbnMpXHJcblxyXG5cdFx0XHRcdFx0dmFyIGFyZ3MgPSBbZWx0LCBvcHRpb25zXS5jb25jYXQoY3RybC5kZXBzKVxyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBpbnN0YW5jZSBjb250cm9sICcke2NvbnRyb2xOYW1lfScgd2l0aCBvcHRpb25zYCwgb3B0aW9ucylcclxuXHRcdFx0XHRcdGluaXQuYXBwbHkoaWZhY2UsIGFyZ3MpXHJcblx0XHRcdFx0XHRpZmFjZS5vcHRpb25zID0gY29weU9wdGlvbnNcclxuXHRcdFx0XHRcdGlmYWNlLmV2ZW50cyA9IGN0cmwuZm4uZXZlbnRzXHJcblxyXG5cdFx0XHRcdFx0aWYgKE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGggIT0gMCkge1xyXG5cdFx0XHRcdFx0XHRpZmFjZS5zZXRQcm9wID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbQ29yZV0gc2V0RGF0YWAsIG5hbWUsIHZhbHVlKVxyXG5cdFx0XHRcdFx0XHRcdHZhciBzZXR0ZXIgPSBwcm9wc1tuYW1lXSAmJiBwcm9wc1tuYW1lXS5zZXRcclxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIHNldHRlciA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIHNldHRlciA9IGlmYWNlW3NldHRlcl1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBzZXR0ZXIgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0c2V0dGVyLmNhbGwoY3R4LCB2YWx1ZSlcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0Y3R4W25hbWVdID0gdmFsdWVcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWZhY2UucHJvcHMgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgcmV0ID0ge31cclxuXHRcdFx0XHRcdFx0XHRmb3IodmFyIGsgaW4gcHJvcHMpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHJldFtrXSA9IGN0eFtrXVxyXG5cclxuXHRcdFx0XHRcdFx0XHRcdHZhciBnZXR0ZXIgPSBwcm9wc1trXS5nZXRcclxuXHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgZ2V0dGVyID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGdldHRlciA9IGlmYWNlW2dldHRlcl1cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGdldHRlciA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHJldFtrXSA9IGdldHRlci5jYWxsKGN0eClcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldFxyXG5cdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBjb250cm9sICcke2NvbnRyb2xOYW1lfScgbWlzc2luZyBpbml0IGZ1bmN0aW9uYClcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZmFjZS5uYW1lID0gY29udHJvbE5hbWVcclxuXHRcdFx0ZWx0LmdldCgwKS5jdHJsID0gaWZhY2VcclxuXHRcdFx0XHJcblx0XHRcdHJldHVybiBpZmFjZVx0XHRcdFx0XHJcblx0XHR9XHJcblxyXG5cclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHR0aHJvdyhgW0NvcmVdIGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXHJcblx0fVxyXG59XHJcblxyXG4kJC5nZXRSZWdpc3RlcmVkQ29udHJvbHMgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgY29udHJvbHMgPSAkJC5nZXRPYmplY3REb21haW4oJ2NvbnRyb2xzJylcclxuXHRyZXR1cm4gT2JqZWN0LmtleXMoY29udHJvbHMpLmZpbHRlcigobmFtZSkgPT4gIW5hbWUuc3RhcnRzV2l0aCgnJCcpKVxyXG59XHJcblxyXG4kJC5nZXRSZWdpc3RlcmVkQ29udHJvbHNFeCA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBjb250cm9scyA9ICQkLmdldE9iamVjdERvbWFpbignY29udHJvbHMnKVxyXG5cdHZhciBsaWJzID0ge31cclxuXHRmb3IodmFyIGsgaW4gY29udHJvbHMpIHtcclxuXHRcdHZhciBpbmZvID0gY29udHJvbHNba10uZm5cclxuXHRcdHZhciBsaWJOYW1lID0gaW5mby5saWJcclxuXHRcdGlmICh0eXBlb2YgbGliTmFtZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRpZiAobGlic1tsaWJOYW1lXSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRsaWJzW2xpYk5hbWVdID0gW11cclxuXHRcdFx0fVxyXG5cdFx0XHRsaWJzW2xpYk5hbWVdLnB1c2goaylcclxuXHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiBsaWJzXHJcbn1cclxuXHJcbiQkLmdldENvbnRyb2xJbmZvID0gZnVuY3Rpb24oY29udHJvbE5hbWUpIHtcclxuXHR2YXIgY29udHJvbHMgPSAkJC5nZXRPYmplY3REb21haW4oJ2NvbnRyb2xzJylcclxuXHR2YXIgaW5mbyA9IGNvbnRyb2xzW2NvbnRyb2xOYW1lXVxyXG5cclxuXHRpZiAoaW5mbyA9PSB1bmRlZmluZWQpIHtcclxuXHRcdGNvbnNvbGUubG9nKGBjb250cm9sICcke2NvbnRyb2xOYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxyXG5cdFx0cmV0dXJuXHJcblx0fVxyXG5cdGluZm8gPSBpbmZvLmZuXHJcblxyXG5cdHZhciByZXQgPSAkJC5leHRyYWN0KGluZm8sICdkZXBzLG9wdGlvbnMsbGliJylcclxuXHJcblx0aWYgKHR5cGVvZiBpbmZvLmV2ZW50cyA9PSAnc3RyaW5nJykge1xyXG5cdFx0cmV0LmV2ZW50cyA9IGluZm8uZXZlbnRzLnNwbGl0KCcsJylcclxuXHR9XHJcblxyXG5cdHZhciBwcm9wcyA9IHt9XHJcblx0Zm9yKHZhciBrIGluIGluZm8ucHJvcHMpIHtcclxuXHRcdHByb3BzW2tdID0gaW5mby5wcm9wc1trXS52YWxcclxuXHR9XHJcblx0aWYgKE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGggIT0gMCkge1xyXG5cdFx0cmV0LnByb3BzID0gcHJvcHNcclxuXHR9XHJcblx0aWYgKHR5cGVvZiBpbmZvLmlmYWNlID09ICdzdHJpbmcnKSB7XHJcblx0XHRyZXQuaWZhY2UgPSBpbmZvLmlmYWNlLnNwbGl0KCc7JylcclxuXHR9XHJcblx0cmV0dXJuIHJldFxyXG5cdC8vcmV0dXJuIGNvbnRyb2xzW2NvbnRyb2xOYW1lXS5mblxyXG59XHJcblxyXG5cclxuJCQuZ2V0Q29udHJvbHNUcmVlID0gZnVuY3Rpb24oc2hvd1doYXQpIHtcclxuXHRzaG93V2hhdCA9IHNob3dXaGF0IHx8ICcnXHJcblx0dmFyIHNob3dPcHRpb25zID0gc2hvd1doYXQuc3BsaXQoJywnKVxyXG5cdHZhciB0cmVlID0gW11cclxuXHQkKCcuQ3VzdG9tQ29udHJvbCcpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgaWZhY2UgPSAkKHRoaXMpLmludGVyZmFjZSgpXHJcblxyXG5cdFx0dmFyIGl0ZW0gPSB7bmFtZTppZmFjZS5uYW1lLCBlbHQ6ICQodGhpcyksIHBhcmVudDogbnVsbH1cclxuXHRcdGl0ZW0uaWQgPSAkKHRoaXMpLmF0dHIoJ2lkJylcclxuXHJcblx0XHRpZiAodHlwZW9mIGlmYWNlLmV2ZW50cyA9PSAnc3RyaW5nJyAmJlxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ2V2ZW50cycpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcclxuXHRcdFx0aXRlbS5ldmVudHMgPSBpZmFjZS5ldmVudHMuc3BsaXQoJywnKVxyXG5cdFx0fVx0XHRcdFxyXG5cclxuXHRcdHRyZWUucHVzaChpdGVtKVxyXG5cclxuXHRcdGlmIChzaG93T3B0aW9ucy5pbmRleE9mKCdpZmFjZScpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSB7XHJcblxyXG5cdFx0XHR2YXIgZnVuYyA9IFtdXHJcblx0XHRcdGZvcih2YXIgayBpbiBpZmFjZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgaWZhY2Vba10gPT0gJ2Z1bmN0aW9uJyAmJiBrICE9ICdwcm9wcycgJiYgayAhPSAnc2V0UHJvcCcpIHtcclxuXHRcdFx0XHRcdGZ1bmMucHVzaChrKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZnVuYy5sZW5ndGggIT0gMCkge1xyXG5cdFx0XHRcdGl0ZW0uaWZhY2UgPSBmdW5jXHJcblx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0aWYgKHR5cGVvZiBpZmFjZS5wcm9wcyA9PSAnZnVuY3Rpb24nICYmIFxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ3Byb3BzJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpKSkge1xyXG5cdFx0XHRpdGVtLnByb3BzID0gaWZhY2UucHJvcHMoKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgaWZhY2UuZ2V0VmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJlxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ3ZhbHVlJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpKSkge1xyXG5cdFx0XHRpdGVtLnZhbHVlID0gaWZhY2UuZ2V0VmFsdWUoKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgaWZhY2Uub3B0aW9ucyA9PSAnb2JqZWN0JyAmJiBPYmplY3Qua2V5cyhpZmFjZS5vcHRpb25zKS5sZW5ndGggIT0gMCAmJlxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ29wdGlvbnMnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykpKSB7XHJcblx0XHRcdGl0ZW0ub3B0aW9ucyA9IGlmYWNlLm9wdGlvbnNcclxuXHRcdH1cdFxyXG5cclxuXHRcdFx0XHRcdFxyXG5cdFx0Ly9jb25zb2xlLmxvZygnbmFtZScsIG5hbWUpXHJcblx0XHRpdGVtLmNoaWxkcyA9IFtdXHJcblxyXG5cclxuXHRcdHZhciBwYXJlbnRzID0gJCh0aGlzKS5wYXJlbnRzKCcuQ3VzdG9tQ29udHJvbCcpXHJcblx0XHQvL2NvbnNvbGUubG9nKCdwYXJlbnRzJywgcGFyZW50cylcclxuXHRcdGlmIChwYXJlbnRzLmxlbmd0aCAhPSAwKSB7XHJcblx0XHRcdHZhciBwYXJlbnQgPSBwYXJlbnRzLmVxKDApXHJcblx0XHRcdGl0ZW0ucGFyZW50ID0gcGFyZW50XHJcblx0XHRcdHRyZWUuZm9yRWFjaChmdW5jdGlvbihpKSB7XHJcblx0XHRcdFx0aWYgKGkuZWx0LmdldCgwKSA9PSBwYXJlbnQuZ2V0KDApKSB7XHJcblx0XHRcdFx0XHRpLmNoaWxkcy5wdXNoKGl0ZW0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRcclxuXHJcblx0XHR9XHJcblx0fSlcclxuXHQvL2NvbnNvbGUubG9nKCd0cmVlJywgdHJlZSlcclxuXHJcblx0dmFyIHJldCA9IFtdXHJcblx0dHJlZS5mb3JFYWNoKGZ1bmN0aW9uKGkpIHtcclxuXHRcdGlmIChpLnBhcmVudCA9PSBudWxsKSB7XHJcblx0XHRcdHJldC5wdXNoKGkpXHJcblx0XHR9XHJcblx0XHRpZiAoaS5jaGlsZHMubGVuZ3RoID09IDApIHtcclxuXHRcdFx0ZGVsZXRlIGkuY2hpbGRzXHJcblx0XHR9XHJcblx0XHRkZWxldGUgaS5wYXJlbnRcclxuXHRcdGRlbGV0ZSBpLmVsdFxyXG5cdH0pXHJcblxyXG5cdHJldHVybiBKU09OLnN0cmluZ2lmeShyZXQsIG51bGwsIDQpXHJcblxyXG59XHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKXtcclxuXHJcbnZhciByZWdpc3RlcmVkT2JqZWN0cyA9IHtcclxuXHRzZXJ2aWNlczoge31cclxufVxyXG5cclxudmFyIHtzZXJ2aWNlc30gPSByZWdpc3RlcmVkT2JqZWN0c1xyXG5cclxuZnVuY3Rpb24gaXNEZXBzT2soZGVwcykge1xyXG5cdHJldHVybiBkZXBzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcclxuXHJcblx0XHRyZXR1cm4gcHJldiAmJiAoY3VyICE9IHVuZGVmaW5lZClcclxuXHR9LCB0cnVlKVx0XHRcclxufVxyXG5cclxuJCQuZ2V0T2JqZWN0RG9tYWluID0gZnVuY3Rpb24oZG9tYWluKSB7XHJcblx0cmV0dXJuIHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl1cclxufVxyXG5cclxuJCQucmVnaXN0ZXJPYmplY3QgPSBmdW5jdGlvbihkb21haW4sIG5hbWUsIGFyZzEsIGFyZzIpIHtcclxuXHR2YXIgZGVwcyA9IFtdXHJcblx0dmFyIGZuID0gYXJnMVxyXG5cdGlmIChBcnJheS5pc0FycmF5KGFyZzEpKSB7XHJcblx0XHRkZXBzID0gYXJnMVxyXG5cdFx0Zm4gPSBhcmcyXHJcblx0fVxyXG5cdGlmICh0eXBlb2YgZG9tYWluICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBuYW1lICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBmbiA9PSAndW5kZWZpbmVkJyB8fCAhQXJyYXkuaXNBcnJheShkZXBzKSkge1xyXG5cdFx0dGhyb3coJ1tDb3JlXSByZWdpc3Rlck9iamVjdCBjYWxsZWQgd2l0aCBiYWQgYXJndW1lbnRzJylcclxuXHR9IFxyXG5cdGNvbnNvbGUubG9nKGBbQ29yZV0gcmVnaXN0ZXIgb2JqZWN0ICcke2RvbWFpbn06JHtuYW1lfScgd2l0aCBkZXBzYCwgZGVwcylcclxuXHRpZiAocmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl0gPSB7fVxyXG5cdH1cclxuXHRyZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dW25hbWVdID0ge2RlcHM6IGRlcHMsIGZuIDpmbiwgc3RhdHVzOiAnbm90bG9hZGVkJ31cclxufVx0XHJcblxyXG4kJC5nZXRPYmplY3QgPSBmdW5jdGlvbihkb21haW4sIG5hbWUpIHtcclxuXHQvL2NvbnNvbGUubG9nKGBbQ29yZV0gZ2V0T2JqZWN0ICR7ZG9tYWlufToke25hbWV9YClcclxuXHR2YXIgZG9tYWluID0gcmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXVxyXG5cdHZhciByZXQgPSBkb21haW4gJiYgZG9tYWluW25hbWVdXHJcblx0aWYgKHJldCAmJiByZXQuc3RhdHVzID09ICdub3Rsb2FkZWQnKSB7XHJcblx0XHRyZXQuZGVwcyA9ICQkLmdldFNlcnZpY2VzKHJldC5kZXBzKVxyXG5cdFx0cmV0LnN0YXR1cyA9IGlzRGVwc09rKHJldC5kZXBzKSA/ICdvaycgOiAna28nXHJcblx0fVxyXG5cdHJldHVybiByZXRcclxufVxyXG5cclxuJCQuZ2V0U2VydmljZXMgPSBmdW5jdGlvbihkZXBzKSB7XHJcblx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGdldFNlcnZpY2VzJywgZGVwcylcclxuXHRyZXR1cm4gZGVwcy5tYXAoZnVuY3Rpb24oZGVwTmFtZSkge1xyXG5cdFx0dmFyIHNydiA9IHNlcnZpY2VzW2RlcE5hbWVdXHJcblx0XHRpZiAoc3J2KSB7XHJcblx0XHRcdGlmIChzcnYuc3RhdHVzID09ICdub3Rsb2FkZWQnKSB7XHJcblx0XHRcdFx0dmFyIGRlcHMyID0gJCQuZ2V0U2VydmljZXMoc3J2LmRlcHMpXHJcblx0XHRcdFx0dmFyIGNvbmZpZyA9IHNydi5jb25maWcgfHwge31cclxuXHRcdFx0XHRjb25zb2xlLmxvZyhgW0NvcmVdIGluc3RhbmNlIHNlcnZpY2UgJyR7ZGVwTmFtZX0nIHdpdGggY29uZmlnYCwgY29uZmlnKVxyXG5cdFx0XHRcdHZhciBhcmdzID0gW2NvbmZpZ10uY29uY2F0KGRlcHMyKVxyXG5cdFx0XHRcdHNydi5vYmogPSBzcnYuZm4uYXBwbHkobnVsbCwgYXJncylcclxuXHRcdFx0XHRzcnYuc3RhdHVzID0gJ3JlYWR5J1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBzcnYub2JqXHRcdFx0XHRcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHQvL3Nydi5zdGF0dXMgPSAnbm90cmVnaXN0ZXJlZCdcclxuXHRcdFx0dGhyb3coYFtDb3JlXSBzZXJ2aWNlICcke2RlcE5hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcbn1cclxuXHJcblxyXG5cclxuJCQuY29uZmlndXJlU2VydmljZSA9IGZ1bmN0aW9uKG5hbWUsIGNvbmZpZykge1xyXG5cdGNvbnNvbGUubG9nKCdbQ29yZV0gY29uZmlndXJlU2VydmljZScsIG5hbWUsIGNvbmZpZylcclxuXHRpZiAodHlwZW9mIG5hbWUgIT0gJ3N0cmluZycgfHwgdHlwZW9mIGNvbmZpZyAhPSAnb2JqZWN0Jykge1xyXG5cdFx0Y29uc29sZS53YXJuKCdbQ29yZV0gY29uZmlndXJlU2VydmljZSBjYWxsZWQgd2l0aCBiYWQgYXJndW1lbnRzJylcclxuXHRcdHJldHVyblxyXG5cdH0gXHRcclxuXHJcblx0dmFyIHNydiA9IHNlcnZpY2VzW25hbWVdXHJcblx0aWYgKHNydikge1xyXG5cdFx0c3J2LmNvbmZpZyA9IGNvbmZpZ1xyXG5cdH1cclxuXHRlbHNlIHtcclxuXHRcdHRocm93KGBbY29uZmlndXJlU2VydmljZV0gc2VydmljZSAnJHtuYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxyXG5cdH1cclxuXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyU2VydmljZSA9IGZ1bmN0aW9uKG5hbWUsIGFyZzEsIGFyZzIpIHtcclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnc2VydmljZXMnLCBuYW1lLCBhcmcxLCBhcmcyKVxyXG59XHJcblxyXG4kJC5nZXRSZWdpc3RlcmVkU2VydmljZXMgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgcmV0ID0gW11cclxuXHRmb3IodmFyIGsgaW4gc2VydmljZXMpIHtcclxuXHRcdHZhciBpbmZvID0gc2VydmljZXNba11cclxuXHRcdHJldC5wdXNoKHtuYW1lOiBrLCBzdGF0dXM6IGluZm8uc3RhdHVzfSlcclxuXHR9XHJcblx0cmV0dXJuIHJldFxyXG59XHJcblxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4ucHJvY2Vzc0JpbmRpbmdzID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0dmFyIGRhdGEgPSB7fVxyXG5cclxuXHRcdHRoaXMuYm5GaW5kKCdibi1iaW5kJywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHRkYXRhW3Zhck5hbWVdID0gZWx0XHJcblx0XHR9KVxyXG5cdFx0dGhpcy5ibkZpbmQoJ2JuLWlmYWNlJywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHRkYXRhW3Zhck5hbWVdID0gZWx0LmludGVyZmFjZSgpXHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIGRhdGFcclxuXHRcclxuXHR9XHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHRcclxuXHJcblx0JC5mbi5nZXRPcHRpb25zID0gZnVuY3Rpb24oZGVmYXVsdFZhbHVlcykge1xyXG5cclxuXHRcdHZhciB2YWx1ZXMgPSBkZWZhdWx0VmFsdWVzIHx8IHt9XHJcblxyXG5cdFx0dmFyIG9wdGlvbnMgPSB0aGlzLmRhdGEoJyRvcHRpb25zJylcclxuXHRcdGlmICh0eXBlb2Ygb3B0aW9ucyAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRvcHRpb25zID0ge31cclxuXHRcdH1cdFxyXG5cclxuXHRcdHZhciBwYXJhbXNWYWx1ZSA9IHt9XHJcblx0XHRmb3IodmFyIGsgaW4gdmFsdWVzKSB7XHJcblx0XHRcdHBhcmFtc1ZhbHVlW2tdID0gdGhpcy5kYXRhKGspXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuICQuZXh0ZW5kKHZhbHVlcywgb3B0aW9ucywgcGFyYW1zVmFsdWUpXHJcblx0XHRcdFxyXG5cdH1cclxuXHJcblx0JC5mbi5nZXRQYXJlbnRJbnRlcmZhY2UgPSBmdW5jdGlvbihwYXJlbnRDdHJsTmFtZSkge1xyXG5cdFx0dmFyIHBhcmVudCA9IHRoaXMucGFyZW50KClcclxuXHRcdGlmICghcGFyZW50Lmhhc0NsYXNzKHBhcmVudEN0cmxOYW1lKSkge1xyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdHJldHVybiBwYXJlbnQuaW50ZXJmYWNlKClcdFx0XHJcblx0fVxyXG5cclxuXHQkLmZuLnByb2Nlc3NDb250cm9scyA9IGZ1bmN0aW9uKCBkYXRhKSB7XHJcblxyXG5cdFx0ZGF0YSA9IGRhdGEgfHwge31cclxuXHJcblx0XHR0aGlzLmJuRmlsdGVyKCdbYm4tY29udHJvbF0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxyXG5cclxuXHRcdFx0dmFyIGNvbnRyb2xOYW1lID0gZWx0LmF0dHIoJ2JuLWNvbnRyb2wnKVxyXG5cdFx0XHRlbHQucmVtb3ZlQXR0cignYm4tY29udHJvbCcpXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2NvbnRyb2xOYW1lJywgY29udHJvbE5hbWUpXHJcblxyXG5cclxuXHJcblx0XHRcdCQkLmNyZWF0ZUNvbnRyb2woY29udHJvbE5hbWUsIGVsdClcclxuXHRcdH0pXHJcblxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHJcblx0fVx0XHJcblxyXG5cdCQuZm4uaW50ZXJmYWNlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gKHRoaXMubGVuZ3RoID09IDApID8gbnVsbCA6IHRoaXMuZ2V0KDApLmN0cmxcclxuXHR9XHJcblxyXG5cdCQuZm4uZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Y29uc29sZS5sb2coJ1tDb3JlXSBkaXNwb3NlJylcclxuXHRcdHRoaXMuZmluZCgnLkN1c3RvbUNvbnRyb2wnKS5lYWNoKGZ1bmN0aW9uKCkge1x0XHRcclxuXHRcdFx0dmFyIGlmYWNlID0gJCh0aGlzKS5pbnRlcmZhY2UoKVxyXG5cdFx0XHRpZiAodHlwZW9mIGlmYWNlID09ICdvYmplY3QnICYmIHR5cGVvZiBpZmFjZS5kaXNwb3NlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRpZmFjZS5kaXNwb3NlKClcclxuXHRcdFx0fVxyXG5cdFx0XHRkZWxldGUgJCh0aGlzKS5nZXQoMCkuY3RybFxyXG5cdFx0fSlcclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4ucHJvY2Vzc0V2ZW50cyA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ3Byb2Nlc3NFdmVudHMnLCBkYXRhKVxyXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFtjb3JlXSBwcm9jZXNzRXZlbnRzIGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblx0XHR0aGlzLmJuRmluZEV4KCdibi1ldmVudCcsIHRydWUsIGZ1bmN0aW9uKGVsdCwgYXR0ck5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tZXZlbnQnLCBhdHRyTmFtZSwgdmFyTmFtZSlcclxuXHRcdFx0dmFyIGYgPSBhdHRyTmFtZS5zcGxpdCgnLicpXHJcblx0XHRcdHZhciBldmVudE5hbWUgPSBmWzBdXHJcblx0XHRcdHZhciBzZWxlY3RvciA9IGZbMV1cclxuXHJcblx0XHRcdHZhciBmbiA9IGRhdGFbdmFyTmFtZV1cclxuXHRcdFx0aWYgKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0dmFyIGlmYWNlID0gZWx0LmludGVyZmFjZSgpXHJcblx0XHRcdFx0aWYgKGlmYWNlICYmIHR5cGVvZiBpZmFjZS5vbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRpZmFjZS5vbihldmVudE5hbWUsIGZuLmJpbmQoaWZhY2UpKVxyXG5cdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR2YXIgdXNlTmF0aXZlRXZlbnRzID0gWydtb3VzZWVudGVyJywgJ21vdXNlbGVhdmUnXS5pbmRleE9mKGV2ZW50TmFtZSkgIT0gLTFcclxuXHJcblx0XHRcdFx0aWYgKHNlbGVjdG9yICE9IHVuZGVmaW5lZCkge1xyXG5cclxuXHRcdFx0XHRcdGlmICh1c2VOYXRpdmVFdmVudHMpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LmdldCgwKS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gJChldi50YXJnZXQpXHJcblx0XHRcdFx0XHRcdFx0aWYgKHRhcmdldC5oYXNDbGFzcyhzZWxlY3RvcikpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGZuLmNhbGwoZXYudGFyZ2V0LCBldilcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRlbHQub24oZXZlbnROYW1lLCAnLicgKyBzZWxlY3RvciwgZm4pXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGlmICh1c2VOYXRpdmVFdmVudHMpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LmdldCgwKS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGZuLmNhbGwoZXYudGFyZ2V0LCBldilcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0ZWx0Lm9uKGV2ZW50TmFtZSwgZm4pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc0V2ZW50czogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhIGZ1bmN0aW9uIGRlZmluZWQgaW4gZGF0YWAsIGRhdGEpXHJcblx0XHRcdH1cdFx0XHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHRcclxuXHR9XHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHR5cGUgPSB0aGlzLmF0dHIoJ3R5cGUnKVxyXG5cdFx0aWYgKHRoaXMuZ2V0KDApLnRhZ05hbWUgPT0gJ0lOUFVUJyAmJiB0eXBlID09ICdjaGVja2JveCcpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucHJvcCgnY2hlY2tlZCcpXHJcblx0XHR9XHJcblx0XHR2YXIgaWZhY2UgPSB0aGlzLmludGVyZmFjZSgpXHJcblx0XHRpZiAoaWZhY2UgJiYgdHlwZW9mIGlmYWNlLmdldFZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0cmV0dXJuIGlmYWNlLmdldFZhbHVlKClcclxuXHRcdH1cclxuXHRcdHZhciByZXQgPSB0aGlzLnZhbCgpXHJcblxyXG5cdFx0aWYgKHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAncmFuZ2UnKSB7XHJcblx0XHRcdHJldCA9IHBhcnNlRmxvYXQocmV0KVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHJldFxyXG5cdH1cclxuXHJcblxyXG5cdCQuZm4uc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0aWYgKHRoaXMuZ2V0KDApLnRhZ05hbWUgPT0gJ0lOUFVUJyAmJiB0aGlzLmF0dHIoJ3R5cGUnKSA9PSAnY2hlY2tib3gnKSB7XHJcblx0XHRcdHRoaXMucHJvcCgnY2hlY2tlZCcsIHZhbHVlKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgaWZhY2UgPSB0aGlzLmludGVyZmFjZSgpXHJcblx0XHRpZiAoaWZhY2UgJiYgdHlwZW9mIGlmYWNlLnNldFZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0aWZhY2Uuc2V0VmFsdWUodmFsdWUpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy52YWwodmFsdWUpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblxyXG5cdCQuZm4uZ2V0Rm9ybURhdGEgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciByZXQgPSB7fVxyXG5cdFx0dGhpcy5maW5kKCdbbmFtZV0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxyXG5cdFx0XHR2YXIgbmFtZSA9IGVsdC5hdHRyKCduYW1lJylcclxuXHRcdFx0cmV0W25hbWVdID0gZWx0LmdldFZhbHVlKClcclxuXHJcblx0XHR9KVxyXG5cclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cdCQuZm4uc2V0Rm9ybURhdGEgPSBmdW5jdGlvbihkYXRhKSB7XHJcblxyXG5cdFx0Zm9yKHZhciBuYW1lIGluIGRhdGEpIHtcclxuXHRcdFx0dmFyIGVsdCA9IHRoaXMuZmluZChgW25hbWU9JHtuYW1lfV1gKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW25hbWVdXHJcblx0XHRcdGVsdC5zZXRWYWx1ZSh2YWx1ZSlcclxuXHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxuXHQkLmZuLnByb2Nlc3NGb3JtRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0Zvcm1EYXRhIGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmJuRmluZCgnYm4tZm9ybScsIGZhbHNlLCBmdW5jdGlvbihlbHQsIHZhck5hbWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXHJcblx0XHRcdHZhciB2YWx1ZSA9IGRhdGFbdmFyTmFtZV1cclxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jykge1xyXG5cdFx0XHRcdGVsdC5zZXRGb3JtRGF0YSh2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBwcm9jZXNzRm9ybURhdGE6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gb2JqZWN0IGRlZmluZWQgaW4gZGF0YWAsIGRhdGEpXHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHRcclxuXHR9XHJcblxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHQkLmZuLnByb2Nlc3NDb250ZXh0TWVudSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0NvbnRleHRNZW51IGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmJuRmluZCgnYm4tbWVudScsIHRydWUsIGZ1bmN0aW9uKGVsdCwgdmFyTmFtZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibi10ZXh0JywgdmFyTmFtZSlcclxuXHRcdFx0dmFyIHZhbHVlID0gZGF0YVt2YXJOYW1lXVxyXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnKSB7XHJcblx0XHRcdFx0dmFyIGlkID0gZWx0LnVuaXF1ZUlkKCkuYXR0cignaWQnKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbcHJvY2Vzc0NvbnRleHRNZW51XSBpZCcsIGlkKVxyXG5cdFx0XHRcdCQuY29udGV4dE1lbnUoe1xyXG5cdFx0XHRcdFx0c2VsZWN0b3I6ICcjJyArIGlkLFxyXG5cdFx0XHRcdFx0Y2FsbGJhY2s6IGZ1bmN0aW9uKGtleSkge1xyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbcHJvY2Vzc0NvbnRleHRNZW51XSBjYWxsYmFjaycsIGtleSlcclxuXHRcdFx0XHRcdFx0ZWx0LnRyaWdnZXIoJ21lbnVDaGFuZ2UnLCBba2V5XSlcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRpdGVtczogdmFsdWVcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NDb250ZXh0TWVudTogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBvYmplY3QgZGVmaW5lZCBpbiBkYXRhYCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdFxyXG5cdH1cclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0ZnVuY3Rpb24gc3BsaXRBdHRyKGF0dHJWYWx1ZSwgY2JrKSB7XHJcblx0XHRhdHRyVmFsdWUuc3BsaXQoJywnKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHRcdFx0dmFyIGxpc3QgPSBpdGVtLnNwbGl0KCc6JylcclxuXHRcdFx0aWYgKGxpc3QubGVuZ3RoID09IDIpIHtcclxuXHRcdFx0XHR2YXIgbmFtZSA9IGxpc3RbMF0udHJpbSgpXHJcblx0XHRcdFx0dmFyIHZhbHVlID0gbGlzdFsxXS50cmltKClcclxuXHRcdFx0XHRjYmsobmFtZSwgdmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS5lcnJvcihgW0NvcmVdIHNwbGl0QXR0cigke2F0dHJOYW1lfSkgJ2F0dHJWYWx1ZScgbm90IGNvcnJlY3Q6YCwgaXRlbSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRWYXJWYWx1ZSh2YXJOYW1lLCBkYXRhKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdnZXRWYXJWYWx1ZScsIHZhck5hbWUsIGRhdGEpXHJcblx0XHR2YXIgcmV0ID0gZGF0YVxyXG5cdFx0Zm9yKGxldCBmIG9mIHZhck5hbWUuc3BsaXQoJy4nKSkge1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKHR5cGVvZiByZXQgPT0gJ29iamVjdCcgJiYgZiBpbiByZXQpIHtcclxuXHRcdFx0XHRyZXQgPSByZXRbZl1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUud2FybihgW0NvcmVdIGdldFZhclZhbHVlOiBhdHRyaWJ1dCAnJHt2YXJOYW1lfScgaXMgbm90IGluIG9iamVjdDpgLCBkYXRhKVxyXG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWRcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnZicsIGYsICdyZXQnLCByZXQpXHJcblx0XHR9XHJcblx0XHQvL2NvbnNvbGUubG9nKCdyZXQnLCByZXQpXHJcblx0XHRyZXR1cm4gcmV0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZuKSB7XHJcblxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGdldFZhbHVlJywgdmFyTmFtZSwgY3R4KVxyXG5cclxuXHRcdHZhciBub3QgPSBmYWxzZVxyXG5cdFx0aWYgKHZhck5hbWUuc3RhcnRzV2l0aCgnIScpKSB7XHJcblx0XHRcdHZhck5hbWUgPSB2YXJOYW1lLnN1YnN0cigxKVxyXG5cdFx0XHRub3QgPSB0cnVlXHJcblx0XHR9XHRcdFx0XHJcblxyXG5cdFx0dmFyIHByZWZpeE5hbWUgPSB2YXJOYW1lLnNwbGl0KCcuJylbMF1cclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBwcmVmaXhOYW1lJywgcHJlZml4TmFtZSlcclxuXHRcdGlmIChjdHgudmFyc1RvVXBkYXRlICYmIGN0eC52YXJzVG9VcGRhdGUuaW5kZXhPZihwcmVmaXhOYW1lKSA8IDApIHtcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGZ1bmMgPSBjdHguZGF0YVt2YXJOYW1lXVxyXG5cdFx0dmFyIHZhbHVlXHJcblxyXG5cdFx0aWYgKHR5cGVvZiBmdW5jID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0dmFsdWUgPSBmdW5jLmNhbGwoY3R4LmRhdGEpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dmFsdWUgPSBnZXRWYXJWYWx1ZSh2YXJOYW1lLCBjdHguZGF0YSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdC8vY29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc1RlbXBsYXRlOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGRlZmluZWQgaW4gb2JqZWN0IGRhdGE6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblx0XHQvL2NvbnNvbGUubG9nKCd2YWx1ZScsIHZhbHVlKVxyXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicgJiYgbm90KSB7XHJcblx0XHRcdHZhbHVlID0gIXZhbHVlXHJcblx0XHR9XHJcblx0XHRmbih2YWx1ZSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuSWYoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG5cdFx0XHRcdGN0eC5lbHQucmVtb3ZlKClcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBiblNob3coY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuXHRcdFx0XHRjdHguZWx0LmJuVmlzaWJsZSh2YWx1ZSlcclxuXHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGJuLXNob3c6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gYm9vbGVhbmAsIGRhdGEpXHJcblx0XHRcdH1cclxuXHRcdH0pXHRcdFxyXG5cdH1cclxuXHJcblxyXG5cdGZ1bmN0aW9uIGJuRWFjaChjdHgpIHtcclxuXHRcdHZhciBmID0gY3R4LmRpclZhbHVlLnNwbGl0KCcgJylcclxuXHRcdGlmIChmLmxlbmd0aCAhPSAzIHx8IGZbMV0gIT0gJ29mJykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKCdbQ29yZV0gYm4tZWFjaCBjYWxsZWQgd2l0aCBiYWQgYXJndW1lbnRzOicsIGRpclZhbHVlKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdHZhciBpdGVyID0gZlswXVxyXG5cdFx0dmFyIHZhck5hbWUgPSBmWzJdXHJcblx0XHQvL2NvbnNvbGUubG9nKCdibi1lYWNoIGl0ZXInLCBpdGVyLCAgY3R4LnRlbXBsYXRlKVxyXG5cdFx0XHJcblx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cclxuXHRcdFx0XHRjdHguZWx0LmVtcHR5KClcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR2YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHRcdFx0XHRcdHZhciBpdGVtRGF0YSA9ICQuZXh0ZW5kKHt9LCBjdHguZGF0YSlcclxuXHRcdFx0XHRcdGl0ZW1EYXRhW2l0ZXJdID0gaXRlbVxyXG5cdFx0XHRcdFx0Ly92YXIgJGl0ZW0gPSAkKGN0eC50ZW1wbGF0ZSlcclxuXHRcdFx0XHRcdHZhciAkaXRlbSA9IGN0eC50ZW1wbGF0ZS5jbG9uZSgpXHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnJGl0ZW0nLCAkaXRlbS5nZXQoMCkub3V0ZXJIVE1MKVxyXG5cdFx0XHRcdFx0JGl0ZW0ucHJvY2Vzc1VJKGl0ZW1EYXRhKVxyXG5cdFx0XHRcdFx0Y3R4LmVsdC5hcHBlbmQoJGl0ZW0pXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVx0XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGJuLWVhY2g6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gYXJyYXlgLCBkYXRhKVxyXG5cdFx0XHR9XHRcdFx0XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5UZXh0KGN0eCkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGJuVGV4dCcsIGN0eClcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHguZWx0LnRleHQodmFsdWUpXHJcblx0XHR9KVxyXG5cdH1cclxuXHRcclxuXHRmdW5jdGlvbiBibkh0bWwoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5odG1sKHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuQ29tYm8oY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5pbml0Q29tYm8odmFsdWUpXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5PcHRpb25zKGN0eCkge1xyXG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGN0eC5lbHQuZGF0YSgnJG9wdGlvbnMnLCB2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5WYWwoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5zZXRWYWx1ZSh2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5Qcm9wKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24ocHJvcE5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XHJcblx0XHRcdFx0XHRjdHguZWx0LnByb3AocHJvcE5hbWUsIHZhbHVlKVxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tcHJvcDogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBib29sZWFuYCwgZGF0YSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHRcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBibkF0dHIoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihhdHRyTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0Y3R4LmVsdC5hdHRyKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBiblN0eWxlKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGN0eC5lbHQuY3NzKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5EYXRhKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGN0eC5lbHQuc2V0UHJvcChhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblxyXG5cdGZ1bmN0aW9uIGJuQ2xhc3MoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihwcm9wTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuXHRcdFx0XHRcdGlmICh2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRjdHguZWx0LmFkZENsYXNzKHByb3BOYW1lKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdGN0eC5lbHQucmVtb3ZlQ2xhc3MocHJvcE5hbWUpXHJcblx0XHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGJuLWNsYXNzOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGJvb2xlYW5gLCBkYXRhKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcdFxyXG5cdFx0fSlcclxuXHR9XHRcclxuXHJcblxyXG5cdHZhciBkaXJNYXAgPSB7XHJcblx0XHQnYm4tZWFjaCc6IGJuRWFjaCxcdFx0XHRcclxuXHRcdCdibi1pZic6IGJuSWYsXHJcblx0XHQnYm4tdGV4dCc6IGJuVGV4dCxcdFxyXG5cdFx0J2JuLWh0bWwnOiBibkh0bWwsXHJcblx0XHQnYm4tb3B0aW9ucyc6IGJuT3B0aW9ucyxcdFx0XHRcclxuXHRcdCdibi1saXN0JzogYm5Db21ibyxcdFx0XHRcclxuXHRcdCdibi12YWwnOiBiblZhbCxcdFxyXG5cdFx0J2JuLXByb3AnOiBiblByb3AsXHJcblx0XHQnYm4tYXR0cic6IGJuQXR0cixcdFxyXG5cdFx0J2JuLWRhdGEnOiBibkRhdGEsXHRcdFx0XHJcblx0XHQnYm4tY2xhc3MnOiBibkNsYXNzLFxyXG5cdFx0J2JuLXNob3cnOiBiblNob3csXHJcblx0XHQnYm4tc3R5bGUnOiBiblN0eWxlXHJcblx0fVxyXG5cclxuXHQkLmZuLnNldFByb3AgPSBmdW5jdGlvbihhdHRyTmFtZSwgdmFsdWUpIHtcclxuXHRcdHZhciBpZmFjZSA9IHRoaXMuaW50ZXJmYWNlKClcclxuXHRcdGlmIChpZmFjZSAmJiBpZmFjZS5zZXRQcm9wKSB7XHJcblx0XHRcdGlmYWNlLnNldFByb3AoYXR0ck5hbWUsIHZhbHVlKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRoaXMuZGF0YShhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHR9XHJcblxyXG5cclxuXHJcblx0JC5mbi5wcm9jZXNzVGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gcHJvY2Vzc1RlbXBsYXRlJylcclxuXHRcdHZhciB0aGF0ID0gdGhpc1xyXG5cclxuXHRcdHZhciBkaXJMaXN0ID0gW11cclxuXHJcblx0XHRmb3IobGV0IGsgaW4gZGlyTWFwKSB7XHJcblx0XHRcdHRoaXMuYm5GaW5kKGssIHRydWUsIGZ1bmN0aW9uKGVsdCwgZGlyVmFsdWUpIHtcclxuXHRcdFx0XHR2YXIgdGVtcGxhdGVcclxuXHRcdFx0XHRpZiAoayA9PSAnYm4tZWFjaCcpIHtcclxuXHRcdFx0XHRcdHRlbXBsYXRlID0gZWx0LmNoaWxkcmVuKCkucmVtb3ZlKCkuY2xvbmUoKS8vLmdldCgwKS5vdXRlckhUTUxcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3RlbXBsYXRlJywgdGVtcGxhdGUpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChrID09ICdibi12YWwnKSB7XHJcblx0XHRcdFx0XHRlbHQuZGF0YSgnJHZhbCcsIGRpclZhbHVlKVxyXG5cdFx0XHRcdFx0dmFyIHVwZGF0ZUV2ZW50ID0gZWx0LmF0dHIoJ2JuLXVwZGF0ZScpXHJcblx0XHRcdFx0XHRpZiAodXBkYXRlRXZlbnQgIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRcdGVsdC5yZW1vdmVBdHRyKCdibi11cGRhdGUnKVxyXG5cdFx0XHRcdFx0XHRlbHQub24odXBkYXRlRXZlbnQsIGZ1bmN0aW9uKGV2LCB1aSkge1xyXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3VpJywgdWkpXHJcblxyXG5cdFx0XHRcdFx0XHRcdHZhciB2YWx1ZSA9ICh1aSAmJiAgdWkudmFsdWUpIHx8ICAkKHRoaXMpLmdldFZhbHVlKClcclxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd2YWx1ZScsIHZhbHVlKVxyXG5cdFx0XHRcdFx0XHRcdHRoYXQudHJpZ2dlcignZGF0YTp1cGRhdGUnLCBbZGlyVmFsdWUsIHZhbHVlLCBlbHRdKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0ZGlyTGlzdC5wdXNoKHtkaXJlY3RpdmU6IGssIGVsdDogZWx0LCBkaXJWYWx1ZTogZGlyVmFsdWUsIHRlbXBsYXRlOiB0ZW1wbGF0ZX0pXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRhdGEpIHtcclxuXHRcdFx0dGhpcy51cGRhdGVUZW1wbGF0ZShkaXJMaXN0LCBkYXRhKVxyXG5cdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0cmV0dXJuIGRpckxpc3RcclxuXHJcblx0fVx0XHJcblxyXG5cdCQuZm4udXBkYXRlVGVtcGxhdGUgPSBmdW5jdGlvbihkaXJMaXN0LCBkYXRhLCB2YXJzVG9VcGRhdGUsIGV4Y2x1ZGVFbHQpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1tjb3JlXSB1cGRhdGVUZW1wbGF0ZScsIGRhdGEsIHZhcnNUb1VwZGF0ZSlcclxuXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2RhdGEnLCBkYXRhKVxyXG5cdFx0dmFyc1RvVXBkYXRlID0gdmFyc1RvVXBkYXRlIHx8IE9iamVjdC5rZXlzKGRhdGEpXHJcblx0XHQvL2NvbnNvbGUubG9nKCd2YXJzVG9VcGRhdGUnLCB2YXJzVG9VcGRhdGUpXHJcblxyXG5cdFx0ZGlyTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGRpckl0ZW0pIHtcclxuXHRcdFx0dmFyIGZuID0gZGlyTWFwW2Rpckl0ZW0uZGlyZWN0aXZlXVxyXG5cdFx0XHRpZiAodHlwZW9mIGZuID09ICdmdW5jdGlvbicgJiYgZGlySXRlbS5lbHQgIT0gZXhjbHVkZUVsdCkge1xyXG5cdFx0XHRcdGRpckl0ZW0uZGF0YSA9IGRhdGE7XHJcblx0XHRcdFx0ZGlySXRlbS52YXJzVG9VcGRhdGUgPSB2YXJzVG9VcGRhdGU7XHJcblx0XHRcdFx0Zm4oZGlySXRlbSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHRcclxuXHRcdFxyXG5cclxuXHRcdFxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHJcblx0fVx0XHJcblxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4ucHJvY2Vzc1VJID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygncHJvY2Vzc1VJJywgZGF0YSwgdGhpcy5odG1sKCkpXHJcblx0XHR2YXIgZGlyTGlzdCA9IHRoaXMucHJvY2Vzc1RlbXBsYXRlKGRhdGEpXHJcblx0XHR0aGlzLnByb2Nlc3NDb250cm9scyhkYXRhKVxyXG5cdFx0LnByb2Nlc3NGb3JtRGF0YShkYXRhKVxyXG5cdFx0LnByb2Nlc3NDb250ZXh0TWVudShkYXRhKVxyXG5cdFx0cmV0dXJuIGRpckxpc3RcclxuXHR9XHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5ibkZpbHRlciA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5maW5kKHNlbGVjdG9yKS5hZGQodGhpcy5maWx0ZXIoc2VsZWN0b3IpKVxyXG5cdH1cclxuXHJcblx0JC5mbi5ibkZpbmQgPSBmdW5jdGlvbihhdHRyTmFtZSwgcmVtb3ZlQXR0ciwgY2JrKSB7XHJcblx0XHR0aGlzLmJuRmlsdGVyKGBbJHthdHRyTmFtZX1dYCkuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGVsdCA9ICQodGhpcylcclxuXHRcdFx0dmFyIGF0dHJWYWx1ZSA9IGVsdC5hdHRyKGF0dHJOYW1lKVxyXG5cdFx0XHRpZiAocmVtb3ZlQXR0cikge1xyXG5cdFx0XHRcdGVsdC5yZW1vdmVBdHRyKGF0dHJOYW1lKVxyXG5cdFx0XHR9XHRcdFxyXG5cdFx0XHRjYmsoZWx0LCBhdHRyVmFsdWUpXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0JC5mbi5ibkZpbmRFeCA9IGZ1bmN0aW9uKGF0dHJOYW1lLCByZW1vdmVBdHRyLCBjYmspIHtcclxuXHRcdHRoaXMuYm5GaW5kKGF0dHJOYW1lLCByZW1vdmVBdHRyLCBmdW5jdGlvbihlbHQsIGF0dHJWYWx1ZSkge1xyXG5cdFx0XHRhdHRyVmFsdWUuc3BsaXQoJywnKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHRcdFx0XHR2YXIgbGlzdCA9IGl0ZW0uc3BsaXQoJzonKVxyXG5cdFx0XHRcdGlmIChsaXN0Lmxlbmd0aCA9PSAyKSB7XHJcblx0XHRcdFx0XHR2YXIgbmFtZSA9IGxpc3RbMF0udHJpbSgpXHJcblx0XHRcdFx0XHR2YXIgdmFsdWUgPSBsaXN0WzFdLnRyaW0oKVxyXG5cdFx0XHRcdFx0Y2JrKGVsdCwgbmFtZSwgdmFsdWUpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihgW0NvcmVdIGJuRmluZEV4KCR7YXR0ck5hbWV9KSAnYXR0clZhbHVlJyBub3QgY29ycmVjdDpgLCBpdGVtKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHQkLmZuLmJuVmlzaWJsZSA9IGZ1bmN0aW9uKGlzVmlzaWJsZSkge1xyXG5cdFx0aWYgKGlzVmlzaWJsZSkge1xyXG5cdFx0XHR0aGlzLnNob3coKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRoaXMuaGlkZSgpXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpc1x0XHJcblx0fVxyXG5cclxuXHQkLmZuLmluaXRDb21ibyA9IGZ1bmN0aW9uKHZhbHVlcykge1xyXG5cdFx0dGhpc1xyXG5cdFx0LmVtcHR5KClcclxuXHRcdC5hcHBlbmQodmFsdWVzLm1hcChmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRyZXR1cm4gYDxvcHRpb24gdmFsdWU9JHt2YWx1ZX0+JHt2YWx1ZX08L29wdGlvbj5gXHJcblx0XHR9KSlcclxuXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdH1cclxuXHJcblxyXG59KSgpO1xyXG4iLCIkJC5zaG93QWxlcnQgPSBmdW5jdGlvbih0ZXh0LCB0aXRsZSwgY2FsbGJhY2spIHtcclxuXHR0aXRsZSA9IHRpdGxlIHx8ICdJbmZvcm1hdGlvbidcclxuXHQkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxyXG5cdFx0LmFwcGVuZCgkKCc8cD4nKS5odG1sKHRleHQpKVxyXG5cdFx0LmRpYWxvZyh7XHJcblx0XHRcdGNsYXNzZXM6IHtcclxuXHRcdFx0XHQndWktZGlhbG9nLXRpdGxlYmFyLWNsb3NlJzogJ25vLWNsb3NlJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR3aWR0aDogJ2F1dG8nLFxyXG5cdFx0XHRtb2RhbDogdHJ1ZSxcclxuXHRcdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdkZXN0cm95JylcclxuXHRcdFx0fSxcclxuXHRcdFx0YnV0dG9uczogW1xyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRleHQ6ICdDbG9zZScsXHJcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKClcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XVxyXG5cdFx0fSlcclxufTtcdFxyXG5cclxuIiwiJCQuc2hvd0NvbmZpcm0gPSBmdW5jdGlvbih0ZXh0LCB0aXRsZSwgY2FsbGJhY2spIHtcclxuXHR0aXRsZSA9IHRpdGxlIHx8ICdJbmZvcm1hdGlvbidcclxuXHQkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxyXG5cdFx0LmFwcGVuZCgkKCc8cD4nKS5odG1sKHRleHQpKVxyXG5cdFx0LmRpYWxvZyh7XHJcblxyXG5cdFx0XHRtb2RhbDogdHJ1ZSxcclxuXHJcblx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnZGVzdHJveScpXHJcblx0XHRcdH0sXHJcblx0XHRcdGJ1dHRvbnM6IFtcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnQ2FuY2VsJyxcclxuXHRcdFx0XHRcdC8vY2xhc3M6ICd3My1idXR0b24gdzMtcmVkIGJuLW5vLWNvcm5lcicsXHJcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0dGV4dDogJ09LJyxcclxuXHRcdFx0XHRcdC8vY2xhc3M6ICd3My1idXR0b24gdzMtYmx1ZSBibi1uby1jb3JuZXInLFxyXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0XHRjYWxsYmFjaygpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHRcdFx0XHRcdFxyXG5cdFx0XHRdXHJcblx0XHR9KVxyXG59O1xyXG5cdFxyXG5cclxuIiwiJCQuc2hvd1BpY3R1cmUgPSBmdW5jdGlvbih0aXRsZSwgcGljdHVyZVVybCkge1xyXG5cdCQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblx0XHQuYXBwZW5kKCQoJzxkaXY+Jywge2NsYXNzOiAnYm4tZmxleC1jb2wgYm4tYWxpZ24tY2VudGVyJ30pXHJcblx0XHRcdC5hcHBlbmQoJCgnPGltZz4nLCB7c3JjOiBwaWN0dXJlVXJsfSkpXHJcblx0XHQpXHJcblx0XHQuZGlhbG9nKHtcclxuXHJcblx0XHRcdG1vZGFsOiB0cnVlLFxyXG5cdFx0XHR3aWR0aDogJ2F1dG8nLFxyXG5cdFx0XHRtYXhIZWlnaHQ6IDYwMCxcclxuXHRcdFx0bWF4V2lkdGg6IDYwMCxcclxuXHRcdFx0Ly9wb3NpdGlvbjoge215OiAnY2VudGVyIGNlbnRlcicsIGF0OiAnY2VudGVyIGNlbnRlcid9LFxyXG5cclxuXHRcdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdkZXN0cm95JylcclxuXHRcdFx0fVxyXG5cclxuXHRcdH0pXHJcbn07XHJcblxyXG5cclxuXHJcbiIsIiQkLnNob3dQcm9tcHQgPSBmdW5jdGlvbihsYWJlbCwgdGl0bGUsIGNhbGxiYWNrLCBvcHRpb25zKSB7XHJcblx0dGl0bGUgPSB0aXRsZSB8fCAnSW5mb3JtYXRpb24nXHJcblx0b3B0aW9ucyA9ICQuZXh0ZW5kKHt0eXBlOiAndGV4dCd9LCBvcHRpb25zKVxyXG5cdC8vY29uc29sZS5sb2coJ29wdGlvbnMnLCBvcHRpb25zKVxyXG5cclxuXHR2YXIgZGl2ID0gJCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHRcdC5hcHBlbmQoJCgnPGZvcm0+JylcclxuXHRcdFx0LmFwcGVuZCgkKCc8cD4nKS50ZXh0KGxhYmVsKSlcclxuXHRcdFx0LmFwcGVuZCgkKCc8aW5wdXQ+Jywge2NsYXNzOiAndmFsdWUnfSkuYXR0cihvcHRpb25zKS5wcm9wKCdyZXF1aXJlZCcsIHRydWUpLmNzcygnd2lkdGgnLCAnMTAwJScpKVxyXG5cdFx0XHQuYXBwZW5kKCQoJzxpbnB1dD4nLCB7dHlwZTogJ3N1Ym1pdCd9KS5oaWRlKCkpXHJcblx0XHRcdC5vbignc3VibWl0JywgZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRcdFx0ZGl2LmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0dmFyIHZhbCA9IGRpdi5maW5kKCcudmFsdWUnKS52YWwoKVxyXG5cdFx0XHRcdFx0Y2FsbGJhY2sodmFsKVxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHR9KVxyXG5cdFx0KVxyXG5cdFx0LmRpYWxvZyh7XHJcblx0XHRcdGNsYXNzZXM6IHtcclxuXHRcdFx0XHQndWktZGlhbG9nLXRpdGxlYmFyLWNsb3NlJzogJ25vLWNsb3NlJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRtb2RhbDogdHJ1ZSxcclxuXHRcdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdkZXN0cm95JylcclxuXHRcdFx0fSxcclxuXHRcdFx0YnV0dG9uczogW1xyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRleHQ6ICdDYW5jZWwnLFxyXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0dGV4dDogJ0FwcGx5JyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5maW5kKCdbdHlwZT1zdWJtaXRdJykuY2xpY2soKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XVxyXG5cdFx0fSlcclxufTtcclxuXHJcbiIsIihmdW5jdGlvbigpe1xyXG5cclxuXHRcclxuXHRmdW5jdGlvbiBpc09iamVjdChhKSB7XHJcblx0XHRyZXR1cm4gKHR5cGVvZiBhID09ICdvYmplY3QnKSAmJiAhQXJyYXkuaXNBcnJheShhKVxyXG5cdH1cclxuXHJcblx0JCQuY2hlY2tUeXBlID0gZnVuY3Rpb24odmFsdWUsIHR5cGUsIGlzT3B0aW9uYWwpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ2NoZWNrVHlwZScsdmFsdWUsIHR5cGUsIGlzT3B0aW9uYWwpXHJcblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICd1bmRlZmluZWQnICYmIGlzT3B0aW9uYWwgPT09IHRydWUpIHtcclxuXHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodHlwZW9mIHR5cGUgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSB0eXBlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcblx0XHRcdGlmICghQXJyYXkuaXNBcnJheSh0eXBlKSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAodHlwZS5sZW5ndGggPT0gMCkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlIC8vIG5vIGl0ZW0gdHlwZSBjaGVja2luZ1xyXG5cdFx0XHR9XHJcblx0XHRcdGZvcihsZXQgaSBvZiB2YWx1ZSkge1xyXG5cdFx0XHRcdHZhciByZXQgPSBmYWxzZVxyXG5cdFx0XHRcdGZvcihsZXQgdCBvZiB0eXBlKSB7XHJcblx0XHRcdFx0XHRyZXQgfD0gJCQuY2hlY2tUeXBlKGksIHQpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghcmV0KSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGlzT2JqZWN0KHR5cGUpKSB7XHJcblx0XHRcdGlmICghaXNPYmplY3QodmFsdWUpKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH1cclxuXHRcdFx0Zm9yKGxldCBmIGluIHR5cGUpIHtcclxuXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZicsIGYsICd2YWx1ZScsIHZhbHVlKVxyXG5cdFx0XHRcdHZhciBuZXdUeXBlID0gdHlwZVtmXVxyXG5cclxuXHRcdFx0XHR2YXIgaXNPcHRpb25hbCA9IGZhbHNlXHJcblx0XHRcdFx0aWYgKGYuc3RhcnRzV2l0aCgnJCcpKSB7XHJcblx0XHRcdFx0XHRmID0gZi5zdWJzdHIoMSlcclxuXHRcdFx0XHRcdGlzT3B0aW9uYWwgPSB0cnVlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghJCQuY2hlY2tUeXBlKHZhbHVlW2ZdLCBuZXdUeXBlLCBpc09wdGlvbmFsKSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdH1cclxuXHRcdHJldHVybiBmYWxzZVxyXG5cdH1cdFxyXG5cclxuXHJcbn0pKCk7XHJcbiIsIiQkLmRhdGFVUkx0b0Jsb2IgPSBmdW5jdGlvbihkYXRhVVJMKSB7XHJcbiAgLy8gRGVjb2RlIHRoZSBkYXRhVVJMXHJcbiAgdmFyIHNwbGl0ID0gZGF0YVVSTC5zcGxpdCgvWzosO10vKVxyXG4gIHZhciBtaW1lVHlwZSA9IHNwbGl0WzFdXHJcbiAgdmFyIGVuY29kYWdlID0gc3BsaXRbMl1cclxuICBpZiAoZW5jb2RhZ2UgIT0gJ2Jhc2U2NCcpIHtcclxuICBcdHJldHVyblxyXG4gIH1cclxuICB2YXIgZGF0YSA9IHNwbGl0WzNdXHJcblxyXG4gIGNvbnNvbGUubG9nKCdtaW1lVHlwZScsIG1pbWVUeXBlKVxyXG4gIGNvbnNvbGUubG9nKCdlbmNvZGFnZScsIGVuY29kYWdlKVxyXG4gIC8vY29uc29sZS5sb2coJ2RhdGEnLCBkYXRhKVxyXG5cclxuICB2YXIgYmluYXJ5ID0gYXRvYihkYXRhKVxyXG4gLy8gQ3JlYXRlIDgtYml0IHVuc2lnbmVkIGFycmF5XHJcbiAgdmFyIGFycmF5ID0gW11cclxuICBmb3IodmFyIGkgPSAwOyBpIDwgYmluYXJ5Lmxlbmd0aDsgaSsrKSB7XHJcbiAgXHRhcnJheS5wdXNoKGJpbmFyeS5jaGFyQ29kZUF0KGkpKVxyXG4gIH1cclxuXHJcbiAgLy8gUmV0dXJuIG91ciBCbG9iIG9iamVjdFxyXG5cdHJldHVybiBuZXcgQmxvYihbIG5ldyBVaW50OEFycmF5KGFycmF5KSBdLCB7bWltZVR5cGV9KVxyXG59O1xyXG4iLCIkJC5leHRyYWN0ID0gZnVuY3Rpb24ob2JqLCB2YWx1ZXMpIHtcclxuXHRpZiAodHlwZW9mIHZhbHVlcyA9PSAnc3RyaW5nJykge1xyXG5cdFx0dmFsdWVzID0gdmFsdWVzLnNwbGl0KCcsJylcclxuXHR9XHJcblx0aWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykgJiYgdHlwZW9mIHZhbHVlcyA9PSAnb2JqZWN0Jykge1xyXG5cdFx0dmFsdWVzID0gT2JqZWN0LmtleXModmFsdWVzKVxyXG5cdH1cclxuXHR2YXIgcmV0ID0ge31cclxuXHRmb3IodmFyIGsgaW4gb2JqKSB7XHJcblx0XHRpZiAodmFsdWVzLmluZGV4T2YoaykgPj0gMCkge1xyXG5cdFx0XHRyZXRba10gPSBvYmpba11cclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIHJldFxyXG59O1xyXG4iLCIkJC5pc0ltYWdlID0gZnVuY3Rpb24oZmlsZU5hbWUpIHtcclxuXHRyZXR1cm4gKC9cXC4oZ2lmfGpwZ3xqcGVnfHBuZykkL2kpLnRlc3QoZmlsZU5hbWUpXHJcbn07XHJcbiIsIiQkLmxvYWRTdHlsZSA9IGZ1bmN0aW9uKHN0eWxlRmlsZVBhdGgsIGNhbGxiYWNrKSB7XHRcclxuXHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gbG9hZFN0eWxlJywgc3R5bGVGaWxlUGF0aClcclxuXHJcblx0JChmdW5jdGlvbigpIHtcclxuXHRcdHZhciBjc3NPayA9ICQoJ2hlYWQnKS5maW5kKGBsaW5rW2hyZWY9XCIke3N0eWxlRmlsZVBhdGh9XCJdYCkubGVuZ3RoXHJcblx0XHRpZiAoY3NzT2sgIT0gMSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZyhgW0NvcmVdIGxvYWRpbmcgJyR7c3R5bGVGaWxlUGF0aH0nIGRlcGVuZGFuY3lgKVxyXG5cdFx0XHQkKCc8bGluaz4nLCB7aHJlZjogc3R5bGVGaWxlUGF0aCwgcmVsOiAnc3R5bGVzaGVldCd9KVxyXG5cdFx0XHQub24oJ2xvYWQnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhgW0NvcmVdICcke3N0eWxlRmlsZVBhdGh9JyBsb2FkZWRgKVxyXG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0Y2FsbGJhY2soKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdFx0LmFwcGVuZFRvKCQoJ2hlYWQnKSlcclxuXHRcdH1cclxuXHR9KVxyXG59O1xyXG4iLCIkJC5vYmoyQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcclxuXHR2YXIgcmV0ID0gW11cclxuXHRmb3IodmFyIGtleSBpbiBvYmopIHtcclxuXHRcdHJldC5wdXNoKHtrZXk6IGtleSwgdmFsdWU6IG9ialtrZXldfSlcclxuXHR9XHJcblx0cmV0dXJuIHJldFxyXG59O1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG52YXIgaW5wdXRGaWxlID0gJCgnPGlucHV0PicsIHt0eXBlOiAnZmlsZSd9KS5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XHJcblx0dmFyIG9uQXBwbHkgPSAkKHRoaXMpLmRhdGEoJ29uQXBwbHknKVxyXG5cdHZhciBmaWxlTmFtZSA9IHRoaXMuZmlsZXNbMF1cclxuXHRpZiAodHlwZW9mIG9uQXBwbHkgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0b25BcHBseShmaWxlTmFtZSlcclxuXHR9XHJcbn0pXHJcblxyXG4kJC5vcGVuRmlsZURpYWxvZyA9IGZ1bmN0aW9uKG9uQXBwbHkpIHtcclxuXHRpbnB1dEZpbGUuZGF0YSgnb25BcHBseScsIG9uQXBwbHkpXHJcblx0aW5wdXRGaWxlLmNsaWNrKClcclxufVxyXG5cclxufSkoKTtcclxuXHJcbiIsIiQkLnJlYWRGaWxlQXNEYXRhVVJMID0gZnVuY3Rpb24oZmlsZU5hbWUsIG9uUmVhZCkge1xyXG5cdHZhciBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxyXG5cclxuXHRmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKHR5cGVvZiBvblJlYWQgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRvblJlYWQoZmlsZVJlYWRlci5yZXN1bHQpXHJcblx0XHR9XHJcblx0fVxyXG5cdGZpbGVSZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlTmFtZSlcclxufTtcclxuIiwiJCQucmVhZFRleHRGaWxlID0gZnVuY3Rpb24oZmlsZU5hbWUsIG9uUmVhZCkge1xyXG5cdHZhciBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxyXG5cclxuXHRmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKHR5cGVvZiBvblJlYWQgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRvblJlYWQoZmlsZVJlYWRlci5yZXN1bHQpXHJcblx0XHR9XHJcblx0fVxyXG5cdGZpbGVSZWFkZXIucmVhZEFzVGV4dChmaWxlTmFtZSlcclxufTtcclxuIl19

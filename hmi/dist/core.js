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
			
			fnConfigReady(config)
			
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
		console.warn(`[Core] control '${controlName}' is not registered`)
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
		console.warn('[Core] registerObject called with bad arguments')
		return
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
			console.warn(`[Core] service '${depName}' is not registered`)
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
		console.warn(`[configureService] service '${name}' is not registered`)
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
					var $item = $(ctx.template)
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
					template = elt.children().remove().get(0).outerHTML
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYm9vdC9pbmRleC5qcyIsImNvbnRyb2xsZXJzL2RpYWxvZ0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9mb3JtRGlhbG9nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL3ZpZXcuanMiLCJjb3JlL2NvbnRyb2xzLmpzIiwiY29yZS9vYmplY3RzQW5kU2VydmljZXMuanMiLCJwbHVnaW5zL2JpbmRpbmcuanMiLCJwbHVnaW5zL2NvbnRyb2wuanMiLCJwbHVnaW5zL2V2ZW50LmpzIiwicGx1Z2lucy9mb3JtLmpzIiwicGx1Z2lucy9tZW51LmpzIiwicGx1Z2lucy90ZW1wbGF0ZS5qcyIsInBsdWdpbnMvdWkuanMiLCJwbHVnaW5zL3V0aWwuanMiLCJ1aS9zaG93QWxlcnQuanMiLCJ1aS9zaG93Q29uZmlybS5qcyIsInVpL3Nob3dQaWN0dXJlLmpzIiwidWkvc2hvd1Byb21wdC5qcyIsInV0aWwvY2hlY2tUeXBlLmpzIiwidXRpbC9kYXRhVVJMdG9CbG9iLmpzIiwidXRpbC9leHRyYWN0LmpzIiwidXRpbC9pc0ltYWdlLmpzIiwidXRpbC9sb2FkU3R5bGUuanMiLCJ1dGlsL29iajJBcnJheS5qcyIsInV0aWwvb3BlbkZpbGVEaWFsb2cuanMiLCJ1dGlsL3JlYWRGaWxlQXNEYXRhVVJMLmpzIiwidXRpbC9yZWFkVGV4dEZpbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtcclxuXHJcblx0XHJcblx0d2luZG93LiQkID0ge31cclxuXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpe1xyXG5cclxudmFyIGZuQ29uZmlnUmVhZHlcclxudmFyIGN1clJvdXRlXHJcblx0XHJcbiQkLmNvbmZpZ1JlYWR5ID0gZnVuY3Rpb24oZm4pIHtcclxuXHJcblx0Zm5Db25maWdSZWFkeSA9IGZuXHJcbn1cclxuXHJcbiQkLnN0YXJ0QXBwID0gZnVuY3Rpb24obWFpbkNvbnRyb2xOYW1lLCBjb25maWcpIHtcclxuXHQkJC52aWV3Q29udHJvbGxlcignYm9keScsIHtcclxuXHRcdHRlbXBsYXRlOiBgPGRpdiBibi1jb250cm9sPVwiJHttYWluQ29udHJvbE5hbWV9XCIgY2xhc3M9XCJtYWluUGFuZWxcIiBibi1vcHRpb25zPVwiY29uZmlnXCI+PC9kaXY+YCxcclxuXHRcdGRhdGE6IHtjb25maWd9XHJcblx0fSlcclxufVxyXG5cclxuZnVuY3Rpb24gcHJvY2Vzc1JvdXRlKCkge1xyXG5cdHZhciBwcmV2Um91dGUgPSBjdXJSb3V0ZVxyXG5cdHZhciBocmVmID0gbG9jYXRpb24uaHJlZlxyXG5cdHZhciBpZHggPSBocmVmLmluZGV4T2YoJyMnKVxyXG5cdGN1clJvdXRlID0gKGlkeCAhPT0gLTEpICA/IGhyZWYuc3Vic3RyKGlkeCsxKSA6ICcvJ1xyXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBuZXdSb3V0ZScsIGN1clJvdXRlLCBwcmV2Um91dGUpXHJcblxyXG5cclxuXHQkKHdpbmRvdykudHJpZ2dlcigncm91dGVDaGFuZ2UnLCB7Y3VyUm91dGU6Y3VyUm91dGUsIHByZXZSb3V0ZTogcHJldlJvdXRlfSlcclxuXHJcbn1cdFxyXG5cclxuJChmdW5jdGlvbigpIHtcclxuXHJcblx0dmFyIGFwcE5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnLycpWzJdXHJcblxyXG5cdGNvbnNvbGUubG9nKGBbQ29yZV0gQXBwICcke2FwcE5hbWV9JyBzdGFydGVkIDopYClcclxuXHRjb25zb2xlLmxvZygnW0NvcmVdIGpRdWVyeSB2ZXJzaW9uJywgJC5mbi5qcXVlcnkpXHJcblx0Y29uc29sZS5sb2coJ1tDb3JlXSBqUXVlcnkgVUkgdmVyc2lvbicsICQudWkudmVyc2lvbilcclxuXHJcblx0XHJcblxyXG5cclxuXHQkKHdpbmRvdykub24oJ3BvcHN0YXRlJywgZnVuY3Rpb24oZXZ0KSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdbcG9wc3RhdGVdIHN0YXRlJywgZXZ0LnN0YXRlKVxyXG5cdFx0cHJvY2Vzc1JvdXRlKClcclxuXHR9KVxyXG5cclxuXHJcblx0aWYgKHR5cGVvZiBmbkNvbmZpZ1JlYWR5ID09ICdmdW5jdGlvbicpIHtcclxuXHRcdCQuZ2V0SlNPTihgL2FwaS91c2Vycy9jb25maWcvJHthcHBOYW1lfWApXHJcblx0XHQudGhlbihmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0XHRcdCQkLmNvbmZpZ3VyZVNlcnZpY2UoJ1dlYlNvY2tldFNlcnZpY2UnLCB7aWQ6IGFwcE5hbWUgKyAnLicgKyBjb25maWcuJHVzZXJOYW1lICsgJy4nfSlcclxuXHRcdFx0JCgnYm9keScpLnByb2Nlc3NDb250cm9scygpIC8vIHByb2Nlc3MgSGVhZGVyQ29udHJvbFxyXG5cdFx0XHRcclxuXHRcdFx0Zm5Db25maWdSZWFkeShjb25maWcpXHJcblx0XHRcdFxyXG5cdFx0XHRwcm9jZXNzUm91dGUoKVxyXG5cdFx0fSlcclxuXHRcdC5jYXRjaCgoanF4aHIpID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ2pxeGhyJywganF4aHIpXHJcblx0XHRcdC8vdmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeShqcXhoci5yZXNwb25zZUpTT04sIG51bGwsIDQpXHJcblx0XHRcdHZhciB0ZXh0ID0ganF4aHIucmVzcG9uc2VUZXh0XHJcblx0XHRcdHZhciBodG1sID0gYFxyXG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cclxuXHRcdFx0XHRcdDxwIGNsYXNzPVwidzMtdGV4dC1yZWRcIj4ke3RleHR9PC9wPlxyXG5cdFx0XHRcdFx0PGEgaHJlZj1cIi9kaXNjb25uZWN0XCIgY2xhc3M9XCJ3My1idG4gdzMtYmx1ZVwiPkxvZ291dDwvYT5cclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0YFxyXG5cdFx0XHQkKCdib2R5JykuaHRtbChodG1sKVxyXG5cdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0Y29uc29sZS53YXJuKCdNaXNzaW5nIGZ1bmN0aW9uIGNvbmZpZ1JlYWR5ICEhJylcclxuXHR9XHJcblx0XHJcblxyXG59KVxyXG5cclxuXHRcclxufSkoKTtcclxuIiwiJCQuZGlhbG9nQ29udHJvbGxlciA9IGZ1bmN0aW9uKHRpdGxlLCBvcHRpb25zKSB7XHJcblx0dmFyIGRpdiA9ICQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblxyXG5cdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZGl2LCBvcHRpb25zKVxyXG5cdGRpdi5kaWFsb2coe1xyXG5cdFx0YXV0b09wZW46IGZhbHNlLFxyXG5cdFx0bW9kYWw6IHRydWUsXHJcblx0XHR3aWR0aDogJ2F1dG8nLFxyXG5cdFx0YnV0dG9uczoge1xyXG5cdFx0XHQnQ2FuY2VsJzogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0fSxcclxuXHRcdFx0J0FwcGx5JzogZnVuY3Rpb24oKSB7XHRcdFx0XHRcdFxyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uQXBwbHkgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0b3B0aW9ucy5vbkFwcGx5LmNhbGwoY3RybClcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0Y3RybC5zaG93ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRkaXYuZGlhbG9nKCdvcGVuJylcclxuXHR9XHJcblx0cmV0dXJuIGN0cmxcclxufTtcclxuXHJcbiIsIiQkLmZvcm1EaWFsb2dDb250cm9sbGVyID0gZnVuY3Rpb24odGl0bGUsIG9wdGlvbnMpIHtcclxuXHR2YXIgZGl2ID0gJCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHR2YXIgZm9ybSA9ICQoJzxmb3JtPicpXHJcblx0XHQuYXBwZW5kVG8oZGl2KVxyXG5cdFx0Lm9uKCdzdWJtaXQnLCBmdW5jdGlvbihldikge1xyXG5cdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRcdGRpdi5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uQXBwbHkgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdG9wdGlvbnMub25BcHBseS5jYWxsKGN0cmwsIGN0cmwuZWx0LmdldEZvcm1EYXRhKCkpXHJcblx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0fSlcclxuXHR2YXIgc3VibWl0QnRuID0gJCgnPGlucHV0PicsIHt0eXBlOiAnc3VibWl0JywgaGlkZGVuOiB0cnVlfSkuYXBwZW5kVG8oZm9ybSlcclxuXHJcblx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihmb3JtLCBvcHRpb25zKVxyXG5cdGRpdi5kaWFsb2coe1xyXG5cdFx0YXV0b09wZW46IGZhbHNlLFxyXG5cdFx0bW9kYWw6IHRydWUsXHJcblx0XHR3aWR0aDogJ2F1dG8nLFxyXG5cdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQvLyQodGhpcykuZGlhbG9nKCdkZXN0cm95JylcclxuXHRcdH0sXHJcblx0XHRidXR0b25zOiB7XHJcblx0XHRcdCdDYW5jZWwnOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHQnQXBwbHknOiBmdW5jdGlvbigpIHtcdFx0XHRcdFx0XHJcblx0XHRcdFx0c3VibWl0QnRuLmNsaWNrKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0Y3RybC5zaG93ID0gZnVuY3Rpb24oZGF0YSwgb25BcHBseSkge1xyXG5cdFx0aWYgKHR5cGVvZiBjdHJsLmJlZm9yZVNob3cgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRjdHJsLmJlZm9yZVNob3coKVxyXG5cdFx0fVxyXG5cdFx0b3B0aW9ucy5vbkFwcGx5ID0gb25BcHBseVxyXG5cdFx0Y3RybC5lbHQuc2V0Rm9ybURhdGEoZGF0YSlcclxuXHRcdGRpdi5kaWFsb2coJ29wZW4nKVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGN0cmxcclxufTtcclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG5cclxuXHJcbmNsYXNzIFZpZXdDb250cm9sbGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKGVsdCwgb3B0aW9ucykge1xyXG4gICAgXHQvL2NvbnNvbGUubG9nKCdWaWV3Q29udHJvbGxlcicsIG9wdGlvbnMpXHJcbiAgICBcdGlmICh0eXBlb2YgZWx0ID09ICdzdHJpbmcnKSB7XHJcbiAgICBcdFx0ZWx0ID0gJChlbHQpXHJcbiAgICBcdH1cclxuXHJcbiAgICBcdG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucylcclxuICAgICAgICB0aGlzLmVsdCA9IGVsdFxyXG5cclxuICAgICAgICB0aGlzLmVsdC5vbignZGF0YTp1cGRhdGUnLCAoZXYsIG5hbWUsIHZhbHVlLCBleGNsdWRlRWx0KSA9PiB7XHJcbiAgICAgICAgXHQvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIGRhdGE6Y2hhbmdlJywgbmFtZSwgdmFsdWUpXHJcbiAgICAgICAgXHR0aGlzLnNldERhdGEobmFtZSwgdmFsdWUsIGV4Y2x1ZGVFbHQpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRlbXBsYXRlID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgXHR0aGlzLmVsdCA9ICQob3B0aW9ucy50ZW1wbGF0ZSkuYXBwZW5kVG8oZWx0KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm1vZGVsID0gJC5leHRlbmQoe30sIG9wdGlvbnMuZGF0YSlcclxuICAgICAgICB0aGlzLnJ1bGVzID0gJC5leHRlbmQoe30sIG9wdGlvbnMucnVsZXMpXHJcbiAgICAgICAgdGhpcy53YXRjaGVzID0gJC5leHRlbmQoe30sIG9wdGlvbnMud2F0Y2hlcylcclxuXHJcbiAgICAgICAgLy8gZ2VuZXJhdGUgYXV0b21hdGljIHJ1bGVzIGZvciBjb21wdXRlZCBkYXRhIChha2EgZnVuY3Rpb24pXHJcbiAgICAgICAgZm9yKHZhciBrIGluIHRoaXMubW9kZWwpIHtcclxuICAgICAgICBcdHZhciBkYXRhID0gdGhpcy5tb2RlbFtrXVxyXG4gICAgICAgIFx0aWYgKHR5cGVvZiBkYXRhID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBcdFx0dmFyIGZ1bmNUZXh0ID0gZGF0YS50b1N0cmluZygpXHJcbiAgICAgICAgXHRcdC8vY29uc29sZS5sb2coJ2Z1bmNUZXh0JywgZnVuY1RleHQpXHJcbiAgICAgICAgXHRcdHZhciBydWxlcyA9IFtdXHJcbiAgICAgICAgXHRcdGZ1bmNUZXh0LnJlcGxhY2UoL3RoaXMuKFthLXpBLVowLTlfLV17MSx9KS9nLCBmdW5jdGlvbihtYXRjaCwgY2FwdHVyZU9uZSkge1xyXG4gICAgICAgIFx0XHRcdC8vY29uc29sZS5sb2coJ2NhcHR1cmVPbmUnLCBjYXB0dXJlT25lKVxyXG4gICAgICAgIFx0XHRcdHJ1bGVzLnB1c2goY2FwdHVyZU9uZSlcclxuICAgICAgICBcdFx0fSlcclxuICAgICAgICBcdFx0dGhpcy5ydWxlc1trXSA9IHJ1bGVzLnRvU3RyaW5nKClcclxuICAgICAgICBcdH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3J1bGVzJywgdGhpcy5ydWxlcylcclxuICAgICAgICB0aGlzLmRpckxpc3QgPSB0aGlzLmVsdC5wcm9jZXNzVUkodGhpcy5tb2RlbClcclxuXHJcblxyXG4gICAgICAgIC8vdGhpcy5lbHQucHJvY2Vzc1VJKHRoaXMubW9kZWwpXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmV2ZW50cyA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLmVsdC5wcm9jZXNzRXZlbnRzKG9wdGlvbnMuZXZlbnRzKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zY29wZSA9IHRoaXMuZWx0LnByb2Nlc3NCaW5kaW5ncygpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc2NvcGUnLCB0aGlzLnNjb3BlKVxyXG4gICAgICAgXHJcbiAgICAgICAgdmFyIGluaXQgPSBvcHRpb25zLmluaXRcclxuICAgICAgICBpZiAodHlwZW9mIGluaXQgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIFx0aW5pdC5jYWxsKHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfSBcclxuXHJcbiAgICBzZXREYXRhKGFyZzEsIGFyZzIsIGV4Y2x1ZGVFbHQpIHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHNldERhdGEnLCBhcmcxLCBhcmcyKVxyXG4gICAgICAgIHZhciBkYXRhID0gYXJnMVxyXG4gICAgICAgIGlmICh0eXBlb2YgYXJnMSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIFx0ZGF0YSA9IHt9XHJcbiAgICAgICAgXHRkYXRhW2FyZzFdID0gYXJnMlxyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHNldERhdGEnLCBkYXRhKVxyXG4gICAgICAgICQuZXh0ZW5kKHRoaXMubW9kZWwsIGRhdGEpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbW9kZWwnLCB0aGlzLm1vZGVsKVxyXG4gICAgICAgIHRoaXMudXBkYXRlKE9iamVjdC5rZXlzKGRhdGEpLCBleGNsdWRlRWx0KVxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShmaWVsZHNOYW1lLCBleGNsdWRlRWx0KSB7XHJcbiAgICBcdC8vY29uc29sZS5sb2coJ1tWaWV3Q29udHJvbGxlcl0gdXBkYXRlJywgZmllbGRzTmFtZSlcclxuICAgIFx0aWYgKHR5cGVvZiBmaWVsZHNOYW1lID09ICdzdHJpbmcnKSB7XHJcbiAgICBcdFx0ZmllbGRzTmFtZSA9IGZpZWxkc05hbWUuc3BsaXQoJywnKVxyXG4gICAgXHR9XHJcblxyXG5cclxuICAgIFx0aWYgKEFycmF5LmlzQXJyYXkoZmllbGRzTmFtZSkpIHtcclxuICAgIFx0XHR2YXIgZmllbGRzU2V0ID0ge31cclxuICAgIFx0XHRmaWVsZHNOYW1lLmZvckVhY2goKGZpZWxkKSA9PiB7XHJcblxyXG4gICAgXHRcdFx0dmFyIHdhdGNoID0gdGhpcy53YXRjaGVzW2ZpZWxkXVxyXG4gICAgXHRcdFx0aWYgKHR5cGVvZiB3YXRjaCA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBcdFx0XHRcdHdhdGNoLmNhbGwobnVsbCwgdGhpcy5tb2RlbFtmaWVsZF0pXHJcbiAgICBcdFx0XHR9XHJcbiAgICBcdFx0XHRmaWVsZHNTZXRbZmllbGRdID0gMVxyXG5cclxuICAgIFx0XHRcdGZvcih2YXIgcnVsZSBpbiB0aGlzLnJ1bGVzKSB7XHJcbiAgICBcdFx0XHRcdGlmICh0aGlzLnJ1bGVzW3J1bGVdLnNwbGl0KCcsJykuaW5kZXhPZihmaWVsZCkgIT0gLTEpIHtcclxuICAgIFx0XHRcdFx0XHRmaWVsZHNTZXRbcnVsZV0gPSAxXHJcbiAgICBcdFx0XHRcdH1cclxuICAgIFx0XHRcdH1cclxuICAgIFx0XHR9KVxyXG5cclxuXHJcbiAgICBcdFx0dGhpcy5lbHQudXBkYXRlVGVtcGxhdGUodGhpcy5kaXJMaXN0LCB0aGlzLm1vZGVsLCBPYmplY3Qua2V5cyhmaWVsZHNTZXQpLCBleGNsdWRlRWx0KVxyXG4gICAgXHR9XHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuICAgICQkLnZpZXdDb250cm9sbGVyID0gZnVuY3Rpb24gKGVsdCwgb3B0aW9ucykge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmlld0NvbnRyb2xsZXIoZWx0LCBvcHRpb25zKVxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKXtcclxuXHJcblxyXG5cclxuJCQucmVnaXN0ZXJDb250cm9sID0gZnVuY3Rpb24obmFtZSwgYXJnMSwgYXJnMikge1xyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdjb250cm9scycsIG5hbWUsIGFyZzEsIGFyZzIpXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4ID0gZnVuY3Rpb24obmFtZSwgb3B0aW9ucykge1xyXG5cdGlmICghJCQuY2hlY2tUeXBlKG9wdGlvbnMsIHtcclxuXHRcdCRkZXBzOiBbJ3N0cmluZyddLFxyXG5cdFx0JGlmYWNlOiAnc3RyaW5nJyxcclxuXHRcdCRldmVudHM6ICdzdHJpbmcnLFxyXG5cdFx0aW5pdDogJ2Z1bmN0aW9uJ1xyXG5cdH0pKSB7XHJcblx0XHRjb25zb2xlLmVycm9yKGBbQ29yZV0gcmVnaXN0ZXJDb250cm9sRXg6IGJhZCBvcHRpb25zYCwgb3B0aW9ucylcclxuXHRcdHJldHVyblxyXG5cdH1cclxuXHJcblxyXG5cdHZhciBkZXBzID0gb3B0aW9ucy5kZXBzIHx8IFtdXHJcblxyXG5cclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnY29udHJvbHMnLCBuYW1lLCBkZXBzLCBvcHRpb25zKVxyXG59XHJcblxyXG5cclxuXHJcbiQkLmNyZWF0ZUNvbnRyb2wgPSBmdW5jdGlvbihjb250cm9sTmFtZSwgZWx0KSB7XHJcblx0ZWx0LmFkZENsYXNzKGNvbnRyb2xOYW1lKVxyXG5cdGVsdC5hZGRDbGFzcygnQ3VzdG9tQ29udHJvbCcpLnVuaXF1ZUlkKClcdFxyXG5cdHZhciBjdHJsID0gJCQuZ2V0T2JqZWN0KCdjb250cm9scycsIGNvbnRyb2xOYW1lKVxyXG5cdFx0XHJcblx0aWYgKGN0cmwgIT0gdW5kZWZpbmVkKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdjcmVhdGVDb250cm9sJywgY29udHJvbE5hbWUsIGN0cmwpXHJcblx0XHRpZiAoY3RybC5zdGF0dXMgPT09ICAnb2snKSB7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgaWZhY2UgPSB7fVxyXG5cclxuXHRcdFx0XHJcblx0XHRcdGlmICh0eXBlb2YgY3RybC5mbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0dmFyIGFyZ3MgPSBbZWx0XS5jb25jYXQoY3RybC5kZXBzKVxyXG5cdFx0XHRcdHZhciBjb3B5T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBlbHQuZ2V0T3B0aW9ucygpKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gaW5zdGFuY2UgY29udHJvbCAnJHtjb250cm9sTmFtZX0nYClcclxuXHRcdFx0XHRjdHJsLmZuLmFwcGx5KGlmYWNlLCBhcmdzKVx0XHJcblx0XHRcdFx0aWZhY2Uub3B0aW9ucyA9IGNvcHlPcHRpb25zXHJcblx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAodHlwZW9mIGN0cmwuZm4gPT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHR2YXIgaW5pdCA9IGN0cmwuZm4uaW5pdFxyXG5cdFx0XHRcdHZhciBwcm9wcyA9IGN0cmwuZm4ucHJvcHMgfHwge31cclxuXHRcdFx0XHR2YXIgY3R4ID0ge31cclxuXHRcdFx0XHR2YXIgZGVmYXVsdE9wdGlvbnMgPSBjdHJsLmZuLm9wdGlvbnMgfHwge31cclxuXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBpbml0ID09ICdmdW5jdGlvbicpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgaW5pdFZhbHVlcyA9IHt9XHJcblx0XHRcdFx0XHRmb3IodmFyIGsgaW4gcHJvcHMpIHtcclxuXHRcdFx0XHRcdFx0Y3R4W2tdID0gcHJvcHNba10udmFsXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0dmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbnMsIGVsdC5nZXRPcHRpb25zKGN0eCkpXHJcblxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW0NvcmVdIG9wdGlvbnNgLCBvcHRpb25zKVxyXG5cdFx0XHRcdFx0dmFyIHRydWVPcHRpb25zID0ge31cclxuXHRcdFx0XHRcdGZvcih2YXIgayBpbiBvcHRpb25zKSB7XHJcblx0XHRcdFx0XHRcdGlmICghKGsgaW4gcHJvcHMpKSB7XHJcblx0XHRcdFx0XHRcdFx0dHJ1ZU9wdGlvbnNba10gPSBvcHRpb25zW2tdXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHR2YXIgY29weU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdHJ1ZU9wdGlvbnMpXHJcblxyXG5cdFx0XHRcdFx0dmFyIGFyZ3MgPSBbZWx0LCBvcHRpb25zXS5jb25jYXQoY3RybC5kZXBzKVxyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBpbnN0YW5jZSBjb250cm9sICcke2NvbnRyb2xOYW1lfScgd2l0aCBvcHRpb25zYCwgb3B0aW9ucylcclxuXHRcdFx0XHRcdGluaXQuYXBwbHkoaWZhY2UsIGFyZ3MpXHJcblx0XHRcdFx0XHRpZmFjZS5vcHRpb25zID0gY29weU9wdGlvbnNcclxuXHRcdFx0XHRcdGlmYWNlLmV2ZW50cyA9IGN0cmwuZm4uZXZlbnRzXHJcblxyXG5cdFx0XHRcdFx0aWYgKE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGggIT0gMCkge1xyXG5cdFx0XHRcdFx0XHRpZmFjZS5zZXRQcm9wID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbQ29yZV0gc2V0RGF0YWAsIG5hbWUsIHZhbHVlKVxyXG5cdFx0XHRcdFx0XHRcdHZhciBzZXR0ZXIgPSBwcm9wc1tuYW1lXSAmJiBwcm9wc1tuYW1lXS5zZXRcclxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIHNldHRlciA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIHNldHRlciA9IGlmYWNlW3NldHRlcl1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBzZXR0ZXIgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0c2V0dGVyLmNhbGwoY3R4LCB2YWx1ZSlcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0Y3R4W25hbWVdID0gdmFsdWVcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWZhY2UucHJvcHMgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgcmV0ID0ge31cclxuXHRcdFx0XHRcdFx0XHRmb3IodmFyIGsgaW4gcHJvcHMpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHJldFtrXSA9IGN0eFtrXVxyXG5cclxuXHRcdFx0XHRcdFx0XHRcdHZhciBnZXR0ZXIgPSBwcm9wc1trXS5nZXRcclxuXHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgZ2V0dGVyID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGdldHRlciA9IGlmYWNlW2dldHRlcl1cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGdldHRlciA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHJldFtrXSA9IGdldHRlci5jYWxsKGN0eClcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldFxyXG5cdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBjb250cm9sICcke2NvbnRyb2xOYW1lfScgbWlzc2luZyBpbml0IGZ1bmN0aW9uYClcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZmFjZS5uYW1lID0gY29udHJvbE5hbWVcclxuXHRcdFx0ZWx0LmdldCgwKS5jdHJsID0gaWZhY2VcclxuXHRcdFx0XHJcblx0XHRcdHJldHVybiBpZmFjZVx0XHRcdFx0XHJcblx0XHR9XHJcblxyXG5cclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBjb250cm9sICcke2NvbnRyb2xOYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxyXG5cdH1cclxufVxyXG5cclxuJCQuZ2V0UmVnaXN0ZXJlZENvbnRyb2xzID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGNvbnRyb2xzID0gJCQuZ2V0T2JqZWN0RG9tYWluKCdjb250cm9scycpXHJcblx0cmV0dXJuIE9iamVjdC5rZXlzKGNvbnRyb2xzKS5maWx0ZXIoKG5hbWUpID0+ICFuYW1lLnN0YXJ0c1dpdGgoJyQnKSlcclxufVxyXG5cclxuJCQuZ2V0UmVnaXN0ZXJlZENvbnRyb2xzRXggPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgY29udHJvbHMgPSAkJC5nZXRPYmplY3REb21haW4oJ2NvbnRyb2xzJylcclxuXHR2YXIgbGlicyA9IHt9XHJcblx0Zm9yKHZhciBrIGluIGNvbnRyb2xzKSB7XHJcblx0XHR2YXIgaW5mbyA9IGNvbnRyb2xzW2tdLmZuXHJcblx0XHR2YXIgbGliTmFtZSA9IGluZm8ubGliXHJcblx0XHRpZiAodHlwZW9mIGxpYk5hbWUgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0aWYgKGxpYnNbbGliTmFtZV0gPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0bGlic1tsaWJOYW1lXSA9IFtdXHJcblx0XHRcdH1cclxuXHRcdFx0bGlic1tsaWJOYW1lXS5wdXNoKGspXHJcblxyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gbGlic1xyXG59XHJcblxyXG4kJC5nZXRDb250cm9sSW5mbyA9IGZ1bmN0aW9uKGNvbnRyb2xOYW1lKSB7XHJcblx0dmFyIGNvbnRyb2xzID0gJCQuZ2V0T2JqZWN0RG9tYWluKCdjb250cm9scycpXHJcblx0dmFyIGluZm8gPSBjb250cm9sc1tjb250cm9sTmFtZV1cclxuXHJcblx0aWYgKGluZm8gPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRjb25zb2xlLmxvZyhgY29udHJvbCAnJHtjb250cm9sTmFtZX0nIGlzIG5vdCByZWdpc3RlcmVkYClcclxuXHRcdHJldHVyblxyXG5cdH1cclxuXHRpbmZvID0gaW5mby5mblxyXG5cclxuXHR2YXIgcmV0ID0gJCQuZXh0cmFjdChpbmZvLCAnZGVwcyxvcHRpb25zLGxpYicpXHJcblxyXG5cdGlmICh0eXBlb2YgaW5mby5ldmVudHMgPT0gJ3N0cmluZycpIHtcclxuXHRcdHJldC5ldmVudHMgPSBpbmZvLmV2ZW50cy5zcGxpdCgnLCcpXHJcblx0fVxyXG5cclxuXHR2YXIgcHJvcHMgPSB7fVxyXG5cdGZvcih2YXIgayBpbiBpbmZvLnByb3BzKSB7XHJcblx0XHRwcm9wc1trXSA9IGluZm8ucHJvcHNba10udmFsXHJcblx0fVxyXG5cdGlmIChPYmplY3Qua2V5cyhwcm9wcykubGVuZ3RoICE9IDApIHtcclxuXHRcdHJldC5wcm9wcyA9IHByb3BzXHJcblx0fVxyXG5cdGlmICh0eXBlb2YgaW5mby5pZmFjZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0cmV0LmlmYWNlID0gaW5mby5pZmFjZS5zcGxpdCgnOycpXHJcblx0fVxyXG5cdHJldHVybiByZXRcclxuXHQvL3JldHVybiBjb250cm9sc1tjb250cm9sTmFtZV0uZm5cclxufVxyXG5cclxuXHJcbiQkLmdldENvbnRyb2xzVHJlZSA9IGZ1bmN0aW9uKHNob3dXaGF0KSB7XHJcblx0c2hvd1doYXQgPSBzaG93V2hhdCB8fCAnJ1xyXG5cdHZhciBzaG93T3B0aW9ucyA9IHNob3dXaGF0LnNwbGl0KCcsJylcclxuXHR2YXIgdHJlZSA9IFtdXHJcblx0JCgnLkN1c3RvbUNvbnRyb2wnKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGlmYWNlID0gJCh0aGlzKS5pbnRlcmZhY2UoKVxyXG5cclxuXHRcdHZhciBpdGVtID0ge25hbWU6aWZhY2UubmFtZSwgZWx0OiAkKHRoaXMpLCBwYXJlbnQ6IG51bGx9XHJcblx0XHRpdGVtLmlkID0gJCh0aGlzKS5hdHRyKCdpZCcpXHJcblxyXG5cdFx0aWYgKHR5cGVvZiBpZmFjZS5ldmVudHMgPT0gJ3N0cmluZycgJiZcclxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCdldmVudHMnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykpKSB7XHJcblx0XHRcdGl0ZW0uZXZlbnRzID0gaWZhY2UuZXZlbnRzLnNwbGl0KCcsJylcclxuXHRcdH1cdFx0XHRcclxuXHJcblx0XHR0cmVlLnB1c2goaXRlbSlcclxuXHJcblx0XHRpZiAoc2hvd09wdGlvbnMuaW5kZXhPZignaWZhY2UnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykge1xyXG5cclxuXHRcdFx0dmFyIGZ1bmMgPSBbXVxyXG5cdFx0XHRmb3IodmFyIGsgaW4gaWZhY2UpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGlmYWNlW2tdID09ICdmdW5jdGlvbicgJiYgayAhPSAncHJvcHMnICYmIGsgIT0gJ3NldFByb3AnKSB7XHJcblx0XHRcdFx0XHRmdW5jLnB1c2goaylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGZ1bmMubGVuZ3RoICE9IDApIHtcclxuXHRcdFx0XHRpdGVtLmlmYWNlID0gZnVuY1xyXG5cdFx0XHR9XHRcdFx0XHRcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHRcdGlmICh0eXBlb2YgaWZhY2UucHJvcHMgPT0gJ2Z1bmN0aW9uJyAmJiBcclxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCdwcm9wcycpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcclxuXHRcdFx0aXRlbS5wcm9wcyA9IGlmYWNlLnByb3BzKClcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodHlwZW9mIGlmYWNlLmdldFZhbHVlID09ICdmdW5jdGlvbicgJiZcclxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCd2YWx1ZScpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcclxuXHRcdFx0aXRlbS52YWx1ZSA9IGlmYWNlLmdldFZhbHVlKClcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodHlwZW9mIGlmYWNlLm9wdGlvbnMgPT0gJ29iamVjdCcgJiYgT2JqZWN0LmtleXMoaWZhY2Uub3B0aW9ucykubGVuZ3RoICE9IDAgJiZcclxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCdvcHRpb25zJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpKSkge1xyXG5cdFx0XHRpdGVtLm9wdGlvbnMgPSBpZmFjZS5vcHRpb25zXHJcblx0XHR9XHRcclxuXHJcblx0XHRcdFx0XHRcclxuXHRcdC8vY29uc29sZS5sb2coJ25hbWUnLCBuYW1lKVxyXG5cdFx0aXRlbS5jaGlsZHMgPSBbXVxyXG5cclxuXHJcblx0XHR2YXIgcGFyZW50cyA9ICQodGhpcykucGFyZW50cygnLkN1c3RvbUNvbnRyb2wnKVxyXG5cdFx0Ly9jb25zb2xlLmxvZygncGFyZW50cycsIHBhcmVudHMpXHJcblx0XHRpZiAocGFyZW50cy5sZW5ndGggIT0gMCkge1xyXG5cdFx0XHR2YXIgcGFyZW50ID0gcGFyZW50cy5lcSgwKVxyXG5cdFx0XHRpdGVtLnBhcmVudCA9IHBhcmVudFxyXG5cdFx0XHR0cmVlLmZvckVhY2goZnVuY3Rpb24oaSkge1xyXG5cdFx0XHRcdGlmIChpLmVsdC5nZXQoMCkgPT0gcGFyZW50LmdldCgwKSkge1xyXG5cdFx0XHRcdFx0aS5jaGlsZHMucHVzaChpdGVtKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdFx0XHJcblxyXG5cdFx0fVxyXG5cdH0pXHJcblx0Ly9jb25zb2xlLmxvZygndHJlZScsIHRyZWUpXHJcblxyXG5cdHZhciByZXQgPSBbXVxyXG5cdHRyZWUuZm9yRWFjaChmdW5jdGlvbihpKSB7XHJcblx0XHRpZiAoaS5wYXJlbnQgPT0gbnVsbCkge1xyXG5cdFx0XHRyZXQucHVzaChpKVxyXG5cdFx0fVxyXG5cdFx0aWYgKGkuY2hpbGRzLmxlbmd0aCA9PSAwKSB7XHJcblx0XHRcdGRlbGV0ZSBpLmNoaWxkc1xyXG5cdFx0fVxyXG5cdFx0ZGVsZXRlIGkucGFyZW50XHJcblx0XHRkZWxldGUgaS5lbHRcclxuXHR9KVxyXG5cclxuXHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkocmV0LCBudWxsLCA0KVxyXG5cclxufVxyXG5cclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG52YXIgcmVnaXN0ZXJlZE9iamVjdHMgPSB7XHJcblx0c2VydmljZXM6IHt9XHJcbn1cclxuXHJcbnZhciB7c2VydmljZXN9ID0gcmVnaXN0ZXJlZE9iamVjdHNcclxuXHJcbmZ1bmN0aW9uIGlzRGVwc09rKGRlcHMpIHtcclxuXHRyZXR1cm4gZGVwcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XHJcblxyXG5cdFx0cmV0dXJuIHByZXYgJiYgKGN1ciAhPSB1bmRlZmluZWQpXHJcblx0fSwgdHJ1ZSlcdFx0XHJcbn1cclxuXHJcbiQkLmdldE9iamVjdERvbWFpbiA9IGZ1bmN0aW9uKGRvbWFpbikge1xyXG5cdHJldHVybiByZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyT2JqZWN0ID0gZnVuY3Rpb24oZG9tYWluLCBuYW1lLCBhcmcxLCBhcmcyKSB7XHJcblx0dmFyIGRlcHMgPSBbXVxyXG5cdHZhciBmbiA9IGFyZzFcclxuXHRpZiAoQXJyYXkuaXNBcnJheShhcmcxKSkge1xyXG5cdFx0ZGVwcyA9IGFyZzFcclxuXHRcdGZuID0gYXJnMlxyXG5cdH1cclxuXHRpZiAodHlwZW9mIGRvbWFpbiAhPSAnc3RyaW5nJyB8fCB0eXBlb2YgbmFtZSAhPSAnc3RyaW5nJyB8fCB0eXBlb2YgZm4gPT0gJ3VuZGVmaW5lZCcgfHwgIUFycmF5LmlzQXJyYXkoZGVwcykpIHtcclxuXHRcdGNvbnNvbGUud2FybignW0NvcmVdIHJlZ2lzdGVyT2JqZWN0IGNhbGxlZCB3aXRoIGJhZCBhcmd1bWVudHMnKVxyXG5cdFx0cmV0dXJuXHJcblx0fSBcclxuXHRjb25zb2xlLmxvZyhgW0NvcmVdIHJlZ2lzdGVyIG9iamVjdCAnJHtkb21haW59OiR7bmFtZX0nIHdpdGggZGVwc2AsIGRlcHMpXHJcblx0aWYgKHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl0gPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRyZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dID0ge31cclxuXHR9XHJcblx0cmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXVtuYW1lXSA9IHtkZXBzOiBkZXBzLCBmbiA6Zm4sIHN0YXR1czogJ25vdGxvYWRlZCd9XHJcbn1cdFxyXG5cclxuJCQuZ2V0T2JqZWN0ID0gZnVuY3Rpb24oZG9tYWluLCBuYW1lKSB7XHJcblx0Ly9jb25zb2xlLmxvZyhgW0NvcmVdIGdldE9iamVjdCAke2RvbWFpbn06JHtuYW1lfWApXHJcblx0dmFyIGRvbWFpbiA9IHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl1cclxuXHR2YXIgcmV0ID0gZG9tYWluICYmIGRvbWFpbltuYW1lXVxyXG5cdGlmIChyZXQgJiYgcmV0LnN0YXR1cyA9PSAnbm90bG9hZGVkJykge1xyXG5cdFx0cmV0LmRlcHMgPSAkJC5nZXRTZXJ2aWNlcyhyZXQuZGVwcylcclxuXHRcdHJldC5zdGF0dXMgPSBpc0RlcHNPayhyZXQuZGVwcykgPyAnb2snIDogJ2tvJ1xyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcbn1cclxuXHJcbiQkLmdldFNlcnZpY2VzID0gZnVuY3Rpb24oZGVwcykge1xyXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBnZXRTZXJ2aWNlcycsIGRlcHMpXHJcblx0cmV0dXJuIGRlcHMubWFwKGZ1bmN0aW9uKGRlcE5hbWUpIHtcclxuXHRcdHZhciBzcnYgPSBzZXJ2aWNlc1tkZXBOYW1lXVxyXG5cdFx0aWYgKHNydikge1xyXG5cdFx0XHRpZiAoc3J2LnN0YXR1cyA9PSAnbm90bG9hZGVkJykge1xyXG5cdFx0XHRcdHZhciBkZXBzMiA9ICQkLmdldFNlcnZpY2VzKHNydi5kZXBzKVxyXG5cdFx0XHRcdHZhciBjb25maWcgPSBzcnYuY29uZmlnIHx8IHt9XHJcblx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBpbnN0YW5jZSBzZXJ2aWNlICcke2RlcE5hbWV9JyB3aXRoIGNvbmZpZ2AsIGNvbmZpZylcclxuXHRcdFx0XHR2YXIgYXJncyA9IFtjb25maWddLmNvbmNhdChkZXBzMilcclxuXHRcdFx0XHRzcnYub2JqID0gc3J2LmZuLmFwcGx5KG51bGwsIGFyZ3MpXHJcblx0XHRcdFx0c3J2LnN0YXR1cyA9ICdyZWFkeSdcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc3J2Lm9ialx0XHRcdFx0XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Ly9zcnYuc3RhdHVzID0gJ25vdHJlZ2lzdGVyZWQnXHJcblx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHNlcnZpY2UgJyR7ZGVwTmFtZX0nIGlzIG5vdCByZWdpc3RlcmVkYClcclxuXHRcdH1cclxuXHJcblx0fSlcclxufVxyXG5cclxuXHJcblxyXG4kJC5jb25maWd1cmVTZXJ2aWNlID0gZnVuY3Rpb24obmFtZSwgY29uZmlnKSB7XHJcblx0Y29uc29sZS5sb2coJ1tDb3JlXSBjb25maWd1cmVTZXJ2aWNlJywgbmFtZSwgY29uZmlnKVxyXG5cdGlmICh0eXBlb2YgbmFtZSAhPSAnc3RyaW5nJyB8fCB0eXBlb2YgY29uZmlnICE9ICdvYmplY3QnKSB7XHJcblx0XHRjb25zb2xlLndhcm4oJ1tDb3JlXSBjb25maWd1cmVTZXJ2aWNlIGNhbGxlZCB3aXRoIGJhZCBhcmd1bWVudHMnKVxyXG5cdFx0cmV0dXJuXHJcblx0fSBcdFxyXG5cclxuXHR2YXIgc3J2ID0gc2VydmljZXNbbmFtZV1cclxuXHRpZiAoc3J2KSB7XHJcblx0XHRzcnYuY29uZmlnID0gY29uZmlnXHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0Y29uc29sZS53YXJuKGBbY29uZmlndXJlU2VydmljZV0gc2VydmljZSAnJHtuYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxyXG5cdH1cclxuXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyU2VydmljZSA9IGZ1bmN0aW9uKG5hbWUsIGFyZzEsIGFyZzIpIHtcclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnc2VydmljZXMnLCBuYW1lLCBhcmcxLCBhcmcyKVxyXG59XHJcblxyXG4kJC5nZXRSZWdpc3RlcmVkU2VydmljZXMgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgcmV0ID0gW11cclxuXHRmb3IodmFyIGsgaW4gc2VydmljZXMpIHtcclxuXHRcdHZhciBpbmZvID0gc2VydmljZXNba11cclxuXHRcdHJldC5wdXNoKHtuYW1lOiBrLCBzdGF0dXM6IGluZm8uc3RhdHVzfSlcclxuXHR9XHJcblx0cmV0dXJuIHJldFxyXG59XHJcblxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4ucHJvY2Vzc0JpbmRpbmdzID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0dmFyIGRhdGEgPSB7fVxyXG5cclxuXHRcdHRoaXMuYm5GaW5kKCdibi1iaW5kJywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHRkYXRhW3Zhck5hbWVdID0gZWx0XHJcblx0XHR9KVxyXG5cdFx0dGhpcy5ibkZpbmQoJ2JuLWlmYWNlJywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHRkYXRhW3Zhck5hbWVdID0gZWx0LmludGVyZmFjZSgpXHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIGRhdGFcclxuXHRcclxuXHR9XHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHRcclxuXHJcblx0JC5mbi5nZXRPcHRpb25zID0gZnVuY3Rpb24oZGVmYXVsdFZhbHVlcykge1xyXG5cclxuXHRcdHZhciB2YWx1ZXMgPSBkZWZhdWx0VmFsdWVzIHx8IHt9XHJcblxyXG5cdFx0dmFyIG9wdGlvbnMgPSB0aGlzLmRhdGEoJyRvcHRpb25zJylcclxuXHRcdGlmICh0eXBlb2Ygb3B0aW9ucyAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRvcHRpb25zID0ge31cclxuXHRcdH1cdFxyXG5cclxuXHRcdHZhciBwYXJhbXNWYWx1ZSA9IHt9XHJcblx0XHRmb3IodmFyIGsgaW4gdmFsdWVzKSB7XHJcblx0XHRcdHBhcmFtc1ZhbHVlW2tdID0gdGhpcy5kYXRhKGspXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuICQuZXh0ZW5kKHZhbHVlcywgb3B0aW9ucywgcGFyYW1zVmFsdWUpXHJcblx0XHRcdFxyXG5cdH1cclxuXHJcblx0JC5mbi5nZXRQYXJlbnRJbnRlcmZhY2UgPSBmdW5jdGlvbihwYXJlbnRDdHJsTmFtZSkge1xyXG5cdFx0dmFyIHBhcmVudCA9IHRoaXMucGFyZW50KClcclxuXHRcdGlmICghcGFyZW50Lmhhc0NsYXNzKHBhcmVudEN0cmxOYW1lKSkge1xyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdHJldHVybiBwYXJlbnQuaW50ZXJmYWNlKClcdFx0XHJcblx0fVxyXG5cclxuXHQkLmZuLnByb2Nlc3NDb250cm9scyA9IGZ1bmN0aW9uKCBkYXRhKSB7XHJcblxyXG5cdFx0ZGF0YSA9IGRhdGEgfHwge31cclxuXHJcblx0XHR0aGlzLmJuRmlsdGVyKCdbYm4tY29udHJvbF0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxyXG5cclxuXHRcdFx0dmFyIGNvbnRyb2xOYW1lID0gZWx0LmF0dHIoJ2JuLWNvbnRyb2wnKVxyXG5cdFx0XHRlbHQucmVtb3ZlQXR0cignYm4tY29udHJvbCcpXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2NvbnRyb2xOYW1lJywgY29udHJvbE5hbWUpXHJcblxyXG5cclxuXHJcblx0XHRcdCQkLmNyZWF0ZUNvbnRyb2woY29udHJvbE5hbWUsIGVsdClcclxuXHRcdH0pXHJcblxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHJcblx0fVx0XHJcblxyXG5cdCQuZm4uaW50ZXJmYWNlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gKHRoaXMubGVuZ3RoID09IDApID8gbnVsbCA6IHRoaXMuZ2V0KDApLmN0cmxcclxuXHR9XHJcblxyXG5cdCQuZm4uZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Y29uc29sZS5sb2coJ1tDb3JlXSBkaXNwb3NlJylcclxuXHRcdHRoaXMuZmluZCgnLkN1c3RvbUNvbnRyb2wnKS5lYWNoKGZ1bmN0aW9uKCkge1x0XHRcclxuXHRcdFx0dmFyIGlmYWNlID0gJCh0aGlzKS5pbnRlcmZhY2UoKVxyXG5cdFx0XHRpZiAodHlwZW9mIGlmYWNlID09ICdvYmplY3QnICYmIHR5cGVvZiBpZmFjZS5kaXNwb3NlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRpZmFjZS5kaXNwb3NlKClcclxuXHRcdFx0fVxyXG5cdFx0XHRkZWxldGUgJCh0aGlzKS5nZXQoMCkuY3RybFxyXG5cdFx0fSlcclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4ucHJvY2Vzc0V2ZW50cyA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ3Byb2Nlc3NFdmVudHMnLCBkYXRhKVxyXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFtjb3JlXSBwcm9jZXNzRXZlbnRzIGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblx0XHR0aGlzLmJuRmluZEV4KCdibi1ldmVudCcsIHRydWUsIGZ1bmN0aW9uKGVsdCwgYXR0ck5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tZXZlbnQnLCBhdHRyTmFtZSwgdmFyTmFtZSlcclxuXHRcdFx0dmFyIGYgPSBhdHRyTmFtZS5zcGxpdCgnLicpXHJcblx0XHRcdHZhciBldmVudE5hbWUgPSBmWzBdXHJcblx0XHRcdHZhciBzZWxlY3RvciA9IGZbMV1cclxuXHJcblx0XHRcdHZhciBmbiA9IGRhdGFbdmFyTmFtZV1cclxuXHRcdFx0aWYgKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0dmFyIGlmYWNlID0gZWx0LmludGVyZmFjZSgpXHJcblx0XHRcdFx0aWYgKGlmYWNlICYmIHR5cGVvZiBpZmFjZS5vbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRpZmFjZS5vbihldmVudE5hbWUsIGZuLmJpbmQoaWZhY2UpKVxyXG5cdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR2YXIgdXNlTmF0aXZlRXZlbnRzID0gWydtb3VzZWVudGVyJywgJ21vdXNlbGVhdmUnXS5pbmRleE9mKGV2ZW50TmFtZSkgIT0gLTFcclxuXHJcblx0XHRcdFx0aWYgKHNlbGVjdG9yICE9IHVuZGVmaW5lZCkge1xyXG5cclxuXHRcdFx0XHRcdGlmICh1c2VOYXRpdmVFdmVudHMpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LmdldCgwKS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gJChldi50YXJnZXQpXHJcblx0XHRcdFx0XHRcdFx0aWYgKHRhcmdldC5oYXNDbGFzcyhzZWxlY3RvcikpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGZuLmNhbGwoZXYudGFyZ2V0LCBldilcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRlbHQub24oZXZlbnROYW1lLCAnLicgKyBzZWxlY3RvciwgZm4pXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGlmICh1c2VOYXRpdmVFdmVudHMpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LmdldCgwKS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGZuLmNhbGwoZXYudGFyZ2V0LCBldilcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0ZWx0Lm9uKGV2ZW50TmFtZSwgZm4pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc0V2ZW50czogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhIGZ1bmN0aW9uIGRlZmluZWQgaW4gZGF0YWAsIGRhdGEpXHJcblx0XHRcdH1cdFx0XHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHRcclxuXHR9XHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHR5cGUgPSB0aGlzLmF0dHIoJ3R5cGUnKVxyXG5cdFx0aWYgKHRoaXMuZ2V0KDApLnRhZ05hbWUgPT0gJ0lOUFVUJyAmJiB0eXBlID09ICdjaGVja2JveCcpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucHJvcCgnY2hlY2tlZCcpXHJcblx0XHR9XHJcblx0XHR2YXIgaWZhY2UgPSB0aGlzLmludGVyZmFjZSgpXHJcblx0XHRpZiAoaWZhY2UgJiYgdHlwZW9mIGlmYWNlLmdldFZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0cmV0dXJuIGlmYWNlLmdldFZhbHVlKClcclxuXHRcdH1cclxuXHRcdHZhciByZXQgPSB0aGlzLnZhbCgpXHJcblxyXG5cdFx0aWYgKHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAncmFuZ2UnKSB7XHJcblx0XHRcdHJldCA9IHBhcnNlRmxvYXQocmV0KVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHJldFxyXG5cdH1cclxuXHJcblxyXG5cdCQuZm4uc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0aWYgKHRoaXMuZ2V0KDApLnRhZ05hbWUgPT0gJ0lOUFVUJyAmJiB0aGlzLmF0dHIoJ3R5cGUnKSA9PSAnY2hlY2tib3gnKSB7XHJcblx0XHRcdHRoaXMucHJvcCgnY2hlY2tlZCcsIHZhbHVlKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgaWZhY2UgPSB0aGlzLmludGVyZmFjZSgpXHJcblx0XHRpZiAoaWZhY2UgJiYgdHlwZW9mIGlmYWNlLnNldFZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0aWZhY2Uuc2V0VmFsdWUodmFsdWUpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy52YWwodmFsdWUpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblxyXG5cdCQuZm4uZ2V0Rm9ybURhdGEgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciByZXQgPSB7fVxyXG5cdFx0dGhpcy5maW5kKCdbbmFtZV0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxyXG5cdFx0XHR2YXIgbmFtZSA9IGVsdC5hdHRyKCduYW1lJylcclxuXHRcdFx0cmV0W25hbWVdID0gZWx0LmdldFZhbHVlKClcclxuXHJcblx0XHR9KVxyXG5cclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cdCQuZm4uc2V0Rm9ybURhdGEgPSBmdW5jdGlvbihkYXRhKSB7XHJcblxyXG5cdFx0Zm9yKHZhciBuYW1lIGluIGRhdGEpIHtcclxuXHRcdFx0dmFyIGVsdCA9IHRoaXMuZmluZChgW25hbWU9JHtuYW1lfV1gKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW25hbWVdXHJcblx0XHRcdGVsdC5zZXRWYWx1ZSh2YWx1ZSlcclxuXHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxuXHQkLmZuLnByb2Nlc3NGb3JtRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0Zvcm1EYXRhIGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmJuRmluZCgnYm4tZm9ybScsIGZhbHNlLCBmdW5jdGlvbihlbHQsIHZhck5hbWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXHJcblx0XHRcdHZhciB2YWx1ZSA9IGRhdGFbdmFyTmFtZV1cclxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jykge1xyXG5cdFx0XHRcdGVsdC5zZXRGb3JtRGF0YSh2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBwcm9jZXNzRm9ybURhdGE6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gb2JqZWN0IGRlZmluZWQgaW4gZGF0YWAsIGRhdGEpXHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHRcclxuXHR9XHJcblxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHQkLmZuLnByb2Nlc3NDb250ZXh0TWVudSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0NvbnRleHRNZW51IGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmJuRmluZCgnYm4tbWVudScsIHRydWUsIGZ1bmN0aW9uKGVsdCwgdmFyTmFtZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibi10ZXh0JywgdmFyTmFtZSlcclxuXHRcdFx0dmFyIHZhbHVlID0gZGF0YVt2YXJOYW1lXVxyXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnKSB7XHJcblx0XHRcdFx0dmFyIGlkID0gZWx0LnVuaXF1ZUlkKCkuYXR0cignaWQnKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbcHJvY2Vzc0NvbnRleHRNZW51XSBpZCcsIGlkKVxyXG5cdFx0XHRcdCQuY29udGV4dE1lbnUoe1xyXG5cdFx0XHRcdFx0c2VsZWN0b3I6ICcjJyArIGlkLFxyXG5cdFx0XHRcdFx0Y2FsbGJhY2s6IGZ1bmN0aW9uKGtleSkge1xyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbcHJvY2Vzc0NvbnRleHRNZW51XSBjYWxsYmFjaycsIGtleSlcclxuXHRcdFx0XHRcdFx0ZWx0LnRyaWdnZXIoJ21lbnVDaGFuZ2UnLCBba2V5XSlcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRpdGVtczogdmFsdWVcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NDb250ZXh0TWVudTogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBvYmplY3QgZGVmaW5lZCBpbiBkYXRhYCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdFxyXG5cdH1cclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0ZnVuY3Rpb24gc3BsaXRBdHRyKGF0dHJWYWx1ZSwgY2JrKSB7XHJcblx0XHRhdHRyVmFsdWUuc3BsaXQoJywnKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHRcdFx0dmFyIGxpc3QgPSBpdGVtLnNwbGl0KCc6JylcclxuXHRcdFx0aWYgKGxpc3QubGVuZ3RoID09IDIpIHtcclxuXHRcdFx0XHR2YXIgbmFtZSA9IGxpc3RbMF0udHJpbSgpXHJcblx0XHRcdFx0dmFyIHZhbHVlID0gbGlzdFsxXS50cmltKClcclxuXHRcdFx0XHRjYmsobmFtZSwgdmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS5lcnJvcihgW0NvcmVdIHNwbGl0QXR0cigke2F0dHJOYW1lfSkgJ2F0dHJWYWx1ZScgbm90IGNvcnJlY3Q6YCwgaXRlbSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRWYXJWYWx1ZSh2YXJOYW1lLCBkYXRhKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdnZXRWYXJWYWx1ZScsIHZhck5hbWUsIGRhdGEpXHJcblx0XHR2YXIgcmV0ID0gZGF0YVxyXG5cdFx0Zm9yKGxldCBmIG9mIHZhck5hbWUuc3BsaXQoJy4nKSkge1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKHR5cGVvZiByZXQgPT0gJ29iamVjdCcgJiYgZiBpbiByZXQpIHtcclxuXHRcdFx0XHRyZXQgPSByZXRbZl1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUud2FybihgW0NvcmVdIGdldFZhclZhbHVlOiBhdHRyaWJ1dCAnJHt2YXJOYW1lfScgaXMgbm90IGluIG9iamVjdDpgLCBkYXRhKVxyXG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWRcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnZicsIGYsICdyZXQnLCByZXQpXHJcblx0XHR9XHJcblx0XHQvL2NvbnNvbGUubG9nKCdyZXQnLCByZXQpXHJcblx0XHRyZXR1cm4gcmV0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZuKSB7XHJcblxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGdldFZhbHVlJywgdmFyTmFtZSwgY3R4KVxyXG5cclxuXHRcdHZhciBub3QgPSBmYWxzZVxyXG5cdFx0aWYgKHZhck5hbWUuc3RhcnRzV2l0aCgnIScpKSB7XHJcblx0XHRcdHZhck5hbWUgPSB2YXJOYW1lLnN1YnN0cigxKVxyXG5cdFx0XHRub3QgPSB0cnVlXHJcblx0XHR9XHRcdFx0XHJcblxyXG5cdFx0dmFyIHByZWZpeE5hbWUgPSB2YXJOYW1lLnNwbGl0KCcuJylbMF1cclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBwcmVmaXhOYW1lJywgcHJlZml4TmFtZSlcclxuXHRcdGlmIChjdHgudmFyc1RvVXBkYXRlICYmIGN0eC52YXJzVG9VcGRhdGUuaW5kZXhPZihwcmVmaXhOYW1lKSA8IDApIHtcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGZ1bmMgPSBjdHguZGF0YVt2YXJOYW1lXVxyXG5cdFx0dmFyIHZhbHVlXHJcblxyXG5cdFx0aWYgKHR5cGVvZiBmdW5jID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0dmFsdWUgPSBmdW5jLmNhbGwoY3R4LmRhdGEpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dmFsdWUgPSBnZXRWYXJWYWx1ZSh2YXJOYW1lLCBjdHguZGF0YSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdC8vY29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc1RlbXBsYXRlOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGRlZmluZWQgaW4gb2JqZWN0IGRhdGE6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblx0XHQvL2NvbnNvbGUubG9nKCd2YWx1ZScsIHZhbHVlKVxyXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicgJiYgbm90KSB7XHJcblx0XHRcdHZhbHVlID0gIXZhbHVlXHJcblx0XHR9XHJcblx0XHRmbih2YWx1ZSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuSWYoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG5cdFx0XHRcdGN0eC5lbHQucmVtb3ZlKClcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBiblNob3coY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuXHRcdFx0XHRjdHguZWx0LmJuVmlzaWJsZSh2YWx1ZSlcclxuXHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGJuLXNob3c6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gYm9vbGVhbmAsIGRhdGEpXHJcblx0XHRcdH1cclxuXHRcdH0pXHRcdFxyXG5cdH1cclxuXHJcblxyXG5cdGZ1bmN0aW9uIGJuRWFjaChjdHgpIHtcclxuXHRcdHZhciBmID0gY3R4LmRpclZhbHVlLnNwbGl0KCcgJylcclxuXHRcdGlmIChmLmxlbmd0aCAhPSAzIHx8IGZbMV0gIT0gJ29mJykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKCdbQ29yZV0gYm4tZWFjaCBjYWxsZWQgd2l0aCBiYWQgYXJndW1lbnRzOicsIGRpclZhbHVlKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdHZhciBpdGVyID0gZlswXVxyXG5cdFx0dmFyIHZhck5hbWUgPSBmWzJdXHJcblx0XHQvL2NvbnNvbGUubG9nKCdibi1lYWNoIGl0ZXInLCBpdGVyLCAgY3R4LnRlbXBsYXRlKVxyXG5cdFx0XHJcblx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cclxuXHRcdFx0XHRjdHguZWx0LmVtcHR5KClcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR2YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHRcdFx0XHRcdHZhciBpdGVtRGF0YSA9ICQuZXh0ZW5kKHt9LCBjdHguZGF0YSlcclxuXHRcdFx0XHRcdGl0ZW1EYXRhW2l0ZXJdID0gaXRlbVxyXG5cdFx0XHRcdFx0dmFyICRpdGVtID0gJChjdHgudGVtcGxhdGUpXHJcblx0XHRcdFx0XHQkaXRlbS5wcm9jZXNzVUkoaXRlbURhdGEpXHJcblx0XHRcdFx0XHRjdHguZWx0LmFwcGVuZCgkaXRlbSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHRcclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tZWFjaDogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBhcnJheWAsIGRhdGEpXHJcblx0XHRcdH1cdFx0XHRcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBiblRleHQoY3R4KSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gYm5UZXh0JywgY3R4KVxyXG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGN0eC5lbHQudGV4dCh2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cdFxyXG5cdGZ1bmN0aW9uIGJuSHRtbChjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHguZWx0Lmh0bWwodmFsdWUpXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5Db21ibyhjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHguZWx0LmluaXRDb21ibyh2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBibk9wdGlvbnMoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5kYXRhKCckb3B0aW9ucycsIHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cclxuXHRmdW5jdGlvbiBiblZhbChjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHguZWx0LnNldFZhbHVlKHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cclxuXHRmdW5jdGlvbiBiblByb3AoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihwcm9wTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuXHRcdFx0XHRcdGN0eC5lbHQucHJvcChwcm9wTmFtZSwgdmFsdWUpXHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBibi1wcm9wOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGJvb2xlYW5gLCBkYXRhKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcdFxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuQXR0cihjdHgpIHtcclxuXHRcdHNwbGl0QXR0cihjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKGF0dHJOYW1lLCB2YXJOYW1lKSB7XHJcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRjdHguZWx0LmF0dHIoYXR0ck5hbWUsIHZhbHVlKVxyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuU3R5bGUoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihhdHRyTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0Y3R4LmVsdC5jc3MoYXR0ck5hbWUsIHZhbHVlKVxyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cclxuXHRmdW5jdGlvbiBibkRhdGEoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihhdHRyTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0Y3R4LmVsdC5zZXRQcm9wKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5DbGFzcyhjdHgpIHtcclxuXHRcdHNwbGl0QXR0cihjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHByb3BOYW1lLCB2YXJOYW1lKSB7XHJcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xyXG5cdFx0XHRcdFx0aWYgKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGN0eC5lbHQuYWRkQ2xhc3MocHJvcE5hbWUpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0Y3R4LmVsdC5yZW1vdmVDbGFzcyhwcm9wTmFtZSlcclxuXHRcdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdH1cdFxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tY2xhc3M6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gYm9vbGVhbmAsIGRhdGEpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVx0XHJcblx0XHR9KVxyXG5cdH1cdFxyXG5cclxuXHJcblx0dmFyIGRpck1hcCA9IHtcclxuXHRcdCdibi1lYWNoJzogYm5FYWNoLFx0XHRcdFxyXG5cdFx0J2JuLWlmJzogYm5JZixcclxuXHRcdCdibi10ZXh0JzogYm5UZXh0LFx0XHJcblx0XHQnYm4taHRtbCc6IGJuSHRtbCxcclxuXHRcdCdibi1vcHRpb25zJzogYm5PcHRpb25zLFx0XHRcdFxyXG5cdFx0J2JuLWxpc3QnOiBibkNvbWJvLFx0XHRcdFxyXG5cdFx0J2JuLXZhbCc6IGJuVmFsLFx0XHJcblx0XHQnYm4tcHJvcCc6IGJuUHJvcCxcclxuXHRcdCdibi1hdHRyJzogYm5BdHRyLFx0XHJcblx0XHQnYm4tZGF0YSc6IGJuRGF0YSxcdFx0XHRcclxuXHRcdCdibi1jbGFzcyc6IGJuQ2xhc3MsXHJcblx0XHQnYm4tc2hvdyc6IGJuU2hvdyxcclxuXHRcdCdibi1zdHlsZSc6IGJuU3R5bGVcclxuXHR9XHJcblxyXG5cdCQuZm4uc2V0UHJvcCA9IGZ1bmN0aW9uKGF0dHJOYW1lLCB2YWx1ZSkge1xyXG5cdFx0dmFyIGlmYWNlID0gdGhpcy5pbnRlcmZhY2UoKVxyXG5cdFx0aWYgKGlmYWNlICYmIGlmYWNlLnNldFByb3ApIHtcclxuXHRcdFx0aWZhY2Uuc2V0UHJvcChhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy5kYXRhKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdH1cclxuXHJcblxyXG5cclxuXHQkLmZuLnByb2Nlc3NUZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBwcm9jZXNzVGVtcGxhdGUnKVxyXG5cdFx0dmFyIHRoYXQgPSB0aGlzXHJcblxyXG5cdFx0dmFyIGRpckxpc3QgPSBbXVxyXG5cclxuXHRcdGZvcihsZXQgayBpbiBkaXJNYXApIHtcclxuXHRcdFx0dGhpcy5ibkZpbmQoaywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCBkaXJWYWx1ZSkge1xyXG5cdFx0XHRcdHZhciB0ZW1wbGF0ZVxyXG5cdFx0XHRcdGlmIChrID09ICdibi1lYWNoJykge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGUgPSBlbHQuY2hpbGRyZW4oKS5yZW1vdmUoKS5nZXQoMCkub3V0ZXJIVE1MXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd0ZW1wbGF0ZScsIHRlbXBsYXRlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoayA9PSAnYm4tdmFsJykge1xyXG5cdFx0XHRcdFx0ZWx0LmRhdGEoJyR2YWwnLCBkaXJWYWx1ZSlcclxuXHRcdFx0XHRcdHZhciB1cGRhdGVFdmVudCA9IGVsdC5hdHRyKCdibi11cGRhdGUnKVxyXG5cdFx0XHRcdFx0aWYgKHVwZGF0ZUV2ZW50ICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0XHRlbHQucmVtb3ZlQXR0cignYm4tdXBkYXRlJylcclxuXHRcdFx0XHRcdFx0ZWx0Lm9uKHVwZGF0ZUV2ZW50LCBmdW5jdGlvbihldiwgdWkpIHtcclxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd1aScsIHVpKVxyXG5cclxuXHRcdFx0XHRcdFx0XHR2YXIgdmFsdWUgPSAodWkgJiYgIHVpLnZhbHVlKSB8fCAgJCh0aGlzKS5nZXRWYWx1ZSgpXHJcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndmFsdWUnLCB2YWx1ZSlcclxuXHRcdFx0XHRcdFx0XHR0aGF0LnRyaWdnZXIoJ2RhdGE6dXBkYXRlJywgW2RpclZhbHVlLCB2YWx1ZSwgZWx0XSlcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGRpckxpc3QucHVzaCh7ZGlyZWN0aXZlOiBrLCBlbHQ6IGVsdCwgZGlyVmFsdWU6IGRpclZhbHVlLCB0ZW1wbGF0ZTogdGVtcGxhdGV9KVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChkYXRhKSB7XHJcblx0XHRcdHRoaXMudXBkYXRlVGVtcGxhdGUoZGlyTGlzdCwgZGF0YSlcclxuXHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdHJldHVybiBkaXJMaXN0XHJcblxyXG5cdH1cdFxyXG5cclxuXHQkLmZuLnVwZGF0ZVRlbXBsYXRlID0gZnVuY3Rpb24oZGlyTGlzdCwgZGF0YSwgdmFyc1RvVXBkYXRlLCBleGNsdWRlRWx0KSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdbY29yZV0gdXBkYXRlVGVtcGxhdGUnLCBkYXRhLCB2YXJzVG9VcGRhdGUpXHJcblxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdkYXRhJywgZGF0YSlcclxuXHRcdHZhcnNUb1VwZGF0ZSA9IHZhcnNUb1VwZGF0ZSB8fCBPYmplY3Qua2V5cyhkYXRhKVxyXG5cdFx0Ly9jb25zb2xlLmxvZygndmFyc1RvVXBkYXRlJywgdmFyc1RvVXBkYXRlKVxyXG5cclxuXHRcdGRpckxpc3QuZm9yRWFjaChmdW5jdGlvbihkaXJJdGVtKSB7XHJcblx0XHRcdHZhciBmbiA9IGRpck1hcFtkaXJJdGVtLmRpcmVjdGl2ZV1cclxuXHRcdFx0aWYgKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nICYmIGRpckl0ZW0uZWx0ICE9IGV4Y2x1ZGVFbHQpIHtcclxuXHRcdFx0XHRkaXJJdGVtLmRhdGEgPSBkYXRhO1xyXG5cdFx0XHRcdGRpckl0ZW0udmFyc1RvVXBkYXRlID0gdmFyc1RvVXBkYXRlO1xyXG5cdFx0XHRcdGZuKGRpckl0ZW0pXHJcblx0XHRcdH1cclxuXHRcdH0pXHRcdFx0XHJcblx0XHRcclxuXHJcblx0XHRcclxuXHRcdHJldHVybiB0aGlzXHJcblxyXG5cdH1cdFxyXG5cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkLmZuLnByb2Nlc3NVSSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ3Byb2Nlc3NVSScsIGRhdGEsIHRoaXMuaHRtbCgpKVxyXG5cdFx0dmFyIGRpckxpc3QgPSB0aGlzLnByb2Nlc3NUZW1wbGF0ZShkYXRhKVxyXG5cdFx0dGhpcy5wcm9jZXNzQ29udHJvbHMoZGF0YSlcclxuXHRcdC5wcm9jZXNzRm9ybURhdGEoZGF0YSlcclxuXHRcdC5wcm9jZXNzQ29udGV4dE1lbnUoZGF0YSlcclxuXHRcdHJldHVybiBkaXJMaXN0XHJcblx0fVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4uYm5GaWx0ZXIgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG5cdFx0cmV0dXJuIHRoaXMuZmluZChzZWxlY3RvcikuYWRkKHRoaXMuZmlsdGVyKHNlbGVjdG9yKSlcclxuXHR9XHJcblxyXG5cdCQuZm4uYm5GaW5kID0gZnVuY3Rpb24oYXR0ck5hbWUsIHJlbW92ZUF0dHIsIGNiaykge1xyXG5cdFx0dGhpcy5ibkZpbHRlcihgWyR7YXR0ck5hbWV9XWApLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBlbHQgPSAkKHRoaXMpXHJcblx0XHRcdHZhciBhdHRyVmFsdWUgPSBlbHQuYXR0cihhdHRyTmFtZSlcclxuXHRcdFx0aWYgKHJlbW92ZUF0dHIpIHtcclxuXHRcdFx0XHRlbHQucmVtb3ZlQXR0cihhdHRyTmFtZSlcclxuXHRcdFx0fVx0XHRcclxuXHRcdFx0Y2JrKGVsdCwgYXR0clZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdCQuZm4uYm5GaW5kRXggPSBmdW5jdGlvbihhdHRyTmFtZSwgcmVtb3ZlQXR0ciwgY2JrKSB7XHJcblx0XHR0aGlzLmJuRmluZChhdHRyTmFtZSwgcmVtb3ZlQXR0ciwgZnVuY3Rpb24oZWx0LCBhdHRyVmFsdWUpIHtcclxuXHRcdFx0YXR0clZhbHVlLnNwbGl0KCcsJykuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XHJcblx0XHRcdFx0dmFyIGxpc3QgPSBpdGVtLnNwbGl0KCc6JylcclxuXHRcdFx0XHRpZiAobGlzdC5sZW5ndGggPT0gMikge1xyXG5cdFx0XHRcdFx0dmFyIG5hbWUgPSBsaXN0WzBdLnRyaW0oKVxyXG5cdFx0XHRcdFx0dmFyIHZhbHVlID0gbGlzdFsxXS50cmltKClcclxuXHRcdFx0XHRcdGNiayhlbHQsIG5hbWUsIHZhbHVlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFtDb3JlXSBibkZpbmRFeCgke2F0dHJOYW1lfSkgJ2F0dHJWYWx1ZScgbm90IGNvcnJlY3Q6YCwgaXRlbSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0JC5mbi5iblZpc2libGUgPSBmdW5jdGlvbihpc1Zpc2libGUpIHtcclxuXHRcdGlmIChpc1Zpc2libGUpIHtcclxuXHRcdFx0dGhpcy5zaG93KClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aGlzLmhpZGUoKVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXNcdFxyXG5cdH1cclxuXHJcblx0JC5mbi5pbml0Q29tYm8gPSBmdW5jdGlvbih2YWx1ZXMpIHtcclxuXHRcdHRoaXNcclxuXHRcdC5lbXB0eSgpXHJcblx0XHQuYXBwZW5kKHZhbHVlcy5tYXAoZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0cmV0dXJuIGA8b3B0aW9uIHZhbHVlPSR7dmFsdWV9PiR7dmFsdWV9PC9vcHRpb24+YFxyXG5cdFx0fSkpXHJcblxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHR9XHJcblxyXG5cclxufSkoKTtcclxuIiwiJCQuc2hvd0FsZXJ0ID0gZnVuY3Rpb24odGV4dCwgdGl0bGUsIGNhbGxiYWNrKSB7XHJcblx0dGl0bGUgPSB0aXRsZSB8fCAnSW5mb3JtYXRpb24nXHJcblx0JCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHRcdC5hcHBlbmQoJCgnPHA+JykuaHRtbCh0ZXh0KSlcclxuXHRcdC5kaWFsb2coe1xyXG5cdFx0XHRjbGFzc2VzOiB7XHJcblx0XHRcdFx0J3VpLWRpYWxvZy10aXRsZWJhci1jbG9zZSc6ICduby1jbG9zZSdcclxuXHRcdFx0fSxcclxuXHRcdFx0d2lkdGg6ICdhdXRvJyxcclxuXHRcdFx0bW9kYWw6IHRydWUsXHJcblx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnZGVzdHJveScpXHJcblx0XHRcdH0sXHJcblx0XHRcdGJ1dHRvbnM6IFtcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnQ2xvc2UnLFxyXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0XHRjYWxsYmFjaygpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdF1cclxuXHRcdH0pXHJcbn07XHRcclxuXHJcbiIsIiQkLnNob3dDb25maXJtID0gZnVuY3Rpb24odGV4dCwgdGl0bGUsIGNhbGxiYWNrKSB7XHJcblx0dGl0bGUgPSB0aXRsZSB8fCAnSW5mb3JtYXRpb24nXHJcblx0JCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHRcdC5hcHBlbmQoJCgnPHA+JykuaHRtbCh0ZXh0KSlcclxuXHRcdC5kaWFsb2coe1xyXG5cclxuXHRcdFx0bW9kYWw6IHRydWUsXHJcblxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRidXR0b25zOiBbXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0dGV4dDogJ0NhbmNlbCcsXHJcblx0XHRcdFx0XHQvL2NsYXNzOiAndzMtYnV0dG9uIHczLXJlZCBibi1uby1jb3JuZXInLFxyXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRleHQ6ICdPSycsXHJcblx0XHRcdFx0XHQvL2NsYXNzOiAndzMtYnV0dG9uIHczLWJsdWUgYm4tbm8tY29ybmVyJyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVx0XHRcdFx0XHRcclxuXHRcdFx0XVxyXG5cdFx0fSlcclxufTtcclxuXHRcclxuXHJcbiIsIiQkLnNob3dQaWN0dXJlID0gZnVuY3Rpb24odGl0bGUsIHBpY3R1cmVVcmwpIHtcclxuXHQkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxyXG5cdFx0LmFwcGVuZCgkKCc8ZGl2PicsIHtjbGFzczogJ2JuLWZsZXgtY29sIGJuLWFsaWduLWNlbnRlcid9KVxyXG5cdFx0XHQuYXBwZW5kKCQoJzxpbWc+Jywge3NyYzogcGljdHVyZVVybH0pKVxyXG5cdFx0KVxyXG5cdFx0LmRpYWxvZyh7XHJcblxyXG5cdFx0XHRtb2RhbDogdHJ1ZSxcclxuXHRcdFx0d2lkdGg6ICdhdXRvJyxcclxuXHRcdFx0bWF4SGVpZ2h0OiA2MDAsXHJcblx0XHRcdG1heFdpZHRoOiA2MDAsXHJcblx0XHRcdC8vcG9zaXRpb246IHtteTogJ2NlbnRlciBjZW50ZXInLCBhdDogJ2NlbnRlciBjZW50ZXInfSxcclxuXHJcblx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnZGVzdHJveScpXHJcblx0XHRcdH1cclxuXHJcblx0XHR9KVxyXG59O1xyXG5cclxuXHJcblxyXG4iLCIkJC5zaG93UHJvbXB0ID0gZnVuY3Rpb24obGFiZWwsIHRpdGxlLCBjYWxsYmFjaywgb3B0aW9ucykge1xyXG5cdHRpdGxlID0gdGl0bGUgfHwgJ0luZm9ybWF0aW9uJ1xyXG5cdG9wdGlvbnMgPSAkLmV4dGVuZCh7dHlwZTogJ3RleHQnfSwgb3B0aW9ucylcclxuXHQvL2NvbnNvbGUubG9nKCdvcHRpb25zJywgb3B0aW9ucylcclxuXHJcblx0dmFyIGRpdiA9ICQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblx0XHQuYXBwZW5kKCQoJzxmb3JtPicpXHJcblx0XHRcdC5hcHBlbmQoJCgnPHA+JykudGV4dChsYWJlbCkpXHJcblx0XHRcdC5hcHBlbmQoJCgnPGlucHV0PicsIHtjbGFzczogJ3ZhbHVlJ30pLmF0dHIob3B0aW9ucykucHJvcCgncmVxdWlyZWQnLCB0cnVlKS5jc3MoJ3dpZHRoJywgJzEwMCUnKSlcclxuXHRcdFx0LmFwcGVuZCgkKCc8aW5wdXQ+Jywge3R5cGU6ICdzdWJtaXQnfSkuaGlkZSgpKVxyXG5cdFx0XHQub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxyXG5cdFx0XHRcdGRpdi5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdHZhciB2YWwgPSBkaXYuZmluZCgnLnZhbHVlJykudmFsKClcclxuXHRcdFx0XHRcdGNhbGxiYWNrKHZhbClcclxuXHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0fSlcclxuXHRcdClcclxuXHRcdC5kaWFsb2coe1xyXG5cdFx0XHRjbGFzc2VzOiB7XHJcblx0XHRcdFx0J3VpLWRpYWxvZy10aXRsZWJhci1jbG9zZSc6ICduby1jbG9zZSdcclxuXHRcdFx0fSxcclxuXHRcdFx0bW9kYWw6IHRydWUsXHJcblx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnZGVzdHJveScpXHJcblx0XHRcdH0sXHJcblx0XHRcdGJ1dHRvbnM6IFtcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnQ2FuY2VsJyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRleHQ6ICdBcHBseScsXHJcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuZmluZCgnW3R5cGU9c3VibWl0XScpLmNsaWNrKClcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdF1cclxuXHRcdH0pXHJcbn07XHJcblxyXG4iLCIoZnVuY3Rpb24oKXtcclxuXHJcblx0XHJcblx0ZnVuY3Rpb24gaXNPYmplY3QoYSkge1xyXG5cdFx0cmV0dXJuICh0eXBlb2YgYSA9PSAnb2JqZWN0JykgJiYgIUFycmF5LmlzQXJyYXkoYSlcclxuXHR9XHJcblxyXG5cdCQkLmNoZWNrVHlwZSA9IGZ1bmN0aW9uKHZhbHVlLCB0eXBlLCBpc09wdGlvbmFsKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdjaGVja1R5cGUnLHZhbHVlLCB0eXBlLCBpc09wdGlvbmFsKVxyXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAndW5kZWZpbmVkJyAmJiBpc09wdGlvbmFsID09PSB0cnVlKSB7XHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiB0eXBlID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdHJldHVybiB0eXBlb2YgdmFsdWUgPT0gdHlwZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkodHlwZSkpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHR5cGUubGVuZ3RoID09IDApIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZSAvLyBubyBpdGVtIHR5cGUgY2hlY2tpbmdcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IobGV0IGkgb2YgdmFsdWUpIHtcclxuXHRcdFx0XHR2YXIgcmV0ID0gZmFsc2VcclxuXHRcdFx0XHRmb3IobGV0IHQgb2YgdHlwZSkge1xyXG5cdFx0XHRcdFx0cmV0IHw9ICQkLmNoZWNrVHlwZShpLCB0KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoIXJldCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpc09iamVjdCh0eXBlKSkge1xyXG5cdFx0XHRpZiAoIWlzT2JqZWN0KHZhbHVlKSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9XHJcblx0XHRcdGZvcihsZXQgZiBpbiB0eXBlKSB7XHJcblxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2YnLCBmLCAndmFsdWUnLCB2YWx1ZSlcclxuXHRcdFx0XHR2YXIgbmV3VHlwZSA9IHR5cGVbZl1cclxuXHJcblx0XHRcdFx0dmFyIGlzT3B0aW9uYWwgPSBmYWxzZVxyXG5cdFx0XHRcdGlmIChmLnN0YXJ0c1dpdGgoJyQnKSkge1xyXG5cdFx0XHRcdFx0ZiA9IGYuc3Vic3RyKDEpXHJcblx0XHRcdFx0XHRpc09wdGlvbmFsID0gdHJ1ZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoISQkLmNoZWNrVHlwZSh2YWx1ZVtmXSwgbmV3VHlwZSwgaXNPcHRpb25hbCkpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gZmFsc2VcclxuXHR9XHRcclxuXHJcblxyXG59KSgpO1xyXG4iLCIkJC5kYXRhVVJMdG9CbG9iID0gZnVuY3Rpb24oZGF0YVVSTCkge1xyXG4gIC8vIERlY29kZSB0aGUgZGF0YVVSTFxyXG4gIHZhciBzcGxpdCA9IGRhdGFVUkwuc3BsaXQoL1s6LDtdLylcclxuICB2YXIgbWltZVR5cGUgPSBzcGxpdFsxXVxyXG4gIHZhciBlbmNvZGFnZSA9IHNwbGl0WzJdXHJcbiAgaWYgKGVuY29kYWdlICE9ICdiYXNlNjQnKSB7XHJcbiAgXHRyZXR1cm5cclxuICB9XHJcbiAgdmFyIGRhdGEgPSBzcGxpdFszXVxyXG5cclxuICBjb25zb2xlLmxvZygnbWltZVR5cGUnLCBtaW1lVHlwZSlcclxuICBjb25zb2xlLmxvZygnZW5jb2RhZ2UnLCBlbmNvZGFnZSlcclxuICAvL2NvbnNvbGUubG9nKCdkYXRhJywgZGF0YSlcclxuXHJcbiAgdmFyIGJpbmFyeSA9IGF0b2IoZGF0YSlcclxuIC8vIENyZWF0ZSA4LWJpdCB1bnNpZ25lZCBhcnJheVxyXG4gIHZhciBhcnJheSA9IFtdXHJcbiAgZm9yKHZhciBpID0gMDsgaSA8IGJpbmFyeS5sZW5ndGg7IGkrKykge1xyXG4gIFx0YXJyYXkucHVzaChiaW5hcnkuY2hhckNvZGVBdChpKSlcclxuICB9XHJcblxyXG4gIC8vIFJldHVybiBvdXIgQmxvYiBvYmplY3RcclxuXHRyZXR1cm4gbmV3IEJsb2IoWyBuZXcgVWludDhBcnJheShhcnJheSkgXSwge21pbWVUeXBlfSlcclxufTtcclxuIiwiJCQuZXh0cmFjdCA9IGZ1bmN0aW9uKG9iaiwgdmFsdWVzKSB7XHJcblx0aWYgKHR5cGVvZiB2YWx1ZXMgPT0gJ3N0cmluZycpIHtcclxuXHRcdHZhbHVlcyA9IHZhbHVlcy5zcGxpdCgnLCcpXHJcblx0fVxyXG5cdGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZXMpICYmIHR5cGVvZiB2YWx1ZXMgPT0gJ29iamVjdCcpIHtcclxuXHRcdHZhbHVlcyA9IE9iamVjdC5rZXlzKHZhbHVlcylcclxuXHR9XHJcblx0dmFyIHJldCA9IHt9XHJcblx0Zm9yKHZhciBrIGluIG9iaikge1xyXG5cdFx0aWYgKHZhbHVlcy5pbmRleE9mKGspID49IDApIHtcclxuXHRcdFx0cmV0W2tdID0gb2JqW2tdXHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiByZXRcclxufTtcclxuIiwiJCQuaXNJbWFnZSA9IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XHJcblx0cmV0dXJuICgvXFwuKGdpZnxqcGd8anBlZ3xwbmcpJC9pKS50ZXN0KGZpbGVOYW1lKVxyXG59O1xyXG4iLCIkJC5sb2FkU3R5bGUgPSBmdW5jdGlvbihzdHlsZUZpbGVQYXRoLCBjYWxsYmFjaykge1x0XHJcblx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGxvYWRTdHlsZScsIHN0eWxlRmlsZVBhdGgpXHJcblxyXG5cdCQoZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgY3NzT2sgPSAkKCdoZWFkJykuZmluZChgbGlua1tocmVmPVwiJHtzdHlsZUZpbGVQYXRofVwiXWApLmxlbmd0aFxyXG5cdFx0aWYgKGNzc09rICE9IDEpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBsb2FkaW5nICcke3N0eWxlRmlsZVBhdGh9JyBkZXBlbmRhbmN5YClcclxuXHRcdFx0JCgnPGxpbms+Jywge2hyZWY6IHN0eWxlRmlsZVBhdGgsIHJlbDogJ3N0eWxlc2hlZXQnfSlcclxuXHRcdFx0Lm9uKCdsb2FkJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSAnJHtzdHlsZUZpbGVQYXRofScgbG9hZGVkYClcclxuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdGNhbGxiYWNrKClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHRcdC5hcHBlbmRUbygkKCdoZWFkJykpXHJcblx0XHR9XHJcblx0fSlcclxufTtcclxuIiwiJCQub2JqMkFycmF5ID0gZnVuY3Rpb24ob2JqKSB7XHJcblx0dmFyIHJldCA9IFtdXHJcblx0Zm9yKHZhciBrZXkgaW4gb2JqKSB7XHJcblx0XHRyZXQucHVzaCh7a2V5OiBrZXksIHZhbHVlOiBvYmpba2V5XX0pXHJcblx0fVxyXG5cdHJldHVybiByZXRcclxufTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxudmFyIGlucHV0RmlsZSA9ICQoJzxpbnB1dD4nLCB7dHlwZTogJ2ZpbGUnfSkub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG5cdHZhciBvbkFwcGx5ID0gJCh0aGlzKS5kYXRhKCdvbkFwcGx5JylcclxuXHR2YXIgZmlsZU5hbWUgPSB0aGlzLmZpbGVzWzBdXHJcblx0aWYgKHR5cGVvZiBvbkFwcGx5ID09ICdmdW5jdGlvbicpIHtcclxuXHRcdG9uQXBwbHkoZmlsZU5hbWUpXHJcblx0fVxyXG59KVxyXG5cclxuJCQub3BlbkZpbGVEaWFsb2cgPSBmdW5jdGlvbihvbkFwcGx5KSB7XHJcblx0aW5wdXRGaWxlLmRhdGEoJ29uQXBwbHknLCBvbkFwcGx5KVxyXG5cdGlucHV0RmlsZS5jbGljaygpXHJcbn1cclxuXHJcbn0pKCk7XHJcblxyXG4iLCIkJC5yZWFkRmlsZUFzRGF0YVVSTCA9IGZ1bmN0aW9uKGZpbGVOYW1lLCBvblJlYWQpIHtcclxuXHR2YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcclxuXHJcblx0ZmlsZVJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmICh0eXBlb2Ygb25SZWFkID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0b25SZWFkKGZpbGVSZWFkZXIucmVzdWx0KVxyXG5cdFx0fVxyXG5cdH1cclxuXHRmaWxlUmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZU5hbWUpXHJcbn07XHJcbiIsIiQkLnJlYWRUZXh0RmlsZSA9IGZ1bmN0aW9uKGZpbGVOYW1lLCBvblJlYWQpIHtcclxuXHR2YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcclxuXHJcblx0ZmlsZVJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmICh0eXBlb2Ygb25SZWFkID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0b25SZWFkKGZpbGVSZWFkZXIucmVzdWx0KVxyXG5cdFx0fVxyXG5cdH1cclxuXHRmaWxlUmVhZGVyLnJlYWRBc1RleHQoZmlsZU5hbWUpXHJcbn07XHJcbiJdfQ==

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
					//var $item = $(ctx.template)
					var $item = ctx.template.clone()
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
					template = elt.children().remove()//.get(0).outerHTML
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYm9vdC9pbmRleC5qcyIsImNvbnRyb2xsZXJzL2RpYWxvZ0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9mb3JtRGlhbG9nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL3ZpZXcuanMiLCJjb3JlL2NvbnRyb2xzLmpzIiwiY29yZS9vYmplY3RzQW5kU2VydmljZXMuanMiLCJwbHVnaW5zL2JpbmRpbmcuanMiLCJwbHVnaW5zL2NvbnRyb2wuanMiLCJwbHVnaW5zL2V2ZW50LmpzIiwicGx1Z2lucy9mb3JtLmpzIiwicGx1Z2lucy9tZW51LmpzIiwicGx1Z2lucy90ZW1wbGF0ZS5qcyIsInBsdWdpbnMvdWkuanMiLCJwbHVnaW5zL3V0aWwuanMiLCJ1aS9zaG93QWxlcnQuanMiLCJ1aS9zaG93Q29uZmlybS5qcyIsInVpL3Nob3dQaWN0dXJlLmpzIiwidWkvc2hvd1Byb21wdC5qcyIsInV0aWwvY2hlY2tUeXBlLmpzIiwidXRpbC9kYXRhVVJMdG9CbG9iLmpzIiwidXRpbC9leHRyYWN0LmpzIiwidXRpbC9pc0ltYWdlLmpzIiwidXRpbC9sb2FkU3R5bGUuanMiLCJ1dGlsL29iajJBcnJheS5qcyIsInV0aWwvb3BlbkZpbGVEaWFsb2cuanMiLCJ1dGlsL3JlYWRGaWxlQXNEYXRhVVJMLmpzIiwidXRpbC9yZWFkVGV4dEZpbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe1xyXG5cclxuXHRcclxuXHR3aW5kb3cuJCQgPSB7fVxyXG5cclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG52YXIgZm5Db25maWdSZWFkeVxyXG52YXIgY3VyUm91dGVcclxuXHRcclxuJCQuY29uZmlnUmVhZHkgPSBmdW5jdGlvbihmbikge1xyXG5cclxuXHRmbkNvbmZpZ1JlYWR5ID0gZm5cclxufVxyXG5cclxuJCQuc3RhcnRBcHAgPSBmdW5jdGlvbihtYWluQ29udHJvbE5hbWUsIGNvbmZpZykge1xyXG5cdCQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xyXG5cdFx0dGVtcGxhdGU6IGA8ZGl2IGJuLWNvbnRyb2w9XCIke21haW5Db250cm9sTmFtZX1cIiBjbGFzcz1cIm1haW5QYW5lbFwiIGJuLW9wdGlvbnM9XCJjb25maWdcIj48L2Rpdj5gLFxyXG5cdFx0ZGF0YToge2NvbmZpZ31cclxuXHR9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBwcm9jZXNzUm91dGUoKSB7XHJcblx0dmFyIHByZXZSb3V0ZSA9IGN1clJvdXRlXHJcblx0dmFyIGhyZWYgPSBsb2NhdGlvbi5ocmVmXHJcblx0dmFyIGlkeCA9IGhyZWYuaW5kZXhPZignIycpXHJcblx0Y3VyUm91dGUgPSAoaWR4ICE9PSAtMSkgID8gaHJlZi5zdWJzdHIoaWR4KzEpIDogJy8nXHJcblx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIG5ld1JvdXRlJywgY3VyUm91dGUsIHByZXZSb3V0ZSlcclxuXHJcblxyXG5cdCQod2luZG93KS50cmlnZ2VyKCdyb3V0ZUNoYW5nZScsIHtjdXJSb3V0ZTpjdXJSb3V0ZSwgcHJldlJvdXRlOiBwcmV2Um91dGV9KVxyXG5cclxufVx0XHJcblxyXG4kKGZ1bmN0aW9uKCkge1xyXG5cclxuXHR2YXIgYXBwTmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCcvJylbMl1cclxuXHJcblx0Y29uc29sZS5sb2coYFtDb3JlXSBBcHAgJyR7YXBwTmFtZX0nIHN0YXJ0ZWQgOilgKVxyXG5cdGNvbnNvbGUubG9nKCdbQ29yZV0galF1ZXJ5IHZlcnNpb24nLCAkLmZuLmpxdWVyeSlcclxuXHRjb25zb2xlLmxvZygnW0NvcmVdIGpRdWVyeSBVSSB2ZXJzaW9uJywgJC51aS52ZXJzaW9uKVxyXG5cclxuXHRcclxuXHJcblxyXG5cdCQod2luZG93KS5vbigncG9wc3RhdGUnLCBmdW5jdGlvbihldnQpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1twb3BzdGF0ZV0gc3RhdGUnLCBldnQuc3RhdGUpXHJcblx0XHRwcm9jZXNzUm91dGUoKVxyXG5cdH0pXHJcblxyXG5cclxuXHRpZiAodHlwZW9mIGZuQ29uZmlnUmVhZHkgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0JC5nZXRKU09OKGAvYXBpL3VzZXJzL2NvbmZpZy8ke2FwcE5hbWV9YClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuXHRcdFx0JCQuY29uZmlndXJlU2VydmljZSgnV2ViU29ja2V0U2VydmljZScsIHtpZDogYXBwTmFtZSArICcuJyArIGNvbmZpZy4kdXNlck5hbWUgKyAnLid9KVxyXG5cdFx0XHQkKCdib2R5JykucHJvY2Vzc0NvbnRyb2xzKCkgLy8gcHJvY2VzcyBIZWFkZXJDb250cm9sXHJcblx0XHRcdFxyXG5cdFx0XHRmbkNvbmZpZ1JlYWR5KGNvbmZpZylcclxuXHRcdFx0XHJcblx0XHRcdHByb2Nlc3NSb3V0ZSgpXHJcblx0XHR9KVxyXG5cdFx0LmNhdGNoKChqcXhocikgPT4ge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnanF4aHInLCBqcXhocilcclxuXHRcdFx0Ly92YXIgdGV4dCA9IEpTT04uc3RyaW5naWZ5KGpxeGhyLnJlc3BvbnNlSlNPTiwgbnVsbCwgNClcclxuXHRcdFx0dmFyIHRleHQgPSBqcXhoci5yZXNwb25zZVRleHRcclxuXHRcdFx0dmFyIGh0bWwgPSBgXHJcblx0XHRcdFx0PGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiPlxyXG5cdFx0XHRcdFx0PHAgY2xhc3M9XCJ3My10ZXh0LXJlZFwiPiR7dGV4dH08L3A+XHJcblx0XHRcdFx0XHQ8YSBocmVmPVwiL2Rpc2Nvbm5lY3RcIiBjbGFzcz1cInczLWJ0biB3My1ibHVlXCI+TG9nb3V0PC9hPlxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHRgXHJcblx0XHRcdCQoJ2JvZHknKS5odG1sKGh0bWwpXHJcblx0XHR9KVx0XHRcdFx0XHJcblx0XHRcclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHRjb25zb2xlLndhcm4oJ01pc3NpbmcgZnVuY3Rpb24gY29uZmlnUmVhZHkgISEnKVxyXG5cdH1cclxuXHRcclxuXHJcbn0pXHJcblxyXG5cdFxyXG59KSgpO1xyXG4iLCIkJC5kaWFsb2dDb250cm9sbGVyID0gZnVuY3Rpb24odGl0bGUsIG9wdGlvbnMpIHtcclxuXHR2YXIgZGl2ID0gJCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHJcblx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihkaXYsIG9wdGlvbnMpXHJcblx0ZGl2LmRpYWxvZyh7XHJcblx0XHRhdXRvT3BlbjogZmFsc2UsXHJcblx0XHRtb2RhbDogdHJ1ZSxcclxuXHRcdHdpZHRoOiAnYXV0bycsXHJcblx0XHRidXR0b25zOiB7XHJcblx0XHRcdCdDYW5jZWwnOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHQnQXBwbHknOiBmdW5jdGlvbigpIHtcdFx0XHRcdFx0XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25BcHBseSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRvcHRpb25zLm9uQXBwbHkuY2FsbChjdHJsKVxyXG5cdFx0XHRcdH1cdFxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSlcclxuXHRjdHJsLnNob3cgPSBmdW5jdGlvbigpIHtcclxuXHRcdGRpdi5kaWFsb2coJ29wZW4nKVxyXG5cdH1cclxuXHRyZXR1cm4gY3RybFxyXG59O1xyXG5cclxuIiwiJCQuZm9ybURpYWxvZ0NvbnRyb2xsZXIgPSBmdW5jdGlvbih0aXRsZSwgb3B0aW9ucykge1xyXG5cdHZhciBkaXYgPSAkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxyXG5cdHZhciBmb3JtID0gJCgnPGZvcm0+JylcclxuXHRcdC5hcHBlbmRUbyhkaXYpXHJcblx0XHQub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcclxuXHRcdFx0ZGl2LmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25BcHBseSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0b3B0aW9ucy5vbkFwcGx5LmNhbGwoY3RybCwgY3RybC5lbHQuZ2V0Rm9ybURhdGEoKSlcclxuXHRcdFx0fVx0XHRcdFx0XHJcblx0XHR9KVxyXG5cdHZhciBzdWJtaXRCdG4gPSAkKCc8aW5wdXQ+Jywge3R5cGU6ICdzdWJtaXQnLCBoaWRkZW46IHRydWV9KS5hcHBlbmRUbyhmb3JtKVxyXG5cclxuXHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGZvcm0sIG9wdGlvbnMpXHJcblx0ZGl2LmRpYWxvZyh7XHJcblx0XHRhdXRvT3BlbjogZmFsc2UsXHJcblx0XHRtb2RhbDogdHJ1ZSxcclxuXHRcdHdpZHRoOiAnYXV0bycsXHJcblx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdC8vJCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0fSxcclxuXHRcdGJ1dHRvbnM6IHtcclxuXHRcdFx0J0NhbmNlbCc6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdH0sXHJcblx0XHRcdCdBcHBseSc6IGZ1bmN0aW9uKCkge1x0XHRcdFx0XHRcclxuXHRcdFx0XHRzdWJtaXRCdG4uY2xpY2soKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSlcclxuXHRjdHJsLnNob3cgPSBmdW5jdGlvbihkYXRhLCBvbkFwcGx5KSB7XHJcblx0XHRpZiAodHlwZW9mIGN0cmwuYmVmb3JlU2hvdyA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdGN0cmwuYmVmb3JlU2hvdygpXHJcblx0XHR9XHJcblx0XHRvcHRpb25zLm9uQXBwbHkgPSBvbkFwcGx5XHJcblx0XHRjdHJsLmVsdC5zZXRGb3JtRGF0YShkYXRhKVxyXG5cdFx0ZGl2LmRpYWxvZygnb3BlbicpXHJcblx0fVxyXG5cclxuXHRyZXR1cm4gY3RybFxyXG59O1xyXG4iLCIoZnVuY3Rpb24oKXtcclxuXHJcblxyXG5cclxuY2xhc3MgVmlld0NvbnRyb2xsZXIge1xyXG4gICAgY29uc3RydWN0b3IoZWx0LCBvcHRpb25zKSB7XHJcbiAgICBcdC8vY29uc29sZS5sb2coJ1ZpZXdDb250cm9sbGVyJywgb3B0aW9ucylcclxuICAgIFx0aWYgKHR5cGVvZiBlbHQgPT0gJ3N0cmluZycpIHtcclxuICAgIFx0XHRlbHQgPSAkKGVsdClcclxuICAgIFx0fVxyXG5cclxuICAgIFx0b3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zKVxyXG4gICAgICAgIHRoaXMuZWx0ID0gZWx0XHJcblxyXG4gICAgICAgIHRoaXMuZWx0Lm9uKCdkYXRhOnVwZGF0ZScsIChldiwgbmFtZSwgdmFsdWUsIGV4Y2x1ZGVFbHQpID0+IHtcclxuICAgICAgICBcdC8vY29uc29sZS5sb2coJ1tWaWV3Q29udHJvbGxlcl0gZGF0YTpjaGFuZ2UnLCBuYW1lLCB2YWx1ZSlcclxuICAgICAgICBcdHRoaXMuc2V0RGF0YShuYW1lLCB2YWx1ZSwgZXhjbHVkZUVsdClcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudGVtcGxhdGUgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICBcdHRoaXMuZWx0ID0gJChvcHRpb25zLnRlbXBsYXRlKS5hcHBlbmRUbyhlbHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubW9kZWwgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucy5kYXRhKVxyXG4gICAgICAgIHRoaXMucnVsZXMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucy5ydWxlcylcclxuICAgICAgICB0aGlzLndhdGNoZXMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucy53YXRjaGVzKVxyXG5cclxuICAgICAgICAvLyBnZW5lcmF0ZSBhdXRvbWF0aWMgcnVsZXMgZm9yIGNvbXB1dGVkIGRhdGEgKGFrYSBmdW5jdGlvbilcclxuICAgICAgICBmb3IodmFyIGsgaW4gdGhpcy5tb2RlbCkge1xyXG4gICAgICAgIFx0dmFyIGRhdGEgPSB0aGlzLm1vZGVsW2tdXHJcbiAgICAgICAgXHRpZiAodHlwZW9mIGRhdGEgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIFx0XHR2YXIgZnVuY1RleHQgPSBkYXRhLnRvU3RyaW5nKClcclxuICAgICAgICBcdFx0Ly9jb25zb2xlLmxvZygnZnVuY1RleHQnLCBmdW5jVGV4dClcclxuICAgICAgICBcdFx0dmFyIHJ1bGVzID0gW11cclxuICAgICAgICBcdFx0ZnVuY1RleHQucmVwbGFjZSgvdGhpcy4oW2EtekEtWjAtOV8tXXsxLH0pL2csIGZ1bmN0aW9uKG1hdGNoLCBjYXB0dXJlT25lKSB7XHJcbiAgICAgICAgXHRcdFx0Ly9jb25zb2xlLmxvZygnY2FwdHVyZU9uZScsIGNhcHR1cmVPbmUpXHJcbiAgICAgICAgXHRcdFx0cnVsZXMucHVzaChjYXB0dXJlT25lKVxyXG4gICAgICAgIFx0XHR9KVxyXG4gICAgICAgIFx0XHR0aGlzLnJ1bGVzW2tdID0gcnVsZXMudG9TdHJpbmcoKVxyXG4gICAgICAgIFx0fVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygncnVsZXMnLCB0aGlzLnJ1bGVzKVxyXG4gICAgICAgIHRoaXMuZGlyTGlzdCA9IHRoaXMuZWx0LnByb2Nlc3NVSSh0aGlzLm1vZGVsKVxyXG5cclxuXHJcbiAgICAgICAgLy90aGlzLmVsdC5wcm9jZXNzVUkodGhpcy5tb2RlbClcclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuZXZlbnRzID09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWx0LnByb2Nlc3NFdmVudHMob3B0aW9ucy5ldmVudHMpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNjb3BlID0gdGhpcy5lbHQucHJvY2Vzc0JpbmRpbmdzKClcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdzY29wZScsIHRoaXMuc2NvcGUpXHJcbiAgICAgICBcclxuICAgICAgICB2YXIgaW5pdCA9IG9wdGlvbnMuaW5pdFxyXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdCA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgXHRpbml0LmNhbGwodGhpcylcclxuICAgICAgICB9XHJcbiAgICB9IFxyXG5cclxuICAgIHNldERhdGEoYXJnMSwgYXJnMiwgZXhjbHVkZUVsdCkge1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ1tWaWV3Q29udHJvbGxlcl0gc2V0RGF0YScsIGFyZzEsIGFyZzIpXHJcbiAgICAgICAgdmFyIGRhdGEgPSBhcmcxXHJcbiAgICAgICAgaWYgKHR5cGVvZiBhcmcxID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgXHRkYXRhID0ge31cclxuICAgICAgICBcdGRhdGFbYXJnMV0gPSBhcmcyXHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ1tWaWV3Q29udHJvbGxlcl0gc2V0RGF0YScsIGRhdGEpXHJcbiAgICAgICAgJC5leHRlbmQodGhpcy5tb2RlbCwgZGF0YSlcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdtb2RlbCcsIHRoaXMubW9kZWwpXHJcbiAgICAgICAgdGhpcy51cGRhdGUoT2JqZWN0LmtleXMoZGF0YSksIGV4Y2x1ZGVFbHQpXHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKGZpZWxkc05hbWUsIGV4Y2x1ZGVFbHQpIHtcclxuICAgIFx0Ly9jb25zb2xlLmxvZygnW1ZpZXdDb250cm9sbGVyXSB1cGRhdGUnLCBmaWVsZHNOYW1lKVxyXG4gICAgXHRpZiAodHlwZW9mIGZpZWxkc05hbWUgPT0gJ3N0cmluZycpIHtcclxuICAgIFx0XHRmaWVsZHNOYW1lID0gZmllbGRzTmFtZS5zcGxpdCgnLCcpXHJcbiAgICBcdH1cclxuXHJcblxyXG4gICAgXHRpZiAoQXJyYXkuaXNBcnJheShmaWVsZHNOYW1lKSkge1xyXG4gICAgXHRcdHZhciBmaWVsZHNTZXQgPSB7fVxyXG4gICAgXHRcdGZpZWxkc05hbWUuZm9yRWFjaCgoZmllbGQpID0+IHtcclxuXHJcbiAgICBcdFx0XHR2YXIgd2F0Y2ggPSB0aGlzLndhdGNoZXNbZmllbGRdXHJcbiAgICBcdFx0XHRpZiAodHlwZW9mIHdhdGNoID09ICdmdW5jdGlvbicpIHtcclxuICAgIFx0XHRcdFx0d2F0Y2guY2FsbChudWxsLCB0aGlzLm1vZGVsW2ZpZWxkXSlcclxuICAgIFx0XHRcdH1cclxuICAgIFx0XHRcdGZpZWxkc1NldFtmaWVsZF0gPSAxXHJcblxyXG4gICAgXHRcdFx0Zm9yKHZhciBydWxlIGluIHRoaXMucnVsZXMpIHtcclxuICAgIFx0XHRcdFx0aWYgKHRoaXMucnVsZXNbcnVsZV0uc3BsaXQoJywnKS5pbmRleE9mKGZpZWxkKSAhPSAtMSkge1xyXG4gICAgXHRcdFx0XHRcdGZpZWxkc1NldFtydWxlXSA9IDFcclxuICAgIFx0XHRcdFx0fVxyXG4gICAgXHRcdFx0fVxyXG4gICAgXHRcdH0pXHJcblxyXG5cclxuICAgIFx0XHR0aGlzLmVsdC51cGRhdGVUZW1wbGF0ZSh0aGlzLmRpckxpc3QsIHRoaXMubW9kZWwsIE9iamVjdC5rZXlzKGZpZWxkc1NldCksIGV4Y2x1ZGVFbHQpXHJcbiAgICBcdH1cclxuXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4gICAgJCQudmlld0NvbnRyb2xsZXIgPSBmdW5jdGlvbiAoZWx0LCBvcHRpb25zKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWaWV3Q29udHJvbGxlcihlbHQsIG9wdGlvbnMpXHJcbiAgICB9XHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpe1xyXG5cclxuXHJcblxyXG4kJC5yZWdpc3RlckNvbnRyb2wgPSBmdW5jdGlvbihuYW1lLCBhcmcxLCBhcmcyKSB7XHJcblx0JCQucmVnaXN0ZXJPYmplY3QoJ2NvbnRyb2xzJywgbmFtZSwgYXJnMSwgYXJnMilcclxufVxyXG5cclxuJCQucmVnaXN0ZXJDb250cm9sRXggPSBmdW5jdGlvbihuYW1lLCBvcHRpb25zKSB7XHJcblx0aWYgKCEkJC5jaGVja1R5cGUob3B0aW9ucywge1xyXG5cdFx0JGRlcHM6IFsnc3RyaW5nJ10sXHJcblx0XHQkaWZhY2U6ICdzdHJpbmcnLFxyXG5cdFx0JGV2ZW50czogJ3N0cmluZycsXHJcblx0XHRpbml0OiAnZnVuY3Rpb24nXHJcblx0fSkpIHtcclxuXHRcdGNvbnNvbGUuZXJyb3IoYFtDb3JlXSByZWdpc3RlckNvbnRyb2xFeDogYmFkIG9wdGlvbnNgLCBvcHRpb25zKVxyXG5cdFx0cmV0dXJuXHJcblx0fVxyXG5cclxuXHJcblx0dmFyIGRlcHMgPSBvcHRpb25zLmRlcHMgfHwgW11cclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdjb250cm9scycsIG5hbWUsIGRlcHMsIG9wdGlvbnMpXHJcbn1cclxuXHJcblxyXG5cclxuJCQuY3JlYXRlQ29udHJvbCA9IGZ1bmN0aW9uKGNvbnRyb2xOYW1lLCBlbHQpIHtcclxuXHRlbHQuYWRkQ2xhc3MoY29udHJvbE5hbWUpXHJcblx0ZWx0LmFkZENsYXNzKCdDdXN0b21Db250cm9sJykudW5pcXVlSWQoKVx0XHJcblx0dmFyIGN0cmwgPSAkJC5nZXRPYmplY3QoJ2NvbnRyb2xzJywgY29udHJvbE5hbWUpXHJcblx0XHRcclxuXHRpZiAoY3RybCAhPSB1bmRlZmluZWQpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ2NyZWF0ZUNvbnRyb2wnLCBjb250cm9sTmFtZSwgY3RybClcclxuXHRcdGlmIChjdHJsLnN0YXR1cyA9PT0gICdvaycpIHtcclxuXHRcdFx0XHJcblx0XHRcdHZhciBpZmFjZSA9IHt9XHJcblxyXG5cdFx0XHRcclxuXHRcdFx0aWYgKHR5cGVvZiBjdHJsLmZuID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHR2YXIgYXJncyA9IFtlbHRdLmNvbmNhdChjdHJsLmRlcHMpXHJcblx0XHRcdFx0dmFyIGNvcHlPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGVsdC5nZXRPcHRpb25zKCkpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBpbnN0YW5jZSBjb250cm9sICcke2NvbnRyb2xOYW1lfSdgKVxyXG5cdFx0XHRcdGN0cmwuZm4uYXBwbHkoaWZhY2UsIGFyZ3MpXHRcclxuXHRcdFx0XHRpZmFjZS5vcHRpb25zID0gY29weU9wdGlvbnNcclxuXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmICh0eXBlb2YgY3RybC5mbiA9PSAnb2JqZWN0Jykge1xyXG5cdFx0XHRcdHZhciBpbml0ID0gY3RybC5mbi5pbml0XHJcblx0XHRcdFx0dmFyIHByb3BzID0gY3RybC5mbi5wcm9wcyB8fCB7fVxyXG5cdFx0XHRcdHZhciBjdHggPSB7fVxyXG5cdFx0XHRcdHZhciBkZWZhdWx0T3B0aW9ucyA9IGN0cmwuZm4ub3B0aW9ucyB8fCB7fVxyXG5cclxuXHRcdFx0XHRpZiAodHlwZW9mIGluaXQgPT0gJ2Z1bmN0aW9uJykge1xyXG5cclxuXHRcdFx0XHRcdHZhciBpbml0VmFsdWVzID0ge31cclxuXHRcdFx0XHRcdGZvcih2YXIgayBpbiBwcm9wcykge1xyXG5cdFx0XHRcdFx0XHRjdHhba10gPSBwcm9wc1trXS52YWxcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHR2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgZWx0LmdldE9wdGlvbnMoY3R4KSlcclxuXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbQ29yZV0gb3B0aW9uc2AsIG9wdGlvbnMpXHJcblx0XHRcdFx0XHR2YXIgdHJ1ZU9wdGlvbnMgPSB7fVxyXG5cdFx0XHRcdFx0Zm9yKHZhciBrIGluIG9wdGlvbnMpIHtcclxuXHRcdFx0XHRcdFx0aWYgKCEoayBpbiBwcm9wcykpIHtcclxuXHRcdFx0XHRcdFx0XHR0cnVlT3B0aW9uc1trXSA9IG9wdGlvbnNba11cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdHZhciBjb3B5T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0cnVlT3B0aW9ucylcclxuXHJcblx0XHRcdFx0XHR2YXIgYXJncyA9IFtlbHQsIG9wdGlvbnNdLmNvbmNhdChjdHJsLmRlcHMpXHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgW0NvcmVdIGluc3RhbmNlIGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyB3aXRoIG9wdGlvbnNgLCBvcHRpb25zKVxyXG5cdFx0XHRcdFx0aW5pdC5hcHBseShpZmFjZSwgYXJncylcclxuXHRcdFx0XHRcdGlmYWNlLm9wdGlvbnMgPSBjb3B5T3B0aW9uc1xyXG5cdFx0XHRcdFx0aWZhY2UuZXZlbnRzID0gY3RybC5mbi5ldmVudHNcclxuXHJcblx0XHRcdFx0XHRpZiAoT2JqZWN0LmtleXMocHJvcHMpLmxlbmd0aCAhPSAwKSB7XHJcblx0XHRcdFx0XHRcdGlmYWNlLnNldFByb3AgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coYFtDb3JlXSBzZXREYXRhYCwgbmFtZSwgdmFsdWUpXHJcblx0XHRcdFx0XHRcdFx0dmFyIHNldHRlciA9IHByb3BzW25hbWVdICYmIHByb3BzW25hbWVdLnNldFxyXG5cdFx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygc2V0dGVyID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgc2V0dGVyID0gaWZhY2Vbc2V0dGVyXVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIHNldHRlciA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRzZXR0ZXIuY2FsbChjdHgsIHZhbHVlKVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHRjdHhbbmFtZV0gPSB2YWx1ZVxyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZmFjZS5wcm9wcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdHZhciByZXQgPSB7fVxyXG5cdFx0XHRcdFx0XHRcdGZvcih2YXIgayBpbiBwcm9wcykge1xyXG5cdFx0XHRcdFx0XHRcdFx0cmV0W2tdID0gY3R4W2tdXHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGdldHRlciA9IHByb3BzW2tdLmdldFxyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBnZXR0ZXIgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0Z2V0dGVyID0gaWZhY2VbZ2V0dGVyXVx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgZ2V0dGVyID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0W2tdID0gZ2V0dGVyLmNhbGwoY3R4KVxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0XHJcblx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyBtaXNzaW5nIGluaXQgZnVuY3Rpb25gKVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmYWNlLm5hbWUgPSBjb250cm9sTmFtZVxyXG5cdFx0XHRlbHQuZ2V0KDApLmN0cmwgPSBpZmFjZVxyXG5cdFx0XHRcclxuXHRcdFx0cmV0dXJuIGlmYWNlXHRcdFx0XHRcclxuXHRcdH1cclxuXHJcblxyXG5cdH1cclxuXHRlbHNlIHtcclxuXHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXHJcblx0fVxyXG59XHJcblxyXG4kJC5nZXRSZWdpc3RlcmVkQ29udHJvbHMgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgY29udHJvbHMgPSAkJC5nZXRPYmplY3REb21haW4oJ2NvbnRyb2xzJylcclxuXHRyZXR1cm4gT2JqZWN0LmtleXMoY29udHJvbHMpLmZpbHRlcigobmFtZSkgPT4gIW5hbWUuc3RhcnRzV2l0aCgnJCcpKVxyXG59XHJcblxyXG4kJC5nZXRSZWdpc3RlcmVkQ29udHJvbHNFeCA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBjb250cm9scyA9ICQkLmdldE9iamVjdERvbWFpbignY29udHJvbHMnKVxyXG5cdHZhciBsaWJzID0ge31cclxuXHRmb3IodmFyIGsgaW4gY29udHJvbHMpIHtcclxuXHRcdHZhciBpbmZvID0gY29udHJvbHNba10uZm5cclxuXHRcdHZhciBsaWJOYW1lID0gaW5mby5saWJcclxuXHRcdGlmICh0eXBlb2YgbGliTmFtZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRpZiAobGlic1tsaWJOYW1lXSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRsaWJzW2xpYk5hbWVdID0gW11cclxuXHRcdFx0fVxyXG5cdFx0XHRsaWJzW2xpYk5hbWVdLnB1c2goaylcclxuXHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiBsaWJzXHJcbn1cclxuXHJcbiQkLmdldENvbnRyb2xJbmZvID0gZnVuY3Rpb24oY29udHJvbE5hbWUpIHtcclxuXHR2YXIgY29udHJvbHMgPSAkJC5nZXRPYmplY3REb21haW4oJ2NvbnRyb2xzJylcclxuXHR2YXIgaW5mbyA9IGNvbnRyb2xzW2NvbnRyb2xOYW1lXVxyXG5cclxuXHRpZiAoaW5mbyA9PSB1bmRlZmluZWQpIHtcclxuXHRcdGNvbnNvbGUubG9nKGBjb250cm9sICcke2NvbnRyb2xOYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxyXG5cdFx0cmV0dXJuXHJcblx0fVxyXG5cdGluZm8gPSBpbmZvLmZuXHJcblxyXG5cdHZhciByZXQgPSAkJC5leHRyYWN0KGluZm8sICdkZXBzLG9wdGlvbnMsbGliJylcclxuXHJcblx0aWYgKHR5cGVvZiBpbmZvLmV2ZW50cyA9PSAnc3RyaW5nJykge1xyXG5cdFx0cmV0LmV2ZW50cyA9IGluZm8uZXZlbnRzLnNwbGl0KCcsJylcclxuXHR9XHJcblxyXG5cdHZhciBwcm9wcyA9IHt9XHJcblx0Zm9yKHZhciBrIGluIGluZm8ucHJvcHMpIHtcclxuXHRcdHByb3BzW2tdID0gaW5mby5wcm9wc1trXS52YWxcclxuXHR9XHJcblx0aWYgKE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGggIT0gMCkge1xyXG5cdFx0cmV0LnByb3BzID0gcHJvcHNcclxuXHR9XHJcblx0aWYgKHR5cGVvZiBpbmZvLmlmYWNlID09ICdzdHJpbmcnKSB7XHJcblx0XHRyZXQuaWZhY2UgPSBpbmZvLmlmYWNlLnNwbGl0KCc7JylcclxuXHR9XHJcblx0cmV0dXJuIHJldFxyXG5cdC8vcmV0dXJuIGNvbnRyb2xzW2NvbnRyb2xOYW1lXS5mblxyXG59XHJcblxyXG5cclxuJCQuZ2V0Q29udHJvbHNUcmVlID0gZnVuY3Rpb24oc2hvd1doYXQpIHtcclxuXHRzaG93V2hhdCA9IHNob3dXaGF0IHx8ICcnXHJcblx0dmFyIHNob3dPcHRpb25zID0gc2hvd1doYXQuc3BsaXQoJywnKVxyXG5cdHZhciB0cmVlID0gW11cclxuXHQkKCcuQ3VzdG9tQ29udHJvbCcpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgaWZhY2UgPSAkKHRoaXMpLmludGVyZmFjZSgpXHJcblxyXG5cdFx0dmFyIGl0ZW0gPSB7bmFtZTppZmFjZS5uYW1lLCBlbHQ6ICQodGhpcyksIHBhcmVudDogbnVsbH1cclxuXHRcdGl0ZW0uaWQgPSAkKHRoaXMpLmF0dHIoJ2lkJylcclxuXHJcblx0XHRpZiAodHlwZW9mIGlmYWNlLmV2ZW50cyA9PSAnc3RyaW5nJyAmJlxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ2V2ZW50cycpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcclxuXHRcdFx0aXRlbS5ldmVudHMgPSBpZmFjZS5ldmVudHMuc3BsaXQoJywnKVxyXG5cdFx0fVx0XHRcdFxyXG5cclxuXHRcdHRyZWUucHVzaChpdGVtKVxyXG5cclxuXHRcdGlmIChzaG93T3B0aW9ucy5pbmRleE9mKCdpZmFjZScpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSB7XHJcblxyXG5cdFx0XHR2YXIgZnVuYyA9IFtdXHJcblx0XHRcdGZvcih2YXIgayBpbiBpZmFjZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgaWZhY2Vba10gPT0gJ2Z1bmN0aW9uJyAmJiBrICE9ICdwcm9wcycgJiYgayAhPSAnc2V0UHJvcCcpIHtcclxuXHRcdFx0XHRcdGZ1bmMucHVzaChrKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZnVuYy5sZW5ndGggIT0gMCkge1xyXG5cdFx0XHRcdGl0ZW0uaWZhY2UgPSBmdW5jXHJcblx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0aWYgKHR5cGVvZiBpZmFjZS5wcm9wcyA9PSAnZnVuY3Rpb24nICYmIFxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ3Byb3BzJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpKSkge1xyXG5cdFx0XHRpdGVtLnByb3BzID0gaWZhY2UucHJvcHMoKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgaWZhY2UuZ2V0VmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJlxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ3ZhbHVlJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpKSkge1xyXG5cdFx0XHRpdGVtLnZhbHVlID0gaWZhY2UuZ2V0VmFsdWUoKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgaWZhY2Uub3B0aW9ucyA9PSAnb2JqZWN0JyAmJiBPYmplY3Qua2V5cyhpZmFjZS5vcHRpb25zKS5sZW5ndGggIT0gMCAmJlxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ29wdGlvbnMnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykpKSB7XHJcblx0XHRcdGl0ZW0ub3B0aW9ucyA9IGlmYWNlLm9wdGlvbnNcclxuXHRcdH1cdFxyXG5cclxuXHRcdFx0XHRcdFxyXG5cdFx0Ly9jb25zb2xlLmxvZygnbmFtZScsIG5hbWUpXHJcblx0XHRpdGVtLmNoaWxkcyA9IFtdXHJcblxyXG5cclxuXHRcdHZhciBwYXJlbnRzID0gJCh0aGlzKS5wYXJlbnRzKCcuQ3VzdG9tQ29udHJvbCcpXHJcblx0XHQvL2NvbnNvbGUubG9nKCdwYXJlbnRzJywgcGFyZW50cylcclxuXHRcdGlmIChwYXJlbnRzLmxlbmd0aCAhPSAwKSB7XHJcblx0XHRcdHZhciBwYXJlbnQgPSBwYXJlbnRzLmVxKDApXHJcblx0XHRcdGl0ZW0ucGFyZW50ID0gcGFyZW50XHJcblx0XHRcdHRyZWUuZm9yRWFjaChmdW5jdGlvbihpKSB7XHJcblx0XHRcdFx0aWYgKGkuZWx0LmdldCgwKSA9PSBwYXJlbnQuZ2V0KDApKSB7XHJcblx0XHRcdFx0XHRpLmNoaWxkcy5wdXNoKGl0ZW0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRcclxuXHJcblx0XHR9XHJcblx0fSlcclxuXHQvL2NvbnNvbGUubG9nKCd0cmVlJywgdHJlZSlcclxuXHJcblx0dmFyIHJldCA9IFtdXHJcblx0dHJlZS5mb3JFYWNoKGZ1bmN0aW9uKGkpIHtcclxuXHRcdGlmIChpLnBhcmVudCA9PSBudWxsKSB7XHJcblx0XHRcdHJldC5wdXNoKGkpXHJcblx0XHR9XHJcblx0XHRpZiAoaS5jaGlsZHMubGVuZ3RoID09IDApIHtcclxuXHRcdFx0ZGVsZXRlIGkuY2hpbGRzXHJcblx0XHR9XHJcblx0XHRkZWxldGUgaS5wYXJlbnRcclxuXHRcdGRlbGV0ZSBpLmVsdFxyXG5cdH0pXHJcblxyXG5cdHJldHVybiBKU09OLnN0cmluZ2lmeShyZXQsIG51bGwsIDQpXHJcblxyXG59XHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKXtcclxuXHJcbnZhciByZWdpc3RlcmVkT2JqZWN0cyA9IHtcclxuXHRzZXJ2aWNlczoge31cclxufVxyXG5cclxudmFyIHtzZXJ2aWNlc30gPSByZWdpc3RlcmVkT2JqZWN0c1xyXG5cclxuZnVuY3Rpb24gaXNEZXBzT2soZGVwcykge1xyXG5cdHJldHVybiBkZXBzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcclxuXHJcblx0XHRyZXR1cm4gcHJldiAmJiAoY3VyICE9IHVuZGVmaW5lZClcclxuXHR9LCB0cnVlKVx0XHRcclxufVxyXG5cclxuJCQuZ2V0T2JqZWN0RG9tYWluID0gZnVuY3Rpb24oZG9tYWluKSB7XHJcblx0cmV0dXJuIHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl1cclxufVxyXG5cclxuJCQucmVnaXN0ZXJPYmplY3QgPSBmdW5jdGlvbihkb21haW4sIG5hbWUsIGFyZzEsIGFyZzIpIHtcclxuXHR2YXIgZGVwcyA9IFtdXHJcblx0dmFyIGZuID0gYXJnMVxyXG5cdGlmIChBcnJheS5pc0FycmF5KGFyZzEpKSB7XHJcblx0XHRkZXBzID0gYXJnMVxyXG5cdFx0Zm4gPSBhcmcyXHJcblx0fVxyXG5cdGlmICh0eXBlb2YgZG9tYWluICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBuYW1lICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBmbiA9PSAndW5kZWZpbmVkJyB8fCAhQXJyYXkuaXNBcnJheShkZXBzKSkge1xyXG5cdFx0Y29uc29sZS53YXJuKCdbQ29yZV0gcmVnaXN0ZXJPYmplY3QgY2FsbGVkIHdpdGggYmFkIGFyZ3VtZW50cycpXHJcblx0XHRyZXR1cm5cclxuXHR9IFxyXG5cdGNvbnNvbGUubG9nKGBbQ29yZV0gcmVnaXN0ZXIgb2JqZWN0ICcke2RvbWFpbn06JHtuYW1lfScgd2l0aCBkZXBzYCwgZGVwcylcclxuXHRpZiAocmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl0gPSB7fVxyXG5cdH1cclxuXHRyZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dW25hbWVdID0ge2RlcHM6IGRlcHMsIGZuIDpmbiwgc3RhdHVzOiAnbm90bG9hZGVkJ31cclxufVx0XHJcblxyXG4kJC5nZXRPYmplY3QgPSBmdW5jdGlvbihkb21haW4sIG5hbWUpIHtcclxuXHQvL2NvbnNvbGUubG9nKGBbQ29yZV0gZ2V0T2JqZWN0ICR7ZG9tYWlufToke25hbWV9YClcclxuXHR2YXIgZG9tYWluID0gcmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXVxyXG5cdHZhciByZXQgPSBkb21haW4gJiYgZG9tYWluW25hbWVdXHJcblx0aWYgKHJldCAmJiByZXQuc3RhdHVzID09ICdub3Rsb2FkZWQnKSB7XHJcblx0XHRyZXQuZGVwcyA9ICQkLmdldFNlcnZpY2VzKHJldC5kZXBzKVxyXG5cdFx0cmV0LnN0YXR1cyA9IGlzRGVwc09rKHJldC5kZXBzKSA/ICdvaycgOiAna28nXHJcblx0fVxyXG5cdHJldHVybiByZXRcclxufVxyXG5cclxuJCQuZ2V0U2VydmljZXMgPSBmdW5jdGlvbihkZXBzKSB7XHJcblx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGdldFNlcnZpY2VzJywgZGVwcylcclxuXHRyZXR1cm4gZGVwcy5tYXAoZnVuY3Rpb24oZGVwTmFtZSkge1xyXG5cdFx0dmFyIHNydiA9IHNlcnZpY2VzW2RlcE5hbWVdXHJcblx0XHRpZiAoc3J2KSB7XHJcblx0XHRcdGlmIChzcnYuc3RhdHVzID09ICdub3Rsb2FkZWQnKSB7XHJcblx0XHRcdFx0dmFyIGRlcHMyID0gJCQuZ2V0U2VydmljZXMoc3J2LmRlcHMpXHJcblx0XHRcdFx0dmFyIGNvbmZpZyA9IHNydi5jb25maWcgfHwge31cclxuXHRcdFx0XHRjb25zb2xlLmxvZyhgW0NvcmVdIGluc3RhbmNlIHNlcnZpY2UgJyR7ZGVwTmFtZX0nIHdpdGggY29uZmlnYCwgY29uZmlnKVxyXG5cdFx0XHRcdHZhciBhcmdzID0gW2NvbmZpZ10uY29uY2F0KGRlcHMyKVxyXG5cdFx0XHRcdHNydi5vYmogPSBzcnYuZm4uYXBwbHkobnVsbCwgYXJncylcclxuXHRcdFx0XHRzcnYuc3RhdHVzID0gJ3JlYWR5J1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBzcnYub2JqXHRcdFx0XHRcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHQvL3Nydi5zdGF0dXMgPSAnbm90cmVnaXN0ZXJlZCdcclxuXHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gc2VydmljZSAnJHtkZXBOYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG59XHJcblxyXG5cclxuXHJcbiQkLmNvbmZpZ3VyZVNlcnZpY2UgPSBmdW5jdGlvbihuYW1lLCBjb25maWcpIHtcclxuXHRjb25zb2xlLmxvZygnW0NvcmVdIGNvbmZpZ3VyZVNlcnZpY2UnLCBuYW1lLCBjb25maWcpXHJcblx0aWYgKHR5cGVvZiBuYW1lICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBjb25maWcgIT0gJ29iamVjdCcpIHtcclxuXHRcdGNvbnNvbGUud2FybignW0NvcmVdIGNvbmZpZ3VyZVNlcnZpY2UgY2FsbGVkIHdpdGggYmFkIGFyZ3VtZW50cycpXHJcblx0XHRyZXR1cm5cclxuXHR9IFx0XHJcblxyXG5cdHZhciBzcnYgPSBzZXJ2aWNlc1tuYW1lXVxyXG5cdGlmIChzcnYpIHtcclxuXHRcdHNydi5jb25maWcgPSBjb25maWdcclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHRjb25zb2xlLndhcm4oYFtjb25maWd1cmVTZXJ2aWNlXSBzZXJ2aWNlICcke25hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXHJcblx0fVxyXG5cclxufVxyXG5cclxuJCQucmVnaXN0ZXJTZXJ2aWNlID0gZnVuY3Rpb24obmFtZSwgYXJnMSwgYXJnMikge1xyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdzZXJ2aWNlcycsIG5hbWUsIGFyZzEsIGFyZzIpXHJcbn1cclxuXHJcbiQkLmdldFJlZ2lzdGVyZWRTZXJ2aWNlcyA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciByZXQgPSBbXVxyXG5cdGZvcih2YXIgayBpbiBzZXJ2aWNlcykge1xyXG5cdFx0dmFyIGluZm8gPSBzZXJ2aWNlc1trXVxyXG5cdFx0cmV0LnB1c2goe25hbWU6IGssIHN0YXR1czogaW5mby5zdGF0dXN9KVxyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcbn1cclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5wcm9jZXNzQmluZGluZ3MgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0XHR2YXIgZGF0YSA9IHt9XHJcblxyXG5cdFx0dGhpcy5ibkZpbmQoJ2JuLWJpbmQnLCB0cnVlLCBmdW5jdGlvbihlbHQsIHZhck5hbWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXHJcblx0XHRcdGRhdGFbdmFyTmFtZV0gPSBlbHRcclxuXHRcdH0pXHJcblx0XHR0aGlzLmJuRmluZCgnYm4taWZhY2UnLCB0cnVlLCBmdW5jdGlvbihlbHQsIHZhck5hbWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXHJcblx0XHRcdGRhdGFbdmFyTmFtZV0gPSBlbHQuaW50ZXJmYWNlKClcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gZGF0YVxyXG5cdFxyXG5cdH1cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cdFxyXG5cclxuXHQkLmZuLmdldE9wdGlvbnMgPSBmdW5jdGlvbihkZWZhdWx0VmFsdWVzKSB7XHJcblxyXG5cdFx0dmFyIHZhbHVlcyA9IGRlZmF1bHRWYWx1ZXMgfHwge31cclxuXHJcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMuZGF0YSgnJG9wdGlvbnMnKVxyXG5cdFx0aWYgKHR5cGVvZiBvcHRpb25zICE9ICdvYmplY3QnKSB7XHJcblx0XHRcdG9wdGlvbnMgPSB7fVxyXG5cdFx0fVx0XHJcblxyXG5cdFx0dmFyIHBhcmFtc1ZhbHVlID0ge31cclxuXHRcdGZvcih2YXIgayBpbiB2YWx1ZXMpIHtcclxuXHRcdFx0cGFyYW1zVmFsdWVba10gPSB0aGlzLmRhdGEoaylcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gJC5leHRlbmQodmFsdWVzLCBvcHRpb25zLCBwYXJhbXNWYWx1ZSlcclxuXHRcdFx0XHJcblx0fVxyXG5cclxuXHQkLmZuLmdldFBhcmVudEludGVyZmFjZSA9IGZ1bmN0aW9uKHBhcmVudEN0cmxOYW1lKSB7XHJcblx0XHR2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnQoKVxyXG5cdFx0aWYgKCFwYXJlbnQuaGFzQ2xhc3MocGFyZW50Q3RybE5hbWUpKSB7XHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHBhcmVudC5pbnRlcmZhY2UoKVx0XHRcclxuXHR9XHJcblxyXG5cdCQuZm4ucHJvY2Vzc0NvbnRyb2xzID0gZnVuY3Rpb24oIGRhdGEpIHtcclxuXHJcblx0XHRkYXRhID0gZGF0YSB8fCB7fVxyXG5cclxuXHRcdHRoaXMuYm5GaWx0ZXIoJ1tibi1jb250cm9sXScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBlbHQgPSAkKHRoaXMpXHJcblxyXG5cdFx0XHR2YXIgY29udHJvbE5hbWUgPSBlbHQuYXR0cignYm4tY29udHJvbCcpXHJcblx0XHRcdGVsdC5yZW1vdmVBdHRyKCdibi1jb250cm9sJylcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnY29udHJvbE5hbWUnLCBjb250cm9sTmFtZSlcclxuXHJcblxyXG5cclxuXHRcdFx0JCQuY3JlYXRlQ29udHJvbChjb250cm9sTmFtZSwgZWx0KVxyXG5cdFx0fSlcclxuXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cclxuXHR9XHRcclxuXHJcblx0JC5mbi5pbnRlcmZhY2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiAodGhpcy5sZW5ndGggPT0gMCkgPyBudWxsIDogdGhpcy5nZXQoMCkuY3RybFxyXG5cdH1cclxuXHJcblx0JC5mbi5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRjb25zb2xlLmxvZygnW0NvcmVdIGRpc3Bvc2UnKVxyXG5cdFx0dGhpcy5maW5kKCcuQ3VzdG9tQ29udHJvbCcpLmVhY2goZnVuY3Rpb24oKSB7XHRcdFxyXG5cdFx0XHR2YXIgaWZhY2UgPSAkKHRoaXMpLmludGVyZmFjZSgpXHJcblx0XHRcdGlmICh0eXBlb2YgaWZhY2UgPT0gJ29iamVjdCcgJiYgdHlwZW9mIGlmYWNlLmRpc3Bvc2UgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdGlmYWNlLmRpc3Bvc2UoKVxyXG5cdFx0XHR9XHJcblx0XHRcdGRlbGV0ZSAkKHRoaXMpLmdldCgwKS5jdHJsXHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHR9XHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5wcm9jZXNzRXZlbnRzID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygncHJvY2Vzc0V2ZW50cycsIGRhdGEpXHJcblx0XHRpZiAodHlwZW9mIGRhdGEgIT0gJ29iamVjdCcpIHtcclxuXHRcdFx0Y29uc29sZS5lcnJvcihgW2NvcmVdIHByb2Nlc3NFdmVudHMgY2FsbGVkIHdpdGggYmFkIHBhcmFtZXRlciAnZGF0YScgKG11c3QgYmUgYW4gb2JqZWN0KTpgLCBkYXRhKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdHRoaXMuYm5GaW5kRXgoJ2JuLWV2ZW50JywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCBhdHRyTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibi1ldmVudCcsIGF0dHJOYW1lLCB2YXJOYW1lKVxyXG5cdFx0XHR2YXIgZiA9IGF0dHJOYW1lLnNwbGl0KCcuJylcclxuXHRcdFx0dmFyIGV2ZW50TmFtZSA9IGZbMF1cclxuXHRcdFx0dmFyIHNlbGVjdG9yID0gZlsxXVxyXG5cclxuXHRcdFx0dmFyIGZuID0gZGF0YVt2YXJOYW1lXVxyXG5cdFx0XHRpZiAodHlwZW9mIGZuID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHR2YXIgaWZhY2UgPSBlbHQuaW50ZXJmYWNlKClcclxuXHRcdFx0XHRpZiAoaWZhY2UgJiYgdHlwZW9mIGlmYWNlLm9uID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdGlmYWNlLm9uKGV2ZW50TmFtZSwgZm4uYmluZChpZmFjZSkpXHJcblx0XHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHZhciB1c2VOYXRpdmVFdmVudHMgPSBbJ21vdXNlZW50ZXInLCAnbW91c2VsZWF2ZSddLmluZGV4T2YoZXZlbnROYW1lKSAhPSAtMVxyXG5cclxuXHRcdFx0XHRpZiAoc2VsZWN0b3IgIT0gdW5kZWZpbmVkKSB7XHJcblxyXG5cdFx0XHRcdFx0aWYgKHVzZU5hdGl2ZUV2ZW50cykge1xyXG5cdFx0XHRcdFx0XHRlbHQuZ2V0KDApLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0XHRcdHZhciB0YXJnZXQgPSAkKGV2LnRhcmdldClcclxuXHRcdFx0XHRcdFx0XHRpZiAodGFyZ2V0Lmhhc0NsYXNzKHNlbGVjdG9yKSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0Zm4uY2FsbChldi50YXJnZXQsIGV2KVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdGVsdC5vbihldmVudE5hbWUsICcuJyArIHNlbGVjdG9yLCBmbilcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0aWYgKHVzZU5hdGl2ZUV2ZW50cykge1xyXG5cdFx0XHRcdFx0XHRlbHQuZ2V0KDApLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0XHRcdFx0Zm4uY2FsbChldi50YXJnZXQsIGV2KVxyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRlbHQub24oZXZlbnROYW1lLCBmbilcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBwcm9jZXNzRXZlbnRzOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGEgZnVuY3Rpb24gZGVmaW5lZCBpbiBkYXRhYCwgZGF0YSlcclxuXHRcdFx0fVx0XHRcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdFxyXG5cdH1cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkLmZuLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgdHlwZSA9IHRoaXMuYXR0cigndHlwZScpXHJcblx0XHRpZiAodGhpcy5nZXQoMCkudGFnTmFtZSA9PSAnSU5QVVQnICYmIHR5cGUgPT0gJ2NoZWNrYm94Jykge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wcm9wKCdjaGVja2VkJylcclxuXHRcdH1cclxuXHRcdHZhciBpZmFjZSA9IHRoaXMuaW50ZXJmYWNlKClcclxuXHRcdGlmIChpZmFjZSAmJiB0eXBlb2YgaWZhY2UuZ2V0VmFsdWUgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRyZXR1cm4gaWZhY2UuZ2V0VmFsdWUoKVxyXG5cdFx0fVxyXG5cdFx0dmFyIHJldCA9IHRoaXMudmFsKClcclxuXHJcblx0XHRpZiAodHlwZSA9PSAnbnVtYmVyJyB8fCB0eXBlID09ICdyYW5nZScpIHtcclxuXHRcdFx0cmV0ID0gcGFyc2VGbG9hdChyZXQpXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcmV0XHJcblx0fVxyXG5cclxuXHJcblx0JC5mbi5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRpZiAodGhpcy5nZXQoMCkudGFnTmFtZSA9PSAnSU5QVVQnICYmIHRoaXMuYXR0cigndHlwZScpID09ICdjaGVja2JveCcpIHtcclxuXHRcdFx0dGhpcy5wcm9wKCdjaGVja2VkJywgdmFsdWUpXHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBpZmFjZSA9IHRoaXMuaW50ZXJmYWNlKClcclxuXHRcdGlmIChpZmFjZSAmJiB0eXBlb2YgaWZhY2Uuc2V0VmFsdWUgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRpZmFjZS5zZXRWYWx1ZSh2YWx1ZSlcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aGlzLnZhbCh2YWx1ZSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cclxuXHJcblx0JC5mbi5nZXRGb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHJldCA9IHt9XHJcblx0XHR0aGlzLmZpbmQoJ1tuYW1lXScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBlbHQgPSAkKHRoaXMpXHJcblx0XHRcdHZhciBuYW1lID0gZWx0LmF0dHIoJ25hbWUnKVxyXG5cdFx0XHRyZXRbbmFtZV0gPSBlbHQuZ2V0VmFsdWUoKVxyXG5cclxuXHRcdH0pXHJcblxyXG5cdFx0cmV0dXJuIHJldFxyXG5cdH1cclxuXHJcblx0JC5mbi5zZXRGb3JtRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHJcblx0XHRmb3IodmFyIG5hbWUgaW4gZGF0YSkge1xyXG5cdFx0XHR2YXIgZWx0ID0gdGhpcy5maW5kKGBbbmFtZT0ke25hbWV9XWApXHJcblx0XHRcdHZhciB2YWx1ZSA9IGRhdGFbbmFtZV1cclxuXHRcdFx0ZWx0LnNldFZhbHVlKHZhbHVlKVxyXG5cdFx0XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHR9XHJcblxyXG5cdCQuZm4ucHJvY2Vzc0Zvcm1EYXRhID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0aWYgKGRhdGEgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFtjb3JlXSBwcm9jZXNzRm9ybURhdGEgY2FsbGVkIHdpdGggYmFkIHBhcmFtZXRlciAnZGF0YScgKG11c3QgYmUgYW4gb2JqZWN0KTpgLCBkYXRhKVxyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuYm5GaW5kKCdibi1mb3JtJywgZmFsc2UsIGZ1bmN0aW9uKGVsdCwgdmFyTmFtZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibi10ZXh0JywgdmFyTmFtZSlcclxuXHRcdFx0dmFyIHZhbHVlID0gZGF0YVt2YXJOYW1lXVxyXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnKSB7XHJcblx0XHRcdFx0ZWx0LnNldEZvcm1EYXRhKHZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NGb3JtRGF0YTogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBvYmplY3QgZGVmaW5lZCBpbiBkYXRhYCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdFxyXG5cdH1cclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cdCQuZm4ucHJvY2Vzc0NvbnRleHRNZW51ID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0aWYgKGRhdGEgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFtjb3JlXSBwcm9jZXNzQ29udGV4dE1lbnUgY2FsbGVkIHdpdGggYmFkIHBhcmFtZXRlciAnZGF0YScgKG11c3QgYmUgYW4gb2JqZWN0KTpgLCBkYXRhKVxyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuYm5GaW5kKCdibi1tZW51JywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW3Zhck5hbWVdXHJcblx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHR2YXIgaWQgPSBlbHQudW5pcXVlSWQoKS5hdHRyKCdpZCcpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1twcm9jZXNzQ29udGV4dE1lbnVdIGlkJywgaWQpXHJcblx0XHRcdFx0JC5jb250ZXh0TWVudSh7XHJcblx0XHRcdFx0XHRzZWxlY3RvcjogJyMnICsgaWQsXHJcblx0XHRcdFx0XHRjYWxsYmFjazogZnVuY3Rpb24oa2V5KSB7XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1twcm9jZXNzQ29udGV4dE1lbnVdIGNhbGxiYWNrJywga2V5KVxyXG5cdFx0XHRcdFx0XHRlbHQudHJpZ2dlcignbWVudUNoYW5nZScsIFtrZXldKVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGl0ZW1zOiB2YWx1ZVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc0NvbnRleHRNZW51OiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIG9iamVjdCBkZWZpbmVkIGluIGRhdGFgLCBkYXRhKVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0fSlcclxuXHRcdHJldHVybiB0aGlzXHJcblx0XHJcblx0fVxyXG5cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRmdW5jdGlvbiBzcGxpdEF0dHIoYXR0clZhbHVlLCBjYmspIHtcclxuXHRcdGF0dHJWYWx1ZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHR2YXIgbGlzdCA9IGl0ZW0uc3BsaXQoJzonKVxyXG5cdFx0XHRpZiAobGlzdC5sZW5ndGggPT0gMikge1xyXG5cdFx0XHRcdHZhciBuYW1lID0gbGlzdFswXS50cmltKClcclxuXHRcdFx0XHR2YXIgdmFsdWUgPSBsaXN0WzFdLnRyaW0oKVxyXG5cdFx0XHRcdGNiayhuYW1lLCB2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBbQ29yZV0gc3BsaXRBdHRyKCR7YXR0ck5hbWV9KSAnYXR0clZhbHVlJyBub3QgY29ycmVjdDpgLCBpdGVtKVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFZhclZhbHVlKHZhck5hbWUsIGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ2dldFZhclZhbHVlJywgdmFyTmFtZSwgZGF0YSlcclxuXHRcdHZhciByZXQgPSBkYXRhXHJcblx0XHRmb3IobGV0IGYgb2YgdmFyTmFtZS5zcGxpdCgnLicpKSB7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAodHlwZW9mIHJldCA9PSAnb2JqZWN0JyAmJiBmIGluIHJldCkge1xyXG5cdFx0XHRcdHJldCA9IHJldFtmXVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdC8vY29uc29sZS53YXJuKGBbQ29yZV0gZ2V0VmFyVmFsdWU6IGF0dHJpYnV0ICcke3Zhck5hbWV9JyBpcyBub3QgaW4gb2JqZWN0OmAsIGRhdGEpXHJcblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZFxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdmJywgZiwgJ3JldCcsIHJldClcclxuXHRcdH1cclxuXHRcdC8vY29uc29sZS5sb2coJ3JldCcsIHJldClcclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZm4pIHtcclxuXHJcblx0XHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gZ2V0VmFsdWUnLCB2YXJOYW1lLCBjdHgpXHJcblxyXG5cdFx0dmFyIG5vdCA9IGZhbHNlXHJcblx0XHRpZiAodmFyTmFtZS5zdGFydHNXaXRoKCchJykpIHtcclxuXHRcdFx0dmFyTmFtZSA9IHZhck5hbWUuc3Vic3RyKDEpXHJcblx0XHRcdG5vdCA9IHRydWVcclxuXHRcdH1cdFx0XHRcclxuXHJcblx0XHR2YXIgcHJlZml4TmFtZSA9IHZhck5hbWUuc3BsaXQoJy4nKVswXVxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIHByZWZpeE5hbWUnLCBwcmVmaXhOYW1lKVxyXG5cdFx0aWYgKGN0eC52YXJzVG9VcGRhdGUgJiYgY3R4LnZhcnNUb1VwZGF0ZS5pbmRleE9mKHByZWZpeE5hbWUpIDwgMCkge1xyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZnVuYyA9IGN0eC5kYXRhW3Zhck5hbWVdXHJcblx0XHR2YXIgdmFsdWVcclxuXHJcblx0XHRpZiAodHlwZW9mIGZ1bmMgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHR2YWx1ZSA9IGZ1bmMuY2FsbChjdHguZGF0YSlcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR2YWx1ZSA9IGdldFZhclZhbHVlKHZhck5hbWUsIGN0eC5kYXRhKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0Ly9jb25zb2xlLndhcm4oYFtDb3JlXSBwcm9jZXNzVGVtcGxhdGU6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgZGVmaW5lZCBpbiBvYmplY3QgZGF0YTpgLCBkYXRhKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdC8vY29uc29sZS5sb2coJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJyAmJiBub3QpIHtcclxuXHRcdFx0dmFsdWUgPSAhdmFsdWVcclxuXHRcdH1cclxuXHRcdGZuKHZhbHVlKVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5JZihjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAodmFsdWUgPT09IGZhbHNlKSB7XHJcblx0XHRcdFx0Y3R4LmVsdC5yZW1vdmUoKVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuU2hvdyhjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xyXG5cdFx0XHRcdGN0eC5lbHQuYm5WaXNpYmxlKHZhbHVlKVxyXG5cdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tc2hvdzogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBib29sZWFuYCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5FYWNoKGN0eCkge1xyXG5cdFx0dmFyIGYgPSBjdHguZGlyVmFsdWUuc3BsaXQoJyAnKVxyXG5cdFx0aWYgKGYubGVuZ3RoICE9IDMgfHwgZlsxXSAhPSAnb2YnKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tDb3JlXSBibi1lYWNoIGNhbGxlZCB3aXRoIGJhZCBhcmd1bWVudHM6JywgZGlyVmFsdWUpXHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cdFx0dmFyIGl0ZXIgPSBmWzBdXHJcblx0XHR2YXIgdmFyTmFtZSA9IGZbMl1cclxuXHRcdC8vY29uc29sZS5sb2coJ2JuLWVhY2ggaXRlcicsIGl0ZXIsICBjdHgudGVtcGxhdGUpXHJcblx0XHRcclxuXHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcblxyXG5cdFx0XHRcdGN0eC5lbHQuZW1wdHkoKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHZhbHVlLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHRcdFx0dmFyIGl0ZW1EYXRhID0gJC5leHRlbmQoe30sIGN0eC5kYXRhKVxyXG5cdFx0XHRcdFx0aXRlbURhdGFbaXRlcl0gPSBpdGVtXHJcblx0XHRcdFx0XHQvL3ZhciAkaXRlbSA9ICQoY3R4LnRlbXBsYXRlKVxyXG5cdFx0XHRcdFx0dmFyICRpdGVtID0gY3R4LnRlbXBsYXRlLmNsb25lKClcclxuXHRcdFx0XHRcdCRpdGVtLnByb2Nlc3NVSShpdGVtRGF0YSlcclxuXHRcdFx0XHRcdGN0eC5lbHQuYXBwZW5kKCRpdGVtKVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cdFxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBibi1lYWNoOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGFycmF5YCwgZGF0YSlcclxuXHRcdFx0fVx0XHRcdFxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuVGV4dChjdHgpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBiblRleHQnLCBjdHgpXHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC50ZXh0KHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblx0XHJcblx0ZnVuY3Rpb24gYm5IdG1sKGN0eCkge1xyXG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGN0eC5lbHQuaHRtbCh2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBibkNvbWJvKGN0eCkge1xyXG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGN0eC5lbHQuaW5pdENvbWJvKHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuT3B0aW9ucyhjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHguZWx0LmRhdGEoJyRvcHRpb25zJywgdmFsdWUpXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblxyXG5cdGZ1bmN0aW9uIGJuVmFsKGN0eCkge1xyXG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGN0eC5lbHQuc2V0VmFsdWUodmFsdWUpXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblxyXG5cdGZ1bmN0aW9uIGJuUHJvcChjdHgpIHtcclxuXHRcdHNwbGl0QXR0cihjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHByb3BOYW1lLCB2YXJOYW1lKSB7XHJcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xyXG5cdFx0XHRcdFx0Y3R4LmVsdC5wcm9wKHByb3BOYW1lLCB2YWx1ZSlcclxuXHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGJuLXByb3A6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gYm9vbGVhbmAsIGRhdGEpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVx0XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5BdHRyKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGN0eC5lbHQuYXR0cihhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5TdHlsZShjdHgpIHtcclxuXHRcdHNwbGl0QXR0cihjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKGF0dHJOYW1lLCB2YXJOYW1lKSB7XHJcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRjdHguZWx0LmNzcyhhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblxyXG5cdGZ1bmN0aW9uIGJuRGF0YShjdHgpIHtcclxuXHRcdHNwbGl0QXR0cihjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKGF0dHJOYW1lLCB2YXJOYW1lKSB7XHJcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRjdHguZWx0LnNldFByb3AoYXR0ck5hbWUsIHZhbHVlKVxyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cclxuXHRmdW5jdGlvbiBibkNsYXNzKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24ocHJvcE5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XHJcblx0XHRcdFx0XHRpZiAodmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0Y3R4LmVsdC5hZGRDbGFzcyhwcm9wTmFtZSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRjdHguZWx0LnJlbW92ZUNsYXNzKHByb3BOYW1lKVxyXG5cdFx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdFx0fVx0XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBibi1jbGFzczogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBib29sZWFuYCwgZGF0YSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHRcclxuXHRcdH0pXHJcblx0fVx0XHJcblxyXG5cclxuXHR2YXIgZGlyTWFwID0ge1xyXG5cdFx0J2JuLWVhY2gnOiBibkVhY2gsXHRcdFx0XHJcblx0XHQnYm4taWYnOiBibklmLFxyXG5cdFx0J2JuLXRleHQnOiBiblRleHQsXHRcclxuXHRcdCdibi1odG1sJzogYm5IdG1sLFxyXG5cdFx0J2JuLW9wdGlvbnMnOiBibk9wdGlvbnMsXHRcdFx0XHJcblx0XHQnYm4tbGlzdCc6IGJuQ29tYm8sXHRcdFx0XHJcblx0XHQnYm4tdmFsJzogYm5WYWwsXHRcclxuXHRcdCdibi1wcm9wJzogYm5Qcm9wLFxyXG5cdFx0J2JuLWF0dHInOiBibkF0dHIsXHRcclxuXHRcdCdibi1kYXRhJzogYm5EYXRhLFx0XHRcdFxyXG5cdFx0J2JuLWNsYXNzJzogYm5DbGFzcyxcclxuXHRcdCdibi1zaG93JzogYm5TaG93LFxyXG5cdFx0J2JuLXN0eWxlJzogYm5TdHlsZVxyXG5cdH1cclxuXHJcblx0JC5mbi5zZXRQcm9wID0gZnVuY3Rpb24oYXR0ck5hbWUsIHZhbHVlKSB7XHJcblx0XHR2YXIgaWZhY2UgPSB0aGlzLmludGVyZmFjZSgpXHJcblx0XHRpZiAoaWZhY2UgJiYgaWZhY2Uuc2V0UHJvcCkge1xyXG5cdFx0XHRpZmFjZS5zZXRQcm9wKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aGlzLmRhdGEoYXR0ck5hbWUsIHZhbHVlKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxuXHJcblxyXG5cdCQuZm4ucHJvY2Vzc1RlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIHByb2Nlc3NUZW1wbGF0ZScpXHJcblx0XHR2YXIgdGhhdCA9IHRoaXNcclxuXHJcblx0XHR2YXIgZGlyTGlzdCA9IFtdXHJcblxyXG5cdFx0Zm9yKGxldCBrIGluIGRpck1hcCkge1xyXG5cdFx0XHR0aGlzLmJuRmluZChrLCB0cnVlLCBmdW5jdGlvbihlbHQsIGRpclZhbHVlKSB7XHJcblx0XHRcdFx0dmFyIHRlbXBsYXRlXHJcblx0XHRcdFx0aWYgKGsgPT0gJ2JuLWVhY2gnKSB7XHJcblx0XHRcdFx0XHR0ZW1wbGF0ZSA9IGVsdC5jaGlsZHJlbigpLnJlbW92ZSgpLy8uZ2V0KDApLm91dGVySFRNTFxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndGVtcGxhdGUnLCB0ZW1wbGF0ZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGsgPT0gJ2JuLXZhbCcpIHtcclxuXHRcdFx0XHRcdGVsdC5kYXRhKCckdmFsJywgZGlyVmFsdWUpXHJcblx0XHRcdFx0XHR2YXIgdXBkYXRlRXZlbnQgPSBlbHQuYXR0cignYm4tdXBkYXRlJylcclxuXHRcdFx0XHRcdGlmICh1cGRhdGVFdmVudCAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LnJlbW92ZUF0dHIoJ2JuLXVwZGF0ZScpXHJcblx0XHRcdFx0XHRcdGVsdC5vbih1cGRhdGVFdmVudCwgZnVuY3Rpb24oZXYsIHVpKSB7XHJcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndWknLCB1aSlcclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gKHVpICYmICB1aS52YWx1ZSkgfHwgICQodGhpcykuZ2V0VmFsdWUoKVxyXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHRcdFx0XHRcdFx0dGhhdC50cmlnZ2VyKCdkYXRhOnVwZGF0ZScsIFtkaXJWYWx1ZSwgdmFsdWUsIGVsdF0pXHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRkaXJMaXN0LnB1c2goe2RpcmVjdGl2ZTogaywgZWx0OiBlbHQsIGRpclZhbHVlOiBkaXJWYWx1ZSwgdGVtcGxhdGU6IHRlbXBsYXRlfSlcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGF0YSkge1xyXG5cdFx0XHR0aGlzLnVwZGF0ZVRlbXBsYXRlKGRpckxpc3QsIGRhdGEpXHJcblx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRyZXR1cm4gZGlyTGlzdFxyXG5cclxuXHR9XHRcclxuXHJcblx0JC5mbi51cGRhdGVUZW1wbGF0ZSA9IGZ1bmN0aW9uKGRpckxpc3QsIGRhdGEsIHZhcnNUb1VwZGF0ZSwgZXhjbHVkZUVsdCkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnW2NvcmVdIHVwZGF0ZVRlbXBsYXRlJywgZGF0YSwgdmFyc1RvVXBkYXRlKVxyXG5cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXHJcblx0XHR2YXJzVG9VcGRhdGUgPSB2YXJzVG9VcGRhdGUgfHwgT2JqZWN0LmtleXMoZGF0YSlcclxuXHRcdC8vY29uc29sZS5sb2coJ3ZhcnNUb1VwZGF0ZScsIHZhcnNUb1VwZGF0ZSlcclxuXHJcblx0XHRkaXJMaXN0LmZvckVhY2goZnVuY3Rpb24oZGlySXRlbSkge1xyXG5cdFx0XHR2YXIgZm4gPSBkaXJNYXBbZGlySXRlbS5kaXJlY3RpdmVdXHJcblx0XHRcdGlmICh0eXBlb2YgZm4gPT0gJ2Z1bmN0aW9uJyAmJiBkaXJJdGVtLmVsdCAhPSBleGNsdWRlRWx0KSB7XHJcblx0XHRcdFx0ZGlySXRlbS5kYXRhID0gZGF0YTtcclxuXHRcdFx0XHRkaXJJdGVtLnZhcnNUb1VwZGF0ZSA9IHZhcnNUb1VwZGF0ZTtcclxuXHRcdFx0XHRmbihkaXJJdGVtKVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcdFxyXG5cdFx0XHJcblxyXG5cdFx0XHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cclxuXHR9XHRcclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5wcm9jZXNzVUkgPSBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdwcm9jZXNzVUknLCBkYXRhLCB0aGlzLmh0bWwoKSlcclxuXHRcdHZhciBkaXJMaXN0ID0gdGhpcy5wcm9jZXNzVGVtcGxhdGUoZGF0YSlcclxuXHRcdHRoaXMucHJvY2Vzc0NvbnRyb2xzKGRhdGEpXHJcblx0XHQucHJvY2Vzc0Zvcm1EYXRhKGRhdGEpXHJcblx0XHQucHJvY2Vzc0NvbnRleHRNZW51KGRhdGEpXHJcblx0XHRyZXR1cm4gZGlyTGlzdFxyXG5cdH1cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkLmZuLmJuRmlsdGVyID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuXHRcdHJldHVybiB0aGlzLmZpbmQoc2VsZWN0b3IpLmFkZCh0aGlzLmZpbHRlcihzZWxlY3RvcikpXHJcblx0fVxyXG5cclxuXHQkLmZuLmJuRmluZCA9IGZ1bmN0aW9uKGF0dHJOYW1lLCByZW1vdmVBdHRyLCBjYmspIHtcclxuXHRcdHRoaXMuYm5GaWx0ZXIoYFske2F0dHJOYW1lfV1gKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxyXG5cdFx0XHR2YXIgYXR0clZhbHVlID0gZWx0LmF0dHIoYXR0ck5hbWUpXHJcblx0XHRcdGlmIChyZW1vdmVBdHRyKSB7XHJcblx0XHRcdFx0ZWx0LnJlbW92ZUF0dHIoYXR0ck5hbWUpXHJcblx0XHRcdH1cdFx0XHJcblx0XHRcdGNiayhlbHQsIGF0dHJWYWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHQkLmZuLmJuRmluZEV4ID0gZnVuY3Rpb24oYXR0ck5hbWUsIHJlbW92ZUF0dHIsIGNiaykge1xyXG5cdFx0dGhpcy5ibkZpbmQoYXR0ck5hbWUsIHJlbW92ZUF0dHIsIGZ1bmN0aW9uKGVsdCwgYXR0clZhbHVlKSB7XHJcblx0XHRcdGF0dHJWYWx1ZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHRcdHZhciBsaXN0ID0gaXRlbS5zcGxpdCgnOicpXHJcblx0XHRcdFx0aWYgKGxpc3QubGVuZ3RoID09IDIpIHtcclxuXHRcdFx0XHRcdHZhciBuYW1lID0gbGlzdFswXS50cmltKClcclxuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IGxpc3RbMV0udHJpbSgpXHJcblx0XHRcdFx0XHRjYmsoZWx0LCBuYW1lLCB2YWx1ZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGBbQ29yZV0gYm5GaW5kRXgoJHthdHRyTmFtZX0pICdhdHRyVmFsdWUnIG5vdCBjb3JyZWN0OmAsIGl0ZW0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdCQuZm4uYm5WaXNpYmxlID0gZnVuY3Rpb24oaXNWaXNpYmxlKSB7XHJcblx0XHRpZiAoaXNWaXNpYmxlKSB7XHJcblx0XHRcdHRoaXMuc2hvdygpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy5oaWRlKClcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzXHRcclxuXHR9XHJcblxyXG5cdCQuZm4uaW5pdENvbWJvID0gZnVuY3Rpb24odmFsdWVzKSB7XHJcblx0XHR0aGlzXHJcblx0XHQuZW1wdHkoKVxyXG5cdFx0LmFwcGVuZCh2YWx1ZXMubWFwKGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdHJldHVybiBgPG9wdGlvbiB2YWx1ZT0ke3ZhbHVlfT4ke3ZhbHVlfTwvb3B0aW9uPmBcclxuXHRcdH0pKVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxuXHJcbn0pKCk7XHJcbiIsIiQkLnNob3dBbGVydCA9IGZ1bmN0aW9uKHRleHQsIHRpdGxlLCBjYWxsYmFjaykge1xyXG5cdHRpdGxlID0gdGl0bGUgfHwgJ0luZm9ybWF0aW9uJ1xyXG5cdCQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblx0XHQuYXBwZW5kKCQoJzxwPicpLmh0bWwodGV4dCkpXHJcblx0XHQuZGlhbG9nKHtcclxuXHRcdFx0Y2xhc3Nlczoge1xyXG5cdFx0XHRcdCd1aS1kaWFsb2ctdGl0bGViYXItY2xvc2UnOiAnbm8tY2xvc2UnXHJcblx0XHRcdH0sXHJcblx0XHRcdHdpZHRoOiAnYXV0bycsXHJcblx0XHRcdG1vZGFsOiB0cnVlLFxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRidXR0b25zOiBbXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0dGV4dDogJ0Nsb3NlJyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRdXHJcblx0XHR9KVxyXG59O1x0XHJcblxyXG4iLCIkJC5zaG93Q29uZmlybSA9IGZ1bmN0aW9uKHRleHQsIHRpdGxlLCBjYWxsYmFjaykge1xyXG5cdHRpdGxlID0gdGl0bGUgfHwgJ0luZm9ybWF0aW9uJ1xyXG5cdCQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblx0XHQuYXBwZW5kKCQoJzxwPicpLmh0bWwodGV4dCkpXHJcblx0XHQuZGlhbG9nKHtcclxuXHJcblx0XHRcdG1vZGFsOiB0cnVlLFxyXG5cclxuXHRcdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdkZXN0cm95JylcclxuXHRcdFx0fSxcclxuXHRcdFx0YnV0dG9uczogW1xyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRleHQ6ICdDYW5jZWwnLFxyXG5cdFx0XHRcdFx0Ly9jbGFzczogJ3czLWJ1dHRvbiB3My1yZWQgYm4tbm8tY29ybmVyJyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnT0snLFxyXG5cdFx0XHRcdFx0Ly9jbGFzczogJ3czLWJ1dHRvbiB3My1ibHVlIGJuLW5vLWNvcm5lcicsXHJcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKClcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHRcdFx0XHJcblx0XHRcdF1cclxuXHRcdH0pXHJcbn07XHJcblx0XHJcblxyXG4iLCIkJC5zaG93UGljdHVyZSA9IGZ1bmN0aW9uKHRpdGxlLCBwaWN0dXJlVXJsKSB7XHJcblx0JCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHRcdC5hcHBlbmQoJCgnPGRpdj4nLCB7Y2xhc3M6ICdibi1mbGV4LWNvbCBibi1hbGlnbi1jZW50ZXInfSlcclxuXHRcdFx0LmFwcGVuZCgkKCc8aW1nPicsIHtzcmM6IHBpY3R1cmVVcmx9KSlcclxuXHRcdClcclxuXHRcdC5kaWFsb2coe1xyXG5cclxuXHRcdFx0bW9kYWw6IHRydWUsXHJcblx0XHRcdHdpZHRoOiAnYXV0bycsXHJcblx0XHRcdG1heEhlaWdodDogNjAwLFxyXG5cdFx0XHRtYXhXaWR0aDogNjAwLFxyXG5cdFx0XHQvL3Bvc2l0aW9uOiB7bXk6ICdjZW50ZXIgY2VudGVyJywgYXQ6ICdjZW50ZXIgY2VudGVyJ30sXHJcblxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSlcclxufTtcclxuXHJcblxyXG5cclxuIiwiJCQuc2hvd1Byb21wdCA9IGZ1bmN0aW9uKGxhYmVsLCB0aXRsZSwgY2FsbGJhY2ssIG9wdGlvbnMpIHtcclxuXHR0aXRsZSA9IHRpdGxlIHx8ICdJbmZvcm1hdGlvbidcclxuXHRvcHRpb25zID0gJC5leHRlbmQoe3R5cGU6ICd0ZXh0J30sIG9wdGlvbnMpXHJcblx0Ly9jb25zb2xlLmxvZygnb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdHZhciBkaXYgPSAkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxyXG5cdFx0LmFwcGVuZCgkKCc8Zm9ybT4nKVxyXG5cdFx0XHQuYXBwZW5kKCQoJzxwPicpLnRleHQobGFiZWwpKVxyXG5cdFx0XHQuYXBwZW5kKCQoJzxpbnB1dD4nLCB7Y2xhc3M6ICd2YWx1ZSd9KS5hdHRyKG9wdGlvbnMpLnByb3AoJ3JlcXVpcmVkJywgdHJ1ZSkuY3NzKCd3aWR0aCcsICcxMDAlJykpXHJcblx0XHRcdC5hcHBlbmQoJCgnPGlucHV0PicsIHt0eXBlOiAnc3VibWl0J30pLmhpZGUoKSlcclxuXHRcdFx0Lm9uKCdzdWJtaXQnLCBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcclxuXHRcdFx0XHRkaXYuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHR2YXIgdmFsID0gZGl2LmZpbmQoJy52YWx1ZScpLnZhbCgpXHJcblx0XHRcdFx0XHRjYWxsYmFjayh2YWwpXHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdH0pXHJcblx0XHQpXHJcblx0XHQuZGlhbG9nKHtcclxuXHRcdFx0Y2xhc3Nlczoge1xyXG5cdFx0XHRcdCd1aS1kaWFsb2ctdGl0bGViYXItY2xvc2UnOiAnbm8tY2xvc2UnXHJcblx0XHRcdH0sXHJcblx0XHRcdG1vZGFsOiB0cnVlLFxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRidXR0b25zOiBbXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0dGV4dDogJ0NhbmNlbCcsXHJcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnQXBwbHknLFxyXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmZpbmQoJ1t0eXBlPXN1Ym1pdF0nKS5jbGljaygpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRdXHJcblx0XHR9KVxyXG59O1xyXG5cclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG5cdFxyXG5cdGZ1bmN0aW9uIGlzT2JqZWN0KGEpIHtcclxuXHRcdHJldHVybiAodHlwZW9mIGEgPT0gJ29iamVjdCcpICYmICFBcnJheS5pc0FycmF5KGEpXHJcblx0fVxyXG5cclxuXHQkJC5jaGVja1R5cGUgPSBmdW5jdGlvbih2YWx1ZSwgdHlwZSwgaXNPcHRpb25hbCkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnY2hlY2tUeXBlJyx2YWx1ZSwgdHlwZSwgaXNPcHRpb25hbClcclxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3VuZGVmaW5lZCcgJiYgaXNPcHRpb25hbCA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgdHlwZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09IHR5cGVcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHR5cGUpKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICh0eXBlLmxlbmd0aCA9PSAwKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWUgLy8gbm8gaXRlbSB0eXBlIGNoZWNraW5nXHJcblx0XHRcdH1cclxuXHRcdFx0Zm9yKGxldCBpIG9mIHZhbHVlKSB7XHJcblx0XHRcdFx0dmFyIHJldCA9IGZhbHNlXHJcblx0XHRcdFx0Zm9yKGxldCB0IG9mIHR5cGUpIHtcclxuXHRcdFx0XHRcdHJldCB8PSAkJC5jaGVja1R5cGUoaSwgdClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCFyZXQpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaXNPYmplY3QodHlwZSkpIHtcclxuXHRcdFx0aWYgKCFpc09iamVjdCh2YWx1ZSkpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IobGV0IGYgaW4gdHlwZSkge1xyXG5cclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmJywgZiwgJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHRcdFx0dmFyIG5ld1R5cGUgPSB0eXBlW2ZdXHJcblxyXG5cdFx0XHRcdHZhciBpc09wdGlvbmFsID0gZmFsc2VcclxuXHRcdFx0XHRpZiAoZi5zdGFydHNXaXRoKCckJykpIHtcclxuXHRcdFx0XHRcdGYgPSBmLnN1YnN0cigxKVxyXG5cdFx0XHRcdFx0aXNPcHRpb25hbCA9IHRydWVcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCEkJC5jaGVja1R5cGUodmFsdWVbZl0sIG5ld1R5cGUsIGlzT3B0aW9uYWwpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGZhbHNlXHJcblx0fVx0XHJcblxyXG5cclxufSkoKTtcclxuIiwiJCQuZGF0YVVSTHRvQmxvYiA9IGZ1bmN0aW9uKGRhdGFVUkwpIHtcclxuICAvLyBEZWNvZGUgdGhlIGRhdGFVUkxcclxuICB2YXIgc3BsaXQgPSBkYXRhVVJMLnNwbGl0KC9bOiw7XS8pXHJcbiAgdmFyIG1pbWVUeXBlID0gc3BsaXRbMV1cclxuICB2YXIgZW5jb2RhZ2UgPSBzcGxpdFsyXVxyXG4gIGlmIChlbmNvZGFnZSAhPSAnYmFzZTY0Jykge1xyXG4gIFx0cmV0dXJuXHJcbiAgfVxyXG4gIHZhciBkYXRhID0gc3BsaXRbM11cclxuXHJcbiAgY29uc29sZS5sb2coJ21pbWVUeXBlJywgbWltZVR5cGUpXHJcbiAgY29uc29sZS5sb2coJ2VuY29kYWdlJywgZW5jb2RhZ2UpXHJcbiAgLy9jb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXHJcblxyXG4gIHZhciBiaW5hcnkgPSBhdG9iKGRhdGEpXHJcbiAvLyBDcmVhdGUgOC1iaXQgdW5zaWduZWQgYXJyYXlcclxuICB2YXIgYXJyYXkgPSBbXVxyXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBiaW5hcnkubGVuZ3RoOyBpKyspIHtcclxuICBcdGFycmF5LnB1c2goYmluYXJ5LmNoYXJDb2RlQXQoaSkpXHJcbiAgfVxyXG5cclxuICAvLyBSZXR1cm4gb3VyIEJsb2Igb2JqZWN0XHJcblx0cmV0dXJuIG5ldyBCbG9iKFsgbmV3IFVpbnQ4QXJyYXkoYXJyYXkpIF0sIHttaW1lVHlwZX0pXHJcbn07XHJcbiIsIiQkLmV4dHJhY3QgPSBmdW5jdGlvbihvYmosIHZhbHVlcykge1xyXG5cdGlmICh0eXBlb2YgdmFsdWVzID09ICdzdHJpbmcnKSB7XHJcblx0XHR2YWx1ZXMgPSB2YWx1ZXMuc3BsaXQoJywnKVxyXG5cdH1cclxuXHRpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSAmJiB0eXBlb2YgdmFsdWVzID09ICdvYmplY3QnKSB7XHJcblx0XHR2YWx1ZXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpXHJcblx0fVxyXG5cdHZhciByZXQgPSB7fVxyXG5cdGZvcih2YXIgayBpbiBvYmopIHtcclxuXHRcdGlmICh2YWx1ZXMuaW5kZXhPZihrKSA+PSAwKSB7XHJcblx0XHRcdHJldFtrXSA9IG9ialtrXVxyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcbn07XHJcbiIsIiQkLmlzSW1hZ2UgPSBmdW5jdGlvbihmaWxlTmFtZSkge1xyXG5cdHJldHVybiAoL1xcLihnaWZ8anBnfGpwZWd8cG5nKSQvaSkudGVzdChmaWxlTmFtZSlcclxufTtcclxuIiwiJCQubG9hZFN0eWxlID0gZnVuY3Rpb24oc3R5bGVGaWxlUGF0aCwgY2FsbGJhY2spIHtcdFxyXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBsb2FkU3R5bGUnLCBzdHlsZUZpbGVQYXRoKVxyXG5cclxuXHQkKGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGNzc09rID0gJCgnaGVhZCcpLmZpbmQoYGxpbmtbaHJlZj1cIiR7c3R5bGVGaWxlUGF0aH1cIl1gKS5sZW5ndGhcclxuXHRcdGlmIChjc3NPayAhPSAxKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gbG9hZGluZyAnJHtzdHlsZUZpbGVQYXRofScgZGVwZW5kYW5jeWApXHJcblx0XHRcdCQoJzxsaW5rPicsIHtocmVmOiBzdHlsZUZpbGVQYXRoLCByZWw6ICdzdHlsZXNoZWV0J30pXHJcblx0XHRcdC5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gJyR7c3R5bGVGaWxlUGF0aH0nIGxvYWRlZGApXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRjYWxsYmFjaygpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0XHQuYXBwZW5kVG8oJCgnaGVhZCcpKVxyXG5cdFx0fVxyXG5cdH0pXHJcbn07XHJcbiIsIiQkLm9iajJBcnJheSA9IGZ1bmN0aW9uKG9iaikge1xyXG5cdHZhciByZXQgPSBbXVxyXG5cdGZvcih2YXIga2V5IGluIG9iaikge1xyXG5cdFx0cmV0LnB1c2goe2tleToga2V5LCB2YWx1ZTogb2JqW2tleV19KVxyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcbn07XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcbnZhciBpbnB1dEZpbGUgPSAkKCc8aW5wdXQ+Jywge3R5cGU6ICdmaWxlJ30pLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuXHR2YXIgb25BcHBseSA9ICQodGhpcykuZGF0YSgnb25BcHBseScpXHJcblx0dmFyIGZpbGVOYW1lID0gdGhpcy5maWxlc1swXVxyXG5cdGlmICh0eXBlb2Ygb25BcHBseSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRvbkFwcGx5KGZpbGVOYW1lKVxyXG5cdH1cclxufSlcclxuXHJcbiQkLm9wZW5GaWxlRGlhbG9nID0gZnVuY3Rpb24ob25BcHBseSkge1xyXG5cdGlucHV0RmlsZS5kYXRhKCdvbkFwcGx5Jywgb25BcHBseSlcclxuXHRpbnB1dEZpbGUuY2xpY2soKVxyXG59XHJcblxyXG59KSgpO1xyXG5cclxuIiwiJCQucmVhZEZpbGVBc0RhdGFVUkwgPSBmdW5jdGlvbihmaWxlTmFtZSwgb25SZWFkKSB7XHJcblx0dmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXHJcblxyXG5cdGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAodHlwZW9mIG9uUmVhZCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdG9uUmVhZChmaWxlUmVhZGVyLnJlc3VsdClcclxuXHRcdH1cclxuXHR9XHJcblx0ZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGVOYW1lKVxyXG59O1xyXG4iLCIkJC5yZWFkVGV4dEZpbGUgPSBmdW5jdGlvbihmaWxlTmFtZSwgb25SZWFkKSB7XHJcblx0dmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXHJcblxyXG5cdGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAodHlwZW9mIG9uUmVhZCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdG9uUmVhZChmaWxlUmVhZGVyLnJlc3VsdClcclxuXHRcdH1cclxuXHR9XHJcblx0ZmlsZVJlYWRlci5yZWFkQXNUZXh0KGZpbGVOYW1lKVxyXG59O1xyXG4iXX0=

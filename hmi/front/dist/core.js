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
				var defaultOptions = $.extend(true, {}, elt.data('$options'))
				console.log(`[Core] instance control '${controlName}'`)
				ctrl.fn.apply(iface, args)	
				iface.options = defaultOptions
							
			}
			else if (typeof ctrl.fn == 'object') {
				var init = ctrl.fn.init
				var props = ctrl.fn.props || {}
				var defaultOptions = $.extend({}, ctrl.fn.options, elt.data('$options'))

				var options = {}

				for(var o in defaultOptions) {
					options[o] = (elt.data(o) != undefined) ? elt.data(o) : defaultOptions[o]
				}

				for(var p in props) {
					options[p] = (elt.data(p) != undefined) ? elt.data(p) : props[p].val
				}

				//console.log('Computed Options', options)

				if (typeof init == 'function') {

					var args = [elt, options].concat(ctrl.deps)
					console.log(`[Core] instance control '${controlName}' with options`, options)
					init.apply(iface, args)
					iface.options = options
					iface.events = ctrl.fn.events

					if (Object.keys(props).length != 0) {
						iface.setProp = function(name, value) {
							//console.log(`[Core] setData`, name, value)
							var setter = props[name] && props[name].set
							if (typeof setter == 'string') {
								var setter = iface[setter]
							}
							if (typeof setter == 'function') {
								setter.call(null, value)
							}
							
							iface.options[name] = value
						}

						iface.props = function() {
							var ret = {}
							for(var k in props) {
								ret[k] = iface.options[k]

								var getter = props[k].get
								if (typeof getter == 'string') {
									getter = iface[getter]											
								}
								if (typeof getter == 'function') {
									ret[k] = getter.call(null)
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYm9vdC9pbmRleC5qcyIsImNvbnRyb2xsZXJzL2RpYWxvZ0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9mb3JtRGlhbG9nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL3ZpZXcuanMiLCJjb3JlL2NvbnRyb2xzLmpzIiwiY29yZS9vYmplY3RzQW5kU2VydmljZXMuanMiLCJwbHVnaW5zL2JpbmRpbmcuanMiLCJwbHVnaW5zL2NvbnRyb2wuanMiLCJwbHVnaW5zL2V2ZW50LmpzIiwicGx1Z2lucy9mb3JtLmpzIiwicGx1Z2lucy9tZW51LmpzIiwicGx1Z2lucy90ZW1wbGF0ZS5qcyIsInBsdWdpbnMvdWkuanMiLCJwbHVnaW5zL3V0aWwuanMiLCJ1aS9zaG93QWxlcnQuanMiLCJ1aS9zaG93Q29uZmlybS5qcyIsInVpL3Nob3dQaWN0dXJlLmpzIiwidWkvc2hvd1Byb21wdC5qcyIsInV0aWwvY2hlY2tUeXBlLmpzIiwidXRpbC9kYXRhVVJMdG9CbG9iLmpzIiwidXRpbC9leHRyYWN0LmpzIiwidXRpbC9pc0ltYWdlLmpzIiwidXRpbC9sb2FkU3R5bGUuanMiLCJ1dGlsL29iajJBcnJheS5qcyIsInV0aWwvb3BlbkZpbGVEaWFsb2cuanMiLCJ1dGlsL3JlYWRGaWxlQXNEYXRhVVJMLmpzIiwidXRpbC9yZWFkVGV4dEZpbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtcclxuXHJcblx0XHJcblx0d2luZG93LiQkID0ge31cclxuXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpe1xyXG5cclxudmFyIGZuQ29uZmlnUmVhZHlcclxudmFyIGN1clJvdXRlXHJcblx0XHJcbiQkLmNvbmZpZ1JlYWR5ID0gZnVuY3Rpb24oZm4pIHtcclxuXHJcblx0Zm5Db25maWdSZWFkeSA9IGZuXHJcbn1cclxuXHJcbiQkLnN0YXJ0QXBwID0gZnVuY3Rpb24obWFpbkNvbnRyb2xOYW1lLCBjb25maWcpIHtcclxuXHQkJC52aWV3Q29udHJvbGxlcignYm9keScsIHtcclxuXHRcdHRlbXBsYXRlOiBgPGRpdiBibi1jb250cm9sPVwiJHttYWluQ29udHJvbE5hbWV9XCIgY2xhc3M9XCJtYWluUGFuZWxcIiBibi1vcHRpb25zPVwiY29uZmlnXCI+PC9kaXY+YCxcclxuXHRcdGRhdGE6IHtjb25maWd9XHJcblx0fSlcclxufVxyXG5cclxuZnVuY3Rpb24gcHJvY2Vzc1JvdXRlKCkge1xyXG5cdHZhciBwcmV2Um91dGUgPSBjdXJSb3V0ZVxyXG5cdHZhciBocmVmID0gbG9jYXRpb24uaHJlZlxyXG5cdHZhciBpZHggPSBocmVmLmluZGV4T2YoJyMnKVxyXG5cdGN1clJvdXRlID0gKGlkeCAhPT0gLTEpICA/IGhyZWYuc3Vic3RyKGlkeCsxKSA6ICcvJ1xyXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBuZXdSb3V0ZScsIGN1clJvdXRlLCBwcmV2Um91dGUpXHJcblxyXG5cclxuXHQkKHdpbmRvdykudHJpZ2dlcigncm91dGVDaGFuZ2UnLCB7Y3VyUm91dGU6Y3VyUm91dGUsIHByZXZSb3V0ZTogcHJldlJvdXRlfSlcclxuXHJcbn1cdFxyXG5cclxuJChmdW5jdGlvbigpIHtcclxuXHJcblx0dmFyIGFwcE5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnLycpWzJdXHJcblxyXG5cdGNvbnNvbGUubG9nKGBbQ29yZV0gQXBwICcke2FwcE5hbWV9JyBzdGFydGVkIDopYClcclxuXHRjb25zb2xlLmxvZygnW0NvcmVdIGpRdWVyeSB2ZXJzaW9uJywgJC5mbi5qcXVlcnkpXHJcblx0Y29uc29sZS5sb2coJ1tDb3JlXSBqUXVlcnkgVUkgdmVyc2lvbicsICQudWkudmVyc2lvbilcclxuXHJcblx0XHJcblxyXG5cclxuXHQkKHdpbmRvdykub24oJ3BvcHN0YXRlJywgZnVuY3Rpb24oZXZ0KSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdbcG9wc3RhdGVdIHN0YXRlJywgZXZ0LnN0YXRlKVxyXG5cdFx0cHJvY2Vzc1JvdXRlKClcclxuXHR9KVxyXG5cclxuXHJcblx0aWYgKHR5cGVvZiBmbkNvbmZpZ1JlYWR5ID09ICdmdW5jdGlvbicpIHtcclxuXHRcdCQuZ2V0SlNPTihgL2FwaS91c2Vycy9jb25maWcvJHthcHBOYW1lfWApXHJcblx0XHQudGhlbihmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0XHRcdCQkLmNvbmZpZ3VyZVNlcnZpY2UoJ1dlYlNvY2tldFNlcnZpY2UnLCB7aWQ6IGFwcE5hbWUgKyAnLicgKyBjb25maWcuJHVzZXJOYW1lICsgJy4nfSlcclxuXHRcdFx0JCgnYm9keScpLnByb2Nlc3NDb250cm9scygpIC8vIHByb2Nlc3MgSGVhZGVyQ29udHJvbFxyXG5cdFx0XHRcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRmbkNvbmZpZ1JlYWR5KGNvbmZpZylcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXRjaChlKSB7XHJcblx0XHRcdFx0dmFyIGh0bWwgPSBgXHJcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XHJcblx0XHRcdFx0XHRcdDxwIGNsYXNzPVwidzMtdGV4dC1yZWRcIj4ke2V9PC9wPlxyXG5cdFx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdFx0YFxyXG5cdFx0XHRcdCQoJ2JvZHknKS5odG1sKGh0bWwpXHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdFxyXG5cdFx0XHRwcm9jZXNzUm91dGUoKVxyXG5cdFx0fSlcclxuXHRcdC5jYXRjaCgoanF4aHIpID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ2pxeGhyJywganF4aHIpXHJcblx0XHRcdC8vdmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeShqcXhoci5yZXNwb25zZUpTT04sIG51bGwsIDQpXHJcblx0XHRcdHZhciB0ZXh0ID0ganF4aHIucmVzcG9uc2VUZXh0XHJcblx0XHRcdHZhciBodG1sID0gYFxyXG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cclxuXHRcdFx0XHRcdDxwIGNsYXNzPVwidzMtdGV4dC1yZWRcIj4ke3RleHR9PC9wPlxyXG5cdFx0XHRcdFx0PGEgaHJlZj1cIi9kaXNjb25uZWN0XCIgY2xhc3M9XCJ3My1idG4gdzMtYmx1ZVwiPkxvZ291dDwvYT5cclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0YFxyXG5cdFx0XHQkKCdib2R5JykuaHRtbChodG1sKVxyXG5cdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0Y29uc29sZS53YXJuKCdNaXNzaW5nIGZ1bmN0aW9uIGNvbmZpZ1JlYWR5ICEhJylcclxuXHR9XHJcblx0XHJcblxyXG59KVxyXG5cclxuXHRcclxufSkoKTtcclxuIiwiJCQuZGlhbG9nQ29udHJvbGxlciA9IGZ1bmN0aW9uKHRpdGxlLCBvcHRpb25zKSB7XHJcblx0dmFyIGRpdiA9ICQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblxyXG5cdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZGl2LCBvcHRpb25zKVxyXG5cdGRpdi5kaWFsb2coe1xyXG5cdFx0YXV0b09wZW46IGZhbHNlLFxyXG5cdFx0bW9kYWw6IHRydWUsXHJcblx0XHR3aWR0aDogJ2F1dG8nLFxyXG5cdFx0YnV0dG9uczoge1xyXG5cdFx0XHQnQ2FuY2VsJzogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0fSxcclxuXHRcdFx0J0FwcGx5JzogZnVuY3Rpb24oKSB7XHRcdFx0XHRcdFxyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uQXBwbHkgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0b3B0aW9ucy5vbkFwcGx5LmNhbGwoY3RybClcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0Y3RybC5zaG93ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRkaXYuZGlhbG9nKCdvcGVuJylcclxuXHR9XHJcblx0cmV0dXJuIGN0cmxcclxufTtcclxuXHJcbiIsIiQkLmZvcm1EaWFsb2dDb250cm9sbGVyID0gZnVuY3Rpb24odGl0bGUsIG9wdGlvbnMpIHtcclxuXHR2YXIgZGl2ID0gJCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHR2YXIgZm9ybSA9ICQoJzxmb3JtPicpXHJcblx0XHQuYXBwZW5kVG8oZGl2KVxyXG5cdFx0Lm9uKCdzdWJtaXQnLCBmdW5jdGlvbihldikge1xyXG5cdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRcdGRpdi5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uQXBwbHkgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdG9wdGlvbnMub25BcHBseS5jYWxsKGN0cmwsIGN0cmwuZWx0LmdldEZvcm1EYXRhKCkpXHJcblx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0fSlcclxuXHR2YXIgc3VibWl0QnRuID0gJCgnPGlucHV0PicsIHt0eXBlOiAnc3VibWl0JywgaGlkZGVuOiB0cnVlfSkuYXBwZW5kVG8oZm9ybSlcclxuXHJcblx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihmb3JtLCBvcHRpb25zKVxyXG5cdGRpdi5kaWFsb2coe1xyXG5cdFx0YXV0b09wZW46IGZhbHNlLFxyXG5cdFx0bW9kYWw6IHRydWUsXHJcblx0XHR3aWR0aDogJ2F1dG8nLFxyXG5cdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQvLyQodGhpcykuZGlhbG9nKCdkZXN0cm95JylcclxuXHRcdH0sXHJcblx0XHRidXR0b25zOiB7XHJcblx0XHRcdCdDYW5jZWwnOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHQnQXBwbHknOiBmdW5jdGlvbigpIHtcdFx0XHRcdFx0XHJcblx0XHRcdFx0c3VibWl0QnRuLmNsaWNrKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0Y3RybC5zaG93ID0gZnVuY3Rpb24oZGF0YSwgb25BcHBseSkge1xyXG5cdFx0aWYgKHR5cGVvZiBjdHJsLmJlZm9yZVNob3cgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRjdHJsLmJlZm9yZVNob3coKVxyXG5cdFx0fVxyXG5cdFx0b3B0aW9ucy5vbkFwcGx5ID0gb25BcHBseVxyXG5cdFx0Y3RybC5lbHQuc2V0Rm9ybURhdGEoZGF0YSlcclxuXHRcdGRpdi5kaWFsb2coJ29wZW4nKVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGN0cmxcclxufTtcclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG5cclxuXHJcbmNsYXNzIFZpZXdDb250cm9sbGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKGVsdCwgb3B0aW9ucykge1xyXG4gICAgXHQvL2NvbnNvbGUubG9nKCdWaWV3Q29udHJvbGxlcicsIG9wdGlvbnMpXHJcbiAgICBcdGlmICh0eXBlb2YgZWx0ID09ICdzdHJpbmcnKSB7XHJcbiAgICBcdFx0ZWx0ID0gJChlbHQpXHJcbiAgICBcdH1cclxuXHJcbiAgICBcdG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucylcclxuICAgICAgICB0aGlzLmVsdCA9IGVsdFxyXG5cclxuICAgICAgICB0aGlzLmVsdC5vbignZGF0YTp1cGRhdGUnLCAoZXYsIG5hbWUsIHZhbHVlLCBleGNsdWRlRWx0KSA9PiB7XHJcbiAgICAgICAgXHQvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIGRhdGE6Y2hhbmdlJywgbmFtZSwgdmFsdWUpXHJcbiAgICAgICAgXHR0aGlzLnNldERhdGEobmFtZSwgdmFsdWUsIGV4Y2x1ZGVFbHQpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRlbXBsYXRlID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgXHR0aGlzLmVsdCA9ICQob3B0aW9ucy50ZW1wbGF0ZSkuYXBwZW5kVG8oZWx0KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm1vZGVsID0gJC5leHRlbmQoe30sIG9wdGlvbnMuZGF0YSlcclxuICAgICAgICB0aGlzLnJ1bGVzID0gJC5leHRlbmQoe30sIG9wdGlvbnMucnVsZXMpXHJcbiAgICAgICAgdGhpcy53YXRjaGVzID0gJC5leHRlbmQoe30sIG9wdGlvbnMud2F0Y2hlcylcclxuXHJcbiAgICAgICAgLy8gZ2VuZXJhdGUgYXV0b21hdGljIHJ1bGVzIGZvciBjb21wdXRlZCBkYXRhIChha2EgZnVuY3Rpb24pXHJcbiAgICAgICAgZm9yKHZhciBrIGluIHRoaXMubW9kZWwpIHtcclxuICAgICAgICBcdHZhciBkYXRhID0gdGhpcy5tb2RlbFtrXVxyXG4gICAgICAgIFx0aWYgKHR5cGVvZiBkYXRhID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBcdFx0dmFyIGZ1bmNUZXh0ID0gZGF0YS50b1N0cmluZygpXHJcbiAgICAgICAgXHRcdC8vY29uc29sZS5sb2coJ2Z1bmNUZXh0JywgZnVuY1RleHQpXHJcbiAgICAgICAgXHRcdHZhciBydWxlcyA9IFtdXHJcbiAgICAgICAgXHRcdGZ1bmNUZXh0LnJlcGxhY2UoL3RoaXMuKFthLXpBLVowLTlfLV17MSx9KS9nLCBmdW5jdGlvbihtYXRjaCwgY2FwdHVyZU9uZSkge1xyXG4gICAgICAgIFx0XHRcdC8vY29uc29sZS5sb2coJ2NhcHR1cmVPbmUnLCBjYXB0dXJlT25lKVxyXG4gICAgICAgIFx0XHRcdHJ1bGVzLnB1c2goY2FwdHVyZU9uZSlcclxuICAgICAgICBcdFx0fSlcclxuICAgICAgICBcdFx0dGhpcy5ydWxlc1trXSA9IHJ1bGVzLnRvU3RyaW5nKClcclxuICAgICAgICBcdH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3J1bGVzJywgdGhpcy5ydWxlcylcclxuICAgICAgICB0aGlzLmRpckxpc3QgPSB0aGlzLmVsdC5wcm9jZXNzVUkodGhpcy5tb2RlbClcclxuXHJcblxyXG4gICAgICAgIC8vdGhpcy5lbHQucHJvY2Vzc1VJKHRoaXMubW9kZWwpXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmV2ZW50cyA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLmVsdC5wcm9jZXNzRXZlbnRzKG9wdGlvbnMuZXZlbnRzKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zY29wZSA9IHRoaXMuZWx0LnByb2Nlc3NCaW5kaW5ncygpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc2NvcGUnLCB0aGlzLnNjb3BlKVxyXG4gICAgICAgXHJcbiAgICAgICAgdmFyIGluaXQgPSBvcHRpb25zLmluaXRcclxuICAgICAgICBpZiAodHlwZW9mIGluaXQgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIFx0aW5pdC5jYWxsKHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfSBcclxuXHJcbiAgICBzZXREYXRhKGFyZzEsIGFyZzIsIGV4Y2x1ZGVFbHQpIHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHNldERhdGEnLCBhcmcxLCBhcmcyKVxyXG4gICAgICAgIHZhciBkYXRhID0gYXJnMVxyXG4gICAgICAgIGlmICh0eXBlb2YgYXJnMSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIFx0ZGF0YSA9IHt9XHJcbiAgICAgICAgXHRkYXRhW2FyZzFdID0gYXJnMlxyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHNldERhdGEnLCBkYXRhKVxyXG4gICAgICAgICQuZXh0ZW5kKHRoaXMubW9kZWwsIGRhdGEpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbW9kZWwnLCB0aGlzLm1vZGVsKVxyXG4gICAgICAgIHRoaXMudXBkYXRlKE9iamVjdC5rZXlzKGRhdGEpLCBleGNsdWRlRWx0KVxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShmaWVsZHNOYW1lLCBleGNsdWRlRWx0KSB7XHJcbiAgICBcdC8vY29uc29sZS5sb2coJ1tWaWV3Q29udHJvbGxlcl0gdXBkYXRlJywgZmllbGRzTmFtZSlcclxuICAgIFx0aWYgKHR5cGVvZiBmaWVsZHNOYW1lID09ICdzdHJpbmcnKSB7XHJcbiAgICBcdFx0ZmllbGRzTmFtZSA9IGZpZWxkc05hbWUuc3BsaXQoJywnKVxyXG4gICAgXHR9XHJcblxyXG5cclxuICAgIFx0aWYgKEFycmF5LmlzQXJyYXkoZmllbGRzTmFtZSkpIHtcclxuICAgIFx0XHR2YXIgZmllbGRzU2V0ID0ge31cclxuICAgIFx0XHRmaWVsZHNOYW1lLmZvckVhY2goKGZpZWxkKSA9PiB7XHJcblxyXG4gICAgXHRcdFx0dmFyIHdhdGNoID0gdGhpcy53YXRjaGVzW2ZpZWxkXVxyXG4gICAgXHRcdFx0aWYgKHR5cGVvZiB3YXRjaCA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBcdFx0XHRcdHdhdGNoLmNhbGwobnVsbCwgdGhpcy5tb2RlbFtmaWVsZF0pXHJcbiAgICBcdFx0XHR9XHJcbiAgICBcdFx0XHRmaWVsZHNTZXRbZmllbGRdID0gMVxyXG5cclxuICAgIFx0XHRcdGZvcih2YXIgcnVsZSBpbiB0aGlzLnJ1bGVzKSB7XHJcbiAgICBcdFx0XHRcdGlmICh0aGlzLnJ1bGVzW3J1bGVdLnNwbGl0KCcsJykuaW5kZXhPZihmaWVsZCkgIT0gLTEpIHtcclxuICAgIFx0XHRcdFx0XHRmaWVsZHNTZXRbcnVsZV0gPSAxXHJcbiAgICBcdFx0XHRcdH1cclxuICAgIFx0XHRcdH1cclxuICAgIFx0XHR9KVxyXG5cclxuXHJcbiAgICBcdFx0dGhpcy5lbHQudXBkYXRlVGVtcGxhdGUodGhpcy5kaXJMaXN0LCB0aGlzLm1vZGVsLCBPYmplY3Qua2V5cyhmaWVsZHNTZXQpLCBleGNsdWRlRWx0KVxyXG4gICAgXHR9XHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuICAgICQkLnZpZXdDb250cm9sbGVyID0gZnVuY3Rpb24gKGVsdCwgb3B0aW9ucykge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmlld0NvbnRyb2xsZXIoZWx0LCBvcHRpb25zKVxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKXtcclxuXHJcblxyXG5cclxuJCQucmVnaXN0ZXJDb250cm9sID0gZnVuY3Rpb24obmFtZSwgYXJnMSwgYXJnMikge1xyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdjb250cm9scycsIG5hbWUsIGFyZzEsIGFyZzIpXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4ID0gZnVuY3Rpb24obmFtZSwgb3B0aW9ucykge1xyXG5cdGlmICghJCQuY2hlY2tUeXBlKG9wdGlvbnMsIHtcclxuXHRcdCRkZXBzOiBbJ3N0cmluZyddLFxyXG5cdFx0JGlmYWNlOiAnc3RyaW5nJyxcclxuXHRcdCRldmVudHM6ICdzdHJpbmcnLFxyXG5cdFx0aW5pdDogJ2Z1bmN0aW9uJ1xyXG5cdH0pKSB7XHJcblx0XHRjb25zb2xlLmVycm9yKGBbQ29yZV0gcmVnaXN0ZXJDb250cm9sRXg6IGJhZCBvcHRpb25zYCwgb3B0aW9ucylcclxuXHRcdHJldHVyblxyXG5cdH1cclxuXHJcblxyXG5cdHZhciBkZXBzID0gb3B0aW9ucy5kZXBzIHx8IFtdXHJcblxyXG5cclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnY29udHJvbHMnLCBuYW1lLCBkZXBzLCBvcHRpb25zKVxyXG59XHJcblxyXG5cclxuXHJcbiQkLmNyZWF0ZUNvbnRyb2wgPSBmdW5jdGlvbihjb250cm9sTmFtZSwgZWx0KSB7XHJcblx0ZWx0LmFkZENsYXNzKGNvbnRyb2xOYW1lKVxyXG5cdGVsdC5hZGRDbGFzcygnQ3VzdG9tQ29udHJvbCcpLnVuaXF1ZUlkKClcdFxyXG5cdHZhciBjdHJsID0gJCQuZ2V0T2JqZWN0KCdjb250cm9scycsIGNvbnRyb2xOYW1lKVxyXG5cdFx0XHJcblx0aWYgKGN0cmwgIT0gdW5kZWZpbmVkKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdjcmVhdGVDb250cm9sJywgY29udHJvbE5hbWUsIGN0cmwpXHJcblx0XHRpZiAoY3RybC5zdGF0dXMgPT09ICAnb2snKSB7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgaWZhY2UgPSB7fVxyXG5cclxuXHRcdFx0XHJcblx0XHRcdGlmICh0eXBlb2YgY3RybC5mbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0dmFyIGFyZ3MgPSBbZWx0XS5jb25jYXQoY3RybC5kZXBzKVxyXG5cdFx0XHRcdHZhciBkZWZhdWx0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBlbHQuZGF0YSgnJG9wdGlvbnMnKSlcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhgW0NvcmVdIGluc3RhbmNlIGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9J2ApXHJcblx0XHRcdFx0Y3RybC5mbi5hcHBseShpZmFjZSwgYXJncylcdFxyXG5cdFx0XHRcdGlmYWNlLm9wdGlvbnMgPSBkZWZhdWx0T3B0aW9uc1xyXG5cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHR5cGVvZiBjdHJsLmZuID09ICdvYmplY3QnKSB7XHJcblx0XHRcdFx0dmFyIGluaXQgPSBjdHJsLmZuLmluaXRcclxuXHRcdFx0XHR2YXIgcHJvcHMgPSBjdHJsLmZuLnByb3BzIHx8IHt9XHJcblx0XHRcdFx0dmFyIGRlZmF1bHRPcHRpb25zID0gJC5leHRlbmQoe30sIGN0cmwuZm4ub3B0aW9ucywgZWx0LmRhdGEoJyRvcHRpb25zJykpXHJcblxyXG5cdFx0XHRcdHZhciBvcHRpb25zID0ge31cclxuXHJcblx0XHRcdFx0Zm9yKHZhciBvIGluIGRlZmF1bHRPcHRpb25zKSB7XHJcblx0XHRcdFx0XHRvcHRpb25zW29dID0gKGVsdC5kYXRhKG8pICE9IHVuZGVmaW5lZCkgPyBlbHQuZGF0YShvKSA6IGRlZmF1bHRPcHRpb25zW29dXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRmb3IodmFyIHAgaW4gcHJvcHMpIHtcclxuXHRcdFx0XHRcdG9wdGlvbnNbcF0gPSAoZWx0LmRhdGEocCkgIT0gdW5kZWZpbmVkKSA/IGVsdC5kYXRhKHApIDogcHJvcHNbcF0udmFsXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdDb21wdXRlZCBPcHRpb25zJywgb3B0aW9ucylcclxuXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBpbml0ID09ICdmdW5jdGlvbicpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgYXJncyA9IFtlbHQsIG9wdGlvbnNdLmNvbmNhdChjdHJsLmRlcHMpXHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgW0NvcmVdIGluc3RhbmNlIGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyB3aXRoIG9wdGlvbnNgLCBvcHRpb25zKVxyXG5cdFx0XHRcdFx0aW5pdC5hcHBseShpZmFjZSwgYXJncylcclxuXHRcdFx0XHRcdGlmYWNlLm9wdGlvbnMgPSBvcHRpb25zXHJcblx0XHRcdFx0XHRpZmFjZS5ldmVudHMgPSBjdHJsLmZuLmV2ZW50c1xyXG5cclxuXHRcdFx0XHRcdGlmIChPYmplY3Qua2V5cyhwcm9wcykubGVuZ3RoICE9IDApIHtcclxuXHRcdFx0XHRcdFx0aWZhY2Uuc2V0UHJvcCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW0NvcmVdIHNldERhdGFgLCBuYW1lLCB2YWx1ZSlcclxuXHRcdFx0XHRcdFx0XHR2YXIgc2V0dGVyID0gcHJvcHNbbmFtZV0gJiYgcHJvcHNbbmFtZV0uc2V0XHJcblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBzZXR0ZXIgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBzZXR0ZXIgPSBpZmFjZVtzZXR0ZXJdXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygc2V0dGVyID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHNldHRlci5jYWxsKG51bGwsIHZhbHVlKVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHRpZmFjZS5vcHRpb25zW25hbWVdID0gdmFsdWVcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWZhY2UucHJvcHMgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgcmV0ID0ge31cclxuXHRcdFx0XHRcdFx0XHRmb3IodmFyIGsgaW4gcHJvcHMpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHJldFtrXSA9IGlmYWNlLm9wdGlvbnNba11cclxuXHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgZ2V0dGVyID0gcHJvcHNba10uZ2V0XHJcblx0XHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGdldHRlciA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRnZXR0ZXIgPSBpZmFjZVtnZXR0ZXJdXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBnZXR0ZXIgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXRba10gPSBnZXR0ZXIuY2FsbChudWxsKVxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0XHJcblx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyBtaXNzaW5nIGluaXQgZnVuY3Rpb25gKVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmYWNlLm5hbWUgPSBjb250cm9sTmFtZVxyXG5cdFx0XHRlbHQuZ2V0KDApLmN0cmwgPSBpZmFjZVxyXG5cdFx0XHRcclxuXHRcdFx0cmV0dXJuIGlmYWNlXHRcdFx0XHRcclxuXHRcdH1cclxuXHJcblxyXG5cdH1cclxuXHRlbHNlIHtcclxuXHRcdHRocm93KGBbQ29yZV0gY29udHJvbCAnJHtjb250cm9sTmFtZX0nIGlzIG5vdCByZWdpc3RlcmVkYClcclxuXHR9XHJcbn1cclxuXHJcbiQkLmdldFJlZ2lzdGVyZWRDb250cm9scyA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBjb250cm9scyA9ICQkLmdldE9iamVjdERvbWFpbignY29udHJvbHMnKVxyXG5cdHJldHVybiBPYmplY3Qua2V5cyhjb250cm9scykuZmlsdGVyKChuYW1lKSA9PiAhbmFtZS5zdGFydHNXaXRoKCckJykpXHJcbn1cclxuXHJcbiQkLmdldFJlZ2lzdGVyZWRDb250cm9sc0V4ID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGNvbnRyb2xzID0gJCQuZ2V0T2JqZWN0RG9tYWluKCdjb250cm9scycpXHJcblx0dmFyIGxpYnMgPSB7fVxyXG5cdGZvcih2YXIgayBpbiBjb250cm9scykge1xyXG5cdFx0dmFyIGluZm8gPSBjb250cm9sc1trXS5mblxyXG5cdFx0dmFyIGxpYk5hbWUgPSBpbmZvLmxpYlxyXG5cdFx0aWYgKHR5cGVvZiBsaWJOYW1lID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdGlmIChsaWJzW2xpYk5hbWVdID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdGxpYnNbbGliTmFtZV0gPSBbXVxyXG5cdFx0XHR9XHJcblx0XHRcdGxpYnNbbGliTmFtZV0ucHVzaChrKVxyXG5cclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIGxpYnNcclxufVxyXG5cclxuJCQuZ2V0Q29udHJvbEluZm8gPSBmdW5jdGlvbihjb250cm9sTmFtZSkge1xyXG5cdHZhciBjb250cm9scyA9ICQkLmdldE9iamVjdERvbWFpbignY29udHJvbHMnKVxyXG5cdHZhciBpbmZvID0gY29udHJvbHNbY29udHJvbE5hbWVdXHJcblxyXG5cdGlmIChpbmZvID09IHVuZGVmaW5lZCkge1xyXG5cdFx0Y29uc29sZS5sb2coYGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXHJcblx0XHRyZXR1cm5cclxuXHR9XHJcblx0aW5mbyA9IGluZm8uZm5cclxuXHJcblx0dmFyIHJldCA9ICQkLmV4dHJhY3QoaW5mbywgJ2RlcHMsb3B0aW9ucyxsaWInKVxyXG5cclxuXHRpZiAodHlwZW9mIGluZm8uZXZlbnRzID09ICdzdHJpbmcnKSB7XHJcblx0XHRyZXQuZXZlbnRzID0gaW5mby5ldmVudHMuc3BsaXQoJywnKVxyXG5cdH1cclxuXHJcblx0dmFyIHByb3BzID0ge31cclxuXHRmb3IodmFyIGsgaW4gaW5mby5wcm9wcykge1xyXG5cdFx0cHJvcHNba10gPSBpbmZvLnByb3BzW2tdLnZhbFxyXG5cdH1cclxuXHRpZiAoT2JqZWN0LmtleXMocHJvcHMpLmxlbmd0aCAhPSAwKSB7XHJcblx0XHRyZXQucHJvcHMgPSBwcm9wc1xyXG5cdH1cclxuXHRpZiAodHlwZW9mIGluZm8uaWZhY2UgPT0gJ3N0cmluZycpIHtcclxuXHRcdHJldC5pZmFjZSA9IGluZm8uaWZhY2Uuc3BsaXQoJzsnKVxyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcblx0Ly9yZXR1cm4gY29udHJvbHNbY29udHJvbE5hbWVdLmZuXHJcbn1cclxuXHJcblxyXG4kJC5nZXRDb250cm9sc1RyZWUgPSBmdW5jdGlvbihzaG93V2hhdCkge1xyXG5cdHNob3dXaGF0ID0gc2hvd1doYXQgfHwgJydcclxuXHR2YXIgc2hvd09wdGlvbnMgPSBzaG93V2hhdC5zcGxpdCgnLCcpXHJcblx0dmFyIHRyZWUgPSBbXVxyXG5cdCQoJy5DdXN0b21Db250cm9sJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdHZhciBpZmFjZSA9ICQodGhpcykuaW50ZXJmYWNlKClcclxuXHJcblx0XHR2YXIgaXRlbSA9IHtuYW1lOmlmYWNlLm5hbWUsIGVsdDogJCh0aGlzKSwgcGFyZW50OiBudWxsfVxyXG5cdFx0aXRlbS5pZCA9ICQodGhpcykuYXR0cignaWQnKVxyXG5cclxuXHRcdGlmICh0eXBlb2YgaWZhY2UuZXZlbnRzID09ICdzdHJpbmcnICYmXHJcblx0XHRcdCgoc2hvd09wdGlvbnMuaW5kZXhPZignZXZlbnRzJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpKSkge1xyXG5cdFx0XHRpdGVtLmV2ZW50cyA9IGlmYWNlLmV2ZW50cy5zcGxpdCgnLCcpXHJcblx0XHR9XHRcdFx0XHJcblxyXG5cdFx0dHJlZS5wdXNoKGl0ZW0pXHJcblxyXG5cdFx0aWYgKHNob3dPcHRpb25zLmluZGV4T2YoJ2lmYWNlJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpIHtcclxuXHJcblx0XHRcdHZhciBmdW5jID0gW11cclxuXHRcdFx0Zm9yKHZhciBrIGluIGlmYWNlKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBpZmFjZVtrXSA9PSAnZnVuY3Rpb24nICYmIGsgIT0gJ3Byb3BzJyAmJiBrICE9ICdzZXRQcm9wJykge1xyXG5cdFx0XHRcdFx0ZnVuYy5wdXNoKGspXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChmdW5jLmxlbmd0aCAhPSAwKSB7XHJcblx0XHRcdFx0aXRlbS5pZmFjZSA9IGZ1bmNcclxuXHRcdFx0fVx0XHRcdFx0XHJcblx0XHR9XHJcblxyXG5cclxuXHJcblx0XHRpZiAodHlwZW9mIGlmYWNlLnByb3BzID09ICdmdW5jdGlvbicgJiYgXHJcblx0XHRcdCgoc2hvd09wdGlvbnMuaW5kZXhPZigncHJvcHMnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykpKSB7XHJcblx0XHRcdGl0ZW0ucHJvcHMgPSBpZmFjZS5wcm9wcygpXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBpZmFjZS5nZXRWYWx1ZSA9PSAnZnVuY3Rpb24nICYmXHJcblx0XHRcdCgoc2hvd09wdGlvbnMuaW5kZXhPZigndmFsdWUnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykpKSB7XHJcblx0XHRcdGl0ZW0udmFsdWUgPSBpZmFjZS5nZXRWYWx1ZSgpXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBpZmFjZS5vcHRpb25zID09ICdvYmplY3QnICYmIE9iamVjdC5rZXlzKGlmYWNlLm9wdGlvbnMpLmxlbmd0aCAhPSAwICYmXHJcblx0XHRcdCgoc2hvd09wdGlvbnMuaW5kZXhPZignb3B0aW9ucycpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcclxuXHRcdFx0aXRlbS5vcHRpb25zID0gaWZhY2Uub3B0aW9uc1xyXG5cdFx0fVx0XHJcblxyXG5cdFx0XHRcdFx0XHJcblx0XHQvL2NvbnNvbGUubG9nKCduYW1lJywgbmFtZSlcclxuXHRcdGl0ZW0uY2hpbGRzID0gW11cclxuXHJcblxyXG5cdFx0dmFyIHBhcmVudHMgPSAkKHRoaXMpLnBhcmVudHMoJy5DdXN0b21Db250cm9sJylcclxuXHRcdC8vY29uc29sZS5sb2coJ3BhcmVudHMnLCBwYXJlbnRzKVxyXG5cdFx0aWYgKHBhcmVudHMubGVuZ3RoICE9IDApIHtcclxuXHRcdFx0dmFyIHBhcmVudCA9IHBhcmVudHMuZXEoMClcclxuXHRcdFx0aXRlbS5wYXJlbnQgPSBwYXJlbnRcclxuXHRcdFx0dHJlZS5mb3JFYWNoKGZ1bmN0aW9uKGkpIHtcclxuXHRcdFx0XHRpZiAoaS5lbHQuZ2V0KDApID09IHBhcmVudC5nZXQoMCkpIHtcclxuXHRcdFx0XHRcdGkuY2hpbGRzLnB1c2goaXRlbSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHRcdFxyXG5cclxuXHRcdH1cclxuXHR9KVxyXG5cdC8vY29uc29sZS5sb2coJ3RyZWUnLCB0cmVlKVxyXG5cclxuXHR2YXIgcmV0ID0gW11cclxuXHR0cmVlLmZvckVhY2goZnVuY3Rpb24oaSkge1xyXG5cdFx0aWYgKGkucGFyZW50ID09IG51bGwpIHtcclxuXHRcdFx0cmV0LnB1c2goaSlcclxuXHRcdH1cclxuXHRcdGlmIChpLmNoaWxkcy5sZW5ndGggPT0gMCkge1xyXG5cdFx0XHRkZWxldGUgaS5jaGlsZHNcclxuXHRcdH1cclxuXHRcdGRlbGV0ZSBpLnBhcmVudFxyXG5cdFx0ZGVsZXRlIGkuZWx0XHJcblx0fSlcclxuXHJcblx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHJldCwgbnVsbCwgNClcclxuXHJcbn1cclxuXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpe1xyXG5cclxudmFyIHJlZ2lzdGVyZWRPYmplY3RzID0ge1xyXG5cdHNlcnZpY2VzOiB7fVxyXG59XHJcblxyXG52YXIge3NlcnZpY2VzfSA9IHJlZ2lzdGVyZWRPYmplY3RzXHJcblxyXG5mdW5jdGlvbiBpc0RlcHNPayhkZXBzKSB7XHJcblx0cmV0dXJuIGRlcHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xyXG5cclxuXHRcdHJldHVybiBwcmV2ICYmIChjdXIgIT0gdW5kZWZpbmVkKVxyXG5cdH0sIHRydWUpXHRcdFxyXG59XHJcblxyXG4kJC5nZXRPYmplY3REb21haW4gPSBmdW5jdGlvbihkb21haW4pIHtcclxuXHRyZXR1cm4gcmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXVxyXG59XHJcblxyXG4kJC5yZWdpc3Rlck9iamVjdCA9IGZ1bmN0aW9uKGRvbWFpbiwgbmFtZSwgYXJnMSwgYXJnMikge1xyXG5cdHZhciBkZXBzID0gW11cclxuXHR2YXIgZm4gPSBhcmcxXHJcblx0aWYgKEFycmF5LmlzQXJyYXkoYXJnMSkpIHtcclxuXHRcdGRlcHMgPSBhcmcxXHJcblx0XHRmbiA9IGFyZzJcclxuXHR9XHJcblx0aWYgKHR5cGVvZiBkb21haW4gIT0gJ3N0cmluZycgfHwgdHlwZW9mIG5hbWUgIT0gJ3N0cmluZycgfHwgdHlwZW9mIGZuID09ICd1bmRlZmluZWQnIHx8ICFBcnJheS5pc0FycmF5KGRlcHMpKSB7XHJcblx0XHR0aHJvdygnW0NvcmVdIHJlZ2lzdGVyT2JqZWN0IGNhbGxlZCB3aXRoIGJhZCBhcmd1bWVudHMnKVxyXG5cdH0gXHJcblx0Y29uc29sZS5sb2coYFtDb3JlXSByZWdpc3RlciBvYmplY3QgJyR7ZG9tYWlufToke25hbWV9JyB3aXRoIGRlcHNgLCBkZXBzKVxyXG5cdGlmIChyZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dID09IHVuZGVmaW5lZCkge1xyXG5cdFx0cmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXSA9IHt9XHJcblx0fVxyXG5cdHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl1bbmFtZV0gPSB7ZGVwczogZGVwcywgZm4gOmZuLCBzdGF0dXM6ICdub3Rsb2FkZWQnfVxyXG59XHRcclxuXHJcbiQkLmdldE9iamVjdCA9IGZ1bmN0aW9uKGRvbWFpbiwgbmFtZSkge1xyXG5cdC8vY29uc29sZS5sb2coYFtDb3JlXSBnZXRPYmplY3QgJHtkb21haW59OiR7bmFtZX1gKVxyXG5cdHZhciBkb21haW4gPSByZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dXHJcblx0dmFyIHJldCA9IGRvbWFpbiAmJiBkb21haW5bbmFtZV1cclxuXHRpZiAocmV0ICYmIHJldC5zdGF0dXMgPT0gJ25vdGxvYWRlZCcpIHtcclxuXHRcdHJldC5kZXBzID0gJCQuZ2V0U2VydmljZXMocmV0LmRlcHMpXHJcblx0XHRyZXQuc3RhdHVzID0gaXNEZXBzT2socmV0LmRlcHMpID8gJ29rJyA6ICdrbydcclxuXHR9XHJcblx0cmV0dXJuIHJldFxyXG59XHJcblxyXG4kJC5nZXRTZXJ2aWNlcyA9IGZ1bmN0aW9uKGRlcHMpIHtcclxuXHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gZ2V0U2VydmljZXMnLCBkZXBzKVxyXG5cdHJldHVybiBkZXBzLm1hcChmdW5jdGlvbihkZXBOYW1lKSB7XHJcblx0XHR2YXIgc3J2ID0gc2VydmljZXNbZGVwTmFtZV1cclxuXHRcdGlmIChzcnYpIHtcclxuXHRcdFx0aWYgKHNydi5zdGF0dXMgPT0gJ25vdGxvYWRlZCcpIHtcclxuXHRcdFx0XHR2YXIgZGVwczIgPSAkJC5nZXRTZXJ2aWNlcyhzcnYuZGVwcylcclxuXHRcdFx0XHR2YXIgY29uZmlnID0gc3J2LmNvbmZpZyB8fCB7fVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gaW5zdGFuY2Ugc2VydmljZSAnJHtkZXBOYW1lfScgd2l0aCBjb25maWdgLCBjb25maWcpXHJcblx0XHRcdFx0dmFyIGFyZ3MgPSBbY29uZmlnXS5jb25jYXQoZGVwczIpXHJcblx0XHRcdFx0c3J2Lm9iaiA9IHNydi5mbi5hcHBseShudWxsLCBhcmdzKVxyXG5cdFx0XHRcdHNydi5zdGF0dXMgPSAncmVhZHknXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHNydi5vYmpcdFx0XHRcdFxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdC8vc3J2LnN0YXR1cyA9ICdub3RyZWdpc3RlcmVkJ1xyXG5cdFx0XHR0aHJvdyhgW0NvcmVdIHNlcnZpY2UgJyR7ZGVwTmFtZX0nIGlzIG5vdCByZWdpc3RlcmVkYClcclxuXHRcdH1cclxuXHJcblx0fSlcclxufVxyXG5cclxuXHJcblxyXG4kJC5jb25maWd1cmVTZXJ2aWNlID0gZnVuY3Rpb24obmFtZSwgY29uZmlnKSB7XHJcblx0Y29uc29sZS5sb2coJ1tDb3JlXSBjb25maWd1cmVTZXJ2aWNlJywgbmFtZSwgY29uZmlnKVxyXG5cdGlmICh0eXBlb2YgbmFtZSAhPSAnc3RyaW5nJyB8fCB0eXBlb2YgY29uZmlnICE9ICdvYmplY3QnKSB7XHJcblx0XHRjb25zb2xlLndhcm4oJ1tDb3JlXSBjb25maWd1cmVTZXJ2aWNlIGNhbGxlZCB3aXRoIGJhZCBhcmd1bWVudHMnKVxyXG5cdFx0cmV0dXJuXHJcblx0fSBcdFxyXG5cclxuXHR2YXIgc3J2ID0gc2VydmljZXNbbmFtZV1cclxuXHRpZiAoc3J2KSB7XHJcblx0XHRzcnYuY29uZmlnID0gY29uZmlnXHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0dGhyb3coYFtjb25maWd1cmVTZXJ2aWNlXSBzZXJ2aWNlICcke25hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXHJcblx0fVxyXG5cclxufVxyXG5cclxuJCQucmVnaXN0ZXJTZXJ2aWNlID0gZnVuY3Rpb24obmFtZSwgYXJnMSwgYXJnMikge1xyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdzZXJ2aWNlcycsIG5hbWUsIGFyZzEsIGFyZzIpXHJcbn1cclxuXHJcbiQkLmdldFJlZ2lzdGVyZWRTZXJ2aWNlcyA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciByZXQgPSBbXVxyXG5cdGZvcih2YXIgayBpbiBzZXJ2aWNlcykge1xyXG5cdFx0dmFyIGluZm8gPSBzZXJ2aWNlc1trXVxyXG5cdFx0cmV0LnB1c2goe25hbWU6IGssIHN0YXR1czogaW5mby5zdGF0dXN9KVxyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcbn1cclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5wcm9jZXNzQmluZGluZ3MgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0XHR2YXIgZGF0YSA9IHt9XHJcblxyXG5cdFx0dGhpcy5ibkZpbmQoJ2JuLWJpbmQnLCB0cnVlLCBmdW5jdGlvbihlbHQsIHZhck5hbWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXHJcblx0XHRcdGRhdGFbdmFyTmFtZV0gPSBlbHRcclxuXHRcdH0pXHJcblx0XHR0aGlzLmJuRmluZCgnYm4taWZhY2UnLCB0cnVlLCBmdW5jdGlvbihlbHQsIHZhck5hbWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXHJcblx0XHRcdGRhdGFbdmFyTmFtZV0gPSBlbHQuaW50ZXJmYWNlKClcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gZGF0YVxyXG5cdFxyXG5cdH1cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cdFxyXG5cclxuXHJcblx0JC5mbi5nZXRQYXJlbnRJbnRlcmZhY2UgPSBmdW5jdGlvbihwYXJlbnRDdHJsTmFtZSkge1xyXG5cdFx0dmFyIHBhcmVudCA9IHRoaXMucGFyZW50KClcclxuXHRcdGlmICghcGFyZW50Lmhhc0NsYXNzKHBhcmVudEN0cmxOYW1lKSkge1xyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdHJldHVybiBwYXJlbnQuaW50ZXJmYWNlKClcdFx0XHJcblx0fVxyXG5cclxuXHQkLmZuLnByb2Nlc3NDb250cm9scyA9IGZ1bmN0aW9uKCBkYXRhKSB7XHJcblxyXG5cdFx0ZGF0YSA9IGRhdGEgfHwge31cclxuXHJcblx0XHR0aGlzLmJuRmlsdGVyKCdbYm4tY29udHJvbF0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxyXG5cclxuXHRcdFx0dmFyIGNvbnRyb2xOYW1lID0gZWx0LmF0dHIoJ2JuLWNvbnRyb2wnKVxyXG5cdFx0XHRlbHQucmVtb3ZlQXR0cignYm4tY29udHJvbCcpXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2NvbnRyb2xOYW1lJywgY29udHJvbE5hbWUpXHJcblxyXG5cclxuXHJcblx0XHRcdCQkLmNyZWF0ZUNvbnRyb2woY29udHJvbE5hbWUsIGVsdClcclxuXHRcdH0pXHJcblxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHJcblx0fVx0XHJcblxyXG5cdCQuZm4uaW50ZXJmYWNlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gKHRoaXMubGVuZ3RoID09IDApID8gbnVsbCA6IHRoaXMuZ2V0KDApLmN0cmxcclxuXHR9XHJcblxyXG5cdCQuZm4uZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Y29uc29sZS5sb2coJ1tDb3JlXSBkaXNwb3NlJylcclxuXHRcdHRoaXMuZmluZCgnLkN1c3RvbUNvbnRyb2wnKS5lYWNoKGZ1bmN0aW9uKCkge1x0XHRcclxuXHRcdFx0dmFyIGlmYWNlID0gJCh0aGlzKS5pbnRlcmZhY2UoKVxyXG5cdFx0XHRpZiAodHlwZW9mIGlmYWNlID09ICdvYmplY3QnICYmIHR5cGVvZiBpZmFjZS5kaXNwb3NlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRpZmFjZS5kaXNwb3NlKClcclxuXHRcdFx0fVxyXG5cdFx0XHRkZWxldGUgJCh0aGlzKS5nZXQoMCkuY3RybFxyXG5cdFx0fSlcclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4ucHJvY2Vzc0V2ZW50cyA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ3Byb2Nlc3NFdmVudHMnLCBkYXRhKVxyXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFtjb3JlXSBwcm9jZXNzRXZlbnRzIGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblx0XHR0aGlzLmJuRmluZEV4KCdibi1ldmVudCcsIHRydWUsIGZ1bmN0aW9uKGVsdCwgYXR0ck5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tZXZlbnQnLCBhdHRyTmFtZSwgdmFyTmFtZSlcclxuXHRcdFx0dmFyIGYgPSBhdHRyTmFtZS5zcGxpdCgnLicpXHJcblx0XHRcdHZhciBldmVudE5hbWUgPSBmWzBdXHJcblx0XHRcdHZhciBzZWxlY3RvciA9IGZbMV1cclxuXHJcblx0XHRcdHZhciBmbiA9IGRhdGFbdmFyTmFtZV1cclxuXHRcdFx0aWYgKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0dmFyIGlmYWNlID0gZWx0LmludGVyZmFjZSgpXHJcblx0XHRcdFx0aWYgKGlmYWNlICYmIHR5cGVvZiBpZmFjZS5vbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRpZmFjZS5vbihldmVudE5hbWUsIGZuLmJpbmQoaWZhY2UpKVxyXG5cdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR2YXIgdXNlTmF0aXZlRXZlbnRzID0gWydtb3VzZWVudGVyJywgJ21vdXNlbGVhdmUnXS5pbmRleE9mKGV2ZW50TmFtZSkgIT0gLTFcclxuXHJcblx0XHRcdFx0aWYgKHNlbGVjdG9yICE9IHVuZGVmaW5lZCkge1xyXG5cclxuXHRcdFx0XHRcdGlmICh1c2VOYXRpdmVFdmVudHMpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LmdldCgwKS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gJChldi50YXJnZXQpXHJcblx0XHRcdFx0XHRcdFx0aWYgKHRhcmdldC5oYXNDbGFzcyhzZWxlY3RvcikpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGZuLmNhbGwoZXYudGFyZ2V0LCBldilcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRlbHQub24oZXZlbnROYW1lLCAnLicgKyBzZWxlY3RvciwgZm4pXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGlmICh1c2VOYXRpdmVFdmVudHMpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LmdldCgwKS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGZuLmNhbGwoZXYudGFyZ2V0LCBldilcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0ZWx0Lm9uKGV2ZW50TmFtZSwgZm4pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc0V2ZW50czogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhIGZ1bmN0aW9uIGRlZmluZWQgaW4gZGF0YWAsIGRhdGEpXHJcblx0XHRcdH1cdFx0XHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHRcclxuXHR9XHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHR5cGUgPSB0aGlzLmF0dHIoJ3R5cGUnKVxyXG5cdFx0aWYgKHRoaXMuZ2V0KDApLnRhZ05hbWUgPT0gJ0lOUFVUJyAmJiB0eXBlID09ICdjaGVja2JveCcpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucHJvcCgnY2hlY2tlZCcpXHJcblx0XHR9XHJcblx0XHR2YXIgaWZhY2UgPSB0aGlzLmludGVyZmFjZSgpXHJcblx0XHRpZiAoaWZhY2UgJiYgdHlwZW9mIGlmYWNlLmdldFZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0cmV0dXJuIGlmYWNlLmdldFZhbHVlKClcclxuXHRcdH1cclxuXHRcdHZhciByZXQgPSB0aGlzLnZhbCgpXHJcblxyXG5cdFx0aWYgKHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAncmFuZ2UnKSB7XHJcblx0XHRcdHJldCA9IHBhcnNlRmxvYXQocmV0KVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHJldFxyXG5cdH1cclxuXHJcblxyXG5cdCQuZm4uc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0aWYgKHRoaXMuZ2V0KDApLnRhZ05hbWUgPT0gJ0lOUFVUJyAmJiB0aGlzLmF0dHIoJ3R5cGUnKSA9PSAnY2hlY2tib3gnKSB7XHJcblx0XHRcdHRoaXMucHJvcCgnY2hlY2tlZCcsIHZhbHVlKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgaWZhY2UgPSB0aGlzLmludGVyZmFjZSgpXHJcblx0XHRpZiAoaWZhY2UgJiYgdHlwZW9mIGlmYWNlLnNldFZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0aWZhY2Uuc2V0VmFsdWUodmFsdWUpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy52YWwodmFsdWUpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblxyXG5cdCQuZm4uZ2V0Rm9ybURhdGEgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciByZXQgPSB7fVxyXG5cdFx0dGhpcy5maW5kKCdbbmFtZV0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxyXG5cdFx0XHR2YXIgbmFtZSA9IGVsdC5hdHRyKCduYW1lJylcclxuXHRcdFx0cmV0W25hbWVdID0gZWx0LmdldFZhbHVlKClcclxuXHJcblx0XHR9KVxyXG5cclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cdCQuZm4uc2V0Rm9ybURhdGEgPSBmdW5jdGlvbihkYXRhKSB7XHJcblxyXG5cdFx0Zm9yKHZhciBuYW1lIGluIGRhdGEpIHtcclxuXHRcdFx0dmFyIGVsdCA9IHRoaXMuZmluZChgW25hbWU9JHtuYW1lfV1gKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW25hbWVdXHJcblx0XHRcdGVsdC5zZXRWYWx1ZSh2YWx1ZSlcclxuXHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxuXHQkLmZuLnByb2Nlc3NGb3JtRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0Zvcm1EYXRhIGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmJuRmluZCgnYm4tZm9ybScsIGZhbHNlLCBmdW5jdGlvbihlbHQsIHZhck5hbWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXHJcblx0XHRcdHZhciB2YWx1ZSA9IGRhdGFbdmFyTmFtZV1cclxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jykge1xyXG5cdFx0XHRcdGVsdC5zZXRGb3JtRGF0YSh2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBwcm9jZXNzRm9ybURhdGE6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gb2JqZWN0IGRlZmluZWQgaW4gZGF0YWAsIGRhdGEpXHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHRcclxuXHR9XHJcblxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHQkLmZuLnByb2Nlc3NDb250ZXh0TWVudSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0NvbnRleHRNZW51IGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmJuRmluZCgnYm4tbWVudScsIHRydWUsIGZ1bmN0aW9uKGVsdCwgdmFyTmFtZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibi10ZXh0JywgdmFyTmFtZSlcclxuXHRcdFx0dmFyIHZhbHVlID0gZGF0YVt2YXJOYW1lXVxyXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnKSB7XHJcblx0XHRcdFx0dmFyIGlkID0gZWx0LnVuaXF1ZUlkKCkuYXR0cignaWQnKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbcHJvY2Vzc0NvbnRleHRNZW51XSBpZCcsIGlkKVxyXG5cdFx0XHRcdCQuY29udGV4dE1lbnUoe1xyXG5cdFx0XHRcdFx0c2VsZWN0b3I6ICcjJyArIGlkLFxyXG5cdFx0XHRcdFx0Y2FsbGJhY2s6IGZ1bmN0aW9uKGtleSkge1xyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbcHJvY2Vzc0NvbnRleHRNZW51XSBjYWxsYmFjaycsIGtleSlcclxuXHRcdFx0XHRcdFx0ZWx0LnRyaWdnZXIoJ21lbnVDaGFuZ2UnLCBba2V5XSlcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRpdGVtczogdmFsdWVcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NDb250ZXh0TWVudTogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBvYmplY3QgZGVmaW5lZCBpbiBkYXRhYCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdFxyXG5cdH1cclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0ZnVuY3Rpb24gc3BsaXRBdHRyKGF0dHJWYWx1ZSwgY2JrKSB7XHJcblx0XHRhdHRyVmFsdWUuc3BsaXQoJywnKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHRcdFx0dmFyIGxpc3QgPSBpdGVtLnNwbGl0KCc6JylcclxuXHRcdFx0aWYgKGxpc3QubGVuZ3RoID09IDIpIHtcclxuXHRcdFx0XHR2YXIgbmFtZSA9IGxpc3RbMF0udHJpbSgpXHJcblx0XHRcdFx0dmFyIHZhbHVlID0gbGlzdFsxXS50cmltKClcclxuXHRcdFx0XHRjYmsobmFtZSwgdmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS5lcnJvcihgW0NvcmVdIHNwbGl0QXR0cigke2F0dHJOYW1lfSkgJ2F0dHJWYWx1ZScgbm90IGNvcnJlY3Q6YCwgaXRlbSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRWYXJWYWx1ZSh2YXJOYW1lLCBkYXRhKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdnZXRWYXJWYWx1ZScsIHZhck5hbWUsIGRhdGEpXHJcblx0XHR2YXIgcmV0ID0gZGF0YVxyXG5cdFx0Zm9yKGxldCBmIG9mIHZhck5hbWUuc3BsaXQoJy4nKSkge1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKHR5cGVvZiByZXQgPT0gJ29iamVjdCcgJiYgZiBpbiByZXQpIHtcclxuXHRcdFx0XHRyZXQgPSByZXRbZl1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUud2FybihgW0NvcmVdIGdldFZhclZhbHVlOiBhdHRyaWJ1dCAnJHt2YXJOYW1lfScgaXMgbm90IGluIG9iamVjdDpgLCBkYXRhKVxyXG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWRcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnZicsIGYsICdyZXQnLCByZXQpXHJcblx0XHR9XHJcblx0XHQvL2NvbnNvbGUubG9nKCdyZXQnLCByZXQpXHJcblx0XHRyZXR1cm4gcmV0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZuKSB7XHJcblxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGdldFZhbHVlJywgdmFyTmFtZSwgY3R4KVxyXG5cclxuXHRcdHZhciBub3QgPSBmYWxzZVxyXG5cdFx0aWYgKHZhck5hbWUuc3RhcnRzV2l0aCgnIScpKSB7XHJcblx0XHRcdHZhck5hbWUgPSB2YXJOYW1lLnN1YnN0cigxKVxyXG5cdFx0XHRub3QgPSB0cnVlXHJcblx0XHR9XHRcdFx0XHJcblxyXG5cdFx0dmFyIHByZWZpeE5hbWUgPSB2YXJOYW1lLnNwbGl0KCcuJylbMF1cclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBwcmVmaXhOYW1lJywgcHJlZml4TmFtZSlcclxuXHRcdGlmIChjdHgudmFyc1RvVXBkYXRlICYmIGN0eC52YXJzVG9VcGRhdGUuaW5kZXhPZihwcmVmaXhOYW1lKSA8IDApIHtcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGZ1bmMgPSBjdHguZGF0YVt2YXJOYW1lXVxyXG5cdFx0dmFyIHZhbHVlXHJcblxyXG5cdFx0aWYgKHR5cGVvZiBmdW5jID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0dmFsdWUgPSBmdW5jLmNhbGwoY3R4LmRhdGEpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dmFsdWUgPSBnZXRWYXJWYWx1ZSh2YXJOYW1lLCBjdHguZGF0YSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdC8vY29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc1RlbXBsYXRlOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGRlZmluZWQgaW4gb2JqZWN0IGRhdGE6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblx0XHQvL2NvbnNvbGUubG9nKCd2YWx1ZScsIHZhbHVlKVxyXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicgJiYgbm90KSB7XHJcblx0XHRcdHZhbHVlID0gIXZhbHVlXHJcblx0XHR9XHJcblx0XHRmbih2YWx1ZSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuSWYoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG5cdFx0XHRcdGN0eC5lbHQucmVtb3ZlKClcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBiblNob3coY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuXHRcdFx0XHRjdHguZWx0LmJuVmlzaWJsZSh2YWx1ZSlcclxuXHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGJuLXNob3c6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gYm9vbGVhbmAsIGRhdGEpXHJcblx0XHRcdH1cclxuXHRcdH0pXHRcdFxyXG5cdH1cclxuXHJcblxyXG5cdGZ1bmN0aW9uIGJuRWFjaChjdHgpIHtcclxuXHRcdHZhciBmID0gY3R4LmRpclZhbHVlLnNwbGl0KCcgJylcclxuXHRcdGlmIChmLmxlbmd0aCAhPSAzIHx8IGZbMV0gIT0gJ29mJykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKCdbQ29yZV0gYm4tZWFjaCBjYWxsZWQgd2l0aCBiYWQgYXJndW1lbnRzOicsIGRpclZhbHVlKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdHZhciBpdGVyID0gZlswXVxyXG5cdFx0dmFyIHZhck5hbWUgPSBmWzJdXHJcblx0XHQvL2NvbnNvbGUubG9nKCdibi1lYWNoIGl0ZXInLCBpdGVyLCAgY3R4LnRlbXBsYXRlKVxyXG5cdFx0XHJcblx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cclxuXHRcdFx0XHRjdHguZWx0LmVtcHR5KClcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR2YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHRcdFx0XHRcdHZhciBpdGVtRGF0YSA9ICQuZXh0ZW5kKHt9LCBjdHguZGF0YSlcclxuXHRcdFx0XHRcdGl0ZW1EYXRhW2l0ZXJdID0gaXRlbVxyXG5cdFx0XHRcdFx0Ly92YXIgJGl0ZW0gPSAkKGN0eC50ZW1wbGF0ZSlcclxuXHRcdFx0XHRcdHZhciAkaXRlbSA9IGN0eC50ZW1wbGF0ZS5jbG9uZSgpXHJcblx0XHRcdFx0XHQkaXRlbS5wcm9jZXNzVUkoaXRlbURhdGEpXHJcblx0XHRcdFx0XHRjdHguZWx0LmFwcGVuZCgkaXRlbSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHRcclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tZWFjaDogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBhcnJheWAsIGRhdGEpXHJcblx0XHRcdH1cdFx0XHRcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBiblRleHQoY3R4KSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gYm5UZXh0JywgY3R4KVxyXG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGN0eC5lbHQudGV4dCh2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cdFxyXG5cdGZ1bmN0aW9uIGJuSHRtbChjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHguZWx0Lmh0bWwodmFsdWUpXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5Db21ibyhjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHguZWx0LmluaXRDb21ibyh2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBibk9wdGlvbnMoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5kYXRhKCckb3B0aW9ucycsIHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cclxuXHRmdW5jdGlvbiBiblZhbChjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHguZWx0LnNldFZhbHVlKHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cclxuXHRmdW5jdGlvbiBiblByb3AoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihwcm9wTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuXHRcdFx0XHRcdGN0eC5lbHQucHJvcChwcm9wTmFtZSwgdmFsdWUpXHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBibi1wcm9wOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGJvb2xlYW5gLCBkYXRhKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcdFxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuQXR0cihjdHgpIHtcclxuXHRcdHNwbGl0QXR0cihjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKGF0dHJOYW1lLCB2YXJOYW1lKSB7XHJcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRjdHguZWx0LmF0dHIoYXR0ck5hbWUsIHZhbHVlKVxyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuU3R5bGUoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihhdHRyTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0Y3R4LmVsdC5jc3MoYXR0ck5hbWUsIHZhbHVlKVxyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cclxuXHRmdW5jdGlvbiBibkRhdGEoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihhdHRyTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0Y3R4LmVsdC5zZXRQcm9wKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5DbGFzcyhjdHgpIHtcclxuXHRcdHNwbGl0QXR0cihjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHByb3BOYW1lLCB2YXJOYW1lKSB7XHJcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xyXG5cdFx0XHRcdFx0aWYgKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGN0eC5lbHQuYWRkQ2xhc3MocHJvcE5hbWUpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0Y3R4LmVsdC5yZW1vdmVDbGFzcyhwcm9wTmFtZSlcclxuXHRcdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdH1cdFxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tY2xhc3M6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gYm9vbGVhbmAsIGRhdGEpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVx0XHJcblx0XHR9KVxyXG5cdH1cdFxyXG5cclxuXHJcblx0dmFyIGRpck1hcCA9IHtcclxuXHRcdCdibi1lYWNoJzogYm5FYWNoLFx0XHRcdFxyXG5cdFx0J2JuLWlmJzogYm5JZixcclxuXHRcdCdibi10ZXh0JzogYm5UZXh0LFx0XHJcblx0XHQnYm4taHRtbCc6IGJuSHRtbCxcclxuXHRcdCdibi1vcHRpb25zJzogYm5PcHRpb25zLFx0XHRcdFxyXG5cdFx0J2JuLWxpc3QnOiBibkNvbWJvLFx0XHRcdFxyXG5cdFx0J2JuLXZhbCc6IGJuVmFsLFx0XHJcblx0XHQnYm4tcHJvcCc6IGJuUHJvcCxcclxuXHRcdCdibi1hdHRyJzogYm5BdHRyLFx0XHJcblx0XHQnYm4tZGF0YSc6IGJuRGF0YSxcdFx0XHRcclxuXHRcdCdibi1jbGFzcyc6IGJuQ2xhc3MsXHJcblx0XHQnYm4tc2hvdyc6IGJuU2hvdyxcclxuXHRcdCdibi1zdHlsZSc6IGJuU3R5bGVcclxuXHR9XHJcblxyXG5cdCQuZm4uc2V0UHJvcCA9IGZ1bmN0aW9uKGF0dHJOYW1lLCB2YWx1ZSkge1xyXG5cdFx0dmFyIGlmYWNlID0gdGhpcy5pbnRlcmZhY2UoKVxyXG5cdFx0aWYgKGlmYWNlICYmIGlmYWNlLnNldFByb3ApIHtcclxuXHRcdFx0aWZhY2Uuc2V0UHJvcChhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy5kYXRhKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdH1cclxuXHJcblxyXG5cclxuXHQkLmZuLnByb2Nlc3NUZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBwcm9jZXNzVGVtcGxhdGUnKVxyXG5cdFx0dmFyIHRoYXQgPSB0aGlzXHJcblxyXG5cdFx0dmFyIGRpckxpc3QgPSBbXVxyXG5cclxuXHRcdGZvcihsZXQgayBpbiBkaXJNYXApIHtcclxuXHRcdFx0dGhpcy5ibkZpbmQoaywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCBkaXJWYWx1ZSkge1xyXG5cdFx0XHRcdHZhciB0ZW1wbGF0ZVxyXG5cdFx0XHRcdGlmIChrID09ICdibi1lYWNoJykge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGUgPSBlbHQuY2hpbGRyZW4oKS5yZW1vdmUoKS5jbG9uZSgpLy8uZ2V0KDApLm91dGVySFRNTFxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndGVtcGxhdGUnLCB0ZW1wbGF0ZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGsgPT0gJ2JuLXZhbCcpIHtcclxuXHRcdFx0XHRcdGVsdC5kYXRhKCckdmFsJywgZGlyVmFsdWUpXHJcblx0XHRcdFx0XHR2YXIgdXBkYXRlRXZlbnQgPSBlbHQuYXR0cignYm4tdXBkYXRlJylcclxuXHRcdFx0XHRcdGlmICh1cGRhdGVFdmVudCAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LnJlbW92ZUF0dHIoJ2JuLXVwZGF0ZScpXHJcblx0XHRcdFx0XHRcdGVsdC5vbih1cGRhdGVFdmVudCwgZnVuY3Rpb24oZXYsIHVpKSB7XHJcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndWknLCB1aSlcclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gKHVpICYmICB1aS52YWx1ZSkgfHwgICQodGhpcykuZ2V0VmFsdWUoKVxyXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHRcdFx0XHRcdFx0dGhhdC50cmlnZ2VyKCdkYXRhOnVwZGF0ZScsIFtkaXJWYWx1ZSwgdmFsdWUsIGVsdF0pXHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRkaXJMaXN0LnB1c2goe2RpcmVjdGl2ZTogaywgZWx0OiBlbHQsIGRpclZhbHVlOiBkaXJWYWx1ZSwgdGVtcGxhdGU6IHRlbXBsYXRlfSlcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGF0YSkge1xyXG5cdFx0XHR0aGlzLnVwZGF0ZVRlbXBsYXRlKGRpckxpc3QsIGRhdGEpXHJcblx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRyZXR1cm4gZGlyTGlzdFxyXG5cclxuXHR9XHRcclxuXHJcblx0JC5mbi51cGRhdGVUZW1wbGF0ZSA9IGZ1bmN0aW9uKGRpckxpc3QsIGRhdGEsIHZhcnNUb1VwZGF0ZSwgZXhjbHVkZUVsdCkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnW2NvcmVdIHVwZGF0ZVRlbXBsYXRlJywgZGF0YSwgdmFyc1RvVXBkYXRlKVxyXG5cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXHJcblx0XHR2YXJzVG9VcGRhdGUgPSB2YXJzVG9VcGRhdGUgfHwgT2JqZWN0LmtleXMoZGF0YSlcclxuXHRcdC8vY29uc29sZS5sb2coJ3ZhcnNUb1VwZGF0ZScsIHZhcnNUb1VwZGF0ZSlcclxuXHJcblx0XHRkaXJMaXN0LmZvckVhY2goZnVuY3Rpb24oZGlySXRlbSkge1xyXG5cdFx0XHR2YXIgZm4gPSBkaXJNYXBbZGlySXRlbS5kaXJlY3RpdmVdXHJcblx0XHRcdGlmICh0eXBlb2YgZm4gPT0gJ2Z1bmN0aW9uJyAmJiBkaXJJdGVtLmVsdCAhPSBleGNsdWRlRWx0KSB7XHJcblx0XHRcdFx0ZGlySXRlbS5kYXRhID0gZGF0YTtcclxuXHRcdFx0XHRkaXJJdGVtLnZhcnNUb1VwZGF0ZSA9IHZhcnNUb1VwZGF0ZTtcclxuXHRcdFx0XHRmbihkaXJJdGVtKVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcdFxyXG5cdFx0XHJcblxyXG5cdFx0XHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cclxuXHR9XHRcclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5wcm9jZXNzVUkgPSBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdwcm9jZXNzVUknLCBkYXRhLCB0aGlzLmh0bWwoKSlcclxuXHRcdHZhciBkaXJMaXN0ID0gdGhpcy5wcm9jZXNzVGVtcGxhdGUoZGF0YSlcclxuXHRcdHRoaXMucHJvY2Vzc0NvbnRyb2xzKGRhdGEpXHJcblx0XHQucHJvY2Vzc0Zvcm1EYXRhKGRhdGEpXHJcblx0XHQucHJvY2Vzc0NvbnRleHRNZW51KGRhdGEpXHJcblx0XHRyZXR1cm4gZGlyTGlzdFxyXG5cdH1cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkLmZuLmJuRmlsdGVyID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuXHRcdHJldHVybiB0aGlzLmZpbmQoc2VsZWN0b3IpLmFkZCh0aGlzLmZpbHRlcihzZWxlY3RvcikpXHJcblx0fVxyXG5cclxuXHQkLmZuLmJuRmluZCA9IGZ1bmN0aW9uKGF0dHJOYW1lLCByZW1vdmVBdHRyLCBjYmspIHtcclxuXHRcdHRoaXMuYm5GaWx0ZXIoYFske2F0dHJOYW1lfV1gKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxyXG5cdFx0XHR2YXIgYXR0clZhbHVlID0gZWx0LmF0dHIoYXR0ck5hbWUpXHJcblx0XHRcdGlmIChyZW1vdmVBdHRyKSB7XHJcblx0XHRcdFx0ZWx0LnJlbW92ZUF0dHIoYXR0ck5hbWUpXHJcblx0XHRcdH1cdFx0XHJcblx0XHRcdGNiayhlbHQsIGF0dHJWYWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHQkLmZuLmJuRmluZEV4ID0gZnVuY3Rpb24oYXR0ck5hbWUsIHJlbW92ZUF0dHIsIGNiaykge1xyXG5cdFx0dGhpcy5ibkZpbmQoYXR0ck5hbWUsIHJlbW92ZUF0dHIsIGZ1bmN0aW9uKGVsdCwgYXR0clZhbHVlKSB7XHJcblx0XHRcdGF0dHJWYWx1ZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHRcdHZhciBsaXN0ID0gaXRlbS5zcGxpdCgnOicpXHJcblx0XHRcdFx0aWYgKGxpc3QubGVuZ3RoID09IDIpIHtcclxuXHRcdFx0XHRcdHZhciBuYW1lID0gbGlzdFswXS50cmltKClcclxuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IGxpc3RbMV0udHJpbSgpXHJcblx0XHRcdFx0XHRjYmsoZWx0LCBuYW1lLCB2YWx1ZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGBbQ29yZV0gYm5GaW5kRXgoJHthdHRyTmFtZX0pICdhdHRyVmFsdWUnIG5vdCBjb3JyZWN0OmAsIGl0ZW0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdCQuZm4uYm5WaXNpYmxlID0gZnVuY3Rpb24oaXNWaXNpYmxlKSB7XHJcblx0XHRpZiAoaXNWaXNpYmxlKSB7XHJcblx0XHRcdHRoaXMuc2hvdygpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy5oaWRlKClcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzXHRcclxuXHR9XHJcblxyXG5cdCQuZm4uaW5pdENvbWJvID0gZnVuY3Rpb24odmFsdWVzKSB7XHJcblx0XHR0aGlzXHJcblx0XHQuZW1wdHkoKVxyXG5cdFx0LmFwcGVuZCh2YWx1ZXMubWFwKGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdHJldHVybiBgPG9wdGlvbiB2YWx1ZT0ke3ZhbHVlfT4ke3ZhbHVlfTwvb3B0aW9uPmBcclxuXHRcdH0pKVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxuXHJcbn0pKCk7XHJcbiIsIiQkLnNob3dBbGVydCA9IGZ1bmN0aW9uKHRleHQsIHRpdGxlLCBjYWxsYmFjaykge1xyXG5cdHRpdGxlID0gdGl0bGUgfHwgJ0luZm9ybWF0aW9uJ1xyXG5cdCQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblx0XHQuYXBwZW5kKCQoJzxwPicpLmh0bWwodGV4dCkpXHJcblx0XHQuZGlhbG9nKHtcclxuXHRcdFx0Y2xhc3Nlczoge1xyXG5cdFx0XHRcdCd1aS1kaWFsb2ctdGl0bGViYXItY2xvc2UnOiAnbm8tY2xvc2UnXHJcblx0XHRcdH0sXHJcblx0XHRcdHdpZHRoOiAnYXV0bycsXHJcblx0XHRcdG1vZGFsOiB0cnVlLFxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRidXR0b25zOiBbXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0dGV4dDogJ0Nsb3NlJyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRdXHJcblx0XHR9KVxyXG59O1x0XHJcblxyXG4iLCIkJC5zaG93Q29uZmlybSA9IGZ1bmN0aW9uKHRleHQsIHRpdGxlLCBjYWxsYmFjaykge1xyXG5cdHRpdGxlID0gdGl0bGUgfHwgJ0luZm9ybWF0aW9uJ1xyXG5cdCQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblx0XHQuYXBwZW5kKCQoJzxwPicpLmh0bWwodGV4dCkpXHJcblx0XHQuZGlhbG9nKHtcclxuXHJcblx0XHRcdG1vZGFsOiB0cnVlLFxyXG5cclxuXHRcdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdkZXN0cm95JylcclxuXHRcdFx0fSxcclxuXHRcdFx0YnV0dG9uczogW1xyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRleHQ6ICdDYW5jZWwnLFxyXG5cdFx0XHRcdFx0Ly9jbGFzczogJ3czLWJ1dHRvbiB3My1yZWQgYm4tbm8tY29ybmVyJyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnT0snLFxyXG5cdFx0XHRcdFx0Ly9jbGFzczogJ3czLWJ1dHRvbiB3My1ibHVlIGJuLW5vLWNvcm5lcicsXHJcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKClcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHRcdFx0XHJcblx0XHRcdF1cclxuXHRcdH0pXHJcbn07XHJcblx0XHJcblxyXG4iLCIkJC5zaG93UGljdHVyZSA9IGZ1bmN0aW9uKHRpdGxlLCBwaWN0dXJlVXJsKSB7XHJcblx0JCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHRcdC5hcHBlbmQoJCgnPGRpdj4nLCB7Y2xhc3M6ICdibi1mbGV4LWNvbCBibi1hbGlnbi1jZW50ZXInfSlcclxuXHRcdFx0LmFwcGVuZCgkKCc8aW1nPicsIHtzcmM6IHBpY3R1cmVVcmx9KSlcclxuXHRcdClcclxuXHRcdC5kaWFsb2coe1xyXG5cclxuXHRcdFx0bW9kYWw6IHRydWUsXHJcblx0XHRcdHdpZHRoOiAnYXV0bycsXHJcblx0XHRcdG1heEhlaWdodDogNjAwLFxyXG5cdFx0XHRtYXhXaWR0aDogNjAwLFxyXG5cdFx0XHQvL3Bvc2l0aW9uOiB7bXk6ICdjZW50ZXIgY2VudGVyJywgYXQ6ICdjZW50ZXIgY2VudGVyJ30sXHJcblxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSlcclxufTtcclxuXHJcblxyXG5cclxuIiwiJCQuc2hvd1Byb21wdCA9IGZ1bmN0aW9uKGxhYmVsLCB0aXRsZSwgY2FsbGJhY2ssIG9wdGlvbnMpIHtcclxuXHR0aXRsZSA9IHRpdGxlIHx8ICdJbmZvcm1hdGlvbidcclxuXHRvcHRpb25zID0gJC5leHRlbmQoe3R5cGU6ICd0ZXh0J30sIG9wdGlvbnMpXHJcblx0Ly9jb25zb2xlLmxvZygnb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdHZhciBkaXYgPSAkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxyXG5cdFx0LmFwcGVuZCgkKCc8Zm9ybT4nKVxyXG5cdFx0XHQuYXBwZW5kKCQoJzxwPicpLnRleHQobGFiZWwpKVxyXG5cdFx0XHQuYXBwZW5kKCQoJzxpbnB1dD4nLCB7Y2xhc3M6ICd2YWx1ZSd9KS5hdHRyKG9wdGlvbnMpLnByb3AoJ3JlcXVpcmVkJywgdHJ1ZSkuY3NzKCd3aWR0aCcsICcxMDAlJykpXHJcblx0XHRcdC5hcHBlbmQoJCgnPGlucHV0PicsIHt0eXBlOiAnc3VibWl0J30pLmhpZGUoKSlcclxuXHRcdFx0Lm9uKCdzdWJtaXQnLCBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcclxuXHRcdFx0XHRkaXYuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHR2YXIgdmFsID0gZGl2LmZpbmQoJy52YWx1ZScpLnZhbCgpXHJcblx0XHRcdFx0XHRjYWxsYmFjayh2YWwpXHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdH0pXHJcblx0XHQpXHJcblx0XHQuZGlhbG9nKHtcclxuXHRcdFx0Y2xhc3Nlczoge1xyXG5cdFx0XHRcdCd1aS1kaWFsb2ctdGl0bGViYXItY2xvc2UnOiAnbm8tY2xvc2UnXHJcblx0XHRcdH0sXHJcblx0XHRcdG1vZGFsOiB0cnVlLFxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRidXR0b25zOiBbXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0dGV4dDogJ0NhbmNlbCcsXHJcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnQXBwbHknLFxyXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmZpbmQoJ1t0eXBlPXN1Ym1pdF0nKS5jbGljaygpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRdXHJcblx0XHR9KVxyXG59O1xyXG5cclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG5cdFxyXG5cdGZ1bmN0aW9uIGlzT2JqZWN0KGEpIHtcclxuXHRcdHJldHVybiAodHlwZW9mIGEgPT0gJ29iamVjdCcpICYmICFBcnJheS5pc0FycmF5KGEpXHJcblx0fVxyXG5cclxuXHQkJC5jaGVja1R5cGUgPSBmdW5jdGlvbih2YWx1ZSwgdHlwZSwgaXNPcHRpb25hbCkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnY2hlY2tUeXBlJyx2YWx1ZSwgdHlwZSwgaXNPcHRpb25hbClcclxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3VuZGVmaW5lZCcgJiYgaXNPcHRpb25hbCA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgdHlwZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09IHR5cGVcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHR5cGUpKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICh0eXBlLmxlbmd0aCA9PSAwKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWUgLy8gbm8gaXRlbSB0eXBlIGNoZWNraW5nXHJcblx0XHRcdH1cclxuXHRcdFx0Zm9yKGxldCBpIG9mIHZhbHVlKSB7XHJcblx0XHRcdFx0dmFyIHJldCA9IGZhbHNlXHJcblx0XHRcdFx0Zm9yKGxldCB0IG9mIHR5cGUpIHtcclxuXHRcdFx0XHRcdHJldCB8PSAkJC5jaGVja1R5cGUoaSwgdClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCFyZXQpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaXNPYmplY3QodHlwZSkpIHtcclxuXHRcdFx0aWYgKCFpc09iamVjdCh2YWx1ZSkpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IobGV0IGYgaW4gdHlwZSkge1xyXG5cclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmJywgZiwgJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHRcdFx0dmFyIG5ld1R5cGUgPSB0eXBlW2ZdXHJcblxyXG5cdFx0XHRcdHZhciBpc09wdGlvbmFsID0gZmFsc2VcclxuXHRcdFx0XHRpZiAoZi5zdGFydHNXaXRoKCckJykpIHtcclxuXHRcdFx0XHRcdGYgPSBmLnN1YnN0cigxKVxyXG5cdFx0XHRcdFx0aXNPcHRpb25hbCA9IHRydWVcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCEkJC5jaGVja1R5cGUodmFsdWVbZl0sIG5ld1R5cGUsIGlzT3B0aW9uYWwpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGZhbHNlXHJcblx0fVx0XHJcblxyXG5cclxufSkoKTtcclxuIiwiJCQuZGF0YVVSTHRvQmxvYiA9IGZ1bmN0aW9uKGRhdGFVUkwpIHtcclxuICAvLyBEZWNvZGUgdGhlIGRhdGFVUkxcclxuICB2YXIgc3BsaXQgPSBkYXRhVVJMLnNwbGl0KC9bOiw7XS8pXHJcbiAgdmFyIG1pbWVUeXBlID0gc3BsaXRbMV1cclxuICB2YXIgZW5jb2RhZ2UgPSBzcGxpdFsyXVxyXG4gIGlmIChlbmNvZGFnZSAhPSAnYmFzZTY0Jykge1xyXG4gIFx0cmV0dXJuXHJcbiAgfVxyXG4gIHZhciBkYXRhID0gc3BsaXRbM11cclxuXHJcbiAgY29uc29sZS5sb2coJ21pbWVUeXBlJywgbWltZVR5cGUpXHJcbiAgY29uc29sZS5sb2coJ2VuY29kYWdlJywgZW5jb2RhZ2UpXHJcbiAgLy9jb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXHJcblxyXG4gIHZhciBiaW5hcnkgPSBhdG9iKGRhdGEpXHJcbiAvLyBDcmVhdGUgOC1iaXQgdW5zaWduZWQgYXJyYXlcclxuICB2YXIgYXJyYXkgPSBbXVxyXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBiaW5hcnkubGVuZ3RoOyBpKyspIHtcclxuICBcdGFycmF5LnB1c2goYmluYXJ5LmNoYXJDb2RlQXQoaSkpXHJcbiAgfVxyXG5cclxuICAvLyBSZXR1cm4gb3VyIEJsb2Igb2JqZWN0XHJcblx0cmV0dXJuIG5ldyBCbG9iKFsgbmV3IFVpbnQ4QXJyYXkoYXJyYXkpIF0sIHttaW1lVHlwZX0pXHJcbn07XHJcbiIsIiQkLmV4dHJhY3QgPSBmdW5jdGlvbihvYmosIHZhbHVlcykge1xyXG5cdGlmICh0eXBlb2YgdmFsdWVzID09ICdzdHJpbmcnKSB7XHJcblx0XHR2YWx1ZXMgPSB2YWx1ZXMuc3BsaXQoJywnKVxyXG5cdH1cclxuXHRpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSAmJiB0eXBlb2YgdmFsdWVzID09ICdvYmplY3QnKSB7XHJcblx0XHR2YWx1ZXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpXHJcblx0fVxyXG5cdHZhciByZXQgPSB7fVxyXG5cdGZvcih2YXIgayBpbiBvYmopIHtcclxuXHRcdGlmICh2YWx1ZXMuaW5kZXhPZihrKSA+PSAwKSB7XHJcblx0XHRcdHJldFtrXSA9IG9ialtrXVxyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcbn07XHJcbiIsIiQkLmlzSW1hZ2UgPSBmdW5jdGlvbihmaWxlTmFtZSkge1xyXG5cdHJldHVybiAoL1xcLihnaWZ8anBnfGpwZWd8cG5nKSQvaSkudGVzdChmaWxlTmFtZSlcclxufTtcclxuIiwiJCQubG9hZFN0eWxlID0gZnVuY3Rpb24oc3R5bGVGaWxlUGF0aCwgY2FsbGJhY2spIHtcdFxyXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBsb2FkU3R5bGUnLCBzdHlsZUZpbGVQYXRoKVxyXG5cclxuXHQkKGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGNzc09rID0gJCgnaGVhZCcpLmZpbmQoYGxpbmtbaHJlZj1cIiR7c3R5bGVGaWxlUGF0aH1cIl1gKS5sZW5ndGhcclxuXHRcdGlmIChjc3NPayAhPSAxKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gbG9hZGluZyAnJHtzdHlsZUZpbGVQYXRofScgZGVwZW5kYW5jeWApXHJcblx0XHRcdCQoJzxsaW5rPicsIHtocmVmOiBzdHlsZUZpbGVQYXRoLCByZWw6ICdzdHlsZXNoZWV0J30pXHJcblx0XHRcdC5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gJyR7c3R5bGVGaWxlUGF0aH0nIGxvYWRlZGApXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRjYWxsYmFjaygpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0XHQuYXBwZW5kVG8oJCgnaGVhZCcpKVxyXG5cdFx0fVxyXG5cdH0pXHJcbn07XHJcbiIsIiQkLm9iajJBcnJheSA9IGZ1bmN0aW9uKG9iaikge1xyXG5cdHZhciByZXQgPSBbXVxyXG5cdGZvcih2YXIga2V5IGluIG9iaikge1xyXG5cdFx0cmV0LnB1c2goe2tleToga2V5LCB2YWx1ZTogb2JqW2tleV19KVxyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcbn07XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcbnZhciBpbnB1dEZpbGUgPSAkKCc8aW5wdXQ+Jywge3R5cGU6ICdmaWxlJ30pLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuXHR2YXIgb25BcHBseSA9ICQodGhpcykuZGF0YSgnb25BcHBseScpXHJcblx0dmFyIGZpbGVOYW1lID0gdGhpcy5maWxlc1swXVxyXG5cdGlmICh0eXBlb2Ygb25BcHBseSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRvbkFwcGx5KGZpbGVOYW1lKVxyXG5cdH1cclxufSlcclxuXHJcbiQkLm9wZW5GaWxlRGlhbG9nID0gZnVuY3Rpb24ob25BcHBseSkge1xyXG5cdGlucHV0RmlsZS5kYXRhKCdvbkFwcGx5Jywgb25BcHBseSlcclxuXHRpbnB1dEZpbGUuY2xpY2soKVxyXG59XHJcblxyXG59KSgpO1xyXG5cclxuIiwiJCQucmVhZEZpbGVBc0RhdGFVUkwgPSBmdW5jdGlvbihmaWxlTmFtZSwgb25SZWFkKSB7XHJcblx0dmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXHJcblxyXG5cdGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAodHlwZW9mIG9uUmVhZCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdG9uUmVhZChmaWxlUmVhZGVyLnJlc3VsdClcclxuXHRcdH1cclxuXHR9XHJcblx0ZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGVOYW1lKVxyXG59O1xyXG4iLCIkJC5yZWFkVGV4dEZpbGUgPSBmdW5jdGlvbihmaWxlTmFtZSwgb25SZWFkKSB7XHJcblx0dmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXHJcblxyXG5cdGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAodHlwZW9mIG9uUmVhZCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdG9uUmVhZChmaWxlUmVhZGVyLnJlc3VsdClcclxuXHRcdH1cclxuXHR9XHJcblx0ZmlsZVJlYWRlci5yZWFkQXNUZXh0KGZpbGVOYW1lKVxyXG59O1xyXG4iXX0=

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
(function(exports) {
	var registeredObjects = {
		controls: {},
		services: {}
	}

	var {controls, services} = registeredObjects
	var fnConfigReady
	var curRoute
	var inputFile = $('<input>', {type: 'file'}).on('change', function() {
		var onApply = $(this).data('onApply')
		var fileName = this.files[0]
		if (typeof onApply == 'function') {
			onApply(fileName)
		}
	})

	function openFileDialog(onApply) {
		inputFile.data('onApply', onApply)
		inputFile.click()
	}

	function readTextFile(fileName, onRead) {
		var fileReader = new FileReader()

		fileReader.onload = function() {
			if (typeof onRead == 'function') {
				onRead(fileReader.result)
			}
		}
		fileReader.readAsText(fileName)
	}

	function readFileAsDataURL(fileName, onRead) {
		var fileReader = new FileReader()

		fileReader.onload = function() {
			if (typeof onRead == 'function') {
				onRead(fileReader.result)
			}
		}
		fileReader.readAsDataURL(fileName)
	}	

	function configReady(fn) {

		fnConfigReady = fn
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

				configureService('WebSocketService', {id: appName + '.' + config.$userName + '.'})
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

	function getServices(deps) {
		//console.log('[Core] getServices', deps)
		return deps.map(function(depName) {
			var srv = services[depName]
			if (srv) {
				if (srv.status == 'notloaded') {
					var deps2 = getServices(srv.deps)
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



	function configureService(name, config) {
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

	function registerObject(domain, name, arg1, arg2) {
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

	function getObject(domain, name) {
		//console.log(`[Core] getObject ${domain}:${name}`)
		var domain = registeredObjects[domain]
		var ret = domain && domain[name]
		if (ret && ret.status == 'notloaded') {
			ret.deps = getServices(ret.deps)
			ret.status = isDepsOk(ret.deps) ? 'ok' : 'ko'
		}
		return ret
	}

	function getObjectInfo(domain, name) {
		var domain = registeredObjects[domain]
		return domain && domain[name]
	}

	function registerService(name, arg1, arg2) {
		registerObject('services', name, arg1, arg2)
	}	

	function registerControl(name, arg1, arg2) {
		registerObject('controls', name, arg1, arg2)
	}

	function registerControlEx(name, options) {
		if (!checkType(options, {
			$deps: ['string'],
			$iface: 'string',
			$events: 'string',
			init: 'function'
		})) {
			console.error(`[Core] registerControlEx: bad options`, options)
			return
		}


		var deps = options.deps || []


		registerObject('controls', name, deps, options)
	}

	function isDepsOk(deps) {
		return deps.reduce(function(prev, cur) {

			return prev && (cur != undefined)
		}, true)		
	}

	function createControl(controlName, elt) {
		elt.addClass(controlName)
		elt.addClass('CustomControl').uniqueId()	
		var ctrl = getObject('controls', controlName)
			
		if (ctrl != undefined) {
			//console.log('createControl', controlName, ctrl)
			if (ctrl.status ===  'ok') {
				
				var iface

				
				if (typeof ctrl.fn == 'function') {
					var args = [elt].concat(ctrl.deps)
					var copyOptions = $.extend(true, {}, elt.getOptions())
					console.log(`[Core] instance control '${controlName}'`)
					iface = ctrl.fn.apply(null, args) || {}	
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
						iface = init.apply(ctx, args) || {}
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



	function obj2Array(obj) {
		var ret = []
		for(var key in obj) {
			ret.push({key: key, value: obj[key]})
		}
		return ret
	}



	function showAlert(text, title, callback) {
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
	}	


/*	$.extend( $.ui.dialog.prototype.options.classes, {
		'ui-dialog-titlebar-close': 'w3-button bn-no-corner',
		'ui-dialog': 'bn-no-padding',
		'ui-dialog-titlebar': 'w3-green'		
	})*/

	function showConfirm(text, title, callback) {
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
	}	

	function showPicture(title, pictureUrl) {
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
	}



	function showPrompt(label, title, callback, options) {
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
	}


	function dialogController(title, options) {
		var div = $('<div>', {title: title})

		var ctrl = viewController(div, options)
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
	}


	function formDialogController(title, options) {
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

		var ctrl = viewController(form, options)
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
	}



	function isObject(a) {
		return (typeof a == 'object') && !Array.isArray(a)
	}

	function checkType(value, type, isOptional) {
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
					ret |= checkType(i, t)
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
				if (!checkType(value[f], newType, isOptional)) {
					return false
				}

			}

			return true
		}
		return false
	}


    

    function viewController(elt, options) {
    	return new ViewController(elt, options)
    }

	function loadStyle(styleFilePath, callback) {	
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
	}

	function startApp(mainControlName, config) {
		$$.viewController('body', {
			template: `<div bn-control="${mainControlName}" class="mainPanel" bn-options="config"></div>`,
			data: {config}
		})
	}

	function dataURLtoBlob(dataURL) {
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
	}

	function isImage(fileName) {
		return (/\.(gif|jpg|jpeg|png)$/i).test(fileName)
	}

	function extract(obj, values) {
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
	}

	function getControlsTree(showWhat) {
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

	function getRegisteredControls() {
		return Object.keys(controls).filter((name) => !name.startsWith('$'))
	}

	function getRegisteredControlsEx() {
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

	function getRegisteredServices() {
		var ret = []
		for(var k in services) {
			var info = services[k]
			ret.push({name: k, status: info.status})
		}
		return ret
	}

	function getControlInfo(controlName) {
		var info = controls[controlName]

		if (info == undefined) {
			console.log(`control '${controlName}' is not registered`)
			return
		}
		info = info.fn




		var ret = extract(info, 'deps,options,lib')

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

	exports.$$ = {
		registerService: registerService,
		registerControl: registerControl,
		registerObject: registerObject,
		getObject: getObject,
		configureService: configureService,
		obj2Array: obj2Array,
		showPrompt: showPrompt,
		showAlert: showAlert,
		showConfirm: showConfirm,
		showPicture,
		dialogController: dialogController,
		formDialogController: formDialogController,
		configReady: configReady,
		getServices: getServices,
		checkType: checkType,
		createControl: createControl,
		viewController: viewController,
		loadStyle: loadStyle,
		openFileDialog: openFileDialog,
		readTextFile: readTextFile,
		startApp: startApp,
		dataURLtoBlob,
		readFileAsDataURL,
		isImage,
		getControlsTree,
		extract,
		registerControlEx,
		getObjectInfo,
		getRegisteredControls,
		getControlInfo,
		getRegisteredServices,
		getRegisteredControlsEx


	}



})(window);

// jQuery plugins





















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
		//console.log('processTemplate', data)
        var dirList = this.preProcessTemplate()
        //console.log('dirList', dirList)

        this.updateTemplate(dirList, data)
        return dirList
    }

	$.fn.preProcessTemplate = function() {
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

class ViewController {
    constructor(elt, options) {
    	console.log('ViewController', options)
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
    	console.log('[ViewController] update', fieldsName)
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
(function() {

'use strict';

var statusCodeMap = {
	0: 'OK',
	100: 'Service not available',
	200: 'Invalid parameters'
}

function getErrorMessage(statusCode) {
	return statusCodeMap[statusCode] || ''
}


function factory(EventEmitter2, ws) {



	class Client {

		constructor(id, options) {
			this.sock = null
			this.id = id
			this.isConnected = false
			this.topics = new EventEmitter2({wildcard: true})
			this.services = new EventEmitter2()
			this.events = new EventEmitter2()

			options = options || {}

			const port = options.masterPort || 8090
			const host = options.masterHost || '127.0.0.1'

			this.url = `ws://${host}:${port}/${id}`

			this.registeredTopics = {}
			this.registeredServices = {}
			this.waitingMsg = {}
			this.suspended = false
		}

		suspend() {
			this.suspended = true
		}

		resume() {
			if (this.suspended) {
				for(let topic in this.waitingMsg) {
					const msg = this.waitingMsg[topic]
					this.topics.emit(topic, msg)
				}
				this.waitingMsg = {}
				this.suspended = false
			}
		}

		connect() {
			console.log('try to connect...')

			var sock = ws.connect(this.url, () => {
				console.log("Connected to Master")
				this.isConnected = true
				this.events.emit('connect')

				for(let topic in this.registeredTopics) {
					var getLast = this.registeredTopics[topic]
					this.sendMsg({type: 'register', topic: topic, getLast: getLast})
				}

				for(let srvName in this.registeredServices) {
					this.sendMsg({type: 'registerService', srvName: srvName})
				}

			}) 

			sock.onText((text) => {
				var msg = JSON.parse(text)


				if (typeof msg.topic == 'string') {
					let split = msg.topic.split('.') // compute the id (layerId.objectId) from topic
					if (split.length == 3) {
						split.shift()
						msg.id = split.join('.')
					}					

					if (this.suspended) {
						this.waitingMsg[msg.topic] = msg
					}
					else {
						this.topics.emit(msg.topic, msg)				
					}

				}

				if (msg.type == 'callService') {
					this.handleCallService(msg)
				}				

				if (msg.type == 'callServiceResp') {
					this.services.emit(msg.srvName, msg)
				}				
			
			})

			sock.onClose((code, reason) => {
				//console.log('WS close', code, reason)
				if (this.isConnected) {
					console.log('Disconnected !')
					this.events.emit('disconnect')
				}
				this.isConnected = false
				setTimeout(() => {this.connect()}, 5000)

			})


			this.sock = sock		
		}

		handleCallService(msg) {
			//console.log('handleCallService')
			const func = this.registeredServices[msg.srvName]
			if (typeof func == 'function') {
				var respMsg = {
					type: 'callServiceResp',
					srvName: msg.srvName,
					dest: msg.src,
					statusCode: 0
				}
				func(msg.data, respMsg)
				this.sendMsg(respMsg)			
			}
		}

		sendMsg(msg) {
			//console.log('[Client] sendMsg', msg)
			msg.time = Date.now()
			var text = JSON.stringify(msg)
			if (this.isConnected) {
				this.sock.sendText(text)
			}
		}

		emit(topic, data) {
			//console.log('publish', topic, data)
			var msg = {
				type: 'notif',
				topic: topic
			}

			if (data !== undefined) {
				msg.data = data
			}
			this.sendMsg(msg)
		}

		on(topic, callback) {

			this.topics.on(topic, callback)
		}

		register(topics, getLast, callback) {
			if (typeof topics == 'string') {
				topics = [topics]
			}

			topics.forEach((topic) => {
				this.registeredTopics[topic] = getLast
				this.on(topic, callback)
				if (this.isConnected) {
					this.sendMsg({type: 'register', topic: topic, getLast: getLast})
				}
			})
			
		}

		unregister(topics, callback) {
			if (typeof topics == 'string') {
				topics = [topics]
			}

			topics.forEach((topic) => {

				this.topics.off(topic, callback)
				var nbListeners = this.topics.listeners(topic).length

				if (this.isConnected && nbListeners == 0) { // no more listeners for this topic
					this.sendMsg({type: 'unregister', topic: topic})
				}		
			})
		}		

		registerService(srvName, func) {
			this.registeredServices[srvName] = func
			if (this.isConnected) {
				this.sendMsg({type: 'registerService', srvName: srvName})
			}		
		}


		callService(srvName, data) {
			console.log('[Client] callService', srvName, data)
			var that = this
			return new Promise((resolve, reject) => {
				this.services.once(srvName, function(msg) {
					var statusCode = msg.statusCode
					if (statusCode == 0) {
						resolve(msg.data)
					}
					else {
						reject({
							code: statusCode,
							message: getErrorMessage(msg.statusCode)
						})
					}
				})

				this.sendMsg({
					type: 'callService',
					srvName: srvName,
					data: data
				})
			})
		}



		sendTo(dest, topic, data) {
			var msg = {
				type: 'cmd',
				topic: topic,
				dest: dest
			}

			if (data !== undefined) {
				msg.data = data
			}
			this.sendMsg(msg)		
		}	
		
	}

	return Client
}


if (typeof module != 'undefined') {
	const websocket = require("nodejs-websocket")
	const EventEmitter2 = require('EventEmitter2').EventEmitter2		

	var ws = {
		connect: function(url, onConnect) {
			var sock = websocket.connect(url, onConnect)
			sock.on('error', function(err) {
				console.log('ws error', err)
			})

			return {
				sendText: function(text) {
					sock.sendText(text)
				},
				onText: function(callback) {
					sock.on('text', callback)
				},
				onClose: function(callback) {
					sock.on('close', callback)
				}
			}
		}
	}

	module.exports = factory(EventEmitter2, ws)
}
else {

	var ws = {
		connect: function(url, onConnect) {
			var sock = new WebSocket(url)
			sock.addEventListener('open', onConnect)
			sock.addEventListener('error', function(err) {
				console.log('ws error', err)
			})


			return {
				sendText: function(text) {
					sock.send(text)
				},
				onText: function(callback) {
					sock.addEventListener('message', function(ev) {
						callback(ev.data)
					})
				},
				onClose: function(callback) {
					sock.addEventListener('close', callback)
				}
			}
		}
	}

	window.WebSocketClient = factory(EventEmitter2, ws)

}



})();

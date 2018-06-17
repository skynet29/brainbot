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
		configReady: configReady,
		loadStyle: loadStyle,
		openFileDialog: openFileDialog,
		readTextFile: readTextFile,
		startApp: startApp,
		dataURLtoBlob,
		readFileAsDataURL,
		isImage,
		getControlsTree,
		extract,
		getObjectInfo,
		getRegisteredControls,
		getControlInfo,
		getRegisteredServices,
		getRegisteredControlsEx


	}



})(window);

// jQuery plugins





















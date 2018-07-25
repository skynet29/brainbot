(function() {

	$$.registerControlEx('CarouselControl', {

		props: {

			index: {
				val: 0,
				set: 'setIndex'
			} 
		},
		options: {
			width: 300,
			height: 200,
			animateDelay: 1000,
		
		},
		iface: 'setIndex(idx);refresh()',

		
	lib: 'core',
init: function(elt, options) {
	


			var width = options.width + 'px'
			var height = options.height + 'px'
			elt.css('width', width).css('height', height)

			console.log(`[CarouselControl] options`, options)

			var ctrl = null
			var items
			var idx


			this.refresh = function() {
				//console.log('[CarouselControl] refresh')
				items = elt.children('div').remove().css('width', width).css('height', height)		

				idx = Math.max(0, Math.min(options.index, items.length))
				//console.log(`[CarouselControl] idx`, idx)

				function animate(direction) {
					ctrl.setData({leftDisabled: true, rightDisabled: true})
					var op = direction == 'left' ? '+=' : '-='
					idx = direction == 'left' ? idx-1 : idx+1

					ctrl.scope.items.animate({left: op + width}, options.animateDelay, function() {
						checkBtns()
					})
				}

				ctrl = $$.viewController(elt, {
					template: "<div class=\"container\">\r\n	<div class=\"viewport\">\r\n		<div class=\"items\" bn-bind=\"items\"></div>	\r\n	</div>\r\n	<div class=\"overlay\">\r\n		<div>\r\n			<button \r\n				bn-event=\"click: onLeft\" \r\n				bn-prop=\"hidden: leftDisabled\"\r\n				>\r\n				<i class=\"fa fa-2x fa-chevron-circle-left\"></i>\r\n			</button>			\r\n		</div>\r\n\r\n		<div>\r\n			<button \r\n				bn-event=\"click: onRight\" \r\n				bn-prop=\"hidden: rightDisabled\"\r\n			>\r\n				<i class=\"fa fa-2x fa-chevron-circle-right\"></i>\r\n			</button>			\r\n		</div>\r\n\r\n	</div>\r\n\r\n</div>",
					data: {
						leftDisabled: true,
						rightDisabled: false
					},
					init: function() {
						this.scope.items.append(items)
						this.scope.items.css('left', (-idx * options.width) + 'px')
						//checkBtns()
					},
					events: {
						onLeft: function() {
							animate('left')
						},
						onRight: function() {
							animate('right')
						}				
					}
				})
				checkBtns()		

			}		

			this.setIndex = function(index) {
				console.log('[CarouselControl] setIndex', index)
				idx =  Math.max(0, Math.min(index, items.length))
				ctrl.scope.items.css('left', (-idx * options.width) + 'px')
				checkBtns(idx)
			}

			function checkBtns() {
				//console.log('checkBtns', idx, items.length)
				ctrl.setData({
					leftDisabled: idx == 0,
					rightDisabled: idx == items.length - 1
				})
			}		

	 		this.refresh()

		}

	})

})();

$$.registerControlEx('CheckGroupControl', {
	
	lib: 'core',
init: function(elt) {

		elt.on('click', 'input[type=checkbox]', function() {
			elt.trigger('input')
		})

		this.getValue = function() {
			var ret = []
			elt.find('input[type=checkbox]:checked').each(function() {
				ret.push($(this).val())
			})	
			return ret	
		}

		this.setValue = function(value) {
			if (Array.isArray(value)) {
				elt.find('input[type=checkbox]').each(function() {
					$(this).prop('checked', value.indexOf($(this).val()) >= 0)
				})
			}		
		}

	}

});







$$.registerControlEx('HtmlEditorControl', {

	iface: 'html()',

	
	lib: 'core',
init: function(elt) {

		elt.addClass('bn-flex-row')

		var cmdArgs = {
			'foreColor': function() {
				return ctrl.model.color
			}
		}


		var ctrl = $$.viewController(elt, {
			template: "<div class=\"bn-flex-col bn-flex-1\">\r\n\r\n	<div bn-event=\"click.cmd: onCommand\">\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"bold\"><i class=\"fa fa-bold\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"italic\"><i class=\"fa fa-italic\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"underline\"><i class=\"fa fa-underline\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"strikeThrough\"><i class=\"fa fa-strikethrough\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"foreColor\" bn-menu=\"colorItems\" bn-event=\"menuChange: onColorMenuChange\"><i class=\"fa fa-pencil\" bn-style=\"color: color\"></i></button>\r\n		</div>\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"justifyLeft\"><i class=\"fa fa-align-left\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"justifyCenter\"><i class=\"fa fa-align-center\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"justifyRight\"><i class=\"fa fa-align-right\"></i></button>\r\n		</div>	\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"indent\"><i class=\"fa fa-indent\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"outdent\"><i class=\"fa fa-outdent\"></i></button>\r\n		</div>	\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"insertHorizontalRule\">hr</button>\r\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h1\">h1</button>\r\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h2\">h2</button>\r\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h3\">h3</button>\r\n		</div>		\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"insertUnorderedList\"><i class=\"fa fa-list-ul\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"insertOrderedList\"><i class=\"fa fa-list-ol\"></i></button>\r\n		</div>\r\n\r\n	</div>	\r\n	<div contenteditable=\"true\" class=\"bn-flex-1 editor\" bn-bind=\"editor\"></div>\r\n</div>\r\n",
			data: {
				color: 'blue',
				colorItems: {
					black: {name: 'Black'},
					red: {name: 'Red'},
					green: {name: 'Green'},
					blue: {name: 'Blue'},
					yellow: {name: 'Yellow'},
					cyan: {name: 'Cyan'},
					magenta: {name: 'Magenta'}
				}
			},
			events: {
				onCommand: function() {

					var cmd = $(this).data('cmd')
					var cmdArg = $(this).data('cmdArg')
					//console.log('onCommand', cmd, cmdArg)

					var cmdArg = cmdArg || cmdArgs[cmd]
					if (typeof cmdArg == 'function') {
						cmdArg = cmdArg()
					}
					//console.log('onCommand', cmd, cmdArg)

					document.execCommand(cmd, false, cmdArg)
				
				},
				onColorMenuChange: function(ev, color) {
					//console.log('onColorMenuChange', color)
					ctrl.setData({color})
				}

			}

		})

		this.html = function() {
			return ctrl.scope.editor.html()
		}


	}

});

(function() {

	function getTemplate(headers) {
		return `
			<div class="scrollPanel">
	            <table class="w3-table-all w3-small">
	                <thead>
	                    <tr class="w3-green">
	                    	${headers}
	                    </tr>
	                </thead>
	                <tbody></tbody>
	            </table>
            </div>
		`
	}

	function getItemTemplate(rows) {
		return `
            <tr class="item" bn-attr="data-id: _id">
            	${rows}
            </tr>	
		`
	}



	$$.registerControlEx('FilteredTableControl', {

		iface: `addItem(id, data);removeItem(id);removeAllItems();getItem(id);setFilters(filters);getDatas();getDisplayedDatas();on(event, callback)`,
		events: 'itemAction',

		
	lib: 'core',
init: function(elt, options) {

			console.log('options', options)

			var columns =  $$.obj2Array(options.columns)
			var actions = $$.obj2Array(options.actions)
			var headers = columns.map((column) => `<th>${column.value}</th>`)		
			var rows = columns.map((column) => `<td bn-html="${column.key}"></td>`)
			if (actions.length > 0) {
				headers.push(`<th>Action</th>`)

				var buttons = actions.map((action) => `<button data-action="${action.key}" class="w3-button"><i class="${action.value}"></i></button>`)
				rows.push(`<td>${buttons.join('')}</td>`)
			}

			//console.log('rows', rows)
			var itemTemplate = getItemTemplate(rows.join(''))
			//console.log('itemTemplate', itemTemplate)

			elt.append(getTemplate(headers.join('')))
			elt.addClass('bn-flex-col')

			let datas = {}
			let events = new EventEmitter2()
			let _filters = {}
			let displayedItems = {}

			const tbody = elt.find('tbody')
			tbody.on('click', '[data-action]', function() {
				var id = $(this).closest('.item').data('id')
				var action = $(this).data('action')
				console.log('click', id, 'action', action)
				events.emit('itemAction', action, id)
			})

			this.addItem = function(id, data) {

				var itemData = $.extend({'_id': id}, data)
				//console.log('addItem', itemData)
				
				if (datas[id] != undefined) {
					var item = displayedItems[id]
					if (item != undefined) {
						item.elt.updateTemplate(item.ctx, itemData)
					}
				}
				else if (isInFilter(data)){
					var elt = $(itemTemplate)
					var ctx = elt.processTemplate(itemData)
					displayedItems[id] = {elt, ctx}
					tbody.append(elt)
				}
				datas[id] = data
			}

			this.removeItem = function(id) {
				//console.log('removeItem', id)
				if (datas[id] != undefined) {
					delete datas[id]
					var item = displayedItems[id]
					if (item != undefined) {
						item.elt.remove()
						delete displayedItems[id]
					}
				}			
			}

			this.getItem = function(id) {
				return datas[id]
			}

			this.removeAllItems = function() {
				//console.log('removeAllItems')
				datas = {}
				displayedItems = {}
				tbody.empty()		
			}

			function isInFilter(data) {
				var ret = true
				for(var f in _filters) {
					var value = data[f]
					var filterValue = _filters[f]
					ret &= (filterValue == '' || value.startsWith(filterValue))
				}
				return ret
			}

			this.setFilters = function(filters) {
				_filters = filters
				dispTable()
			}


			function dispTable() {
				displayedItems = {}
				let items = []
				for(let id in datas) {
					var data = datas[id]
					if (isInFilter(data)) {
						var itemData = $.extend({'_id': id}, data)
						var elt = $(itemTemplate)
						var ctx = elt.processTemplate(itemData)			
						items.push(elt)
						displayedItems[id] = {elt, ctx}
					}

				}
				
				
				tbody.empty().append(items)
			}

			this.getDatas = function() {
				return datas
			}

			this.getDisplayedDatas = function() {
				var ret = {}
				for(let i in displayedItems) {
					ret[i] = datas[i]
				}
				return ret
			}

			this.on = events.on.bind(events)


		}
	})

})();


$$.registerControlEx('HeaderControl', {
	deps: ['WebSocketService'],
	options: {
		title: 'Hello World',
		userName: 'unknown'
	},
	
	lib: 'core',
init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: "<div >\r\n	<div class=\"brand\"><h1 class=\"bn-xs-hide\" bn-text=\"title\"></h1> </div>\r\n	<div>\r\n	    <i bn-attr=\"title: titleState\" class=\"fa fa-lg connectionState\" bn-class=\"fa-eye: connected, fa-eye-slash: !connected\"></i>\r\n	    <i class=\"fa fa-user fa-lg\"></i>\r\n	    <span bn-text=\"userName\" class=\"userName\"></span>\r\n	    <a href=\"/\" title=\"home\"><i class=\"fa fa-home fa-lg\"></i></a> \r\n	</div>\r\n</div>",
			data: {
				connected: false,
				titleState: "WebSocket disconnected",
				title: options.title,
				userName: options.userName				
			}
		})


		client.events.on('connect', function() {
			console.log('[HeaderControl] client connected')
			ctrl.setData({connected: true, titleState: "WebSocket connected"})

		})

		client.events.on('disconnect', function() {
			console.log('[HeaderControl] client disconnected')
			ctrl.setData({connected: false, titleState: "WebSocket disconnected"})

		})
	}

});




$$.registerControlEx('InputGroupControl', {
	
	lib: 'core',
init: function(elt) {

		var id = elt.children('input').uniqueId().attr('id')
		//console.log('[InputGroupControl] id', id)
		elt.children('label').attr('for', id)
	}
});

(function() {

	$$.registerControlEx('NavbarControl', {

		options: {
			activeColor: 'w3-green'
		},

		
	lib: 'core',
init: function(elt, options) {

			var activeColor = options.activeColor


			//console.log('[NavbarControl] options', options)

			elt.addClass('w3-bar')
			elt.children('a').each(function() {
				$(this).addClass('w3-bar-item w3-button')
			})

			$(window).on('routeChanged', function(evt, newRoute) {
				//console.log('[NavbarControl] routeChange', newRoute)

				elt.children(`a.${activeColor}`).removeClass(activeColor)	
				elt.children(`a[href="#${newRoute}"]`).addClass(activeColor)

			})	
		}

	})


})();



$$.registerControlEx('PictureCarouselControl', {

	props: {
		index: {val: 0, set: 'setIndex'},
		images: {val: [], set: 'setImages'}
	},
	options: {
		width: 300,
		height: 200,
		animateDelay: 1000,
		color: 'yellow'
	},	

	iface: 'setImages(images);setIndex(idx)',

	
	lib: 'core',
init: function(elt, options) {

		console.log(`[PictureCarouselControl] options`, options)

		var ctrl = $$.viewController(elt, {
			template: "<div bn-control=\"CarouselControl\" bn-options=\"carouselCtrlOptions\" bn-each=\"i of images\" bn-iface=\"carouselCtrl\" bn-data=\"index: index\">\r\n	<div style=\"text-align: center;\" bn-style=\"background-color: backColor\">\r\n		<img bn-attr=\"src: i\" style=\"height: 100%\">\r\n	</div>\r\n</div>",
			data: {
				carouselCtrlOptions: options,
				images: options.images,
				backColor: options.color,
				index: options.index
			}
		})

		this.setImages = function(value) {
			//console.log('[PictureCarouselControl] setImages', value)
			ctrl.setData('images', value)
			ctrl.scope.carouselCtrl.refresh()			
		},
		this.setIndex = function(value) {
			ctrl.setData('index', value)
		}

	}
});
(function() {

	$$.registerControl('RadioGroupControl', function(elt) {

		elt.on('click', 'input[type=radio]', function() {
			//console.log('radiogroup click')
			elt.find('input[type=radio]:checked').prop('checked', false)
			$(this).prop('checked', true)
			elt.trigger('input')
		})
		

		this.getValue = function() {
			return elt.find('input[type=radio]:checked').val()
		}

		this.setValue = function(value) {
			elt.find('input[type=radio]').each(function() {
				$(this).prop('checked', value === $(this).val())
			})			
		}


	})


})();



(function() {

	function matchRoute(route, pattern) {
		//console.log('matchRoute', route, pattern)
		var routeSplit = route.split('/')
		var patternSplit = pattern.split('/')
		//console.log(routeSplit, patternSplit)
		var ret = {}

		if (routeSplit.length != patternSplit.length)
			return null

		for(var idx = 0; idx < patternSplit.length; idx++) {
			var path = patternSplit[idx]
			//console.log('path', path)
			if (path.substr(0, 1) === ':') {
				if (routeSplit[idx].length === 0)
					return null
				ret[path.substr(1)] = routeSplit[idx]
			}
			else if (path !== routeSplit[idx]) {
				return null
			}

		}

		return ret
	}




	$$.registerControlEx('RouterControl', {

		options: {
			routes: []
		},
		
	lib: 'core',
init: function(elt, options) {



			var routes = options.routes

			if (!Array.isArray(routes)) {
				console.warn('[RouterControl] bad options')
				return
			}


			function processRoute(info) {
				console.log('[RouterControl] processRoute', info)

				var newRoute = info.curRoute

				for(var route of routes) {
					var params = matchRoute(newRoute, route.href)
					//console.log(`route: ${route.href}, params`, params)
					if (params != null) {
						//console.log('[RouterControl] params', params)
						if (typeof route.redirect == 'string') {
							location.href = '#' + route.redirect
						}
						else if (typeof route.control == 'string') {

							var curCtrl = elt.find('.CustomControl').interface()
							var canChange = true
							if (curCtrl && typeof curCtrl.canChange == 'function') {
								canChange = curCtrl.canChange()
							}
							if (canChange) {
								$(window).trigger('routeChanged', newRoute)
								var config = $.extend({$params: params}, route.options)	
								var html = $(`<div bn-control="${route.control}" bn-options="config" class="bn-flex-col bn-flex-1"></div>`)
								elt.dispose().html(html)
								html.processUI({config: config})		
							}
							else if (info.prevRoute) {
								history.replaceState({}, '', '#' + info.prevRoute)
							}

							//elt.html(html)

						}
						return true
					}	
				}
				return false

			}		

			$(window).on('routeChange', function(ev, info) {
				if (!processRoute(info)) {
					console.warn(`[RouterControl] no action defined for route '${newRoute}'`)
				}
			})


		}

	})

})();



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhcm91c2VsLmpzIiwiY2hlY2tncm91cC5qcyIsImVkaXRvci5qcyIsImZpbHRlcmVkLXRhYmxlLmpzIiwiaGVhZGVyLmpzIiwiaW5wdXRncm91cC5qcyIsIm5hdmJhci5qcyIsInBpY3R1cmVjYXJvdXNlbC5qcyIsInJhZGlvZ3JvdXAuanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdDYXJvdXNlbENvbnRyb2wnLCB7XHJcblxyXG5cdFx0cHJvcHM6IHtcclxuXHJcblx0XHRcdGluZGV4OiB7XHJcblx0XHRcdFx0dmFsOiAwLFxyXG5cdFx0XHRcdHNldDogJ3NldEluZGV4J1xyXG5cdFx0XHR9IFxyXG5cdFx0fSxcclxuXHRcdG9wdGlvbnM6IHtcclxuXHRcdFx0d2lkdGg6IDMwMCxcclxuXHRcdFx0aGVpZ2h0OiAyMDAsXHJcblx0XHRcdGFuaW1hdGVEZWxheTogMTAwMCxcclxuXHRcdFxyXG5cdFx0fSxcclxuXHRcdGlmYWNlOiAnc2V0SW5kZXgoaWR4KTtyZWZyZXNoKCknLFxyXG5cclxuXHRcdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cdFxyXG5cclxuXHJcblx0XHRcdHZhciB3aWR0aCA9IG9wdGlvbnMud2lkdGggKyAncHgnXHJcblx0XHRcdHZhciBoZWlnaHQgPSBvcHRpb25zLmhlaWdodCArICdweCdcclxuXHRcdFx0ZWx0LmNzcygnd2lkdGgnLCB3aWR0aCkuY3NzKCdoZWlnaHQnLCBoZWlnaHQpXHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZyhgW0Nhcm91c2VsQ29udHJvbF0gb3B0aW9uc2AsIG9wdGlvbnMpXHJcblxyXG5cdFx0XHR2YXIgY3RybCA9IG51bGxcclxuXHRcdFx0dmFyIGl0ZW1zXHJcblx0XHRcdHZhciBpZHhcclxuXHJcblxyXG5cdFx0XHR0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbQ2Fyb3VzZWxDb250cm9sXSByZWZyZXNoJylcclxuXHRcdFx0XHRpdGVtcyA9IGVsdC5jaGlsZHJlbignZGl2JykucmVtb3ZlKCkuY3NzKCd3aWR0aCcsIHdpZHRoKS5jc3MoJ2hlaWdodCcsIGhlaWdodClcdFx0XHJcblxyXG5cdFx0XHRcdGlkeCA9IE1hdGgubWF4KDAsIE1hdGgubWluKG9wdGlvbnMuaW5kZXgsIGl0ZW1zLmxlbmd0aCkpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW0Nhcm91c2VsQ29udHJvbF0gaWR4YCwgaWR4KVxyXG5cclxuXHRcdFx0XHRmdW5jdGlvbiBhbmltYXRlKGRpcmVjdGlvbikge1xyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtsZWZ0RGlzYWJsZWQ6IHRydWUsIHJpZ2h0RGlzYWJsZWQ6IHRydWV9KVxyXG5cdFx0XHRcdFx0dmFyIG9wID0gZGlyZWN0aW9uID09ICdsZWZ0JyA/ICcrPScgOiAnLT0nXHJcblx0XHRcdFx0XHRpZHggPSBkaXJlY3Rpb24gPT0gJ2xlZnQnID8gaWR4LTEgOiBpZHgrMVxyXG5cclxuXHRcdFx0XHRcdGN0cmwuc2NvcGUuaXRlbXMuYW5pbWF0ZSh7bGVmdDogb3AgKyB3aWR0aH0sIG9wdGlvbnMuYW5pbWF0ZURlbGF5LCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0Y2hlY2tCdG5zKClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcclxcblx0PGRpdiBjbGFzcz1cXFwidmlld3BvcnRcXFwiPlxcclxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJpdGVtc1xcXCIgYm4tYmluZD1cXFwiaXRlbXNcXFwiPjwvZGl2Plx0XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcIm92ZXJsYXlcXFwiPlxcclxcblx0XHQ8ZGl2Plxcclxcblx0XHRcdDxidXR0b24gXFxyXFxuXHRcdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uTGVmdFxcXCIgXFxyXFxuXHRcdFx0XHRibi1wcm9wPVxcXCJoaWRkZW46IGxlZnREaXNhYmxlZFxcXCJcXHJcXG5cdFx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1jaGV2cm9uLWNpcmNsZS1sZWZ0XFxcIj48L2k+XFxyXFxuXHRcdFx0PC9idXR0b24+XHRcdFx0XFxyXFxuXHRcdDwvZGl2Plxcclxcblxcclxcblx0XHQ8ZGl2Plxcclxcblx0XHRcdDxidXR0b24gXFxyXFxuXHRcdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uUmlnaHRcXFwiIFxcclxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiaGlkZGVuOiByaWdodERpc2FibGVkXFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1jaGV2cm9uLWNpcmNsZS1yaWdodFxcXCI+PC9pPlxcclxcblx0XHRcdDwvYnV0dG9uPlx0XHRcdFxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDwvZGl2PlxcclxcblxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdFx0XHRsZWZ0RGlzYWJsZWQ6IHRydWUsXHJcblx0XHRcdFx0XHRcdHJpZ2h0RGlzYWJsZWQ6IGZhbHNlXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0aW5pdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMuc2NvcGUuaXRlbXMuYXBwZW5kKGl0ZW1zKVxyXG5cdFx0XHRcdFx0XHR0aGlzLnNjb3BlLml0ZW1zLmNzcygnbGVmdCcsICgtaWR4ICogb3B0aW9ucy53aWR0aCkgKyAncHgnKVxyXG5cdFx0XHRcdFx0XHQvL2NoZWNrQnRucygpXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0XHRcdG9uTGVmdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0YW5pbWF0ZSgnbGVmdCcpXHJcblx0XHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRcdG9uUmlnaHQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGFuaW1hdGUoJ3JpZ2h0JylcclxuXHRcdFx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHRjaGVja0J0bnMoKVx0XHRcclxuXHJcblx0XHRcdH1cdFx0XHJcblxyXG5cdFx0XHR0aGlzLnNldEluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW0Nhcm91c2VsQ29udHJvbF0gc2V0SW5kZXgnLCBpbmRleClcclxuXHRcdFx0XHRpZHggPSAgTWF0aC5tYXgoMCwgTWF0aC5taW4oaW5kZXgsIGl0ZW1zLmxlbmd0aCkpXHJcblx0XHRcdFx0Y3RybC5zY29wZS5pdGVtcy5jc3MoJ2xlZnQnLCAoLWlkeCAqIG9wdGlvbnMud2lkdGgpICsgJ3B4JylcclxuXHRcdFx0XHRjaGVja0J0bnMoaWR4KVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBjaGVja0J0bnMoKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY2hlY2tCdG5zJywgaWR4LCBpdGVtcy5sZW5ndGgpXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdGxlZnREaXNhYmxlZDogaWR4ID09IDAsXHJcblx0XHRcdFx0XHRyaWdodERpc2FibGVkOiBpZHggPT0gaXRlbXMubGVuZ3RoIC0gMVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cdFx0XHJcblxyXG5cdCBcdFx0dGhpcy5yZWZyZXNoKClcclxuXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnQ2hlY2tHcm91cENvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0Lm9uKCdjbGljaycsICdpbnB1dFt0eXBlPWNoZWNrYm94XScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRlbHQudHJpZ2dlcignaW5wdXQnKVxyXG5cdFx0fSlcclxuXHJcblx0XHR0aGlzLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciByZXQgPSBbXVxyXG5cdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1jaGVja2JveF06Y2hlY2tlZCcpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0LnB1c2goJCh0aGlzKS52YWwoKSlcclxuXHRcdFx0fSlcdFxyXG5cdFx0XHRyZXR1cm4gcmV0XHRcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLnNldFZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcblx0XHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHZhbHVlLmluZGV4T2YoJCh0aGlzKS52YWwoKSkgPj0gMClcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHRcdFxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0h0bWxFZGl0b3JDb250cm9sJywge1xyXG5cclxuXHRpZmFjZTogJ2h0bWwoKScsXHJcblxyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdGVsdC5hZGRDbGFzcygnYm4tZmxleC1yb3cnKVxyXG5cclxuXHRcdHZhciBjbWRBcmdzID0ge1xyXG5cdFx0XHQnZm9yZUNvbG9yJzogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIGN0cmwubW9kZWwuY29sb3JcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPlxcclxcblxcclxcblx0PGRpdiBibi1ldmVudD1cXFwiY2xpY2suY21kOiBvbkNvbW1hbmRcXFwiPlxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJib2xkXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYm9sZFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcIml0YWxpY1xcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWl0YWxpY1xcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcInVuZGVybGluZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXVuZGVybGluZVxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcInN0cmlrZVRocm91Z2hcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1zdHJpa2V0aHJvdWdoXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9yZUNvbG9yXFxcIiBibi1tZW51PVxcXCJjb2xvckl0ZW1zXFxcIiBibi1ldmVudD1cXFwibWVudUNoYW5nZTogb25Db2xvck1lbnVDaGFuZ2VcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1wZW5jaWxcXFwiIGJuLXN0eWxlPVxcXCJjb2xvcjogY29sb3JcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImp1c3RpZnlMZWZ0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tbGVmdFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImp1c3RpZnlDZW50ZXJcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1hbGlnbi1jZW50ZXJcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5UmlnaHRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1hbGlnbi1yaWdodFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cdFxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbmRlbnRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1pbmRlbnRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJvdXRkZW50XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtb3V0ZGVudFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cdFxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbnNlcnRIb3Jpem9udGFsUnVsZVxcXCI+aHI8L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JtYXRCbG9ja1xcXCIgZGF0YS1jbWQtYXJnPVxcXCJoMVxcXCI+aDE8L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JtYXRCbG9ja1xcXCIgZGF0YS1jbWQtYXJnPVxcXCJoMlxcXCI+aDI8L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JtYXRCbG9ja1xcXCIgZGF0YS1jbWQtYXJnPVxcXCJoM1xcXCI+aDM8L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XHRcdFxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbnNlcnRVbm9yZGVyZWRMaXN0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtbGlzdC11bFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImluc2VydE9yZGVyZWRMaXN0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtbGlzdC1vbFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDwvZGl2Plx0XFxyXFxuXHQ8ZGl2IGNvbnRlbnRlZGl0YWJsZT1cXFwidHJ1ZVxcXCIgY2xhc3M9XFxcImJuLWZsZXgtMSBlZGl0b3JcXFwiIGJuLWJpbmQ9XFxcImVkaXRvclxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRjb2xvcjogJ2JsdWUnLFxyXG5cdFx0XHRcdGNvbG9ySXRlbXM6IHtcclxuXHRcdFx0XHRcdGJsYWNrOiB7bmFtZTogJ0JsYWNrJ30sXHJcblx0XHRcdFx0XHRyZWQ6IHtuYW1lOiAnUmVkJ30sXHJcblx0XHRcdFx0XHRncmVlbjoge25hbWU6ICdHcmVlbid9LFxyXG5cdFx0XHRcdFx0Ymx1ZToge25hbWU6ICdCbHVlJ30sXHJcblx0XHRcdFx0XHR5ZWxsb3c6IHtuYW1lOiAnWWVsbG93J30sXHJcblx0XHRcdFx0XHRjeWFuOiB7bmFtZTogJ0N5YW4nfSxcclxuXHRcdFx0XHRcdG1hZ2VudGE6IHtuYW1lOiAnTWFnZW50YSd9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRvbkNvbW1hbmQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0XHRcdHZhciBjbWQgPSAkKHRoaXMpLmRhdGEoJ2NtZCcpXHJcblx0XHRcdFx0XHR2YXIgY21kQXJnID0gJCh0aGlzKS5kYXRhKCdjbWRBcmcnKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Db21tYW5kJywgY21kLCBjbWRBcmcpXHJcblxyXG5cdFx0XHRcdFx0dmFyIGNtZEFyZyA9IGNtZEFyZyB8fCBjbWRBcmdzW2NtZF1cclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgY21kQXJnID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0Y21kQXJnID0gY21kQXJnKClcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29tbWFuZCcsIGNtZCwgY21kQXJnKVxyXG5cclxuXHRcdFx0XHRcdGRvY3VtZW50LmV4ZWNDb21tYW5kKGNtZCwgZmFsc2UsIGNtZEFyZylcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uQ29sb3JNZW51Q2hhbmdlOiBmdW5jdGlvbihldiwgY29sb3IpIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29sb3JNZW51Q2hhbmdlJywgY29sb3IpXHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe2NvbG9yfSlcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSlcclxuXHJcblx0XHR0aGlzLmh0bWwgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIGN0cmwuc2NvcGUuZWRpdG9yLmh0bWwoKVxyXG5cdFx0fVxyXG5cclxuXHJcblx0fVxyXG5cclxufSk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0ZnVuY3Rpb24gZ2V0VGVtcGxhdGUoaGVhZGVycykge1xyXG5cdFx0cmV0dXJuIGBcclxuXHRcdFx0PGRpdiBjbGFzcz1cInNjcm9sbFBhbmVsXCI+XHJcblx0ICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidzMtdGFibGUtYWxsIHczLXNtYWxsXCI+XHJcblx0ICAgICAgICAgICAgICAgIDx0aGVhZD5cclxuXHQgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzcz1cInczLWdyZWVuXCI+XHJcblx0ICAgICAgICAgICAgICAgICAgICBcdCR7aGVhZGVyc31cclxuXHQgICAgICAgICAgICAgICAgICAgIDwvdHI+XHJcblx0ICAgICAgICAgICAgICAgIDwvdGhlYWQ+XHJcblx0ICAgICAgICAgICAgICAgIDx0Ym9keT48L3Rib2R5PlxyXG5cdCAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG5cdFx0YFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0SXRlbVRlbXBsYXRlKHJvd3MpIHtcclxuXHRcdHJldHVybiBgXHJcbiAgICAgICAgICAgIDx0ciBjbGFzcz1cIml0ZW1cIiBibi1hdHRyPVwiZGF0YS1pZDogX2lkXCI+XHJcbiAgICAgICAgICAgIFx0JHtyb3dzfVxyXG4gICAgICAgICAgICA8L3RyPlx0XHJcblx0XHRgXHJcblx0fVxyXG5cclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdGaWx0ZXJlZFRhYmxlQ29udHJvbCcsIHtcclxuXHJcblx0XHRpZmFjZTogYGFkZEl0ZW0oaWQsIGRhdGEpO3JlbW92ZUl0ZW0oaWQpO3JlbW92ZUFsbEl0ZW1zKCk7Z2V0SXRlbShpZCk7c2V0RmlsdGVycyhmaWx0ZXJzKTtnZXREYXRhcygpO2dldERpc3BsYXllZERhdGFzKCk7b24oZXZlbnQsIGNhbGxiYWNrKWAsXHJcblx0XHRldmVudHM6ICdpdGVtQWN0aW9uJyxcclxuXHJcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKCdvcHRpb25zJywgb3B0aW9ucylcclxuXHJcblx0XHRcdHZhciBjb2x1bW5zID0gICQkLm9iajJBcnJheShvcHRpb25zLmNvbHVtbnMpXHJcblx0XHRcdHZhciBhY3Rpb25zID0gJCQub2JqMkFycmF5KG9wdGlvbnMuYWN0aW9ucylcclxuXHRcdFx0dmFyIGhlYWRlcnMgPSBjb2x1bW5zLm1hcCgoY29sdW1uKSA9PiBgPHRoPiR7Y29sdW1uLnZhbHVlfTwvdGg+YClcdFx0XHJcblx0XHRcdHZhciByb3dzID0gY29sdW1ucy5tYXAoKGNvbHVtbikgPT4gYDx0ZCBibi1odG1sPVwiJHtjb2x1bW4ua2V5fVwiPjwvdGQ+YClcclxuXHRcdFx0aWYgKGFjdGlvbnMubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdGhlYWRlcnMucHVzaChgPHRoPkFjdGlvbjwvdGg+YClcclxuXHJcblx0XHRcdFx0dmFyIGJ1dHRvbnMgPSBhY3Rpb25zLm1hcCgoYWN0aW9uKSA9PiBgPGJ1dHRvbiBkYXRhLWFjdGlvbj1cIiR7YWN0aW9uLmtleX1cIiBjbGFzcz1cInczLWJ1dHRvblwiPjxpIGNsYXNzPVwiJHthY3Rpb24udmFsdWV9XCI+PC9pPjwvYnV0dG9uPmApXHJcblx0XHRcdFx0cm93cy5wdXNoKGA8dGQ+JHtidXR0b25zLmpvaW4oJycpfTwvdGQ+YClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncm93cycsIHJvd3MpXHJcblx0XHRcdHZhciBpdGVtVGVtcGxhdGUgPSBnZXRJdGVtVGVtcGxhdGUocm93cy5qb2luKCcnKSlcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnaXRlbVRlbXBsYXRlJywgaXRlbVRlbXBsYXRlKVxyXG5cclxuXHRcdFx0ZWx0LmFwcGVuZChnZXRUZW1wbGF0ZShoZWFkZXJzLmpvaW4oJycpKSlcclxuXHRcdFx0ZWx0LmFkZENsYXNzKCdibi1mbGV4LWNvbCcpXHJcblxyXG5cdFx0XHRsZXQgZGF0YXMgPSB7fVxyXG5cdFx0XHRsZXQgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cdFx0XHRsZXQgX2ZpbHRlcnMgPSB7fVxyXG5cdFx0XHRsZXQgZGlzcGxheWVkSXRlbXMgPSB7fVxyXG5cclxuXHRcdFx0Y29uc3QgdGJvZHkgPSBlbHQuZmluZCgndGJvZHknKVxyXG5cdFx0XHR0Ym9keS5vbignY2xpY2snLCAnW2RhdGEtYWN0aW9uXScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHZhciBpZCA9ICQodGhpcykuY2xvc2VzdCgnLml0ZW0nKS5kYXRhKCdpZCcpXHJcblx0XHRcdFx0dmFyIGFjdGlvbiA9ICQodGhpcykuZGF0YSgnYWN0aW9uJylcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnY2xpY2snLCBpZCwgJ2FjdGlvbicsIGFjdGlvbilcclxuXHRcdFx0XHRldmVudHMuZW1pdCgnaXRlbUFjdGlvbicsIGFjdGlvbiwgaWQpXHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHR0aGlzLmFkZEl0ZW0gPSBmdW5jdGlvbihpZCwgZGF0YSkge1xyXG5cclxuXHRcdFx0XHR2YXIgaXRlbURhdGEgPSAkLmV4dGVuZCh7J19pZCc6IGlkfSwgZGF0YSlcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdhZGRJdGVtJywgaXRlbURhdGEpXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGRhdGFzW2lkXSAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdHZhciBpdGVtID0gZGlzcGxheWVkSXRlbXNbaWRdXHJcblx0XHRcdFx0XHRpZiAoaXRlbSAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0aXRlbS5lbHQudXBkYXRlVGVtcGxhdGUoaXRlbS5jdHgsIGl0ZW1EYXRhKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIGlmIChpc0luRmlsdGVyKGRhdGEpKXtcclxuXHRcdFx0XHRcdHZhciBlbHQgPSAkKGl0ZW1UZW1wbGF0ZSlcclxuXHRcdFx0XHRcdHZhciBjdHggPSBlbHQucHJvY2Vzc1RlbXBsYXRlKGl0ZW1EYXRhKVxyXG5cdFx0XHRcdFx0ZGlzcGxheWVkSXRlbXNbaWRdID0ge2VsdCwgY3R4fVxyXG5cdFx0XHRcdFx0dGJvZHkuYXBwZW5kKGVsdClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGF0YXNbaWRdID0gZGF0YVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbihpZCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3JlbW92ZUl0ZW0nLCBpZClcclxuXHRcdFx0XHRpZiAoZGF0YXNbaWRdICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0ZGVsZXRlIGRhdGFzW2lkXVxyXG5cdFx0XHRcdFx0dmFyIGl0ZW0gPSBkaXNwbGF5ZWRJdGVtc1tpZF1cclxuXHRcdFx0XHRcdGlmIChpdGVtICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0XHRpdGVtLmVsdC5yZW1vdmUoKVxyXG5cdFx0XHRcdFx0XHRkZWxldGUgZGlzcGxheWVkSXRlbXNbaWRdXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmdldEl0ZW0gPSBmdW5jdGlvbihpZCkge1xyXG5cdFx0XHRcdHJldHVybiBkYXRhc1tpZF1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5yZW1vdmVBbGxJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3JlbW92ZUFsbEl0ZW1zJylcclxuXHRcdFx0XHRkYXRhcyA9IHt9XHJcblx0XHRcdFx0ZGlzcGxheWVkSXRlbXMgPSB7fVxyXG5cdFx0XHRcdHRib2R5LmVtcHR5KClcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGlzSW5GaWx0ZXIoZGF0YSkge1xyXG5cdFx0XHRcdHZhciByZXQgPSB0cnVlXHJcblx0XHRcdFx0Zm9yKHZhciBmIGluIF9maWx0ZXJzKSB7XHJcblx0XHRcdFx0XHR2YXIgdmFsdWUgPSBkYXRhW2ZdXHJcblx0XHRcdFx0XHR2YXIgZmlsdGVyVmFsdWUgPSBfZmlsdGVyc1tmXVxyXG5cdFx0XHRcdFx0cmV0ICY9IChmaWx0ZXJWYWx1ZSA9PSAnJyB8fCB2YWx1ZS5zdGFydHNXaXRoKGZpbHRlclZhbHVlKSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHJldFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnNldEZpbHRlcnMgPSBmdW5jdGlvbihmaWx0ZXJzKSB7XHJcblx0XHRcdFx0X2ZpbHRlcnMgPSBmaWx0ZXJzXHJcblx0XHRcdFx0ZGlzcFRhYmxlKClcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGRpc3BUYWJsZSgpIHtcclxuXHRcdFx0XHRkaXNwbGF5ZWRJdGVtcyA9IHt9XHJcblx0XHRcdFx0bGV0IGl0ZW1zID0gW11cclxuXHRcdFx0XHRmb3IobGV0IGlkIGluIGRhdGFzKSB7XHJcblx0XHRcdFx0XHR2YXIgZGF0YSA9IGRhdGFzW2lkXVxyXG5cdFx0XHRcdFx0aWYgKGlzSW5GaWx0ZXIoZGF0YSkpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGl0ZW1EYXRhID0gJC5leHRlbmQoeydfaWQnOiBpZH0sIGRhdGEpXHJcblx0XHRcdFx0XHRcdHZhciBlbHQgPSAkKGl0ZW1UZW1wbGF0ZSlcclxuXHRcdFx0XHRcdFx0dmFyIGN0eCA9IGVsdC5wcm9jZXNzVGVtcGxhdGUoaXRlbURhdGEpXHRcdFx0XHJcblx0XHRcdFx0XHRcdGl0ZW1zLnB1c2goZWx0KVxyXG5cdFx0XHRcdFx0XHRkaXNwbGF5ZWRJdGVtc1tpZF0gPSB7ZWx0LCBjdHh9XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR0Ym9keS5lbXB0eSgpLmFwcGVuZChpdGVtcylcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5nZXREYXRhcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiBkYXRhc1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmdldERpc3BsYXllZERhdGFzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIHJldCA9IHt9XHJcblx0XHRcdFx0Zm9yKGxldCBpIGluIGRpc3BsYXllZEl0ZW1zKSB7XHJcblx0XHRcdFx0XHRyZXRbaV0gPSBkYXRhc1tpXVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcmV0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXHJcblxyXG5cclxuXHRcdH1cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdIZWFkZXJDb250cm9sJywge1xyXG5cdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLFxyXG5cdG9wdGlvbnM6IHtcclxuXHRcdHRpdGxlOiAnSGVsbG8gV29ybGQnLFxyXG5cdFx0dXNlck5hbWU6ICd1bmtub3duJ1xyXG5cdH0sXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2ID5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcImJyYW5kXFxcIj48aDEgY2xhc3M9XFxcImJuLXhzLWhpZGVcXFwiIGJuLXRleHQ9XFxcInRpdGxlXFxcIj48L2gxPiA8L2Rpdj5cXHJcXG5cdDxkaXY+XFxyXFxuXHQgICAgPGkgYm4tYXR0cj1cXFwidGl0bGU6IHRpdGxlU3RhdGVcXFwiIGNsYXNzPVxcXCJmYSBmYS1sZyBjb25uZWN0aW9uU3RhdGVcXFwiIGJuLWNsYXNzPVxcXCJmYS1leWU6IGNvbm5lY3RlZCwgZmEtZXllLXNsYXNoOiAhY29ubmVjdGVkXFxcIj48L2k+XFxyXFxuXHQgICAgPGkgY2xhc3M9XFxcImZhIGZhLXVzZXIgZmEtbGdcXFwiPjwvaT5cXHJcXG5cdCAgICA8c3BhbiBibi10ZXh0PVxcXCJ1c2VyTmFtZVxcXCIgY2xhc3M9XFxcInVzZXJOYW1lXFxcIj48L3NwYW4+XFxyXFxuXHQgICAgPGEgaHJlZj1cXFwiL1xcXCIgdGl0bGU9XFxcImhvbWVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1ob21lIGZhLWxnXFxcIj48L2k+PC9hPiBcXHJcXG5cdDwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0Y29ubmVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHR0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBkaXNjb25uZWN0ZWRcIixcclxuXHRcdFx0XHR0aXRsZTogb3B0aW9ucy50aXRsZSxcclxuXHRcdFx0XHR1c2VyTmFtZTogb3B0aW9ucy51c2VyTmFtZVx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cclxuXHRcdGNsaWVudC5ldmVudHMub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tIZWFkZXJDb250cm9sXSBjbGllbnQgY29ubmVjdGVkJylcclxuXHRcdFx0Y3RybC5zZXREYXRhKHtjb25uZWN0ZWQ6IHRydWUsIHRpdGxlU3RhdGU6IFwiV2ViU29ja2V0IGNvbm5lY3RlZFwifSlcclxuXHJcblx0XHR9KVxyXG5cclxuXHRcdGNsaWVudC5ldmVudHMub24oJ2Rpc2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tIZWFkZXJDb250cm9sXSBjbGllbnQgZGlzY29ubmVjdGVkJylcclxuXHRcdFx0Y3RybC5zZXREYXRhKHtjb25uZWN0ZWQ6IGZhbHNlLCB0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBkaXNjb25uZWN0ZWRcIn0pXHJcblxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0lucHV0R3JvdXBDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdHZhciBpZCA9IGVsdC5jaGlsZHJlbignaW5wdXQnKS51bmlxdWVJZCgpLmF0dHIoJ2lkJylcclxuXHRcdC8vY29uc29sZS5sb2coJ1tJbnB1dEdyb3VwQ29udHJvbF0gaWQnLCBpZClcclxuXHRcdGVsdC5jaGlsZHJlbignbGFiZWwnKS5hdHRyKCdmb3InLCBpZClcclxuXHR9XHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdOYXZiYXJDb250cm9sJywge1xyXG5cclxuXHRcdG9wdGlvbnM6IHtcclxuXHRcdFx0YWN0aXZlQ29sb3I6ICd3My1ncmVlbidcclxuXHRcdH0sXHJcblxyXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0XHR2YXIgYWN0aXZlQ29sb3IgPSBvcHRpb25zLmFjdGl2ZUNvbG9yXHJcblxyXG5cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW05hdmJhckNvbnRyb2xdIG9wdGlvbnMnLCBvcHRpb25zKVxyXG5cclxuXHRcdFx0ZWx0LmFkZENsYXNzKCd3My1iYXInKVxyXG5cdFx0XHRlbHQuY2hpbGRyZW4oJ2EnKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ3czLWJhci1pdGVtIHczLWJ1dHRvbicpXHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHQkKHdpbmRvdykub24oJ3JvdXRlQ2hhbmdlZCcsIGZ1bmN0aW9uKGV2dCwgbmV3Um91dGUpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbTmF2YmFyQ29udHJvbF0gcm91dGVDaGFuZ2UnLCBuZXdSb3V0ZSlcclxuXHJcblx0XHRcdFx0ZWx0LmNoaWxkcmVuKGBhLiR7YWN0aXZlQ29sb3J9YCkucmVtb3ZlQ2xhc3MoYWN0aXZlQ29sb3IpXHRcclxuXHRcdFx0XHRlbHQuY2hpbGRyZW4oYGFbaHJlZj1cIiMke25ld1JvdXRlfVwiXWApLmFkZENsYXNzKGFjdGl2ZUNvbG9yKVxyXG5cclxuXHRcdFx0fSlcdFxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxuXHJcbn0pKCk7XHJcblxyXG5cclxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ1BpY3R1cmVDYXJvdXNlbENvbnRyb2wnLCB7XHJcblxyXG5cdHByb3BzOiB7XHJcblx0XHRpbmRleDoge3ZhbDogMCwgc2V0OiAnc2V0SW5kZXgnfSxcclxuXHRcdGltYWdlczoge3ZhbDogW10sIHNldDogJ3NldEltYWdlcyd9XHJcblx0fSxcclxuXHRvcHRpb25zOiB7XHJcblx0XHR3aWR0aDogMzAwLFxyXG5cdFx0aGVpZ2h0OiAyMDAsXHJcblx0XHRhbmltYXRlRGVsYXk6IDEwMDAsXHJcblx0XHRjb2xvcjogJ3llbGxvdydcclxuXHR9LFx0XHJcblxyXG5cdGlmYWNlOiAnc2V0SW1hZ2VzKGltYWdlcyk7c2V0SW5kZXgoaWR4KScsXHJcblxyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdGNvbnNvbGUubG9nKGBbUGljdHVyZUNhcm91c2VsQ29udHJvbF0gb3B0aW9uc2AsIG9wdGlvbnMpXHJcblxyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBibi1jb250cm9sPVxcXCJDYXJvdXNlbENvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcImNhcm91c2VsQ3RybE9wdGlvbnNcXFwiIGJuLWVhY2g9XFxcImkgb2YgaW1hZ2VzXFxcIiBibi1pZmFjZT1cXFwiY2Fyb3VzZWxDdHJsXFxcIiBibi1kYXRhPVxcXCJpbmRleDogaW5kZXhcXFwiPlxcclxcblx0PGRpdiBzdHlsZT1cXFwidGV4dC1hbGlnbjogY2VudGVyO1xcXCIgYm4tc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6IGJhY2tDb2xvclxcXCI+XFxyXFxuXHRcdDxpbWcgYm4tYXR0cj1cXFwic3JjOiBpXFxcIiBzdHlsZT1cXFwiaGVpZ2h0OiAxMDAlXFxcIj5cXHJcXG5cdDwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0Y2Fyb3VzZWxDdHJsT3B0aW9uczogb3B0aW9ucyxcclxuXHRcdFx0XHRpbWFnZXM6IG9wdGlvbnMuaW1hZ2VzLFxyXG5cdFx0XHRcdGJhY2tDb2xvcjogb3B0aW9ucy5jb2xvcixcclxuXHRcdFx0XHRpbmRleDogb3B0aW9ucy5pbmRleFxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cclxuXHRcdHRoaXMuc2V0SW1hZ2VzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1BpY3R1cmVDYXJvdXNlbENvbnRyb2xdIHNldEltYWdlcycsIHZhbHVlKVxyXG5cdFx0XHRjdHJsLnNldERhdGEoJ2ltYWdlcycsIHZhbHVlKVxyXG5cdFx0XHRjdHJsLnNjb3BlLmNhcm91c2VsQ3RybC5yZWZyZXNoKClcdFx0XHRcclxuXHRcdH0sXHJcblx0XHR0aGlzLnNldEluZGV4ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3RybC5zZXREYXRhKCdpbmRleCcsIHZhbHVlKVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0pOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sKCdSYWRpb0dyb3VwQ29udHJvbCcsIGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdGVsdC5vbignY2xpY2snLCAnaW5wdXRbdHlwZT1yYWRpb10nLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncmFkaW9ncm91cCBjbGljaycpXHJcblx0XHRcdGVsdC5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXTpjaGVja2VkJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKVxyXG5cdFx0XHQkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKVxyXG5cdFx0XHRlbHQudHJpZ2dlcignaW5wdXQnKVxyXG5cdFx0fSlcclxuXHRcdFxyXG5cclxuXHRcdHRoaXMuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIGVsdC5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXTpjaGVja2VkJykudmFsKClcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLnNldFZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCB2YWx1ZSA9PT0gJCh0aGlzKS52YWwoKSlcclxuXHRcdFx0fSlcdFx0XHRcclxuXHRcdH1cclxuXHJcblxyXG5cdH0pXHJcblxyXG5cclxufSkoKTtcclxuXHJcblxyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdGZ1bmN0aW9uIG1hdGNoUm91dGUocm91dGUsIHBhdHRlcm4pIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ21hdGNoUm91dGUnLCByb3V0ZSwgcGF0dGVybilcclxuXHRcdHZhciByb3V0ZVNwbGl0ID0gcm91dGUuc3BsaXQoJy8nKVxyXG5cdFx0dmFyIHBhdHRlcm5TcGxpdCA9IHBhdHRlcm4uc3BsaXQoJy8nKVxyXG5cdFx0Ly9jb25zb2xlLmxvZyhyb3V0ZVNwbGl0LCBwYXR0ZXJuU3BsaXQpXHJcblx0XHR2YXIgcmV0ID0ge31cclxuXHJcblx0XHRpZiAocm91dGVTcGxpdC5sZW5ndGggIT0gcGF0dGVyblNwbGl0Lmxlbmd0aClcclxuXHRcdFx0cmV0dXJuIG51bGxcclxuXHJcblx0XHRmb3IodmFyIGlkeCA9IDA7IGlkeCA8IHBhdHRlcm5TcGxpdC5sZW5ndGg7IGlkeCsrKSB7XHJcblx0XHRcdHZhciBwYXRoID0gcGF0dGVyblNwbGl0W2lkeF1cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncGF0aCcsIHBhdGgpXHJcblx0XHRcdGlmIChwYXRoLnN1YnN0cigwLCAxKSA9PT0gJzonKSB7XHJcblx0XHRcdFx0aWYgKHJvdXRlU3BsaXRbaWR4XS5sZW5ndGggPT09IDApXHJcblx0XHRcdFx0XHRyZXR1cm4gbnVsbFxyXG5cdFx0XHRcdHJldFtwYXRoLnN1YnN0cigxKV0gPSByb3V0ZVNwbGl0W2lkeF1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChwYXRoICE9PSByb3V0ZVNwbGl0W2lkeF0pIHtcclxuXHRcdFx0XHRyZXR1cm4gbnVsbFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdSb3V0ZXJDb250cm9sJywge1xyXG5cclxuXHRcdG9wdGlvbnM6IHtcclxuXHRcdFx0cm91dGVzOiBbXVxyXG5cdFx0fSxcclxuXHRcdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHJcblxyXG5cdFx0XHR2YXIgcm91dGVzID0gb3B0aW9ucy5yb3V0ZXNcclxuXHJcblx0XHRcdGlmICghQXJyYXkuaXNBcnJheShyb3V0ZXMpKSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKCdbUm91dGVyQ29udHJvbF0gYmFkIG9wdGlvbnMnKVxyXG5cdFx0XHRcdHJldHVyblxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gcHJvY2Vzc1JvdXRlKGluZm8pIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW1JvdXRlckNvbnRyb2xdIHByb2Nlc3NSb3V0ZScsIGluZm8pXHJcblxyXG5cdFx0XHRcdHZhciBuZXdSb3V0ZSA9IGluZm8uY3VyUm91dGVcclxuXHJcblx0XHRcdFx0Zm9yKHZhciByb3V0ZSBvZiByb3V0ZXMpIHtcclxuXHRcdFx0XHRcdHZhciBwYXJhbXMgPSBtYXRjaFJvdXRlKG5ld1JvdXRlLCByb3V0ZS5ocmVmKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgcm91dGU6ICR7cm91dGUuaHJlZn0sIHBhcmFtc2AsIHBhcmFtcylcclxuXHRcdFx0XHRcdGlmIChwYXJhbXMgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbUm91dGVyQ29udHJvbF0gcGFyYW1zJywgcGFyYW1zKVxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJvdXRlLnJlZGlyZWN0ID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdFx0bG9jYXRpb24uaHJlZiA9ICcjJyArIHJvdXRlLnJlZGlyZWN0XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIHJvdXRlLmNvbnRyb2wgPT0gJ3N0cmluZycpIHtcclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyIGN1ckN0cmwgPSBlbHQuZmluZCgnLkN1c3RvbUNvbnRyb2wnKS5pbnRlcmZhY2UoKVxyXG5cdFx0XHRcdFx0XHRcdHZhciBjYW5DaGFuZ2UgPSB0cnVlXHJcblx0XHRcdFx0XHRcdFx0aWYgKGN1ckN0cmwgJiYgdHlwZW9mIGN1ckN0cmwuY2FuQ2hhbmdlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGNhbkNoYW5nZSA9IGN1ckN0cmwuY2FuQ2hhbmdlKClcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0aWYgKGNhbkNoYW5nZSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JCh3aW5kb3cpLnRyaWdnZXIoJ3JvdXRlQ2hhbmdlZCcsIG5ld1JvdXRlKVxyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGNvbmZpZyA9ICQuZXh0ZW5kKHskcGFyYW1zOiBwYXJhbXN9LCByb3V0ZS5vcHRpb25zKVx0XHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgaHRtbCA9ICQoYDxkaXYgYm4tY29udHJvbD1cIiR7cm91dGUuY29udHJvbH1cIiBibi1vcHRpb25zPVwiY29uZmlnXCIgY2xhc3M9XCJibi1mbGV4LWNvbCBibi1mbGV4LTFcIj48L2Rpdj5gKVxyXG5cdFx0XHRcdFx0XHRcdFx0ZWx0LmRpc3Bvc2UoKS5odG1sKGh0bWwpXHJcblx0XHRcdFx0XHRcdFx0XHRodG1sLnByb2Nlc3NVSSh7Y29uZmlnOiBjb25maWd9KVx0XHRcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0ZWxzZSBpZiAoaW5mby5wcmV2Um91dGUpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCAnJywgJyMnICsgaW5mby5wcmV2Um91dGUpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHQvL2VsdC5odG1sKGh0bWwpXHJcblxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdFx0XHR9XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblxyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHRcdFx0JCh3aW5kb3cpLm9uKCdyb3V0ZUNoYW5nZScsIGZ1bmN0aW9uKGV2LCBpbmZvKSB7XHJcblx0XHRcdFx0aWYgKCFwcm9jZXNzUm91dGUoaW5mbykpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW1JvdXRlckNvbnRyb2xdIG5vIGFjdGlvbiBkZWZpbmVkIGZvciByb3V0ZSAnJHtuZXdSb3V0ZX0nYClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblxyXG5cclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcblxyXG5cclxuIl19

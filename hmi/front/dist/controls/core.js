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

		iface: 'addItem(id, data);removeItem(id);removeAllItems();setFilters(filters);getDatas();getDisplayedDatas();on(event, callback)',
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
				rows.push(`<td>${buttons}</td>`)
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



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhcm91c2VsLmpzIiwiY2hlY2tncm91cC5qcyIsImVkaXRvci5qcyIsImZpbHRlcmVkLXRhYmxlLmpzIiwiaGVhZGVyLmpzIiwiaW5wdXRncm91cC5qcyIsIm5hdmJhci5qcyIsInBpY3R1cmVjYXJvdXNlbC5qcyIsInJhZGlvZ3JvdXAuanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnQ2Fyb3VzZWxDb250cm9sJywge1xyXG5cclxuXHRcdHByb3BzOiB7XHJcblxyXG5cdFx0XHRpbmRleDoge1xyXG5cdFx0XHRcdHZhbDogMCxcclxuXHRcdFx0XHRzZXQ6ICdzZXRJbmRleCdcclxuXHRcdFx0fSBcclxuXHRcdH0sXHJcblx0XHRvcHRpb25zOiB7XHJcblx0XHRcdHdpZHRoOiAzMDAsXHJcblx0XHRcdGhlaWdodDogMjAwLFxyXG5cdFx0XHRhbmltYXRlRGVsYXk6IDEwMDAsXHJcblx0XHRcclxuXHRcdH0sXHJcblx0XHRpZmFjZTogJ3NldEluZGV4KGlkeCk7cmVmcmVzaCgpJyxcclxuXHJcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHRcclxuXHJcblxyXG5cdFx0XHR2YXIgd2lkdGggPSBvcHRpb25zLndpZHRoICsgJ3B4J1xyXG5cdFx0XHR2YXIgaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgKyAncHgnXHJcblx0XHRcdGVsdC5jc3MoJ3dpZHRoJywgd2lkdGgpLmNzcygnaGVpZ2h0JywgaGVpZ2h0KVxyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coYFtDYXJvdXNlbENvbnRyb2xdIG9wdGlvbnNgLCBvcHRpb25zKVxyXG5cclxuXHRcdFx0dmFyIGN0cmwgPSBudWxsXHJcblx0XHRcdHZhciBpdGVtc1xyXG5cdFx0XHR2YXIgaWR4XHJcblxyXG5cclxuXHRcdFx0dGhpcy5yZWZyZXNoID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0Nhcm91c2VsQ29udHJvbF0gcmVmcmVzaCcpXHJcblx0XHRcdFx0aXRlbXMgPSBlbHQuY2hpbGRyZW4oJ2RpdicpLnJlbW92ZSgpLmNzcygnd2lkdGgnLCB3aWR0aCkuY3NzKCdoZWlnaHQnLCBoZWlnaHQpXHRcdFxyXG5cclxuXHRcdFx0XHRpZHggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihvcHRpb25zLmluZGV4LCBpdGVtcy5sZW5ndGgpKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coYFtDYXJvdXNlbENvbnRyb2xdIGlkeGAsIGlkeClcclxuXHJcblx0XHRcdFx0ZnVuY3Rpb24gYW5pbWF0ZShkaXJlY3Rpb24pIHtcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7bGVmdERpc2FibGVkOiB0cnVlLCByaWdodERpc2FibGVkOiB0cnVlfSlcclxuXHRcdFx0XHRcdHZhciBvcCA9IGRpcmVjdGlvbiA9PSAnbGVmdCcgPyAnKz0nIDogJy09J1xyXG5cdFx0XHRcdFx0aWR4ID0gZGlyZWN0aW9uID09ICdsZWZ0JyA/IGlkeC0xIDogaWR4KzFcclxuXHJcblx0XHRcdFx0XHRjdHJsLnNjb3BlLml0ZW1zLmFuaW1hdGUoe2xlZnQ6IG9wICsgd2lkdGh9LCBvcHRpb25zLmFuaW1hdGVEZWxheSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdGNoZWNrQnRucygpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInZpZXdwb3J0XFxcIj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiaXRlbXNcXFwiIGJuLWJpbmQ9XFxcIml0ZW1zXFxcIj48L2Rpdj5cdFxcclxcblx0PC9kaXY+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJvdmVybGF5XFxcIj5cXHJcXG5cdFx0PGRpdj5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkxlZnRcXFwiIFxcclxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiaGlkZGVuOiBsZWZ0RGlzYWJsZWRcXFwiXFxyXFxuXHRcdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hldnJvbi1jaXJjbGUtbGVmdFxcXCI+PC9pPlxcclxcblx0XHRcdDwvYnV0dG9uPlx0XHRcdFxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdFx0PGRpdj5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvblJpZ2h0XFxcIiBcXHJcXG5cdFx0XHRcdGJuLXByb3A9XFxcImhpZGRlbjogcmlnaHREaXNhYmxlZFxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hldnJvbi1jaXJjbGUtcmlnaHRcXFwiPjwvaT5cXHJcXG5cdFx0XHQ8L2J1dHRvbj5cdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRcdFx0bGVmdERpc2FibGVkOiB0cnVlLFxyXG5cdFx0XHRcdFx0XHRyaWdodERpc2FibGVkOiBmYWxzZVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLnNjb3BlLml0ZW1zLmFwcGVuZChpdGVtcylcclxuXHRcdFx0XHRcdFx0dGhpcy5zY29wZS5pdGVtcy5jc3MoJ2xlZnQnLCAoLWlkeCAqIG9wdGlvbnMud2lkdGgpICsgJ3B4JylcclxuXHRcdFx0XHRcdFx0Ly9jaGVja0J0bnMoKVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdFx0XHRvbkxlZnQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGFuaW1hdGUoJ2xlZnQnKVxyXG5cdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRvblJpZ2h0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRhbmltYXRlKCdyaWdodCcpXHJcblx0XHRcdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0Y2hlY2tCdG5zKClcdFx0XHJcblxyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHRcdFx0dGhpcy5zZXRJbmRleCA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1tDYXJvdXNlbENvbnRyb2xdIHNldEluZGV4JywgaW5kZXgpXHJcblx0XHRcdFx0aWR4ID0gIE1hdGgubWF4KDAsIE1hdGgubWluKGluZGV4LCBpdGVtcy5sZW5ndGgpKVxyXG5cdFx0XHRcdGN0cmwuc2NvcGUuaXRlbXMuY3NzKCdsZWZ0JywgKC1pZHggKiBvcHRpb25zLndpZHRoKSArICdweCcpXHJcblx0XHRcdFx0Y2hlY2tCdG5zKGlkeClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gY2hlY2tCdG5zKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2NoZWNrQnRucycsIGlkeCwgaXRlbXMubGVuZ3RoKVxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0XHRsZWZ0RGlzYWJsZWQ6IGlkeCA9PSAwLFxyXG5cdFx0XHRcdFx0cmlnaHREaXNhYmxlZDogaWR4ID09IGl0ZW1zLmxlbmd0aCAtIDFcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHQgXHRcdHRoaXMucmVmcmVzaCgpXHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0NoZWNrR3JvdXBDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdGVsdC5vbignY2xpY2snLCAnaW5wdXRbdHlwZT1jaGVja2JveF0nLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0JylcclxuXHRcdH0pXHJcblxyXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgcmV0ID0gW11cclxuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdOmNoZWNrZWQnKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldC5wdXNoKCQodGhpcykudmFsKCkpXHJcblx0XHRcdH0pXHRcclxuXHRcdFx0cmV0dXJuIHJldFx0XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cdFx0XHRcdGVsdC5maW5kKCdpbnB1dFt0eXBlPWNoZWNrYm94XScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCB2YWx1ZS5pbmRleE9mKCQodGhpcykudmFsKCkpID49IDApXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVx0XHRcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cclxufSk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdIdG1sRWRpdG9yQ29udHJvbCcsIHtcclxuXHJcblx0aWZhY2U6ICdodG1sKCknLFxyXG5cclxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHRlbHQuYWRkQ2xhc3MoJ2JuLWZsZXgtcm93JylcclxuXHJcblx0XHR2YXIgY21kQXJncyA9IHtcclxuXHRcdFx0J2ZvcmVDb2xvcic6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiBjdHJsLm1vZGVsLmNvbG9yXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblxyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIj5cXHJcXG5cXHJcXG5cdDxkaXYgYm4tZXZlbnQ9XFxcImNsaWNrLmNtZDogb25Db21tYW5kXFxcIj5cXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiYm9sZFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWJvbGRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpdGFsaWNcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1pdGFsaWNcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJ1bmRlcmxpbmVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS11bmRlcmxpbmVcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJzdHJpa2VUaHJvdWdoXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtc3RyaWtldGhyb3VnaFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZvcmVDb2xvclxcXCIgYm4tbWVudT1cXFwiY29sb3JJdGVtc1xcXCIgYm4tZXZlbnQ9XFxcIm1lbnVDaGFuZ2U6IG9uQ29sb3JNZW51Q2hhbmdlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtcGVuY2lsXFxcIiBibi1zdHlsZT1cXFwiY29sb3I6IGNvbG9yXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5TGVmdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFsaWduLWxlZnRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5Q2VudGVyXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tY2VudGVyXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwianVzdGlmeVJpZ2h0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tcmlnaHRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5kZW50XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtaW5kZW50XFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwib3V0ZGVudFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLW91dGRlbnRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5zZXJ0SG9yaXpvbnRhbFJ1bGVcXFwiPmhyPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDFcXFwiPmgxPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDJcXFwiPmgyPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDNcXFwiPmgzPC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plx0XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5zZXJ0VW5vcmRlcmVkTGlzdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWxpc3QtdWxcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbnNlcnRPcmRlcmVkTGlzdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWxpc3Qtb2xcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8L2Rpdj5cdFxcclxcblx0PGRpdiBjb250ZW50ZWRpdGFibGU9XFxcInRydWVcXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgZWRpdG9yXFxcIiBibi1iaW5kPVxcXCJlZGl0b3JcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0Y29sb3I6ICdibHVlJyxcclxuXHRcdFx0XHRjb2xvckl0ZW1zOiB7XHJcblx0XHRcdFx0XHRibGFjazoge25hbWU6ICdCbGFjayd9LFxyXG5cdFx0XHRcdFx0cmVkOiB7bmFtZTogJ1JlZCd9LFxyXG5cdFx0XHRcdFx0Z3JlZW46IHtuYW1lOiAnR3JlZW4nfSxcclxuXHRcdFx0XHRcdGJsdWU6IHtuYW1lOiAnQmx1ZSd9LFxyXG5cdFx0XHRcdFx0eWVsbG93OiB7bmFtZTogJ1llbGxvdyd9LFxyXG5cdFx0XHRcdFx0Y3lhbjoge25hbWU6ICdDeWFuJ30sXHJcblx0XHRcdFx0XHRtYWdlbnRhOiB7bmFtZTogJ01hZ2VudGEnfVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0b25Db21tYW5kOiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgY21kID0gJCh0aGlzKS5kYXRhKCdjbWQnKVxyXG5cdFx0XHRcdFx0dmFyIGNtZEFyZyA9ICQodGhpcykuZGF0YSgnY21kQXJnJylcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29tbWFuZCcsIGNtZCwgY21kQXJnKVxyXG5cclxuXHRcdFx0XHRcdHZhciBjbWRBcmcgPSBjbWRBcmcgfHwgY21kQXJnc1tjbWRdXHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNtZEFyZyA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdGNtZEFyZyA9IGNtZEFyZygpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvbW1hbmQnLCBjbWQsIGNtZEFyZylcclxuXHJcblx0XHRcdFx0XHRkb2N1bWVudC5leGVjQ29tbWFuZChjbWQsIGZhbHNlLCBjbWRBcmcpXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkNvbG9yTWVudUNoYW5nZTogZnVuY3Rpb24oZXYsIGNvbG9yKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvbG9yTWVudUNoYW5nZScsIGNvbG9yKVxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtjb2xvcn0pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdH0pXHJcblxyXG5cdFx0dGhpcy5odG1sID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBjdHJsLnNjb3BlLmVkaXRvci5odG1sKClcclxuXHRcdH1cclxuXHJcblxyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdGZ1bmN0aW9uIGdldFRlbXBsYXRlKGhlYWRlcnMpIHtcclxuXHRcdHJldHVybiBgXHJcblx0XHRcdDxkaXYgY2xhc3M9XCJzY3JvbGxQYW5lbFwiPlxyXG5cdCAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInczLXRhYmxlLWFsbCB3My1zbWFsbFwiPlxyXG5cdCAgICAgICAgICAgICAgICA8dGhlYWQ+XHJcblx0ICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJ3My1ncmVlblwiPlxyXG5cdCAgICAgICAgICAgICAgICAgICAgXHQke2hlYWRlcnN9XHJcblx0ICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG5cdCAgICAgICAgICAgICAgICA8L3RoZWFkPlxyXG5cdCAgICAgICAgICAgICAgICA8dGJvZHk+PC90Ym9keT5cclxuXHQgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuXHRcdGBcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldEl0ZW1UZW1wbGF0ZShyb3dzKSB7XHJcblx0XHRyZXR1cm4gYFxyXG4gICAgICAgICAgICA8dHIgY2xhc3M9XCJpdGVtXCIgYm4tYXR0cj1cImRhdGEtaWQ6IF9pZFwiPlxyXG4gICAgICAgICAgICBcdCR7cm93c31cclxuICAgICAgICAgICAgPC90cj5cdFxyXG5cdFx0YFxyXG5cdH1cclxuXHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnRmlsdGVyZWRUYWJsZUNvbnRyb2wnLCB7XHJcblxyXG5cdFx0aWZhY2U6ICdhZGRJdGVtKGlkLCBkYXRhKTtyZW1vdmVJdGVtKGlkKTtyZW1vdmVBbGxJdGVtcygpO3NldEZpbHRlcnMoZmlsdGVycyk7Z2V0RGF0YXMoKTtnZXREaXNwbGF5ZWREYXRhcygpO29uKGV2ZW50LCBjYWxsYmFjayknLFxyXG5cdFx0ZXZlbnRzOiAnaXRlbUFjdGlvbicsXHJcblxyXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdFx0XHR2YXIgY29sdW1ucyA9ICAkJC5vYmoyQXJyYXkob3B0aW9ucy5jb2x1bW5zKVxyXG5cdFx0XHR2YXIgYWN0aW9ucyA9ICQkLm9iajJBcnJheShvcHRpb25zLmFjdGlvbnMpXHJcblx0XHRcdHZhciBoZWFkZXJzID0gY29sdW1ucy5tYXAoKGNvbHVtbikgPT4gYDx0aD4ke2NvbHVtbi52YWx1ZX08L3RoPmApXHRcdFxyXG5cdFx0XHR2YXIgcm93cyA9IGNvbHVtbnMubWFwKChjb2x1bW4pID0+IGA8dGQgYm4taHRtbD1cIiR7Y29sdW1uLmtleX1cIj48L3RkPmApXHJcblx0XHRcdGlmIChhY3Rpb25zLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0XHRoZWFkZXJzLnB1c2goYDx0aD5BY3Rpb248L3RoPmApXHJcblxyXG5cdFx0XHRcdHZhciBidXR0b25zID0gYWN0aW9ucy5tYXAoKGFjdGlvbikgPT4gYDxidXR0b24gZGF0YS1hY3Rpb249XCIke2FjdGlvbi5rZXl9XCIgY2xhc3M9XCJ3My1idXR0b25cIj48aSBjbGFzcz1cIiR7YWN0aW9uLnZhbHVlfVwiPjwvaT48L2J1dHRvbj5gKVxyXG5cdFx0XHRcdHJvd3MucHVzaChgPHRkPiR7YnV0dG9uc308L3RkPmApXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ3Jvd3MnLCByb3dzKVxyXG5cdFx0XHR2YXIgaXRlbVRlbXBsYXRlID0gZ2V0SXRlbVRlbXBsYXRlKHJvd3Muam9pbignJykpXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2l0ZW1UZW1wbGF0ZScsIGl0ZW1UZW1wbGF0ZSlcclxuXHJcblx0XHRcdGVsdC5hcHBlbmQoZ2V0VGVtcGxhdGUoaGVhZGVycy5qb2luKCcnKSkpXHJcblx0XHRcdGVsdC5hZGRDbGFzcygnYm4tZmxleC1jb2wnKVxyXG5cclxuXHRcdFx0bGV0IGRhdGFzID0ge31cclxuXHRcdFx0bGV0IGV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcclxuXHRcdFx0bGV0IF9maWx0ZXJzID0ge31cclxuXHRcdFx0bGV0IGRpc3BsYXllZEl0ZW1zID0ge31cclxuXHJcblx0XHRcdGNvbnN0IHRib2R5ID0gZWx0LmZpbmQoJ3Rib2R5JylcclxuXHRcdFx0dGJvZHkub24oJ2NsaWNrJywgJ1tkYXRhLWFjdGlvbl0nLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgaWQgPSAkKHRoaXMpLmNsb3Nlc3QoJy5pdGVtJykuZGF0YSgnaWQnKVxyXG5cdFx0XHRcdHZhciBhY3Rpb24gPSAkKHRoaXMpLmRhdGEoJ2FjdGlvbicpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ2NsaWNrJywgaWQsICdhY3Rpb24nLCBhY3Rpb24pXHJcblx0XHRcdFx0ZXZlbnRzLmVtaXQoJ2l0ZW1BY3Rpb24nLCBhY3Rpb24sIGlkKVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0dGhpcy5hZGRJdGVtID0gZnVuY3Rpb24oaWQsIGRhdGEpIHtcclxuXHJcblx0XHRcdFx0dmFyIGl0ZW1EYXRhID0gJC5leHRlbmQoeydfaWQnOiBpZH0sIGRhdGEpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYWRkSXRlbScsIGl0ZW1EYXRhKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmIChkYXRhc1tpZF0gIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHR2YXIgaXRlbSA9IGRpc3BsYXllZEl0ZW1zW2lkXVxyXG5cdFx0XHRcdFx0aWYgKGl0ZW0gIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRcdGl0ZW0uZWx0LnVwZGF0ZVRlbXBsYXRlKGl0ZW0uY3R4LCBpdGVtRGF0YSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBpZiAoaXNJbkZpbHRlcihkYXRhKSl7XHJcblx0XHRcdFx0XHR2YXIgZWx0ID0gJChpdGVtVGVtcGxhdGUpXHJcblx0XHRcdFx0XHR2YXIgY3R4ID0gZWx0LnByb2Nlc3NUZW1wbGF0ZShpdGVtRGF0YSlcclxuXHRcdFx0XHRcdGRpc3BsYXllZEl0ZW1zW2lkXSA9IHtlbHQsIGN0eH1cclxuXHRcdFx0XHRcdHRib2R5LmFwcGVuZChlbHQpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRhdGFzW2lkXSA9IGRhdGFcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5yZW1vdmVJdGVtID0gZnVuY3Rpb24oaWQpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdyZW1vdmVJdGVtJywgaWQpXHJcblx0XHRcdFx0aWYgKGRhdGFzW2lkXSAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdGRlbGV0ZSBkYXRhc1tpZF1cclxuXHRcdFx0XHRcdHZhciBpdGVtID0gZGlzcGxheWVkSXRlbXNbaWRdXHJcblx0XHRcdFx0XHRpZiAoaXRlbSAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0aXRlbS5lbHQucmVtb3ZlKClcclxuXHRcdFx0XHRcdFx0ZGVsZXRlIGRpc3BsYXllZEl0ZW1zW2lkXVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5yZW1vdmVBbGxJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3JlbW92ZUFsbEl0ZW1zJylcclxuXHRcdFx0XHRkYXRhcyA9IHt9XHJcblx0XHRcdFx0ZGlzcGxheWVkSXRlbXMgPSB7fVxyXG5cdFx0XHRcdHRib2R5LmVtcHR5KClcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGlzSW5GaWx0ZXIoZGF0YSkge1xyXG5cdFx0XHRcdHZhciByZXQgPSB0cnVlXHJcblx0XHRcdFx0Zm9yKHZhciBmIGluIF9maWx0ZXJzKSB7XHJcblx0XHRcdFx0XHR2YXIgdmFsdWUgPSBkYXRhW2ZdXHJcblx0XHRcdFx0XHR2YXIgZmlsdGVyVmFsdWUgPSBfZmlsdGVyc1tmXVxyXG5cdFx0XHRcdFx0cmV0ICY9IChmaWx0ZXJWYWx1ZSA9PSAnJyB8fCB2YWx1ZS5zdGFydHNXaXRoKGZpbHRlclZhbHVlKSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHJldFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnNldEZpbHRlcnMgPSBmdW5jdGlvbihmaWx0ZXJzKSB7XHJcblx0XHRcdFx0X2ZpbHRlcnMgPSBmaWx0ZXJzXHJcblx0XHRcdFx0ZGlzcFRhYmxlKClcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGRpc3BUYWJsZSgpIHtcclxuXHRcdFx0XHRkaXNwbGF5ZWRJdGVtcyA9IHt9XHJcblx0XHRcdFx0bGV0IGl0ZW1zID0gW11cclxuXHRcdFx0XHRmb3IobGV0IGlkIGluIGRhdGFzKSB7XHJcblx0XHRcdFx0XHR2YXIgZGF0YSA9IGRhdGFzW2lkXVxyXG5cdFx0XHRcdFx0aWYgKGlzSW5GaWx0ZXIoZGF0YSkpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGl0ZW1EYXRhID0gJC5leHRlbmQoeydfaWQnOiBpZH0sIGRhdGEpXHJcblx0XHRcdFx0XHRcdHZhciBlbHQgPSAkKGl0ZW1UZW1wbGF0ZSlcclxuXHRcdFx0XHRcdFx0dmFyIGN0eCA9IGVsdC5wcm9jZXNzVGVtcGxhdGUoaXRlbURhdGEpXHRcdFx0XHJcblx0XHRcdFx0XHRcdGl0ZW1zLnB1c2goZWx0KVxyXG5cdFx0XHRcdFx0XHRkaXNwbGF5ZWRJdGVtc1tpZF0gPSB7ZWx0LCBjdHh9XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR0Ym9keS5lbXB0eSgpLmFwcGVuZChpdGVtcylcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5nZXREYXRhcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiBkYXRhc1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmdldERpc3BsYXllZERhdGFzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIHJldCA9IHt9XHJcblx0XHRcdFx0Zm9yKGxldCBpIGluIGRpc3BsYXllZEl0ZW1zKSB7XHJcblx0XHRcdFx0XHRyZXRbaV0gPSBkYXRhc1tpXVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcmV0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXHJcblxyXG5cclxuXHRcdH1cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdIZWFkZXJDb250cm9sJywge1xyXG5cdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLFxyXG5cdG9wdGlvbnM6IHtcclxuXHRcdHRpdGxlOiAnSGVsbG8gV29ybGQnLFxyXG5cdFx0dXNlck5hbWU6ICd1bmtub3duJ1xyXG5cdH0sXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2ID5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcImJyYW5kXFxcIj48aDEgY2xhc3M9XFxcImJuLXhzLWhpZGVcXFwiIGJuLXRleHQ9XFxcInRpdGxlXFxcIj48L2gxPiA8L2Rpdj5cXHJcXG5cdDxkaXY+XFxyXFxuXHQgICAgPGkgYm4tYXR0cj1cXFwidGl0bGU6IHRpdGxlU3RhdGVcXFwiIGNsYXNzPVxcXCJmYSBmYS1sZyBjb25uZWN0aW9uU3RhdGVcXFwiIGJuLWNsYXNzPVxcXCJmYS1leWU6IGNvbm5lY3RlZCwgZmEtZXllLXNsYXNoOiAhY29ubmVjdGVkXFxcIj48L2k+XFxyXFxuXHQgICAgPGkgY2xhc3M9XFxcImZhIGZhLXVzZXIgZmEtbGdcXFwiPjwvaT5cXHJcXG5cdCAgICA8c3BhbiBibi10ZXh0PVxcXCJ1c2VyTmFtZVxcXCIgY2xhc3M9XFxcInVzZXJOYW1lXFxcIj48L3NwYW4+XFxyXFxuXHQgICAgPGEgaHJlZj1cXFwiL1xcXCIgdGl0bGU9XFxcImhvbWVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1ob21lIGZhLWxnXFxcIj48L2k+PC9hPiBcXHJcXG5cdDwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0Y29ubmVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHR0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBkaXNjb25uZWN0ZWRcIixcclxuXHRcdFx0XHR0aXRsZTogb3B0aW9ucy50aXRsZSxcclxuXHRcdFx0XHR1c2VyTmFtZTogb3B0aW9ucy51c2VyTmFtZVx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cclxuXHRcdGNsaWVudC5ldmVudHMub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tIZWFkZXJDb250cm9sXSBjbGllbnQgY29ubmVjdGVkJylcclxuXHRcdFx0Y3RybC5zZXREYXRhKHtjb25uZWN0ZWQ6IHRydWUsIHRpdGxlU3RhdGU6IFwiV2ViU29ja2V0IGNvbm5lY3RlZFwifSlcclxuXHJcblx0XHR9KVxyXG5cclxuXHRcdGNsaWVudC5ldmVudHMub24oJ2Rpc2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tIZWFkZXJDb250cm9sXSBjbGllbnQgZGlzY29ubmVjdGVkJylcclxuXHRcdFx0Y3RybC5zZXREYXRhKHtjb25uZWN0ZWQ6IGZhbHNlLCB0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBkaXNjb25uZWN0ZWRcIn0pXHJcblxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0lucHV0R3JvdXBDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdHZhciBpZCA9IGVsdC5jaGlsZHJlbignaW5wdXQnKS51bmlxdWVJZCgpLmF0dHIoJ2lkJylcclxuXHRcdC8vY29uc29sZS5sb2coJ1tJbnB1dEdyb3VwQ29udHJvbF0gaWQnLCBpZClcclxuXHRcdGVsdC5jaGlsZHJlbignbGFiZWwnKS5hdHRyKCdmb3InLCBpZClcclxuXHR9XHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdOYXZiYXJDb250cm9sJywge1xyXG5cclxuXHRcdG9wdGlvbnM6IHtcclxuXHRcdFx0YWN0aXZlQ29sb3I6ICd3My1ncmVlbidcclxuXHRcdH0sXHJcblxyXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0XHR2YXIgYWN0aXZlQ29sb3IgPSBvcHRpb25zLmFjdGl2ZUNvbG9yXHJcblxyXG5cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW05hdmJhckNvbnRyb2xdIG9wdGlvbnMnLCBvcHRpb25zKVxyXG5cclxuXHRcdFx0ZWx0LmFkZENsYXNzKCd3My1iYXInKVxyXG5cdFx0XHRlbHQuY2hpbGRyZW4oJ2EnKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ3czLWJhci1pdGVtIHczLWJ1dHRvbicpXHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHQkKHdpbmRvdykub24oJ3JvdXRlQ2hhbmdlZCcsIGZ1bmN0aW9uKGV2dCwgbmV3Um91dGUpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbTmF2YmFyQ29udHJvbF0gcm91dGVDaGFuZ2UnLCBuZXdSb3V0ZSlcclxuXHJcblx0XHRcdFx0ZWx0LmNoaWxkcmVuKGBhLiR7YWN0aXZlQ29sb3J9YCkucmVtb3ZlQ2xhc3MoYWN0aXZlQ29sb3IpXHRcclxuXHRcdFx0XHRlbHQuY2hpbGRyZW4oYGFbaHJlZj1cIiMke25ld1JvdXRlfVwiXWApLmFkZENsYXNzKGFjdGl2ZUNvbG9yKVxyXG5cclxuXHRcdFx0fSlcdFxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxuXHJcbn0pKCk7XHJcblxyXG5cclxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ1BpY3R1cmVDYXJvdXNlbENvbnRyb2wnLCB7XHJcblxyXG5cdHByb3BzOiB7XHJcblx0XHRpbmRleDoge3ZhbDogMCwgc2V0OiAnc2V0SW5kZXgnfSxcclxuXHRcdGltYWdlczoge3ZhbDogW10sIHNldDogJ3NldEltYWdlcyd9XHJcblx0fSxcclxuXHRvcHRpb25zOiB7XHJcblx0XHR3aWR0aDogMzAwLFxyXG5cdFx0aGVpZ2h0OiAyMDAsXHJcblx0XHRhbmltYXRlRGVsYXk6IDEwMDAsXHJcblx0XHRjb2xvcjogJ3llbGxvdydcclxuXHR9LFx0XHJcblxyXG5cdGlmYWNlOiAnc2V0SW1hZ2VzKGltYWdlcyk7c2V0SW5kZXgoaWR4KScsXHJcblxyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdGNvbnNvbGUubG9nKGBbUGljdHVyZUNhcm91c2VsQ29udHJvbF0gb3B0aW9uc2AsIG9wdGlvbnMpXHJcblxyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBibi1jb250cm9sPVxcXCJDYXJvdXNlbENvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcImNhcm91c2VsQ3RybE9wdGlvbnNcXFwiIGJuLWVhY2g9XFxcImkgb2YgaW1hZ2VzXFxcIiBibi1pZmFjZT1cXFwiY2Fyb3VzZWxDdHJsXFxcIiBibi1kYXRhPVxcXCJpbmRleDogaW5kZXhcXFwiPlxcclxcblx0PGRpdiBzdHlsZT1cXFwidGV4dC1hbGlnbjogY2VudGVyO1xcXCIgYm4tc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6IGJhY2tDb2xvclxcXCI+XFxyXFxuXHRcdDxpbWcgYm4tYXR0cj1cXFwic3JjOiBpXFxcIiBzdHlsZT1cXFwiaGVpZ2h0OiAxMDAlXFxcIj5cXHJcXG5cdDwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0Y2Fyb3VzZWxDdHJsT3B0aW9uczogb3B0aW9ucyxcclxuXHRcdFx0XHRpbWFnZXM6IG9wdGlvbnMuaW1hZ2VzLFxyXG5cdFx0XHRcdGJhY2tDb2xvcjogb3B0aW9ucy5jb2xvcixcclxuXHRcdFx0XHRpbmRleDogb3B0aW9ucy5pbmRleFxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cclxuXHRcdHRoaXMuc2V0SW1hZ2VzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1BpY3R1cmVDYXJvdXNlbENvbnRyb2xdIHNldEltYWdlcycsIHZhbHVlKVxyXG5cdFx0XHRjdHJsLnNldERhdGEoJ2ltYWdlcycsIHZhbHVlKVxyXG5cdFx0XHRjdHJsLnNjb3BlLmNhcm91c2VsQ3RybC5yZWZyZXNoKClcdFx0XHRcclxuXHRcdH0sXHJcblx0XHR0aGlzLnNldEluZGV4ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3RybC5zZXREYXRhKCdpbmRleCcsIHZhbHVlKVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0pOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sKCdSYWRpb0dyb3VwQ29udHJvbCcsIGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdGVsdC5vbignY2xpY2snLCAnaW5wdXRbdHlwZT1yYWRpb10nLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncmFkaW9ncm91cCBjbGljaycpXHJcblx0XHRcdGVsdC5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXTpjaGVja2VkJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKVxyXG5cdFx0XHQkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKVxyXG5cdFx0XHRlbHQudHJpZ2dlcignaW5wdXQnKVxyXG5cdFx0fSlcclxuXHRcdFxyXG5cclxuXHRcdHRoaXMuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIGVsdC5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXTpjaGVja2VkJykudmFsKClcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLnNldFZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCB2YWx1ZSA9PT0gJCh0aGlzKS52YWwoKSlcclxuXHRcdFx0fSlcdFx0XHRcclxuXHRcdH1cclxuXHJcblxyXG5cdH0pXHJcblxyXG5cclxufSkoKTtcclxuXHJcblxyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdGZ1bmN0aW9uIG1hdGNoUm91dGUocm91dGUsIHBhdHRlcm4pIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ21hdGNoUm91dGUnLCByb3V0ZSwgcGF0dGVybilcclxuXHRcdHZhciByb3V0ZVNwbGl0ID0gcm91dGUuc3BsaXQoJy8nKVxyXG5cdFx0dmFyIHBhdHRlcm5TcGxpdCA9IHBhdHRlcm4uc3BsaXQoJy8nKVxyXG5cdFx0Ly9jb25zb2xlLmxvZyhyb3V0ZVNwbGl0LCBwYXR0ZXJuU3BsaXQpXHJcblx0XHR2YXIgcmV0ID0ge31cclxuXHJcblx0XHRpZiAocm91dGVTcGxpdC5sZW5ndGggIT0gcGF0dGVyblNwbGl0Lmxlbmd0aClcclxuXHRcdFx0cmV0dXJuIG51bGxcclxuXHJcblx0XHRmb3IodmFyIGlkeCA9IDA7IGlkeCA8IHBhdHRlcm5TcGxpdC5sZW5ndGg7IGlkeCsrKSB7XHJcblx0XHRcdHZhciBwYXRoID0gcGF0dGVyblNwbGl0W2lkeF1cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncGF0aCcsIHBhdGgpXHJcblx0XHRcdGlmIChwYXRoLnN1YnN0cigwLCAxKSA9PT0gJzonKSB7XHJcblx0XHRcdFx0aWYgKHJvdXRlU3BsaXRbaWR4XS5sZW5ndGggPT09IDApXHJcblx0XHRcdFx0XHRyZXR1cm4gbnVsbFxyXG5cdFx0XHRcdHJldFtwYXRoLnN1YnN0cigxKV0gPSByb3V0ZVNwbGl0W2lkeF1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChwYXRoICE9PSByb3V0ZVNwbGl0W2lkeF0pIHtcclxuXHRcdFx0XHRyZXR1cm4gbnVsbFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdSb3V0ZXJDb250cm9sJywge1xyXG5cclxuXHRcdG9wdGlvbnM6IHtcclxuXHRcdFx0cm91dGVzOiBbXVxyXG5cdFx0fSxcclxuXHRcdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHJcblxyXG5cdFx0XHR2YXIgcm91dGVzID0gb3B0aW9ucy5yb3V0ZXNcclxuXHJcblx0XHRcdGlmICghQXJyYXkuaXNBcnJheShyb3V0ZXMpKSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKCdbUm91dGVyQ29udHJvbF0gYmFkIG9wdGlvbnMnKVxyXG5cdFx0XHRcdHJldHVyblxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gcHJvY2Vzc1JvdXRlKGluZm8pIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW1JvdXRlckNvbnRyb2xdIHByb2Nlc3NSb3V0ZScsIGluZm8pXHJcblxyXG5cdFx0XHRcdHZhciBuZXdSb3V0ZSA9IGluZm8uY3VyUm91dGVcclxuXHJcblx0XHRcdFx0Zm9yKHZhciByb3V0ZSBvZiByb3V0ZXMpIHtcclxuXHRcdFx0XHRcdHZhciBwYXJhbXMgPSBtYXRjaFJvdXRlKG5ld1JvdXRlLCByb3V0ZS5ocmVmKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgcm91dGU6ICR7cm91dGUuaHJlZn0sIHBhcmFtc2AsIHBhcmFtcylcclxuXHRcdFx0XHRcdGlmIChwYXJhbXMgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbUm91dGVyQ29udHJvbF0gcGFyYW1zJywgcGFyYW1zKVxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJvdXRlLnJlZGlyZWN0ID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdFx0bG9jYXRpb24uaHJlZiA9ICcjJyArIHJvdXRlLnJlZGlyZWN0XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIHJvdXRlLmNvbnRyb2wgPT0gJ3N0cmluZycpIHtcclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyIGN1ckN0cmwgPSBlbHQuZmluZCgnLkN1c3RvbUNvbnRyb2wnKS5pbnRlcmZhY2UoKVxyXG5cdFx0XHRcdFx0XHRcdHZhciBjYW5DaGFuZ2UgPSB0cnVlXHJcblx0XHRcdFx0XHRcdFx0aWYgKGN1ckN0cmwgJiYgdHlwZW9mIGN1ckN0cmwuY2FuQ2hhbmdlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGNhbkNoYW5nZSA9IGN1ckN0cmwuY2FuQ2hhbmdlKClcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0aWYgKGNhbkNoYW5nZSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JCh3aW5kb3cpLnRyaWdnZXIoJ3JvdXRlQ2hhbmdlZCcsIG5ld1JvdXRlKVxyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGNvbmZpZyA9ICQuZXh0ZW5kKHskcGFyYW1zOiBwYXJhbXN9LCByb3V0ZS5vcHRpb25zKVx0XHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgaHRtbCA9ICQoYDxkaXYgYm4tY29udHJvbD1cIiR7cm91dGUuY29udHJvbH1cIiBibi1vcHRpb25zPVwiY29uZmlnXCIgY2xhc3M9XCJibi1mbGV4LWNvbCBibi1mbGV4LTFcIj48L2Rpdj5gKVxyXG5cdFx0XHRcdFx0XHRcdFx0ZWx0LmRpc3Bvc2UoKS5odG1sKGh0bWwpXHJcblx0XHRcdFx0XHRcdFx0XHRodG1sLnByb2Nlc3NVSSh7Y29uZmlnOiBjb25maWd9KVx0XHRcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0ZWxzZSBpZiAoaW5mby5wcmV2Um91dGUpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCAnJywgJyMnICsgaW5mby5wcmV2Um91dGUpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHQvL2VsdC5odG1sKGh0bWwpXHJcblxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdFx0XHR9XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblxyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHRcdFx0JCh3aW5kb3cpLm9uKCdyb3V0ZUNoYW5nZScsIGZ1bmN0aW9uKGV2LCBpbmZvKSB7XHJcblx0XHRcdFx0aWYgKCFwcm9jZXNzUm91dGUoaW5mbykpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW1JvdXRlckNvbnRyb2xdIG5vIGFjdGlvbiBkZWZpbmVkIGZvciByb3V0ZSAnJHtuZXdSb3V0ZX0nYClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblxyXG5cclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcblxyXG5cclxuIl19

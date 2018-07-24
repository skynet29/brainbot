(function() {

	$$.registerControlEx('CarouselControl', {

		props: {
			width: {val: 300},
			height: {val: 200},
			animateDelay: {val: 1000},
			index: {
				val: 0,
				set: 'setIndex'
			} 
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
	props: {
		title: {val: 'Hello World'},
		userName: {val: 'unknown'}
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

		props: {
			activeColor: {val: 'w3-green'}
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
		width: {val: 300},
		height: {val: 200},
		animateDelay: {val: 1000},
		index: {val: 0, set: 'setIndex'},
		images: {val: [], set: 'setImages'},
		color: {val: 'yellow'}
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

		props: {
			routes: {val: []}
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



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhcm91c2VsLmpzIiwiY2hlY2tncm91cC5qcyIsImVkaXRvci5qcyIsImZpbHRlcmVkLXRhYmxlLmpzIiwiaGVhZGVyLmpzIiwiaW5wdXRncm91cC5qcyIsIm5hdmJhci5qcyIsInBpY3R1cmVjYXJvdXNlbC5qcyIsInJhZGlvZ3JvdXAuanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnQ2Fyb3VzZWxDb250cm9sJywge1xyXG5cclxuXHRcdHByb3BzOiB7XHJcblx0XHRcdHdpZHRoOiB7dmFsOiAzMDB9LFxyXG5cdFx0XHRoZWlnaHQ6IHt2YWw6IDIwMH0sXHJcblx0XHRcdGFuaW1hdGVEZWxheToge3ZhbDogMTAwMH0sXHJcblx0XHRcdGluZGV4OiB7XHJcblx0XHRcdFx0dmFsOiAwLFxyXG5cdFx0XHRcdHNldDogJ3NldEluZGV4J1xyXG5cdFx0XHR9IFxyXG5cdFx0fSxcclxuXHRcdGlmYWNlOiAnc2V0SW5kZXgoaWR4KTtyZWZyZXNoKCknLFxyXG5cclxuXHRcdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cdFxyXG5cclxuXHJcblx0XHRcdHZhciB3aWR0aCA9IG9wdGlvbnMud2lkdGggKyAncHgnXHJcblx0XHRcdHZhciBoZWlnaHQgPSBvcHRpb25zLmhlaWdodCArICdweCdcclxuXHRcdFx0ZWx0LmNzcygnd2lkdGgnLCB3aWR0aCkuY3NzKCdoZWlnaHQnLCBoZWlnaHQpXHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZyhgW0Nhcm91c2VsQ29udHJvbF0gb3B0aW9uc2AsIG9wdGlvbnMpXHJcblxyXG5cdFx0XHR2YXIgY3RybCA9IG51bGxcclxuXHRcdFx0dmFyIGl0ZW1zXHJcblx0XHRcdHZhciBpZHhcclxuXHJcblxyXG5cdFx0XHR0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbQ2Fyb3VzZWxDb250cm9sXSByZWZyZXNoJylcclxuXHRcdFx0XHRpdGVtcyA9IGVsdC5jaGlsZHJlbignZGl2JykucmVtb3ZlKCkuY3NzKCd3aWR0aCcsIHdpZHRoKS5jc3MoJ2hlaWdodCcsIGhlaWdodClcdFx0XHJcblxyXG5cdFx0XHRcdGlkeCA9IE1hdGgubWF4KDAsIE1hdGgubWluKG9wdGlvbnMuaW5kZXgsIGl0ZW1zLmxlbmd0aCkpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW0Nhcm91c2VsQ29udHJvbF0gaWR4YCwgaWR4KVxyXG5cclxuXHRcdFx0XHRmdW5jdGlvbiBhbmltYXRlKGRpcmVjdGlvbikge1xyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtsZWZ0RGlzYWJsZWQ6IHRydWUsIHJpZ2h0RGlzYWJsZWQ6IHRydWV9KVxyXG5cdFx0XHRcdFx0dmFyIG9wID0gZGlyZWN0aW9uID09ICdsZWZ0JyA/ICcrPScgOiAnLT0nXHJcblx0XHRcdFx0XHRpZHggPSBkaXJlY3Rpb24gPT0gJ2xlZnQnID8gaWR4LTEgOiBpZHgrMVxyXG5cclxuXHRcdFx0XHRcdGN0cmwuc2NvcGUuaXRlbXMuYW5pbWF0ZSh7bGVmdDogb3AgKyB3aWR0aH0sIG9wdGlvbnMuYW5pbWF0ZURlbGF5LCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0Y2hlY2tCdG5zKClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcclxcblx0PGRpdiBjbGFzcz1cXFwidmlld3BvcnRcXFwiPlxcclxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJpdGVtc1xcXCIgYm4tYmluZD1cXFwiaXRlbXNcXFwiPjwvZGl2Plx0XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcIm92ZXJsYXlcXFwiPlxcclxcblx0XHQ8ZGl2Plxcclxcblx0XHRcdDxidXR0b24gXFxyXFxuXHRcdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uTGVmdFxcXCIgXFxyXFxuXHRcdFx0XHRibi1wcm9wPVxcXCJoaWRkZW46IGxlZnREaXNhYmxlZFxcXCJcXHJcXG5cdFx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1jaGV2cm9uLWNpcmNsZS1sZWZ0XFxcIj48L2k+XFxyXFxuXHRcdFx0PC9idXR0b24+XHRcdFx0XFxyXFxuXHRcdDwvZGl2Plxcclxcblxcclxcblx0XHQ8ZGl2Plxcclxcblx0XHRcdDxidXR0b24gXFxyXFxuXHRcdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uUmlnaHRcXFwiIFxcclxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiaGlkZGVuOiByaWdodERpc2FibGVkXFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1jaGV2cm9uLWNpcmNsZS1yaWdodFxcXCI+PC9pPlxcclxcblx0XHRcdDwvYnV0dG9uPlx0XHRcdFxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDwvZGl2PlxcclxcblxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdFx0XHRsZWZ0RGlzYWJsZWQ6IHRydWUsXHJcblx0XHRcdFx0XHRcdHJpZ2h0RGlzYWJsZWQ6IGZhbHNlXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0aW5pdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMuc2NvcGUuaXRlbXMuYXBwZW5kKGl0ZW1zKVxyXG5cdFx0XHRcdFx0XHR0aGlzLnNjb3BlLml0ZW1zLmNzcygnbGVmdCcsICgtaWR4ICogb3B0aW9ucy53aWR0aCkgKyAncHgnKVxyXG5cdFx0XHRcdFx0XHQvL2NoZWNrQnRucygpXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0XHRcdG9uTGVmdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0YW5pbWF0ZSgnbGVmdCcpXHJcblx0XHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRcdG9uUmlnaHQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGFuaW1hdGUoJ3JpZ2h0JylcclxuXHRcdFx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHRjaGVja0J0bnMoKVx0XHRcclxuXHJcblx0XHRcdH1cdFx0XHJcblxyXG5cdFx0XHR0aGlzLnNldEluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW0Nhcm91c2VsQ29udHJvbF0gc2V0SW5kZXgnLCBpbmRleClcclxuXHRcdFx0XHRpZHggPSAgTWF0aC5tYXgoMCwgTWF0aC5taW4oaW5kZXgsIGl0ZW1zLmxlbmd0aCkpXHJcblx0XHRcdFx0Y3RybC5zY29wZS5pdGVtcy5jc3MoJ2xlZnQnLCAoLWlkeCAqIG9wdGlvbnMud2lkdGgpICsgJ3B4JylcclxuXHRcdFx0XHRjaGVja0J0bnMoaWR4KVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBjaGVja0J0bnMoKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY2hlY2tCdG5zJywgaWR4LCBpdGVtcy5sZW5ndGgpXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdGxlZnREaXNhYmxlZDogaWR4ID09IDAsXHJcblx0XHRcdFx0XHRyaWdodERpc2FibGVkOiBpZHggPT0gaXRlbXMubGVuZ3RoIC0gMVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cdFx0XHJcblxyXG5cdCBcdFx0dGhpcy5yZWZyZXNoKClcclxuXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnQ2hlY2tHcm91cENvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0Lm9uKCdjbGljaycsICdpbnB1dFt0eXBlPWNoZWNrYm94XScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRlbHQudHJpZ2dlcignaW5wdXQnKVxyXG5cdFx0fSlcclxuXHJcblx0XHR0aGlzLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciByZXQgPSBbXVxyXG5cdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1jaGVja2JveF06Y2hlY2tlZCcpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0LnB1c2goJCh0aGlzKS52YWwoKSlcclxuXHRcdFx0fSlcdFxyXG5cdFx0XHRyZXR1cm4gcmV0XHRcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLnNldFZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcblx0XHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHZhbHVlLmluZGV4T2YoJCh0aGlzKS52YWwoKSkgPj0gMClcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHRcdFxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0h0bWxFZGl0b3JDb250cm9sJywge1xyXG5cclxuXHRpZmFjZTogJ2h0bWwoKScsXHJcblxyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdGVsdC5hZGRDbGFzcygnYm4tZmxleC1yb3cnKVxyXG5cclxuXHRcdHZhciBjbWRBcmdzID0ge1xyXG5cdFx0XHQnZm9yZUNvbG9yJzogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIGN0cmwubW9kZWwuY29sb3JcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPlxcclxcblxcclxcblx0PGRpdiBibi1ldmVudD1cXFwiY2xpY2suY21kOiBvbkNvbW1hbmRcXFwiPlxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJib2xkXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYm9sZFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcIml0YWxpY1xcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWl0YWxpY1xcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcInVuZGVybGluZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXVuZGVybGluZVxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcInN0cmlrZVRocm91Z2hcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1zdHJpa2V0aHJvdWdoXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9yZUNvbG9yXFxcIiBibi1tZW51PVxcXCJjb2xvckl0ZW1zXFxcIiBibi1ldmVudD1cXFwibWVudUNoYW5nZTogb25Db2xvck1lbnVDaGFuZ2VcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1wZW5jaWxcXFwiIGJuLXN0eWxlPVxcXCJjb2xvcjogY29sb3JcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImp1c3RpZnlMZWZ0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tbGVmdFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImp1c3RpZnlDZW50ZXJcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1hbGlnbi1jZW50ZXJcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5UmlnaHRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1hbGlnbi1yaWdodFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cdFxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbmRlbnRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1pbmRlbnRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJvdXRkZW50XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtb3V0ZGVudFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cdFxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbnNlcnRIb3Jpem9udGFsUnVsZVxcXCI+aHI8L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JtYXRCbG9ja1xcXCIgZGF0YS1jbWQtYXJnPVxcXCJoMVxcXCI+aDE8L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JtYXRCbG9ja1xcXCIgZGF0YS1jbWQtYXJnPVxcXCJoMlxcXCI+aDI8L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JtYXRCbG9ja1xcXCIgZGF0YS1jbWQtYXJnPVxcXCJoM1xcXCI+aDM8L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XHRcdFxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbnNlcnRVbm9yZGVyZWRMaXN0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtbGlzdC11bFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImluc2VydE9yZGVyZWRMaXN0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtbGlzdC1vbFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDwvZGl2Plx0XFxyXFxuXHQ8ZGl2IGNvbnRlbnRlZGl0YWJsZT1cXFwidHJ1ZVxcXCIgY2xhc3M9XFxcImJuLWZsZXgtMSBlZGl0b3JcXFwiIGJuLWJpbmQ9XFxcImVkaXRvclxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRjb2xvcjogJ2JsdWUnLFxyXG5cdFx0XHRcdGNvbG9ySXRlbXM6IHtcclxuXHRcdFx0XHRcdGJsYWNrOiB7bmFtZTogJ0JsYWNrJ30sXHJcblx0XHRcdFx0XHRyZWQ6IHtuYW1lOiAnUmVkJ30sXHJcblx0XHRcdFx0XHRncmVlbjoge25hbWU6ICdHcmVlbid9LFxyXG5cdFx0XHRcdFx0Ymx1ZToge25hbWU6ICdCbHVlJ30sXHJcblx0XHRcdFx0XHR5ZWxsb3c6IHtuYW1lOiAnWWVsbG93J30sXHJcblx0XHRcdFx0XHRjeWFuOiB7bmFtZTogJ0N5YW4nfSxcclxuXHRcdFx0XHRcdG1hZ2VudGE6IHtuYW1lOiAnTWFnZW50YSd9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRvbkNvbW1hbmQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0XHRcdHZhciBjbWQgPSAkKHRoaXMpLmRhdGEoJ2NtZCcpXHJcblx0XHRcdFx0XHR2YXIgY21kQXJnID0gJCh0aGlzKS5kYXRhKCdjbWRBcmcnKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Db21tYW5kJywgY21kLCBjbWRBcmcpXHJcblxyXG5cdFx0XHRcdFx0dmFyIGNtZEFyZyA9IGNtZEFyZyB8fCBjbWRBcmdzW2NtZF1cclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgY21kQXJnID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0Y21kQXJnID0gY21kQXJnKClcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29tbWFuZCcsIGNtZCwgY21kQXJnKVxyXG5cclxuXHRcdFx0XHRcdGRvY3VtZW50LmV4ZWNDb21tYW5kKGNtZCwgZmFsc2UsIGNtZEFyZylcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uQ29sb3JNZW51Q2hhbmdlOiBmdW5jdGlvbihldiwgY29sb3IpIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29sb3JNZW51Q2hhbmdlJywgY29sb3IpXHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe2NvbG9yfSlcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSlcclxuXHJcblx0XHR0aGlzLmh0bWwgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIGN0cmwuc2NvcGUuZWRpdG9yLmh0bWwoKVxyXG5cdFx0fVxyXG5cclxuXHJcblx0fVxyXG5cclxufSk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0ZnVuY3Rpb24gZ2V0VGVtcGxhdGUoaGVhZGVycykge1xyXG5cdFx0cmV0dXJuIGBcclxuXHRcdFx0PGRpdiBjbGFzcz1cInNjcm9sbFBhbmVsXCI+XHJcblx0ICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidzMtdGFibGUtYWxsIHczLXNtYWxsXCI+XHJcblx0ICAgICAgICAgICAgICAgIDx0aGVhZD5cclxuXHQgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzcz1cInczLWdyZWVuXCI+XHJcblx0ICAgICAgICAgICAgICAgICAgICBcdCR7aGVhZGVyc31cclxuXHQgICAgICAgICAgICAgICAgICAgIDwvdHI+XHJcblx0ICAgICAgICAgICAgICAgIDwvdGhlYWQ+XHJcblx0ICAgICAgICAgICAgICAgIDx0Ym9keT48L3Rib2R5PlxyXG5cdCAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG5cdFx0YFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0SXRlbVRlbXBsYXRlKHJvd3MpIHtcclxuXHRcdHJldHVybiBgXHJcbiAgICAgICAgICAgIDx0ciBjbGFzcz1cIml0ZW1cIiBibi1hdHRyPVwiZGF0YS1pZDogX2lkXCI+XHJcbiAgICAgICAgICAgIFx0JHtyb3dzfVxyXG4gICAgICAgICAgICA8L3RyPlx0XHJcblx0XHRgXHJcblx0fVxyXG5cclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdGaWx0ZXJlZFRhYmxlQ29udHJvbCcsIHtcclxuXHJcblx0XHRpZmFjZTogJ2FkZEl0ZW0oaWQsIGRhdGEpO3JlbW92ZUl0ZW0oaWQpO3JlbW92ZUFsbEl0ZW1zKCk7c2V0RmlsdGVycyhmaWx0ZXJzKTtnZXREYXRhcygpO2dldERpc3BsYXllZERhdGFzKCk7b24oZXZlbnQsIGNhbGxiYWNrKScsXHJcblx0XHRldmVudHM6ICdpdGVtQWN0aW9uJyxcclxuXHJcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKCdvcHRpb25zJywgb3B0aW9ucylcclxuXHJcblx0XHRcdHZhciBjb2x1bW5zID0gICQkLm9iajJBcnJheShvcHRpb25zLmNvbHVtbnMpXHJcblx0XHRcdHZhciBhY3Rpb25zID0gJCQub2JqMkFycmF5KG9wdGlvbnMuYWN0aW9ucylcclxuXHRcdFx0dmFyIGhlYWRlcnMgPSBjb2x1bW5zLm1hcCgoY29sdW1uKSA9PiBgPHRoPiR7Y29sdW1uLnZhbHVlfTwvdGg+YClcdFx0XHJcblx0XHRcdHZhciByb3dzID0gY29sdW1ucy5tYXAoKGNvbHVtbikgPT4gYDx0ZCBibi1odG1sPVwiJHtjb2x1bW4ua2V5fVwiPjwvdGQ+YClcclxuXHRcdFx0aWYgKGFjdGlvbnMubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdGhlYWRlcnMucHVzaChgPHRoPkFjdGlvbjwvdGg+YClcclxuXHJcblx0XHRcdFx0dmFyIGJ1dHRvbnMgPSBhY3Rpb25zLm1hcCgoYWN0aW9uKSA9PiBgPGJ1dHRvbiBkYXRhLWFjdGlvbj1cIiR7YWN0aW9uLmtleX1cIiBjbGFzcz1cInczLWJ1dHRvblwiPjxpIGNsYXNzPVwiJHthY3Rpb24udmFsdWV9XCI+PC9pPjwvYnV0dG9uPmApXHJcblx0XHRcdFx0cm93cy5wdXNoKGA8dGQ+JHtidXR0b25zfTwvdGQ+YClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncm93cycsIHJvd3MpXHJcblx0XHRcdHZhciBpdGVtVGVtcGxhdGUgPSBnZXRJdGVtVGVtcGxhdGUocm93cy5qb2luKCcnKSlcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnaXRlbVRlbXBsYXRlJywgaXRlbVRlbXBsYXRlKVxyXG5cclxuXHRcdFx0ZWx0LmFwcGVuZChnZXRUZW1wbGF0ZShoZWFkZXJzLmpvaW4oJycpKSlcclxuXHRcdFx0ZWx0LmFkZENsYXNzKCdibi1mbGV4LWNvbCcpXHJcblxyXG5cdFx0XHRsZXQgZGF0YXMgPSB7fVxyXG5cdFx0XHRsZXQgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cdFx0XHRsZXQgX2ZpbHRlcnMgPSB7fVxyXG5cdFx0XHRsZXQgZGlzcGxheWVkSXRlbXMgPSB7fVxyXG5cclxuXHRcdFx0Y29uc3QgdGJvZHkgPSBlbHQuZmluZCgndGJvZHknKVxyXG5cdFx0XHR0Ym9keS5vbignY2xpY2snLCAnW2RhdGEtYWN0aW9uXScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHZhciBpZCA9ICQodGhpcykuY2xvc2VzdCgnLml0ZW0nKS5kYXRhKCdpZCcpXHJcblx0XHRcdFx0dmFyIGFjdGlvbiA9ICQodGhpcykuZGF0YSgnYWN0aW9uJylcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnY2xpY2snLCBpZCwgJ2FjdGlvbicsIGFjdGlvbilcclxuXHRcdFx0XHRldmVudHMuZW1pdCgnaXRlbUFjdGlvbicsIGFjdGlvbiwgaWQpXHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHR0aGlzLmFkZEl0ZW0gPSBmdW5jdGlvbihpZCwgZGF0YSkge1xyXG5cclxuXHRcdFx0XHR2YXIgaXRlbURhdGEgPSAkLmV4dGVuZCh7J19pZCc6IGlkfSwgZGF0YSlcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdhZGRJdGVtJywgaXRlbURhdGEpXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGRhdGFzW2lkXSAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdHZhciBpdGVtID0gZGlzcGxheWVkSXRlbXNbaWRdXHJcblx0XHRcdFx0XHRpZiAoaXRlbSAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0aXRlbS5lbHQudXBkYXRlVGVtcGxhdGUoaXRlbS5jdHgsIGl0ZW1EYXRhKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIGlmIChpc0luRmlsdGVyKGRhdGEpKXtcclxuXHRcdFx0XHRcdHZhciBlbHQgPSAkKGl0ZW1UZW1wbGF0ZSlcclxuXHRcdFx0XHRcdHZhciBjdHggPSBlbHQucHJvY2Vzc1RlbXBsYXRlKGl0ZW1EYXRhKVxyXG5cdFx0XHRcdFx0ZGlzcGxheWVkSXRlbXNbaWRdID0ge2VsdCwgY3R4fVxyXG5cdFx0XHRcdFx0dGJvZHkuYXBwZW5kKGVsdClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGF0YXNbaWRdID0gZGF0YVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbihpZCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3JlbW92ZUl0ZW0nLCBpZClcclxuXHRcdFx0XHRpZiAoZGF0YXNbaWRdICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0ZGVsZXRlIGRhdGFzW2lkXVxyXG5cdFx0XHRcdFx0dmFyIGl0ZW0gPSBkaXNwbGF5ZWRJdGVtc1tpZF1cclxuXHRcdFx0XHRcdGlmIChpdGVtICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0XHRpdGVtLmVsdC5yZW1vdmUoKVxyXG5cdFx0XHRcdFx0XHRkZWxldGUgZGlzcGxheWVkSXRlbXNbaWRdXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnJlbW92ZUFsbEl0ZW1zID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygncmVtb3ZlQWxsSXRlbXMnKVxyXG5cdFx0XHRcdGRhdGFzID0ge31cclxuXHRcdFx0XHRkaXNwbGF5ZWRJdGVtcyA9IHt9XHJcblx0XHRcdFx0dGJvZHkuZW1wdHkoKVx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gaXNJbkZpbHRlcihkYXRhKSB7XHJcblx0XHRcdFx0dmFyIHJldCA9IHRydWVcclxuXHRcdFx0XHRmb3IodmFyIGYgaW4gX2ZpbHRlcnMpIHtcclxuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IGRhdGFbZl1cclxuXHRcdFx0XHRcdHZhciBmaWx0ZXJWYWx1ZSA9IF9maWx0ZXJzW2ZdXHJcblx0XHRcdFx0XHRyZXQgJj0gKGZpbHRlclZhbHVlID09ICcnIHx8IHZhbHVlLnN0YXJ0c1dpdGgoZmlsdGVyVmFsdWUpKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcmV0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuc2V0RmlsdGVycyA9IGZ1bmN0aW9uKGZpbHRlcnMpIHtcclxuXHRcdFx0XHRfZmlsdGVycyA9IGZpbHRlcnNcclxuXHRcdFx0XHRkaXNwVGFibGUoKVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZGlzcFRhYmxlKCkge1xyXG5cdFx0XHRcdGRpc3BsYXllZEl0ZW1zID0ge31cclxuXHRcdFx0XHRsZXQgaXRlbXMgPSBbXVxyXG5cdFx0XHRcdGZvcihsZXQgaWQgaW4gZGF0YXMpIHtcclxuXHRcdFx0XHRcdHZhciBkYXRhID0gZGF0YXNbaWRdXHJcblx0XHRcdFx0XHRpZiAoaXNJbkZpbHRlcihkYXRhKSkge1xyXG5cdFx0XHRcdFx0XHR2YXIgaXRlbURhdGEgPSAkLmV4dGVuZCh7J19pZCc6IGlkfSwgZGF0YSlcclxuXHRcdFx0XHRcdFx0dmFyIGVsdCA9ICQoaXRlbVRlbXBsYXRlKVxyXG5cdFx0XHRcdFx0XHR2YXIgY3R4ID0gZWx0LnByb2Nlc3NUZW1wbGF0ZShpdGVtRGF0YSlcdFx0XHRcclxuXHRcdFx0XHRcdFx0aXRlbXMucHVzaChlbHQpXHJcblx0XHRcdFx0XHRcdGRpc3BsYXllZEl0ZW1zW2lkXSA9IHtlbHQsIGN0eH1cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHRib2R5LmVtcHR5KCkuYXBwZW5kKGl0ZW1zKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmdldERhdGFzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIGRhdGFzXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuZ2V0RGlzcGxheWVkRGF0YXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgcmV0ID0ge31cclxuXHRcdFx0XHRmb3IobGV0IGkgaW4gZGlzcGxheWVkSXRlbXMpIHtcclxuXHRcdFx0XHRcdHJldFtpXSA9IGRhdGFzW2ldXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiByZXRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5vbiA9IGV2ZW50cy5vbi5iaW5kKGV2ZW50cylcclxuXHJcblxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0hlYWRlckNvbnRyb2wnLCB7XHJcblx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJ10sXHJcblx0cHJvcHM6IHtcclxuXHRcdHRpdGxlOiB7dmFsOiAnSGVsbG8gV29ybGQnfSxcclxuXHRcdHVzZXJOYW1lOiB7dmFsOiAndW5rbm93bid9XHJcblx0fSxcclxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgPlxcclxcblx0PGRpdiBjbGFzcz1cXFwiYnJhbmRcXFwiPjxoMSBjbGFzcz1cXFwiYm4teHMtaGlkZVxcXCIgYm4tdGV4dD1cXFwidGl0bGVcXFwiPjwvaDE+IDwvZGl2Plxcclxcblx0PGRpdj5cXHJcXG5cdCAgICA8aSBibi1hdHRyPVxcXCJ0aXRsZTogdGl0bGVTdGF0ZVxcXCIgY2xhc3M9XFxcImZhIGZhLWxnIGNvbm5lY3Rpb25TdGF0ZVxcXCIgYm4tY2xhc3M9XFxcImZhLWV5ZTogY29ubmVjdGVkLCBmYS1leWUtc2xhc2g6ICFjb25uZWN0ZWRcXFwiPjwvaT5cXHJcXG5cdCAgICA8aSBjbGFzcz1cXFwiZmEgZmEtdXNlciBmYS1sZ1xcXCI+PC9pPlxcclxcblx0ICAgIDxzcGFuIGJuLXRleHQ9XFxcInVzZXJOYW1lXFxcIiBjbGFzcz1cXFwidXNlck5hbWVcXFwiPjwvc3Bhbj5cXHJcXG5cdCAgICA8YSBocmVmPVxcXCIvXFxcIiB0aXRsZT1cXFwiaG9tZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWhvbWUgZmEtbGdcXFwiPjwvaT48L2E+IFxcclxcblx0PC9kaXY+XFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRjb25uZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdHRpdGxlU3RhdGU6IFwiV2ViU29ja2V0IGRpc2Nvbm5lY3RlZFwiLFxyXG5cdFx0XHRcdHRpdGxlOiBvcHRpb25zLnRpdGxlLFxyXG5cdFx0XHRcdHVzZXJOYW1lOiBvcHRpb25zLnVzZXJOYW1lXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHJcblxyXG5cdFx0Y2xpZW50LmV2ZW50cy5vbignY29ubmVjdCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0hlYWRlckNvbnRyb2xdIGNsaWVudCBjb25uZWN0ZWQnKVxyXG5cdFx0XHRjdHJsLnNldERhdGEoe2Nvbm5lY3RlZDogdHJ1ZSwgdGl0bGVTdGF0ZTogXCJXZWJTb2NrZXQgY29ubmVjdGVkXCJ9KVxyXG5cclxuXHRcdH0pXHJcblxyXG5cdFx0Y2xpZW50LmV2ZW50cy5vbignZGlzY29ubmVjdCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0hlYWRlckNvbnRyb2xdIGNsaWVudCBkaXNjb25uZWN0ZWQnKVxyXG5cdFx0XHRjdHJsLnNldERhdGEoe2Nvbm5lY3RlZDogZmFsc2UsIHRpdGxlU3RhdGU6IFwiV2ViU29ja2V0IGRpc2Nvbm5lY3RlZFwifSlcclxuXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcbn0pO1xyXG5cclxuXHJcbiIsIlxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnSW5wdXRHcm91cENvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0dmFyIGlkID0gZWx0LmNoaWxkcmVuKCdpbnB1dCcpLnVuaXF1ZUlkKCkuYXR0cignaWQnKVxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0lucHV0R3JvdXBDb250cm9sXSBpZCcsIGlkKVxyXG5cdFx0ZWx0LmNoaWxkcmVuKCdsYWJlbCcpLmF0dHIoJ2ZvcicsIGlkKVxyXG5cdH1cclxufSk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ05hdmJhckNvbnRyb2wnLCB7XHJcblxyXG5cdFx0cHJvcHM6IHtcclxuXHRcdFx0YWN0aXZlQ29sb3I6IHt2YWw6ICd3My1ncmVlbid9XHJcblx0XHR9LFxyXG5cclxuXHRcdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdFx0dmFyIGFjdGl2ZUNvbG9yID0gb3B0aW9ucy5hY3RpdmVDb2xvclxyXG5cclxuXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ1tOYXZiYXJDb250cm9sXSBvcHRpb25zJywgb3B0aW9ucylcclxuXHJcblx0XHRcdGVsdC5hZGRDbGFzcygndzMtYmFyJylcclxuXHRcdFx0ZWx0LmNoaWxkcmVuKCdhJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmFkZENsYXNzKCd3My1iYXItaXRlbSB3My1idXR0b24nKVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0JCh3aW5kb3cpLm9uKCdyb3V0ZUNoYW5nZWQnLCBmdW5jdGlvbihldnQsIG5ld1JvdXRlKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW05hdmJhckNvbnRyb2xdIHJvdXRlQ2hhbmdlJywgbmV3Um91dGUpXHJcblxyXG5cdFx0XHRcdGVsdC5jaGlsZHJlbihgYS4ke2FjdGl2ZUNvbG9yfWApLnJlbW92ZUNsYXNzKGFjdGl2ZUNvbG9yKVx0XHJcblx0XHRcdFx0ZWx0LmNoaWxkcmVuKGBhW2hyZWY9XCIjJHtuZXdSb3V0ZX1cIl1gKS5hZGRDbGFzcyhhY3RpdmVDb2xvcilcclxuXHJcblx0XHRcdH0pXHRcclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcblxyXG59KSgpO1xyXG5cclxuXHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdQaWN0dXJlQ2Fyb3VzZWxDb250cm9sJywge1xyXG5cclxuXHRwcm9wczoge1xyXG5cdFx0d2lkdGg6IHt2YWw6IDMwMH0sXHJcblx0XHRoZWlnaHQ6IHt2YWw6IDIwMH0sXHJcblx0XHRhbmltYXRlRGVsYXk6IHt2YWw6IDEwMDB9LFxyXG5cdFx0aW5kZXg6IHt2YWw6IDAsIHNldDogJ3NldEluZGV4J30sXHJcblx0XHRpbWFnZXM6IHt2YWw6IFtdLCBzZXQ6ICdzZXRJbWFnZXMnfSxcclxuXHRcdGNvbG9yOiB7dmFsOiAneWVsbG93J31cclxuXHR9LFxyXG5cclxuXHRpZmFjZTogJ3NldEltYWdlcyhpbWFnZXMpO3NldEluZGV4KGlkeCknLFxyXG5cclxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRjb25zb2xlLmxvZyhgW1BpY3R1cmVDYXJvdXNlbENvbnRyb2xdIG9wdGlvbnNgLCBvcHRpb25zKVxyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgYm4tY29udHJvbD1cXFwiQ2Fyb3VzZWxDb250cm9sXFxcIiBibi1vcHRpb25zPVxcXCJjYXJvdXNlbEN0cmxPcHRpb25zXFxcIiBibi1lYWNoPVxcXCJpIG9mIGltYWdlc1xcXCIgYm4taWZhY2U9XFxcImNhcm91c2VsQ3RybFxcXCIgYm4tZGF0YT1cXFwiaW5kZXg6IGluZGV4XFxcIj5cXHJcXG5cdDxkaXYgc3R5bGU9XFxcInRleHQtYWxpZ246IGNlbnRlcjtcXFwiIGJuLXN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOiBiYWNrQ29sb3JcXFwiPlxcclxcblx0XHQ8aW1nIGJuLWF0dHI9XFxcInNyYzogaVxcXCIgc3R5bGU9XFxcImhlaWdodDogMTAwJVxcXCI+XFxyXFxuXHQ8L2Rpdj5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdGNhcm91c2VsQ3RybE9wdGlvbnM6IG9wdGlvbnMsXHJcblx0XHRcdFx0aW1hZ2VzOiBvcHRpb25zLmltYWdlcyxcclxuXHRcdFx0XHRiYWNrQ29sb3I6IG9wdGlvbnMuY29sb3IsXHJcblx0XHRcdFx0aW5kZXg6IG9wdGlvbnMuaW5kZXhcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHJcblx0XHR0aGlzLnNldEltYWdlcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ1tQaWN0dXJlQ2Fyb3VzZWxDb250cm9sXSBzZXRJbWFnZXMnLCB2YWx1ZSlcclxuXHRcdFx0Y3RybC5zZXREYXRhKCdpbWFnZXMnLCB2YWx1ZSlcclxuXHRcdFx0Y3RybC5zY29wZS5jYXJvdXNlbEN0cmwucmVmcmVzaCgpXHRcdFx0XHJcblx0XHR9LFxyXG5cdFx0dGhpcy5zZXRJbmRleCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGN0cmwuc2V0RGF0YSgnaW5kZXgnLCB2YWx1ZSlcclxuXHRcdH1cclxuXHJcblx0fVxyXG59KTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbCgnUmFkaW9Hcm91cENvbnRyb2wnLCBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHRlbHQub24oJ2NsaWNrJywgJ2lucHV0W3R5cGU9cmFkaW9dJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ3JhZGlvZ3JvdXAgY2xpY2snKVxyXG5cdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1yYWRpb106Y2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSlcclxuXHRcdFx0JCh0aGlzKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSlcclxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0JylcclxuXHRcdH0pXHJcblx0XHRcclxuXHJcblx0XHR0aGlzLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBlbHQuZmluZCgnaW5wdXRbdHlwZT1yYWRpb106Y2hlY2tlZCcpLnZhbCgpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGVsdC5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5wcm9wKCdjaGVja2VkJywgdmFsdWUgPT09ICQodGhpcykudmFsKCkpXHJcblx0XHRcdH0pXHRcdFx0XHJcblx0XHR9XHJcblxyXG5cclxuXHR9KVxyXG5cclxuXHJcbn0pKCk7XHJcblxyXG5cclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRmdW5jdGlvbiBtYXRjaFJvdXRlKHJvdXRlLCBwYXR0ZXJuKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdtYXRjaFJvdXRlJywgcm91dGUsIHBhdHRlcm4pXHJcblx0XHR2YXIgcm91dGVTcGxpdCA9IHJvdXRlLnNwbGl0KCcvJylcclxuXHRcdHZhciBwYXR0ZXJuU3BsaXQgPSBwYXR0ZXJuLnNwbGl0KCcvJylcclxuXHRcdC8vY29uc29sZS5sb2cocm91dGVTcGxpdCwgcGF0dGVyblNwbGl0KVxyXG5cdFx0dmFyIHJldCA9IHt9XHJcblxyXG5cdFx0aWYgKHJvdXRlU3BsaXQubGVuZ3RoICE9IHBhdHRlcm5TcGxpdC5sZW5ndGgpXHJcblx0XHRcdHJldHVybiBudWxsXHJcblxyXG5cdFx0Zm9yKHZhciBpZHggPSAwOyBpZHggPCBwYXR0ZXJuU3BsaXQubGVuZ3RoOyBpZHgrKykge1xyXG5cdFx0XHR2YXIgcGF0aCA9IHBhdHRlcm5TcGxpdFtpZHhdXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ3BhdGgnLCBwYXRoKVxyXG5cdFx0XHRpZiAocGF0aC5zdWJzdHIoMCwgMSkgPT09ICc6Jykge1xyXG5cdFx0XHRcdGlmIChyb3V0ZVNwbGl0W2lkeF0ubGVuZ3RoID09PSAwKVxyXG5cdFx0XHRcdFx0cmV0dXJuIG51bGxcclxuXHRcdFx0XHRyZXRbcGF0aC5zdWJzdHIoMSldID0gcm91dGVTcGxpdFtpZHhdXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAocGF0aCAhPT0gcm91dGVTcGxpdFtpZHhdKSB7XHJcblx0XHRcdFx0cmV0dXJuIG51bGxcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmV0XHJcblx0fVxyXG5cclxuXHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnUm91dGVyQ29udHJvbCcsIHtcclxuXHJcblx0XHRwcm9wczoge1xyXG5cdFx0XHRyb3V0ZXM6IHt2YWw6IFtdfVxyXG5cdFx0fSxcclxuXHRcdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHJcblxyXG5cdFx0XHR2YXIgcm91dGVzID0gb3B0aW9ucy5yb3V0ZXNcclxuXHJcblx0XHRcdGlmICghQXJyYXkuaXNBcnJheShyb3V0ZXMpKSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKCdbUm91dGVyQ29udHJvbF0gYmFkIG9wdGlvbnMnKVxyXG5cdFx0XHRcdHJldHVyblxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gcHJvY2Vzc1JvdXRlKGluZm8pIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW1JvdXRlckNvbnRyb2xdIHByb2Nlc3NSb3V0ZScsIGluZm8pXHJcblxyXG5cdFx0XHRcdHZhciBuZXdSb3V0ZSA9IGluZm8uY3VyUm91dGVcclxuXHJcblx0XHRcdFx0Zm9yKHZhciByb3V0ZSBvZiByb3V0ZXMpIHtcclxuXHRcdFx0XHRcdHZhciBwYXJhbXMgPSBtYXRjaFJvdXRlKG5ld1JvdXRlLCByb3V0ZS5ocmVmKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgcm91dGU6ICR7cm91dGUuaHJlZn0sIHBhcmFtc2AsIHBhcmFtcylcclxuXHRcdFx0XHRcdGlmIChwYXJhbXMgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbUm91dGVyQ29udHJvbF0gcGFyYW1zJywgcGFyYW1zKVxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJvdXRlLnJlZGlyZWN0ID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdFx0bG9jYXRpb24uaHJlZiA9ICcjJyArIHJvdXRlLnJlZGlyZWN0XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIHJvdXRlLmNvbnRyb2wgPT0gJ3N0cmluZycpIHtcclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyIGN1ckN0cmwgPSBlbHQuZmluZCgnLkN1c3RvbUNvbnRyb2wnKS5pbnRlcmZhY2UoKVxyXG5cdFx0XHRcdFx0XHRcdHZhciBjYW5DaGFuZ2UgPSB0cnVlXHJcblx0XHRcdFx0XHRcdFx0aWYgKGN1ckN0cmwgJiYgdHlwZW9mIGN1ckN0cmwuY2FuQ2hhbmdlID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGNhbkNoYW5nZSA9IGN1ckN0cmwuY2FuQ2hhbmdlKClcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0aWYgKGNhbkNoYW5nZSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JCh3aW5kb3cpLnRyaWdnZXIoJ3JvdXRlQ2hhbmdlZCcsIG5ld1JvdXRlKVxyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGNvbmZpZyA9ICQuZXh0ZW5kKHskcGFyYW1zOiBwYXJhbXN9LCByb3V0ZS5vcHRpb25zKVx0XHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgaHRtbCA9ICQoYDxkaXYgYm4tY29udHJvbD1cIiR7cm91dGUuY29udHJvbH1cIiBibi1vcHRpb25zPVwiY29uZmlnXCIgY2xhc3M9XCJibi1mbGV4LWNvbCBibi1mbGV4LTFcIj48L2Rpdj5gKVxyXG5cdFx0XHRcdFx0XHRcdFx0ZWx0LmRpc3Bvc2UoKS5odG1sKGh0bWwpXHJcblx0XHRcdFx0XHRcdFx0XHRodG1sLnByb2Nlc3NVSSh7Y29uZmlnOiBjb25maWd9KVx0XHRcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0ZWxzZSBpZiAoaW5mby5wcmV2Um91dGUpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCAnJywgJyMnICsgaW5mby5wcmV2Um91dGUpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHQvL2VsdC5odG1sKGh0bWwpXHJcblxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdFx0XHR9XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblxyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHRcdFx0JCh3aW5kb3cpLm9uKCdyb3V0ZUNoYW5nZScsIGZ1bmN0aW9uKGV2LCBpbmZvKSB7XHJcblx0XHRcdFx0aWYgKCFwcm9jZXNzUm91dGUoaW5mbykpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW1JvdXRlckNvbnRyb2xdIG5vIGFjdGlvbiBkZWZpbmVkIGZvciByb3V0ZSAnJHtuZXdSb3V0ZX0nYClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblxyXG5cclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcblxyXG5cclxuIl19

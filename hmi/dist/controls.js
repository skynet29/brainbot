(function() {

	$$.registerControl('CheckGroupControl', [], function(elt, options) {


		function getValue() {
			var ret = []
			elt.find('input[type=checkbox]:checked').each(function() {
				ret.push($(this).val())
			})	
			return ret	
		}

		function setValue(value) {
			if (Array.isArray(value)) {
				elt.find('input[type=checkbox]').each(function() {
					$(this).prop('checked', value.indexOf($(this).val()) >= 0)
				})
			}		
		}

		return {
			getValue: getValue,
			setValue: setValue
		}

	})


})();



(function() {

	function polar2Cart(radius, angleDeg) {
		var angleRad = (angleDeg -90) * Math.PI/180
		return {
			x: radius * Math.cos(angleRad),
			y: radius * Math.sin(angleRad)
		}
	}



	function getArcPath(innerRadius, radius, startAngle, endAngle) {
		var p1 = polar2Cart(innerRadius, endAngle)
		var p2 = polar2Cart(innerRadius, startAngle)
		var p3 = polar2Cart(radius, startAngle)
		var p4 = polar2Cart(radius, endAngle)

		var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

		var d = [
			'M', p1.x, p1.y,
			'A', innerRadius, innerRadius, 0, largeArcFlag, 0, p2.x, p2.y,
			'L', p3.x, p3.y,
			'A', radius, radius, 0, largeArcFlag, 1, p4.x, p4.y,
			'z'


		].join(' ')


		return d

	}


	$$.registerControl('CircularMenuControl', [], function(elt, options) {

		var defaultOptions = {
			hasTrigger: true,
			triggerRadius: 20,
			triggerPos: {left: 100, top: 100},
			innerRadius: 0,
			radius: 90,
			iconPos: 60,
			iconSize: 40,
			gap: 0
		}

		var events = new EventEmitter2()

		var options = $.extend(defaultOptions, options)
		//console.log(`[CircularMenuControl] options`, options)

		if (!Array.isArray(options.menus)) {
			console.warn(`mission field 'menus' in CircularMenuControl config`)
			return
		}
		var open = false
		var fnOnInit = null

		var triggerLabel = $.extend({open: '\uf068', close:'\uf067'}, options.triggerLabel)

		var triggerRadius = options.triggerRadius
		var innerRadius = options.innerRadius
		var radius = options.radius
		var iconPos = options.iconPos
		var iconSize = options.iconSize
		var gap = options.gap

		var menus = options.menus
		if (menus.length < 3) {
			menus = menus.concat(new Array(3 - menus.length).fill({}))
		}
		//console.log('menus', menus)		

		var sectorAngle = 360 / menus.length - gap
		//console.log('sectorAngle', sectorAngle)
		var p = polar2Cart(iconPos, 0)
		var arcPath = getArcPath(innerRadius, radius, -sectorAngle/2, sectorAngle/2)
		//console.log('arcPath', arcPath)

		function getSectorTemplate(angle, info) {
			//console.log('getSectorTemplate', angle, info)
			return `
				<g class="item" data-svg-origin="0 0">
					<g transform="rotate(${angle})">
						<path d="${arcPath}" class="sector" fill="${info.fill}" stroke="black"/>			
						<g transform="translate(${p.x}, ${p.y}) rotate(${-angle})">
							<rect width="${iconSize}" height="${iconSize}" fill="none" stroke="black" x="${-iconSize/2}" y="${-iconSize/2}"/>	
							<text text-anchor="middle" alignment-baseline="middle" fill="${info.color}">${info.text}</text>			
						</g>
					</g>
				</g>
				`					
		}
		


		var sectors = menus.map(function(info, idx) {
			//console.log('config', info, idx)
			var angle = (sectorAngle + gap)  * idx
			var info = $.extend({fill: 'white', color: 'black', text: ''}, info)
			return getSectorTemplate(angle, info)
		})


		var width = triggerRadius * 2
		var height = triggerRadius * 2
		var x = triggerRadius
		var y = triggerRadius		
		var svg = 
		`
			<svg width="${width}" height="${height}" class="circularMenu" style="position: absolute; z-index: 1000000; overflow: visible; cursor: context-menu">
				<g transform="translate(${x}, ${y})">
					<g class="items" transform="rotate(0)" data-svg-origin="0 0">${sectors}</g>
					<g class="trigger" bn-if="hasTrigger">
						<circle r="${triggerRadius}" fill="red" />
						<text class="label" text-anchor="middle" alignment-baseline="middle" ">${triggerLabel.close}</text>
					</g>
					
				</g>
			</svg>	
		`

		elt.append(svg)	
		elt.processTemplate({hasTrigger: options.hasTrigger})
		//elt.css('position', 'relative')
		var svgElt = elt.find('.circularMenu')
		var items = elt.find('.items')
		var item = items.find('.item')
		var trigger = elt.find('.trigger')
		var label = trigger.find('.label')	

		TweenLite.set(item, {scale:0, visibility:"visible"})	

	    trigger.click((ev) => {
	    	//console.log('toggleMenu')
		    ev.stopPropagation()
		    if (!open) {
		    	openMenu()
		    } 
		    else {
		    	closeMenu()
		    }	    	
	    })


		items.on('click', '.item', function(ev) {
			//var action = $(this).data('action')
			var idx = item.index(this)
			//console.log('click', idx)
			events.emit('menuSelected', options.menus[idx])
		})			


		$(document).on('click', closeMenu)

		if (options.hasTrigger) {
			show(options.triggerPos.left, options.triggerPos.top)
		}

		function setOnInit(fn) {
			fnOnInit = fn
		}


		function show(x, y) {
			//console.log('show', left, top)
			var left = x - (width/2)
			var top = y - (height/2)

			svgElt.css({left: left + 'px', top: top+'px'}).show()
		}


		function showMenu(x, y) {
			show(x, y)
			openMenu()
		}


		function openMenu() {
			if (typeof fnOnInit == 'function') {
				fnOnInit()
			}

			if (!open) {
		        TweenMax.staggerTo(item, 0.7, {scale:1, ease:Elastic.easeOut}, 0.05);
		      	label.text(triggerLabel.open)
		      	open = true
	      	}
		}

		function closeMenu() {
			if (open) {
			    TweenMax.staggerTo(item, .3, {scale:0, ease:Back.easeIn}, 0.05, function() {
			    	//console.log('finished !!')
			    	if (!options.hasTrigger) {
			    		svgElt.hide()
			    		events.emit('menuClosed')
			    	}
			    });
			    label.text(triggerLabel.close)
			    open = false
			}
		}

		function select(idx) {
			items.find('.item.active').removeClass('active')
			if (idx >= 0) {
				item.eq(idx).addClass('active')
			}
		}

		return {
			showMenu: showMenu,
			on: events.on.bind(events),
			setOnInit: setOnInit,
			select: select
		}		
				

	})


})();
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

	$$.registerControl('FilteredTableControl', [], function(elt, options) {

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

		const tbody = elt.find('tbody')
		tbody.on('click', '[data-action]', function() {
			var id = $(this).closest('.item').data('id')
			var action = $(this).data('action')
			console.log('click', id, 'action', action)
			events.emit('itemAction', action, id)
		})

		function addItem(id, data) {
			var itemData = $.extend({'_id': id}, data)
			//console.log('addItem', itemData)
			var item = $$.processTemplate(itemTemplate, itemData)
			//console.log('id', item.attr('data-id'))
			if (datas[id] != undefined) {
				tbody.find(`[data-id="${id}"]`).replaceWith(item)
			}
			else if (isInFilter(data)){
				tbody.append(item)
			}
			datas[id] = data
		}

		function removeItem(id) {
			//console.log('removeItem', id)
			if (datas[id] != undefined) {
				delete datas[id]
				tbody.find(`[data-id="${id}"]`).remove()
			}			
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

		function setFilters(filters) {
			_filters = filters
			dispTable()
		}


		function dispTable() {
			
			let items = []
			for(let id in datas) {
				var data = datas[id]
				if (isInFilter(data)) {
					var itemData = $.extend({'_id': id}, data)			
					items.push($$.processTemplate(itemTemplate, itemData))
				}

			}
			
			
			tbody.empty().append(items)
		}

		function getDatas() {
			return datas
		}

		return {
			addItem: addItem,
			removeItem: removeItem,
			on: events.on.bind(events),
			setFilters: setFilters,
			getDatas: getDatas
		}
	})

})();

(function() {
	
	function getTemplate(title) {
		return `
	        <div class="brand"><h1 class="bn-xs-hide">${title}</h1> </div>
	        <div>
	            <i bn-attr="title: title" class="fa fa-lg connectionState" bn-class="fa-eye: connected, fa-eye-slash: !connected"></i>
	            <i class="fa fa-user fa-lg"></i>
	            <span class="userName"></span>
	            <a href="/" title="home"><i class="fa fa-home fa-lg"></i></a> 
	        </div>
		`
	}


	$$.registerControl('HeaderControl', ['HttpService', 'WebSocketService'], function(elt, options, http, client) {
		options = $.extend({title: 'Hello World'}, options)
		elt.append(getTemplate(options.title))
		elt.processTemplate({connected: false, title: "WebSocket disconnected"})

		client.onEvent('connected', function() {
			//console.log('[HeaderControl] client connected')
			elt.processTemplate({connected: true, title: "WebSocket connected"})

		})

		client.onEvent('disconnected', function() {
			//console.log('[HeaderControl] client disconnected')
			elt.processTemplate({connected: false, title: "WebSocket disconnected"})

		})

		var userElt = elt.find('.userName')

		http.get('/api/user').then(function(data) {
			userElt.text(data.user)

		})
	})
})();

(function() {

	function getTemplate() {
		return `
			<div class="scrollPanel">
	            <table class="w3-table-all w3-small">
	                <thead>
	                    <tr class="w3-green">
	                        <th>Agent Name</th>
	                        <th>Host Name</th>
	                        <th>State</th>
	                        <th>Pid</th>
	                        <th>Action</th>
	                    </tr>
	                </thead>
	                <tbody></tbody>
	            </table>
            </div>
		`
	}


	const itemTemplate = `
			<tr>
				<td bn-text="agent"></td>
				<td bn-text="host"></td>
				<td bn-text="state"></td>
				<td bn-text="pid"></td>
				<td bn-attr="data-agent: agent">
					<button class="actionStart w3-btn w3-blue" bn-if="start">Start</button>
					<button class="actionStop w3-btn w3-blue"  bn-if="!start">Stop</button>
					<button class="actionStopForce w3-btn w3-red" bn-if="!start">Kill</button>
				</td>
			</tr>
		`

	$$.registerControl('MasterAgentsControl', ['WebSocketService'], function(elt, options, client) {

		elt.append(getTemplate())
		elt.addClass('bn-flex-col')

		var tbody = elt.find('tbody')

		tbody.on('click', '.actionStart', function(ev) {
			var agent = $(this).closest('[data-agent]').data('agent')
			console.log('actionStart', agent)
			client.emit('launcherStartAgent', agent)

		})
		tbody.on('click', '.actionStop', function(ev) {
			var agent = $(this).closest('[data-agent]').data('agent')
			console.log('actionStop', agent)
			client.emit('launcherStopAgent', agent)

		})		
		tbody.on('click', '.actionStopForce', function(ev) {
			var agent = $(this).closest('[data-agent]').data('agent')
			console.log('actionStopForce', agent)
			client.emit('launcherStopAgent', {agent: agent, force: true})

		})

		let hosts = {}

		function dispTable() {
			tbody.empty()
			for(var hostName in hosts) {
				var agents = hosts[hostName]
				var data = $$.obj2Array(agents).map(function(item) {
					var pid = item.value.pid
					return {
						pid: pid,
						agent: item.key,
						state: item.value.state,
						start: pid == 0,
						host: hostName
					}

				})

				tbody.append($$.processTemplateArray(itemTemplate, data))				
			}
		}

		function onLauncherStatus(msg) {
			var hostName = msg.topic.split('.')[1]
			//console.log('host', hostName)
			hosts[hostName] = msg.data
			dispTable()
		}

		client.register('launcherStatus.*', true, onLauncherStatus)

		return {
			dispose: function() {
				client.unregister('launcherStatus.*', onLauncherStatus)
			}
		}


	})

})();

(function() {

	function getTemplate() {
		return `
			<div class="scrollPanel">
	            <table class="w3-table-all w3-small">
	                <thead>
	                    <tr class="w3-green">
	                        <th>Name</th>
	                        <th>Registered Topics</th>
	                    </tr>
	                </thead>
	                <tbody></tbody>
	            </table>
            </div>
		`
	}

	function getItemTemplate(name, topics) {
		return `
			<tr>
				<td>${name}</td>
				<td>${topics}</td>
			</tr>
		`
	}

	$$.registerControl('MasterClientsControl', ['WebSocketService'], function(elt, options, client) {

		elt.append(getTemplate())

		var tbody = elt.find('tbody')

		function onMasterClients(msg) {
			tbody.empty()
			const data = msg.data
			let agents = Object.keys(data).sort()

			agents.forEach(function(agent) {

				const topics = data[agent].join('<br>')
				tbody.append(getItemTemplate(agent, topics))

			})			
		}

		client.register('masterClients', true, onMasterClients)

		return {
			dispose: function() {
				console.log('[MasterClientsControl] dispose')
				client.unregister('masterClients', onMasterClients)
			}
		}

	})



})();

(function() {

	function getTemplate() {
		return `
			<div class="bn-flex-row bn-space-between">
				<div class="bn-container filters">
					<input type="text" class="topicFilter" placeholder="Filter topic" data-filter="topic">
					<input type="text" class="topicFilter" placeholder="Filter source" data-filter="src">					
				</div>
				<div>Messages Number:<span class="nbMsg"></span></div>
			</div>
			<div class="bn-container">
				<input type="checkbox" class="w3-check dataVisible" ><label> Show Data</label>
			</div>
	
			<div data-control="FilteredTableControl" data-options="$tableConfig" class="bn-flex-1 bn-no-overflow">

		`
	}





	$$.registerControl('MasterHistControl', ['WebSocketService'], function(elt, options, client) {

		elt.append(getTemplate())
		elt.addClass('bn-flex-col')
		elt.processUI({
			tableConfig: {
				columns: {
					'topic': 'Topic',
					'src': 'Source',
					'lastModif': 'Last Modified',
					'data': 'Data'
				}
			}
		})

		const iface = elt.find('.FilteredTableControl').interface()

		let filters = {}

		var tbody = elt.find('tbody')

		var dataVisible = false

		elt.find('.dataVisible').on('click', function() {
			dataVisible = $(this).prop('checked')
			tbody.find('td[bn-html=data] > pre').bnVisible(dataVisible)
		})
		.prop('checked', dataVisible)

		function updateTopicNumber() {
			elt.find('.nbMsg').text(tbody.find('tr').length)
		}


		elt.find('.filters input').on('input', function(){
			var filter = $(this).data('filter')
			filters[filter] = $(this).val()
			iface.setFilters(filters)
			updateTopicNumber()
			tbody.find('td[bn-html=data] > pre').bnVisible(dataVisible)
		})


		function onMessage(msg) {
			iface.addItem(msg.topic, getItemData(msg))
			updateTopicNumber()			
		}

		client.register('**', true, onMessage)

		function getItemData(msg) {
			var data = $$.processTemplate(
				`<pre bn-prop="hidden: hidden" class="bn-no-margin">${JSON.stringify(msg.data, null, 4)}</pre>`,
				{hidden: !dataVisible})

			return {
				topic: msg.topic,
				src: msg.src,
				lastModif: new Date(msg.time).toLocaleString(),
				data: data			
			}
		}

		return {
			dispose: function() {
				client.unregister('**', onMessage)
			}
		}



	})

})();






(function() {

	$$.registerControl('NavbarControl', [], function(elt, options) {

		var activeColor = options.activeColor || 'w3-green'
		console.log('[NavbarControl] activeColor', activeColor)

		elt.addClass('w3-bar')
		elt.children('a').each(function() {
			$(this).addClass('w3-bar-item w3-button')
		})

		$(window).on('routeChange', function(evt, newRoute) {
			//console.log('routeChange')

			elt.children(`a.${activeColor}`).removeClass(activeColor)	
			elt.children(`a[href="#${newRoute}"]`).addClass(activeColor)

		})	

	})


})();



(function() {

	$$.registerControl('RadioGroupControl', [], function(elt, options) {

		elt.on('click', 'input[type=radio]', function() {
			//console.log('radiogroup click')
			elt.find('input[type=radio]:checked').prop('checked', false)
			$(this).prop('checked', true)
		})
		

		function getValue() {
			return elt.find('input[type=radio]:checked').val()
		}

		function setValue(value) {
			elt.find('input[type=radio]').each(function() {
				$(this).prop('checked', value === $(this).val())
			})			
		}

		return {
			getValue: getValue,
			setValue: setValue
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




	$$.registerControl('RouterControl', [], function(elt, routes) {
		if (!Array.isArray(routes)) {
			console.warn('[RouterControl] bad options')
			return
		}


		function processRoute(newRoute) {
			//console.log('[RouterControl] processRoute', newRoute)

			for(var route of routes) {
				var params = matchRoute(newRoute, route.href)
				//console.log(`route: ${route.href}, params`, params)
				if (params != null) {
					console.log('[RouterControl] params', params)
					if (typeof route.redirect == 'string') {
						location.href = '#' + route.redirect
					}
					else if (typeof route.control == 'string') {
						var config = $.extend({$params: params}, route.options)	
						var html = `<div data-control="${route.control}" data-options="$config" style="overflow: hidden; flex: 1"></div>`
						elt.dispose().html(html).processUI({config: config})

					}
					return true
				}	
			}
			return false

		}		

		$(window).on('routeChange', function(ev, newRoute) {
			if (!processRoute(newRoute)) {
				console.warn(`[RouterControl] no action defined for route '${newRoute}'`)
			}
		})


	})


})();



(function() {

	function getTemplate() {
		return `
			<div class="main">

				<h2>User Details</h2>
				<table class="info w3-table w3-border">
					<tr>
						<td>User</td>
						<td><strong class="user">Unknown</strong></td>
					</tr>
					<tr>
						<td>Password</td>
						<td><input class="pwd w3-input w3-border" type="text"></td>
					</tr>
				</table>				

				<div class="scrollPanel">
					<table class="apps w3-table-all w3-small">
						<thead>
							<tr class="w3-green">
								<th>App Name</th>
								<th>Allowed</th>
								<th>Configuration</th>			
							</tr>

						</thead>
						<tbody></tbody>
					</table>
				</div>
				<p><button class="apply w3-btn w3-blue">Apply changes</button></p>
			</div>

		`
	}

	var  itemTemplate = `
		<tr>
			<td bn-text="appName" class="name"></td>
			<td><input class="check" type="checkbox" bn-prop="checked: allowed"></td>
			<td><select class="config  w3-border bn-fill" bn-options="configs" bn-val="selConfig"></select></td>
		</tr>
	`


	$$.registerControl('UserDetailsControl', ['HttpService'], function(elt, options, http) {
		elt.append(getTemplate())

		var mainElt = elt.find('.main').hide()
		var tbody = elt.find('.apps tbody')
		var userElt = elt.find('.user')
		var pwdElt = elt.find('.pwd')
		var user
		var _apps = []

		elt.find('.apply').on('click', function() {
			console.log('Apply', getInfos())
			http.put(`/api/users/${user}`, getInfos()).then(() => {
				$(this).notify('Config saved successfully', {position: 'right top', className: 'success'})
			})
		})

		http.get('/api/apps').then(function(apps) {
			_apps = apps

		})

		function setUser(id) {
			console.log('[UserDetailsControl] setUser', id)
			user = id
			userElt.text(id)
			getUserDetails(id)
			mainElt.show()	
		}

		function getInfos() {
			var allowedApps = {}
			tbody.find('tr').each(function() {
				var agent = $(this).find('.name').text()
				var allowed = $(this).find('.check').prop('checked')
				var config = $(this).find('.config').val()
				if (allowed) {
					allowedApps[agent] = (config == 'none') ? true : config
				}
			})
			return {
				pwd: pwdElt.val(),
				allowedApps: allowedApps
			}
		}

		function getUserDetails(user) {
			http.get(`/api/users/${user}`).then(function(userDetails) {

				pwdElt.val(userDetails.pwd)

				var allowedApps = userDetails.allowedApps

				var appsInfo = $$.obj2Array(_apps).map(function(item) {
					var appName = item.key

					var config = allowedApps[appName]

					return {
						appName: appName,
						allowed: (config != undefined),
						selConfig: (typeof config == 'string') ? config : 'none',
						configs: ['none'].concat(item.value)
					}
				})	
							

				tbody
				.empty()
				.append($$.processTemplateArray(itemTemplate, appsInfo))
			})			
		}



		return {
			setUser: setUser,
			getUser: function() {
				return user
			},
			hide: function() {
				mainElt.hide()
			}
		}

	})

})();

(function() {

	function getTemplate() {
		return `
			<h2>Registered Users</h2>
			<div class="scrollPanel">
				<ul class="w3-ul w3-border w3-white"></ul>
			</div>
			
			<p>
				<form>
					<input type="text" placeholder="username" name="userName" required autocomplete="off" class="w3-input w3-border">
					<button type="submit" class="w3-btn w3-blue w3-bar-item w3-right">Add</button>			

				</form>
			</p>
		`
	}


/*			<tr class="item">
				<td>
					<a href="#">${item}</a>
				</td>
				<td class="action">
					<button class="delete" title="delete"><i class="fa fa-trash"></i></button>
				</td>
			
			</tr>*/

	function getItemTemplate(item) {
		return `
			<li class="w3-bar item">
				<span class="w3-button w3-right delete" title="Delete"><i class="fa fa-trash"></i></span>
				<div class="w3-bar-item">
					<a href="#">${item}</a>
				</div>
			</li>

		`
	}

	$$.registerControl('UsersControl', ['HttpService'], function(elt, options, http) {
		elt.append(getTemplate())

		var list = elt.find('ul')
		list.on('click', '.item a', function(ev) {
			ev.preventDefault()
			var user = $(this).text()
			elt.trigger('userSelected', user)
		})

		list.on('click', '.delete', function(ev) {
			var user = $(this).closest('.item').find('a').text()
			console.log('delete', user)
			$$.showConfirm('Are your sure ?', 'Information', function() {
				http.delete(`/api/users/${user}`).then(function() {
					loadUsers()
					elt.trigger('userDeleted', user)
				})				
			})

		})


		elt.find('form').on('submit', function(ev) {
			ev.preventDefault()
			var data = $(this).getFormData()
			$(this).get(0).reset()
			console.log('submit', data)
			http.post('/api/users', data).then(loadUsers)
		})

		function loadUsers() {
			http.get('/api/users').then(function(users) {
				list
				.empty()
				.append(users.map(getItemTemplate))
			})			
		}

		loadUsers()

	})

})();

(function() {


	function getTemplate() {
		return `
			<div class="scrollPanel">
	            <table class="w3-table-all w3-small">
	                <thead>
	                    <tr class="w3-green">
	                        <th>Name</th>
	                        <th>Layer</th>
	                        <th>Source</th>
	                        <th>Last Modified</th>
	                        <th>Speed</th>
	                        <th>Heading</th>
	                        <th>Latitude</th>
	                        <th>Longitude</th>
	                        <th>Action</th>
	                    </tr>
	                </thead>
	                <tbody>
	                    
	                </tbody>
	            </table> 
            </div>
		`
	}	

	function getItemTemplate(item) {
		return `
            <tr class="bn-middle">
                <td>${item.name}</td>
                <td>${item.layer}</td>
                <td>${item.src}</td>
                <td>${item.lastModif}</td>
                <td>${item.speed}</td>
                <td>${item.heading}</td>
                <td>${item.lat}</td>
                <td>${item.lng}</td>
                <td>
                	<button class="delete w3-button" data-id="${item.id}" title="Delete"><i class="fa fa-trash"></i></button>
                </td>
            </tr>		
		`
	}

	$$.registerControl('TacticAisControl', ['WebSocketService'], function(elt, options, client) {
		elt.append(getTemplate())

		var tbody = elt.find('tbody')
		var vehicules = {}

		tbody.on('click', '.delete', function(ev) {
			var shapeId = $(this).data('id')
			client.emit('tacticViewAisReport.' + shapeId)

		})

		function onTacticViewAisReport(msg) {
			let id = msg.id

			if (msg.data == undefined) {
				if (vehicules[id] != undefined) {
					delete vehicules[id]
				}
			}
			else {
				vehicules[id] = msg
			}
			dispTable()			
		}

		client.register('tacticViewAisReport.*.*', true, onTacticViewAisReport)

		function getInfo(id) {
			var tokens = id.split('.')
			return {
				layer: tokens[0],
				id: tokens[1]
			}
		}


		function dispTable() {
			tbody.empty()
			for(let shapeId in vehicules) {

				const info = getInfo(shapeId)
				var msg = vehicules[shapeId]
				var data = msg.data

				tbody.append(getItemTemplate({
					name: info.id,
					layer: info.layer,
					src: msg.src,
					lastModif: new Date(msg.time).toLocaleString(),
					speed: data.speed || '',
					heading: data.heading || '',
					lat: data.latlng.lat.toFixed(5),
					lng: data.latlng.lng.toFixed(5),
					id: shapeId
				}))

			}
		}	

		return {
			dispose: function() {
				client.unregister('tacticViewAisReport.*.*', onTacticViewAisReport)
			}
		}	
	})

})();




(function() {

	function getTemplate() {
		return `
			<div class="header">
				<div class="bn-flex-row bn-space-between bn-container">
					<div class="filters">
						<input type="text" autofocus placeholder="Filter name" data-filter="name">
						<input type="text" placeholder="Filter layer" data-filter="layer">
					</div>
					<div>Number of shapes: <span class="nbMsg">0</span></div>
				</div>		
				<div class="bn-flex-row bn-space-between bn-container">
					<button class="removeAll w3-btn w3-blue">Remove all shapes</button>
					<div>
						<input type="checkbox" class="w3-check dataVisible"><label> Show Data</label>
					</div>
				</div>
			</div>
			<div data-control="FilteredTableControl" data-options="$tableConfig" class="bn-flex-1 bn-no-overflow"></div>
		`
	}



	$$.registerControl('TacticShapesControl', ['WebSocketService'], function(elt, options, client) {
		elt.append(getTemplate())
		elt.addClass("bn-flex-col")
	

		elt.find('.removeAll').click(function() {
			for(let shapeId in iface.getDatas()) {
				client.emit('tacticViewAddShape.' + shapeId)
			}
			//shapes = {}
			
		})		

		var dataVisible = false


		elt.find('.dataVisible').click(function() {	
			console.log('hideData')
			dataVisible = $(this).prop('checked')
			tbody.find('td[bn-html=data] > pre').bnVisible(dataVisible)

		})
		.prop('checked', dataVisible)	

		elt.processUI({
			tableConfig: {
				columns: {
					name: 'Name',
					layer: 'Layer',
					shapeType: 'Shape Type',
					src: 'Source',
					data: 'Data',
					lastModif: 'Last Modified'
				},
				actions: {
					'delete': 'fa fa-trash'
				}
			}
		})

		var iface = elt.find('.FilteredTableControl').interface()
		var filters = {}
		elt.find('.filters input').on('input', function() {
			var field = $(this).data('filter')
			console.log('field', field)
			filters[field] = $(this).val()
			iface.setFilters(filters)
			updateShapeNumber()
			tbody.find('td[bn-html=data] > pre').bnVisible(dataVisible)
		})


		var tbody = elt.find('.FilteredTableControl tbody')

		function updateShapeNumber() {
			elt.find('.nbMsg').text(tbody.find('tr').length)
		}


		function getItemData(msg) {
			var tokens = msg.id.split('.')
			var layer = tokens[0]
			var id = tokens[1]
			var data = $$.processTemplate(
				`<pre bn-prop="hidden: hidden" class="bn-no-margin">${JSON.stringify(msg.data, null, 4)}</pre>`,
				{hidden: !dataVisible})
			return {
				name: id,
				layer: layer,
				shapeType: msg.data.shape,
				src: msg.src,
				lastModif: new Date(msg.time).toLocaleString(),
				data: data
			}
		}


		iface.on('itemAction', function(action, id) {
			console.log('itemAction', id, action)
			client.emit('tacticViewAddShape.' + id)
		})


		function onTacticViewAddShape(msg) {
			if (msg.data == undefined) {
				iface.removeItem(msg.id)
			}
			else {
				iface.addItem(msg.id, getItemData(msg))
			}	
			updateShapeNumber()	
		}

		client.register('tacticViewAddShape.*.*', true, onTacticViewAddShape)



		return {
			dispose: function() {
				client.unregister('tacticViewAddShape.*.*', onTacticViewAddShape)
			}
		}

	})

})();

(function() {

	let plugins = {}
	 
	let icons = {}
	let shapes = {}


	function isObject(o) {
		return (typeof o == 'object' && !Array.isArray(o))
	}

	$$.registerTacticPlugin = function(name, arg1, arg2) {
		var deps = []
		var fn = arg1
		if (Array.isArray(arg1)) {
			deps = arg1
			fn = arg2
		}

		if (typeof name != 'string' || typeof fn != 'function') {
			console.warn('[TacticViewControl] registerTacticPlugin called with bad arguments')
			return
		} 

		console.log(`[TacticViewControl] register plugin '${name}' with deps`, deps)
		plugins[name] = {deps: deps, fn: fn}		
	}

	$$.registerIconMarker = function(name, func) {
		if (typeof name != 'string' || typeof func != 'function') {
			console.warn('[TacticViewControl] registerIconMarker called with bad arguments')
			return
		} 

		console.log(`[TacticViewControl] register icon '${name}'`)

		icons[name] = func
	}


	$$.registerShape = function(name, func) {
		if (typeof name != 'string' || typeof func != 'function') {
			console.warn('[TacticViewControl] registerShape called with bad arguments')
			return
		} 

		console.log(`[TacticViewControl] register shape '${name}'`)

		shapes[name] = func
	}






	function getTemplate() {
		return `
			<div class="map"></div>
		`
	}


	$$.registerControl('TacticViewControl', ['WebSocketService'], function(elt, options, client) {
		var map
		var actions = new EventEmitter2()
		var events = new EventEmitter2()
		var pluginsInstance = {}
		var lastZoom
		var defaultIcon =  new L.Icon.Default;

		var layers = {}
		var ctx = {
			client: client,
			elt: elt,
			actions: actions,
			events: events,
			layers: layers,
			findObject: findObject,
			findOwnerLayer: findOwnerLayer,
			processMenuItemConfig: processMenuItemConfig,
			addPanel: addPanel,
			disableHandlers: disableHandlers,
			enableHandlers: enableHandlers,
			getIconMarker: getIconMarker,
			addShape: addShape,
			updateShapeView: updateShapeView,
			updateShapeModel: updateShapeModel,
			getShapeData: getShapeData,
			reset: reset
		}

		elt.append(getTemplate())

		function getIconMarker(name, data) {
			//console.log('[TacticViewControl] getIconMarker', name, data)
			if (typeof name == 'string') {
				var f = icons[name]
				if (typeof f == 'function') {
					var icon = f(data)
					if (icon instanceof L.Icon) {
						return icon
					}
					else {
						console.warn(`icon of type '${name}' doee not return an Icon object`)
						return defaultIcon
					}				
				}			
			}

			return defaultIcon
		}		

		function reset() {
			console.log('[TacticViewControl] reset')

			for(var layerName in layers) {
				layers[layerName].clearLayers()
			}
		}

		function getShapeDesc(name) {
			var shape = shapes[name]
			if (typeof shape == 'function') {
				shape = shapes[name] = shape(ctx)				
			}
			return shape
		}		

		function addPanel(className) {
			console.log('[TacticViewControl] addPanel', className)
			var panel = $('<div>').addClass(className)
			elt.append(panel)
			map.invalidateSize() // force map width update
			return panel
		}

		function handleLayersVisibility() {
			var zoom = map.getZoom()
			for(var layerName in layers) {
				handleLayerVisibility(zoom, layers[layerName])
			}
			lastZoom = zoom
		}

		function handleLayerVisibility(zoom, layer) {
			var minZoom = layer.minZoom
			//console.log('[TacticViewControl] handleLayerVisibility', layer.fullId, minZoom)
			if (typeof minZoom != 'number') {
				return
			}

			if (zoom < minZoom && lastZoom >= minZoom) {
				map.removeLayer(layer)				
			}
			else if (zoom >= minZoom && lastZoom < minZoom) {
				map.addLayer(layer)				
			}
		}

		function reOrderLayers() {
			//console.log('reOrderLayers')
			for(var layerName in layers) {
				var layer = layers[layerName]
				if (map.hasLayer(layer)) {
					layer.bringToFront() // call only when layer is added to map
				}				
			}
		}

		function onZoomStart() {
			client.suspend()

		}

		function onZoomEnd() {
			client.resume()
			handleLayersVisibility()
			sessionStorage.setItem('zoom', map.getZoom())
		}

		function onOverlayAdd() {
			reOrderLayers()
		}

		function configure(config) {
			//console.log('configure', config)
			let mapConfig = config.map

			if (isObject(mapConfig)) {

				let contextmenuConfig = config.contextmenuItems

				if (Array.isArray(contextmenuConfig)) {
					mapConfig.contextmenu = true
					mapConfig.contextmenuItems = processMenuItemConfig(contextmenuConfig)
				}				

				mapConfig.closePopupOnClick = false

				console.log('[TacticViewControl] add map')
				var zoom = sessionStorage.getItem('zoom')
				if (zoom) {
					mapConfig.zoom = zoom
				}	
				var center = sessionStorage.getItem('center')	
				if (center) {
					mapConfig.center = JSON.parse(center)
				}		
				map = L.map(elt.find('.map').get(0), mapConfig)

				ctx.map = map
				lastZoom = map.getZoom()

				map.on('zoomstart', onZoomStart)
				map.on('zoomend', onZoomEnd)
				map.on('overlayadd', onOverlayAdd)
				map.on('movestart', function() {
					//console.log('movestart')
					client.resume()
				})
				map.on('moveend', function() {
					sessionStorage.setItem('center', JSON.stringify(map.getCenter()))
				})

			}

			configureTileLayer(config.tileLayer)
	
			configureControls(config.controls)
		
			configurePlugins(config.plugins)
					

		}

		function processMenuItemConfig(contextmenuConfig) {
			let config = [].concat(contextmenuConfig)
			config.forEach((item) => {
				let topic = item.topic
				if (typeof topic == 'string') {
					item.callback = (ev) => {
						//console.log('callback', topic)
						client.emit(topic, ev.relatedTarget || ev.latlng)
					}
					delete item.topic
				}

				let action = item.action
				if (typeof action == 'string') {
					item.callback = (ev) => {
						actions.emit(action, ev.relatedTarget || ev.latlng)
					}
					delete item.action
				}
			})
			return config
		}

		function configureTileLayer(tileLayerConfig) {
			if (isObject(tileLayerConfig) ) {
				let urlTemplate = tileLayerConfig.urlTemplate
				if (typeof urlTemplate != 'string') {
					console.warn('[TacticViewControl] missing urlTemplate in tileLayer config')
				}
				else {
					console.log('[TacticViewControl] add tileLayer')
					L.tileLayer(urlTemplate, tileLayerConfig).addTo(map)					
				}
			}			
		}

		function configureControls(controlsConfig) {
			if (isObject(controlsConfig) ) {
				let scaleConfig = controlsConfig.scale

				if (isObject(scaleConfig)) {
					console.log('[TacticViewControl] add scale control')
					L.control.scale(scaleConfig).addTo(map)
				}

				let coordinatesConfig = controlsConfig.coordinates
				if (isObject(coordinatesConfig)) {
					console.log('[TacticViewControl] add coordinates control')
					L.control.coordinates(coordinatesConfig).addTo(map)
				}

				configureLayers(controlsConfig.layers)
				
			}			
		}

		function configureLayers(layersConfig) {
			if (isObject(layersConfig)) {
				let conf = {}
				for(let layerName in layersConfig) {
					var layerConfig = layersConfig[layerName]
					var minZoom = layerConfig.minZoom

					let layer = new L.FeatureGroup()
					layer.minZoom = minZoom
					layer.fullId = layerName
					
					layers[layerName] = layer
					console.log(`[TacticViewControl] add layer '${layerName}'`)

					let label = layerConfig.label
					let visible = layerConfig.visible
					if (typeof minZoom == 'number') {
						if (lastZoom >= minZoom) {
							map.addLayer(layer)
						}
					}
					else {
						if (visible === true) {
							map.addLayer(layer)
						}
						if (typeof label == 'string') {
							conf[label] = layer
						}						
					}
					
				}

				if (Object.keys(conf).length != 0) {
					L.control.layers({}, conf).addTo(map)
				}
				

			}			
		}

		function configurePlugins(pluginsConfig) {
			if (isObject(pluginsConfig)) {
				for(let pluginsName in pluginsConfig) {
					let pluginDesc = plugins[pluginsName]
					if (typeof pluginDesc != 'object') {
						console.warn(`[TacticViewControl] plugin '${pluginsName}' is not registered`)
					}									
					else {
						console.log(`[TacticViewControl] init plugin '${pluginsName}'`)
						var deps = $$.getServices(pluginDesc.deps)
						var options = pluginsConfig[pluginsName]

						var args = [ctx, options].concat(deps)
						
						console.log(`[TacticViewControl] options`, options)
						console.log(`[TacticViewControl] deps`, deps)
						var exportedInterface = pluginDesc.fn.apply(null, args)
						//console.log(`[TacticViewControl] exportedInterface`, exportedInterface)
						pluginsInstance[pluginsName] = exportedInterface
						
					}					
				}

			}			
		}

		function findObject(layer, id) {
			//console.log('findObject', id)
			var ret = null

			layer.eachLayer((layer) => {
				if (layer.fullId == id) {
					ret = layer
				}
			})	
			return ret
		}

		function findOwnerLayer(id) {
			var layerName = id.split('.')[0]
			return layers[layerName]
		}


		function onObjectClicked() {
			//console.log('click', this.fullId)
			client.resume()
			events.emit('objectClicked', this)
		}

		function onObjectContextMenu() {
			//console.log('contextmenu', this.fullId)

			client.resume()
			events.emit('objectContextMenu', this)
		}


		function addShape(data) {
			var ret = null
			var desc = getShapeDesc(data.shape)
			if (typeof desc == 'object' && typeof desc.create == 'function') {
				ret = desc.create(data)
				if (ret != null) {
					ret.userData = data
					ret.on('mousedown', function() {
						client.suspend()
					})
					ret.on('click', onObjectClicked)
					ret.on('contextmenu', onObjectContextMenu)
				}
			}
			return ret
		}

		function updateShapeView(layer) {
			var desc = getShapeDesc(layer.userData.shape)
			if (typeof desc == 'object' && typeof desc.update == 'function') {
				desc.update(layer, layer.userData)
			}
		}

		function updateShapeModel(layer) {
			var desc = getShapeDesc(layer.userData.shape)
			var data = {}
			if (typeof desc == 'object' && typeof desc.getData == 'function') {
				desc.getData(layer, data)
			}
			$.extend(layer.userData, data)
		}


		function getShapeData(layer, type) {

			var desc = getShapeDesc(type)
			var data = {shape: type}
			if (typeof desc == 'object' && typeof desc.getData == 'function') {
				desc.getData(layer, data)
			}
			return data
		}


		function disableHandlers() {
			map._handlers.forEach(function(handler) {
				handler.disable()
			})			
		}

		function enableHandlers() {
			map._handlers.forEach(function(handler) {
				handler.enable()
			})			
		}

		configure(options || {})

		return {
			dispose: function() {
				console.log('[TacticViewControl] dispose', pluginsInstance)
				for(var k in pluginsInstance) {
					var i = pluginsInstance[k]
					if (typeof i == 'object' && typeof i.dispose == 'function') {
						i.dispose()
					}
				}
			}
		}
	})

})();


(function() {
	$$.registerIconMarker('ais', function(data) {

		var color = data.color || 'green'

		var template =  `
			<svg width="40" height="40" style="border: 1px solid back;">
				<g transform="translate(20, 20)" stroke="${color}" fill="${color}">
					<circle r="3"></circle>
					<rect x="-7" y="-7" width="15" height="15" fill=${color} fill-opacity="0.3"></rect>
					<line y2="-30"></line>
				</g>
			</svg>
		`

		return L.divIcon({
			className: 'aisMarker',
			iconSize: [40, 40],
			iconAnchor: [20, 20],
			html: template
		})		
	})

})();
(function() {

	$$.registerIconMarker('font', function(data) {

		var data = $.extend({
			className: 'fa fa-home',
			fontSize: 10,
			color: 'green'
		}, data)

		var fontSize = data.fontSize

		var template = `
			<i class="${data.className}" style="color: ${data.color}; font-size: ${fontSize}px"></i>
		`
		return L.divIcon({
			className: 'fontMarker',
			iconSize: [fontSize, fontSize],
			iconAnchor: [fontSize/2, fontSize/2],
			html: template
		})		
	})

})();

(function(){


	$$.registerTacticPlugin('CenterMap', function(tacticView, options) {

		let centerVeh = null

		tacticView.actions.on('centerMap', (pos) => {
			console.log('centerMap', pos)
			tacticView.map.panTo(pos)
			centerVeh = null
		})

		tacticView.actions.on('centerOnVehicule', (marker) => {
			console.log('centerOnVehicule', marker.fullId)
			tacticView.map.panTo(marker.getLatLng())
			centerVeh = marker.fullId
		})
		
		tacticView.events.on('objectUpdated', (obj) => {
			//console.log('aisReport', msg)

		})			
	})
	
	
})();
(function () {

	function getTemplate() {
		return `
		<div class="menu" data-control="CircularMenuControl" data-options="$config"></div>
		`
	}

	$$.registerTacticPlugin('CircularMenu', function(tacticView, options) {
		//console.log('CircularMenu', tacticView)
		var ctrl = $(getTemplate())
		var controlContainer = tacticView.elt.find('.leaflet-control-container')
		controlContainer.append(ctrl)
		controlContainer.processUI({config: options})
		var ctrlIf = ctrl.interface()

		//console.log('[CircularMenu] ctrlIf', ctrlIf)
		ctrlIf.on('menuSelected', function(item) {
			//console.log('menuSelected', item)
			if (item && typeof item.action == 'string') {
				tacticView.actions.emit(item.action)
			}
			
		})

	})
})();

(function () {

	function getTemplate() {
		return `
		<div class="menu" data-control="CircularMenuControl" data-options="$config"></div>
		`
	}

	$$.registerTacticPlugin('ObjectCircularMenu', function(tacticView, options) {
		//console.log('CircularMenu', tacticView)
		var ctrl = $(getTemplate())
		options.hasTrigger = false

		var controlContainer = tacticView.elt.find('.leaflet-control-container')
		controlContainer.append(ctrl)
		controlContainer.processUI({config: options})

		//var ctrl = controlContainer.find('.CircularMenuControl')

		var ctrlIf = ctrl.interface()
		var selObj
		//console.log('circularCtrl', circularCtrl)

		tacticView.events.on('objectContextMenu', function(obj) {
			selObj = obj
			if (obj instanceof L.CircleMarker) {

				var color = selObj.options.color
				//console.log('onInit', color)
				var idx = options.menus.findIndex(function(menu) {
					return menu.color == color
				})
				//console.log('idx', idx)
				ctrlIf.select(idx)

				var pos = obj.getLatLng()
				//console.log('pos', pos)
				var pt = tacticView.map.latLngToContainerPoint(pos)
				//console.log('pt', pt)	
				ctrlIf.showMenu(pt.x, pt.y)
				tacticView.disableHandlers()				
			}


		})

		ctrlIf.on('menuClosed', function() {
			//console.log('menuClosed')
			tacticView.enableHandlers()
		})

		ctrlIf.on('menuSelected', function(menuInfo) {
			console.log('menuSelected', menuInfo, selObj.fullId, selObj.privateData)

			selObj.userData.options.color = menuInfo.color


			tacticView.client.sendTo(selObj.creator, 'tacticViewShapeEdited', selObj.userData)

			
		})

	})
})();

(function(){


	$$.registerTacticPlugin('PanelInfo', function(tacticView, options) {
		var panelInfo = tacticView.addPanel('panelInfo')
		var map = tacticView.map

		var selMarker = null

		function getInfoTemplate(label, value, name) {
			return `<div>
						<strong>${label}</strong>
						<span bn-text="${name}">${value}</span>
					</div>`
		}

		function updateInfo(obj) {
			var pos = obj.getLatLng()
			var tooltip = obj.getTooltip()
			//console.log('tooltip', tooltip)
			panelInfo.processTemplate({
				lat: pos.lat.toFixed(5),
				lng: pos.lng.toFixed(5),
				label: obj.userData.label || obj.fullId
			})
		}

		panelInfo.append(getInfoTemplate('Zoom Level', map.getZoom(), 'zoomLevel'))
		panelInfo.append(getInfoTemplate('Label', '', 'label'))
		panelInfo.append(getInfoTemplate('Latitude', 0, 'lat'))
		panelInfo.append(getInfoTemplate('Longitude', 0, 'lng'))



		map.on('zoomend', () => {
			panelInfo.processTemplate({zoomLevel: map.getZoom()})
		})

		tacticView.events.on('objectClicked', function(obj) {
			console.log('[panelInfo] objectClicked', obj.fullId)
			if (obj instanceof L.Marker || obj instanceof L.CircleMarker) {
				updateInfo(obj)
				selMarker = obj
			}
			
		})

		tacticView.events.on('objectUpdated', function(obj) {
			//console.log('[panelInfo] objectUpdated', obj.fullId)
			if (obj == selMarker) {
				updateInfo(obj)
			}
		})


	})

})();
(function() {


	$$.registerTacticPlugin('ShapeDecoder', function(tacticView, options) {

		var topics = Object.keys(tacticView.layers).map(function(layer){
			return `tacticViewAddShape.${layer}.*`
		})





		function onConnect() {
			tacticView.reset()
		}

		function onTacticViewAddShape(msg) {
			//console.log('onTacticViewAddShape', msg)
			if (msg.id == undefined) {
				console.warn('Missing layer or id')
				return
			}

			var layer = tacticView.findOwnerLayer(msg.id)
			var obj = null
			if (layer != null) {
				obj = tacticView.findObject(layer, msg.id)
			}

			if (msg.data == undefined) { // no payload, means remove object
				if (obj != null) {
					obj.removeFrom(layer)
					console.log(`[ShapeDecoder] remove shape '${msg.id}'`)	
				}
				return
			}


			if (obj != null && obj.userData.shape != msg.data.shape) { // if shape change type, remove older and create new one
				obj.removeFrom(layer)
				console.log(`[ShapeDecoder] remove shape '${msg.id}'`)
				obj = null
			}

			if (obj != null) {
				//console.log(`[ShapeDecoder] update shape '${msg.id}'`)
				$.extend(obj.userData, msg.data)
				tacticView.updateShapeView(obj)
				tacticView.events.emit('objectUpdated', obj)
			}
			else {

				if (layer != undefined) {
					obj = tacticView.addShape(msg.data)
					if (obj != null) {
						obj.fullId = msg.id
						obj.creator = msg.src
						obj.userData.id = msg.id
						obj.addTo(layer)
						console.log(`[ShapeDecoder] add shape '${msg.id}'`)						
					}
					else {
						console.warn(`[ShapeDecoder] shape '${msg.data.shape} is not implemented`)
					}

				}
				else {
					console.warn(`[ShapeDecoder] layer '${layerId}' does not exist`)
				}


			}
		}

		tacticView.client.register(topics, true, onTacticViewAddShape)
		tacticView.client.onEvent('connected', onConnect)

		return {
			dispose: function() {
				console.log('[ShapeDecoder] dispose')
				tacticView.client.unregister(topics, onTacticViewAddShape)
				tacticView.client.offEvent('connected', onConnect)
			}
		}

	})

})();

(function() {



	$$.registerTacticPlugin('ShapeEditor', function(tacticView, options) {



		let map = tacticView.map
		let featureGroupName
		let topic = options.topic || 'tacticViewShapeCreated'

		if (options.edit != undefined) {
			featureGroupName = options.edit.featureGroup
			if (typeof featureGroupName == 'string') {
				let featureGroup = tacticView.layers[featureGroupName]
				if (featureGroup == undefined) {
					console.warn(`layer '${featureGroupName}' is not defined`)
				}
				else {
					options.edit.featureGroup = featureGroup
				}
			}
		}

		var drawControl = new L.Control.Draw(options)
		map.addControl(drawControl)

		map.on('draw:created', (e)  => {
			var layer = e.layer
			var type = e.layerType
			console.log('draw:created', type)



			var data = tacticView.getShapeData(layer, type)
			
			//console.log('data', data)

			tacticView.client.emit(topic + '.' + type, data)
			
		})	

		map.on('draw:edited', (e) => {
			//console.log('draw:edited', e)
			e.layers.eachLayer((layer) => {
				console.log(`object with id '${layer.fullId}' was edited`)
				tacticView.updateShapeModel(layer)
				tacticView.client.sendTo(layer.creator, 'tacticViewShapeEdited', layer.userData)

			})
		})	


		map.on('draw:deleted', (e) => {
			//console.log('draw:edited', e)
			e.layers.eachLayer((layer) => {
				console.log(`object with id '${layer.fullId}' was deleted`)				
				tacticView.client.sendTo(layer.creator, 'tacticViewShapeDeleted', layer.userData)
			})
		})	
		
	})

})();

(function() {

	$$.registerShape('circle', function(tacticView) {

		return {
			create: function(data) {
				return L.circle(data.latlng, data.radius, data.options)
			},
			update: function(layer, data) {
				layer.setLatLng(data.latlng)
				layer.setRadius(data.radius)
				layer.setStyle(data.options)
			},
			getData: function(layer, data) {
				data.radius = layer.getRadius()
				data.latlng = layer.getLatLng()	
			}
		}
	})
})();

(function() {

	$$.registerShape('circleMarker', function(tacticView) {

		return {
			create: function(data) {
				return L.circleMarker(data.latlng, data.options)
			},
			update: function(layer, data) {
				layer.setLatLng(data.latlng)
				layer.setStyle(data.options)
			}

		}
	})
})();

(function() {


	function processContent(data) {
		var content = data.popupContent
		if (!Array.isArray(content)) {
			content = [content]
		}
		var div = $('<div>')
			.css('display', 'flex')
			.css('flex-direction', 'column')

		content.forEach(function(item) {
			//console.log('item', item)
			var divItem = $('<div>')
				.css('display', 'flex')
				.css('justify-content', 'space-between')
		
			if (typeof item == 'string') {
				divItem.html(item).processTemplate(data.props)
			}

			if (typeof item == 'object' &&
				 typeof item.label == 'string' &&
				 typeof item.prop == 'string') {

				var template = `<span style="margin-right: 10px">${item.label}</span><span bn-text="${item.prop}"></span>`
				divItem.html(template).processTemplate(data.props)
			}

			div.append(divItem)
		})

		return div.get(0)
	}


	$$.registerShape('marker', function(tacticView) {

		return {
			create: function(data) {
				var options = data.options || {}
				if (data.icon) {
					options.icon = tacticView.getIconMarker(data.icon.type, data.icon)
				}
				if (typeof data.rotationAngle == 'number') {
					options.rotationAngle = data.rotationAngle
				}

				var marker = L.marker(data.latlng, options)							
				
				if (data.popupContent != undefined) {
					let popup = L.popup({autoClose: false, closeButton: true, className: 'toto', autoPan: false})
					popup.setContent(processContent(data))
					marker.bindPopup(popup)
				}
																	
				return marker
			},

			update: function(layer, data) {
				layer.setLatLng(data.latlng)
				if (data.icon) {
					layer.setIcon(tacticView.getIconMarker(data.icon.type, data.icon))
				}
				if (typeof data.rotationAngle == 'number') {
					layer.setRotationAngle(data.rotationAngle)
				}	

				if (data.popupContent != undefined) {
					layer.setPopupContent(processContent(data))
				}									
			},
			getData: function(layer, data) {
				data.latlng = layer.getLatLng()
			}

		} 
	})
})();

(function() {

	$$.registerShape('polygon', function(tacticView) {

		return {
			create: function(data) {
				return L.polygon(data.latlngs, data.options)
			},
			update: function(layer, data) {
				layer.setLatLngs(data.latlngs)
				layer.setStyle(data.options)
			},
			getData: function(layer, data) {
				data.latlngs = layer.getLatLngs()[0]
			}

		}
	})
})();

(function() {

	$$.registerShape('polyline', function(tacticView) {

		return {
			create: function(data) {
				return L.polyline(data.latlngs, data.options)
			},
			update: function(layer, data) {
				layer.setLatLngs(data.latlngs)
				layer.setStyle(data.options)
			},
			getData: function(layer, data) {
				data.latlngs = layer.getLatLngs()
			}			

		}
	})
})();

(function() {

	$$.registerShape('rectangle', function(tacticView) {

		return {
			create: function(data) {
				let bounds = L.latLngBounds(data.northWest, data.southEast)
				return L.rectangle(bounds, data.options)
			},
			update: function(layer, data) {
				let bounds = L.latLngBounds(data.northWest, data.southEast)
				layer.setBounds(bounds)
				layer.setStyle(data.options)
			},			
			getData: function(layer, data) {
				let bounds = layer.getBounds()
				data.northWest =  bounds.getNorthWest()
				data.southEast =  bounds.getSouthEast()
			}
		}
	})
})();

(function() {

	$$.registerShape('sector', function(tacticView) {

		return {
			create: function(data) {
				var options = $.extend({radius: data.radius}, data.options)
				var sector = L.semiCircle(data.latlng, options)
				sector.setDirection(data.direction, data.size)
				return sector
			},
			update: function(layer, data) {
				layer.setLatLng(data.latlng)
				layer.setRadius(data.radius)
				layer.setDirection(data.direction, data.size)
				layer.setStyle(data.options)
			}

		}
	})
})();

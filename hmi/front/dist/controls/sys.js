(function() {


	$$.registerControlEx('MasterAgentsControl', {
		deps: ['WebSocketService'], 

		
	lib: 'sys',
init: function(elt, options, client) {

			let hosts = {}

			var ctrl = $$.viewController(elt, {
				template: "<div class=\"scrollPanel\">\r\n    <table class=\"w3-table-all w3-small\">\r\n        <thead>\r\n            <tr class=\"w3-green\">\r\n                <th>Agent Name</th>\r\n                <th>Host Name</th>\r\n                <th>State</th>\r\n                <th>Pid</th>\r\n                <th>Action</th>\r\n            </tr>\r\n        </thead>\r\n        <tbody bn-each=\"a of agents\" bn-event=\"click.actionStart: onActionStart, click.actionStop: onActionStop, click.actionStopForce: onActionStopForce\">\r\n  			<tr>\r\n				<td bn-text=\"a.agent\"></td>\r\n				<td bn-text=\"a.host\"></td>\r\n				<td bn-text=\"a.state\"></td>\r\n				<td bn-text=\"a.pid\"></td>\r\n				<td bn-data=\"agent: a.agent\">\r\n					<button class=\"actionStart w3-btn w3-blue\" bn-show=\"a.start\">Start</button>\r\n					<button class=\"actionStop w3-btn w3-blue\"  bn-show=\"!a.start\">Stop</button>\r\n					<button class=\"actionStopForce w3-btn w3-red\" bn-show=\"!a.start\">Kill</button>\r\n				</td>\r\n			</tr>      	\r\n\r\n        </tbody>\r\n    </table>\r\n</div>",
				data: {agents: []},
				events: {
					onActionStart: function() {
						var agent = $(this).closest('td').data('agent')
						console.log('actionStart', agent)
						client.emit('launcherStartAgent', agent)				
					},
					onActionStop: function() {
						var agent = $(this).closest('td').data('agent')
						console.log('actionStop', agent)
						client.emit('launcherStopAgent', agent)				
					},
					onActionStopForce: function() {
						var agent = $(this).closest('td').data('agent')
						console.log('actionStopForce', agent)
						client.emit('launcherStopAgent', {agent: agent, force: true})				
					}
				}		
			})

			ctrl.elt.addClass('bn-flex-col')
			dispTable()

			
			function dispTable() {
				var data = []

				for(var hostName in hosts) {
					var agents = hosts[hostName]
					for(var agent in agents) {
						var info = agents[agent]
						data.push({
							pid: info.pid,
							agent: agent,
							state: info.state,
							start: info.pid == 0,
							host: hostName						
						})
					}

				}

				ctrl.setData({agents: data})
			}

			function onLauncherStatus(msg) {
				var hostName = msg.topic.split('.')[1]
				//console.log('host', hostName)
				hosts[hostName] = msg.data
				dispTable()
			}

			client.register('launcherStatus.*', true, onLauncherStatus)

			client.onClose = function() {
				ctrl.setData({agents: []})
			}

			this.dispose = function() {
				client.unregister('launcherStatus.*', onLauncherStatus)
				//client.offEvent('disconnected', onDisconnected)
			}
			
		}


	})

})();

(function() {


	$$.registerControlEx('MasterClientsControl', {

		deps: ['WebSocketService'], 

		
	lib: 'sys',
init: function(elt, options, client) {

			var ctrl = $$.viewController(elt, {
				template: "<div class=\"scrollPanel\">\r\n    <table class=\"w3-table-all w3-small\">\r\n        <thead>\r\n            <tr class=\"w3-green\">\r\n                <th>Name</th>\r\n                <th>Registered Topics</th>\r\n                <th>Registered Services</th>\r\n            </tr>\r\n        </thead>\r\n        <tbody bn-each=\"c of clients\">\r\n			<tr>\r\n				<td bn-text=\"c.name\"></td>\r\n				<td bn-html=\"c.topics\"></td>\r\n                <td bn-html=\"c.services\"></td>\r\n			</tr>        	\r\n        </tbody>\r\n    </table>\r\n</div>",
				data: {
					clients: []
				}
			})

			function onMasterClients(msg) {
				const data = msg.data
				let agents = Object.keys(data).sort()

				var clients = agents.map(function(agent) {

					return {
						topics: data[agent].registeredTopics.join('<br>'),
						services: data[agent].registeredServices.join('<br>'),
						name: agent
					}

				})	
				ctrl.setData({clients: clients})		
			}

			client.register('masterClients', true, onMasterClients)


			client.onClose = function() {
				ctrl.setData({clients: []})
			}

			this.dispose = function() {
				client.unregister('masterClients', onMasterClients)
			}
		}

	})



})();

(function() {



	$$.registerControlEx('MasterHistControl', {

		deps: ['WebSocketService'],

		
	lib: 'sys',
init: function(elt, options, client) {

			var model = {
				tableConfig: {
					columns: {
						'topic': 'Topic',
						'src': 'Source',
						'lastModif': 'Last Modified'
					},
					actions: {
						'detail': 'fa fa-info'
					}
				},
				nbMsg: 0
			}



			var ctrl = $$.viewController(elt, {
				template: "<div class=\"bn-flex-col bn-flex-1\">\r\n	<div class=\"bn-flex-row bn-space-between\">\r\n		<div class=\"bn-container filters\" bn-event=\"input.filter: onFilterChange\">\r\n			<input type=\"text\" placeholder=\"Filter topic\" data-filter=\"topic\" class=\"filter\">\r\n			<input type=\"text\" placeholder=\"Filter source\" data-filter=\"src\" class=\"filter\">					\r\n		</div>\r\n		<div>Messages Number:<span bn-text=\"nbMsg\"></span></div>\r\n	</div>\r\n\r\n\r\n	<div bn-control=\"FilteredTableControl\" bn-options=\"tableConfig\" class=\"bn-flex-1 bn-no-overflow\" bn-iface=\"iface\" bn-event=\"itemAction: onItemAction\">	\r\n</div>\r\n",
				data: model, 
				events: 
				{
					onItemAction: function(action, id) {
						console.log('onItemAction', action, id)
						var item = ctrl.scope.iface.getItem(id)
						var html = `<pre>${JSON.stringify(item.data, null, 4)}</pre>`
						$$.showAlert(html, 'Detail')
					},

					onFilterChange: function(ev) {
						console.log('onFilterChange')
						var filter = $(this).data('filter')
						filters[filter] = $(this).val()
						ctrl.scope.iface.setFilters(filters)
						updateTopicNumber()
					}
				}
			})

			let filters = {}

			var tbody = ctrl.elt.find('tbody')

			function updateTopicNumber() {
				var nbMsg = tbody.find('tr').length
				ctrl.setData({nbMsg: nbMsg})
			}


			function onMessage(msg) {
				//console.log('onMessage')
				ctrl.scope.iface.addItem(msg.topic, getItemData(msg))
				updateTopicNumber()			
			}

			client.register('**', true, onMessage)

			client.onClose = function() {
				ctrl.scope.iface.removeAllItems()
			}


			
			function getItemData(msg) {


				return {
					topic: msg.topic,
					src: msg.src,
					lastModif: new Date(msg.time).toLocaleString(),
					data: msg.data			
				}
			}

			this.dispose = function() {
				client.unregister('**', onMessage)
			}
		}



	})

})();






(function() {


	$$.registerControlEx('UserDetailsControl', {

		deps: ['HttpService'],
		iface: 'setUser(userName);getUser();hide()',

		
	lib: 'sys',
init: function(elt, options, http) {

			var ctrl = $$.viewController(elt, {
				template: "<div class=\"main\" bn-show=\"visible\">\r\n\r\n	<h2>User Details</h2>\r\n	<table class=\"info w3-table w3-border\" bn-bind=\"info\">\r\n		<tr>\r\n			<td>User</td>\r\n			<td><strong bn-text=\"user\"></strong></td>\r\n		</tr>\r\n		<tr>\r\n			<td>Password</td>\r\n			<td><input class=\"pwd w3-input w3-border\" type=\"text\" bn-val=\"pwd\" name=\"pwd\"></td>\r\n		</tr>\r\n	</table>				\r\n\r\n	<div class=\"scrollPanel\">\r\n		<table class=\"apps w3-table-all w3-small\">\r\n			<thead>\r\n				<tr class=\"w3-green\">\r\n					<th>App Name</th>\r\n					<th>Allowed</th>\r\n					<th>Configuration</th>			\r\n				</tr>\r\n\r\n			</thead>\r\n			<tbody bn-each=\"app of apps\" bn-bind=\"tbody\">\r\n				<tr>\r\n					<td bn-text=\"app.appName\" name=\"name\" bn-val=\"app.appName\"></td>\r\n					<td><input name=\"enabled\" type=\"checkbox\" bn-prop=\"checked: app.allowed\"></td>\r\n					<td><select name=\"config\"  class=\"w3-border bn-fill\" bn-list=\"app.configs\" bn-val=\"app.selConfig\"></select></td>\r\n				</tr>				\r\n			</tbody>\r\n		</table>\r\n	</div>\r\n	<p><button class=\"apply w3-btn w3-blue\" bn-event=\"click: onApply\">Apply changes</button></p>\r\n</div>",
				data: {
					user: '',
					pwd: '',
					apps: [],
					visible: false
				},	
				events: {
					onApply: function(ev) {
						console.log('Apply', getInfos())
						http.put(`/api/users/${user}`, getInfos()).then(() => {
							$(this).notify('Config saved successfully', {position: 'right top', className: 'success'})
						})					
					}
				}
			})


			var user
			var _apps = []



			http.get('/api/apps').then(function(apps) {
				_apps = apps

			})

			this.setUser = function(id) {
				console.log('[UserDetailsControl] setUser', id)
				user = id
				getUserDetails(id)
				//mainElt.show()	
			}

			function getInfos() {
				var infos = ctrl.scope.info.getFormData()
				console.log('infos', infos)

				var allowedApps = {}
				ctrl.scope.tbody.find('tr').each(function() {
					var appInfos = $(this).getFormData()
					console.log('appInfos', appInfos)
					if (appInfos.enabled) {
						allowedApps[appInfos.name] = (appInfos.config == 'none') ? true : appInfos.config
					}
				})
				return {
					pwd: infos.pwd,
					allowedApps: allowedApps
				}
			}

			function getUserDetails(user) {
				http.get(`/api/users/${user}`).then(function(userDetails) {

					var allowedApps = userDetails.allowedApps

					var apps = $$.obj2Array(_apps).map(function(item) {
						var appName = item.key

						var config = allowedApps[appName]

						return {
							appName: appName,
							allowed: (config != undefined),
							selConfig: (typeof config == 'string') ? config : 'none',
							configs: ['none'].concat(item.value)
						}
					})	
								
					ctrl.setData({
						user: user,
						pwd: userDetails.pwd,
						visible: true,
						apps: apps
					})

				})			
			}

			this.getUser = function() {
				return user
			},
			this.hide = function() {
				ctrl.setData({visible: false})
			}
		}

	})

})();


$$.registerControlEx('UsersControl', {
	deps: ['HttpService'],
	events: 'userSelected,userDeleted',
	
	lib: 'sys',
init: function(elt, options, http) {

		var events = new EventEmitter2()

		var ctrl = $$.viewController(elt, {
			template: "<div class=\"bn-flex-col bn-flex-1\">\r\n	<h2>Registered Users</h2>\r\n	<div class=\"scrollPanel\">\r\n		<ul class=\"w3-ul w3-border w3-white\" bn-each=\"user of users\" bn-event=\"click.delete: onDeleteUser, click.user: onUserClicked\" bn-bind=\"ul\">\r\n			<li class=\"w3-bar\" bn-data=\"user: user\">\r\n				<span class=\"w3-button w3-right delete\" title=\"Delete\"><i class=\"fa fa-trash\"></i></span>\r\n				<div class=\"w3-bar-item\">\r\n					<a href=\"#\" bn-text=\"user\" class=\"user\"></a>\r\n				</div>\r\n			</li>\r\n		</ul>\r\n	</div>\r\n\r\n	<div>\r\n		<form bn-event=\"submit: onAddUser\">\r\n			<input type=\"text\" placeholder=\"username\" name=\"userName\" required autocomplete=\"off\" class=\"w3-input w3-border\">\r\n			<button type=\"submit\" class=\"w3-btn w3-blue w3-bar-item w3-right\">Add</button>			\r\n\r\n		</form>\r\n	</div>	\r\n</div>\r\n\r\n		",
			data: {users: []},
			events: {

				onAddUser: function(ev) {
					//console.log('onAddUser')
					ev.preventDefault()
					var data = $(this).getFormData()
					$(this).get(0).reset()
					//console.log('submit', data)
					http.post('/api/users', data).then(loadUsers)
				},
				onDeleteUser: function(ev) {
					//console.log('onDeleteUser')
					var user = $(this).closest('li').data('user')
					//console.log('user', user)
					$$.showConfirm('Are your sure ?', 'Information', function() {
						http.delete(`/api/users/${user}`).then(function() {
							loadUsers()
							events.emit('userDeleted', user)
						})				
					})				
				},
				onUserClicked: function(ev) {
					//console.log('onUserClicked')
					ev.preventDefault()
					ctrl.scope.ul.find('li').removeClass('w3-blue')
					var $li = $(this).closest('li')
					$li.addClass('w3-blue')
					var user = $li.data('user')
					//console.log('user', user)
					events.emit('userSelected', user)				
				}
			}
		})			


		function loadUsers() {
			http.get('/api/users').then(function(users) {
				console.log('loadUsers', users)
				ctrl.setData({users: users})
			})			
		}

		loadUsers()

		this.on = events.on.bind(events)


	}

});



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hc3Rlci1hZ2VudHMuanMiLCJtYXN0ZXItY2xpZW50cy5qcyIsIm1hc3Rlci1oaXN0LmpzIiwidXNlci1kZXRhaWxzLmpzIiwidXNlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InN5cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNYXN0ZXJBZ2VudHNDb250cm9sJywge1xyXG5cdFx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJ10sIFxyXG5cclxuXHRcdFxuXHRsaWI6ICdzeXMnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcclxuXHJcblx0XHRcdGxldCBob3N0cyA9IHt9XHJcblxyXG5cdFx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXHJcXG4gICAgPHRhYmxlIGNsYXNzPVxcXCJ3My10YWJsZS1hbGwgdzMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHRoZWFkPlxcclxcbiAgICAgICAgICAgIDx0ciBjbGFzcz1cXFwidzMtZ3JlZW5cXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8dGg+QWdlbnQgTmFtZTwvdGg+XFxyXFxuICAgICAgICAgICAgICAgIDx0aD5Ib3N0IE5hbWU8L3RoPlxcclxcbiAgICAgICAgICAgICAgICA8dGg+U3RhdGU8L3RoPlxcclxcbiAgICAgICAgICAgICAgICA8dGg+UGlkPC90aD5cXHJcXG4gICAgICAgICAgICAgICAgPHRoPkFjdGlvbjwvdGg+XFxyXFxuICAgICAgICAgICAgPC90cj5cXHJcXG4gICAgICAgIDwvdGhlYWQ+XFxyXFxuICAgICAgICA8dGJvZHkgYm4tZWFjaD1cXFwiYSBvZiBhZ2VudHNcXFwiIGJuLWV2ZW50PVxcXCJjbGljay5hY3Rpb25TdGFydDogb25BY3Rpb25TdGFydCwgY2xpY2suYWN0aW9uU3RvcDogb25BY3Rpb25TdG9wLCBjbGljay5hY3Rpb25TdG9wRm9yY2U6IG9uQWN0aW9uU3RvcEZvcmNlXFxcIj5cXHJcXG4gIFx0XHRcdDx0cj5cXHJcXG5cdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJhLmFnZW50XFxcIj48L3RkPlxcclxcblx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImEuaG9zdFxcXCI+PC90ZD5cXHJcXG5cdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJhLnN0YXRlXFxcIj48L3RkPlxcclxcblx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImEucGlkXFxcIj48L3RkPlxcclxcblx0XHRcdFx0PHRkIGJuLWRhdGE9XFxcImFnZW50OiBhLmFnZW50XFxcIj5cXHJcXG5cdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYWN0aW9uU3RhcnQgdzMtYnRuIHczLWJsdWVcXFwiIGJuLXNob3c9XFxcImEuc3RhcnRcXFwiPlN0YXJ0PC9idXR0b24+XFxyXFxuXHRcdFx0XHRcdDxidXR0b24gY2xhc3M9XFxcImFjdGlvblN0b3AgdzMtYnRuIHczLWJsdWVcXFwiICBibi1zaG93PVxcXCIhYS5zdGFydFxcXCI+U3RvcDwvYnV0dG9uPlxcclxcblx0XHRcdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJhY3Rpb25TdG9wRm9yY2UgdzMtYnRuIHczLXJlZFxcXCIgYm4tc2hvdz1cXFwiIWEuc3RhcnRcXFwiPktpbGw8L2J1dHRvbj5cXHJcXG5cdFx0XHRcdDwvdGQ+XFxyXFxuXHRcdFx0PC90cj4gICAgICBcdFxcclxcblxcclxcbiAgICAgICAgPC90Ym9keT5cXHJcXG4gICAgPC90YWJsZT5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0XHRkYXRhOiB7YWdlbnRzOiBbXX0sXHJcblx0XHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0XHRvbkFjdGlvblN0YXJ0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGFnZW50ID0gJCh0aGlzKS5jbG9zZXN0KCd0ZCcpLmRhdGEoJ2FnZW50JylcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2FjdGlvblN0YXJ0JywgYWdlbnQpXHJcblx0XHRcdFx0XHRcdGNsaWVudC5lbWl0KCdsYXVuY2hlclN0YXJ0QWdlbnQnLCBhZ2VudClcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdG9uQWN0aW9uU3RvcDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHZhciBhZ2VudCA9ICQodGhpcykuY2xvc2VzdCgndGQnKS5kYXRhKCdhZ2VudCcpXHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdhY3Rpb25TdG9wJywgYWdlbnQpXHJcblx0XHRcdFx0XHRcdGNsaWVudC5lbWl0KCdsYXVuY2hlclN0b3BBZ2VudCcsIGFnZW50KVx0XHRcdFx0XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0b25BY3Rpb25TdG9wRm9yY2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYWdlbnQgPSAkKHRoaXMpLmNsb3Nlc3QoJ3RkJykuZGF0YSgnYWdlbnQnKVxyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnYWN0aW9uU3RvcEZvcmNlJywgYWdlbnQpXHJcblx0XHRcdFx0XHRcdGNsaWVudC5lbWl0KCdsYXVuY2hlclN0b3BBZ2VudCcsIHthZ2VudDogYWdlbnQsIGZvcmNlOiB0cnVlfSlcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHRjdHJsLmVsdC5hZGRDbGFzcygnYm4tZmxleC1jb2wnKVxyXG5cdFx0XHRkaXNwVGFibGUoKVxyXG5cclxuXHRcdFx0XHJcblx0XHRcdGZ1bmN0aW9uIGRpc3BUYWJsZSgpIHtcclxuXHRcdFx0XHR2YXIgZGF0YSA9IFtdXHJcblxyXG5cdFx0XHRcdGZvcih2YXIgaG9zdE5hbWUgaW4gaG9zdHMpIHtcclxuXHRcdFx0XHRcdHZhciBhZ2VudHMgPSBob3N0c1tob3N0TmFtZV1cclxuXHRcdFx0XHRcdGZvcih2YXIgYWdlbnQgaW4gYWdlbnRzKSB7XHJcblx0XHRcdFx0XHRcdHZhciBpbmZvID0gYWdlbnRzW2FnZW50XVxyXG5cdFx0XHRcdFx0XHRkYXRhLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRcdHBpZDogaW5mby5waWQsXHJcblx0XHRcdFx0XHRcdFx0YWdlbnQ6IGFnZW50LFxyXG5cdFx0XHRcdFx0XHRcdHN0YXRlOiBpbmZvLnN0YXRlLFxyXG5cdFx0XHRcdFx0XHRcdHN0YXJ0OiBpbmZvLnBpZCA9PSAwLFxyXG5cdFx0XHRcdFx0XHRcdGhvc3Q6IGhvc3ROYW1lXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHthZ2VudHM6IGRhdGF9KVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBvbkxhdW5jaGVyU3RhdHVzKG1zZykge1xyXG5cdFx0XHRcdHZhciBob3N0TmFtZSA9IG1zZy50b3BpYy5zcGxpdCgnLicpWzFdXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnaG9zdCcsIGhvc3ROYW1lKVxyXG5cdFx0XHRcdGhvc3RzW2hvc3ROYW1lXSA9IG1zZy5kYXRhXHJcblx0XHRcdFx0ZGlzcFRhYmxlKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2xpZW50LnJlZ2lzdGVyKCdsYXVuY2hlclN0YXR1cy4qJywgdHJ1ZSwgb25MYXVuY2hlclN0YXR1cylcclxuXHJcblx0XHRcdGNsaWVudC5vbkNsb3NlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHthZ2VudHM6IFtdfSlcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y2xpZW50LnVucmVnaXN0ZXIoJ2xhdW5jaGVyU3RhdHVzLionLCBvbkxhdW5jaGVyU3RhdHVzKVxyXG5cdFx0XHRcdC8vY2xpZW50Lm9mZkV2ZW50KCdkaXNjb25uZWN0ZWQnLCBvbkRpc2Nvbm5lY3RlZClcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH1cclxuXHJcblxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnTWFzdGVyQ2xpZW50c0NvbnRyb2wnLCB7XHJcblxyXG5cdFx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJ10sIFxyXG5cclxuXHRcdFxuXHRsaWI6ICdzeXMnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcclxuXHJcblx0XHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcclxcbiAgICA8dGFibGUgY2xhc3M9XFxcInczLXRhYmxlLWFsbCB3My1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8dGhlYWQ+XFxyXFxuICAgICAgICAgICAgPHRyIGNsYXNzPVxcXCJ3My1ncmVlblxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDx0aD5OYW1lPC90aD5cXHJcXG4gICAgICAgICAgICAgICAgPHRoPlJlZ2lzdGVyZWQgVG9waWNzPC90aD5cXHJcXG4gICAgICAgICAgICAgICAgPHRoPlJlZ2lzdGVyZWQgU2VydmljZXM8L3RoPlxcclxcbiAgICAgICAgICAgIDwvdHI+XFxyXFxuICAgICAgICA8L3RoZWFkPlxcclxcbiAgICAgICAgPHRib2R5IGJuLWVhY2g9XFxcImMgb2YgY2xpZW50c1xcXCI+XFxyXFxuXHRcdFx0PHRyPlxcclxcblx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImMubmFtZVxcXCI+PC90ZD5cXHJcXG5cdFx0XHRcdDx0ZCBibi1odG1sPVxcXCJjLnRvcGljc1xcXCI+PC90ZD5cXHJcXG4gICAgICAgICAgICAgICAgPHRkIGJuLWh0bWw9XFxcImMuc2VydmljZXNcXFwiPjwvdGQ+XFxyXFxuXHRcdFx0PC90cj4gICAgICAgIFx0XFxyXFxuICAgICAgICA8L3Rib2R5PlxcclxcbiAgICA8L3RhYmxlPlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRcdGNsaWVudHM6IFtdXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gb25NYXN0ZXJDbGllbnRzKG1zZykge1xyXG5cdFx0XHRcdGNvbnN0IGRhdGEgPSBtc2cuZGF0YVxyXG5cdFx0XHRcdGxldCBhZ2VudHMgPSBPYmplY3Qua2V5cyhkYXRhKS5zb3J0KClcclxuXHJcblx0XHRcdFx0dmFyIGNsaWVudHMgPSBhZ2VudHMubWFwKGZ1bmN0aW9uKGFnZW50KSB7XHJcblxyXG5cdFx0XHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdFx0dG9waWNzOiBkYXRhW2FnZW50XS5yZWdpc3RlcmVkVG9waWNzLmpvaW4oJzxicj4nKSxcclxuXHRcdFx0XHRcdFx0c2VydmljZXM6IGRhdGFbYWdlbnRdLnJlZ2lzdGVyZWRTZXJ2aWNlcy5qb2luKCc8YnI+JyksXHJcblx0XHRcdFx0XHRcdG5hbWU6IGFnZW50XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH0pXHRcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe2NsaWVudHM6IGNsaWVudHN9KVx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2xpZW50LnJlZ2lzdGVyKCdtYXN0ZXJDbGllbnRzJywgdHJ1ZSwgb25NYXN0ZXJDbGllbnRzKVxyXG5cclxuXHJcblx0XHRcdGNsaWVudC5vbkNsb3NlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtjbGllbnRzOiBbXX0pXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNsaWVudC51bnJlZ2lzdGVyKCdtYXN0ZXJDbGllbnRzJywgb25NYXN0ZXJDbGllbnRzKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG5cclxuXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnTWFzdGVySGlzdENvbnRyb2wnLCB7XHJcblxyXG5cdFx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJ10sXHJcblxyXG5cdFx0XG5cdGxpYjogJ3N5cycsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xyXG5cclxuXHRcdFx0dmFyIG1vZGVsID0ge1xyXG5cdFx0XHRcdHRhYmxlQ29uZmlnOiB7XHJcblx0XHRcdFx0XHRjb2x1bW5zOiB7XHJcblx0XHRcdFx0XHRcdCd0b3BpYyc6ICdUb3BpYycsXHJcblx0XHRcdFx0XHRcdCdzcmMnOiAnU291cmNlJyxcclxuXHRcdFx0XHRcdFx0J2xhc3RNb2RpZic6ICdMYXN0IE1vZGlmaWVkJ1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGFjdGlvbnM6IHtcclxuXHRcdFx0XHRcdFx0J2RldGFpbCc6ICdmYSBmYS1pbmZvJ1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0bmJNc2c6IDBcclxuXHRcdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1zcGFjZS1iZXR3ZWVuXFxcIj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tY29udGFpbmVyIGZpbHRlcnNcXFwiIGJuLWV2ZW50PVxcXCJpbnB1dC5maWx0ZXI6IG9uRmlsdGVyQ2hhbmdlXFxcIj5cXHJcXG5cdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIkZpbHRlciB0b3BpY1xcXCIgZGF0YS1maWx0ZXI9XFxcInRvcGljXFxcIiBjbGFzcz1cXFwiZmlsdGVyXFxcIj5cXHJcXG5cdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIkZpbHRlciBzb3VyY2VcXFwiIGRhdGEtZmlsdGVyPVxcXCJzcmNcXFwiIGNsYXNzPVxcXCJmaWx0ZXJcXFwiPlx0XHRcdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHRcdDxkaXY+TWVzc2FnZXMgTnVtYmVyOjxzcGFuIGJuLXRleHQ9XFxcIm5iTXNnXFxcIj48L3NwYW4+PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiRmlsdGVyZWRUYWJsZUNvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcInRhYmxlQ29uZmlnXFxcIiBjbGFzcz1cXFwiYm4tZmxleC0xIGJuLW5vLW92ZXJmbG93XFxcIiBibi1pZmFjZT1cXFwiaWZhY2VcXFwiIGJuLWV2ZW50PVxcXCJpdGVtQWN0aW9uOiBvbkl0ZW1BY3Rpb25cXFwiPlx0XFxyXFxuPC9kaXY+XFxyXFxuXCIsXHJcblx0XHRcdFx0ZGF0YTogbW9kZWwsIFxyXG5cdFx0XHRcdGV2ZW50czogXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0b25JdGVtQWN0aW9uOiBmdW5jdGlvbihhY3Rpb24sIGlkKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbkl0ZW1BY3Rpb24nLCBhY3Rpb24sIGlkKVxyXG5cdFx0XHRcdFx0XHR2YXIgaXRlbSA9IGN0cmwuc2NvcGUuaWZhY2UuZ2V0SXRlbShpZClcclxuXHRcdFx0XHRcdFx0dmFyIGh0bWwgPSBgPHByZT4ke0pTT04uc3RyaW5naWZ5KGl0ZW0uZGF0YSwgbnVsbCwgNCl9PC9wcmU+YFxyXG5cdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoaHRtbCwgJ0RldGFpbCcpXHJcblx0XHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHRcdG9uRmlsdGVyQ2hhbmdlOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25GaWx0ZXJDaGFuZ2UnKVxyXG5cdFx0XHRcdFx0XHR2YXIgZmlsdGVyID0gJCh0aGlzKS5kYXRhKCdmaWx0ZXInKVxyXG5cdFx0XHRcdFx0XHRmaWx0ZXJzW2ZpbHRlcl0gPSAkKHRoaXMpLnZhbCgpXHJcblx0XHRcdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2Uuc2V0RmlsdGVycyhmaWx0ZXJzKVxyXG5cdFx0XHRcdFx0XHR1cGRhdGVUb3BpY051bWJlcigpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0bGV0IGZpbHRlcnMgPSB7fVxyXG5cclxuXHRcdFx0dmFyIHRib2R5ID0gY3RybC5lbHQuZmluZCgndGJvZHknKVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gdXBkYXRlVG9waWNOdW1iZXIoKSB7XHJcblx0XHRcdFx0dmFyIG5iTXNnID0gdGJvZHkuZmluZCgndHInKS5sZW5ndGhcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe25iTXNnOiBuYk1zZ30pXHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBvbk1lc3NhZ2UobXNnKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25NZXNzYWdlJylcclxuXHRcdFx0XHRjdHJsLnNjb3BlLmlmYWNlLmFkZEl0ZW0obXNnLnRvcGljLCBnZXRJdGVtRGF0YShtc2cpKVxyXG5cdFx0XHRcdHVwZGF0ZVRvcGljTnVtYmVyKClcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2xpZW50LnJlZ2lzdGVyKCcqKicsIHRydWUsIG9uTWVzc2FnZSlcclxuXHJcblx0XHRcdGNsaWVudC5vbkNsb3NlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y3RybC5zY29wZS5pZmFjZS5yZW1vdmVBbGxJdGVtcygpXHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRcclxuXHRcdFx0ZnVuY3Rpb24gZ2V0SXRlbURhdGEobXNnKSB7XHJcblxyXG5cclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0dG9waWM6IG1zZy50b3BpYyxcclxuXHRcdFx0XHRcdHNyYzogbXNnLnNyYyxcclxuXHRcdFx0XHRcdGxhc3RNb2RpZjogbmV3IERhdGUobXNnLnRpbWUpLnRvTG9jYWxlU3RyaW5nKCksXHJcblx0XHRcdFx0XHRkYXRhOiBtc2cuZGF0YVx0XHRcdFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y2xpZW50LnVucmVnaXN0ZXIoJyoqJywgb25NZXNzYWdlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cclxuXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ1VzZXJEZXRhaWxzQ29udHJvbCcsIHtcclxuXHJcblx0XHRkZXBzOiBbJ0h0dHBTZXJ2aWNlJ10sXHJcblx0XHRpZmFjZTogJ3NldFVzZXIodXNlck5hbWUpO2dldFVzZXIoKTtoaWRlKCknLFxyXG5cclxuXHRcdFxuXHRsaWI6ICdzeXMnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBodHRwKSB7XHJcblxyXG5cdFx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcIm1haW5cXFwiIGJuLXNob3c9XFxcInZpc2libGVcXFwiPlxcclxcblxcclxcblx0PGgyPlVzZXIgRGV0YWlsczwvaDI+XFxyXFxuXHQ8dGFibGUgY2xhc3M9XFxcImluZm8gdzMtdGFibGUgdzMtYm9yZGVyXFxcIiBibi1iaW5kPVxcXCJpbmZvXFxcIj5cXHJcXG5cdFx0PHRyPlxcclxcblx0XHRcdDx0ZD5Vc2VyPC90ZD5cXHJcXG5cdFx0XHQ8dGQ+PHN0cm9uZyBibi10ZXh0PVxcXCJ1c2VyXFxcIj48L3N0cm9uZz48L3RkPlxcclxcblx0XHQ8L3RyPlxcclxcblx0XHQ8dHI+XFxyXFxuXHRcdFx0PHRkPlBhc3N3b3JkPC90ZD5cXHJcXG5cdFx0XHQ8dGQ+PGlucHV0IGNsYXNzPVxcXCJwd2QgdzMtaW5wdXQgdzMtYm9yZGVyXFxcIiB0eXBlPVxcXCJ0ZXh0XFxcIiBibi12YWw9XFxcInB3ZFxcXCIgbmFtZT1cXFwicHdkXFxcIj48L3RkPlxcclxcblx0XHQ8L3RyPlxcclxcblx0PC90YWJsZT5cdFx0XHRcdFxcclxcblxcclxcblx0PGRpdiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcclxcblx0XHQ8dGFibGUgY2xhc3M9XFxcImFwcHMgdzMtdGFibGUtYWxsIHczLXNtYWxsXFxcIj5cXHJcXG5cdFx0XHQ8dGhlYWQ+XFxyXFxuXHRcdFx0XHQ8dHIgY2xhc3M9XFxcInczLWdyZWVuXFxcIj5cXHJcXG5cdFx0XHRcdFx0PHRoPkFwcCBOYW1lPC90aD5cXHJcXG5cdFx0XHRcdFx0PHRoPkFsbG93ZWQ8L3RoPlxcclxcblx0XHRcdFx0XHQ8dGg+Q29uZmlndXJhdGlvbjwvdGg+XHRcdFx0XFxyXFxuXHRcdFx0XHQ8L3RyPlxcclxcblxcclxcblx0XHRcdDwvdGhlYWQ+XFxyXFxuXHRcdFx0PHRib2R5IGJuLWVhY2g9XFxcImFwcCBvZiBhcHBzXFxcIiBibi1iaW5kPVxcXCJ0Ym9keVxcXCI+XFxyXFxuXHRcdFx0XHQ8dHI+XFxyXFxuXHRcdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJhcHAuYXBwTmFtZVxcXCIgbmFtZT1cXFwibmFtZVxcXCIgYm4tdmFsPVxcXCJhcHAuYXBwTmFtZVxcXCI+PC90ZD5cXHJcXG5cdFx0XHRcdFx0PHRkPjxpbnB1dCBuYW1lPVxcXCJlbmFibGVkXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCIgYm4tcHJvcD1cXFwiY2hlY2tlZDogYXBwLmFsbG93ZWRcXFwiPjwvdGQ+XFxyXFxuXHRcdFx0XHRcdDx0ZD48c2VsZWN0IG5hbWU9XFxcImNvbmZpZ1xcXCIgIGNsYXNzPVxcXCJ3My1ib3JkZXIgYm4tZmlsbFxcXCIgYm4tbGlzdD1cXFwiYXBwLmNvbmZpZ3NcXFwiIGJuLXZhbD1cXFwiYXBwLnNlbENvbmZpZ1xcXCI+PC9zZWxlY3Q+PC90ZD5cXHJcXG5cdFx0XHRcdDwvdHI+XHRcdFx0XHRcXHJcXG5cdFx0XHQ8L3Rib2R5Plxcclxcblx0XHQ8L3RhYmxlPlxcclxcblx0PC9kaXY+XFxyXFxuXHQ8cD48YnV0dG9uIGNsYXNzPVxcXCJhcHBseSB3My1idG4gdzMtYmx1ZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkFwcGx5XFxcIj5BcHBseSBjaGFuZ2VzPC9idXR0b24+PC9wPlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRcdHVzZXI6ICcnLFxyXG5cdFx0XHRcdFx0cHdkOiAnJyxcclxuXHRcdFx0XHRcdGFwcHM6IFtdLFxyXG5cdFx0XHRcdFx0dmlzaWJsZTogZmFsc2VcclxuXHRcdFx0XHR9LFx0XHJcblx0XHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0XHRvbkFwcGx5OiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnQXBwbHknLCBnZXRJbmZvcygpKVxyXG5cdFx0XHRcdFx0XHRodHRwLnB1dChgL2FwaS91c2Vycy8ke3VzZXJ9YCwgZ2V0SW5mb3MoKSkudGhlbigoKSA9PiB7XHJcblx0XHRcdFx0XHRcdFx0JCh0aGlzKS5ub3RpZnkoJ0NvbmZpZyBzYXZlZCBzdWNjZXNzZnVsbHknLCB7cG9zaXRpb246ICdyaWdodCB0b3AnLCBjbGFzc05hbWU6ICdzdWNjZXNzJ30pXHJcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHJcblxyXG5cdFx0XHR2YXIgdXNlclxyXG5cdFx0XHR2YXIgX2FwcHMgPSBbXVxyXG5cclxuXHJcblxyXG5cdFx0XHRodHRwLmdldCgnL2FwaS9hcHBzJykudGhlbihmdW5jdGlvbihhcHBzKSB7XHJcblx0XHRcdFx0X2FwcHMgPSBhcHBzXHJcblxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0dGhpcy5zZXRVc2VyID0gZnVuY3Rpb24oaWQpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW1VzZXJEZXRhaWxzQ29udHJvbF0gc2V0VXNlcicsIGlkKVxyXG5cdFx0XHRcdHVzZXIgPSBpZFxyXG5cdFx0XHRcdGdldFVzZXJEZXRhaWxzKGlkKVxyXG5cdFx0XHRcdC8vbWFpbkVsdC5zaG93KClcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBnZXRJbmZvcygpIHtcclxuXHRcdFx0XHR2YXIgaW5mb3MgPSBjdHJsLnNjb3BlLmluZm8uZ2V0Rm9ybURhdGEoKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdpbmZvcycsIGluZm9zKVxyXG5cclxuXHRcdFx0XHR2YXIgYWxsb3dlZEFwcHMgPSB7fVxyXG5cdFx0XHRcdGN0cmwuc2NvcGUudGJvZHkuZmluZCgndHInKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dmFyIGFwcEluZm9zID0gJCh0aGlzKS5nZXRGb3JtRGF0YSgpXHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnYXBwSW5mb3MnLCBhcHBJbmZvcylcclxuXHRcdFx0XHRcdGlmIChhcHBJbmZvcy5lbmFibGVkKSB7XHJcblx0XHRcdFx0XHRcdGFsbG93ZWRBcHBzW2FwcEluZm9zLm5hbWVdID0gKGFwcEluZm9zLmNvbmZpZyA9PSAnbm9uZScpID8gdHJ1ZSA6IGFwcEluZm9zLmNvbmZpZ1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdHB3ZDogaW5mb3MucHdkLFxyXG5cdFx0XHRcdFx0YWxsb3dlZEFwcHM6IGFsbG93ZWRBcHBzXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBnZXRVc2VyRGV0YWlscyh1c2VyKSB7XHJcblx0XHRcdFx0aHR0cC5nZXQoYC9hcGkvdXNlcnMvJHt1c2VyfWApLnRoZW4oZnVuY3Rpb24odXNlckRldGFpbHMpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgYWxsb3dlZEFwcHMgPSB1c2VyRGV0YWlscy5hbGxvd2VkQXBwc1xyXG5cclxuXHRcdFx0XHRcdHZhciBhcHBzID0gJCQub2JqMkFycmF5KF9hcHBzKS5tYXAoZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYXBwTmFtZSA9IGl0ZW0ua2V5XHJcblxyXG5cdFx0XHRcdFx0XHR2YXIgY29uZmlnID0gYWxsb3dlZEFwcHNbYXBwTmFtZV1cclxuXHJcblx0XHRcdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdFx0YXBwTmFtZTogYXBwTmFtZSxcclxuXHRcdFx0XHRcdFx0XHRhbGxvd2VkOiAoY29uZmlnICE9IHVuZGVmaW5lZCksXHJcblx0XHRcdFx0XHRcdFx0c2VsQ29uZmlnOiAodHlwZW9mIGNvbmZpZyA9PSAnc3RyaW5nJykgPyBjb25maWcgOiAnbm9uZScsXHJcblx0XHRcdFx0XHRcdFx0Y29uZmlnczogWydub25lJ10uY29uY2F0KGl0ZW0udmFsdWUpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pXHRcclxuXHRcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdFx0dXNlcjogdXNlcixcclxuXHRcdFx0XHRcdFx0cHdkOiB1c2VyRGV0YWlscy5wd2QsXHJcblx0XHRcdFx0XHRcdHZpc2libGU6IHRydWUsXHJcblx0XHRcdFx0XHRcdGFwcHM6IGFwcHNcclxuXHRcdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdH0pXHRcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuZ2V0VXNlciA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiB1c2VyXHJcblx0XHRcdH0sXHJcblx0XHRcdHRoaXMuaGlkZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7dmlzaWJsZTogZmFsc2V9KVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ1VzZXJzQ29udHJvbCcsIHtcclxuXHRkZXBzOiBbJ0h0dHBTZXJ2aWNlJ10sXHJcblx0ZXZlbnRzOiAndXNlclNlbGVjdGVkLHVzZXJEZWxldGVkJyxcclxuXHRcblx0bGliOiAnc3lzJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgaHR0cCkge1xyXG5cclxuXHRcdHZhciBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblxyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIj5cXHJcXG5cdDxoMj5SZWdpc3RlcmVkIFVzZXJzPC9oMj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXHJcXG5cdFx0PHVsIGNsYXNzPVxcXCJ3My11bCB3My1ib3JkZXIgdzMtd2hpdGVcXFwiIGJuLWVhY2g9XFxcInVzZXIgb2YgdXNlcnNcXFwiIGJuLWV2ZW50PVxcXCJjbGljay5kZWxldGU6IG9uRGVsZXRlVXNlciwgY2xpY2sudXNlcjogb25Vc2VyQ2xpY2tlZFxcXCIgYm4tYmluZD1cXFwidWxcXFwiPlxcclxcblx0XHRcdDxsaSBjbGFzcz1cXFwidzMtYmFyXFxcIiBibi1kYXRhPVxcXCJ1c2VyOiB1c2VyXFxcIj5cXHJcXG5cdFx0XHRcdDxzcGFuIGNsYXNzPVxcXCJ3My1idXR0b24gdzMtcmlnaHQgZGVsZXRlXFxcIiB0aXRsZT1cXFwiRGVsZXRlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtdHJhc2hcXFwiPjwvaT48L3NwYW4+XFxyXFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJ3My1iYXItaXRlbVxcXCI+XFxyXFxuXHRcdFx0XHRcdDxhIGhyZWY9XFxcIiNcXFwiIGJuLXRleHQ9XFxcInVzZXJcXFwiIGNsYXNzPVxcXCJ1c2VyXFxcIj48L2E+XFxyXFxuXHRcdFx0XHQ8L2Rpdj5cXHJcXG5cdFx0XHQ8L2xpPlxcclxcblx0XHQ8L3VsPlxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8ZGl2Plxcclxcblx0XHQ8Zm9ybSBibi1ldmVudD1cXFwic3VibWl0OiBvbkFkZFVzZXJcXFwiPlxcclxcblx0XHRcdDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBwbGFjZWhvbGRlcj1cXFwidXNlcm5hbWVcXFwiIG5hbWU9XFxcInVzZXJOYW1lXFxcIiByZXF1aXJlZCBhdXRvY29tcGxldGU9XFxcIm9mZlxcXCIgY2xhc3M9XFxcInczLWlucHV0IHczLWJvcmRlclxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiB0eXBlPVxcXCJzdWJtaXRcXFwiIGNsYXNzPVxcXCJ3My1idG4gdzMtYmx1ZSB3My1iYXItaXRlbSB3My1yaWdodFxcXCI+QWRkPC9idXR0b24+XHRcdFx0XFxyXFxuXFxyXFxuXHRcdDwvZm9ybT5cXHJcXG5cdDwvZGl2Plx0XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXHRcdFwiLFxyXG5cdFx0XHRkYXRhOiB7dXNlcnM6IFtdfSxcclxuXHRcdFx0ZXZlbnRzOiB7XHJcblxyXG5cdFx0XHRcdG9uQWRkVXNlcjogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQWRkVXNlcicpXHJcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRcdFx0XHR2YXIgZGF0YSA9ICQodGhpcykuZ2V0Rm9ybURhdGEoKVxyXG5cdFx0XHRcdFx0JCh0aGlzKS5nZXQoMCkucmVzZXQoKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnc3VibWl0JywgZGF0YSlcclxuXHRcdFx0XHRcdGh0dHAucG9zdCgnL2FwaS91c2VycycsIGRhdGEpLnRoZW4obG9hZFVzZXJzKVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25EZWxldGVVc2VyOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25EZWxldGVVc2VyJylcclxuXHRcdFx0XHRcdHZhciB1c2VyID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLmRhdGEoJ3VzZXInKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndXNlcicsIHVzZXIpXHJcblx0XHRcdFx0XHQkJC5zaG93Q29uZmlybSgnQXJlIHlvdXIgc3VyZSA/JywgJ0luZm9ybWF0aW9uJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdGh0dHAuZGVsZXRlKGAvYXBpL3VzZXJzLyR7dXNlcn1gKS50aGVuKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGxvYWRVc2VycygpXHJcblx0XHRcdFx0XHRcdFx0ZXZlbnRzLmVtaXQoJ3VzZXJEZWxldGVkJywgdXNlcilcclxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25Vc2VyQ2xpY2tlZDogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uVXNlckNsaWNrZWQnKVxyXG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxyXG5cdFx0XHRcdFx0Y3RybC5zY29wZS51bC5maW5kKCdsaScpLnJlbW92ZUNsYXNzKCd3My1ibHVlJylcclxuXHRcdFx0XHRcdHZhciAkbGkgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJylcclxuXHRcdFx0XHRcdCRsaS5hZGRDbGFzcygndzMtYmx1ZScpXHJcblx0XHRcdFx0XHR2YXIgdXNlciA9ICRsaS5kYXRhKCd1c2VyJylcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3VzZXInLCB1c2VyKVxyXG5cdFx0XHRcdFx0ZXZlbnRzLmVtaXQoJ3VzZXJTZWxlY3RlZCcsIHVzZXIpXHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0pXHRcdFx0XHJcblxyXG5cclxuXHRcdGZ1bmN0aW9uIGxvYWRVc2VycygpIHtcclxuXHRcdFx0aHR0cC5nZXQoJy9hcGkvdXNlcnMnKS50aGVuKGZ1bmN0aW9uKHVzZXJzKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ2xvYWRVc2VycycsIHVzZXJzKVxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7dXNlcnM6IHVzZXJzfSlcclxuXHRcdFx0fSlcdFx0XHRcclxuXHRcdH1cclxuXHJcblx0XHRsb2FkVXNlcnMoKVxyXG5cclxuXHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXHJcblxyXG5cclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG4iXX0=

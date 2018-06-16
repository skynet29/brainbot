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

			return {
				dispose: function() {
					client.unregister('launcherStatus.*', onLauncherStatus)
					//client.offEvent('disconnected', onDisconnected)
				}
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

			return {
				dispose: function() {
					client.unregister('masterClients', onMasterClients)
				}
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
						'lastModif': 'Last Modified',
						'data': 'Data'
					}
				},
				nbMsg: 0,
				dataVisible: false			
			}



			var ctrl = $$.viewController(elt, {
				template: "<div class=\"bn-flex-col bn-flex-1\">\r\n	<div class=\"bn-flex-row bn-space-between\">\r\n		<div class=\"bn-container filters\" bn-event=\"input.filter: onFilterChange\">\r\n			<input type=\"text\" placeholder=\"Filter topic\" data-filter=\"topic\" class=\"filter\">\r\n			<input type=\"text\" placeholder=\"Filter source\" data-filter=\"src\" class=\"filter\">					\r\n		</div>\r\n		<div>Messages Number:<span bn-text=\"nbMsg\"></span></div>\r\n	</div>\r\n	<div class=\"bn-container\">\r\n		<input type=\"checkbox\" class=\"w3-check\" bn-event=\"click: onShowData\" bn-val=\"dataVisible\"><label> Show Data</label>\r\n	</div>\r\n\r\n	<div bn-control=\"FilteredTableControl\" bn-options=\"tableConfig\" class=\"bn-flex-1 bn-no-overflow\" bn-iface=\"iface\">	\r\n</div>\r\n",
				data: model, 
				events: 
				{
					onShowData: function(ev) {
						console.log('onShowData')
						model.dataVisible = $(this).prop('checked')
						tbody.find('pre').bnVisible(model.dataVisible)
					},
					onFilterChange: function(ev) {
						console.log('onFilterChange')
						var filter = $(this).data('filter')
						filters[filter] = $(this).val()
						ctrl.scope.iface.setFilters(filters)
						updateTopicNumber()
						tbody.find('pre').bnVisible(model.dataVisible)				
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
				ctrl.scope.iface.addItem(msg.topic, getItemData(msg))
				updateTopicNumber()			
			}

			client.register('**', true, onMessage)

			client.onClose = function() {
				ctrl.scope.iface.removeAllItems()
			}


			
			function getItemData(msg) {
				var data = $(`<pre bn-prop="hidden: hidden" class="bn-no-margin">${JSON.stringify(msg.data, null, 4)}</pre>`)
					.processTemplate({hidden: !model.dataVisible})

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

			function setUser(id) {
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

			return {
				setUser: setUser,
				getUser: function() {
					return user
				},
				hide: function() {
					ctrl.setData({visible: false})
				}
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
				ctrl.setData({users: users})
			})			
		}

		loadUsers()

		return {
			on: events.on.bind(events)
		}
	}

});



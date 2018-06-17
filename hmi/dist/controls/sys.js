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



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hc3Rlci1hZ2VudHMuanMiLCJtYXN0ZXItY2xpZW50cy5qcyIsIm1hc3Rlci1oaXN0LmpzIiwidXNlci1kZXRhaWxzLmpzIiwidXNlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJzeXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnTWFzdGVyQWdlbnRzQ29udHJvbCcsIHtcclxuXHRcdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLCBcclxuXHJcblx0XHRcblx0bGliOiAnc3lzJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50KSB7XHJcblxyXG5cdFx0XHRsZXQgaG9zdHMgPSB7fVxyXG5cclxuXHRcdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxyXFxuICAgIDx0YWJsZSBjbGFzcz1cXFwidzMtdGFibGUtYWxsIHczLXNtYWxsXFxcIj5cXHJcXG4gICAgICAgIDx0aGVhZD5cXHJcXG4gICAgICAgICAgICA8dHIgY2xhc3M9XFxcInczLWdyZWVuXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHRoPkFnZW50IE5hbWU8L3RoPlxcclxcbiAgICAgICAgICAgICAgICA8dGg+SG9zdCBOYW1lPC90aD5cXHJcXG4gICAgICAgICAgICAgICAgPHRoPlN0YXRlPC90aD5cXHJcXG4gICAgICAgICAgICAgICAgPHRoPlBpZDwvdGg+XFxyXFxuICAgICAgICAgICAgICAgIDx0aD5BY3Rpb248L3RoPlxcclxcbiAgICAgICAgICAgIDwvdHI+XFxyXFxuICAgICAgICA8L3RoZWFkPlxcclxcbiAgICAgICAgPHRib2R5IGJuLWVhY2g9XFxcImEgb2YgYWdlbnRzXFxcIiBibi1ldmVudD1cXFwiY2xpY2suYWN0aW9uU3RhcnQ6IG9uQWN0aW9uU3RhcnQsIGNsaWNrLmFjdGlvblN0b3A6IG9uQWN0aW9uU3RvcCwgY2xpY2suYWN0aW9uU3RvcEZvcmNlOiBvbkFjdGlvblN0b3BGb3JjZVxcXCI+XFxyXFxuICBcdFx0XHQ8dHI+XFxyXFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYS5hZ2VudFxcXCI+PC90ZD5cXHJcXG5cdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJhLmhvc3RcXFwiPjwvdGQ+XFxyXFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYS5zdGF0ZVxcXCI+PC90ZD5cXHJcXG5cdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJhLnBpZFxcXCI+PC90ZD5cXHJcXG5cdFx0XHRcdDx0ZCBibi1kYXRhPVxcXCJhZ2VudDogYS5hZ2VudFxcXCI+XFxyXFxuXHRcdFx0XHRcdDxidXR0b24gY2xhc3M9XFxcImFjdGlvblN0YXJ0IHczLWJ0biB3My1ibHVlXFxcIiBibi1zaG93PVxcXCJhLnN0YXJ0XFxcIj5TdGFydDwvYnV0dG9uPlxcclxcblx0XHRcdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJhY3Rpb25TdG9wIHczLWJ0biB3My1ibHVlXFxcIiAgYm4tc2hvdz1cXFwiIWEuc3RhcnRcXFwiPlN0b3A8L2J1dHRvbj5cXHJcXG5cdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYWN0aW9uU3RvcEZvcmNlIHczLWJ0biB3My1yZWRcXFwiIGJuLXNob3c9XFxcIiFhLnN0YXJ0XFxcIj5LaWxsPC9idXR0b24+XFxyXFxuXHRcdFx0XHQ8L3RkPlxcclxcblx0XHRcdDwvdHI+ICAgICAgXHRcXHJcXG5cXHJcXG4gICAgICAgIDwvdGJvZHk+XFxyXFxuICAgIDwvdGFibGU+XFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdFx0ZGF0YToge2FnZW50czogW119LFxyXG5cdFx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdFx0b25BY3Rpb25TdGFydDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHZhciBhZ2VudCA9ICQodGhpcykuY2xvc2VzdCgndGQnKS5kYXRhKCdhZ2VudCcpXHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdhY3Rpb25TdGFydCcsIGFnZW50KVxyXG5cdFx0XHRcdFx0XHRjbGllbnQuZW1pdCgnbGF1bmNoZXJTdGFydEFnZW50JywgYWdlbnQpXHRcdFx0XHRcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRvbkFjdGlvblN0b3A6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYWdlbnQgPSAkKHRoaXMpLmNsb3Nlc3QoJ3RkJykuZGF0YSgnYWdlbnQnKVxyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnYWN0aW9uU3RvcCcsIGFnZW50KVxyXG5cdFx0XHRcdFx0XHRjbGllbnQuZW1pdCgnbGF1bmNoZXJTdG9wQWdlbnQnLCBhZ2VudClcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdG9uQWN0aW9uU3RvcEZvcmNlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGFnZW50ID0gJCh0aGlzKS5jbG9zZXN0KCd0ZCcpLmRhdGEoJ2FnZW50JylcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2FjdGlvblN0b3BGb3JjZScsIGFnZW50KVxyXG5cdFx0XHRcdFx0XHRjbGllbnQuZW1pdCgnbGF1bmNoZXJTdG9wQWdlbnQnLCB7YWdlbnQ6IGFnZW50LCBmb3JjZTogdHJ1ZX0pXHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHRcdFxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0Y3RybC5lbHQuYWRkQ2xhc3MoJ2JuLWZsZXgtY29sJylcclxuXHRcdFx0ZGlzcFRhYmxlKClcclxuXHJcblx0XHRcdFxyXG5cdFx0XHRmdW5jdGlvbiBkaXNwVGFibGUoKSB7XHJcblx0XHRcdFx0dmFyIGRhdGEgPSBbXVxyXG5cclxuXHRcdFx0XHRmb3IodmFyIGhvc3ROYW1lIGluIGhvc3RzKSB7XHJcblx0XHRcdFx0XHR2YXIgYWdlbnRzID0gaG9zdHNbaG9zdE5hbWVdXHJcblx0XHRcdFx0XHRmb3IodmFyIGFnZW50IGluIGFnZW50cykge1xyXG5cdFx0XHRcdFx0XHR2YXIgaW5mbyA9IGFnZW50c1thZ2VudF1cclxuXHRcdFx0XHRcdFx0ZGF0YS5wdXNoKHtcclxuXHRcdFx0XHRcdFx0XHRwaWQ6IGluZm8ucGlkLFxyXG5cdFx0XHRcdFx0XHRcdGFnZW50OiBhZ2VudCxcclxuXHRcdFx0XHRcdFx0XHRzdGF0ZTogaW5mby5zdGF0ZSxcclxuXHRcdFx0XHRcdFx0XHRzdGFydDogaW5mby5waWQgPT0gMCxcclxuXHRcdFx0XHRcdFx0XHRob3N0OiBob3N0TmFtZVx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7YWdlbnRzOiBkYXRhfSlcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gb25MYXVuY2hlclN0YXR1cyhtc2cpIHtcclxuXHRcdFx0XHR2YXIgaG9zdE5hbWUgPSBtc2cudG9waWMuc3BsaXQoJy4nKVsxXVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2hvc3QnLCBob3N0TmFtZSlcclxuXHRcdFx0XHRob3N0c1tob3N0TmFtZV0gPSBtc2cuZGF0YVxyXG5cdFx0XHRcdGRpc3BUYWJsZSgpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNsaWVudC5yZWdpc3RlcignbGF1bmNoZXJTdGF0dXMuKicsIHRydWUsIG9uTGF1bmNoZXJTdGF0dXMpXHJcblxyXG5cdFx0XHRjbGllbnQub25DbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7YWdlbnRzOiBbXX0pXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0ZGlzcG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRjbGllbnQudW5yZWdpc3RlcignbGF1bmNoZXJTdGF0dXMuKicsIG9uTGF1bmNoZXJTdGF0dXMpXHJcblx0XHRcdFx0XHQvL2NsaWVudC5vZmZFdmVudCgnZGlzY29ubmVjdGVkJywgb25EaXNjb25uZWN0ZWQpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ01hc3RlckNsaWVudHNDb250cm9sJywge1xyXG5cclxuXHRcdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLCBcclxuXHJcblx0XHRcblx0bGliOiAnc3lzJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50KSB7XHJcblxyXG5cdFx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXHJcXG4gICAgPHRhYmxlIGNsYXNzPVxcXCJ3My10YWJsZS1hbGwgdzMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHRoZWFkPlxcclxcbiAgICAgICAgICAgIDx0ciBjbGFzcz1cXFwidzMtZ3JlZW5cXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8dGg+TmFtZTwvdGg+XFxyXFxuICAgICAgICAgICAgICAgIDx0aD5SZWdpc3RlcmVkIFRvcGljczwvdGg+XFxyXFxuICAgICAgICAgICAgICAgIDx0aD5SZWdpc3RlcmVkIFNlcnZpY2VzPC90aD5cXHJcXG4gICAgICAgICAgICA8L3RyPlxcclxcbiAgICAgICAgPC90aGVhZD5cXHJcXG4gICAgICAgIDx0Ym9keSBibi1lYWNoPVxcXCJjIG9mIGNsaWVudHNcXFwiPlxcclxcblx0XHRcdDx0cj5cXHJcXG5cdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJjLm5hbWVcXFwiPjwvdGQ+XFxyXFxuXHRcdFx0XHQ8dGQgYm4taHRtbD1cXFwiYy50b3BpY3NcXFwiPjwvdGQ+XFxyXFxuICAgICAgICAgICAgICAgIDx0ZCBibi1odG1sPVxcXCJjLnNlcnZpY2VzXFxcIj48L3RkPlxcclxcblx0XHRcdDwvdHI+ICAgICAgICBcdFxcclxcbiAgICAgICAgPC90Ym9keT5cXHJcXG4gICAgPC90YWJsZT5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0XHRjbGllbnRzOiBbXVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdGZ1bmN0aW9uIG9uTWFzdGVyQ2xpZW50cyhtc2cpIHtcclxuXHRcdFx0XHRjb25zdCBkYXRhID0gbXNnLmRhdGFcclxuXHRcdFx0XHRsZXQgYWdlbnRzID0gT2JqZWN0LmtleXMoZGF0YSkuc29ydCgpXHJcblxyXG5cdFx0XHRcdHZhciBjbGllbnRzID0gYWdlbnRzLm1hcChmdW5jdGlvbihhZ2VudCkge1xyXG5cclxuXHRcdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdHRvcGljczogZGF0YVthZ2VudF0ucmVnaXN0ZXJlZFRvcGljcy5qb2luKCc8YnI+JyksXHJcblx0XHRcdFx0XHRcdHNlcnZpY2VzOiBkYXRhW2FnZW50XS5yZWdpc3RlcmVkU2VydmljZXMuam9pbignPGJyPicpLFxyXG5cdFx0XHRcdFx0XHRuYW1lOiBhZ2VudFxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9KVx0XHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtjbGllbnRzOiBjbGllbnRzfSlcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNsaWVudC5yZWdpc3RlcignbWFzdGVyQ2xpZW50cycsIHRydWUsIG9uTWFzdGVyQ2xpZW50cylcclxuXHJcblxyXG5cdFx0XHRjbGllbnQub25DbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7Y2xpZW50czogW119KVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0Y2xpZW50LnVucmVnaXN0ZXIoJ21hc3RlckNsaWVudHMnLCBvbk1hc3RlckNsaWVudHMpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHRcdFxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxuXHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ01hc3Rlckhpc3RDb250cm9sJywge1xyXG5cclxuXHRcdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLFxyXG5cclxuXHRcdFxuXHRsaWI6ICdzeXMnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcclxuXHJcblx0XHRcdHZhciBtb2RlbCA9IHtcclxuXHRcdFx0XHR0YWJsZUNvbmZpZzoge1xyXG5cdFx0XHRcdFx0Y29sdW1uczoge1xyXG5cdFx0XHRcdFx0XHQndG9waWMnOiAnVG9waWMnLFxyXG5cdFx0XHRcdFx0XHQnc3JjJzogJ1NvdXJjZScsXHJcblx0XHRcdFx0XHRcdCdsYXN0TW9kaWYnOiAnTGFzdCBNb2RpZmllZCcsXHJcblx0XHRcdFx0XHRcdCdkYXRhJzogJ0RhdGEnXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRuYk1zZzogMCxcclxuXHRcdFx0XHRkYXRhVmlzaWJsZTogZmFsc2VcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1zcGFjZS1iZXR3ZWVuXFxcIj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tY29udGFpbmVyIGZpbHRlcnNcXFwiIGJuLWV2ZW50PVxcXCJpbnB1dC5maWx0ZXI6IG9uRmlsdGVyQ2hhbmdlXFxcIj5cXHJcXG5cdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIkZpbHRlciB0b3BpY1xcXCIgZGF0YS1maWx0ZXI9XFxcInRvcGljXFxcIiBjbGFzcz1cXFwiZmlsdGVyXFxcIj5cXHJcXG5cdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIkZpbHRlciBzb3VyY2VcXFwiIGRhdGEtZmlsdGVyPVxcXCJzcmNcXFwiIGNsYXNzPVxcXCJmaWx0ZXJcXFwiPlx0XHRcdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHRcdDxkaXY+TWVzc2FnZXMgTnVtYmVyOjxzcGFuIGJuLXRleHQ9XFxcIm5iTXNnXFxcIj48L3NwYW4+PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcImJuLWNvbnRhaW5lclxcXCI+XFxyXFxuXHRcdDxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgY2xhc3M9XFxcInczLWNoZWNrXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uU2hvd0RhdGFcXFwiIGJuLXZhbD1cXFwiZGF0YVZpc2libGVcXFwiPjxsYWJlbD4gU2hvdyBEYXRhPC9sYWJlbD5cXHJcXG5cdDwvZGl2Plxcclxcblxcclxcblx0PGRpdiBibi1jb250cm9sPVxcXCJGaWx0ZXJlZFRhYmxlQ29udHJvbFxcXCIgYm4tb3B0aW9ucz1cXFwidGFibGVDb25maWdcXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgYm4tbm8tb3ZlcmZsb3dcXFwiIGJuLWlmYWNlPVxcXCJpZmFjZVxcXCI+XHRcXHJcXG48L2Rpdj5cXHJcXG5cIixcclxuXHRcdFx0XHRkYXRhOiBtb2RlbCwgXHJcblx0XHRcdFx0ZXZlbnRzOiBcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHRvblNob3dEYXRhOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25TaG93RGF0YScpXHJcblx0XHRcdFx0XHRcdG1vZGVsLmRhdGFWaXNpYmxlID0gJCh0aGlzKS5wcm9wKCdjaGVja2VkJylcclxuXHRcdFx0XHRcdFx0dGJvZHkuZmluZCgncHJlJykuYm5WaXNpYmxlKG1vZGVsLmRhdGFWaXNpYmxlKVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdG9uRmlsdGVyQ2hhbmdlOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25GaWx0ZXJDaGFuZ2UnKVxyXG5cdFx0XHRcdFx0XHR2YXIgZmlsdGVyID0gJCh0aGlzKS5kYXRhKCdmaWx0ZXInKVxyXG5cdFx0XHRcdFx0XHRmaWx0ZXJzW2ZpbHRlcl0gPSAkKHRoaXMpLnZhbCgpXHJcblx0XHRcdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2Uuc2V0RmlsdGVycyhmaWx0ZXJzKVxyXG5cdFx0XHRcdFx0XHR1cGRhdGVUb3BpY051bWJlcigpXHJcblx0XHRcdFx0XHRcdHRib2R5LmZpbmQoJ3ByZScpLmJuVmlzaWJsZShtb2RlbC5kYXRhVmlzaWJsZSlcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdGxldCBmaWx0ZXJzID0ge31cclxuXHJcblx0XHRcdHZhciB0Ym9keSA9IGN0cmwuZWx0LmZpbmQoJ3Rib2R5JylcclxuXHJcblx0XHRcdGZ1bmN0aW9uIHVwZGF0ZVRvcGljTnVtYmVyKCkge1xyXG5cdFx0XHRcdHZhciBuYk1zZyA9IHRib2R5LmZpbmQoJ3RyJykubGVuZ3RoXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtuYk1zZzogbmJNc2d9KVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gb25NZXNzYWdlKG1zZykge1xyXG5cdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2UuYWRkSXRlbShtc2cudG9waWMsIGdldEl0ZW1EYXRhKG1zZykpXHJcblx0XHRcdFx0dXBkYXRlVG9waWNOdW1iZXIoKVx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjbGllbnQucmVnaXN0ZXIoJyoqJywgdHJ1ZSwgb25NZXNzYWdlKVxyXG5cclxuXHRcdFx0Y2xpZW50Lm9uQ2xvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjdHJsLnNjb3BlLmlmYWNlLnJlbW92ZUFsbEl0ZW1zKClcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdFxyXG5cdFx0XHRmdW5jdGlvbiBnZXRJdGVtRGF0YShtc2cpIHtcclxuXHRcdFx0XHR2YXIgZGF0YSA9ICQoYDxwcmUgYm4tcHJvcD1cImhpZGRlbjogaGlkZGVuXCIgY2xhc3M9XCJibi1uby1tYXJnaW5cIj4ke0pTT04uc3RyaW5naWZ5KG1zZy5kYXRhLCBudWxsLCA0KX08L3ByZT5gKVxyXG5cdFx0XHRcdFx0LnByb2Nlc3NUZW1wbGF0ZSh7aGlkZGVuOiAhbW9kZWwuZGF0YVZpc2libGV9KVxyXG5cclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0dG9waWM6IG1zZy50b3BpYyxcclxuXHRcdFx0XHRcdHNyYzogbXNnLnNyYyxcclxuXHRcdFx0XHRcdGxhc3RNb2RpZjogbmV3IERhdGUobXNnLnRpbWUpLnRvTG9jYWxlU3RyaW5nKCksXHJcblx0XHRcdFx0XHRkYXRhOiBkYXRhXHRcdFx0XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0Y2xpZW50LnVucmVnaXN0ZXIoJyoqJywgb25NZXNzYWdlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdVc2VyRGV0YWlsc0NvbnRyb2wnLCB7XHJcblxyXG5cdFx0ZGVwczogWydIdHRwU2VydmljZSddLFxyXG5cdFx0aWZhY2U6ICdzZXRVc2VyKHVzZXJOYW1lKTtnZXRVc2VyKCk7aGlkZSgpJyxcclxuXHJcblx0XHRcblx0bGliOiAnc3lzJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgaHR0cCkge1xyXG5cclxuXHRcdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJtYWluXFxcIiBibi1zaG93PVxcXCJ2aXNpYmxlXFxcIj5cXHJcXG5cXHJcXG5cdDxoMj5Vc2VyIERldGFpbHM8L2gyPlxcclxcblx0PHRhYmxlIGNsYXNzPVxcXCJpbmZvIHczLXRhYmxlIHczLWJvcmRlclxcXCIgYm4tYmluZD1cXFwiaW5mb1xcXCI+XFxyXFxuXHRcdDx0cj5cXHJcXG5cdFx0XHQ8dGQ+VXNlcjwvdGQ+XFxyXFxuXHRcdFx0PHRkPjxzdHJvbmcgYm4tdGV4dD1cXFwidXNlclxcXCI+PC9zdHJvbmc+PC90ZD5cXHJcXG5cdFx0PC90cj5cXHJcXG5cdFx0PHRyPlxcclxcblx0XHRcdDx0ZD5QYXNzd29yZDwvdGQ+XFxyXFxuXHRcdFx0PHRkPjxpbnB1dCBjbGFzcz1cXFwicHdkIHczLWlucHV0IHczLWJvcmRlclxcXCIgdHlwZT1cXFwidGV4dFxcXCIgYm4tdmFsPVxcXCJwd2RcXFwiIG5hbWU9XFxcInB3ZFxcXCI+PC90ZD5cXHJcXG5cdFx0PC90cj5cXHJcXG5cdDwvdGFibGU+XHRcdFx0XHRcXHJcXG5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXHJcXG5cdFx0PHRhYmxlIGNsYXNzPVxcXCJhcHBzIHczLXRhYmxlLWFsbCB3My1zbWFsbFxcXCI+XFxyXFxuXHRcdFx0PHRoZWFkPlxcclxcblx0XHRcdFx0PHRyIGNsYXNzPVxcXCJ3My1ncmVlblxcXCI+XFxyXFxuXHRcdFx0XHRcdDx0aD5BcHAgTmFtZTwvdGg+XFxyXFxuXHRcdFx0XHRcdDx0aD5BbGxvd2VkPC90aD5cXHJcXG5cdFx0XHRcdFx0PHRoPkNvbmZpZ3VyYXRpb248L3RoPlx0XHRcdFxcclxcblx0XHRcdFx0PC90cj5cXHJcXG5cXHJcXG5cdFx0XHQ8L3RoZWFkPlxcclxcblx0XHRcdDx0Ym9keSBibi1lYWNoPVxcXCJhcHAgb2YgYXBwc1xcXCIgYm4tYmluZD1cXFwidGJvZHlcXFwiPlxcclxcblx0XHRcdFx0PHRyPlxcclxcblx0XHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYXBwLmFwcE5hbWVcXFwiIG5hbWU9XFxcIm5hbWVcXFwiIGJuLXZhbD1cXFwiYXBwLmFwcE5hbWVcXFwiPjwvdGQ+XFxyXFxuXHRcdFx0XHRcdDx0ZD48aW5wdXQgbmFtZT1cXFwiZW5hYmxlZFxcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGJuLXByb3A9XFxcImNoZWNrZWQ6IGFwcC5hbGxvd2VkXFxcIj48L3RkPlxcclxcblx0XHRcdFx0XHQ8dGQ+PHNlbGVjdCBuYW1lPVxcXCJjb25maWdcXFwiICBjbGFzcz1cXFwidzMtYm9yZGVyIGJuLWZpbGxcXFwiIGJuLWxpc3Q9XFxcImFwcC5jb25maWdzXFxcIiBibi12YWw9XFxcImFwcC5zZWxDb25maWdcXFwiPjwvc2VsZWN0PjwvdGQ+XFxyXFxuXHRcdFx0XHQ8L3RyPlx0XHRcdFx0XFxyXFxuXHRcdFx0PC90Ym9keT5cXHJcXG5cdFx0PC90YWJsZT5cXHJcXG5cdDwvZGl2Plxcclxcblx0PHA+PGJ1dHRvbiBjbGFzcz1cXFwiYXBwbHkgdzMtYnRuIHczLWJsdWVcXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25BcHBseVxcXCI+QXBwbHkgY2hhbmdlczwvYnV0dG9uPjwvcD5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0XHR1c2VyOiAnJyxcclxuXHRcdFx0XHRcdHB3ZDogJycsXHJcblx0XHRcdFx0XHRhcHBzOiBbXSxcclxuXHRcdFx0XHRcdHZpc2libGU6IGZhbHNlXHJcblx0XHRcdFx0fSxcdFxyXG5cdFx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdFx0b25BcHBseTogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ0FwcGx5JywgZ2V0SW5mb3MoKSlcclxuXHRcdFx0XHRcdFx0aHR0cC5wdXQoYC9hcGkvdXNlcnMvJHt1c2VyfWAsIGdldEluZm9zKCkpLnRoZW4oKCkgPT4ge1xyXG5cdFx0XHRcdFx0XHRcdCQodGhpcykubm90aWZ5KCdDb25maWcgc2F2ZWQgc3VjY2Vzc2Z1bGx5Jywge3Bvc2l0aW9uOiAncmlnaHQgdG9wJywgY2xhc3NOYW1lOiAnc3VjY2Vzcyd9KVxyXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblxyXG5cclxuXHRcdFx0dmFyIHVzZXJcclxuXHRcdFx0dmFyIF9hcHBzID0gW11cclxuXHJcblxyXG5cclxuXHRcdFx0aHR0cC5nZXQoJy9hcGkvYXBwcycpLnRoZW4oZnVuY3Rpb24oYXBwcykge1xyXG5cdFx0XHRcdF9hcHBzID0gYXBwc1xyXG5cclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdGZ1bmN0aW9uIHNldFVzZXIoaWQpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW1VzZXJEZXRhaWxzQ29udHJvbF0gc2V0VXNlcicsIGlkKVxyXG5cdFx0XHRcdHVzZXIgPSBpZFxyXG5cdFx0XHRcdGdldFVzZXJEZXRhaWxzKGlkKVxyXG5cdFx0XHRcdC8vbWFpbkVsdC5zaG93KClcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBnZXRJbmZvcygpIHtcclxuXHRcdFx0XHR2YXIgaW5mb3MgPSBjdHJsLnNjb3BlLmluZm8uZ2V0Rm9ybURhdGEoKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdpbmZvcycsIGluZm9zKVxyXG5cclxuXHRcdFx0XHR2YXIgYWxsb3dlZEFwcHMgPSB7fVxyXG5cdFx0XHRcdGN0cmwuc2NvcGUudGJvZHkuZmluZCgndHInKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dmFyIGFwcEluZm9zID0gJCh0aGlzKS5nZXRGb3JtRGF0YSgpXHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnYXBwSW5mb3MnLCBhcHBJbmZvcylcclxuXHRcdFx0XHRcdGlmIChhcHBJbmZvcy5lbmFibGVkKSB7XHJcblx0XHRcdFx0XHRcdGFsbG93ZWRBcHBzW2FwcEluZm9zLm5hbWVdID0gKGFwcEluZm9zLmNvbmZpZyA9PSAnbm9uZScpID8gdHJ1ZSA6IGFwcEluZm9zLmNvbmZpZ1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdHB3ZDogaW5mb3MucHdkLFxyXG5cdFx0XHRcdFx0YWxsb3dlZEFwcHM6IGFsbG93ZWRBcHBzXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBnZXRVc2VyRGV0YWlscyh1c2VyKSB7XHJcblx0XHRcdFx0aHR0cC5nZXQoYC9hcGkvdXNlcnMvJHt1c2VyfWApLnRoZW4oZnVuY3Rpb24odXNlckRldGFpbHMpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgYWxsb3dlZEFwcHMgPSB1c2VyRGV0YWlscy5hbGxvd2VkQXBwc1xyXG5cclxuXHRcdFx0XHRcdHZhciBhcHBzID0gJCQub2JqMkFycmF5KF9hcHBzKS5tYXAoZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYXBwTmFtZSA9IGl0ZW0ua2V5XHJcblxyXG5cdFx0XHRcdFx0XHR2YXIgY29uZmlnID0gYWxsb3dlZEFwcHNbYXBwTmFtZV1cclxuXHJcblx0XHRcdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdFx0YXBwTmFtZTogYXBwTmFtZSxcclxuXHRcdFx0XHRcdFx0XHRhbGxvd2VkOiAoY29uZmlnICE9IHVuZGVmaW5lZCksXHJcblx0XHRcdFx0XHRcdFx0c2VsQ29uZmlnOiAodHlwZW9mIGNvbmZpZyA9PSAnc3RyaW5nJykgPyBjb25maWcgOiAnbm9uZScsXHJcblx0XHRcdFx0XHRcdFx0Y29uZmlnczogWydub25lJ10uY29uY2F0KGl0ZW0udmFsdWUpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pXHRcclxuXHRcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdFx0dXNlcjogdXNlcixcclxuXHRcdFx0XHRcdFx0cHdkOiB1c2VyRGV0YWlscy5wd2QsXHJcblx0XHRcdFx0XHRcdHZpc2libGU6IHRydWUsXHJcblx0XHRcdFx0XHRcdGFwcHM6IGFwcHNcclxuXHRcdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdH0pXHRcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0c2V0VXNlcjogc2V0VXNlcixcclxuXHRcdFx0XHRnZXRVc2VyOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHJldHVybiB1c2VyXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRoaWRlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7dmlzaWJsZTogZmFsc2V9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdVc2Vyc0NvbnRyb2wnLCB7XHJcblx0ZGVwczogWydIdHRwU2VydmljZSddLFxyXG5cdGV2ZW50czogJ3VzZXJTZWxlY3RlZCx1c2VyRGVsZXRlZCcsXHJcblx0XG5cdGxpYjogJ3N5cycsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGh0dHApIHtcclxuXHJcblx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxyXFxuXHQ8aDI+UmVnaXN0ZXJlZCBVc2VyczwvaDI+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxyXFxuXHRcdDx1bCBjbGFzcz1cXFwidzMtdWwgdzMtYm9yZGVyIHczLXdoaXRlXFxcIiBibi1lYWNoPVxcXCJ1c2VyIG9mIHVzZXJzXFxcIiBibi1ldmVudD1cXFwiY2xpY2suZGVsZXRlOiBvbkRlbGV0ZVVzZXIsIGNsaWNrLnVzZXI6IG9uVXNlckNsaWNrZWRcXFwiIGJuLWJpbmQ9XFxcInVsXFxcIj5cXHJcXG5cdFx0XHQ8bGkgY2xhc3M9XFxcInczLWJhclxcXCIgYm4tZGF0YT1cXFwidXNlcjogdXNlclxcXCI+XFxyXFxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cXFwidzMtYnV0dG9uIHczLXJpZ2h0IGRlbGV0ZVxcXCIgdGl0bGU9XFxcIkRlbGV0ZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXRyYXNoXFxcIj48L2k+PC9zcGFuPlxcclxcblx0XHRcdFx0PGRpdiBjbGFzcz1cXFwidzMtYmFyLWl0ZW1cXFwiPlxcclxcblx0XHRcdFx0XHQ8YSBocmVmPVxcXCIjXFxcIiBibi10ZXh0PVxcXCJ1c2VyXFxcIiBjbGFzcz1cXFwidXNlclxcXCI+PC9hPlxcclxcblx0XHRcdFx0PC9kaXY+XFxyXFxuXHRcdFx0PC9saT5cXHJcXG5cdFx0PC91bD5cXHJcXG5cdDwvZGl2Plxcclxcblxcclxcblx0PGRpdj5cXHJcXG5cdFx0PGZvcm0gYm4tZXZlbnQ9XFxcInN1Ym1pdDogb25BZGRVc2VyXFxcIj5cXHJcXG5cdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcInVzZXJuYW1lXFxcIiBuYW1lPVxcXCJ1c2VyTmFtZVxcXCIgcmVxdWlyZWQgYXV0b2NvbXBsZXRlPVxcXCJvZmZcXFwiIGNsYXNzPVxcXCJ3My1pbnB1dCB3My1ib3JkZXJcXFwiPlxcclxcblx0XHRcdDxidXR0b24gdHlwZT1cXFwic3VibWl0XFxcIiBjbGFzcz1cXFwidzMtYnRuIHczLWJsdWUgdzMtYmFyLWl0ZW0gdzMtcmlnaHRcXFwiPkFkZDwvYnV0dG9uPlx0XHRcdFxcclxcblxcclxcblx0XHQ8L2Zvcm0+XFxyXFxuXHQ8L2Rpdj5cdFxcclxcbjwvZGl2Plxcclxcblxcclxcblx0XHRcIixcclxuXHRcdFx0ZGF0YToge3VzZXJzOiBbXX0sXHJcblx0XHRcdGV2ZW50czoge1xyXG5cclxuXHRcdFx0XHRvbkFkZFVzZXI6IGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkFkZFVzZXInKVxyXG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxyXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSAkKHRoaXMpLmdldEZvcm1EYXRhKClcclxuXHRcdFx0XHRcdCQodGhpcykuZ2V0KDApLnJlc2V0KClcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3N1Ym1pdCcsIGRhdGEpXHJcblx0XHRcdFx0XHRodHRwLnBvc3QoJy9hcGkvdXNlcnMnLCBkYXRhKS50aGVuKGxvYWRVc2VycylcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uRGVsZXRlVXNlcjogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uRGVsZXRlVXNlcicpXHJcblx0XHRcdFx0XHR2YXIgdXNlciA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5kYXRhKCd1c2VyJylcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3VzZXInLCB1c2VyKVxyXG5cdFx0XHRcdFx0JCQuc2hvd0NvbmZpcm0oJ0FyZSB5b3VyIHN1cmUgPycsICdJbmZvcm1hdGlvbicsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRodHRwLmRlbGV0ZShgL2FwaS91c2Vycy8ke3VzZXJ9YCkudGhlbihmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRsb2FkVXNlcnMoKVxyXG5cdFx0XHRcdFx0XHRcdGV2ZW50cy5lbWl0KCd1c2VyRGVsZXRlZCcsIHVzZXIpXHJcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcclxuXHRcdFx0XHRcdH0pXHRcdFx0XHRcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uVXNlckNsaWNrZWQ6IGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblVzZXJDbGlja2VkJylcclxuXHRcdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcclxuXHRcdFx0XHRcdGN0cmwuc2NvcGUudWwuZmluZCgnbGknKS5yZW1vdmVDbGFzcygndzMtYmx1ZScpXHJcblx0XHRcdFx0XHR2YXIgJGxpID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpXHJcblx0XHRcdFx0XHQkbGkuYWRkQ2xhc3MoJ3czLWJsdWUnKVxyXG5cdFx0XHRcdFx0dmFyIHVzZXIgPSAkbGkuZGF0YSgndXNlcicpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd1c2VyJywgdXNlcilcclxuXHRcdFx0XHRcdGV2ZW50cy5lbWl0KCd1c2VyU2VsZWN0ZWQnLCB1c2VyKVx0XHRcdFx0XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcdFxyXG5cclxuXHJcblx0XHRmdW5jdGlvbiBsb2FkVXNlcnMoKSB7XHJcblx0XHRcdGh0dHAuZ2V0KCcvYXBpL3VzZXJzJykudGhlbihmdW5jdGlvbih1c2Vycykge1xyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7dXNlcnM6IHVzZXJzfSlcclxuXHRcdFx0fSlcdFx0XHRcclxuXHRcdH1cclxuXHJcblx0XHRsb2FkVXNlcnMoKVxyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdG9uOiBldmVudHMub24uYmluZChldmVudHMpXHJcblx0XHR9XHJcblx0fVxyXG5cclxufSk7XHJcblxyXG5cclxuIl19

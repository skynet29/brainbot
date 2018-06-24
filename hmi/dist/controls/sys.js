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
				//console.log('onMessage')
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
				ctrl.setData({users: users})
			})			
		}

		loadUsers()

		this.on = events.on.bind(events)


	}

});



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hc3Rlci1hZ2VudHMuanMiLCJtYXN0ZXItY2xpZW50cy5qcyIsIm1hc3Rlci1oaXN0LmpzIiwidXNlci1kZXRhaWxzLmpzIiwidXNlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic3lzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ01hc3RlckFnZW50c0NvbnRyb2wnLCB7XHJcblx0XHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnXSwgXHJcblxyXG5cdFx0XG5cdGxpYjogJ3N5cycsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xyXG5cclxuXHRcdFx0bGV0IGhvc3RzID0ge31cclxuXHJcblx0XHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcclxcbiAgICA8dGFibGUgY2xhc3M9XFxcInczLXRhYmxlLWFsbCB3My1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8dGhlYWQ+XFxyXFxuICAgICAgICAgICAgPHRyIGNsYXNzPVxcXCJ3My1ncmVlblxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDx0aD5BZ2VudCBOYW1lPC90aD5cXHJcXG4gICAgICAgICAgICAgICAgPHRoPkhvc3QgTmFtZTwvdGg+XFxyXFxuICAgICAgICAgICAgICAgIDx0aD5TdGF0ZTwvdGg+XFxyXFxuICAgICAgICAgICAgICAgIDx0aD5QaWQ8L3RoPlxcclxcbiAgICAgICAgICAgICAgICA8dGg+QWN0aW9uPC90aD5cXHJcXG4gICAgICAgICAgICA8L3RyPlxcclxcbiAgICAgICAgPC90aGVhZD5cXHJcXG4gICAgICAgIDx0Ym9keSBibi1lYWNoPVxcXCJhIG9mIGFnZW50c1xcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLmFjdGlvblN0YXJ0OiBvbkFjdGlvblN0YXJ0LCBjbGljay5hY3Rpb25TdG9wOiBvbkFjdGlvblN0b3AsIGNsaWNrLmFjdGlvblN0b3BGb3JjZTogb25BY3Rpb25TdG9wRm9yY2VcXFwiPlxcclxcbiAgXHRcdFx0PHRyPlxcclxcblx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImEuYWdlbnRcXFwiPjwvdGQ+XFxyXFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYS5ob3N0XFxcIj48L3RkPlxcclxcblx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImEuc3RhdGVcXFwiPjwvdGQ+XFxyXFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYS5waWRcXFwiPjwvdGQ+XFxyXFxuXHRcdFx0XHQ8dGQgYm4tZGF0YT1cXFwiYWdlbnQ6IGEuYWdlbnRcXFwiPlxcclxcblx0XHRcdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJhY3Rpb25TdGFydCB3My1idG4gdzMtYmx1ZVxcXCIgYm4tc2hvdz1cXFwiYS5zdGFydFxcXCI+U3RhcnQ8L2J1dHRvbj5cXHJcXG5cdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYWN0aW9uU3RvcCB3My1idG4gdzMtYmx1ZVxcXCIgIGJuLXNob3c9XFxcIiFhLnN0YXJ0XFxcIj5TdG9wPC9idXR0b24+XFxyXFxuXHRcdFx0XHRcdDxidXR0b24gY2xhc3M9XFxcImFjdGlvblN0b3BGb3JjZSB3My1idG4gdzMtcmVkXFxcIiBibi1zaG93PVxcXCIhYS5zdGFydFxcXCI+S2lsbDwvYnV0dG9uPlxcclxcblx0XHRcdFx0PC90ZD5cXHJcXG5cdFx0XHQ8L3RyPiAgICAgIFx0XFxyXFxuXFxyXFxuICAgICAgICA8L3Rib2R5PlxcclxcbiAgICA8L3RhYmxlPlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRcdGRhdGE6IHthZ2VudHM6IFtdfSxcclxuXHRcdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRcdG9uQWN0aW9uU3RhcnQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYWdlbnQgPSAkKHRoaXMpLmNsb3Nlc3QoJ3RkJykuZGF0YSgnYWdlbnQnKVxyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnYWN0aW9uU3RhcnQnLCBhZ2VudClcclxuXHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ2xhdW5jaGVyU3RhcnRBZ2VudCcsIGFnZW50KVx0XHRcdFx0XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0b25BY3Rpb25TdG9wOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGFnZW50ID0gJCh0aGlzKS5jbG9zZXN0KCd0ZCcpLmRhdGEoJ2FnZW50JylcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2FjdGlvblN0b3AnLCBhZ2VudClcclxuXHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ2xhdW5jaGVyU3RvcEFnZW50JywgYWdlbnQpXHRcdFx0XHRcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRvbkFjdGlvblN0b3BGb3JjZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHZhciBhZ2VudCA9ICQodGhpcykuY2xvc2VzdCgndGQnKS5kYXRhKCdhZ2VudCcpXHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdhY3Rpb25TdG9wRm9yY2UnLCBhZ2VudClcclxuXHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ2xhdW5jaGVyU3RvcEFnZW50Jywge2FnZW50OiBhZ2VudCwgZm9yY2U6IHRydWV9KVx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVx0XHRcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdGN0cmwuZWx0LmFkZENsYXNzKCdibi1mbGV4LWNvbCcpXHJcblx0XHRcdGRpc3BUYWJsZSgpXHJcblxyXG5cdFx0XHRcclxuXHRcdFx0ZnVuY3Rpb24gZGlzcFRhYmxlKCkge1xyXG5cdFx0XHRcdHZhciBkYXRhID0gW11cclxuXHJcblx0XHRcdFx0Zm9yKHZhciBob3N0TmFtZSBpbiBob3N0cykge1xyXG5cdFx0XHRcdFx0dmFyIGFnZW50cyA9IGhvc3RzW2hvc3ROYW1lXVxyXG5cdFx0XHRcdFx0Zm9yKHZhciBhZ2VudCBpbiBhZ2VudHMpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGluZm8gPSBhZ2VudHNbYWdlbnRdXHJcblx0XHRcdFx0XHRcdGRhdGEucHVzaCh7XHJcblx0XHRcdFx0XHRcdFx0cGlkOiBpbmZvLnBpZCxcclxuXHRcdFx0XHRcdFx0XHRhZ2VudDogYWdlbnQsXHJcblx0XHRcdFx0XHRcdFx0c3RhdGU6IGluZm8uc3RhdGUsXHJcblx0XHRcdFx0XHRcdFx0c3RhcnQ6IGluZm8ucGlkID09IDAsXHJcblx0XHRcdFx0XHRcdFx0aG9zdDogaG9zdE5hbWVcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe2FnZW50czogZGF0YX0pXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIG9uTGF1bmNoZXJTdGF0dXMobXNnKSB7XHJcblx0XHRcdFx0dmFyIGhvc3ROYW1lID0gbXNnLnRvcGljLnNwbGl0KCcuJylbMV1cclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdob3N0JywgaG9zdE5hbWUpXHJcblx0XHRcdFx0aG9zdHNbaG9zdE5hbWVdID0gbXNnLmRhdGFcclxuXHRcdFx0XHRkaXNwVGFibGUoKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjbGllbnQucmVnaXN0ZXIoJ2xhdW5jaGVyU3RhdHVzLionLCB0cnVlLCBvbkxhdW5jaGVyU3RhdHVzKVxyXG5cclxuXHRcdFx0Y2xpZW50Lm9uQ2xvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe2FnZW50czogW119KVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjbGllbnQudW5yZWdpc3RlcignbGF1bmNoZXJTdGF0dXMuKicsIG9uTGF1bmNoZXJTdGF0dXMpXHJcblx0XHRcdFx0Ly9jbGllbnQub2ZmRXZlbnQoJ2Rpc2Nvbm5lY3RlZCcsIG9uRGlzY29ubmVjdGVkKVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNYXN0ZXJDbGllbnRzQ29udHJvbCcsIHtcclxuXHJcblx0XHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnXSwgXHJcblxyXG5cdFx0XG5cdGxpYjogJ3N5cycsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xyXG5cclxuXHRcdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxyXFxuICAgIDx0YWJsZSBjbGFzcz1cXFwidzMtdGFibGUtYWxsIHczLXNtYWxsXFxcIj5cXHJcXG4gICAgICAgIDx0aGVhZD5cXHJcXG4gICAgICAgICAgICA8dHIgY2xhc3M9XFxcInczLWdyZWVuXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHRoPk5hbWU8L3RoPlxcclxcbiAgICAgICAgICAgICAgICA8dGg+UmVnaXN0ZXJlZCBUb3BpY3M8L3RoPlxcclxcbiAgICAgICAgICAgICAgICA8dGg+UmVnaXN0ZXJlZCBTZXJ2aWNlczwvdGg+XFxyXFxuICAgICAgICAgICAgPC90cj5cXHJcXG4gICAgICAgIDwvdGhlYWQ+XFxyXFxuICAgICAgICA8dGJvZHkgYm4tZWFjaD1cXFwiYyBvZiBjbGllbnRzXFxcIj5cXHJcXG5cdFx0XHQ8dHI+XFxyXFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYy5uYW1lXFxcIj48L3RkPlxcclxcblx0XHRcdFx0PHRkIGJuLWh0bWw9XFxcImMudG9waWNzXFxcIj48L3RkPlxcclxcbiAgICAgICAgICAgICAgICA8dGQgYm4taHRtbD1cXFwiYy5zZXJ2aWNlc1xcXCI+PC90ZD5cXHJcXG5cdFx0XHQ8L3RyPiAgICAgICAgXHRcXHJcXG4gICAgICAgIDwvdGJvZHk+XFxyXFxuICAgIDwvdGFibGU+XFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdFx0Y2xpZW50czogW11cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBvbk1hc3RlckNsaWVudHMobXNnKSB7XHJcblx0XHRcdFx0Y29uc3QgZGF0YSA9IG1zZy5kYXRhXHJcblx0XHRcdFx0bGV0IGFnZW50cyA9IE9iamVjdC5rZXlzKGRhdGEpLnNvcnQoKVxyXG5cclxuXHRcdFx0XHR2YXIgY2xpZW50cyA9IGFnZW50cy5tYXAoZnVuY3Rpb24oYWdlbnQpIHtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHR0b3BpY3M6IGRhdGFbYWdlbnRdLnJlZ2lzdGVyZWRUb3BpY3Muam9pbignPGJyPicpLFxyXG5cdFx0XHRcdFx0XHRzZXJ2aWNlczogZGF0YVthZ2VudF0ucmVnaXN0ZXJlZFNlcnZpY2VzLmpvaW4oJzxicj4nKSxcclxuXHRcdFx0XHRcdFx0bmFtZTogYWdlbnRcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fSlcdFxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7Y2xpZW50czogY2xpZW50c30pXHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjbGllbnQucmVnaXN0ZXIoJ21hc3RlckNsaWVudHMnLCB0cnVlLCBvbk1hc3RlckNsaWVudHMpXHJcblxyXG5cclxuXHRcdFx0Y2xpZW50Lm9uQ2xvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe2NsaWVudHM6IFtdfSlcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y2xpZW50LnVucmVnaXN0ZXIoJ21hc3RlckNsaWVudHMnLCBvbk1hc3RlckNsaWVudHMpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcblxyXG5cclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNYXN0ZXJIaXN0Q29udHJvbCcsIHtcclxuXHJcblx0XHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnXSxcclxuXHJcblx0XHRcblx0bGliOiAnc3lzJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50KSB7XHJcblxyXG5cdFx0XHR2YXIgbW9kZWwgPSB7XHJcblx0XHRcdFx0dGFibGVDb25maWc6IHtcclxuXHRcdFx0XHRcdGNvbHVtbnM6IHtcclxuXHRcdFx0XHRcdFx0J3RvcGljJzogJ1RvcGljJyxcclxuXHRcdFx0XHRcdFx0J3NyYyc6ICdTb3VyY2UnLFxyXG5cdFx0XHRcdFx0XHQnbGFzdE1vZGlmJzogJ0xhc3QgTW9kaWZpZWQnLFxyXG5cdFx0XHRcdFx0XHQnZGF0YSc6ICdEYXRhJ1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0bmJNc2c6IDAsXHJcblx0XHRcdFx0ZGF0YVZpc2libGU6IGZhbHNlXHRcdFx0XHJcblx0XHRcdH1cclxuXHJcblxyXG5cclxuXHRcdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPlxcclxcblx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3cgYm4tc3BhY2UtYmV0d2VlblxcXCI+XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWNvbnRhaW5lciBmaWx0ZXJzXFxcIiBibi1ldmVudD1cXFwiaW5wdXQuZmlsdGVyOiBvbkZpbHRlckNoYW5nZVxcXCI+XFxyXFxuXHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHBsYWNlaG9sZGVyPVxcXCJGaWx0ZXIgdG9waWNcXFwiIGRhdGEtZmlsdGVyPVxcXCJ0b3BpY1xcXCIgY2xhc3M9XFxcImZpbHRlclxcXCI+XFxyXFxuXHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHBsYWNlaG9sZGVyPVxcXCJGaWx0ZXIgc291cmNlXFxcIiBkYXRhLWZpbHRlcj1cXFwic3JjXFxcIiBjbGFzcz1cXFwiZmlsdGVyXFxcIj5cdFx0XHRcdFx0XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0XHQ8ZGl2Pk1lc3NhZ2VzIE51bWJlcjo8c3BhbiBibi10ZXh0PVxcXCJuYk1zZ1xcXCI+PC9zcGFuPjwvZGl2Plxcclxcblx0PC9kaXY+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJibi1jb250YWluZXJcXFwiPlxcclxcblx0XHQ8aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGNsYXNzPVxcXCJ3My1jaGVja1xcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblNob3dEYXRhXFxcIiBibi12YWw9XFxcImRhdGFWaXNpYmxlXFxcIj48bGFiZWw+IFNob3cgRGF0YTwvbGFiZWw+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiRmlsdGVyZWRUYWJsZUNvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcInRhYmxlQ29uZmlnXFxcIiBjbGFzcz1cXFwiYm4tZmxleC0xIGJuLW5vLW92ZXJmbG93XFxcIiBibi1pZmFjZT1cXFwiaWZhY2VcXFwiPlx0XFxyXFxuPC9kaXY+XFxyXFxuXCIsXHJcblx0XHRcdFx0ZGF0YTogbW9kZWwsIFxyXG5cdFx0XHRcdGV2ZW50czogXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0b25TaG93RGF0YTogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uU2hvd0RhdGEnKVxyXG5cdFx0XHRcdFx0XHRtb2RlbC5kYXRhVmlzaWJsZSA9ICQodGhpcykucHJvcCgnY2hlY2tlZCcpXHJcblx0XHRcdFx0XHRcdHRib2R5LmZpbmQoJ3ByZScpLmJuVmlzaWJsZShtb2RlbC5kYXRhVmlzaWJsZSlcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRvbkZpbHRlckNoYW5nZTogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uRmlsdGVyQ2hhbmdlJylcclxuXHRcdFx0XHRcdFx0dmFyIGZpbHRlciA9ICQodGhpcykuZGF0YSgnZmlsdGVyJylcclxuXHRcdFx0XHRcdFx0ZmlsdGVyc1tmaWx0ZXJdID0gJCh0aGlzKS52YWwoKVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNjb3BlLmlmYWNlLnNldEZpbHRlcnMoZmlsdGVycylcclxuXHRcdFx0XHRcdFx0dXBkYXRlVG9waWNOdW1iZXIoKVxyXG5cdFx0XHRcdFx0XHR0Ym9keS5maW5kKCdwcmUnKS5iblZpc2libGUobW9kZWwuZGF0YVZpc2libGUpXHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHRsZXQgZmlsdGVycyA9IHt9XHJcblxyXG5cdFx0XHR2YXIgdGJvZHkgPSBjdHJsLmVsdC5maW5kKCd0Ym9keScpXHJcblxyXG5cdFx0XHRmdW5jdGlvbiB1cGRhdGVUb3BpY051bWJlcigpIHtcclxuXHRcdFx0XHR2YXIgbmJNc2cgPSB0Ym9keS5maW5kKCd0cicpLmxlbmd0aFxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7bmJNc2c6IG5iTXNnfSlcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIG9uTWVzc2FnZShtc2cpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbk1lc3NhZ2UnKVxyXG5cdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2UuYWRkSXRlbShtc2cudG9waWMsIGdldEl0ZW1EYXRhKG1zZykpXHJcblx0XHRcdFx0dXBkYXRlVG9waWNOdW1iZXIoKVx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjbGllbnQucmVnaXN0ZXIoJyoqJywgdHJ1ZSwgb25NZXNzYWdlKVxyXG5cclxuXHRcdFx0Y2xpZW50Lm9uQ2xvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjdHJsLnNjb3BlLmlmYWNlLnJlbW92ZUFsbEl0ZW1zKClcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdFxyXG5cdFx0XHRmdW5jdGlvbiBnZXRJdGVtRGF0YShtc2cpIHtcclxuXHRcdFx0XHR2YXIgZGF0YSA9ICQoYDxwcmUgYm4tcHJvcD1cImhpZGRlbjogaGlkZGVuXCIgY2xhc3M9XCJibi1uby1tYXJnaW5cIj4ke0pTT04uc3RyaW5naWZ5KG1zZy5kYXRhLCBudWxsLCA0KX08L3ByZT5gKVxyXG5cdFx0XHRcdFx0LnByb2Nlc3NUZW1wbGF0ZSh7aGlkZGVuOiAhbW9kZWwuZGF0YVZpc2libGV9KVxyXG5cclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0dG9waWM6IG1zZy50b3BpYyxcclxuXHRcdFx0XHRcdHNyYzogbXNnLnNyYyxcclxuXHRcdFx0XHRcdGxhc3RNb2RpZjogbmV3IERhdGUobXNnLnRpbWUpLnRvTG9jYWxlU3RyaW5nKCksXHJcblx0XHRcdFx0XHRkYXRhOiBkYXRhXHRcdFx0XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjbGllbnQudW5yZWdpc3RlcignKionLCBvbk1lc3NhZ2UpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnVXNlckRldGFpbHNDb250cm9sJywge1xyXG5cclxuXHRcdGRlcHM6IFsnSHR0cFNlcnZpY2UnXSxcclxuXHRcdGlmYWNlOiAnc2V0VXNlcih1c2VyTmFtZSk7Z2V0VXNlcigpO2hpZGUoKScsXHJcblxyXG5cdFx0XG5cdGxpYjogJ3N5cycsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGh0dHApIHtcclxuXHJcblx0XHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwibWFpblxcXCIgYm4tc2hvdz1cXFwidmlzaWJsZVxcXCI+XFxyXFxuXFxyXFxuXHQ8aDI+VXNlciBEZXRhaWxzPC9oMj5cXHJcXG5cdDx0YWJsZSBjbGFzcz1cXFwiaW5mbyB3My10YWJsZSB3My1ib3JkZXJcXFwiIGJuLWJpbmQ9XFxcImluZm9cXFwiPlxcclxcblx0XHQ8dHI+XFxyXFxuXHRcdFx0PHRkPlVzZXI8L3RkPlxcclxcblx0XHRcdDx0ZD48c3Ryb25nIGJuLXRleHQ9XFxcInVzZXJcXFwiPjwvc3Ryb25nPjwvdGQ+XFxyXFxuXHRcdDwvdHI+XFxyXFxuXHRcdDx0cj5cXHJcXG5cdFx0XHQ8dGQ+UGFzc3dvcmQ8L3RkPlxcclxcblx0XHRcdDx0ZD48aW5wdXQgY2xhc3M9XFxcInB3ZCB3My1pbnB1dCB3My1ib3JkZXJcXFwiIHR5cGU9XFxcInRleHRcXFwiIGJuLXZhbD1cXFwicHdkXFxcIiBuYW1lPVxcXCJwd2RcXFwiPjwvdGQ+XFxyXFxuXHRcdDwvdHI+XFxyXFxuXHQ8L3RhYmxlPlx0XHRcdFx0XFxyXFxuXFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxyXFxuXHRcdDx0YWJsZSBjbGFzcz1cXFwiYXBwcyB3My10YWJsZS1hbGwgdzMtc21hbGxcXFwiPlxcclxcblx0XHRcdDx0aGVhZD5cXHJcXG5cdFx0XHRcdDx0ciBjbGFzcz1cXFwidzMtZ3JlZW5cXFwiPlxcclxcblx0XHRcdFx0XHQ8dGg+QXBwIE5hbWU8L3RoPlxcclxcblx0XHRcdFx0XHQ8dGg+QWxsb3dlZDwvdGg+XFxyXFxuXHRcdFx0XHRcdDx0aD5Db25maWd1cmF0aW9uPC90aD5cdFx0XHRcXHJcXG5cdFx0XHRcdDwvdHI+XFxyXFxuXFxyXFxuXHRcdFx0PC90aGVhZD5cXHJcXG5cdFx0XHQ8dGJvZHkgYm4tZWFjaD1cXFwiYXBwIG9mIGFwcHNcXFwiIGJuLWJpbmQ9XFxcInRib2R5XFxcIj5cXHJcXG5cdFx0XHRcdDx0cj5cXHJcXG5cdFx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImFwcC5hcHBOYW1lXFxcIiBuYW1lPVxcXCJuYW1lXFxcIiBibi12YWw9XFxcImFwcC5hcHBOYW1lXFxcIj48L3RkPlxcclxcblx0XHRcdFx0XHQ8dGQ+PGlucHV0IG5hbWU9XFxcImVuYWJsZWRcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIiBibi1wcm9wPVxcXCJjaGVja2VkOiBhcHAuYWxsb3dlZFxcXCI+PC90ZD5cXHJcXG5cdFx0XHRcdFx0PHRkPjxzZWxlY3QgbmFtZT1cXFwiY29uZmlnXFxcIiAgY2xhc3M9XFxcInczLWJvcmRlciBibi1maWxsXFxcIiBibi1saXN0PVxcXCJhcHAuY29uZmlnc1xcXCIgYm4tdmFsPVxcXCJhcHAuc2VsQ29uZmlnXFxcIj48L3NlbGVjdD48L3RkPlxcclxcblx0XHRcdFx0PC90cj5cdFx0XHRcdFxcclxcblx0XHRcdDwvdGJvZHk+XFxyXFxuXHRcdDwvdGFibGU+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdDxwPjxidXR0b24gY2xhc3M9XFxcImFwcGx5IHczLWJ0biB3My1ibHVlXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQXBwbHlcXFwiPkFwcGx5IGNoYW5nZXM8L2J1dHRvbj48L3A+XFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdFx0dXNlcjogJycsXHJcblx0XHRcdFx0XHRwd2Q6ICcnLFxyXG5cdFx0XHRcdFx0YXBwczogW10sXHJcblx0XHRcdFx0XHR2aXNpYmxlOiBmYWxzZVxyXG5cdFx0XHRcdH0sXHRcclxuXHRcdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRcdG9uQXBwbHk6IGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdBcHBseScsIGdldEluZm9zKCkpXHJcblx0XHRcdFx0XHRcdGh0dHAucHV0KGAvYXBpL3VzZXJzLyR7dXNlcn1gLCBnZXRJbmZvcygpKS50aGVuKCgpID0+IHtcclxuXHRcdFx0XHRcdFx0XHQkKHRoaXMpLm5vdGlmeSgnQ29uZmlnIHNhdmVkIHN1Y2Nlc3NmdWxseScsIHtwb3NpdGlvbjogJ3JpZ2h0IHRvcCcsIGNsYXNzTmFtZTogJ3N1Y2Nlc3MnfSlcclxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cclxuXHJcblx0XHRcdHZhciB1c2VyXHJcblx0XHRcdHZhciBfYXBwcyA9IFtdXHJcblxyXG5cclxuXHJcblx0XHRcdGh0dHAuZ2V0KCcvYXBpL2FwcHMnKS50aGVuKGZ1bmN0aW9uKGFwcHMpIHtcclxuXHRcdFx0XHRfYXBwcyA9IGFwcHNcclxuXHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHR0aGlzLnNldFVzZXIgPSBmdW5jdGlvbihpZCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbVXNlckRldGFpbHNDb250cm9sXSBzZXRVc2VyJywgaWQpXHJcblx0XHRcdFx0dXNlciA9IGlkXHJcblx0XHRcdFx0Z2V0VXNlckRldGFpbHMoaWQpXHJcblx0XHRcdFx0Ly9tYWluRWx0LnNob3coKVx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGdldEluZm9zKCkge1xyXG5cdFx0XHRcdHZhciBpbmZvcyA9IGN0cmwuc2NvcGUuaW5mby5nZXRGb3JtRGF0YSgpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ2luZm9zJywgaW5mb3MpXHJcblxyXG5cdFx0XHRcdHZhciBhbGxvd2VkQXBwcyA9IHt9XHJcblx0XHRcdFx0Y3RybC5zY29wZS50Ym9keS5maW5kKCd0cicpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR2YXIgYXBwSW5mb3MgPSAkKHRoaXMpLmdldEZvcm1EYXRhKClcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdhcHBJbmZvcycsIGFwcEluZm9zKVxyXG5cdFx0XHRcdFx0aWYgKGFwcEluZm9zLmVuYWJsZWQpIHtcclxuXHRcdFx0XHRcdFx0YWxsb3dlZEFwcHNbYXBwSW5mb3MubmFtZV0gPSAoYXBwSW5mb3MuY29uZmlnID09ICdub25lJykgPyB0cnVlIDogYXBwSW5mb3MuY29uZmlnXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0cHdkOiBpbmZvcy5wd2QsXHJcblx0XHRcdFx0XHRhbGxvd2VkQXBwczogYWxsb3dlZEFwcHNcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGdldFVzZXJEZXRhaWxzKHVzZXIpIHtcclxuXHRcdFx0XHRodHRwLmdldChgL2FwaS91c2Vycy8ke3VzZXJ9YCkudGhlbihmdW5jdGlvbih1c2VyRGV0YWlscykge1xyXG5cclxuXHRcdFx0XHRcdHZhciBhbGxvd2VkQXBwcyA9IHVzZXJEZXRhaWxzLmFsbG93ZWRBcHBzXHJcblxyXG5cdFx0XHRcdFx0dmFyIGFwcHMgPSAkJC5vYmoyQXJyYXkoX2FwcHMpLm1hcChmdW5jdGlvbihpdGVtKSB7XHJcblx0XHRcdFx0XHRcdHZhciBhcHBOYW1lID0gaXRlbS5rZXlcclxuXHJcblx0XHRcdFx0XHRcdHZhciBjb25maWcgPSBhbGxvd2VkQXBwc1thcHBOYW1lXVxyXG5cclxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdFx0XHRhcHBOYW1lOiBhcHBOYW1lLFxyXG5cdFx0XHRcdFx0XHRcdGFsbG93ZWQ6IChjb25maWcgIT0gdW5kZWZpbmVkKSxcclxuXHRcdFx0XHRcdFx0XHRzZWxDb25maWc6ICh0eXBlb2YgY29uZmlnID09ICdzdHJpbmcnKSA/IGNvbmZpZyA6ICdub25lJyxcclxuXHRcdFx0XHRcdFx0XHRjb25maWdzOiBbJ25vbmUnXS5jb25jYXQoaXRlbS52YWx1ZSlcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSlcdFxyXG5cdFx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe1xyXG5cdFx0XHRcdFx0XHR1c2VyOiB1c2VyLFxyXG5cdFx0XHRcdFx0XHRwd2Q6IHVzZXJEZXRhaWxzLnB3ZCxcclxuXHRcdFx0XHRcdFx0dmlzaWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0YXBwczogYXBwc1xyXG5cdFx0XHRcdFx0fSlcclxuXHJcblx0XHRcdFx0fSlcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5nZXRVc2VyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIHVzZXJcclxuXHRcdFx0fSxcclxuXHRcdFx0dGhpcy5oaWRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHt2aXNpYmxlOiBmYWxzZX0pXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcbiIsIlxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnVXNlcnNDb250cm9sJywge1xyXG5cdGRlcHM6IFsnSHR0cFNlcnZpY2UnXSxcclxuXHRldmVudHM6ICd1c2VyU2VsZWN0ZWQsdXNlckRlbGV0ZWQnLFxyXG5cdFxuXHRsaWI6ICdzeXMnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBodHRwKSB7XHJcblxyXG5cdFx0dmFyIGV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPlxcclxcblx0PGgyPlJlZ2lzdGVyZWQgVXNlcnM8L2gyPlxcclxcblx0PGRpdiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcclxcblx0XHQ8dWwgY2xhc3M9XFxcInczLXVsIHczLWJvcmRlciB3My13aGl0ZVxcXCIgYm4tZWFjaD1cXFwidXNlciBvZiB1c2Vyc1xcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLmRlbGV0ZTogb25EZWxldGVVc2VyLCBjbGljay51c2VyOiBvblVzZXJDbGlja2VkXFxcIiBibi1iaW5kPVxcXCJ1bFxcXCI+XFxyXFxuXHRcdFx0PGxpIGNsYXNzPVxcXCJ3My1iYXJcXFwiIGJuLWRhdGE9XFxcInVzZXI6IHVzZXJcXFwiPlxcclxcblx0XHRcdFx0PHNwYW4gY2xhc3M9XFxcInczLWJ1dHRvbiB3My1yaWdodCBkZWxldGVcXFwiIHRpdGxlPVxcXCJEZWxldGVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS10cmFzaFxcXCI+PC9pPjwvc3Bhbj5cXHJcXG5cdFx0XHRcdDxkaXYgY2xhc3M9XFxcInczLWJhci1pdGVtXFxcIj5cXHJcXG5cdFx0XHRcdFx0PGEgaHJlZj1cXFwiI1xcXCIgYm4tdGV4dD1cXFwidXNlclxcXCIgY2xhc3M9XFxcInVzZXJcXFwiPjwvYT5cXHJcXG5cdFx0XHRcdDwvZGl2Plxcclxcblx0XHRcdDwvbGk+XFxyXFxuXHRcdDwvdWw+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDxkaXY+XFxyXFxuXHRcdDxmb3JtIGJuLWV2ZW50PVxcXCJzdWJtaXQ6IG9uQWRkVXNlclxcXCI+XFxyXFxuXHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHBsYWNlaG9sZGVyPVxcXCJ1c2VybmFtZVxcXCIgbmFtZT1cXFwidXNlck5hbWVcXFwiIHJlcXVpcmVkIGF1dG9jb21wbGV0ZT1cXFwib2ZmXFxcIiBjbGFzcz1cXFwidzMtaW5wdXQgdzMtYm9yZGVyXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIHR5cGU9XFxcInN1Ym1pdFxcXCIgY2xhc3M9XFxcInczLWJ0biB3My1ibHVlIHczLWJhci1pdGVtIHczLXJpZ2h0XFxcIj5BZGQ8L2J1dHRvbj5cdFx0XHRcXHJcXG5cXHJcXG5cdFx0PC9mb3JtPlxcclxcblx0PC9kaXY+XHRcXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cdFx0XCIsXHJcblx0XHRcdGRhdGE6IHt1c2VyczogW119LFxyXG5cdFx0XHRldmVudHM6IHtcclxuXHJcblx0XHRcdFx0b25BZGRVc2VyOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25BZGRVc2VyJylcclxuXHRcdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcclxuXHRcdFx0XHRcdHZhciBkYXRhID0gJCh0aGlzKS5nZXRGb3JtRGF0YSgpXHJcblx0XHRcdFx0XHQkKHRoaXMpLmdldCgwKS5yZXNldCgpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdzdWJtaXQnLCBkYXRhKVxyXG5cdFx0XHRcdFx0aHR0cC5wb3N0KCcvYXBpL3VzZXJzJywgZGF0YSkudGhlbihsb2FkVXNlcnMpXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkRlbGV0ZVVzZXI6IGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkRlbGV0ZVVzZXInKVxyXG5cdFx0XHRcdFx0dmFyIHVzZXIgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykuZGF0YSgndXNlcicpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd1c2VyJywgdXNlcilcclxuXHRcdFx0XHRcdCQkLnNob3dDb25maXJtKCdBcmUgeW91ciBzdXJlID8nLCAnSW5mb3JtYXRpb24nLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0aHR0cC5kZWxldGUoYC9hcGkvdXNlcnMvJHt1c2VyfWApLnRoZW4oZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0bG9hZFVzZXJzKClcclxuXHRcdFx0XHRcdFx0XHRldmVudHMuZW1pdCgndXNlckRlbGV0ZWQnLCB1c2VyKVxyXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHJcblx0XHRcdFx0XHR9KVx0XHRcdFx0XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvblVzZXJDbGlja2VkOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Vc2VyQ2xpY2tlZCcpXHJcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRcdFx0XHRjdHJsLnNjb3BlLnVsLmZpbmQoJ2xpJykucmVtb3ZlQ2xhc3MoJ3czLWJsdWUnKVxyXG5cdFx0XHRcdFx0dmFyICRsaSA9ICQodGhpcykuY2xvc2VzdCgnbGknKVxyXG5cdFx0XHRcdFx0JGxpLmFkZENsYXNzKCd3My1ibHVlJylcclxuXHRcdFx0XHRcdHZhciB1c2VyID0gJGxpLmRhdGEoJ3VzZXInKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndXNlcicsIHVzZXIpXHJcblx0XHRcdFx0XHRldmVudHMuZW1pdCgndXNlclNlbGVjdGVkJywgdXNlcilcdFx0XHRcdFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHRcclxuXHJcblxyXG5cdFx0ZnVuY3Rpb24gbG9hZFVzZXJzKCkge1xyXG5cdFx0XHRodHRwLmdldCgnL2FwaS91c2VycycpLnRoZW4oZnVuY3Rpb24odXNlcnMpIHtcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe3VzZXJzOiB1c2Vyc30pXHJcblx0XHRcdH0pXHRcdFx0XHJcblx0XHR9XHJcblxyXG5cdFx0bG9hZFVzZXJzKClcclxuXHJcblx0XHR0aGlzLm9uID0gZXZlbnRzLm9uLmJpbmQoZXZlbnRzKVxyXG5cclxuXHJcblx0fVxyXG5cclxufSk7XHJcblxyXG5cclxuIl19

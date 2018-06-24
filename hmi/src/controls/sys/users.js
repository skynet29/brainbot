
$$.registerControlEx('UsersControl', {
	deps: ['HttpService'],
	events: 'userSelected,userDeleted',
	init: function(elt, options, http) {

		var events = new EventEmitter2()

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './users.html'},
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



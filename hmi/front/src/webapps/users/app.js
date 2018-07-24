$$.configReady(function () {
	console.log('App started')

	var ctrl = $$.viewController('body', {
		template: {gulp_inject: './app.html'},
		events: {
			onUserSelected: function(user) {
				console.log('userSelected', user)
				ctrl.scope.userDetailsCtrl.setUser(user)
			},

			onUserDeleted: function(user) {
				console.log('userDeleted', user)
				if (ctrl.scope.userDetailsCtrl.getUser() === user) {
					ctrl.scope.userDetailsCtrl.hide()
				}
				
			}	
		}	
	})


})
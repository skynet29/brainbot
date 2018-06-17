$$.registerControl('MainControl', ['WebSocketService'], function(elt, client) {

	var ctrl = $$.viewController(elt, {
		template: {gulp_inject: './app.html'},
		data: {
			message: ''
		},
		events: {
			onCompute: function(ev) {
				ev.preventDefault()
				var data = $(this).getFormData()
				console.log('data', data)
				client.callService('sum', data).then(function(result) {
					ctrl.setData({result, message: ''})
				})
				.catch(function(err) {
					ctrl.setData('message', err.message)
				})
			}
		}
	})
})

$$.registerControlEx('HeaderControl', {
	deps: ['WebSocketService'],
	props: {
		title: {val: 'Hello World'},
		userName: {val: 'unknown'}
	},
	init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: "./header.html"},
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



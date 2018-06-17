$$.configReady(function(config) {


	var ctrl = window.app = $$.viewController('body', {
		template: {gulp_inject: './app.html'},

		data: {

			roll: 10,
			pitch: 10,
			altitude: 50,
			speed: 5
		}

	})
})
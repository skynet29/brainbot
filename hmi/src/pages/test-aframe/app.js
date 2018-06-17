$$.configReady(function() {

	var routes = [
		{href: '/', redirect: '/demo1'},
		{href: '/demo1', control: 'demo1Ctrl'},
		{href: '/demo2', control: 'demo2Ctrl'},
		{href: '/demo3', control: 'demo3Ctrl'}
	]

	var ctrl = $$.viewController('body', {
		template: {gulp_inject: './app.html'},
		data: {
			routes
		}
	})


});

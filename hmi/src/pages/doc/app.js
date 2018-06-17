$$.configReady(function() {


	var routes = [
		{href: '/', redirect: '/controls'},
		{href: '/controls', control: '$MainControl'},
		{href: '/services', control: '$ServicesControl'},
		{href: '/core', control: '$CoreControl'},
		{href: '/control/:name', control: '$DetailControl'}



	]


	$$.viewController('body', {
		template: {gulp_inject: './app.html'},
		data: {routes}	
	})

});
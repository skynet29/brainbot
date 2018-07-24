$$.registerControlEx('$ServicesControl', {

	init: function(elt, options) {
		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './services.html'},
			data: {
				services: $$.getRegisteredServices().map((s) => s.name)
			}
		})
	}
});

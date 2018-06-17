$$.registerControlEx('$CoreControl', {

	init: function(elt, options) {

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './core.html'},
			data: {
				methods: Object.keys($$).sort()
			}
		})
	}
});

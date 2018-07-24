$$.registerControlEx('$DetailControl', {

	init: function(elt, options) {

		var name = options.$params.name

		var info = $$.getControlInfo(name)
		//console.log('info', info)

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './detail.html'},
			data: {
				name,
				detail: JSON.stringify(info, null, 4).replace(/\"/g, '')
			},
			events: {
				onBack: function() {
					history.back()
				}
			}
		})
	}
});
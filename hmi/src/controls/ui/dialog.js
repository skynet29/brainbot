$$.registerControlEx('DialogControl', {
	init: function(elt, options) {

		options.autoOpen = false
		options.appendTo = elt.parent()
		options.modal = true

		var iface = {
			open: function() {
				elt.dialog('open')
			},

			close: function() {
				elt.dialog('close')
			},

			setOption(optionName, value) {
				elt.dialog('option', optionName, value)
			}
		}			


		for(var btn in options.buttons) {
			var fn = options.buttons[btn] 
			if (typeof fn == 'function') {
				options.buttons[btn] = options.buttons[btn].bind(iface)
			}
		}

		elt.dialog(options)

		return iface
	}
});



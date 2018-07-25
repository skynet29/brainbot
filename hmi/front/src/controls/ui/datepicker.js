(function() {

	$.datepicker.setDefaults($.datepicker.regional['fr'])


	$$.registerControlEx('DatePickerControl', {
		options: {
			showButtonPanel: false
		},
		events: 'change',
		init: function(elt, options) {

			elt.datepicker(options)

			var value = elt.val()
			if (typeof value == 'string') {
				var ms = Date.parse(value)
				//console.log('[DatePickerControl] ms', ms)
				var date = new Date(ms)
				//console.log('[DatePickerControl] date', date)
				elt.datepicker('setDate', date)
			}
				
			return {
				setValue: function(date) {
					elt.datepicker('setDate', date)
				},
				getValue: function() {
					return elt.datepicker('getDate')
				}
			}
		}

	})
})();



$$.registerControlEx('SliderControl', {

	props: {
		max: {val: 100},
		min: {val: 0}, 
		orientation: {val: 'horizontal'},
		range: {val: false}			
	},
	events: 'change,input',

	init: function(elt, options) {


	//console.log('[SliderControl] value', elt.val())
		var value = elt.val()

		if (Array.isArray(value)) {
			options.values = value
			options.range = true
		}

		if (typeof value == 'string') {
			options.value = value
		}

		//console.log('[SliderControl] options', options)

		options.change = function(ev, ui) {
			elt.trigger('change', [ui.values || ui.value])
		}

		options.slide = function(ev, ui) {
			//console.log('[SliderControl] slide', ui.values || ui.value)
			elt.trigger('input', [ui.values || ui.value])
		}

		elt.slider(options)

		function getValue() {
			//console.log('[SliderControl] getValue')
			return elt.slider((options.range) ? 'values' : 'value') 
		}

		function setValue(value) {
			//console.log('[SliderControl] setValue')
			elt.slider((options.range) ? 'values' : 'value', value)
		}


		return {
			getValue,
			setValue
		}
	}

});



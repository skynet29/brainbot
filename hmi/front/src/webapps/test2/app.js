$$.configReady(function() {

	var symbols = [
		"SFG*UCDSS-*****",
		"SNG*UCDSS-*****",
		"SHG*UCDSS-*****",
		"SUG*UCDSV-*****",
		"SFG*UCDSV-*****",
		"SNG*UCDSV-*****",
		"SHG*UCDSV-*****",
		"SUG*UCDM--*****",
		"SFG*UCDM--*****",
		"SNG*UCDM--*****",
		"SHG*UCDM--*****",
		"SUG*UCDML-*****",
		"SFG*UCDML-*****",
		"SNG*UCDML-*****",
		"SHG*UCDML-*****",
		"SUG*UCDMLA*****",
		"SFG*UCDMLA*****",
		"SNG*UCDMLA*****",
		"SHG*UCDMLA*****"
	]
		

	var ctrl = window.app = $$.viewController('body', {
		template: {gulp_inject: './app.html'},
		data: {
			size: 40,
			sidc: 'SFG-UCI----D',
			uniqueDesignation: 'toto',			
			symbols: symbols
		},	
		events: {
			onPropsChange: function() {
				var attrName = this.name
				var value = this.value
				console.log('onPropsChange', attrName, value)
				ctrl.setData(attrName, value)
			}

		}
	})


})
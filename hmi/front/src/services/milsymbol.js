(function() {

	$$.registerService('MilSymbolService', function(config) {

		var ms = window.ms

		if (! ms) {
			console.warn(`[MilSymbolService] Missing library dependancy 'milsymbol.js'`)
		}
		else {
			delete window.ms
		}

		return ms

	})

})();
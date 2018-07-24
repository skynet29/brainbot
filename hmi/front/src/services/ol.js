(function() {

	$$.registerService('OpenLayerService', function(config) {

		var ol = window.ol

		if (! ol) {
			console.warn(`[OpenLayerService] Missing library dependancy 'ol.j'`)
		}
		else {
			delete window.ol
			$$.loadStyle('/css/ol.css')
		}

		return ol

	})

})();
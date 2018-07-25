(function() {

	$$.registerService('LeafletService', ['WebSocketService'], function(config, client) {

		var L = window.L

		if (! L) {
			throw(`[LeafletService] Missing library dependancy 'leaflet.js'`)
		}
		else {
			console.log('Leaflet version', L.version)
			console.log('LeafletDraw version', L.drawVersion)
			//delete window.L
			$$.loadStyle('/css/leaflet.css')
		}

		return L

	})

})();
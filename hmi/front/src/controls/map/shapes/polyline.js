(function() {



	$$.registerObject('map.shape', 'polyline', function(mapView) {

		return {
			createSchema: {
				latlngs: [{
					lat: 'number', 
					lng: 'number'
				}],
				$options: {
					$color: 'string'
				}
			},

			updateSchema: {
				$latlngs: [{
					lat: 'number', 
					lng: 'number'
				}],
				$options: {
					$color: 'string'
				}
			},

			create: function(data) {
				return L.polyline(data.latlngs, data.options)
			},
			update: function(layer, data) {

				if (data.latlngs) {
					layer.setLatLngs(data.latlngs)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
			},
			getData: function(layer, data) {
				data.latlngs = layer.getLatLngs()
			}

		}
	})
})();

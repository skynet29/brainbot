(function() {



	$$.registerObject('map.shape', 'circleMarker', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$options: {
					$color: 'string'
				}
			},

			updateSchema: {
				$latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$options: {
					$color: 'string'
				}
			},			
			create: function(data) {
				
				return L.circleMarker(data.latlng, data.options)
			},
			update: function(layer, data) {
			
				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}	
				
				if (data.options) {
					layer.setStyle(data.options)
				}
				
			}

		}
	})
})();

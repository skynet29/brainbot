(function() {



	$$.registerObject('map.shape', 'rectangle', function(mapView) {

		return {
			createSchema: {
				northWest: {
					lat: 'number', 
					lng: 'number'
				},
				southEast: {
					lat: 'number', 
					lng: 'number'
				},		radius: 'number',
				$options: {
					$color: 'string'
				}
			},

			updateSchema: {
				$northWest: {
					lat: 'number', 
					lng: 'number'
				},
				$southEast: {
					lat: 'number', 
					lng: 'number'
				},		radius: 'number',
				$options: {
					$color: 'string'
				}
			},

			create: function(data) {
			
				let bounds = L.latLngBounds(data.northWest, data.southEast)
				return L.rectangle(bounds, data.options)
			},
			update: function(layer, data) {
				
				let bounds = L.latLngBounds(data.northWest, data.southEast)
				layer.setBounds(bounds)
				layer.setStyle(data.options)
			},			
			getData: function(layer, data) {
				let bounds = layer.getBounds()
				data.northWest =  bounds.getNorthWest()
				data.southEast =  bounds.getSouthEast()
			}
		}
	})
})();

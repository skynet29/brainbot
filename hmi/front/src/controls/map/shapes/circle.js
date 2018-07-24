(function() {


	$$.registerObject('map.shape', 'circle', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				radius: 'number',
				$options: {
					$color: 'string'
				}
			},
			updateSchema: {
				$latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$radius: 'number',
				$options: {
					$color: 'string'
				}
			},			
			create: function(data) {
				return L.circle(data.latlng, data.radius, data.options)
			},
			update: function(layer, data) {
			
				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}	
				
				if (data.radius) {
					layer.setRadius(data.radius)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
				
			},
			getData: function(layer, data) {
				data.radius = layer.getRadius()
				data.latlng = layer.getLatLng()	
			}
		}
	})
})();

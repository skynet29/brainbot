(function() {

	$$.registerObject('map.shape', 'sector', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				radius: 'number',
				direction: 'number',
				size: 'number',
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
				$direction: 'number',
				$size: 'number',
				$options: {
					$color: 'string'
				}
			},			
			create: function(data) {
				var options = $.extend({radius: data.radius}, data.options)
				var sector = L.semiCircle(data.latlng, options)
				sector.setDirection(data.direction, data.size)
				return sector
			},
			update: function(layer, data) {
				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}
				if (data.radius) {
					layer.setRadius(data.radius)
				}
				if (data.direction && data.size) {
					layer.setDirection(data.direction, data.size)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
			}

		}
	})
})();

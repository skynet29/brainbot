(function(){


	$$.registerObject('map.plugin', 'CenterMap', function(mapView) {


		let centerVeh = null


		function onCenterMap(pos) {
			console.log('centerMap', pos)
			mapView.map.panTo(pos)
			centerVeh = null
		}

/*		mapView.actions.on('centerOnVehicule', (marker) => {
			console.log('centerOnVehicule', marker.fullId)
			mapView.map.panTo(marker.getLatLng())
			centerVeh = marker.fullId
		})
		
		mapView.events.on('objectUpdated', (obj) => {
			//console.log('aisReport', msg)

		})	*/

		mapView.actions.on('centerMap', onCenterMap)

		return {
			dispose: function() {
				console.log('[TacticViewCenterMap] dispose')
				mapView.events.off('objectContextMenu', onObjectContextMenu)
				mapView.actions.off('centerMap', onCenterMap)
			}
		}
	})
	
	
})();
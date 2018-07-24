(function () {


	$$.registerObject('map.plugin', 'CircularMenu', function(mapView, options) {

		var controlContainer = mapView.elt.find('.leaflet-control-container')

		var ctrl = $$.viewController(controlContainer, {
			template: `<div class="menu" bn-control="CircularMenuControl" bn-options="config" bn-event="menuSelected: onMenuSelected"></div>`,
			data: {config: options},
			events: {
				onMenuSelected: function(item) {
					console.log('onMenuSelected', item)
					if (item && typeof item.action == 'string') {
						mapView.actions.emit(item.action)
					}			
				}
			}
		})


	})
})();

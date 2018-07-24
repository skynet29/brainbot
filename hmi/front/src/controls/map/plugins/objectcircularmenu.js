(function () {


	$$.registerObject('map.plugin', 'ObjectCircularMenu', ['WebSocketService'], function(mapView, options, client) {
		//console.log('CircularMenu', mapView)

		//console.log('[TacticViewObjectCircularMenu] options:', options)

		options.hasTrigger = false

		var controlContainer = mapView.elt.find('.leaflet-control-container')

		var ctrl = $$.viewController(controlContainer, {
			template: `<div class="menu" bn-control="CircularMenuControl" bn-options="config" 
				bn-event="menuClosed: onMenuClosed, menuSelected: onMenuSelected" bn-iface="iface"></div>`,
			data: {
				config: options
			},
			events: {
				onMenuClosed: function() {
					//console.log('onMenuClosed')
					mapView.enableHandlers()
				},
				onMenuSelected: function(menuInfo) {
					//console.log('onMenuSelected', menuInfo, selObj.fullId, selObj.privateData)

					selObj.userData.options.color = menuInfo.color


					client.sendTo(selObj.creator, 'mapViewShapeEdited', selObj.userData)					
				}
			}
		})


		var ctrlIf = ctrl.scope.iface
		var selObj

		function onObjectContextMenu(obj) {
			selObj = obj
			if (obj instanceof L.CircleMarker) {

				var color = selObj.options.color
				//console.log('onInit', color)
				var idx = options.menus.findIndex(function(menu) {
					return menu.color == color
				})
				//console.log('idx', idx)
				ctrlIf.select(idx)

				var pos = obj.getLatLng()
				//console.log('pos', pos)
				var pt = mapView.map.latLngToContainerPoint(pos)
				//console.log('pt', pt)	
				ctrlIf.showMenu(pt.x, pt.y)
				mapView.disableHandlers()				
			}


		}

		mapView.events.on('objectContextMenu', onObjectContextMenu)

		return {
			dispose: function() {
				console.log('[TacticViewObjectCircularMenu] dispose')
				mapView.events.off('objectContextMenu', onObjectContextMenu)
			}
		}

/*		ctrlIf.on('menuClosed', function() {
			//console.log('menuClosed')
			mapView.enableHandlers()
		})

		ctrlIf.on('menuSelected', function(menuInfo) {
			console.log('menuSelected', menuInfo, selObj.fullId, selObj.privateData)

			selObj.userData.options.color = menuInfo.color


			client.sendTo(selObj.creator, 'mapViewShapeEdited', selObj.userData)

			
		})*/

	})
})();

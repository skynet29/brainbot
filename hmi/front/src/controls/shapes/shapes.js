(function() {


	$$.registerControlEx('ShapesControl', {

		deps: ['WebSocketService'], 

		init: function(elt, options, client) {


			var model = {
				tableConfig: {
					columns: {
						name: 'Name',
						layer: 'Layer',
						shapeType: 'Shape Type',
						src: 'Source',
						lastModif: 'Last Modified'
					},
					actions: {
						'delete': 'fa fa-trash',
						'detail': 'fa fa-info'
					}
				},
				nbMsg: 0,
				filters: {
					name: '',
					layer: ''
				}			
			}
		
			var ctrl = $$.viewController(elt, {
				template: {gulp_inject: './shapes.html'},
				data: model,
				events: {


					onRemoveAll: function(ev) {
						for(let shapeId in ctrl.scope.iface.getDisplayedDatas()) {
							client.emit('mapViewAddShape.' + shapeId)
						}					
					},
					onItemAction: function(action, id) {
						console.log('itemAction', id, action)
						if (action == 'delete') {
							client.emit('mapViewAddShape.' + id)
						}
						if (action == 'detail') {
							var msg = ctrl.scope.iface.getItem(id)
							console.log('msg', msg)
							var html = `<pre>${JSON.stringify(msg.data, null, 4)}</pre>`
							$$.showAlert(html, 'Detail')
						}
					},
					onFilterChange: function(ev) {
						var field = $(this).data('filter')
						console.log('field', field)
						ctrl.model.filters[field] = $(this).val()
						ctrl.update('filters')					
					}
				},
				watches: {

					filters: function(newValue) {
						console.log('filters has change:', newValue)
						ctrl.scope.iface.setFilters(newValue)
						updateShapeNumber()
					}
				},
				init: function() {
					this.scope.iface.setFilters(this.model.filters)
				}
			})

			var tbody = elt.find('.FilteredTableControl tbody')

			function updateShapeNumber() {
				var nbMsg = tbody.find('tr').length
				ctrl.setData({nbMsg: nbMsg})
			}


			function getItemData(msg) {
				var tokens = msg.id.split('.')
				var layer = tokens[0]
				var id = tokens[1]
				return {
					name: id,
					layer: layer,
					shapeType: msg.data.shape,
					src: msg.src,
					lastModif: new Date(msg.time).toLocaleString(),
					data: msg.data
				}
			}


			function onTacticViewAddShape(msg) {
				if (msg.data == undefined) {
					ctrl.scope.iface.removeItem(msg.id)
				}
				else {
					ctrl.scope.iface.addItem(msg.id, getItemData(msg))
				}	
				updateShapeNumber()	
			}

			client.register('mapViewAddShape.*.*', true, onTacticViewAddShape)

			client.onClose = function() {
				ctrl.scope.iface.removeAllItems()
			}



			this.dispose = function() {
				console.log('[TacticShapesControl] dispose !!')
				client.unregister('mapViewAddShape.*.*', onTacticViewAddShape)
			}
			
		}

	})

})();

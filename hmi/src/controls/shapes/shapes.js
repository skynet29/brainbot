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
						data: 'Data',
						lastModif: 'Last Modified'
					},
					actions: {
						'delete': 'fa fa-trash'
					}
				},
				nbMsg: 0,
				dataVisible: false,
				filters: {
					name: '',
					layer: ''
				}			
			}
		
			var ctrl = $$.viewController(elt, {
				template: {gulp_inject: './shapes.html'},
				data: model,
				events: {
					onShowData: function(ev) {
						var dataVisible = $(this).prop('checked')
						ctrl.setData({dataVisible})
						
					},

					onRemoveAll: function(ev) {
						for(let shapeId in ctrl.scope.iface.getDisplayedDatas()) {
							client.emit('mapViewAddShape.' + shapeId)
						}					
					},
					onItemAction: function(action, id) {
						console.log('itemAction', id, action)
						client.emit('mapViewAddShape.' + id)
					},
					onFilterChange: function(ev) {
						var field = $(this).data('filter')
						console.log('field', field)
						ctrl.model.filters[field] = $(this).val()
						ctrl.update('filters')					
					}
				},
				watches: {
					dataVisible: function(newValue) {
						console.log('dataVisible has change:', newValue)
						tbody.find('pre').bnVisible(newValue)
					},

					filters: function(newValue) {
						console.log('filters has change:', newValue)
						ctrl.scope.iface.setFilters(newValue)
						updateShapeNumber()
						tbody.find('pre').bnVisible(ctrl.model.dataVisible)					
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
				var data = $(`<pre bn-prop="hidden: hidden" class="bn-no-margin">${JSON.stringify(msg.data, null, 4)}</pre>`)
					.processTemplate({hidden: !ctrl.model.dataVisible})
				return {
					name: id,
					layer: layer,
					shapeType: msg.data.shape,
					src: msg.src,
					lastModif: new Date(msg.time).toLocaleString(),
					data: data
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


			return {
				viewCtrl: ctrl,
				dispose: function() {
					console.log('[TacticShapesControl] dispose !!')
					client.unregister('mapViewAddShape.*.*', onTacticViewAddShape)
				}
			}
		}

	})

})();

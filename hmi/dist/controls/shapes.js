(function() {


	$$.registerControlEx('ShapesControl', {

		deps: ['WebSocketService'], 

		
	lib: 'shapes',
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
				template: "<div class=\"bn-flex-1 bn-flex-col\">\r\n	<div class=\"header\">\r\n		<div class=\"bn-flex-row bn-space-between bn-container\">\r\n			<div class=\"filters\" bn-event=\"input.filter: onFilterChange\">\r\n				<input type=\"text\" autofocus placeholder=\"Filter name\" data-filter=\"name\" class=\"filter\" bn-val=\"filters.name\">\r\n				<input type=\"text\" placeholder=\"Filter layer\" data-filter=\"layer\" class=\"filter\" bn-val=\"filters.layer\">\r\n			</div>\r\n			<div>Number of shapes: <span bn-text=\"nbMsg\"></span></div>\r\n		</div>		\r\n		<div class=\"bn-flex-row bn-space-between bn-container\">\r\n			<button class=\"removeAll w3-btn w3-blue\" bn-event=\"click: onRemoveAll\">Remove all shapes</button>\r\n			<div>\r\n				<input type=\"checkbox\" class=\"w3-check\" bn-prop=\"checked: dataVisible\" bn-event=\"click: onShowData\"><label> Show Data</label>\r\n			</div>\r\n		</div>\r\n	</div>\r\n	<div bn-iface=\"iface\" bn-control=\"FilteredTableControl\" bn-options=\"tableConfig\" class=\"bn-flex-1 bn-no-overflow\" bn-event=\"itemAction: onItemAction\"></div>	\r\n</div>\r\n\r\n",
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

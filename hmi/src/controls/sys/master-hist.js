(function() {



	$$.registerControlEx('MasterHistControl', {

		deps: ['WebSocketService'],

		init: function(elt, options, client) {

			var model = {
				tableConfig: {
					columns: {
						'topic': 'Topic',
						'src': 'Source',
						'lastModif': 'Last Modified',
						'data': 'Data'
					}
				},
				nbMsg: 0,
				dataVisible: false			
			}



			var ctrl = $$.viewController(elt, {
				template: {gulp_inject: './master-hist.html'},
				data: model, 
				events: 
				{
					onShowData: function(ev) {
						console.log('onShowData')
						model.dataVisible = $(this).prop('checked')
						tbody.find('pre').bnVisible(model.dataVisible)
					},
					onFilterChange: function(ev) {
						console.log('onFilterChange')
						var filter = $(this).data('filter')
						filters[filter] = $(this).val()
						ctrl.scope.iface.setFilters(filters)
						updateTopicNumber()
						tbody.find('pre').bnVisible(model.dataVisible)				
					}
				}
			})

			let filters = {}

			var tbody = ctrl.elt.find('tbody')

			function updateTopicNumber() {
				var nbMsg = tbody.find('tr').length
				ctrl.setData({nbMsg: nbMsg})
			}


			function onMessage(msg) {
				ctrl.scope.iface.addItem(msg.topic, getItemData(msg))
				updateTopicNumber()			
			}

			client.register('**', true, onMessage)

			client.onClose = function() {
				ctrl.scope.iface.removeAllItems()
			}


			
			function getItemData(msg) {
				var data = $(`<pre bn-prop="hidden: hidden" class="bn-no-margin">${JSON.stringify(msg.data, null, 4)}</pre>`)
					.processTemplate({hidden: !model.dataVisible})

				return {
					topic: msg.topic,
					src: msg.src,
					lastModif: new Date(msg.time).toLocaleString(),
					data: data			
				}
			}

			return {
				dispose: function() {
					client.unregister('**', onMessage)
				}
			}
		}



	})

})();






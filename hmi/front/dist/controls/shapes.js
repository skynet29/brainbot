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
				template: "<div class=\"bn-flex-1 bn-flex-col\">\r\n	<div class=\"header\">\r\n		<div class=\"bn-flex-row bn-space-between bn-container\">\r\n			<div class=\"filters\" bn-event=\"input.filter: onFilterChange\">\r\n				<input type=\"text\" autofocus placeholder=\"Filter name\" data-filter=\"name\" class=\"filter\" bn-val=\"filters.name\">\r\n				<input type=\"text\" placeholder=\"Filter layer\" data-filter=\"layer\" class=\"filter\" bn-val=\"filters.layer\">\r\n			</div>\r\n			<div>Number of shapes: <span bn-text=\"nbMsg\"></span></div>\r\n		</div>		\r\n		<div class=\"bn-flex-row bn-space-between bn-container\">\r\n			<button class=\"removeAll w3-btn w3-blue\" bn-event=\"click: onRemoveAll\">Remove all shapes</button>\r\n\r\n		</div>\r\n	</div>\r\n	<div bn-iface=\"iface\" bn-control=\"FilteredTableControl\" bn-options=\"tableConfig\" class=\"bn-flex-1 bn-no-overflow\" bn-event=\"itemAction: onItemAction\"></div>	\r\n</div>\r\n\r\n",
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNoYXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InNoYXBlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdTaGFwZXNDb250cm9sJywge1xyXG5cclxuXHRcdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLCBcclxuXHJcblx0XHRcblx0bGliOiAnc2hhcGVzJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50KSB7XHJcblxyXG5cclxuXHRcdFx0dmFyIG1vZGVsID0ge1xyXG5cdFx0XHRcdHRhYmxlQ29uZmlnOiB7XHJcblx0XHRcdFx0XHRjb2x1bW5zOiB7XHJcblx0XHRcdFx0XHRcdG5hbWU6ICdOYW1lJyxcclxuXHRcdFx0XHRcdFx0bGF5ZXI6ICdMYXllcicsXHJcblx0XHRcdFx0XHRcdHNoYXBlVHlwZTogJ1NoYXBlIFR5cGUnLFxyXG5cdFx0XHRcdFx0XHRzcmM6ICdTb3VyY2UnLFxyXG5cdFx0XHRcdFx0XHRsYXN0TW9kaWY6ICdMYXN0IE1vZGlmaWVkJ1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGFjdGlvbnM6IHtcclxuXHRcdFx0XHRcdFx0J2RlbGV0ZSc6ICdmYSBmYS10cmFzaCcsXHJcblx0XHRcdFx0XHRcdCdkZXRhaWwnOiAnZmEgZmEtaW5mbydcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG5iTXNnOiAwLFxyXG5cdFx0XHRcdGZpbHRlcnM6IHtcclxuXHRcdFx0XHRcdG5hbWU6ICcnLFxyXG5cdFx0XHRcdFx0bGF5ZXI6ICcnXHJcblx0XHRcdFx0fVx0XHRcdFxyXG5cdFx0XHR9XHJcblx0XHRcclxuXHRcdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LTEgYm4tZmxleC1jb2xcXFwiPlxcclxcblx0PGRpdiBjbGFzcz1cXFwiaGVhZGVyXFxcIj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3cgYm4tc3BhY2UtYmV0d2VlbiBibi1jb250YWluZXJcXFwiPlxcclxcblx0XHRcdDxkaXYgY2xhc3M9XFxcImZpbHRlcnNcXFwiIGJuLWV2ZW50PVxcXCJpbnB1dC5maWx0ZXI6IG9uRmlsdGVyQ2hhbmdlXFxcIj5cXHJcXG5cdFx0XHRcdDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBhdXRvZm9jdXMgcGxhY2Vob2xkZXI9XFxcIkZpbHRlciBuYW1lXFxcIiBkYXRhLWZpbHRlcj1cXFwibmFtZVxcXCIgY2xhc3M9XFxcImZpbHRlclxcXCIgYm4tdmFsPVxcXCJmaWx0ZXJzLm5hbWVcXFwiPlxcclxcblx0XHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHBsYWNlaG9sZGVyPVxcXCJGaWx0ZXIgbGF5ZXJcXFwiIGRhdGEtZmlsdGVyPVxcXCJsYXllclxcXCIgY2xhc3M9XFxcImZpbHRlclxcXCIgYm4tdmFsPVxcXCJmaWx0ZXJzLmxheWVyXFxcIj5cXHJcXG5cdFx0XHQ8L2Rpdj5cXHJcXG5cdFx0XHQ8ZGl2Pk51bWJlciBvZiBzaGFwZXM6IDxzcGFuIGJuLXRleHQ9XFxcIm5iTXNnXFxcIj48L3NwYW4+PC9kaXY+XFxyXFxuXHRcdDwvZGl2Plx0XHRcXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3cgYm4tc3BhY2UtYmV0d2VlbiBibi1jb250YWluZXJcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcInJlbW92ZUFsbCB3My1idG4gdzMtYmx1ZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblJlbW92ZUFsbFxcXCI+UmVtb3ZlIGFsbCBzaGFwZXM8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdDxkaXYgYm4taWZhY2U9XFxcImlmYWNlXFxcIiBibi1jb250cm9sPVxcXCJGaWx0ZXJlZFRhYmxlQ29udHJvbFxcXCIgYm4tb3B0aW9ucz1cXFwidGFibGVDb25maWdcXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgYm4tbm8tb3ZlcmZsb3dcXFwiIGJuLWV2ZW50PVxcXCJpdGVtQWN0aW9uOiBvbkl0ZW1BY3Rpb25cXFwiPjwvZGl2Plx0XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXCIsXHJcblx0XHRcdFx0ZGF0YTogbW9kZWwsXHJcblx0XHRcdFx0ZXZlbnRzOiB7XHJcblxyXG5cclxuXHRcdFx0XHRcdG9uUmVtb3ZlQWxsOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0XHRmb3IobGV0IHNoYXBlSWQgaW4gY3RybC5zY29wZS5pZmFjZS5nZXREaXNwbGF5ZWREYXRhcygpKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ21hcFZpZXdBZGRTaGFwZS4nICsgc2hhcGVJZClcclxuXHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRvbkl0ZW1BY3Rpb246IGZ1bmN0aW9uKGFjdGlvbiwgaWQpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2l0ZW1BY3Rpb24nLCBpZCwgYWN0aW9uKVxyXG5cdFx0XHRcdFx0XHRpZiAoYWN0aW9uID09ICdkZWxldGUnKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ21hcFZpZXdBZGRTaGFwZS4nICsgaWQpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0aWYgKGFjdGlvbiA9PSAnZGV0YWlsJykge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBtc2cgPSBjdHJsLnNjb3BlLmlmYWNlLmdldEl0ZW0oaWQpXHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ21zZycsIG1zZylcclxuXHRcdFx0XHRcdFx0XHR2YXIgaHRtbCA9IGA8cHJlPiR7SlNPTi5zdHJpbmdpZnkobXNnLmRhdGEsIG51bGwsIDQpfTwvcHJlPmBcclxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoaHRtbCwgJ0RldGFpbCcpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRvbkZpbHRlckNoYW5nZTogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGZpZWxkID0gJCh0aGlzKS5kYXRhKCdmaWx0ZXInKVxyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnZmllbGQnLCBmaWVsZClcclxuXHRcdFx0XHRcdFx0Y3RybC5tb2RlbC5maWx0ZXJzW2ZpZWxkXSA9ICQodGhpcykudmFsKClcclxuXHRcdFx0XHRcdFx0Y3RybC51cGRhdGUoJ2ZpbHRlcnMnKVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHdhdGNoZXM6IHtcclxuXHJcblx0XHRcdFx0XHRmaWx0ZXJzOiBmdW5jdGlvbihuZXdWYWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnZmlsdGVycyBoYXMgY2hhbmdlOicsIG5ld1ZhbHVlKVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNjb3BlLmlmYWNlLnNldEZpbHRlcnMobmV3VmFsdWUpXHJcblx0XHRcdFx0XHRcdHVwZGF0ZVNoYXBlTnVtYmVyKClcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dGhpcy5zY29wZS5pZmFjZS5zZXRGaWx0ZXJzKHRoaXMubW9kZWwuZmlsdGVycylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHR2YXIgdGJvZHkgPSBlbHQuZmluZCgnLkZpbHRlcmVkVGFibGVDb250cm9sIHRib2R5JylcclxuXHJcblx0XHRcdGZ1bmN0aW9uIHVwZGF0ZVNoYXBlTnVtYmVyKCkge1xyXG5cdFx0XHRcdHZhciBuYk1zZyA9IHRib2R5LmZpbmQoJ3RyJykubGVuZ3RoXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtuYk1zZzogbmJNc2d9KVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZ2V0SXRlbURhdGEobXNnKSB7XHJcblx0XHRcdFx0dmFyIHRva2VucyA9IG1zZy5pZC5zcGxpdCgnLicpXHJcblx0XHRcdFx0dmFyIGxheWVyID0gdG9rZW5zWzBdXHJcblx0XHRcdFx0dmFyIGlkID0gdG9rZW5zWzFdXHJcblx0XHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdG5hbWU6IGlkLFxyXG5cdFx0XHRcdFx0bGF5ZXI6IGxheWVyLFxyXG5cdFx0XHRcdFx0c2hhcGVUeXBlOiBtc2cuZGF0YS5zaGFwZSxcclxuXHRcdFx0XHRcdHNyYzogbXNnLnNyYyxcclxuXHRcdFx0XHRcdGxhc3RNb2RpZjogbmV3IERhdGUobXNnLnRpbWUpLnRvTG9jYWxlU3RyaW5nKCksXHJcblx0XHRcdFx0XHRkYXRhOiBtc2cuZGF0YVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIG9uVGFjdGljVmlld0FkZFNoYXBlKG1zZykge1xyXG5cdFx0XHRcdGlmIChtc2cuZGF0YSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2UucmVtb3ZlSXRlbShtc2cuaWQpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0Y3RybC5zY29wZS5pZmFjZS5hZGRJdGVtKG1zZy5pZCwgZ2V0SXRlbURhdGEobXNnKSlcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0XHR1cGRhdGVTaGFwZU51bWJlcigpXHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2xpZW50LnJlZ2lzdGVyKCdtYXBWaWV3QWRkU2hhcGUuKi4qJywgdHJ1ZSwgb25UYWN0aWNWaWV3QWRkU2hhcGUpXHJcblxyXG5cdFx0XHRjbGllbnQub25DbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2UucmVtb3ZlQWxsSXRlbXMoKVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHJcblx0XHRcdHRoaXMuZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbVGFjdGljU2hhcGVzQ29udHJvbF0gZGlzcG9zZSAhIScpXHJcblx0XHRcdFx0Y2xpZW50LnVucmVnaXN0ZXIoJ21hcFZpZXdBZGRTaGFwZS4qLionLCBvblRhY3RpY1ZpZXdBZGRTaGFwZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcbiJdfQ==

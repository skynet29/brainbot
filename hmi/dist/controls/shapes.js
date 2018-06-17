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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNoYXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJzaGFwZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnU2hhcGVzQ29udHJvbCcsIHtcclxuXHJcblx0XHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnXSwgXHJcblxyXG5cdFx0XG5cdGxpYjogJ3NoYXBlcycsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xyXG5cclxuXHJcblx0XHRcdHZhciBtb2RlbCA9IHtcclxuXHRcdFx0XHR0YWJsZUNvbmZpZzoge1xyXG5cdFx0XHRcdFx0Y29sdW1uczoge1xyXG5cdFx0XHRcdFx0XHRuYW1lOiAnTmFtZScsXHJcblx0XHRcdFx0XHRcdGxheWVyOiAnTGF5ZXInLFxyXG5cdFx0XHRcdFx0XHRzaGFwZVR5cGU6ICdTaGFwZSBUeXBlJyxcclxuXHRcdFx0XHRcdFx0c3JjOiAnU291cmNlJyxcclxuXHRcdFx0XHRcdFx0ZGF0YTogJ0RhdGEnLFxyXG5cdFx0XHRcdFx0XHRsYXN0TW9kaWY6ICdMYXN0IE1vZGlmaWVkJ1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGFjdGlvbnM6IHtcclxuXHRcdFx0XHRcdFx0J2RlbGV0ZSc6ICdmYSBmYS10cmFzaCdcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG5iTXNnOiAwLFxyXG5cdFx0XHRcdGRhdGFWaXNpYmxlOiBmYWxzZSxcclxuXHRcdFx0XHRmaWx0ZXJzOiB7XHJcblx0XHRcdFx0XHRuYW1lOiAnJyxcclxuXHRcdFx0XHRcdGxheWVyOiAnJ1xyXG5cdFx0XHRcdH1cdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC0xIGJuLWZsZXgtY29sXFxcIj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcImhlYWRlclxcXCI+XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93IGJuLXNwYWNlLWJldHdlZW4gYm4tY29udGFpbmVyXFxcIj5cXHJcXG5cdFx0XHQ8ZGl2IGNsYXNzPVxcXCJmaWx0ZXJzXFxcIiBibi1ldmVudD1cXFwiaW5wdXQuZmlsdGVyOiBvbkZpbHRlckNoYW5nZVxcXCI+XFxyXFxuXHRcdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgYXV0b2ZvY3VzIHBsYWNlaG9sZGVyPVxcXCJGaWx0ZXIgbmFtZVxcXCIgZGF0YS1maWx0ZXI9XFxcIm5hbWVcXFwiIGNsYXNzPVxcXCJmaWx0ZXJcXFwiIGJuLXZhbD1cXFwiZmlsdGVycy5uYW1lXFxcIj5cXHJcXG5cdFx0XHRcdDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBwbGFjZWhvbGRlcj1cXFwiRmlsdGVyIGxheWVyXFxcIiBkYXRhLWZpbHRlcj1cXFwibGF5ZXJcXFwiIGNsYXNzPVxcXCJmaWx0ZXJcXFwiIGJuLXZhbD1cXFwiZmlsdGVycy5sYXllclxcXCI+XFxyXFxuXHRcdFx0PC9kaXY+XFxyXFxuXHRcdFx0PGRpdj5OdW1iZXIgb2Ygc2hhcGVzOiA8c3BhbiBibi10ZXh0PVxcXCJuYk1zZ1xcXCI+PC9zcGFuPjwvZGl2Plxcclxcblx0XHQ8L2Rpdj5cdFx0XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93IGJuLXNwYWNlLWJldHdlZW4gYm4tY29udGFpbmVyXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJyZW1vdmVBbGwgdzMtYnRuIHczLWJsdWVcXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25SZW1vdmVBbGxcXFwiPlJlbW92ZSBhbGwgc2hhcGVzPC9idXR0b24+XFxyXFxuXHRcdFx0PGRpdj5cXHJcXG5cdFx0XHRcdDxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgY2xhc3M9XFxcInczLWNoZWNrXFxcIiBibi1wcm9wPVxcXCJjaGVja2VkOiBkYXRhVmlzaWJsZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblNob3dEYXRhXFxcIj48bGFiZWw+IFNob3cgRGF0YTwvbGFiZWw+XFxyXFxuXHRcdFx0PC9kaXY+XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0PC9kaXY+XFxyXFxuXHQ8ZGl2IGJuLWlmYWNlPVxcXCJpZmFjZVxcXCIgYm4tY29udHJvbD1cXFwiRmlsdGVyZWRUYWJsZUNvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcInRhYmxlQ29uZmlnXFxcIiBjbGFzcz1cXFwiYm4tZmxleC0xIGJuLW5vLW92ZXJmbG93XFxcIiBibi1ldmVudD1cXFwiaXRlbUFjdGlvbjogb25JdGVtQWN0aW9uXFxcIj48L2Rpdj5cdFxcclxcbjwvZGl2PlxcclxcblxcclxcblwiLFxyXG5cdFx0XHRcdGRhdGE6IG1vZGVsLFxyXG5cdFx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdFx0b25TaG93RGF0YTogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGRhdGFWaXNpYmxlID0gJCh0aGlzKS5wcm9wKCdjaGVja2VkJylcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtkYXRhVmlzaWJsZX0pXHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0XHRvblJlbW92ZUFsbDogZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0XHRcdFx0Zm9yKGxldCBzaGFwZUlkIGluIGN0cmwuc2NvcGUuaWZhY2UuZ2V0RGlzcGxheWVkRGF0YXMoKSkge1xyXG5cdFx0XHRcdFx0XHRcdGNsaWVudC5lbWl0KCdtYXBWaWV3QWRkU2hhcGUuJyArIHNoYXBlSWQpXHJcblx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0b25JdGVtQWN0aW9uOiBmdW5jdGlvbihhY3Rpb24sIGlkKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdpdGVtQWN0aW9uJywgaWQsIGFjdGlvbilcclxuXHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ21hcFZpZXdBZGRTaGFwZS4nICsgaWQpXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0b25GaWx0ZXJDaGFuZ2U6IGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHRcdHZhciBmaWVsZCA9ICQodGhpcykuZGF0YSgnZmlsdGVyJylcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2ZpZWxkJywgZmllbGQpXHJcblx0XHRcdFx0XHRcdGN0cmwubW9kZWwuZmlsdGVyc1tmaWVsZF0gPSAkKHRoaXMpLnZhbCgpXHJcblx0XHRcdFx0XHRcdGN0cmwudXBkYXRlKCdmaWx0ZXJzJylcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHR3YXRjaGVzOiB7XHJcblx0XHRcdFx0XHRkYXRhVmlzaWJsZTogZnVuY3Rpb24obmV3VmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2RhdGFWaXNpYmxlIGhhcyBjaGFuZ2U6JywgbmV3VmFsdWUpXHJcblx0XHRcdFx0XHRcdHRib2R5LmZpbmQoJ3ByZScpLmJuVmlzaWJsZShuZXdWYWx1ZSlcclxuXHRcdFx0XHRcdH0sXHJcblxyXG5cdFx0XHRcdFx0ZmlsdGVyczogZnVuY3Rpb24obmV3VmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2ZpbHRlcnMgaGFzIGNoYW5nZTonLCBuZXdWYWx1ZSlcclxuXHRcdFx0XHRcdFx0Y3RybC5zY29wZS5pZmFjZS5zZXRGaWx0ZXJzKG5ld1ZhbHVlKVxyXG5cdFx0XHRcdFx0XHR1cGRhdGVTaGFwZU51bWJlcigpXHJcblx0XHRcdFx0XHRcdHRib2R5LmZpbmQoJ3ByZScpLmJuVmlzaWJsZShjdHJsLm1vZGVsLmRhdGFWaXNpYmxlKVx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dGhpcy5zY29wZS5pZmFjZS5zZXRGaWx0ZXJzKHRoaXMubW9kZWwuZmlsdGVycylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHR2YXIgdGJvZHkgPSBlbHQuZmluZCgnLkZpbHRlcmVkVGFibGVDb250cm9sIHRib2R5JylcclxuXHJcblx0XHRcdGZ1bmN0aW9uIHVwZGF0ZVNoYXBlTnVtYmVyKCkge1xyXG5cdFx0XHRcdHZhciBuYk1zZyA9IHRib2R5LmZpbmQoJ3RyJykubGVuZ3RoXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtuYk1zZzogbmJNc2d9KVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZ2V0SXRlbURhdGEobXNnKSB7XHJcblx0XHRcdFx0dmFyIHRva2VucyA9IG1zZy5pZC5zcGxpdCgnLicpXHJcblx0XHRcdFx0dmFyIGxheWVyID0gdG9rZW5zWzBdXHJcblx0XHRcdFx0dmFyIGlkID0gdG9rZW5zWzFdXHJcblx0XHRcdFx0dmFyIGRhdGEgPSAkKGA8cHJlIGJuLXByb3A9XCJoaWRkZW46IGhpZGRlblwiIGNsYXNzPVwiYm4tbm8tbWFyZ2luXCI+JHtKU09OLnN0cmluZ2lmeShtc2cuZGF0YSwgbnVsbCwgNCl9PC9wcmU+YClcclxuXHRcdFx0XHRcdC5wcm9jZXNzVGVtcGxhdGUoe2hpZGRlbjogIWN0cmwubW9kZWwuZGF0YVZpc2libGV9KVxyXG5cdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRuYW1lOiBpZCxcclxuXHRcdFx0XHRcdGxheWVyOiBsYXllcixcclxuXHRcdFx0XHRcdHNoYXBlVHlwZTogbXNnLmRhdGEuc2hhcGUsXHJcblx0XHRcdFx0XHRzcmM6IG1zZy5zcmMsXHJcblx0XHRcdFx0XHRsYXN0TW9kaWY6IG5ldyBEYXRlKG1zZy50aW1lKS50b0xvY2FsZVN0cmluZygpLFxyXG5cdFx0XHRcdFx0ZGF0YTogZGF0YVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIG9uVGFjdGljVmlld0FkZFNoYXBlKG1zZykge1xyXG5cdFx0XHRcdGlmIChtc2cuZGF0YSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2UucmVtb3ZlSXRlbShtc2cuaWQpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0Y3RybC5zY29wZS5pZmFjZS5hZGRJdGVtKG1zZy5pZCwgZ2V0SXRlbURhdGEobXNnKSlcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0XHR1cGRhdGVTaGFwZU51bWJlcigpXHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2xpZW50LnJlZ2lzdGVyKCdtYXBWaWV3QWRkU2hhcGUuKi4qJywgdHJ1ZSwgb25UYWN0aWNWaWV3QWRkU2hhcGUpXHJcblxyXG5cdFx0XHRjbGllbnQub25DbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2UucmVtb3ZlQWxsSXRlbXMoKVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHR2aWV3Q3RybDogY3RybCxcclxuXHRcdFx0XHRkaXNwb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdbVGFjdGljU2hhcGVzQ29udHJvbF0gZGlzcG9zZSAhIScpXHJcblx0XHRcdFx0XHRjbGllbnQudW5yZWdpc3RlcignbWFwVmlld0FkZFNoYXBlLiouKicsIG9uVGFjdGljVmlld0FkZFNoYXBlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIl19

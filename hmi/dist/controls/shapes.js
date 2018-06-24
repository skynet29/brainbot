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



			this.dispose = function() {
				console.log('[TacticShapesControl] dispose !!')
				client.unregister('mapViewAddShape.*.*', onTacticViewAddShape)
			}
			
		}

	})

})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNoYXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic2hhcGVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ1NoYXBlc0NvbnRyb2wnLCB7XHJcblxyXG5cdFx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJ10sIFxyXG5cclxuXHRcdFxuXHRsaWI6ICdzaGFwZXMnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcclxuXHJcblxyXG5cdFx0XHR2YXIgbW9kZWwgPSB7XHJcblx0XHRcdFx0dGFibGVDb25maWc6IHtcclxuXHRcdFx0XHRcdGNvbHVtbnM6IHtcclxuXHRcdFx0XHRcdFx0bmFtZTogJ05hbWUnLFxyXG5cdFx0XHRcdFx0XHRsYXllcjogJ0xheWVyJyxcclxuXHRcdFx0XHRcdFx0c2hhcGVUeXBlOiAnU2hhcGUgVHlwZScsXHJcblx0XHRcdFx0XHRcdHNyYzogJ1NvdXJjZScsXHJcblx0XHRcdFx0XHRcdGRhdGE6ICdEYXRhJyxcclxuXHRcdFx0XHRcdFx0bGFzdE1vZGlmOiAnTGFzdCBNb2RpZmllZCdcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRhY3Rpb25zOiB7XHJcblx0XHRcdFx0XHRcdCdkZWxldGUnOiAnZmEgZmEtdHJhc2gnXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRuYk1zZzogMCxcclxuXHRcdFx0XHRkYXRhVmlzaWJsZTogZmFsc2UsXHJcblx0XHRcdFx0ZmlsdGVyczoge1xyXG5cdFx0XHRcdFx0bmFtZTogJycsXHJcblx0XHRcdFx0XHRsYXllcjogJydcclxuXHRcdFx0XHR9XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LWNvbFxcXCI+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJoZWFkZXJcXFwiPlxcclxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1zcGFjZS1iZXR3ZWVuIGJuLWNvbnRhaW5lclxcXCI+XFxyXFxuXHRcdFx0PGRpdiBjbGFzcz1cXFwiZmlsdGVyc1xcXCIgYm4tZXZlbnQ9XFxcImlucHV0LmZpbHRlcjogb25GaWx0ZXJDaGFuZ2VcXFwiPlxcclxcblx0XHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGF1dG9mb2N1cyBwbGFjZWhvbGRlcj1cXFwiRmlsdGVyIG5hbWVcXFwiIGRhdGEtZmlsdGVyPVxcXCJuYW1lXFxcIiBjbGFzcz1cXFwiZmlsdGVyXFxcIiBibi12YWw9XFxcImZpbHRlcnMubmFtZVxcXCI+XFxyXFxuXHRcdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIkZpbHRlciBsYXllclxcXCIgZGF0YS1maWx0ZXI9XFxcImxheWVyXFxcIiBjbGFzcz1cXFwiZmlsdGVyXFxcIiBibi12YWw9XFxcImZpbHRlcnMubGF5ZXJcXFwiPlxcclxcblx0XHRcdDwvZGl2Plxcclxcblx0XHRcdDxkaXY+TnVtYmVyIG9mIHNoYXBlczogPHNwYW4gYm4tdGV4dD1cXFwibmJNc2dcXFwiPjwvc3Bhbj48L2Rpdj5cXHJcXG5cdFx0PC9kaXY+XHRcdFxcclxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1zcGFjZS1iZXR3ZWVuIGJuLWNvbnRhaW5lclxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwicmVtb3ZlQWxsIHczLWJ0biB3My1ibHVlXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uUmVtb3ZlQWxsXFxcIj5SZW1vdmUgYWxsIHNoYXBlczwvYnV0dG9uPlxcclxcblx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHQ8aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGNsYXNzPVxcXCJ3My1jaGVja1xcXCIgYm4tcHJvcD1cXFwiY2hlY2tlZDogZGF0YVZpc2libGVcXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25TaG93RGF0YVxcXCI+PGxhYmVsPiBTaG93IERhdGE8L2xhYmVsPlxcclxcblx0XHRcdDwvZGl2Plxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdDwvZGl2Plxcclxcblx0PGRpdiBibi1pZmFjZT1cXFwiaWZhY2VcXFwiIGJuLWNvbnRyb2w9XFxcIkZpbHRlcmVkVGFibGVDb250cm9sXFxcIiBibi1vcHRpb25zPVxcXCJ0YWJsZUNvbmZpZ1xcXCIgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1uby1vdmVyZmxvd1xcXCIgYm4tZXZlbnQ9XFxcIml0ZW1BY3Rpb246IG9uSXRlbUFjdGlvblxcXCI+PC9kaXY+XHRcXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cIixcclxuXHRcdFx0XHRkYXRhOiBtb2RlbCxcclxuXHRcdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRcdG9uU2hvd0RhdGE6IGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHRcdHZhciBkYXRhVmlzaWJsZSA9ICQodGhpcykucHJvcCgnY2hlY2tlZCcpXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7ZGF0YVZpc2libGV9KVxyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH0sXHJcblxyXG5cdFx0XHRcdFx0b25SZW1vdmVBbGw6IGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHRcdGZvcihsZXQgc2hhcGVJZCBpbiBjdHJsLnNjb3BlLmlmYWNlLmdldERpc3BsYXllZERhdGFzKCkpIHtcclxuXHRcdFx0XHRcdFx0XHRjbGllbnQuZW1pdCgnbWFwVmlld0FkZFNoYXBlLicgKyBzaGFwZUlkKVxyXG5cdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdG9uSXRlbUFjdGlvbjogZnVuY3Rpb24oYWN0aW9uLCBpZCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnaXRlbUFjdGlvbicsIGlkLCBhY3Rpb24pXHJcblx0XHRcdFx0XHRcdGNsaWVudC5lbWl0KCdtYXBWaWV3QWRkU2hhcGUuJyArIGlkKVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdG9uRmlsdGVyQ2hhbmdlOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0XHR2YXIgZmllbGQgPSAkKHRoaXMpLmRhdGEoJ2ZpbHRlcicpXHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdmaWVsZCcsIGZpZWxkKVxyXG5cdFx0XHRcdFx0XHRjdHJsLm1vZGVsLmZpbHRlcnNbZmllbGRdID0gJCh0aGlzKS52YWwoKVxyXG5cdFx0XHRcdFx0XHRjdHJsLnVwZGF0ZSgnZmlsdGVycycpXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0d2F0Y2hlczoge1xyXG5cdFx0XHRcdFx0ZGF0YVZpc2libGU6IGZ1bmN0aW9uKG5ld1ZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdkYXRhVmlzaWJsZSBoYXMgY2hhbmdlOicsIG5ld1ZhbHVlKVxyXG5cdFx0XHRcdFx0XHR0Ym9keS5maW5kKCdwcmUnKS5iblZpc2libGUobmV3VmFsdWUpXHJcblx0XHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHRcdGZpbHRlcnM6IGZ1bmN0aW9uKG5ld1ZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdmaWx0ZXJzIGhhcyBjaGFuZ2U6JywgbmV3VmFsdWUpXHJcblx0XHRcdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2Uuc2V0RmlsdGVycyhuZXdWYWx1ZSlcclxuXHRcdFx0XHRcdFx0dXBkYXRlU2hhcGVOdW1iZXIoKVxyXG5cdFx0XHRcdFx0XHR0Ym9keS5maW5kKCdwcmUnKS5iblZpc2libGUoY3RybC5tb2RlbC5kYXRhVmlzaWJsZSlcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRpbml0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHRoaXMuc2NvcGUuaWZhY2Uuc2V0RmlsdGVycyh0aGlzLm1vZGVsLmZpbHRlcnMpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0dmFyIHRib2R5ID0gZWx0LmZpbmQoJy5GaWx0ZXJlZFRhYmxlQ29udHJvbCB0Ym9keScpXHJcblxyXG5cdFx0XHRmdW5jdGlvbiB1cGRhdGVTaGFwZU51bWJlcigpIHtcclxuXHRcdFx0XHR2YXIgbmJNc2cgPSB0Ym9keS5maW5kKCd0cicpLmxlbmd0aFxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7bmJNc2c6IG5iTXNnfSlcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGdldEl0ZW1EYXRhKG1zZykge1xyXG5cdFx0XHRcdHZhciB0b2tlbnMgPSBtc2cuaWQuc3BsaXQoJy4nKVxyXG5cdFx0XHRcdHZhciBsYXllciA9IHRva2Vuc1swXVxyXG5cdFx0XHRcdHZhciBpZCA9IHRva2Vuc1sxXVxyXG5cdFx0XHRcdHZhciBkYXRhID0gJChgPHByZSBibi1wcm9wPVwiaGlkZGVuOiBoaWRkZW5cIiBjbGFzcz1cImJuLW5vLW1hcmdpblwiPiR7SlNPTi5zdHJpbmdpZnkobXNnLmRhdGEsIG51bGwsIDQpfTwvcHJlPmApXHJcblx0XHRcdFx0XHQucHJvY2Vzc1RlbXBsYXRlKHtoaWRkZW46ICFjdHJsLm1vZGVsLmRhdGFWaXNpYmxlfSlcclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0bmFtZTogaWQsXHJcblx0XHRcdFx0XHRsYXllcjogbGF5ZXIsXHJcblx0XHRcdFx0XHRzaGFwZVR5cGU6IG1zZy5kYXRhLnNoYXBlLFxyXG5cdFx0XHRcdFx0c3JjOiBtc2cuc3JjLFxyXG5cdFx0XHRcdFx0bGFzdE1vZGlmOiBuZXcgRGF0ZShtc2cudGltZSkudG9Mb2NhbGVTdHJpbmcoKSxcclxuXHRcdFx0XHRcdGRhdGE6IGRhdGFcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBvblRhY3RpY1ZpZXdBZGRTaGFwZShtc2cpIHtcclxuXHRcdFx0XHRpZiAobXNnLmRhdGEgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRjdHJsLnNjb3BlLmlmYWNlLnJlbW92ZUl0ZW0obXNnLmlkKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2UuYWRkSXRlbShtc2cuaWQsIGdldEl0ZW1EYXRhKG1zZykpXHJcblx0XHRcdFx0fVx0XHJcblx0XHRcdFx0dXBkYXRlU2hhcGVOdW1iZXIoKVx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNsaWVudC5yZWdpc3RlcignbWFwVmlld0FkZFNoYXBlLiouKicsIHRydWUsIG9uVGFjdGljVmlld0FkZFNoYXBlKVxyXG5cclxuXHRcdFx0Y2xpZW50Lm9uQ2xvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjdHJsLnNjb3BlLmlmYWNlLnJlbW92ZUFsbEl0ZW1zKClcclxuXHRcdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0XHR0aGlzLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnW1RhY3RpY1NoYXBlc0NvbnRyb2xdIGRpc3Bvc2UgISEnKVxyXG5cdFx0XHRcdGNsaWVudC51bnJlZ2lzdGVyKCdtYXBWaWV3QWRkU2hhcGUuKi4qJywgb25UYWN0aWNWaWV3QWRkU2hhcGUpXHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iXX0=

(function() {

	function getTemplate(headers) {
		return `
			<div class="scrollPanel">
	            <table class="w3-table-all w3-small">
	                <thead>
	                    <tr class="w3-green">
	                    	${headers}
	                    </tr>
	                </thead>
	                <tbody></tbody>
	            </table>
            </div>
		`
	}

	function getItemTemplate(rows) {
		return `
            <tr class="item" bn-attr="data-id: _id">
            	${rows}
            </tr>	
		`
	}



	$$.registerControlEx('FilteredTableControl', {

		iface: `addItem(id, data);removeItem(id);removeAllItems();getItem(id);setFilters(filters);getDatas();getDisplayedDatas();on(event, callback)`,
		events: 'itemAction',

		init: function(elt, options) {

			console.log('options', options)

			var columns =  $$.obj2Array(options.columns)
			var actions = $$.obj2Array(options.actions)
			var headers = columns.map((column) => `<th>${column.value}</th>`)		
			var rows = columns.map((column) => `<td bn-html="${column.key}"></td>`)
			if (actions.length > 0) {
				headers.push(`<th>Action</th>`)

				var buttons = actions.map((action) => `<button data-action="${action.key}" class="w3-button"><i class="${action.value}"></i></button>`)
				rows.push(`<td>${buttons.join('')}</td>`)
			}

			//console.log('rows', rows)
			var itemTemplate = getItemTemplate(rows.join(''))
			//console.log('itemTemplate', itemTemplate)

			elt.append(getTemplate(headers.join('')))
			elt.addClass('bn-flex-col')

			let datas = {}
			let events = new EventEmitter2()
			let _filters = {}
			let displayedItems = {}

			const tbody = elt.find('tbody')
			tbody.on('click', '[data-action]', function() {
				var id = $(this).closest('.item').data('id')
				var action = $(this).data('action')
				console.log('click', id, 'action', action)
				events.emit('itemAction', action, id)
			})

			this.addItem = function(id, data) {

				var itemData = $.extend({'_id': id}, data)
				//console.log('addItem', itemData)
				
				if (datas[id] != undefined) {
					var item = displayedItems[id]
					if (item != undefined) {
						item.elt.updateTemplate(item.ctx, itemData)
					}
				}
				else if (isInFilter(data)){
					var elt = $(itemTemplate)
					var ctx = elt.processTemplate(itemData)
					displayedItems[id] = {elt, ctx}
					tbody.append(elt)
				}
				datas[id] = data
			}

			this.removeItem = function(id) {
				//console.log('removeItem', id)
				if (datas[id] != undefined) {
					delete datas[id]
					var item = displayedItems[id]
					if (item != undefined) {
						item.elt.remove()
						delete displayedItems[id]
					}
				}			
			}

			this.getItem = function(id) {
				return datas[id]
			}

			this.removeAllItems = function() {
				//console.log('removeAllItems')
				datas = {}
				displayedItems = {}
				tbody.empty()		
			}

			function isInFilter(data) {
				var ret = true
				for(var f in _filters) {
					var value = data[f]
					var filterValue = _filters[f]
					ret &= (filterValue == '' || value.startsWith(filterValue))
				}
				return ret
			}

			this.setFilters = function(filters) {
				_filters = filters
				dispTable()
			}


			function dispTable() {
				displayedItems = {}
				let items = []
				for(let id in datas) {
					var data = datas[id]
					if (isInFilter(data)) {
						var itemData = $.extend({'_id': id}, data)
						var elt = $(itemTemplate)
						var ctx = elt.processTemplate(itemData)			
						items.push(elt)
						displayedItems[id] = {elt, ctx}
					}

				}
				
				
				tbody.empty().append(items)
			}

			this.getDatas = function() {
				return datas
			}

			this.getDisplayedDatas = function() {
				var ret = {}
				for(let i in displayedItems) {
					ret[i] = datas[i]
				}
				return ret
			}

			this.on = events.on.bind(events)


		}
	})

})();

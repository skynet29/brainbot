
$$.registerControlEx('AccordionControl', {
	
	lib: 'ui',
init: function(elt, options) {

		elt.children('div').each(function() {
			var div = $(this)
			var title = div.attr('title')
			div.before($('<h3>').text(title))
		})
		elt.accordion(options)
	}
});



(function() {

	$.datepicker.setDefaults($.datepicker.regional['fr'])


	$$.registerControlEx('DatePickerControl', {
		props: {
			showButtonPanel: {val: false}
		},
		events: 'change',
		
	lib: 'ui',
init: function(elt, options) {

			elt.datepicker(options)

			var value = elt.val()
			if (typeof value == 'string') {
				var ms = Date.parse(value)
				//console.log('[DatePickerControl] ms', ms)
				var date = new Date(ms)
				//console.log('[DatePickerControl] date', date)
				elt.datepicker('setDate', date)
			}
				
			return {
				setValue: function(date) {
					elt.datepicker('setDate', date)
				},
				getValue: function() {
					return elt.datepicker('getDate')
				}
			}
		}

	})
})();

(function() {	

	$$.loadStyle('/controls/ui.css')
})();
$$.registerControlEx('DialogControl', {
	
	lib: 'ui',
init: function(elt, options) {

		options.autoOpen = false
		options.appendTo = elt.parent()
		options.modal = true

		this.open = function() {
			elt.dialog('open')
		}

		this.close = function() {
			elt.dialog('close')
		}

		this.setOption = function(optionName, value) {
			elt.dialog('option', optionName, value)
		}


		for(var btn in options.buttons) {
			var fn = options.buttons[btn] 
			if (typeof fn == 'function') {
				options.buttons[btn] = options.buttons[btn].bind(iface)
			}
		}

		elt.dialog(options)

	}
});





$$.registerControlEx('SliderControl', {

	props: {
		max: {val: 100},
		min: {val: 0}, 
		orientation: {val: 'horizontal'},
		range: {val: false}			
	},
	events: 'change,input',

	
	lib: 'ui',
init: function(elt, options) {


	//console.log('[SliderControl] value', elt.val())
		var value = elt.val()

		if (Array.isArray(value)) {
			options.values = value
			options.range = true
		}

		if (typeof value == 'string') {
			options.value = value
		}

		//console.log('[SliderControl] options', options)

		options.change = function(ev, ui) {
			elt.trigger('change', [ui.values || ui.value])
		}

		options.slide = function(ev, ui) {
			//console.log('[SliderControl] slide', ui.values || ui.value)
			elt.trigger('input', [ui.values || ui.value])
		}

		elt.slider(options)

		this.getValue = function() {
			//console.log('[SliderControl] getValue')
			return elt.slider((options.range) ? 'values' : 'value') 
		}

		this.setValue = function(value) {
			//console.log('[SliderControl] setValue')
			elt.slider((options.range) ? 'values' : 'value', value)
		}


	}

});




$$.registerControlEx('SpinnerControl', {
	
	lib: 'ui',
init: function(elt) {

		elt.spinner({
			stop: function () {
				//console.log('[SpinnerControl] change')
			}
		})
	},
	events: 'spinstop'
});




$$.registerControlEx('TabControl', {
	events: 'activate',
	iface: 'addTab(title, options);getSelectedTabIndex();removeTab(tabIndex);on(event, callback)',
	
	lib: 'ui',
init: function(elt) {

		var events = new EventEmitter2()

		var ul = $('<ul>').prependTo(elt)

		elt.children('div').each(function() {
			var title = $(this).attr('title')
			var id = $(this).uniqueId().attr('id')
			var li = $('<li>').append($('<a>', {href: '#' + id}).text(title)).appendTo(ul)
			if ($(this).attr('data-removable') != undefined) {
				li.append($('<span>', {class: 'ui-icon ui-icon-close'}))
			}
		})
		
		elt.tabs({
			activate: function() {
				//console.log('activate', getSelectedTabIndex())
				events.emit('activate')
			}
		})
		.on('click', 'span.ui-icon-close', function() {
			var panelId = $(this).closest('li').remove().attr('aria-controls')
			//console.log('panelId', panelId)
			$('#' + panelId).remove()
			elt.tabs('refresh')
		})

		this.addTab = function(title, options) {
			options = options || {}
			var tab = $('<div>').html(options.template).appendTo(elt)
			var id = tab.uniqueId().attr('id')
			var li = $('<li>').append($('<a>', {href: '#' + id}).text(title)).appendTo(ul)
			if (options.removable === true) {
				li.append($('<span>', {class: 'ui-icon ui-icon-close'}))
			}			

			elt.tabs('refresh')
		}

		this.getSelectedTabIndex = function() {
			var index = ul.children('li.ui-state-active').index()
			return index
		}

		this.removeTab = function(tabIndex) {
			var li = ul.children('li').eq(tabIndex)
			var panelId = li.remove().attr('aria-controls')
			$('#' + panelId).remove()
			elt.tabs('refresh')
		}

		this.on = events.on.bind(events)

	}
});





$$.registerControlEx('ToolbarControl', {
	
	lib: 'ui',
init: function(elt) {

		elt.controlgroup()

	}
});




$$.registerControlEx('TreeControl', {

	deps: ['TreeCtrlService'], 
	props: {
		checkbox: {val: false}
	},
	events: 'activate,contextMenuAction',
	iface: 'getActiveNode();getRootNode();on(event, callback);moveUp(node);moveDown(node)',

	
	lib: 'ui',
init: function(elt, options) {

		var events = new EventEmitter2()


		options.activate = function() {
			events.emit('activate')
		}

		if (!Array.isArray(options.extensions)) {
			options.extensions = []
		}

		if (options.contextMenu) {
			if (options.extensions.indexOf('contextMenu') < 0) {
				options.extensions.push('contextMenu')
			}

			options.contextMenu.actions = function(node, action) {
					//console.log('[TreeControl] contextMenuAction', node, action)
					events.emit('contextMenuAction', getActiveNode(), action)
				}

		}

		elt.fancytree(options)

		function getActiveNode() {
			return elt.fancytree('getActiveNode')
		}

		this.getActiveNode = getActiveNode

		this.getRootNode = function() {
			return elt.fancytree('getRootNode')
		}

		this.moveDown = function(node) {
			var next = node.getNextSibling()
			if (next != null) {
				node.moveTo(next, 'after')
			}
		}

		this.moveUp = function(node) {
			var prev = node.getPrevSibling()
			if (prev != null) {
				node.moveTo(prev, 'before')
			}
		}

		this.on = events.on.bind(events)

	}
});





//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjY29yZGlvbi5qcyIsImRhdGVwaWNrZXIuanMiLCJkZXBzLmpzIiwiZGlhbG9nLmpzIiwic2xpZGVyLmpzIiwic3Bpbm5lci5qcyIsInRhYi5qcyIsInRvb2xiYXIuanMiLCJ0cmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InVpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdBY2NvcmRpb25Db250cm9sJywge1xyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRlbHQuY2hpbGRyZW4oJ2RpdicpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBkaXYgPSAkKHRoaXMpXHJcblx0XHRcdHZhciB0aXRsZSA9IGRpdi5hdHRyKCd0aXRsZScpXHJcblx0XHRcdGRpdi5iZWZvcmUoJCgnPGgzPicpLnRleHQodGl0bGUpKVxyXG5cdFx0fSlcclxuXHRcdGVsdC5hY2NvcmRpb24ob3B0aW9ucylcclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5kYXRlcGlja2VyLnNldERlZmF1bHRzKCQuZGF0ZXBpY2tlci5yZWdpb25hbFsnZnInXSlcclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdEYXRlUGlja2VyQ29udHJvbCcsIHtcclxuXHRcdHByb3BzOiB7XHJcblx0XHRcdHNob3dCdXR0b25QYW5lbDoge3ZhbDogZmFsc2V9XHJcblx0XHR9LFxyXG5cdFx0ZXZlbnRzOiAnY2hhbmdlJyxcclxuXHRcdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRcdGVsdC5kYXRlcGlja2VyKG9wdGlvbnMpXHJcblxyXG5cdFx0XHR2YXIgdmFsdWUgPSBlbHQudmFsKClcclxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHZhciBtcyA9IERhdGUucGFyc2UodmFsdWUpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0RhdGVQaWNrZXJDb250cm9sXSBtcycsIG1zKVxyXG5cdFx0XHRcdHZhciBkYXRlID0gbmV3IERhdGUobXMpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0RhdGVQaWNrZXJDb250cm9sXSBkYXRlJywgZGF0ZSlcclxuXHRcdFx0XHRlbHQuZGF0ZXBpY2tlcignc2V0RGF0ZScsIGRhdGUpXHJcblx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRzZXRWYWx1ZTogZnVuY3Rpb24oZGF0ZSkge1xyXG5cdFx0XHRcdFx0ZWx0LmRhdGVwaWNrZXIoJ3NldERhdGUnLCBkYXRlKVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0Z2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGVsdC5kYXRlcGlja2VyKCdnZXREYXRlJylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fSlcclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCkge1x0XHJcblxyXG5cdCQkLmxvYWRTdHlsZSgnL2NvbnRyb2xzL3VpLmNzcycpXHJcbn0pKCk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0RpYWxvZ0NvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdG9wdGlvbnMuYXV0b09wZW4gPSBmYWxzZVxyXG5cdFx0b3B0aW9ucy5hcHBlbmRUbyA9IGVsdC5wYXJlbnQoKVxyXG5cdFx0b3B0aW9ucy5tb2RhbCA9IHRydWVcclxuXHJcblx0XHR0aGlzLm9wZW4gPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0ZWx0LmRpYWxvZygnb3BlbicpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRlbHQuZGlhbG9nKCdjbG9zZScpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5zZXRPcHRpb24gPSBmdW5jdGlvbihvcHRpb25OYW1lLCB2YWx1ZSkge1xyXG5cdFx0XHRlbHQuZGlhbG9nKCdvcHRpb24nLCBvcHRpb25OYW1lLCB2YWx1ZSlcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0Zm9yKHZhciBidG4gaW4gb3B0aW9ucy5idXR0b25zKSB7XHJcblx0XHRcdHZhciBmbiA9IG9wdGlvbnMuYnV0dG9uc1tidG5dIFxyXG5cdFx0XHRpZiAodHlwZW9mIGZuID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRvcHRpb25zLmJ1dHRvbnNbYnRuXSA9IG9wdGlvbnMuYnV0dG9uc1tidG5dLmJpbmQoaWZhY2UpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRlbHQuZGlhbG9nKG9wdGlvbnMpXHJcblxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuIiwiXHJcblxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnU2xpZGVyQ29udHJvbCcsIHtcclxuXHJcblx0cHJvcHM6IHtcclxuXHRcdG1heDoge3ZhbDogMTAwfSxcclxuXHRcdG1pbjoge3ZhbDogMH0sIFxyXG5cdFx0b3JpZW50YXRpb246IHt2YWw6ICdob3Jpem9udGFsJ30sXHJcblx0XHRyYW5nZToge3ZhbDogZmFsc2V9XHRcdFx0XHJcblx0fSxcclxuXHRldmVudHM6ICdjaGFuZ2UsaW5wdXQnLFxyXG5cclxuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cclxuXHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gdmFsdWUnLCBlbHQudmFsKCkpXHJcblx0XHR2YXIgdmFsdWUgPSBlbHQudmFsKClcclxuXHJcblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuXHRcdFx0b3B0aW9ucy52YWx1ZXMgPSB2YWx1ZVxyXG5cdFx0XHRvcHRpb25zLnJhbmdlID0gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0b3B0aW9ucy52YWx1ZSA9IHZhbHVlXHJcblx0XHR9XHJcblxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIG9wdGlvbnMnLCBvcHRpb25zKVxyXG5cclxuXHRcdG9wdGlvbnMuY2hhbmdlID0gZnVuY3Rpb24oZXYsIHVpKSB7XHJcblx0XHRcdGVsdC50cmlnZ2VyKCdjaGFuZ2UnLCBbdWkudmFsdWVzIHx8IHVpLnZhbHVlXSlcclxuXHRcdH1cclxuXHJcblx0XHRvcHRpb25zLnNsaWRlID0gZnVuY3Rpb24oZXYsIHVpKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSBzbGlkZScsIHVpLnZhbHVlcyB8fCB1aS52YWx1ZSlcclxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0JywgW3VpLnZhbHVlcyB8fCB1aS52YWx1ZV0pXHJcblx0XHR9XHJcblxyXG5cdFx0ZWx0LnNsaWRlcihvcHRpb25zKVxyXG5cclxuXHRcdHRoaXMuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIGdldFZhbHVlJylcclxuXHRcdFx0cmV0dXJuIGVsdC5zbGlkZXIoKG9wdGlvbnMucmFuZ2UpID8gJ3ZhbHVlcycgOiAndmFsdWUnKSBcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLnNldFZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIHNldFZhbHVlJylcclxuXHRcdFx0ZWx0LnNsaWRlcigob3B0aW9ucy5yYW5nZSkgPyAndmFsdWVzJyA6ICd2YWx1ZScsIHZhbHVlKVxyXG5cdFx0fVxyXG5cclxuXHJcblx0fVxyXG5cclxufSk7XHJcblxyXG5cclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdTcGlubmVyQ29udHJvbCcsIHtcclxuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0LnNwaW5uZXIoe1xyXG5cdFx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW1NwaW5uZXJDb250cm9sXSBjaGFuZ2UnKVxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cdH0sXHJcblx0ZXZlbnRzOiAnc3BpbnN0b3AnXHJcbn0pO1xyXG5cclxuXHJcbiIsIlxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnVGFiQ29udHJvbCcsIHtcclxuXHRldmVudHM6ICdhY3RpdmF0ZScsXHJcblx0aWZhY2U6ICdhZGRUYWIodGl0bGUsIG9wdGlvbnMpO2dldFNlbGVjdGVkVGFiSW5kZXgoKTtyZW1vdmVUYWIodGFiSW5kZXgpO29uKGV2ZW50LCBjYWxsYmFjayknLFxyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cclxuXHRcdHZhciB1bCA9ICQoJzx1bD4nKS5wcmVwZW5kVG8oZWx0KVxyXG5cclxuXHRcdGVsdC5jaGlsZHJlbignZGl2JykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIHRpdGxlID0gJCh0aGlzKS5hdHRyKCd0aXRsZScpXHJcblx0XHRcdHZhciBpZCA9ICQodGhpcykudW5pcXVlSWQoKS5hdHRyKCdpZCcpXHJcblx0XHRcdHZhciBsaSA9ICQoJzxsaT4nKS5hcHBlbmQoJCgnPGE+Jywge2hyZWY6ICcjJyArIGlkfSkudGV4dCh0aXRsZSkpLmFwcGVuZFRvKHVsKVxyXG5cdFx0XHRpZiAoJCh0aGlzKS5hdHRyKCdkYXRhLXJlbW92YWJsZScpICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdGxpLmFwcGVuZCgkKCc8c3Bhbj4nLCB7Y2xhc3M6ICd1aS1pY29uIHVpLWljb24tY2xvc2UnfSkpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHRcclxuXHRcdGVsdC50YWJzKHtcclxuXHRcdFx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2FjdGl2YXRlJywgZ2V0U2VsZWN0ZWRUYWJJbmRleCgpKVxyXG5cdFx0XHRcdGV2ZW50cy5lbWl0KCdhY3RpdmF0ZScpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQub24oJ2NsaWNrJywgJ3NwYW4udWktaWNvbi1jbG9zZScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgcGFuZWxJZCA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5yZW1vdmUoKS5hdHRyKCdhcmlhLWNvbnRyb2xzJylcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncGFuZWxJZCcsIHBhbmVsSWQpXHJcblx0XHRcdCQoJyMnICsgcGFuZWxJZCkucmVtb3ZlKClcclxuXHRcdFx0ZWx0LnRhYnMoJ3JlZnJlc2gnKVxyXG5cdFx0fSlcclxuXHJcblx0XHR0aGlzLmFkZFRhYiA9IGZ1bmN0aW9uKHRpdGxlLCBvcHRpb25zKSB7XHJcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcblx0XHRcdHZhciB0YWIgPSAkKCc8ZGl2PicpLmh0bWwob3B0aW9ucy50ZW1wbGF0ZSkuYXBwZW5kVG8oZWx0KVxyXG5cdFx0XHR2YXIgaWQgPSB0YWIudW5pcXVlSWQoKS5hdHRyKCdpZCcpXHJcblx0XHRcdHZhciBsaSA9ICQoJzxsaT4nKS5hcHBlbmQoJCgnPGE+Jywge2hyZWY6ICcjJyArIGlkfSkudGV4dCh0aXRsZSkpLmFwcGVuZFRvKHVsKVxyXG5cdFx0XHRpZiAob3B0aW9ucy5yZW1vdmFibGUgPT09IHRydWUpIHtcclxuXHRcdFx0XHRsaS5hcHBlbmQoJCgnPHNwYW4+Jywge2NsYXNzOiAndWktaWNvbiB1aS1pY29uLWNsb3NlJ30pKVxyXG5cdFx0XHR9XHRcdFx0XHJcblxyXG5cdFx0XHRlbHQudGFicygncmVmcmVzaCcpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5nZXRTZWxlY3RlZFRhYkluZGV4ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBpbmRleCA9IHVsLmNoaWxkcmVuKCdsaS51aS1zdGF0ZS1hY3RpdmUnKS5pbmRleCgpXHJcblx0XHRcdHJldHVybiBpbmRleFxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMucmVtb3ZlVGFiID0gZnVuY3Rpb24odGFiSW5kZXgpIHtcclxuXHRcdFx0dmFyIGxpID0gdWwuY2hpbGRyZW4oJ2xpJykuZXEodGFiSW5kZXgpXHJcblx0XHRcdHZhciBwYW5lbElkID0gbGkucmVtb3ZlKCkuYXR0cignYXJpYS1jb250cm9scycpXHJcblx0XHRcdCQoJyMnICsgcGFuZWxJZCkucmVtb3ZlKClcclxuXHRcdFx0ZWx0LnRhYnMoJ3JlZnJlc2gnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXHJcblxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuXHJcbiIsIlxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnVG9vbGJhckNvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdGVsdC5jb250cm9sZ3JvdXAoKVxyXG5cclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcblxyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnVHJlZUNvbnRyb2wnLCB7XHJcblxyXG5cdGRlcHM6IFsnVHJlZUN0cmxTZXJ2aWNlJ10sIFxyXG5cdHByb3BzOiB7XHJcblx0XHRjaGVja2JveDoge3ZhbDogZmFsc2V9XHJcblx0fSxcclxuXHRldmVudHM6ICdhY3RpdmF0ZSxjb250ZXh0TWVudUFjdGlvbicsXHJcblx0aWZhY2U6ICdnZXRBY3RpdmVOb2RlKCk7Z2V0Um9vdE5vZGUoKTtvbihldmVudCwgY2FsbGJhY2spO21vdmVVcChub2RlKTttb3ZlRG93bihub2RlKScsXHJcblxyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cclxuXHJcblx0XHRvcHRpb25zLmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGV2ZW50cy5lbWl0KCdhY3RpdmF0ZScpXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KG9wdGlvbnMuZXh0ZW5zaW9ucykpIHtcclxuXHRcdFx0b3B0aW9ucy5leHRlbnNpb25zID0gW11cclxuXHRcdH1cclxuXHJcblx0XHRpZiAob3B0aW9ucy5jb250ZXh0TWVudSkge1xyXG5cdFx0XHRpZiAob3B0aW9ucy5leHRlbnNpb25zLmluZGV4T2YoJ2NvbnRleHRNZW51JykgPCAwKSB7XHJcblx0XHRcdFx0b3B0aW9ucy5leHRlbnNpb25zLnB1c2goJ2NvbnRleHRNZW51JylcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0b3B0aW9ucy5jb250ZXh0TWVudS5hY3Rpb25zID0gZnVuY3Rpb24obm9kZSwgYWN0aW9uKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbVHJlZUNvbnRyb2xdIGNvbnRleHRNZW51QWN0aW9uJywgbm9kZSwgYWN0aW9uKVxyXG5cdFx0XHRcdFx0ZXZlbnRzLmVtaXQoJ2NvbnRleHRNZW51QWN0aW9uJywgZ2V0QWN0aXZlTm9kZSgpLCBhY3Rpb24pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRlbHQuZmFuY3l0cmVlKG9wdGlvbnMpXHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0QWN0aXZlTm9kZSgpIHtcclxuXHRcdFx0cmV0dXJuIGVsdC5mYW5jeXRyZWUoJ2dldEFjdGl2ZU5vZGUnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuZ2V0QWN0aXZlTm9kZSA9IGdldEFjdGl2ZU5vZGVcclxuXHJcblx0XHR0aGlzLmdldFJvb3ROb2RlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBlbHQuZmFuY3l0cmVlKCdnZXRSb290Tm9kZScpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5tb3ZlRG93biA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0dmFyIG5leHQgPSBub2RlLmdldE5leHRTaWJsaW5nKClcclxuXHRcdFx0aWYgKG5leHQgIT0gbnVsbCkge1xyXG5cdFx0XHRcdG5vZGUubW92ZVRvKG5leHQsICdhZnRlcicpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLm1vdmVVcCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0dmFyIHByZXYgPSBub2RlLmdldFByZXZTaWJsaW5nKClcclxuXHRcdFx0aWYgKHByZXYgIT0gbnVsbCkge1xyXG5cdFx0XHRcdG5vZGUubW92ZVRvKHByZXYsICdiZWZvcmUnKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5vbiA9IGV2ZW50cy5vbi5iaW5kKGV2ZW50cylcclxuXHJcblx0fVxyXG59KTtcclxuXHJcblxyXG5cclxuXHJcbiJdfQ==

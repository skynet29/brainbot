
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

		var iface = {
			open: function() {
				elt.dialog('open')
			},

			close: function() {
				elt.dialog('close')
			},

			setOption(optionName, value) {
				elt.dialog('option', optionName, value)
			}
		}			


		for(var btn in options.buttons) {
			var fn = options.buttons[btn] 
			if (typeof fn == 'function') {
				options.buttons[btn] = options.buttons[btn].bind(iface)
			}
		}

		elt.dialog(options)

		return iface
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

		function getValue() {
			//console.log('[SliderControl] getValue')
			return elt.slider((options.range) ? 'values' : 'value') 
		}

		function setValue(value) {
			//console.log('[SliderControl] setValue')
			elt.slider((options.range) ? 'values' : 'value', value)
		}


		return {
			getValue,
			setValue
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

		function addTab(title, options) {
			options = options || {}
			var tab = $('<div>').html(options.template).appendTo(elt)
			var id = tab.uniqueId().attr('id')
			var li = $('<li>').append($('<a>', {href: '#' + id}).text(title)).appendTo(ul)
			if (options.removable === true) {
				li.append($('<span>', {class: 'ui-icon ui-icon-close'}))
			}			

			elt.tabs('refresh')
		}

		function getSelectedTabIndex() {
			var index = ul.children('li.ui-state-active').index()
			return index
		}

		function removeTab(tabIndex) {
			var li = ul.children('li').eq(tabIndex)
			var panelId = li.remove().attr('aria-controls')
			$('#' + panelId).remove()
			elt.tabs('refresh')
		}

		return {
			addTab,
			getSelectedTabIndex,
			removeTab,
			on: events.on.bind(events)
		}
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

		function getRootNode() {
			return elt.fancytree('getRootNode')
		}

		function moveDown(node) {
			var next = node.getNextSibling()
			if (next != null) {
				node.moveTo(next, 'after')
			}
		}

		function moveUp(node) {
			var prev = node.getPrevSibling()
			if (prev != null) {
				node.moveTo(prev, 'before')
			}
		}

		return {
			getActiveNode: getActiveNode,
			getRootNode: getRootNode,
			on: events.on.bind(events),
			moveUp: moveUp,
			moveDown:  moveDown

		}
	}
});





//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjY29yZGlvbi5qcyIsImRhdGVwaWNrZXIuanMiLCJkZXBzLmpzIiwiZGlhbG9nLmpzIiwic2xpZGVyLmpzIiwic3Bpbm5lci5qcyIsInRhYi5qcyIsInRvb2xiYXIuanMiLCJ0cmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InVpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdBY2NvcmRpb25Db250cm9sJywge1xyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRlbHQuY2hpbGRyZW4oJ2RpdicpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBkaXYgPSAkKHRoaXMpXHJcblx0XHRcdHZhciB0aXRsZSA9IGRpdi5hdHRyKCd0aXRsZScpXHJcblx0XHRcdGRpdi5iZWZvcmUoJCgnPGgzPicpLnRleHQodGl0bGUpKVxyXG5cdFx0fSlcclxuXHRcdGVsdC5hY2NvcmRpb24ob3B0aW9ucylcclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5kYXRlcGlja2VyLnNldERlZmF1bHRzKCQuZGF0ZXBpY2tlci5yZWdpb25hbFsnZnInXSlcclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdEYXRlUGlja2VyQ29udHJvbCcsIHtcclxuXHRcdHByb3BzOiB7XHJcblx0XHRcdHNob3dCdXR0b25QYW5lbDoge3ZhbDogZmFsc2V9XHJcblx0XHR9LFxyXG5cdFx0ZXZlbnRzOiAnY2hhbmdlJyxcclxuXHRcdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRcdGVsdC5kYXRlcGlja2VyKG9wdGlvbnMpXHJcblxyXG5cdFx0XHR2YXIgdmFsdWUgPSBlbHQudmFsKClcclxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHZhciBtcyA9IERhdGUucGFyc2UodmFsdWUpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0RhdGVQaWNrZXJDb250cm9sXSBtcycsIG1zKVxyXG5cdFx0XHRcdHZhciBkYXRlID0gbmV3IERhdGUobXMpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0RhdGVQaWNrZXJDb250cm9sXSBkYXRlJywgZGF0ZSlcclxuXHRcdFx0XHRlbHQuZGF0ZXBpY2tlcignc2V0RGF0ZScsIGRhdGUpXHJcblx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRzZXRWYWx1ZTogZnVuY3Rpb24oZGF0ZSkge1xyXG5cdFx0XHRcdFx0ZWx0LmRhdGVwaWNrZXIoJ3NldERhdGUnLCBkYXRlKVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0Z2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGVsdC5kYXRlcGlja2VyKCdnZXREYXRlJylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fSlcclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCkge1x0XHJcblxyXG5cdCQkLmxvYWRTdHlsZSgnL2NvbnRyb2xzL3VpLmNzcycpXHJcbn0pKCk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0RpYWxvZ0NvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdG9wdGlvbnMuYXV0b09wZW4gPSBmYWxzZVxyXG5cdFx0b3B0aW9ucy5hcHBlbmRUbyA9IGVsdC5wYXJlbnQoKVxyXG5cdFx0b3B0aW9ucy5tb2RhbCA9IHRydWVcclxuXHJcblx0XHR2YXIgaWZhY2UgPSB7XHJcblx0XHRcdG9wZW46IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGVsdC5kaWFsb2coJ29wZW4nKVxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGVsdC5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHNldE9wdGlvbihvcHRpb25OYW1lLCB2YWx1ZSkge1xyXG5cdFx0XHRcdGVsdC5kaWFsb2coJ29wdGlvbicsIG9wdGlvbk5hbWUsIHZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHRcdFx0XHJcblxyXG5cclxuXHRcdGZvcih2YXIgYnRuIGluIG9wdGlvbnMuYnV0dG9ucykge1xyXG5cdFx0XHR2YXIgZm4gPSBvcHRpb25zLmJ1dHRvbnNbYnRuXSBcclxuXHRcdFx0aWYgKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0b3B0aW9ucy5idXR0b25zW2J0bl0gPSBvcHRpb25zLmJ1dHRvbnNbYnRuXS5iaW5kKGlmYWNlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZWx0LmRpYWxvZyhvcHRpb25zKVxyXG5cclxuXHRcdHJldHVybiBpZmFjZVxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuIiwiXHJcblxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnU2xpZGVyQ29udHJvbCcsIHtcclxuXHJcblx0cHJvcHM6IHtcclxuXHRcdG1heDoge3ZhbDogMTAwfSxcclxuXHRcdG1pbjoge3ZhbDogMH0sIFxyXG5cdFx0b3JpZW50YXRpb246IHt2YWw6ICdob3Jpem9udGFsJ30sXHJcblx0XHRyYW5nZToge3ZhbDogZmFsc2V9XHRcdFx0XHJcblx0fSxcclxuXHRldmVudHM6ICdjaGFuZ2UsaW5wdXQnLFxyXG5cclxuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cclxuXHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gdmFsdWUnLCBlbHQudmFsKCkpXHJcblx0XHR2YXIgdmFsdWUgPSBlbHQudmFsKClcclxuXHJcblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuXHRcdFx0b3B0aW9ucy52YWx1ZXMgPSB2YWx1ZVxyXG5cdFx0XHRvcHRpb25zLnJhbmdlID0gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0b3B0aW9ucy52YWx1ZSA9IHZhbHVlXHJcblx0XHR9XHJcblxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIG9wdGlvbnMnLCBvcHRpb25zKVxyXG5cclxuXHRcdG9wdGlvbnMuY2hhbmdlID0gZnVuY3Rpb24oZXYsIHVpKSB7XHJcblx0XHRcdGVsdC50cmlnZ2VyKCdjaGFuZ2UnLCBbdWkudmFsdWVzIHx8IHVpLnZhbHVlXSlcclxuXHRcdH1cclxuXHJcblx0XHRvcHRpb25zLnNsaWRlID0gZnVuY3Rpb24oZXYsIHVpKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSBzbGlkZScsIHVpLnZhbHVlcyB8fCB1aS52YWx1ZSlcclxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0JywgW3VpLnZhbHVlcyB8fCB1aS52YWx1ZV0pXHJcblx0XHR9XHJcblxyXG5cdFx0ZWx0LnNsaWRlcihvcHRpb25zKVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldFZhbHVlKCkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gZ2V0VmFsdWUnKVxyXG5cdFx0XHRyZXR1cm4gZWx0LnNsaWRlcigob3B0aW9ucy5yYW5nZSkgPyAndmFsdWVzJyA6ICd2YWx1ZScpIFxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHNldFZhbHVlKHZhbHVlKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSBzZXRWYWx1ZScpXHJcblx0XHRcdGVsdC5zbGlkZXIoKG9wdGlvbnMucmFuZ2UpID8gJ3ZhbHVlcycgOiAndmFsdWUnLCB2YWx1ZSlcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0Z2V0VmFsdWUsXHJcblx0XHRcdHNldFZhbHVlXHJcblx0XHR9XHJcblx0fVxyXG5cclxufSk7XHJcblxyXG5cclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdTcGlubmVyQ29udHJvbCcsIHtcclxuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0LnNwaW5uZXIoe1xyXG5cdFx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW1NwaW5uZXJDb250cm9sXSBjaGFuZ2UnKVxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cdH0sXHJcblx0ZXZlbnRzOiAnc3BpbnN0b3AnXHJcbn0pO1xyXG5cclxuXHJcbiIsIlxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnVGFiQ29udHJvbCcsIHtcclxuXHRldmVudHM6ICdhY3RpdmF0ZScsXHJcblx0aWZhY2U6ICdhZGRUYWIodGl0bGUsIG9wdGlvbnMpO2dldFNlbGVjdGVkVGFiSW5kZXgoKTtyZW1vdmVUYWIodGFiSW5kZXgpO29uKGV2ZW50LCBjYWxsYmFjayknLFxyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cclxuXHRcdHZhciB1bCA9ICQoJzx1bD4nKS5wcmVwZW5kVG8oZWx0KVxyXG5cclxuXHRcdGVsdC5jaGlsZHJlbignZGl2JykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIHRpdGxlID0gJCh0aGlzKS5hdHRyKCd0aXRsZScpXHJcblx0XHRcdHZhciBpZCA9ICQodGhpcykudW5pcXVlSWQoKS5hdHRyKCdpZCcpXHJcblx0XHRcdHZhciBsaSA9ICQoJzxsaT4nKS5hcHBlbmQoJCgnPGE+Jywge2hyZWY6ICcjJyArIGlkfSkudGV4dCh0aXRsZSkpLmFwcGVuZFRvKHVsKVxyXG5cdFx0XHRpZiAoJCh0aGlzKS5hdHRyKCdkYXRhLXJlbW92YWJsZScpICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdGxpLmFwcGVuZCgkKCc8c3Bhbj4nLCB7Y2xhc3M6ICd1aS1pY29uIHVpLWljb24tY2xvc2UnfSkpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHRcclxuXHRcdGVsdC50YWJzKHtcclxuXHRcdFx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2FjdGl2YXRlJywgZ2V0U2VsZWN0ZWRUYWJJbmRleCgpKVxyXG5cdFx0XHRcdGV2ZW50cy5lbWl0KCdhY3RpdmF0ZScpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQub24oJ2NsaWNrJywgJ3NwYW4udWktaWNvbi1jbG9zZScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgcGFuZWxJZCA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5yZW1vdmUoKS5hdHRyKCdhcmlhLWNvbnRyb2xzJylcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncGFuZWxJZCcsIHBhbmVsSWQpXHJcblx0XHRcdCQoJyMnICsgcGFuZWxJZCkucmVtb3ZlKClcclxuXHRcdFx0ZWx0LnRhYnMoJ3JlZnJlc2gnKVxyXG5cdFx0fSlcclxuXHJcblx0XHRmdW5jdGlvbiBhZGRUYWIodGl0bGUsIG9wdGlvbnMpIHtcclxuXHRcdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuXHRcdFx0dmFyIHRhYiA9ICQoJzxkaXY+JykuaHRtbChvcHRpb25zLnRlbXBsYXRlKS5hcHBlbmRUbyhlbHQpXHJcblx0XHRcdHZhciBpZCA9IHRhYi51bmlxdWVJZCgpLmF0dHIoJ2lkJylcclxuXHRcdFx0dmFyIGxpID0gJCgnPGxpPicpLmFwcGVuZCgkKCc8YT4nLCB7aHJlZjogJyMnICsgaWR9KS50ZXh0KHRpdGxlKSkuYXBwZW5kVG8odWwpXHJcblx0XHRcdGlmIChvcHRpb25zLnJlbW92YWJsZSA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRcdGxpLmFwcGVuZCgkKCc8c3Bhbj4nLCB7Y2xhc3M6ICd1aS1pY29uIHVpLWljb24tY2xvc2UnfSkpXHJcblx0XHRcdH1cdFx0XHRcclxuXHJcblx0XHRcdGVsdC50YWJzKCdyZWZyZXNoJylcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBnZXRTZWxlY3RlZFRhYkluZGV4KCkge1xyXG5cdFx0XHR2YXIgaW5kZXggPSB1bC5jaGlsZHJlbignbGkudWktc3RhdGUtYWN0aXZlJykuaW5kZXgoKVxyXG5cdFx0XHRyZXR1cm4gaW5kZXhcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiByZW1vdmVUYWIodGFiSW5kZXgpIHtcclxuXHRcdFx0dmFyIGxpID0gdWwuY2hpbGRyZW4oJ2xpJykuZXEodGFiSW5kZXgpXHJcblx0XHRcdHZhciBwYW5lbElkID0gbGkucmVtb3ZlKCkuYXR0cignYXJpYS1jb250cm9scycpXHJcblx0XHRcdCQoJyMnICsgcGFuZWxJZCkucmVtb3ZlKClcclxuXHRcdFx0ZWx0LnRhYnMoJ3JlZnJlc2gnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGFkZFRhYixcclxuXHRcdFx0Z2V0U2VsZWN0ZWRUYWJJbmRleCxcclxuXHRcdFx0cmVtb3ZlVGFiLFxyXG5cdFx0XHRvbjogZXZlbnRzLm9uLmJpbmQoZXZlbnRzKVxyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuXHJcbiIsIlxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnVG9vbGJhckNvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdGVsdC5jb250cm9sZ3JvdXAoKVxyXG5cclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcblxyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnVHJlZUNvbnRyb2wnLCB7XHJcblxyXG5cdGRlcHM6IFsnVHJlZUN0cmxTZXJ2aWNlJ10sIFxyXG5cdHByb3BzOiB7XHJcblx0XHRjaGVja2JveDoge3ZhbDogZmFsc2V9XHJcblx0fSxcclxuXHRldmVudHM6ICdhY3RpdmF0ZSxjb250ZXh0TWVudUFjdGlvbicsXHJcblx0aWZhY2U6ICdnZXRBY3RpdmVOb2RlKCk7Z2V0Um9vdE5vZGUoKTtvbihldmVudCwgY2FsbGJhY2spO21vdmVVcChub2RlKTttb3ZlRG93bihub2RlKScsXHJcblxyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cclxuXHJcblx0XHRvcHRpb25zLmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGV2ZW50cy5lbWl0KCdhY3RpdmF0ZScpXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KG9wdGlvbnMuZXh0ZW5zaW9ucykpIHtcclxuXHRcdFx0b3B0aW9ucy5leHRlbnNpb25zID0gW11cclxuXHRcdH1cclxuXHJcblx0XHRpZiAob3B0aW9ucy5jb250ZXh0TWVudSkge1xyXG5cdFx0XHRpZiAob3B0aW9ucy5leHRlbnNpb25zLmluZGV4T2YoJ2NvbnRleHRNZW51JykgPCAwKSB7XHJcblx0XHRcdFx0b3B0aW9ucy5leHRlbnNpb25zLnB1c2goJ2NvbnRleHRNZW51JylcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0b3B0aW9ucy5jb250ZXh0TWVudS5hY3Rpb25zID0gZnVuY3Rpb24obm9kZSwgYWN0aW9uKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbVHJlZUNvbnRyb2xdIGNvbnRleHRNZW51QWN0aW9uJywgbm9kZSwgYWN0aW9uKVxyXG5cdFx0XHRcdFx0ZXZlbnRzLmVtaXQoJ2NvbnRleHRNZW51QWN0aW9uJywgZ2V0QWN0aXZlTm9kZSgpLCBhY3Rpb24pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRlbHQuZmFuY3l0cmVlKG9wdGlvbnMpXHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0QWN0aXZlTm9kZSgpIHtcclxuXHRcdFx0cmV0dXJuIGVsdC5mYW5jeXRyZWUoJ2dldEFjdGl2ZU5vZGUnKVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldFJvb3ROb2RlKCkge1xyXG5cdFx0XHRyZXR1cm4gZWx0LmZhbmN5dHJlZSgnZ2V0Um9vdE5vZGUnKVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIG1vdmVEb3duKG5vZGUpIHtcclxuXHRcdFx0dmFyIG5leHQgPSBub2RlLmdldE5leHRTaWJsaW5nKClcclxuXHRcdFx0aWYgKG5leHQgIT0gbnVsbCkge1xyXG5cdFx0XHRcdG5vZGUubW92ZVRvKG5leHQsICdhZnRlcicpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBtb3ZlVXAobm9kZSkge1xyXG5cdFx0XHR2YXIgcHJldiA9IG5vZGUuZ2V0UHJldlNpYmxpbmcoKVxyXG5cdFx0XHRpZiAocHJldiAhPSBudWxsKSB7XHJcblx0XHRcdFx0bm9kZS5tb3ZlVG8ocHJldiwgJ2JlZm9yZScpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRnZXRBY3RpdmVOb2RlOiBnZXRBY3RpdmVOb2RlLFxyXG5cdFx0XHRnZXRSb290Tm9kZTogZ2V0Um9vdE5vZGUsXHJcblx0XHRcdG9uOiBldmVudHMub24uYmluZChldmVudHMpLFxyXG5cdFx0XHRtb3ZlVXA6IG1vdmVVcCxcclxuXHRcdFx0bW92ZURvd246ICBtb3ZlRG93blxyXG5cclxuXHRcdH1cclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcblxyXG5cclxuIl19

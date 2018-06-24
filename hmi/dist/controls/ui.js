
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

		this.getActiveNode = function() {
			return elt.fancytree('getActiveNode')
		}

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





//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjY29yZGlvbi5qcyIsImRhdGVwaWNrZXIuanMiLCJkZXBzLmpzIiwiZGlhbG9nLmpzIiwic2xpZGVyLmpzIiwic3Bpbm5lci5qcyIsInRhYi5qcyIsInRvb2xiYXIuanMiLCJ0cmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoidWkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0FjY29yZGlvbkNvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdGVsdC5jaGlsZHJlbignZGl2JykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGRpdiA9ICQodGhpcylcclxuXHRcdFx0dmFyIHRpdGxlID0gZGl2LmF0dHIoJ3RpdGxlJylcclxuXHRcdFx0ZGl2LmJlZm9yZSgkKCc8aDM+JykudGV4dCh0aXRsZSkpXHJcblx0XHR9KVxyXG5cdFx0ZWx0LmFjY29yZGlvbihvcHRpb25zKVxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkLmRhdGVwaWNrZXIuc2V0RGVmYXVsdHMoJC5kYXRlcGlja2VyLnJlZ2lvbmFsWydmciddKVxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0RhdGVQaWNrZXJDb250cm9sJywge1xyXG5cdFx0cHJvcHM6IHtcclxuXHRcdFx0c2hvd0J1dHRvblBhbmVsOiB7dmFsOiBmYWxzZX1cclxuXHRcdH0sXHJcblx0XHRldmVudHM6ICdjaGFuZ2UnLFxyXG5cdFx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdFx0ZWx0LmRhdGVwaWNrZXIob3B0aW9ucylcclxuXHJcblx0XHRcdHZhciB2YWx1ZSA9IGVsdC52YWwoKVxyXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0dmFyIG1zID0gRGF0ZS5wYXJzZSh2YWx1ZSlcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbRGF0ZVBpY2tlckNvbnRyb2xdIG1zJywgbXMpXHJcblx0XHRcdFx0dmFyIGRhdGUgPSBuZXcgRGF0ZShtcylcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbRGF0ZVBpY2tlckNvbnRyb2xdIGRhdGUnLCBkYXRlKVxyXG5cdFx0XHRcdGVsdC5kYXRlcGlja2VyKCdzZXREYXRlJywgZGF0ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdHNldFZhbHVlOiBmdW5jdGlvbihkYXRlKSB7XHJcblx0XHRcdFx0XHRlbHQuZGF0ZXBpY2tlcignc2V0RGF0ZScsIGRhdGUpXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRnZXRWYWx1ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZWx0LmRhdGVwaWNrZXIoJ2dldERhdGUnKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHRcclxuXHJcblx0JCQubG9hZFN0eWxlKCcvY29udHJvbHMvdWkuY3NzJylcclxufSkoKTsiLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnRGlhbG9nQ29udHJvbCcsIHtcclxuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0b3B0aW9ucy5hdXRvT3BlbiA9IGZhbHNlXHJcblx0XHRvcHRpb25zLmFwcGVuZFRvID0gZWx0LnBhcmVudCgpXHJcblx0XHRvcHRpb25zLm1vZGFsID0gdHJ1ZVxyXG5cclxuXHRcdHRoaXMub3BlbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRlbHQuZGlhbG9nKCdvcGVuJylcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmNsb3NlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGVsdC5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLnNldE9wdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbk5hbWUsIHZhbHVlKSB7XHJcblx0XHRcdGVsdC5kaWFsb2coJ29wdGlvbicsIG9wdGlvbk5hbWUsIHZhbHVlKVxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRmb3IodmFyIGJ0biBpbiBvcHRpb25zLmJ1dHRvbnMpIHtcclxuXHRcdFx0dmFyIGZuID0gb3B0aW9ucy5idXR0b25zW2J0bl0gXHJcblx0XHRcdGlmICh0eXBlb2YgZm4gPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdG9wdGlvbnMuYnV0dG9uc1tidG5dID0gb3B0aW9ucy5idXR0b25zW2J0bl0uYmluZChpZmFjZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGVsdC5kaWFsb2cob3B0aW9ucylcclxuXHJcblx0fVxyXG59KTtcclxuXHJcblxyXG4iLCJcclxuXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdTbGlkZXJDb250cm9sJywge1xyXG5cclxuXHRwcm9wczoge1xyXG5cdFx0bWF4OiB7dmFsOiAxMDB9LFxyXG5cdFx0bWluOiB7dmFsOiAwfSwgXHJcblx0XHRvcmllbnRhdGlvbjoge3ZhbDogJ2hvcml6b250YWwnfSxcclxuXHRcdHJhbmdlOiB7dmFsOiBmYWxzZX1cdFx0XHRcclxuXHR9LFxyXG5cdGV2ZW50czogJ2NoYW5nZSxpbnB1dCcsXHJcblxyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblxyXG5cdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSB2YWx1ZScsIGVsdC52YWwoKSlcclxuXHRcdHZhciB2YWx1ZSA9IGVsdC52YWwoKVxyXG5cclxuXHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cdFx0XHRvcHRpb25zLnZhbHVlcyA9IHZhbHVlXHJcblx0XHRcdG9wdGlvbnMucmFuZ2UgPSB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRvcHRpb25zLnZhbHVlID0gdmFsdWVcclxuXHRcdH1cclxuXHJcblx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdFx0b3B0aW9ucy5jaGFuZ2UgPSBmdW5jdGlvbihldiwgdWkpIHtcclxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2NoYW5nZScsIFt1aS52YWx1ZXMgfHwgdWkudmFsdWVdKVxyXG5cdFx0fVxyXG5cclxuXHRcdG9wdGlvbnMuc2xpZGUgPSBmdW5jdGlvbihldiwgdWkpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIHNsaWRlJywgdWkudmFsdWVzIHx8IHVpLnZhbHVlKVxyXG5cdFx0XHRlbHQudHJpZ2dlcignaW5wdXQnLCBbdWkudmFsdWVzIHx8IHVpLnZhbHVlXSlcclxuXHRcdH1cclxuXHJcblx0XHRlbHQuc2xpZGVyKG9wdGlvbnMpXHJcblxyXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gZ2V0VmFsdWUnKVxyXG5cdFx0XHRyZXR1cm4gZWx0LnNsaWRlcigob3B0aW9ucy5yYW5nZSkgPyAndmFsdWVzJyA6ICd2YWx1ZScpIFxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gc2V0VmFsdWUnKVxyXG5cdFx0XHRlbHQuc2xpZGVyKChvcHRpb25zLnJhbmdlKSA/ICd2YWx1ZXMnIDogJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHR9XHJcblxyXG5cclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ1NwaW5uZXJDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHRlbHQuc3Bpbm5lcih7XHJcblx0XHRcdHN0b3A6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbU3Bpbm5lckNvbnRyb2xdIGNoYW5nZScpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0fSxcclxuXHRldmVudHM6ICdzcGluc3RvcCdcclxufSk7XHJcblxyXG5cclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdUYWJDb250cm9sJywge1xyXG5cdGV2ZW50czogJ2FjdGl2YXRlJyxcclxuXHRpZmFjZTogJ2FkZFRhYih0aXRsZSwgb3B0aW9ucyk7Z2V0U2VsZWN0ZWRUYWJJbmRleCgpO3JlbW92ZVRhYih0YWJJbmRleCk7b24oZXZlbnQsIGNhbGxiYWNrKScsXHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdHZhciBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblxyXG5cdFx0dmFyIHVsID0gJCgnPHVsPicpLnByZXBlbmRUbyhlbHQpXHJcblxyXG5cdFx0ZWx0LmNoaWxkcmVuKCdkaXYnKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgdGl0bGUgPSAkKHRoaXMpLmF0dHIoJ3RpdGxlJylcclxuXHRcdFx0dmFyIGlkID0gJCh0aGlzKS51bmlxdWVJZCgpLmF0dHIoJ2lkJylcclxuXHRcdFx0dmFyIGxpID0gJCgnPGxpPicpLmFwcGVuZCgkKCc8YT4nLCB7aHJlZjogJyMnICsgaWR9KS50ZXh0KHRpdGxlKSkuYXBwZW5kVG8odWwpXHJcblx0XHRcdGlmICgkKHRoaXMpLmF0dHIoJ2RhdGEtcmVtb3ZhYmxlJykgIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0bGkuYXBwZW5kKCQoJzxzcGFuPicsIHtjbGFzczogJ3VpLWljb24gdWktaWNvbi1jbG9zZSd9KSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHRcdFxyXG5cdFx0ZWx0LnRhYnMoe1xyXG5cdFx0XHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYWN0aXZhdGUnLCBnZXRTZWxlY3RlZFRhYkluZGV4KCkpXHJcblx0XHRcdFx0ZXZlbnRzLmVtaXQoJ2FjdGl2YXRlJylcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHRcdC5vbignY2xpY2snLCAnc3Bhbi51aS1pY29uLWNsb3NlJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBwYW5lbElkID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLnJlbW92ZSgpLmF0dHIoJ2FyaWEtY29udHJvbHMnKVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdwYW5lbElkJywgcGFuZWxJZClcclxuXHRcdFx0JCgnIycgKyBwYW5lbElkKS5yZW1vdmUoKVxyXG5cdFx0XHRlbHQudGFicygncmVmcmVzaCcpXHJcblx0XHR9KVxyXG5cclxuXHRcdHRoaXMuYWRkVGFiID0gZnVuY3Rpb24odGl0bGUsIG9wdGlvbnMpIHtcclxuXHRcdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuXHRcdFx0dmFyIHRhYiA9ICQoJzxkaXY+JykuaHRtbChvcHRpb25zLnRlbXBsYXRlKS5hcHBlbmRUbyhlbHQpXHJcblx0XHRcdHZhciBpZCA9IHRhYi51bmlxdWVJZCgpLmF0dHIoJ2lkJylcclxuXHRcdFx0dmFyIGxpID0gJCgnPGxpPicpLmFwcGVuZCgkKCc8YT4nLCB7aHJlZjogJyMnICsgaWR9KS50ZXh0KHRpdGxlKSkuYXBwZW5kVG8odWwpXHJcblx0XHRcdGlmIChvcHRpb25zLnJlbW92YWJsZSA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRcdGxpLmFwcGVuZCgkKCc8c3Bhbj4nLCB7Y2xhc3M6ICd1aS1pY29uIHVpLWljb24tY2xvc2UnfSkpXHJcblx0XHRcdH1cdFx0XHRcclxuXHJcblx0XHRcdGVsdC50YWJzKCdyZWZyZXNoJylcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmdldFNlbGVjdGVkVGFiSW5kZXggPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGluZGV4ID0gdWwuY2hpbGRyZW4oJ2xpLnVpLXN0YXRlLWFjdGl2ZScpLmluZGV4KClcclxuXHRcdFx0cmV0dXJuIGluZGV4XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5yZW1vdmVUYWIgPSBmdW5jdGlvbih0YWJJbmRleCkge1xyXG5cdFx0XHR2YXIgbGkgPSB1bC5jaGlsZHJlbignbGknKS5lcSh0YWJJbmRleClcclxuXHRcdFx0dmFyIHBhbmVsSWQgPSBsaS5yZW1vdmUoKS5hdHRyKCdhcmlhLWNvbnRyb2xzJylcclxuXHRcdFx0JCgnIycgKyBwYW5lbElkKS5yZW1vdmUoKVxyXG5cdFx0XHRlbHQudGFicygncmVmcmVzaCcpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5vbiA9IGV2ZW50cy5vbi5iaW5kKGV2ZW50cylcclxuXHJcblx0fVxyXG59KTtcclxuXHJcblxyXG5cclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdUb29sYmFyQ29udHJvbCcsIHtcclxuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0LmNvbnRyb2xncm91cCgpXHJcblxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuXHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdUcmVlQ29udHJvbCcsIHtcclxuXHJcblx0ZGVwczogWydUcmVlQ3RybFNlcnZpY2UnXSwgXHJcblx0cHJvcHM6IHtcclxuXHRcdGNoZWNrYm94OiB7dmFsOiBmYWxzZX1cclxuXHR9LFxyXG5cdGV2ZW50czogJ2FjdGl2YXRlLGNvbnRleHRNZW51QWN0aW9uJyxcclxuXHRpZmFjZTogJ2dldEFjdGl2ZU5vZGUoKTtnZXRSb290Tm9kZSgpO29uKGV2ZW50LCBjYWxsYmFjayk7bW92ZVVwKG5vZGUpO21vdmVEb3duKG5vZGUpJyxcclxuXHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdHZhciBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblxyXG5cclxuXHRcdG9wdGlvbnMuYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0ZXZlbnRzLmVtaXQoJ2FjdGl2YXRlJylcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIUFycmF5LmlzQXJyYXkob3B0aW9ucy5leHRlbnNpb25zKSkge1xyXG5cdFx0XHRvcHRpb25zLmV4dGVuc2lvbnMgPSBbXVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChvcHRpb25zLmNvbnRleHRNZW51KSB7XHJcblx0XHRcdGlmIChvcHRpb25zLmV4dGVuc2lvbnMuaW5kZXhPZignY29udGV4dE1lbnUnKSA8IDApIHtcclxuXHRcdFx0XHRvcHRpb25zLmV4dGVuc2lvbnMucHVzaCgnY29udGV4dE1lbnUnKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRvcHRpb25zLmNvbnRleHRNZW51LmFjdGlvbnMgPSBmdW5jdGlvbihub2RlLCBhY3Rpb24pIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1tUcmVlQ29udHJvbF0gY29udGV4dE1lbnVBY3Rpb24nLCBub2RlLCBhY3Rpb24pXHJcblx0XHRcdFx0XHRldmVudHMuZW1pdCgnY29udGV4dE1lbnVBY3Rpb24nLCBnZXRBY3RpdmVOb2RlKCksIGFjdGlvbilcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdGVsdC5mYW5jeXRyZWUob3B0aW9ucylcclxuXHJcblx0XHR0aGlzLmdldEFjdGl2ZU5vZGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIGVsdC5mYW5jeXRyZWUoJ2dldEFjdGl2ZU5vZGUnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuZ2V0Um9vdE5vZGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIGVsdC5mYW5jeXRyZWUoJ2dldFJvb3ROb2RlJylcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLm1vdmVEb3duID0gZnVuY3Rpb24obm9kZSkge1xyXG5cdFx0XHR2YXIgbmV4dCA9IG5vZGUuZ2V0TmV4dFNpYmxpbmcoKVxyXG5cdFx0XHRpZiAobmV4dCAhPSBudWxsKSB7XHJcblx0XHRcdFx0bm9kZS5tb3ZlVG8obmV4dCwgJ2FmdGVyJylcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMubW92ZVVwID0gZnVuY3Rpb24obm9kZSkge1xyXG5cdFx0XHR2YXIgcHJldiA9IG5vZGUuZ2V0UHJldlNpYmxpbmcoKVxyXG5cdFx0XHRpZiAocHJldiAhPSBudWxsKSB7XHJcblx0XHRcdFx0bm9kZS5tb3ZlVG8ocHJldiwgJ2JlZm9yZScpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLm9uID0gZXZlbnRzLm9uLmJpbmQoZXZlbnRzKVxyXG5cclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcblxyXG5cclxuIl19

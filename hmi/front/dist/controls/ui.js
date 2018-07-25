
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
		options: {
			showButtonPanel: false
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

	options: {
		max: 100,
		min: 0, 
		orientation: 'horizontal',
		range: false			
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
	options: {
		checkbox: false
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





//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjY29yZGlvbi5qcyIsImRhdGVwaWNrZXIuanMiLCJkZXBzLmpzIiwiZGlhbG9nLmpzIiwic2xpZGVyLmpzIiwic3Bpbm5lci5qcyIsInRhYi5qcyIsInRvb2xiYXIuanMiLCJ0cmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InVpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdBY2NvcmRpb25Db250cm9sJywge1xyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRlbHQuY2hpbGRyZW4oJ2RpdicpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBkaXYgPSAkKHRoaXMpXHJcblx0XHRcdHZhciB0aXRsZSA9IGRpdi5hdHRyKCd0aXRsZScpXHJcblx0XHRcdGRpdi5iZWZvcmUoJCgnPGgzPicpLnRleHQodGl0bGUpKVxyXG5cdFx0fSlcclxuXHRcdGVsdC5hY2NvcmRpb24ob3B0aW9ucylcclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5kYXRlcGlja2VyLnNldERlZmF1bHRzKCQuZGF0ZXBpY2tlci5yZWdpb25hbFsnZnInXSlcclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdEYXRlUGlja2VyQ29udHJvbCcsIHtcclxuXHRcdG9wdGlvbnM6IHtcclxuXHRcdFx0c2hvd0J1dHRvblBhbmVsOiBmYWxzZVxyXG5cdFx0fSxcclxuXHRcdGV2ZW50czogJ2NoYW5nZScsXHJcblx0XHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0XHRlbHQuZGF0ZXBpY2tlcihvcHRpb25zKVxyXG5cclxuXHRcdFx0dmFyIHZhbHVlID0gZWx0LnZhbCgpXHJcblx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHR2YXIgbXMgPSBEYXRlLnBhcnNlKHZhbHVlKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tEYXRlUGlja2VyQ29udHJvbF0gbXMnLCBtcylcclxuXHRcdFx0XHR2YXIgZGF0ZSA9IG5ldyBEYXRlKG1zKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tEYXRlUGlja2VyQ29udHJvbF0gZGF0ZScsIGRhdGUpXHJcblx0XHRcdFx0ZWx0LmRhdGVwaWNrZXIoJ3NldERhdGUnLCBkYXRlKVxyXG5cdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0c2V0VmFsdWU6IGZ1bmN0aW9uKGRhdGUpIHtcclxuXHRcdFx0XHRcdGVsdC5kYXRlcGlja2VyKCdzZXREYXRlJywgZGF0ZSlcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGdldFZhbHVlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHJldHVybiBlbHQuZGF0ZXBpY2tlcignZ2V0RGF0ZScpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH0pXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpIHtcdFxyXG5cclxuXHQkJC5sb2FkU3R5bGUoJy9jb250cm9scy91aS5jc3MnKVxyXG59KSgpOyIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdEaWFsb2dDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRvcHRpb25zLmF1dG9PcGVuID0gZmFsc2VcclxuXHRcdG9wdGlvbnMuYXBwZW5kVG8gPSBlbHQucGFyZW50KClcclxuXHRcdG9wdGlvbnMubW9kYWwgPSB0cnVlXHJcblxyXG5cdFx0dGhpcy5vcGVuID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGVsdC5kaWFsb2coJ29wZW4nKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuY2xvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0ZWx0LmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuc2V0T3B0aW9uID0gZnVuY3Rpb24ob3B0aW9uTmFtZSwgdmFsdWUpIHtcclxuXHRcdFx0ZWx0LmRpYWxvZygnb3B0aW9uJywgb3B0aW9uTmFtZSwgdmFsdWUpXHJcblx0XHR9XHJcblxyXG5cclxuXHRcdGZvcih2YXIgYnRuIGluIG9wdGlvbnMuYnV0dG9ucykge1xyXG5cdFx0XHR2YXIgZm4gPSBvcHRpb25zLmJ1dHRvbnNbYnRuXSBcclxuXHRcdFx0aWYgKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0b3B0aW9ucy5idXR0b25zW2J0bl0gPSBvcHRpb25zLmJ1dHRvbnNbYnRuXS5iaW5kKGlmYWNlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZWx0LmRpYWxvZyhvcHRpb25zKVxyXG5cclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcbiIsIlxyXG5cclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ1NsaWRlckNvbnRyb2wnLCB7XHJcblxyXG5cdG9wdGlvbnM6IHtcclxuXHRcdG1heDogMTAwLFxyXG5cdFx0bWluOiAwLCBcclxuXHRcdG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcsXHJcblx0XHRyYW5nZTogZmFsc2VcdFx0XHRcclxuXHR9LFxyXG5cdGV2ZW50czogJ2NoYW5nZSxpbnB1dCcsXHJcblxyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblxyXG5cdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSB2YWx1ZScsIGVsdC52YWwoKSlcclxuXHRcdHZhciB2YWx1ZSA9IGVsdC52YWwoKVxyXG5cclxuXHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cdFx0XHRvcHRpb25zLnZhbHVlcyA9IHZhbHVlXHJcblx0XHRcdG9wdGlvbnMucmFuZ2UgPSB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRvcHRpb25zLnZhbHVlID0gdmFsdWVcclxuXHRcdH1cclxuXHJcblx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdFx0b3B0aW9ucy5jaGFuZ2UgPSBmdW5jdGlvbihldiwgdWkpIHtcclxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2NoYW5nZScsIFt1aS52YWx1ZXMgfHwgdWkudmFsdWVdKVxyXG5cdFx0fVxyXG5cclxuXHRcdG9wdGlvbnMuc2xpZGUgPSBmdW5jdGlvbihldiwgdWkpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIHNsaWRlJywgdWkudmFsdWVzIHx8IHVpLnZhbHVlKVxyXG5cdFx0XHRlbHQudHJpZ2dlcignaW5wdXQnLCBbdWkudmFsdWVzIHx8IHVpLnZhbHVlXSlcclxuXHRcdH1cclxuXHJcblx0XHRlbHQuc2xpZGVyKG9wdGlvbnMpXHJcblxyXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gZ2V0VmFsdWUnKVxyXG5cdFx0XHRyZXR1cm4gZWx0LnNsaWRlcigob3B0aW9ucy5yYW5nZSkgPyAndmFsdWVzJyA6ICd2YWx1ZScpIFxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gc2V0VmFsdWUnKVxyXG5cdFx0XHRlbHQuc2xpZGVyKChvcHRpb25zLnJhbmdlKSA/ICd2YWx1ZXMnIDogJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHR9XHJcblxyXG5cclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ1NwaW5uZXJDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHRlbHQuc3Bpbm5lcih7XHJcblx0XHRcdHN0b3A6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbU3Bpbm5lckNvbnRyb2xdIGNoYW5nZScpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0fSxcclxuXHRldmVudHM6ICdzcGluc3RvcCdcclxufSk7XHJcblxyXG5cclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdUYWJDb250cm9sJywge1xyXG5cdGV2ZW50czogJ2FjdGl2YXRlJyxcclxuXHRpZmFjZTogJ2FkZFRhYih0aXRsZSwgb3B0aW9ucyk7Z2V0U2VsZWN0ZWRUYWJJbmRleCgpO3JlbW92ZVRhYih0YWJJbmRleCk7b24oZXZlbnQsIGNhbGxiYWNrKScsXHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdHZhciBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblxyXG5cdFx0dmFyIHVsID0gJCgnPHVsPicpLnByZXBlbmRUbyhlbHQpXHJcblxyXG5cdFx0ZWx0LmNoaWxkcmVuKCdkaXYnKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgdGl0bGUgPSAkKHRoaXMpLmF0dHIoJ3RpdGxlJylcclxuXHRcdFx0dmFyIGlkID0gJCh0aGlzKS51bmlxdWVJZCgpLmF0dHIoJ2lkJylcclxuXHRcdFx0dmFyIGxpID0gJCgnPGxpPicpLmFwcGVuZCgkKCc8YT4nLCB7aHJlZjogJyMnICsgaWR9KS50ZXh0KHRpdGxlKSkuYXBwZW5kVG8odWwpXHJcblx0XHRcdGlmICgkKHRoaXMpLmF0dHIoJ2RhdGEtcmVtb3ZhYmxlJykgIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0bGkuYXBwZW5kKCQoJzxzcGFuPicsIHtjbGFzczogJ3VpLWljb24gdWktaWNvbi1jbG9zZSd9KSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHRcdFxyXG5cdFx0ZWx0LnRhYnMoe1xyXG5cdFx0XHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYWN0aXZhdGUnLCBnZXRTZWxlY3RlZFRhYkluZGV4KCkpXHJcblx0XHRcdFx0ZXZlbnRzLmVtaXQoJ2FjdGl2YXRlJylcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHRcdC5vbignY2xpY2snLCAnc3Bhbi51aS1pY29uLWNsb3NlJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBwYW5lbElkID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLnJlbW92ZSgpLmF0dHIoJ2FyaWEtY29udHJvbHMnKVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdwYW5lbElkJywgcGFuZWxJZClcclxuXHRcdFx0JCgnIycgKyBwYW5lbElkKS5yZW1vdmUoKVxyXG5cdFx0XHRlbHQudGFicygncmVmcmVzaCcpXHJcblx0XHR9KVxyXG5cclxuXHRcdHRoaXMuYWRkVGFiID0gZnVuY3Rpb24odGl0bGUsIG9wdGlvbnMpIHtcclxuXHRcdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuXHRcdFx0dmFyIHRhYiA9ICQoJzxkaXY+JykuaHRtbChvcHRpb25zLnRlbXBsYXRlKS5hcHBlbmRUbyhlbHQpXHJcblx0XHRcdHZhciBpZCA9IHRhYi51bmlxdWVJZCgpLmF0dHIoJ2lkJylcclxuXHRcdFx0dmFyIGxpID0gJCgnPGxpPicpLmFwcGVuZCgkKCc8YT4nLCB7aHJlZjogJyMnICsgaWR9KS50ZXh0KHRpdGxlKSkuYXBwZW5kVG8odWwpXHJcblx0XHRcdGlmIChvcHRpb25zLnJlbW92YWJsZSA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRcdGxpLmFwcGVuZCgkKCc8c3Bhbj4nLCB7Y2xhc3M6ICd1aS1pY29uIHVpLWljb24tY2xvc2UnfSkpXHJcblx0XHRcdH1cdFx0XHRcclxuXHJcblx0XHRcdGVsdC50YWJzKCdyZWZyZXNoJylcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmdldFNlbGVjdGVkVGFiSW5kZXggPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGluZGV4ID0gdWwuY2hpbGRyZW4oJ2xpLnVpLXN0YXRlLWFjdGl2ZScpLmluZGV4KClcclxuXHRcdFx0cmV0dXJuIGluZGV4XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5yZW1vdmVUYWIgPSBmdW5jdGlvbih0YWJJbmRleCkge1xyXG5cdFx0XHR2YXIgbGkgPSB1bC5jaGlsZHJlbignbGknKS5lcSh0YWJJbmRleClcclxuXHRcdFx0dmFyIHBhbmVsSWQgPSBsaS5yZW1vdmUoKS5hdHRyKCdhcmlhLWNvbnRyb2xzJylcclxuXHRcdFx0JCgnIycgKyBwYW5lbElkKS5yZW1vdmUoKVxyXG5cdFx0XHRlbHQudGFicygncmVmcmVzaCcpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5vbiA9IGV2ZW50cy5vbi5iaW5kKGV2ZW50cylcclxuXHJcblx0fVxyXG59KTtcclxuXHJcblxyXG5cclxuIiwiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdUb29sYmFyQ29udHJvbCcsIHtcclxuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0LmNvbnRyb2xncm91cCgpXHJcblxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuXHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdUcmVlQ29udHJvbCcsIHtcclxuXHJcblx0ZGVwczogWydUcmVlQ3RybFNlcnZpY2UnXSwgXHJcblx0b3B0aW9uczoge1xyXG5cdFx0Y2hlY2tib3g6IGZhbHNlXHJcblx0fSxcclxuXHRldmVudHM6ICdhY3RpdmF0ZSxjb250ZXh0TWVudUFjdGlvbicsXHJcblx0aWZhY2U6ICdnZXRBY3RpdmVOb2RlKCk7Z2V0Um9vdE5vZGUoKTtvbihldmVudCwgY2FsbGJhY2spO21vdmVVcChub2RlKTttb3ZlRG93bihub2RlKScsXHJcblxyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cclxuXHJcblx0XHRvcHRpb25zLmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGV2ZW50cy5lbWl0KCdhY3RpdmF0ZScpXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KG9wdGlvbnMuZXh0ZW5zaW9ucykpIHtcclxuXHRcdFx0b3B0aW9ucy5leHRlbnNpb25zID0gW11cclxuXHRcdH1cclxuXHJcblx0XHRpZiAob3B0aW9ucy5jb250ZXh0TWVudSkge1xyXG5cdFx0XHRpZiAob3B0aW9ucy5leHRlbnNpb25zLmluZGV4T2YoJ2NvbnRleHRNZW51JykgPCAwKSB7XHJcblx0XHRcdFx0b3B0aW9ucy5leHRlbnNpb25zLnB1c2goJ2NvbnRleHRNZW51JylcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0b3B0aW9ucy5jb250ZXh0TWVudS5hY3Rpb25zID0gZnVuY3Rpb24obm9kZSwgYWN0aW9uKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbVHJlZUNvbnRyb2xdIGNvbnRleHRNZW51QWN0aW9uJywgbm9kZSwgYWN0aW9uKVxyXG5cdFx0XHRcdFx0ZXZlbnRzLmVtaXQoJ2NvbnRleHRNZW51QWN0aW9uJywgZ2V0QWN0aXZlTm9kZSgpLCBhY3Rpb24pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRlbHQuZmFuY3l0cmVlKG9wdGlvbnMpXHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0QWN0aXZlTm9kZSgpIHtcclxuXHRcdFx0cmV0dXJuIGVsdC5mYW5jeXRyZWUoJ2dldEFjdGl2ZU5vZGUnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuZ2V0QWN0aXZlTm9kZSA9IGdldEFjdGl2ZU5vZGVcclxuXHJcblx0XHR0aGlzLmdldFJvb3ROb2RlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBlbHQuZmFuY3l0cmVlKCdnZXRSb290Tm9kZScpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5tb3ZlRG93biA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0dmFyIG5leHQgPSBub2RlLmdldE5leHRTaWJsaW5nKClcclxuXHRcdFx0aWYgKG5leHQgIT0gbnVsbCkge1xyXG5cdFx0XHRcdG5vZGUubW92ZVRvKG5leHQsICdhZnRlcicpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLm1vdmVVcCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0dmFyIHByZXYgPSBub2RlLmdldFByZXZTaWJsaW5nKClcclxuXHRcdFx0aWYgKHByZXYgIT0gbnVsbCkge1xyXG5cdFx0XHRcdG5vZGUubW92ZVRvKHByZXYsICdiZWZvcmUnKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5vbiA9IGV2ZW50cy5vbi5iaW5kKGV2ZW50cylcclxuXHJcblx0fVxyXG59KTtcclxuXHJcblxyXG5cclxuXHJcbiJdfQ==

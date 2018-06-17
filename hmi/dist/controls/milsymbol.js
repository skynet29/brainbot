
$$.registerControlEx('MilSymbolControl', {
	deps: ['MilSymbolService'],
	props: {
		size: {val: 20, set: 'setSize'},
		sidc: {val: '', set: 'setSIDC'},
		uniqueDesignation: {val: '', set: 'setUniqueDesignation'}
	},
	iface: 'setSIDC(sidc);setSize(size);setUniqueDesignation(name)',


	
	lib: 'milsymbol',
init: function(elt, data, ms) {

		function createSymbolCode() {
			//console.log('createSymbolCode', options)


			var symbol = new ms.Symbol(data.sidc, {
				size: data.size,
				uniqueDesignation: data.uniqueDesignation
			})
			return symbol
		}

		var symbol = createSymbolCode()
		var img = $('<img>')
			.attr('src', symbol.toDataURL())
			.appendTo(elt)


		function setSize(size) {
			data.size = size
			symbol.setOptions({size: size})
			img.attr('src', symbol.toDataURL())
		}

		function setUniqueDesignation(uniqueDesignation) {
			data.uniqueDesignation = uniqueDesignation
			symbol.setOptions({uniqueDesignation: uniqueDesignation})
			img.attr('src', symbol.toDataURL())
		}

		function setSIDC(sidc) {
			data.sidc = sidc
			symbol = createSymbolCode()
			img.attr('src', symbol.toDataURL())
		}

		return {
			setSIDC,
			setSize,
			setUniqueDesignation

		}

	}
});




//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1pbHN5bWJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWlsc3ltYm9sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNaWxTeW1ib2xDb250cm9sJywge1xyXG5cdGRlcHM6IFsnTWlsU3ltYm9sU2VydmljZSddLFxyXG5cdHByb3BzOiB7XHJcblx0XHRzaXplOiB7dmFsOiAyMCwgc2V0OiAnc2V0U2l6ZSd9LFxyXG5cdFx0c2lkYzoge3ZhbDogJycsIHNldDogJ3NldFNJREMnfSxcclxuXHRcdHVuaXF1ZURlc2lnbmF0aW9uOiB7dmFsOiAnJywgc2V0OiAnc2V0VW5pcXVlRGVzaWduYXRpb24nfVxyXG5cdH0sXHJcblx0aWZhY2U6ICdzZXRTSURDKHNpZGMpO3NldFNpemUoc2l6ZSk7c2V0VW5pcXVlRGVzaWduYXRpb24obmFtZSknLFxyXG5cclxuXHJcblx0XG5cdGxpYjogJ21pbHN5bWJvbCcsXG5pbml0OiBmdW5jdGlvbihlbHQsIGRhdGEsIG1zKSB7XHJcblxyXG5cdFx0ZnVuY3Rpb24gY3JlYXRlU3ltYm9sQ29kZSgpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnY3JlYXRlU3ltYm9sQ29kZScsIG9wdGlvbnMpXHJcblxyXG5cclxuXHRcdFx0dmFyIHN5bWJvbCA9IG5ldyBtcy5TeW1ib2woZGF0YS5zaWRjLCB7XHJcblx0XHRcdFx0c2l6ZTogZGF0YS5zaXplLFxyXG5cdFx0XHRcdHVuaXF1ZURlc2lnbmF0aW9uOiBkYXRhLnVuaXF1ZURlc2lnbmF0aW9uXHJcblx0XHRcdH0pXHJcblx0XHRcdHJldHVybiBzeW1ib2xcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgc3ltYm9sID0gY3JlYXRlU3ltYm9sQ29kZSgpXHJcblx0XHR2YXIgaW1nID0gJCgnPGltZz4nKVxyXG5cdFx0XHQuYXR0cignc3JjJywgc3ltYm9sLnRvRGF0YVVSTCgpKVxyXG5cdFx0XHQuYXBwZW5kVG8oZWx0KVxyXG5cclxuXHJcblx0XHRmdW5jdGlvbiBzZXRTaXplKHNpemUpIHtcclxuXHRcdFx0ZGF0YS5zaXplID0gc2l6ZVxyXG5cdFx0XHRzeW1ib2wuc2V0T3B0aW9ucyh7c2l6ZTogc2l6ZX0pXHJcblx0XHRcdGltZy5hdHRyKCdzcmMnLCBzeW1ib2wudG9EYXRhVVJMKCkpXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gc2V0VW5pcXVlRGVzaWduYXRpb24odW5pcXVlRGVzaWduYXRpb24pIHtcclxuXHRcdFx0ZGF0YS51bmlxdWVEZXNpZ25hdGlvbiA9IHVuaXF1ZURlc2lnbmF0aW9uXHJcblx0XHRcdHN5bWJvbC5zZXRPcHRpb25zKHt1bmlxdWVEZXNpZ25hdGlvbjogdW5pcXVlRGVzaWduYXRpb259KVxyXG5cdFx0XHRpbWcuYXR0cignc3JjJywgc3ltYm9sLnRvRGF0YVVSTCgpKVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHNldFNJREMoc2lkYykge1xyXG5cdFx0XHRkYXRhLnNpZGMgPSBzaWRjXHJcblx0XHRcdHN5bWJvbCA9IGNyZWF0ZVN5bWJvbENvZGUoKVxyXG5cdFx0XHRpbWcuYXR0cignc3JjJywgc3ltYm9sLnRvRGF0YVVSTCgpKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdHNldFNJREMsXHJcblx0XHRcdHNldFNpemUsXHJcblx0XHRcdHNldFVuaXF1ZURlc2lnbmF0aW9uXHJcblxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcblxyXG4iXX0=

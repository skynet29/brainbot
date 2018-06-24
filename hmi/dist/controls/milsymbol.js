
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


		this.setSize = function(size) {
			data.size = size
			symbol.setOptions({size: size})
			img.attr('src', symbol.toDataURL())
		}

		this.setUniqueDesignation = function(uniqueDesignation) {
			data.uniqueDesignation = uniqueDesignation
			symbol.setOptions({uniqueDesignation: uniqueDesignation})
			img.attr('src', symbol.toDataURL())
		}

		this.setSIDC = function(sidc) {
			data.sidc = sidc
			symbol = createSymbolCode()
			img.attr('src', symbol.toDataURL())
		}


	}
});




//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1pbHN5bWJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWlsc3ltYm9sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNaWxTeW1ib2xDb250cm9sJywge1xyXG5cdGRlcHM6IFsnTWlsU3ltYm9sU2VydmljZSddLFxyXG5cdHByb3BzOiB7XHJcblx0XHRzaXplOiB7dmFsOiAyMCwgc2V0OiAnc2V0U2l6ZSd9LFxyXG5cdFx0c2lkYzoge3ZhbDogJycsIHNldDogJ3NldFNJREMnfSxcclxuXHRcdHVuaXF1ZURlc2lnbmF0aW9uOiB7dmFsOiAnJywgc2V0OiAnc2V0VW5pcXVlRGVzaWduYXRpb24nfVxyXG5cdH0sXHJcblx0aWZhY2U6ICdzZXRTSURDKHNpZGMpO3NldFNpemUoc2l6ZSk7c2V0VW5pcXVlRGVzaWduYXRpb24obmFtZSknLFxyXG5cclxuXHJcblx0XG5cdGxpYjogJ21pbHN5bWJvbCcsXG5pbml0OiBmdW5jdGlvbihlbHQsIGRhdGEsIG1zKSB7XHJcblxyXG5cdFx0ZnVuY3Rpb24gY3JlYXRlU3ltYm9sQ29kZSgpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnY3JlYXRlU3ltYm9sQ29kZScsIG9wdGlvbnMpXHJcblxyXG5cclxuXHRcdFx0dmFyIHN5bWJvbCA9IG5ldyBtcy5TeW1ib2woZGF0YS5zaWRjLCB7XHJcblx0XHRcdFx0c2l6ZTogZGF0YS5zaXplLFxyXG5cdFx0XHRcdHVuaXF1ZURlc2lnbmF0aW9uOiBkYXRhLnVuaXF1ZURlc2lnbmF0aW9uXHJcblx0XHRcdH0pXHJcblx0XHRcdHJldHVybiBzeW1ib2xcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgc3ltYm9sID0gY3JlYXRlU3ltYm9sQ29kZSgpXHJcblx0XHR2YXIgaW1nID0gJCgnPGltZz4nKVxyXG5cdFx0XHQuYXR0cignc3JjJywgc3ltYm9sLnRvRGF0YVVSTCgpKVxyXG5cdFx0XHQuYXBwZW5kVG8oZWx0KVxyXG5cclxuXHJcblx0XHR0aGlzLnNldFNpemUgPSBmdW5jdGlvbihzaXplKSB7XHJcblx0XHRcdGRhdGEuc2l6ZSA9IHNpemVcclxuXHRcdFx0c3ltYm9sLnNldE9wdGlvbnMoe3NpemU6IHNpemV9KVxyXG5cdFx0XHRpbWcuYXR0cignc3JjJywgc3ltYm9sLnRvRGF0YVVSTCgpKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuc2V0VW5pcXVlRGVzaWduYXRpb24gPSBmdW5jdGlvbih1bmlxdWVEZXNpZ25hdGlvbikge1xyXG5cdFx0XHRkYXRhLnVuaXF1ZURlc2lnbmF0aW9uID0gdW5pcXVlRGVzaWduYXRpb25cclxuXHRcdFx0c3ltYm9sLnNldE9wdGlvbnMoe3VuaXF1ZURlc2lnbmF0aW9uOiB1bmlxdWVEZXNpZ25hdGlvbn0pXHJcblx0XHRcdGltZy5hdHRyKCdzcmMnLCBzeW1ib2wudG9EYXRhVVJMKCkpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5zZXRTSURDID0gZnVuY3Rpb24oc2lkYykge1xyXG5cdFx0XHRkYXRhLnNpZGMgPSBzaWRjXHJcblx0XHRcdHN5bWJvbCA9IGNyZWF0ZVN5bWJvbENvZGUoKVxyXG5cdFx0XHRpbWcuYXR0cignc3JjJywgc3ltYm9sLnRvRGF0YVVSTCgpKVxyXG5cdFx0fVxyXG5cclxuXHJcblx0fVxyXG59KTtcclxuXHJcblxyXG5cclxuIl19

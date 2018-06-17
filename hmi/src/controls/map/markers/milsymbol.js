(function() {

	var dataSchema = {
		$size: 'number',
		$name: 'string',
		sidc: 'string'
	}

	$$.registerObject('map.icon', 'milsymbol', ['MilSymbolService'], function(data, ms) {

		//console.log('data', data)

		if (!$$.checkType(data, dataSchema)) {
			console.warn('[TacticViewControl] create milsymbol marker, missing or wrong parameters', data, 'schema: ', dataSchema)
			return null
		}

		var symbol = new ms.Symbol(data.sidc, {
			size: data.size || 20,
			uniqueDesignation: data.name
		})

		var anchor = symbol.getAnchor()

		return L.icon({
			iconUrl: symbol.toDataURL(),
			iconAnchor: [anchor.x, anchor.y],
		})		
	})

})();
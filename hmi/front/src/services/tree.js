(function() {

	$$.registerService('TreeCtrlService', function(config) {


		if ($.ui.fancytree == undefined) {
			throw(`[TreeCtrlService] Missing library dependancy 'tree.js'`)
		}
		else {
			console.log('Fancytree version:', $.ui.fancytree.version)
			$$.loadStyle('/css/tree/tree.css')
		}

		return {}

	})

})();

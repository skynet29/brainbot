(function() {

	$$.registerService('TreeCtrlService', function(config) {


		if ($.ui.fancytree == undefined) {
			console.warn(`[TreeCtrlService] Missing library dependancy 'tree.js'`)
		}
		else {
			console.log('Fancytree version:', $.ui.fancytree.version)
			$$.loadStyle('/css/tree/tree.css')
		}

		return {}

	})

})();

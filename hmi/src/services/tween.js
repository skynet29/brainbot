(function() {

	$$.registerService('TweenMaxService', function(config) {

		var TweenMax = window.TweenMax

		if (! TweenMax) {
			console.warn(`[TweenMaxService] Missing library dependancy 'tween.js'`)
		}
		else {
			//delete window.TweenMax
		}

		return TweenMax

	})

})();
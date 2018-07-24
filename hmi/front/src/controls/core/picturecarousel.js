$$.registerControlEx('PictureCarouselControl', {

	props: {
		index: {val: 0, set: 'setIndex'},
		images: {val: [], set: 'setImages'}
	},
	options: {
		width: 300,
		height: 200,
		animateDelay: 1000,
		color: 'yellow'
	},	

	iface: 'setImages(images);setIndex(idx)',

	init: function(elt, options) {

		console.log(`[PictureCarouselControl] options`, options)

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './picturecarousel.html'},
			data: {
				carouselCtrlOptions: options,
				images: options.images,
				backColor: options.color,
				index: options.index
			}
		})

		this.setImages = function(value) {
			//console.log('[PictureCarouselControl] setImages', value)
			ctrl.setData('images', value)
			ctrl.scope.carouselCtrl.refresh()			
		},
		this.setIndex = function(value) {
			ctrl.setData('index', value)
		}

	}
});
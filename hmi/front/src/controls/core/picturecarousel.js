$$.registerControlEx('PictureCarouselControl', {

	props: {
		width: {val: 300},
		height: {val: 200},
		animateDelay: {val: 1000},
		index: {val: 0, set: 'setIndex'},
		images: {val: [], set: 'setImages'},
		color: {val: 'yellow'}
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
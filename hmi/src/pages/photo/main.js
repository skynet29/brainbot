$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {

	var ctrl = window.app = $$.viewController(elt, {
		template: {gulp_inject: './main.html'},
		data: {
			images: [],
			index: 0,
			showFiles: true
		},
		events: {
			onFileClicked: function(ev, data) {
				//console.log('onFileClicked', data)
				var files = $(this).interface().getFiles()
				//console.log('files', files)

				var images = files
				.filter((f) => !f.isDir)
				.map((f) => fileSrv.fileUrl(data.rootDir + f.name))
				//console.log('images', images)
				

				var index = files.findIndex((f) => f.name == data.name)
				//console.log('index', index)

				ctrl.setData({images, index, showFiles: false})
			},

			onBackClicked: function() {
				ctrl.setData({showFiles: true})
			}
		}
	})

});
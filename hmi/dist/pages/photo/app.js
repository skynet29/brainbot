$$.configReady(function() {

	$$.startApp('MainControl')
})
$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {

	var ctrl = window.app = $$.viewController(elt, {
		template: "<div>\r\n	<div \r\n		bn-control=\"FileControl\" \r\n		data-toolbar=\"false\" \r\n		data-image-only=\"true\"\r\n		bn-event=\"fileClick: onFileClicked\" \r\n		bn-show=\"showFiles\"\r\n		>			\r\n	</div>\r\n	<div \r\n		bn-show=\"!showFiles\" \r\n		class=\"bn-flex-col bn-align-center\"\r\n		>\r\n		<div style=\"width: 100%\">\r\n			<button \r\n				title=\"Back\" \r\n				class=\"backBtn\" \r\n				bn-event=\"click: onBackClicked\"\r\n			>\r\n				<i class=\"fa fa-2x fa-arrow-circle-left\"></i>\r\n			</button>\r\n		</div>\r\n		<div \r\n			bn-control=\"PictureCarouselControl\" \r\n			bn-data=\"images: images, index: index\" \r\n			data-width=\"600\" \r\n			data-height=\"400\" \r\n			data-color=\"cyan\"\r\n			>\r\n		</div>\r\n	</div>\r\n</div>",
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
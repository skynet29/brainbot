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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbigpIHtcclxuXHJcblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcclxufSkiLCIkJC5yZWdpc3RlckNvbnRyb2woJ01haW5Db250cm9sJywgWydGaWxlU2VydmljZSddLCBmdW5jdGlvbihlbHQsIGZpbGVTcnYpIHtcclxuXHJcblx0dmFyIGN0cmwgPSB3aW5kb3cuYXBwID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2Plxcclxcblx0PGRpdiBcXHJcXG5cdFx0Ym4tY29udHJvbD1cXFwiRmlsZUNvbnRyb2xcXFwiIFxcclxcblx0XHRkYXRhLXRvb2xiYXI9XFxcImZhbHNlXFxcIiBcXHJcXG5cdFx0ZGF0YS1pbWFnZS1vbmx5PVxcXCJ0cnVlXFxcIlxcclxcblx0XHRibi1ldmVudD1cXFwiZmlsZUNsaWNrOiBvbkZpbGVDbGlja2VkXFxcIiBcXHJcXG5cdFx0Ym4tc2hvdz1cXFwic2hvd0ZpbGVzXFxcIlxcclxcblx0XHQ+XHRcdFx0XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdDxkaXYgXFxyXFxuXHRcdGJuLXNob3c9XFxcIiFzaG93RmlsZXNcXFwiIFxcclxcblx0XHRjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tYWxpZ24tY2VudGVyXFxcIlxcclxcblx0XHQ+XFxyXFxuXHRcdDxkaXYgc3R5bGU9XFxcIndpZHRoOiAxMDAlXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0dGl0bGU9XFxcIkJhY2tcXFwiIFxcclxcblx0XHRcdFx0Y2xhc3M9XFxcImJhY2tCdG5cXFwiIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkJhY2tDbGlja2VkXFxcIlxcclxcblx0XHRcdD5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1hcnJvdy1jaXJjbGUtbGVmdFxcXCI+PC9pPlxcclxcblx0XHRcdDwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdFx0PGRpdiBcXHJcXG5cdFx0XHRibi1jb250cm9sPVxcXCJQaWN0dXJlQ2Fyb3VzZWxDb250cm9sXFxcIiBcXHJcXG5cdFx0XHRibi1kYXRhPVxcXCJpbWFnZXM6IGltYWdlcywgaW5kZXg6IGluZGV4XFxcIiBcXHJcXG5cdFx0XHRkYXRhLXdpZHRoPVxcXCI2MDBcXFwiIFxcclxcblx0XHRcdGRhdGEtaGVpZ2h0PVxcXCI0MDBcXFwiIFxcclxcblx0XHRcdGRhdGEtY29sb3I9XFxcImN5YW5cXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdDwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0ZGF0YToge1xyXG5cdFx0XHRpbWFnZXM6IFtdLFxyXG5cdFx0XHRpbmRleDogMCxcclxuXHRcdFx0c2hvd0ZpbGVzOiB0cnVlXHJcblx0XHR9LFxyXG5cdFx0ZXZlbnRzOiB7XHJcblx0XHRcdG9uRmlsZUNsaWNrZWQ6IGZ1bmN0aW9uKGV2LCBkYXRhKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25GaWxlQ2xpY2tlZCcsIGRhdGEpXHJcblx0XHRcdFx0dmFyIGZpbGVzID0gJCh0aGlzKS5pbnRlcmZhY2UoKS5nZXRGaWxlcygpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZmlsZXMnLCBmaWxlcylcclxuXHJcblx0XHRcdFx0dmFyIGltYWdlcyA9IGZpbGVzXHJcblx0XHRcdFx0LmZpbHRlcigoZikgPT4gIWYuaXNEaXIpXHJcblx0XHRcdFx0Lm1hcCgoZikgPT4gZmlsZVNydi5maWxlVXJsKGRhdGEucm9vdERpciArIGYubmFtZSkpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnaW1hZ2VzJywgaW1hZ2VzKVxyXG5cdFx0XHRcdFxyXG5cclxuXHRcdFx0XHR2YXIgaW5kZXggPSBmaWxlcy5maW5kSW5kZXgoKGYpID0+IGYubmFtZSA9PSBkYXRhLm5hbWUpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnaW5kZXgnLCBpbmRleClcclxuXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtpbWFnZXMsIGluZGV4LCBzaG93RmlsZXM6IGZhbHNlfSlcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdG9uQmFja0NsaWNrZWQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7c2hvd0ZpbGVzOiB0cnVlfSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG59KTsiXX0=

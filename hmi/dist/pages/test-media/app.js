$$.configReady(function(config) {

	$$.startApp('MainControl')
})
$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {



	var pictureUrl

	function savePicture() {
		fileSrv.uploadFile(pictureUrl, 'image.png', '/').then(function(resp) {
			console.log('resp', resp)
			$.notify('File uploaded successfully', {position: 'right top', className: 'success'})
		})	
		.catch(function(resp) {
			console.warn('savePicture error', resp.responseText)
		})
 
	}

	const saveDlgCtrl = $$.formDialogController('Save Picture', {
		template: "<div>\r\n	<label>Choose folder :</label>\r\n	<div style=\"height: 200px\" class=\"scrollPanel\">\r\n		<div bn-control=\"FileTreeControl\" name=\"folderName\"  bn-iface=\"treeCtrl\"></div>\r\n	</div>\r\n	\r\n	<div class=\"bn-flex-col\" bn-control=\"InputGroupControl\">\r\n		<label>FileName :</label>\r\n		<input type=\"text\" name=\"fileName\" required>\r\n	</div>\r\n\r\n</div>"
	})

	saveDlgCtrl.beforeShow = function() {
		console.log('beforeShow')
		this.scope.treeCtrl.refresh()		
	}

	const ctrl = window.app = $$.viewController(elt, {
		template: "<div class=\"bn-flex-col\" style=\"align-items: center; padding: 10px;\">\r\n\r\n	<div bn-show=\"!showPhoto\">\r\n		<div bn-show=\"showBtn\">\r\n			<button title=\"Take a picture\" bn-event=\"click: onTakePhoto\" ><i class=\"fa fa-camera fa-2x\"></i></button>\r\n		</div>\r\n		\r\n		<div bn-control=\"WebcamControl\" bn-iface=\"video\" bn-event=\"mediaReady: onMediaReady\"></div>\r\n			\r\n	</div>\r\n\r\n	<div bn-show=\"showPhoto\">\r\n		<div>\r\n			<button title=\"Back\" bn-event=\"click: onBack\"><i class=\"fa fa-2x fa-arrow-circle-left\"></i></button>\r\n			<button title=\"Save Picture\" bn-event=\"click: onSave\"><i class=\"fa fa-2x fa-save\"></i></button>\r\n		</div>\r\n		<img bn-attr=\"src: imgUrl\">\r\n	</div>\r\n\r\n\r\n</div>",
		data: {
			showBtn: false,
			imgUrl: '',
			showPhoto: false
		},
		events: {
			onTakePhoto: function() {
				console.log('onTakePhoto')
				pictureUrl = ctrl.scope.video.takePicture()
				ctrl.setData({imgUrl: pictureUrl, showPhoto: true})
				
			},

			onMediaReady: function() {
				console.log('onMediaReady')
				ctrl.setData('showBtn', true)
			},

			onBack: function() {
				ctrl.setData({showPhoto: false})
			},

			onSave: function() {


				saveDlgCtrl.show({}, function(data) {
					console.log('data', data)

					fileSrv.uploadFile(pictureUrl, data.fileName + '.png', data.folderName).then(function(resp) {
						console.log('resp', resp)
						$.notify('File uploaded successfully', {position: 'right top', className: 'success'})
						ctrl.setData({showPhoto: false})
					})	
					.catch(function(resp) {
						console.warn('savePicture error', resp.responseText)
						ctrl.setData({showPhoto: false})
					})
				})
			
			},



		}
	})

});

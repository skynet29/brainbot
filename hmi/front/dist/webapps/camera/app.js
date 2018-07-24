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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcclxufSkiLCIkJC5yZWdpc3RlckNvbnRyb2woJ01haW5Db250cm9sJywgWydGaWxlU2VydmljZSddLCBmdW5jdGlvbihlbHQsIGZpbGVTcnYpIHtcclxuXHJcblxyXG5cclxuXHR2YXIgcGljdHVyZVVybFxyXG5cclxuXHRmdW5jdGlvbiBzYXZlUGljdHVyZSgpIHtcclxuXHRcdGZpbGVTcnYudXBsb2FkRmlsZShwaWN0dXJlVXJsLCAnaW1hZ2UucG5nJywgJy8nKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHQkLm5vdGlmeSgnRmlsZSB1cGxvYWRlZCBzdWNjZXNzZnVsbHknLCB7cG9zaXRpb246ICdyaWdodCB0b3AnLCBjbGFzc05hbWU6ICdzdWNjZXNzJ30pXHJcblx0XHR9KVx0XHJcblx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRjb25zb2xlLndhcm4oJ3NhdmVQaWN0dXJlIGVycm9yJywgcmVzcC5yZXNwb25zZVRleHQpXHJcblx0XHR9KVxyXG4gXHJcblx0fVxyXG5cclxuXHRjb25zdCBzYXZlRGxnQ3RybCA9ICQkLmZvcm1EaWFsb2dDb250cm9sbGVyKCdTYXZlIFBpY3R1cmUnLCB7XHJcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2Plxcclxcblx0PGxhYmVsPkNob29zZSBmb2xkZXIgOjwvbGFiZWw+XFxyXFxuXHQ8ZGl2IHN0eWxlPVxcXCJoZWlnaHQ6IDIwMHB4XFxcIiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIkZpbGVUcmVlQ29udHJvbFxcXCIgbmFtZT1cXFwiZm9sZGVyTmFtZVxcXCIgIGJuLWlmYWNlPVxcXCJ0cmVlQ3RybFxcXCI+PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdFxcclxcblx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2xcXFwiIGJuLWNvbnRyb2w9XFxcIklucHV0R3JvdXBDb250cm9sXFxcIj5cXHJcXG5cdFx0PGxhYmVsPkZpbGVOYW1lIDo8L2xhYmVsPlxcclxcblx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmFtZT1cXFwiZmlsZU5hbWVcXFwiIHJlcXVpcmVkPlxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuPC9kaXY+XCJcclxuXHR9KVxyXG5cclxuXHRzYXZlRGxnQ3RybC5iZWZvcmVTaG93ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRjb25zb2xlLmxvZygnYmVmb3JlU2hvdycpXHJcblx0XHR0aGlzLnNjb3BlLnRyZWVDdHJsLnJlZnJlc2goKVx0XHRcclxuXHR9XHJcblxyXG5cdGNvbnN0IGN0cmwgPSB3aW5kb3cuYXBwID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbFxcXCIgc3R5bGU9XFxcImFsaWduLWl0ZW1zOiBjZW50ZXI7IHBhZGRpbmc6IDEwcHg7XFxcIj5cXHJcXG5cXHJcXG5cdDxkaXYgYm4tc2hvdz1cXFwiIXNob3dQaG90b1xcXCI+XFxyXFxuXHRcdDxkaXYgYm4tc2hvdz1cXFwic2hvd0J0blxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiB0aXRsZT1cXFwiVGFrZSBhIHBpY3R1cmVcXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25UYWtlUGhvdG9cXFwiID48aSBjbGFzcz1cXFwiZmEgZmEtY2FtZXJhIGZhLTJ4XFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJXZWJjYW1Db250cm9sXFxcIiBibi1pZmFjZT1cXFwidmlkZW9cXFwiIGJuLWV2ZW50PVxcXCJtZWRpYVJlYWR5OiBvbk1lZGlhUmVhZHlcXFwiPjwvZGl2Plxcclxcblx0XHRcdFxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8ZGl2IGJuLXNob3c9XFxcInNob3dQaG90b1xcXCI+XFxyXFxuXHRcdDxkaXY+XFxyXFxuXHRcdFx0PGJ1dHRvbiB0aXRsZT1cXFwiQmFja1xcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkJhY2tcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1hcnJvdy1jaXJjbGUtbGVmdFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gdGl0bGU9XFxcIlNhdmUgUGljdHVyZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblNhdmVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1zYXZlXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0XHQ8aW1nIGJuLWF0dHI9XFxcInNyYzogaW1nVXJsXFxcIj5cXHJcXG5cdDwvZGl2PlxcclxcblxcclxcblxcclxcbjwvZGl2PlwiLFxyXG5cdFx0ZGF0YToge1xyXG5cdFx0XHRzaG93QnRuOiBmYWxzZSxcclxuXHRcdFx0aW1nVXJsOiAnJyxcclxuXHRcdFx0c2hvd1Bob3RvOiBmYWxzZVxyXG5cdFx0fSxcclxuXHRcdGV2ZW50czoge1xyXG5cdFx0XHRvblRha2VQaG90bzogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ29uVGFrZVBob3RvJylcclxuXHRcdFx0XHRwaWN0dXJlVXJsID0gY3RybC5zY29wZS52aWRlby50YWtlUGljdHVyZSgpXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtpbWdVcmw6IHBpY3R1cmVVcmwsIHNob3dQaG90bzogdHJ1ZX0pXHJcblx0XHRcdFx0XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRvbk1lZGlhUmVhZHk6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvbk1lZGlhUmVhZHknKVxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSgnc2hvd0J0bicsIHRydWUpXHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRvbkJhY2s6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7c2hvd1Bob3RvOiBmYWxzZX0pXHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRvblNhdmU6IGZ1bmN0aW9uKCkge1xyXG5cclxuXHJcblx0XHRcdFx0c2F2ZURsZ0N0cmwuc2hvdyh7fSwgZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2RhdGEnLCBkYXRhKVxyXG5cclxuXHRcdFx0XHRcdGZpbGVTcnYudXBsb2FkRmlsZShwaWN0dXJlVXJsLCBkYXRhLmZpbGVOYW1lICsgJy5wbmcnLCBkYXRhLmZvbGRlck5hbWUpLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdCQubm90aWZ5KCdGaWxlIHVwbG9hZGVkIHN1Y2Nlc3NmdWxseScsIHtwb3NpdGlvbjogJ3JpZ2h0IHRvcCcsIGNsYXNzTmFtZTogJ3N1Y2Nlc3MnfSlcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtzaG93UGhvdG86IGZhbHNlfSlcclxuXHRcdFx0XHRcdH0pXHRcclxuXHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUud2Fybignc2F2ZVBpY3R1cmUgZXJyb3InLCByZXNwLnJlc3BvbnNlVGV4dClcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtzaG93UGhvdG86IGZhbHNlfSlcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHJcblx0XHRcdH0sXHJcblxyXG5cclxuXHJcblx0XHR9XHJcblx0fSlcclxuXHJcbn0pO1xyXG4iXX0=

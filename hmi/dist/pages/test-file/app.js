$$.configReady(function() {


	$$.startApp('MainControl')
})
$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {


	var ctrl = $$.viewController(elt, {
		template: "<div bn-control=\"FileControl\" bn-event=\"fileClick: onFileClick\"></div>\r\n\r\n",
		events: {
			onFileClick: function(ev, data) {
				//console.log('onFileClick', data)
				if ($$.isImage(data.name)) {
					$$.showPicture(data.name, fileSrv.fileUrl(data.rootDir + data.name))
				}
				
			}
		}

	})



});

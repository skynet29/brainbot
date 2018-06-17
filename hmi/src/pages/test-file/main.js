$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {


	var ctrl = $$.viewController(elt, {
		template: {gulp_inject: './main.html'},
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

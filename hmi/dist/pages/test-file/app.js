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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cdCQkLnN0YXJ0QXBwKCdNYWluQ29udHJvbCcpXHJcbn0pIiwiJCQucmVnaXN0ZXJDb250cm9sKCdNYWluQ29udHJvbCcsIFsnRmlsZVNlcnZpY2UnXSwgZnVuY3Rpb24oZWx0LCBmaWxlU3J2KSB7XHJcblxyXG5cclxuXHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBibi1jb250cm9sPVxcXCJGaWxlQ29udHJvbFxcXCIgYm4tZXZlbnQ9XFxcImZpbGVDbGljazogb25GaWxlQ2xpY2tcXFwiPjwvZGl2PlxcclxcblxcclxcblwiLFxyXG5cdFx0ZXZlbnRzOiB7XHJcblx0XHRcdG9uRmlsZUNsaWNrOiBmdW5jdGlvbihldiwgZGF0YSkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ29uRmlsZUNsaWNrJywgZGF0YSlcclxuXHRcdFx0XHRpZiAoJCQuaXNJbWFnZShkYXRhLm5hbWUpKSB7XHJcblx0XHRcdFx0XHQkJC5zaG93UGljdHVyZShkYXRhLm5hbWUsIGZpbGVTcnYuZmlsZVVybChkYXRhLnJvb3REaXIgKyBkYXRhLm5hbWUpKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxuXHJcblxyXG59KTtcclxuIl19

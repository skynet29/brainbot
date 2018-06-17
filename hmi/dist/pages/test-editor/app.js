$$.configReady(function() {

	var ctrl = $$.viewController('body', {
		template: "<div class=\"bn-flex-1 bn-flex-col\">\r\n	<div bn-control=\"HtmlEditorControl\" bn-iface=\"editorCtrl\" class=\"bn-flex-1\"></div>\r\n	<div>\r\n		<button bn-event=\"click: onShowHtml\">Show HTML</button>	\r\n	</div>\r\n	\r\n</div>\r\n",
		events: {
			onShowHtml: function() {
				console.log('onShowHtml', ctrl.scope.editorCtrl.html())
			}
		}
	})
})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKCkge1xyXG5cclxuXHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xyXG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC0xIGJuLWZsZXgtY29sXFxcIj5cXHJcXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiSHRtbEVkaXRvckNvbnRyb2xcXFwiIGJuLWlmYWNlPVxcXCJlZGl0b3JDdHJsXFxcIiBjbGFzcz1cXFwiYm4tZmxleC0xXFxcIj48L2Rpdj5cXHJcXG5cdDxkaXY+XFxyXFxuXHRcdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvblNob3dIdG1sXFxcIj5TaG93IEhUTUw8L2J1dHRvbj5cdFxcclxcblx0PC9kaXY+XFxyXFxuXHRcXHJcXG48L2Rpdj5cXHJcXG5cIixcclxuXHRcdGV2ZW50czoge1xyXG5cdFx0XHRvblNob3dIdG1sOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnb25TaG93SHRtbCcsIGN0cmwuc2NvcGUuZWRpdG9yQ3RybC5odG1sKCkpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG59KSJdfQ==

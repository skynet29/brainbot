$$.configReady(function(config) {


	var ctrl = window.app = $$.viewController('body', {
		template: "<div class=\"bn-flex-col bn-flex-1\" style=\"margin: 10px; align-items: center;\">\r\n	<div bn-control=\"FlightPanelControl\" bn-data=\"roll: roll, altitude:altitude, pitch: pitch, speed:speed\" ></div>\r\n\r\n	<div class=\"bn-flex-1 bn-flex-col bn-margin-10\" style=\"width: 100%\">\r\n		<div class=\"bn-flex-row bn-align-center\">\r\n			<span style=\"width: 80px\">Speed</span>\r\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" data-max=\"200\" bn-val=\"speed\" bn-update=\"input\"></div>\r\n		</div>\r\n		<div class=\"bn-flex-row\" style=\"align-items: center;\" >\r\n			<span style=\"width: 80px\">Roll</span>\r\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" bn-val=\"roll\" bn-update=\"input\" data-min=\"-50\" data-max=\"50\"></div>\r\n		</div>\r\n		<div class=\"bn-flex-row\" style=\"align-items: center;\" >\r\n			<span style=\"width: 80px\">Pitch</span>\r\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" bn-val=\"pitch\" bn-update=\"input\" data-min=\"-40\" data-max=\"40\"></div>\r\n		</div>\r\n		<div class=\"bn-flex-row\" style=\"align-items: center;\" >\r\n			<span style=\"width: 80px\">Altitude</span>\r\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" bn-val=\"altitude\" bn-update=\"input\"></div>\r\n		</div>\r\n		\r\n	</div>\r\n	\r\n</div>",

		data: {

			roll: 10,
			pitch: 10,
			altitude: 50,
			speed: 5,

			options: {
				earthColor: 'green'
			}
		}

	})
})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuXHJcblx0dmFyIGN0cmwgPSB3aW5kb3cuYXBwID0gJCQudmlld0NvbnRyb2xsZXIoJ2JvZHknLCB7XHJcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiIHN0eWxlPVxcXCJtYXJnaW46IDEwcHg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7XFxcIj5cXHJcXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiRmxpZ2h0UGFuZWxDb250cm9sXFxcIiBibi1kYXRhPVxcXCJyb2xsOiByb2xsLCBhbHRpdHVkZTphbHRpdHVkZSwgcGl0Y2g6IHBpdGNoLCBzcGVlZDpzcGVlZFxcXCIgPjwvZGl2Plxcclxcblxcclxcblx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC0xIGJuLWZsZXgtY29sIGJuLW1hcmdpbi0xMFxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlXFxcIj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3cgYm4tYWxpZ24tY2VudGVyXFxcIj5cXHJcXG5cdFx0XHQ8c3BhbiBzdHlsZT1cXFwid2lkdGg6IDgwcHhcXFwiPlNwZWVkPC9zcGFuPlxcclxcblx0XHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMVxcXCIgYm4tY29udHJvbD1cXFwiU2xpZGVyQ29udHJvbFxcXCIgZGF0YS1tYXg9XFxcIjIwMFxcXCIgYm4tdmFsPVxcXCJzcGVlZFxcXCIgYm4tdXBkYXRlPVxcXCJpbnB1dFxcXCI+PC9kaXY+XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvd1xcXCIgc3R5bGU9XFxcImFsaWduLWl0ZW1zOiBjZW50ZXI7XFxcIiA+XFxyXFxuXHRcdFx0PHNwYW4gc3R5bGU9XFxcIndpZHRoOiA4MHB4XFxcIj5Sb2xsPC9zcGFuPlxcclxcblx0XHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMVxcXCIgYm4tY29udHJvbD1cXFwiU2xpZGVyQ29udHJvbFxcXCIgYm4tdmFsPVxcXCJyb2xsXFxcIiBibi11cGRhdGU9XFxcImlucHV0XFxcIiBkYXRhLW1pbj1cXFwiLTUwXFxcIiBkYXRhLW1heD1cXFwiNTBcXFwiPjwvZGl2Plxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3dcXFwiIHN0eWxlPVxcXCJhbGlnbi1pdGVtczogY2VudGVyO1xcXCIgPlxcclxcblx0XHRcdDxzcGFuIHN0eWxlPVxcXCJ3aWR0aDogODBweFxcXCI+UGl0Y2g8L3NwYW4+XFxyXFxuXHRcdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC0xXFxcIiBibi1jb250cm9sPVxcXCJTbGlkZXJDb250cm9sXFxcIiBibi12YWw9XFxcInBpdGNoXFxcIiBibi11cGRhdGU9XFxcImlucHV0XFxcIiBkYXRhLW1pbj1cXFwiLTQwXFxcIiBkYXRhLW1heD1cXFwiNDBcXFwiPjwvZGl2Plxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3dcXFwiIHN0eWxlPVxcXCJhbGlnbi1pdGVtczogY2VudGVyO1xcXCIgPlxcclxcblx0XHRcdDxzcGFuIHN0eWxlPVxcXCJ3aWR0aDogODBweFxcXCI+QWx0aXR1ZGU8L3NwYW4+XFxyXFxuXHRcdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC0xXFxcIiBibi1jb250cm9sPVxcXCJTbGlkZXJDb250cm9sXFxcIiBibi12YWw9XFxcImFsdGl0dWRlXFxcIiBibi11cGRhdGU9XFxcImlucHV0XFxcIj48L2Rpdj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHRcdFxcclxcblx0PC9kaXY+XFxyXFxuXHRcXHJcXG48L2Rpdj5cIixcclxuXHJcblx0XHRkYXRhOiB7XHJcblxyXG5cdFx0XHRyb2xsOiAxMCxcclxuXHRcdFx0cGl0Y2g6IDEwLFxyXG5cdFx0XHRhbHRpdHVkZTogNTAsXHJcblx0XHRcdHNwZWVkOiA1LFxyXG5cclxuXHRcdFx0b3B0aW9uczoge1xyXG5cdFx0XHRcdGVhcnRoQ29sb3I6ICdncmVlbidcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG59KSJdfQ==

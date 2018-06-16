$$.configReady(function(config) {


	var ctrl = window.app = $$.viewController('body', {
		template: "<div class=\"bn-flex-col bn-flex-1\" style=\"margin: 10px; align-items: center;\">\r\n	<div bn-control=\"FlightPanelControl\" bn-data=\"roll: roll, altitude:altitude, pitch: pitch, speed:speed\" ></div>\r\n\r\n	<div class=\"bn-flex-1 bn-flex-col bn-margin-10\" style=\"width: 100%\">\r\n		<div class=\"bn-flex-row bn-align-center\">\r\n			<span style=\"width: 80px\">Speed</span>\r\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" data-max=\"200\" bn-val=\"speed\" bn-update=\"input\"></div>\r\n		</div>\r\n		<div class=\"bn-flex-row\" style=\"align-items: center;\" >\r\n			<span style=\"width: 80px\">Roll</span>\r\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" bn-val=\"roll\" bn-update=\"input\" data-min=\"-50\" data-max=\"50\"></div>\r\n		</div>\r\n		<div class=\"bn-flex-row\" style=\"align-items: center;\" >\r\n			<span style=\"width: 80px\">Pitch</span>\r\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" bn-val=\"pitch\" bn-update=\"input\" data-min=\"-40\" data-max=\"40\"></div>\r\n		</div>\r\n		<div class=\"bn-flex-row\" style=\"align-items: center;\" >\r\n			<span style=\"width: 80px\">Altitude</span>\r\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" bn-val=\"altitude\" bn-update=\"input\"></div>\r\n		</div>\r\n		\r\n	</div>\r\n	\r\n</div>",

		data: {

			roll: 10,
			pitch: 10,
			altitude: 50,
			speed: 5
		}

	})
})
$$.configReady(function() {

	var symbols = [
		"SFG*UCDSS-*****",
		"SNG*UCDSS-*****",
		"SHG*UCDSS-*****",
		"SUG*UCDSV-*****",
		"SFG*UCDSV-*****",
		"SNG*UCDSV-*****",
		"SHG*UCDSV-*****",
		"SUG*UCDM--*****",
		"SFG*UCDM--*****",
		"SNG*UCDM--*****",
		"SHG*UCDM--*****",
		"SUG*UCDML-*****",
		"SFG*UCDML-*****",
		"SNG*UCDML-*****",
		"SHG*UCDML-*****",
		"SUG*UCDMLA*****",
		"SFG*UCDMLA*****",
		"SNG*UCDMLA*****",
		"SHG*UCDMLA*****"
	]
		

	var ctrl = window.app = $$.viewController('body', {
		template: "<div>\r\n<p>Exemple:</p>\r\n<code>\r\n	<pre>\r\n		&lt;div bn-control=\"MilSymbolControl\" data-size=\"40\" data-sidc=\"SFG-UCIZ---B\"&gt;\r\n	</pre>\r\n</code>\r\n<div bn-control=\"MilSymbolControl\" data-size=\"60\" data-sidc=\"SFG-UCIZ---B\" data-unique-designation=\"toto\"></div>\r\n<div class=\"bn-flex-row bn-flex-wrap\" bn-each=\"s of symbols\">\r\n	<div bn-control=\"MilSymbolControl\" data-size=\"40\" bn-data=\"sidc: s\"></div>\r\n</div>\r\n\r\n<div class=\"bn-flex-row\">\r\n	<div bn-event=\"input.field: onPropsChange\">\r\n		<div class=\"bn-flex-row bn-space-between\">\r\n			<label>Size:</label>\r\n			<input type=\"number\" bn-val=\"size\" name=\"size\" class=\"field\">\r\n		</div>\r\n		<div class=\"bn-flex-row bn-space-between\">\r\n			<label>SIDC:</label>\r\n			<input type=\"text\" bn-val=\"sidc\" name=\"sidc\" class=\"field\">\r\n		</div>	\r\n		<div class=\"bn-flex-row bn-space-between\">\r\n			<label>Unique designation:</label>\r\n			<input type=\"text\" bn-val=\"uniqueDesignation\" name=\"uniqueDesignation\" class=\"field\">\r\n		</div>		\r\n	</div>	\r\n\r\n	<div style=\"margin-left: 10px\">\r\n		<div bn-control=\"MilSymbolControl\" bn-data=\"sidc: sidc, size: size, uniqueDesignation: uniqueDesignation\"></div>\r\n	</div>\r\n</div>\r\n</div>\r\n",
		data: {
			size: 40,
			sidc: 'SFG-UCI----D',
			uniqueDesignation: 'toto',			
			symbols: symbols
		},	
		events: {
			onPropsChange: function() {
				var attrName = this.name
				var value = this.value
				console.log('onPropsChange', attrName, value)
				ctrl.setData(attrName, value)
			}

		}
	})


})
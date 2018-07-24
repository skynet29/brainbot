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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbigpIHtcclxuXHJcblx0dmFyIHN5bWJvbHMgPSBbXHJcblx0XHRcIlNGRypVQ0RTUy0qKioqKlwiLFxyXG5cdFx0XCJTTkcqVUNEU1MtKioqKipcIixcclxuXHRcdFwiU0hHKlVDRFNTLSoqKioqXCIsXHJcblx0XHRcIlNVRypVQ0RTVi0qKioqKlwiLFxyXG5cdFx0XCJTRkcqVUNEU1YtKioqKipcIixcclxuXHRcdFwiU05HKlVDRFNWLSoqKioqXCIsXHJcblx0XHRcIlNIRypVQ0RTVi0qKioqKlwiLFxyXG5cdFx0XCJTVUcqVUNETS0tKioqKipcIixcclxuXHRcdFwiU0ZHKlVDRE0tLSoqKioqXCIsXHJcblx0XHRcIlNORypVQ0RNLS0qKioqKlwiLFxyXG5cdFx0XCJTSEcqVUNETS0tKioqKipcIixcclxuXHRcdFwiU1VHKlVDRE1MLSoqKioqXCIsXHJcblx0XHRcIlNGRypVQ0RNTC0qKioqKlwiLFxyXG5cdFx0XCJTTkcqVUNETUwtKioqKipcIixcclxuXHRcdFwiU0hHKlVDRE1MLSoqKioqXCIsXHJcblx0XHRcIlNVRypVQ0RNTEEqKioqKlwiLFxyXG5cdFx0XCJTRkcqVUNETUxBKioqKipcIixcclxuXHRcdFwiU05HKlVDRE1MQSoqKioqXCIsXHJcblx0XHRcIlNIRypVQ0RNTEEqKioqKlwiXHJcblx0XVxyXG5cdFx0XHJcblxyXG5cdHZhciBjdHJsID0gd2luZG93LmFwcCA9ICQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xyXG5cdFx0dGVtcGxhdGU6IFwiPGRpdj5cXHJcXG48cD5FeGVtcGxlOjwvcD5cXHJcXG48Y29kZT5cXHJcXG5cdDxwcmU+XFxyXFxuXHRcdCZsdDtkaXYgYm4tY29udHJvbD1cXFwiTWlsU3ltYm9sQ29udHJvbFxcXCIgZGF0YS1zaXplPVxcXCI0MFxcXCIgZGF0YS1zaWRjPVxcXCJTRkctVUNJWi0tLUJcXFwiJmd0O1xcclxcblx0PC9wcmU+XFxyXFxuPC9jb2RlPlxcclxcbjxkaXYgYm4tY29udHJvbD1cXFwiTWlsU3ltYm9sQ29udHJvbFxcXCIgZGF0YS1zaXplPVxcXCI2MFxcXCIgZGF0YS1zaWRjPVxcXCJTRkctVUNJWi0tLUJcXFwiIGRhdGEtdW5pcXVlLWRlc2lnbmF0aW9uPVxcXCJ0b3RvXFxcIj48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1mbGV4LXdyYXBcXFwiIGJuLWVhY2g9XFxcInMgb2Ygc3ltYm9sc1xcXCI+XFxyXFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIk1pbFN5bWJvbENvbnRyb2xcXFwiIGRhdGEtc2l6ZT1cXFwiNDBcXFwiIGJuLWRhdGE9XFxcInNpZGM6IHNcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblxcclxcbjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93XFxcIj5cXHJcXG5cdDxkaXYgYm4tZXZlbnQ9XFxcImlucHV0LmZpZWxkOiBvblByb3BzQ2hhbmdlXFxcIj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3cgYm4tc3BhY2UtYmV0d2VlblxcXCI+XFxyXFxuXHRcdFx0PGxhYmVsPlNpemU6PC9sYWJlbD5cXHJcXG5cdFx0XHQ8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiBibi12YWw9XFxcInNpemVcXFwiIG5hbWU9XFxcInNpemVcXFwiIGNsYXNzPVxcXCJmaWVsZFxcXCI+XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1zcGFjZS1iZXR3ZWVuXFxcIj5cXHJcXG5cdFx0XHQ8bGFiZWw+U0lEQzo8L2xhYmVsPlxcclxcblx0XHRcdDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBibi12YWw9XFxcInNpZGNcXFwiIG5hbWU9XFxcInNpZGNcXFwiIGNsYXNzPVxcXCJmaWVsZFxcXCI+XFxyXFxuXHRcdDwvZGl2Plx0XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93IGJuLXNwYWNlLWJldHdlZW5cXFwiPlxcclxcblx0XHRcdDxsYWJlbD5VbmlxdWUgZGVzaWduYXRpb246PC9sYWJlbD5cXHJcXG5cdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgYm4tdmFsPVxcXCJ1bmlxdWVEZXNpZ25hdGlvblxcXCIgbmFtZT1cXFwidW5pcXVlRGVzaWduYXRpb25cXFwiIGNsYXNzPVxcXCJmaWVsZFxcXCI+XFxyXFxuXHRcdDwvZGl2Plx0XHRcXHJcXG5cdDwvZGl2Plx0XFxyXFxuXFxyXFxuXHQ8ZGl2IHN0eWxlPVxcXCJtYXJnaW4tbGVmdDogMTBweFxcXCI+XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiTWlsU3ltYm9sQ29udHJvbFxcXCIgYm4tZGF0YT1cXFwic2lkYzogc2lkYywgc2l6ZTogc2l6ZSwgdW5pcXVlRGVzaWduYXRpb246IHVuaXF1ZURlc2lnbmF0aW9uXFxcIj48L2Rpdj5cXHJcXG5cdDwvZGl2PlxcclxcbjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiLFxyXG5cdFx0ZGF0YToge1xyXG5cdFx0XHRzaXplOiA0MCxcclxuXHRcdFx0c2lkYzogJ1NGRy1VQ0ktLS0tRCcsXHJcblx0XHRcdHVuaXF1ZURlc2lnbmF0aW9uOiAndG90bycsXHRcdFx0XHJcblx0XHRcdHN5bWJvbHM6IHN5bWJvbHNcclxuXHRcdH0sXHRcclxuXHRcdGV2ZW50czoge1xyXG5cdFx0XHRvblByb3BzQ2hhbmdlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgYXR0ck5hbWUgPSB0aGlzLm5hbWVcclxuXHRcdFx0XHR2YXIgdmFsdWUgPSB0aGlzLnZhbHVlXHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ29uUHJvcHNDaGFuZ2UnLCBhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHR9KVxyXG5cclxuXHJcbn0pIl19

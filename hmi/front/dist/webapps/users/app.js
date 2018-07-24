$$.configReady(function () {
	console.log('App started')

	var ctrl = $$.viewController('body', {
		template: " <div class=\"mainPanel\">\r\n    <div bn-control=\"UsersControl\" class=\"w3-card-4 w3-light-grey\" bn-event=\"userSelected: onUserSelected, userDeleted: onUserDeleted\"></div>\r\n    <div bn-control=\"UserDetailsControl\" class=\"w3-card-4 w3-light-grey\" bn-iface=\"userDetailsCtrl\"></div>\r\n</div>",
		events: {
			onUserSelected: function(user) {
				console.log('userSelected', user)
				ctrl.scope.userDetailsCtrl.setUser(user)
			},

			onUserDeleted: function(user) {
				console.log('userDeleted', user)
				if (ctrl.scope.userDetailsCtrl.getUser() === user) {
					ctrl.scope.userDetailsCtrl.hide()
				}
				
			}	
		}	
	})


})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uICgpIHtcclxuXHRjb25zb2xlLmxvZygnQXBwIHN0YXJ0ZWQnKVxyXG5cclxuXHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xyXG5cdFx0dGVtcGxhdGU6IFwiIDxkaXYgY2xhc3M9XFxcIm1haW5QYW5lbFxcXCI+XFxyXFxuICAgIDxkaXYgYm4tY29udHJvbD1cXFwiVXNlcnNDb250cm9sXFxcIiBjbGFzcz1cXFwidzMtY2FyZC00IHczLWxpZ2h0LWdyZXlcXFwiIGJuLWV2ZW50PVxcXCJ1c2VyU2VsZWN0ZWQ6IG9uVXNlclNlbGVjdGVkLCB1c2VyRGVsZXRlZDogb25Vc2VyRGVsZXRlZFxcXCI+PC9kaXY+XFxyXFxuICAgIDxkaXYgYm4tY29udHJvbD1cXFwiVXNlckRldGFpbHNDb250cm9sXFxcIiBjbGFzcz1cXFwidzMtY2FyZC00IHczLWxpZ2h0LWdyZXlcXFwiIGJuLWlmYWNlPVxcXCJ1c2VyRGV0YWlsc0N0cmxcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0ZXZlbnRzOiB7XHJcblx0XHRcdG9uVXNlclNlbGVjdGVkOiBmdW5jdGlvbih1c2VyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ3VzZXJTZWxlY3RlZCcsIHVzZXIpXHJcblx0XHRcdFx0Y3RybC5zY29wZS51c2VyRGV0YWlsc0N0cmwuc2V0VXNlcih1c2VyKVxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0b25Vc2VyRGVsZXRlZDogZnVuY3Rpb24odXNlcikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCd1c2VyRGVsZXRlZCcsIHVzZXIpXHJcblx0XHRcdFx0aWYgKGN0cmwuc2NvcGUudXNlckRldGFpbHNDdHJsLmdldFVzZXIoKSA9PT0gdXNlcikge1xyXG5cdFx0XHRcdFx0Y3RybC5zY29wZS51c2VyRGV0YWlsc0N0cmwuaGlkZSgpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHR9XHRcclxuXHRcdH1cdFxyXG5cdH0pXHJcblxyXG5cclxufSkiXX0=

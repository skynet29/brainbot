$$.configReady(function(config) {

    var formData = {
        gender: 'female',
         fruits: ['orange', 'apple'],
          name: 'toto'
    }

    var options = {
        "menus": [
            {"text": "\uf015", "action": "toto", color: 'red'},
            {"text": "\uf099", "color": "blue"}
            ],
        "triggerPos": {
            "left": 100,
            "top": 200
        }
    }

    var clients = [
        'Marc',
        'Quentin'
    ]


    var ctrl = $$.viewController('body', {
        template: "<div>\r\n<div class=\"bn-flex-row\">\r\n    <form bn-form=\"formData\" bn-event=\"submit: onSubmit\">\r\n        <p>Name: <input type=\"text\" name=\"name\"></p>\r\n        <p>Email: <input type=\"text\" name=\"email\"></p>\r\n        <p>Gender:\r\n            <ul bn-control=\"RadioGroupControl\" name=\"gender\" bn-event=\"input: onGenderChange\">\r\n                <li><input type=\"radio\" value=\"male\" id=\"male\"><label for=\"male\">Male</label> </li>\r\n                <li><input type=\"radio\" value=\"female\" id=\"female\"><label for=\"female\">Female</label> </li>\r\n            </ul>\r\n        </p>\r\n        <p>Fruits:\r\n            <ul bn-control=\"CheckGroupControl\" name=\"fruits\" bn-event=\"input: onFruitsChange\">\r\n                <li><input type=\"checkbox\" value=\"orange\">Orange </li>\r\n                <li><input type=\"checkbox\" value=\"bananas\">Bananas </li>\r\n                <li><input type=\"checkbox\" value=\"apple\">Apple </li>\r\n            </ul>\r\n        </p>\r\n        <p><button type=\"submit\" class=\"w3-btn w3-blue\">Submit</button></p>\r\n    </form>  \r\n    <div>\r\n        <pre bn-text=\"result\"></pre>\r\n    </div>  \r\n</div>\r\n\r\n<div>\r\n    <h2>Name</h2>\r\n    <p bn-text=\"name\"></p>\r\n    <h2>FullName</h2>\r\n    <p bn-text=\"fullName\"></p>\r\n</div>\r\n\r\n<div>\r\n    <h2>Clients</h2>\r\n    <ul bn-each=\"client of clients\">\r\n        <li bn-text=\"client\"></li>\r\n    </ul>\r\n    <form bn-event=\"submit: addClient, input.field: onFieldChange\">\r\n        <input class=\"field\" type=\"text\" name=\"name\" placeholder=\"Name\" required>\r\n        <input class=\"field\" type=\"number\" name=\"age\" placeholder=\"Age\" min=\"1\" required>\r\n        <button type=\"submit\" bn-prop=\"disabled: !canSubmit\">New Client</button>\r\n    </form>\r\n</div>\r\n\r\n\r\n\r\n<div style=\"width:300px; height: 300px; border: 1px solid black;\">\r\n    <div bn-control=\"CircularMenuControl\" bn-options=\"options\" data-radius=\"120\" data-iconPos=\"80\" data-innerRadius=\"40\" bn-event=\"menuSelected: onMenuSelected\"/>\r\n</div>\r\n</div>",
        data: {
            formData, options, 
            clients,
             canSubmit: false,
             name: 'Delomez',
             surname: 'Marc',
             fullName: function() {
                //console.log('fullName', this)
                return this.name + ' ' + this.surname
             }
         },

         events: {
            onSubmit: function(ev) {
                ev.preventDefault()
                var result = JSON.stringify($(this).getFormData(), null, 4)
                //$('body').processTemplate({result: result})
                ctrl.setData({result: result})
               
            },
            onMenuSelected: function(info) {
                console.log('menuSelected', info)
            },
            addClient: function(ev) {
                ev.preventDefault()
                var data = $(this).getFormData()

                console.log('addClient', data)
                ctrl.model.clients.push(data.name)
                ctrl.update('clients')
            },
            onFieldChange: function(ev) {
                console.log('onFieldChange')
                var isOk = this.reportValidity()
                ctrl.setData({canSubmit: isOk})
            },
            onGenderChange: function() {
                console.log('onGenderChange', $(this).getValue())
            },
            onFruitsChange: function() {
                console.log('onFruitsChange', $(this).getValue())
            }  
        }      
    }) 

    window.app = ctrl
})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuICAgIHZhciBmb3JtRGF0YSA9IHtcclxuICAgICAgICBnZW5kZXI6ICdmZW1hbGUnLFxyXG4gICAgICAgICBmcnVpdHM6IFsnb3JhbmdlJywgJ2FwcGxlJ10sXHJcbiAgICAgICAgICBuYW1lOiAndG90bydcclxuICAgIH1cclxuXHJcbiAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICBcIm1lbnVzXCI6IFtcclxuICAgICAgICAgICAge1widGV4dFwiOiBcIlxcdWYwMTVcIiwgXCJhY3Rpb25cIjogXCJ0b3RvXCIsIGNvbG9yOiAncmVkJ30sXHJcbiAgICAgICAgICAgIHtcInRleHRcIjogXCJcXHVmMDk5XCIsIFwiY29sb3JcIjogXCJibHVlXCJ9XHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgXCJ0cmlnZ2VyUG9zXCI6IHtcclxuICAgICAgICAgICAgXCJsZWZ0XCI6IDEwMCxcclxuICAgICAgICAgICAgXCJ0b3BcIjogMjAwXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBjbGllbnRzID0gW1xyXG4gICAgICAgICdNYXJjJyxcclxuICAgICAgICAnUXVlbnRpbidcclxuICAgIF1cclxuXHJcblxyXG4gICAgdmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcignYm9keScsIHtcclxuICAgICAgICB0ZW1wbGF0ZTogXCI8ZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93XFxcIj5cXHJcXG4gICAgPGZvcm0gYm4tZm9ybT1cXFwiZm9ybURhdGFcXFwiIGJuLWV2ZW50PVxcXCJzdWJtaXQ6IG9uU3VibWl0XFxcIj5cXHJcXG4gICAgICAgIDxwPk5hbWU6IDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBuYW1lPVxcXCJuYW1lXFxcIj48L3A+XFxyXFxuICAgICAgICA8cD5FbWFpbDogPGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcImVtYWlsXFxcIj48L3A+XFxyXFxuICAgICAgICA8cD5HZW5kZXI6XFxyXFxuICAgICAgICAgICAgPHVsIGJuLWNvbnRyb2w9XFxcIlJhZGlvR3JvdXBDb250cm9sXFxcIiBuYW1lPVxcXCJnZW5kZXJcXFwiIGJuLWV2ZW50PVxcXCJpbnB1dDogb25HZW5kZXJDaGFuZ2VcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8bGk+PGlucHV0IHR5cGU9XFxcInJhZGlvXFxcIiB2YWx1ZT1cXFwibWFsZVxcXCIgaWQ9XFxcIm1hbGVcXFwiPjxsYWJlbCBmb3I9XFxcIm1hbGVcXFwiPk1hbGU8L2xhYmVsPiA8L2xpPlxcclxcbiAgICAgICAgICAgICAgICA8bGk+PGlucHV0IHR5cGU9XFxcInJhZGlvXFxcIiB2YWx1ZT1cXFwiZmVtYWxlXFxcIiBpZD1cXFwiZmVtYWxlXFxcIj48bGFiZWwgZm9yPVxcXCJmZW1hbGVcXFwiPkZlbWFsZTwvbGFiZWw+IDwvbGk+XFxyXFxuICAgICAgICAgICAgPC91bD5cXHJcXG4gICAgICAgIDwvcD5cXHJcXG4gICAgICAgIDxwPkZydWl0czpcXHJcXG4gICAgICAgICAgICA8dWwgYm4tY29udHJvbD1cXFwiQ2hlY2tHcm91cENvbnRyb2xcXFwiIG5hbWU9XFxcImZydWl0c1xcXCIgYm4tZXZlbnQ9XFxcImlucHV0OiBvbkZydWl0c0NoYW5nZVxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxsaT48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIHZhbHVlPVxcXCJvcmFuZ2VcXFwiPk9yYW5nZSA8L2xpPlxcclxcbiAgICAgICAgICAgICAgICA8bGk+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiB2YWx1ZT1cXFwiYmFuYW5hc1xcXCI+QmFuYW5hcyA8L2xpPlxcclxcbiAgICAgICAgICAgICAgICA8bGk+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiB2YWx1ZT1cXFwiYXBwbGVcXFwiPkFwcGxlIDwvbGk+XFxyXFxuICAgICAgICAgICAgPC91bD5cXHJcXG4gICAgICAgIDwvcD5cXHJcXG4gICAgICAgIDxwPjxidXR0b24gdHlwZT1cXFwic3VibWl0XFxcIiBjbGFzcz1cXFwidzMtYnRuIHczLWJsdWVcXFwiPlN1Ym1pdDwvYnV0dG9uPjwvcD5cXHJcXG4gICAgPC9mb3JtPiAgXFxyXFxuICAgIDxkaXY+XFxyXFxuICAgICAgICA8cHJlIGJuLXRleHQ9XFxcInJlc3VsdFxcXCI+PC9wcmU+XFxyXFxuICAgIDwvZGl2PiAgXFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuPGRpdj5cXHJcXG4gICAgPGgyPk5hbWU8L2gyPlxcclxcbiAgICA8cCBibi10ZXh0PVxcXCJuYW1lXFxcIj48L3A+XFxyXFxuICAgIDxoMj5GdWxsTmFtZTwvaDI+XFxyXFxuICAgIDxwIGJuLXRleHQ9XFxcImZ1bGxOYW1lXFxcIj48L3A+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuPGRpdj5cXHJcXG4gICAgPGgyPkNsaWVudHM8L2gyPlxcclxcbiAgICA8dWwgYm4tZWFjaD1cXFwiY2xpZW50IG9mIGNsaWVudHNcXFwiPlxcclxcbiAgICAgICAgPGxpIGJuLXRleHQ9XFxcImNsaWVudFxcXCI+PC9saT5cXHJcXG4gICAgPC91bD5cXHJcXG4gICAgPGZvcm0gYm4tZXZlbnQ9XFxcInN1Ym1pdDogYWRkQ2xpZW50LCBpbnB1dC5maWVsZDogb25GaWVsZENoYW5nZVxcXCI+XFxyXFxuICAgICAgICA8aW5wdXQgY2xhc3M9XFxcImZpZWxkXFxcIiB0eXBlPVxcXCJ0ZXh0XFxcIiBuYW1lPVxcXCJuYW1lXFxcIiBwbGFjZWhvbGRlcj1cXFwiTmFtZVxcXCIgcmVxdWlyZWQ+XFxyXFxuICAgICAgICA8aW5wdXQgY2xhc3M9XFxcImZpZWxkXFxcIiB0eXBlPVxcXCJudW1iZXJcXFwiIG5hbWU9XFxcImFnZVxcXCIgcGxhY2Vob2xkZXI9XFxcIkFnZVxcXCIgbWluPVxcXCIxXFxcIiByZXF1aXJlZD5cXHJcXG4gICAgICAgIDxidXR0b24gdHlwZT1cXFwic3VibWl0XFxcIiBibi1wcm9wPVxcXCJkaXNhYmxlZDogIWNhblN1Ym1pdFxcXCI+TmV3IENsaWVudDwvYnV0dG9uPlxcclxcbiAgICA8L2Zvcm0+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuXFxyXFxuPGRpdiBzdHlsZT1cXFwid2lkdGg6MzAwcHg7IGhlaWdodDogMzAwcHg7IGJvcmRlcjogMXB4IHNvbGlkIGJsYWNrO1xcXCI+XFxyXFxuICAgIDxkaXYgYm4tY29udHJvbD1cXFwiQ2lyY3VsYXJNZW51Q29udHJvbFxcXCIgYm4tb3B0aW9ucz1cXFwib3B0aW9uc1xcXCIgZGF0YS1yYWRpdXM9XFxcIjEyMFxcXCIgZGF0YS1pY29uUG9zPVxcXCI4MFxcXCIgZGF0YS1pbm5lclJhZGl1cz1cXFwiNDBcXFwiIGJuLWV2ZW50PVxcXCJtZW51U2VsZWN0ZWQ6IG9uTWVudVNlbGVjdGVkXFxcIi8+XFxyXFxuPC9kaXY+XFxyXFxuPC9kaXY+XCIsXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICBmb3JtRGF0YSwgb3B0aW9ucywgXHJcbiAgICAgICAgICAgIGNsaWVudHMsXHJcbiAgICAgICAgICAgICBjYW5TdWJtaXQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgbmFtZTogJ0RlbG9tZXonLFxyXG4gICAgICAgICAgICAgc3VybmFtZTogJ01hcmMnLFxyXG4gICAgICAgICAgICAgZnVsbE5hbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnZnVsbE5hbWUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubmFtZSArICcgJyArIHRoaXMuc3VybmFtZVxyXG4gICAgICAgICAgICAgfVxyXG4gICAgICAgICB9LFxyXG5cclxuICAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgIG9uU3VibWl0OiBmdW5jdGlvbihldikge1xyXG4gICAgICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IEpTT04uc3RyaW5naWZ5KCQodGhpcykuZ2V0Rm9ybURhdGEoKSwgbnVsbCwgNClcclxuICAgICAgICAgICAgICAgIC8vJCgnYm9keScpLnByb2Nlc3NUZW1wbGF0ZSh7cmVzdWx0OiByZXN1bHR9KVxyXG4gICAgICAgICAgICAgICAgY3RybC5zZXREYXRhKHtyZXN1bHQ6IHJlc3VsdH0pXHJcbiAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbk1lbnVTZWxlY3RlZDogZnVuY3Rpb24oaW5mbykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ21lbnVTZWxlY3RlZCcsIGluZm8pXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFkZENsaWVudDogZnVuY3Rpb24oZXYpIHtcclxuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gJCh0aGlzKS5nZXRGb3JtRGF0YSgpXHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZENsaWVudCcsIGRhdGEpXHJcbiAgICAgICAgICAgICAgICBjdHJsLm1vZGVsLmNsaWVudHMucHVzaChkYXRhLm5hbWUpXHJcbiAgICAgICAgICAgICAgICBjdHJsLnVwZGF0ZSgnY2xpZW50cycpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uRmllbGRDaGFuZ2U6IGZ1bmN0aW9uKGV2KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25GaWVsZENoYW5nZScpXHJcbiAgICAgICAgICAgICAgICB2YXIgaXNPayA9IHRoaXMucmVwb3J0VmFsaWRpdHkoKVxyXG4gICAgICAgICAgICAgICAgY3RybC5zZXREYXRhKHtjYW5TdWJtaXQ6IGlzT2t9KVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkdlbmRlckNoYW5nZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25HZW5kZXJDaGFuZ2UnLCAkKHRoaXMpLmdldFZhbHVlKCkpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uRnJ1aXRzQ2hhbmdlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvbkZydWl0c0NoYW5nZScsICQodGhpcykuZ2V0VmFsdWUoKSlcclxuICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgfSAgICAgIFxyXG4gICAgfSkgXHJcblxyXG4gICAgd2luZG93LmFwcCA9IGN0cmxcclxufSkiXX0=

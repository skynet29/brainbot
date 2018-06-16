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
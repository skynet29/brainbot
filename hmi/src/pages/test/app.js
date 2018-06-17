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
        template: {gulp_inject: './app.html'},
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
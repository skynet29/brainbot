QUnit.module('core')
QUnit.test('processTemplate bn-text', function(assert) {
	var elt = $('<p bn-text="a.name"></p>').processTemplate({a: {name: 'marc'}})

	assert.equal(elt.length, 1, 'length must be 1')
	assert.equal(elt.get(0).tagName, 'P', 'tagName must P')
	assert.equal(elt.text(), 'marc', 'text must be marc')

})

QUnit.test('processTemplate bn-prop', function(assert) {
	var elt = $('<input type="checkbox" bn-prop="checked: checked">').processTemplate({checked: false})

	assert.equal(elt.length, 1, 'length must be 1')
	assert.equal(elt.get(0).tagName, 'INPUT', 'tagName must INPUT')
	assert.equal(elt.prop('checked'), false, 'checked must be false')

})

QUnit.test('processTemplate bn-attr', function(assert) {
	var elt = $('<p bn-attr="title: title">').processTemplate({title: 'Hello'})

	assert.equal(elt.length, 1, 'length must be 1')
	assert.equal(elt.get(0).tagName, 'P', 'tagName must P')
	assert.equal(elt.attr('title'), 'Hello', 'attribut title must be Hello')

})


QUnit.test('processTemplate bn-list, bn-val', function(assert) {
	var template = `
		<select bn-list="fruits" bn-val="favorite"></select>
	`
	var fruits = ['orange', 'apple', 'bananas']
	var elt = $(template).processTemplate({fruits: fruits, favorite: 'apple'})

	assert.equal(elt.length, 1, 'length must be 1')
	assert.equal(elt.get(0).tagName, 'SELECT', 'tagName must SELECT')
	assert.equal(elt.children().length, fruits.length, `child length must be ${fruits.length}`)
	for(let i = 0; i < elt.children().length; i++) {
		assert.equal(elt.children().eq(i).get(0).tagName, 'OPTION', `child[${i}] tagName must be OPTION`)
	}
	
	for(let i = 0; i < elt.children().length; i++) {
		assert.equal(elt.children().eq(i).text(), fruits[i], `child[${i}] text must be ${fruits[i]}`)
	}

	assert.equal(elt.val(), 'apple', 'value must be apple')

})

QUnit.test('processTemplate bn-class', function(assert) {
	var template = `
		<div bn-class="class1: hasClass1, class2: !hasClass2">/div>
	`
	var elt = $(template).processTemplate({hasClass1: true, hasClass2: false})

	assert.equal(elt.length, 1, 'length must be 1')
	assert.equal(elt.get(0).tagName, 'DIV', 'tagName must DIV')


	assert.equal(elt.hasClass('class1'), true, 'must has class class1')
	assert.equal(elt.hasClass('class2'), true, 'must has class class2')

	elt.processTemplate({hasClass2 :false})
	assert.equal(elt.hasClass('class1'), true, 'must has class class1')
	assert.equal(elt.hasClass('class2'), true, 'must not has class class2')
})

QUnit.test('processTemplate bn-if', function(assert) {
	var template = `
		<div><p bn-if="hasParagraph">Hello World</p>/div>
	`
	var elt = $(template).processTemplate({hasParagraph: true})

	assert.equal(elt.length, 1, 'length must be 1')
	assert.equal(elt.get(0).tagName, 'DIV', 'tagName must DIV')
	assert.equal(elt.children().length, 1, 'child length must be 1')
	assert.equal(elt.children().get(0).tagName, 'P', 'child tagName must be P')
})

QUnit.test('processTemplate bn-if', function(assert) {
	var template = `
		<div><p bn-if="hasParagraph">Hello World</p>/div>
	`
	var elt = $(template).processTemplate({hasParagraph: false})

	assert.equal(elt.length, 1, 'length must be 1')
	assert.equal(elt.get(0).tagName, 'DIV', 'tagName must DIV')
	assert.equal(elt.children().length, 0, 'child length must be 0')
})

QUnit.test('processTemplate bn-each list', function(assert) {
	var template = `
		<ul bn-each="f of fruits">
			<li bn-text="f"></li>
		</ul>
	`
	var fruits = ['apple', 'orange', 'bananas']
	var elt = $(template).processTemplate({fruits: fruits})

	assert.equal(elt.length, 1, 'length must be 1')
	assert.equal(elt.get(0).tagName, 'UL', 'tagName must UL')
	var child = elt.children()
	assert.equal(child.length, 3, 'child length must be 3')
	for(var i = 0; i < 3; i++) {
		assert.equal(child.eq(i).get(0).tagName, 'LI', `child[${i}] tagName must LI`)
		assert.equal(child.eq(i).text(), fruits[i], `child[${i}] text must ${fruits[i]}`)
	}
	
})

QUnit.test('processTemplate bn-each table', function(assert) {
	var template = `
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Age</th>
				</tr>
			</thead>
			<tbody bn-each="c of clients">
				<tr>
					<td bn-text="c.name"></td>
					<td bn-text="c.age"></td>
				</tr>			
			</tbody>
		</table>
	`
	var clients = [
		{name: 'Marc', age: 45},
		{name: 'Quentin', age: 16},
		{name: 'Brigitte', age: 28}
	]
	var elt = $(template).processTemplate({clients: clients})
	var tbody = elt.find('tbody')

	assert.equal(tbody.length, 1, 'length must be 1')
	var child = tbody.children()
	assert.equal(child.length, clients.length, `child length must be ${clients.length}`)
	for(var i = 0; i < clients.length; i++) {
		var client = clients[i]
		var tr = child.eq(i)
		var tds = tr.children()
		assert.equal(tr.get(0).tagName, 'TR', `child[${i}] tagName must TR`)
		assert.equal(tds.length, 2, 'TR child length must be 2')

		var fields = Object.keys(client)
		for(var k = 0; k < 2; k++) {
			var td = tds.eq(k)
			var name = fields[k]
			var value = client[name]
			assert.equal(td.get(0).tagName, 'TD', `TR[${k}] tagName must TD`)
			assert.equal(td.text(), value, `TR[${i}] text must ${value}`)
		}		
	}
	
})


QUnit.test('setFormData', function(assert) {

	var template = `
	        <form bn-form="formData">
            <p>Name: <input type="text" name="name"></p>
            <p>Email: <input type="text" name="email"></p>
            <p>Gender:
                <ul bn-control="RadioGroupControl" name="gender">
                    <li><input type="radio" value="male">Male </li>
                    <li><input type="radio" value="female">Female </li>
                </ul>
            </p>
            <p>Fruits:
                <ul bn-control="CheckGroupControl" name="fruits">
                    <li><input type="checkbox" value="orange">Orange </li>
                    <li><input type="checkbox" value="bananas">Bananas </li>
                    <li><input type="checkbox" value="apple">Apple </li>
                </ul>
            </p>
            <p><button type="submit">Submit</button></p>
        </form>
	`	

	var $form = $(template)

	var formData = {
		name: 'Marc',
		email: 'marc.delomez@thalesgroup.com',
		fruits: ['apple', 'orange'],
		gender: 'female'
	}

	$form.processUI({formData: formData})

	//$form.setFormData()

	assert.equal($form.find('input[name="name"]').val(), 'Marc', 'textfield name must have value Marc')
	assert.equal($form.find('input[name="email"]').val(), 'marc.delomez@thalesgroup.com', 'textfield email must have value marc.delomez@thalesgroup.com')

	var $fruits = $form.find('ul[name="fruits"]')
	assert.equal($fruits.find('input[value=orange]').prop('checked'), true, 'orange checkbox must be checked')
	assert.equal($fruits.find('input[value=bananas]').prop('checked'), false, 'bananas checkbox must be unchecked')
	assert.equal($fruits.find('input[value=apple]').prop('checked'), true, 'apple checkbox must be checked')

	var $gender = $form.find('ul[name="gender"]')
	assert.equal($gender.find('input[value=male]').prop('checked'), false, 'male radiobutton must be unchecked')
	assert.equal($gender.find('input[value=female]').prop('checked'), true, 'female radiobutton must be checked')
	
})

QUnit.test('getFormData', function(assert) {

	var template = `
	        <form>
            <p>Name: <input type="text" name="name"></p>
            <p>Email: <input type="text" name="email"></p>
            <p>Gender:
                <ul bn-control="RadioGroupControl" name="gender">
                    <li><input type="radio" value="male">Male </li>
                    <li><input type="radio" value="female">Female </li>
                </ul>
            </p>
            <p>Fruits:
                <ul bn-control="CheckGroupControl" name="fruits">
                    <li><input type="checkbox" value="orange">Orange </li>
                    <li><input type="checkbox" value="bananas">Bananas </li>
                    <li><input type="checkbox" value="apple">Apple </li>
                </ul>
            </p>
            <p><button type="submit">Submit</button></p>
        </form>
	`	

	var $form = $(template)
	$form.processUI()

	$form.setFormData({
		name: 'Marc',
		email: 'marc.delomez@thalesgroup.com',
		fruits: ['apple', 'orange'],
		gender: 'female'
	})



	var data = $form.getFormData()
	assert.equal(data.name, 'Marc', 'field name must be Marc')
	assert.equal(data.email, 'marc.delomez@thalesgroup.com', 'field email must be marc.delomez@thalesgroup.com')
	assert.ok(data.fruits.indexOf('orange') != -1, 'field fruits must contains orange value')
	assert.ok(data.fruits.indexOf('apple') != -1, 'field fruits must contains apple value')
	assert.notOk(data.fruits.indexOf('bananas') != -1, 'field fruits must not contains bananas value')
	assert.equal(data.gender, 'female', 'field gender must be female')

	var $fruits = $form.find('ul[name="fruits"]')
	var $gender = $form.find('ul[name="gender"]')
	$gender.find('input[value=male]').click()
	$fruits.find('input[value=orange]').click()
	$fruits.find('input[value=bananas]').click()
	$form.find('input[name="name"]').val('Quentin')

	data = $form.getFormData()
	assert.equal(data.name, 'Quentin', 'field name must be Quentin')
	assert.equal(data.email, 'marc.delomez@thalesgroup.com', 'field email must be marc.delomez@thalesgroup.com')
	assert.notOk(data.fruits.indexOf('orange') != -1, 'field fruits must not contains orange value')
	assert.ok(data.fruits.indexOf('apple') != -1, 'field fruits must contains apple value')
	assert.ok(data.fruits.indexOf('bananas') != -1, 'field fruits must contains bananas value')
	assert.equal(data.gender, 'male', 'field gender must be female')	
})

QUnit.test('dependency injection', function(assert) {
	var service1 = {}
	var service2 = {}
	assert.expect(2)

	$$.registerService('Service1', ['Service2'], function(config, srv2) {
		assert.equal(srv2, service2, 'Service1 must have Service2 as dependency')
		return service1
	})

	$$.registerService('Service2', [], function(config) {
		return service2
	})	

	$$.registerControl('MyControl', ['Service1'], function(elt, srv1) {
		assert.equal(srv1, service1, 'MyControl must have Service1 as dependency')
	})

	
	var $elt = $(`<div bn-control="MyControl"></div>`)
	$elt.processUI()

})

QUnit.test('control option', function(assert) {
	var ctrlOptions = {}
	assert.expect(1)


	$$.registerControl('MyControl', [], function(elt) {
		var options = elt.getOptions()
		assert.deepEqual(options, ctrlOptions, 'MyControl instance must have options')
	})

	
	var $elt = $(`<div bn-control="MyControl" bn-data="options: options"></div>`)
	$elt.processUI({options: ctrlOptions})

})

QUnit.test('control instanciation', function(assert) {
	

	$$.registerControl('MyControl', [], function(elt) {
		var options = elt.getOptions()
		var template = `
			<p>${options.name}</p>
			<p>${options.email}</p>
		`
		elt.append(template)
	})

	
	var $elt = $(`<div bn-control="MyControl" bn-options="options"></div>`)
	$elt.processUI({
		options: {name: 'Marc', email: 'toto@titi.fr'}
	})
	var $child = $elt.children()
	assert.equal($child.length, 2, 'child length must be 2')
	assert.equal($child.eq(0).get(0).tagName, 'P', 'child1 tagName must be P')
	assert.equal($child.eq(0).text(), 'Marc', 'child1 text must be Marc')
	assert.equal($child.eq(1).get(0).tagName, 'P', 'child2 tagName must be P')
	assert.equal($child.eq(1).text(), 'toto@titi.fr', 'child2 text must be toto@titi.fr')
})


QUnit.test('control disposal', function(assert) {
	
	assert.expect(3)

	$$.registerControl('MyControl', [], function(elt, options) {
		return {
			dispose: function() {
				assert.ok(true, 'dispose interface is called')
			}
		}
	})

	
	var $elt = $(`
		<div>
		<div bn-control="MyControl"></div>
		<div bn-control="MyControl"></div>
		</div>
		`)
	$elt.processUI()
	$elt.dispose().empty()
	assert.equal($elt.children().length, 0, 'child length must be 0')

})

QUnit.test('service configuration', function(assert) {
	var service1 = {}
	var srvConfig = {id: 'toto'}

	assert.expect(1)

	$$.registerService('Service1', [], function(config) {
		assert.equal(config, srvConfig, 'Service1 must have configuration')
		return service1
	})

	

	$$.registerControl('MyControl', ['Service1'], function(elt, options, srv1) {

	})

	$$.configureService('Service1', srvConfig)
	
	var $elt = $(`<div bn-control="MyControl"></div>`)
	$elt.processUI()

})

QUnit.test('checkType number', function(assert) {
	var a = 10

	assert.ok($$.checkType(a, 'number'), 'a must be a number')
	assert.notOk($$.checkType(a, 'string'), 'a must be not a string')
	assert.notOk($$.checkType(a, 'boolean'), 'a must be not a boolean')

})

QUnit.test('checkType string', function(assert) {
	var a = 'toto'

	assert.notOk($$.checkType(a, 'number'), 'a must be not a number')
	assert.ok($$.checkType(a, 'string'), 'a must be a string')
	assert.notOk($$.checkType(a, 'boolean'), 'a must be not a boolean')

})

QUnit.test('checkType boolean', function(assert) {
	var a = true

	assert.notOk($$.checkType(a, 'number'), 'a must be not a number')
	assert.notOk($$.checkType(a, 'string'), 'a must be not a string')
	assert.ok($$.checkType(a, 'boolean'), 'a must be a boolean')

})

QUnit.test('checkType function', function(assert) {
	var a = function() {}

	assert.ok($$.checkType(a, 'function'), 'a must be not a function')
	assert.notOk($$.checkType(a, 'string'), 'a must be not a string')
	assert.notOk($$.checkType(a, 'boolean'), 'a must be not a boolean')
	assert.notOk($$.checkType(a, 'number'), 'a must be not a number')

})

QUnit.test('checkType object', function(assert) {
	var o = {a: 1, b: 'toto', c: true}

	assert.ok($$.checkType(o, {a: 'number', b: 'string', c: 'boolean'}), 'a must be a number, b a string and c a boolean')
	assert.notOk($$.checkType(o, 'number'),'o is not a number')
	assert.notOk($$.checkType(o, 'string'),'o is not a string')
	assert.notOk($$.checkType(o, 'boolean'),'o is not a boolean')
	assert.notOk($$.checkType(o, {a: 'number', b: 'number', c: 'boolean'}), 'a must be a number, b not a number and c a boolean')
	assert.notOk($$.checkType(o, {a: 'number', b: 'string', c: 'string'}), 'a must be a number, b a string and c not a string')

})

QUnit.test('checkType array number', function(assert) {
	var o = [10, 20]

	assert.ok($$.checkType(o, []), 'o must be an array')
	assert.ok($$.checkType(o, ['number']), 'o must be an array of number')
	assert.notOk($$.checkType(o, ['string']), 'o must not be an array of string')
	assert.notOk($$.checkType(o, ['boolean']), 'o must not be an array of boolean')
	assert.notOk($$.checkType(o, [{}]), 'o must not be an array of object')

})

QUnit.test('checkType array string', function(assert) {
	var o = ['toto', 'tata']

	assert.ok($$.checkType(o, []), 'o must be an array')
	assert.notOk($$.checkType(o, ['number']), 'o must be not an array of number')
	assert.ok($$.checkType(o, ['string']), 'o must be an array of string')
	assert.notOk($$.checkType(o, ['boolean']), 'o must not be an array of boolean')
	assert.notOk($$.checkType(o, [{}]), 'o must not be an array of object')

})

QUnit.test('checkType array mix', function(assert) {
	var o = ['toto', 'tata', 10, {a: 'marc'}]

	assert.ok($$.checkType(o, []), 'o must be an array')
	assert.ok($$.checkType(o, ['number', 'string', {a: 'string'}]), 'o must be an array of number or string or object with field a of type string')


})


QUnit.test('processEvents', function(assert) {

	assert.expect(1)

	var template = `
		<button bn-event="click:onClick"></button>
	`

	var elt = $(template).processEvents({
		onClick: function() {
			assert.equal(this, elt.get(0), 'onClick function called when button clicked')
		}
	})

	elt.click()

})
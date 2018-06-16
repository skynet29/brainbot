var agent = require('../../../lib/agent')

agent.registerService('sum', function(req, resp) {
	console.log('req', req)
	if (typeof req.a != 'number' || typeof req.b != 'number') {
		resp.statusCode = 200
	}
	else {
		resp.data = req.a + req.b
	}
})

agent.start()
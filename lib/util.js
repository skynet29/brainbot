function getParams() {
	var ret = {}

	for(var i = 2; i < process.argv.length;  i++) {
		var arg = process.argv[i]
		var tokens = arg.split('=')
		//console.log('tokens', tokens)
		if (tokens.length == 2) {
			ret[tokens[0]] = tokens[1]
		}

	}	
	return ret
}

module.exports = {
	getParams: getParams
}
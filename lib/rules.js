var Rules = (function () {
	function Rules() {
	}

	Rules.prototype.init = function (THERAHint) {
		var fs = require('fs');
		var files = fs.readdirSync(__dirname + "/rules");
		files.forEach(function (file) {
			if (file != "csslint") {
				require('./rules/' + file).init(THERAHint);
			}
		});
	};
	return Rules;
})();


if (typeof exports === 'object' && exports){
	exports.Rules = new Rules();
}


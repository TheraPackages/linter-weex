var THERAHint = (function (undefined) {

  var THERAHint = {};

  THERAHint.version = '@VERSION';
  THERAHint.release = '@RELEASE';

  THERAHint.rules = {};

  //默认配置
  THERAHint.defaultRuleset = {
    'tagname-lowercase': true,
    'attr-lowercase': true,
    'attr-value-double-quotes': true,
    // 'doctype-first': true,
    'tag-pair': true,
    'spec-char-escape': true,
    'id-unique': true,
    'src-not-empty': true,
    'attr-no-duplication': true,
    'title-require': true,
    'tag-self-close': true,
    'jshint': {
      'esversion': 6
    },
    "csslint": {
      "display-property-grouping": true,
      "known-properties": true,
      "errors": 2
    }
  };

  THERAHint.addRule = function(rule){
    THERAHint.rules[rule.id] = rule;
  };

	THERAHint.verify = function(html, ruleset){

    if(ruleset === undefined || Object.keys(ruleset).length === 0){
      ruleset = THERAHint.defaultRuleset;
    }

    // parse inline ruleset
    html = html.replace(/^\s*<!--\s*htmlhint\s+([^\r\n]+?)\s*-->/i, function(all, strRuleset){
      if(ruleset === undefined){
        ruleset = {};
      }
      strRuleset.replace(/(?:^|,)\s*([^:,]+)\s*(?:\:\s*([^,\s]+))?/g, function(all, key, value){
        if(value === 'false'){
          value = false;
        }
        else if(value === 'true'){
          value = true;
        }
        ruleset[key] = value === undefined ? true : value;
      });
      return '';
    });

    const { THERAParser } = require('./theraparser.js');
    var parser = new THERAParser();
    var reporter = new THERAHint.Reporter(html, ruleset);

    var rules = THERAHint.rules;
    for (var id in ruleset) {
      var rule = rules[id];
      if (rule !== undefined && ruleset[id] !== false) {
        rule.init(parser, reporter, ruleset[id]);
      }
    }

    parser.parse(html);

    return reporter.messages;
  };

  // format messages
  THERAHint.format = function(arrMessages, options) {
    options = options || {};
    var arrLogs = [];
    var colors = {
      white: '',
      grey: '',
      red: '',
      reset: ''
    };
    if(options.colors){
      colors.white = '\033[37m';
      colors.grey = '\033[90m';
      colors.red = '\033[31m';
      colors.reset = '\033[39m';
    }
    var indent = options.indent || 0;
    arrMessages.forEach(function(hint){
      var leftWindow = 40;
      var rightWindow = leftWindow + 20;
      var evidence = hint.evidence;
      var line = hint.line;
      var col = hint.col;
      var evidenceCount = evidence.length;
      var leftCol = col > leftWindow + 1 ? col - leftWindow : 1;
      var rightCol = evidence.length > col + rightWindow ? col + rightWindow : evidenceCount;
      if(col < leftWindow + 1){
        rightCol += leftWindow - col + 1;
      }
      evidence = evidence.replace(/\t/g, ' ').substring(leftCol - 1, rightCol);
      // add ...
      if(leftCol > 1){
        evidence = '...' + evidence;
        leftCol -= 3;
      }
      if(rightCol < evidenceCount){
        evidence += '...';
      }
      // show evidence
      arrLogs.push(colors.white+repeatStr(indent)+'L'+line+' |' + colors.grey + evidence + colors.reset);
      // show pointer & message
      var pointCol = col - leftCol;
      // add double byte character
      var match = evidence.substring(0, pointCol).match(/[^\u0000-\u00ff]/g);
      if(match !== null){
        pointCol += match.length;
      }
      arrLogs.push(colors.white+repeatStr(indent)+repeatStr(String(line).length + 3 + pointCol)+'^ ' + colors.red + hint.message + ' (' + hint.rule.id+')' + colors.reset);
    });
    return arrLogs;
  };

  // repeat string
  function repeatStr(n, str){
    return new Array(n + 1).join(str || ' ');
  }

  return THERAHint;

})();

(function(THERAHint, undefined){

  var Reporter = function(){
    var self = this;
    self._init.apply(self,arguments);
  };

  Reporter.prototype = {
    _init: function(html, ruleset){
      var self = this;
      self.html = html;
      self.lines = html.split(/\r?\n/);
      var match = html.match(/\r?\n/);
      self.brLen = match !== null ? match[0].length : 0;
      self.ruleset = ruleset;
      self.messages = [];
    },
    // error message
    error: function(message, line, col, rule, raw){
      this.report('error', message, line, col, rule, raw);
    },
    // warning message
    warn: function(message, line, col, rule, raw){
      this.report('warning', message, line, col, rule, raw);
    },
    // info message
    info: function(message, line, col, rule, raw){
      this.report('info', message, line, col, rule, raw);
    },
    // save report
    report: function(type, message, line, col, rule, raw){
      var self = this;
      var lines = self.lines;
      var brLen = self.brLen;
      var evidence, evidenceLen;
      for (var i = line - 1, lineCount = lines.length; i < lineCount;i++) {
        evidence = lines[i];
        evidenceLen = evidence.length;
        if (col > evidenceLen && line < lineCount) {
          // line ++;
          // col -= evidenceLen;
          // if (col !== 1) {
          // 	col -= brLen;
          // }
        } else {
          break;
        }
      }
      self.messages.push({
        type: type,
        message: message,
        raw: raw,
        evidence: evidence,
        line: line,
        col: col,
        rule: {
          id: rule.id,
          description: rule.description,
          link: 'https-url' + rule.id
        }
      });
    }
  };

  THERAHint.Reporter = Reporter;
})(THERAHint);

const { Rules } = require('./rules.js');
Rules.init(THERAHint);

if (typeof exports === 'object' && exports){
  exports.THERAHint = THERAHint;
}

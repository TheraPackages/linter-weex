exports.init = function (THERAHint) {
	THERAHint.addRule({
		id: 'tag-pair',
		description: 'Tag must be paired.',
		init: function(parser, reporter){
			var self = this;
			var stack=[],
				mapEmptyTags = parser.makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed,track,command,source,keygen,wbr");//HTML 4.01 + HTML 5
			parser.addListener('tagstart', function(event){
				var tagName = event.tagName.toLowerCase();
				if (mapEmptyTags[tagName] === undefined && !event.close) {
					stack.push({
						tagName: tagName,
						line: event.line,
						raw: event.raw
					});
				}
			});
			parser.addListener('tagend', function(event){
        var tagName = event.tagName.toLowerCase();
        if (mapEmptyTags[tagName]) {
          reporter.warn(`${tagName} is a self-close tag, no need end tag: [` + event.raw.replace(/(\r\n)|(\n)|(\r)/g, ' ') + ' ]', event.line, event.col, self, event.raw.replace(/(\r\n)|(\n)|(\r)/g, ' '));
          return;
				}

				//向上寻找匹配的开始标签
				for(var pos = stack.length-1;pos >= 0; pos--){
					if(stack[pos].tagName === tagName){
						break;
					}
				}
				if (pos >= 0) {
					var arrTags = [];
					for(var i=stack.length-1;i>pos;i--){
						arrTags.push('</'+stack[i].tagName+'>');
					}
					if(arrTags.length > 0){
						var lastEvent = stack[stack.length-1];
						reporter.error('Tag must be paired, missing: [ '+ arrTags.join('') + ' ], start tag match failed [ ' + lastEvent.raw.replace(/(\r\n)|(\n)|(\r)/g, ' ') + ' ] on line ' + lastEvent.line + '.', lastEvent.line, lastEvent.raw.col, self, event.raw.replace(/(\r\n)|(\n)|(\r)/g, ' '));
					}
					stack.length=pos;
				} else {
					reporter.error('Tag must be paired, no start tag: [ ' + event.raw.replace(/(\r\n)|(\n)|(\r)/g, ' ') + ' ]', event.line, event.col, self, event.raw.replace(/(\r\n)|(\n)|(\r)/g, ' '));
				}
			});
			parser.addListener('end', function(event){
				var arrTags = [];
				for(var i=stack.length-1;i>=0;i--){
					arrTags.push('</'+stack[i].tagName+'>');
				}
				if(arrTags.length > 0){
					var lastEvent = stack[stack.length-1];
					reporter.error('Tag must be paired, missing: [ '+ arrTags.join('') + ' ], open tag match failed [ ' + lastEvent.raw.replace(/(\r\n)|(\n)|(\r)/g, ' ') + ' ] on line ' + lastEvent.line + '.', lastEvent.line, lastEvent.raw.col, self, '');
				}
			});
		}
	});
};

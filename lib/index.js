'use babel';

import { CompositeDisposable } from 'atom';

const grammarScopes = [];

export function activate() {
  require('atom-package-deps').install('linter-weex');

  const subscriptions = new CompositeDisposable();
  var handle = atom.config.observe('linter-weex.enabledScopes', scopes => {
    // Remove any old scopes
    grammarScopes.splice(0, grammarScopes.length);
    // Add the current scopes
    Array.prototype.push.apply(grammarScopes, scopes);
	});

	subscriptions.add(handle);
}

function getConfig(filePath) {
	const fs = require('fs');
	const path = require('path');
	const readFile = require('tiny-promisify')(fs.readFile);
	const { findAsync } = require('atom-linter');
	// 下面是在当前文件中的统计目录下找.htmlhintrc，如果不存在就采用默认配置
	return findAsync(path.dirname(filePath), '.weexhintrc')
		.then(configPath => {
			if (configPath) {
				return readFile(configPath, 'utf8');
			}
			return null;
		}).then(conf => {
			if (conf) { // 如果上面文件不存在 这里会为null 也就不会进来
				// 去除json中的注释
				return JSON.parse(require('strip-json-comments')(conf));
			}
			return null;
		});
}

export function provideLinter() {
	return {
		name: 'weexhint',
		grammarScopes,
		scope: 'file',
		lintOnFly: true,
		lint: editor => {
			const { THERAHint } = require('./core.js');
			const text = editor.getText();
			const filePath = editor.getPath();

			if (!text) {
				return Promise.resolve([]);
			}

			return getConfig(filePath)
				.then(
					function (ruleset) {
						var msg = THERAHint.verify(text, ruleset || undefined);
						return msg;
					})
				.then(
					function (messages) {
						const { rangeFromLineNumber } = require('./helpers');
						return messages.map(
							function (message) {
								var result = {
									range: rangeFromLineNumber(editor, message.line - 1, message.col - 1),
									type: message.type,
									text: message.message,
									filePath
								};
								// result.type = "error";
								// console.log(result);
								return result;
							});
					});
		}
	};
}

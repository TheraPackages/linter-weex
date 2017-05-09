'use strict';
'use babel';

var _atom = require('atom');
function validateEditor(editor) {
  var isEditor = void 0;
  if (typeof atom.workspace.isTextEditor === 'function') {
    // Added in Atom v1.4.0
    isEditor = atom.workspace.isTextEditor(editor);
  } else {
    isEditor = typeof editor.getText === 'function';
  }
  if (!isEditor) {
    throw new Error('Invalid TextEditor provided');
  }
}

function rangeFromLineNumber(textEditor, line, column) {
  validateEditor(textEditor);
  var lineNumber = line;

  if (typeof lineNumber !== 'number' || !Number.isFinite(lineNumber) || lineNumber < 0) {
    lineNumber = 0;
  }

  var buffer = textEditor.getBuffer();
  var lineMax = buffer.getLineCount() - 1;

  if (lineNumber > lineMax) {
    throw new Error('Line number (' + lineNumber + ') greater than maximum line (' + lineMax + ')');
  }

  var columnGiven = typeof column === 'number' && Number.isFinite(column) && column > -1;
  var lineText = buffer.lineForRow(lineNumber);

  if (columnGiven) {
    var n = lineNumber;
    var col = column;
    var txt = lineText;
    var prevLength = txt.length;

    while (col >= txt.length && n < lineMax) {
      col -= (txt.length);
      txt = buffer.lineForRow(++n);
    }

    lineNumber = n;
    column = col;
    lineText = txt;
  }

  var colEnd = lineText.length;
  var colStart = columnGiven ? column : 0;
  if (columnGiven) {
    var match = new RegExp('^[\t ]*$|[^\\s]+').exec(lineText.substr(column));//Helpers.getWordRegexp(textEditor, [lineNumber, colStart]).exec(lineText.substr(column));
    if (match) {
      colEnd = colStart + match.index + match[0].length;
    }
  } else {
    var indentation = lineText.match(/^\s+/);
    if (indentation) {
      colStart = indentation[0].length;
    }
  }
  if (colStart > lineText.length) {
    throw new Error('Column start (' + colStart + ') greater than line length (' + lineText.length + ')');
  }

  return _atom.Range.fromObject([[lineNumber, colStart], [lineNumber, colEnd]]);
}

exports.rangeFromLineNumber = rangeFromLineNumber;

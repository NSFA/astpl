/*
 *  模板文件分词器
 *
 *  解析出来的结果主要分为三个部分：标签、文本和表达式，例如{type:'tag',attrs:{},value:'div',isClose:false}，解析出来的数据按顺序存储
 */
module.exports = (function() {
	var state = 0; // 表明当前是在解析标签，注释，语句还是纯文本
	var isQuot = false; // 判断是否出现了引号
	var buffer = [];
	var result = [];
	var STATE = {
		BEGIN: 0,
		TAG: 1,
		TEXT: 2,
		COMMENT: 3,
		EXPR: 4
	};
	/* 判断是否是英文字母 */
	var isChar = function(ch) {
		var code = ch.charCodeAt(0);
		return !!((code >= 65 && code <= 90) || (code >= 97 && code <= 122));
	}
	/* 解析标签的属性 */
	/* 如'div class="aa" required'  -->  {tagname:'div', attrs:{class:'aa', required:null}} */
	var chackTag = function(str) {
		var c; 
		var i = 0;
		var tagname = '';
		var attrname = '';
		var attrval = '';
		var quot;
		var isStr = false;
		var aftertagname = false; // 判断是否刚解析完标签名
		var hasEqual = false; // 判断是否出现等号
		var hasBlank = false; // 判断是否已出现过空格
		var attrs = {};
		var buffer = [];
		while(!!(c = str.charAt(i++))) {
			switch(c) {
				case ' ':
					if(isStr) {
						// 当是属性值中字符串的空格
						buffer.push(c);
						break;
					}

					// 出现连续空格
					if(hasBlank) break;

					if(!tagname) {
						// 标签名后的空格
						tagname = buffer.join('');
						buffer.length = 0;
						aftertagname = true; // 标签名是否刚结束
					} else if(attrname && attrval) {
						// 当存在属性名和字符串属性值时
						attrs[attrname] = getExpr(attrval);
						aftertagname = false; // 标签名是否刚结束
						attrname = '';
						attrval = '';
						hasEqual = false; // 结束属性赋值
					} else if(attrname && buffer.length) {
						// 当存在属性名和非字符串属性值时
						attrs[attrname] = getExpr(buffer.join(''));
						aftertagname = false; // 标签名是否刚结束
						attrname = '';
						buffer.length = 0;
						hasEqual = false; // 结束属性赋值
					}
					hasBlank = true; // 连续空格置为是
					break;
				case '=':
					if(isStr) {
						// 当是属性值中字符串的=号
						buffer.push(c);
						break;
					} 

					hasBlank = false; // 连续空格置为否
					hasEqual = true; // 出现属性赋值=号
					// 当是属性中的=号
					attrname = buffer.join('');
					buffer.length = 0;
					break;
				case '"':
				case '\'':
					if(str.charAt(i-2) === '\\' || (quot && c !== quot)) {
						// 转义的情况，不做变化
						buffer.push(c);
						break;
					} 

					hasBlank = false; // 连续空格置为否
					if(isStr) {
						// 属性值结束
						isStr = false;
						quot = undefined;
						attrval = buffer.join('');
						buffer.length = 0;
					} else {
						// 属性值开始
						isStr = true;
						quot = c;
					}
					break;
				default:
					if(hasBlank && isChar(c) && buffer.length && !hasEqual && !aftertagname) {
						// 不包含属性值的属性
						attrs[buffer.join('')] = null;
						aftertagname = false; // 标签名是否刚结束
						buffer.length = 0;
					}

					hasBlank = false; // 连续空格置为否
					buffer.push(c);
					break;
			}
		}
		if(!tagname) tagname = buffer.join('');
		else if(attrname && (attrval || attrval === 0)) attrs[attrname] = getExpr(attrval); // 当存在属性名和字符串属性值时
		else if(attrname && buffer.length) attrs[attrname] = getExpr(buffer.join('')); // 当存在属性名和非字符串属性值时
		else if(buffer.length) attrs[buffer.join('')] = null; // 当存在无值属性名时

		return {
			tagname: tagname,
			attrs: attrs
		};
	};
	/* 解析标签属性值中的表达式 */
	/* 如'asd<%= ss %>a'  -->  [{type:'text', value:'asd'},{type:'expr',:value:'= ss'},{type:'text', value:'a'}] */
	var getExpr = function(str) {
		var i = 0;
		var c;
		var ret = [];
		var buffer = [];
		while(!!(c = str.charAt(i++))) {
			switch(c) {
				case '<':
					// 转义或者普通<则忽略
					if(str.charAt(i-2) === '\\' || str.charAt(i) !== '%') {
						buffer.push(c);
						break;
					}
					// 存储表达式之前的文本
					if(buffer.length) {
						ret.push({
							type: 'text',
							value: buffer.join('')
						});
						buffer.length = 0;
					}
					i++;
					break;
				case '>':
					// 转义或者普通>则忽略
					var tmpc = str.charAt(i-2);
					if(tmpc === '\\' || tmpc !== '%') {
						buffer.push(c);
						break;
					}
					// 存储表达式
					buffer.pop();
					if(buffer.length) {
						ret.push({
							type: 'expr',
							value: parseExpr(buffer.join('').trim())
						});
						buffer.length = 0;
					}
					break;
				default:
					buffer.push(c);
					break;
			}
		}
		// 存储最后一段文本
		if(buffer.length) {
			ret.push({
				type: 'text',
				value: buffer.join('')
			});
		}
		return ret;
	};
	/* 解析表达式 */
	/* 如'list aa as a'  -->  {type:'list', arr:'aa', invar:'a'} */
	var parseExpr = function(str) {
		str = str.replace(/\s+/g, ' ');
		if(str.indexOf('=') === 0) {
			// 插值表达式
			str = str.substr(1).trim();
			return {
				type: 'var',
				invar: str
			}
		} else if(str.indexOf('list') === 0) {
			// list表达式
			str = str.substr(4).trim();
			var arr = str.split(' ');
			return {
				type: 'list',
				arr: arr[0],
				invar: arr[2]
			}
		} else if(str.indexOf('/list') === 0) {
			// list结束表达式
			str = str.substr(5).trim();
			return {
				type: 'list',
				isClose: true
			}
		} else if(str.indexOf('if') === 0) {
			// if表达式
			str = str.substr(2).trim();
			return {
				type: 'if',
				condition: str
			}
		} else if(str.indexOf('elseif') === 0) {
			// elseif表达式
			str = str.substr(6).trim();
			return {
				type: 'elseif',
				condition: str,
				isMid: true  // 是否中间状态
			}
		} else if(str.indexOf('else') === 0) {
			// else表达式
			str = str.substr(4).trim();
			return {
				type: 'else',
				isMid: true  // 是否中间状态
			}
		} else if(str.indexOf('/if') === 0) {
			// if结束表达式
			str = str.substr(3).trim();
			return {
				type: 'if',
				isClose: true
			}
		}
	};
	/* 特殊字符处理方法 */
	var CHARTYPE = {
		'<':function(content, index, c) {
			if(state === STATE.TEXT && !isQuot) {
				if(buffer.length) {
					// 当存在文本则判定文本结束
					result.push({
						type: 'text',
						value: buffer.join('')
					});
					buffer.length = 0;
				}

				if(content.substr(index, 3) === '!--') state = STATE.COMMENT; // 注释开始
				else if(content.charAt(index) === '%') state = STATE.EXPR; // 表达式开始
				else state = STATE.TAG; // 标签开始

			} else buffer.push(c);
		},
		'>':function(content, index, c) {
			if(state === STATE.TAG && !isQuot) {
				// 标签结束
				state = STATE.TEXT;
				var value = buffer.join('').trim();
				var isClose = false;
				// 当有自结束符时，去掉
				if(value.charAt(value.length - 1) === '/') value = value.substring(0, value.length - 1).trim();
				// 结束标签判断
				if(value.charAt(0) === '/') {
					value = value.substr(1).trim();
					isClose = true;
				}
				
				var taginfo = chackTag(value); // 解析标签

				result.push({
					type: 'tag',
					value: taginfo.tagname,
					attrs: taginfo.attrs,
					isClose: isClose
				});
				buffer.length = 0;
			} else if(state === STATE.COMMENT && content.substring(index-1, index-3) === '--') {
				// 注释结束，不插入生成
				state = STATE.TEXT;
				buffer.length = 0;
			} else if(state === STATE.EXPR && content.substring(index-1, index-2) === '%') {
				// 表达式结束
				state = STATE.TEXT;
				var exprtmp = buffer.join('');
				result.push({
					type: 'expr',
					value: parseExpr(exprtmp.substr(1, exprtmp.length-2).trim()) // 解析表达式
				});
				buffer.length = 0;
			} else buffer.push(c);
		},
		'"':function(content, index, c) {
			if(state === STATE.TAG) isQuot = !isQuot; // 针对标签属性值的情况
			buffer.push(c);
		}
	}
	CHARTYPE["'"] = CHARTYPE['"'];
	return function(content) {
		content = (content || '').trim().replace(/(\t|\r|\n)/g, '');
		var i = 0;
		var c;
		state = STATE.TEXT;
		while(!!(c = content.charAt(i++))) {
			if(CHARTYPE[c]) CHARTYPE[c].call(null, content, i, c); // 特殊字符
			else buffer.push(c);
		}
		return result;
	}
})();
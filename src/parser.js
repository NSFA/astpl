var getVal = require('./sandbox.js');
var getDom = require('./dom.js');
/*
 *  解析模板和数据
 */
module.exports = (function() {
  var ret = [];  // 返回节点数组
  /* 复制对象 */
  var copy = function(obj) {
    var ret = {};
    for(var item in obj) {
      if(obj[item] instanceof Array) ret[item] = copyArr(obj[item]);
      else if(typeof obj[item] === 'object') ret[item] = copy(obj[item]);
      else ret[item] = obj[item];
    }
    return ret;
  };
  /* 复制数组 */
  var copyArr = function(arr) {
    var ret = [];
    arr.forEach(function(item, index) {
      ret[index] = copy(arr[index]);
    });
    return ret;
  };

  /* 解析属性值内表达式 */
  var parseAttr = function(attrs, parent, data) {
    Object.keys(attrs).forEach(function(attr) {
      if(attr !== 'attrLen') {
        var str = '';
        str = '';
        var attrVal = attrs[attr];
        // 逐个表达式判断
        attrVal.forEach(function(item) {
          if(item.type === 'expr') {
            // 表达式
            var exprObj = item.value;
            switch(exprObj.type) {
              case 'var':
                // 插值
                str += getVar(exprObj, parent, data, 'attr');
                break;
              case 'if':
                // 判断
                var tmp = getIf(exprObj, parent, data, 'attr');
                if(typeof tmp === 'string') str += tmp;
                break;
              default:
                break;
            }
          } else {
            // 纯文本
            str += item.value;
          }
        });
        // 支持的属性如同dom.js中所描述
        attr = attr.toLowerCase();
        if(attr === 'class') {
          parent.setAttribute('class', str);
          parent.setAttribute('className', str);
        } else if(attr === 'style') {
          parent.style.cssText = str;
        } else {
          parent.setAttribute(attr, str);
        }
      }
    });
  };
  /* 处理遍历后所得的结果，传入parent的直接追加，不存在的则返回 */
  var dealText = function(parent, text, arr) {
    if(typeof text !== 'object') {
      // 纯文本处理
      if(parent) {
        parent.insertAdjacentHTML('beforeEnd', text);
      } else {
        arr.push(text);
      }
    } else {
      if(parent) {
        parent.appendChild(text);
      } else {
        arr.push(text);
      }
    }
  };
  /* 遍历ast数组 */
  var walkArr = function(arr, parent, data) {
    var nodetmparr = [];
    arr.forEach(function(item) {
      // 遍历ast节点
      var tmp = walk(item, parent, data);
      if(tmp || ('' + tmp)) {
        if(tmp instanceof Array) {
          tmp.forEach(function(tmpit) {
            dealText(parent, tmpit, nodetmparr);
          });
        } else {
          dealText(parent, tmp, nodetmparr);
        }
      }
    });
    return nodetmparr;
  };
  /* 遍历ast节点 */
  var walk = function(node, parent, data) {
    var child = node.child || node.value.child;
    if(child) {
      // 有子节点
      if(node.type === 'tag' && child.length === 1 && child[0].type === 'text') {
        // 只包含纯文本的标签
        var dom = getDom(node);
        dom.elem.innerText = child[0].value;
        parseAttr(dom.attrs, dom.elem, data);
        return dom.elem;
      } else if(node.type === 'tag') {
        // 包含复数子节点的标签
        var dom = getDom(node);
        // 遍历所有子节点
        walkArr(child, dom.elem, data);
        // 解析节点的属性
        parseAttr(dom.attrs, dom.elem, data);
        return dom.elem;
      } else if(node.type === 'expr') {
        // 表达式
        var tmp;
        switch(node.value.type) {
          case 'if':
            tmp = getIf(node.value, parent, data, 'node');
            break;
          case 'list':
            tmp = getList(node.value, parent, data, 'node');
            break;
          default:
            tmp = null;
            break;
        }
        return tmp;
      } else {
        return null;
      }
    } else {
      // 无子节点
      if(node.type === 'tag') {
        // 标签
        var dom = getDom(node);
        // 解析节点的属性
        parseAttr(dom.attrs, dom.elem, data);
        return dom.elem;
      } else if(node.type === 'text') {
        // 纯文本
        return node.value;
      } else if(node.type === 'expr' && node.value.type === 'var') {
        // 插值表达式
        return getVar(node.value, parent, data, 'node');
      } else {
        return null;
      }
    }
  };
  /* 解析变量，根据字符串获取真实变量值 */
  var parseVar = function(invar, data) {
    var arr = invar.split('.');
    var context = data;
    for(var i=0,len=arr.length; i<len; i++) {
      var tmp = arr[i];
      tmp = tmp.split('[');
      if(tmp.length > 1) {
        // 存在[]的方式访问变量的情况
        var vn = tmp[1].substr(0, tmp[1].length-1);
        if(/^['"][\w-]+['"]$/g.test(vn)) {
          // 使用字符串访问情况，如a['a']
          vn = vn.substr(1, vn.length-2);
        } else if(isNaN(vn)) {
          // 使用变量访问情况，如a[b]
          vn = data[vn];
        }
        context = context[tmp[0]][vn];
      } else {
        context = context[tmp];
      }
    }
    return context;
  };
  /* 解析插值 */
  var getVar = function(expr, parent, data, type) {
    // 只支持单个变量的插值，不支持表达式插值
    var invar = expr.invar;  
    return parseVar(invar, data);
  };
  /* 获取if判断中的条件 */
  var parseIf = function(expr, data) {
    // 判断if分支
    var flag = getVal(data, expr.condition);
    if(flag) return expr.child;
    // 判断elseif分支
    var ei = expr['elseif'];
    if(ei) {
      for(var i=0,len=ei.length; i<len; i++) {
        flag = getVal(data, ei[i].condition);
        if(flag) return ei[i].child;
      }
    }
    // 判断else分支
    var el = expr['else'];
    if(el && el.length) {
      return el[0].child;
    }
    return [];
  };
  /* 解析if */
  var getIf = function(expr, parent, data, type) {
    var str = '';
    var child = parseIf(expr, data);
    if(type === 'attr') {
      // 属性内
      child.forEach(function(item) {
        // 获取逐个节点的值
        var tmp = walk(item, parent, data);
        if(tmp || ('' + tmp)) {
          if(typeof tmp === 'string') {
            str += tmp;
          }
        }
      });
      return str;
    } else {
      // 标签间
      // 直接遍历子ast数据
      return walkArr(child, parent, data);
    }
  };
  /* 解析list */
  var getList = function(expr, parent, data, type) {
    if(type === 'attr') {
      // 属性内，因为属性内遍历几乎没啥用，故在此不实现
      return null;
    } else {
      // 标签间
      // list arr as a 中可用a_index访问下标，也可用a_length访问数组长度
      var arr = parseVar(expr.arr, data);
      var child = expr.child;
      var a = expr.invar;
      var len = arr.length;
      var tmp = {};
      var tmpnode = [];
      
      // 缓存原始数据
      tmp[a] = data[a];
      tmp[a + '_length'] = data[a + '_length'];
      tmp[a + '_index'] = data[a + '_index'];

      data[a + '_length'] = len;
      for(var i=0; i<len; i++) {
        data[a] = arr[i];
        data[a + '_index'] = i;
        // 遍历子ast数组并组合
        tmpnode = tmpnode.concat(walkArr(child, parent, data));
      }

      // 恢复原始数据
      if(tmp[a] === undefined) delete data[a];
      else data[a] = tmp[a];
      if(tmp[a + '_length'] === undefined) delete data[a + '_length'];
      else data[a + '_length'] = tmp[a + '_length'];
      if(tmp[a + '_index'] === undefined) delete data[a + '_index'];
      else data[a + '_index'] = tmp[a + '_index'];

      return tmpnode;
    }
  };
  return function(ast, data, parent) {
    ast = copyArr(ast);
    walkArr(ast, parent, data)
  };
})();
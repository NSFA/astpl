/*
 *  构建节点
 */
module.exports = function(node) {
  var midarrtmp = {};
  // 开始标签，生成对应的节点
  var elem = document.createElement(node.value);
  var attrtmp = {
    attrLen: 0
  };
  Object.keys(node.attrs).forEach(function(attr) {
    var attrval = node.attrs[attr];
    if(typeof attrval !== 'string') {
      // 属性值存在表达式
      var tmparr = [];
      var stack = [];
      var aitem;
      var bitem;
      while(aitem = attrval.shift()) {
        if(aitem.type === 'expr' && aitem.value.isClose) {
          // 匹配到结束标记，则开始回溯
          while(bitem = stack.pop()) {
            // 回溯寻找栈中的开始标签
            if(bitem.type === 'expr' && bitem.value.type === aitem.value.type && !bitem.value.isClose && !bitem.hasCheck) {
              // 当寻找到
              break;
            } else if(bitem.type === 'expr' && bitem.value.isMid) {
              // 存在中间状态的表达式，如elseif和else
              midarrtmp[bitem.value.type] = midarrtmp[bitem.value.type] || [];
              midarrtmp[bitem.value.type].push({
                child: [].concat(tmparr).reverse(),
                condition: bitem.value.condition
              });
              tmparr.length = 0;
            } else {
              // 当前未找到
              tmparr.push(bitem);
            }
          }
          if(bitem) {
            // 寻找到开始标记后
            // 保存中间状态
            for(var midarrtmpit in midarrtmp) {
              if(midarrtmp.hasOwnProperty(midarrtmpit)) {
                bitem.value[midarrtmpit] = midarrtmp[midarrtmpit].reverse();
                delete midarrtmp[midarrtmpit];
              }
            }
            bitem.hasCheck = true; // 标记为已检查过
            bitem.value.child = [].concat(tmparr).reverse();
            stack.push(bitem); // 处理完后压回栈中
            tmparr.length = 0;
          }
        } else {
          // 压入栈中
          stack.push(aitem);
        }
      }
      // 将属性中的表达式存储回去
      attrtmp[attr] = stack;
      attrtmp.attrLen++;
    } else {
      // 属性不存在表达式
      // 因为此处使用setAttribute属性，因此对于ie来说会不支持事件属性（如onclick），style属性和class属性，再次会对style和class属性做兼容
      attr = aname.toLowerCase();
      if(attr === 'class') {
        elem.setAttribute('class', attrval);
        elem.setAttribute('className', attrval);
      } else if(attr === 'style') {
        elem.style.cssText = attrval;
      } else {
        elem.setAttribute(attr, attrval);
      }
    }
  });
  return {
    elem: elem,
    attrs: attrtmp
  }
  
};
var token = require('./token.js');
/*
 *  构建ast树
 *
 *  根据token分词的结果进行构建，构建出来的为树形结构，例如{type:'tag',value:'div',attrs:{},child:[{type:'text',value:'hahaha'}]}
 */
module.exports = function(str) {
  var tmparr = []; // 存放中间子节点
  var stack = [];
  // 先对模板进行分词处理
  var arr = token(str);
  // 逐个节点遍历
  while(arr.length) {
    var node = arr.shift();
    var tmp;
    var midtmp = {};
    if(node.type === 'tag' && node.isClose) {
      // 结束标签
      while(tmp = stack.pop()) {
        // 寻找栈中的开始标签
        if(tmp.type === 'tag' && tmp.value === node.value && !tmp.isClose && !tmp.hasCheck) {
          // 当寻找到
          break;
        } else {
          // 当前未找到
          tmparr.push(tmp);
        }
      }
      if(tmp) {
        tmp.hasCheck = true; // 标记为已检查过
        tmp.child = [].concat(tmparr).reverse();
        stack.push(tmp);
        tmparr.length = 0;
      }
    } else if(node.type === 'expr' && node.value.isClose) {
      // 表达式结束标签
      while(tmp = stack.pop()) {
        // 寻找栈中的开始标签
        if(tmp.type === 'expr' && tmp.value.type === node.value.type && !tmp.value.isClose && !tmp.hasCheck) {
          // 当寻找到
          break;
        } else if(tmp.type === 'expr' && tmp.value.isMid) {
          // 存在中间状态的表达式，如elseif和else
          midtmp[tmp.value.type] = midtmp[tmp.value.type] || [];
          midtmp[tmp.value.type].push({
            child: [].concat(tmparr).reverse(),
            condition: tmp.value.condition
          });
          tmparr.length = 0;
        } else {
          // 当前未找到
          tmparr.push(tmp);
        }
      }
      if(tmp) {
        // 保存中间状态
        for(var midtmpit in midtmp) {
          if(midtmp.hasOwnProperty(midtmpit)) {
            tmp.value[midtmpit] = midtmp[midtmpit].reverse();
            delete midtmp[midtmpit];
          }
        }
        tmp.hasCheck = true; // 标记为已检查过
        tmp.value.child = [].concat(tmparr).reverse();
        stack.push(tmp);
        tmparr.length = 0;
      }
    } else {
      // 其他压入栈中
      stack.push(node);
    }
  }
  return stack;
};

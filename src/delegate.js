/*
 *  事件代理工具
 */
module.exports = (function() {
	window.Easy = window.Easy || {};
  Easy.util = Easy.util || {};

  /* 事件添加器 */
  var addEvent = (function() {
    return 'addEventListener' in window ?
      function(node, type, cb){return node.addEventListener(type, cb)} : 
      function(node, type, cb){return node.attachEvent('on' + type, cb)};
  })();

  var getDataset = function(node, key) {
    if(!node || !key) return;
    if(node.dataset) return node.dataset[key];
    return node.getAttribute('data-' + key);
  };

  /* 获取绑定了事件回调的节点 */
  var getNode = function(e, parent) {
    if(!e) return;
    var node = e.target || e.srcElement;
    while(node && node !== parent) {
      var action = getDataset(node, 'action');
      if(action) return {node:node, action:action};
      node = node.parentNode;
    }
    return null;
  };

  /* 停止事件往上冒泡和默认事件 */
  var stopEvent = function(e) {
    if(!e) return;
    e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
    e.preventDefault ? e.preventDefault() : e.returnValue = false;
  };

  /* 处理代理节点事件 */
  var doDelegate = function(parent, map, scope) {
    return function(e) {
      e = e || window.event;
      var obj = getNode(e, parent);
      if(!obj) return;

      while(obj && obj.node !== parent) {
        if(!obj.action) continue;
        // 执行事件回调
        var func = (map || {})[obj.action];
        if(typeof func === 'function') {
          stopEvent(e);
          func.call(scope || window, obj.node, e);
          break;
        }
        obj = {
          node: obj.node.parentNode,
          action: getDataset(obj.node, 'action')
        };
      }
    };
  }

  /* 其中parent是要代理事件的节点，type是事件类型，map是事件回调映射表，scope是要传入事件回调中的this */
  return function(parent, type, map, scope) {
    if(typeof parent === 'string') parent = document.querySelector(parent);
    var func = doDelegate(parent, map, scope);
  	addEvent(parent, type, func);
    return func;
  };
})();
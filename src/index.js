var parser = require('./parser.js');
var aster = require('./aster.js');
var delegate = require('./delegate.js');
/*
 *  组件生成器
 */

module.exports = (function() {
  window.Easy = window.Easy || {};
  Easy.widget = Easy.widget || {};
  Easy.cache = Easy.cache || {};
  Easy.cache.widget = Easy.cache.widget || {};
  Easy.cache.widget.ast = Easy.cache.widget.ast || {};  // 存放ast

  // 事件解除器
  var delEvent = (function() {
    return 'removeEventListener' in window ? 
      function(node, type, cb){return node.removeEventListener(type, cb)} :
      function(node, type, cb){return node.detachEvent('on' + type, cb)};
  })();

  /* 检查两个值是否相等 */
  var checkVal = function(newval, oldval) {
    if(typeof newval !== 'object' && typeof oldval !== 'object') {
      // 值类型
      return newval === oldval;
    } else {
      // 对象类型
      if(newval instanceof Array && oldval instanceof Array) {
        // 数组
        if(newval.length !== oldval.length) return false;
        for(var i=0,len=newval.length; i<len; i++) {
          if(newval[i] !== oldval[i]) return false;
        }
        if(i>=len) return true;
      } else if(newval instanceof Object && oldval instanceof Object) {
        // 非数组
        if(Object.keys(newval).length !== Object.keys(oldval).length) return false;
        for(var it in newval) {
          if(newval.hasOwnProperty(it)) {
            if(newval[it] !== oldval[it]) return false;
          }
        }
        return true;
      } else {
        return false;
      }
    }
  };
  /* 拷贝对象 */
  var copyItem = function(item) {
    var ret = {};
    // 值类型
    if(typeof item !== 'object') return item;
    // 数组
    if(item instanceof Array) {
      ret = [];
      for(var i=0,len=item.length; i<len; i++) {
        ret[i] = copyItem(item[i]);
      }
      return ret;
    }
    // 对象
    Object.keys(item).forEach(function(it) {
      ret[it] = copyItem(item[it]);
    });
    return ret;
  };
  /* 构建组件 */
  var constuct = function(name, config, extend) {
    // 组件构造函数，参数如下：
    // {
    //   parent: '#wid',  // 组件所在容器
    //   data: {},  // 初始化数据
    //   ext: {},  // 额外传入的参数，不参与到模板构建中
    //   onupdate: function(data) {
    //     // 更新组件完成后，data为当前组件中的数据
    //   }
    // }
    var cache = {
      delegates: [/* 存放代理数组 */]
    };
    var wgt = function(map) {
      map = map || {};
      if(!map.parent) return;
      this.name = name;
      this.data = map.data || {};
      this.ext = map.ext || {};
      this.oldData = copyItem(this.data); // 旧数据缓存，用于和新数据比较
      this.parent = (typeof map.parent === 'string') ? document.querySelector(map.parent) : map.parent;
      this.onupdate = map.onupdate || function() {};
      
      this._init();
    };
    // 初始化组件
    wgt.prototype._init = function() {
      // 获取ast树
      var ast = Easy.cache.widget.ast[this.name];
      this.parent.innerHTML = '';
      // 渲染
      parser(ast, this.data, this.parent);
      // 给实例添加代理事件
      for(var i=0,len=cache.delegates.length; i<len; i++) {
        var item = cache.delegates[i];
        item.push(delegate(this.parent, item[0], item[1], this));
      }
    };
    // 更新模板数据
    wgt.prototype.$update = function() {
      var oldData = this.oldData;
      var data = this.data;
      // 获取ast树
      var ast = Easy.cache.widget.ast[this.name];
      for(var ditem in data) {
        if(data.hasOwnProperty(ditem)) {
          var dval = data[ditem];
          var oval = oldData[ditem];
          // 判断值是否改变
          var flag = checkVal(dval, oval);
          if(!flag) {
            this.parent.innerHTML = '';
            // 值改变，重新渲染
            parser(ast, data, this.parent);
            this.oldData = copyItem(data);
            break;
          }
        }
      }
      this.onupdate();
    };
    // 销毁组件
    wgt.prototype.$destroy = function() {
      // 清除代理事件
      for(var i=0,len=cache.delegates.length; i<len; i++) {
        var item = cache.delegates[i];
        delEvent(this.parent, item[0], item[2]);
      }
      this.parent.innerHTML = '';
      delete this.data;
      delete this.oldData;
      delete this.parent;
      delete this.onupdate;
      return null;
    };
    // 代理事件
    wgt.$delegate = function(type, map) {
      cache.delegates.push([type, map]);
      return Easy.widget[name];
    }; 

    // 给组件添加扩展的自定义方法或参数
    if(extend) {
      Object.keys(extend).forEach(function(key) {
        if(typeof extend[key] === 'function') {
          wgt.prototype[key] = extend[key];
        } else {
          wgt[key] = extend[key];
        }
      });
    }

    // 给组件添加自定义方法或参数
    if(config) {
      Object.keys(config).forEach(function(key) {
        if(typeof config[key] === 'function') {
          wgt.prototype[key] = config[key];
        } else {
          wgt[key] = config[key];
        }
      });
    }

    Easy.widget[name] = wgt;
  };

  /*
   *  定义一个组件
   *
   *  参数结构如下：
   *  {
   *    name: 'test',  // 模板名称
   *    tpl: './test.html',  // 模板路径
   *    config: {}, // 自定义参数配置
   *    extend: {}, // 扩展实现的自定义参数配置，实现方式和config一样，主要用于多组件有公共基类的情况
   *  }
   */
  Easy.widget.define = function(options) {
    if(!options || !options.name || !options.tpl) return;
    var name = options.name;
    var config = options.config;
    var extend = options.extend;
    var tpl = options.tpl;

    if(tpl && typeof tpl === 'string') {
      // 当存在直接传入的模板时
      // 解析模板为ast并存储
      Easy.cache.widget.ast[name] = aster(tpl);
      constuct(name, config, extend);
    }
    return Easy.widget[name];
  };

})();
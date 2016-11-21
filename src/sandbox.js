/*
 *  沙箱函数，主要用来判定变量
 */
module.exports = function(data, stmt) {
  var str = '';
  Object.keys(data).forEach(function(item) {
  	str += ('var ' + item + ' = ' + JSON.stringify(data[item]) + ';');
  });
  str += ('return ' + stmt + ';');
  // 通过构造一个函数来返回变量判断
  var f = new Function(str);
  return f();
};
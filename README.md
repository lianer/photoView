# PhotoView
  PhotoView.js 灵感来自于picasa，使用原生js实现。[demo](//jsfiddle.net/Lianer/ycufgx97/embedded/result,html,css,js/)

## 介绍

- 兼容现代浏览器，不兼容ie678，主要是一些功能不支持
- 带有图片查看器的常用功能，UI设计和交互灵感来源于google的picasa
- 为了保证整体的清洁，界面没有使用任何图标，有需要的可以自行修改css
- 鼠标移动到底部可显示控制栏
- 控制栏上使用鼠标滚轮可控制图片切换
 
## 使用

### html
```html
<div id="list" class="list">
    <img src="http://www.qqya.com/qqyaimg/allimg/140909/094F643R-8.jpg" alt="">
    <img src="http://www.qqya.com/userimg/3058/150330135508.jpg" alt="">
    <img src="http://www.qqya.com/qqyaimg/allimg/150404/160R449B-0.jpg" alt="">
    <img src="http://www.qqya.com/qqyaimg/allimg/150404/160R431F-1.jpg" alt="">
    <img src="http://www.qqya.com/qqyaimg/allimg/150404/160R45955-6.jpg" alt="">
</div>
```

### javascript
```js
var list = document.querySelector("#list");

// 创建实例
var pv = new PhotoView();

// 将元素添加到PhotoView
pv.add(list.children);

// 
list.onclick = function(e) {
    e = window.event || e;
    var target = e.srcElement || e.target;

    // 实现简单的事件委托
    if (target.nodeName === "IMG") {
        // 显示PhotoView
        pv.show();
    }

    // 获取点击图片的索引
    var index = getIndex(target);
    
    // 定位到某个图片
    pv.aim(index);
};

list.children[0].click();

/**
 * 获取当前元素在兄弟元素中的index
 * @param  {dom} elem 目标元素
 * @return {number}   index
 */
function getIndex(elem) {
    if (elem.sourceIndex) {
        return elem.sourceIndex - elem.parentNode.sourceIndex;
    } else {
        var i = 0;
        while (elem = elem.previousElementSibling) i++;
        return i;
    }
}
```


## 日志
  2016.01.16 修正一处js拼写错误

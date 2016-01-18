/**
 * 照片浏览
 * --
 * @author Lianer
 * @version 2015.06.11
 * @description 带有常用照片查看功能，包括缩放、自适应、移动、切换、旋转、下载，ie9+
 * @example
 *   var pv=new PhotoView();
 *   pv.add(["1.jpg", "2.jpg", "3.jpg"]);  // 追加列表
 *   pv.show();   // 显示
 *   pv.close();  // 关闭
 *   pv.aim(1);   // 定位到指定位置
 *   pv.reset();  // 重置
 */

(function() {
    "use strict";
    var PhotoView = window.PhotoView = function() {

        var createElement = function(type, className, parent) {
            var elem = document.createElement(type);
            if (className) elem.className = className;
            if (parent) parent.appendChild(elem);
            return elem;
        };

        var bindWheel = function(elem, fn, cancelBubble) {
            if ("onwheel" in document) {
                elem.onwheel = handler;
            } else if ("onmousewheel" in document) {
                elem.onmousewheel = handler;
            } else {
                return false;
            }
            return true;

            function handler(e) {
                e = window.event || e;
                var deltaX = e.deltaX || // wheel
                    -e.wheelDeltaX || // onmousewheel
                    0; // firefox,DOMMouseScroll不支持2D

                var deltaY = e.deltaY || // wheel
                    -e.wheelDeltaY || // onmousewheel
                    -e.wheelDelta || // 1D
                    e.detail || // firefox,DOMMouseScroll
                    0;

                deltaX = deltaX > 0 ? 1 : deltaX < 0 ? -1 : 0;
                deltaY = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;

                fn(deltaY, deltaX, e);

                if (cancelBubble) {
                    if (e.preventDefault) e.preventDefault();
                    if (e.stopPropagation) e.stopPropagation();
                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }
            }
        };


        var pv = function() {
            this.index = 0;
            this.queue = [];
            var elem = this.elem = {};
            // 外框
            elem.wrap = createElement("div", "photoview photoview_" + pv.size++);
            elem.wrap.setAttribute("tabindex", "0");
            // 容器
            elem.container = createElement("div", "photoview-container", elem.wrap);
            // 缩放指数
            elem.scaleValue = createElement("div", "photoview-scale-value", elem.container);
            elem.scaleValue.style.display = "none";
            // 预览
            elem.view = createElement("div", "photoview-view", elem.container);
            elem.viewCache = createElement("img");
            // 控制栏
            elem.control = createElement("div", "photoview-control", elem.wrap);
            // 控制栏队列
            elem.controlQueue = createElement("div", "photoview-control-queue", elem.control);
            // 编辑
            elem.controlEdit = createElement("div", "photoview-control-edit", elem.control);
            // 放大
            elem.scaleUp = createElement("div", "photoview-scale-up", elem.controlEdit);
            // 缩小
            elem.scaleDown = createElement("div", "photoview-scale-down", elem.controlEdit);
            // 自适应
            elem.scaleAdapt = createElement("div", "photoview-scale-adapt", elem.controlEdit);
            // 上一张
            elem.prev = createElement("div", "photoview-prev", elem.controlEdit);
            // 下一张
            elem.next = createElement("div", "photoview-next", elem.controlEdit);
            // 逆时针旋转
            elem.rotateCCW = createElement("div", "photoview-rotate-ccw", elem.controlEdit);
            // 顺时针旋转
            elem.rotateCW = createElement("div", "photoview-rotate-cw", elem.controlEdit);
            // 下载
            if (window.Blob) elem.download = createElement("div", "photoview-download", elem.controlEdit);
            // 关闭
            elem.close = createElement("div", "photoview-close", elem.wrap);
            elem.close.innerHTML = "关闭";

            document.body.appendChild(elem.wrap);

            this.$bind();
        };
        pv.prototype = {
            // control定位
            aim: function(n) {
                var _this = this,
                    elem = this.elem,
                    queue = this.queue;
                if (n > queue.length - 1) {
                    n = queue.length;
                } else if (n < 0) {
                    n = 0;
                }
                var target = elem.controlQueue.querySelectorAll("p");
                if (target) {
                    target = target[n];
                }
                if (target) {
                    var last = elem.controlQueue.querySelector(".active");
                    if (last) {
                        last.className = "";
                    }
                    target.className = "active";
                    elem.controlQueue.style.left = (elem.control.clientWidth / 2 - target.offsetLeft - target.offsetWidth / 2) + "px";
                    this.$view(this.queue[n]);
                    this.index = n;
                }
                return this;
            },
            // 适应
            $adapt: function() {
                var _this = this,
                    elem = this.elem,
                    target = this.queue[this.index],
                    view = elem.view,
                    img = elem.viewCache,
                    container = elem.container,
                    scale = target.scale;

                var imgSize = {
                    width: img.width,
                    height: img.height,
                    rate: img.width / img.height
                };
                var conSize = {
                    width: container.clientWidth,
                    height: container.clientHeight,
                    rate: container.clientWidth / container.clientHeight
                };

                if (target.scale == null) {
                    var coverage = 0.7;
                    if (imgSize.rate > conSize.rate) { // 更宽
                        if (imgSize.width > conSize.width * coverage) {
                            target.scale = conSize.width / imgSize.width * coverage;
                        } else {
                            target.scale = 1;
                        }
                    } else {
                        if (imgSize.height > conSize.height * coverage) {
                            target.scale = conSize.height / imgSize.height * coverage;
                        } else {
                            target.scale = 1;
                        }
                    }
                }
                target.width = imgSize.width * target.scale;
                target.height = imgSize.height * target.scale;
                target.left = ((conSize.width - imgSize.width * target.scale) / 2 + target.x);
                target.top = ((conSize.height - imgSize.height * target.scale) / 2 + target.y);
                view.style.width = target.width + "px";
                view.style.height = target.height + "px";
                view.style.left = target.left + "px";
                view.style.top = target.top + "px";
                view.style.transform = "rotate(" + target.rotate + "deg)";
                view.style.webkitTransform = "rotate(" + target.rotate + "deg)";
                // view.style.msTransform="rotate(" + target.rotate + "deg)";
            },
            // 追加列表
            add: function() {
                var _this = this,
                    elem = this.elem,
                    queue = this.queue;
                var arg;
                for (var i = 0; arg = arguments[i]; i++) {
                    if (!arg) {
                        return false;
                    }
                    if (arg.length) {
                        var a;
                        for (var i = 0; a = arg[i]; i++) {
                            checkType(a);
                        }
                    } else {
                        checkType(arg);
                    }
                }

                function checkType(mixed) {
                    if (typeof mixed === "string") {
                        add(mixed, null, null);
                    } else if (mixed.nodeName && mixed.nodeName.toLowerCase() === "img") {
                        add(mixed.getAttribute("data-source") || mixed.src,
                            mixed.getAttribute("data-rotate") || null,
                            mixed.getAttribute("data-scale") || null);
                    } else {
                        return false;
                    }
                }

                function add(src, rotate, scale) {
                    var q = {
                        src: src, // 图片路径
                        rotate: rotate || 0, // 旋转角度
                        scale: scale, // 缩放比例，null时会通过adapt计算以contain
                        x: 0, // x轴偏移
                        y: 0 // y轴偏移
                    };
                    queue.push(q);
                    var p = createElement("p", null, elem.controlQueue),
                        img = createElement("img");
                    p.style.cssText = "opacity: 0;background-image: url(" + src + ");";
                    p.photoview = {
                        index: queue.length - 1
                    };
                    img.src = src;
                    img.onload = function() {
                        p.style.opacity = "";
                        this.onload = null;
                    };
                }
                return this;
            },
            // 绑定事件
            $bind: function() {
                var _this = this,
                    elem = this.elem,
                    queue = this.queue;
                // 关闭
                elem.close.onclick = function() {
                    _this.close();
                };
                // 窗口变化
                var resizeTimer = 0,
                    resizeHandler = function() {
                        clearTimeout(resizeTimer);
                        resizeTimer = setTimeout(function() {
                            if (!_this.queue.length) return;
                            elem.controlQueue.children[_this.index].click();
                        }, 200);
                    };
                if (window.addEventListener) {
                    addEventListener("resize", resizeHandler);
                } else if (window.attachEvent) {
                    attachEvent("onresize", resizeHandler);
                }
                // view.onload自适应
                elem.viewCache.onload = function() {
                    elem.view.style.backgroundImage = 'url("' + this.src + '")';
                    _this.$adapt();
                };
                // view缩放
                var scaleTipTimer = 0,
                    showScaleTip = function(scale) {
                        if (window.console) console.log(scale);
                        elem.scaleValue.innerHTML = parseInt(scale * 100) + "%";
                        elem.scaleValue.style.display = "block";
                        clearTimeout(scaleTipTimer);
                        clearTimeout(scaleTipTimer + 1);
                        clearTimeout(scaleTipTimer + 2);
                        scaleTipTimer = setTimeout(function() {
                            elem.scaleValue.style.opacity = 1;
                        }, 16);
                        setTimeout(function() {
                            elem.scaleValue.style.opacity = 0;
                        }, 1200);
                        setTimeout(function() {
                            elem.scaleValue.style.display = "none";
                        }, 1300);
                    };
                bindWheel(elem.container, function(y, x, e) {
                    if (!_this.queue.length) return;
                    var target = queue[_this.index],
                        rate = 1.2;
                    if (y > 0) {
                        target.scale = target.scale / rate;
                    } else if (y < 0) {
                        target.scale = target.scale * rate;
                    }

                    showScaleTip(target.scale);

                    if (e.target === elem.view) {
                        // view内部定点缩放
                        var position = {
                            // transition中的元素会使getBoundingClientRect、getComputedStyle、offsetLeft等无法取得最终值
                            x: e.clientX - target.left - target.width / 2,
                            y: e.clientY - target.top - target.height / 2
                        };
                        if (y > 0) {
                            target.x = target.x - (position.x / rate - position.x);
                            target.y = target.y - (position.y / rate - position.y);
                        } else if (y < 0) {
                            target.x = target.x - (position.x * rate - position.x);
                            target.y = target.y - (position.y * rate - position.y);
                        }
                    }

                    _this.$adapt();
                }, true);
                // view移动
                var moving = false,
                    coord = {
                        x: 0,
                        y: 0
                    };
                elem.view.onmousedown = function(e) {
                    e = window.event || e;
                    moving = true;
                    coord.x = e.clientX;
                    coord.y = e.clientY;
                    elem.view.style.zIndex = 2;
                };
                // 离开事件绑定到wrap，防止禁止移动状态下(选中元素拖拽)发生bug
                elem.wrap.onmouseup = elem.wrap.onmouseout = function(e) {
                    moving = false;
                    elem.view.style.transition = "";
                    elem.view.style.zIndex = "";
                };
                elem.view.onmousemove = function(e) {
                    if (!_this.queue.length) return;
                    if (moving) {
                        elem.view.style.transition = "none";
                        var target = _this.queue[_this.index];
                        target.x = target.x + e.clientX - coord.x;
                        target.y = target.y + e.clientY - coord.y;
                        coord.x = e.clientX;
                        coord.y = e.clientY;
                        _this.$adapt();
                    }
                };
                // 点击queue，定位到目标
                elem.controlQueue.onclick = function(e) {
                    e = window.event || e;
                    var target = e.srcElement || e.target;
                    if (target.nodeName === "P") {
                        _this.aim(target.photoview.index);
                    }
                };
                // control滚动
                bindWheel(elem.control, function(y, x) {
                    if (y > 0) {
                        _this.aim(_this.index + 1);
                    } else if (y < 0) {
                        _this.aim(_this.index - 1);
                    }
                }, true);
                // 捕获按键
                elem.wrap.onkeydown = function(e) {
                    if (e.keyCode === 27) {
                        _this.close();
                    }
                };
                // 放大
                elem.scaleUp.onclick = function() {
                    if (!_this.queue.length) return;
                    var target = queue[_this.index];
                    target.scale = target.scale * 1.1;
                    showScaleTip(target.scale);
                    _this.$adapt();
                };
                // 缩小
                elem.scaleDown.onclick = function() {
                    if (!_this.queue.length) return;
                    var target = queue[_this.index];
                    target.scale = target.scale / 1.1;
                    showScaleTip(target.scale);
                    _this.$adapt();
                };
                // 自适应
                elem.scaleAdapt.onclick = function() {
                    if (!_this.queue.length) return;
                    var target = queue[_this.index];
                    target.x = target.y = 0;
                    if (target.scale === 1) {
                        target.scale = null;
                    } else {
                        target.scale = 1;
                    }
                    _this.$adapt();
                };
                // 上一张
                elem.prev.onclick = function() {
                    if (!_this.queue.length) return;
                    _this.aim(_this.index - 1);
                };
                // 下一张
                elem.next.onclick = function() {
                    if (!_this.queue.length) return;
                    _this.aim(_this.index + 1);
                };
                // 顺时针旋转
                elem.rotateCW.onclick = function() {
                    if (!_this.queue.length) return;
                    queue[_this.index].rotate = (queue[_this.index].rotate + 90) % 360;
                    _this.$adapt();
                };
                // 逆时针旋转
                elem.rotateCCW.onclick = function() {
                    if (!_this.queue.length) return;
                    queue[_this.index].rotate = (queue[_this.index].rotate - 90) % 360;
                    _this.$adapt();
                };
                // 下载
                elem.download && (elem.download.onclick = function() {
                    if (!_this.queue.length) return;
                    var a = document.createElement("a");
                    a.href = _this.queue[_this.index].src;
                    a.download = /([^\/]+)$/.test(a.href) && RegExp.$1 || new Date().getTime()
                    a.click();
                });
            },
            // 隐藏查看器
            close: function() {
                var style = this.elem.wrap.style;
                style.opacity = 0;
                setTimeout(function() {
                    style.display = "none";
                }, 316);
                return this;
            },
            // 销毁
            destory: function() {
                // 暂时只移除dom
                this.elem.wrap.parentNode.removeChild(this.elem.wrap);
                return this;
            },
            // 清空列表
            reset: function() {
                this.queue.length = 0;
                this.elem.controlQueue.innerHTML = "";
                this.elem.view.style.cssText = "";
                return this;
            },
            // 显示查看器
            show: function() {
                var _this = this,
                    elem = this.elem,
                    style = elem.wrap.style;
                style.opacity = 0;
                style.display = "block";
                setTimeout(function() {
                    style.opacity = 1;
                }, 16);
                _this.aim(0);
                elem.wrap.focus();
                return this;
            },
            // 预览
            $view: function(target) {
                var _this = this,
                    elem = this.elem;
                elem.viewCache.src = target.src;
            }
        };
        pv.size = 0;
        return pv;
    }();
})();

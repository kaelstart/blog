## $nextTick 源码解析

### $nextTick 的功能是什么

官方解读: 在下次 DOM 更新循环结束之后执行延迟回调。在修改数据之后立即使用这个方法，获取更新后的 DOM。

### 流程

```js
var callbacks = []; // callback事件更新的缓存数组
var pending = false;

/**
 * nextTick
 * 这里我们可以看到,当我们执行nextTick的时候,vue会把回调函数放入到callbacks数*组当中,我们可以把callback数组认为是一个更新队列.
 */
function nextTick(cb, ctx) {
  var _resolve;
  callbacks.push(function () {
    if (cb) {
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, "nextTick");
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });
  if (!pending) {
    pending = true;
    timerFunc();
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== "undefined") {
    return new Promise(function (resolve) {
      _resolve = resolve;
    });
  }
}

// queueWatcher
function queueWatcher(watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    // 这里会判断,如果当前的watcher已经收集进了has中,那么就不会再次收集这个watcher. 比如就像全局的渲染watcher一样
    // 例子,比如一个组件在data中声明的属性,那么当他走到这里的时候,其实他依赖的全局渲染watcher都是同一个,也就是他不会被重复添加进来.
    has[id] = true;
    if (!flushing) {
      // flushing 如果没有正在更新的情况下
      queue.push(watcher); // 这个会把watcher推进queue队列
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) {
      // waiting 这个为false的时候只有是在默认的的情况下或者说更新完毕了会调用resetSchedulerState来重置状态
      waiting = true;

      if (!config.async) {
        flushSchedulerQueue();
        return;
      }
      // 把更新函数丢入nextTick中.
      nextTick(flushSchedulerQueue);
    }
  }
}

// flushCallbacks
function flushCallbacks() {
  pending = false;
  var copies = callbacks.slice(0);
  callbacks.length = 0;
  for (var i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

var timerFunc;
/**
 * 1.vue会去判断当前环境是否有promise,如果有则使用promise来执行队列的更新
 * 2.如果promise不存在,则会使用MutationObserver来代替
 * 3.如果MutationObserver不存在,则会用setImmediate来代替
 * 4.如果以上都不能使用,则使用setTimeout来代替
 */
if (typeof Promise !== "undefined" && isNative(Promise)) {
  var p = Promise.resolve();
  timerFunc = function () {
    p.then(flushCallbacks);
  };
  isUsingMicroTask = true;
} else if (
  !isIE &&
  typeof MutationObserver !== "undefined" &&
  (isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === "[object MutationObserverConstructor]")
) {
  var observer = new MutationObserver(flushCallbacks);
} else if (typeof setImmediate !== "undefined" && isNative(setImmediate)) {
  timerFunc = function () {
    setImmediate(flushCallbacks);
  };
} else {
  // Fallback to setTimeout.
  timerFunc = function () {
    setTimeout(flushCallbacks, 0);
  };
}
```

### 总结
从上面的代码我们也可以看到,如果我们对一个数据进行更新 this.count = 10 的时候,vue 不会立即重新渲染.我们需要注意的时候,数据是实时变更的,但是 dom 的更新则是在微任务(promise,我们这里讲的是支持 promise 的情况)中进行更新的.在同一个队列中如果我们对一个数据重复更新了一万次,dom 的更新也就只有一次.

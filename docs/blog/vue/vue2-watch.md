## watch 源码解析

### watch 的功能是什么

官方解读: 观察 Vue 实例上的一个表达式或者一个函数计算结果的变化。回调函数得到的参数为新值和旧值。表达式只接受简单的键路径。对于更复杂的表达式，用一个函数取代。也就是我们可以利用 watch 对某些数据进行监听,当数据进行变化的时候执行我们在 watch 定义的函数.那么 vue 是如何做到数据变更之后执行对应的回调呢?下面我们来解读以下

### 流程

```js
// initState
function initState(vm) {
  vm._watchers = [];
  var opts = vm.$options;
  //   ...省略无关代码
  // 如果有定义watch,则会执行initWatch
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}
// initWatch
function initWatch(vm, watch) {
  for (var key in watch) {
    var handler = watch[key];
    if (Array.isArray(handler)) {
      for (var i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}
/**
 * createWatcher
 * vm {Object} vue实例
 * expOrFn {Object|String} watch的key
 * handler {Function | Object} watch的value
 * options {Object} watch的一些选项,比如deep/immediate
 */
function createWatcher(vm, expOrFn, handler, options) {
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === "string") {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options);
}
/**
 * $watch
 * expOrFn {Object|String} watch的key
 * cb {Function | Object} watch的value
 * options {Object} watch的一些选项,比如deep/immediate
 */
Vue.prototype.$watch = function (expOrFn, cb, options) {
  var vm = this;
  if (isPlainObject(cb)) {
    return createWatcher(vm, expOrFn, cb, options);
  }
  options = options || {};
  options.user = true;
  // 这里会实例化一个Watcher对象,这里很关键,Watcher会在里面进行初始化,可以看下面代码片段
  var watcher = new Watcher(vm, expOrFn, cb, options);
  // 判断选项中是否有immediate,如果有的化则立即执行一次
  if (options.immediate) {
    try {
      // 执行一次回调
      cb.call(vm, watcher.value);
    } catch (error) {
      handleError(
        error,
        vm,
        'callback for immediate watcher "' + watcher.expression + '"'
      );
    }
  }
  // Watcher执行完成之后会返回一个函数,这个函数可以让我们取消对这个属性的监听
  return function unwatchFn() {
    watcher.teardown();
  };
};

// Watcher
var Watcher = function Watcher(vm, expOrFn, cb, options, isRenderWatcher) {
  this.vm = vm;
  if (isRenderWatcher) {
    vm._watcher = this;
  }
  vm._watchers.push(this);
  // 删除一些无关代码
  if (typeof expOrFn === "function") {
    this.getter = expOrFn;
  } else {
    // 这里很关键,这里是对watch的key进行一些解析,执行完成之后返回的是一个函数
    this.getter = parsePath(expOrFn);
  }
  this.value = this.lazy ? undefined : this.get();
};

// parsePath
function parsePath(path) {
  if (bailRE.test(path)) {
    return;
  }
  var segments = path.split(".");
  /**
   * obj {Object} vue实例
   */
  return function (obj) {
    for (var i = 0; i < segments.length; i++) {
      if (!obj) {
        return;
      }
      // 这里会去访问Vue中定义的属性,那么我们知道如果我们访问vue中某个属性的时候会触发这个属性的getter,那么此时这个属性的dep依赖中就会增加这个Watcher,让我们看看下面代码段
      obj = obj[segments[i]];
    }
    return obj;
  };
}

Watcher.prototype.get = function get() {
  pushTarget(this);
  var value;
  var vm = this.vm;
  try {
    //  这里的getter就是上面Watcher初始化的parsePath返回的函数,这里传了一个vm就是vue的实例
    value = this.getter.call(vm, vm);
  } catch (e) {
    if (this.user) {
      handleError(e, vm, 'getter for watcher "' + this.expression + '"');
    } else {
      throw e;
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
  }
  return value;
};

function pushTarget(target) {
  targetStack.push(target);
  Dep.target = target; // 替换Dep.target为当前的Watcher
}

// defineReactive$$1
function defineReactive$$1(obj, key, val, customSetter, shallow) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  // ... 删除无关代码
  var childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      var value = getter ? getter.call(obj) : val;
      // 当访问一个vue的属性的时候,会触发getter
      if (Dep.target) {
        // 这里的Dep.target就是当前Watcher
        dep.depend(); // 在当前属性中把当前的Watcher收集进来,下次更新的时候就会同志它
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value;
    },
  });
}
```

### 总结

为什么数据变化的时候 Watcher 能及时知道呢?因为在实例化 Watcher 的时候,会去访问你在 Watch 里面定义的 key(也就是 vue 中的定义的属性,导致触发这个属性的 getter,从而把 Watcher 收集进了这个属性的 dep 中.下次数据变更的时候,就会通知这个 Watcher.)

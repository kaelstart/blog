## computed 源码解析

### computed 的功能是什么

官方解读: 计算属性的结果会被缓存，除非依赖的响应式 property 变化才会重新计算。注意，如果某个依赖 (比如非响应式 property) 在该实例范畴之外，则计算属性是不会被更新的. 我们可以看到 computed 的最大特嗲那就是响应式的 property 变化了才会进行重新计算,否则使用原始的值.

### 流程

```js
// initState
function initState(vm) {
  vm._watchers = [];
  var opts = vm.$options;
  //   ... 省略无关代码
  if (opts.computed) {
    // 这里判断是否有computed参数,如果有则执行
    initComputed(vm, opts.computed);
  }
}
// initComputed
function initComputed(vm, computed) {
  var watchers = (vm._computedWatchers = Object.create(null));
  for (var key in computed) {
    var userDef = computed[key];
    //  从这里我们可以看出computed中的的写法可以是对象(如果是对象则需要提供getter/setter),可以是函数
    var getter = typeof userDef === "function" ? userDef : userDef.get;
    if (getter == null) {
      warn('Getter is missing for computed property "' + key + '".', vm);
    }
    if (!isSSR) {
      // 实例化一个Watcher,你会发现不管是computed或者watch其实本质都是一个Watcher.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      );
    }

    // 这里key是否在实例上,不在的话调用defineComputed
    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    } else {
      // 如果在data中有重复的key,则会提示有重复的key
      if (key in vm.$data) {
        warn(
          'The computed property "' + key + '" is already defined in data.',
          vm
        );
        // 如果在props中有重复的key,则会提示有重复的key
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(
          'The computed property "' + key + '" is already defined as a prop.',
          vm
        );
      }
    }
  }
}
/**
 * defineComputed
 * target {Object} vue的实例对象
 * key {String} computed中定义的key
 * userDef {Function|Object} computed中的value
 */
function defineComputed(target, key, userDef) {
  var shouldCache = !isServerRendering();
  /**
   * 浏览器环境中执行createComputedGetter,这里执行完成之后返回的是一个函数,之后会被设置到getter中
   */
  if (typeof userDef === "function") {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef);
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop;
    sharedPropertyDefinition.set = userDef.set || noop;
  }
  if (sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        'Computed property "' + key + '" was assigned to but it has no setter.',
        this
      );
    };
  }
  // 然后在对这个key进行监听
  Object.defineProperty(target, key, sharedPropertyDefinition);
}
// createComputedGetter,在访问this.computed[key]的属性会触发.
function createComputedGetter(key) {
  return function computedGetter() {
    var watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      // 这里很关键,首次读取的时候dirty是true默认会去求值一次.之后如果数据没有变更的时候dirty就会一直为false,就不会进行重新求值,这就是computed有缓存的原因
      if (watcher.dirty) {
        // 这里的evaluate会调用watcher的get,也就是下面的代码段
        watcher.evaluate(); // 看以下代码段
      }
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value;
    }
  };
}
Watcher.prototype.evaluate = function evaluate() {
  this.value = this.get(); // 求值
  this.dirty = false; // 把dirty标志设为false,如果数据不变动则不会重新求值.只有在setter重新赋值的时候会再次把dirty设置为true
};

Watcher.prototype.get = function get() {
  pushTarget(this);
  var value;
  var vm = this.vm;
  try {
    value = this.getter.call(vm, vm); // 这里会调用computed中定义的getter
  } catch (e) {
    if (this.user) {
      handleError(e, vm, 'getter for watcher "' + this.expression + '"');
    } else {
      throw e;
    }
  } finally {
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
  }
  return value;
};
```

### 总结,computed 的缓存原理就是判断在 Watcher.dirty 的属性是否为 true,如果是则重新求值,否则就还是使用旧数据

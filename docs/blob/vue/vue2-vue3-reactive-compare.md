# 响应式

## 背景

我们在 `data` 中的数据是如何被 `vue` 进行劫持的,并且在更新`data`中数据的时候是如何来通知对应的的订阅者来更新数据的.今天我来通过源码来给大家介绍一下.

## vue2 流程

```js
function defineReactive$$1(obj, key, val, customSetter, shallow) {
  /**
   * 每一个属性都会实例化一个dep(相当于是一个发布者),在dep.subs中会收集订阅者.
   */
  var dep = new Dep();
  // ...删除无关代码
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      var value = getter ? getter.call(obj) : val;
      /**
       * 这里的Dep.target有三种
       * 1. 全局渲染watcher
       * 2. computed-watcher
       * 3. watch-watcher
       */
      if (Dep.target) {
        // 按照指示来阅读
        // 收集依赖
        `1.0`;
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value;
    },
    set: function reactiveSetter(newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return;
      }
      /* eslint-enable no-self-compare */
      if (customSetter) {
        customSetter();
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) {
        return;
      }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);
      `2.0`;
      /**
       * 这里我们以Dep.target = 全局渲染Watcher来说
       * 设置数据的时候通知订阅者更新
       */
      dep.notify();
    },
  });
}
```

```js
// Dep(相当于发布者)
var Dep = function Dep() {
  this.id = uid++;
  this.subs = []; // 订阅者列表
};
/**
 * 注意这里的参数dep.它这里是订阅者.
 * 我们来看1.2那里的调用dep.addSub(this);,这里的this还存在与Watcher.addDep方法当中,所以this指向Watcher也就是订阅者啦
 */
Dep.prototype.addSub = function addSub(sub) {
  `1.3`;
  /**
   * 注意这里,这里就把订阅者收集到subs依赖数组当中啦
   */
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub(sub) {
  remove(this.subs, sub);
};

Dep.prototype.depend = function depend() {
  `1.1`;
  // 这里判断的是,当前环境中是否包含上述所说的订阅者
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};
`2.1`;
Dep.prototype.notify = function notify() {
  var subs = this.subs.slice();
  if (!config.async) {
    subs.sort(function (a, b) {
      return a.id - b.id;
    });
  }
  for (var i = 0, l = subs.length; i < l; i++) {
    /**
     * 通知订阅者进行数据的更新
     * 我们可以知道subs中收集的都是一个个的Watcher,那么此时我们去找Watcher的update方法
     */
    subs[i].update();
  }
};
```

```js
// 订阅者
var Watcher = function Watcher(vm, expOrFn, cb, options, isRenderWatcher) {
  this.vm = vm;
  if (isRenderWatcher) {
    vm._watcher = this;
  }
  vm._watchers.push(this);
  // options
  if (options) {
    this.deep = !!options.deep;
    this.user = !!options.user;
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
    this.before = options.before;
  } else {
    this.deep = this.user = this.lazy = this.sync = false;
  }
  this.cb = cb;
  this.id = ++uid$2; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();
  this.newDepIds = new _Set();
  this.expression = expOrFn.toString();
  // parse expression for getter
  if (typeof expOrFn === "function") {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
    if (!this.getter) {
      this.getter = noop;
      warn(
        'Failed watching path: "' +
          expOrFn +
          '" ' +
          "Watcher only accepts simple dot-delimited paths. " +
          "For full control, use a function instead.",
        vm
      );
    }
  }
  this.value = this.lazy ? undefined : this.get();
};

/**
 * Evaluate the getter, and re-collect dependencies.
 */
Watcher.prototype.get = function get() {
  pushTarget(this);
  var value;
  var vm = this.vm;
  try {
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

/**
 * Add a dependency to this directive.
 */
/**
 * 注意这里的参数dep.它这里是观察者.
 * 我们来看1.1那里的调用Dep.target.addDep(this),这里的this还存在与Dep.depend方法当中,所以this指向Dep也就是观察者
 */
Watcher.prototype.addDep = function addDep(dep) {
  var id = dep.id;
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id);
    // 把当前的观察者收集起来
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) {
      // 观察者再收集订阅者
      // 这里的this指的是订阅者watcher
      `1.2`;
      dep.addSub(this);
    }
  }
};

/**
 * Clean up for dependency collection.
 */
Watcher.prototype.cleanupDeps = function cleanupDeps() {
  var i = this.deps.length;
  while (i--) {
    var dep = this.deps[i];
    if (!this.newDepIds.has(dep.id)) {
      dep.removeSub(this);
    }
  }
  var tmp = this.depIds;
  this.depIds = this.newDepIds;
  this.newDepIds = tmp;
  this.newDepIds.clear();
  tmp = this.deps;
  this.deps = this.newDeps;
  this.newDeps = tmp;
  this.newDeps.length = 0;
};

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 */
Watcher.prototype.update = function update() {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    /**
     * 渲染Watcher会进入到这里,后续会进行
     */
    `2.2`;
    queueWatcher(this);
  }
};

/**
 * Scheduler job interface.
 * Will be called by the scheduler.
 */
Watcher.prototype.run = function run() {
  if (this.active) {
    `2.5`;
    // 重新去求数值,这样就完成闭环了
    var value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      if (this.user) {
        try {
          this.cb.call(this.vm, value, oldValue);
        } catch (e) {
          handleError(
            e,
            this.vm,
            'callback for watcher "' + this.expression + '"'
          );
        }
      } else {
        this.cb.call(this.vm, value, oldValue);
      }
    }
  }
};

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */
Watcher.prototype.evaluate = function evaluate() {
  this.value = this.get();
  this.dirty = false;
};

/**
 * Depend on all deps collected by this watcher.
 */
Watcher.prototype.depend = function depend() {
  var i = this.deps.length;
  while (i--) {
    this.deps[i].depend();
  }
};

/**
 * Remove self from all dependencies' subscriber list.
 */
Watcher.prototype.teardown = function teardown() {
  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed.
    if (!this.vm._isBeingDestroyed) {
      remove(this.vm._watchers, this);
    }
    var i = this.deps.length;
    while (i--) {
      this.deps[i].removeSub(this);
    }
    this.active = false;
  }
};

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
      // 再nextTick中执行
      `2.3`;
      nextTick(flushSchedulerQueue);
    }
  }
}

function flushSchedulerQueue() {
  // debugger
  currentFlushTimestamp = getNow();
  flushing = true; // 把全局的flushing置为true,表示的是当前正在更新中
  var watcher, id;

  queue.sort(function (a, b) {
    return a.id - b.id;
  });

  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    /**
     * 这里是执行beforeUpdate的钩子
     */
    if (watcher.before) {
      watcher.before();
    }
    id = watcher.id;
    has[id] = null; // 这里会把全局的has里面收集的watcher的id清空,等待下次收集
    `2.4`;
    watcher.run();
    // in dev build, check and stop circular updates.
    if (has[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          "You may have an infinite update loop " +
            (watcher.user
              ? 'in watcher with expression "' + watcher.expression + '"'
              : "in a component render function."),
          watcher.vm
        );
        break;
      }
    }
  }

  // keep copies of post queues before resetting state
  var activatedQueue = activatedChildren.slice();
  var updatedQueue = queue.slice();

  resetSchedulerState();

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue);
  callUpdatedHooks(updatedQueue);

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit("flush");
  }
}
```

数据收集依赖的流程,我们可以按照数字符号的顺序来看

- 1.0 (dep.depend)收集依赖
- 1.1 (Dep.target.addDep(this)注意这里的 this 指向的是 dep(观察者))
- 1.2 (dep.addSub(this)注意这里的 this 指向的 Watcher(订阅者))
- 1.3 (this.subs.push(sub)) 观察者收集订阅者
- 这样完成了依赖着的收集

---

通知订阅者的更新

- 2.0 (dep.notify())通知订阅者更新
- 2.1 (subs[i].update())执行订阅者的 update 方法
- 2.2 (queueWatcher(this))
- 2.3 nextTick(flushSchedulerQueue) 异步更新数据
- 2.4 watcher.run() 调用订阅者的 run 方法
- 2.5 var value = this.get() (重新求值)

总结来说:vue 通过 Object.defineProperty + 观察者模式来做到响应式的

## vue3 流程

```js
// ---以下面例子讲解start---
const state = reactive({
  info: {
    name: "shadow",
  },
});
// ---end---

function reactive(target) {
  // if trying to observe a readonly proxy, return the readonly version.
  if (target && target["__v_isReadonly" /* IS_READONLY */]) {
    return target;
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers
  );
}

function createReactiveObject(
  target,
  isReadonly,
  baseHandlers,
  collectionHandlers
) {
  // 判断是否是对象
  if (!isObject(target)) {
    {
      console.warn(`value cannot be made reactive: ${String(target)}`);
    }
    return target;
  }
  // target is already a Proxy, return it.
  // exception: calling readonly() on a reactive object
  // 判断是否是已经代理过的属性
  if (
    target["__v_raw" /* RAW */] &&
    !(isReadonly && target["__v_isReactive" /* IS_REACTIVE */])
  ) {
    return target;
  }
  // target already has corresponding Proxy
  // reactive代理的属性, isReadonly = false
  const proxyMap = isReadonly ? readonlyMap : reactiveMap;
  const existingProxy = proxyMap.get(target);
  // 判断该属性是否被重复代理
  if (existingProxy) {
    return existingProxy;
  }
  /**
    case "Object":
    case "Array":
      return 1
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2 
    default:
    return 0 
  */
  const targetType = getTargetType(target);
  if (targetType === 0 /* INVALID */) {
    return target;
  }
  // 因为我们这次讲解的是对象,所以targetType = 1,所对应的是 baseHandlers = mutableHandlers
  const proxy = new Proxy(
    target,
    targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers
  );
  proxyMap.set(target, proxy);
  return proxy;
}
const get = /*#__PURE__*/ createGetter();
const set = /*#__PURE__*/ createSetter();
const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys,
};

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    // ... 删除无关代码
    const res = Reflect.get(target, key, receiver);
    if (
      isSymbol(key)
        ? builtInSymbols.has(key)
        : key === `__proto__` || key === `__v_isRef`
    ) {
      return res;
    }
    if (!isReadonly) {
      `1.0`;
      /**
       * 收集依赖
       */
      track(target, "get" /* GET */, key);
    }
    // ... 删除无关代码
    return res;
  };
}
const targetMap = new WeakMap(); // 全局变量
let activeEffect; // 全局变量
function track(target, type, key) {
  // ...删除无关代码
  /**
   * 先查看当前的target是否有设置过
   */
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // 如果没有,设置一次,key是目标对象,值是一个map集合
    targetMap.set(target, (depsMap = new Map()));
  }
  // map集合当前再去获取当前的key值
  let dep = depsMap.get(key);
  if (!dep) {
    // 如果没有设置过,则把key设置一次,值是一个set集合
    depsMap.set(key, (dep = new Set()));
  }
  /**
   * 这里的activeEffect和vue2的Watcher对象的概念类似
   * 如果当前dep也就是观察者没有收集过当前的订阅者,则进行添加
   */
  if (!dep.has(activeEffect)) {
    // 观察者收集订阅者
    `1.1`;
    dep.add(activeEffect);
    // 订阅者也收集观察者
    `1.2`;
    activeEffect.deps.push(dep);
  }
}

function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    const oldValue = target[key];
    if (!shallow) {
      value = toRaw(value);
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      }
    }
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, "add" /* ADD */, key, value);
      } else if (hasChanged(value, oldValue)) {
        `1.1`;
        trigger(target, "set" /* SET */, key, value, oldValue);
      }
    }
    return result;
  };
}

function trigger(target, type, key, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // never been tracked
    return;
  }
  const effects = new Set();
  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach((effect) => {
        if (effect !== activeEffect || effect.allowRecurse) {
          effects.add(effect);
        }
      });
    }
  };
  if (type === "clear" /* CLEAR */) {
    // collection being cleared
    // trigger all effects for target
    depsMap.forEach(add);
  } else if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === "length" || key >= newValue) {
        add(dep);
      }
    });
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      `1.2`,
        // 把当前的观察者的收集的依赖列表添加到effects中
        add(depsMap.get(key));
    }
    // 删除无关代码
  }
  const run = (effect) => {
    if (effect.options.onTrigger) {
      effect.options.onTrigger({
        effect,
        target,
        key,
        type,
        newValue,
        oldValue,
        oldTarget,
      });
    }
    if (effect.options.scheduler) {
      `1.3`;
      // 调用scheduler = queueJob
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  };
  effects.forEach(run);
}
const queue = []; // 全局属性
const resolvedPromise = Promise.resolve();
function queueJob(job) {
  // the dedupe search uses the startIndex argument of Array.includes()
  // by default the search index includes the current job that is being run
  // so it cannot recursively trigger itself again.
  // if the job is a watch() callback, the search will start with a +1 index to
  // allow it recursively trigger itself - it is the user's responsibility to
  // ensure it doesn't end up in an infinite loop.
  if (
    (!queue.length ||
      !queue.includes(
        job,
        isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex
      )) &&
    job !== currentPreFlushParentJob
  ) {
    queue.push(job);
    `1.4`;
    queueFlush();
  }
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true;
    `1.5`;
    // 和vue2中相同,调用的是Promise.resolve
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

function flushJobs(seen) {
  isFlushPending = false;
  isFlushing = true;
  {
    seen = seen || new Map();
  }
  flushPreFlushCbs(seen);
  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child so its render effect will have smaller
  //    priority number)
  // 2. If a component is unmounted during a parent component's update,
  //    its update can be skipped.
  // Jobs can never be null before flush starts, since they are only invalidated
  // during execution of another flushed job.
  queue.sort((a, b) => getId(a) - getId(b));
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job) {
        if (true) {
          checkRecursiveUpdates(seen, job);
        }
        `1.6`
        // 更新
        callWithErrorHandling(job, null, 14 /* SCHEDULER */);
      }
    }
  } finally {
    flushIndex = 0;
    queue.length = 0;
    flushPostFlushCbs(seen);
    isFlushing = false;
    currentFlushPromise = null;
    // some postFlushCb queued jobs!
    // keep flushing until it drains.
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs(seen);
    }
  }
}
```

数据收集依赖的流程,我们可以按照数字符号的顺序来看

- 1.0 track(target, "get" /_ GET _/, key) 开始收集依赖
- 1.1 dep.add(activeEffect) 观察者收集订阅者
- 1.2 activeEffect.deps.push(dep);
- 这样完成了依赖着的收集

---

通知订阅者的更新

未完待续...

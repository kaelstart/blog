# lifecycle 源码解析

## 背景

vue 的官方中有一幅 lifecycle 的图,以下:
![images](https://cn.vuejs.org/images/lifecycle.png)
我记得在学习 vue 的时候,会经常看这幅图,但是又不懂其原理.自从读了 vue2.6 的源码之后,才慢慢知道这幅图到底是什么意思了.今天我也来给大家介绍以下,这幅图中对应的源码解析.

## 流程

```js
// 首先是 new Vue()
if (!(this instanceof Vue)) {
  warn("Vue is a constructor and should be called with the `new` keyword");
}
// 这里调用了_init的方法,接下来我们看一下_init的方法
this._init(options);
```

```js
/**
 * _init方法,删除了一些无关代码的逻辑
 */
Vue.prototype._init = function (options) {
  var vm = this;
  // a uid
  vm._uid = uid$3++;

  var startTag, endTag;

  // a flag to avoid this being observed
  vm._isVue = true;
  vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
  );
  /* istanbul ignore else */
  {
    initProxy(vm);
  }
  // expose real self
  vm._self = vm;
  /**
   * 我们可以看到上面的那幅图当中,首先第一步是一些Events&Lifecycle的一些初始化
   * 那么也就是下面的initLifecycle和initEvents,我们简单的来看下initLifecycle和initEvents做了一些什么
   */
  initLifecycle(vm);
  initEvents(vm);
  initRender(vm);
  /**
   * 上面的initLifecycle和initEvents初始化之后就到了,beforeCreate的生命周期了,到这里为止,我们是不是还没看到一些data,props的初始化呢?是的,这个时候还没进行一些data,props等的初始化,所以我们在beforeCreate阶段是访问不了data重的属性的.接着我们往下看
   */
  callHook(vm, "beforeCreate");
  /**
   * 然后我们在图中可以看到,接下来是一些injections和reactivity
   * 先介绍initInjections
   */
  initInjections(vm); // resolve injections before data/props
  /**
   * 然后initState,这里是重头戏,initState主要做一些props,methods,data,computed,watch的一些初始化
   */
  initState(vm);
  initProvide(vm); // resolve provide after data/props
  /**
   * 接下来就到生命周期created阶段了,那么到了created阶段之后,props,methods,data,computed,watch这些属性都已经被初始化完毕了,那么我们就可以在这个阶段访问这些属性了
   */
  callHook(vm, "created");

  if (vm.$options.el) {
    /**
     * 接下来就到mount阶段了
     */
    vm.$mount(vm.$options.el);
  }
};

// initLifecycle,主要做了一些属性的初始化,比如$refs,$children等.
function initLifecycle(vm) {
  var options = vm.$options;

  // locate first non-abstract parent
  var parent = options.parent;
  if (parent && !options.abstract) {
    // 这里是判断,如果是有父组件,并且父组件不是抽象组件的(keep-alive)这些,就会往这个父组件.$children把当前子组件的实例推进去
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm);
  }

  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;

  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}
// initEvents
function initEvents(vm) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}
// initInjections,做一些provide,inject的初始化
function initInjections(vm) {
  var result = resolveInject(vm.$options.inject, vm);
  if (result) {
    toggleObserving(false);
    Object.keys(result).forEach(function (key) {
      {
        defineReactive$$1(vm, key, result[key], function () {
          warn(
            "Avoid mutating an injected value directly since the changes will be " +
              "overwritten whenever the provided component re-renders. " +
              'injection being mutated: "' +
              key +
              '"',
            vm
          );
        });
      }
    });
    toggleObserving(true);
  }
}

/**
 * initState
 * 我们可以看到initState主要做一些props,methods,data,computed,watch的一些初始化
 */
function initState(vm) {
  vm._watchers = [];
  var opts = vm.$options;
  if (opts.props) {
    initProps(vm, opts.props);
  } // 这里一开始是props先开始初始化
  if (opts.methods) {
    initMethods(vm, opts.methods);
  }
  if (opts.data) {
    // data是比props初始化的,所以可以在data中使用props里面的属性值.this.props.xxx
    initData(vm);
  } else {
    observe((vm._data = {}), true /* asRootData */);
  }
  if (opts.computed) {
    initComputed(vm, opts.computed);
  }
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}
```

```js
// mount阶段
Vue.prototype.$mount = function (el, hydrating) {
  /**
   * 先判断是否有el存在
   */
  el = el && query(el);

  var options = this.$options;
  /**
   * 看是否有提供render函数,如果没有,但有提供template模版,则把template模版转换成render函数字符串
   */
  if (!options.render) {
    var template = options.template;
    if (template) {
      if (typeof template === "string") {
        if (template.charAt(0) === "#") {
          template = idToTemplate(template);
          /* istanbul ignore if */
          if (!template) {
            warn(
              "Template element not found or is empty: " + options.template,
              this
            );
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML;
      } else {
        {
          warn("invalid template option:" + template, this);
        }
        return this;
      }
    } else if (el) {
      /**
       * 如果没有template模版,则拿el获取template模版
       */
      template = getOuterHTML(el);
    }
    if (template) {
      /**
       * 这里生成的是render函数
       */
      var ref = compileToFunctions(
        template,
        {
          outputSourceRange: "development" !== "production",
          shouldDecodeNewlines: shouldDecodeNewlines,
          shouldDecodeNewlinesForHref: shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments,
        },
        this
      );
      var render = ref.render;
      var staticRenderFns = ref.staticRenderFns;
      options.render = render;
      options.staticRenderFns = staticRenderFns;
    }
  }
  // 到下面的mount阶段
  return mount.call(this, el, hydrating);
};

Vue.prototype.$mount = function (el, hydrating) {
  el = el && inBrowser ? query(el) : undefined;
  return mountComponent(this, el, hydrating);
};

function mountComponent(vm, el, hydrating) {
  vm.$el = el;
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode;
    {
      /* istanbul ignore if */
      if (
        (vm.$options.template && vm.$options.template.charAt(0) !== "#") ||
        vm.$options.el ||
        el
      ) {
        warn(
          "You are using the runtime-only build of Vue where the template " +
            "compiler is not available. Either pre-compile the templates into " +
            "render functions, or use the compiler-included build.",
          vm
        );
      } else {
        warn(
          "Failed to mount component: template or render function not defined.",
          vm
        );
      }
    }
  }
  /**
   * 到了beforeMount阶段,beforeMount之前主要是做这些事情
   * 是否有提供render函数,如果有就直接使用
   * 如果没有,则把template模版编译成render函数
   */
  callHook(vm, "beforeMount");
  var updateComponent;
  updateComponent = function () {
    /**
     * 接下来就是拿到render函数生成的vnode,在调用update函数把vnode进行一些diff比较,最后生成节点
     */
    vm._update(vm._render(), hydrating);
  };
  /**
   * 这个是全局的而渲染函数watcher,主要的作用是更新模板的变化.
   * 上面的updateComponent -> 等于在defineReactive$$1里面的getters,求值的时候会有用到.
   */
  new Watcher(
    vm,
    updateComponent,
    noop,
    {
      before: function before() {
        // 这里的before相当于beforeUpdate
        if (vm._isMounted && !vm._isDestroyed) {
          callHook(vm, "beforeUpdate");
        }
      },
    },
    true /* isRenderWatcher */
  );
  hydrating = false;
  if (vm.$vnode == null) {
    /**
     * 经历了上面的遍历阶段之后,此时节点都已经生成更新好了,接下来就到了mounted阶段了,这里你就可以访问dom了
     */
    vm._isMounted = true;
    callHook(vm, "mounted");
  }
  return vm;
}
```

```js
/**
 * 接下来是update阶段,这里简略介绍,就拿data中的数据劫持来说.
 * 当数据变化的时候就会去通知订阅者更新更新变化,从而达到更新的效果
 */
function defineReactive$$1(obj, key, val, customSetter, shallow) {
  // 每一个属性都会初始化一个观察者对象
  var dep = new Dep();
  //   ... 删除部分代码
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      var value = getter ? getter.call(obj) : val;
      /**
       * 这里的Dep.target是代表当前的Watcher是谁
       * Vue中有三种Watcher
       * 1. 渲染模版 Watcher
       * 2. Computed Watcher
       * 3. Watch Watcher
       */
      if (Dep.target) {
        // 这里是观察者把当前的Watcher收集进自己的订阅数组也就是subs当中,当需要更新数据的时候,就会把遍历该subs进行一些数据的更新
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
      /**
       * 当设置一个属性的时候,this.test = 'xxx',这里就会去通知它的订阅者进行数据的更新
       */
      dep.notify();
    },
  });
}
// notify
Dep.prototype.notify = function notify() {
  // stabilize the subscriber list first
  var subs = this.subs.slice();
  if (!config.async) {
    // subs aren't sorted in scheduler if not running async
    // we need to sort them now to make sure they fire in correct
    // order
    subs.sort(function (a, b) {
      return a.id - b.id;
    });
  }
  for (var i = 0, l = subs.length; i < l; i++) {
    //  这里的update是Watcher的update
    subs[i].update();
  }
};

Watcher.prototype.update = function update() {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);
  }
};
```

## 总结

根据上面的解析,我们大致可以这样总结:
1. 在 beforeCreate 之前主要做一些 Events 和 lifecycle 的初始化,然后在到生命周期的 beforeCreate,在这个阶段因为还没有进行数据的初始化,所以我们还不能访问数据.
2. 在beforeCreate和created阶段,主要做一些data,props,method,computed,watch的一些初始化,所以到了created阶段,数据都初始化完毕了,我们可以在这个阶段访问数据了
3. 在created和beforeMount阶段,主要看是否有render函数,如果有则直接使用,否则拿template模版去生成render函数字符串(这些事vue-loader做的一些事情)
4. 在beforeMount和mounted阶段,主要调用render函数生成的vnode,然后把把vnode作为调用_update函数的参数进行dom节点的生成.所以在mount阶段我们就可以访问真实的Dom节点了
5. 在更新阶段,通过数据的劫持的setter,通知该属性(也就是当前的观察者)的订阅者进行更新
## mixin 源码解析

mixin 的功能是什么
官方解读: 混入 (mixin) 提供了一种非常灵活的方式，来分发 Vue 组件中的可复用功能。一个混入对象可以包含任意组件选项。当组件使用混入对象时，所有混入对象的选项将被“混合”进入该组件本身的选项。

流程

```js
/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
function mergeOptions(parent, child, vm) {
  // ... 删除无关代码
  if (!child._base) {
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm);
    }
    if (child.mixins) {
      for (var i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm);
      }
    }
  }

  var options = {};
  var key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField(key) {
    /*
     * 这里会去定义的strat中找到是否有已经定义的合并策略,如果没有,则使用默认的合并策略
     */
    var strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options;
}

// 默认合并策略
var strats = config.optionMergeStrategies; // 全局配置的合并策略

/**
 * Options with restrictions
 */
{
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        'option "' +
          key +
          '" can only be used during instance ' +
          "creation with the `new` keyword."
      );
    }
    return defaultStrat(parent, child);
  };
}

strats.data = function (parentVal, childVal, vm) {
  if (!vm) {
    if (childVal && typeof childVal !== "function") {
      warn(
        'The "data" option should be a function ' +
          "that returns a per-instance value in component " +
          "definitions.",
        vm
      );

      return parentVal;
    }
    return mergeDataOrFn(parentVal, childVal);
  }

  return mergeDataOrFn(parentVal, childVal, vm);
};
/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function (parentVal, childVal, vm, key) {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) {
    parentVal = undefined;
  }
  if (childVal === nativeWatch) {
    childVal = undefined;
  }
  /* istanbul ignore if */
  if (!childVal) {
    return Object.create(parentVal || null);
  }
  {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) {
    return childVal;
  }
  var ret = {};
  extend(ret, parentVal);
  for (var key$1 in childVal) {
    var parent = ret[key$1];
    var child = childVal[key$1];
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }
    ret[key$1] = parent
      ? parent.concat(child)
      : Array.isArray(child)
      ? child
      : [child];
  }
  return ret;
};

/**
 * Other object hashes.
 */
strats.props =
  strats.methods =
  strats.inject =
  strats.computed =
    function (parentVal, childVal, vm, key) {
      if (childVal && "development" !== "production") {
        assertObjectType(key, childVal, vm);
      }
      if (!parentVal) {
        return childVal;
      }
      var ret = Object.create(null);
      extend(ret, parentVal);
      if (childVal) {
        extend(ret, childVal);
      }
      return ret;
    };
strats.provide = mergeDataOrFn;

/**
 * 默认合并策略
 */
var defaultStrat = function (parentVal, childVal) {
  return childVal === undefined ? parentVal : childVal;
};
```

## data 混入策略

```js
strats.data = function (parentVal, childVal, vm) {
  if (!vm) {
    if (childVal && typeof childVal !== "function") {
      warn(
        'The "data" option should be a function ' +
          "that returns a per-instance value in component " +
          "definitions.",
        vm
      );

      return parentVal;
    }
    return mergeDataOrFn(parentVal, childVal);
  }

  return mergeDataOrFn(parentVal, childVal, vm);
};
/**
 * Data合并策略
 */
function mergeDataOrFn(parentVal, childVal, vm) {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal;
    }
    if (!parentVal) {
      return childVal;
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn() {
      return mergeData(
        typeof childVal === "function" ? childVal.call(this, this) : childVal,
        typeof parentVal === "function" ? parentVal.call(this, this) : parentVal
      );
    };
  } else {
    return function mergedInstanceDataFn() {
      // instance merge
      var instanceData =
        typeof childVal === "function" ? childVal.call(vm, vm) : childVal;
      var defaultData =
        typeof parentVal === "function" ? parentVal.call(vm, vm) : parentVal;
      if (instanceData) {
        return mergeData(instanceData, defaultData);
      } else {
        return defaultData;
      }
    };
  }
}
/**
 * 数据合并处理
 */
function mergeData(to, from) {
  if (!from) {
    return to;
  }
  var key, toVal, fromVal;

  var keys = hasSymbol ? Reflect.ownKeys(from) : Object.keys(from);

  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    // in case the object is already observed...
    if (key === "__ob__") {
      continue;
    }
    toVal = to[key];
    fromVal = from[key];
    // 判断to里面有没from的key,如果没有,则调用$set进行设置
    if (!hasOwn(to, key)) {
      set(to, key, fromVal);
    } else if (
      // 如果to中存在该key,并且两个属性都不相同,并且他们都是对象,则递归判断,并把from中的key(不存在to中),添加到to.
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      mergeData(toVal, fromVal);
    }
  }
  return to;
}

function set(target, key, val) {
  if (isUndef(target) || isPrimitive(target)) {
    warn(
      "Cannot set reactive property on undefined, null, or primitive value: " +
        target
    );
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val;
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val;
  }
  var ob = target.__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    warn(
      "Avoid adding reactive properties to a Vue instance or its root $data " +
        "at runtime - declare it upfront in the data option."
    );
    return val;
  }
  if (!ob) {
    target[key] = val;
    return val;
  }
  defineReactive$$1(ob.value, key, val);
  ob.dep.notify();
  return val;
}
```

总结来说 data 数据合并的策略是.

1. 如果 to 中不存在 from 的 key,那么直接把该 key 通过$set 设置到 to 上.如果 key 值存在,则使用原来的值,不进行覆盖.
2. 再判断这个 key 对应的值是对象,并且两个值不相等,则递归进行第一步的处理.
   也就是

```js
// to:
data() {
  return {
    origin: {
      obj: {
        a:1
      }
    }
  }
}
// from
data() {
  return {
    mixin: {
      obj: {
        a:1,
        b:2
      },
      c:'mixin'
    }
  }
}
// 两个合并之后变成
data() {
  return {
    obj: {
      a:1,
      b:2
    },
    c:'mixin'
  }
}
```

## watch 混入策略

```js
strats.watch = function (parentVal, childVal, vm, key) {
  // ...删除无关代码
  if (!parentVal) {
    // 如果parentVal不存在,则直接返回childVal
    return childVal;
  }
  var ret = {};
  extend(ret, parentVal);
  for (var key$1 in childVal) {
    var parent = ret[key$1];
    var child = childVal[key$1];
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }
    // 这里可以看到,是直接用parentVal.concat(childVal),也就是把watch通过一个数组链接起来,而不是覆盖.即使是有两个相同的watch对象
    ret[key$1] = parent
      ? parent.concat(child)
      : Array.isArray(child)
      ? child
      : [child];
  }
  return ret;
};
```

总结来说 watch 的合并策略是

1. 先判断 parentVal 是否存在,不存在的话直接返回 childVal
2. 如果 parentVal 存在,则把 childVal 推进以 parentVal 的数组当中.

例子

```js
data() {
  return {
    count:1
  }
},
// parentVal
mixin: {
  watch: {
    count(newVal) {
      console.log('mixin',newVal)
    }
  }
}
// childVal
origin: {
  watch: {
    count(newVal) {
      console.log('origin',newVal)
    }
  }
}
// 最终变成
watch: {
  count: [
  function(newVal) {
      console.log('mixin',newVal)
    },
  function(newVal) {
      console.log('origin',newVal)
    }
]
}
```

## props,methods,inject,computed 的合并策略

```js
strats.props =
  strats.methods =
  strats.inject =
  strats.computed =
    function (parentVal, childVal, vm, key) {
      if (childVal && "development" !== "production") {
        assertObjectType(key, childVal, vm);
      }
      if (!parentVal) {
        // 如果parentVal不存在,则直接返回childVal
        return childVal;
      }
      var ret = Object.create(null);
      // 如果parentVal存在,则拷贝一份parentVal
      extend(ret, parentVal);
      if (childVal) {
        // 如果childVal,则在再次覆盖parentVal已经有的数据,默认使用的是childVal,也就是本身的.
        extend(ret, childVal);
      }
      return ret;
    };
```

总结来说, props,methods,inject,computed

1. 先判断 parentVal 是否存在,不存在直接使用 childVal,也就是本身的值.
2. 如果 parentVal 存在,并且 childVal 也存在,此时把 childVal 覆盖 parentVal 的值,也就是默认是以组件本身的数据为准
   例子

```js
data() {
  return {
    count:1
  }
},
// parentVal
mixin: {
  computed: {
    getCount() {
      return this.count + 10
    }
  }
}
// childVal
origin: {
  computed: {
    getCount() {
      return this.count + 10
    }
  }
}
// 最终变成
computed: {
  getCount() {
    return this.count + 10
  }
}
```

## 生命周期的合并策略

```js
var LIFECYCLE_HOOKS = [
  "beforeCreate",
  "created",
  "beforeMount",
  "mounted",
  "beforeUpdate",
  "updated",
  "beforeDestroy",
  "destroyed",
  "activated",
  "deactivated",
  "errorCaptured",
  "serverPrefetch",
];
LIFECYCLE_HOOKS.forEach(function (hook) {
  strats[hook] = mergeHook;
});
function mergeHook(parentVal, childVal) {
  // 这里的意思是先判断childVal是否有值,如果没有则使用parentVal.
  // 再判断parentVal有值的情况,parentVal有值则直接把childVal推进数组当中,不进行覆盖.
  var res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
      ? childVal
      : [childVal]
    : parentVal;
  return res ? dedupeHooks(res) : res;
}
```

总结 生命周期的策略是

1. 先判断 childVal 是否有值,如果没有,则直接使用 parentVal 的
2. 再判断 parentVal 的情况,如果 parentVal 有值,则直接把 childVal 推进数组当中,不进行覆盖.
   例子

```js
// parentVal
mixin: {
  mounted() {
    console.log('mixin-mounted')
  }
}
// childVal
origin: {
  mounted() {
    console.log('origin-mounted')
  }
}
// 最终变成
[
  mounted() {
    console.log('mixin-mounted')
  },
  mounted() {
    console.log('origin-mounted')
  }
]
```

## component,directive,filter 的合并策略

```js
var ASSET_TYPES = ["component", "directive", "filter"];
function mergeAssets(parentVal, childVal, vm, key) {
  // 先拷贝一份parentVal
  var res = Object.create(parentVal || null);
  if (childVal) {
    assertObjectType(key, childVal, vm);
    // 如果childVal,则把原值也就是childVal覆盖parentVal.
    return extend(res, childVal);
  } else {
    return res;
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + "s"] = mergeAssets;
});
```

总结 component,directive,filter 的合并策略

1. 先判断 childVal 是否有值,如果没有,则直接使用 parentVal 的
2. 再判断 parentVal 的情况,如果 parentVal 有值,先拷贝一份,然后在把组件原值也就是 childVal 覆盖 parentVal 的值.

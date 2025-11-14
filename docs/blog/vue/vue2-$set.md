## $set 源码解析

### $set 的功能是什么

官方解读: 向响应式对象中添加一个 property，并确保这个新 property 同样是响应式的，且触发视图更新。它必须用于向响应式对象上添加新 property，因为 Vue 无法探测普通的新增 property (比如 this.myObject.newProperty = 'hi')

### 流程

```js
/**
 * target {Object | Array} 目标对象
 * key {string | number} 设置键值
 * val {any} 值
 */
function set(target, key, val) {
  if (isUndef(target) || isPrimitive(target)) {
    warn(
      "Cannot set reactive property on undefined, null, or primitive value: " +
        target
    );
  }
  // 如果是数组,则会进到这里.因为vue对数组的一些方法进行了重写,所以在下面的splice的时候会触发属性的setter
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val;
  }
  // 如果当前设置的key已经存在了并且不在Object的原型上,则会直接设置,并会触发属性的setter
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
  // 重新监听这个新的属性
  defineReactive$$1(ob.value, key, val);
  // 调用notify,通知dep中的依赖,然后进行更新
  ob.dep.notify();
  return val;
}

// defineReactive$$1
function defineReactive$$1(obj, key, val, customSetter, shallow) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return;
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }

  var childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      // debugger;
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
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
      dep.notify();
    },
  });
}
```

### 总结,$set 就是给目标对象设置一个新的 key/value,并触发视图的更新,并把最后更新的值返回

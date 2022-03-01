## 背景
最近接到一个新需求,需求是给项目当中的 Element.Button 组件在点击的时候增加 loading 效果.此时我心想一个页面这么多按钮,我肯定不能一个个给页面按钮增加 loading 属性(需要在 data 中声明属性,并且在组件中使用:loading="data 中声明的属性值"),这样的操作太过繁琐.我能不能扩展 Element.Button 组件,让组件在不影响之前内容的情况下,额外增加一个 props,自动帮我完成这件事情呢?

### 思路

首先我们来查看引入 Element.Button 的组件打印出来的是什么

```js
import { Button } from "element-ui";
console.log(Button);
```

打印如下内容
![](https://fastdfs-cloud.test.pagoda.com.cn/29/34131644478541554/1644478541184.png)
我们可以看到,Button 里面的内容有很多,比如组件中声明的 computed,methods,props 等等.那么我们能不能在这些属性中做一些改变呢?答案肯定是可以的.
现在我们需要给 Button 增加一个 props 属性为 load,然后劫持 Button 的点击事件,如果有 load 属性的时候,我们就给 Button 增加 loading 效果.

### Element.Button 的部分源码

```html
<template>
  <button
    class="el-button"
    @click="handleClick"
    :disabled="buttonDisabled || loading"
    :autofocus="autofocus"
    :type="nativeType"
    :class="[
      type ? 'el-button--' + type : '',
      buttonSize ? 'el-button--' + buttonSize : '',
      {
        'is-disabled': buttonDisabled,
        'is-loading': loading,
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle
      }
    ]"
  >
    <i class="el-icon-loading" v-if="loading"></i>
    <i :class="icon" v-if="icon && !loading"></i>
    <span v-if="$slots.default"><slot></slot></span>
  </button>
</template>
```

```js
export default {
  props: {
    loading: Boolean,
  },

  methods: {
    handleClick(evt) {
      this.$emit("click", evt);
    },
  },
};
```

根据源码我们可以看到要想给 Button 组件增加 loading,关键的是给 props.loading = true,这样我们就可以让它在点击的时候自动 loading.这里的关键是我们应该如果在不影响原来已经使用了 loading=true 的组件,并给扩展它的属性.这个时候我就想能不能我直接把原来的 props.loading 直接删除,让它存在于$attrs中,然后增加一个computed.loading属性,这个属性合并了我的props.load和原来的$attrs.loading 属性

### 代码

```js
// 增加自定义属性
if (Button.data) {
  const originData = Button.data();
  Button.data = function () {
    return {
      ...originData,
      extendLoading: false,
    };
  };
} else {
  Button.data = function () {
    return {
      extendLoading: false,
    };
  };
}
// 增加自定义属性
Button.props.load = {
  type: Boolean,
  default: false,
};
// 删除props.loading让它存在于$attrs中
delete Button.props.loading;
// 增加computed.loading
Button.computed.loading = {
  get() {
    // 这里根据自己添加的自定义属性和原来的props条件判断
    return (this.load && this.extendLoading) || this.$attrs.loading;
  },
  set() {
    this.extendLoading = false;
  },
};
// 劫持或者直接覆盖Button.click事件,其实劫持也可以,但是我这里直接做覆盖了.
Button.methods.handleClick = function (evt) {
  // 声明了load的属性自动给他添加loading效果,然后通过事件回调的方式来取消loading.
  if (this.load) {
    this.extendLoading = true;
    const done = () => (this.extendLoading = false);
    this.$emit("click", done, evt);
    return;
  }
  this.$emit("click", evt);
};
```

### 在业务中使用

```js
// 改进前
<el-button :loading=“data中声明的属性” @click=“handleClick”>嘻嘻</el-button>
// 改进后
<el-button load @click=“handleClick”>嘻嘻</el-button>
export default {
  methods: {
    handleClick(done) {
      //...业务代码
      //完成时调用或者直接不调用也行
      done()
    }
  }
}
```
# 总结
这样的好处是,不需要这样我们就不用单独在页面中声明一个属性然后赋值给loading了,只需要Button组件内部自己处理完成就好.以上内容如有错误,请大佬可以指出.
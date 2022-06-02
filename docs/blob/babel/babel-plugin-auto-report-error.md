## babel-plugin-remove-module

## 背景

有些老项目线上出现问题不好定位,外加一些 catch 中的错误没有及时抛出来给开发者进行定位.所以我想开发一个 babel 插件可以注入上报错误的函数,便于我们进行错误的定位和解决.

继上篇写了一个可以移除不同环境代码的 babel 插件之后,这次写了一个可以自动在`try catch` / `promise catch` 的 catch 函数体中插入你想插入的函数.(比如做一些上报错误日志的函数/打印错误日志的函数...).

## 用法

```javascript
// babel.config.js
{
  "plugins": [["babel-plugin-auto-report-error", {
        // 插入函数的表达式
        reportExpression: "window.report", // require default = ''
        // 是否插入try catch 中的错误
        reportTryCatch: true, // default = true
        // 是否插入promise catch中的错误
        reportPromiseCatch: true, // default = true
        // 是否自动填充缺少参数的catch的函数
        autoFillParams: true, // default = true
        // 排除哪些文件
        exclude: ["node_modules"], // default = ['node_modules']
        // 需要包含哪些文件
        include: [], // default = []
  }]]
}

```

## 难点

### 难点 1: try catch / promise catch 回调的函数中,可能存在以下几种情况

有参数 / 有参数且参数被解构的情况 / 无参数

```javascript
Promise.resolve().catch((error) => {});
Promise.resolve().catch(({ message }) => {});
Promise.resolve().catch(() => {});
```

### 难点 2: 在 catch 回调函数体中,已经存在了需要插件的表达式,如何不进行重复插入

```javascript
Promise.resolve().catch((error) => {
  window.report(error);
});
```

### 难点 3: 如何在某些 catch 的回调函数体中不自动插入表达式

例如

```js
Promise.resolve().catch((error) => {
  // 通过注释可以告诉插件,我这里不需要注入函数
  /* report-disabled */
  console.log("收到promise中的错误", error);
});
```

## 解决

### 解决 1

1. 有参数 `Promise.resolve().catch(error => {})`
   在遍历途中把当前节点的 path.node.handler.param.name 直接赋予我们的插入函数中
   
2. 没参数 `Promise.resolve().catch(() => {})`
   在遍历途中如果当前节点的 path.node.handler.param 不存在,此时我们需要构造一个 ast 节点,并把这个节点赋予 path.node.handler.param,然后再赋予我们的插入函数中
   
3. 有参数并且参数被解构了 Promise.resolve().catch(({message}) => {})
   这种情况比较难处理,应该解构的层级可能会存在很深的情况.可以通过[ast](https://astexplorer.net/)网站来查看每个节点信息排列情况.可以看下图
   原节点:
   ![images](https://i.bmp.ovh/imgs/2022/06/01/6c0000a6e22109e7.png)
   节点 ast:
   ![images](https://i.bmp.ovh/imgs/2022/06/01/a8a9d749f9387ddb.png)
   我们可以通过 ast 节点排列可以看到,它的复杂度取决与你的解构深度.并且解构出来的属性值哪个是用来作为你的上报的 error 信息,我们也是无从而知的.所以我这边如果需要参数是解构的情况就暂时跳过处理了.

### 解决 2

如果 catch 的回调函数中,已经声明了需要插入的表达式,如何不进行重复插入.我的处理方法是先把当前的 ast 节点先转换(generate)生成对应的原代码字符串
比如:
原:

```js
{
  try {
  } catch {
    console.log("我是没有参数的catch");
    const a = 10;
    const b = 11;
    const c = 12;
    window.report("已经存在的情况");
  }
}
```

ast:
![images](https://i.bmp.ovh/imgs/2022/06/01/55e7ee2ddf4d675b.png)
generate:
![images](https://i.bmp.ovh/imgs/2022/06/01/d4c5dc93f2bf06bf.png)
再然后通`\n`来进行切割生成 list.再通过遍历 list 中是否包含需要插入的表达式.有人可能会问为什么不直接判断字符串中是否包含这个表达式,这样是不是更加容易点. 这个是因为如果直接通过字符串去判断的话,无法判断这个表达式是否已经被注释了,也就是 `// window.report("已经存在的情况")`这种情况,所以我这边没选择用字符串来判断.(如果有更好的方法可以探讨一下)

### 解决 3

如何选择性告诉插件,当前的 catch 函数体不要自动插入表达式. 又回到我第一期介绍的功能了,我这边是通过注释的方式来实现的.如果函数体中写下了注释,我这边就会跳过处理,例如:

```js
{
  try {
  } catch {
    /* report-disabled */
  }
}
{
  try {
  } catch {
    /* report-disabled */
    const name = "shadow";
  }
}
```

以上通过注释之后就不会再插入表达式了.
在做这个的时候也遇到一个问题,注释在 babel 中有几种形式.比如

- leadingComments: 开始的注释
- innerComments: 中间的注释
- trailingComment:： 结尾的注释

如果函数体中没有内容,只有注释,此时的注释为 innerComments,如下图:
![images](https://i.bmp.ovh/imgs/2022/06/01/a2a65b2e48ae3e40.png)
如果函数体中有内容,也有注释,并且注释在开头,此时的注释为 leadingComments
![images](https://i.bmp.ovh/imgs/2022/06/01/0f56d775bfb1571c.png),
我这边也做了区分.只做了 leadingComments 和 innerComments 的判断.如果回调函数体中有`/* report-disabled */` 那么此时也不会进行插入.

## 例子

```javascript
// config
{
  "plugins": [["babel-plugin-auto-report-error", {
    reportExpression: "window.report",
  }]]
}

// origin
const input = `
    try {
    } catch {
      console.log("我是没有参数的catch");
    }
`;

TO:

const output = `
    try {
    } catch(error) {
      console.log("我是没有参数的catch");
      window.report(error)
    }
`;

```

## 总结

通过这个插件,让我对 babel 的使用又有更进一步的提升.

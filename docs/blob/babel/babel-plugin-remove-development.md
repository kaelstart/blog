## 什么是 babel

Babel 是一个 JavaScript 编译器.Babel 是一个工具链，可以用于将 ECMAScript 2015+ 语法编写的代码转换为向后兼容的 JavaScript 语法，以便能够运行在当前和旧版本的浏览器或其他环境中
下面大致列出的是 Babel 能为你做的事情: 1.语法转换 2.通过 Polyfill 方式在目标环境中添加缺失的特性 3.源码转换

比如我们用 vuecli 生成的项目,默认都是配置好一些开箱即用的插件(比如@vue/babel-preset-app),所以我们可以写很多一些新语法. 比如 ?. (可选链操作符) ?? (空值合并操作符) ...  
babel 是如何转换代码的

### babel 转换代码大致过程有三步
1. parse

源代码 code -> ast
这里有两个步骤
词法分析和语法分析
词法分析:就是把字符串形式的代码转换为令牌(tokens)流.也就是类似于下面的这种形式
源码:const code = 'hello babel'
[
{type: {...}, value: "const"},
{type: {...}, value: "code"},
{type: {...}, value: "="},
{type: {...}, value: "hello babel"},
]

语法分析:就是把令牌(tokens)流转换成 ast 的形式.

Babel 的 parser 是基于 acorn 实现的.Babel 是基于 esTree 标准并且 Babel 基于 acorn 插件对 estree 的 ast 进行了一些扩展.从转换后的 ast 可以看出,代码被转换后会呈现出一个 tree 结构.每一层级都清晰了描述了代码的位置结构.然后每一层级中都有 type 属性,它告诉我们当前的节点是什么类型.
在转换成 ast 的代码中,会出现很多节点类型,如果想要了解它们可以查看 babel 官网的说明@babel/types.它可以创建和判断 AST 节点.
简单的介绍一些比较常用的类型说明
VariableDeclaration（变量声明）var a = 10;
FunctionDeclaration（函数声明）function fn() {}
FunctionExpression（函数表达式）var fn = function() {}
CallExpression（调用表达式）fn()
MemberExpression（成员表达式）user.name
BlockStatement（块）{}
Identifier（变量标识符）var a(a 就是 Identifier)
...

在 parse 阶段我们可以使用 babel 提供的工具@babel/parser,来对代码进行解析进而生成 ast

---

2. transform:

对 ast 进行增删改...的操作

transform 阶段可以使用 babel 提供的工具@babel/traverse,这个主要是对 ast 进行遍历,遍历过程中会提供一些特定节点类型的回调函数提供给用户.
然后我们就可以操作对应节点类型的 ast,从而来修改代码.

---

3. generate:

将 ast 重新生成回源代码
generate 阶段可以使用 babel 提供的工具@babel/generator.

babel 也提供了@babel/core,这个插件包含了很多插件在内,包括上面说的三个插件.

ast 结构的简单讲解

在线转 ast 工具
本次演示工具所对应的版本

```js
"@babel/parser": "^7.14.4"
"@babel/traverse": "^7.14.2"
"@babel/generator": "^7.14.3"
"@babel/types": "^7.14.4"
```

源代码

```js
const parser = require("@babel/parser");
const sourceCode = `
   const code = 'hello babel'
`;
const ast = parser.parse(sourceCode);

转换成 ast 后

{
  "program": {
    "type": "Program", // 程序根节点
    "start": 0,
    "end": 27,
    "loc": {
      "start": {
        "line": 1,
        "column": 0
      },
      "end": {
        "line": 1,
        "column": 27
      }
    },
    "body": [ // 程序体
      {
        "type": "VariableDeclaration", // 变量声明
        "declarations": [
          {
            "type": "VariableDeclarator", // 变量声明描述
            "start": 7,
            "end": 27,
            "loc": {
              "start": {
                "line": 1,
                "column": 7
              },
              "end": {
                "line": 1,
                "column": 27
              }
            },
            "id": {
              "type": "Identifier", // 标识符
              "start": 7,
              "end": 11,
              "loc": {
                "start": {
                  "line": 1,
                  "column": 7
                },
                "end": {
                  "line": 1,
                  "column": 11
                },
                "identifierName": "code" // 变量名
              },
              "name": "code"
            },
            "init": {
              "type": "StringLiteral", // 字符串字面量
              "start": 14,
              "end": 27,
              "loc": {
                "start": {
                  "line": 1,
                  "column": 14
                },
                "end": {
                  "line": 1,
                  "column": 27
                }
              },
              "extra": {
                "rawValue": "hello babel",
                "raw": "'hello babel'"
              },
              "value": "hello babel" // 值
            }
          }
        ],
        "kind": "const" // 变量声明的关键字
      }
    ],
  },
}
```

每个节点属性中都有一些公共的属性,比如 type(类型),start(开始下标),end(结束下标),loc(记录开始和结束行列号)...

从上面的结构中,删除一些无用的信息之后,我们的 tree 节点结构大致是这样的
-VariableDeclaration
-VariableDeclarator
-Identifier
-Literal

ast 的遍历过程大致是这样的

- 进入(enter) VariableDeclaration
  - 进入(enter) VariableDeclarator
    - 进入(enter) Identifier
      走完
    - 退出(exit) Identifier
    - 进入(enter) Literal
      走完
    - 退出(exit) Literal
  - 退出(exit) VariableDeclarator
- 退出(exit) VariableDeclaration
  从上面的遍历过程你可以看出,一个节点遍历可以分为进入和离开两个阶段,
  那么 babel 也是提供了这两个时机的回调函数给我们使用,分别是 enter 和 exit,
  还有其它的回调函数,但是这里就不介绍了,感兴趣的大佬可以自行查看 babel 的介绍.

demo

转换成箭头函数

```js
const sourceCode = `
const fn = function () {
  return "hello babel";
}
`;

{
  "program": {
    "type": "Program", // 程序体
    "start": 0,
    "end": 47,
    "loc": {
      "start": {
        "line": 1,
        "column": 0
      },
      "end": {
        "line": 3,
        "column": 1
      }
    },
    "body": [
      {
        "type": "VariableDeclaration", // 变量声明
        "start": 0,
        "end": 47,
        "loc": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 3,
            "column": 1
          }
        },
        "declarations": [
          {
            "type": "VariableDeclarator",
            "start": 6,
            "end": 47,
            "loc": {
              "start": {
                "line": 1,
                "column": 6
              },
              "end": {
                "line": 3,
                "column": 1
              }
            },
            "id": {
              "type": "Identifier", // 标识符
              "start": 6,
              "end": 8,
              "loc": {
                "start": {
                  "line": 1,
                  "column": 6
                },
                "end": {
                  "line": 1,
                  "column": 8
                },
                "identifierName": "fn" // 变量名
              },
              "name": "fn"
            },
            "init": {
              "type": "FunctionExpression", // 函数表达式
              "start": 11,
              "end": 47,
              "loc": {
                "start": {
                  "line": 1,
                  "column": 11
                },
                "end": {
                  "line": 3,
                  "column": 1
                }
              },
              "id": null,
              "generator": false,
              "async": false,
              "params": [],
              "body": {
                "type": "BlockStatement", // 块语句
                "start": 22,
                "end": 47,
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 22
                  },
                  "end": {
                    "line": 3,
                    "column": 1
                  }
                },
                "body": [
                  {
                    "type": "ReturnStatement", // 返回语句
                    "start": 25,
                    "end": 45,
                    "loc": {
                      "start": {
                        "line": 2,
                        "column": 1
                      },
                      "end": {
                        "line": 2,
                        "column": 21
                      }
                    },
                    "argument": {
                      "type": "StringLiteral", // 字符串字面量
                      "start": 32,
                      "end": 45,
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 8
                        },
                        "end": {
                          "line": 2,
                          "column": 21
                        }
                      },
                      "extra": {
                        "rawValue": "hello babel",
                        "raw": "'hello babel'"
                      },
                      "value": "hello babel" // 值
                    }
                  }
                ],
              }
            }
          }
        ],
        "kind": "const" // 类型
      }
    ],
  },
}
```

现在想把函数转换为箭头函数的形式;

```js
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const types = require("@babel/types");

const sourceCode = `
const fn = function () {
  return "hello babel";
}
`;

const ast = parser.parse(sourceCode);

traverse(ast, {
  FunctionExpression(path) {
    const arrowFnExpression = types.arrowFunctionExpression(
      path.node.params,
      path.node.body
    );
    path.replaceWith(arrowFnExpression);
  },
});

const { code } = generate(ast);
结果: const fn = () => {
  return "hello babel";
};
```

遍历过程中 babel 给我们提供的一些参数

```js
path: {
  node                //  当前ast节点
  parent              //  父节点ast节点
  parentPath          //  父节点ast的path
  ...

  get(key)            //  获取某个属性的path
  set(key, node)      //  设置某个属性的值
  replaceWith(node)   //  用某个节点替换当前节点
  remove()            //  移除当前节点
  skip()              //  跳过当前节点的遍历
  stop()              // 结束所有遍历
  ...
}

state: {
    file              // file 对象
    opts              // 插件的配置项
}
```

简单的移除 console 语句

```js
const parser = require("@babel/parser");
const types = require("@babel/types");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

const sourceCode = `
    console.log('hello babel')
`;

const ast = parser.parse(sourceCode);

traverse(ast, {
  CallExpression(path) {
    if (
      types.isIdentifier(path.node.callee.object, { name: "console" }) &&
      types.isIdentifier(path.node.callee.property, { name: "log" })
    ) {
      path.remove();
      path.skip();
    }
  },
});

const { code } = generate(ast);
```

结果:

按需引入的简单讲解

我们使用的组件库 element 或者 ant-design 都提供按需引入组件的 babel 插件,那么它的插件主要是做了什么事情来帮助我们来做到按需引入,从而减少我们打包的体积呢?
其实它就是在引入组件的时候,把库的名字具体到了库/组件;

```js
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

const sourceCode = `import { Input } from 'element-ui'`;

const ast = parser.parse(sourceCode, {
  sourceType: "module",
});

traverse(ast, {
  ImportDeclaration(path) {
    const { specifiers, source } = path.node;
    source.value = specifiers.reduce((pre, cur) => {
      pre += `${source.value}/lib/${cur.imported.name}`;
      return pre;
    }, "");
  },
});

const { code } = generate(ast);
结果: import { Input } from "element-ui/lib/Input";
```

实际场景

好了,现在回来实际场景了.现在我们的管理台要进行中台切换,很多以前设计的页面都要重新设计(大改,基本废弃)这些页面可能多达十几个,但是它们有一个特点那就是我需要在开发环境查看,在其它环境不展示呢?
当前有,处理方法也有很多,比如可以在代码加入一些逻辑来处理.但是,我能不能制定一些标识,通过这些标识来说明这些无用的页面呢,从而达到在打包应用的时候压根不去打包这些页面呢?

想法

大家经常会在一些库的源码或者在使用的某些库的过程中,看到以下一些注释代码.
比如

```js
webpack /*webpackChunkName:"chunkName" */  生成指定名字模块
eslint / *eslint-disable */                 关闭规则校验
teser /*@PURE*/                     标识函数是纯函数
```

上面这种注释看似无用,其实却在背后默默的帮我们做了很多事情.那看到这里,你的想法是否和我一样,我能不能写一个属于我自己的注释,然后根据这些注释来标识一些无用的页面呢?答案也很显然.

代码实现

以插件的形式编写,使用插件的时候我们就不需要引入@babel/parser,@babel/generator...等插件.在我们导出的函数的参数中会有这些参数.

```js
babel - plugin - remove - development.js;

const handleRemove = ({ path, data, removeParent = false, currentEnv }) => {
  const index = data.findIndex((item) => Array.isArray(item.leadingComments));
  if (index > -1) {
    const reg = /\s{0,}environment\s{0,}:\s{0,}['|"](.*)['|"]\s{0,}/;
    const [leadingComments] = data[index].leadingComments;
    const matchList =
      leadingComments &&
      leadingComments.value &&
      leadingComments.value.match(reg);
    if (matchList) {
      // eslint-disable-next-line no-unused-vars
      const [originValue, matchValue] = matchList;
      const envList = matchValue.split("|");
      const includeCurrentEnv = envList.includes(currentEnv);
      if (includeCurrentEnv) {
        path.skip();
        return;
      }
      removeParent ? path.parentPath.remove() : path.remove();
      path.skip();
    }
  }
};
module.exports = function ({ types: t }, { currentEnv = "dev" }) {
  return {
    visitor: {
      MemberExpression(path) {
        path.parentPath.isCallExpression() &&
          Array.isArray(path.node.object.arguments) &&
          handleRemove({
            path: path,
            data: path.node.object.arguments,
            removeParent: true,
            currentEnv,
          });
      },
      CallExpression(path) {
        handleRemove({ path: path, data: path.node.arguments, currentEnv });
      },
      ObjectExpression(path) {
        handleRemove({
          path,
          data: path.node.properties,
          removeParent: t.isVariableDeclarator(path.parentPath),
          currentEnv,
        });
      },
    },
  };
};

export default [
  {
    path: "/common/download",
    name: "pdDownLoad",
    // 只需要在引入路由的时候添加/* environment: "dev" */即可
    component: () => import(/* environment: "dev" */ "@/views/common/download"),
  },
  {
    path: "/common/clip-image",
    name: "pdClipImage",
    component: () =>
      import(/* environment: "dev" */ "@/views/common/clip-image"),
  },
];

const menus = [
  {
    // 这里的意思是,这个对象会在dev和test和uat的环境中存在,在其他环境会被销毁.
    /* environment: "dev|test|uat" */
    icon: "el-icon-coin",
    label: "公共页面",
    subMenu: [
      {
        label: "自定义导出",
        url: "/common/download",
        name: "pdDownload",
      },
      {
        label: "图片生成",
        url: "/common/clip-image",
        name: "pdClipImage",
      },
    ],
  },
  {
    // 这里的意思是这个对象只会在dev环境中存在.
    /* environment: "dev" */
    label: "社区团购门店",
    url: "/store/index/index",
    name: "pdStore",
  },
];

babel.config.js;

module.exports = {
  plugins: [
    [
      "./babel-plugin/babel-plugin-remove-development.js",
      {
        // VUE_APP_ENV这里是你当前运行的环境或者是打包的环境,比如dev|test|uat|prod.因为我的项目中是用VUE_APP_ENV来区分环境的.
        currentEnv: process.env.VUE_APP_ENV,
      },
    ],
  ],
};
```

总结
这样的好处是,不需要在代码加一些逻辑判断,只需要通过注释就可以实现在 webpack 打包的时候就把标注了注释的节点给删除掉.以上内容如有错误,请大佬可以指出.
参考

- https://zhuanlan.zhihu.com/p/85915575
- https://www.cnblogs.com/attilax/p/5963787.html
- https://blog.csdn.net/weixin_42436686/article/details/112515290

## 团队规范

每个研发团队都需要有自己的代码规范,这样才能够统一每个人书写代码格式,减少 CodeReview 的时间,提前检查出一些不符合代码规范的代码.一般前端检查代码规范的组合拳都是:eslint+lint-staged-husky+prettier.我们接下来介绍一下每个工具的作用.

---

## [eslint](https://eslint.bootcss.com/docs/user-guide/getting-started)

1. 官方解读:ESLint 是在 ECMAScript/JavaScript 代码中识别和报告模式匹配的工具，它的目标是保证代码的一致性和避免错误.
2. 实现:

- ESLint 使用 Espree 解析 JavaScript。
- ESLint 使用 AST 去分析代码中的模式
- ESLint 是完全插件化的。每一个规则都是一个插件并且你可以在运行时添加更多的规则。

3. 配置

```js
.eslintrc
{
    "rules": {
        "semi": ["error", "always"],
        "quotes": ["error", "double"],
        ...
    }
}
```

4. 那么我们可以从以上几点得知如果我们在 ESlint 的配置中配置了相关的规则,那么 eslint 就会通过 Espree 把我们的代码解析成 AST 对象之后,在根据配置中的规则来查看是否匹配规则,不匹配则根据 off/warn/error 来做对应的提示.

## [prettier](https://www.prettier.cn/)

1. 官方解读:Prettier is an opinionated code formatter.简单的来说 Prettier 是一个固执己见的代码格式化程序.
2. 实现:

- 也是利用解析器把代码解析成 AST,然后 AST 进行遍历,最后根据规则整合代码

3. 配置

```js
.prettierrc.js
module.exports = {
  printWidth: 100, // 一行的字符数，如果超过会进行换行，默认为80，官方建议设100-120其中一个数
  tabWidth: 2, // 一个tab代表几个空格数，默认就是2
  useTabs: false, // 启用tab取代空格符缩进，默认为false
  semi: true, // 结尾加上分号, 默认true
  ...
};
```

4. Prettier 就是利用你在配置中配置的选项来格式话你的代码,比如长度,标点符号...

## [lint-staged](https://www.npmjs.com/package/lint-staged)

1. 官方解读:Run linters against staged git files and don't let 💩 slip into your code base!意思就是对暂存的 git 文件跑 linter,防止一些不好的代码溜进你的代码仓库.
2. 实现(https://segmentfault.com/a/1190000019466459)
3. 配置

```js
.lintstagedrc
{
  "src/**": [
      "prettier --write",
      "eslint --fix",
      "git add ."
    ]
}
```

4. 就是在你给出需要校验文件的范围,然后执行对应的命令,比如 prettier --write 来帮你做一些代码的格式化

## [husky](https://typicode.github.io/husky/#/?id=bypass-hooks)

1. Husky improves your commits and more 🐶 woof! You can use it to lint your commit messages, run tests, lint code, etc... when you commit or push. Husky supports all Git hooks. husky 是一个 Git Hook 工具.就是提交的时候会触发一些 git 的钩子,在钩子中做一些你想做的事情(简化了 Git hooks 的操作)
2. 配置:

```js
.package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
    }
  }
}
```

3. 就是在你提交代码的时候,在不同时期的 Hook 里面做一些操作.比如 commit-msg,pre-commit 这些 hook 来帮助你做一些校验.

## 实操

这里以 vue 的项目来操作

```js
// 首先创建一个项目
vue create team-rule
npm install -g commitizen  // 用git cz提交
// 本次安装的依赖如下安装依赖
@commitlint/cli@7.2.0
lint-staged@10.5.2
husky@4.3.0
prettier@2.2.1
cz-customizable@6.3.0 // 定制化提交说明的适配器
commitlint-config-cz@0.13.2 // 对定制化提交说明进行校验

```

<!-- .cz-config.js -->

```js
// 因为这次我做的是定制化提交说明,所以新增一个.cz-config.js文件
module.exports = {
  types: [
    { value: "init", name: "初始:    初始提交" },
    { value: "feat", name: "特性:    一个新的特性" },
    { value: "fix", name: "修复:    修复一个Bug" },
    { value: "docs", name: "文档:    变更的只有文档" },
    { value: "style", name: "格式:    空格, 分号等格式修复" },
    { value: "️refactor", name: "重构:    代码重构，注意和特性、修复区分开" },
    { value: "️perf", name: "性能:    提升性能" },
    { value: "test", name: "测试:    添加一个测试" },
    { value: "chore", name: "工具:    开发工具变动(构建、脚手架工具等)" },
    { value: "revert", name: "回滚:    代码回退" },
    { value: "merge", name: "合并:    代码合并" },
    { value: "wip", name: "进行:    工作正在进行中" },
    { value: "review", name: "审查:    代码review,补充注释,修改格式" },
  ],

  scopes: [{ name: "ui" }, { name: "button" }, { name: "alert" }],

  allowTicketNumber: false,
  isTicketNumberRequired: false,
  ticketNumberPrefix: "TICKET-",
  ticketNumberRegExp: "\\d{1,5}",
  messages: {
    type: "选择您要提交的更改类型：",
    scope: "\n表示此更改的范围（可选）：",
    // 如果allowCustomScopes为true，则使用
    customScope: "表示此更改的范围：",
    subject: "撰写简短，即时的更改时态描述：\n",
    body: "提供更改的长说明（可选）。使用“ |”换行：\n",
    breaking: "列出任何更改（可选）：\n",
    footer: "列出此更改关闭的所有问题（可选）。例如：#31、#34：\n",
    confirmCommit: "您确定要继续上面的提交吗？",
  },

  allowCustomScopes: true,
  allowBreakingChanges: ["feat", "fix"],
  // 跳过您想要的任何问题
  // skipQuestions: ['body', 'footer'],

  // 限制主题长度
  subjectLimit: 100,
};
```

<!-- package.json -->

```js
// 新增
 "config": {
    "commitizen": {
      "path": "node_modules/cz-customizable" // 配置cz工具的适配器路径
    }
  },
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-commit": "lint-staged",
      "post-commit": "git update-index --again"
    }
  },
  "lint-staged": {
    "src/**": [
      "prettier --write",
      "eslint --fix",
      "git add ."
    ]
  }
```

<!-- .prettierrc.js -->

```js
module.exports = {
  printWidth: 100, // 一行的字符数，如果超过会进行换行，默认为80，官方建议设100-120其中一个数
  tabWidth: 2, // 一个tab代表几个空格数，默认就是2
  useTabs: false, // 启用tab取代空格符缩进，默认为false
  semi: true, // 结尾加上分号, 默认true
  singleQuote: true, // 字符串是否使用单引号, 默认false(在jsx中配置无效, 默认都是双引号)
  quoteProps: "as-needed", // 给对象里的属性名是否要加上引号,(‘as-needed’: 没有特殊要求，禁止使用；'consistent': 保持一致；preserve: 不限制，想用就用)
  jsxSingleQuote: false, // jsx 语法中使用单引号
  // ...
};
```
之后使用git cz来提交代码就有提示啦.

## 总结

总的来说,eslint 负责代码的质量和规范(比如一些变量声明,单双引号等规范),prettier 是负责代码的格式(行宽,结尾使用分号等),lint-staged 是负责寻找指定范围内 git 本地暂存的代码,然后运行对应的指令,husky 是在你提交代码的时候执行 git 的钩子,然后执行对应的脚本命令.

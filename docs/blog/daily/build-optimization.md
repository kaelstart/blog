## webpack 打包优化

## 背景

某天在开发完成一个功能的时候推到远程仓库(已 CICD),发现代码久久没有生效.去构建仓库有收到报警,代码构建失败.当我去查看构建详情的时候,发现构建时长高达 15 分钟,并且出现爆栈的情况.当出现这种情况,我的内心是欢乐的,因为终于可以对这个项目进行优化了.

## 优化后的效果

### 未优化:

![image](https://i.bmp.ovh/imgs/2022/06/10/b886c57ab85aa08e.png)
![image](https://i.bmp.ovh/imgs/2022/06/10/c6ee66a875ec71a8.png)

### 优化过后:

![image](https://s3.bmp.ovh/imgs/2022/06/10/c1a028228de61ed2.png)
![image](https://s3.bmp.ovh/imgs/2022/06/10/ac80a5251bb7cf1f.png)

可以看到体积减少了 70%左右,打包时间减少了 20%.那么我是怎么优化的呢?现在来揭晓吧

## 问题点

首先我们先看一下这个项目有什么问题

1. 打包时间过长(本地 build 高达 4 分钟)
2. 占用内存过高,并且会出现爆栈的情况
3. 项目打包完成之后的体积过大
4. 项目历经时间过长,项目复杂,并且几乎没怎么优化.

由于这个项目是用 vuecli 创建的,那么我们先来看看 vuecli 默认做了哪些优化

```js
// 用于查看当前的配置
vue inspect > output.js
```

```js
// 这里抽取了部分优化的逻辑
{
    module: {
    noParse: /^(vue|vue-router|vuex|vuex-router-sync)$/,
    rules: [
    /* config.module.rule('vue') */
      {
        test: /\.vue$/,
        use: [
          /* config.module.rule('vue').use('cache-loader') */
          {
            loader: '/Users/zhangwenxiong/shadow/pagoda-project/ziying-admin/opGoodsWebPC/node_modules/cache-loader/dist/cjs.js',
            options: {
              cacheDirectory: '/Users/zhangwenxiong/shadow/pagoda-project/ziying-admin/opGoodsWebPC/node_modules/.cache/vue-loader',
              cacheIdentifier: '3ba684b6'
            }
          },
          /* config.module.rule('vue').use('vue-loader') */
          {
            loader: '/Users/zhangwenxiong/shadow/pagoda-project/ziying-admin/opGoodsWebPC/node_modules/vue-loader/lib/index.js',
            options: {
              compilerOptions: {
                whitespace: 'condense'
              },
              cacheDirectory: '/Users/zhangwenxiong/shadow/pagoda-project/ziying-admin/opGoodsWebPC/node_modules/.cache/vue-loader',
              cacheIdentifier: '3ba684b6'
            }
          }
        ]
      },
       /* config.module.rule('js') */
      {
        test: /\.m?jsx?$/,
        exclude: [
          function () { /* omitted long function */ }
        ],
        use: [
          /* config.module.rule('js').use('cache-loader') */
          {
            loader: '/Users/zhangwenxiong/shadow/pagoda-project/ziying-admin/opGoodsWebPC/node_modules/cache-loader/dist/cjs.js',
            options: {
              cacheDirectory: '/Users/zhangwenxiong/shadow/pagoda-project/ziying-admin/opGoodsWebPC/node_modules/.cache/babel-loader',
              cacheIdentifier: '3045f688'
            }
          },
          /* config.module.rule('js').use('babel-loader') */
          {
            loader: '/Users/zhangwenxiong/shadow/pagoda-project/ziying-admin/opGoodsWebPC/node_modules/babel-loader/lib/index.js'
          }
        ]
      },
    ]
},
 optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          name: 'chunk-vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          chunks: 'initial'
        },
        common: {
          name: 'chunk-common',
          minChunks: 2,
          priority: -20,
          chunks: 'initial',
          reuseExistingChunk: true
        }
      }
    },
    minimizer: [
      /* config.optimization.minimizer('terser') */
      new TerserPlugin(
        {
          terserOptions: {
            compress: {
              arrows: false,
              collapse_vars: false,
              comparisons: false,
              computed_props: false,
              hoist_funs: false,
              hoist_props: false,
              hoist_vars: false,
              inline: false,
              loops: false,
              negate_iife: false,
              properties: false,
              reduce_funcs: false,
              reduce_vars: false,
              switches: false,
              toplevel: false,
              typeofs: false,
              booleans: true,
              if_return: true,
              sequences: true,
              unused: true,
              conditionals: true,
              dead_code: true,
              evaluate: true
            },
            mangle: {
              safari10: true
            }
          },
          sourceMap: false,
          cache: true,
          parallel: true,
          extractComments: false
        }
      )
    ]
  },
}
```

从上面可以看到,webpack 优化策略中的常客`cache-loader`,`terser`等插件都用上了.而分包优化则使用的是 webpack 默认的分包策略,这样我们还不是很好的定位问题.所以我们就搭配一些插件来查看我们的打包出现的问题吧.

```js
yarn add speed-measure-webpack-plugin -D
```

这个插件可以测量各个插件和 loader 所花费的时间

```js
yarn add webpack-bundle-analyzer -D
```

这个插件可以查看打包之后各个 chunk 的体积大小,它的 UI 页面可以很清晰的展示出 chunk 的信息.

然后再打包看看

```js
yarn build
```

再通过插件来查看本次打包的信息
![images](https://s3.bmp.ovh/imgs/2022/06/11/b746c23858bedc59.jpg)

通过上图可以看到几乎每个 chunk 都高达 500kb,这个时候我就会想为什么每个 chunk 都会这么大呢?是不是有一些公共代码没有被分割出来,于是乎我就去搜索了我们仓库中一些常用到的公共的代码,发现果然如此.

![images](https://s3.bmp.ovh/imgs/2022/06/11/5f774cfbf2456c2d.jpg)
那么这个问题就比较好解决了,那就是 webpack 的分包策略出了问题.可以根据`optimization.splitChunks`来进行优化.

接着我们在去查看一些公共的第三方库,由于我们项目中用了 moment.js,当我去搜索 moment.js 的时候,发现很多语言都被打包进来了.
![images](https://s3.bmp.ovh/imgs/2022/06/11/86c7e64bcfa1d474.jpg).这也是一个问题

## 解决

1. 分包

经过我的调试,下面的分包策略在我们的项目收益比较大

2. moment.js

安装`moment-locales-webpack-plugin`插件,来移除一些不必要的语言,进行按需引入.

最终配置

```js
 configureWebpack: (config) => {
    const plugins = []
    // build
    plugins.push(new SpeedMeasurePlugin(), new BundleAnalyzerPlugin())
    // 去除moment一些不必要的语言
    plugins.push(
      new MomentLocalesPlugin({
        localesToKeep: ['zh-cn']
      })
    )
    config.optimization = { splitChunks: {
         cacheGroups: {
    common: {
      name: "chunk-common",
      // 公共模块采用all
      chunks: "all",
      minChunks: 2,
      minSize: 0,
      // 优先级高
      priority: 1,
      reuseExistingChunk: true,
      enforce: true,
    },
    vendors: {
      name: "chunk-vendors",
      test: /[\\/]node_modules[\\/]/,
      minChunks: 1,
      minSize: 0,
      priority: 2,
      chunks: "initial",
      reuseExistingChunk: true,
      enforce: true,
    },
    vue: {
      name: "chunk-vue",
      test: /[\\/]node_modules[\\/]vue[\\/]/,
      priority: 3,
      reuseExistingChunk: true,
      enforce: true,
    },
    vuex: {
      name: "chunk-vuex",
      test: /[\\/]node_modules[\\/]vuex[\\/]/,
      priority: 3,
      reuseExistingChunk: true,
      enforce: true,
    },
    "vue-router": {
      name: "chunk-vue-router",
      test: /[\\/]node_modules[\\/]vue-router[\\/]/,
      chunks: "all",
      priority: 3,
      reuseExistingChunk: true,
      enforce: true,
    },
    "element-ui": {
      name: "chunk-element-ui",
      test: /[\\/]node_modules[\\/]element-ui[\\/]/,
      chunks: "all",
      priority: 7,
      reuseExistingChunk: true,
      enforce: true,
    },
    wangeditor: {
      name: "chunk-wangeditor",
      test: /[\\/]node_modules[\\/]wangeditor[\\/]/,
      chunks: "all",
      priority: 9,
      reuseExistingChunk: true,
      enforce: true,
    },
    lodash: {
      name: "chunk-lodash",
      test: /[\\/]node_modules[\\/]lodash[\\/]/,
      chunks: "all",
      priority: 9,
      reuseExistingChunk: true,
      enforce: true,
    },
    moment: {
      name: "chunk-moment",
      test: /[\\/]node_modules[\\/]moment[\\/]/,
      chunks: "all",
      priority: 9,
      reuseExistingChunk: true,
      enforce: true,
    },
    dayjs: {
      name: "chunk-moment",
      test: /[\\/]node_modules[\\/]dayjs[\\/]/,
      chunks: "all",
      priority: 9,
      reuseExistingChunk: true,
      enforce: true,
    },
    numeral: {
      name: "chunk-numeral",
      test: /[\\/]src[\\/]utils[\\/]numeral[\\/]/,
      chunks: "all",
      priority: 9,
      reuseExistingChunk: true,
      enforce: true,
    },
    pinyin4js: {
      name: "chunk-moment",
      test: /[\\/]node_modules[\\/]pinyin4js[\\/]/,
      chunks: "all",
      priority: 9,
      reuseExistingChunk: true,
      enforce: true,
    },
    axios: {
      name: "chunk-axios",
      test: /[\\/]node_modules[\\/]axios[\\/]/,
      chunks: "all",
      priority: 9,
      reuseExistingChunk: true,
      enforce: true,
    },
  },
    } }
    // 这里noParse,我剔除了一些不需要webpack进行打包解析的三方库.
    config.module.noParse =
      /^(vue|vue-router|vuex|vuex-router-sync|element-ui|lodash|wangeditor|dayjs|axios|moment|sortablejs)$/
    config.plugins = [...config.plugins, ...plugins]
  },
```

以上的优化手段减少了打包体积70%,打包时间减少了20%.暂时觉得够用了,以后还有其他的性能优化手段再进行优化.
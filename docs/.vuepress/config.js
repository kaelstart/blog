module.exports = {
  title: "shadow",
  description: "Just playing around",
  base: "/blog/",
  themeConfig: {
    sidebar: [
      {
        title: "element相关",
        path: "/blog/element/element",
        collapsable: false,
        children: [{ title: "穿透更改element", path: "/blog/element/element" }],
      },
      {
        title: "babel相关",
        path: "/blog/babel",
        collapsable: false,
        children: [
          {
            title: "babel-plugin-remove-module",
            path: "/blog/babel/babel-plugin-remove-module",
          },
          {
            title: "babel-plugin-auto-report-error",
            path: "/blog/babel/babel-plugin-auto-report-error",
          },
        ],
      },
      {
        title: "vue源码相关",
        path: "/blog/vue",
        collapsable: false,
        children: [
          {
            title: "vue2-lifecycle源码解析",
            path: "/blog/vue/vue2-lifecycle",
          },
          {
            title: "vue2computed源码解析",
            path: "/blog/vue/vue2-computed",
          },
          {
            title: "vue2watch源码解析",
            path: "/blog/vue/vue2-watch",
          },
          {
            title: "vue2$set源码解析",
            path: "/blog/vue/vue2-$set",
          },
          {
            title: "vue2mixin合并策略解析",
            path: "/blog/vue/vue2-mixin",
          },
          {
            title: "vue2/vue3响应式变更对比",
            path: "/blog/vue/vue2-vue3-reactive-compare",
          },
        ],
      },
      {
        title: "日常记录",
        path: "/blog/daily",
        collapsable: false,
        children: [
          {
            title: "webpack打包优化",
            path: "/blog/daily/build-optimization",
          },
          {
            title: "控制重复请求,并返回同段时间内的请求结果",
            path: "/blog/daily/control-request",
          },
          {
            title: "团队代码规范",
            path: "/blog/daily/team-rule",
          },
          {
            title: "vue+docker+jenkins自动化部署",
            path: "/blog/daily/vue+docker+jenkins",
          },
          {
            title: "开发工具-whistle",
            path: "/blog/daily/whistle",
          },
        ],
      },
       {
        title: "ai",
        path: "/blog/ai",
        collapsable: false,
        children: [
          {
            title: "开发mcp server",
            path: "/blog/ai/mcpServer",
          },
        ],
      },
    ],
  },
};

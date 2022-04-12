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
            title: "babel-plugin-remove-development",
            path: "/blog/babel/babel-plugin-remove-development",
          },
        ],
      },
      {
        title: "vue源码相关",
        path: "/blog/vue",
        collapsable: false,
        children: [
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
        ],
      },
      {
        title: "日常记录",
        path: "/blog/daily",
        collapsable: false,
        children: [
          {
            title: "控制重复请求,并返回同段时间内的请求结果",
            path: "/blog/daily/control-request",
          },
          {
            title: "团队代码规范",
            path: "/blog/daily/team-rule",
          },
        ],
      },
    ],
  },
};

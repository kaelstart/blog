module.exports = {
  title: "shadow",
  description: "Just playing around",
  base: "/blob/",
  themeConfig: {
    sidebar: [
      {
        title: "element相关",
        path: "/blob/element/element",
        collapsable: false,
        children: [{ title: "穿透更改element", path: "/blob/element/element" }],
      },
      {
        title: "babel相关",
        path: "/blob/babel",
        collapsable: false,
        children: [
          {
            title: "babel-plugin-remove-development",
            path: "/blob/babel/babel-plugin-remove-development",
          },
        ],
      },
      {
        title: "vue源码相关",
        path: "/blob/vue",
        collapsable: false,
        children: [
          {
            title: "vue2computed源码解析",
            path: "/blob/vue/vue2-computed",
          },
          {
            title: "vue2watch源码解析",
            path: "/blob/vue/vue2-watch",
          },
          {
            title: "vue2$set源码解析",
            path: "/blob/vue/vue2-$set",
          },
        ],
      },
      {
        title: "日常记录",
        path: "/blob/daily",
        collapsable: false,
        children: [
          {
            title: "控制重复请求,并返回同段时间内的请求结果",
            path: "/blob/daily/control-request",
          },
          {
            title: "团队代码规范",
            path: "/blob/daily/team-rule",
          },
        ],
      },
    ],
  },
};

# [whistle](http://wproxy.org/whistle/)

## whistle 是什么?

官方解读:
基于 Node 实现的跨平台 web 调试代理工具，类似的工具有 Windows 平台上的 Fiddler，主要用于查看、修改 HTTP、HTTPS、Websocket 的请求、响应，也可以作为 HTTP 代理服务器使用，不同于 Fiddler 通过断点修改请求响应的方式，whistle 采用的是类似配置系统 hosts 的方式，一切操作都可以通过配置实现，支持域名、路径、正则表达式、通配符、通配路径等多种匹配方式，且可以通过 Node 模块扩展功能：

通过以上解读,我们可以抓取到几个关键字: "修改 HTTP/HTTPS/Websocket 的请求","作为 HTTP 代理服务器","修改请求响应"等功能.那我就在以下介绍几个我日常中会用到的功能.

## 安装

### whistle 安装

```bash
# whistle也是一个npm包,所以可以通过npm来安装
npm install -g whistle
```

```bash
# 安装完成之后,可以通过以下命令来验证
w2 help

 Usage: whistle <command> [options]

  Commands:

  status              Show the running status of whistle
  use/add [filepath]  Set rules from a specified js file (.whistle.js by default)
  run                 Start a front service
  start               Start a background service
  stop                Stop current background service
  restart             Restart current background service
  help                Display help information
  ...
```

### SwitchyOmega 安装

这个插件主要用于浏览器代理,方便切换一些代理源.
我们可以在 chrome 的扩展程序中找到这个插件,然后进行安装即可.安装成功之后,就可以在插件列表看到了
![images](https://i.bmp.ovh/imgs/2022/05/14/571686e4fc0b7a65.png)
然后进入这个插件列表进行一些配置
![images](https://i.bmp.ovh/imgs/2022/05/14/394c8c01a79a423a.png)
然后
![images](https://i.bmp.ovh/imgs/2022/05/14/79deeacf2d482423.png)
然后
![images](https://i.bmp.ovh/imgs/2022/05/14/7ff41dc1a598f183.png)
到这里我们就完成了 whistle 的配置啦.
然后我们启动我们的 whistle

```bash
w2 start
```

![images](https://i.bmp.ovh/imgs/2022/05/14/8472d14e82f838bd.png)
然后我们在打开http://127.0.0.1:8899/#network,在这里我们可以看到whistle的页面啦.
![images](https://i.bmp.ovh/imgs/2022/05/14/18572ae03ec3d9ef.png)

---

现在我们来安装一下 HTTPS 的证书,这样后面我们就可以抓取到 https 的请求.
![images](https://i.bmp.ovh/imgs/2022/05/14/3dd89b74e7187205.png)
安装完成之后,我们随便在 chrome 中输入一个地址,比如https://www.baidu.com/.然后在切换到whistle的network页面,此时我们就可以看到打开百度这个页面的请求啦
![images](https://s3.bmp.ovh/imgs/2022/05/14/839a2381c77e53ac.jpg)

## 代理

## 日常开发的过程中,由于前端开发环境域名(localhost:xxx)和后端的域名不一样导致我们在日常开发的过程中会遇到跨域,cookie 在请求的过程中没有携带等的情况.那么我们用 whistle 如何解决呢?

1. nginx 做中间层代理
2. nginx 做转发
3. webpack.devserver.proxy 做转发
4. whistle
5. ...还有很多其他的方法
   那么我们这里是介绍 whistle,当然用 whistle 的方法了.
   比如我们我们前端的项目启动的域名是(localhost:8080),后端的服务器域名是http://www.test.com/api.此时我们可以在whistle的rules配置里面进行配置

```bash
# 这里的意思是,把www.test.com这个域名转发到localhost:8081的页面上
# 此时我们在浏览器打开http://www.test.com即可.
# excludeFilter的意思是除了www.test.com/api/下面的接口,后面在讲解,这里做个伏笔.
# 这样我们在访问www.test.com请求后端服务器的时候,都会把请求发到www.test.com/api/上了,cookie也会相应的带上
http://www.test.com http://localhost:8081 excludeFilter://^www.test.com/api/*
# https的也可以哦,是不是很方便
# https://www.test.com http://localhost:8081 excludeFilter://^www.test.com/api/*
```

![images](https://s3.bmp.ovh/imgs/2022/05/14/2d99eee6111f16f7.jpg)
然后通过 http://www.test.com/访问即可.
![images](https://s3.bmp.ovh/imgs/2022/05/14/a894e3d31053e682.jpg)
这样我们就完成了接口代理啦,是不是比在 nginx 那些配置还方便灵活呢.

---

如果此时我们需要请求服务端的接口,比如是/api/v1/goods 该怎么办呢?

```js
// 这里用axios做简单的演示
import axios from "axios";
const instance = axios.create({
  // 这里的开发环境就用 “/”就好,因为当你不输入域名前缀的时候,请求服务器的接口就会紧跟在当前访问域名的接口后面,下面做演示.其他环境你可以做相应的区分
  baseURL: "/",
});
// 这里就会请求到 http://www.test.com/api/v1/goods
// 还记得我们在whistle做的伏笔吗,那里excludeFilter://^www.test.com/api/
// 这里的excludeFilter://^www.test.com/api/指的是www.test.com/api/不会走代理指向http://localhost:8081 .
instance.post("/api/v1/goods");
```
看了以上代码是不是觉得很方便呢,这里我们不单指解决了跨域的问题,也可能顺便解决了 cookie 传送的问题哦.

---
上面的域名和本地开发环境的,我们也可以用在不同的环境上.
比如
- 测试环境是 www.test.com
- 预发布环境是 www.uat.com
- 生产环境是 www.prod.com 

我们通通都可以通过代理来解决以此来达到本地开发环境切换到不同环境的效果哦.加快了我们调试的速度.当然,我们也可以针对某个请求来做一些操作(比如,针对某个请求增加请求头,cookie;针对某个响应数据做一些数据的更改都是可以的).这里就不一一介绍啦,想要知道如何实现可以观看官方文档,我这里介绍的是平常开发环境下会遇到的问题,以及它的解决方案.


## 总结

最后我们可以知道,whistle是可以"修改 HTTP/HTTPS/Websocket 的请求","作为 HTTP 代理服务器","修改请求响应"等功能.感兴趣的小伙伴可以自行观看官方文档
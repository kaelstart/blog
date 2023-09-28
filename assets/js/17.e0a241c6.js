(window.webpackJsonp=window.webpackJsonp||[]).push([[17],{413:function(s,t,a){"use strict";a.r(t);var e=a(56),r=Object(e.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h1",{attrs:{id:"docker-常用指令"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#docker-常用指令"}},[s._v("#")]),s._v(" docker 常用指令")]),s._v(" "),a("h2",{attrs:{id:"查看正在运行的容器"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#查看正在运行的容器"}},[s._v("#")]),s._v(" 查看正在运行的容器")]),s._v(" "),a("p",[s._v("docker ps")]),s._v(" "),a("div",{staticClass:"language-bash extra-class"},[a("pre",{pre:!0,attrs:{class:"language-bash"}},[a("code",[s._v("CONTAINER ID        IMAGE                 COMMAND                  CREATED             STATUS              PORTS                                NAMES\n142d10aab77c        jenkins/jenkins:lts   "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"/usr/bin/tini -- ..."')]),s._v("   "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("2")]),s._v(" months ago        Up "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("3")]),s._v(" hours          "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("50000")]),s._v("/tcp, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.0")]),s._v(".0.0:49003-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("8080")]),s._v("/tcp   jenkins_node1\n")])])]),a("h2",{attrs:{id:"启动容器"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#启动容器"}},[s._v("#")]),s._v(" 启动容器")]),s._v(" "),a("p",[s._v("docker start 容器 id(CONTAINER ID)")]),s._v(" "),a("h2",{attrs:{id:"重启容器"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#重启容器"}},[s._v("#")]),s._v(" 重启容器")]),s._v(" "),a("p",[s._v("docker restart 容器 id(CONTAINER ID)")]),s._v(" "),a("h2",{attrs:{id:"停止当前运行的容器"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#停止当前运行的容器"}},[s._v("#")]),s._v(" 停止当前运行的容器")]),s._v(" "),a("p",[s._v("docker stop 容器 id(CONTAINER ID)")]),s._v(" "),a("h2",{attrs:{id:"强制停止当前容器"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#强制停止当前容器"}},[s._v("#")]),s._v(" 强制停止当前容器")]),s._v(" "),a("p",[s._v("docker kill 容器 id(CONTAINER ID)")]),s._v(" "),a("h2",{attrs:{id:"删除容器"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#删除容器"}},[s._v("#")]),s._v(" 删除容器")]),s._v(" "),a("h2",{attrs:{id:"查看主机的所有镜像"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#查看主机的所有镜像"}},[s._v("#")]),s._v(" 查看主机的所有镜像")]),s._v(" "),a("p",[s._v("docker images")]),s._v(" "),a("h2",{attrs:{id:"查看所有的容器"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#查看所有的容器"}},[s._v("#")]),s._v(" 查看所有的容器")]),s._v(" "),a("p",[s._v("docker ps -a")]),s._v(" "),a("h2",{attrs:{id:"拉取镜像"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#拉取镜像"}},[s._v("#")]),s._v(" 拉取镜像")]),s._v(" "),a("p",[s._v("docker pull 镜像名:tag")]),s._v(" "),a("h2",{attrs:{id:"构建镜像"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#构建镜像"}},[s._v("#")]),s._v(" 构建镜像")]),s._v(" "),a("p",[s._v("docker build -t [ 镜像名 ]:[ tag ] [DockerFile 所在目录]")]),s._v(" "),a("h2",{attrs:{id:"删除镜像"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#删除镜像"}},[s._v("#")]),s._v(" 删除镜像")]),s._v(" "),a("p",[s._v("docker rmi 镜像名/镜像id")]),s._v(" "),a("h2",{attrs:{id:"重启容器-2"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#重启容器-2"}},[s._v("#")]),s._v(" 重启容器")]),s._v(" "),a("p",[s._v("docker restart 容器 id(CONTAINER ID)")]),s._v(" "),a("h2",{attrs:{id:"多阶段构建例子-vue项目举例"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#多阶段构建例子-vue项目举例"}},[s._v("#")]),s._v(" 多阶段构建例子(vue项目举例)")]),s._v(" "),a("div",{staticClass:"language-shell extra-class"},[a("pre",{pre:!0,attrs:{class:"language-shell"}},[a("code",[s._v("FROM node:latest as build-stage  "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 拉去 node:latest镜像并命名为build-stage,在后续多阶段使用的时候有用")]),s._v("\n\nWORKDIR /app  "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 设置当前目录")]),s._v("\n\nCOPY package.json "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(".")]),s._v("   "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 复制当前宿主机的package.json到 /app当前目录中")]),s._v("\n\nRUN "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("npm")]),s._v(" config "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("set")]),s._v(" registry https://registry.npmmirror.com/  "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 设置npm 镜像源")]),s._v("\n\nRUN "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("npm")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("install")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 安装依赖")]),s._v("\n\nCOPY "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(".")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(".")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("#  复制宿主机的也就是Dockfile 文件所在的目录到 /app 目录下")]),s._v("\n\nRUN "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("npm")]),s._v(" run build  "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 运行打包命令")]),s._v("\n\nFROM nginx:latest "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 拉去nginx镜像")]),s._v("\n\nCOPY --from"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("build-stage /app/dist /usr/share/nginx/html "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 把上面build-stage阶段的内容也就是/app/dist目录下的内容复制到容器的/usr/share/nginx/html目录下")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 构建")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("docker")]),s._v(" build -t example "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(".")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 启动")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("docker")]),s._v(" run -d -p "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("9999")]),s._v(":80 example\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 在宿主机访问localhost:9999就可以成功访问")]),s._v("\n")])])])])}),[],!1,null,null,null);t.default=r.exports}}]);
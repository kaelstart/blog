# 部署
首先准备一台云服务器,我这里用的是腾讯云.系统用的是centos7.如果没有云服务器,可以去买一台最低配置的服务器来做演示.本次的项目会用vue+docker+jenkins+码云来做自动化部署.

## 安装git/node步骤
### git
```bash
yum install -y git
```
### nodejs
```bash
# 下载nodejs包
wget https://npm.taobao.org/mirrors/node/v16.9.0/node-v16.9.0-linux-x64.tar.xz
# 解压
tar -xvf node-v16.9.0-linux-x64.tar.xz
# 存放目录
mv node-v16.9.0-linux-x64 /usr/local/node
# 链接
ln -s /usr/local/node/bin/node /usr/bin/node
ln -s /usr/local/node/bin/npm /usr/bin/npm
ln -s /usr/local/node/bin/npx /usr/bin/npx
```
## 安装docker/nginx
```bash
yum install docker
systemctl start docker
docker pull nginx
```
## 安装java/maven/jenkins
### java
```bash
# 下载java
yum -y install java-1.8.0-openjdk* -y
```
查看安装是否成功
```bash
java -version
```
输出
```bash
openjdk version "1.8.0_242"
OpenJDK Runtime Environment (build 1.8.0_242-b08)
OpenJDK 64-Bit Server VM (build 25.242-b08, mixed mode)
```
配置JAVA_HOME环境变量
```bash
# 设置环境变量
echo -e "export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk-1.8.0.242.b08-0.el7_7.x86_64\nexport CL=$PATH:$JAVA_HOME/bin" >> /etc/profile
# 读取环境变量
source /etc/profile
```

---
### maven
```bash
# 下载maven包
wget https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.1.1/apache-maven-3.1.1-bin.tar.gz
# 解压
tar xvf apache-maven-3.1.1-bin.tar.gz
# 存放目录
cp -r apache-maven-3.1.1 /usr/local/apache-maven
# 设置环境变量
echo -e "export MAVEN_HOME=/usr/local/apache-maven\nexport PATH=/usr/local/apache-maven/bin:$PATH" >> /etc/profile
# 读取环境变量
source /etc/profile
```
```bash
mvn -version
```
输出
```bash
Apache Maven 3.1.1 (0728685237757ffbf44136acec0402957f723d9a; 2013-09-17 23:22:22+0800)
Maven home: /usr/local/apache-maven
Java version: 1.8.0_242, vendor: Oracle Corporation
```
---
## 安装jenkins
```bash
## jenkins历史版本地址https://www.jenkins.io/changelog-old
## 镜像的版本可以查看这个https://mirrors.tuna.tsinghua.edu.cn/jenkins/redhat
## 注意我们这里使用的是国内清华的源
wget https://mirrors.tuna.tsinghua.edu.cn/jenkins/redhat/jenkins-2.290-1.1.noarch.rpm
# 安装
rpm -ivh jenkins-2.290-1.1.noarch.rpm
## 启动jenkins,jenkins的端口是8080,所以你可以通过你的服务器地址加8080进行访问.
## 例如 http://xxx.xxx.xx.xx:8080  
systemctl start jenkins
```
到这里,jenkins已经安装上了,但是当我们使用jenkins去下载一些插件的时候会特别慢,所以我们也需要更改以下源.
```bash
cd /var/lib/jenkins/updates
```
```bash
sed -i 's/http:\/\/updates.jenkins-ci.org\/download/https:\/\/mirrors.tuna.tsinghua.edu.cn\/jenkins/g' default.json && sed -i 's/http:\/\/www.google.com/https:\/\/www.baidu.com/g' default.json
```
```bash
sed -i 's/https:\/\/updates.jenkins.io/https:\/\/mirrors.tuna.tsinghua.edu.cn\/jenkins\/updates/' /var/lib/jenkins/hudson.model.UpdateCenter.xml
```
完成之后开始进入jenkins页面.
![图片](https://s3.bmp.ovh/imgs/2022/05/03/c22c97e9958e34d6.png)
这里的密码需要去里面获取(注意:每个人的安装存放jenkins的位置可能不一样,所以需要按照图上显示的地址获取密码.)
```
cat /var/jenkins/jenkins_home/secrets/initialAdminPassword 
```
进入jenkins之后,要去插件时间安装两个插件
- Nodejs Plugin
- Publish Over SSH
---
![图片](https://s3.bmp.ovh/imgs/2022/05/04/90578a9132b56e08.png)
![图片](https://s3.bmp.ovh/imgs/2022/05/04/4bf66e0d3d0d3729.png)
![图片](https://s3.bmp.ovh/imgs/2022/05/04/f415b3487c087192.png)

---

然后我们再去设置一下这两个插件
![图片](https://s3.bmp.ovh/imgs/2022/05/04/24e76b44c32f62be.png)
1. 先是nodejs,按照上面的图点击之后滑到最下面,就可以设置nodejs
![图片](https://s3.bmp.ovh/imgs/2022/05/04/4e2c461956d68f43.png)
2. 然后是Publish Over SSH
![图片](https://s3.bmp.ovh/imgs/2022/05/04/a6d8614b157a5a52.png)
![图片](https://s3.bmp.ovh/imgs/2022/05/04/d1678f2293bfe7e2.png)

---

然后我们在jenkins新增一个构建任务
![图片](https://s3.bmp.ovh/imgs/2022/05/04/22e5f024a21b37d7.png)
![图片](https://s3.bmp.ovh/imgs/2022/05/04/4f6e01368dbf9107.png)
![图片](https://s3.bmp.ovh/imgs/2022/05/04/fa3746da718ef8eb.png)

---

设置完成之后我们就开始在本地新建一个项目,我这里是用vue
```
vue create deploy-test
```
生成好之后,我们要新增三个文件
Dockerfile
```bash
FROM nginx:latest # 拉取最新的nginx镜像
# 将项目根目录下dist文件夹下的所有文件复制到镜像中 /usr/share/nginx/html/ 目录下
COPY dist/ /usr/share/nginx/html/
# 将项目根目录下的default.conf文件复制到镜像中的 /etc/nginx/conf.d/default.conf
COPY default.conf /etc/nginx/conf.d/default.conf

```
deploy.sh
```bash
#!/usr/bin/env bash
# 打包
npm run build

# 进入jenkins打包之后生成的目录(注意每个人的目录可能不一样,你自己需要查看)
# 注意:后缀的test,就是你在jenkins里面创建的项目名字
cd /var/lib/jenkins/workspace/test

# 停止镜像deploy-test
sudo docker stop deploy-test

# 移除镜像deploy-test
sudo docker rm deploy-test

# 打包镜像,名字为admin
sudo docker build -t admin .

# -d后台方式运行
# -p 8136:80 端口映射，将宿主的8136端口映射到容器的80端口
# –name 容器名 镜像名
sudo docker run -d -p 8136:80 --name deploy-test admin

```
default.conf
```bash
server {
    listen       80;
    server_name  xxx; # 修改为服务宿主机的ip/域名
    
    #charset koi8-r;
    access_log  /var/log/nginx/host.access.log  main;
    error_log  /var/log/nginx/error.log  error;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html =404;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }
    
    }
```
因为我此次演示用的是码云,所以我在码云创建了一个仓库地址,然后把刚刚新建好的项目推送到了码云(https://gitee.com/).
然后我们再去jenkins的用户列表中获取token
![图片](https://s3.bmp.ovh/imgs/2022/05/04/132a8d7d12434292.png)
![图片](https://s3.bmp.ovh/imgs/2022/05/04/27b36a8f4d56f2a2.png)

然后我们从码云里面的管理入口设置一下WebHook.
![图片](https://s3.bmp.ovh/imgs/2022/05/04/2d2f7802204e45d3.png)
这里的URL是jenkins构建的地址
http://xxx.xx.xx.xx:8080/job/test/build?token=这里填写上面的token

设置完成之后,我就开始测试以下webhook通不通
![图片](https://s3.bmp.ovh/imgs/2022/05/04/317d694aae8396b6.png)

<font color="Red">注意,如果不成功的返回403的朋友.那是因为jenkins有CSRF的保护.所以我们需要去jenkins设置取消防止CSRF的策略</font>
所以我们需要去jenkins设置一下
![图片](https://s3.bmp.ovh/imgs/2022/05/04/43333c4b50000acf.png)
然后滑到最下面
![图片](https://s3.bmp.ovh/imgs/2022/05/04/f73027983e792ef1.png)
输入:
```bash
hudson.security.csrf.GlobalCrumbIssuerConfiguration.DISABLE_CSRF_PROTECTION = true
```
![图片](https://s3.bmp.ovh/imgs/2022/05/04/70d484c71d4cd9b4.png)
这样就重试好了,然后我们在点击WebHook的测试.此时应该就可以了.如果碰到其他问题,可以网上百度.

---

## 结束
现在我们把本地代码推送到码云仓库里面,此时就可以看到一条jenkins的构建记录了.然后我们再打开你的网站就可以看到你部署上去的内容了.我这里是http://xxx.xx.xx.xx:8136.这样来查看
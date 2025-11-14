## 背景

防止项目中表单有重复提交.当时拿到这个需求的时候,心里就想在全局请求封装的 axios 中增加一个全屏幕 loading 应该就可以了,但是当我把这个效果坐上去之后,发现整个项目都变得非常的难看,因为页面一直在 loading 中...于是乎我想了另外一种办法,就是在封装的 axios 的拦截器中做一些处理.当发起请求时,请求还没有响应的时候,再次发起请求就会拦截或者说是取消掉这次的请求,并把等待同段时间内已经请求的结果返回给已经取消的请求,这样就不会影响到业务了.

---

### 思路
1. 我们必须有一个请求池来保存每一次请求的记录,这样当我们在请求时,请求完成和请求失败的时候都能够做对应的处理.
2. 请求的时候需要往这个请求池中添加当前请求的唯一标识
3. 请求成功和请求失败的时候需要往这个请求池中移除当前请求的唯一标识
4. 当多个请求中,发起请求的实例拿到结果,则把当前结果通知给同段时间内取消请求的实例

- 第一个问题是,我们应该如何如果把一个请求作为一个标识储存在请求池中间呢?其实也很简单,每个请求都会有 url,method,params,data 等参数.如果我们把一个请求的以上参数序列化之后作为一个标识放入请求池中,就可以解决请求池中每个请求的唯一性问题.
- 第二个问题是,如果在 axios 中的请求拦截器监听到了重复的请求,应该如何处理?我们去 axios 的文档中可以看到,axios 有一个 CancelToken 的方法,当我们监听到了重复的请求的时候就往当前请求的配置中增加一个 CancelToken,把这次请求的取消掉.
- 第三个问题是,如果把同一段事件内的重复请求返回给已经取消的请求(听起来有点拗口).比如同段事件内发出了3个请求,q1,q2,q3,此时q2和q3是会被拦截取消的.那么我们怎么把q1的结果给到q2,q3.这里我们可以用到发布订阅模式,我们可以订阅已经取消的请求,当q1的结果返回的时候,在把结果通知订阅者.

---

### axios 的源码
```js
lib / adapters / xhr;
if (config.cancelToken) {
  // Handle cancellation
  config.cancelToken.promise.then(function onCanceled(cancel) {
    if (!request) {
      return;
    }
    request.abort();
    reject(cancel);
    // Clean up request
    request = null;
  });
}
```
### 实现代码如下

```js
const ControlRequest = {
  requestRecord: {},
  resolver: {},
  rejecter: {},
  add(request) {
    const serialized = this.handleSerialize(request);
    this.requestRecord[serialized] = this.resolver[serialized] = this.rejecter[
      serialized
    ] = true;
  },
  get(request) {
    const serialized = this.handleSerialize(request);
    return this.requestRecord[serialized];
  },
  success(request) {
    const serialized = this.handleSerialize(request);
    this.resolver[serialized] && this.handleClean(request);
  },
  fail(request) {
    const serialized = this.handleSerialize(request);
    this.rejecter[serialized] && this.handleClean(request);
  },
  handleClean(request) {
    const serialized = this.handleSerialize(request);
    delete this.resolver[serialized];
    delete this.rejecter[serialized];
    delete this.requestRecord[serialized];
  },
  // 序列化每一个请求的标识
  handleSerialize(request) {
    const { method, params, body, url, data } = request;
    const sData = typeof data === "string" ? JSON.parse(data || "{}") : data;
    return JSON.stringify({ method, params, body, url, sData });
  },
};
```

### 在业务中使用

```js
import Vue from "vue"; // 由于使用的是vue框架,所以这里用了vue的$emit和$on事件
import axios from "axios";
const vueInstance = new Vue();
const instance = axios.create({});
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

// 请求拦截
instance.interceptors.request.use(
  function (config) {
    const requesting = ControlRequest.get(config);
    if (requesting) {
      // 如果有重复请求的情况,直接取消请求
      config.cancelToken = source.token;
      source.cancel(config);
      return config;
    }

    ControlRequest.add(request);

    return request;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 响应拦截
instance.interceptors.response.use(
  function (response) {
    const requestKey = ControlRequest.handleSerialize(response.config);
    requestKey && vueInstance.$emit(requestKey, response); // 如果在同段事件内有重复请求的情况,则直接通知订阅者
    ControlRequest.success(response.config);
    return response;
  },
  function (error) {
    // 这里注意,如果是被axios取消的请求也会走到这个error中,我们要排除那些被axios取消的请求.
    !error.__CANCEL__ && ControlRequest.fail(error.config);
    return Promise.reject(error);
  }
);
//  处理响应结果
const handleResponse = (response, resolve, reject) => {
  const result = response?.data;
  const resultCode = result?.resultCode;
  resultCode === 0 ? resolve(resultData) : reject(resultData);
};
function requestHandle(params) {
  // 这里是关键,包裹一层promise返回
  return new Promise((resolve, reject) => {
    instance(params)
      .then((response) => {
        // 业务结果处理
        handleResponse(response, resolve, reject);
      })
      .catch(function (err) {
        switch (true) {
          case err.__CANCEL__:
            const {
              message: { url },
            } = err;
            const requestKey = ControlRequest.handleSerialize(err.message);
            // 订阅重复请求事件,把同段时间内已经请求的结果返回
            vueInstance.$on(requestKey, (response) =>
              handleResponse(response, resolve, reject)
            );
            break;
          default:
            reject(err);
        }
      });
  });
}
```
# 总结
可能还有很多地方没有考虑全.如果哪里写的不对,还请各位指点.

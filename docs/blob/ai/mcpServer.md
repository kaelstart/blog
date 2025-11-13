# 使用 MCP + DeepSeek + OpenWeatherMap 构建智能天气查询服务器

本文主要是自己学习开发mcp server的一篇文章，主要是基于 **Model Context Protocol（MCP）** 与 **DeepSeek** 模型的智能天气查询服务器，
它能够理解用户输入的自然语言，从中提取城市名，并调用 **OpenWeatherMap API** 获取实时天气信息，最后由大模型生成自然语言回复

---

## 技术栈简介

这段代码主要使用了以下技术：

| 技术 | 用途 |
|------|------|
| **MCP（Model Context Protocol）** | 用于实现 AI 应用的服务端通信协议。 |
| **DeepSeek** | 一个开源的多模态大语言模型，用于理解和生成文本。 |
| **OpenWeatherMap API** | 提供实时天气数据。 |
| **Axios** | 负责向外部 API 发起 HTTP 请求。 |
| **Zod** | 用于参数类型定义和校验。 |


```js
// package.json
{
  "name": "mcp-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "typescript": "^5.7.2"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.4.0",
    "axios": "^1.12.2",
    "openai": "^6.3.0"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": ""
}

```
---

## 引入mcp相关的第三方依赖

```js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; 
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod"; // 做输入校验
import axios from "axios";
import OpenAI from "openai";

// 创建 DeepSeek 客户端
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com', // deepseek上面找的
  apiKey: "",
});

// 创建 MCP 服务器实例
const server = new McpServer({
  name: "TimeServer",
  version: "1.0.0",
});
```

---

## 注册工具：getWeather

通过 `server.tool()` 注册一个名为 **getWeather** 的工具。

```js
server.tool("getWeather", "查询指定城市的实时天气信息",
  {
    prompt: z.string().optional().describe("要查询的城市名，例如 Beijing"),
  },
  async ({ prompt }) => {
```

### 参数说明：
- `getWeather`：工具名称。
- `"查询指定城市的实时天气信息"`：描述。
- `zod` 模式定义了输入参数 `prompt`，即用户输入的自然语言（例如 “帮我查下北京的天气”）。

---

## AI 理解用户意图（城市名提取）

第一步是让 **DeepSeek 模型** 读取用户输入，从中提取出城市名。

```js
const intentPrompt = `
你是一个意图分析助手。用户输入是自然语言，请从中提取“城市名”。
只返回城市名（如 Beijing、Shanghai,Guangzhou, 北京，上海，广州），不要解释。
如果无法确定，请返回“未知”。
用户输入：${prompt}
`;

const aiResult = await openai.chat.completions.create({
  messages: [
    { role: "system", content: "你是一个简洁的提取助手。" },
    { role: "user", content: intentPrompt }
  ],
  model: "deepseek-chat",
});
```

**功能说明：**
- 模型角色分为：
  - `system`：设定模型行为。
  - `user`：提供指令内容。
- 模型输出 `aiResult.choices[0].message.content`，即识别出的城市名。

如果无法提取城市名，则返回“未知”。

---

## 调用天气 API

当城市名识别成功后，程序会调用 **OpenWeatherMap API** 获取该城市的实时天气：

```js
const apiKey = "填写你的apiKey,要去OpenWeatherMap申请";
const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&lang=zh_cn&units=metric`;

const weatherResponse = await axios.get(url);
```

**参数说明：**
- `q`：查询城市。
- `appid`：API 密钥。
- `lang=zh_cn`：返回中文天气描述。
- `units=metric`：使用摄氏度。

随后拼接天气摘要：

```js
const summary = `现在${weatherResponse.data.name}的天气是${weatherResponse.data.weather[0].description}，
温度${weatherResponse.data.main.temp}°C，湿度${weatherResponse.data.main.humidity}% ，
风速${weatherResponse.data.wind.speed}米每秒。`;
```

---

## 用 DeepSeek 生成自然语言回复

为了让返回结果更加自然和人性化，我们再次调用 **DeepSeek 模型**：

```js
const chatPrompt = `
你是一位天气助手，用自然对话的方式回答用户的问题。
请用温和自然的语气回答以下内容，不要只是罗列数据。

用户的问题：${prompt}
天气数据：${summary}
`;

const completion = await openai.chat.completions.create({
  messages: [
    { role: "system", content: "你是一个友好的中文天气助理。" },
    { role: "user", content: chatPrompt }
  ],
  model: "deepseek-chat",
});
```

输出结果即为自然语言回复，例如：

> “今天北京的天气晴朗，气温大约 26°C，风不大，适合外出。”

最终返回：

```js
return {
  content: [{ type: "text", text: completion.choices[0].message.content }]
};
```

---

## 启动 MCP 服务器

最后，通过标准输入输出通道启动服务器：

```js
async function startServer() {
  try {
    console.error("正在启动 MCP 时间服务器...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP 时间服务器已启动，等待请求...");
  } catch (error) {
    console.error("启动服务器时出错:", error);
    process.exit(1);
  }
}

startServer();
```
---

## 项目运行步骤

运行以下命令，执行完成后会在本地启动一个服务，方便我们调试我们的mcp server http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=xxx#tools
```bash
npx @modelcontextprotocol/inspector node index.js
```

运行后终端输出：
```
正在启动 MCP 时间服务器...
MCP 时间服务器已启动，等待请求...
```

## 结果
![images](https://yuanlifang.oss-cn-shenzhen.aliyuncs.com/2433ab4c-563c-489d-8006-78f2ec662369-111.png)

## 完整代码

```js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import OpenAI from "openai";
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: "",
});
const server = new McpServer({
  name: "TimeServer", // 服务器名称
  version: "1.0.0", // 服务器版本
});

server.tool("getWeather", "查询指定城市的实时天气信息",
  {
    prompt: z
      .string()
      .optional()
      .describe(
        "要查询的城市名，例如 Beijing"
      ),
  },
  async ({ prompt }) => {
    // 拼接API请求URL
    try {
      // 🧠 第1步：调用 DeepSeek 模型理解用户意图
      const intentPrompt = `
你是一个意图分析助手。用户输入是自然语言，请从中提取“城市名”。
只返回城市名（如 Beijing、Shanghai,Guangzhou, 北京，上海，广州），不要解释。
如果无法确定，请返回“未知”。
用户输入：${prompt}
`;
      const aiResult = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "你是一个简洁的提取助手。" },
          { role: "user", content: intentPrompt }
        ],
        model: "deepseek-chat",
      });
      console.error('aiResult',aiResult)
      const city = aiResult.choices[0].message.content || "未知";
      if (city === "未知") {
        return {
          content: [
            { type: "text", text: "抱歉，我没能理解你要查询哪个城市的天气。" }
          ]
        };
      }

      const apiKey = "";
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&lang=zh_cn&units=metric`;

      // 调用OpenWeatherMap API
      const weatherResponse = await axios.get(url);
      console.error('weatherResponse', weatherResponse)
      const summary = `现在${weatherResponse.data.name}的天气是${weatherResponse.data.weather[0].description}，温度${weatherResponse.data.main.temp}°C，湿度${weatherResponse.data.main.humidity}% ，风速${weatherResponse.data.wind.speed}米每秒。`;
      // 💬 第3步：调用 DeepSeek 生成自然语言回复
      const chatPrompt = `
你是一位天气助手，用自然对话的方式回答用户的问题。
请用温和自然的语气回答以下内容，不要只是罗列数据。

用户的问题：${prompt}
天气数据：${summary}
`;


      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "你是一个友好的中文天气助理。" },
          { role: "user", content: chatPrompt }
        ],
        model: "deepseek-chat",
      });

      console.error("Model is:", completion.model)
      console.error("Output is:", completion.choices[0].message.content);

      // ✅ 第4步：返回最终结果
      return {
        content: [{ type: "text", text: completion.choices[0].message.content }]
      };
    } catch (error) {
      // 如果API调用失败
      return {
        content: [{ type: "text", text: `获取天气失败：${error.message}` }]
      };
    }
  }
);

/**
 * 启动服务器，连接到标准输入/输出传输
 */
async function startServer() {
  try {
    console.error("正在启动 MCP 时间服务器...");
    // 创建标准输入/输出传输
    const transport = new StdioServerTransport();
    // 连接服务器到传输
    await server.connect(transport);
    console.error("MCP 时间服务器已启动，等待请求...");
  } catch (error) {
    console.error("启动服务器时出错:", error);
    process.exit(1);
  }
}

startServer();

```

---


---
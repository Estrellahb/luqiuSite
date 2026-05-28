---
title: Pi 接入自定义 API 中转站踩坑笔记
icon: network-wired
date: 2026-05-26
category:
  - 技术笔记
tag:
  - API
  - 中转站
  - Pi
---

# Pi 接入自定义 API 中转站踩坑笔记

## 1. Pi 自定义 API 配置文件位置

Pi 接入自定义中转站，配置位置在本地配置文件，不是 `/login` 界面里直接填。

### Windows

```powershell
notepad $env:USERPROFILE\.pi\agent\models.json
```

如果目录不存在，先创建：

```powershell
mkdir $env:USERPROFILE\.pi\agent -Force
```

### Linux / macOS

```bash
mkdir -p ~/.pi/agent
nano ~/.pi/agent/models.json
```

## 2. OpenAI 兼容中转站推荐配置

如果中转站是 OpenAI Chat Completions 兼容接口，例如：

```
https://example.com
```

通常要在 `models.json` 里写成：

```json
{
  "providers": {
    "proxy-chatgpt": {
      "baseUrl": "https://example.com/v1",
      "api": "openai-completions",
      "apiKey": "你的中转站访问Key",
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false,
        "supportsUsageInStreaming": false,
        "maxTokensField": "max_tokens"
      },
      "models": [
        {
          "id": "gpt-5.5",
          "name": "gpt-5.5",
          "reasoning": true,
          "contextWindow": 400000,
          "maxTokens": 16384
        },
        {
          "id": "gpt-5.4",
          "name": "gpt-5.4",
          "reasoning": true,
          "contextWindow": 128000,
          "maxTokens": 16384
        }
      ]
    }
  }
}
```

### 配置说明

- **baseUrl**：中转站的请求地址，记得在域名后加上 `/v1`，否则会 404。
- **api**：固定为 `openai-completions`，不能自定义，否则会报错。
- **compat**：兼容性配置。如果中转站不支持某些特性，对应字段设为 `false` 即可。
- **models**：模型列表。`id` 和 `name` 通常保持一致，`reasoning` 表示是否支持推理能力，`contextWindow` 和 `maxTokens` 根据中转站实际支持的额度填写。

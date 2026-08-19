---
title: PVE通过LXC安装openclaw
date: 2026-04-09 22:58:44+08:00
updated: 2026-04-09 22:58:44+08:00
description: "2026/4/1更新：选择模型是Custom Provider为第三方模型供应商。配置文件中 groq/nvidia/nemotron-3-super-120b-a12b:free 多层嵌套的坑修复了。CT模板为debian13CT配置没什…"
halo_post_name: 019d73fa-2b5a-74ec-83b2-369b2ec8fc92
---

<p style="">2026/4/1更新：选择模型是Custom Provider为第三方模型供应商。</p><p style="">配置文件中 groq/nvidia/nemotron-3-super-120b-a12b:free 多层嵌套的坑修复了。</p><p style=""></p><p style="">CT模板为debian13</p><p style="">CT配置没什么好讲的cpu，内存，硬盘按照需要设置就好了</p><h2 style="" id="1.%E5%AE%89%E8%A3%85%E8%AE%BE%E7%BD%AEopenclaw">1.安装设置openclaw</h2><p style="">通过官网的一键脚本<code>curl -fsSL https://openclaw.ai/install.sh | bash</code> 运行安装即可，npm安装可能会比较慢有需要的可以用<code>curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git</code> 来使用git安装openclaw</p><p style="">默认设置基本可以全部跳过，后面按照需要酌情开启即可，虽然模型提供商可以跳过但是他还是会要求你填写模型信息，随便填即可不影响后续设置操作</p><p style=""></p><p style="">安装后会显示面板信息连接地址之类的信息，需要注意的是我们是通过pve来安装的，所以是无法通过简单的ip:端口来使用web ui的</p><p style="">此时在本机打开cmd执行 <code>ssh -N -L 需要的本机端口:127.0.0.1:18789 root@192.168.0.12</code> 来将openclaw的端口映射到本地即可</p><h2 style="" id="2.%E8%AE%BE%E7%BD%AE%E7%AC%AC%E4%B8%89%E6%96%B9%E6%A8%A1%E5%9E%8B">2.设置第三方模型</h2><p style="">openclaw用起來很费token用官方api贵的很，所以我采用第三方api</p><p style="">设置第三方模型可以通过配置文件或web ui来完成</p><h3 style="" id="1.%E9%80%9A%E8%BF%87%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E8%AE%BE%E7%BD%AE">1.通过配置文件设置</h3><p style="">配置文件默认在 ~/.openclaw/openclaw.json</p><p style="">在配置文件末尾添加(如果有models则直接改即可)</p><pre><code>{
  "models": {
    "providers": {
      "&lt;provider-name&gt;": {                      // 模型提供商
        "baseUrl": "https://api.example.com",  // API基础URL
        "apiKey": "sk-xxx",                    // API密钥
        "api": "openai-completions",          // API类型
        "models": [                           // 可用模型列表
          {
            "id": "model-name",               // 模型ID
            "name": "显示名称",               // 模型显示名称
            "reasoning": true,                // 是否支持推理
            "input": ["text", "image"],       // 支持的输入类型
            "cost": {                         // 成本配置
              "input": 0.1,                   // 输入token成本
              "output": 0.3,                  // 输出token成本
              "cacheRead": 0.01,              // 缓存读取成本
              "cacheWrite": 0.05              // 缓存写入成本
            },
            "contextWindow": 128000,          // 上下文窗口大小
            "maxTokens": 4096                 // 最大输出token数
          }
        ]
      }
    }
  }
}</code></pre><p style="">上面的配置文件属于最简单的，还有token数量上下文之类的精细设置在web中好设置一点</p><p style="">下面修改默认模型和模型列表</p><pre><code>{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-4o",       // 主要模型
        "fallbacks": [                    // 回退模型列表
          "anthropic/claude-3-5-sonnet",
          "deepseek/deepseek-chat"
        ]
      },
      "models": {                         // 模型别名和参数
        "openai/gpt-4o": {
          "alias": "GPT-4o",              // 别名
          "params": {
            "temperature": 0.7,           // 温度
            "max_tokens": 4096,           // 最大token
          },
          "streaming": true  # 是否开启流式传输
        }
      },
      "workspace": "~/.openclaw/workspace",  // 工作区路径
      "compaction": {                        // 压缩配置
        "mode": "safeguard"                  // 模式：safeguard/aggressive/off
      },
      "maxConcurrent": 4,                    // 最大并发数
      "subagents": {                         // 子代理配置
        "maxConcurrent": 8,                  // 子代理最大并发数
        "allowAgents": []                    // 允许的子代理列表
      }
    }
  }
}</code></pre><p style="">此处有一个大坑，由于一些模型提供商的模型是多层结构如：groq/nvidia/nemotron-3-super-120b-a12b:free，那么此时如果你将id和name都设置为nvidia/nemotron-3-super-120b-a12b:free，就会报错因为openclash不允许多层，但是如果name只设置为nvidia那么就会找不多模型</p><p style="">解法就是设置为groq/nemotron-3-super-120b-a12b:free</p><p style="">或者通过别名来解决</p><p style="">这个坑即使是openclaw自带的模型提供商也有并且用上面说的解法也没用</p><p style="">这个时候就作为第三方模型提供商加入即可，名字稍微有点区别即可</p><p style="">Cloudflare现在支持作为模型网关，可以直接使用cf来作为第三方中继，效果还不错并且可以解决部分网络问题</p>

---
title: cf woker pages反代trojan节点使用教程
date: 2025-01-11 19:00:25+08:00
updated: 2025-01-11 19:00:25+08:00
description: cf worker pages反代trojan以及Vless节点使用教程 pages节点国内可访问无需绑定域名可以做到真免费，worker部署过程类似但需要绑定域名请自行探索。 通过cf worker或cf worker pages可以实现…
categories:
  - 实用
tags:
  - 实用
  - VPN
  - 加速器
  - 机场
halo_post_name: 857ed09d-310a-42f2-b0a0-51da9babfa7c
---

# cf worker pages反代trojan以及Vless节点使用教程
pages节点国内可访问无需绑定域名可以做到真免费，worker部署过程类似但需要绑定域名请自行探索。  
通过cf worker或cf worker pages可以实现免费的代理功能。  
因为cf帐号无需任何条件所以推荐自建以防止公用的流量用完。  
目前我提供的有```wgaw-eu8.pages.dev, trojan-10u.pages.dev```
修改伪装域名和sni即可，流量用完后就会暂停，每天早上8点刷新，推荐自建自己用不会很快用完。  
**无设备需求，想用什么用什么！**
[原项目地址](https://github.com/yonggekkk/Cloudflare_vless_trojan)

## 懒人订阅链接
[右键或长按复制clash订阅链接](https://image.mhdy.net/clash.yaml)  
```
https://image.mhdy.net/clash.yaml
```
[右键复制V2订阅链接](https://image.mhdy.net/2025-02-11-12-28-36_v2.txt)
```
https://image.mhdy.net/2025-02-11-12-28-36_v2.txt
```
单节点
```
trojan://mohuangdiyu@skk.moe:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D129.158.198.241%3A2053#🇺🇸美国阿什本
trojan://mohuangdiyu@fbi.gov:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D8.219.212.96%3A443#🇸🇬新加坡阿里云1
trojan://mohuangdiyu@fbi.gov:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D8.219.141.205%3A443#🇸🇬新加坡阿里云2
trojan://mohuangdiyu@fbi.gov:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D8.222.144.225%3A443#🇸🇬新加坡阿里云3
trojan://mohuangdiyu@fbi.gov:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D129.146.168.102%3A443#🇺🇸美国凤凰城
trojan://mohuangdiyu@www.ipchicken.com:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D158.180.231.216%3A443#🇮🇹意大利伦巴第大区
trojan://mohuangdiyu@www.ipchicken.com:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D141.145.217.226%3A443#🇫🇷法国巴黎
trojan://mohuangdiyu@skk.moe:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D192.9.236.144%3A443#🇺🇸美国圣何塞
trojan://mohuangdiyu@skk.moe:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D158.101.209.76%3A443#🇳🇱荷兰阿姆斯特丹
trojan://mohuangdiyu@www.csgo.com:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D129.154.207.203%3A443#🇰🇷韩国首尔1
trojan://mohuangdiyu@www.pcmag.com:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D152.70.90.168%3A443#🇰🇷韩国首尔2
trojan://mohuangdiyu@fbi.gov:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D131.186.17.132%3A443#🇰🇷韩国首尔
trojan://mohuangdiyu@icook.tw:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D150.230.196.248%3A443#🇯🇵日本东京
trojan://mohuangdiyu@www.digitalocean.com:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D158.180.82.186%3A443#🇰🇷韩国春川
trojan://mohuangdiyu@www.zsu.gov.ua:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D158.180.82.186%3A443#🇰🇷韩国春川2
trojan://mohuangdiyu@fbi.gov:8443?security=tls&sni=wgaw-eu8.pages.dev&fp=random&type=ws&host=wgaw-eu8.pages.dev&path=%2Fpyip%3D8.219.142.68%3A443#🇸🇬新加坡阿里云主推
```
### Vless部分
``vless://ce2b1a54-9c4d-4383-86a0-4913a040f4eb@yg1.ygkkk.dpdns.org:8443?encryption=none&security=tls&type=ws&host=vless.64396439.xyz&sni=vless.64396439.xyz&fp=chrome&path=%2F%3Fed%3D2560#vless.64396439.xyz``
其他软件可以看https://vless.64396439.xyz/ce2b1a54-9c4d-4383-86a0-4913a040f4eb

## 自建教程
Vless只需要复制js粘贴后修改域名以及uuid即可，[项目地址和注意事项](https://github.com/yonggekkk/Cloudflare-vless-trojan/blob/main/Vless_workers_pages/%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E.txt)

### 视频教程
**视频教程可以直接去看[甬哥侃侃侃ygkkk](https://www.youtube.com/watch?v=QSFaP5EVI04)的视频**  

<iframe width="560" height="315" src="https://www.youtube.com/embed/QSFaP5EVI04?si=MqGAmuzZqoh-QPxZ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>  

如果你想要更换入口和出口可以[CDN优选域名V23.8.18(电脑win64).exe](https://github.com/yonggekkk/Cloudflare_vless_trojan/raw/refs/heads/main/CDN%E4%BC%98%E9%80%89%E5%9F%9F%E5%90%8DV23.8.18(%E7%94%B5%E8%84%91win64).exe)以及[CF优选官方IP(无交互三地区电脑版).zip](https://github.com/yonggekkk/Cloudflare_vless_trojan/raw/refs/heads/main/CF%E4%BC%98%E9%80%89%E5%AE%98%E6%96%B9IP(%E6%97%A0%E4%BA%A4%E4%BA%92%E4%B8%89%E5%9C%B0%E5%8C%BA%E7%94%B5%E8%84%91%E7%89%88).zip)进行更换，详情可以看上面的视频教程。  
推荐使用自建的，每日请求数量有限。  
### 图文教程
**下面是图文版**
1. [下载js](https://raw.githubusercontent.com/yonggekkk/Cloudflare-vless-trojan/refs/heads/main/Trojan_workers_pages/_worker.js)  
2. 将下载好的js放入一个任意名字的文件夹
3. <img src="https://image.mhdy.net/2025-01-13-23-16-17_20250113231617104.png" width="40%"> 点击进入创建pages，选上传资产，项目名称任意，将包含js的文件夹拖入后点击部署站点。
4. 此时访问域名会无法连接属于正常现象，过5分钟左右即可。
5. <img src="https://image.mhdy.net/2025-01-13-23-21-40_20250113232140223.png" width="40%"> 来来到pages的设置添加变量名称为pswd，值为你想要的密码任意英文数字字符即可。
6. 因为设置了密码所以需要重新部署(pages每次修改都需要重新部署)，点击右上角的创建部署，拖入文件夹保存并部署即可。
7. 此时访问默认域名加上你的密码即可显示如：https://wgaw-eu8.pages.dev/mohuangdiyu
8. 此时可以直接使用或按照下面的更换出入口的方式进行修改，推荐v2修改较为方便。
9. <img src="https://image.mhdy.net/2025-01-13-23-40-15_20250113234015831.png" width="40%"><strong>想要更换不同的pages直接修改trojan中的伪装域名和sni即可。从我上面提供的pages.dev域名选择即可</strong>

## 更换入口以及更换出口
通过更换出入口已提升速度降低延迟。  
**不同的入口搭配不同的出口效果差距很大，且出入口可以可以通用，入口可以当出口，出口也可以当入口**  
### 使用CDN优选域名
[点击下载](https://github.com/yonggekkk/Cloudflare_vless_trojan/raw/refs/heads/main/CDN%E4%BC%98%E9%80%89%E5%9F%9F%E5%90%8DV23.8.18(%E7%94%B5%E8%84%91win64).exe) 或自己寻找别的方式如yonggekkk的github。  
1. 首先关闭所有的代理！
2. 双击运行。
3. 等待运行完成后退出即可。
4. 查看运行目录 中的CDNym.txt，会按照你本地网络的延迟进行排序。
5. 选择你需要用的入口替换节点的地址<img src="https://image.mhdy.net/2025-01-13-21-49-30_20250113214930448.png" width="40%">
6. 此时右键你更改过的节点选择测试真连接如有延迟说明可以使用，此时可以去youtube上找个4k视频测试下如[4K Video ULTRA HD](https://www.youtube.com/watch?v=MXTbTpzs7tU)。
7. 你可以自己一个一个试直到满意为止

### 使用cf反代ip优选
[点击下载](https://github.com/yonggekkk/Cloudflare_vless_trojan/raw/refs/heads/main/CF%E4%BC%98%E9%80%89%E5%8F%8D%E4%BB%A3IP(%E7%94%B5%E8%84%91%E7%89%88).zip) 或自己寻找别的方式如yonggekkk的  
1. 双击批处理启动
2. 第一次运行选1后续默认即可
3. 推荐选2自定义端口
4. TLS都可此处选1开启TLS
5. 端口都可以试一遍
6. 后面的出文件名外均默认即可，最多测试ip数量直接999即可
7. 此方式需要根据你所选的端口进行修改如：<img src="https://image.mhdy.net/2025-01-13-22-32-24_20250113223224175.png" width="40%">

### 使用CF优选IP
更换出口会更换你的出口ip，使用各种网站可以看到你的ip是否有变化如：[ping0](https://ping0.cc)  
这里使用[无交互版本](https://github.com/yonggekkk/Cloudflare_vless_trojan/raw/refs/heads/main/CF%E4%BC%98%E9%80%89%E5%AE%98%E6%96%B9IP(%E6%97%A0%E4%BA%A4%E4%BA%92%E4%B8%89%E5%9C%B0%E5%8C%BA%E7%94%B5%E8%84%91%E7%89%88).zip) 带交互的版本请自行尝试[交互](https://github.com/yonggekkk/Cloudflare_vless_trojan/raw/refs/heads/main/CF%E4%BC%98%E9%80%89%E5%AE%98%E6%96%B9IP(%E7%94%B5%E8%84%91%E7%89%88).zip)  
1. 根据你的网络选择V4或V6，这里我用V4
2. 运行完成后查看ip.csv进行选择出口即可如：<img src="https://image.mhdy.net/2025-01-13-22-43-04_20250113224304652.png" width="40%">
3. 此方法无法测速，请自行尝试。

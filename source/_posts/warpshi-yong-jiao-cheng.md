---
title: WARP使用教程
date: 2025-01-11 07:16:11+08:00
updated: 2025-01-11 07:16:11+08:00
description: WARP使用教程 本文旨在教你如何使用WARP。 因为⚫⚫原因在部分地区部分网络可能会无法使用WARP属于正常现象。 1.注册Cloudflare帐号 没有要求，带点脑子都随便注册 2.下载WARP 安卓手机直接在Google play下载…
categories:
  - 实用
tags:
  - VPN
  - 加速器
  - 实用
halo_post_name: 16c423a0-f624-4c8c-8824-3bddd36f4b45
---

# WARP使用教程
本文旨在教你如何使用WARP。  
因为⚫⚫原因在部分地区部分网络可能会无法使用WARP属于正常现象。  
## 1.注册Cloudflare帐号
~~没有要求，带点脑子都随便注册~~
## 2.下载WARP
安卓手机直接在Google play下载即可，其他平台可以去[1.1.1.1](1.1.1.1)进行下载(1.1.1.1需代理)。
## 3.Zero Trust
### 3.1.打开Zero Trus
<img src="https://image.mhdy.net/2025-01-11-14-08-29_20250111140829516.png" width="10%" />  

### 3.2.注册或更改Zero Trust组织名
现在新注册应该是默认将你的邮箱或用户名做为组织名称的。  
需要更换组织名称的话点击设置->自定义页面
<img src="https://image.mhdy.net/2025-01-11-14-22-13_20250111142213549.png" width="40%">
1.的`mhdy2233-foxmail.cloudflareaccess.com`中的`mhdy2233-foxmail`为你的组织名，需要更改请点击2.编辑保存即可。  
<img src="https://image.mhdy.net/2025-01-11-14-26-23_20250111142623141.png" width="40%">

### 3.3.编辑你的warp用户注册规则(可选)
如果你想让朋友和你使用同一个组织的话可以选择更改规则。  
点击设置->WARP客户端->管理设备注册权限->添加规则，根据需要填写即可。(一般只要你不泄漏自己的组织名称修不修改是无所谓的)
<img src="https://image.mhdy.net/2025-01-11-14-31-44_20250111143144444.png" width="40%">
<img src="https://image.mhdy.net/2025-01-11-14-32-39_20250111143239575.png" width="40%">

在概述界面可以看到免费版本一共可以有50个用户
<img src="https://image.mhdy.net/2025-01-11-14-37-54_20250111143754354.png" width="40%">

在我的团队->用户中可以看到当前组织中的所有用户，点击用户最右边的三个点可以进行撤销会话，删除用户等操作
<img src="https://image.mhdy.net/2025-01-11-14-39-35_20250111143935934.png" width="40">

## 4.WARP的使用教程
过程中推荐开启代理，cf国内浏览较为缓慢。
### 4.1.安卓
打开1.1.1.1选择右上角的三条杠
<img src="https://image.mhdy.net/2025-01-11-14-47-44_Screenshot_2025-01-11-13-52-32-813_com.cloudflare.onedotonedotonedotone.jpg" width="10%">
点击账户
<img src="https://image.mhdy.net/2025-01-11-14-48-56_Screenshot_2025-01-11-13-52-37-262_com.cloudflare.onedotonedotonedotone.jpg" width="10%">
点击登录到Cloudflare Zero Trust
<img src="https://fj.mhdy.shop/2025-01-11-14-49-19_Screenshot_2025-01-11-13-52-40-721_com.cloudflare.onedotonedotonedotone.jpg" width="10%">
输入你的组织名
<img src="https://fj.mhdy.shop/2025-01-11-14-49-48_Screenshot_2025-01-11-13-52-47-377_com.cloudflare.onedotonedotonedotone.jpg" width="10%">
输入你要使用的邮件然后接码注册
<img src="https://image.mhdy.net/2025-01-11-14-50-10_Screenshot_2025-01-11-13-53-42-152_com.vivaldi.browser.jpg" width="10%">

### 4.2.Windows
点击⚙->偏好设置
<img src="https://fj.mhdy.shop/2025-01-11-14-53-45_20250111145345412.png" width="40%">
点击账户->使用Cloudflare Zero Trust登录
<img src="https://image.mhdy.net/2025-01-11-14-54-59_20250111145459163.png" width="40%">
**同样的输入组织名->邮箱验证即可。**  
Windows中的warp默认开机自启动，需要去任务管理器或火绒之类的安全软件中关闭。  
退出软件时需要在任务管理器中进行关闭。  
## 5.进阶操作
因为WARP本身是VPN类软件所以可以使用VPN可用的操作。
### 5.1.防火墙
点击Gateway->防火墙策略，如图中的操作为在开启warp的设备上阻止18comic.vip域名。  
<img src="https://image.mhdy.net/2025-01-11-15-03-56_20250111150356533.png" width="40%">
**更多操作待你发现**

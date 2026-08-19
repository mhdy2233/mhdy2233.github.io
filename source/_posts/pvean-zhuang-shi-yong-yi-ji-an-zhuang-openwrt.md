---
title: PVE安装使用以及安装OpenWrt旁路网关
date: 2026-04-08 12:15:02+08:00
updated: 2026-04-08 12:15:02+08:00
description: 本文的PVE主要用于http/socks代理以及旁路网关1.设备信息我的用于安装PVE的设备为e5平台。主板为寨版x99(有毛病断了一根针脚导致内存只有两条能用)cpu为E5-2630 v3内存单条8G没有显卡硬盘为二手杂牌sata240G…
categories:
  - 实用
tags:
  - PVE
  - OpenWrt
  - openclash
halo_post_name: 019d6ced-eb9e-765e-9aef-9e3295fd1bf7
---

<p style="">本文的PVE主要用于http/socks代理以及旁路网关</p><h2 style="" id="1.%E8%AE%BE%E5%A4%87%E4%BF%A1%E6%81%AF">1.设备信息</h2><p style="">我的用于安装PVE的设备为e5平台。</p><p style="">主板为寨版x99(有毛病断了一根针脚导致内存只有两条能用)</p><p style="">cpu为<span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0); font-family: helvetica, arial, verdana, sans-serif">E5-2630 v3</span></p><p style=""><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0); font-family: helvetica, arial, verdana, sans-serif">内存单条8G</span></p><p style=""><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0); font-family: helvetica, arial, verdana, sans-serif">没有显卡</span></p><p style="">硬盘为二手杂牌sata240G固态硬盘</p><h2 style="" id="2.pve%E5%AE%89%E8%A3%85">2.PVE安装</h2><p style="">我安装使用了Ventoy2Disk，因为不知道系统不兼容还是Ventoy的问题导致PVE安装不了8和9，只能安装7.4，但是所幸可以通过命令行升级为8.4。</p><p style="">安装一路默认即可没什么问题，唯一需要注意的就是ipv6没法dhcp可能没法使用。</p><p style="">升级时需要注释掉企业源</p><pre><code>nano /etc/apt/sources.list

# 注释掉企业源
# deb https://enterprise.proxmox.com/debian/pve</code></pre><p style="">然后 <code>apt update &amp;&amp; apt full-upgrade</code> 更新系统</p><p style="">修改 <code>/etc/apt/sources.list</code> 中的所有 bullseye 为 bookworm</p><p style="">在 <code>/etc/apt/sources.list.d/pve-no-subscription.list</code> 中添加 <code>deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription</code></p><p style="">最后执行 <code>apt update &amp;&amp; apt full-upgrade</code> 即可完成升级</p><h2 style="" id="3.pve%E9%85%8D%E7%BD%AE">3.PVE配置</h2><p style="">apt和PVE的源虽然国内也可以访问，但是部分地区速度可能一言难尽。</p><p style="">先使用 <code>sudo apt install apt-transport-https ca-certificates</code> 更新证书避免出现https连接问题</p><p style="">使用 <code>curl -fsSL https://mirrors.ustc.edu.cn/repogen/conf/debian-https-4-bookworm -o /etc/apt/sources.list</code> 一键替换apt源</p><p style="">在 <code>nano /etc/apt/sources.list.d/pve-enterprise.list</code> 中添加 <code>deb https://mirrors.ustc.edu.cn/proxmox/debian bookworm pve-no-subscription</code> 来修改PVE源</p><p style="">使用 <code>wget https://mirrors.ustc.edu.cn/proxmox/debian/proxmox-release-bookworm.gpg -O /etc/apt/trusted.gpg.d/proxmox-release-bookworm.gpg</code> 安装PVE软件源的密钥</p><p style="">在 <code>nano /etc/apt/sources.list.d/ceph.list</code> 中添加 <code>deb https://mirrors.ustc.edu.cn/proxmox/debian/ceph-quincy bookworm no-subscription</code> 来替换ceph源</p><p style="">最后 <code>apt update</code> 更新即可</p><p style="">使用 <code>sed -i 's|http://download.proxmox.com|https://mirrors.ustc.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm</code> 一键修改CT源，修改后需使用 <code>systemctl restart pvedaemon.service</code> 重启PVE</p><p style=""></p><p style="">如果需要显示功耗占用等传感器信息可以使用 <code>(curl -Lf -o /tmp/temp.sh https://raw.githubusercontent.com/a904055262/PVE-manager-status/main/showtempcpufreq.sh || curl -Lf -o /tmp/temp.sh https://ghproxy.com/https://raw.githubusercontent.com/a904055262/PVE-manager-status/main/showtempcpufreq.sh) &amp;&amp; chmod +x /tmp/temp.sh &amp;&amp; /tmp/temp.sh remod</code> </p><p style=""></p><p style="">需要修改调速器/性能调度的话可以 <code>apt install cpufrequtils</code> <code>nano /etc/default/cpufrequtils</code> 内容为 <code>GOVERNOR="performance"</code> 这里的performance意思为一直最高频 <code>systemctl enable cpufrequtils &amp;&amp; systemctl restart cpufrequtils</code><br><code>cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors</code> 查看支持哪些调速器<br>调速器	响应速度	功耗	性能	推荐程度</p><p style="">performance	始终最高频 powersave	始终最低频 ondemand	有负载立即升频 conservative	缓慢升降频 schedutil	根据Linux调度器智能调整 userspace	用户程序自己控制 推荐schedutil或者conservative</p><h2 style="" id="4.%E5%AE%89%E8%A3%85openwrt">4.安装OpenWrt</h2><p style="">我使用的镜像为 <a href="https://downloads.immortalwrt.org/releases" target="_blank" rel="">immortalwrt</a> 中发布的镜像，选择最新版即可如：<code>https://downloads.immortalwrt.org/releases/24.10.5/targets/x86/64/immortalwrt-24.10.5-x86-64-generic-squashfs-combined.img.gz</code></p><p style="">下载后上传到PVE中即可。</p><p style="">需要注意的是安装虚拟机过程中先不要选择安装介质和硬盘，如果加了硬盘在硬件中删除即可，CD/DVD也要删除。</p><p style="">然后通过命令<code>qm importdisk 虚拟机ID /var/lib/vz/template/iso/镜像名称 local-lvm</code> 给OpenWrt装上硬盘，在硬件界面选择新增的硬盘改为sata即可，在选项中将引导顺序保留仅sata。</p><p style="">之后直接启动即可。</p><pre><code>vi /etc/config/network # 修改ip为你想要的
# 记得添加网关和dns如：

# 上面保持不动
config device 'lan_br'
	    option name 'br-lan'
    	option type 'bridge'
	    list ports 'eth0'

config interface 'lan'            
        option device 'br-lan'
        option proto 'static' 
        option ipaddr '192.168.0.11'
        option gateway '192.168.0.1'
        option netmask '255.255.255.0'
        option ip6assign '60'         
        option dns '114.114.114.114'

service network restart # 重启网络</code></pre><p style="">由于我只是用来作为代理所以不加别的网卡。</p><h3 style="" id="1.%E5%AE%89%E8%A3%85openclash">1.安装openclash</h3><p style="">默认oepnwrt的管理页面是80端口</p><p style="">在https://github.com/vernesong/OpenClash/releases下载最新的ipk或apk后缀，在系统-软件包导入openclash。</p><p style="">如果导入成功没有显示服务的话清除cookie和缓存刷新网页即可。</p><p style="">不知道是不是我的问题，导入订阅难用的一批有时候可以有时候不行。</p><p style="">使用web ui需要去网络-防火墙-通信规则中打开9090和7893端口。</p><figure data-content-type="image" style="display: flex; flex-direction: column;"><img src="https://image.mhdy.net/ShareX/2026/04/vivaldi_gjM1ee2eqr.png" width="25%" height="auto"></figure><p style="">只要你前面没问题，那么这时只需要将其他设备的网关修改为OpenWrt的ip即可全部走openclash。</p>

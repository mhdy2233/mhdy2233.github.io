---
title: cf workers ech s5/http代理
date: 2026-05-31 22:29:24+08:00
updated: 2026-05-31 22:29:24+08:00
description: "需要机场？点击https://jichang.mhdy.net需要exhentai里站账号，eh GP，eh代捐赠(铜星)，telegram账号，点击下方抢购吧！https://shop.mhdy.net看前须知，本方法与cf worker…"
categories:
  - 实用
tags:
  - 实用
  - 加速器
  - VPN
halo_post_name: 019e7ff6-0827-709b-a231-bed722430f64
---

<p style=""><span style="color: #60a5fa">需要机场？点击<hyperlink-inline-card target="_blank" href="https://jichang.mhdy.net" theme="inline"><a href="https://jichang.mhdy.net" target="_blank">https://jichang.mhdy.net</a></hyperlink-inline-card></span></p><p style=""><span style="color: #3b82f6">需要exhentai里站账号，eh GP，eh代捐赠(铜星)，telegram账号，点击下方抢购吧！</span></p><hyperlink-card target="_blank" href="https://shop.mhdy.net" theme="small" style="margin-top: 0.75em; margin-bottom: 0;"><a href="https://shop.mhdy.net" target="_blank">https://shop.mhdy.net</a></hyperlink-card><p style=""><span style="color: #ef4444"><strong>看前须知，本方法与cf workers pages vless无本质区别，只是加密方式不同和使用略有区别</strong></span><br><span style="color: #ef4444"><strong>如果你不会用代理软件的话请先看教程 </strong></span><a href="https://blog.mhdy.net/archives/ge-zhong-dai-li-ruan-jian-shi-yong-jiao-cheng" target="_blank" rel=""><span style="color: #ef4444"><strong>点击跳转</strong></span></a></p><p style=""><span style="color: #ef4444"><strong>自建你首先得有个域名，workers.dev国内无法访问所以自建必须得有域名，只要可以托管Cloudflare的都行</strong></span><br><span style="color: #ef4444"><strong>没有域名或者想直接用的 </strong></span><a href="#windows使用" target="_self" rel=""><span style="color: #ef4444"><strong>点击跳转</strong></span></a></p><p style=""><span style="color: #ef4444"><strong>觉得延迟太高？速度不够？可以试试pages和vless </strong></span><a href="https://blog.mhdy.net/archives/cf-woker-pagesfan-dai-trojanjie-dian-shi-yong-jiao-cheng" target="_blank" rel=""><span style="color: #ef4444"><strong>点击跳转</strong></span></a></p><p style=""><hyperlink-inline-card target="_blank" href="https://youtu.be/Y_SHcD3prt8?si=y4BCuZSqDXviv3td" theme="inline" custom-title="[勇哥]CF Socks5/Http免费代理终结教程" custom-image="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2216.88%22%20viewBox%3D%220%200%20256%20180%22%3E%3Cpath%20fill%3D%22red%22%20d%3D%22M250.346%2028.075A32.18%2032.18%200%200%200%20227.69%205.418C207.824%200%20127.87%200%20127.87%200S47.912.164%2028.046%205.582A32.18%2032.18%200%200%200%205.39%2028.24c-6.009%2035.298-8.34%2089.084.165%20122.97a32.18%2032.18%200%200%200%2022.656%2022.657c19.866%205.418%2099.822%205.418%2099.822%205.418s79.955%200%2099.82-5.418a32.18%2032.18%200%200%200%2022.657-22.657c6.338-35.348%208.291-89.1-.164-123.134%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22m102.421%20128.06l66.328-38.418l-66.328-38.418z%22%2F%3E%3C%2Fsvg%3E"><a href="https://youtu.be/Y_SHcD3prt8?si=y4BCuZSqDXviv3td" target="_blank">https://youtu.be/Y_SHcD3prt8?si=y4BCuZSqDXviv3td</a></hyperlink-inline-card></p><p style="">下面是配置文件的变量</p><div style="overflow-x: auto; overflow-y: hidden;"><table style="width: 548px"><colgroup><col style="width: 148px"><col style="width: 100px"><col style="width: 100px"><col style="width: 100px"><col style="width: 100px"></colgroup><tbody><tr style="box-sizing: border-box; background-color: rgb(255, 255, 255); border-top: 0.8px solid rgba(209, 217, 224, 0.7);"><th colspan="1" rowspan="1" colwidth="148" style="box-sizing: border-box; padding: 6px 13px; font-weight: 600; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><strong>变</strong><span style="color: #111827"><strong>量作用</strong></span></p></th><th colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; font-weight: 600; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827"><strong>变量名称</strong></span></p></th><th colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; font-weight: 600; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827"><strong>变量值要求</strong></span></p></th><th colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; font-weight: 600; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827"><strong>变量默认值</strong></span></p></th><th colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; font-weight: 600; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827"><strong>变量要求</strong></span></p></th></tr><tr style="box-sizing: border-box; background-color: rgb(255, 255, 255); border-top: 0.8px solid rgba(209, 217, 224, 0.7);"><th colspan="1" rowspan="1" colwidth="148" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">1、CF服务端域名:端口</span></p></th><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">cf_domain</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">域名:443系端口或者80系端口</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">无，必须CF处获取workers/pages/自定义的域名</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">必填</span></p></td></tr><tr style="box-sizing: border-box; background-color: rgb(246, 248, 250); border-top: 0.8px solid rgba(209, 217, 224, 0.7);"><th colspan="1" rowspan="1" colwidth="148" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">2、CF服务端密钥</span></p></th><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">token</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">与服务端一样的字母数字</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">无密钥</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">可选但推荐</span></p></td></tr><tr style="box-sizing: border-box; background-color: rgb(255, 255, 255); border-top: 0.8px solid rgba(209, 217, 224, 0.7);"><th colspan="1" rowspan="1" colwidth="148" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">3、客户端本地IP端口</span></p></th><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">client_ip</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">10000-65000之间</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">30000</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">可选</span></p></td></tr><tr style="box-sizing: border-box; background-color: rgb(246, 248, 250); border-top: 0.8px solid rgba(209, 217, 224, 0.7);"><th colspan="1" rowspan="1" colwidth="148" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">4、指定优选IP/域名</span></p></th><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">cf_cdnip</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">CF的优选IP或者优选域名</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">yg(可任意1-13数字).ygkkk.dpdns.org，中国移动基本上是落地香港，电信联通基本上落地日本新加坡</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">可选，也推荐使用</span><code>cloudflare-ech.com</code><span style="color: #111827">这个优选域名，基本上落地美欧地区</span></p></td></tr><tr style="box-sizing: border-box; background-color: rgb(255, 255, 255); border-top: 0.8px solid rgba(209, 217, 224, 0.7);"><th colspan="1" rowspan="1" colwidth="148" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">5、指定ProxyIP</span></p></th><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">pyip</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">ipv4或[ipv6]或域名</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">使用服务端ProxyIP</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">可选</span></p></td></tr><tr style="box-sizing: border-box; background-color: rgb(246, 248, 250); border-top: 0.8px solid rgba(209, 217, 224, 0.7);"><th colspan="1" rowspan="1" colwidth="148" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">6、DNS指定DoH</span></p></th><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">dns</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">DNS的DoH格式</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">dns.alidns.com/dns-query</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">可选(cf的doh:https://cloudflare-dns.com/dns-query)</span></p></td></tr><tr style="box-sizing: border-box; background-color: rgb(255, 255, 255); border-top: 0.8px solid rgba(209, 217, 224, 0.7);"><th colspan="1" rowspan="1" colwidth="148" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">7、ECH开关</span></p></th><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">enable_ech</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">y=开启，n=关闭</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">开启ECH</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">可选(仅workers.dev域名开启)</span></p></td></tr><tr style="box-sizing: border-box; background-color: rgb(246, 248, 250); border-top: 0.8px solid rgba(209, 217, 224, 0.7);"><th colspan="1" rowspan="1" colwidth="148" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">8、分流开关</span></p></th><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">cnrule</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">y=国内外分流代理，n=全局代理</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">国内外分流代理</span></p></td><td colspan="1" rowspan="1" colwidth="100" style="box-sizing: border-box; padding: 6px 13px; border-color: rgb(209, 217, 224); border-style: solid; border-width: 0.8px; border-image: none 100% / 1 / 0 stretch;"><p style=""><span style="color: #111827">可选</span></p></td></tr></tbody></table></div><p style=""><strong>优选ip和域名也可以自己优选 </strong><a href="https://blog.mhdy.net/archives/cf-woker-pagesfan-dai-trojanjie-dian-shi-yong-jiao-cheng#%E6%9B%B4%E6%8D%A2%E5%85%A5%E5%8F%A3%E4%BB%A5%E5%8F%8A%E6%9B%B4%E6%8D%A2%E5%87%BA%E5%8F%A3" target="_blank" rel=""><strong>点击跳转</strong></a></p><h2 style="" id="cloudflare-workers%E9%85%8D%E7%BD%AE">Cloudflare Workers配置</h2><pre collapsed="true"><code>
const pyip = ['pyip.ygkkk.dpdns.org']; //自定义proxyip：''之间可使用IP或者域名，IPV6需[]，不支持带端口
const token = '';//''之间可使用任意字符密码，客户端token保持一致

const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
const encoder = new TextEncoder();
import { connect } from 'cloudflare:sockets';
export default {
  async fetch(request, env, ctx) {
    try {
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new URL(request.url).pathname === '/'
          ? new Response('恭喜，当前网址可用于CF Workers/Pages的Socks5或Http本地代理服务', { status: 200 })
          : new Response('当前网址出错，请确认', { status: 426 });
      }
      if (token &amp;&amp; request.headers.get('Sec-WebSocket-Protocol') !== token) {
        return new Response('Unauthorized', { status: 401 });
      }
      const [client, server] = Object.values(new WebSocketPair());
      server.accept();
      server.binaryType = 'arraybuffer';
      handleSession(server).catch(() =&gt; safeCloseWebSocket(server));
      const responseInit = {
        status: 101,
        webSocket: client
      };
      if (token) {
        responseInit.headers = { 'Sec-WebSocket-Protocol': token };
      }
      return new Response(null, responseInit);

    } catch (err) {
      return new Response(err.toString(), { status: 500 });
    }
  },
};
async function handleSession(webSocket) {
  let remoteSocket, remoteWriter, remoteReader;
  let isClosed = false;

  const cleanup = () =&gt; {
    if (isClosed) return;
    isClosed = true;
    try { remoteWriter?.releaseLock(); } catch {}
    try { remoteReader?.releaseLock(); } catch {}
    try { remoteSocket?.close(); } catch {}
    remoteWriter = remoteReader = remoteSocket = null;
    safeCloseWebSocket(webSocket);
  };
  const pumpRemoteToWebSocket = async () =&gt; {
    try {
      while (!isClosed &amp;&amp; remoteReader) {
        const { done, value } = await remoteReader.read();

        if (done) break;
        if (webSocket.readyState !== WS_READY_STATE_OPEN) break;
        if (value?.byteLength &gt; 0) webSocket.send(value);
      }
    } catch {}

    if (!isClosed) {
      try { webSocket.send('CLOSE'); } catch {}
      cleanup();
    }
  };
  const parseAddress = (addr) =&gt; {
    if (addr[0] === '[') {
      const end = addr.indexOf(']');
      return {
        host: addr.substring(1, end),
        port: parseInt(addr.substring(end + 2), 10)
      };
    }
    const sep = addr.lastIndexOf(':');
    return {
      host: addr.substring(0, sep),
      port: parseInt(addr.substring(sep + 1), 10)
    };
  };
  const isCFError = (err) =&gt; {
    const msg = err?.message?.toLowerCase() || '';
    return msg.includes('proxy request') ||
           msg.includes('cannot connect') ||
           msg.includes('cloudflare');
  };
  const parseClientPyip = (s) =&gt; {
    if (!s) return null;
    const trimmed = String(s).trim();
    if (!trimmed.toUpperCase().startsWith('PYIP=')) return null;

    const val = trimmed.substring(5).trim();
    if (!val) return null;

    const arr = val.split(',')
      .map(x =&gt; x.trim())
      .filter(Boolean);

    return arr.length ? arr : null;
  };
  const connectToRemote = async (targetAddr, firstFrameData, clientPyip) =&gt; {
    const { host, port } = parseAddress(targetAddr);

    const pyipList = (Array.isArray(clientPyip) &amp;&amp; clientPyip.length)
      ? clientPyip
      : pyip;
    const attempts = [null, ...pyipList];
    for (let i = 0; i &lt; attempts.length; i++) {
      try {
        remoteSocket = connect({
          hostname: attempts[i] || host,
          port
        });
        if (remoteSocket.opened) await remoteSocket.opened;
        remoteWriter = remoteSocket.writable.getWriter();
        remoteReader = remoteSocket.readable.getReader();
        if (firstFrameData) {
          await remoteWriter.write(encoder.encode(firstFrameData));
        }
        webSocket.send('CONNECTED');
        pumpRemoteToWebSocket();
        return;
      } catch (err) {
        try { remoteWriter?.releaseLock(); } catch {}
        try { remoteReader?.releaseLock(); } catch {}
        try { remoteSocket?.close(); } catch {}
        remoteWriter = remoteReader = remoteSocket = null;

        if (!isCFError(err) || i === attempts.length - 1) {
          throw err;
        }
      }
    }
  };
  webSocket.addEventListener('message', async (event) =&gt; {
    if (isClosed) return;
    try {
      const data = event.data;
      if (typeof data === 'string') {
        if (data.startsWith('CONNECT:')) {
          const parts = data.substring(8).split('|');
          const targetAddr = parts[0] || '';
          const firstFrameData = parts[1] ?? '';
          const clientPyip = parseClientPyip(parts[2]);
          await connectToRemote(targetAddr, firstFrameData, clientPyip);
        }
        else if (data.startsWith('DATA:')) {
          if (remoteWriter) {
            await remoteWriter.write(encoder.encode(data.substring(5)));
          }
        }
        else if (data === 'CLOSE') {
          cleanup();
        }
      }
      else if (data instanceof ArrayBuffer &amp;&amp; remoteWriter) {
        await remoteWriter.write(new Uint8Array(data));
      }
    } catch (err) {
      try { webSocket.send('ERROR:' + err.message); } catch {}
      cleanup();
    }
  });
  webSocket.addEventListener('close', cleanup);
  webSocket.addEventListener('error', cleanup);
}
function safeCloseWebSocket(ws) {
  try {
    if (ws.readyState === WS_READY_STATE_OPEN ||
        ws.readyState === WS_READY_STATE_CLOSING) {
      ws.close(1000, 'Server closed');
    }
  } catch {}
}</code></pre><p style="">创建一个workers，将上述代码覆盖后修改token即可proxyip不会改就别动</p><h2 style="" id="%E8%BD%AF%E8%B7%AF%E7%94%B1%E7%AD%89linux%E7%B3%BB%E7%BB%9F">软路由等linux系统</h2><pre><code>curl -sSL https://raw.githubusercontent.com/yonggekkk/Cloudflare_vless_trojan/main/s5http_wkpgs/cfsh.sh -o cfsh.sh &amp;&amp; chmod +x cfsh.sh &amp;&amp; bash cfsh.sh</code></pre><p style="">执行脚本后添加节点即可</p><p style="">配置同下Windows</p><h2 style="" id="windows%E4%BD%BF%E7%94%A8">Windows使用</h2><p style="">首先<a href="https://proxy.mhdy.me/https://raw.githubusercontent.com/yonggekkk/Cloudflare-vless-trojan/acc967de81d0ee1be82400dc9f100a7a8d78eee7/s5http_wkpgs/windows-amd64.exe" target="_self" rel="">点击下载代理程序</a></p><p style="">在同目录下创建一个start.bat文件，下面的示例为博主自建的，推荐自建使用，也可以直接使用下面的，但是更推荐自建</p><pre><code>@echo off

set client_ip=127.0.0.1:30000
:: 本地代理地址，需要给其他机子使用则改为0.0.0.0，端口随意
set dns=cloudflare-dns.com/dns-query
:: 需要的dns，必须doh，谁家的都行
set token=mhdy
:: 你在workers中设置的token
set cf_domain=proxy.64396439.xyz:443
:: workers.dev域名国内无法连接，改为自定义域名，端口443或者8443
:: proxy.64396439.xyz或者proxy.mhdy2233.ggff.net都可以
set cf_cdnip=cloudflare-ech.com
:: 任意优选ip即可如: yg1.ygkkk.dpdns.org
set enable_ech=n
:: 是否开启ech，仅workers.dev域名开启
set cnrule=y
:: 是否开启绕过国内
set pyip=
:: proxyip, 可用可不用

windows-amd64.exe client_ip=%client_ip% cf_domain=%cf_domain% cf_cdnip=%cf_cdnip% token=%token% enable_ech=%enable_ech% dns=%dns% cnrule=%cnrule% pyip=%pyip%
pause</code></pre><p style="">编辑完成后双击start.bat启动程序，出现下图这样的说明可用</p><figure style="align-items: start; display: flex; flex-direction: column" data-content-type="image"><img src="https://image.mhdy.net/fujian/bk/image-uupm.png" width="100%" height="auto"></figure><p style="">此时打开你的代理软件，任意即可</p><p style=""><s>甚至你还可以直接修改系统代理来使用，虽然没什么问题但不是很推荐</s></p><figure style="align-items: start; display: flex; flex-direction: column" data-content-type="image"><img src="https://image.mhdy.net/fujian/bk/image-ixnm.png" width="100%" height="auto"></figure><p style="">V2rayN socks设置如下，http也一样，只需要地址和端口即可，socks和http端口一致</p><figure style="align-items: start; display: flex; flex-direction: column" data-content-type="image"><img src="https://image.mhdy.net/fujian/bk/image-rgrw.png"></figure><p style="">Clash类使用只需要在配置文件添加</p><pre><code>  - name: "cf ech"

    type: http

    server: 127.0.0.1

    port: 30000</code></pre><p style="">然后在需要的代理组添加即可</p><h2 style="" id="%E6%89%8B%E6%9C%BA%2F%E5%AE%89%E5%8D%93%E5%AE%A2%E6%88%B7%E7%AB%AF">手机/安卓客户端</h2><p style=""><a href="https://proxy.mhdy.me/https://raw.githubusercontent.com/yonggekkk/Cloudflare-vless-trojan/acc967de81d0ee1be82400dc9f100a7a8d78eee7/s5http_wkpgs/ECH_%E5%AE%89%E5%8D%93%E5%AE%A2%E6%88%B7%E7%AB%AF.apk" target="_self" rel="">点击下载app</a></p><p style="">填写配置同上Windows，手机不自带分流只有分应用和全局</p><p style=""><s>和pc一样你不勾选全局和分应用那就只会创建socks/http代理，可以配合V2ranyNG等代理软件使用</s></p><p style="">手机似乎是由于只能启动一个VPN协议的软件导致无法同时启用代理软件，似乎可以通过Shelter之类的软件解决</p><p style=""><s>当然你也可以直接在网络代理里指定手动代理</s></p><figure style="align-items: start; display: flex; flex-direction: column" data-content-type="image"><img src="https://image.mhdy.net/fujian/bk/image-vaxq.png" width="1456px"></figure><p style=""></p>

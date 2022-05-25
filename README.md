# 项目名称
    WebSocket聊天室

文件目录 
    github->nodejs->nodechat

用到技术
    jQuery、nodejs、WebSocket、模块化、实例化

一、功能简介
1、用户随意输入一个昵称即可登录 ----用户登录功能  1.登录框隐藏 2.主页面显示 3.调用reset()
2、登录成功后
 1) 对正在登录用户来说，罗列所有在线用户列表，罗列最近的历史聊天记录
 2) 对已登录的用户来说，通知有新用户进入房间，更新在线用户列表
3、退出登录
 1) 目前未支持直接退出，只能通过关闭网页来退出...
 2) 当有用户退出，其他所有在线用户会收到信息，通知又用户退出房间，同时更新在线用户列表
4、聊天
 1) 聊天就是广播，把信息广播给所有连接在线的用户
5、一些出错处理
 1) 暂时简单处理了系统逻辑错误、网络出错等特殊情况的出错提示

二：技术简介

客户端：
    1.在chatroom.html文件中 引入 js 文件
    2.chatjs中 
        1.获取chatLib.HOST | chatLib.EVENT_TYPE | chatLib.PORT 事件
        2.封装的共有方法 updateOnlineUser() 、 appendMessage() 、 formatUserString() 、 formatUserTalkString() 、 reset() 、 sendMsg()
        3.客户端ws事件包括：new WebSocket() | onmessage | onerror | onclose | onopen | socket.send
        4.socket.onopen事件 给服务端发送 socket.send(JSON.stringify({'EVENT': EVENT_TYPE.LOGIN,	'values': [currentUserNick]	}));
            {EVENT: EVENT_TYPE.LOGIN, EVENT: EVENT_TYPE.LIST_USER, EVENT: EVENT_TYPE.LIST_HISTORY } 
        5.socket.onmessage事件 获取服务端的event事件对象 switch()case:break; 判断EVENT_TYPE事件类型
        6.登录事件：new zTool.SimpleMap()中添加(uid, newUser) | updateOnlineUser | appendMessage

服务端：
    未测试(封装、this、原型链、实例化)

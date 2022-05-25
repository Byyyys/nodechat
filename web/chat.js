var HOST = chatLib.HOST;
var EVENT_TYPE = chatLib.EVENT_TYPE;
var PORT = chatLib.PORT;

$(document).ready(function() {
	var socket = null;
	var onlineUserMap = new zTool.SimpleMap(); //-> onlineUserMap: Object { map: {}, mapSize: 0 }
	var currentUser = null;
	var currentUserNick = null;
	var uid = 1;
	var connCounter = 1;
	var flag = 0;

	if(typeof WebSocket === 'undefined') { ///如果 浏览器 不支持
		$("#prePage").hide();
		$("#errorPage").show();
	}

	function updateOnlineUser() {
		var html = ["<div>在线用户(" + onlineUserMap.size() + ")</div>"];
		if(onlineUserMap.size() > 0) {
			var users = onlineUserMap.values();
			for(var i in users) {
				html.push("<div>");
				if(users[i].uid == currentUser.uid) {
					html.push("<b>" + formatUserString(users[i]) + "(我)</b>");
				} else {
					html.push(formatUserString(users[i]));
				}
				html.push("</div>");
			}
		}

		$("#onlineUsers").html(html.join(''));
	}

	/**
	 * 添加消息
	 * @param {*} msg 
	 */
	function appendMessage(msg) {
		$("#talkFrame").append("<div>" + msg + "</div>");
	}
	/**
	 * 传入用户信息 返回用户名称和id
	 * @param {*} user 
	 * @returns  user.nick (user.uid)  eg: 常嘉琪(2)
	 */
	function formatUserString(user) {
		if(!user) {
			return '';
		}
		return user.nick + "<span class='gray'>(" + user.uid + ")</span> ";
	}
	/**
	 * 传入用户信息--- 当前时间
	 * @param {*} user 
	 * @returns 返回用户名称 和 id  和 时间
	 */
	function formatUserTalkString(user) {
		return formatUserString(user) + new Date().format("hh:mm:ss") + " ";   ///format 引用 DateUtil.js文件
	}
	/**
	 * 传入用户信息 ---历史时间
	 * @param {*} user 
	 * @returns 返回用户名称 和 id  和 历史时间
	 */
	function formatUserTalkHisString(user, time) {
		return formatUserString(user) + new Date(time).format("yyyy-MM-dd hh:mm:ss") + " ";  ///format 引用 DateUtil.js文件
	}

	function reset() {
		// console.log(  socket === true ) 
		if(socket) {
			console.log( "用户已存在！" )
			socket.close();
		}
		socket = null;
		onlineUserMap = null;
		$("#onlineUsers").html("");
		$("#talkFrame").html("");
		$("#nickInput").val("");
	}

	function close() {

	}
	///客户端 step 1  | 用户登录功能  1.登录框隐藏 2.主页面显示 3.调用reset()
	$("#open").click(function(event) {
		currentUserNick = $.trim($("#nickInput").val());
		if('' == currentUserNick) {
			alert('请先输入昵称');
			return;
		}
		$("#prePage").hide();
		$("#mainPage").show();
		reset()

		socket = new WebSocket("ws://" + HOST + ":" + PORT);
		onlineUserMap = new zTool.SimpleMap();//-> onlineUserMap: Object { map: {}, mapSize: 0 }
		socket.onmessage = function(event) {
// console.log( event ) 可以获取到当前用户 和 所用在线用户信息
//event--> data: "{\"user\":{\"uid\":5,\"nick\":\"王武\"},\"event\":\"LOGIN\",\"values\":[{\"uid\":5,\"nick\":\"王武\"}],\"counter\":6}"
		
	var mData = chatLib.analyzeMessageData(event.data);///JSON.parse解析 data 数据
// console.log( mData ) //event: "LOGIN" || event: "LIST_USER": {values: Array(4) } || event: "LIST_HISTORY"

			if(mData && mData.event) {
				switch(mData.event) {
				case EVENT_TYPE.LOGIN:
					// 新用户连接
					var newUser = mData.values[0];
					// console.log( newUser )  Object { uid: 5, nick: "泰坦" }
					if(flag == 0) {
						currentUser = newUser;
						flag = 1;
					}
					// console.log( mData )//Object { user: {…}, event: "LOGIN", values: (1) […], counter: 2 }
					connCounter = mData.counter;///connCounter: 2
					uid = connCounter;
					onlineUserMap.put(uid, newUser);
					updateOnlineUser();
					appendMessage(formatUserTalkString(newUser) + "[进入房间]");
					break;

				case EVENT_TYPE.LOGOUT:
					// 用户退出
					var user = mData.values[0];
					alert(user.uid);
					onlineUserMap.remove(user.uid);
					updateOnlineUser();
					appendMessage(formatUserTalkString(user) + "[离开房间]");
					break;

				case EVENT_TYPE.SPEAK:
					// 用户发言
					var content = mData.values[0];
					if(mData.user.uid != currentUser.uid) {
						appendMessage(formatUserTalkString(mData.user));
						appendMessage("<span>&nbsp;&nbsp;</span>" + content);
					}
					break;

				case EVENT_TYPE.LIST_USER:
					// 获取当前在线用户
					var users = mData.values;
					if(users && users.length) {
						for(var i in users) {
							// alert(i + ' user : ' + users[i].uid);
							// alert('uid: ' + currentUser.uid);
							if(users[i].uid != currentUser.uid) onlineUserMap.put(users[i].uid, users[i]);
						}
					}
					//alert('currentUser:' + currentUser);
					updateOnlineUser();
					break;

				case EVENT_TYPE.LIST_HISTORY:
					// 获取历史消息
					//{'user':data.user,'content':content,'time':new Date().getTime()}
					var data = mData.values;
					if(data && data.length) {
						for(var i in data) {
							appendMessage(formatUserTalkHisString(data[i].user, data[i].time));
							appendMessage("<span>&nbsp;&nbsp;</span>" + data[i].content);
						}
						appendMessage("<span class='gray'>==================以上为最近的历史消息==================</span>");
					}
					break;

				case EVENT_TYPE.ERROR:
					// 出错了
					appendMessage("[系统繁忙...]");
					break;

				default:
					break;
				}

			}
		};

		socket.onerror = function(event) {
			appendMessage("[网络出错啦，请稍后重试...]");
		};

		socket.onclose = function(event) {
			appendMessage("[网络连接已被关闭...]");
			close();
		};

		socket.onopen = function(event) {
			socket.send(JSON.stringify({
				'EVENT': EVENT_TYPE.LOGIN,
				'values': [currentUserNick]
			}));
			socket.send(JSON.stringify({
				'EVENT': EVENT_TYPE.LIST_USER,
				'values': [currentUserNick]
			}));
			socket.send(JSON.stringify({
				'EVENT': EVENT_TYPE.LIST_HISTORY,
				'values': [currentUserNick]
			}));
		};
	});

	$("#message").keyup(function(event) { /* textarea 文本域中 提交事件 */
		if(event.keyCode === 13) {
			sendMsg();
		}
	});

	function sendMsg() {
		console.log( "TEST sendMsg" )
		var value = $.trim($("#message").val());
		if(value) {
			$("#message").val('');
			appendMessage(formatUserTalkString(currentUser));//formatUserTalkString:  @returns — 返回用户名称 和 id 和 时间
			appendMessage("<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>" + value);
			// console.log( [currentUser.uid, value] )  ///[currentUser.uid, value]
			socket.send(JSON.stringify({
				'EVENT': EVENT_TYPE.SPEAK,
				'values': [currentUser.uid, value]   ////[currentUser.uid, value]:  Array [ 1, "吃饭了么" ]
			}));
		}
	};

	$("#send").click(function(event) {/* input 输入框中 提交事件 */
		sendMsg();
	});
	$("#createroom").click(function(event) {

	})

	function show(value) {
		$("#response").html(value);
	};
});
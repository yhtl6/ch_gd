//验证空
function isEmpty(txt){
	if(txt == null || txt == undefined || txt == ""){
		return true;
	}else{
		return false;
	}
}

//验证手机号码
function isPhone(phone){
	var reg = /^1[3|4|5|7|8][0-9]\d{8}$/;
	return reg.test(phone);
}

//验证是否为非0正整数
function isInt(txt){
	var reg = /^[1-9][0-9]*$/;
	return reg.test(txt);
}
//验证最多保留两位小数
function isfloat2f(txt){
	reg = /^\d+(\.(\d{2}|\d{1}))?$/;
	return reg.test(txt);
}
//验证密码必须为字母加数字
function valpsd(txt){
	var reg = /^[0-9]+[a-zA-Z]+[0-9a-zA-Z]*|[a-zA-Z]+[0-9]+[0-9a-zA-Z]*$/;
	return reg.test(txt);
}

//身份证验证
function identityCodeValid(code) {
	var city={11:"北京",12:"天津",13:"河北",14:"山西",15:"内蒙古",21:"辽宁",22:"吉林",23:"黑龙江 ",31:"上海",32:"江苏",33:"浙江",34:"安徽",35:"福建",36:"江西",37:"山东",41:"河南",42:"湖北 ",43:"湖南",44:"广东",45:"广西",46:"海南",50:"重庆",51:"四川",52:"贵州",53:"云南",54:"西藏 ",61:"陕西",62:"甘肃",63:"青海",64:"宁夏",65:"新疆",71:"台湾",81:"香港",82:"澳门",91:"国外 "};
	var tip = "";
	var pass= true;
	if(!code || !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[012])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)){
		tip = "身份证号格式错误";
		pass = false;
	}

	else if(!city[code.substr(0,2)]){
		tip = "地址编码错误";
		pass = false;
	}
	else{
		//18位身份证需要验证最后一位校验位
		if(code.length == 18){
			code = code.split('');
			//∑(ai×Wi)(mod 11)
			//加权因子
			var factor = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2 ];
			//校验位
			var parity = [ 1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2 ];
			var sum = 0;
			var ai = 0;
			var wi = 0;
			for (var i = 0; i < 17; i++)
			{
				ai = code[i];
				wi = factor[i];
				sum += ai * wi;
			}
			var last = parity[sum % 11];
			if(parity[sum % 11] != code[17]){
				tip = "校验位错误";
				pass =false;
			}
		}
	}
	// if(!pass) alert(tip);
	return pass;
}

//验证银行卡号
function luhmCheck(bankno) {
	var lastNum = bankno.substr(bankno.length - 1, 1); //取出最后一位（与luhm进行比较）

	var first15Num = bankno.substr(0, bankno.length - 1); //前15或18位
	var newArr = new Array();
	for(var i = first15Num.length - 1; i > -1; i--) { //前15或18位倒序存进数组
		newArr.push(first15Num.substr(i, 1));
	}
	var arrJiShu = new Array(); //奇数位*2的积 <9
	var arrJiShu2 = new Array(); //奇数位*2的积 >9

	var arrOuShu = new Array(); //偶数位数组
	for(var j = 0; j < newArr.length; j++) {
		if((j + 1) % 2 == 1) { //奇数位
			if(parseInt(newArr[j]) * 2 < 9) {
				arrJiShu.push(parseInt(newArr[j]) * 2);
			} else {
				arrJiShu2.push(parseInt(newArr[j]) * 2);
			}
		} else { //偶数位
			arrOuShu.push(newArr[j]);
		}
	}

	var jishu_child1 = new Array(); //奇数位*2 >9 的分割之后的数组个位数
	var jishu_child2 = new Array(); //奇数位*2 >9 的分割之后的数组十位数
	for(var h = 0; h < arrJiShu2.length; h++) {
		jishu_child1.push(parseInt(arrJiShu2[h]) % 10);
		jishu_child2.push(parseInt(arrJiShu2[h]) / 10);
	}

	var sumJiShu = 0; //奇数位*2 < 9 的数组之和
	var sumOuShu = 0; //偶数位数组之和
	var sumJiShuChild1 = 0; //奇数位*2 >9 的分割之后的数组个位数之和
	var sumJiShuChild2 = 0; //奇数位*2 >9 的分割之后的数组十位数之和
	var sumTotal = 0;
	for(var m = 0; m < arrJiShu.length; m++) {
		sumJiShu = sumJiShu + parseInt(arrJiShu[m]);
	}

	for(var n = 0; n < arrOuShu.length; n++) {
		sumOuShu = sumOuShu + parseInt(arrOuShu[n]);
	}

	for(var p = 0; p < jishu_child1.length; p++) {
		sumJiShuChild1 = sumJiShuChild1 + parseInt(jishu_child1[p]);
		sumJiShuChild2 = sumJiShuChild2 + parseInt(jishu_child2[p]);
	}
	//计算总和
	sumTotal = parseInt(sumJiShu) + parseInt(sumOuShu) + parseInt(sumJiShuChild1) + parseInt(sumJiShuChild2);

	//计算Luhm值
	var k = parseInt(sumTotal) % 10 == 0 ? 10 : parseInt(sumTotal) % 10;
	var luhm = 10 - k;

	if(lastNum == luhm) {
		return true;
	} else {
		return false;
	}
}
//度 转 度 分 秒
function formatDegreeToSecond(value){
	value = Math.abs(value);
	var v1 = Math.floor(value);//度
	var v2 = Math.floor((value - v1) * 60);//分
	var v3 = Math.round((value - v1) * 3600 % 60);//秒
	return v1 + '°' + v2 + '\'  ' + v3 + "''";
}
//小图片增加地址
function addImgUrl(img){
	var url="";
	if(!isEmpty(img)){
		url="/static/client/img/map_preview/"+img+".png"
	}
	return url;
}
//解码(对数据库读出来的html便签进行解码)
function htmldecode(s){
	var div = document.createElement('div');
	div.innerHTML = s;
	return div.innerText || div.textContent;
}
//原型继承日照格式化
//示例：
//new Date().Format("yyyy年MM月dd日");
//new Date().Format("MM/dd/yyyy");
//new Date().Format("yyyyMMdd");
//new Date().Format("yyyy-MM-dd hh:mm:ss");
Date.prototype.Format  = function(format) {
	var o = {
		"M+" : this.getMonth() + 1, //month
		"d+" : this.getDate(), //day
		"h+" : this.getHours(), //hour
		"m+" : this.getMinutes(), //minute
		"s+" : this.getSeconds(), //second
		"q+" : Math.floor((this.getMonth() + 3) / 3), //quarter
		"S" : this.getMilliseconds() //millisecond
	}

	if (/(y+)/.test(format)) {
		format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}

	for (var k in o) {
		if (new RegExp("(" + k + ")").test(format)) {
			format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
		}
	}
	return format;
}
// 转换周数为中文
function getWeek(week){
	/*var arys1=date.split('-');     //日期为输入日期，格式为 2013-3-10
	var ssdate=new Date(arys1[0],parseInt(arys1[1]-1),arys1[2]);
	var week=ssdate.getDay();//星期天 为0*/
	//转换成中文

	if(week==0){
		week="天";
	}else if(week==1){
		week="一";
	}else if(week==2){
		week="二";
	}else if(week==3){
		week="三";
	}else if(week==4){
		week="四";
	}else if(week==5){
		week="五";
	}else if(week==6){
		week="六";
	}
	return week;
}
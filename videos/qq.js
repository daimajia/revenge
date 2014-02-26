var needle = require('needle'),
	format = require('format'),
	async  = require('async'),
	handler = require('../handlers');

var type = 'qq';

function getUrl(vid,name,callback){
	var reqUrl = 'http://vv.video.qq.com/geturl?vid=%s&otype=json';
	var toReq  = format(reqUrl,vid);
	needle.get(toReq,function(err,resp,body){
		if(!err){
			var reg = /{.+}/g;
			var jsonMatch = reg.exec(body);
			if(jsonMatch){
				var json = JSON.parse(jsonMatch);
				try{
					var result = json.vd.vi[0].url;
					var finalResult = {
						urls:[
							{
								type:"mp4",
								file:"mp4",
								url:result
							}
						]
					};
					callback(null,finalResult,name);
				}catch(err){
					return callback(new Error('JSON解析错误'));
				}
			}
		}else{
			return callback(new Error('无法获取接口数据'));
		}
	});
}

function getVideoVid(url,callback){
	needle.get(url,function(err,resp,body){
		if(!err){
			var vidReg = /vid:"(\w+)"/g;
			var match = vidReg.exec(body);
			var nameReg = /title :"(.+)"/;
			if(match){
				var nameMatch = nameReg.exec(body);
				var name = "";
				if(nameMatch){
					name = nameMatch[1]
				}
				callback(null,match[1],"");
			}else{
				callback(new Error("无法获取关键字"));
			}
		}else{
			callback(new Error("无法获取源代码"));
		}
	});
}

var parseQQ = async.compose(getUrl,getVideoVid);

module.exports = function(req,res){
	var url = req.query.url;
	parseQQ(url,function(err,result,name){
		if(!err){
			res.charset = 'utf-8';
			res.send(handler.success(type,url,result,name));
		}else{
			res.send(handler.fail(type,url,err));
		}
	});
}
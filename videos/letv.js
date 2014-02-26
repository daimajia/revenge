var needle = require('needle');
var format = require('format');
var handler = require('../handlers');

function getMMSID(url,callback){
	var opts = {
		follow:true
	};
	needle.get(url,opts,function(err,res,body){
		if(!err){
			var mmsidReg = /mmsid:'{0,1}(\d+)'{0,1}/g;
			var regName = /title:"(.+?)"/g;
			var regMatch = mmsidReg.exec(body);
			var nameMatch = regName.exec(body);
			if(regMatch){
				var mmsid = regMatch[1];
				var name = '';
				if(nameMatch){
					name = nameMatch[1];
				}
				return callback(null,mmsid,name);
			}else{
				return callback(new Error("无法获取MMSID"));
			}
		}else{
			return callback(new Error("无法获取源代码"));
		}
	});
}

function getUrl(mmsid,name,callback){
	var requestUrl = 'http://app.m.letv.com/android/mindex.php?mod=minfo&ctl=videofile&act=index&mmsid=%s&videoformat=ios&pcode=010510000&version=3.3.1';
	var toRequest = format(requestUrl,mmsid);
	needle.get(toRequest,function(err,res,body){
		if(!err){
			var json = JSON.parse(body);
			try{
				var infos = json.body.videofile.infos;
				var finalResults = [];
				var dic = new Array();
				dic['hd2'] = 'mp4_1080p';
				dic['hd'] = 'mp4_1300';
				dic['flv'] = 'mp4_1000';
				for(var k in dic){
					if(infos[dic[k]]){
						finalResults.push({
							'type':k,
							'file':'m3u8',
							'url':infos[dic[k]].mainUrl
						});
					}
				}
				return callback(null,finalResults);
			}catch(err){
				return callback(new Error('数据解析错误'));
			}
		}else{
			return callback(new Error('获取源代码错误'));
		}
	});
}

function getLocation(item,callback){
	if(item.url){
		needle.get(item.url,function(err,res,body){
			if(!err){
				try{
					var json = JSON.parse(body);
					item.url = json.location;
					return callback(null,item);		
				}catch(err){
					return callback(new Error('json转换错误'));
				}
			}else{
				return callback(new Error('网络错误'));
			}
		})}
	}

function getReal(results,callback){
	async.map(results,getLocation,function(err,results){
		if(!err){
			var urls = {
				urls:results
			}
			return callback(null,urls);
		}
		else{
			return callback(err);
		}
	})
}

var async = require('async');
var getter = async.compose(getReal,getUrl,getMMSID);

var letv = function(req,res){
	var url = req.query.url;
	getter(url,function(err,result){
		if(!err)
			res.send(handler.success('letv',url,result,''));
		else{
			res.send(handler.fail('letv',url,err));
		}
	});
}

module.exports = letv;
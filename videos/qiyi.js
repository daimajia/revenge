var async = require('async');
var needle = require('needle');
var format = require('format');
var download = require('download')
var type = 'qiyi';

var hostname = 'http://42.62.40.32:3000';
function getVID(url, callback) {
	needle.get(url,function(err,resp,body){
		if(!err){
			var tvidReg = /data-player-tvid=\"(\w.+?)\"/g;
			var vidReg = /data-player-videoid=\"(\w.+?)\"/g;
			var nameReg = /data-drama-albumname=".+?"/g;
			var tvidMatch = tvidReg.exec(body);
			var vidMatch = vidReg.exec(body);
			var nameMatch = nameReg.exec(body);
			if(tvidMatch && vidMatch){
				var name = '';
				if(nameMatch){
					name = nameMatch[1];
				}
				callback(null,tvidMatch[1],vidMatch[1],name);
			}else{
				callback(new Error('无法获取关键字'));
			}
		}else{
			callback(new Error('无法获取源代码'))
		}
	});
}

function sortNumber(a,b){
	return b.fle - a.fle;
}

function getM3U8(tvid,vid,name,callback){
	var reqLink = 'http://cache.video.qiyi.com/m/%s/%s/';
	var req = format(reqLink,tvid,vid);
	needle.get(req,function(err,resp,body){
		if(!err){
			var reg = /{.+}/g;
			var match = reg.exec(body);
			if(match){
				try{
					var json = JSON.parse(match);
					var sizeArr = new Array();
					var m3u8s = json.data.mtl;
					for(var i in m3u8s){
							var cur = m3u8s[i];
							sizeArr[i] = cur;
						}
					var result = sizeArr.sort(sortNumber);
					var density = new Array('hd2','hd','mp4','flv','3gp');
					var urls = [];
					var counter = 1;
					var options = {
					    headers: {
					        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.107 Safari/537.36',
					        'Host':'metan.video.qiyi.com'
					    }
					};
					for(var i in result){
							if( i>= density.length)
								break;
							var v = {};
							v.type = density[i];
							v.file = 'm3u8';
							var url = result[i].m3u;
							var filename = url.substring(url.lastIndexOf('/')+1,url.length);
							download(url,'public/media/',options);
							v.url = hostname + '/media/'+filename;
							urls.push(v);
					}
					var info = {};
					info.source = 'qiyi';
					info.urls = urls;
					info.name = name;
					callback(null,info);
				}catch(err){
					callback(new Error('JSON解析错误'));
				}
			}
		}else{
			callback(new Error('获取数据出错'));
		}
	});
	
}

var getVideo = async.compose(getM3U8, getVID);

var qiyi = function(req,res){
	var handler = require('../handlers');
	getVideo(req.query.url,function(err,result){
		if(!err){
			res.send(handler.success(type,req.query.url,result,result.name));
		}else{
			res.send(handler.fail(type,req.query.url,err));
		}
	});
}


module.exports = qiyi;
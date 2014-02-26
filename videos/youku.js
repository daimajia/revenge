var handler = require('../handlers');
var async = require('async');

function getVid(url,callback){
	var reg = /http:\/\/v.youku.com.+id_(.+?).html/g;
	var match = reg.exec(url);
	if(match == null){
		return callback(new Error('无法获取vid'));
	}else{
		return callback(null,match[1]);
	}
}

function getUrls(vid,callback){
	var request_template = 'http://api.3g.youku.com/v3/play/address?id=%s&deviceid=be36886b9716669d4802e67e0f9e5e87&brand=apple&os_ver=6%2E1&audiolang=1&os=ios&guid=1b9ff7179609c8279cb507186bf3c908&ver=2%2E9&btype=iPad2,1&point=1&pid=87c959fb273378eb&format=6&network=WIFI';
	var format = require('format');
	var needle = require('needle');
	var to_request = format(request_template,vid);
	needle.get(to_request,function(err,resp,body){
		if(!err){
			try{
				var data = body;
				var hd,mp4,flv,title;
				for(var k in data.results){
					switch(k){
						case 'm3u8_mp4':
							mp4 = data.results.m3u8_mp4[0].url;
							break;
						case 'm3u8_hd':
							hd  = data.results.m3u8_hd[0].url;
							break;
						case 'm3u8_flv':
							flv = data.results.m3u8_flv[0].url;
							break;
					}
				}
				var down_urls = {
					'urls':[
						{
							'file':'m3u8',
							'type':'hd',
							'url':hd
						},
						{
							'file':'m3u8',
							'type':'mp4',
							'url':mp4
						},
						{
							'file':'m3u8',
							'type':'flv',
							'url':flv
						}
					]
				};
				return callback(null,down_urls,"");
			}catch(err){
				return callback(err);
			}
		}else{
			return callback(new Error('获取网路数据失败'));
		}
	});
}

var getter = async.compose(getUrls,getVid);

var youku = function(req,res){
	var url = req.query.url;

	getter(url,function(err,urls,name){
		if(!err){
			res.send(handler.success('youku',url,urls,name));
		}else{
			res.send(handler.fail('youku',urls,err));
		}
	})
}

module.exports = youku;
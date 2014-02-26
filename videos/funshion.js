var needle = require('needle');
var format = require('format');
var handler = require('../handlers');
function getFunshion(url,callback){
	var template = 'http://jsonfe.funshion.com/playinfo?cli=ipad&jk=1536&mid=%s&ta=0&ver=1.2.11.1';
	var oldReg = /http:\/\/www.funshion.com\/subject\/play\/(\d+)\/(\d+)/;
	var reg = /http:\/\/www.funshion.com\/vplay\/m-(\d+)(.e-(\d+)){0,1}/;
	var zy_reg = /http:\/\/www.funshion.com\/subject\/(\d+)\/(\d+)/;
	var oldMatch = oldReg.exec(url);
	var reg_res = reg.exec(url);
	var zyMatch = zy_reg.exec(url);
	if(oldMatch || reg_res || zyMatch){
		var mid,num;
		if(reg_res){
			mid = reg_res[1];
			num = reg_res[3] || 1;
		}else if(oldMatch){
			mid = oldMatch[1];
			num = oldMatch[2];
		}else if(zyMatch){
			mid = zyMatch[1];
			num = zyMatch[2] || -1;
		}
		var to_request = format(template,mid);
		needle.get(to_request,function(err,resp,body){
			try{
				var json = JSON.parse(body);
				if(json.data.mpurls != undefined){
					var urls = json.data.mpurls;
					var name = json.data.medianame;
					var toReturn = {
						urls:[
							{
								file:'m3u8',
								type:'hd2',
								url:urls.highdvd.url
							},
							{
								file:'m3u8',
								type:'hd',
								url:urls.dvd.url
							},
							{
								file:'m3u8',
								type:'mp4',
								urls:urls.tv.url
							}
						]
					}
					return callback(null,toReturn,name);
				}else if(json.data.content != undefined || json.data.fsps != undefined){
					var videos;
					if(json.data.content)
						videos = json.data.content.gylang.fsps;
					else{
						if(num == 1){
							num = -1;
						}
						videos = json.data.fsps;
					}
					var toReturn,name;
					for(var i in videos){
						var cur = videos[i];
						if(cur.number == num || num == -1){
							var mpurls = cur.mpurls;
							var urls = [];
							if(mpurls.highdvd){
								urls.push({
									file:'m3u8',
									type:'hd2',
									url:mpurls.highdvd.url
								});
							}
							if(mpurls.dvd){
								urls.push({
									file:'m3u8',
									type:'hd',
									url:mpurls.dvd.url
								});
							}
							if(mpurls.tv){
								urls.push({
									file:'m3u8',
									type:'mp4',
									url:mpurls.tv.url
								});
							}
							toReturn = {
								urls:urls
							};
							name = cur.medianame+" "+cur.taskname;
							break;
						}
					}
					if(toReturn!=undefined){
						return callback(null,toReturn,name);
					}else{
						return callback(new Error('无法获取播放数据'));
					}
				}else{
					return callback(new Error('无法获取播放数据'));
				}
			}catch(err){
				return callback(new Error('JSON格式有误'));
			}
		});
	}else{
		return callback(new Error('格式有误'));
	}
}

module.exports = function(req,res){
	var url = req.query.url;
	getFunshion(url,function(err,urls,name){
		if(!err){
			res.send(handler.success("funshion",url,urls,name));
		}else{
			res.send(handlers.fail("funshion",url,err));
		}
	})
};

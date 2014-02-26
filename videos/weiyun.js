var needle = require('needle');
var format = require('format');
var type = 'weiyun';
var handler = require('../handlers');
var template = 'http://web2.cgi.weiyun.com/wy_share_v2.fcg?cmd=view_share&data={"req_header":{"cmd":"view_share","main_v":11,"proto_ver":10006,"sub_v":1,"encrypt":0,"msg_seq":1,"source":30111,"appid":30111,"client_ip":"127.0.0.1","token":"f34c625e26ca46a75ca81c3531117d63"},"req_body":{"share_key":"%s"}}&_=1386335053807';
var downloadTemplate = 'http://web.cgi.weiyun.com/share_dl.fcg?sharekey=%s&uin=%s&skey=&fid=%s&dir=&pdir=%s&zn=%s&os_info=mac&browser=chrome&ver=12';


var weiyun = {
	get:function(url,callback){
			needle.get(url,{follow:true},function(err,res,body){
				try{
					var path_key = res.req.path;
					var key = path_key.substring(1,path_key.length)
					var to_request = format(template,key);
					var to_request = to_request.replace('"',"%22");
					var opts = {
						'user_agent':"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36",
						"follow":true,
						"json":true
					}
				}catch(err){
					return callback(new Error('无法获取数据'));
				}
				needle.get(to_request,opts,function(err,res,body){
					try{
						var data = JSON.parse(body);
						var rep_body = data.rsp_body;
						var sharekey = rep_body.share_key;
						var uin = rep_body.uin;
						var file_list = rep_body.file_list[0];
						var fid = file_list.file_id;
						var pdir = rep_body.pdir_key;
						var zn = rep_body.sharename;
						var dlskey = rep_body.dlskey;
						to_request = format(downloadTemplate,sharekey,uin,fid,pdir,zn);
					}catch(err){
						return callback(new Error('无法获取播放数据'));
					}
					opts = {
						'user_agent':"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36",
						'headers':{
							'Host':"web.cgi.weiyun.com",
							'Referer':'http://share.weiyun.com/d35f2c00e224fbeaea4e40b3d0d67322',
							'Cookie':'dlskey=' + dlskey
						}
					}
					needle.get(to_request,opts,function(err,res,body){
							try{
								var toReturn = {
									urls:[
										{
											file:'mp4',
											type:'hd2',
											url:res.headers.location
										}
									]
								}
								return callback(null,toReturn,zn);
							}catch(err){
								return callback(new Error('无法获取数据'));
							}
						});
					});
				});
	}
}
module.exports = function(req,res){
	var url = req.query.url;
	weiyun.get(url,function(err,urls,zn){
		if(!err){
			res.send(handler.success('weiyun',url,urls,zn));
		}else{
			res.send(handler.fail('weiyun',url,err));
		}
	})
};

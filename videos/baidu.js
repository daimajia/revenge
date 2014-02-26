var needle = require('needle');
var handler = require('../handlers');
function getter(url,callback){
    var request_url = 'http://daimajia.duapp.com/baidu/?url=' + url;
    needle.get(request_url,function(err,resp,body){
        if(!err){
            try{
                var response = body;
                if(response.error == false){
                    return callback(null,response.download,response.name);
                }else{
                    return callback(new Error('获取失败'));
                }
            }catch(err){
                return callback(new Error('JSON转换失败'));
            }
        }else{
            return callback(new Error('网络连接失败'));
        }
    });
}

var baidu = function(req,res){
    var url = req.query.url;

    getter(url,function(err,downloadurl,name){
        if(!err){
            var downloadurls = {
                urls:[
                    {
                        file:'origin',
                        type:'hd2',
                        url:downloadurl
                    }
                ]
            };
            res.send(handler.success('baidu',url,downloadurls,name));
        }else{
            res.send(handler.fail('baidu',url,err));
        }
    });
}

module.exports = baidu;
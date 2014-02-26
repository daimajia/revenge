var handler = require('../handlers')
var needle = require('needle');
var type = "sohu";
var requestTemplate = "http://pad.tv.sohu.com/playinfo?vid=1405386&playlistid=5500767&uid=1203291646185250&sig=4595712645125&key=4616607";
var async = require('async');
String.prototype._shift_en = function (key) {
            var _sz = key.length,  
                _cnt = 0;  
            return this.replace(/[0-9a-zA-Z]/g, function(s) {
                var _n = s.charCodeAt(0),  
                    _beg = 0x41,  
                    _len = 26;  
                if (_n >= 0x61) {  
                    _beg = 0x61;  
                } else if (_n < 0x41) {  
                    _beg = 0x30;  
                    _len = 10;  
                }  
                var _c = _n - _beg;  
                return  String.fromCharCode((_c+key[_cnt++%_sz]) % _len + _beg);  
            });
        };

function getRequestUrl(url,callback){
	url = url.replace(/tv.sohu.com/,"pad.tv.sohu.com");
	needle.get(url,function(err,resp,body){
		if(!err){
			var vid_reg = /var vid =(\w+)/g
			var list_reg = /var playlistId = (\w+)/g
			var vid_match = vid_reg.exec(body);
			var list_match = list_reg.exec(body);
			if(vid_match && list_match){
				var vid = vid_match[1];
				var list = list_match[1];
				var timestamp = '' + new Date().getTime();
				var sig = timestamp._shift_en([23, 12, 131, 1321]);
				var key = vid._shift_en([23, 12, 131, 1321]);
		        var url = 'http://pad.tv.sohu.com/playinfo?'
	                + '&vid=' + vid
	                + '&playlistid=' + list
	                + '&uid=' + '1203291646185250'
	                + '&sig=' + timestamp._shift_en( [ 23, 12, 131, 1321 ] )
	                + '&key=' + vid._shift_en( [ 23, 12, 131, 1321 ] );
	            return callback(null,url);
			}
		}else{
			return callback(new Error(err));
		}
	});
}

function getUrls(constructedUrl,callback){
	needle.get(constructedUrl,function(err,resp,body){
		if(!err){
			try{
				var json = JSON.parse(body);
				var download_urls = {
		                'urls':[
		                        {
		                                'file':'m3u8',
		                                'type':'hd2',
		                                'url':json.superVid
		                        },
		                        {
		                                'file':'m3u8',
		                                'type':'hd',
		                                'url':json.highVid
		                        },
		                        {
		                                'file':'m3u8',
		                                'type':'mp4',
		                                'url':json.norVid
		                        }
		                ]
		        };
		        return callback(null,download_urls);
	    	}catch(err){
	    		return callback(new Error(err));
	    	}
		}else{
			return callback(new Error(err));
		}
	});
};

var getter = async.compose(getUrls,getRequestUrl);

var sohu = function(req,res){
	var url = req.query.url;
	getter(url,function(err,result){
		if(!err){
			res.send(handler.success('sohu',url,result));
		}else{
			res.send(handler.fail('sohu',url,err));
		}
	});
}

module.exports = sohu;

var handler = {
	success:function(type,url,result,moviename){
		moviename = moviename || ""
		return {
			'movieName':moviename,
			'type':type,
			'source':url,
			'error':false,
			'down_urls':result
		};
	},
	fail:function(type,url,err){
		return {
			'source':url,
			'msg':err.message,
			'error':true
		};
	}
}

module.exports = handler;

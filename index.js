var express =	require('express');
var app     = 	express();
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.logger('short'));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

global.BASE_DIR = __dirname;

var parsers = require('./videos/');

app.all('/',function(req,res){
	res.render('index.html');
});
app.all('/letv/',parsers.letv);
app.all('/sohu/',parsers.sohu);
app.all('/qiyi/',parsers.qiyi);
app.all('/baidu/',parsers.baidu);
app.all('/qq/',parsers.qq);
app.all('/youku/',parsers.youku);
app.all('/weiyun/',parsers.weiyun);
app.all('/funshion/',parsers.funshion);


app.listen(3000);
console.log('Listening on port 3000');

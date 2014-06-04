var config = require('config'),
    koa = require('koa'),
    router = require('koa-router'),
    logger = require('./util/log'),
    rendered = require('./models/rendered');

logger.info('koa-js-rendered start.');

var app = koa();

app.use(router(app));

app.get('/', function *(next) {
    this.body = 'web app for js-rendered html.';
});

app.get('/rendered/:url', function *(next) {
    var url = this.params.url;
    this.set('Content-Type', 'application/json; charset=UTF-8');
    var res = {
        status: false
    };
    var html;
    try {
        html = yield rendered.getHtml(url);
    } catch (error) {
        res.errorInfo = error.toString();
    }
    if (html) {
        res.status = true;
        res.content = html;
    }
    this.body = JSON.stringify(res);
});

app.listen(3000);
/**
 * Created by AC3 on 2016/12/19.
 */

var path = require("path");
var fs = require('fs');
var url = require('url');
var querystring = require('querystring');
var formidable = require('formidable');
var Mime = require('./Mime');
var User = require('./User');
var Message = require('./Message');
var Config = require('./Config').Config;

var Account;//连接Cookie中获取出来的用户ID

exports.Handle = function(Request, Response)
{
    Account = Request.headers.cookie["account"];

    if(Request.method == 'GET')
    {
        HandleGet(Request, Response)
    }
    else if(Request.method == 'POST')
    {
        HandlePost(Request, Response);
    }
}

function HandleGet(Request, Response)
{
    var Path = url.parse(Request.url).pathname;

    //重定向默认主页
    if(Path == '/')
    {
        Path = Config['IndexPage'];
    }
    //补齐后缀
    else if(Path.indexOf(".") == -1)
    {
        Path += '.html';
    }

    fs.readFile('./Brower/' + Path, 'binary',function (Error, Data)
    {
        if (Error) {
            Response.writeHead(404, {'Content-Type': 'text/plain'});
            Response.write('页面丢失');
            Response.end();
        }
        else
        {
            var Type = path.extname(Path);
            Type = Type ? Type.slice(1) : 'unknown';
            var ContentType = Mime.types[Type] || "text/plain";
            Response.writeHead(200, {'Content-Type': ContentType});
            Response.write(Data, 'binary');
            Response.end();
        }
    })
}

function HandlePost(Request, Response)
{
    switch(Request.url)
    {
        //登陆页，登陆事件
        case '/Index/Login':HandleLoginEvent(Request, Response);break;
        //个人主页，发送照片事件
        case '/Main/PostMessage':HandlePostMessageEvent(Request, Response);break;
        //每页开始时判断是否曾经已经登陆过
        case '/IsLogin':HandleIsLoginEvent(Request, Response);break;
        default:break;
    }
}

function HandleLoginEvent(Request, Response)
{
    console.log('HandleLoginEvent');

    var Data = '';

    //通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
    Request.on('data', function(datapart)
    {
        Data += datapart;
    });

    //在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
    Request.on('end', function()
    {
        Data = querystring.parse(Data);

        User.Login(Data.Username, Data.Password, function (Error, Rows) {
            if(Error)
                throw Error;

            if(Rows.length >0)
            {
                Response.writeHead(200, {
                    'Set-Cookie': ["account=" + Data.Username],
                    'Content-Type': 'text/plain'});
                Response.write('LoginSuccess' + Config.Separator + Data.Username);
                console.log('LoginSuccess' + Config.Separator + Data.Username);
            }
            else
            {
                Response.writeHead(200, {'Content-Type': 'text/plain'});
                Response.write('LoginFail');
                console.log('LoginFail');
            }

            Response.end();
        });
    });
}

function HandleIsLoginEvent(Request, Response)
{
    console.log('HandleIsLoginEvent');

    if(Request.headers.cookie["account"])
    {
        Response.writeHead(200, {'Content-Type': 'text/plain'});
        Response.write('LoginSuccess' + Config.Separator + Request.headers.cookie["account"]);
        Response.end();
        console.log('LoginSuccess' + Request.headers.cookie["account"]);
    }
    else
    {
        Response.writeHead(200, {'Content-Type': 'text/plain'});
        Response.write('NeverLogin');
        Response.end();
        console.log('NeverLogin');
    }
}

function HandlePostMessageEvent(Request, Response)
{
    //如果HTTP头没有Cookie记录已经登陆的信息，则返回，防止未经登陆的用户上传文件
    //if(!Account)
    //{
    //    console.log("Cookie don't include account information!");
    //    return;
    //}

    console.log('HandlePostMessageEvent');

    //创建表单上传
    var form = new formidable.IncomingForm();
    //设置编辑
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = Config['RootPath'];
    //保留后缀
    form.keepExtensions = true;
    //设置单文件大小限制
    form.maxFieldsSize = 2 * 1024 * 1024;
    //form.maxFields = 1000;  设置所以文件的大小总和

    form.parse(Request, function(err, fields, files) {

        var mDate = new Date();
        var mVoicePath = Config['VoicePath'] + mDate.getFullYear() + '-' + (mDate.getMonth() + 1) + '-' + mDate.getDate() + ' ' + mDate.getHours() + '.'  + mDate.getMinutes() + '.' + mDate.getSeconds() + '.mp3';

        //为录音文件添加后缀，移动到录音存放目录下
        fs.rename(files.Voice['path'], mVoicePath, function(Error){
            if(Error){
                throw Error;
            }
        });

        console.log("Account" + "|" + mVoicePath + "|" + fields.Describe);
        return;

        Message.PostMessage("Account", files.Picture['path'], mVoicePath, fields.Describe, function (Error, Rows) {
            if(Error)
                throw Error;

            if(Rows.length >0)
            {
                Response.writeHead(200, {'Content-Type': 'text/plain'});
                Response.write('PostMessageSuccess');
                console.log('PostMessage');
            }
            else
            {
                Response.writeHead(200, {'Content-Type': 'text/plain'});
                Response.write('PostMessageFail');
                console.log('PostMessageFail');
            }

            Response.end();
        });
    });
}

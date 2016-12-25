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
var Tool = require('./Tool');
var Config = require('./Config').Config;

var Account;//连接Cookie中获取出来的用户ID

exports.Handle = function(Request, Response)
{
    if(Request.headers.cookie)
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

    //请求服务器上的文件
    if(Path.indexOf("/Server/") != -1)
    {
        Path = Path.replace("%20"," ");//传递过来的请求会把空格符变为%20

        fs.readFile('.' + Path, 'binary',function (Error, Data)
        {
            if (Error) {
                Response.writeHead(450, {'Content-Type': 'text/plain'});
                Response.write('File is not exit');
                Response.end();
                console.log('File is not exit');
            }
            else
            {
                var Type = path.extname(Path);
                Type = Type ? Type.slice(1) : 'unknown';
                var ContentType = Mime.types[Type] || "text/plain";
                Response.writeHead(200, {'Content-Type': ContentType});
                Response.write(Data, 'binary');
                Response.end();
                console.log('File is downloading');
            }
        })
    }
    else
    {
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
}

function HandlePost(Request, Response)
{
    switch(Request.url)
    {
        //登陆事件
        case '/Login':HandleLoginEvent(Request, Response);break;
        //注册事件
        case '/Register':HandleRegisterEvent(Request, Response);break;
        //个人主页，发送照片事件
        case '/PostMessage':HandlePostMessageEvent(Request, Response);break;
        //查看附近照片
        case '/GetOtherPicture':HandleGetOtherPictureEvent(Request, Response);break;
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
            {
                Response.writeHead(550, {'Content-Type': 'text/plain'});
                Response.write('系统出错');
                Response.end();
                console.log('系统出错');
                return;
            }

            if(Rows.length >0)
            {
                Response.writeHead(200, {
                    'Set-Cookie': ["account=" + Data.Username],
                    'Content-Type': 'text/plain'});
                Response.write('LoginSuccess' + Config.Separator + Data.Username);
                Response.end();
                console.log('LoginSuccess' + Config.Separator + Data.Username);
            }
            else
            {
                Response.writeHead(450, {'Content-Type': 'text/plain'});
                Response.write('LoginFail');
                Response.end();
                console.log('LoginFail');
            }
        });
    });
}

function HandleRegisterEvent(Request, Response)
{
    console.log('HandleRegisterEvent');

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

        User.Register(Data.Username, Data.Password, function (Error, Rows) {

            if(Error)
            {
                Response.writeHead(550, {'Content-Type': 'text/plain'});
                Response.write('系统出错');
                Response.end();
                console.log('系统出错');
                return;
            }

            //不存在ID冲突,注册成功
            if(Rows['warningCount'] == 0)
            {
                Response.writeHead(200, {
                    'Set-Cookie': ["account=" + Data.Username],
                    'Content-Type': 'text/plain'});
                Response.write('RegisterSuccess' + Config.Separator + Data.Username);
                Response.end();
                console.log('RegisterSuccess' + Config.Separator + Data.Username);
            }
            else
            {
                Response.writeHead(450, {'Content-Type': 'text/plain'});
                Response.write('RegisterFail');
                Response.end();
                console.log('RegisterFail');
            }
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

        var mPicturePath = "";
        var mVoicePath = "";
        var mState = "";

        if(files.Picture)
        {
            mPicturePath = Config['PicturePath'] + GetNowTime() + '.' + files.Picture.type;
            //移动到录音存放目录下
            fs.renameSync(files.Picture['path'], mPicturePath);
        }

        if(files.Voice)
        {
            mVoicePath = Config['VoicePath'] + GetNowTime() + '.' + files.Voice.type;
            //移动到图片存放目录下
            fs.renameSync(files.Voice['path'], mVoicePath);
        }

        if(fields.State)
        {
            mState = fields.State;
        }

        Message.PostMessage("Account", mPicturePath, mVoicePath, mState, function (Error, Rows) {

            if(Error)
            {
                Response.writeHead(550, {'Content-Type': 'text/plain'});
                Response.write('系统出错');
                Response.end();
                console.log('系统出错');
                return;
            }

            if(Rows['warningCount'] == 0)
            {
                Response.writeHead(200, {'Content-Type': 'text/plain'});
                Response.write('PostMessageSuccess');
                Response.end();
                console.log('PostMessageSuccess');
            }
            else
            {
                Response.writeHead(200, {'Content-Type': 'text/plain'});
                Response.write('PostMessageFail');
                Response.end();
                console.log('PostMessageFail');
            }
        });
    });
}

function HandleGetOtherPictureEvent(Request, Response)
{
    console.log('HandleGetOtherPictureEvent');

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

        Message.GetMessage(Data.Page, Data.Limit, function (Error, Rows) {

            //如果查询到数据
            if(Rows.length > 0)
            {
                var data = [];
                for(var i = 0; i < Rows.length; i++)
                {
                    var Row = {};
                    Row.Picture = Rows[i].Picture;
                    Row.Voice = Rows[i].Voice;
                    Row.State = Rows[i].State;
                    data[i] = Row;
                }
                Response.writeHead(200, {'Content-Type': 'application/json'});
                Response.write(JSON.stringify(data));
                Response.end();
                console.log(JSON.stringify(data));
                console.log('GetOtherPictureSucceed');
            }
            else
            {
                Response.writeHead(450, {'Content-Type': 'text/plain'});
                Response.write('GetOtherPictureFail');
                Response.end();
                console.log('GetOtherPictureFail');
            }
        });
    });
}

function GetNowTime()
{
    var mDate = new Date();
    return (mDate.getFullYear() + '-' + (mDate.getMonth() + 1) + '-' + mDate.getDate() + ' ' + mDate.getHours() + '.'  + mDate.getMinutes() + '.' + mDate.getSeconds()).toString();
}

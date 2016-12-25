/**
 * Created by AC3 on 2016/12/19.
 */
var mysql = require('mysql');

var TableName = 'user';//数据库名

//登陆
exports.Login = function (Account, PassWord, CallBack)
{
    var mConnection = ConnectMySQL();
    var SelectSQL = 'select * from ' + TableName + ' where Account = "' + Account + '" and PassWord = "' + PassWord + '"';
    mConnection.query(SelectSQL, CallBack);
    StopConnect(mConnection);
}

//注册
exports.Register = function (Account, PassWord, CallBack)
{
    var mConnection = ConnectMySQL();
    var InsertSQL = 'insert ignore into ' + TableName + '(Account,PassWord) values("' + Account + '","' + PassWord +  '")';
    mConnection.query(InsertSQL, CallBack);
    StopConnect(mConnection);
}

//添加用户
function Add(Account,PassWord)
{
    var mConnection = ConnectMySQL();
    var InsertSQL = 'insert into ' + TableName + '(Account,PassWord) values("' + Account + '","' + PassWord +  '")';
    console.log(InsertSQL);
    mConnection.query(InsertSQL, function(Error, Rows)
    {
        if (Error) console.log(Error);
        console.log(Rows);
    });
    StopConnect(mConnection);
}

//删除用户
function Delete(Account)
{
    var mConnection = ConnectMySQL();
    var DeleteSQL = 'delete from ' + TableName + ' where Account = "' + Account + '"';
    mConnection.query(DeleteSQL, function(Error, Rows)
    {
        if (Error) console.log(Error);
        console.log(Rows);
    });
    StopConnect(mConnection);
}

//查询用户
function Selete(Account)
{
    var mConnection = ConnectMySQL();
    var SelectSQL = 'select * from ' + TableName + ' where Account ="' + Account + '"';
    mConnection.query(SelectSQL, function(Error, Rows)
    {
        if (Error) console.log(Error);
        console.log(Rows);
    });
    StopConnect(mConnection);
}

//更新用户
function Update(Account,PassWord)
{
    var mConnection = ConnectMySQL();
    var UpdateSQL = 'update ' + TableName + ' set PassWord="' + PassWord + '" where Account="' + Account + '"';
    mConnection.query(UpdateSQL, function(Error, Rows)
    {
        if (Error) console.log(Error);
        console.log(Rows);
    });
    StopConnect(mConnection);
}

//连接数据库
function ConnectMySQL()
{
    var mConnection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database:'voicealbum',
        port: 3306
    });
    mConnection.connect();
    return mConnection;
}

//关闭数据库
function StopConnect(mConnection)
{
    mConnection.end();
}
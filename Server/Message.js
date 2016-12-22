/**
 * Created by AC3 on 2016/12/21.
 */
var mysql = require('mysql');

var TableName = 'voicealbum';//数据库名

//发贴
exports.PostMessage = function (Account, Picture, Voice, Describe, CallBack)
{
    var mConnection = ConnectMySQL();
    var InsertSQL = 'insert into ' + TableName + '(Account,Picture,Voice,Describe) values("' + Account + '","' + Picture + '","' + Voice +  '","' + Describe +'")';
    console.log(InsertSQL);
    mConnection.query(InsertSQL, CallBack);
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
/**
 * Created by AC3 on 2016/12/21.
 */
var mysql = require('mysql');

var TableName = 'message';//数据库名

//发贴
exports.PostMessage = function (Account, Picture, Voice, State, CallBack)
{
    var mConnection = ConnectMySQL();
    var InsertSQL = 'insert into ' + TableName + '(Account,Picture,Voice,State) values("' + Account + '","' + Picture + '","' + Voice +  '","' + State +'")';
    mConnection.query(InsertSQL, CallBack);
    StopConnect(mConnection);
}

exports.GetMessage = function(Page, Limit, CallBack)
{
    var mConnection = ConnectMySQL();
    var SelectSQL = 'select * from ' + TableName + ' limit ' +  (Page * Limit) + ',' + Limit;
    mConnection.query(SelectSQL, CallBack);
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
const { app, BrowserWindow, ipcMain } = require('electron');
// const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2');
const path = require('path');

function createWindow() {
    // 创建浏览器窗口
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    // 加载应用的index.html文件
    win.loadFile('renderer/index.html')
    // 打开开发者工具
    win.webContents.openDevTools();

    // 当window被关闭，这个事件会被触发
    win.on('closed', () => {
        win = null
    })
}
// 当Electron完成初始化并且准备创建浏览器窗口时，将调用此方法
app.on('ready', createWindow)

// 当所有窗口被关闭时退出
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// 在macOS上，当单击dock图标并且没有其他窗口打开时，通常在应用程序中重新创建一个窗口
// 在应用中创建一个新窗口时，通常会在其中添加代码，与这些事件处理程序类似
app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})

// 监听渲染进程发送的保存日记的请求
ipcMain.on('save', (event, diaryText) => {
    console.log('我保存了日记main.js')
    const connection = mysql.createConnection({
        host: 'localhost', // 数据库服务器的地址
        user: 'root', // 数据库用户名
        password: '', // 数据库密码
        database: 'mydatabase' // 数据库名称
    });

    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to MySQL server: ' + err.stack);
            return;
        }

        console.log('Connected to MySQL server!');

        // 插入数据到数据库
        connection.query('INSERT INTO diary (content) VALUES (?)', [diaryText], (err, results) => {
            if (err) {
                console.error('Error inserting data into MySQL: ' + err.stack);
                return;
            }

            console.log(`A row has been inserted with rowid ${results.insertId}`);

            connection.end((endErr) => {
                if (endErr) {
                    console.error('Error closing connection to MySQL server: ' + endErr.stack);
                    return;
                }

                console.log('Connection to MySQL server closed!');
            });
        });
    });
});

// 监听渲染进程发送的加载日记的请求
ipcMain.on('load', (event) => {
    const connection = mysql.createConnection({
        host: 'localhost', // 数据库服务器的地址
        user: 'root',
        password: '',
        database: 'mydatabase'
    });

    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to MySQL server: ' + err.stack);
            return;
        }
        console.log('Connected to MySQL server!');
        // 从数据库中查询数据
        connection.query('SELECT * FROM diary', (err, results) => {
            if (err) {
                console.error('Error querying data from MySQL: ' + err.stack);
                return;
            }
            console.log('Got ' + results.length + ' rows from MySQL');
            event.reply('loaded', results);
            // event.sender.send('loaded', resultsStr);

            connection.end((endErr) => {
                if (endErr) {
                    console.error('Error closing connection to MySQL server: ' + endErr.stack);
                    return;
                }
                console.log('Connection to MySQL server closed!');
            });
        }
        );
    });
})
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200, 
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            // Permite que o 'script.js' use funções do Node.js (como 'require')
            nodeIntegration: true, 
            contextIsolation: false 
        },
        // Adiciona o ícone da janela (o mesmo do instalador)
        icon: path.join(__dirname, 'icon.ico') 
    });

    const startUrl = url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    });

    mainWindow.loadURL(startUrl);

    // Para a versão final (build), comente ou remova a linha abaixo
    // para não abrir as ferramentas de desenvolvedor para o usuário.
    // mainWindow.webContents.openDevTools(); 
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Nota sobre Segurança:
// As configurações `nodeIntegration: true` e `contextIsolation: false` são a forma mais simples
// de fazer o Node.js funcionar no seu HTML/JS. Para aplicações que não acessam a internet
// ou APIs externas, isso geralmente é aceitável. A prática mais moderna e segura é usar
// `contextIsolation: true` com um "preload script", mas isso adiciona complexidade.
// Para este projeto, a configuração atual é funcional.
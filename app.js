const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const FILE_DIR = path.join(__dirname, 'files');
if (!fs.existsSync(FILE_DIR)) fs.mkdirSync(FILE_DIR);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('list-files', () => {
    fs.readdir(FILE_DIR, (err, files) => {
      const txtFiles = files.filter(f => f.endsWith('.txt'));
      socket.emit('file-list', txtFiles);
    });
  });

  socket.on('get-file', (fileName) => {
    const filePath = path.join(FILE_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      socket.emit('file-content', { file: fileName, content });
    }
  });

  socket.on('edit-file', ({ file, content }) => {
    const filePath = path.join(FILE_DIR, file);
    fs.writeFileSync(filePath, content, 'utf-8');
    socket.broadcast.emit('file-updated', { file, content });
  });

  socket.on('create-file', (fileName) => {
    const filePath = path.join(FILE_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', 'utf-8');
      socket.emit('file-created', fileName);
    }
  });

  socket.on('rename-file', ({ oldName, newName }) => {
    const oldPath = path.join(FILE_DIR, oldName);
    const newPath = path.join(FILE_DIR, newName);
    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
      fs.renameSync(oldPath, newPath);
      socket.emit('file-renamed', { oldName, newName });
    }
  });

  socket.on('delete-file', (fileName) => {
    const filePath = path.join(FILE_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      socket.emit('file-deleted', fileName);
    }
  });
});

server.listen(9010, () => {
  console.log('Live editor running');
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Si necesitas CORS (cuando el cliente está en otra origin), descomenta y ajusta:
// const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// Si cliente y servidor están en la misma origin, usa así:
const io = new Server(server);

// Servir carpeta public
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Nueva conexión:', socket.id);

  socket.on('join', (username) => {
    socket.data.username = username || 'Anon';
    socket.emit('system message', `Bienvenido, ${socket.data.username}`);
    socket.broadcast.emit('system message', `${socket.data.username} se unió al chat.`);
    console.log(`${socket.id} -> ${socket.data.username} se unió`);
  });

  // Recibe mensajes (acepta tanto string como objeto payload)
  socket.on('chat message', (data) => {
    let payload;

    if (typeof data === 'string') {
      // Cliente envió solo texto
      const username = socket.data.username || 'Anon';
      payload = {
        user: username,
        text: data,
        time: new Date().toLocaleTimeString()
      };
    } else if (data && typeof data === 'object') {
      // Cliente envió objeto (payload)
      payload = {
        user: data.user || socket.data.username || 'Anon',
        text: data.text || data.msg || '',
        time: data.time || new Date().toLocaleTimeString()
      };
    } else {
      console.warn('chat message recibido con formato desconocido:', data);
      return;
    }

    console.log('Mensaje recibido:', payload);
    io.emit('chat message', payload); // reenvía a todos
  });

  socket.on('disconnect', (reason) => {
    const username = socket.data.username;
    if (username) {
      socket.broadcast.emit('system message', `${username} salió.`);
      console.log(`${socket.id} (${username}) se desconectó — reason: ${reason}`);
    } else {
      console.log(`${socket.id} se desconectó — reason: ${reason}`);
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error', socket.id, err);
  });
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// cliente
// Si el cliente sirve desde el mismo servidor/puerto usa io().
// Si necesitas conectar a un servidor remoto, reemplaza por: io('http://IP:PUERTO');
const socket = io(); // <-- deja así para desarrollo local

// elementos
const loginCard = document.getElementById('loginCard');
const nameInput = document.getElementById('nameInput');
const enterBtn = document.getElementById('enterBtn');

const chatWrap = document.getElementById('chatWrap');
const messagesEl = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

let myName = null;

// debug
socket.on('connect', () => console.log('Conectado a socket.io, id=', socket.id));
socket.on('connect_error', (err) => console.error('connect_error', err));
socket.on('disconnect', (reason) => console.log('Desconectado:', reason));

// -------------------
// Función beep con Web Audio API
// -------------------
function playBeep(frequency = 440, duration = 200) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime); // volumen
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    console.warn('No se pudo reproducir beep:', e);
  }
}

// helper para agregar mensaje al DOM
function appendMessage({ user, text, time }, opts = {}) {
  const div = document.createElement('div');
  if (opts.system) {
    div.className = 'system';
    div.textContent = text;
  } else {
    div.className = 'msg';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${user} · ${time}`;
    const body = document.createElement('div');
    body.textContent = text;
    div.appendChild(meta);
    div.appendChild(body);
  }
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // sonido al recibir mensaje de otros
  if (!opts.system && user !== myName) playBeep();
}

// Entrar al chat (también con Enter)
enterBtn.addEventListener('click', enterChat);
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') enterChat();
});

function enterChat() {
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    return;
  }
  myName = name;
  socket.emit('join', myName);

  // cambiar vista
  loginCard.classList.add('hidden');
  chatWrap.classList.remove('hidden');
  msgInput.focus();
}

// enviar mensaje
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  const payload = {
    user: myName,
    text: text,
    time: new Date().toLocaleTimeString()
  };

  socket.emit('chat message', payload);

  // mostrar tu mensaje localmente
  appendMessage(payload);
  msgInput.value = '';
  msgInput.focus();

  // sonido al enviar mensaje
  playBeep(660, 150);
}

sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// recibir mensajes del servidor
socket.on('chat message', (payload) => {
  // payload es { user, text, time }
  if (!payload) return;
  // evita duplicar tu propio mensaje (ya lo mostramos localmente)
  if (payload.user !== myName) appendMessage(payload);
});

socket.on('system message', (txt) => {
  appendMessage({ user: '', text: txt, time: new Date().toLocaleTimeString() }, { system: true });
});

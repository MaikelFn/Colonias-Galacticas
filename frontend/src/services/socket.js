import { io } from "socket.io-client";

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const socketUrl = isLocalhost ? 'http://localhost:3000' : 'https://colonias-galacticas.onrender.com';

const socket = io(socketUrl);

export default socket;

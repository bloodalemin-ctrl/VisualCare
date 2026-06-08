import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const registrarUsuario = async (nombre, apellidoP, apellidoM, correo, password) => {
    try {
        const response = await axios.post(`${API_URL}/registro`, { nombre, apellidoP, apellidoM, correo, password });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Error al conectar con el servidor');
    }
};

export const iniciarSesion = async (correo, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { correo, password });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Error al conectar con el servidor');
    }
};
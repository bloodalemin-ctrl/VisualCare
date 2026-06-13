import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const registrarUsuario = async (nombre, apellidoP, apellidoM, correo, password, fechaNacimiento) => {
    console.log("📤 Enviando al backend:", {
    nombre,
    apellidoP,
    apellidoM,
    correo,
    password,
    fechaNacimiento
  });
            try {
            const response = await fetch('http://localhost:3000/api/registro', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombre,
                apellidoP,
                apellidoM,
                correo,
                password,
                fechaNacimiento,
            }),
            });
            
            const data = await response.json();
            console.log("📥 Respuesta del backend:", response.status, data);
            
            if (!response.ok) {
            throw new Error(data.error || 'Error en el registro');
            }
            return data;
        } catch (error) {
            console.error('❌ Error en registro:', error);
            throw error;
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
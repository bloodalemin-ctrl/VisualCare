drop database visioncare;
CREATE DATABASE visioncare;
USE visioncare;
show tables;
select * FROM  USUARIO;

ALTER TABLE USUARIO ADD COLUMN rol ENUM('admin', 'usuario', 'optometrista') DEFAULT 'usuario';
ALTER TABLE USUARIO ADD COLUMN cedula VARCHAR(50) NULL;

CREATE TABLE USUARIO (
    id_usuario INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    apellidoP VARCHAR (20) NULL,
    apellidoM VARCHAR (20) NULL,
    correo VARCHAR(30) UNIQUE NOT NULL,
    password VARCHAR(20) NOT NULL,
    fecha_registro DATE NOT NULL,
    PRIMARY KEY (id_usuario)
);


CREATE TABLE CALIBRACION (
    id_calibracion INT AUTO_INCREMENT NOT NULL,
    id_usuario INT NOT NULL,
    dpi_detectado FLOAT NOT NULL,
    calibracion_correcta BOOLEAN NOT NULL,
    fecha_cali DATETIME NULL,
    PRIMARY KEY (id_calibracion),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);


CREATE TABLE DISTANCIA (
    id_distancia INT AUTO_INCREMENT NOT NULL,
    id_usuario INT NOT NULL,
    distancia_cm FLOAT NOT NULL,
    fecha DATETIME NOT NULL,
    PRIMARY KEY (id_distancia),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);


CREATE TABLE CUESTIONARIO_CVS (
    id_cvs INT AUTO_INCREMENT NOT NULL,
    id_usuario INT NOT NULL,
    puntaje_total INT NOT NULL,
    nivel_fatiga VARCHAR(30) NOT NULL,
    fecha DATETIME NOT NULL,
    PRIMARY KEY (id_cvs),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);


CREATE TABLE SINTOMAS_CVS (
    id_sintoma INT AUTO_INCREMENT NOT NULL,
    id_cvs INT NOT NULL,
    nombre_sintoma VARCHAR(50) NOT NULL,
    frecuencia INT NOT NULL,
    intensidad INT NOT NULL,
    PRIMARY KEY (id_sintoma),
    FOREIGN KEY (id_cvs) REFERENCES CUESTIONARIO_CVS(id_cvs) ON DELETE CASCADE
);

CREATE TABLE TEST_VISUAL (
    id_test INT AUTO_INCREMENT NOT NULL,
    id_usuario INT NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    resultado VARCHAR(200) NOT NULL,
    fecha DATETIME NOT NULL,
    PRIMARY KEY (id_test),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);


CREATE TABLE REPORTE (
    id_reporte INT AUTO_INCREMENT NOT NULL,
    id_usuario INT NOT NULL,
    id_cvs INT NOT NULL,
    id_test INT NOT NULL,
    ruta_pdf VARCHAR(50) NOT NULL,
    fecha DATETIME NOT NULL,
    PRIMARY KEY (id_reporte),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_cvs) REFERENCES CUESTIONARIO_CVS(id_cvs) ON DELETE CASCADE,
    FOREIGN KEY (id_test) REFERENCES TEST_VISUAL(id_test) ON DELETE CASCADE
);



CREATE TABLE NOTICIA (
    id_noticia INT AUTO_INCREMENT PRIMARY KEY,
    id_autor INT,
    titulo VARCHAR(60) NOT NULL,
    contenido TEXT,
    tipo_multimedia ENUM('texto', 'imagen', 'video') DEFAULT 'texto',
    url_multimedia VARCHAR(80) NULL,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_autor) REFERENCES USUARIO(id_usuario)
);
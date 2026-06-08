USE visioncare;
show tables;
select * FROM  USUARIO;
TRUNCATE TABLE USUARIO;
INSERT INTO USUARIO (nombre, apellidoP, apellidoM, correo, password, rol, cedula) 
VALUES ('Ale', 'Benitez', 'Leonardo', 'admin@visioncare.com', 'admin123', 'admin', NULL);
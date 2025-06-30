# Usar una imagen base ligera con Nginx
FROM nginx:alpine

# Copiar los archivos estáticos al contenedor
COPY . /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Comando para iniciar Nginx en primer plano (se ejecutará en segundo plano con docker run -d)
CMD ["nginx", "-g", "daemon off;"]
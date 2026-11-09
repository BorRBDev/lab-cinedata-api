# Spec . Buscar películas por título


## Objetivo
GET /peliculas/buscar?q=texto devuelve las peliculas cuyo título contiene el texto,  sin distinguir mayúsculas, ordenadas por año descendente, máximo 20.


## Restricciones
- q obligatorio, se recorta con trim, entre 2 y 30 caracteres, validado con express-validator.
- Público: no necesita token.
- La ruta va antes de /:id. Documentada con @openapi como hacen los demás.
- No hacer commits, No instalar paquetes ni librerías sin consultar

## Hecho cuando
- GET /peliculas/buscar?q=co => 200 con un array
- GET /peliculas/buscar?q=czzzzz => 200 con un array vacío
- GET /peliculas/buscar  => 400
- GET /peliculas/buscar?q= c  => 400




# My Court Dashboard

Panel de propietarios de recintos deportivos hecho con React, TypeScript y CSS puro. Las variables globales de color, tipografía y espaciado viven en `src/styles/base.css`.

## Ejecutar el proyecto

```powershell
npm ci
npm run dev
```

Vite usa el puerto 5173. Para acceder, levanta `my-court-api` en el puerto 3000 e inicia sesión con una cuenta que tenga el rol `owner` y un recinto asignado. Si tu API usa otro puerto, copia `.env.example` a `.env` y cambia `VITE_API_TARGET`.

Para compilar, ejecuta `npm run build`. Para servir la compilación detrás de un proxy, enruta `/api` al backend y configura la página principal como fallback de las rutas del dashboard. Si usas `VITE_API_URL`, configura el origen permitido y las cookies con credenciales en el backend.

## Funciones disponibles

| Pantalla | Acciones |
| --- | --- |
| Resumen | Canchas registradas, total de turnos del período, próximos turnos, torneos visibles y valoración. |
| Mi recinto | Consultar información, editar deportes e instalaciones y administrar fotos. |
| Canchas | Consultar horarios y tarifas, crear una cancha con franjas y precios. |
| Agenda | Consultar por cancha y filtrar por fecha dentro de la ventana que entrega la API. |
| Torneos | Crear, abrir y eliminar borradores, gestionar equipos, inscripciones y el fixture de un Americano cuando lo devuelve la API. |

La agenda es de consulta porque la API todavía no publica rutas para confirmar o cancelar como propietario. El listado de torneos entrega hasta diez elementos y omite el formato. El fixture y la clasificación del Americano se muestran durante el flujo de gestión a partir de las respuestas de generación y carga de resultados. Sus rutas de lectura aún requieren el rol de jugador.

Antes de habilitar un entorno con varios propietarios, valida en el backend la pertenencia del recinto al crear canchas y la pertenencia del torneo en las acciones de gestión. El listado por recinto del frontend no sustituye esas comprobaciones.

El flujo real de aprobación de inscripciones necesita que el backend compare identificadores en el mismo formato. En el código actual, el servicio compara un `ObjectId` de MongoDB con el `String` recibido por la ruta.

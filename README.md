# MONICA Turnos Panel

Panel operativo para asignar jóvenes investigadores a eventos institucionales.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- FullCalendar

## Variables de entorno

Creá un archivo `.env.local` con la URL del backend:

```bash
VITE_API_URL=http://localhost:8080
```

Si no se define, la aplicación usa `http://localhost:8080`.

## Scripts disponibles

```bash
npm run dev
npm run lint
npm run preview
```

> Nota: `npm run build` existe en `package.json`, pero no se ejecuta automáticamente en este flujo.

## Flujo operativo

1. El panel carga eventos, jóvenes investigadores y asignaciones desde el backend.
2. Al seleccionar un evento del calendario, se abre el detalle operativo.
3. La card de resumen del evento es desplegable.
4. Desde el detalle se agregan o quitan jóvenes investigadores.
5. Al mover o redimensionar un evento, se actualiza el horario en el backend.

## Criterios de UI

- Los textos visibles están orientados a operación real, no a demo.
- Los estados del backend se presentan con etiquetas legibles.
- La fecha/hora se formatea para Colombia (`America/Bogota`).
- Los errores se muestran como mensajes inline, no con `alert()`.

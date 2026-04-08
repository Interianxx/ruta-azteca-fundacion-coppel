# Ruta Azteca — Referencia para Raul
> Endpoints + vistas pendientes + cambios de horarios · 2026-04-05

**Base URL:** `http://localhost:3000` (dev)  
**Formato:** todas las respuestas son JSON  
**Auth:** sesión NextAuth vía cookie (automática en el browser)

---

## Lo que necesitas construir

### `/admin/dashboard` — rol `admin`
El admin llega aquí automáticamente al hacer login. Debe mostrar:
- Conteo de negocios activos/pendientes → `GET /api/admin/metricas`
- Tabla de negocios pendientes con botones Aprobar/Rechazar → `GET /api/admin/pendientes` + `PUT /api/admin/aprobar`
- Vistas por negocio → `GET /api/admin/metricas/vistas`
- Ranking de puntuación → `GET /api/admin/metricas/puntuacion`
- Distribución de idiomas → `GET /api/admin/metricas/idiomas`

### `/negocio/metricas` — rol `negocio_activo`
Dashboard de métricas para el dueño de un negocio. Debe mostrar:
- Vistas, calificación, reseñas, clics WhatsApp/teléfono
- Primero llama `GET /api/negocios/mio` para obtener el `id`, luego `GET /api/negocios/:id/metricas`

---

## Horario — tipo nuevo (`src/types/negocio.ts`)

El tipo `Horario` ya está agregado. Los campos `horario?: Horario` ya existen en la interfaz `Negocio`.

```ts
interface HorarioDia {
  abierto:  boolean
  apertura: string  // "09:00"
  cierre:   string  // "21:00"
}
interface Horario {
  lun: HorarioDia; mar: HorarioDia; mie: HorarioDia; jue: HorarioDia
  vie: HorarioDia; sab: HorarioDia; dom: HorarioDia
}
```

**Ya implementado — no tocar:**
- `/negocio/perfil` → card editable con toggle por día y time inputs, guarda con `PUT /api/negocios/:id`
- `/turista/mapa` → DetailSheet muestra horario semanal + badge Abierto/Cerrado en tiempo real, traducido en 5 idiomas

---

## Autenticación y roles

| `session.rol` | Descripción | Redirige a |
|---|---|---|
| `turista` | Usuario sin negocio | `/turista/mapa` |
| `negocio_pendiente` | Negocio en revisión | `/negocio/perfil` |
| `negocio_activo` | Negocio aprobado | `/negocio/perfil` |
| `admin` | Administrador | `/admin/dashboard` |

El rol viene en `session.rol` de NextAuth. Para leerlo en un componente:
```ts
const { data: session } = useSession()
const rol = (session as { rol?: string })?.rol
```

---

## Stack — reglas importantes

| Tema | Regla |
|---|---|
| Package manager | **yarn** — nunca npm |
| Iconos | **lucide-react** — no SVGs inline ni emojis como iconos |
| Estilos |  - **usa global.css** |
| Tipos | Importar desde `@/types/negocio` |

---

## Endpoints

### Negocios públicos

#### `GET /api/negocios`
Lista negocios activos (máx 100 por página).

| Query param | Tipo | Descripción |
|---|---|---|
| `categoria` | string | `comida` `artesanias` `hospedaje` `tours` `transporte` `otro` |
| `lastKey` | string | Token de paginación devuelto en respuesta anterior |

```json
200 → {
  "data": {
    "items":   [ { ...Negocio } ],
    "lastKey": "<string | undefined>",
    "count":   42
  }
}
500 → { "error": "Error al obtener negocios" }
```

---

#### `GET /api/negocios/:id`
Un negocio por ID.

```json
200 → { "data": { ...Negocio } }
404 → { "error": "Negocio no encontrado" }
```

---

#### `PUT /api/negocios/:id`
Actualiza campos de un negocio. Acepta cualquier subconjunto de campos (actualización dinámica).

```json
Body → { "nombre": "Nuevo nombre", "horario": { "lun": { "abierto": true, "apertura": "09:00", "cierre": "20:00" }, ... } }
200  → { "message": "Negocio actualizado" }
```

---

#### `POST /api/negocios`
Registra un negocio nuevo. Requiere sesión. Crea con `estado: PENDING` y mueve al usuario al grupo Cognito `negocio_pendiente`.

```json
Body → {
  "nombre": "Tacos El Compa", "descripcion": "...", "categoria": "comida",
  "telefono": "5512345678", "whatsapp": "5512345678",
  "direccion": "Calle Madero 12", "lat": 19.4326, "lng": -99.1332,
  "tags": ["tacos"], "imagenUrl": "https://cdn.../foto.jpg"
}
201 → { "data": { ...NegocioCompleto, "estado": "PENDING" } }
401 → { "error": "No autenticado" }
```

---

### Negocio propio

#### `GET /api/negocios/mio`
Devuelve el negocio del usuario autenticado. Requiere sesión.

```json
200 → { "data": { ...Negocio } }   // o  { "data": null }  si no tiene
401 → { "error": "No autenticado" }
```

---

### Métricas del dueño

#### `GET /api/negocios/:id/metricas`
Solo funciona si la sesión pertenece al dueño del negocio.

```json
200 → {
  "data": {
    "vistas":          142,
    "calificacion":    4.3,    // null si no tiene reseñas
    "totalReviews":    18,
    "clicks_whatsapp": 37,
    "clicks_telefono": 12
  }
}
401 → { "error": "No autenticado" }
403 → { "error": "Sin permiso" }
404 → { "error": "Negocio no encontrado" }
500 → { "error": "Error al obtener métricas" }
```

| Campo | Descripción |
|---|---|
| `vistas` | Veces que se abrió el perfil del negocio |
| `calificacion` | Promedio (1–5), `null` si sin reseñas |
| `totalReviews` | Cantidad de reseñas |
| `clicks_whatsapp` | Toques al botón WhatsApp |
| `clicks_telefono` | Toques al botón teléfono |

---

### Reseñas

#### `GET /api/resenas?negocioId=:id`
Últimas 20 reseñas de un negocio, más recientes primero. Público.

```json
200 → {
  "data": [
    {
      "id": "uuid", "negocioId": "uuid", "userId": "sub",
      "userName": "Carlos M.", "userImage": "https://...",
      "calificacion": 5, "comentario": "Excelente", "createdAt": "2026-04-01T10:00:00Z"
    }
  ]
}
```

---

#### `POST /api/resenas`
Publica una reseña. Requiere sesión. Recalcula automáticamente el promedio del negocio.

```json
Body → { "negocioId": "uuid", "calificacion": 4, "comentario": "Muy buen lugar" }
201  → { "ok": true, "data": { "id": "uuid", "calificacion": 4, "comentario": "...", "createdAt": "..." } }
400  → { "error": "negocioId, calificacion y comentario requeridos" }
401  → { "error": "No autenticado" }
```

---

### Favoritos

#### `GET /api/favoritos`
Lista los IDs de negocios guardados. Requiere sesión.

```json
200 → { "data": ["uuid1", "uuid2"] }
```

#### `POST /api/favoritos`
Guarda un favorito. Requiere sesión.

```json
Body → { "negocioId": "uuid" }
200  → { "ok": true }
```

#### `DELETE /api/favoritos`
Elimina un favorito. Requiere sesión.

```json
Body → { "negocioId": "uuid" }
200  → { "ok": true }
```

---

### Admin — Gestión

#### `GET /api/admin/pendientes`
Lista negocios con `estado: PENDING`, ordenados de más antiguo a más reciente.

```json
200 → {
  "data": {
    "items": [
      {
        "id": "uuid", "nombre": "Artesanías López", "categoria": "artesanias",
        "estado": "PENDING", "propietarioId": "sub", "propietarioEmail": "lopez@email.com",
        "direccion": "...", "telefono": "55...", "createdAt": "2026-04-01T09:00:00Z"
      }
    ],
    "count": 3
  }
}
```

---

#### `PUT /api/admin/aprobar`
Aprueba o rechaza un negocio pendiente.
- `aprobar` → estado `ACTIVE`, mueve usuario de `negocio_pendiente` → `negocio_activo` en Cognito
- `rechazar` → estado `REJECTED`

```json
Body → {
  "negocioId":        "uuid",
  "propietarioId":    "cognito-sub",
  "propietarioEmail": "owner@email.com",
  "accion":           "aprobar"   // o "rechazar"
}
200 → { "message": "Negocio aprobado" }
```

---

### Admin — Métricas globales

#### `GET /api/admin/metricas`
Conteo general.

```json
200 → { "data": { "negociosActivos": 24, "negociosPendientes": 3 } }
```

---

#### `GET /api/admin/metricas/vistas`
Total de vistas y ranking por negocio. Ya ordenado de mayor a menor.

```json
200 → {
  "data": {
    "totalVistas": 1420,
    "porNegocio": [
      { "negocioId": "uuid", "nombre": "Tacos El Compa", "vistas": 340 },
      { "negocioId": "uuid", "nombre": "Hostal Azteca",  "vistas": 0   }
    ]
  }
}
500 → { "error": "Error al obtener métricas de vistas" }
```

| Campo | Descripción |
|---|---|
| `totalVistas` | Suma de vistas de todos los negocios activos |
| `porNegocio` | Ordenado mayor → menor. Puede incluir vistas = 0 |

---

#### `GET /api/admin/metricas/puntuacion`
Promedio global ponderado y ranking. Solo incluye negocios con al menos 1 reseña.

```json
200 → {
  "data": {
    "promedioGlobal": 4.3,
    "totalResenas":   87,
    "porNegocio": [
      { "negocioId": "uuid", "nombre": "Posada del Sol", "calificacion": 4.9, "totalReviews": 31 }
    ]
  }
}
500 → { "error": "Error al obtener métricas de puntuación" }
```

| Campo | Descripción |
|---|---|
| `promedioGlobal` | Promedio ponderado (1 decimal). `0` si no hay reseñas |
| `porNegocio` | Solo negocios con reseñas. Ordenado mayor → menor calificación |

---

#### `GET /api/admin/metricas/idiomas`
Distribución de idiomas de los turistas.

```json
200 → {
  "data": {
    "total": 520,
    "porIdioma": [
      { "idioma": "en", "visitas": 210, "porcentaje": 40.4 },
      { "idioma": "es", "visitas": 185, "porcentaje": 35.6 },
      { "idioma": "fr", "visitas": 75,  "porcentaje": 14.4 },
      { "idioma": "pt", "visitas": 35,  "porcentaje": 6.7  },
      { "idioma": "de", "visitas": 15,  "porcentaje": 2.9  }
    ]
  }
}
500 → { "error": "Error al obtener métricas de idiomas" }
```

| Campo | Descripción |
|---|---|
| `idioma` | Código ISO 639-1: `es` `en` `fr` `pt` `de` |
| `porcentaje` | 1 decimal. La suma de todos ≈ 100 |

---

### Eventos (registro de interacciones)

#### `POST /api/eventos`
Registra una interacción del turista. Alimenta las métricas de vistas y de idiomas.

```json
Body → {
  "negocioId": "uuid",
  "tipo":      "vista",        // "vista" | "click_whatsapp" | "click_telefono" | "favorito" | "chat"
  "turistaId": "uuid",         // opcional, si está autenticado
  "idioma":    "en-US"         // navigator.language — el backend normaliza a 2 letras
}
201 → { "message": "Evento registrado" }
```

> El campo `idioma` solo afecta las métricas de idiomas cuando `tipo = "vista"`.

**Ejemplo:**
```js
fetch('/api/eventos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ negocioId: id, tipo: 'vista', idioma: navigator.language })
})
```

---

## Notas generales

- Los arrays ya vienen ordenados desde el servidor — no reordenar en el cliente.
- Si no hay datos, los endpoints devuelven `200` con arrays vacíos y totales en `0` — nunca `404`.
- Los porcentajes de idiomas ya vienen calculados (1 decimal).

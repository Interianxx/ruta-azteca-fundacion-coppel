# API de Métricas — Ruta Azteca

Documentación de los endpoints de métricas disponibles para el dashboard de administración.

**Base URL:** `http://localhost:3000` (dev) / `https://tu-dominio.com` (prod)  
**Formato:** JSON  
**Autenticación:** No requerida en el servidor — el dashboard admin valida la sesión por su cuenta en el cliente.

---

## 1. Vistas por negocio

Retorna el total de vistas globales y el desglose por negocio activo.

**Endpoint**
```
GET /api/admin/metricas/vistas
```

**Request**
```
Headers:  ninguno requerido
Body:     ninguno
Params:   ninguno
```

**Response 200**
```json
{
  "data": {
    "totalVistas": 1420,
    "porNegocio": [
      { "negocioId": "abc123", "nombre": "Taquería El Sol",     "vistas": 340 },
      { "negocioId": "def456", "nombre": "Artesanías Xochitl", "vistas": 210 },
      { "negocioId": "ghi789", "nombre": "Hostal Azteca",       "vistas": 0   }
    ]
  }
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `totalVistas` | number | Suma de vistas de todos los negocios activos |
| `porNegocio` | array | Ordenado de mayor a menor vistas |
| `porNegocio[].negocioId` | string | ID único del negocio |
| `porNegocio[].nombre` | string | Nombre del negocio |
| `porNegocio[].vistas` | number | Total de vistas. Puede ser 0 |

**Response 500**
```json
{ "error": "Error al obtener métricas de vistas" }
```

---

## 2. Puntuación / Calificaciones

Retorna la calificación promedio global ponderada y el desglose por negocio.

**Endpoint**
```
GET /api/admin/metricas/puntuacion
```

**Request**
```
Headers:  ninguno requerido
Body:     ninguno
Params:   ninguno
```

**Response 200**
```json
{
  "data": {
    "promedioGlobal": 4.3,
    "totalResenas": 87,
    "porNegocio": [
      { "negocioId": "abc123", "nombre": "Taquería El Sol",     "calificacion": 4.8, "totalReviews": 23 },
      { "negocioId": "def456", "nombre": "Artesanías Xochitl", "calificacion": 3.9, "totalReviews": 11 }
    ]
  }
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `promedioGlobal` | number | Promedio ponderado con 1 decimal. `0` si no hay reseñas |
| `totalResenas` | number | Suma de todas las reseñas de todos los negocios |
| `porNegocio` | array | Solo incluye negocios con al menos 1 reseña. Ordenado de mayor a menor calificación |
| `porNegocio[].negocioId` | string | ID único del negocio |
| `porNegocio[].nombre` | string | Nombre del negocio |
| `porNegocio[].calificacion` | number | Promedio de ese negocio. Entre 1.0 y 5.0 |
| `porNegocio[].totalReviews` | number | Cantidad de reseñas de ese negocio |

**Response 500**
```json
{ "error": "Error al obtener métricas de puntuación" }
```

---

## 3. Visitantes por idioma

Retorna cuántas visitas se registraron por idioma de navegador del turista.

**Endpoint**
```
GET /api/admin/metricas/idiomas
```

**Request**
```
Headers:  ninguno requerido
Body:     ninguno
Params:   ninguno
```

**Response 200**
```json
{
  "data": {
    "total": 312,
    "porIdioma": [
      { "idioma": "es", "visitas": 180, "porcentaje": 57.7 },
      { "idioma": "en", "visitas": 95,  "porcentaje": 30.4 },
      { "idioma": "fr", "visitas": 22,  "porcentaje": 7.1  },
      { "idioma": "pt", "visitas": 15,  "porcentaje": 4.8  }
    ]
  }
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `total` | number | Total de visitas con idioma registrado |
| `porIdioma` | array | Ordenado de mayor a menor visitas. Vacío si no hay datos aún |
| `porIdioma[].idioma` | string | Código ISO 639-1 de 2 letras: `"es"`, `"en"`, `"fr"`, `"pt"`, `"de"` |
| `porIdioma[].visitas` | number | Número de visitas desde ese idioma |
| `porIdioma[].porcentaje` | number | Porcentaje con 1 decimal. La suma de todos es 100 |

**Response 500**
```json
{ "error": "Error al obtener métricas de idiomas" }
```

---

## 4. Registrar evento (modificado)

Este endpoint ya existía. Se le agregó el campo `idioma` para alimentar las métricas del endpoint anterior. **Es necesario enviarlo para que el contador de idiomas funcione.**

**Endpoint**
```
POST /api/eventos
```

**Request**
```
Headers:  Content-Type: application/json
```

**Body**
```json
{
  "negocioId": "abc123",
  "tipo":      "vista",
  "turistaId": "user-uuid-opcional",
  "idioma":    "en-US"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `negocioId` | string | Sí | ID del negocio visitado |
| `tipo` | string | Sí | Uno de: `"vista"` `"click_whatsapp"` `"click_telefono"` `"favorito"` `"chat"` |
| `turistaId` | string | No | ID del usuario si está autenticado |
| `idioma` | string | No | Idioma del navegador. Enviar `navigator.language` directamente (ej: `"en-US"`). El backend lo normaliza a 2 letras. Solo afecta métricas cuando `tipo = "vista"` |

**Response 201**
```json
{ "message": "Evento registrado" }
```

**Ejemplo de llamada desde el frontend**
```javascript
fetch('/api/eventos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    negocioId: id,
    tipo: 'vista',
    idioma: navigator.language  // "en-US", "fr-FR", "es-MX", etc.
  })
})
```

---

## 5. Métricas de un negocio (vista del dueño)

Retorna las métricas propias del negocio. **Requiere sesión activa del dueño.**

**Endpoint**
```
GET /api/negocios/:id/metricas
```

**Request**
```
Headers:  Cookie de sesión NextAuth (automático en el browser)
Body:     ninguno
```

**Response 200**
```json
{
  "data": {
    "vistas": 340,
    "calificacion": 4.8,
    "totalReviews": 23,
    "clicks_whatsapp": 45,
    "clicks_telefono": 12
  }
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `vistas` | number | Total de veces que se abrió la página del negocio |
| `calificacion` | number \| null | Promedio de calificación. `null` si no tiene reseñas aún |
| `totalReviews` | number | Cantidad de reseñas recibidas |
| `clicks_whatsapp` | number | Veces que alguien tocó el botón de WhatsApp |
| `clicks_telefono` | number | Veces que alguien tocó el botón de teléfono |

**Errores**
```
401 { "error": "No autenticado" }         — usuario no tiene sesión
403 { "error": "Sin permiso" }            — el negocio no le pertenece al usuario
404 { "error": "Negocio no encontrado" }
500 { "error": "Error al obtener métricas" }
```

---

## Notas generales

- Todos los endpoints son `GET` sin parámetros de query ni body.
- Los arrays ya vienen ordenados desde el servidor — no es necesario ordenar en el cliente.
- Si la base de datos no tiene datos aún, los endpoints retornan `200` con arrays vacíos y totales en `0` — no retornan `404`.
- Los porcentajes del endpoint de idiomas ya vienen calculados con 1 decimal.

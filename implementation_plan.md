# Plan: Menú, Carrito, Pago Completo + Draggable Sheet + Anuncios

## Resumen del flujo completo

```
TURISTA                                    NEGOCIO
   │                                          │
   ├─ Abre ficha de negocio (DetailSheet)      │
   ├─ Toca "Ver Menú" (nuevo botón)            │
   ├─ MenuSheet aparece por encima             │
   │    └─ Ítems por categoría                 │
   │    └─ Botones +/- para agregar al cart    │
   ├─ Toca "Ver carrito (N) →"                 │
   ├─ CartSheet: lista de ítems + total       │
   ├─ Toca "Proceder al pago"                  │
   ├─ PagoModal (existente, pero con items)    │
   ├─ Pantalla "Procesando…"                   │
   ├─ Pantalla "¡Éxito!" + lista pedido        │
   │    └─ Folio, monto, ítems                 │
   │                                          │
   │                              [Negocio ve pedido nuevo]
   │                               en /negocio/pedidos (tab)
   │                               o notificación en perfil
```

---

## Feature 1 — Draggable DetailSheet

### Qué cambia
- `mapa/page.tsx`: Agregar lógica de drag con `useRef` + `touch/mouse events`
- Tres estados: `peek` (200px visible), `expanded` (72vh), `closed`
- La "barra gris" ya existe, se convierte en drag handle

### Implementación
```
touch/mouseDown en handle → registra Y inicial
touch/mouseMove → calcula delta → mueve el panel con transform
touch/mouseUp → snap al estado más cercano (peek/expanded/closed)
```

**Sin librerías externas** — todo con eventos nativos de React.

---

## Feature 2 — Anuncios patrocinados

### Dónde aparece
- Horizontal scroll card strip **dentro del panel inferior del mapa** (encima de los resultados de búsqueda)
- Máximo 3 anuncios mock

### Diseño del card
```
┌─────────────────────────────┐ ← borde amarillo dorado
│  💫 Patrocinado             │
│  [img placeholder]          │
│  Taquería El Buen Sabor     │
│  ⭐ 4.8 · Comida · 0.3 km   │
└─────────────────────────────┘
```

### Implementación
- Array estático `SPONSORED_BUSINESSES` en `mapa/page.tsx`
- Misma lógica que los pins regulares para abrir `DetailSheet`
- Badge "Patrocinado" en dorado en la esquina superior izquierda

---

## Feature 3 — Sistema de Menú por negocio

### Nuevos archivos
| Archivo | Descripción |
|---------|-------------|
| `src/components/Turista/MenuSheet.tsx` | Bottom sheet con el menú categorizado + carrito |
| `src/components/Turista/CartModal.tsx` | Revisión del carrito antes de pagar |

### Datos del menú (mock por categoría)
```ts
MENU_DATA: Record<CategoriaSlug, MenuItem[]>
// comida     → tacos, agua, enchiladas, pozole...
// artesanias → pulsera, sarape, máscara, talavera...
// hospedaje  → noche sencilla, noche doble, desayuno incluido...
// tours      → recorrido básico 2h, tour premium 4h...
// transporte → traslado aeropuerto, renta por hora...
// otro       → entrada general, servicio básico...
```

### Estado del carrito (en MapaPage)
```ts
const [cart, setCart] = useState<Record<string, number>>({})
// { "item-id-1": 2, "item-id-2": 1 }
```

### MenuSheet: flujo visual
1. Encabezado con nombre del negocio
2. Items agrupados por sección (drinks / food / extras)
3. Botones `−` cantidad `+` por ítem
4. Sticky bottom bar: "🛒 Ver carrito (3) — $245.00"

---

## Feature 4 — PagoModal con carrito + Pedido al negocio

### Modificación a `PagoModal.tsx`
Acepta nueva prop opcional:
```ts
interface PagoModalProps {
  negocio: { id: string; nombre: string; categoria?: string }
  cartItems?: { name: string; qty: number; price: number }[]
  total?: number
  onClose: () => void
}
```

- Paso 1: Ya no pide monto manualmente — muestra el total del carrito
- Paso 2: Selección de método (igual que ahora)
- Paso 3: Procesando (igual)
- Paso 4: **Recibo mejorado** con lista de ítems + folio

### Pedido simulado para el negocio
- No hay endpoint real → simulamos con **localStorage**
- `localStorage.setItem('ruta_azteca_pedidos', JSON.stringify([...pedidos]))`
- En `/negocio/perfil` o `/negocio/metricas` se muestra un **tab "Pedidos"** 
  que lee el localStorage y muestra los pedidos recientes como tarjetas

---

## Orden de implementación (sin romper nada)

```
PASO 1: MenuSheet.tsx (componente nuevo, sin deps)
PASO 2: CartModal.tsx (componente nuevo, sin deps)  
PASO 3: PagoModal.tsx (modificar props + recibo)
PASO 4: mapa/page.tsx — drag handle + cart state + MenuSheet + sponsored
PASO 5: negocio/metricas o perfil — tab Pedidos (lee localStorage)
```

---

## Límites del mockup (sin tocar backend)

- Menús: datos simulados por categoría, no vienen de API
- Pedidos: guardados en `localStorage` del browser
- Pago: sigue siendo simulado con folio generado localmente
- El negocio ve los "pedidos" en su panel leyendo el mismo localStorage

---

## Verificación final

| URL | Qué probar |
|-----|-----------|
| `localhost:3000/turista/mapa` | Drag sheet, sponsored cards, menú, carrito, pago |
| `localhost:3000/negocio/metricas` | Tab "Pedidos" con pedido simulado |

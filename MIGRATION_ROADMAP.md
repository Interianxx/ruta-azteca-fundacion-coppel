# Ruta Azteca Migration Roadmap (Jade Air Dense v3.0)

Este documento resume el estado actual del proyecto tras la migración y establece las prioridades para el desarrollo en el repositorio de **Fundación Coppel**.

## 1. Lo que ya está hecho (Hitos alcanzados)
-   **Sistema de Diseño Centralizado**: Se creó el sistema **Jade Air Dense** en `globals.css`. Ya no es necesario adivinar colores o sombras; todo está en variables CSS.
-   **Fijación de Usabilidad Móvil**: Se implementó la regla de los **16px** en los inputs globales para evitar el zoom molesto en iPhone.
-   **Navegación Avanzada en el Mapa**: Se integró Mapbox Directions con un `RoutePanel` responsivo y manejo de rutas a pie/auto.
-   **Refactorización del Login**: El flujo de acceso se limpió de estilos manuales y ahora es el modelo a seguir para el resto de la App.

## 2. Trabajo Pendiente (Prioridades para el nuevo agente)

> [!IMPORTANT]
> **Eliminación de Estilos Inline (Deuda Técnica)**:
> Aunque ya centralizamos la mayoría de los estilos en `globals.css`, todavía quedan estilos manuales (`style={{...}}`) en componentes como el **Perfil de Negocio** y el **Dashboard**. Tu prioridad número uno es mover esos estilos a clases semánticas en el CSS global.

-   **Estandarización de Cards**: Llevar los estilos de las tarjetas de métricas y perfiles al sistema `.glass-card`.
-   **Sincronización de Categorías**: Asegurarse de que todos los botones flotantes del mapa usen exclusivamente la clase `.map-category-pill`.
-   **Consolidación de Redirecciones**: Verificar que la lógica de `skipSessionRedirect` en el Login sea robusta tras el cambio de servidor.

## 3. Instrucciones de Operación
1.  **Punto de Verdad**: Antes de tocar cualquier UI, consulta **[STYLE_GUIDE.md](file:///c:/Users/raulf/Desktop/Ruta%20azteca/ruta-azteca-fundacion-coppel/STYLE_GUIDE.md)**. No inventes clases nuevas si ya existen en el Blueprint.
2.  **Reglas de Comportamiento**: Sigue estrictamente **[FRONTEND_BOUNDARIES.md](file:///c:/Users/raulf/Desktop/Ruta%20azteca/ruta-azteca-fundacion-coppel/FRONTEND_BOUNDARIES.md)**. No toques el backend ni borres fetchers de API existentes.
3.  **Handover Directo**: Lee **[AGENT_HANDOVER.md](file:///c:/Users/raulf/Desktop/Ruta%20azteca/ruta-azteca-fundacion-coppel/AGENT_HANDOVER.md)** para entender el razonamiento detrás del sistema de diseño actual.

---
*Este documento fue generado para asegurar que la calidad premium de Ruta Azteca se mantenga intacta en la transición a Fundación Coppel.*

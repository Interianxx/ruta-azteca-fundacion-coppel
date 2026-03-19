# Ruta Azteca

**Genius Arena Hackathon 2026 — Track Fundación Coppel: Ola México**
Equipo: **DevsVelados**

Plataforma PWA que conecta a turistas del Mundial FIFA 2026 con micro y pequeños negocios locales verificados del programa Ola México en Ciudad de México.

---

## Estado actual — Infraestructura inicial

> Este commit representa la **infraestructura base** del proyecto: toda la nube AWS aprovisionada con Terraform y el scaffolding del monorepo. El producto (UI, flujos, experiencia) se construye durante el hackathon presencial (7-9 de abril).

### Infraestructura desplegada en AWS

| Módulo | Recursos | Estado |
|---|---|---|
| **Cognito** | User Pool + Google OAuth + 4 grupos (turista, negocio_pendiente, negocio_activo, admin) | ✅ |
| **DynamoDB** | Tabla `ruta-azteca-dev` — single-table design con 2 GSIs | ✅ |
| **S3 + CloudFront** | Bucket de imágenes + CDN global | ✅ |
| **Lambda** | 3 funciones: chatbot (Bedrock/Claude), traduccion, voz (Transcribe) | ✅ |
| **IAM** | Roles para Lambdas + credenciales para el BFF de Next.js | ✅ |
| **CloudWatch** | Dashboard + alarmas de errores y latencia | ✅ |

### Seed data

47 items pre-cargados en DynamoDB: 6 categorías y 41 negocios reales de CDMX.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend / PWA | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend (BFF) | Next.js API Routes — hablan directo con DynamoDB |
| Lógica pesada | AWS Lambda (Python 3.12) — invocado desde API Routes |
| Base de datos | Amazon DynamoDB (single-table design) |
| Autenticación | Amazon Cognito + Google OAuth |
| Almacenamiento | Amazon S3 + CloudFront |
| Mapas | Mapbox GL JS + Mapbox Directions API |
| IA / Chatbot | Amazon Bedrock (Claude 3 Haiku) |
| Traducción | Amazon Translate + Comprehend |
| Voz | Web Speech API (browser) + AWS Transcribe (fallback) |
| Infraestructura | Terraform >= 1.10 (módulos separados por servicio) |
| Monitoreo | Amazon CloudWatch |

---

## Estructura del monorepo

```
ruta-azteca/
├── src/                    # Next.js 14 App Router
│   ├── app/
│   │   ├── (turista)/      # Mapa, perfil negocio, favoritos, chat
│   │   ├── (negocio)/      # Registro, editar perfil, métricas
│   │   ├── (admin)/        # Pendientes, dashboard, categorías
│   │   └── api/            # API Routes (BFF) → DynamoDB directo
│   ├── lib/                # dynamo.ts, cognito.ts, lambda-invoke.ts, s3.ts
│   ├── components/         # Map, Business, Search, Chat, ui
│   ├── hooks/              # useAuth, useGeolocation, useNegocios
│   ├── types/              # negocio.ts, usuario.ts, api.ts
│   └── middleware.ts       # Protección de rutas por rol
├── infra/
│   ├── main.tf             # Provider AWS + backend S3 remoto
│   ├── modules/
│   │   ├── cognito/
│   │   ├── dynamodb/
│   │   ├── s3-cdn/
│   │   ├── lambda/
│   │   ├── ai-services/
│   │   └── monitoring/
│   ├── environments/
│   │   ├── dev.tfvars
│   │   └── prod.tfvars
│   └── lambda-src/
│       ├── chatbot/index.py
│       ├── traduccion/index.py
│       └── voz/index.py
└── seed/
    ├── categorias.json
    ├── negocios.json
    └── seed.py
```

---

## Setup local

### Requisitos

- Node.js >= 18
- Python >= 3.11
- Terraform >= 1.10
- AWS CLI configurado (`aws configure`)

### 1. Variables de entorno

```bash
cp .env.example .env.local
# Rellena los valores con: terraform output -chdir=infra
```

### 2. Instalar dependencias

```bash
yarn install
```

### 3. Levantar servidor de desarrollo

```bash
yarn dev
```

---

## Infraestructura — Terraform

### Requisitos previos

Crear el bucket de estado remoto (una sola vez):

```bash
aws s3api create-bucket --bucket ruta-azteca-tfstate --region us-east-1
aws s3api put-bucket-versioning \
  --bucket ruta-azteca-tfstate \
  --versioning-configuration Status=Enabled
```

Crear `infra/terraform.tfvars` (no se commitea):

```hcl
google_client_id     = "..."
google_client_secret = "..."
```

### Desplegar

```bash
cd infra
terraform init
terraform plan  -var-file="environments/dev.tfvars"
terraform apply -var-file="environments/dev.tfvars"
```

### Ver outputs (credenciales para .env.local)

```bash
terraform output
terraform output nextjs_bff_access_key_id
terraform output nextjs_bff_secret_access_key
```

### Seed data

```bash
cd seed
pip install boto3
python seed.py --dry-run   # vista previa
python seed.py             # escribe a DynamoDB
```

---

## Arquitectura de decisiones clave

- **Sin API Gateway**: Las API Routes de Next.js hablan directo con DynamoDB via AWS SDK. Solo las 3 Lambdas pesadas se invocan con `Lambda.invoke()`.
- **Single-table DynamoDB**: Un solo tabla con GSIs para queries por estado y categoría.
- **Terraform >= 1.10**: Lock nativo en S3 con `use_lockfile = true`, sin tabla DynamoDB separada.
- **Cognito grupos**: El middleware de Next.js valida el JWT y el grupo (`turista`, `negocio_activo`, `admin`) para proteger rutas.

---

## Equipo

**DevsVelados** — Genius Arena Hackathon 2026

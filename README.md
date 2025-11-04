# AntiShopper AI

Aplicación fullstack (frontend + backend) simple en React + Express diseñada para ayudar a evitar compras impulsivas.

Características:
- Interfaz limpia y simple (React + Vite).
- Backend con Express que consulta una base de datos Postgres (Supabase) usando SQL directo (pg).
- Integración con Ollama (Llama 3): el servidor pide a la IA una respuesta estructurada en JSON en español y depende de Ollama para generar la recomendación.
- No se usa concurrently; se ejecutan frontend y backend por separado.

## Requisitos
- Node.js 18+
- Ollama local con Llama 3 corriendo en `http://localhost:11434`
- Acceso a la base de datos Supabase (la conexión ya fue provista).

## Instalación
1. Instala dependencias:

```cmd
npm install
```

2. Configura variables de entorno (opcional pero recomendado): crea un archivo `.env` en la raíz con este contenido:

```
DB_HOST=aws-1-sa-east-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USER=postgres.mhcfzvjbjumopktleguc
DB_PASSWORD=@TPfinalIA_10
OLLAMA_URL=http://localhost:11434
DB_SSL=true
```

Si no creas `.env`, el backend usará la connection string incluida en el código (tal como te la pasaron). Recomiendo usar variables de entorno para mayor seguridad.

## Ejecutar
Abre dos terminales.

Terminal 1 (backend):

```cmd
npm run server
```

Esto levantará el servidor Express en el puerto 4000 por defecto. Puede tardar si necesita instalar dependencias.

Terminal 2 (frontend):

```cmd
npm run dev
```

Frontend Vite se servirá en http://localhost:5173 por defecto.

## Cómo funciona
- En la UI escribís el producto y respondés una mini-entrevista.
- El frontend envía `{ product, answers }` a `POST http://localhost:4000/api/analyze`.

- El backend:
	- Ejecuta una consulta SQL directa sobre la tabla `products` (ajustá el nombre/columnas si tu esquema es distinto):
		`SELECT id, name, price, description FROM products WHERE name ILIKE '%{product}%' LIMIT 6`.
	- Construye un prompt y llama a Ollama en `OLLAMA_URL` para obtener la recomendación usando un modelo de la familia Llama 3.
	- IMPORTANTE: ahora el servidor espera que Ollama devuelva SÓLO un JSON válido (en español) con el esquema { decision, reasons, alternatives }. Si Ollama no está disponible o devuelve texto no parseable, el endpoint responderá con un error 502. Esto hace que la app dependa de Ollama en local; es intencional para garantizar que las decisiones provengan únicamente de la IA.

Ajustá la consulta SQL si tu tabla o columnas se llaman distinto.

## Ollama local (cómo ejecutar)
1. Instala Ollama siguiendo su guía oficial en https://ollama.ai (descarga e instrucciones).
2. Inicia Ollama en tu máquina y carga un modelo Llama 3 (ejemplo):

Sigue la documentación oficial de Ollama para instalar y gestionar modelos. Indicaciones generales y troubleshooting para Windows:

Comandos útiles:

```
# Verifica la versión de Ollama
ollama --version

# Lista modelos disponibles/instalados
ollama list

# Descargar/instalar un modelo (ejemplo genérico)
ollama pull llama3

# Inicia el servicio HTTP de Ollama (no le pases el nombre del modelo aquí)
ollama serve

# Lista procesos/servicios de Ollama (modelos corriendo)
ollama ps

# Ejecuta el modelo en primer plano (modo interactivo / debugging)
ollama run llama3

# Detener un modelo en ejecución
ollama stop llama3
```

Notas específicas sobre errores comunes que viste:

- `Error: accepts 0 arg(s), received 1` al ejecutar `ollama serve llama3` — causa: el comando `serve` no acepta el nombre del modelo. Debes ejecutar solo `ollama serve` y usar `ollama run <modelo>` o `ollama pull <modelo>` según tu flujo.
- `Error: listen tcp 127.0.0.1:11434: bind: Solo se permite un uso de cada dirección de socket (protocolo/dirección de red/puerto)` — esto significa que el puerto 11434 ya está ocupado por otro proceso. Para detectar y cerrar ese proceso en Windows abrí cmd como administrador y ejecutá:

```
netstat -ano | findstr :11434

# Esto devuelve la línea con el PID (última columna). Después, para ver el proceso:
tasklist /FI "PID eq <PID>"

# Si querés terminarlo:
taskkill /PID <PID> /F
```

O alternativamente usá `ollama ps` para ver si algún modelo ya está corriendo y `ollama stop <modelo>` para detenerlo.

Si `ollama run llama3` parece "pegado" (spinner), puede ser:
 - está descargando/desempaquetando el modelo (muy común, consume disco y red),
 - o quedó en modo interactivo esperando entrada, o
 - no tiene permisos/algún antivirus/firewall lo está bloqueando.

Para probar si el servidor HTTP de Ollama está disponible una vez iniciado con `ollama serve`, probá:

```
curl http://localhost:11434/   # o abrí http://localhost:11434 en el navegador
```

Si ves una respuesta HTTP (200/404) entonces el servidor está escuchando. Si no, usá `netstat` para averiguar quién ocupa ese puerto.

3. Ajustá `OLLAMA_URL` y el modelo en `.env` si usás otro puerto o nombre de modelo:

```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

NOTA: el servidor de esta app usa el endpoint HTTP de Ollama `/api/generate`. Si el servidor devuelve 502 con mensaje sobre JSON inválido o 404, revisá que Ollama esté corriendo con `ollama serve` y que el puerto en `OLLAMA_URL` sea el correcto.

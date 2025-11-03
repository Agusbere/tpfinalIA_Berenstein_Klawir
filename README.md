# AntiShopper AI

Aplicación fullstack (frontend + backend) simple en React + Express diseñada para ayudar a evitar compras impulsivas.

Características:
- Interfaz limpia y simple (React + Vite).
- Backend con Express que consulta una base de datos Postgres (Supabase) usando SQL directo (pg).
- Integración con Ollama (Llama 3): el servidor pide a la IA una respuesta estructurada en JSON en español y depende de Ollama para generar la recomendación.
- No se usa concurrently; se ejecutan frontend y backend por separado.

## Requisitos
- Node.js 18+
- (Opcional) Ollama local con Llama 3 corriendo en `http://localhost:11434`
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

Sigue la documentación oficial de Ollama para instalar y gestionar modelos. Indicaciones generales:

```
# Verifica qué modelos tienes disponibles
ollama list

# Descargar/instalar un modelo (ejemplo genérico)
ollama pull <modelo-disponible>

# Inicia el servicio/daemon de Ollama (consulta la doc según tu versión)
ollama daemon
```

Recomendación de modelo: si dispones de una variante de Llama 3 en tu instalación, usa una variante de la familia Llama 3 (por ejemplo `llama3` o `llama3-chat`) — son las que mejor siguen instrucciones en español. Si tu equipo no tiene suficiente memoria/CPU, elige una variante más pequeña (por ejemplo la versión 7B en lugar de 13B/70B).

3. Ajustá `OLLAMA_URL` en `.env` si usás otro puerto.

NOTA: esta app ahora depende explícitamente de Ollama para generar todas las recomendaciones; si Ollama no está corriendo o devuelve JSON inválido, el backend devolverá un error 502 que el frontend mostrará como fallo de IA.

## Notas para desarrolladores junior
- El backend usa consultas SQL directas mediante `pg` (sin cliente oficial de Supabase). Revisa `server/index.js`.
- El frontend es simple y usa `axios` desde `src/utils/api.js`. Si tenés dudas, abrí esos archivos.

## Próximos pasos sugeridos
- Mejorar el parsing de alternativas dependiendo del esquema real de la base de datos.
- Añadir validaciones de formulario y manejo de errores más robusto.
- Agregar estilos más elaborados y tests.

---
Si querés, puedo:
- Ajustar la consulta SQL a tu esquema real si me das los nombres de tablas/columnas.
- Añadir estilos CSS adicionales.
- Integrar autenticación segura si lo necesitás.

# Documentación · PRESTA+

| Archivo | Contenido |
|---|---|
| `Informe_Tecnico_Segunda_Entrega.pdf` / `.md` | Informe técnico de la Segunda Entrega (9 secciones + anexo de rúbrica) |
| `diagrams/` | C4 Nivel 2 (`.dot`/`.png`), secuencia JWT (`.mmd`/`.png`) y modelo de colecciones (`.dot`/`.png`) |
| `openapi.json` | Especificación OpenAPI 3.0.3 (se regenera con `npm run docs:export`) |
| `postman/` | Colección Postman generada desde OpenAPI |
| `screenshots/` | Capturas (p. ej. Swagger UI) — agregar tras levantar la API |

Regenerar diagramas: `dot -Tpng -Gdpi=170 diagrams/c4-nivel2-contenedores.dot -o diagrams/c4-nivel2-contenedores.png` · `mmdc -i diagrams/secuencia-auth-jwt.mmd -o diagrams/secuencia-auth-jwt.png -s 2`

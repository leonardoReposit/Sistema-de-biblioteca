
# Sistema de Biblioteca

Sistema de gestión bibliotecaria con roles Bibliotecaria/Cliente, CRUD completo, préstamos, historial y filtros.

## Stack

- **Backend:** Node.js + Express + mssql (tedious)
- **Frontend:** HTML + CSS + JavaScript vanilla
- **Base de datos:** SQL Server Express

## Requisitos

- Node.js 18+
- SQL Server Express (instancia `SQLEXPRESS`, puerto `1433`)
- Base de datos `BibliotecaDB` existente

## Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd "Sistema de Biblioteca"

# 2. Instalar dependencias
npm install

# 3. Configurar login SQL (SSMS con Windows Auth)
# Ejecutar database/create_login.sql

# 4. Iniciar servidor
node js/server.js
```

El servidor corre en `http://localhost:3000`.

## Usuarios de prueba

| Correo | Contraseña | Rol |
|---|---|---|
| maria@biblioteca.com | 123456 | Bibliotecaria |
| carlos@gmail.com | 123456 | Cliente |

## Estructura

```
├── js/
│   └── server.js          # API REST (Express)
├── public/
│   ├── js/                # Frontend JS (uno por módulo)
│   ├── css/               # Estilos (uno por módulo)
│   ├── login.html
│   ├── index.html
│   ├── usuarios.html
│   ├── categorias.html
│   ├── autores.html
│   ├── editoriales.html
│   ├── libros.html
│   ├── prestamos.html
│   └── historial.html
├── database/
│   └── create_login.sql   # Script para crear login SQL
└── package.json
```

## Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/login | Iniciar sesión |
| GET | /api/usuarios | Listar usuarios |
| POST | /api/usuarios | Crear usuario |
| PUT | /api/usuarios/:id | Editar usuario |
| DELETE | /api/usuarios/:id | Eliminar usuario |
| GET | /api/libros | Listar libros |
| POST | /api/libros | Crear libro |
| PUT | /api/libros/:id | Editar libro |
| DELETE | /api/libros/:id | Eliminar libro |
| GET | /api/prestamos | Listar préstamos |
| POST | /api/prestamos | Crear préstamo |
| PUT | /api/prestamos/:id/devolver | Devolver préstamo |
| POST | /api/solicitar-prestamo | Solicitar préstamo (cliente) |

Resto de recursos: `/api/categorias`, `/api/autores`, `/api/editoriales`, `/api/historial`, `/api/roles`, `/api/clientes`.

## Roles

- **Bibliotecaria:** CRUD completo en todos los módulos
- **Cliente:** Solo lectura, préstamos propios y solicitar libros

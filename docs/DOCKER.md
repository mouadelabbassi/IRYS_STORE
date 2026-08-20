# Irys Store Docker stack

The production-style stack contains PostgreSQL 16, the Spring Boot API, and the
React application behind Nginx. PostgreSQL is the project's only database.

## First start with a new database

Docker Desktop with Docker Compose is the only host runtime required.

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace at least `POSTGRES_PASSWORD`, `JWT_SECRET`, and the
optional pgAdmin password. `JWT_SECRET` must decode from Base64 to at least 32
bytes. A PowerShell generator is:

```powershell
$secretBytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($secretBytes)
[Convert]::ToBase64String($secretBytes)
```

Build and start everything:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 postgres backend frontend
```

On an empty database, Hibernate creates the application schema directly from
the JPA entity classes. Optional CSV catalog initialization is disabled by
default; enable `CSV_IMPORT_AUTO_ON_STARTUP` only when the configured CSV file
is available.

Open:

- Web application: <http://localhost:3000>
- Backend API: <http://localhost:8080>
- Swagger UI: <http://localhost:8080/swagger-ui.html>
- PostgreSQL: `localhost:5432`

All published ports bind to `127.0.0.1` by default. Change `BIND_ADDRESS` only
when remote access is intentional and protected by an appropriate firewall or
reverse proxy.

## PostgreSQL schema

With `JPA_DDL_AUTO=update`, Hibernate creates and maintains these 13 tables from
the active JPA entities:

`banned_emails`, `categories`, `notifications`, `order_items`, `orders`,
`platform_revenue`, `product_reviews`, `products`, `seller_product_requests`,
`seller_revenues`, `seller_stock`, `stock_update_requests`, and `users`.

Validate the database against the entity mappings without changing the schema:

```powershell
docker compose run --rm --no-deps `
  -e JPA_DDL_AUTO=validate `
  -e CSV_IMPORT_AUTO_ON_STARTUP=false `
  backend --spring.main.web-application-type=none
```

Do not use `JPA_DDL_AUTO=create` against a database whose data must be kept.

## Optional database UI

```powershell
docker compose --profile tools up -d pgadmin
```

Open <http://localhost:5050> and connect to host `postgres`, port `5432`, using
the `POSTGRES_*` values from `.env`.

## Operations

```powershell
# Follow application logs
docker compose logs -f backend frontend

# Rebuild after code or dependency changes
docker compose up -d --build

# Stop containers while retaining PostgreSQL data
docker compose down
```

Do not add `--volumes` to `docker compose down` unless permanent deletion of
the PostgreSQL database is explicitly intended and a tested backup exists.

## Docker mode versus local development

Port `8080` must have exactly one backend owner. Do not run Maven while the
Docker backend is running.

For the complete Docker application, run:

```powershell
.\scripts\dev-docker.ps1
```

Then open <http://localhost:3000>. The admin page is
<http://localhost:3000/signin>.

For local development, run this from the repository root:

```powershell
.\scripts\dev-local.ps1
```

The script stops the Docker frontend/backend, keeps PostgreSQL running, checks
that port `8080` is free, and starts Spring Boot. In a second terminal, run:

```powershell
cd .\frontend\Main
npm run dev
```

Then open <http://localhost:5173>. The Vite development server sends `/api`
requests to the local backend on port `8080`.

The project requires Java 21. Local Spring Boot startup loads the repository's
ignored `.env` file and maps `POSTGRES_*` values to the datasource; explicit
`SPRING_DATASOURCE_*` variables still take precedence. Never use
`docker compose down --volumes` when switching modes.

# Pokémon Backend – Clean Architecture • Node.js • Express • MongoDB

This is the backend for the Pokémon favorites assignment, implemented with **Node.js**, **Express**, **MongoDB**, and **Clean Architecture with OOP**.

The backend acts as a **proxy** to the [PokéAPI](https://pokeapi.co/), and provides a **favorites management** API persisted in MongoDB. It is intentionally structured to showcase **clean, modular, testable architecture** with minimal coupling to Express or MongoDB.

---

## Features

- Proxy PokéAPI:
  - `GET /api/pokemon?limit=50&offset=0` — paginated list, capped to the first 150 Pokémon.
  - `GET /api/pokemon/:nameOrId` — details (abilities, types, evolution options).
- Favorites management (stored in MongoDB):
  - `GET /api/favorites` — list favorite Pokémon.
  - `POST /api/favorites` — add a favorite: `{ pokemonId, pokemonName }`.
  - `DELETE /api/favorites/:pokemonId` — remove a favorite.
- Production-ready patterns:
  - Clean Architecture + OOP (Domain, Application, Interface Adapters, Infrastructure).
  - Framework-agnostic controllers and use cases (no Express leakage).
  - Separation of concerns: PokéAPI gateway, Mongo repository, HTTP adapters.
  - Centralized error handling, health endpoint.
  - Express server signature hidden (`X-Powered-By` removed).

---

## Architecture

### High-Level Layers

- **Domain**
  - Business entities and repository interfaces.
  - No dependencies on Express, MongoDB, or PokéAPI specifics.
- **Application (Use Cases)**
  - Application-specific orchestrations (e.g., AddFavoriteUseCase, ListPokemonUseCase).
  - Depend only on Domain interfaces.
- **Interface Adapters**
  - Framework-agnostic controllers.
  - Translate use-case inputs/outputs into simple objects usable by any interface (HTTP, CLI, jobs).
- **Infrastructure**
  - Express HTTP server & routes.
  - Mongoose models and MongoDB repository implementations.
  - PokeApiGateway (Axios HTTP client to PokéAPI).

### Folder Structure

```text
src/
  config/
    env.ts
    db.ts

  domain/
    entities/
      favorite.entity.ts
    repositories/
      interface/
        favorite-repository.interface.ts
        pokemon-gateway.interface.ts

  application/
    dto/
      add-favorite.dto.ts
      delete-favorite.dto.ts
    use-cases/
      list-pokemon.usecase.ts
      get-pokemon-details.useCase.ts
      add-favorite-usecase.ts
      list-favorites-usecase.ts
      remove-favorite-usecase.ts

  interface-adapters/
    controllers/
      pokemon.controller.ts
      favorite.controller.ts

  infrastructure/
    http/
      pokemon-apigateway.http.ts
    db/
      models/
        favorite.model.ts
      repository/
        favorite.repository.ts
    web/
      express-app-factory.web.ts

  interfaces/
    http/
      routes/
        pokemon.routes.ts
        favorite.routes.ts
      middleware/
        error-handler.middleware.ts
        not-found-handler.middleware.ts

  app.ts        # composition root: wires dependencies
  server.ts     # runtime entry point
```

---

## API

### List Pokémon (paginated; capped to first 150)

Request

```
GET /api/pokemon?limit=50&offset=0
```

Response

```
{
  "items": [{ "id": 1, "name": "bulbasaur", "url": "..." }],
  "hasMore": true,
  "nextOffset": 50
}
```

Notes
- `limit` is validated (1–100) and clamped so `offset + limit <= 150`.
- If `offset >= 150`, returns an empty page with `hasMore=false` and no upstream call.

### Pokémon details

```
GET /api/pokemon/:nameOrId
```

Returns `{ id, name, abilities[], types[], evolutions[] }`.

### Favorites

```
GET    /api/favorites
POST   /api/favorites         { pokemonId, pokemonName }
DELETE /api/favorites/:pokemonId
```

---

## Performance & Resilience

- In‑memory LRU cache (per instance)
  - TTLs: list 5m, details 10m; keyed per page (`limit:offset`).
  - In‑flight de‑duplication: coalesces concurrent requests for same key.
  - Keep‑alive HTTP/HTTPS agents for connection reuse.
  - Retries with exponential backoff (network errors and 5xx).
  - Upstream concurrency cap (semaphore) to avoid thundering herd.
  - Warm‑up: first three list pages (0, 50, 100) prefetched on boot.
- HTTP response caching
  - `Cache-Control: public, max-age=300, stale-while-revalidate=86400` on list/details.
  - Strong ETag enabled; `Vary: Accept-Encoding` set.
- Express middleware
  - Compression enabled; JSON body limit (`100kb`).
  - Env‑aware logging (reduced in production).
  - Rate limiting on `/api/pokemon` (e.g., ~120 req/min/IP).
  - Server header hardening: `X-Powered-By` and `Server` removed.
- MongoDB access
  - Lean list reads; `.exists()` for presence checks.
  - Unique index on `pokemonId`; indexes synced at startup.
  - Connection pool tuned via `maxPoolSize`.

---

## Configuration

Environment variables (see `src/config/env.ts`):

- `PORT` (default `4000`)
- `MONGO_URI` (default `mongodb://localhost:27017/pokemon_app`)
- `POKEAPI_BASE_URL` (default `https://pokeapi.co/api/v2`)
- `NODE_ENV` (default `development`)

---

## Run Locally

Prerequisites
- Node 20.x
- MongoDB 7 (or use Docker compose)

Install & dev

```
yarn install
yarn dev
```

Build & start

```
yarn build
yarn start
```

Mongo via Docker

```
docker compose up -d
```

---

## Troubleshooting

- Install fails: Node engine mismatch
  - Use Node 20 (`nvm use 20`) or `yarn install --ignore-engines` (not recommended).
- `Reflect.getMetadata is not a function`
  - Ensure `reflect-metadata` is imported (done in `src/server.ts`).
- Initial list call occasionally slow
  - Warm‑up prefetch runs at boot, retries are enabled; subsequent calls should be cached.
- Seeing only 150 items
  - Intentional cap to match the project scope.

---

## Notes

- The project intentionally caps listing to the first 150 Pokémon to match the assignment scope and keep latency predictable. Favorites are not capped.
- Controllers and use cases remain framework-agnostic; infra details (Express/Mongoose/Axios) are replaceable.

# Pokémon Backend – Clean Architecture • Node.js • Express • MongoDB

This is the backend for the Pokémon favorites assignment, implemented with **Node.js**, **Express**, **MongoDB**, and **Clean Architecture with OOP**.

The backend acts as a **proxy** to the [PokéAPI](https://pokeapi.co/), and provides a **favorites management** API persisted in MongoDB. It is intentionally structured to showcase **clean, modular, testable architecture** with minimal coupling to Express or MongoDB.

---

## Features

- Proxy PokéAPI:
  - `GET /api/pokemon?limit=150` — first 150 Pokémon (configurable limit).
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

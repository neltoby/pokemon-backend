// src/infrastructure/http/PokeApiGateway.ts
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import http from 'http';
import https from 'https';
import {
  IPokemonGateway,
  PokemonDetails,
  PokemonSummary,
} from '../../domain/repositories/interface/pokemon-gateway.interface';
import { env } from '../../config/env';

// Lightweight in-memory LRU cache with TTL
class SimpleLRU<V> {
  private store: Map<string, { value: V; expiresAt: number }> = new Map();
  constructor(private readonly maxSize: number, private readonly defaultTtlMs: number) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // refresh LRU order
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V, ttlMs?: number): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
    // evict LRU
    if (this.store.size > this.maxSize) {
      const oldest = this.store.keys().next().value as string | undefined;
      if (oldest !== undefined) this.store.delete(oldest);
    }
  }
}

// Simple semaphore to cap concurrent upstream requests
class SimpleSemaphore {
  private current = 0;
  private queue: Array<() => void> = [];
  constructor(private readonly max: number) {}
  async acquire(): Promise<() => void> {
    if (this.current < this.max) {
      this.current++;
      return () => this.release();
    }
    await new Promise<void>(resolve => this.queue.push(resolve));
    this.current++;
    return () => this.release();
  }
  private release() {
    this.current--;
    const next = this.queue.shift();
    if (next) next();
  }
}

export class PokeApiGateway implements IPokemonGateway {
  private readonly baseUrl: string;
  private readonly client: AxiosInstance;
  private readonly cache: SimpleLRU<any>;
  private readonly inflight: Map<string, Promise<any>> = new Map();
  private readonly sem: SimpleSemaphore;

  private static readonly LIST_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly DETAILS_TTL_MS = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.baseUrl = env.POKEAPI_BASE_URL;

    // axios instance with keep-alive + timeout
    const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
    const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      httpAgent,
      httpsAgent,
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      shouldResetTimeout: true,
      retryCondition: (error) => {
        const status = error.response?.status;
        // retry on network errors and 5xx (exclude 4xx)
        return axiosRetry.isNetworkError(error) || (!!status && status >= 500);
      },
    });

    // LRU cache (size tuned for project scale)
    this.cache = new SimpleLRU<any>(200, 5 * 60 * 1000);
    // Limit upstream concurrency to avoid socket/CPU contention
    this.sem = new SimpleSemaphore(10);

    // Warm cache for the first 150 (3 pages of 50) asynchronously
    setTimeout(() => {
      [0, 50, 100].forEach((offset) => {
        this.listFirstGeneration(50, offset).catch(() => {});
      });
    }, 0);
  }

  private async getUpstream<T = any>(url: string, config?: any) {
    const release = await this.sem.acquire();
    try {
      return await this.client.get<T>(url, config);
    } finally {
      release();
    }
  }

  private async cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached as T;

    const pending = this.inflight.get(key);
    if (pending) return pending as Promise<T>;

    const p = (async () => {
      try {
        const value = await fetcher();
        this.cache.set(key, value, ttlMs);
        return value;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, p);
    return p;
  }

  async listFirstGeneration(limit: number, offset: number): Promise<PokemonSummary[]> {
    const MAX_TOTAL = 150;
    if (offset >= MAX_TOTAL) return [];
    const effectiveLimit = Math.min(limit, Math.max(0, MAX_TOTAL - offset));
    if (effectiveLimit <= 0) return [];
    const key = `list:${effectiveLimit}:${offset}`;
    return this.cached<PokemonSummary[]>(
      key,
      PokeApiGateway.LIST_TTL_MS,
      async () => {
        const resp = await this.getUpstream(`/pokemon`, {
          params: { limit: effectiveLimit, offset },
        });
        return resp.data.results.map((p: any) => {
          const m = /\/pokemon\/(\d+)\/?$/.exec(p.url as string);
          const id = m ? parseInt(m[1], 10) : NaN;
          return {
            id,
            name: p.name,
            url: p.url,
          } as PokemonSummary;
        });
      },
    );
  }

  async getDetails(nameOrId: string | number): Promise<PokemonDetails> {
    const key = `details:${nameOrId}`;
    return this.cached<PokemonDetails>(
      key,
      PokeApiGateway.DETAILS_TTL_MS,
      async () => {
        const pokemonResp = await this.getUpstream(`/pokemon/${nameOrId}`);

        const speciesResp = await this.getUpstream(pokemonResp.data.species.url);
        const evolutionChainUrl = speciesResp.data.evolution_chain?.url;

        let evolutions: string[] = [];
        if (evolutionChainUrl) {
          const evolutionResp = await this.getUpstream(evolutionChainUrl);
          evolutions = this.extractEvolutions(
            evolutionResp.data.chain,
          );
        }

        return {
          id: pokemonResp.data.id,
          name: pokemonResp.data.name,
          abilities: pokemonResp.data.abilities.map(
            (a: any) => a.ability.name,
          ),
          types: pokemonResp.data.types.map((t: any) => t.type.name),
          evolutions,
        };
      },
    );
  }

  private extractEvolutions(chainNode: any): string[] {
    const result: string[] = [];

    const traverse = (node: any) => {
      if (!node) return;
      result.push(node.species.name);
      if (node.evolves_to && node.evolves_to.length > 0) {
        node.evolves_to.forEach((n: any) => traverse(n));
      }
    };

    traverse(chainNode);

    // remove duplicates and return
    return [...new Set(result)];
  }
}

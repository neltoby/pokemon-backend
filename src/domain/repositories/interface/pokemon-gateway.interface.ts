export interface PokemonSummary {
  id: number;
  name: string;
  url: string;
}

export interface PokemonDetails {
  id: number;
  name: string;
  abilities: string[];
  types: string[];
  evolutions: string[];
}

export interface IPokemonGateway {
  listFirstGeneration(limit: number, offset: number): Promise<PokemonSummary[]>;
  getDetails(nameOrId: string | number): Promise<PokemonDetails>;
}

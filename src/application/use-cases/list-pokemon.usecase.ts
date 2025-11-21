import { IPokemonGateway } from '../../domain/repositories/interface/pokemon-gateway.interface';

export class ListPokemonUseCase {
  constructor(private readonly pokemonGateway: IPokemonGateway) {}

  async execute(limit: number = 150, offset: number = 0) {
    return this.pokemonGateway.listFirstGeneration(limit, offset);
  }
}

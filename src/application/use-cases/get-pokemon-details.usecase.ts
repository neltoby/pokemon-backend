import { IPokemonGateway } from '../../domain/repositories/interface/pokemon-gateway.interface';

export class GetPokemonDetailsUseCase {
  constructor(private readonly pokemonGateway: IPokemonGateway) {}

  async execute(nameOrId: string | number) {
    return this.pokemonGateway.getDetails(nameOrId);
  }
}

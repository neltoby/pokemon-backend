import { ListPokemonUseCase } from '../../application/use-cases/list-pokemon.usecase';
import { GetPokemonDetailsUseCase } from '../../application/use-cases/get-pokemon-details.usecase';

export class PokemonController {
  constructor(
    private readonly listPokemonUseCase: ListPokemonUseCase,
    private readonly getPokemonDetailsUseCase: GetPokemonDetailsUseCase,
  ) {}

  async listFirstGeneration(limit?: number, offset?: number) {
    const pokemons = await this.listPokemonUseCase.execute(
      limit,
      offset,
    );
    return pokemons;
  }

  async getDetails(nameOrId: string | number) {
    const details = await this.getPokemonDetailsUseCase.execute(nameOrId);
    return details;
  }
}

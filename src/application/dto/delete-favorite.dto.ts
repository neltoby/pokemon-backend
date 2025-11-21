import { IsInt, IsPositive } from 'class-validator';

export class DeleteFavoriteDTO {
  @IsInt()
  @IsPositive()
  pokemonId!: number;
}

import { IsString, MinLength } from 'class-validator';
import { DeleteFavoriteDTO } from './delete-favorite.dto';

export class AddFavoriteDTO extends DeleteFavoriteDTO {
  @IsString()
  @MinLength(1)
  pokemonName!: string;
}

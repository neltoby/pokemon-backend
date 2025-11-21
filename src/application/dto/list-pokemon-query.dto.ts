import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class ListPokemonQueryDTO {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}


import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class IntersectionInputDto {
  @IsString()
  id!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  ns_arrival_rate!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  ew_arrival_rate!: number;
}

export class ScenarioInputDto {
  @IsInt()
  seed!: number;

  @IsInt()
  @Min(1)
  duration_sec!: number;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => IntersectionInputDto)
  intersections!: IntersectionInputDto[];
}

export class OptimizeOptionsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  candidates?: number;

  @IsOptional()
  @IsNumber()
  lambda?: number;
}

export class OptimizeRequestDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => ScenarioInputDto)
  scenario!: ScenarioInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptimizeOptionsDto)
  options?: OptimizeOptionsDto;
}

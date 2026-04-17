import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'SuperSecret123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

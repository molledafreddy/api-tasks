import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ example: '1h' })
  expiresIn!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId!: string;
}

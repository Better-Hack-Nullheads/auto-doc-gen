import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('users')
export class UserController {
  @Get()
  findAll(): string[] {
    return ['user1', 'user2'];
  }

  @Post()
  create(@Body() createUserDto: any): string {
    return 'User created';
  }

  @Get(':id')
  findOne(@Param('id') id: string): string {
    return `User ${id}`;
  }
}

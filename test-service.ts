import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(private readonly configService: any) {}

  findAll(): Promise<string[]> {
    return Promise.resolve(['user1', 'user2']);
  }

  create(userData: any): Promise<string> {
    return Promise.resolve('User created');
  }

  findById(id: string): Promise<string | null> {
    return Promise.resolve(`User ${id}`);
  }

  private helperMethod(): void {
    // This should not appear in output by default
  }
}

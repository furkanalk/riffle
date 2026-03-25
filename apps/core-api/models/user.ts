export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  avatar: string;
  created_at: Date;
}

export class User {
  id: number;
  username: string;
  email: string;

  constructor(data: UserRow) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
  }
}

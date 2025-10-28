export interface Store {
  id: string;
  name: string;
  location: string;
  ownerId: string;
  owner?: any; // We'll fix this type later
  createdAt: Date;
}
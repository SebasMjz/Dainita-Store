import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// Tipos base
export interface Category {
  _id?: ObjectId;
  name: string;
  color?: string; // color principal para las cards (hex)
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Tag {
  _id?: ObjectId;
  name: string; // ej: NEW, SALE
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  _id?: ObjectId;
  name: string;
  categoryId: ObjectId; // ref Category
  categoryName: string; // redundante para lecturas rápidas en front
  price: number;
  description: string;
  available: boolean;
  image?: string; // URL o dataURL
  badge?: string | null; // nombre de Tag, ej: NEW, SALE
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const uri = import.meta.env.MONGODB_URI;

if (!uri) {
  console.warn('[mongo] MONGODB_URI no está definido. Las APIs no podrán conectarse a Mongo Atlas.');
}

const dbName = import.meta.env.MONGODB_DB_NAME || 'tiendamix';
const productsCollectionName = import.meta.env.MONGODB_PRODUCTS_COLLECTION || 'products';
const categoriesCollectionName = import.meta.env.MONGODB_CATEGORIES_COLLECTION || 'categories';
const tagsCollectionName = import.meta.env.MONGODB_TAGS_COLLECTION || 'tags';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function getClient(): Promise<MongoClient> {
  if (!uri) throw new Error('MONGODB_URI no configurado');
  if (client) return client;
  if (!clientPromise) {
    clientPromise = MongoClient.connect(uri).then((c) => {
      client = c;
      return c;
    });
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const c = await getClient();
  return c.db(dbName);
}

export async function getProductsCollection(): Promise<Collection<Product>> {
  const db = await getDb();
  return db.collection<Product>(productsCollectionName);
}

export async function getCategoriesCollection(): Promise<Collection<Category>> {
  const db = await getDb();
  return db.collection<Category>(categoriesCollectionName);
}

export async function getTagsCollection(): Promise<Collection<Tag>> {
  const db = await getDb();
  return db.collection<Tag>(tagsCollectionName);
}

export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDb();
  return db.collection<User>('users');
}

export { ObjectId };

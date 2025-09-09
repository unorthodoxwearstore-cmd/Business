import { openDB, type IDBPDatabase } from 'idb';

export type DBSchema = {
  raw_materials: { key: string; value: any };
  products: { key: string; value: any };
  boms: { key: string; value: any };
  recipes: { key: string; value: any };
  production_plans: { key: string; value: any };
  sale_invoices: { key: string; value: any };
  to_be_paid: { key: string; value: any };
  expenses: { key: string; value: any };
  staff_requests: { key: string; value: any };
};

let dbPromise: Promise<IDBPDatabase<DBSchema>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DBSchema>('insygth_db', 3, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('raw_materials')) db.createObjectStore('raw_materials', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('boms')) db.createObjectStore('boms', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('recipes')) db.createObjectStore('recipes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('production_plans')) db.createObjectStore('production_plans', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sale_invoices')) db.createObjectStore('sale_invoices', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('to_be_paid')) db.createObjectStore('to_be_paid', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('expenses')) db.createObjectStore('expenses', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('staff_requests')) db.createObjectStore('staff_requests', { keyPath: 'id' });
      }
    });
  }
  return dbPromise;
}

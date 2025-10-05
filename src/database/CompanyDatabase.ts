import { Company } from '../types/Company.js';
import { Observer, Unsubscribe } from '../types/Observer.js';

export interface PaginatedResult {
  companies: Company[];
  totalPages: number;
  currentPage: number;
}

export class CompanyDatabase {
  private db: IDBDatabase | null = null;
  private observers: Set<Observer<Company>> = new Set();
  private readonly dbName = 'CompanyDB';
  private readonly storeName = 'companies';
  private readonly version = 2;
  private cache: Company[] | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Ошибка открытия базы данных:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('База данных успешно открыта');
        this.loadAllCompanies();
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction;

        if (transaction && db.objectStoreNames.contains(this.storeName)) {
          db.deleteObjectStore(this.storeName);
        }

        const objectStore = db.createObjectStore(this.storeName, {
          keyPath: 'id',
          autoIncrement: true,
        });

        objectStore.createIndex('companyName', 'companyName', {
          unique: false,
        });
        objectStore.createIndex('directorFullName', 'directorFullName', {
          unique: false,
        });

        console.log('Object store создан с новой схемой');
      };
    });
  }

  subscribe(observer: Observer<Company>): Unsubscribe {
    this.observers.add(observer);
    this.loadAllCompanies();

    return () => {
      this.observers.delete(observer);
    };
  }

  private notifyObservers(companies: Company[]): void {
    this.observers.forEach(observer => {
      try {
        observer(companies);
      } catch (error) {
        console.error('Ошибка в observer:', error);
      }
    });
  }

  async addCompany(company: Omit<Company, 'id'>): Promise<void> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.add(company);

      request.onsuccess = () => {
        console.log('Компания добавлена с ID:', request.result);
        this.invalidateCache();
        this.loadAllCompanies();
        resolve();
      };

      request.onerror = () => {
        console.error('Ошибка добавления компании:', request.error);
        reject(request.error);
      };
    });
  }

  async updateCompany(company: Company): Promise<void> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.put(company);

      request.onsuccess = () => {
        console.log('Компания обновлена');
        this.invalidateCache();
        this.loadAllCompanies();
        resolve();
      };

      request.onerror = () => {
        console.error('Ошибка обновления компании:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteCompany(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.delete(id);

      request.onsuccess = () => {
        console.log('Компания удалена');
        this.invalidateCache();
        this.loadAllCompanies();
        resolve();
      };

      request.onerror = () => {
        console.error('Ошибка удаления компании:', request.error);
        reject(request.error);
      };
    });
  }

  private async loadAllCompanies(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.getAll();

      request.onsuccess = () => {
        const companies: Company[] = request.result;
        this.cache = companies;
        this.notifyObservers(companies);
        resolve();
      };

      request.onerror = () => {
        console.error('Ошибка загрузки компаний:', request.error);
        reject(request.error);
      };
    });
  }

  private async loadAllCompaniesToCache(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.getAll();

      request.onsuccess = () => {
        this.cache = request.result;
        resolve();
      };

      request.onerror = () => {
        console.error('Ошибка загрузки компаний в кэш:', request.error);
        reject(request.error);
      };
    });
  }

  public async getCompaniesPage(
    page: number,
    pageSize: number,
    filterQuery?: string,
    sortField?: string,
    sortDirection?: 'asc' | 'desc'
  ): Promise<PaginatedResult> {
    if (!this.cache) {
      await this.loadAllCompaniesToCache();
    }

    if (!this.cache) {
      return { companies: [], totalPages: 0, currentPage: page };
    }

    let filteredCompanies = [...this.cache];

    if (filterQuery?.trim()) {
      const query = filterQuery.trim().toLowerCase();
      filteredCompanies = filteredCompanies.filter(company =>
        (company.directorFullName || '').toLowerCase().includes(query)
      );
    }

    if (sortField) {
      filteredCompanies.sort((a, b) => {
        const aValue = String(
          a[sortField as keyof Company] || ''
        ).toLowerCase();
        const bValue = String(
          b[sortField as keyof Company] || ''
        ).toLowerCase();

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    const totalPages = Math.ceil(filteredCompanies.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const companies = filteredCompanies.slice(startIndex, endIndex);

    return {
      companies,
      totalPages,
      currentPage: page,
    };
  }

  public invalidateCache(): void {
    this.cache = null;
  }

  async getCompanyById(id: number): Promise<Company | null> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Ошибка получения компании:', request.error);
        reject(request.error);
      };
    });
  }
}

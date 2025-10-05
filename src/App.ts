import {
  CompanyDatabase,
  PaginatedResult,
} from './database/CompanyDatabase.js';
import { FormHandler } from './ui/FormHandler.js';
import { TableManager } from './ui/TableManager.js';

export default class App {
  private database: CompanyDatabase;
  private tableManager: TableManager;
  private filterInput: HTMLInputElement;
  private sortField: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';
  private currentPage: number = 1;
  private pageSize: number = 5;
  private totalPages: number = 0;
  private isDirectUrlNavigation: boolean = false;

  constructor() {
    this.database = new CompanyDatabase();
    this.tableManager = new TableManager(this.database, this);
    new FormHandler(this.database);
    this.filterInput = document.getElementById(
      'filterInput'
    ) as HTMLInputElement;
    this.parseUrlParams();
    this.setupDatabaseSubscription();
  }

  private setupDatabaseSubscription(): void {
    this.database.subscribe(() => {
      this.loadPage();
    });
  }

  private parseUrlParams(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');

    if (pageParam) {
      const page = parseInt(pageParam);
      if (page > 0) {
        this.isDirectUrlNavigation = true;
        this.currentPage = page;
        this.resetFiltersAndSorting();
      }
    }
  }

  private resetFiltersAndSorting(): void {
    this.sortField = null;
    this.sortDirection = 'asc';
    if (this.filterInput) {
      this.filterInput.value = '';
    }
  }

  private updateUrl(page: number): void {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.history.pushState({}, '', url.toString());
  }

  private async loadPage(): Promise<void> {
    try {
      const filterQuery = this.isDirectUrlNavigation
        ? undefined
        : this.filterInput?.value;
      const sortField = this.isDirectUrlNavigation ? undefined : this.sortField;
      const sortDirection = this.isDirectUrlNavigation
        ? undefined
        : this.sortDirection;

      const result: PaginatedResult = await this.database.getCompaniesPage(
        this.currentPage,
        this.pageSize,
        filterQuery,
        sortField || undefined,
        sortDirection
      );

      this.totalPages = result.totalPages;
      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
        this.updateUrl(this.totalPages);
        await this.loadPage();
        return;
      }

      this.tableManager.renderTable(result.companies);
      this.tableManager.renderPagination(this.currentPage, this.totalPages);

      this.isDirectUrlNavigation = false;
    } catch (error) {
      console.error('Ошибка загрузки страницы:', error);
    }
  }

  public async handlePageChange(page: number): Promise<void> {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.updateUrl(page);
    await this.loadPage();
  }

  public async initialize(): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      this.setupFilterInput();

      console.log('Приложение успешно инициализировано');
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      alert('Ошибка инициализации приложения');
    }
  }

  private setupFilterInput(): void {
    if (this.filterInput) {
      this.filterInput.addEventListener('input', () => {
        this.currentPage = 1;
        this.updateUrl(1);
        this.loadPage();
      });
    }
  }

  public handleSort(field: string): void {
    if (this.sortField === field) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else {
        this.sortField = null;
        this.sortDirection = 'asc';
      }
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.loadPage();
  }

  public getSortState(): { field: string | null; direction: 'asc' | 'desc' } {
    return {
      field: this.sortField,
      direction: this.sortDirection,
    };
  }
}

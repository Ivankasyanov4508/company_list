import { CompanyDatabase } from '../database/CompanyDatabase.js';
import { Company, Address } from '../types/Company.js';
import App from '../App.js';

export class TableManager {
  private readonly SORTABLE_FIELDS = [
    'companyName',
    'directorFullName',
  ] as const;
  private tableBody: HTMLTableSectionElement;
  private database: CompanyDatabase;
  private app: App;
  private paginationContainer: HTMLElement;

  constructor(database: CompanyDatabase, app: App) {
    this.database = database;
    this.app = app;
    this.tableBody = document.getElementById(
      'tableBody'
    ) as HTMLTableSectionElement;
    this.paginationContainer = document.getElementById(
      'paginationContainer'
    ) as HTMLElement;
    this.setupHeaderClickHandlers();
  }

  private formatAddress(address: Address): string {
    const { city, street, house } = address;

    if (!city && !street && !house) {
      return '';
    }

    const parts: string[] = [];
    const addPart = (value: string, prefix = ''): void => {
      if (value) {
        parts.push(prefix ? `${prefix} ${value}` : value);
      }
    };

    addPart(city, 'г.');
    addPart(street);
    addPart(house);

    return parts.join(', ');
  }

  public renderTable(companies: Company[]): void {
    this.tableBody.innerHTML = '';

    companies.forEach(company => {
      const row = document.createElement('tr');
      row.setAttribute('data-id', String(company.id));
      row.classList.add('table__row--clickable');

      const headers = document.querySelectorAll('th[data-field]');

      headers.forEach(header => {
        const field = header.getAttribute('data-field') as keyof Company;
        const cell = document.createElement('td');

        if (field === 'address') {
          cell.textContent = this.formatAddress(company[field] as Address);
        } else {
          cell.textContent = String(company[field] || '');
        }

        row.appendChild(cell);
      });

      const actionsCell = document.createElement('td');
      actionsCell.innerHTML = `
        <button class="delete-btn" data-id="${company.id}">&#88;</button>
      `;
      row.appendChild(actionsCell);

      this.tableBody.appendChild(row);
    });

    this.attachEventListeners();
    this.updateSortIndicators();
  }

  public renderPagination(currentPage: number, totalPages: number): void {
    if (!this.paginationContainer) return;

    if (totalPages <= 1) {
      this.paginationContainer.innerHTML = '';
      return;
    }

    const pageNumbers = this.generatePageNumbers(currentPage, totalPages);

    let paginationHTML = '<div class="pagination">';

    // Кнопка "Предыдущая"
    if (currentPage > 1) {
      paginationHTML += `<button class="pagination__btn" data-page="${
        currentPage - 1
      }">Предыдущая</button>`;
    } else {
      paginationHTML += `<button class="pagination__btn pagination__btn--disabled" disabled>Предыдущая</button>`;
    }

    // Номера страниц
    let lastPageNumber = 0;
    pageNumbers.forEach(pageNumber => {
      if (pageNumber - lastPageNumber > 1) {
        paginationHTML += '<span class="pagination__dots">...</span>';
      }

      if (pageNumber === currentPage) {
        paginationHTML += `<button class="pagination__btn pagination__btn--active" data-page="${pageNumber}">${pageNumber}</button>`;
      } else {
        paginationHTML += `<button class="pagination__btn" data-page="${pageNumber}">${pageNumber}</button>`;
      }

      lastPageNumber = pageNumber;
    });

    // Кнопка "Следующая"
    if (currentPage < totalPages) {
      paginationHTML += `<button class="pagination__btn" data-page="${
        currentPage + 1
      }">Следующая</button>`;
    } else {
      paginationHTML += `<button class="pagination__btn pagination__btn--disabled" disabled>Следующая</button>`;
    }

    paginationHTML += '</div>';

    this.paginationContainer.innerHTML = paginationHTML;
    this.setupPaginationHandlers();
  }

  private generatePageNumbers(
    currentPage: number,
    totalPages: number
  ): number[] {
    const pages: number[] = [];

    // Всегда показываем первую страницу
    if (totalPages > 0) {
      pages.push(1);
    }

    // Показываем страницы вокруг текущей
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Всегда показываем последнюю страницу (если она не первая)
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  }

  private setupPaginationHandlers(): void {
    const paginationButtons = this.paginationContainer.querySelectorAll(
      '.pagination__btn:not(.pagination__btn--disabled)'
    );

    paginationButtons.forEach(button => {
      button.addEventListener('click', e => {
        const target = e.target as HTMLButtonElement;
        const page = parseInt(target.getAttribute('data-page') || '1');
        this.app.handlePageChange(page);
      });
    });
  }

  private setupHeaderClickHandlers(): void {
    this.SORTABLE_FIELDS.forEach(field => {
      const header = document.querySelector(`th[data-field="${field}"]`);
      if (header) {
        header.addEventListener('click', () => {
          this.app.handleSort(field);
        });
      }
    });
  }

  private updateSortIndicators(): void {
    const headers = document.querySelectorAll('th[data-field]');
    const sortState = this.app.getSortState();

    headers.forEach(header => {
      const field = header.getAttribute('data-field');
      const existingIcon = header.querySelector('.table__header-icon');

      if (existingIcon) {
        existingIcon.remove();
      }

      if (
        field &&
        this.SORTABLE_FIELDS.includes(
          field as (typeof this.SORTABLE_FIELDS)[number]
        )
      ) {
        const icon = document.createElement('i');
        icon.className = 'table__header-icon';

        if (field === sortState.field) {
          icon.classList.add(`table__header-icon--${sortState.direction}`);
        } else {
          icon.classList.add('table__header-icon--unsorted');
        }

        header.appendChild(icon);
      }
    });
  }

  private attachEventListeners(): void {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    const clickableRows = document.querySelectorAll('.table__row--clickable');

    deleteButtons.forEach(button => {
      button.addEventListener('click', e => {
        const target = e.target as HTMLButtonElement;
        const id = parseInt(target.getAttribute('data-id') || '0');
        this.deleteCompany(id);
      });
    });

    clickableRows.forEach(row => {
      row.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        if (target.closest('.table__cell--actions')) {
          return;
        }

        const id = parseInt(row.getAttribute('data-id') || '0');
        this.editCompany(id);
      });
    });
  }

  private async deleteCompany(id: number): Promise<void> {
    try {
      await this.database.deleteCompany(id);
    } catch (error) {
      console.error('Ошибка удаления компании:', error);
      alert('Ошибка удаления компании');
    }
  }

  private async editCompany(id: number): Promise<void> {
    console.log('editCompany', id);
    try {
      const company = await this.database.getCompanyById(id);
      if (company) {
        const editEvent = new CustomEvent('companyEdit', { detail: company });
        document.dispatchEvent(editEvent);
      }
    } catch (error) {
      console.error('Ошибка получения компании для редактирования:', error);
      alert('Ошибка загрузки данных компании');
    }
  }
}

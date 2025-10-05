import { Company, CompanyFormData, Address } from '../types/Company.js';
import { CompanyDatabase } from '../database/CompanyDatabase.js';

export class FormHandler {
  private database: CompanyDatabase;
  private currentEditId: number | null = null;

  private companyNameInput: HTMLInputElement;
  private directorNameInput: HTMLInputElement;
  private phoneInput: HTMLInputElement;
  private cityInput: HTMLInputElement;
  private streetInput: HTMLInputElement;
  private houseInput: HTMLInputElement;
  private addBtn: HTMLButtonElement;
  private modal: HTMLElement;
  private modalTitle: HTMLElement;
  private openModalBtn: HTMLButtonElement;
  private closeModalBtn: HTMLButtonElement;

  constructor(database: CompanyDatabase) {
    this.database = database;

    this.companyNameInput = document.getElementById(
      'modalCompanyName'
    ) as HTMLInputElement;
    this.directorNameInput = document.getElementById(
      'modalDirectorFullName'
    ) as HTMLInputElement;
    this.phoneInput = document.getElementById(
      'modalPhoneNumber'
    ) as HTMLInputElement;
    this.cityInput = document.getElementById('modalCity') as HTMLInputElement;
    this.streetInput = document.getElementById(
      'modalStreet'
    ) as HTMLInputElement;
    this.houseInput = document.getElementById('modalHouse') as HTMLInputElement;
    this.addBtn = document.getElementById('modalAddBtn') as HTMLButtonElement;
    this.modal = document.getElementById('companyModal') as HTMLElement;
    this.modalTitle = document.getElementById('modalTitle') as HTMLElement;
    this.openModalBtn = document.getElementById(
      'openModalBtn'
    ) as HTMLButtonElement;
    this.closeModalBtn = document.getElementById(
      'closeModalBtn'
    ) as HTMLButtonElement;

    this.initializeEventListeners();
    this.setupValidation();
  }

  private initializeEventListeners(): void {
    this.addBtn.addEventListener('click', () => this.handleSubmit());
    this.openModalBtn.addEventListener('click', () => this.openModal());
    this.closeModalBtn.addEventListener('click', () => this.closeModal());

    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    document.addEventListener('companyEdit', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.loadCompanyForEdit(customEvent.detail as Company);
    });
  }

  private setupValidation(): void {
    const inputs = [
      this.companyNameInput,
      this.directorNameInput,
      this.phoneInput,
      this.cityInput,
      this.streetInput,
      this.houseInput,
    ];

    const validateForm = () => {
      const allFieldsFilled = inputs.every(input => input.value.trim() !== '');
      this.addBtn.disabled = !allFieldsFilled;

      if (allFieldsFilled) {
        this.addBtn.classList.add('btn--primary');
      } else {
        this.addBtn.classList.remove('btn--primary');
      }
    };

    inputs.forEach(input => {
      input.addEventListener('input', validateForm);
    });

    validateForm();
  }

  private async handleSubmit(): Promise<void> {
    const address: Address = {
      city: this.cityInput.value.trim(),
      street: this.streetInput.value.trim(),
      house: this.houseInput.value.trim(),
    };

    const companyData: CompanyFormData = {
      companyName: this.companyNameInput.value.trim(),
      directorFullName: this.directorNameInput.value.trim(),
      phoneNumber: this.phoneInput.value.trim(),
      address: address,
    };

    if (!this.validateData(companyData)) {
      return;
    }

    try {
      if (this.currentEditId) {
        const company: Company = {
          ...companyData,
          id: this.currentEditId,
        };
        await this.database.updateCompany(company);
        this.addBtn.textContent = 'Добавить';
        this.currentEditId = null;
      } else {
        await this.database.addCompany(companyData);
      }

      this.closeModal();
    } catch (error) {
      console.error('Ошибка сохранения компании:', error);
      alert('Ошибка сохранения компании');
    }
  }

  private validateData(data: CompanyFormData): boolean {
    return Boolean(
      data.companyName &&
        data.directorFullName &&
        data.phoneNumber &&
        data.address
    );
  }

  private loadCompanyForEdit(company: Company): void {
    this.companyNameInput.value = company.companyName;
    this.directorNameInput.value = company.directorFullName;
    this.phoneInput.value = company.phoneNumber;

    this.cityInput.value = company.address.city;
    this.streetInput.value = company.address.street;
    this.houseInput.value = company.address.house;

    this.currentEditId = company.id!;
    this.addBtn.textContent = 'Сохранить изменения';
    this.modalTitle.textContent = 'Редактировать компанию';
    this.addBtn.disabled = false;
    this.addBtn.classList.add('btn--primary');

    this.openModal();
    this.companyNameInput.focus();
  }

  private clearForm(): void {
    this.companyNameInput.value = '';
    this.directorNameInput.value = '';
    this.phoneInput.value = '';
    this.cityInput.value = '';
    this.streetInput.value = '';
    this.houseInput.value = '';
    this.currentEditId = null;
    this.addBtn.textContent = 'Добавить';
    this.modalTitle.textContent = 'Добавить компанию';
    this.addBtn.disabled = true;
    this.addBtn.classList.remove('btn--primary');
  }

  private openModal(): void {
    this.modal.classList.add('modal--show');
    document.body.style.overflow = 'hidden';
  }

  private closeModal(): void {
    this.modal.classList.remove('modal--show');
    document.body.style.overflow = '';
    this.clearForm();
  }
}

export interface Address {
  city: string;
  street: string;
  house: string;
}

export interface Company {
  id?: number;
  companyName: string;
  directorFullName: string;
  phoneNumber: string;
  address: Address;
}

export interface CompanyFormData {
  companyName: string;
  directorFullName: string;
  phoneNumber: string;
  address: Address;
}

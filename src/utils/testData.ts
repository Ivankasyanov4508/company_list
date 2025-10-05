import { CompanyDatabase } from '../database/CompanyDatabase.js';

export const addTestData = async (database: CompanyDatabase): Promise<void> => {
  const testCompanies = [
    {
      companyName: 'ООО "Вектор"',
      directorFullName: 'Иванов И.И.',
      phoneNumber: '+7 000 123 45 67',
      address: 'г. Москва, ул. Ленина, д. 1',
    },
    {
      companyName: 'ИП Сидоров С.С.',
      directorFullName: 'Сидоров С.С.',
      phoneNumber: '+7 000 56 78 99',
      address: 'г. Санкт-Петербург, пр. Невский, д. 2',
    },
    {
      companyName: 'АО "Технологии Будущего"',
      directorFullName: 'Петров П.П.',
      phoneNumber: '+7 111 222 33 44',
      address: 'г. Екатеринбург, пр. Ленина, д. 15',
    },
  ];

  try {
    for (const company of testCompanies) {
      await database.addCompany(company);
    }
    console.log('Тестовые данные успешно добавлены');
  } catch (error) {
    console.error('Ошибка добавления тестовых данных:', error);
    alert('Ошибка добавления тестовых данных');
  }
};

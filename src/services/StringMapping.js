// export const categoryMapping = {
//   'Daily expenses and consumption': '5',
//   'Financial management and transfers': '6',
//   'Housing and facilities': '7',
//   'Income and investments': '8',
//   'Insurance and Health': '9',
//   'Other miscellaneous': '0'
// };

export const subCategoryMapping = {
  'Groceries': 'A',
  'Entertainment': 'B',
  'Amazon': 'C',
  'Dine Out': 'D',
  'Travel': 'E',
  'Fitness': 'F',
  'Food Shopping': 'G',
  'Clothes': 'H',
  'Savings': 'I',
  'Bills': 'J',
  'Cash': 'K',
  'Account transfer': 'L',
  'Home Improvement': 'M',
  'Hotels': 'N',
  'Services/Home Improvement': 'O',
  'Mortgage': 'P',
  'Rent': 'Q',
  'Investment': 'R',
  'Supplementary Income': 'S',
  'Travel Reimbursement': 'T',
  'Safety Deposit Return': 'U',
  'Interest': 'V',
  'Paycheck': 'W',
  'Purchase of uk.eg.org': 'X',
  'Insurance': 'Y',
  'Health': 'Z',
  'Others': '1',
  'Null': '2',
  'Services': '3',
  'Other Shopping': '4'
};

//将字符映射回subCategory
export const charToSubCategory = Object.fromEntries(Object.entries(subCategoryMapping).map(([key, value]) => [value, key]));

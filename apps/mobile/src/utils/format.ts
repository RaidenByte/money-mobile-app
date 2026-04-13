interface FormatCurrencyOptions {
  withUnit?: boolean;
}

export const formatCurrency = (amount: number, options: FormatCurrencyOptions = {}) => {
  const numberText = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return options.withUnit ? `${numberText} 元` : numberText;
};

export const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoDate));

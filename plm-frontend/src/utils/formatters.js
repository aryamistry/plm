import { format, parseISO } from 'date-fns';

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy');
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateStr;
  }
};

export const formatPrice = (price) => {
  if (price === null || price === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
};

export const formatVersion = (version) => {
  if (version === null || version === undefined) return '—';
  return `v${version}`;
};

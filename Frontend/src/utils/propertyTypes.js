// Mirrors the property_type CHECK constraint in Database/Schema.sql, so a type the database can
// store always has a label here.
export const PROPERTY_TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'studio',    label: 'Studio' },
  { value: 'villa',     label: 'Villa' },
  { value: 'duplex',    label: 'Duplex' },
  { value: 'office',    label: 'Office' },
  { value: 'shop',      label: 'Shop' },
  { value: 'warehouse', label: 'Warehouse' },
];

export const PROPERTY_TYPE_LABELS = PROPERTY_TYPE_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {}
);

// is_available is the only availability column the backend has, so there is no maintenance state.
export const STATUS_STYLES = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rented:    'bg-slate-100 text-slate-700 border-slate-200',
};

export function statusStylesFor(status) {
  return STATUS_STYLES[String(status || '').toLowerCase()] || STATUS_STYLES.rented;
}

export function formatPrice(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString('en-US') : '0';
}

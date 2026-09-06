import { types, type CustomTypesConfig } from 'pg';

// Postgres identifies each column type by a number.
const { INT8, DATE, TIMESTAMP, TIMESTAMPTZ } = types.builtins;

// A real number while it stays accurate, otherwise the string.
const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : value;
};

// Raw text. A Date shifts by timezone inside JSON.
const asText = (value: string) => value;

// Scoped to this pool so db/ scripts keep the defaults.
export const typeParsers: CustomTypesConfig = {
  getTypeParser(old, format) {
    if (old === INT8) return toNumber;
    if (old === DATE || old === TIMESTAMP || old === TIMESTAMPTZ) return asText;
    return types.getTypeParser(old, format);
  },
};

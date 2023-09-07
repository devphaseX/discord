import { type ClassValue, clsx } from 'clsx';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function removeTableInternalFields<
  Table extends PgTableWithColumns<any>
>(table: Table) {
  const {
    _,
    $inferInsert: __,
    $inferSelect: ___,
    getSQL: _getSql,
    ...rest
  } = table;

  return rest as Omit<Table, '_' | ' $inferInsert' | '$inferSelect' | 'getSQL'>;
}

import { useState, useMemo, useCallback } from 'react';

export type Direction = 'desc' | 'asc' | null;

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  getSortIcon?: (direction: 'asc' | 'desc' | null) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  options?: DataTableOptions;
  loading?: boolean;
  onSelectionChange?: (selectedItems: Set<string | number>) => void;
  paginationComponent?: React.ReactNode;
  className?: string;
  totalPages?: number,
  indexLabel?: string,
}

export interface DataTableOptions {
  defaultSortKey?: string;
  defaultSortDirection?: 'asc' | 'desc';
  enableSelection?: boolean;
  zebra?: boolean;
}

export interface UseDataTableReturn<T> {
  currentItems: T[];
  sortKey: keyof T | null;
  sortDirection: 'asc' | 'desc';
  handleSort: (key: keyof T) => void;

  selectedItems: Set<string | number>;
  isSelected: (id: string | number) => boolean;
  toggleSelection: (id: string | number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;

  getItemId: (item: T) => string | number;
}

export function useDataTable<T extends Record<string, any>>(
  data: T[],
  options: DataTableOptions = {}
): UseDataTableReturn<T> {
  const {
    defaultSortKey = null,
    defaultSortDirection = 'asc',
  } = options;

  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSortKey as keyof T);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());

  const getItemId = useCallback((item: T): string | number => {
    return item.id || JSON.stringify(item);
  }, []);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const currentItems = sortedData;

  const handleSort = useCallback((key: keyof T) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey]);

  const isSelected = useCallback((id: string | number) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  const toggleSelection = useCallback((id: string | number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(currentItems.map(getItemId));
    setSelectedItems(allIds);
  }, [currentItems, getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const currentItemIds = new Set(currentItems.map(getItemId));
  const selectedCurrentItems = Array.from(selectedItems).filter((id) => currentItemIds.has(id));
  const isAllSelected =
    currentItems.length > 0 && selectedCurrentItems.length === currentItems.length;
  const isIndeterminate =
    selectedCurrentItems.length > 0 &&
    selectedCurrentItems.length < currentItems.length;

  return {
    currentItems,
    sortKey,
    sortDirection,
    handleSort,
    selectedItems,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
    getItemId,
  };
}

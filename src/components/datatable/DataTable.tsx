"use client";

import * as React from "react";
import { type Column, useDataTable, type DataTableProps } from "@/hooks/useDataTable";
import styles from "./DataTable.module.css";

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  options = {},
  loading = false,
  onSelectionChange,
  className = "",
  paginationComponent,
  indexLabel = "Sr#",
}: DataTableProps<T>) {
  const {
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
  } = useDataTable(data, options);

  // --- Stable selection change effect (prevents render loops)
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // Build a stable key from Set content so we only notify on real content changes
  const selectionKey = React.useMemo(() => {
    const arr = Array.from(selectedItems) as Array<string | number>;
    arr.sort((a, b) => (a as any) > (b as any) ? 1 : (a === b ? 0 : -1));
    return JSON.stringify(arr);
  }, [selectedItems]);

  React.useEffect(() => {
    if (!onSelectionChangeRef.current) return;
    const snapshotArr = JSON.parse(selectionKey) as Array<string | number>;
    onSelectionChangeRef.current(new Set(snapshotArr));
  }, [selectionKey]);

  const getSortIcon = (column: Column<T>) => {
    const isSorted = sortKey === column.key;
    const direction = isSorted ? sortDirection : null;
    if (column.getSortIcon) return column.getSortIcon(direction);
    if (!isSorted) return "↕️";
    return direction === "asc" ? "↑" : "↓";
  };

  if (loading && data.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {options.enableSelection && (
                <th className={styles.checkboxColumn}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={() => (isAllSelected ? clearSelection() : selectAll())}
                    disabled={loading}
                    className={styles.checkbox}
                  />
                </th>
              )}
              <th className={`${styles.th} index-label`} scope="col">
                {indexLabel}
              </th>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`${styles.th} ${String(column.label ?? "")
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                  scope="col"
                >
                  {column.sortable !== false ? (
                    <button
                      className={styles.sortButton}
                      onClick={() => handleSort(column.key)}
                      disabled={loading}
                    >
                      <span>{column.label}</span>
                      <span className={styles.sortIcon}>{getSortIcon(column)}</span>
                    </button>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (options.enableSelection ? 2 : 1)}
                  className={styles.emptyCell}
                >
                  No data available
                </td>
              </tr>
            ) : (
              currentItems.map((item, idx) => {
                const id = getItemId(item);
                const zebraClass =
                  options.zebra ? (idx % 2 === 0 ? styles.rowEven : styles.rowOdd) : "";

                return (
                  <tr
                    key={String(id)}
                    className={[styles.row, zebraClass, isSelected(id) ? styles.selectedRow : ""].join(" ")}
                  >
                    {options.enableSelection && (
                      <td className={styles.checkboxColumn}>
                        <input
                          type="checkbox"
                          checked={isSelected(id)}
                          onChange={() => toggleSelection(id)}
                          disabled={loading}
                          className={styles.checkbox}
                        />
                      </td>
                    )}
                    <td className={styles.td}>{idx + 1}</td>
                    {columns.map((column) => (
                      <td key={String(column.key)} className={styles.td}>
                        {column.render
                          ? column.render(item[column.key], item)
                          : String(item[column.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginationComponent && <div className={styles.paginationWrapper}>{paginationComponent}</div>}

      {/* Selection summary */}
      {options.enableSelection && selectedItems.size > 0 && (
        <div className={styles.selectionSummary}>
          <span>{selectedItems.size} item(s) selected</span>
          <button onClick={clearSelection} className={styles.clearButton} disabled={loading}>
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}

export default DataTable;

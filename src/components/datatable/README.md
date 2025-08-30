# DataTable Component

A comprehensive, reusable data table component with sorting, pagination, and selection features.

## Features

- ✅ **Sorting** - Click column headers to sort data (ascending/descending)
- ✅ **Pagination** - Built-in pagination with customizable items per page
- ✅ **Optional Checkboxes** - Enable/disable row selection with bulk actions
- ✅ **Clean separation of logic** - All logic handled by `useDataTable` hook
- ✅ **Plain CSS Modules** - No external dependencies, fully customizable styles

## Basic Usage

```tsx
import React from 'react';
import { DataTable, Column } from './features/datatable';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const UserTable = () => {
  const users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  ];

  const columns: Column<User>[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: string) => (
        <span className={`role-${value.toLowerCase()}`}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      options={{
        itemsPerPage: 10,
        enableSelection: true,
        defaultSortKey: 'name',
        defaultSortDirection: 'asc',
      }}
      onSelectionChange={(selected) => {
        console.log('Selected items:', selected);
      }}
    />
  );
};
```

## Props

### DataTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | **required** | Array of data objects to display |
| `columns` | `Column<T>[]` | **required** | Column configuration array |
| `options` | `DataTableOptions` | `{}` | Table configuration options |
| `loading` | `boolean` | `false` | Shows loading state |
| `onSelectionChange` | `(selected: Set<string \| number>) => void` | - | Callback when selection changes |
| `className` | `string` | `''` | Additional CSS class |

### Column Configuration

```tsx
interface Column<T> {
  key: keyof T;              // Data property key
  label: string;             // Column header text
  sortable?: boolean;        // Enable sorting (default: true)
  render?: (value: any, item: T) => React.ReactNode; // Custom cell renderer
}
```

### Options Configuration

```tsx
interface DataTableOptions {
  itemsPerPage?: number;           // Items per page (default: 10)
  defaultSortKey?: string;         // Initial sort column
  defaultSortDirection?: 'asc' | 'desc'; // Initial sort direction
  enableSelection?: boolean;        // Enable row selection (default: false)
}
```

## Advanced Usage

### Custom Cell Rendering

```tsx
const columns: Column<Product>[] = [
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    render: (value: number) => (
      <span style={{ color: 'green', fontWeight: 'bold' }}>
        ${value.toFixed(2)}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (value: string, item: Product) => (
      <span className={`status-${value}`}>
        {value} {item.isUrgent && '🔥'}
      </span>
    ),
  },
];
```

### Selection Handling

```tsx
const [selectedItems, setSelectedItems] = useState(new Set());

const handleBulkDelete = () => {
  const ids = Array.from(selectedItems);
  // Perform bulk action
  console.log('Deleting items:', ids);
};

<DataTable
  data={data}
  columns={columns}
  options={{ enableSelection: true }}
  onSelectionChange={setSelectedItems}
/>

{selectedItems.size > 0 && (
  <button onClick={handleBulkDelete}>
    Delete {selectedItems.size} items
  </button>
)}
```

### Using the Hook Directly

If you need more control, you can use the `useDataTable` hook directly:

```tsx
import { useDataTable } from '../../hooks/useDataTable';

const CustomTable = ({ data }) => {
  const {
    currentItems,
    currentPage,
    totalPages,
    sortKey,
    sortDirection,
    handleSort,
    goToPage,
    selectedItems,
    toggleSelection,
  } = useDataTable(data, {
    itemsPerPage: 5,
    enableSelection: true,
  });

  // Build your own custom table UI
  return (
    <div>
      {/* Custom table implementation */}
    </div>
  );
};
```

## Styling

The component uses CSS Modules for styling. You can override styles by:

1. **Passing a custom className:**
```tsx
<DataTable className="my-custom-table" ... />
```

2. **Overriding CSS variables:**
```css
.my-custom-table {
  --table-border-color: #your-color;
  --header-bg-color: #your-color;
}
```

3. **Creating custom CSS modules:**
Copy and modify `DataTable.module.css` to create your own theme.

## Performance Tips

1. **Memoize columns** to prevent unnecessary re-renders:
```tsx
const columns = useMemo(() => [
  { key: 'name', label: 'Name' },
  // ... other columns
], []);
```

2. **Use stable keys** for data items (preferably unique IDs).

3. **For large datasets**, consider implementing server-side pagination instead of client-side.

## TypeScript

The component is fully typed. Define your data interface and the table will provide full type safety:

```tsx
interface MyData {
  id: number;
  name: string;
  createdAt: Date;
}

// TypeScript will enforce that column keys match MyData properties
const columns: Column<MyData>[] = [
  { key: 'id', label: 'ID' },      // ✅ Valid
  { key: 'name', label: 'Name' },  // ✅ Valid
  { key: 'invalid', label: 'Bad' }, // ❌ TypeScript error
];
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ (with polyfills for Set)
- Mobile responsive
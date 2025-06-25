import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface Column<T> {
  header: string;
  accessorKey?: string;
  accessor?: ((row: T) => React.ReactNode) | string;
  accessorFn?: (row: T) => any;
  cell?: (props: { row: { original: T } }) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: string;
  onRowClick?: (row: T, event?: React.MouseEvent) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyField,
  onRowClick,
  isLoading = false,
  emptyState,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return emptyState;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any) => (
            <TableRow
              key={row[keyField]}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
              onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
            >
              {columns.map((column, index) => (
                <TableCell key={index}>
                  {column.cell
                    ? column.cell({ row: { original: row } })
                    : column.accessorKey
                    ? row[column.accessorKey]
                    : column.accessor && typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : column.accessor && typeof column.accessor === 'string'
                    ? row[column.accessor]
                    : column.accessorFn
                    ? column.accessorFn(row)
                    : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
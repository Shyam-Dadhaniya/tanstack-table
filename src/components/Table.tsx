import {
  // createColumnHelper, // Basic Table
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnResizeMode,
  ColumnDef,
  // Expand Row
  getExpandedRowModel,
  ExpandedState,
  // DND
  Row,
  // Paginations
  Table as ReactTable,
  PaginationState,
  getPaginationRowModel,
  OnChangeFn,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  HTMLProps,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useDrag, useDrop } from "react-dnd";
import "./Table.css";
import { defaultData, Person } from "../data/table-data";

function IndeterminateCheckbox({
  indeterminate,
  className = "",
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + " cursor-pointer"}
      {...rest}
    />
  );
}

const DraggableRow: React.FC<{
  row: Row<Person>;
  reorderRow: (draggedRowIndex: number, targetRowIndex: number) => void;
}> = ({ row, reorderRow }) => {
  const [, dropRef] = useDrop({
    accept: "row",
    drop: (draggedRow: Row<Person>) => reorderRow(draggedRow.index, row.index),
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => row,
    type: "row",
  });

  return (
    <tr
      key={row.id}
      ref={previewRef} //previewRef could go here
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {row.getVisibleCells().map((cell) => {
        if (cell.column.id === "dragButton") {
          return (
            <td key={cell.id} ref={dropRef}>
              <button ref={dragRef}>🟰</button>
            </td>
          );
        }

        return (
          <td key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
    // <tr
    //   ref={previewRef} //previewRef could go here
    //   style={{ opacity: isDragging ? 0.5 : 1 }}
    // >
    //   <td ref={dropRef}>
    //     <button ref={dragRef}>🟰</button>
    //   </td>
    //   {row.getVisibleCells().map((cell) => (
    //     <td key={cell.id}>
    //       {flexRender(cell.column.columnDef.cell, cell.getContext())}
    //     </td>
    //   ))}
    // </tr>
  );
};

const TableData = () => {
  const defaultColumns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        header: "Name",
        footer: (props) => props.column.id,
        columns: [
          {
            // accessorFn: (row) => row.lastName,
            id: "dragButton",
            cell: (info) => info.getValue(),
            header: () => <span></span>,
            footer: (props) => props.column.id,
          },
          {
            accessorKey: "firstName",
            header: ({ table }) => (
              <>
                <IndeterminateCheckbox
                  {...{
                    checked: table.getIsAllRowsSelected(),
                    indeterminate: table.getIsSomeRowsSelected(),
                    onChange: table.getToggleAllRowsSelectedHandler(),
                  }}
                />{" "}
                <button
                  {...{
                    onClick: table.getToggleAllRowsExpandedHandler(),
                  }}
                >
                  {table.getIsAllRowsExpanded() ? "👇" : "👉"}
                </button>{" "}
                First Name
              </>
            ),
            cell: ({ row, getValue }) => (
              <div
                style={{
                  // Since rows are flattened by default,
                  // we can use the row.depth property
                  // and paddingLeft to visually indicate the depth
                  // of the row
                  paddingLeft: `${row.depth * 2}rem`,
                }}
              >
                <>
                  <IndeterminateCheckbox
                    {...{
                      checked: row.getIsSelected(),
                      indeterminate: row.getIsSomeSelected(),
                      onChange: row.getToggleSelectedHandler(),
                    }}
                  />{" "}
                  {row.getCanExpand() ? (
                    <button
                      {...{
                        onClick: row.getToggleExpandedHandler(),
                        style: { cursor: "pointer" },
                      }}
                    >
                      {row.getIsExpanded() ? "👇" : "👉"}
                    </button>
                  ) : (
                    "🔵"
                  )}{" "}
                  {getValue()}
                </>
              </div>
            ),
            footer: (props) => props.column.id,
          },
          {
            accessorFn: (row) => row.lastName,
            id: "lastName",
            cell: (info) => info.getValue(),
            header: () => <span>Last Name</span>,
            footer: (props) => props.column.id,
          },
        ],
      },
      {
        header: "Info",
        footer: (props) => props.column.id,
        columns: [
          {
            accessorKey: "age",
            header: () => "Age",
            footer: (props) => props.column.id,
          },
          {
            header: "More Info",
            columns: [
              {
                accessorKey: "visits",
                header: () => <span>Visits</span>,
                footer: (props) => props.column.id,
              },
              {
                accessorKey: "status",
                header: "Status",
                footer: (props) => props.column.id,
              },
              {
                accessorKey: "progress",
                header: "Profile Progress",
                footer: (props) => props.column.id,
              },
            ],
          },
        ],
      },
    ],
    []
  );
  const [data, setData] = useState<Person[]>([...defaultData]);
  const [columns] = useState<typeof defaultColumns>([...defaultColumns]);
  // const [columnResizeMode, setColumnResizeMode] =
  //   useState<ColumnResizeMode>("onChange");
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const rerender = useReducer(() => ({}), {})[1];
  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    data.splice(
      targetRowIndex,
      0,
      data.splice(draggedRowIndex, 1)[0] as Person
    );
    setData([...data]);
  };
  const table = useReactTable<Person>({
    data,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSubRows: (row) => row.subRows,
    columnResizeMode: "onChange",
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
    getRowId: (row) => row.userId,
    getPaginationRowModel: getPaginationRowModel(),
  });
  return (
    <>
      <div className="h-4" />
      <div className="overflow-x-auto">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        width: header.getSize(),
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                      <div
                        {...{
                          onMouseDown: header.getResizeHandler(),
                          onTouchStart: header.getResizeHandler(),
                          className: `resizer ${
                            header.column.getIsResizing() ? "isResizing" : ""
                          }`,
                          // style: {
                          //   transform:
                          //     columnResizeMode === "onEnd" &&
                          //     header.column.getIsResizing()
                          //       ? `translateX(${
                          //           table.getState().columnSizingInfo
                          //             .deltaOffset
                          //         }px)`
                          //       : "",
                          // },
                        }}
                      />
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              return (
                <DraggableRow key={row.id} row={row} reorderRow={reorderRow} />
              );
            })}
          </tbody>
        </table>
        <div className="h-2" />
        <div className="flex items-center gap-2">
          <button
            className="border rounded p-1"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </strong>
          </span>
          <span className="flex items-center gap-1">
            | Go to page:
            <input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className="border p-1 rounded w-16"
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};

export default TableData;

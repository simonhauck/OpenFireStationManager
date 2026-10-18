import { paginateData, useTablePagination } from "@astryxdesign/core/Table"
import { useMemo, useState } from "react"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const DEFAULT_PAGE_SIZE = 25

export function useClientPagination<T extends Record<string, unknown>>(
  data: T[],
) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageData = useMemo(
    () => paginateData(data, currentPage, pageSize),
    [data, currentPage, pageSize],
  )

  const paginationPlugin = useTablePagination<T>({
    page: currentPage,
    onPageChange: setPage,
    totalItems: data.length,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    onPageSizeChange: (newPageSize) => {
      setPageSize(newPageSize)
      setPage(1)
    },
  })

  return {
    pageData,
    paginationPlugin,
    rowIndexStart: (currentPage - 1) * pageSize + 1,
    rowCount: data.length,
    resetPage: () => setPage(1),
  }
}

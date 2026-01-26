import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-base-200 pt-4 mt-4">
      <div className="text-xs text-base-content/50">
        Showing <span className="font-bold">{startItem}</span> to{" "}
        <span className="font-bold">{endItem}</span> of{" "}
        <span className="font-bold">{totalItems}</span> results
      </div>
      <div className="join">
        <button
          className="join-item btn btn-sm btn-ghost"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button className="join-item btn btn-sm bg-base-100 pointer-events-none">
          Page {currentPage} of {totalPages}
        </button>
        <button
          className="join-item btn btn-sm btn-ghost"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

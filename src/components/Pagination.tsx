"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const CONTROL_BUTTON_WIDTH = 36;
const PAGE_BUTTON_WIDTH = 36;
const OUTER_GAP = 8;
const PAGE_GAP = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getVisibleCount(containerWidth: number, totalPages: number): number {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return 1;

  const availableWidth = Math.max(
    0,
    containerWidth - CONTROL_BUTTON_WIDTH * 2 - OUTER_GAP * 2,
  );
  const slots = Math.floor(
    (availableWidth + PAGE_GAP) / (PAGE_BUTTON_WIDTH + PAGE_GAP),
  );

  return clamp(slots || 1, 1, Math.max(1, totalPages));
}

function getWindowRange(
  currentPage: number,
  totalPages: number,
  visibleCount: number,
): [number, number] {
  if (totalPages <= visibleCount) {
    return [1, totalPages];
  }

  const centeredOffset = Math.floor((visibleCount - 1) / 2);
  let start = currentPage - centeredOffset;
  let end = start + visibleCount - 1;

  if (start < 1) {
    start = 1;
    end = visibleCount;
  }

  if (end > totalPages) {
    end = totalPages;
    start = totalPages - visibleCount + 1;
  }

  return [start, end];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = clamp(currentPage, 1, safeTotalPages);
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let frame = 0;

    const measure = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const width = node.getBoundingClientRect().width;
        setVisibleCount((currentVisibleCount) => {
          const nextVisibleCount = getVisibleCount(width, safeTotalPages);
          return currentVisibleCount === nextVisibleCount
            ? currentVisibleCount
            : nextVisibleCount;
        });
      });
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      };
    }

    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(frame);
    };
  }, [safeTotalPages]);

  useEffect(() => {
    setVisibleCount((currentVisibleCount) =>
      clamp(currentVisibleCount, 1, safeTotalPages),
    );
  }, [safeTotalPages]);

  const [startPage, endPage] = useMemo(
    () => getWindowRange(safeCurrentPage, safeTotalPages, visibleCount),
    [safeCurrentPage, safeTotalPages, visibleCount],
  );

  const visiblePages = useMemo(() => {
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index,
    );
  }, [startPage, endPage]);

  const canGoPrevious = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < safeTotalPages;

  const goToPage = (page: number) => {
    if (page < 1 || page > safeTotalPages || page === safeCurrentPage) return;
    onPageChange(page);
  };

  return (
    <nav
      ref={containerRef}
      aria-label="Paginação"
      className={`flex w-full max-w-full items-center justify-center gap-2 overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => goToPage(safeCurrentPage - 1)}
        disabled={!canGoPrevious}
        aria-label="Página anterior"
        className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden">
        {visiblePages.map((page) => {
          const isActive = safeCurrentPage === page;

          return (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              aria-label={`Ir para a página ${page}`}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg text-sm font-medium transition-colors  ${
                isActive
                  ? "bg-navy text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => goToPage(safeCurrentPage + 1)}
        disabled={!canGoNext}
        aria-label="Página seguinte"
        className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Page size.
 *
 * A long surah rendered whole is genuinely heavy: Al Baqarah came to 6,488 DOM
 * nodes, 1,153 SVG elements and 862 buttons, and a single scroll cost about
 * 9.5ms, which does not fit in a frame. Study rows carry a rosette and three
 * icon buttons each, so they are capped lower than mushaf spans, which carry
 * only the rosette.
 */
export const PAGE_SIZE = { study: 25, mushaf: 60 } as const;

type Paged<T> = {
  page: number;
  pageCount: number;
  items: T[];
  /** Index of the first item on this page, for numbering and audio. */
  offset: number;
  setPage: (page: number) => void;
  /** Moves to the page holding this index. Returns true if the page changed. */
  goToIndex: (index: number) => boolean;
  hasPrevious: boolean;
  hasNext: boolean;
};

/**
 * Splits a long list of ayahs into pages, keeping deep links working.
 *
 * An anchor such as #ayah-200, which is what search results and bookmarks
 * produce, has to open on the page that actually holds that ayah, or those
 * links would silently land on the wrong content.
 */
export function useAyahPagination<T>(
  items: T[],
  pageSize: number,
  /** Maps an ayah number from the URL hash onto its index in the list. */
  findIndexForAnchor?: (ayahNumber: number) => number,
): Paged<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  const [page, setPageState] = useState(0);

  const setPage = useCallback(
    (next: number) => {
      setPageState(Math.min(Math.max(0, next), pageCount - 1));
    },
    [pageCount],
  );

  // Open on the page holding the anchored ayah, then scroll to it.
  //
  // The page cannot be chosen during render: the server has no URL hash, so
  // deciding there would mean the server and the client disagreed on which
  // page to draw. It is applied on a later tick instead, which also gives the
  // chosen page time to render before anything tries to scroll to it.
  useEffect(() => {
    const match = /^#ayah-(\d+)$/.exec(window.location.hash);
    if (!match || !findIndexForAnchor) return;

    const index = findIndexForAnchor(Number(match[1]));
    if (index < 0) return;

    let scrollTimer = 0;
    const pageTimer = window.setTimeout(() => {
      setPageState(Math.floor(index / pageSize));
      scrollTimer = window.setTimeout(() => {
        document
          .getElementById(`ayah-${match[1]}`)
          ?.scrollIntoView({ block: "center" });
      }, 120);
    }, 0);

    return () => {
      window.clearTimeout(pageTimer);
      window.clearTimeout(scrollTimer);
    };
  }, [findIndexForAnchor, pageSize]);

  const offset = page * pageSize;

  const visible = useMemo(
    () => items.slice(offset, offset + pageSize),
    [items, offset, pageSize],
  );

  const goToIndex = useCallback(
    (index: number) => {
      const target = Math.floor(index / pageSize);
      if (target === page) return false;
      setPage(target);
      return true;
    },
    [page, pageSize, setPage],
  );

  return {
    page,
    pageCount,
    items: visible,
    offset,
    setPage,
    goToIndex,
    hasPrevious: page > 0,
    hasNext: page < pageCount - 1,
  };
}

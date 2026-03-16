import { useEffect, useState } from "react";
import ComparisonTray from "./components/ComparisonTray.jsx";
import ComparisonView from "./components/ComparisonView.jsx";
import FilterBar from "./components/FilterBar.jsx";
import Pagination from "./components/Pagination.jsx";
import ResultsList from "./components/ResultsList.jsx";
import ResultsTable from "./components/ResultsTable.jsx";
import { useMediaQuery } from "./hooks/useMediaQuery.js";
import { useSearch } from "./hooks/useSearch.js";

const EMPTY_FILTERS = {
  benchmark: "",
  vendor: "",
  processor: "",
  system: "",
  minCores: "",
  maxCores: "",
  minPeak: "",
  minBase: "",
};

const PAGE_SIZE = 50;

const QUERY_PARAM_KEYS = [
  "benchmark",
  "vendor",
  "processor",
  "system",
  "minCores",
  "maxCores",
  "minPeak",
  "minBase",
];

function filtersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const initial = { ...EMPTY_FILTERS };
  for (const key of QUERY_PARAM_KEYS) {
    const value = params.get(key);
    if (value) initial[key] = value;
  }
  return initial;
}

function filtersToUrl(filters, compareIds) {
  const params = new URLSearchParams();
  for (const key of QUERY_PARAM_KEYS) {
    if (filters[key]) params.set(key, filters[key]);
  }
  if (compareIds) params.set("compare", compareIds);
  const qs = params.toString();
  const url = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  window.history.replaceState(null, "", url);
}

function compareIdsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("compare");
  if (!raw) return null;
  const ids = raw.split(",").map(Number).filter(Number.isFinite);
  return ids.length === 2 ? ids : null;
}

export default function App() {
  const [data, setData] = useState(null);
  const [facets, setFacets] = useState(null);
  const [filters, setFilters] = useState(filtersFromUrl);
  const [sortConfig, setSortConfig] = useState({
    key: "peakResult",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/results.json`).then((r) =>
        r.json(),
      ),
      fetch(`${import.meta.env.BASE_URL}data/facets.json`).then((r) =>
        r.json(),
      ),
    ]).then(([results, facetsData]) => {
      setData(results);
      setFacets(facetsData);

      const compareIds = compareIdsFromUrl();
      if (compareIds) {
        const a = results.find((r) => r.id === compareIds[0]);
        const b = results.find((r) => r.id === compareIds[1]);
        if (a && b && a.benchmark === b.benchmark) {
          setSelected([a, b]);
          setShowComparison(true);
        }
      }
    });
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    filtersToUrl(newFilters);
    setPage(1);
  };

  const handleSort = (newSort) => {
    setSortConfig(newSort);
    setPage(1);
  };

  const toggleSelection = (row) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === row.id);
      if (exists) return prev.filter((s) => s.id !== row.id);
      if (prev.length >= 2) return prev;
      if (prev.length === 1 && prev[0].benchmark !== row.benchmark) return prev;
      return [...prev, row];
    });
  };

  const clearSelection = () => {
    setSelected([]);
    setShowComparison(false);
    filtersToUrl(filters);
  };

  const openComparison = () => {
    if (selected.length === 2) {
      setShowComparison(true);
      filtersToUrl(filters, `${selected[0].id},${selected[1].id}`);
    }
  };

  const closeComparison = () => {
    setShowComparison(false);
    filtersToUrl(filters);
  };

  const { total, pageData, totalPages } = useSearch(
    data,
    filters,
    sortConfig,
    page,
    PAGE_SIZE,
  );

  if (!data || !facets) {
    return <div className="loading">Loading benchmark data...</div>;
  }

  if (showComparison && selected.length === 2) {
    return (
      <div className="app">
        <ComparisonView systems={selected} onClose={closeComparison} />
      </div>
    );
  }

  return (
    <div className={`app${selected.length > 0 ? " app--with-tray" : ""}`}>
      <header className="app-header">
        <img
          src={`${import.meta.env.BASE_URL}logo.svg`}
          alt="SPEC Search"
          className="app-logo"
        />
        <h1>SPEC CPU2017 Results</h1>
        <span className="subtitle">
          {data.length.toLocaleString()} benchmark entries
        </span>
      </header>

      <FilterBar
        facets={facets}
        filters={filters}
        onChange={handleFiltersChange}
        onClear={() => handleFiltersChange(EMPTY_FILTERS)}
        collapsible={!isDesktop}
      />

      <div className="status-bar">
        <span>
          Showing {pageData.length} of {total.toLocaleString()} results
        </span>
        <span>
          Sorted by {sortConfig.key} ({sortConfig.direction})
        </span>
      </div>

      {isDesktop ? (
        <ResultsTable
          data={pageData}
          sortConfig={sortConfig}
          onSort={handleSort}
          selected={selected}
          onToggleSelection={toggleSelection}
        />
      ) : (
        <ResultsList
          data={pageData}
          sortConfig={sortConfig}
          onSort={handleSort}
          selected={selected}
          onToggleSelection={toggleSelection}
        />
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {selected.length > 0 && (
        <ComparisonTray
          selected={selected}
          onCompare={openComparison}
          onClear={clearSelection}
        />
      )}
    </div>
  );
}

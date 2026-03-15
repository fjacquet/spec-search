import { useEffect, useState } from "react";
import FilterBar from "./components/FilterBar.jsx";
import Pagination from "./components/Pagination.jsx";
import ResultsTable from "./components/ResultsTable.jsx";
import { useSearch } from "./hooks/useSearch.js";

const EMPTY_FILTERS = {
  benchmark: "",
  vendor: "",
  processor: "",
  minCores: "",
  maxCores: "",
  minPeak: "",
  minBase: "",
};

const PAGE_SIZE = 50;

export default function App() {
  const [data, setData] = useState(null);
  const [facets, setFacets] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortConfig, setSortConfig] = useState({
    key: "peakResult",
    direction: "desc",
  });
  const [page, setPage] = useState(1);

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
    });
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSort = (newSort) => {
    setSortConfig(newSort);
    setPage(1);
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

  return (
    <div className="app">
      <header className="app-header">
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
      />

      <div className="status-bar">
        <span>
          Showing {pageData.length} of {total.toLocaleString()} results
        </span>
        <span>
          Sorted by {sortConfig.key} ({sortConfig.direction})
        </span>
      </div>

      <ResultsTable
        data={pageData}
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

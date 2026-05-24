import { useEffect, useState } from "react";
import ComparisonTray from "./components/ComparisonTray.jsx";
import ComparisonView from "./components/ComparisonView.jsx";
import FilterBar from "./components/FilterBar.jsx";
import Pagination from "./components/Pagination.jsx";
import ResultsList from "./components/ResultsList.jsx";
import ResultsTable from "./components/ResultsTable.jsx";
import { ThemeToggle } from "./components/ThemeToggle.jsx";
import { DEFAULT_SUITE, getSuite, SUITE_IDS } from "./constants/suites.js";
import { useMediaQuery } from "./hooks/useMediaQuery.js";
import { useSearch } from "./hooks/useSearch.js";
import { SuiteContext } from "./hooks/useSuite.js";

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

function suiteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const s = params.get("suite");
  return SUITE_IDS.includes(s) ? s : DEFAULT_SUITE;
}

function filtersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const initial = { ...EMPTY_FILTERS };
  for (const key of QUERY_PARAM_KEYS) {
    const value = params.get(key);
    if (value) initial[key] = value;
  }
  return initial;
}

function syncUrl(suiteId, filters, compareIds) {
  const params = new URLSearchParams();
  if (suiteId !== DEFAULT_SUITE) params.set("suite", suiteId);
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
  const [suiteId, setSuiteId] = useState(suiteFromUrl);
  const suite = getSuite(suiteId);
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
    setData(null);
    setFacets(null);
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/${suiteId}/results.json`).then(
        (r) => r.json(),
      ),
      fetch(`${import.meta.env.BASE_URL}data/${suiteId}/facets.json`).then(
        (r) => r.json(),
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
  }, [suiteId]);

  const handleSuiteChange = (newSuiteId) => {
    setSuiteId(newSuiteId);
    setFilters({ ...EMPTY_FILTERS });
    setSelected([]);
    setShowComparison(false);
    setPage(1);
    setSortConfig({ key: "peakResult", direction: "desc" });
    syncUrl(newSuiteId, EMPTY_FILTERS);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    syncUrl(suiteId, newFilters);
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
    syncUrl(suiteId, filters);
  };

  const openComparison = () => {
    if (selected.length === 2) {
      setShowComparison(true);
      syncUrl(suiteId, filters, `${selected[0].id},${selected[1].id}`);
    }
  };

  const closeComparison = () => {
    setShowComparison(false);
    syncUrl(suiteId, filters);
  };

  const swapSystems = () => {
    setSelected((prev) => {
      const swapped = [prev[1], prev[0]];
      syncUrl(suiteId, filters, `${swapped[0].id},${swapped[1].id}`);
      return swapped;
    });
  };

  const { total, pageData, totalPages } = useSearch(
    data,
    filters,
    sortConfig,
    page,
    PAGE_SIZE,
  );

  if (!data || !facets) {
    return (
      <div className="flex h-[200px] items-center justify-center text-lg text-slate-500 dark:text-slate-400">
        Loading benchmark data...
      </div>
    );
  }

  if (showComparison && selected.length === 2) {
    return (
      <SuiteContext.Provider value={suite}>
        <div className="mx-auto max-w-[1400px] p-2 min-[480px]:p-3 md:p-4">
          <ComparisonView
            systems={selected}
            onClose={closeComparison}
            onSwap={swapSystems}
          />
        </div>
      </SuiteContext.Provider>
    );
  }

  return (
    <SuiteContext.Provider value={suite}>
      <div
        className={`mx-auto max-w-[1400px] p-2 min-[480px]:p-3 md:p-4${selected.length > 0 ? " pb-[140px] md:pb-20" : ""}`}
      >
        <header className="mb-6 flex items-baseline gap-4 border-b-2 border-slate-200 pb-4 dark:border-surface-700 max-[479px]:mb-4 max-[479px]:flex-col max-[479px]:gap-1 max-[479px]:pb-3">
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="SPEC Search"
            className="h-10 w-10 shrink-0 max-[479px]:h-8 max-[479px]:w-8"
          />
          <h1 className="text-2xl font-bold max-[479px]:text-xl">
            {suite.name} Results
          </h1>
          <div className="ml-auto flex gap-1">
            {SUITE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={`cursor-pointer rounded border px-3 py-1 text-xs transition-colors ${id === suiteId ? "border-primary-500 bg-primary-500 text-white dark:border-primary-300 dark:bg-primary-300 dark:text-surface-900" : "border-slate-200 bg-transparent text-slate-500 hover:border-primary-500 hover:text-primary-500 dark:border-surface-700 dark:text-slate-400 dark:hover:border-primary-300 dark:hover:text-primary-300"}`}
                onClick={() => handleSuiteChange(id)}
              >
                {getSuite(id).name}
              </button>
            ))}
          </div>
          <ThemeToggle />
          <span className="text-sm text-slate-500 dark:text-slate-400">
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

        <div className="mb-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 max-[479px]:flex-col max-[479px]:items-start max-[479px]:gap-1">
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
    </SuiteContext.Provider>
  );
}

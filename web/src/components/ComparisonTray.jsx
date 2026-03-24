export default function ComparisonTray({ selected, onCompare, onClear }) {
  return (
    <section
      className="comparison-tray"
      aria-label="Selected systems for comparison"
    >
      <div className="comparison-tray__systems">
        {selected.map((s, i) => (
          <span key={s.id} className="comparison-tray__chip">
            {selected.length === 2
              ? `${i === 0 ? "As-Is" : "To-Be"}: ${s.processor ?? "Unknown"}`
              : (s.processor ?? "Unknown")}
          </span>
        ))}
      </div>
      <div className="comparison-tray__actions">
        <button
          type="button"
          className="comparison-tray__compare"
          onClick={onCompare}
          disabled={selected.length !== 2}
        >
          Compare
        </button>
        <button
          type="button"
          className="comparison-tray__clear"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </section>
  );
}

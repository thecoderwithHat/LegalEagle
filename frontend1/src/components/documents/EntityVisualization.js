import React, { useMemo, useState } from 'react';

const getStyleByType = (type) => {
  const t = type.toLowerCase();
  if (t.includes('date') || t.includes('term')) {
    return {
      card: 'bg-amber-50 border border-amber-200',
      chip: 'bg-amber-100 text-amber-800',
      text: 'text-amber-900'
    };
  }
  if (t.includes('amount') || t.includes('price') || t.includes('payment')) {
    return {
      card: 'bg-emerald-50 border border-emerald-200',
      chip: 'bg-emerald-100 text-emerald-800',
      text: 'text-emerald-900'
    };
  }
  if (t.includes('party') || t.includes('person') || t.includes('entity')) {
    return {
      card: 'bg-sky-50 border border-sky-200',
      chip: 'bg-sky-100 text-sky-800',
      text: 'text-sky-900'
    };
  }
  return {
    card: 'bg-indigo-50 border border-indigo-200',
    chip: 'bg-indigo-100 text-indigo-800',
    text: 'text-indigo-900'
  };
};

const toLabel = (type) => type.replace(/([A-Z])/g, ' $1').trim();

export default function EntityVisualization({ entities }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});

  const normalized = useMemo(
    () =>
      Object.entries(entities || {})
        .map(([type, values]) => ({
          type,
          label: toLabel(type),
          items: Array.isArray(values) ? values.filter(Boolean) : []
        }))
        .filter((entry) => entry.items.length > 0),
    [entities]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalized;

    return normalized
      .map((entry) => {
        const matchesType = entry.label.toLowerCase().includes(q);
        const matchesItems = entry.items.filter((item) =>
          String(item).toLowerCase().includes(q)
        );
        if (matchesType) return entry;
        if (matchesItems.length > 0) {
          return { ...entry, items: matchesItems };
        }
        return null;
      })
      .filter(Boolean);
  }, [normalized, query]);

  const totalVisibleItems = filtered.reduce((count, entry) => count + entry.items.length, 0);

  const toggleExpand = (type) => {
    setExpanded((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  if (normalized.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-600">
        <p className="font-medium text-gray-700">No entities extracted yet.</p>
        <p className="mt-1 text-sm">Try re-running analysis for this document to refresh entity and clause extraction.</p>
      </div>
    );
  }

  return (
    <div className="pr-1">
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-700">{filtered.length} categories • {totalVisibleItems} matches</p>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entities or clauses"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none ring-indigo-200 placeholder:text-gray-400 focus:ring md:w-72"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          No results for "{query}". Try a different keyword.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map(({ type, label, items }) => {
            const styles = getStyleByType(type);
            const isExpanded = Boolean(expanded[type]);
            const visibleItems = isExpanded ? items : items.slice(0, 5);

            return (
              <div key={type} className={`${styles.card} rounded-lg p-4`}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-semibold ${styles.text}`}>{label}</h4>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.chip}`}>{items.length}</span>
                </div>

                <ul className="space-y-1.5">
                  {visibleItems.map((value, index) => (
                    <li
                      key={`${type}-${index}`}
                      className={`truncate rounded px-2 py-1 text-sm ${styles.text} bg-white/70`}
                      title={value}
                    >
                      {value}
                    </li>
                  ))}
                </ul>

                {items.length > 5 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(type)}
                    className="mt-3 text-xs font-medium text-gray-600 underline decoration-dotted underline-offset-4 hover:text-gray-800"
                  >
                    {isExpanded ? 'Show less' : `Show ${items.length - 5} more`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
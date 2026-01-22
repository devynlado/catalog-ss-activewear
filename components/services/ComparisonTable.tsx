'use client';

interface ComparisonRow {
  feature: string;
  values: string[];
}

interface ComparisonTableProps {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: ComparisonRow[];
  highlightColumn?: number; // 0-indexed, highlights this column
}

export function ComparisonTable({ title, subtitle, columns, rows, highlightColumn = 0 }: ComparisonTableProps) {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-navy-800">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-lg text-slate-600">{subtitle}</p>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">
                  Features
                </th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`text-left py-4 px-4 text-sm font-semibold uppercase tracking-wider border-b-2 ${
                      index === highlightColumn
                        ? 'text-brand-600 border-brand-500 bg-brand-50'
                        : 'text-slate-500 border-slate-200'
                    }`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-100">
                  <td className="py-4 px-4 text-sm font-medium text-slate-700">
                    {row.feature}
                  </td>
                  {row.values.map((value, colIndex) => (
                    <td
                      key={colIndex}
                      className={`py-4 px-4 text-sm ${
                        colIndex === highlightColumn
                          ? 'text-slate-900 font-medium bg-brand-50/50'
                          : 'text-slate-600'
                      }`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

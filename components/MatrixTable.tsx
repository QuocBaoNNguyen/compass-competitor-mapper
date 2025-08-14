type Cell = boolean | number | string | null
export function MatrixTable({ headers, rows }: { headers: string[], rows: { name: string, cells: Cell[] }[] }){
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2 sticky left-0 bg-white border-b border-slate-200">Competitor</th>
            {headers.map((h, i) => (
              <th key={i} className="p-2 text-left border-b border-slate-200 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-slate-50">
              <td className="p-2 font-medium sticky left-0 bg-white border-r border-slate-200">{r.name}</td>
              {r.cells.map((c, j) => (
                <td key={j} className="p-2">{typeof c === 'boolean' ? (c ? '✅' : '—') : (c ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Card({ title, children, actions }:{ title?: string, children: React.ReactNode, actions?: React.ReactNode }){
  return (
    <div className="rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-4 flex items-center justify-between">
        {title ? <h3 className="font-medium">{title}</h3> : <div />}
        {actions}
      </div>
      <div className="p-4 pt-0">{children}</div>
    </div>
  )
}

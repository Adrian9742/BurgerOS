const config = {
  aguardando: { rotulo: "Aguardando", classe: "bg-status-aguardando/15 text-status-aguardando border-status-aguardando/30" },
  preparo: { rotulo: "Em preparo", classe: "bg-status-preparo/15 text-status-preparo border-status-preparo/30" },
  pronto: { rotulo: "Pronto", classe: "bg-status-pronto/15 text-status-pronto border-status-pronto/30" },
  entregue: { rotulo: "Entregue", classe: "bg-status-entregue/15 text-status-entregue border-status-entregue/30" },
  cancelado: { rotulo: "Cancelado", classe: "bg-status-cancelado/15 text-status-cancelado border-status-cancelado/30" },
}

export default function Badge({ status }) {
  const { rotulo, classe } = config[status] || config.aguardando
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classe}`}>
      {rotulo}
    </span>
  )
}

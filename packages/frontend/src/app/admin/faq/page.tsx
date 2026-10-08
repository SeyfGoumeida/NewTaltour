'use client';

import CrudPage from '@/components/admin/CrudPage';

export default function FaqPage() {
  return (
    <CrudPage
      title="FAQ"
      sub="Questions fréquentes affichées sur le site."
      endpoint="/admin/faq"
      itemLabel="Question"
      clientSearch={(r, t) => `${r.question} ${r.reponse}`.toLowerCase().includes(t)}
      searchPlaceholder="Rechercher une question…"
      wide
      defaults={{ question: '', reponse: '', ordre: 0 }}
      columns={[
        { key: 'ordre', label: '#', className: 'w-12 text-muted' },
        { key: 'question', label: 'Question', className: 'max-w-[360px] whitespace-normal font-medium text-white' },
        { key: 'reponse', label: 'Réponse', className: 'max-w-[480px] whitespace-normal', render: (r) => <span className="line-clamp-2 text-xs text-soft">{r.reponse}</span> },
      ]}
      fields={[
        { key: 'question', label: 'Question', required: true, full: true },
        { key: 'reponse', label: 'Réponse', type: 'textarea', required: true },
        { key: 'ordre', label: "Ordre d'affichage", type: 'number', required: true },
      ]}
    />
  );
}

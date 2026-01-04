import React from 'react';

export default function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
        {title || "Título"}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
        {subtitle || "Subtítulo de la sección"}
      </p>
    </div>
  );
}

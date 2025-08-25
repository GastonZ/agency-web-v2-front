import * as React from "react";

export const SelectedSummary: React.FC<{ items?: string[] }> = ({ items }) => {
  return (
    <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
      {items && items.length > 0 ? (
        <>Seleccionados: <span className="font-semibold">{items.join(", ")}</span></>
      ) : (
        <>No hay canales seleccionados todavía.</>
      )}
    </div>
  );
};

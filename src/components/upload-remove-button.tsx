"use client";

export function UploadRemoveButton({
  label,
  onRemove,
  disabled = false,
}: {
  label: string;
  onRemove: () => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        void onRemove();
      }}
      className="absolute right-2 top-2 z-10 grid size-9 place-items-center rounded-full border border-rose-100 bg-white text-rose-600 shadow-sm transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <i className="fa-solid fa-trash-can text-sm" aria-hidden="true" />
    </button>
  );
}

"use client";

const PRESETS = ["#6366F1", "#0F172A", "#EF4444", "#22C55E", "#F59E0B", "#EC4899", "#0EA5E9", "#8B5CF6"];

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-xl border border-line bg-white p-1"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input font-mono"
        />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            style={{ background: c }}
            className="h-7 w-7 rounded-full border-2 border-white shadow ring-1 ring-line transition hover:scale-110"
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

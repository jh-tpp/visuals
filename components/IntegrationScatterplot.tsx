type Props = {
  mode?: "standard" | "combinatorial";
};

export default function IntegrationScatterplot({ mode = "standard" }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-slate-600">
      Integration scatterplot migration placeholder - mode: {mode}
    </div>
  );
}

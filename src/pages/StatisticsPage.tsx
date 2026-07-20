import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  BarChart3,
  Play,
  Sigma,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  useGisConnections,
  useLayerCapabilities,
  useLayerSchema,
  useStatisticsCapabilities,
} from '../lib/hooks';
import { getStatistics } from '../lib/iubi';
import { ErrorBox, Spinner } from '../components/ui';
import type { AggregationResult } from '../lib/types';

const NUMERIC = new Set(['Integer', 'Long', 'Double', 'Float', 'Short', 'BigDecimal', 'Number']);
const COLORS = ['#1b6ff5', '#328fff', '#59b0ff', '#193f8f', '#8ecdff', '#1458e1'];

export function StatisticsPage() {
  const gis = useGisConnections();
  const [connectionId, setConnectionId] = useState('');
  const effectiveConn = connectionId || gis.data?.[0]?.id || '';

  const caps = useLayerCapabilities(effectiveConn);
  const [layer, setLayer] = useState('');
  const effectiveLayer = layer || caps.data?.[0]?.map.layers || '';

  const schema = useLayerSchema(effectiveConn, effectiveLayer);
  const statsCaps = useStatisticsCapabilities(effectiveConn, effectiveLayer);

  const [attribute, setAttribute] = useState('');
  const [functions, setFunctions] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState('');

  const numericAttrs = useMemo(
    () => schema.data?.attributes.filter((a) => NUMERIC.has(a.type)) ?? [],
    [schema.data],
  );
  const stringAttrs = useMemo(
    () => schema.data?.attributes.filter((a) => a.type === 'String') ?? [],
    [schema.data],
  );

  // Reset seleção quando muda a camada.
  useEffect(() => {
    setAttribute('');
    setFunctions([]);
    setGroupBy('');
  }, [effectiveConn, effectiveLayer]);

  const effectiveAttr = attribute || numericAttrs[0]?.name || '';

  const run = useMutation({
    mutationFn: () =>
      getStatistics(effectiveConn, effectiveLayer, {
        aggregationAttribute: effectiveAttr,
        aggregations: functions.map((f) => ({ function: f, alias: f })),
        groupBy: groupBy ? [groupBy] : undefined,
      }),
  });

  const toggleFn = (f: string) =>
    setFunctions((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const canRun = effectiveAttr && functions.length > 0 && !run.isPending;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="text-iubi-700" size={22} />
        <h1 className="text-2xl font-extrabold text-slate-800">Estatísticas de camadas</h1>
      </div>
      <p className="text-slate-500 mb-6 max-w-2xl">
        Agregue atributos de uma camada usando o endpoint{' '}
        <code className="font-mono text-iubi-700">/data/layers/&#123;layer&#125;/statistics</code>{' '}
        e visualize o resultado.
      </p>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Configuração */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 h-fit">
          <Field label="Conexão GIS">
            <select
              value={effectiveConn}
              onChange={(e) => {
                setConnectionId(e.target.value);
                setLayer('');
              }}
              className="input"
            >
              {gis.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Camada">
            <select
              value={effectiveLayer}
              onChange={(e) => setLayer(e.target.value)}
              className="input"
              disabled={caps.isLoading}
            >
              {caps.data?.map((l) => (
                <option key={l.identifier} value={l.map.layers}>
                  {l.title}
                </option>
              ))}
            </select>
          </Field>

          {schema.isLoading && <Spinner label="Carregando schema…" />}
          {schema.error && <ErrorBox error={schema.error} />}

          {schema.data && (
            <>
              <Field label="Atributo (numérico)">
                <select
                  value={effectiveAttr}
                  onChange={(e) => setAttribute(e.target.value)}
                  className="input"
                >
                  {numericAttrs.length === 0 && <option value="">nenhum numérico</option>}
                  {numericAttrs.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.label} ({a.type})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Funções de agregação">
                <div className="flex flex-wrap gap-1.5">
                  {(statsCaps.data?.functions ?? []).map((f) => (
                    <button
                      key={f}
                      onClick={() => toggleFn(f)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        functions.includes(f)
                          ? 'bg-iubi-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Agrupar por (opcional)">
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="input"
                >
                  <option value="">— sem agrupamento —</option>
                  {stringAttrs.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </Field>

              <button
                onClick={() => run.mutate()}
                disabled={!canRun}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-iubi-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-iubi-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play size={16} /> {run.isPending ? 'Calculando…' : 'Calcular estatísticas'}
              </button>
            </>
          )}
        </div>

        {/* Resultado */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 min-h-[400px]">
          {!run.data && !run.isPending && !run.error && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <Sigma size={28} />
              <span className="text-sm">Configure e clique em “Calcular” para ver os resultados.</span>
            </div>
          )}
          {run.isPending && <Spinner label="Consultando o serviço…" />}
          {run.error && <ErrorBox error={run.error} />}
          {run.data && <ResultView result={run.data} attribute={effectiveAttr} />}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

function ResultView({ result, attribute }: { result: AggregationResult; attribute: string }) {
  if (result.message) {
    return <ErrorBox error={result.message} />;
  }
  const grouped = result.GroupByAttributes.length > 0;
  const fns = result.AggregationFunctions;

  if (!grouped) {
    // Uma linha: valores por função.
    const row = result.AggregationResults[0] ?? [];
    const data = fns.map((fn, i) => ({ name: fn, value: Number(row[i]) }));
    return (
      <div>
        <h3 className="font-semibold text-slate-700 mb-3">
          Agregações de <span className="font-mono text-iubi-700">{attribute}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {data.map((d) => (
            <div key={d.name} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="text-xs text-slate-400">{d.name}</div>
              <div className="text-xl font-bold text-slate-800">
                {Number.isFinite(d.value) ? d.value.toLocaleString('pt-BR') : String(row[fns.indexOf(d.name)])}
              </div>
            </div>
          ))}
        </div>
        <ChartBox data={data} dataKey="value" />
      </div>
    );
  }

  // Agrupado: cada linha = grupo; usamos a primeira função para o gráfico.
  const data = result.AggregationResults.map((row) => ({
    name: String(row[0]),
    value: Number(row[result.GroupByAttributes.length]),
  }))
    .filter((d) => Number.isFinite(d.value))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  return (
    <div>
      <h3 className="font-semibold text-slate-700 mb-3">
        {fns[0]} de <span className="font-mono text-iubi-700">{attribute}</span> por{' '}
        <span className="font-mono text-iubi-700">{result.GroupByAttributes[0]}</span>{' '}
        <span className="text-xs text-slate-400">(top {data.length})</span>
      </h3>
      <ChartBox data={data} dataKey="value" />
    </div>
  );
}

function ChartBox({ data, dataKey }: { data: Array<{ name: string; value: number }>; dataKey: string }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 40, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis
            dataKey="name"
            angle={-35}
            textAnchor="end"
            interval={0}
            height={60}
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={64} />
          <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR')} />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

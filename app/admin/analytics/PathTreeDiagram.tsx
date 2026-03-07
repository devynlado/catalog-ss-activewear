'use client';

import { useEffect, useState, useCallback } from 'react';

export interface PathTreeNode {
  path: string;
  sessions: number;
  children?: PathTreeNode[];
}

const NODE_WIDTH = 100;
const NODE_HEIGHT = 44;
const LEVEL0_Y = 36;
const LEVEL1_Y = 120;
const LEVEL2_Y = 220;
const LEVEL3_Y = 320;
const H_GAP = 16;
const V_GAP = 24;

function shortenPath(path: string, maxLen = 18): string {
  if (path.length <= maxLen) return path;
  if (path === '/') return 'Home';
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2) return `/${parts[0]}/…`;
  return path.slice(0, maxLen - 1) + '…';
}

export function PathTreeDiagram() {
  const [tree, setTree] = useState<PathTreeNode | null>(null);
  const [dataSource, setDataSource] = useState<'ga4' | 'mock' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const showTooltip = useCallback((text: string, e: React.MouseEvent) => {
    setTooltip({ text, x: e.clientX, y: e.clientY });
  }, []);
  const hideTooltip = useCallback(() => setTooltip(null), []);
  const moveTooltip = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
  }, []);

  useEffect(() => {
    fetch('/api/admin/analytics/path-tree')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.error || (res.status === 403 ? 'Admin access required' : 'Failed to load');
          const details = data.details ? ` — ${data.details}` : '';
          throw new Error(`${msg}${details}`);
        }
        return data;
      })
      .then((data) => {
        setTree(data.tree ?? null);
        setDataSource(data.source ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-stone-200 bg-white p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p className="font-medium">Could not load path tree</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{error}</p>
      </div>
    );
  }

  if (!tree || !tree.children?.length) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-slate-500">
        No path data available. Ensure you have sessions starting from the homepage.
      </div>
    );
  }

  const level1 = tree.children;
  const level1Span = (level1.length - 1) * (NODE_WIDTH + H_GAP) + NODE_WIDTH;
  const maxLevel2RowWidth = Math.max(
    0,
    ...level1.map((n) => (n.children?.length ?? 0) * (NODE_WIDTH + H_GAP) - H_GAP)
  );
  const maxLevel3RowWidth = Math.max(
    0,
    ...level1.flatMap((n) => (n.children ?? []).map((c) => (c.children?.length ?? 0) * (NODE_WIDTH + H_GAP) - H_GAP))
  );
  const padding = 100;
  const svgWidth = Math.max(700, Math.ceil(level1Span + Math.max(maxLevel2RowWidth, maxLevel3RowWidth) + padding));
  const svgHeight = 380;
  const centerX = svgWidth / 2;

  const level1Xs = level1.length === 1
    ? [centerX]
    : level1.map((_, i) => centerX - level1Span / 2 + i * (NODE_WIDTH + H_GAP) + NODE_WIDTH / 2);

  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  level1.forEach((node, i) => {
    lines.push({ x1: centerX, y1: LEVEL0_Y + NODE_HEIGHT / 2, x2: level1Xs[i], y2: LEVEL1_Y });
    const kids = node.children ?? [];
    const rowWidth = kids.length * NODE_WIDTH + (kids.length - 1) * H_GAP;
    const startX = level1Xs[i] - rowWidth / 2;
    kids.forEach((_, j) => {
      const cx2 = startX + NODE_WIDTH / 2 + j * (NODE_WIDTH + H_GAP);
      lines.push({ x1: level1Xs[i], y1: LEVEL1_Y + NODE_HEIGHT, x2: cx2, y2: LEVEL2_Y });
      const grandkids = kids[j].children ?? [];
      const l3RowWidth = grandkids.length * NODE_WIDTH + (grandkids.length - 1) * H_GAP;
      const l3StartX = cx2 - l3RowWidth / 2;
      grandkids.forEach((_, k) => {
        const cx3 = l3StartX + NODE_WIDTH / 2 + k * (NODE_WIDTH + H_GAP);
        lines.push({ x1: cx2, y1: LEVEL2_Y + NODE_HEIGHT, x2: cx3, y2: LEVEL3_Y });
      });
    });
  });

  const rootTooltip = `${tree.path === '/' ? 'Home (/)' : tree.path} — ${tree.sessions.toLocaleString()} sessions`;

  return (
    <div className="relative rounded-xl border border-stone-200 bg-white p-6 pb-8 shadow-sm">
      <p className="mb-4 text-xs text-slate-500">
        Sessions that started on the homepage (/) and the pages visited next. Three levels. Data last 30 days.
      </p>
      <div className="overflow-x-auto overflow-y-hidden" style={{ width: '100%' }}>
        <div style={{ width: svgWidth, minWidth: svgWidth }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width={svgWidth}
            height={svgHeight}
            style={{ display: 'block', verticalAlign: 'top' }}
          >
            {/* Edges */}
            <g stroke="currentColor" strokeWidth={1.5} className="text-stone-300">
              {lines.map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
              ))}
            </g>
            {/* Root */}
            <g
              transform={`translate(${centerX - NODE_WIDTH / 2}, ${LEVEL0_Y})`}
              onMouseEnter={(e) => showTooltip(rootTooltip, e)}
              onMouseMove={moveTooltip}
              onMouseLeave={hideTooltip}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={8}
                className="fill-brand-600 stroke-brand-700"
                strokeWidth={1}
              />
            <text
            x={NODE_WIDTH / 2}
            y={NODE_HEIGHT / 2 - 6}
            textAnchor="middle"
            className="fill-white text-xs font-semibold"
          >
            {tree.path === '/' ? 'Home' : shortenPath(tree.path, 12)}
          </text>
          <text
            x={NODE_WIDTH / 2}
            y={NODE_HEIGHT / 2 + 8}
            textAnchor="middle"
            className="fill-white/90 text-[10px]"
          >
            {tree.sessions.toLocaleString()} sessions
          </text>
        </g>
        {/* Level 1 */}
        {level1.map((node, i) => {
          const tooltipText = `${node.path} — ${node.sessions.toLocaleString()} sessions`;
          return (
          <g
            key={node.path}
            transform={`translate(${level1Xs[i] - NODE_WIDTH / 2}, ${LEVEL1_Y})`}
            onMouseEnter={(e) => showTooltip(tooltipText, e)}
            onMouseMove={moveTooltip}
            onMouseLeave={hideTooltip}
            style={{ cursor: 'pointer' }}
          >
            <rect
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={8}
              className="fill-brand-100 stroke-brand-300"
              strokeWidth={1}
            />
            <text
              x={NODE_WIDTH / 2}
              y={NODE_HEIGHT / 2 - 6}
              textAnchor="middle"
              className="fill-navy-800 text-[11px] font-medium"
            >
              {shortenPath(node.path)}
            </text>
            <text
              x={NODE_WIDTH / 2}
              y={NODE_HEIGHT / 2 + 8}
              textAnchor="middle"
              className="fill-slate-600 text-[10px]"
            >
              {node.sessions.toLocaleString()}
            </text>
          </g>
          );
        })}
        {/* Level 2 */}
        {level1.map((node, i) => {
          const kids = node.children ?? [];
          const rowWidth = kids.length * NODE_WIDTH + (kids.length - 1) * H_GAP;
          const startX = level1Xs[i] - rowWidth / 2;
          return kids.map((child, j) => {
            const cx = startX + NODE_WIDTH / 2 + j * (NODE_WIDTH + H_GAP);
            const childTooltip = `${child.path} — ${child.sessions.toLocaleString()} sessions`;
            return (
              <g
                key={`${node.path}-${child.path}`}
                transform={`translate(${cx - NODE_WIDTH / 2}, ${LEVEL2_Y})`}
                onMouseEnter={(e) => showTooltip(childTooltip, e)}
                onMouseMove={moveTooltip}
                onMouseLeave={hideTooltip}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  className="fill-stone-100 stroke-stone-200"
                  strokeWidth={1}
                />
                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2 - 6}
                  textAnchor="middle"
                  className="fill-slate-700 text-[10px]"
                >
                  {shortenPath(child.path)}
                </text>
                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2 + 8}
                  textAnchor="middle"
                  className="fill-slate-500 text-[9px]"
                >
                  {child.sessions.toLocaleString()}
                </text>
              </g>
            );
          });
        })}
        {/* Level 3 */}
        {level1.map((node, i) => {
          const kids = node.children ?? [];
          const rowWidth = kids.length * NODE_WIDTH + (kids.length - 1) * H_GAP;
          const startX = level1Xs[i] - rowWidth / 2;
          return kids.map((child, j) => {
            const cx2 = startX + NODE_WIDTH / 2 + j * (NODE_WIDTH + H_GAP);
            const grandkids = child.children ?? [];
            const l3RowWidth = grandkids.length * NODE_WIDTH + (grandkids.length - 1) * H_GAP;
            const l3StartX = cx2 - l3RowWidth / 2;
            return grandkids.map((grandchild, k) => {
              const cx3 = l3StartX + NODE_WIDTH / 2 + k * (NODE_WIDTH + H_GAP);
              const grandchildTooltip = `${grandchild.path} — ${grandchild.sessions.toLocaleString()} sessions`;
              return (
                <g
                  key={`${node.path}-${child.path}-${grandchild.path}`}
                  transform={`translate(${cx3 - NODE_WIDTH / 2}, ${LEVEL3_Y})`}
                  onMouseEnter={(e) => showTooltip(grandchildTooltip, e)}
                  onMouseMove={moveTooltip}
                  onMouseLeave={hideTooltip}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={6}
                    className="fill-stone-50 stroke-stone-200"
                    strokeWidth={1}
                  />
                  <text
                    x={NODE_WIDTH / 2}
                    y={NODE_HEIGHT / 2 - 6}
                    textAnchor="middle"
                    className="fill-slate-600 text-[10px]"
                  >
                    {shortenPath(grandchild.path)}
                  </text>
                  <text
                    x={NODE_WIDTH / 2}
                    y={NODE_HEIGHT / 2 + 8}
                    textAnchor="middle"
                    className="fill-slate-400 text-[9px]"
                  >
                    {grandchild.sessions.toLocaleString()}
                  </text>
                </g>
              );
            });
          });
        })}
      </svg>
        </div>
      </div>
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y + 8 }}
        >
          {tooltip.text}
        </div>
      )}
      <p className="mt-3 text-center text-xs text-slate-400">
        Hover over any node to see the full path and session count. Scroll horizontally to see all nodes.
      </p>
      {dataSource && (
        <p className="absolute bottom-2 right-4 text-right text-[10px] text-slate-400">
          Data source: {dataSource === 'ga4' ? 'Live (GA4)' : 'Sample data'}
        </p>
      )}
    </div>
  );
}

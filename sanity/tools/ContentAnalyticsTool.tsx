'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Inline,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
  TextInput,
  Tooltip,
} from '@sanity/ui';

/* ------------------------------------------------------------------ */
/*                         Response shapes                             */
/* ------------------------------------------------------------------ */

type ContentKind = 'blog' | 'project';
type SeoIssueSeverity = 'error' | 'warn';
interface SeoIssue {
  code: string;
  severity: SeoIssueSeverity;
  message: string;
}

interface ContentAnalyticsRow {
  id: string;
  kind: ContentKind;
  pagePath: string;
  title: string;
  categoryTitle: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  views: number;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number | null;
  seoScore: number;
  seoIssues: SeoIssue[];
  indexed: boolean | null;
  coverageState: string | null;
  lastCrawlTime: string | null;
}

interface OrphanRow {
  pagePath: string;
  views: number;
  kind: ContentKind;
}

interface ContentAnalyticsResponse {
  blogs: ContentAnalyticsRow[];
  projects: ContentAnalyticsRow[];
  orphans: OrphanRow[];
  meta: {
    days: number;
    viewsSource: 'ga4' | 'mock' | 'none';
    gscEnabled: boolean;
    gscError?: string;
  };
}

interface InspectResponse {
  results: Array<{
    pagePath: string;
    indexed: boolean | null;
    coverageState: string | null;
    lastCrawlTime: string | null;
    error?: string;
  }>;
  successCount: number;
  errorCount: number;
}

/* ------------------------------------------------------------------ */
/*                           Constants                                 */
/* ------------------------------------------------------------------ */

type DateRange = 7 | 30 | 90;
type TabId = 'blogs' | 'projects' | 'orphans';
type FilterMode = 'all' | 'zero-views' | 'not-indexed' | 'low-ctr' | 'has-issues';
type SortMode =
  | 'views-desc'
  | 'impressions-desc'
  | 'ctr-desc'
  | 'position-asc'
  | 'seo-desc'
  | 'seo-asc'
  | 'recent'
  | 'oldest';

const DATE_RANGES: DateRange[] = [7, 30, 90];

/** Max rows shown per page in any of the three tabs. Long tail of low-traffic
 *  posts can otherwise turn the table into a 5+ screen scroll. */
const PAGE_SIZE = 20;

const FILTER_LABELS: Record<FilterMode, string> = {
  all: 'All',
  'zero-views': '0 views only',
  'not-indexed': 'Not indexed',
  'low-ctr': 'Low CTR (<1%)',
  'has-issues': 'SEO issues',
};

const SORT_LABELS: Record<SortMode, string> = {
  'views-desc': 'Most views',
  'impressions-desc': 'Most impressions',
  'ctr-desc': 'Best CTR',
  'position-asc': 'Best position',
  'seo-desc': 'Best SEO score',
  'seo-asc': 'Worst SEO score',
  recent: 'Recently updated',
  oldest: 'Oldest first',
};

/* ------------------------------------------------------------------ */
/*                             Component                               */
/* ------------------------------------------------------------------ */

export function ContentAnalyticsTool() {
  const [data, setData] = useState<ContentAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [days, setDays] = useState<DateRange>(30);
  const [activeTab, setActiveTab] = useState<TabId>('blogs');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('views-desc');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 1-indexed page number for the active tab's table. Reset to 1 whenever
  // the visible row set changes (tab / filter / sort / search / range).
  const [page, setPage] = useState(1);

  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspectProgress, setInspectProgress] = useState<{ done: number; total: number } | null>(
    null
  );

  /* ----- fetch main data ----- */
  const fetchData = useCallback(async (rangeDays: DateRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/content-views?days=${rangeDays}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json: ContentAnalyticsResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  /* ----- run URL Inspection in batches ----- */
  const checkIndexation = useCallback(async () => {
    if (!data || inspecting) return;
    if (!data.meta.gscEnabled) {
      setInspectError(
        data.meta.gscError ||
          'Google Search Console is not configured. Set GSC_SITE_URL and add the service account as a User on the property.'
      );
      return;
    }

    setInspecting(true);
    setInspectError(null);

    const allRows: ContentAnalyticsRow[] = [...data.blogs, ...data.projects];
    const paths = allRows.map((r) => r.pagePath);
    const BATCH = 20;
    setInspectProgress({ done: 0, total: paths.length });

    const allResults = new Map<string, InspectResponse['results'][number]>();

    try {
      for (let i = 0; i < paths.length; i += BATCH) {
        const slice = paths.slice(i, i + BATCH);
        const res = await fetch('/api/admin/analytics/content-views/inspect', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ paths: slice }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || `HTTP ${res.status}`);
        }
        const json: InspectResponse = await res.json();
        for (const r of json.results) allResults.set(r.pagePath, r);
        setInspectProgress({ done: Math.min(i + BATCH, paths.length), total: paths.length });
      }

      // Merge into local state without refetching everything.
      setData((prev) => {
        if (!prev) return prev;
        const apply = (rows: ContentAnalyticsRow[]): ContentAnalyticsRow[] =>
          rows.map((row) => {
            const r = allResults.get(row.pagePath);
            if (!r) return row;
            return {
              ...row,
              indexed: r.indexed,
              coverageState: r.coverageState,
              lastCrawlTime: r.lastCrawlTime,
            };
          });
        return { ...prev, blogs: apply(prev.blogs), projects: apply(prev.projects) };
      });
    } catch (err) {
      setInspectError(err instanceof Error ? err.message : 'Inspection failed');
    } finally {
      setInspecting(false);
      setInspectProgress(null);
    }
  }, [data, inspecting]);

  /* ----- derived view ----- */
  const allRows: ContentAnalyticsRow[] =
    activeTab === 'blogs' ? data?.blogs ?? [] : activeTab === 'projects' ? data?.projects ?? [] : [];

  const filteredRows = useMemo(() => {
    let rows = allRows;
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) => r.title.toLowerCase().includes(q) || r.pagePath.toLowerCase().includes(q)
      );
    }
    switch (filter) {
      case 'zero-views':
        rows = rows.filter((r) => r.views === 0);
        break;
      case 'not-indexed':
        rows = rows.filter((r) => r.indexed === false);
        break;
      case 'low-ctr':
        rows = rows.filter((r) => r.impressions >= 50 && r.ctr < 0.01);
        break;
      case 'has-issues':
        rows = rows.filter((r) => r.seoIssues.length > 0);
        break;
    }
    const sorted = [...rows].sort((a, b) => {
      switch (sort) {
        case 'views-desc':
          return b.views - a.views;
        case 'impressions-desc':
          return b.impressions - a.impressions;
        case 'ctr-desc':
          return b.ctr - a.ctr;
        case 'position-asc':
          if (a.position == null && b.position == null) return 0;
          if (a.position == null) return 1;
          if (b.position == null) return -1;
          return a.position - b.position;
        case 'seo-desc':
          return b.seoScore - a.seoScore;
        case 'seo-asc':
          return a.seoScore - b.seoScore;
        case 'recent':
          return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
        case 'oldest':
          return new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime();
        default:
          return 0;
      }
    });
    return sorted;
  }, [allRows, filter, sort, search]);

  /* ----- pagination ----- */
  // The orphans tab uses its own row source (data.orphans), and isn't
  // filterable, but it can also be long — paginate it with the same page state.
  const paginatedSource: ContentAnalyticsRow[] | OrphanRow[] =
    activeTab === 'orphans' ? data?.orphans ?? [] : filteredRows;

  const totalCount = paginatedSource.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Reset to page 1 whenever the visible row set could shift under the user's
  // feet — switching tabs, changing filters, sort, search, or date range.
  useEffect(() => {
    setPage(1);
  }, [activeTab, filter, sort, search, days]);

  // Defensive clamp: if the page count shrank (e.g. after applying a filter
  // that nukes most rows), pull `page` back into range so the table doesn't
  // render empty.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedContentRows = useMemo(() => {
    if (activeTab === 'orphans') return [];
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [activeTab, filteredRows, page]);

  const pagedOrphanRows = useMemo(() => {
    if (activeTab !== 'orphans') return [];
    const start = (page - 1) * PAGE_SIZE;
    return (data?.orphans ?? []).slice(start, start + PAGE_SIZE);
  }, [activeTab, data, page]);

  /* ----- summary stats ----- */
  const summary = useMemo(() => {
    const rows = activeTab === 'blogs' ? data?.blogs ?? [] : data?.projects ?? [];
    const totalViews = rows.reduce((s, r) => s + r.views, 0);
    const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
    const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
    const zeroViews = rows.filter((r) => r.views === 0).length;
    const indexed = rows.filter((r) => r.indexed === true).length;
    const notIndexed = rows.filter((r) => r.indexed === false).length;
    const issues = rows.filter((r) => r.seoIssues.length > 0).length;
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    return {
      total: rows.length,
      totalViews,
      totalImpressions,
      totalClicks,
      avgCtr,
      zeroViews,
      indexed,
      notIndexed,
      issues,
    };
  }, [data, activeTab]);

  /* ----- render ----- */
  return (
    <Box padding={4} style={{ maxWidth: 1280, margin: '0 auto' }}>
      <Stack space={4}>
        <HeaderBar
          days={days}
          onDaysChange={setDays}
          source={data?.meta.viewsSource ?? null}
          gscEnabled={data?.meta.gscEnabled ?? false}
          gscError={data?.meta.gscError}
          inspecting={inspecting}
          inspectProgress={inspectProgress}
          onCheckIndexation={checkIndexation}
        />

        {inspectError && (
          <Card padding={3} tone="critical" radius={2}>
            <Text size={1}>{inspectError}</Text>
          </Card>
        )}

        {data && activeTab !== 'orphans' && <SummaryCards summary={summary} />}

        <TabList space={1}>
          <Tab
            id="blogs-tab"
            aria-controls="blogs-panel"
            label={`Blog Posts (${data?.blogs.length ?? 0})`}
            selected={activeTab === 'blogs'}
            onClick={() => setActiveTab('blogs')}
          />
          <Tab
            id="projects-tab"
            aria-controls="projects-panel"
            label={`Portfolio (${data?.projects.length ?? 0})`}
            selected={activeTab === 'projects'}
            onClick={() => setActiveTab('projects')}
          />
          <Tab
            id="orphans-tab"
            aria-controls="orphans-panel"
            label={`Orphan URLs (${data?.orphans.length ?? 0})`}
            selected={activeTab === 'orphans'}
            onClick={() => setActiveTab('orphans')}
          />
        </TabList>

        {loading ? (
          <Card padding={5} tone="transparent">
            <Flex align="center" justify="center" gap={3}>
              <Spinner muted />
              <Text muted>Loading analytics…</Text>
            </Flex>
          </Card>
        ) : error ? (
          <Card padding={4} tone="critical" radius={2}>
            <Text>{error}</Text>
          </Card>
        ) : (
          <>
            {activeTab !== 'orphans' && (
              <FilterBar
                filter={filter}
                onFilterChange={setFilter}
                sort={sort}
                onSortChange={setSort}
                search={search}
                onSearchChange={setSearch}
                visibleCount={filteredRows.length}
                totalCount={allRows.length}
              />
            )}

            <TabPanel
              id="blogs-panel"
              aria-labelledby="blogs-tab"
              hidden={activeTab !== 'blogs'}
            >
              {activeTab === 'blogs' && (
                <Stack space={3}>
                  <ContentTable
                    rows={pagedContentRows}
                    expandedId={expandedId}
                    onToggleExpand={(id) => setExpandedId((cur) => (cur === id ? null : id))}
                  />
                  <Pagination
                    page={page}
                    totalCount={totalCount}
                    onPageChange={setPage}
                  />
                </Stack>
              )}
            </TabPanel>
            <TabPanel
              id="projects-panel"
              aria-labelledby="projects-tab"
              hidden={activeTab !== 'projects'}
            >
              {activeTab === 'projects' && (
                <Stack space={3}>
                  <ContentTable
                    rows={pagedContentRows}
                    expandedId={expandedId}
                    onToggleExpand={(id) => setExpandedId((cur) => (cur === id ? null : id))}
                  />
                  <Pagination
                    page={page}
                    totalCount={totalCount}
                    onPageChange={setPage}
                  />
                </Stack>
              )}
            </TabPanel>
            <TabPanel
              id="orphans-panel"
              aria-labelledby="orphans-tab"
              hidden={activeTab !== 'orphans'}
            >
              {activeTab === 'orphans' && (
                <Stack space={3}>
                  <OrphanTable rows={pagedOrphanRows} />
                  <Pagination
                    page={page}
                    totalCount={totalCount}
                    onPageChange={setPage}
                  />
                </Stack>
              )}
            </TabPanel>
          </>
        )}
      </Stack>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*                            Sub-components                           */
/* ------------------------------------------------------------------ */

function HeaderBar(props: {
  days: DateRange;
  onDaysChange: (d: DateRange) => void;
  source: 'ga4' | 'mock' | 'none' | null;
  gscEnabled: boolean;
  gscError?: string;
  inspecting: boolean;
  inspectProgress: { done: number; total: number } | null;
  onCheckIndexation: () => void;
}) {
  const sourceTone =
    props.source === 'ga4' ? 'positive' : props.source === 'mock' ? 'caution' : 'critical';
  const sourceLabel =
    props.source === 'ga4'
      ? 'GA4 connected'
      : props.source === 'mock'
        ? 'Mock data'
        : props.source === 'none'
          ? 'GA4 unavailable'
          : '…';

  return (
    <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
      <Stack space={2}>
        <Heading as="h1" size={3}>
          Content Analytics
        </Heading>
        <Inline space={2}>
          <Badge tone={sourceTone} mode="outline" fontSize={1}>
            {sourceLabel}
          </Badge>
          <Tooltip
            content={
              <Box padding={2} style={{ maxWidth: 280 }}>
                <Text size={1}>
                  {props.gscEnabled
                    ? 'Search Console: impressions/clicks/CTR/position from organic search.'
                    : props.gscError ?? 'Search Console not configured.'}
                </Text>
              </Box>
            }
          >
            <Badge
              tone={props.gscEnabled ? 'positive' : 'default'}
              mode="outline"
              fontSize={1}
            >
              {props.gscEnabled ? 'Search Console connected' : 'Search Console off'}
            </Badge>
          </Tooltip>
        </Inline>
      </Stack>

      <Flex gap={2} align="center" wrap="wrap">
        <Inline space={1}>
          {DATE_RANGES.map((range) => (
            <Button
              key={range}
              text={`${range}d`}
              mode={props.days === range ? 'default' : 'ghost'}
              tone={props.days === range ? 'primary' : 'default'}
              onClick={() => props.onDaysChange(range)}
              fontSize={1}
              padding={2}
            />
          ))}
        </Inline>

        <Button
          text={
            props.inspecting && props.inspectProgress
              ? `Checking ${props.inspectProgress.done}/${props.inspectProgress.total}…`
              : 'Check indexation'
          }
          tone="primary"
          mode="ghost"
          fontSize={1}
          padding={2}
          disabled={props.inspecting || !props.gscEnabled}
          onClick={props.onCheckIndexation}
        />
      </Flex>
    </Flex>
  );
}

function SummaryCards({
  summary,
}: {
  summary: {
    total: number;
    totalViews: number;
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    zeroViews: number;
    indexed: number;
    notIndexed: number;
    issues: number;
  };
}) {
  const indexationKnown = summary.indexed + summary.notIndexed;
  const indexationLabel =
    indexationKnown > 0
      ? `${summary.indexed}/${summary.total} indexed${summary.notIndexed > 0 ? ` · ${summary.notIndexed} not` : ''}`
      : 'Run "Check indexation"';

  const cards: Array<{ label: string; value: string; sub?: string; tone?: 'positive' | 'caution' | 'critical' | 'default' }> = [
    {
      label: 'Published',
      value: summary.total.toLocaleString(),
      sub: `${summary.zeroViews} with 0 views`,
      tone: summary.zeroViews > 0 ? 'caution' : 'default',
    },
    {
      label: 'Indexation',
      value: indexationLabel,
      tone: summary.notIndexed > 0 ? 'critical' : 'default',
    },
    {
      label: 'Page views (GA4)',
      value: summary.totalViews.toLocaleString(),
    },
    {
      label: 'Impressions (GSC)',
      value: summary.totalImpressions.toLocaleString(),
      sub: `${summary.totalClicks.toLocaleString()} clicks · ${(summary.avgCtr * 100).toFixed(2)}% CTR`,
    },
    {
      label: 'SEO issues',
      value: summary.issues.toLocaleString(),
      tone: summary.issues > 0 ? 'caution' : 'positive',
    },
  ];

  return (
    <Flex gap={3} wrap="wrap">
      {cards.map((card) => (
        <Card
          key={card.label}
          padding={3}
          radius={2}
          shadow={1}
          tone={card.tone === 'default' || !card.tone ? 'transparent' : card.tone}
          style={{ flex: '1 1 180px', minWidth: 160 }}
        >
          <Stack space={2}>
            <Text size={1} muted style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {card.label}
            </Text>
            <Text size={3} weight="semibold">
              {card.value}
            </Text>
            {card.sub && (
              <Text size={1} muted>
                {card.sub}
              </Text>
            )}
          </Stack>
        </Card>
      ))}
    </Flex>
  );
}

function FilterBar(props: {
  filter: FilterMode;
  onFilterChange: (f: FilterMode) => void;
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
  search: string;
  onSearchChange: (s: string) => void;
  visibleCount: number;
  totalCount: number;
}) {
  return (
    <Flex gap={2} align="center" wrap="wrap">
      <Box style={{ flex: '1 1 240px', minWidth: 200 }}>
        <TextInput
          value={props.search}
          onChange={(e) => props.onSearchChange(e.currentTarget.value)}
          placeholder="Search title or path…"
          fontSize={1}
        />
      </Box>
      <Select
        value={props.filter}
        onChange={(e) => props.onFilterChange(e.currentTarget.value as FilterMode)}
        fontSize={1}
        padding={2}
      >
        {(Object.keys(FILTER_LABELS) as FilterMode[]).map((k) => (
          <option key={k} value={k}>
            {FILTER_LABELS[k]}
          </option>
        ))}
      </Select>
      <Select
        value={props.sort}
        onChange={(e) => props.onSortChange(e.currentTarget.value as SortMode)}
        fontSize={1}
        padding={2}
      >
        {(Object.keys(SORT_LABELS) as SortMode[]).map((k) => (
          <option key={k} value={k}>
            Sort: {SORT_LABELS[k]}
          </option>
        ))}
      </Select>
      <Text size={1} muted>
        {props.visibleCount} of {props.totalCount}
      </Text>
    </Flex>
  );
}

/**
 * Pagination control rendered below tables. Hidden when there's only one
 * page so it doesn't add visual noise on small datasets.
 *
 * UX notes:
 *   - Shows "Showing 21–40 of 87" so the editor always has context for what
 *     they're looking at.
 *   - Compact First / Prev / Next / Last buttons (no numbered jump-list,
 *     since 20 per page on a few hundred items is at most ~10 pages —
 *     numbered links wouldn't fit cleanly inside the Studio's panel width).
 *   - Each disabled at the corresponding edge so we never end up on an
 *     out-of-range page.
 */
function Pagination({
  page,
  totalCount,
  onPageChange,
}: {
  page: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  if (totalCount <= PAGE_SIZE) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.max(1, Math.min(totalPages, page));
  const startIdx = (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, totalCount);

  const goTo = (next: number) =>
    onPageChange(Math.max(1, Math.min(totalPages, next)));

  const atFirst = safePage <= 1;
  const atLast = safePage >= totalPages;

  return (
    <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
      <Text size={1} muted>
        Showing {startIdx.toLocaleString()}–{endIdx.toLocaleString()} of{' '}
        {totalCount.toLocaleString()}
      </Text>
      <Inline space={1}>
        <Button
          text="« First"
          mode="ghost"
          fontSize={1}
          padding={2}
          disabled={atFirst}
          onClick={() => goTo(1)}
        />
        <Button
          text="‹ Prev"
          mode="ghost"
          fontSize={1}
          padding={2}
          disabled={atFirst}
          onClick={() => goTo(safePage - 1)}
        />
        <Box paddingX={2} style={{ alignSelf: 'center' }}>
          <Text size={1}>
            Page {safePage} of {totalPages}
          </Text>
        </Box>
        <Button
          text="Next ›"
          mode="ghost"
          fontSize={1}
          padding={2}
          disabled={atLast}
          onClick={() => goTo(safePage + 1)}
        />
        <Button
          text="Last »"
          mode="ghost"
          fontSize={1}
          padding={2}
          disabled={atLast}
          onClick={() => goTo(totalPages)}
        />
      </Inline>
    </Flex>
  );
}

function ContentTable({
  rows,
  expandedId,
  onToggleExpand,
}: {
  rows: ContentAnalyticsRow[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <Card padding={4} tone="transparent" radius={2}>
        <Text muted align="center">
          No items match the current filter.
        </Text>
      </Card>
    );
  }

  return (
    <Card radius={2} shadow={1} overflow="auto">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th style={{ width: 36 }} />
            <Th>Title</Th>
            <Th style={{ width: 110 }}>Index</Th>
            <Th style={{ width: 80, textAlign: 'right' }}>SEO</Th>
            <Th style={{ width: 80, textAlign: 'right' }}>Views</Th>
            <Th style={{ width: 100, textAlign: 'right' }}>Impressions</Th>
            <Th style={{ width: 70, textAlign: 'right' }}>Clicks</Th>
            <Th style={{ width: 70, textAlign: 'right' }}>CTR</Th>
            <Th style={{ width: 70, textAlign: 'right' }}>Pos.</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row
              key={row.id}
              row={row}
              expanded={expandedId === row.id}
              onToggle={() => onToggleExpand(row.id)}
            />
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Row({
  row,
  expanded,
  onToggle,
}: {
  row: ContentAnalyticsRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasIssues = row.seoIssues.length > 0;
  return (
    <>
      <tr
        style={{ cursor: 'pointer' }}
        onClick={onToggle}
        title={expanded ? 'Click to collapse' : 'Click to expand SEO details'}
      >
        <Td style={{ width: 36, textAlign: 'center' }}>
          <Text size={1} muted>
            {expanded ? '▾' : '▸'}
          </Text>
        </Td>
        <Td>
          <Stack space={1}>
            <Text size={1} weight="medium" textOverflow="ellipsis">
              {row.title}
            </Text>
            <Text size={0} muted textOverflow="ellipsis">
              {row.pagePath}
              {row.categoryTitle ? ` · ${row.categoryTitle}` : ''}
            </Text>
          </Stack>
        </Td>
        <Td style={{ width: 110 }}>
          <IndexBadge row={row} />
        </Td>
        <Td style={{ width: 80, textAlign: 'right' }}>
          <SeoBadge score={row.seoScore} hasIssues={hasIssues} />
        </Td>
        <Td style={{ width: 80, textAlign: 'right' }}>
          <Text size={1} weight={row.views === 0 ? 'regular' : 'semibold'} muted={row.views === 0}>
            {row.views.toLocaleString()}
          </Text>
        </Td>
        <Td style={{ width: 100, textAlign: 'right' }}>
          <Text size={1} muted={row.impressions === 0}>
            {row.impressions.toLocaleString()}
          </Text>
        </Td>
        <Td style={{ width: 70, textAlign: 'right' }}>
          <Text size={1} muted={row.clicks === 0}>
            {row.clicks.toLocaleString()}
          </Text>
        </Td>
        <Td style={{ width: 70, textAlign: 'right' }}>
          <Text size={1} muted={row.impressions === 0}>
            {row.impressions > 0 ? `${(row.ctr * 100).toFixed(2)}%` : '—'}
          </Text>
        </Td>
        <Td style={{ width: 70, textAlign: 'right' }}>
          <Text size={1} muted={row.position == null}>
            {row.position != null ? row.position.toFixed(1) : '—'}
          </Text>
        </Td>
      </tr>
      {expanded && (
        <tr>
          <Td colSpan={9} style={{ background: 'var(--card-bg2-color, transparent)' }}>
            <ExpandedDetails row={row} />
          </Td>
        </tr>
      )}
    </>
  );
}

function IndexBadge({ row }: { row: ContentAnalyticsRow }) {
  if (row.indexed === null) {
    return (
      <Badge tone="default" mode="outline" fontSize={1}>
        Unknown
      </Badge>
    );
  }
  return (
    <Tooltip
      content={
        <Box padding={2} style={{ maxWidth: 280 }}>
          <Stack space={1}>
            <Text size={1} weight="semibold">
              {row.coverageState ?? (row.indexed ? 'Indexed' : 'Not indexed')}
            </Text>
            {row.lastCrawlTime && (
              <Text size={0} muted>
                Last crawled {formatRelativeTime(row.lastCrawlTime)}
              </Text>
            )}
          </Stack>
        </Box>
      }
    >
      <Badge
        tone={row.indexed ? 'positive' : 'critical'}
        mode={row.indexed ? 'outline' : 'default'}
        fontSize={1}
      >
        {row.indexed ? 'Indexed' : 'Not indexed'}
      </Badge>
    </Tooltip>
  );
}

function SeoBadge({ score, hasIssues }: { score: number; hasIssues: boolean }) {
  const tone: 'positive' | 'caution' | 'critical' =
    score >= 90 ? 'positive' : score >= 70 ? 'caution' : 'critical';
  return (
    <Badge tone={tone} mode={hasIssues ? 'default' : 'outline'} fontSize={1}>
      {score}
    </Badge>
  );
}

function ExpandedDetails({ row }: { row: ContentAnalyticsRow }) {
  const inferredFromImp =
    row.impressions > 0 && row.clicks === 0 && row.ctr === 0
      ? 'Page is shown in SERP but never clicked – improve title/description.'
      : null;
  const inferredOrphan =
    row.impressions === 0 && row.views === 0
      ? 'No GA4 visits and no GSC impressions – Google likely cannot find this page yet.'
      : null;
  const inferredCannibal =
    row.impressions > 100 && row.position && row.position > 20
      ? 'Page ranks beyond page 2 – consider improving on-page SEO or internal links.'
      : null;
  const insights = [inferredFromImp, inferredOrphan, inferredCannibal].filter(Boolean) as string[];

  return (
    <Box padding={3}>
      <Stack space={3}>
        <Inline space={3}>
          <DetailItem
            label="Published"
            value={row.publishedAt ? new Date(row.publishedAt).toLocaleDateString() : '—'}
          />
          <DetailItem
            label="Updated"
            value={row.updatedAt ? formatRelativeTime(row.updatedAt) : '—'}
          />
          {row.lastCrawlTime && (
            <DetailItem label="Last crawled" value={formatRelativeTime(row.lastCrawlTime)} />
          )}
          {row.coverageState && <DetailItem label="Coverage" value={row.coverageState} />}
        </Inline>

        {insights.length > 0 && (
          <Card padding={3} radius={2} tone="primary">
            <Stack space={2}>
              <Text size={1} weight="semibold">
                Insights
              </Text>
              {insights.map((line, i) => (
                <Text key={i} size={1}>
                  • {line}
                </Text>
              ))}
            </Stack>
          </Card>
        )}

        {row.seoIssues.length > 0 ? (
          <Stack space={2}>
            <Text size={1} weight="semibold">
              SEO checklist
            </Text>
            {row.seoIssues.map((issue) => (
              <Inline key={issue.code} space={2}>
                <Badge
                  tone={issue.severity === 'error' ? 'critical' : 'caution'}
                  mode="outline"
                  fontSize={1}
                >
                  {issue.severity === 'error' ? 'Fix' : 'Improve'}
                </Badge>
                <Text size={1}>{issue.message}</Text>
              </Inline>
            ))}
          </Stack>
        ) : (
          <Text size={1} muted>
            No SEO issues detected from Sanity fields. ✓
          </Text>
        )}

        <Inline space={2}>
          <a
            href={row.pagePath}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--card-link-color)' }}
          >
            Open page →
          </a>
          <a
            href={`https://search.google.com/search-console/inspect?id=${encodeURIComponent(
              (typeof window !== 'undefined' ? window.location.origin : '') + row.pagePath
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--card-link-color)' }}
          >
            Open in Search Console →
          </a>
        </Inline>
      </Stack>
    </Box>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Stack space={1}>
      <Text size={0} muted style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Text>
      <Text size={1}>{value}</Text>
    </Stack>
  );
}

function OrphanTable({ rows }: { rows: OrphanRow[] }) {
  if (rows.length === 0) {
    return (
      <Card padding={4} tone="transparent" radius={2}>
        <Text muted align="center">
          No orphan URLs — every GA4 path matches a current Sanity slug.
        </Text>
      </Card>
    );
  }
  return (
    <Stack space={3}>
      <Card padding={3} tone="caution" radius={2}>
        <Text size={1}>
          These URLs got traffic in GA4 but don&apos;t match any current Sanity slug. Likely
          renamed/deleted content — set up 301 redirects to avoid losing SEO equity.
        </Text>
      </Card>
      <Card radius={2} shadow={1} overflow="auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>Path</Th>
              <Th style={{ width: 100 }}>Type</Th>
              <Th style={{ width: 100, textAlign: 'right' }}>Views</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.pagePath}>
                <Td>
                  <Text size={1}>{row.pagePath}</Text>
                </Td>
                <Td style={{ width: 100 }}>
                  <Badge tone="default" mode="outline" fontSize={1}>
                    {row.kind === 'blog' ? 'Blog' : 'Project'}
                  </Badge>
                </Td>
                <Td style={{ width: 100, textAlign: 'right' }}>
                  <Text size={1} weight="semibold">
                    {row.views.toLocaleString()}
                  </Text>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/*                              Helpers                                */
/* ------------------------------------------------------------------ */

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  if (diff < 0) return new Date(iso).toLocaleDateString();
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ------------------------------------------------------------------ */
/*                          Table primitives                           */
/* ------------------------------------------------------------------ */

const cellStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--card-border-color, #e0e0e0)',
  verticalAlign: 'top',
};

function Th({ children, style, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      style={{
        ...cellStyle,
        textAlign: 'left',
        fontWeight: 600,
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--card-muted-fg-color, #666)',
        background: 'var(--card-bg2-color, transparent)',
        position: 'sticky',
        top: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </th>
  );
}

function Td({ children, style, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td style={{ ...cellStyle, ...style }} {...rest}>
      {children}
    </td>
  );
}

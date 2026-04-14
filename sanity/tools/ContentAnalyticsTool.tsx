'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Card,
  Flex,
  Stack,
  Text,
  Heading,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  Button,
} from '@sanity/ui';

interface ContentViewRow {
  pagePath: string;
  pageTitle?: string;
  views: number;
}

type DateRange = 7 | 30 | 90;
type ContentTab = 'blogs' | 'projects';

export function ContentAnalyticsTool() {
  const [blogs, setBlogs] = useState<ContentViewRow[]>([]);
  const [projects, setProjects] = useState<ContentViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'ga4' | 'mock' | null>(null);
  const [days, setDays] = useState<DateRange>(30);
  const [activeTab, setActiveTab] = useState<ContentTab>('blogs');

  const fetchData = useCallback(async (rangeDays: DateRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/content-views?days=${rangeDays}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setBlogs(data.blogs ?? []);
      setProjects(data.projects ?? []);
      setSource(data.source ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  const handleRangeChange = (range: DateRange) => {
    setDays(range);
  };

  const activeData = activeTab === 'blogs' ? blogs : projects;

  return (
    <Box padding={4} style={{ maxWidth: 960, margin: '0 auto' }}>
      <Stack space={4}>
        {/* Header */}
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Stack space={2}>
            <Heading as="h1" size={3}>
              Content Analytics
            </Heading>
            <Text size={1} muted>
              Page views from Google Analytics
              {source === 'mock' && ' (sample data — GA4 not configured)'}
            </Text>
          </Stack>

          {/* Date range selector */}
          <Flex gap={2}>
            {([7, 30, 90] as DateRange[]).map((range) => (
              <Button
                key={range}
                text={`${range}d`}
                mode={days === range ? 'default' : 'ghost'}
                tone={days === range ? 'primary' : 'default'}
                onClick={() => handleRangeChange(range)}
                fontSize={1}
                padding={2}
              />
            ))}
          </Flex>
        </Flex>

        {/* Tabs */}
        <TabList space={1}>
          <Tab
            id="blogs-tab"
            aria-controls="blogs-panel"
            label={`Blog Posts (${blogs.length})`}
            selected={activeTab === 'blogs'}
            onClick={() => setActiveTab('blogs')}
          />
          <Tab
            id="projects-tab"
            aria-controls="projects-panel"
            label={`Portfolio Projects (${projects.length})`}
            selected={activeTab === 'projects'}
            onClick={() => setActiveTab('projects')}
          />
        </TabList>

        {/* Content */}
        {loading ? (
          <Card padding={5} tone="transparent">
            <Flex align="center" justify="center" gap={3}>
              <Spinner muted />
              <Text muted>Loading analytics...</Text>
            </Flex>
          </Card>
        ) : error ? (
          <Card padding={4} tone="critical" radius={2}>
            <Text>{error}</Text>
          </Card>
        ) : (
          <>
            <TabPanel id="blogs-panel" aria-labelledby="blogs-tab" hidden={activeTab !== 'blogs'}>
              <ViewsTable rows={activeTab === 'blogs' ? activeData : []} />
            </TabPanel>
            <TabPanel id="projects-panel" aria-labelledby="projects-tab" hidden={activeTab !== 'projects'}>
              <ViewsTable rows={activeTab === 'projects' ? activeData : []} />
            </TabPanel>
          </>
        )}
      </Stack>
    </Box>
  );
}

function ViewsTable({ rows }: { rows: ContentViewRow[] }) {
  if (rows.length === 0) {
    return (
      <Card padding={4} tone="transparent" radius={2}>
        <Text muted align="center">No data available for this period.</Text>
      </Card>
    );
  }

  return (
    <Card radius={2} shadow={1} overflow="auto">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th style={{ width: 48, textAlign: 'center' }}>#</Th>
            <Th>Title</Th>
            <Th>Path</Th>
            <Th style={{ width: 100, textAlign: 'right' }}>Views</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.pagePath}>
              <Td style={{ textAlign: 'center' }}>
                <Text size={1} muted>{i + 1}</Text>
              </Td>
              <Td>
                <Text size={1} weight="medium" textOverflow="ellipsis">
                  {cleanTitle(row.pageTitle, row.pagePath)}
                </Text>
              </Td>
              <Td>
                <Text size={1} muted textOverflow="ellipsis">
                  {row.pagePath}
                </Text>
              </Td>
              <Td style={{ textAlign: 'right' }}>
                <Text size={1} weight="semibold">
                  {row.views.toLocaleString()}
                </Text>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function cleanTitle(pageTitle: string | undefined, pagePath: string): string {
  if (pageTitle) {
    return pageTitle
      .replace(/\s*[–—|]\s*(Garment\s*Decor|GD).*$/i, '')
      .trim() || slugToTitle(pagePath);
  }
  return slugToTitle(pagePath);
}

function slugToTitle(path: string): string {
  const slug = path.split('/').filter(Boolean).pop() || path;
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* Lightweight table cells that respect Sanity's theme variables */
const cellStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--card-border-color, #e0e0e0)',
};

function Th({ children, style, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      style={{
        ...cellStyle,
        textAlign: 'left',
        fontWeight: 600,
        fontSize: '0.75rem',
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

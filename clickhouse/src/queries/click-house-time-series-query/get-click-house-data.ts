// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { TimeSeries } from '@perses-dev/core';
import { TimeSeriesQueryPlugin, replaceVariables } from '@perses-dev/plugin-system';
import { DEFAULT_DATASOURCE } from '../constants';
import { TimeSeriesEntry } from '../../model/click-house-data-types';
import {
  ClickHouseClient,
  ClickHouseColumnMeta,
  ClickHouseQueryResponse,
  formatClickHouseDateTime,
  replaceTimeRangePlaceholders,
} from '../../model/click-house-client';
import { ClickHouseTimeSeriesQuerySpec, DatasourceQueryResponse } from './click-house-query-types';

const DEFAULT_STEP_MS = 30 * 1000;
const TIME_COLUMN_NAME = 'time';
const DEFAULT_METRIC_LABEL_NAME = 'metric';

function buildTimeSeries(response?: DatasourceQueryResponse, instantTimestampMs?: number): TimeSeries[] {
  const data = response?.data as TimeSeriesEntry[];
  if (!response || !data || data.length === 0) {
    return [];
  }

  if (!hasTimeColumn(data)) {
    return buildCategoricalSeries(response, instantTimestampMs);
  }

  const metricNames = getMetricColumnNames(response, TIME_COLUMN_NAME);

  return metricNames
    .map((metricName) => {
      const values: Array<[number, number | null]> = data.map((row: TimeSeriesEntry) => {
        const timestamp = toTimestamp(row.time);
        const value = toTimeSeriesValue(row[metricName]);
        return [timestamp ?? Number.NaN, value];
      });

      return {
        name: metricName,
        values,
      };
    })
    .filter((series) => series.values.some(([, value]) => value !== null));
}

function buildCategoricalSeries(response: DatasourceQueryResponse, instantTimestampMs = Date.now()): TimeSeries[] {
  const data = response.data as TimeSeriesEntry[];
  const metricNames = getMetricColumnNames(response);
  if (metricNames.length === 0) {
    return [];
  }

  const metricNamesSet = new Set(metricNames);
  const labelNames = getColumnNames(response).filter((columnName) => !metricNamesSet.has(columnName));
  const metricLabelName = getMetricLabelName(labelNames);
  const includeMetricLabel = metricNames.length > 1;

  return data.flatMap((row) => {
    const rowLabels = getRowLabels(row, labelNames);

    return metricNames.flatMap((metricName) => {
      const value = toTimeSeriesValue(row[metricName]);
      if (value === null) {
        return [];
      }

      const labels = includeMetricLabel ? { ...rowLabels, [metricLabelName]: metricName } : rowLabels;
      return [
        {
          name: metricName,
          formattedName: formatSeriesName(metricName, labels),
          labels,
          values: [[instantTimestampMs, value]],
        },
      ];
    });
  });
}

function getColumnNames(response?: DatasourceQueryResponse): string[] {
  const data = response?.data as TimeSeriesEntry[] | undefined;
  const meta = getColumnMeta(response);
  if (meta.length > 0) {
    return meta.map((column) => column.name);
  }

  const columnNames: string[] = [];
  for (const row of data ?? []) {
    for (const columnName of Object.keys(row)) {
      if (!columnNames.includes(columnName)) {
        columnNames.push(columnName);
      }
    }
  }
  return columnNames;
}

function getColumnMeta(response?: DatasourceQueryResponse): ClickHouseColumnMeta[] {
  const meta = response?.meta;
  return Array.isArray(meta) ? meta : [];
}

function getMetricColumnNames(response?: DatasourceQueryResponse, excludedColumnName?: string): string[] {
  const meta = getColumnMeta(response);
  if (meta.length > 0) {
    return meta
      .filter((column) => column.name !== excludedColumnName)
      .filter((column) => isNumericClickHouseType(column.type))
      .map((column) => column.name);
  }

  const data = response?.data as TimeSeriesEntry[] | undefined;
  return getColumnNames(response)
    .filter((columnName) => columnName !== excludedColumnName)
    .filter((columnName) => data?.some((row) => toTimeSeriesValue(row[columnName]) !== null));
}

function hasTimeColumn(data: TimeSeriesEntry[]): boolean {
  return data.some((row) => Object.prototype.hasOwnProperty.call(row, TIME_COLUMN_NAME));
}

function toTimeSeriesValue(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function toTimestamp(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const trimmedValue = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
    const numericValue = Number(trimmedValue);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getRowLabels(row: TimeSeriesEntry, labelNames: string[]): Record<string, string> {
  return labelNames.reduce(
    (labels, labelName) => {
      const value = row[labelName];
      if (value !== null && value !== undefined) {
        labels[labelName] = String(value);
      }
      return labels;
    },
    {} as Record<string, string>
  );
}

function getMetricLabelName(labelNames: string[]): string {
  return labelNames.includes(DEFAULT_METRIC_LABEL_NAME) ? '__metric__' : DEFAULT_METRIC_LABEL_NAME;
}

function formatSeriesName(metricName: string, labels: Record<string, string>): string {
  const labelEntries = Object.entries(labels);
  if (labelEntries.length === 0) {
    return metricName;
  }

  const formattedLabels = labelEntries
    .map(([key, value]) => `${key}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    .join(',');
  return `${metricName}{${formattedLabels}}`;
}

function isNumericClickHouseType(type: string): boolean {
  const unwrappedType = unwrapClickHouseType(type);
  return (
    /^U?Int(8|16|32|64|128|256)$/.test(unwrappedType) ||
    /^Float(32|64)$/.test(unwrappedType) ||
    /^BFloat16$/.test(unwrappedType) ||
    /^Decimal(32|64|128|256)?\(/.test(unwrappedType)
  );
}

function unwrapClickHouseType(type: string): string {
  let result = type.trim();
  let match = result.match(/^(Nullable|LowCardinality)\((.*)\)$/);

  while (match) {
    result = match[2]?.trim() ?? result;
    match = result.match(/^(Nullable|LowCardinality)\((.*)\)$/);
  }

  return result;
}

function inferStepMs(response?: DatasourceQueryResponse): number {
  const data = response?.data as TimeSeriesEntry[];
  if (!response || !data || data.length < 2) {
    return DEFAULT_STEP_MS;
  }

  const timestamps = data
    .map((row: TimeSeriesEntry) => toTimestamp(row.time))
    .filter((timestamp): timestamp is number => timestamp !== null)
    .sort((a, b) => a - b);

  if (timestamps.length < 2) {
    return DEFAULT_STEP_MS;
  }

  const deltas: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    const previous = timestamps[i - 1];
    const current = timestamps[i];
    if (previous === undefined || current === undefined || current <= previous) {
      continue;
    }
    deltas.push(current - previous);
  }

  if (deltas.length === 0) {
    return DEFAULT_STEP_MS;
  }

  const deltaCounts = new Map<number, number>();
  for (const delta of deltas) {
    deltaCounts.set(delta, (deltaCounts.get(delta) ?? 0) + 1);
  }

  const inferredStep = Array.from(deltaCounts.entries()).sort(([deltaA, countA], [deltaB, countB]) => {
    if (countA !== countB) {
      return countB - countA;
    }
    return deltaB - deltaA;
  })[0]?.[0];

  return inferredStep ?? DEFAULT_STEP_MS;
}

export const getTimeSeriesData: TimeSeriesQueryPlugin<ClickHouseTimeSeriesQuerySpec>['getTimeSeriesData'] = async (
  spec,
  context
) => {
  if (spec.query === undefined || spec.query === null || spec.query === '') {
    return { series: [] };
  }

  const query = replaceVariables(spec.query, context.variableState);

  const client = (await context.datasourceStore.getDatasourceClient(
    spec.datasource ?? DEFAULT_DATASOURCE
  )) as ClickHouseClient;

  const { start, end } = context.timeRange;
  const startTime = formatClickHouseDateTime(start);
  const endTime = formatClickHouseDateTime(end);
  const executedQueryString = replaceTimeRangePlaceholders(query, startTime, endTime);

  const response: ClickHouseQueryResponse = await client.query({
    start: startTime,
    end: endTime,
    query: executedQueryString,
  });

  return {
    series: buildTimeSeries(response, end.getTime()),
    timeRange: { start, end },
    stepMs: inferStepMs(response),
    metadata: {
      executedQueryString,
    },
  };
};

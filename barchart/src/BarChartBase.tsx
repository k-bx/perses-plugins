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

import { ReactElement, useMemo } from 'react';
import { EChart, ModeOption, getFormattedAxis, useChartsTheme } from '@perses-dev/components';
import { FormatOptions, formatValue } from '@perses-dev/core';
import { use, EChartsCoreOption } from 'echarts/core';
import { BarChart as EChartsBarChart, LineChart as EChartsLineChart } from 'echarts/charts';
import { GridComponent, DatasetComponent, TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Box } from '@mui/material';
import { BarChartValueLabelMode } from './bar-chart-model';

use([
  EChartsBarChart,
  EChartsLineChart,
  GridComponent,
  DatasetComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

const BAR_WIN_WIDTH = 14;
const BAR_GAP = 6;
const LEGEND_HEIGHT = 20;
const VERTICAL_CATEGORY_LABEL_ROTATION = 45;
const VERTICAL_CATEGORY_LABEL_WIDTH = 120;
const VERTICAL_CATEGORY_AXIS_BOTTOM = 120;
function getVerticalCategoryAxis(): EChartsCoreOption {
  return {
    type: 'category',
    splitLine: { show: false },
    axisLabel: {
      interval: 0,
      rotate: VERTICAL_CATEGORY_LABEL_ROTATION,
      hideOverlap: false,
      overflow: 'truncate',
      width: VERTICAL_CATEGORY_LABEL_WIDTH,
    },
  };
}

function formatBarLabel(value: number | null | undefined, format: FormatOptions): string {
  if (value === null || value === undefined || value === 0) {
    return '';
  }

  return formatValue(value, format);
}

function formatPercentageLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return `${value.toFixed(2)}%`;
}

export interface BarChartData {
  label: string;
  value: number | null;
}

export interface StackedBarChartSeries {
  name: string;
  values: Array<number | null>;
}

export interface PercentageLineSeries {
  name: string;
  values: Array<number | null>;
}

export interface StackedBarChartData {
  categories: string[];
  series: StackedBarChartSeries[];
  percentageLine?: PercentageLineSeries;
}

export interface BarChartBaseProps {
  width: number;
  height: number;
  data: BarChartData[] | null;
  format?: FormatOptions;
  mode?: ModeOption;
  groupedData?: StackedBarChartData | null;
  isStacked?: boolean;
  orientation?: 'horizontal' | 'vertical';
  showValues?: boolean;
  valueLabelMode?: BarChartValueLabelMode;
}

export function BarChartBase(props: BarChartBaseProps): ReactElement {
  const {
    width,
    height,
    data,
    format = { unit: 'decimal' },
    mode = 'value',
    groupedData,
    isStacked = false,
    orientation = 'horizontal',
    showValues = false,
    valueLabelMode = 'stackTotal',
  } = props;
  const chartsTheme = useChartsTheme();
  const isHorizontal = orientation === 'horizontal';

  const option: EChartsCoreOption = useMemo(() => {
    if (groupedData) {
      if (!groupedData.series.length || !groupedData.categories.length) return chartsTheme.noDataOption;
      const { categories, series, percentageLine } = groupedData;
      const percentageLineSeries =
        !isHorizontal && percentageLine !== undefined && percentageLine.values.some((value) => value !== null)
          ? percentageLine
          : undefined;
      const showPercentageLine = percentageLineSeries !== undefined;
      const percentageLineName = percentageLineSeries?.name;
      const stackTotals = categories.map((_category, categoryIndex) =>
        series.reduce((total, currentSeries) => total + (currentSeries.values[categoryIndex] ?? 0), 0)
      );
      const barSeries = series.map((s, seriesIndex) => {
        const isStackTotalLabelSeries = isStacked && seriesIndex === series.length - 1;
        const showSegmentLabel = !isStacked || valueLabelMode === 'segment';
        const showStackTotalLabel = isStacked && valueLabelMode === 'stackTotal' && isStackTotalLabelSeries;
        return {
          name: s.name,
          type: 'bar',
          stack: isStacked ? 'total' : undefined,
          data: s.values,
          label: {
            show: showValues && (showSegmentLabel || showStackTotalLabel),
            position: isStacked && valueLabelMode === 'segment' ? 'inside' : isHorizontal ? 'right' : 'top',
            formatter: (params: { data: number | null; dataIndex: number }): string =>
              formatBarLabel(showStackTotalLabel ? stackTotals[params.dataIndex] : params.data, format),
            fontWeight: 'bold',
            textBorderColor: '#fff',
            textBorderWidth: 2,
          },
          itemStyle: { borderRadius: isStacked ? 0 : 4 },
        };
      });
      const chartSeries = percentageLineSeries
        ? [
            ...barSeries,
            {
              name: percentageLineSeries.name,
              type: 'line',
              yAxisIndex: 1,
              data: percentageLineSeries.values,
              symbol: 'circle',
              symbolSize: 8,
              showSymbol: true,
              showAllSymbol: true,
              clip: false,
              itemStyle: {
                color: '#6A9739',
              },
              lineStyle: {
                width: 2,
              },
              label: {
                show: true,
                position: 'top',
                formatter: (params: { data: number | null }): string => formatPercentageLabel(params.data),
                fontWeight: 'bold',
                textBorderColor: '#fff',
                textBorderWidth: 2,
              },
              labelLayout: {
                hideOverlap: false,
              },
            },
          ]
        : barSeries;
      return {
        title: { show: false },
        legend: { type: 'scroll', show: true, bottom: 0 },
        xAxis: isHorizontal
          ? getFormattedAxis({}, format)
          : {
              ...getVerticalCategoryAxis(),
              data: categories,
            },
        yAxis: isHorizontal
          ? {
              type: 'category',
              data: categories,
              splitLine: { show: false },
              axisLabel: { overflow: 'truncate', width: width / 3 },
            }
          : percentageLineSeries
            ? [
                getFormattedAxis({}, format),
                {
                  type: 'value',
                  name: percentageLineSeries.name,
                  min: 0,
                  max: 100,
                  splitLine: { show: false },
                  axisLabel: {
                    formatter: (value: number): string => `${value}%`,
                  },
                },
              ]
            : getFormattedAxis({}, format),
        series: chartSeries,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          appendToBody: true,
          confine: true,
          formatter: (
            params: Array<{ seriesName: string; data: number | null; name: string; color: string }>
          ): string => {
            if (!params.length) return '';
            const header = `<b>${params[0]?.name}</b><br/>`;
            const rows = params
              .filter((p): p is typeof p & { data: number } => p.data !== null)
              .map(
                (p) =>
                  `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${p.color}"></span>` +
                  `${p.seriesName}: <b>${
                    percentageLineName !== undefined && p.seriesName === percentageLineName
                      ? formatPercentageLabel(p.data)
                      : formatValue(p.data, format)
                  }</b>`
              )
              .join('<br/>');
            return header + rows;
          },
        },
        grid: {
          top: showPercentageLine ? 40 : undefined,
          left: '5%',
          right: '5%',
          bottom: isHorizontal ? LEGEND_HEIGHT * 2 : VERTICAL_CATEGORY_AXIS_BOTTOM,
          containLabel: !isHorizontal,
        },
      };
    }

    if (!data || !data.length) return chartsTheme.noDataOption;

    const source: Array<Array<BarChartData['label'] | BarChartData['value']>> = [];
    data.map((d) => {
      source.push([d.label, d.value]);
    });

    return {
      title: {
        show: false,
      },
      dataset: [
        {
          dimensions: ['label', 'value'],
          source: source,
        },
      ],
      xAxis: isHorizontal ? getFormattedAxis({}, format) : getVerticalCategoryAxis(),
      yAxis: isHorizontal
        ? { type: 'category', splitLine: { show: false }, axisLabel: { overflow: 'truncate', width: width / 3 } }
        : getFormattedAxis({}, format),
      series: {
        type: 'bar',
        barMinWidth: BAR_WIN_WIDTH,
        barCategoryGap: BAR_GAP,
        label: {
          show: true,
          position: isHorizontal ? 'right' : 'top',
          formatter: (params: { data: number[] }): string | undefined => {
            if (!params.data[1]) {
              return undefined;
            }

            if (mode === 'percentage') {
              return formatValue(params.data[1]!, {
                unit: 'percent',
                decimalPlaces: format.decimalPlaces,
              });
            }
            return formatValue(params.data[1], format);
          },
        },
        itemStyle: {
          borderRadius: 4,
          color: chartsTheme.echartsTheme[0],
        },
      },
      tooltip: {
        appendToBody: true,
        confine: true,
        formatter: (params: { name: string; data: number[] }) =>
          params.data[1] && `<b>${params.name}</b> &emsp; ${formatValue(params.data[1], format)}`,
      },
      // increase distance between grid and container to prevent y axis labels from getting cut off
      grid: {
        left: '5%',
        right: '5%',
        bottom: isHorizontal ? undefined : VERTICAL_CATEGORY_AXIS_BOTTOM,
        containLabel: !isHorizontal,
      },
    };
  }, [data, groupedData, isStacked, chartsTheme, width, mode, format, isHorizontal, showValues, valueLabelMode]);

  const numGroupedRows = groupedData
    ? isStacked
      ? groupedData.categories.length
      : groupedData.categories.length * groupedData.series.length
    : 0;

  function getChartHeight(): number | string {
    if (groupedData) {
      if (!isHorizontal) return height;
      return Math.max(height, numGroupedRows * (BAR_WIN_WIDTH + BAR_GAP) + LEGEND_HEIGHT * 2 + 20);
    }
    if (data) {
      return data.length * (BAR_WIN_WIDTH + BAR_GAP);
    }
    return '100%';
  }

  return (
    <Box
      style={{
        width: width,
        height: height,
      }}
      sx={{ overflow: 'auto' }}
    >
      <EChart
        style={{
          minHeight: height,
          height: getChartHeight(),
        }}
        option={option}
        theme={chartsTheme.echartsTheme}
      />
    </Box>
  );
}

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
import { BarChartLegendOptions, BarChartLegendPosition, BarChartValueLabelMode } from './bar-chart-model';

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
const LEGEND_SIDE_WIDTH = 120;
const VERTICAL_CATEGORY_LABEL_ROTATION = 35;
const VERTICAL_CATEGORY_LABEL_WIDTH = 120;
const VERTICAL_CATEGORY_AXIS_COMPACT_BOTTOM = 48;
const VERTICAL_CATEGORY_AXIS_ROTATED_BOTTOM = 72;
const VERTICAL_CATEGORY_AXIS_ROTATED_WITH_BOTTOM_LEGEND = 136;
const VERTICAL_VALUE_AXIS_WIDTH = 44;
const VERTICAL_PERCENTAGE_AXIS_WIDTH = 48;
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  borderColor: 'rgba(17, 24, 39, 0.18)',
  borderWidth: 1,
  textStyle: {
    color: '#111827',
  },
  extraCssText: 'box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18); border-radius: 4px;',
};

function getPaletteColor(theme: unknown, index: number): string | undefined {
  return Array.isArray(theme) && typeof theme[index % theme.length] === 'string'
    ? theme[index % theme.length]
    : undefined;
}

function getReadableTextColor(backgroundColor: string | undefined): string {
  const rgb = parseRgbColor(backgroundColor);
  if (!rgb) {
    return '#111827';
  }

  const [r, g, b]: [number, number, number] = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? '#111827' : '#ffffff';
}

function parseRgbColor(color: string | undefined): [number, number, number] | undefined {
  if (!color) {
    return undefined;
  }

  const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1]!;
    const normalizedHex =
      hex.length === 3
        ? hex
            .split('')
            .map((char) => char + char)
            .join('')
        : hex;
    const value = Number.parseInt(normalizedHex, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }

  return undefined;
}

function getLegendOption(legendPosition: BarChartLegendPosition): EChartsCoreOption['legend'] {
  if (legendPosition === 'hidden') {
    return { show: false };
  }

  const base = {
    type: 'scroll',
    show: true,
    itemGap: 8,
    itemWidth: 12,
    itemHeight: 8,
    textStyle: {
      fontSize: 11,
    },
  };

  switch (legendPosition) {
    case 'top':
      return { ...base, top: 0, left: 'center', orient: 'horizontal' };
    case 'right':
      return { ...base, top: 0, right: 0, bottom: 0, orient: 'vertical' };
    case 'left':
      return { ...base, top: 0, left: 0, bottom: 0, orient: 'vertical' };
    case 'bottom':
    default:
      return { ...base, bottom: 0, left: 'center', orient: 'horizontal' };
  }
}

function getGridSpacing(
  legendPosition: BarChartLegendPosition,
  isHorizontal: boolean,
  showPercentageLine: boolean,
  rotateCategoryLabels: boolean
): { top?: number; right?: number | string; bottom?: number; left?: number | string } {
  const top = legendPosition === 'top' ? LEGEND_HEIGHT * 2 : showPercentageLine ? 40 : undefined;
  const bottom = getGridBottomSpacing(legendPosition, isHorizontal, rotateCategoryLabels);
  const left = legendPosition === 'left' ? LEGEND_SIDE_WIDTH : isHorizontal ? '5%' : VERTICAL_VALUE_AXIS_WIDTH;
  const right = legendPosition === 'right' ? LEGEND_SIDE_WIDTH : isHorizontal ? '5%' : VERTICAL_PERCENTAGE_AXIS_WIDTH;

  return { top, right, bottom, left };
}

function getGridBottomSpacing(
  legendPosition: BarChartLegendPosition,
  isHorizontal: boolean,
  rotateCategoryLabels: boolean
): number | undefined {
  if (isHorizontal) {
    return legendPosition === 'bottom' ? LEGEND_HEIGHT * 2 : undefined;
  }

  if (legendPosition === 'bottom' && rotateCategoryLabels) {
    return VERTICAL_CATEGORY_AXIS_ROTATED_WITH_BOTTOM_LEGEND;
  }

  if (legendPosition === 'bottom') {
    return LEGEND_HEIGHT * 2 + VERTICAL_CATEGORY_AXIS_COMPACT_BOTTOM;
  }

  return rotateCategoryLabels ? VERTICAL_CATEGORY_AXIS_ROTATED_BOTTOM : VERTICAL_CATEGORY_AXIS_COMPACT_BOTTOM;
}
function getVerticalCategoryAxis(rotateCategoryLabels: boolean): EChartsCoreOption {
  return {
    type: 'category',
    splitLine: { show: false },
    axisLabel: {
      interval: 0,
      rotate: rotateCategoryLabels ? VERTICAL_CATEGORY_LABEL_ROTATION : 0,
      align: 'center',
      verticalAlign: 'top',
      margin: rotateCategoryLabels ? 16 : 8,
      hideOverlap: false,
      overflow: 'truncate',
      width: rotateCategoryLabels ? VERTICAL_CATEGORY_LABEL_WIDTH : undefined,
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
  showHorizontalGrid?: boolean;
  rotateCategoryLabels?: boolean;
  legend?: BarChartLegendOptions;
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
    showHorizontalGrid = true,
    rotateCategoryLabels = false,
    legend,
  } = props;
  const chartsTheme = useChartsTheme();
  const isHorizontal = orientation === 'horizontal';
  const legendPosition = legend?.position ?? 'bottom';

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
        const seriesColor = getPaletteColor(chartsTheme.echartsTheme, seriesIndex);
        const showInsideSegmentLabel = isStacked && valueLabelMode === 'segment';
        return {
          name: s.name,
          type: 'bar',
          stack: isStacked ? 'total' : undefined,
          data: s.values,
          color: seriesColor,
          label: {
            show: showValues && (showSegmentLabel || showStackTotalLabel),
            position: showInsideSegmentLabel ? 'inside' : isHorizontal ? 'right' : 'top',
            formatter: (params: { data: number | null; dataIndex: number }): string =>
              formatBarLabel(showStackTotalLabel ? stackTotals[params.dataIndex] : params.data, format),
            color: showInsideSegmentLabel ? getReadableTextColor(seriesColor) : undefined,
            fontWeight: 'bold',
            textBorderColor: showInsideSegmentLabel ? 'transparent' : '#fff',
            textBorderWidth: showInsideSegmentLabel ? 0 : 2,
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
        legend: getLegendOption(legendPosition),
        xAxis: isHorizontal
          ? getFormattedAxis({}, format)
          : {
              ...getVerticalCategoryAxis(rotateCategoryLabels),
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
                  splitLine: { show: showHorizontalGrid },
                  axisLabel: {
                    formatter: (value: number): string => `${value}%`,
                  },
                },
              ]
            : {
                ...getFormattedAxis({}, format),
                splitLine: { show: showHorizontalGrid },
              },
        series: chartSeries,
        tooltip: {
          ...TOOLTIP_STYLE,
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
          ...getGridSpacing(legendPosition, isHorizontal, showPercentageLine, rotateCategoryLabels),
          containLabel: false,
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
      xAxis: isHorizontal ? getFormattedAxis({}, format) : getVerticalCategoryAxis(rotateCategoryLabels),
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
        ...TOOLTIP_STYLE,
        appendToBody: true,
        confine: true,
        formatter: (params: { name: string; data: number[] }) =>
          params.data[1] && `<b>${params.name}</b> &emsp; ${formatValue(params.data[1], format)}`,
      },
      // increase distance between grid and container to prevent y axis labels from getting cut off
      grid: {
        left: '5%',
        right: '5%',
        bottom: isHorizontal
          ? undefined
          : rotateCategoryLabels
            ? VERTICAL_CATEGORY_AXIS_ROTATED_BOTTOM
            : VERTICAL_CATEGORY_AXIS_COMPACT_BOTTOM,
        containLabel: false,
      },
    };
  }, [
    data,
    groupedData,
    isStacked,
    chartsTheme,
    width,
    mode,
    format,
    isHorizontal,
    showValues,
    valueLabelMode,
    showHorizontalGrid,
    rotateCategoryLabels,
    legendPosition,
  ]);

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

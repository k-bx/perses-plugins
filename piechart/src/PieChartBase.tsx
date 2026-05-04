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

import { use } from 'echarts/core';
import { PieChart as EChartsPieChart } from 'echarts/charts';
import { DatasetComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Box, useTheme } from '@mui/material';
import { ReactElement } from 'react';
import { EChart, ModeOption, useChartsTheme } from '@perses-dev/components';
import { FormatOptions, formatValue } from '@perses-dev/core';
import { getLabelFormatter, getTooltipFormatter } from './utils';

use([
  EChartsPieChart,
  GridComponent,
  DatasetComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);
export interface PieChartData {
  id?: string;
  name: string;
  value: number | null;
  itemStyle?: {
    color: string;
  };
}

export interface PieChartBaseProps {
  width: number;
  height: number;
  data: PieChartData[] | null;
  donut?: boolean;
  mode?: ModeOption;
  radius?: number;
  showLabels?: boolean;
  showTotal?: boolean;
  formatOptions?: FormatOptions;
}

export function PieChartBase(props: PieChartBaseProps): ReactElement {
  const { width, height, data, donut, mode, radius, formatOptions, showLabels, showTotal } = props;
  const chartsTheme = useChartsTheme();
  const muiTheme = useTheme();
  const total = data?.reduce((sum, item) => sum + (item.value ?? 0), 0) ?? 0;
  const outerRadius = `${radius ?? 90}%`;
  const innerRadius = donut ? `${Math.max((radius ?? 90) - 28, 20)}%` : '0%';
  const shouldShowTotal = Boolean(donut && showTotal);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: getTooltipFormatter(formatOptions),
      appendTo: document.body,
      confine: false,
    },
    series: [
      {
        type: 'pie',
        radius: [innerRadius, outerRadius],
        label: {
          show: Boolean(showLabels),
          position: donut ? 'outer' : 'inner',
          alignTo: donut ? 'edge' : undefined,
          edgeDistance: donut ? 10 : undefined,
          fontSize: donut ? 12 : 14,
          formatter: getLabelFormatter(mode, formatOptions),
          overflow: 'truncate',
          fontWeight: donut ? 500 : 'bold',
        },
        labelLine: {
          show: Boolean(showLabels) && Boolean(donut),
          length: 14,
          length2: 10,
          smooth: true,
        },
        center: ['50%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        itemStyle: {
          borderRadius: 5,
          borderColor: muiTheme.palette.background.default,
          borderWidth: 2,
        },
      },
    ],
  };

  return (
    <Box
      style={{
        width: width,
        height: height,
        position: 'relative',
      }}
      sx={{ overflow: 'auto' }}
    >
      <EChart
        sx={{
          width: '100%',
          height: '100%',
        }}
        option={option}
        theme={chartsTheme.echartsTheme}
      />
      {shouldShowTotal && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            textAlign: 'center',
            zIndex: 1,
            minWidth: 72,
          }}
        >
          <Box
            sx={{
              color: muiTheme.palette.text.primary,
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {formatValue(total, formatOptions)}
          </Box>
          <Box
            sx={{
              color: muiTheme.palette.text.secondary,
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.2,
              mt: 0.25,
            }}
          >
            Всього
          </Box>
        </Box>
      )}
    </Box>
  );
}

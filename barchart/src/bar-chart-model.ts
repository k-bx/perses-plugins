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

import { ModeOption, SortOption } from '@perses-dev/components';
import { CalculationType, DEFAULT_CALCULATION, Definition, FormatOptions } from '@perses-dev/core';
import { OptionsEditorProps } from '@perses-dev/plugin-system';

export const DEFAULT_FORMAT: FormatOptions = { unit: 'decimal', shortValues: true };
export const DEFAULT_SORT: SortOption = 'desc';
export const DEFAULT_MODE: ModeOption = 'value';
export const DEFAULT_ORIENTATION: 'horizontal' | 'vertical' = 'horizontal';
export const DEFAULT_GROUP_BY: string[] = [];
export const DEFAULT_IS_STACKED = false;
export const DEFAULT_SHOW_VALUES = false;
export const DEFAULT_VALUE_LABEL_MODE: BarChartValueLabelMode = 'stackTotal';
export const DEFAULT_SHOW_HORIZONTAL_GRID = true;
export const DEFAULT_ROTATE_CATEGORY_LABELS = false;
export const DEFAULT_LEGEND: BarChartLegendOptions = {
  position: 'top',
};
export const DEFAULT_PERCENTAGE_LINE: BarChartPercentageLineOptions = {
  enabled: false,
  numerator: '',
  denominator: '',
  name: 'Percentage',
};

export interface BarChartPercentageLineOptions {
  enabled?: boolean;
  numerator?: string;
  denominator?: string;
  name?: string;
}

export type BarChartValueLabelMode = 'segment' | 'stackTotal';
export type BarChartLegendPosition = 'top' | 'right' | 'bottom' | 'left' | 'hidden';

export interface BarChartLegendOptions {
  position?: BarChartLegendPosition;
}

/**
 * The schema for a BarChart panel.
 */
export interface BarChartDefinition extends Definition<BarChartOptions> {
  kind: 'BarChart';
}

/**
 * The Options object type supported by the BarChart panel plugin.
 */
export interface BarChartOptions {
  calculation: CalculationType;
  format?: FormatOptions;
  sort?: SortOption;
  mode?: ModeOption;
  orientation?: 'horizontal' | 'vertical';
  groupBy?: string[];
  isStacked?: boolean;
  showValues?: boolean;
  valueLabelMode?: BarChartValueLabelMode;
  showHorizontalGrid?: boolean;
  rotateCategoryLabels?: boolean;
  legend?: BarChartLegendOptions;
  percentageLine?: BarChartPercentageLineOptions;
}

export type BarChartOptionsEditorProps = OptionsEditorProps<BarChartOptions>;

/**
 * Creates the initial/empty options for a BarChart panel.
 */
export function createInitialBarChartOptions(): BarChartOptions {
  return {
    calculation: DEFAULT_CALCULATION,
    format: DEFAULT_FORMAT,
    sort: DEFAULT_SORT,
    mode: DEFAULT_MODE,
    orientation: DEFAULT_ORIENTATION,
    groupBy: DEFAULT_GROUP_BY,
    isStacked: DEFAULT_IS_STACKED,
    showValues: DEFAULT_SHOW_VALUES,
    valueLabelMode: DEFAULT_VALUE_LABEL_MODE,
    showHorizontalGrid: DEFAULT_SHOW_HORIZONTAL_GRID,
    rotateCategoryLabels: DEFAULT_ROTATE_CATEGORY_LABELS,
    legend: { ...DEFAULT_LEGEND },
    percentageLine: { ...DEFAULT_PERCENTAGE_LINE },
  };
}

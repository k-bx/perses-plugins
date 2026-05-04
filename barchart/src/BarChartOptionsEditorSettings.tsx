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

import {
  Autocomplete,
  Button,
  Chip,
  FormControlLabel,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  FormatControls,
  FormatControlsProps,
  ModeOption,
  ModeSelector,
  ModeSelectorProps,
  OptionsEditorColumn,
  OptionsEditorGrid,
  OptionsEditorGroup,
  SortOption,
  SortSelector,
  SortSelectorProps,
} from '@perses-dev/components';
import { CalculationType, DEFAULT_CALCULATION, FormatOptions, isPercentUnit } from '@perses-dev/core';
import { CalculationSelector, CalculationSelectorProps } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import merge from 'lodash/merge';
import { MouseEventHandler, ReactElement } from 'react';
import {
  BarChartOptions,
  BarChartPercentageLineOptions,
  DEFAULT_PERCENTAGE_LINE,
  BarChartOptionsEditorProps,
  DEFAULT_FORMAT,
  DEFAULT_MODE,
  DEFAULT_ORIENTATION,
  DEFAULT_SORT,
  DEFAULT_IS_STACKED,
  DEFAULT_GROUP_BY,
  DEFAULT_SHOW_VALUES,
  DEFAULT_VALUE_LABEL_MODE,
  DEFAULT_SHOW_HORIZONTAL_GRID,
  DEFAULT_ROTATE_CATEGORY_LABELS,
  DEFAULT_LEGEND,
} from './bar-chart-model';

export function BarChartOptionsEditorSettings(props: BarChartOptionsEditorProps): ReactElement {
  const { onChange, value } = props;

  const handleCalculationChange: CalculationSelectorProps['onChange'] = (newCalculation: CalculationType) => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.calculation = newCalculation;
      })
    );
  };

  const handleUnitChange: FormatControlsProps['onChange'] = (newFormat: FormatOptions) => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.format = newFormat;
      })
    );
  };

  const handleSortChange: SortSelectorProps['onChange'] = (newSort: SortOption) => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.sort = newSort;
      })
    );
  };

  const handleModeChange: ModeSelectorProps['onChange'] = (newMode: ModeOption) => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.mode = newMode;
      })
    );
  };

  const handleResetSettings: MouseEventHandler<HTMLButtonElement> = () => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.calculation = DEFAULT_CALCULATION;
        draft.format = DEFAULT_FORMAT;
        draft.sort = DEFAULT_SORT;
        draft.mode = DEFAULT_MODE;
        draft.groupBy = DEFAULT_GROUP_BY;
        draft.isStacked = DEFAULT_IS_STACKED;
        draft.orientation = DEFAULT_ORIENTATION;
        draft.showValues = DEFAULT_SHOW_VALUES;
        draft.valueLabelMode = DEFAULT_VALUE_LABEL_MODE;
        draft.showHorizontalGrid = DEFAULT_SHOW_HORIZONTAL_GRID;
        draft.rotateCategoryLabels = DEFAULT_ROTATE_CATEGORY_LABELS;
        draft.legend = { ...DEFAULT_LEGEND };
        draft.percentageLine = { ...DEFAULT_PERCENTAGE_LINE };
      })
    );
  };

  const handlePercentageLineChange = (newValue: Partial<BarChartPercentageLineOptions>): void => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.percentageLine = {
          ...DEFAULT_PERCENTAGE_LINE,
          ...draft.percentageLine,
          ...newValue,
        };
      })
    );
  };

  // ensures decimalPlaces defaults to correct value
  const format = merge({}, DEFAULT_FORMAT, value.format);
  const groupBy = value.groupBy ?? DEFAULT_GROUP_BY;
  const isStacked = value.isStacked ?? DEFAULT_IS_STACKED;
  const showValues = value.showValues ?? DEFAULT_SHOW_VALUES;
  const valueLabelMode = value.valueLabelMode ?? DEFAULT_VALUE_LABEL_MODE;
  const showHorizontalGrid = value.showHorizontalGrid ?? DEFAULT_SHOW_HORIZONTAL_GRID;
  const rotateCategoryLabels = value.rotateCategoryLabels ?? DEFAULT_ROTATE_CATEGORY_LABELS;
  const legend = merge({}, DEFAULT_LEGEND, value.legend);
  const percentageLine = merge({}, DEFAULT_PERCENTAGE_LINE, value.percentageLine);

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Misc">
          <FormatControls value={format} onChange={handleUnitChange} disabled={value.mode === 'percentage'} />
          <CalculationSelector value={value.calculation} onChange={handleCalculationChange} />
          <SortSelector value={value.sort} onChange={handleSortChange} />
          <ModeSelector value={value.mode} onChange={handleModeChange} disablePercentageMode={isPercentUnit(format)} />
          <ToggleButtonGroup
            exclusive
            size="small"
            value={value.orientation ?? 'horizontal'}
            onChange={(_, v) =>
              v &&
              onChange(
                produce(value, (draft: BarChartOptions) => {
                  draft.orientation = v;
                })
              )
            }
          >
            <ToggleButton value="horizontal">Horizontal</ToggleButton>
            <ToggleButton value="vertical">Vertical</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={legend.position}
            onChange={(_, v) =>
              v &&
              onChange(
                produce(value, (draft: BarChartOptions) => {
                  draft.legend = { ...legend, position: v };
                })
              )
            }
          >
            <ToggleButton value="top">Legend top</ToggleButton>
            <ToggleButton value="right">Right</ToggleButton>
            <ToggleButton value="bottom">Bottom</ToggleButton>
            <ToggleButton value="left">Left</ToggleButton>
            <ToggleButton value="hidden">Hidden</ToggleButton>
          </ToggleButtonGroup>
        </OptionsEditorGroup>
        <OptionsEditorGroup title="Stacking">
          <Autocomplete
            multiple
            freeSolo
            value={groupBy}
            onChange={(_, newValue) => {
              const filtered = (newValue as string[]).filter((v) => v.trim() !== '');
              onChange(
                produce(value, (draft: BarChartOptions) => {
                  draft.groupBy = filtered;
                  if (filtered.length === 0) draft.isStacked = false;
                })
              );
            }}
            options={[]}
            renderTags={(tagValues, getTagProps) =>
              tagValues.map((option, index) => (
                <Chip size="small" variant="outlined" label={option} {...getTagProps({ index })} key={option} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} size="small" label="Group By Labels" placeholder="Type label name + Enter" />
            )}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={isStacked}
                disabled={groupBy.length === 0}
                onChange={(e) =>
                  onChange(
                    produce(value, (draft: BarChartOptions) => {
                      draft.isStacked = e.target.checked;
                    })
                  )
                }
              />
            }
            label="Stack bars"
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showValues}
                disabled={groupBy.length === 0}
                onChange={(e) =>
                  onChange(
                    produce(value, (draft: BarChartOptions) => {
                      draft.showValues = e.target.checked;
                    })
                  )
                }
              />
            }
            label="Show values"
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showHorizontalGrid}
                onChange={(e) =>
                  onChange(
                    produce(value, (draft: BarChartOptions) => {
                      draft.showHorizontalGrid = e.target.checked;
                    })
                  )
                }
              />
            }
            label="Show horizontal grid"
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={rotateCategoryLabels}
                disabled={value.orientation === 'horizontal'}
                onChange={(e) =>
                  onChange(
                    produce(value, (draft: BarChartOptions) => {
                      draft.rotateCategoryLabels = e.target.checked;
                    })
                  )
                }
              />
            }
            label="Rotate category labels"
          />
          <ToggleButtonGroup
            exclusive
            size="small"
            value={valueLabelMode}
            onChange={(_, v) =>
              v &&
              onChange(
                produce(value, (draft: BarChartOptions) => {
                  draft.valueLabelMode = v;
                })
              )
            }
          >
            <ToggleButton value="stackTotal" disabled={!showValues || !isStacked}>
              Stack total
            </ToggleButton>
            <ToggleButton value="segment" disabled={!showValues || !isStacked}>
              Segment
            </ToggleButton>
          </ToggleButtonGroup>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={percentageLine.enabled ?? false}
                disabled={groupBy.length === 0}
                onChange={(e) => handlePercentageLineChange({ enabled: e.target.checked })}
              />
            }
            label="Show percentage line"
          />
          {percentageLine.enabled && (
            <>
              <TextField
                size="small"
                label="Line Name"
                value={percentageLine.name ?? ''}
                onChange={(e) => handlePercentageLineChange({ name: e.target.value })}
              />
              <TextField
                size="small"
                label="Numerator Metric"
                value={percentageLine.numerator ?? ''}
                onChange={(e) => handlePercentageLineChange({ numerator: e.target.value })}
              />
              <TextField
                size="small"
                label="Denominator Metric"
                value={percentageLine.denominator ?? ''}
                onChange={(e) => handlePercentageLineChange({ denominator: e.target.value })}
              />
            </>
          )}
        </OptionsEditorGroup>
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Reset Settings">
          <Button variant="outlined" color="secondary" onClick={handleResetSettings}>
            Reset To Defaults
          </Button>
        </OptionsEditorGroup>
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}

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

package bar

import (
	"github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/go-sdk/panel"
)

const PluginKind = "BarChart"

type Sort string

const (
	AscSort  Sort = "asc"
	DescSort Sort = "desc"
)

type Mode string

const (
	ValueMode      Mode = "value"
	PercentageMode Mode = "percentage"
)

type Orientation string

const (
	HorizontalOrientation Orientation = "horizontal"
	VerticalOrientation   Orientation = "vertical"
)

type PercentageLine struct {
	Enabled     bool   `json:"enabled,omitempty" yaml:"enabled,omitempty"`
	Numerator   string `json:"numerator,omitempty" yaml:"numerator,omitempty"`
	Denominator string `json:"denominator,omitempty" yaml:"denominator,omitempty"`
	Name        string `json:"name,omitempty" yaml:"name,omitempty"`
}

type ValueLabelMode string

const (
	SegmentValueLabelMode    ValueLabelMode = "segment"
	StackTotalValueLabelMode ValueLabelMode = "stackTotal"
)

type PluginSpec struct {
	Calculation    common.Calculation `json:"calculation" yaml:"calculation"`
	Format         *common.Format     `json:"format,omitempty" yaml:"format,omitempty"`
	Sort           Sort               `json:"sort,omitempty" yaml:"sort,omitempty"`
	Mode           Mode               `json:"mode,omitempty" yaml:"mode,omitempty"`
	Orientation    Orientation        `json:"orientation,omitempty" yaml:"orientation,omitempty"`
	GroupBy        []string           `json:"groupBy,omitempty" yaml:"groupBy,omitempty"`
	IsStacked      bool               `json:"isStacked,omitempty" yaml:"isStacked,omitempty"`
	ShowValues     bool               `json:"showValues,omitempty" yaml:"showValues,omitempty"`
	ValueLabelMode ValueLabelMode     `json:"valueLabelMode,omitempty" yaml:"valueLabelMode,omitempty"`
	PercentageLine *PercentageLine    `json:"percentageLine,omitempty" yaml:"percentageLine,omitempty"`
}

type Option func(plugin *Builder) error

type Builder struct {
	PluginSpec `json:",inline" yaml:",inline"`
}

func create(options ...Option) (Builder, error) {
	builder := &Builder{
		PluginSpec: PluginSpec{},
	}

	defaults := []Option{
		Calculation(common.LastCalculation),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

func Chart(options ...Option) panel.Option {
	return func(builder *panel.Builder) error {
		r, err := create(options...)
		if err != nil {
			return err
		}
		builder.Spec.Plugin.Kind = PluginKind
		builder.Spec.Plugin.Spec = r.PluginSpec
		return nil
	}
}

# Plugin Module: click-house

### How to install

This plugin requires react and react-dom 18

Install peer dependencies:

```bash
npm install react@18 react-dom@18
```

Install the plugin:

```bash
npm install @my-org/click-house
```

## Development

### Setup

Install dependencies:

```bash
npm install
```

### Get Started

Start the dev server:

```bash
npm run dev
```

Build the plugin for distribution:

```bash
npm run build
```

## Query shapes

The time series query supports two result shapes:

- Time-based rows: include a `time` column and one or more numeric metric columns.
- Categorical rows: omit the `time` column. Non-numeric columns become labels and numeric columns become instant
  series values, which can be used by panels such as Table and Bar Chart.

Example categorical query:

```sql
SELECT
  crew,
  sum(flights_count) AS total_flights,
  sumIf(flights_count, strike_result IN ['destroyed', 'damaged', 'hit', 'forbid']) AS successful_flights
FROM flight
WHERE timestamp BETWEEN '{start}' AND '{end}'
GROUP BY crew
ORDER BY total_flights DESC
```

For Bar Chart, set `Group By Labels` to `crew`. If the query returns multiple numeric columns, the plugin adds a
`metric` label so each metric can be rendered as a separate bar segment/series.

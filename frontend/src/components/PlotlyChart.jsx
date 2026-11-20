import React from 'react';
import Plot from 'react-plotly.js';

export default function PlotlyChart({ data, layout, config, style, className }) {
  const defaultLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'Inter, system-ui, sans-serif',
      color: '#475569',
      size: 11
    },
    margin: { t: 30, r: 20, l: 40, b: 40 },
    autosize: true,
    xaxis: {
      gridcolor: '#f1f5f9',
      linecolor: '#cbd5e1',
      tickcolor: '#cbd5e1',
      ...layout?.xaxis
    },
    yaxis: {
      gridcolor: '#f1f5f9',
      linecolor: '#cbd5e1',
      tickcolor: '#cbd5e1',
      ...layout?.yaxis
    },
    ...layout
  };

  const defaultConfig = {
    responsive: true,
    displayModeBar: false,
    ...config
  };

  return (
    <div className={`w-full overflow-hidden ${className || ''}`}>
      <Plot
        data={data}
        layout={defaultLayout}
        config={defaultConfig}
        style={{ width: '100%', height: '100%', ...style }}
        useResizeHandler
      />
    </div>
  );
}

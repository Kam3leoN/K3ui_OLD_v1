/**
 * @fileoverview Enregistrement du moteur de rendu interne (ECharts tree-shaken)
 * @description Import sélectif des charts et composants utilisés par les presets K3UI
 */

import * as echarts from 'echarts/core';
import {
    BarChart,
    LineChart,
    PieChart,
    ScatterChart,
    RadarChart,
    CandlestickChart,
    FunnelChart,
    HeatmapChart,
    ChordChart,
    SunburstChart,
    GaugeChart,
    GraphChart,
} from 'echarts/charts';
import {
    GridComponent,
    PolarComponent,
    RadarComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    DatasetComponent,
    TransformComponent,
    VisualMapComponent,
    CalendarComponent,
    MarkPointComponent,
    MarkLineComponent,
    MarkAreaComponent,
    DataZoomComponent,
    GraphicComponent,
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
    BarChart,
    LineChart,
    PieChart,
    ScatterChart,
    RadarChart,
    CandlestickChart,
    FunnelChart,
    HeatmapChart,
    ChordChart,
    SunburstChart,
    GaugeChart,
    GraphChart,
    GridComponent,
    PolarComponent,
    RadarComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    DatasetComponent,
    TransformComponent,
    VisualMapComponent,
    CalendarComponent,
    MarkPointComponent,
    MarkLineComponent,
    MarkAreaComponent,
    DataZoomComponent,
    GraphicComponent,
    CanvasRenderer,
    LabelLayout,
    UniversalTransition,
]);

export default echarts;

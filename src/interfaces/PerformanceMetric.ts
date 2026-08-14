export interface PerformanceMetric {
  metricName: string;
  currentValue: number;
  thresholdValue: number;
  status: 'Healthy' | 'Degraded';
}

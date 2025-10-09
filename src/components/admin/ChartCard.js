import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const ChartCard = ({ title, type, data, height = 300 }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');

    // 차트 설정
    const config = {
      type: type,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales:
          type !== 'doughnut' && type !== 'pie'
            ? {
                x: {
                  display: true,
                  grid: {
                    display: false,
                  },
                },
                y: {
                  display: true,
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0,0,0,0.1)',
                  },
                },
              }
            : {},
        elements: {
          line: {
            tension: 0.4,
          },
          point: {
            radius: 4,
            hoverRadius: 6,
          },
        },
      },
    };

    // 차트 생성
    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div style={{ height: `${height}px`, position: 'relative' }}>
        {data ? (
          <canvas ref={canvasRef} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-2">📊</div>
              <p className="text-gray-500">데이터를 불러오는 중...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartCard;

import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import React from 'react';

interface dataItem {
    date: string;
    day: string;
    value: number;
}

// 注册 Chart.js 的组件
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BarChart({ data }: { data: dataItem[] }) {
    // 提取日期和值
    const labels = data.map(item => item.day); // X轴：日期
    const values = data.map(item => item.value); // Y轴：值

    // 定义图表数据
    const chartData = {
        labels: labels,
        datasets: [
        {
            label: '每日值',
            data: values,
            backgroundColor: '#decdee', // 柱状图颜色
            borderColor: '#decdee', // 边框颜色
            borderWidth: 1,
        },
        ],
    };

    // 定义图表配置
    const options = {
        responsive: true,
        plugins: {
        legend: {
            position: 'top' as const, // 修复类型错误：将值设置为允许的选项之一
        },
        tooltip: {
            callbacks: {
            label: (context :any) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                return `${label}: ${value}`;
            },
            },
        },
        },
        scales: {
        y: {
            beginAtZero: true, // Y轴从0开始
        },
        },
    };

    return <Bar data={chartData} options={options} />;
}
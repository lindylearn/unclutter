import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis } from 'recharts';

import { getPageHistory } from '../common/api';

export function PopularityMessage({ annotations, url, onClick }) {
	const [data, setData] = useState(null);
	useEffect(async () => {
		try {
			const newData = await getPageHistory(url);
			if (newData?.length > 0) {
				setData(newData);
			}
		} catch {}
	}, []);

	if (data == null) {
		return <></>;
	}

	return (
		<div
			className="bg-white rounded-lg drop-shadow-sm overflow-hidden"
			onClick={onClick}
		>
			{/* <div className="text-xs md:text-sm text-gray-400 text-right font-mono py-1 px-2 z-10 absolute">
				Article popularity
			</div> */}
			<div className="w-full -mt-8">
				{/* Article popularity over time: */}
				{data && (
					<ResponsiveContainer
						width="100%" // ignore padding
						height={100}
					>
						<AreaChart
							width={730}
							height={250}
							data={data}
							margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
						>
							<XAxis
								dataKey="year"
								interval={Math.max(
									Math.ceil(data.length / 6),
									6
								)}
								// minTickGap={20}
								tick={CustomizedAxisTick}
							/>
							<Area
								isAnimationActive={false}
								type="monotone"
								dataKey="traffic"
								stroke="#bbf7d0"
								fillOpacity={1}
								fill="#bbf7d0"
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}

function CustomizedAxisTick({ x, y, payload }) {
	return (
		<g transform={`translate(${x},${y})`}>
			<text
				x={0}
				y={0}
				textAnchor="start"
				className="text-sm md:text-base"
			>
				{payload.value}
			</text>
		</g>
	);
}

export default PopularityMessage;

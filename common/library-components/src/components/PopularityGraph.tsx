import React from "react";
// import { useEffect, useState } from "react";
// import { Area, AreaChart, ResponsiveContainer } from "recharts";
// import { getPageHistory } from "../common/api";

// export function PopularityGraph({ url }) {
//     const [data, setData] = useState<any[]>();
//     useEffect(() => {
//         (async () => {
//             try {
//                 const newData = await getPageHistory(url);
//                 if (newData?.length > 0) {
//                     setData(newData);
//                 }
//             } catch {}
//         })();
//     }, []);

//     if (data == null) {
//         return <></>;
//     }

//     const publishYear = data?.[0]?.year;

//     return (
//         <div className="dark:text-lindy relative -mt-3 w-full md:-mt-0">
//             {data && (
//                 <ResponsiveContainer
//                     width="100%" // ignore padding
//                     height={100}
//                 >
//                     <AreaChart
//                         width={730}
//                         height={250}
//                         data={data}
//                         margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
//                     >
//                         <Area
//                             isAnimationActive={false}
//                             type="monotone"
//                             dataKey="traffic"
//                             stroke="currentColor"
//                             fillOpacity={1}
//                             fill="currentColor"
//                         />
//                     </AreaChart>
//                 </ResponsiveContainer>
//             )}
//             <div className="absolute left-1 bottom-0.5 font-bold text-white">
//                 {publishYear}
//             </div>
//         </div>
//     );
// }

// function CustomizedAxisTick({ x, y, payload }) {
//     return (
//         <g transform={`translate(${x},${y})`}>
//             <text
//                 x={0}
//                 y={0}
//                 textAnchor="start"
//                 className="text-sm md:text-base"
//             >
//                 {payload.value}
//             </text>
//         </g>
//     );
// }

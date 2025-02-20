import dynamic from "next/dynamic";
const GaugeComponent = dynamic(() => import('react-gauge-component'), { ssr: false });

export default function MatchScoreGauge({ score }) {
  return (
    <div className="block max-w-sm p-6 bg-gray-700 border border-gray-200 rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600">
      <h5 className="mb-2 text-2xl font-bold tracking-tight text-center text-gray-100 dark:text-white">Match Score</h5>
      <div style={{ width: '300px', margin: '0 auto' }}>
        <GaugeComponent
          value={score}
          type="radial"
          labels={{
            tickLabels: {
              type: "inner",
              ticks: [
                { value: 20 },
                { value: 40 },
                { value: 60 },
                { value: 80 },
                { value: 100 }
              ]
            }
          }}
          arc={{
            colorArray: ['#5BE12C','#EA4228'],
            subArcs: [{limit: 10}, {limit: 30}, {}, {}, {}],
            padding: 0.02,
            width: 0.3
          }}
          pointer={{
            elastic: true,
            animationDelay: 0
          }}
        />
      </div>
      <p className="mt-4 font-medium text-center text-gray-100 dark:text-gray-300">
        Your compatibility score shows how well you match based on your interests and preferences.
      </p>
    </div>
  );
}

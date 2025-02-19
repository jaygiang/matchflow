import dynamic from "next/dynamic";
const GaugeComponent = dynamic(() => import('react-gauge-component'), { ssr: false });

export default function MatchScoreGauge({ score }) {
  return (
    <div style={{ width: '300px', margin: '0 auto' }}>
      <GaugeComponent
        value={Math.round(score)}
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
          animationDelay: 5000
        }}
      />
    </div>
  );
}

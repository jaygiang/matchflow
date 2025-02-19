import dynamic from "next/dynamic";
const GaugeComponent = dynamic(() => import('react-gauge-component'), { ssr: false });


export default function MatchScoreGauge({ score }) {
  return (
    <div style={{ width: '300px', margin: '0 auto' }}>
      <GaugeComponent
        id="match-gauge"
        nrOfLevels={20}
        percent={score}
        colors={['#FF5F6D', '#FFC371', '#38ef7d']}
        textColor="#000000"
        formatTextValue={value => `${Math.round(value * 100)}% Match`}
      />
    </div>
  );
}

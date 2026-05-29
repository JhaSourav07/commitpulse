import ContributionReplay from '../../components/ContributionReplay';

export default function ReplayPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#010409',
        padding: '40px',
      }}
    >
      <ContributionReplay username="dhanya-srivastava" />
    </main>
  );
}

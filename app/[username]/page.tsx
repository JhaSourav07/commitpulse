interface Props {
  params: {
    username: string;
  };
}

export default function DashboardPage({ params }: Props) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold">
          {params.username}
        </h1>

        <p className="mt-4 text-zinc-400">
          Welcome to CommitPulse Dashboard 🚀
        </p>
      </div>
    </main>
  );
}
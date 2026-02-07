import { ConnectButton } from "@rainbow-me/rainbowkit";

function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Neobank</h1>
      <ConnectButton />
    </div>
  );
}

export default App;

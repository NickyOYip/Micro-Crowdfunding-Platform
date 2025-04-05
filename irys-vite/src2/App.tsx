import { walletStatusPage as WalletStatusPage } from "./components/walletStatusPage";
import { TestIrysActionPage } from "./components/testIrysActionPage";


function App() {
  
  return (
    <div>
      <h1>IRYS Vite</h1>
      <WalletStatusPage />
      <TestIrysActionPage />
    </div>
  );
}

export default App;
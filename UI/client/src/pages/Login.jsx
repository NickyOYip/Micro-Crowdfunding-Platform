import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <h1 className="text-white text-4xl font-bold mb-8">Welcome To Micro Crowdfunding</h1>
      <button onClick={() => navigate('/home')}
      className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Sign in with MetaMask
      </button>
    </div>
  );
};

export default Login;
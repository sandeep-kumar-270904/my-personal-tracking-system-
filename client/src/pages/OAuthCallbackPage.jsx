import { useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OAuthCallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socialLogin } = useContext(AuthContext);
  const processed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (processed.current) return;
      processed.current = true;

      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      // Some providers use state to pass the provider name back
      const state = params.get('state');
      let provider = new URLSearchParams(location.search).get('provider');
      
      if (!provider && state) {
        provider = state;
      }

      if (!code || !provider) {
        toast.error('Invalid OAuth callback parameters');
        navigate('/login');
        return;
      }

      try {
        await socialLogin(provider, code);
        navigate('/dashboard');
      } catch (error) {
        toast.error(error.response?.data?.message || `${provider} login failed`);
        navigate('/login');
      }
    };

    handleCallback();
  }, [location, navigate, socialLogin]);

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center text-slate-300">
      <Loader2 className="w-12 h-12 animate-spin text-[#F97316] mb-4" />
      <h2 className="text-xl font-medium">Authenticating...</h2>
      <p className="text-sm text-slate-500 mt-2">Please wait while we secure your connection.</p>
    </div>
  );
};

export default OAuthCallbackPage;

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, MapPin, BadgeDollarSign } from 'lucide-react';
import axios from 'axios';
import OfferComparisonView from '../components/offers/OfferComparisonView';
import EmptyState from '../components/EmptyState';

const fetchSharedOffers = async (token) => {
  const { data } = await axios.get(`http://localhost:5000/api/public/offers/${token}`);
  return data;
};

const SharedOffersPage = () => {
  const { token } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sharedOffers', token],
    queryFn: () => fetchSharedOffers(token),
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-emerald-400 font-bold animate-pulse">Loading Comparison Data...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <EmptyState 
          icon={ShieldAlert} 
          heading="Access Denied" 
          subtext="This link is invalid or has been revoked by the owner." 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <BadgeDollarSign className="w-12 h-12 text-[#00f0ff] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">{data.userName}'s Offer Comparison</h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            This is a read-only view of pending offers to help weigh compensation, cost of living, and location.
          </p>
        </header>

        {data.offers && data.offers.filter(o => o.status === 'pending_decision' || o.status === 'on_hold').length >= 2 ? (
          <OfferComparisonView offers={data.offers} isReadOnly={true} />
        ) : (
          <EmptyState 
            icon={BadgeDollarSign} 
            heading="Not Enough Pending Offers" 
            subtext="There are currently fewer than 2 pending offers to compare." 
          />
        )}
      </div>
    </div>
  );
};

export default SharedOffersPage;

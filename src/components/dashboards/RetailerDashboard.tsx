import { Link } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { ShoppingBag, Search, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RetailerDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Retailer Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.email?.split('@')[0]}</p>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Verify product authenticity and view complete supply chain provenance.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <Link to="/retailer/receive">
          <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Search className="w-5 h-5 text-purple-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Verify Batch</h3>
            <p className="text-sm text-gray-500">View complete blockchain provenance for any batch</p>
          </div>
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Role Status</h3>
          <p className="text-sm text-gray-500 mb-3">Your role in the HerbChain supply chain</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              🏪 Retailer
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Active
            </span>
          </div>
        </div>

      </div>

      {/* Info Panel */}
      <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <ShoppingBag className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-medium text-purple-900 mb-1">Your Role in the Supply Chain</h4>
            <p className="text-sm text-purple-700">
              As a Retailer, you are the final link in the HerbChain supply chain. You can verify the 
              authenticity and full provenance of any herb batch — from farm to your shelf. Connect 
              MetaMask to verify your on-chain RETAILER_ROLE status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

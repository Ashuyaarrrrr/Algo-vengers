import { Link } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { Truck, Package, ArrowRight, ShieldCheck } from 'lucide-react';

export default function DistributorDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Distributor Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.email?.split('@')[0]}</p>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Manage shipments and distribute products from manufacturers to retailers.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <Link to="/distributor/ship">
          <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Ship Batch</h3>
            <p className="text-sm text-gray-500">Record a shipment to a retailer on the blockchain</p>
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
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              🚚 Distributor
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Active
            </span>
          </div>
        </div>

      </div>

      {/* Info Panel */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Your Role in the Supply Chain</h4>
            <p className="text-sm text-blue-700">
              As a Distributor, you receive processed herb batches from manufacturers and ship them to retailers. 
              Each shipment is recorded on the blockchain for full traceability. Connect your MetaMask wallet 
              to record shipments on-chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

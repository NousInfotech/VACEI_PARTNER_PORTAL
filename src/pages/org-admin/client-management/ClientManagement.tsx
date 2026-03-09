import { useState } from "react";
import { 
  Users, 
  ChevronRight, 
  Home, 
  Building2, 
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import PageHeader from "../../common/PageHeader";
import ClientList from "./ClientList";
import CompanyList from "./CompanyList";
import EngagementList from "./EngagementList";
import { Button } from "../../../ui/Button";

type ViewState = 'clients' | 'companies' | 'engagements';

export default function ClientManagement() {
  const [view, setView] = useState<ViewState>('clients');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setView('companies');
  };

  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setView('engagements');
  };

  const navigateBack = () => {
    if (view === 'engagements') {
      setView('companies');
      setSelectedCompanyId(null);
    } else if (view === 'companies') {
      setView('clients');
      setSelectedClientId(null);
    }
  };

  const Breadcrumbs = () => (
    <nav className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-6 px-1">
      <button 
        onClick={() => { setView('clients'); setSelectedClientId(null); setSelectedCompanyId(null); }}
        className="flex items-center gap-1.5 hover:text-primary transition-colors"
      >
        <Home size={14} />
        Clients
      </button>
      
      {selectedClientId && (
        <>
          <ChevronRight size={14} className="text-gray-300" />
          <button 
            onClick={() => { setView('companies'); setSelectedCompanyId(null); }}
            className={`flex items-center gap-1.5 transition-colors ${view === 'companies' ? 'text-primary' : 'hover:text-primary'}`}
          >
            <Building2 size={14} />
            Companies
          </button>
        </>
      )}

      {selectedCompanyId && (
        <>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="flex items-center gap-1.5 text-primary">
            <ShieldCheck size={14} />
            Engagements
          </span>
        </>
      )}
    </nav>
  );

  return (
    <div className="mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader 
        title={
          view === 'clients' ? "Client Portfolio" : 
          view === 'companies' ? "Client Companies" : 
          "Company Engagements"
        } 
        subtitle={
          view === 'clients' ? "Overview of all clients associated with your organization" :
          view === 'companies' ? "Select a company to view their active services and engagements" :
          "Historical and active engagements for the selected company"
        }
        icon={view === 'clients' ? Users : view === 'companies' ? Building2 : ShieldCheck}
        actions={
          view !== 'clients' && (
            <Button 
              variant="outline" 
              onClick={navigateBack}
              className="rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 font-bold gap-2 text-white shadow-lg"
            >
              <ArrowLeft size={18} />
              Back
            </Button>
          )
        }
      />

      <Breadcrumbs />

      <div className="transition-all duration-300 ease-in-out">
        {view === 'clients' && (
          <ClientList onSelectClient={handleSelectClient} />
        )}
        
        {view === 'companies' && selectedClientId && (
          <CompanyList 
            clientId={selectedClientId} 
            onSelectCompany={handleSelectCompany} 
          />
        )}

        {view === 'engagements' && selectedCompanyId && (
          <EngagementList companyId={selectedCompanyId} />
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Phone, Calendar, Clock, Table, Wallet, HandCoins, ChevronDown, ChevronUp } from 'lucide-react';
import skattesatser from './data/skattesatser-kommuner-2025.json';
import './index.css';

interface TaxRate {
  Kommun: string;
  Församling: string;
  "Summa, inkl. kyrkoavgift": number;
  "Summa, exkl. kyrkoavgift": number;
  "Kommunal-skatt": number;
  "Landstings-skatt": number;
  "Begravnings-avgift": number;
  "Kyrkoavgift": number;
}

function App() {
  const [baseSalary, setBaseSalary] = useState(50000);
  const [income, setIncome] = useState({
    onCallDays: 0,
    onCallRate: 1000,
    appointments: 0,
    appointmentRate: 2520,
    billableHours: 1,
  });
  const [commissionRates, setCommissionRates] = useState({
    rate101: 10,
    rate120: 15,
    rate160: 20,
    rate200: 25,
  });
  const [selectedKommun, setSelectedKommun] = useState("");
  const [showCommissionRates, setShowCommissionRates] = useState(false);
  const [isChurchMember, setIsChurchMember] = useState(false);
  const [selectedFörsamling, setSelectedFörsamling] = useState("");

  const kommuner = Array.from(new Set(skattesatser.map((rate: TaxRate) => rate.Kommun)));
  const församlingar = selectedKommun
    ? Array.from(new Set(skattesatser
        .filter((rate: TaxRate) => rate.Kommun === selectedKommun)
        .map((rate: TaxRate) => rate.Församling)
      ))
    : [];

    const calculateCommission = (hours: number, commissionRates: { [key: string]: number }): number => {
      // No commission for 99 hours or less
      if (hours <= 99) return 0;
    
      let commission = 0;
    
      // Calculate commission incrementally
      if (hours >= 200) {
        commission += (hours - 199) * commissionRates.rate200;
        hours = 199;
      }
      if (hours >= 160) {
        commission += (hours - 159) * commissionRates.rate160;
        hours = 159;
      }
      if (hours >= 120) {
        commission += (hours - 119) * commissionRates.rate120;
        hours = 119;
      }
      if (hours >= 100) {
        commission += (hours - 99) * commissionRates.rate101;
      }
    
      return commission;
    };

  const calculateGrossSalary = () => {
    const onCallTotal = income.onCallDays * income.onCallRate;
    const appointmentsTotal = income.appointments * income.appointmentRate;
    const commissionTotal = calculateCommission(income.billableHours, commissionRates);
    return baseSalary + onCallTotal + appointmentsTotal + commissionTotal;
  };

  const currentTaxRate: TaxRate | undefined = skattesatser.find((rate: TaxRate) => {
    if (rate.Kommun !== selectedKommun) return false;
    return isChurchMember ? rate.Församling === selectedFörsamling : true;
  });

  const calculateTax = (gross: number): number => {
    if (!currentTaxRate) return 0;
    const taxPercent = isChurchMember
      ? currentTaxRate["Summa, inkl. kyrkoavgift"]
      : currentTaxRate["Summa, exkl. kyrkoavgift"];
    return gross * (taxPercent / 100);
  };

  const grossSalary = calculateGrossSalary();
  const taxAmount = calculateTax(grossSalary);
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [includeCommissionInPension, setIncludeCommissionInPension] = useState(false);

  const commissionTotal = calculateCommission(income.billableHours, commissionRates);
  const totalPension = Math.min(baseSalary + (includeCommissionInPension ? commissionTotal : 0), 50375) * 0.045 
  + (baseSalary + (includeCommissionInPension ? commissionTotal : 0) > 50375 
     ? (baseSalary + (includeCommissionInPension ? commissionTotal : 0) - 50375) * 0.30 
     : 0);

  const netSalary = grossSalary - taxAmount + expenseAmount;;
  

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <img src="https://raw.githubusercontent.com/hardrockhodl/salary/b5dd8313e15eea5473e4c805db21a9f6a9336047/src/images/conscia.svg" alt="Conscia" className="mt-2 mr-4 ml-auto block w-24"/>
        <h1 className="text-base font-bold text-[#238DD8] mt-0 mr-4 mb-2 gap-2 text-end">
          Salary Calculator
        </h1>
      <div className="pl-4 pr-4 grid gap-2 md:grid-cols-3">
        <div className="p-4 bg-[#238DD8] rounded-xl shadow-sm">
          <h2 className="text-base font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Table className="w-5 h-5 text-[#F3F4F6]" />
            Välj Kommun
          </h2>
          <select
            value={selectedKommun}
            onChange={(e) => {
              setSelectedKommun(e.target.value);
              setSelectedFörsamling("");
            }}
            className="mt-2 text-sm block w-full rounded-md bg-gray-100 border-orange-500 shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655]"
          >
            <option value="">-- Välj kommun --</option>
            {kommuner.map((kommun) => (
              <option key={kommun} value={kommun}>
                {kommun}
              </option>
            ))}
          </select>
          <div className="ml-0 mr-4 mb-0">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={isChurchMember}
                onChange={(e) => setIsChurchMember(e.target.checked)}
                className="form-checkbox mt-2 h-3 w-3 text-emerald-600"
              />
              <span className="ml-2 pt-2 text-sm text-gray-50">Medlem i Svenska kyrkan</span>
            </label>
          </div>
          {isChurchMember && selectedKommun && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-50">
                Välj Församling:
              </label>
              <select
                value={selectedFörsamling}
                onChange={(e) => setSelectedFörsamling(e.target.value)}
                className="mt-2 text-sm block w-full rounded-md bg-gray-100 shadow-sm focus:ring-blue-200"
              >
                <option value="">-- Välj församling --</option>
                {församlingar.map((församling) => (
                  <option key={församling} value={församling}>
                    {församling}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="p-4 bg-[#238DD8] rounded-xl shadow-sm">
          <h2 className="text-base font-semibold text-[#F3F4F6] mb-4 flex items-center gap-4">
            <Wallet className="w-5 h-5 text-[#F3F4F6]" />
            Grundlön
          </h2>
          <input
            type="number"
            value={baseSalary}
            onChange={(e) => setBaseSalary(Number(e.target.value))}
            className="mt-2 text-sm block w-full rounded-md border-orange-500 shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
          />
        </div>
        <div className="p-4 bg-[#238DD8] rounded-xl shadow-sm">
          <h2 className="text-base font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#F3F4F6]" />
            Debiterbara timmar
          </h2>
          <input
            type="number"
            value={income.billableHours}
            onChange={(e) =>
              setIncome({ ...income, billableHours: Number(e.target.value) })
            }
            placeholder="Ange timmar..."
            className="mt-2 text-sm block w-full rounded-md shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
          />
          <button
            onClick={() => setShowCommissionRates(!showCommissionRates)}
            className="mt-2 flex items-center gap-1 text-sm text-[#F3F4F6] font-medium transition-all duration-200 ease-in-out hover:text-[#1C1C1E] hover:underline-animation"
          >
            {showCommissionRates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showCommissionRates ? 'Hide' : 'Edit'} Provision Rates
          </button>
          {showCommissionRates && (
            <div className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-50">101-119h:</label>
                  <input
                    type="number"
                    value={commissionRates.rate101}
                    onChange={(e) =>
                      setCommissionRates({ ...commissionRates, rate101: Number(e.target.value) })
                    }
                    className="text-sm block w-1/6 rounded-md shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-50">120-159h:</label>
                  <input
                    type="number"
                    value={commissionRates.rate120}
                    onChange={(e) =>
                      setCommissionRates({ ...commissionRates, rate120: Number(e.target.value) })
                    }
                    className="text-sm block w-1/6 rounded-md shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-50">160-199h:</label>
                  <input
                    type="number"
                    value={commissionRates.rate160}
                    onChange={(e) =>
                      setCommissionRates({ ...commissionRates, rate160: Number(e.target.value) })
                    }
                    className="text-sm block w-1/6 rounded-md shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-right text-sm text-gray-50">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;200h+:</label>
                  <input
                    type="number"
                    value={commissionRates.rate200}
                    onChange={(e) =>
                      setCommissionRates({ ...commissionRates, rate200: Number(e.target.value) })
                    }
                    className="text-sm block w-1/6 rounded-md shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>


        {/* <div className="p-4 bg-[#238DD8] rounded-xl shadow-sm">
          <h2 className="text-base font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#F3F4F6]" />
            Debiterbara timmar
          </h2>
          <input
            type="number"
            value={income.billableHours}
            onChange={(e) =>
              setIncome({ ...income, billableHours: Number(e.target.value) })
            }
            placeholder="Ange timmar..."
            className="mt-2 text-sm  block w-full rounded-md shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
          />
        </div> */}
        
        
        
        <div className="p-4 bg-[#238DD8] rounded-xl shadow-sm">
          <h2 className="text-base font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#F3F4F6]" />
            Beredskap
          </h2>
          <input
            type="number"
            placeholder="Antal dagar"
            value={income.onCallDays}
            onChange={(e) =>
              setIncome({ ...income, onCallDays: Number(e.target.value) })
            }
            className="mt-2 text-sm block w-full rounded-md border-orange-500 shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
          />
          <input
            type="number"
            placeholder="Dagsersättning (SEK)"
            value={income.onCallRate}
            onChange={(e) =>
              setIncome({ ...income, onCallRate: Number(e.target.value) })
            }
            className="mt-2 block w-full rounded-md border-orange-500 shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
          />
        </div>
        <div className="p-4 bg-[#238DD8] rounded-xl shadow-sm">
          <h2 className="text-base font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#F3F4F6]" />
            On Call Service
          </h2>
          <input
            type="number"
            placeholder="Antal tjänster"
            value={income.appointments}
            onChange={(e) =>
              setIncome({ ...income, appointments: Number(e.target.value) })
            }
            className="mt-2 text-sm block w-full rounded-md border-orange-500 shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
          />
          <input
            type="number"
            placeholder="Pris per tjänst (SEK)"
            value={income.appointmentRate}
            onChange={(e) =>
              setIncome({ ...income, appointmentRate: Number(e.target.value) })
            }
            className="mt-2 text-sm block w-full rounded-md border-orange-500 shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
          />
        </div>
        <div className="p-4 bg-[#238DD8] rounded-xl shadow-sm">
          <h2 className="text-base font-semibold text-[#F3F4F6] mb-2 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-[#F3F4F6]" />
            Utlägg
          </h2>
          <input
            type="number"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(Number(e.target.value))}
            placeholder="Ange utlägg..."
            className="mt-2 text-sm block w-full rounded-md shadow-sm outline-none focus-within:outline-3 focus-within:outline-[#FF9655] font-mono"
          />
        </div>
      </div>



      <div className="mt-2 ml-4 mr-4 grid grid-cols-1 md:grid-cols-3 gap-2">
      {/* Pension Section */}
      <div className="bg-[#033258] p-4 rounded-lg shadow-lg flex flex-col">
        {/* Pension Info */}
        <div className="flex-grow space-y-1">
          <h2 className="text-lg font-bold text-gray-50 mb-4">Pension</h2>
          <div className="flex text-sm justify-between">
            <span className="text-gray-200">Tjänstepension (4.5%):</span>
            <span className="font-mono text-gray-200">{formatCurrency(
              Math.min(baseSalary, 50375) * 0.045
            )}</span>
          </div>
          <div className="flex text-sm justify-between">
            <span className="text-gray-200">Tjänstepension (30%):</span>
            <span className="font-mono text-gray-200">{formatCurrency(
              baseSalary > 50375 ? (baseSalary - 50375) * 0.30 : 0
            )}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span className="text-gray-50">Totalt:</span>
            <span className="font-mono text-emerald-400">{formatCurrency(
              Math.min(baseSalary, 50375) * 0.045 + (baseSalary > 50375 ? (baseSalary - 50375) * 0.30 : 0)
            )}</span>
          </div>

          {/* Provision Pension Section */}
          {includeCommissionInPension && (
            <div className="flex text-sm justify-between">
              <span className="text-gray-200">inkl Provision:</span>
              <span className="font-mono text-base font-semibold text-emerald-400">{formatCurrency(totalPension)}</span>
            </div>
          )}
        </div>

        {/* Kryssruta längst ned */}
        <div className="mt-0">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={includeCommissionInPension}
              onChange={(e) => setIncludeCommissionInPension(e.target.checked)}
              className="form-checkbox h-4 w-4 text-emerald-600"
            />
            <span className="ml-2 text-sm  text-gray-600">Räkna provision som pensionsgrundande</span>
          </label>
        </div>
      </div>

      {/* Tax Information */}
      <div className="bg-[#033258] p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold text-gray-50 mb-2">Skatteinformation</h2>
        {currentTaxRate ? (
          <div className="space-y-1">
            <div className="flex text-sm justify-between">
              <span className="text-gray-200">Kommunal skatt:</span>
              <span className="font-mono text-gray-200">{currentTaxRate["Kommunal-skatt"]}%</span>
            </div>
            <div className="flex text-sm justify-between">
              <span className="text-gray-200">Landstingsskatt:</span>
              <span className="font-mono text-gray-200">{currentTaxRate["Landstings-skatt"]}%</span>
            </div>
            <div className="flex text-sm justify-between">
              <span className="text-gray-200">Begravningsavgift:</span>
              <span className="font-mono text-gray-200">{currentTaxRate["Begravnings-avgift"]}%</span>
            </div>
            {isChurchMember && (
              <div className="flex text-sm justify-between">
                <span className="text-gray-200">Kyrkoavgift:</span>
                <span className="font-mono text-gray-200">{currentTaxRate["Kyrkoavgift"]}%</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span className="text-gray-200">Skatt:</span>
              <span className="font-mono text-red-500">- 
                {formatCurrency(
                  grossSalary * (isChurchMember
                    ? currentTaxRate["Summa, inkl. kyrkoavgift"] / 100
                    : currentTaxRate["Summa, exkl. kyrkoavgift"] / 100)
                )}
              </span>
            </div>
          </div>
        ) : (
          <p className="font-mono text-amber-500">Ingen kommun vald</p>
        )}
      </div>
      {/* Summering Section */}
      <div className="bg-[#033258] p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold text-gray-50 mb-2">Summering</h2>
        <div className="space-y-1">
          <div className="flex text-sm justify-between">
            <span className="text-gray-200">Grundlön:</span>
            <span className="font-mono text-gray-200">{formatCurrency(baseSalary)}</span>
          </div>
          <div className="flex text-sm justify-between">
            <span className="text-gray-200">Beredskap:</span>
            <span className="font-mono text-gray-200">{formatCurrency(income.onCallDays * income.onCallRate)}</span>
          </div>
          <div className="flex text-sm justify-between">
            <span className="text-gray-200">On Call Service:</span>
            <span className="font-mono text-gray-200">{formatCurrency(income.appointments * income.appointmentRate)}</span>
          </div>
          <div className="flex text-sm justify-between">
            <span className="text-gray-200">Provision:</span>
            <span className="font-mono text-gray-200">{formatCurrency(
              income.billableHours > 99 ? calculateCommission(income.billableHours, commissionRates) : 0
            )}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span className="text-gray-200">Bruttolön:</span>
            <span className="font-mono text-gray-200">{formatCurrency(grossSalary)}</span>
          </div>
          <div className="flex text-sm justify-between">
            <span className="text-gray-200">Skatt:</span>
            <span className="font-mono text-red-500">-{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex text-sm justify-between">
            <span className="text-gray-200">Utlägg:</span>
            <span className="font-mono text-gray-200">{formatCurrency(expenseAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span className="text-emerald-400">Nettolön:</span>
            <span className="font-mono text-emerald-400">{formatCurrency(netSalary)}</span>
          </div>
        </div>
      </div>

    </div>

    </>
  );
}

export default App;

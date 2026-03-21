import React, { useState } from "react";
import VehicleMasterList from "./vehicle/VehicleMasterList";
import DriverMasterList from "./driver/DriverMasterList";
import DriverLedger from "./driver/DriverLedger";
import OtherTransactionsList from "./other/OtherTransactionsList"; // to be created

const ReportsManager = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [selectedDriver, setSelectedDriver] = useState(null);

  if (selectedDriver) {
    return (
      <DriverLedger
        driverId={selectedDriver._id}
        driverName={selectedDriver.name}
        onBack={() => setSelectedDriver(null)}
        showNotification={showNotification}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button onClick={() => setActiveTab("vehicles")}
          className={`px-4 py-2 font-black text-xs uppercase tracking-wider transition-colors ${activeTab === "vehicles" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
          Vehicles
        </button>
        <button onClick={() => setActiveTab("drivers")}
          className={`px-4 py-2 font-black text-xs uppercase tracking-wider transition-colors ${activeTab === "drivers" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
          Drivers
        </button>
        <button onClick={() => setActiveTab("other")}
          className={`px-4 py-2 font-black text-xs uppercase tracking-wider transition-colors ${activeTab === "other" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
          Cash Book
        </button>
      </div>

      {activeTab === "vehicles" && <VehicleMasterList showNotification={showNotification} onSelectVehicle={() => {}} />}
      {activeTab === "drivers" && <DriverMasterList showNotification={showNotification} onSelectDriver={setSelectedDriver} />}
      {activeTab === "other" && <OtherTransactionsList showNotification={showNotification} />}
    </div>
  );
};

export default ReportsManager;
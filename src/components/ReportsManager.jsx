import React, { useState } from "react";
import VehicleMasterList from "./vehicle/VehicleMasterList";
import DriverMasterList from "./driver/DriverMasterList";
import DriverLedger from "./driver/DriverLedger";

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
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("vehicles")}
          className={`px-4 py-2 rounded-t-lg font-black text-xs uppercase tracking-wider transition-colors ${activeTab === "vehicles" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
        >
          Vehicles
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`px-4 py-2 rounded-t-lg font-black text-xs uppercase tracking-wider transition-colors ${activeTab === "drivers" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
        >
          Drivers
        </button>
      </div>

      {activeTab === "vehicles" && <VehicleMasterList showNotification={showNotification} onSelectVehicle={() => {}} />}
      {activeTab === "drivers" && <DriverMasterList showNotification={showNotification} onSelectDriver={setSelectedDriver} />}
    </div>
  );
};

export default ReportsManager;
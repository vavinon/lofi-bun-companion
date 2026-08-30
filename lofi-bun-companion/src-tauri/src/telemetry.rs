//! Telemetry Module
//!
//! Provides zero-overhead, non-blocking hardware metrics sampling for Windows.
//! Utilizes the `sysinfo` crate to query CPU utilization, RAM consumption,
//! and disk storage/activity counters.

use serde::{Deserialize, Serialize};
use sysinfo::{Disks, System};

/// Data contract payload passed across the Tauri IPC bridge to the frontend.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareMetricsPayload {
    /// Total CPU load percentage across all physical and logical cores (0 - 100%).
    pub cpu_usage: f64,
    /// Physical RAM utilization percentage (0 - 100%).
    pub ram_usage: f64,
    /// Disk utilization / space used percentage across mounted volumes (0 - 100%).
    pub disk_usage: f64,
}

impl Default for HardwareMetricsPayload {
    fn default() -> Self {
        Self {
            cpu_usage: 15.0,
            ram_usage: 45.0,
            disk_usage: 5.0,
        }
    }
}

/// Hardware telemetry sampler maintaining persistent OS handle buffers.
pub struct HardwareSampler {
    system: System,
    disks: Disks,
}

impl HardwareSampler {
    /// Initializes a new hardware sampler with refreshed baseline metrics.
    pub fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();

        let disks = Disks::new_with_refreshed_list();

        Self { system, disks }
    }

    /// Samples current real-time hardware metrics without blocking the main event loop.
    pub fn sample(&mut self) -> HardwareMetricsPayload {
        // 1. Refresh CPU utilization
        self.system.refresh_cpu_usage();
        let raw_cpu = self.system.global_cpu_info().cpu_usage() as f64;
        let cpu_usage = raw_cpu.clamp(0.0, 100.0);

        // 2. Refresh Memory utilization
        self.system.refresh_memory();
        let total_memory = self.system.total_memory() as f64;
        let used_memory = self.system.used_memory() as f64;
        let ram_usage = if total_memory > 0.0 {
            ((used_memory / total_memory) * 100.0).clamp(0.0, 100.0)
        } else {
            0.0
        };

        // 3. Refresh Disk activity / utilization
        self.disks.refresh();
        let (total_disk_space, available_disk_space) = self.disks.iter().fold(
            (0u64, 0u64),
            |(acc_total, acc_avail), disk| {
                (
                    acc_total.saturating_add(disk.total_space()),
                    acc_avail.saturating_add(disk.available_space()),
                )
            },
        );

        let disk_usage = if total_disk_space > 0 {
            let used_disk = total_disk_space.saturating_sub(available_disk_space) as f64;
            ((used_disk / total_disk_space as f64) * 100.0).clamp(0.0, 100.0)
        } else {
            5.0
        };

        HardwareMetricsPayload {
            cpu_usage: (cpu_usage * 10.0).round() / 10.0,
            ram_usage: (ram_usage * 10.0).round() / 10.0,
            disk_usage: (disk_usage * 10.0).round() / 10.0,
        }
    }
}

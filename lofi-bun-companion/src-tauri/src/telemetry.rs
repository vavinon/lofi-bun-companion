//! Telemetry Module
//!
//! Provides zero-overhead, non-blocking hardware metrics sampling for Windows.
//! Utilizes the `sysinfo` crate to query CPU utilization, RAM consumption,
//! and real-time Disk I/O read/write activity counters.

use serde::{Deserialize, Serialize};
use std::time::Instant;
use sysinfo::{ProcessRefreshKind, System};

/// Nominal disk throughput saturation threshold in Megabytes per second (MB/s).
/// 50 MB/s sustained delta across system processes maps to 100.0% disk I/O activity.
const DISK_IO_SATURATION_MB_PER_SEC: f64 = 50.0;

/// Data contract payload passed across the Tauri IPC bridge to the frontend.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareMetricsPayload {
    /// Total CPU load percentage across all physical and logical cores (0 - 100%).
    pub cpu_usage: f64,
    /// Physical RAM utilization percentage (0 - 100%).
    pub ram_usage: f64,
    /// Dynamic Disk I/O activity percentage based on read/write throughput (0 - 100%).
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
    last_sample_instant: Instant,
}

impl HardwareSampler {
    /// Initializes a new hardware sampler with refreshed baseline metrics.
    pub fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();

        Self {
            system,
            last_sample_instant: Instant::now(),
        }
    }

    /// Samples current real-time hardware metrics without blocking the main event loop.
    pub fn sample(&mut self) -> HardwareMetricsPayload {
        let now = Instant::now();
        let elapsed_secs = (now - self.last_sample_instant).as_secs_f64().max(0.1);
        self.last_sample_instant = now;

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

        // 3. Refresh Process Disk I/O activity (Delta read/write bytes since previous refresh)
        self.system.refresh_processes_specifics(
            ProcessRefreshKind::new().with_disk_usage(),
        );

        let total_io_bytes: u64 = self
            .system
            .processes()
            .values()
            .map(|process| {
                let du = process.disk_usage();
                du.read_bytes.saturating_add(du.written_bytes)
            })
            .sum();

        // Calculate throughput in MB/s
        let throughput_mb_s = (total_io_bytes as f64 / elapsed_secs) / (1024.0 * 1024.0);

        // Map MB/s to percentage (0 - 100%) against nominal saturation ceiling
        let disk_usage = ((throughput_mb_s / DISK_IO_SATURATION_MB_PER_SEC) * 100.0).clamp(0.0, 100.0);

        HardwareMetricsPayload {
            cpu_usage: (cpu_usage * 10.0).round() / 10.0,
            ram_usage: (ram_usage * 10.0).round() / 10.0,
            disk_usage: (disk_usage * 10.0).round() / 10.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_payload() {
        let payload = HardwareMetricsPayload::default();
        assert_eq!(payload.cpu_usage, 15.0);
        assert_eq!(payload.ram_usage, 45.0);
        assert_eq!(payload.disk_usage, 5.0);
    }

    #[test]
    fn test_sampler_produces_bounded_metrics() {
        let mut sampler = HardwareSampler::new();
        let payload = sampler.sample();

        assert!(payload.cpu_usage >= 0.0 && payload.cpu_usage <= 100.0);
        assert!(payload.ram_usage >= 0.0 && payload.ram_usage <= 100.0);
        assert!(payload.disk_usage >= 0.0 && payload.disk_usage <= 100.0);
    }

    #[test]
    fn test_payload_serialization_camel_case() {
        let payload = HardwareMetricsPayload {
            cpu_usage: 12.3,
            ram_usage: 45.6,
            disk_usage: 78.9,
        };
        let json = serde_json::to_string(&payload).expect("Failed to serialize");
        assert!(json.contains("\"cpuUsage\":12.3"));
        assert!(json.contains("\"ramUsage\":45.6"));
        assert!(json.contains("\"diskUsage\":78.9"));
    }
}


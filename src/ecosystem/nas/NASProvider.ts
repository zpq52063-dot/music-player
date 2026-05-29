/**
 * Phase 12 — NASProvider (预留)
 *
 * NAS (Network Attached Storage) 本地网络存储Provider。
 * 支持 SMB/CIFS / NFS 协议（通过服务端代理）。
 * 当前阶段: 接口与数据结构定义，不实现真实连接逻辑。
 *
 * 未来实现方向:
 * - 通过 Next.js API Route 代理 SMB/NFS 访问
 * - 自动发现局域网内 NAS 设备 (mDNS/Bonjour)
 * - 支持 SMB 共享文件夹直接索引
 * - 流式播放 NAS 上的音频文件
 */

import type { RemoteStorageConfig, RemoteStorageStatus, RemoteFileEntry } from "@/types/phase12";

export interface NASDevice {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: "smb" | "nfs" | "ftp";
  shareName: string;
  config: RemoteStorageConfig;
  status: RemoteStorageStatus;
  discoveredAt: number;
}

export class NASProvider {
  private static instance: NASProvider;
  private devices: Map<string, NASDevice> = new Map();

  static getInstance(): NASProvider {
    if (!NASProvider.instance) {
      NASProvider.instance = new NASProvider();
    }
    return NASProvider.instance;
  }

  registerDevice(device: Omit<NASDevice, "id" | "discoveredAt" | "status">): string {
    const id = `nas-${Date.now()}`;
    this.devices.set(id, {
      ...device,
      id,
      discoveredAt: Date.now(),
      status: {
        connected: false,
        lastConnectedAt: null,
        latencyMs: 0,
        availableSpace: 0,
      },
    });
    return id;
  }

  removeDevice(id: string): boolean {
    return this.devices.delete(id);
  }

  getDevice(id: string): NASDevice | undefined {
    return this.devices.get(id);
  }

  listDevices(): NASDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * 发现局域网内 NAS 设备 (预留)
   * 未来: mDNS/Bonjour/SSDP 发现
   */
  async discoverDevices(): Promise<NASDevice[]> {
    // 预留: 网络发现协议实现
    return [];
  }

  /**
   * 列出 NAS 共享目录 (预留)
   * 未来: 通过 API Route 代理 SMB 协议
   */
  async listDirectory(_deviceId: string, _path: string): Promise<RemoteFileEntry[]> {
    // 预留: SMB/NFS 目录列举
    return [];
  }

  /**
   * 获取 NAS 音频文件播放URL (预留)
   * 未来: 代理流式传输
   */
  getStreamUrl(_deviceId: string, _filePath: string): string | null {
    // 预留: 构建代理URL /api/music/nas/stream?device=X&path=Y
    return null;
  }

  getStatus(): { devices: number; connected: number } {
    const all = Array.from(this.devices.values());
    return {
      devices: all.length,
      connected: all.filter((d) => d.status.connected).length,
    };
  }
}

export function getNASProvider(): NASProvider {
  return NASProvider.getInstance();
}

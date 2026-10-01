import { ForbiddenException } from '@nestjs/common';
import { BranchAccessService } from './branch-access.service';
import { TenantContextService } from './tenant-context.service';
import { BackupService } from '../../backup/backup.service';
import { UpdateService } from '../../system/update.service';

describe('Phase 0A Security Hardening Unit Test Suite', () => {
  describe('BranchAccessService', () => {
    let service: BranchAccessService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        branch: {
          findFirst: jest.fn(),
        },
        user: {
          findUnique: jest.fn(),
        },
        userBranch: {
          findUnique: jest.fn(),
        },
      };
      service = new BranchAccessService(mockPrisma);
    });

    it('should throw ForbiddenException if branch does not belong to restaurant', async () => {
      mockPrisma.branch.findFirst.mockResolvedValue(null);

      await expect(
        service.assertAccess('rest-1', 'branch-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow access if user is OWNER regardless of UserBranch', async () => {
      mockPrisma.branch.findFirst.mockResolvedValue({ id: 'branch-1' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-owner',
        restaurantId: 'rest-1',
        role: { name: 'OWNER' },
      });

      await expect(
        service.assertAccess('rest-1', 'branch-1', 'user-owner'),
      ).resolves.toBeUndefined();
    });

    it('should block non-owner staff if UserBranch assignment is missing', async () => {
      mockPrisma.branch.findFirst.mockResolvedValue({ id: 'branch-1' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-staff',
        restaurantId: 'rest-1',
        role: { name: 'CASHIER' },
      });
      mockPrisma.userBranch.findUnique.mockResolvedValue(null);

      await expect(
        service.assertAccess('rest-1', 'branch-1', 'user-staff'),
      ).rejects.toThrow('Staff member is not assigned to this branch');
    });

    it('should allow non-owner staff if UserBranch assignment exists', async () => {
      mockPrisma.branch.findFirst.mockResolvedValue({ id: 'branch-1' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-staff',
        restaurantId: 'rest-1',
        role: { name: 'CASHIER' },
      });
      mockPrisma.userBranch.findUnique.mockResolvedValue({
        userId: 'user-staff',
        branchId: 'branch-1',
      });

      await expect(
        service.assertAccess('rest-1', 'branch-1', 'user-staff'),
      ).resolves.toBeUndefined();
    });
  });

  describe('BackupService Restore Execution Purge', () => {
    it('should reject restore calls with ForbiddenException', async () => {
      const mockService = new BackupService(null as any, null as any, null as any);
      await expect(
        mockService.restore({ id: 'owner' } as any, 'backup-1', { confirm: 'RESTORE' } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('UpdateService Host Docker Execution Purge', () => {
    it('should reject applyUpdate calls with ForbiddenException', async () => {
      const mockService = new UpdateService();
      await expect(mockService.applyUpdate()).rejects.toThrow(ForbiddenException);
    });
  });

  describe('TenantContextService', () => {
    it('should execute task function in isolated tenant context', async () => {
      const mockPrisma = {
        restaurant: {
          findUnique: jest.fn().mockResolvedValue({ id: 'rest-1', name: 'Bistro 1' }),
        },
      };
      const tenantContextService = new TenantContextService(mockPrisma as any);

      const taskFn = jest.fn().mockImplementation(async (ctx) => ctx.name);
      const result = await tenantContextService.runInTenantContext('rest-1', taskFn);

      expect(result).toBe('Bistro 1');
      expect(taskFn).toHaveBeenCalledWith({ restaurantId: 'rest-1', name: 'Bistro 1' });
    });
  });
});

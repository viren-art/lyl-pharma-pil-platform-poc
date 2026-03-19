import { prisma } from '../database/prisma.client';

export interface CreateAuditLogRequest {
  userId: number;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: any;
  ipAddress?: string;
}

/**
 * Create audit log entry
 */
export const createAuditLog = async (request: CreateAuditLogRequest): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      userId: request.userId,
      action: request.action,
      entityType: request.entityType,
      entityId: request.entityId,
      details: request.details,
      ipAddress: request.ipAddress,
      timestamp: new Date()
    }
  });
};
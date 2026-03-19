/**
 * Audit Service
 * Mock implementation for audit logging
 * In production, this would write to database
 */

const auditLogs = [];

export const createAuditLog = async (params) => {
  const log = {
    id: auditLogs.length + 1,
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    ipAddress: params.ipAddress,
    timestamp: new Date().toISOString(),
  };

  auditLogs.push(log);
  console.log('[AUDIT]', log);

  return log;
};

export const getAuditLogs = async (filters = {}) => {
  let filtered = [...auditLogs];

  if (filters.userId) {
    filtered = filtered.filter((log) => log.userId === filters.userId);
  }

  if (filters.action) {
    filtered = filtered.filter((log) => log.action === filters.action);
  }

  if (filters.entityType) {
    filtered = filtered.filter((log) => log.entityType === filters.entityType);
  }

  return filtered;
};
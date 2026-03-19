/**
 * AW Review Service
 * Handles Adverse Warning review workflows
 */

export const startAwReviewWorkflow = async (params) => {
  // Mock implementation
  return {
    workflowId: params.workflowId,
    status: 'started',
  };
};

export const getAwReviewStatus = (service) => {
  // Mock implementation
  return {
    state: 'processing',
    progress: {
      currentStep: 'Analyzing adverse warnings',
      percentComplete: 50,
    },
  };
};

export const getAwReviewResults = (context) => {
  // Mock implementation
  return {
    findings: [],
    recommendations: [],
  };
};
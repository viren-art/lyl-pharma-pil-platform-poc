/**
 * JSON Schema for market configuration validation
 */
export const marketConfigSchema = {
  type: 'object',
  required: [
    'name',
    'regulatoryAuthority',
    'language',
    'script',
    'requiredSections',
    'sectionOrdering',
    'extractionProviderPreference'
  ],
  properties: {
    name: {
      type: 'string',
      minLength: 2,
      maxLength: 100,
      description: 'Market name (e.g., "Taiwan", "Thailand")'
    },
    regulatoryAuthority: {
      type: 'string',
      minLength: 2,
      maxLength: 100,
      description: 'Regulatory authority name (e.g., "TFDA", "Thai FDA")'
    },
    language: {
      type: 'string',
      pattern: '^[a-z]{2}(-[A-Z]{2})?$',
      description: 'Language code (e.g., "zh-TW", "th", "vi", "ko")'
    },
    script: {
      type: 'string',
      minLength: 2,
      maxLength: 50,
      description: 'Script name (e.g., "Traditional Chinese", "Thai", "Vietnamese", "Korean")'
    },
    requiredSections: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1
      },
      description: 'Array of required PIL section names'
    },
    sectionOrdering: {
      type: 'object',
      description: 'Section name to order number mapping',
      patternProperties: {
        '^.+$': {
          type: 'integer',
          minimum: 1
        }
      }
    },
    extractionProviderPreference: {
      type: 'string',
      enum: ['GoogleDocAI', 'ClaudeVision'],
      description: 'Preferred extraction provider for this market'
    },
    formattingRules: {
      type: 'object',
      properties: {
        dateFormat: {
          type: 'string',
          description: 'Date format pattern (e.g., "DD/MM/YYYY")'
        },
        measurementUnits: {
          type: 'string',
          enum: ['metric', 'imperial'],
          description: 'Measurement unit system'
        },
        emergencyContacts: {
          type: 'string',
          description: 'Emergency contact information format'
        },
        mandatoryDisclaimers: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Required disclaimer texts'
        }
      }
    }
  }
};

/**
 * Validate market configuration against JSON Schema
 * Uses Ajv for proper JSON Schema validation
 */
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(marketConfigSchema);

export const validateMarketConfig = (config) => {
  const valid = validate(config);
  
  if (!valid) {
    const errors = validate.errors.map(err => {
      const field = err.instancePath.replace('/', '') || err.params.missingProperty;
      return `${field}: ${err.message}`;
    });
    return { valid: false, errors };
  }

  // Additional business logic validation
  const businessErrors = [];

  // Check for duplicate order numbers in sectionOrdering
  const orderValues = Object.values(config.sectionOrdering);
  const uniqueOrders = new Set(orderValues);
  if (uniqueOrders.size !== orderValues.length) {
    businessErrors.push('Section ordering values must be unique');
  }

  // Check that all required sections have ordering
  const missingSections = config.requiredSections.filter(s => !(s in config.sectionOrdering));
  if (missingSections.length > 0) {
    businessErrors.push(`Missing section ordering for: ${missingSections.join(', ')}`);
  }

  // Check that all ordering keys exist in required sections
  const extraSections = Object.keys(config.sectionOrdering).filter(s => !config.requiredSections.includes(s));
  if (extraSections.length > 0) {
    businessErrors.push(`Section ordering contains sections not in required sections: ${extraSections.join(', ')}`);
  }

  if (businessErrors.length > 0) {
    return { valid: false, errors: businessErrors };
  }

  return { valid: true, errors: [] };
};
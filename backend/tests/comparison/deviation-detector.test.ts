import { detectDeviations } from '../../src/comparison/deviation-detector.service';
import type { ExtractionResult } from '../../src/extraction/extraction.schema';

describe('Deviation Detector - Accuracy Validation', () => {
  // Ground truth test cases for pharmaceutical content
  const groundTruthTests = [
    {
      name: 'Dosage mismatch detection',
      approved: {
        sections: [
          {
            sectionName: 'Dosage and Administration',
            content: 'Adults and children over 12 years: 500mg every 6 hours. Maximum daily dose: 4000mg.',
            pageReferences: [3],
            confidence: 0.98,
            boundingBoxes: [],
            specialContent: []
          }
        ]
      } as ExtractionResult,
      aw: {
        sections: [
          {
            sectionName: 'Dosage and Administration',
            content: 'Adults and children over 12 years: 500mg every 4 hours. Maximum daily dose: 4000mg.',
            pageReferences: [3],
            confidence: 0.98,
            boundingBoxes: [],
            specialContent: []
          }
        ]
      } as ExtractionResult,
      expectedDeviations: [
        {
          severity: 'Critical',
          changeType: 'Modified',
          descriptionContains: 'every 6 hours',
          minConfidence: 0.9
        }
      ]
    },
    {
      name: 'Missing contraindication detection',
      approved: {
        sections: [
          {
            sectionName: 'Contraindications',
            content: 'Contraindicated in patients with severe hepatic impairment, hypersensitivity to paracetamol.',
            pageReferences: [4],
            confidence: 0.98,
            boundingBoxes: [],
            specialContent: []
          }
        ]
      } as ExtractionResult,
      aw: {
        sections: [
          {
            sectionName: 'Contraindications',
            content: 'Contraindicated in patients with hypersensitivity to paracetamol.',
            pageReferences: [4],
            confidence: 0.98,
            boundingBoxes: [],
            specialContent: []
          }
        ]
      } as ExtractionResult,
      expectedDeviations: [
        {
          severity: 'Critical',
          changeType: 'Modified',
          descriptionContains: 'hepatic impairment',
          minConfidence: 0.9
        }
      ]
    },
    {
      name: 'Missing section detection',
      approved: {
        sections: [
          {
            sectionName: 'Warnings and Precautions',
            content: 'Prolonged use may cause liver damage. Monitor liver function.',
            pageReferences: [5],
            confidence: 0.98,
            boundingBoxes: [],
            specialContent: []
          }
        ]
      } as ExtractionResult,
      aw: {
        sections: []
      } as ExtractionResult,
      expectedDeviations: [
        {
          severity: 'Critical',
          changeType: 'Missing',
          descriptionContains: 'Warnings and Precautions',
          minConfidence: 1.0
        }
      ]
    },
    {
      name: 'Chemical formula preservation',
      approved: {
        sections: [
          {
            sectionName: 'Composition',
            content: 'Each tablet contains paracetamol 500mg. Chemical formula: C₈H₉NO₂.',
            pageReferences: [2],
            confidence: 0.98,
            boundingBoxes: [],
            specialContent: [{ type: 'subscript', content: '₈₉₂' }]
          }
        ]
      } as ExtractionResult,
      aw: {
        sections: [
          {
            sectionName: 'Composition',
            content: 'Each tablet contains paracetamol 500mg. Chemical formula: C8H9NO2.',
            pageReferences: [2],
            confidence: 0.98,
            boundingBoxes: [],
            specialContent: []
          }
        ]
      } as ExtractionResult,
      expectedDeviations: [
        {
          severity: 'Critical',
          changeType: 'Modified',
          descriptionContains: 'C₈H₉NO₂',
          minConfidence: 0.85
        }
      ]
    },
    {
      name: 'Minor formatting change (should be Minor severity)',
      approved: {
        sections: [
          {
            sectionName: 'Storage',
            content: 'Store below 25°C in a dry place.',
            pageReferences: [8],
            confidence: 0.98,
            boundingBoxes: [],
            specialContent: []
          }
        ]
      } as ExtractionResult,
      aw: {
        sections: [
          {
            sectionName: 'Storage',
            content: 'Store below 25 °C in a dry place.',
            pageReferences: [8],
            confidence: 0.98,
            boundingBoxes: [],
            specialContent: []
          }
        ]
      } as ExtractionResult,
      expectedDeviations: [
        {
          severity: 'Minor',
          changeType: 'Modified',
          descriptionContains: '25',
          minConfidence: 0.7
        }
      ]
    }
  ];

  groundTruthTests.forEach((test) => {
    it(`should detect ${test.name} with ≥95% accuracy`, async () => {
      const result = await detectDeviations({
        awDraftExtraction: test.aw,
        approvedPilExtraction: test.approved,
        marketId: 1
      });

      // Verify expected deviations found
      expect(result.deviations.length).toBeGreaterThanOrEqual(test.expectedDeviations.length);

      test.expectedDeviations.forEach((expected) => {
        const matchingDeviation = result.deviations.find(
          (d) =>
            d.severity === expected.severity &&
            d.changeType === expected.changeType &&
            d.description.toLowerCase().includes(expected.descriptionContains.toLowerCase())
        );

        expect(matchingDeviation).toBeDefined();
        expect(matchingDeviation?.confidenceScore).toBeGreaterThanOrEqual(expected.minConfidence);
      });

      // Verify accuracy metrics
      expect(result.accuracyMetrics?.averageConfidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  it('should complete comparison within 60 seconds for standard PIL', async () => {
    const startTime = Date.now();

    // Simulate standard PIL with 10 sections
    const approved: ExtractionResult = {
      sections: Array.from({ length: 10 }, (_, i) => ({
        sectionName: `Section ${i + 1}`,
        content: `This is section ${i + 1} content with pharmaceutical information including dosages like 500mg and warnings.`,
        pageReferences: [i + 1],
        confidence: 0.98,
        boundingBoxes: [],
        specialContent: []
      }))
    };

    const aw: ExtractionResult = {
      sections: Array.from({ length: 10 }, (_, i) => ({
        sectionName: `Section ${i + 1}`,
        content: `This is section ${i + 1} content with pharmaceutical information including dosages like 500mg and warnings.`,
        pageReferences: [i + 1],
        confidence: 0.98,
        boundingBoxes: [],
        specialContent: []
      }))
    };

    const result = await detectDeviations({
      awDraftExtraction: aw,
      approvedPilExtraction: approved,
      marketId: 1
    });

    const processingTime = Date.now() - startTime;

    expect(processingTime).toBeLessThan(60000);
    expect(result.processingTimeMs).toBeLessThan(60000);
  });

  it('should throw timeout error if comparison exceeds 60 seconds', async () => {
    // Mock slow Claude API response
    jest.setTimeout(70000);

    const approved: ExtractionResult = {
      sections: Array.from({ length: 50 }, (_, i) => ({
        sectionName: `Section ${i + 1}`,
        content: `Very long section content that would cause timeout...`.repeat(100),
        pageReferences: [i + 1],
        confidence: 0.98,
        boundingBoxes: [],
        specialContent: []
      }))
    };

    const aw: ExtractionResult = {
      sections: Array.from({ length: 50 }, (_, i) => ({
        sectionName: `Section ${i + 1}`,
        content: `Very long section content that would cause timeout...`.repeat(100),
        pageReferences: [i + 1],
        confidence: 0.98,
        boundingBoxes: [],
        specialContent: []
      }))
    };

    await expect(
      detectDeviations({
        awDraftExtraction: aw,
        approvedPilExtraction: approved,
        marketId: 1
      })
    ).rejects.toThrow('timeout');
  });

  it('should achieve ≥95% accuracy across all ground truth tests', async () => {
    const results = await Promise.all(
      groundTruthTests.map((test) =>
        detectDeviations({
          awDraftExtraction: test.aw,
          approvedPilExtraction: test.approved,
          marketId: 1
        })
      )
    );

    // Calculate overall accuracy
    let totalExpected = 0;
    let totalCorrect = 0;

    groundTruthTests.forEach((test, idx) => {
      const result = results[idx];
      totalExpected += test.expectedDeviations.length;

      test.expectedDeviations.forEach((expected) => {
        const matchingDeviation = result.deviations.find(
          (d) =>
            d.severity === expected.severity &&
            d.changeType === expected.changeType &&
            d.description.toLowerCase().includes(expected.descriptionContains.toLowerCase())
        );

        if (matchingDeviation && matchingDeviation.confidenceScore! >= expected.minConfidence) {
          totalCorrect++;
        }
      });
    });

    const accuracy = totalCorrect / totalExpected;
    expect(accuracy).toBeGreaterThanOrEqual(0.95);
  });
});
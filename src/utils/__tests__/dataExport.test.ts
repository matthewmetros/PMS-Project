import { generateCSV, generateExcelFormat } from '../dataExport';

describe('dataExport utilities', () => {
  const sampleData = [
    { id: 1, name: 'Test 1', city: 'New York' },
    { id: 2, name: 'Test 2', city: 'Los Angeles' },
    { id: 3, name: 'Test, Comma', city: 'Chicago' }
  ];

  describe('generateCSV', () => {
    it('should generate correct CSV format', () => {
      const result = generateCSV(sampleData);
      const expected = 'id,name,city\n1,Test 1,New York\n2,Test 2,Los Angeles\n3,"Test, Comma",Chicago';
      
      expect(result).toBe(expected);
    });

    it('should handle empty data', () => {
      const result = generateCSV([]);
      expect(result).toBe('');
    });

    it('should handle null/undefined data', () => {
      expect(generateCSV(null as any)).toBe('');
      expect(generateCSV(undefined as any)).toBe('');
    });

    it('should quote strings containing commas', () => {
      const data = [{ field: 'value, with comma' }];
      const result = generateCSV(data);
      
      expect(result).toContain('"value, with comma"');
    });
  });

  describe('generateExcelFormat', () => {
    it('should generate correct tab-separated format', () => {
      const result = generateExcelFormat(sampleData);
      const expected = 'id\tname\tcity\n1\tTest 1\tNew York\n2\tTest 2\tLos Angeles\n3\tTest, Comma\tChicago';
      
      expect(result).toBe(expected);
    });

    it('should handle strings with tabs and newlines', () => {
      const data = [{ field: 'value\twith\ttab\nand\nnewline' }];
      const result = generateExcelFormat(data);
      
      expect(result).toContain('"value\twith\ttab\nand\nnewline"');
    });

    it('should escape double quotes correctly', () => {
      const data = [{ field: 'value "with" quotes' }];
      const result = generateExcelFormat(data);
      
      expect(result).toContain('"value ""with"" quotes"');
    });
  });
});